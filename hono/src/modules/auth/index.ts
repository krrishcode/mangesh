import { Hono } from 'hono';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users, passwordResetTokens } from '../../db/schema/index.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../../validation/index.js';
import { hashPassword, verifyPassword, issueToken, generateResetToken, hashResetToken } from '../../lib/auth.js';
import { requireAuth } from '../../middleware/auth.js';

export const authModule = new Hono();

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

authModule.post('/forgot-password', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }

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

  // No mail provider is configured yet; in development the raw token is returned so the flow is testable end-to-end.
  const payload: Record<string, unknown> = {
    success: true,
    message: 'If an account exists for that email, a reset link has been sent.',
  };
  if (process.env.NODE_ENV !== 'production') {
    payload.resetToken = token;
  }

  return c.json(payload);
});

authModule.post('/reset-password', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, 400);
  }

  const { token, password } = parsed.data;
  const [record] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, hashResetToken(token)),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!record) {
    return c.json({ success: false, error: 'Reset link is invalid or has expired' }, 400);
  }

  const passwordHash = await hashPassword(password);
  await db.update(users).set({ passwordHash }).where(eq(users.id, record.userId));
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, record.id));

  return c.json({ success: true, message: 'Password updated. You can now log in.' });
});
