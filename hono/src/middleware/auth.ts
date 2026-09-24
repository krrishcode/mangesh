import type { Context, Next } from 'hono';
import { verifyToken } from '../lib/auth.js';

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

  c.set('authUser', { id: payload.sub, email: payload.email, role: payload.role });
  await next();
}

export async function optionalAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const payload = await verifyToken(authHeader.slice(7).trim());
    if (payload) {
      c.set('authUser', { id: payload.sub, email: payload.email, role: payload.role });
    }
  }
  await next();
}
