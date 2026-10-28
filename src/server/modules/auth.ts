import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { googleIdentities, passwordResetTokens, revokedSessions, users } from '../db/schema';
import { env } from '../env';
import { json, type ApiContext } from '../http/context';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from '../validation';
import {
  generateResetToken,
  hashPassword,
  hashResetToken,
  issueToken,
  verifyPassword,
  verifyToken,
} from '../lib/auth';
import { AppError } from '../lib/errors';
import { googleClientId, verifyGoogleCredential } from '../lib/google-auth';
import { mailConfigured, sendPasswordReset } from '../lib/mail';
import { signCookieValue, unsignCookieValue } from '../lib/signed-cookie';

function publicUser(user: { id: number; email: string; name: string; phone: string | null; role: 'admin' | 'customer' }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
  };
}

export async function googleConfig(c: ApiContext) {
  const clientId = googleClientId();
  if (!clientId) return json(c, { success: true, data: { enabled: false } });
  const secret = randomBytes(32).toString('hex');
  c.setCookie('mm_google_nonce', signCookieValue(secret), {
    httpOnly: true,
    sameSite: 'Lax',
    secure: env.isProduction,
    path: '/',
    maxAge: 600,
  });
  return json(c, {
    success: true,
    data: { enabled: true, clientId, nonce: createHash('sha256').update(secret).digest('hex') },
  });
}

export async function googleLogin(c: ApiContext) {
  if (!googleClientId()) throw new AppError(503, 'Google sign-in is not configured yet. Please use email and password.');
  const parsed = z.object({ credential: z.string().min(20).max(16000) }).safeParse(c.body);
  if (!parsed.success) throw new AppError(400, 'Invalid Google sign-in response.');

  const secret = unsignCookieValue(c.getCookie('mm_google_nonce'));
  if (!secret) throw new AppError(401, 'This sign-in request has expired. Refresh the page and try again.');
  const identity = await verifyGoogleCredential(parsed.data.credential, createHash('sha256').update(secret).digest('hex'));
  c.deleteCookie('mm_google_nonce');

  const [linked] = await db.select().from(googleIdentities).where(eq(googleIdentities.subject, identity.subject)).limit(1);
  let [user] = linked
    ? await db.select().from(users).where(eq(users.id, linked.userId)).limit(1)
    : await db.select().from(users).where(eq(users.email, identity.email)).limit(1);

  if (!linked && user) {
    // Google must currently control the mailbox before password accounts can be
    // linked. Never link administrators or third-party Google email aliases.
    if (user.role !== 'customer' || !identity.authoritative) {
      throw new AppError(409, 'An account already uses this email. Please sign in with your password.');
    }
    const [other] = await db.select().from(googleIdentities).where(eq(googleIdentities.userId, user.id)).limit(1);
    if (other) throw new AppError(409, 'This account is connected to a different Google identity. Sign in with your password.');
    await db.insert(googleIdentities).values({ subject: identity.subject, userId: user.id });
  } else if (!linked) {
    const passwordHash = `google-only:${randomBytes(32).toString('hex')}`;
    const id = await db.transaction(async (tx) => {
      const [created] = await tx.insert(users).values({ email: identity.email, name: identity.name, passwordHash, role: 'customer' }).returning();
      await tx.insert(googleIdentities).values({ subject: identity.subject, userId: created.id });
      return created.id;
    });
    [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  }

  if (!user || user.role !== 'customer') throw new AppError(403, 'Please use your account password to sign in.');
  return json(c, { success: true, data: { user: publicUser(user), token: await issueToken(user) } });
}

export async function register(c: ApiContext) {
  const parsed = registerSchema.safeParse(c.body);
  if (!parsed.success) {
    return json(c, { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }

  const { email, password, name } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).limit(1);
  if (existing.length > 0) {
    return json(c, { success: false, error: 'An account with this email already exists' }, 409);
  }

  const passwordHash = await hashPassword(password);
  let userId: number;
  try {
    const [header] = await db.insert(users).values({ email: normalizedEmail, passwordHash, name: name.trim() }).returning();
    userId = header.id;
  } catch (error) {
    const databaseError = error as { code?: string; cause?: { code?: string } };
    if (databaseError?.code === '23505' || databaseError?.cause?.code === '23505') {
      throw new AppError(409, 'An account with this email already exists');
    }
    throw error;
  }
  const [created] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const token = await issueToken(created);
  return json(c, { success: true, data: { user: publicUser(created), token }, message: 'Account created' }, 201);
}

export async function login(c: ApiContext) {
  const parsed = loginSchema.safeParse(c.body);
  if (!parsed.success) {
    return json(c, { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return json(c, { success: false, error: 'Invalid email or password' }, 401);
  }

  return json(c, { success: true, data: { user: publicUser(user), token: await issueToken(user) }, message: 'Logged in' });
}

export async function me(c: ApiContext) {
  const [user] = await db.select().from(users).where(eq(users.id, c.authUser!.id)).limit(1);
  if (!user) return json(c, { success: false, error: 'User not found' }, 404);
  return json(c, { success: true, data: { user: publicUser(user) } });
}

export async function security(c: ApiContext) {
  const [user] = await db.select().from(users).where(eq(users.id, c.authUser!.id)).limit(1);
  if (!user) throw new AppError(404, 'Account not found.');
  const [identity] = await db.select().from(googleIdentities).where(eq(googleIdentities.userId, user.id)).limit(1);
  return json(c, {
    success: true,
    data: { passwordEnabled: user.passwordHash.startsWith('scrypt:'), googleConnected: Boolean(identity), emailOtpAccount: user.passwordHash.startsWith('otp-only:') },
  });
}

export async function logout(c: ApiContext) {
  const token = c.request.headers.get('authorization')!.slice(7).trim();
  const payload = await verifyToken(token);
  await db
    .insert(revokedSessions)
    .values({ tokenHash: hashResetToken(token), expiresAt: new Date(payload!.exp * 1000) })
    .onConflictDoUpdate({ target: revokedSessions.tokenHash, set: { expiresAt: new Date(payload!.exp * 1000) } });
  return json(c, { success: true, message: 'Signed out' });
}

export async function forgotPassword(c: ApiContext) {
  const parsed = forgotPasswordSchema.safeParse(c.body);
  if (!parsed.success) {
    return json(c, { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }
  if (!mailConfigured()) {
    return json(c, { success: false, error: 'Email recovery is currently unavailable. Please contact customer care.' }, 503);
  }

  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email.toLowerCase().trim())).limit(1);

  // Always respond with success to avoid account enumeration.
  if (!user) {
    return json(c, { success: true, message: 'If an account exists for that email, a reset link has been sent.' });
  }

  const token = generateResetToken();
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(Date.now() + 1000 * 60 * 30),
  });

  try {
    await sendPasswordReset(user.email, token);
  } catch {
    return json(c, { success: false, error: 'We couldn’t send a recovery email. Please try again later.' }, 503);
  }
  return json(c, { success: true, message: 'If an account exists for that email, a reset link has been sent.' });
}

export async function resetPassword(c: ApiContext) {
  const parsed = resetPasswordSchema.safeParse(c.body);
  if (!parsed.success) {
    return json(c, { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
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
      .limit(1)
      .for('update');

    if (!record) return false;
    await tx.update(users).set({ passwordHash }).where(eq(users.id, record.userId));
    await tx.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.userId, record.userId));
    return true;
  });

  if (!changed) return json(c, { success: false, error: 'Reset link is invalid or has expired' }, 400);
  return json(c, { success: true, message: 'Password updated. You can now log in.' });
}
