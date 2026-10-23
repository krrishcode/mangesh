import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { env } from '../env';

const secret = new TextEncoder().encode(env.jwtSecret);

export interface JwtPayload {
  sub: number;
  email: string;
  role: 'admin' | 'customer';
  exp: number;
  credentialVersion?: string;
  iat?: number;
}

export async function signJwt(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .sign(secret);
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    const sub = payload.sub as unknown;
    if (typeof sub !== 'number' || !Number.isInteger(sub) || sub <= 0) return null;
    if (typeof payload.email !== 'string' || !['admin', 'customer'].includes(String(payload.role))) return null;
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}
