import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'crypto';
import { promisify } from 'util';
import { sign, verify } from 'hono/jwt';
import { env } from '../config/index.js';

const scrypt = promisify(scryptCallback);

const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, keyHex] = parts;
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  const storedKey = Buffer.from(keyHex, 'hex');
  if (storedKey.length !== derivedKey.length) return false;
  return timingSafeEqual(storedKey, derivedKey);
}

export interface JwtPayload {
  sub: number;
  email: string;
  role: 'admin' | 'customer';
  exp: number;
  credentialVersion?: string;
}

export function credentialVersion(passwordHash: string) {
  return createHash('sha256').update(passwordHash).digest('hex');
}

export async function issueToken(user: { id: number; email: string; role: 'admin' | 'customer'; passwordHash?: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return await sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      credentialVersion: user.passwordHash ? credentialVersion(user.passwordHash) : undefined,
      iat: now,
      exp: now + 60 * 60 * 24 * 7,
    },
    env.jwtSecret,
    "HS256"
  );
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const payload = await verify(token, env.jwtSecret, "HS256");
    if (!Number.isInteger(payload.sub) || typeof payload.email !== 'string' || !['admin', 'customer'].includes(String(payload.role))) return null;
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
