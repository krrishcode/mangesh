import type { Context, Next } from 'hono';

export async function requireAdmin(c: Context, next: Next) {
  if (c.get('authUser')?.role !== 'admin') return c.json({ success: false, error: 'Admin access required' }, 403);
  await next();
}
