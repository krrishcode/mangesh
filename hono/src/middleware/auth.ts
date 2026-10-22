import type { Context, Next } from 'hono';
import { verifyToken, credentialVersion, hashResetToken } from '../lib/auth.js';
import { db } from '../db/index.js';
import { users, revokedSessions } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';

export interface AuthUser {
  id: number;
  email: string;
  role: 'admin' | 'customer';
}

declare module 'hono' {
  interface ContextVariableMap {
    authUser: AuthUser;
  }
}

export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized: missing bearer token' }, 401);
  }

  const token = authHeader.slice(7).trim();
  const payload = await verifyToken(token);
  if (!payload) {
    return c.json({ success: false, error: 'Unauthorized: invalid or expired token' }, 401);
  }
  const [user] = await db.select({ id: users.id, email: users.email, role: users.role, passwordHash: users.passwordHash }).from(users).where(eq(users.id, payload.sub)).limit(1);
  const [revoked] = await db.select({ tokenHash: revokedSessions.tokenHash }).from(revokedSessions).where(eq(revokedSessions.tokenHash, hashResetToken(token))).limit(1);
  if (!user || revoked || !payload.credentialVersion || credentialVersion(user.passwordHash) !== payload.credentialVersion) {
    return c.json({ success: false, error: 'Your session has expired. Please sign in again.' }, 401);
  }
  c.set('authUser', { id: user.id, email: user.email, role: user.role });
  await next();
}

export async function optionalAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const payload = await verifyToken(authHeader.slice(7).trim());
    if (payload) {
      const [user] = await db.select({ id: users.id, email: users.email, role: users.role, passwordHash: users.passwordHash }).from(users).where(eq(users.id, payload.sub)).limit(1);
      const [revoked] = await db.select({ tokenHash: revokedSessions.tokenHash }).from(revokedSessions).where(eq(revokedSessions.tokenHash, hashResetToken(authHeader.slice(7).trim()))).limit(1);
      if (user && !revoked && payload.credentialVersion === credentialVersion(user.passwordHash)) c.set('authUser', { id: user.id, email: user.email, role: user.role });
    }
  }
  await next();
}
