import { eq } from 'drizzle-orm';
import { db } from '../db';
import { revokedSessions, users } from '../db/schema';
import { credentialVersion, hashResetToken, verifyToken } from '../lib/auth';
import { AppError } from '../lib/errors';

export interface AuthUser {
  id: number;
  email: string;
  role: 'admin' | 'customer';
}

async function loadValidUser(token: string): Promise<AuthUser | null> {
  const payload = await verifyToken(token);
  if (!payload) return null;

  const [user] = await db
    .select({ id: users.id, email: users.email, role: users.role, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1);
  const [revoked] = await db
    .select({ tokenHash: revokedSessions.tokenHash })
    .from(revokedSessions)
    .where(eq(revokedSessions.tokenHash, hashResetToken(token)))
    .limit(1);

  if (!user || revoked || !payload.credentialVersion || credentialVersion(user.passwordHash) !== payload.credentialVersion) {
    return null;
  }
  return { id: user.id, email: user.email, role: user.role };
}

export async function authenticate(request: Request): Promise<AuthUser> {
  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError(401, 'Unauthorized: missing bearer token');
  }
  const token = header.slice(7).trim();
  const payload = await verifyToken(token);
  if (!payload) throw new AppError(401, 'Unauthorized: invalid or expired token');

  const user = await loadValidUser(token);
  if (!user) throw new AppError(401, 'Your session has expired. Please sign in again.');
  return user;
}

export async function optionalAuthenticate(request: Request): Promise<AuthUser | null> {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  try {
    return await loadValidUser(header.slice(7).trim());
  } catch {
    return null;
  }
}
