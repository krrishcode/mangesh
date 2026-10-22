import { Hono } from 'hono';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users, passwordResetTokens, revokedSessions, googleIdentities } from '../../db/schema/index.js';
import { randomBytes, createHash } from 'crypto';
import { getSignedCookie, setSignedCookie, deleteCookie } from 'hono/cookie';
import { z } from 'zod';
import { googleClientId, verifyGoogleCredential } from '../../lib/google-auth.js';
import { env } from '../../config/index.js';
import { AppError } from '../../lib/errors.js';
import { browserSessionRequest } from '../../middleware/browser-session.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../../validation/index.js';
import { hashPassword, verifyPassword, issueToken, generateResetToken, hashResetToken, verifyToken } from '../../lib/auth.js';
import { requireAuth } from '../../middleware/auth.js';
import { mailConfigured, sendPasswordReset } from '../../lib/mail.js';
import { rateLimit } from '../../middleware/rate-limit.js';

export const authModule = new Hono();
authModule.use('*', rateLimit());

authModule.get('/google/config', browserSessionRequest, async c => {
  const clientId = googleClientId();
  if (!clientId) return c.json({ success: true, data: { enabled: false } });
  const secret = randomBytes(32).toString('hex');
  await setSignedCookie(c, 'mm_google_nonce', secret, env.jwtSecret, { httpOnly: true, sameSite: 'Lax', secure: env.nodeEnv === 'production', path: '/', maxAge: 600 });
  return c.json({ success: true, data: { enabled: true, clientId, nonce: createHash('sha256').update(secret).digest('hex') } });
});
authModule.post('/google', browserSessionRequest, async c => {
  if (!googleClientId()) throw new AppError(503, 'Google sign-in is not configured yet. Please use email and password.');
  const parsed = z.object({ credential: z.string().min(20).max(16000) }).safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new AppError(400, 'Invalid Google sign-in response.');
  const secret = await getSignedCookie(c, env.jwtSecret, 'mm_google_nonce');
  if (!secret) throw new AppError(401, 'This sign-in request has expired. Refresh the page and try again.');
  const identity = await verifyGoogleCredential(parsed.data.credential, createHash('sha256').update(secret).digest('hex'));
  deleteCookie(c, 'mm_google_nonce', { path: '/' });
  const [linked] = await db.select().from(googleIdentities).where(eq(googleIdentities.subject, identity.subject)).limit(1);
  let [user] = linked ? await db.select().from(users).where(eq(users.id, linked.userId)).limit(1) : await db.select().from(users).where(eq(users.email, identity.email)).limit(1);
  if (!linked && user) {
    // Google must currently control the mailbox before password accounts can be
    // linked. Never link administrators or third-party Google email aliases.
    if (user.role !== 'customer' || !identity.authoritative) throw new AppError(409, 'An account already uses this email. Please sign in with your password.');
    const [other] = await db.select().from(googleIdentities).where(eq(googleIdentities.userId, user.id)).limit(1);
    if (other) throw new AppError(409, 'This account is connected to a different Google identity. Sign in with your password.');
    await db.insert(googleIdentities).values({ subject: identity.subject, userId: user.id });
  } else if (!linked) {
    const passwordHash = `google-only:${randomBytes(32).toString('hex')}`;
    const id = await db.transaction(async tx => {
      const [created] = await tx.insert(users).values({ email: identity.email, name: identity.name, passwordHash, role: 'customer' });
      await tx.insert(googleIdentities).values({ subject: identity.subject, userId: created.insertId });
      return created.insertId;
    });
    [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  }
  if (!user || user.role !== 'customer') throw new AppError(403, 'Please use your account password to sign in.');
  return c.json({ success: true, data: { user: publicUser(user), token: await issueToken(user) } });
});

function publicUser(user: { id: number; email: string; name: string; phone: string | null; role: 'admin' | 'customer' }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
  };
}

authModule.post('/register', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }

  const { email, password, name } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).limit(1);
  if (existing.length > 0) {
    return c.json({ success: false, error: 'An account with this email already exists' }, 409);
  }

  const passwordHash = await hashPassword(password);
  const [header] = await db.insert(users).values({ email: normalizedEmail, passwordHash, name: name.trim() });
  const [created] = await db.select().from(users).where(eq(users.id, header.insertId)).limit(1);

  const token = await issueToken(created);
  return c.json({ success: true, data: { user: publicUser(created), token }, message: 'Account created' }, 201);
});

authModule.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return c.json({ success: false, error: 'Invalid email or password' }, 401);
  }

  const token = await issueToken(user);
  return c.json({ success: true, data: { user: publicUser(user), token }, message: 'Logged in' });
});

authModule.get('/me', requireAuth, async (c) => {
  const authUser = c.get('authUser');
  const [user] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }
  return c.json({ success: true, data: { user: publicUser(user) } });
});
authModule.get('/security', requireAuth, async c => {
  const [user] = await db.select().from(users).where(eq(users.id, c.get('authUser').id)).limit(1);
  if (!user) throw new AppError(404, 'Account not found.');
  const [identity] = await db.select().from(googleIdentities).where(eq(googleIdentities.userId, user.id)).limit(1);
  return c.json({ success: true, data: { passwordEnabled: user.passwordHash.startsWith('scrypt:'), googleConnected: Boolean(identity) } });
});
authModule.post('/logout', requireAuth, async c => {
  const token = c.req.header('Authorization')!.slice(7).trim();
  const payload = await verifyToken(token);
  await db.insert(revokedSessions).values({ tokenHash: hashResetToken(token), expiresAt: new Date(payload!.exp * 1000) }).onDuplicateKeyUpdate({ set: { expiresAt: new Date(payload!.exp * 1000) } });
  return c.json({ success: true, message: 'Signed out' });
});

authModule.post('/forgot-password', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }
  if (!mailConfigured()) return c.json({ success: false, error: 'Email recovery is currently unavailable. Please contact customer care.' }, 503);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email.toLowerCase().trim()))
    .limit(1);

  // Always respond with success to avoid account enumeration.
  if (!user) {
    return c.json({ success: true, message: 'If an account exists for that email, a reset link has been sent.' });
  }

  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash: hashResetToken(token),
    expiresAt,
  });

  try { await sendPasswordReset(user.email, token); }
  catch { return c.json({ success: false, error: 'We couldn’t send a recovery email. Please try again later.' }, 503); }
  return c.json({ success: true, message: 'If an account exists for that email, a reset link has been sent.' });
});

authModule.post('/reset-password', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }

  const { token, password } = parsed.data;
  const passwordHash = await hashPassword(password);
  const changed = await db.transaction(async (tx) => {
  const [record] = await tx
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, hashResetToken(token)),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    )
    .limit(1).for('update');

  if (!record) {
    return false;
  }

  await tx.update(users).set({ passwordHash }).where(eq(users.id, record.userId));
  await tx.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.userId, record.userId));
  return true;
  });
  if (!changed) return c.json({ success: false, error: 'Reset link is invalid or has expired' }, 400);

  return c.json({ success: true, message: 'Password updated. You can now log in.' });
});
