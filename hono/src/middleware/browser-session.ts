import type { Context, Next } from 'hono';
// Cookie-backed flows must not accept cross-site HTML form submissions. The
// Next.js proxy independently checks Origin and forwards JSON requests only.
export async function browserSessionRequest(c: Context, next: Next) {
  const origin = c.req.header('Origin');
  const allowed = [process.env.APP_ORIGIN, process.env.CORS_ORIGIN].filter(Boolean);
  if (c.req.header('Sec-Fetch-Site') === 'cross-site' || (origin && !allowed.includes(origin))) return c.json({ success: false, error: 'Invalid request origin.' }, 403);
  if (!['GET', 'HEAD'].includes(c.req.method) && !c.req.header('Content-Type')?.toLowerCase().startsWith('application/json')) return c.json({ success: false, error: 'Use a JSON request.' }, 400);
  await next();
}
