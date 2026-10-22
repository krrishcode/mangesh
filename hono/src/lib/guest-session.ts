import type { Context } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { randomBytes } from 'crypto';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '../db/index.js';
import { guestSessions } from '../db/schema/index.js';
import { hashResetToken } from './auth.js';
import { AppError } from './errors.js';

const COOKIE = 'mm_guest';
const lifetime = 30 * 86400;
export async function guestSession(c: Context, create = false) {
  const token = getCookie(c, COOKIE);
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    const tokenHash = hashResetToken(token);
    const [session] = await db.select().from(guestSessions).where(and(eq(guestSessions.tokenHash, tokenHash), gt(guestSessions.expiresAt, new Date()))).limit(1);
    if (session) return session;
  }
  if (!create) throw new AppError(401, 'Guest order access has expired. Please contact customer care with your order number.');
  const raw = randomBytes(32).toString('hex');
  const session = { tokenHash: hashResetToken(raw), expiresAt: new Date(Date.now() + lifetime * 1000) };
  await db.insert(guestSessions).values(session);
  setCookie(c, COOKIE, raw, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Lax', path: '/', maxAge: lifetime });
  return session;
}
