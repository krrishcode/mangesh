import type { Context, Next } from 'hono';
import { getConnInfo } from '@hono/node-server/conninfo';

const attempts = new Map<string, { count: number; expires: number }>();
export function rateLimit(limit = 15, windowMs = 15 * 60 * 1000) {
  return async (c: Context, next: Next) => {
    let ip = 'local';
    try { ip = getConnInfo(c).remote.address || ip; } catch { /* In-process tests have no socket. */ }
    if (process.env.TRUST_PROXY === 'true') ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || ip;
    const now = Date.now();
    if (attempts.size > 10000) for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key);
    const key = `${c.req.path}:${ip}`;
    const value = attempts.get(key);
    const entry = value && value.expires > now ? value : { count: 0, expires: now + windowMs };
    entry.count++; attempts.set(key, entry);
    if (entry.count > limit) {
      c.header('Retry-After', String(Math.ceil((entry.expires - now) / 1000)));
      return c.json({ success: false, error: 'Too many attempts. Please try again later.' }, 429);
    }
    await next();
  };
}
