import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../env';

export function signCookieValue(value: string): string {
  const signature = createHmac('sha256', env.jwtSecret).update(value).digest('base64url');
  return `${value}.${signature}`;
}

export function unsignCookieValue(signed: string | undefined | null): string | null {
  if (!signed) return null;
  const separator = signed.lastIndexOf('.');
  if (separator <= 0) return null;
  const value = signed.slice(0, separator);
  const provided = Buffer.from(signed.slice(separator + 1), 'base64url');
  const expected = createHmac('sha256', env.jwtSecret).update(value).digest();
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;
  return value;
}
