import { randomBytes } from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '../db';
import { guestSessions } from '../db/schema';
import { env } from '../env';
import { AppError } from './errors';
import { hashResetToken } from './auth';
import type { ApiContext } from '../http/context';

const COOKIE = 'mm_guest';
const lifetime = 30 * 86400;

export async function guestSession(c: ApiContext, create = false) {
  const token = c.getCookie(COOKIE);
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    const tokenHash = hashResetToken(token);
    const [session] = await db
      .select()
      .from(guestSessions)
      .where(and(eq(guestSessions.tokenHash, tokenHash), gt(guestSessions.expiresAt, new Date())))
      .limit(1);
    if (session) return session;
  }

  if (!create) throw new AppError(401, 'Guest order access has expired. Please contact customer care with your order number.');

  const raw = randomBytes(32).toString('hex');
  const session = { tokenHash: hashResetToken(raw), expiresAt: new Date(Date.now() + lifetime * 1000) };
  await db.insert(guestSessions).values(session);
  c.setCookie(COOKIE, raw, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'Lax',
    path: '/',
    maxAge: lifetime,
  });
  return session;
}
