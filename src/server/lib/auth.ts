import { createHash, randomBytes } from 'node:crypto';
import { signJwt, verifyJwt, type JwtPayload } from './jwt';

export { hashPassword, verifyPassword } from './password';
export type { JwtPayload };

export function credentialVersion(passwordHash: string) {
  return createHash('sha256').update(passwordHash).digest('hex');
}

export async function issueToken(user: {
  id: number;
  email: string;
  role: 'admin' | 'customer';
  passwordHash?: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return signJwt({
    sub: user.id,
    email: user.email,
    role: user.role,
    credentialVersion: user.passwordHash ? credentialVersion(user.passwordHash) : undefined,
    iat: now,
    exp: now + 60 * 60 * 24 * 7,
  });
}

export const verifyToken = verifyJwt;

export function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
