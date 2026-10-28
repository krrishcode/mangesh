import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { env } from '../server/env';
import { credentialVersion, issueToken, verifyToken } from '../server/lib/auth';
import { hashPassword, verifyPassword } from '../server/lib/password';
import { signCookieValue, unsignCookieValue } from '../server/lib/signed-cookie';

function base64url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function legacyToken(payload: Record<string, unknown>): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const signature = createHmac('sha256', env.jwtSecret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

describe('server foundation', () => {
  it('hashes and verifies passwords', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash).toMatch(/^scrypt:/);
    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true);
    expect(await verifyPassword('wrong password', hash)).toBe(false);
  });

  it('issues and verifies a session token', async () => {
    const token = await issueToken({
      id: 7,
      email: 'buyer@example.invalid',
      role: 'customer',
      passwordHash: 'scrypt:salt:key',
    });
    expect(await verifyToken(token)).toMatchObject({
      sub: 7,
      email: 'buyer@example.invalid',
      role: 'customer',
      credentialVersion: credentialVersion('scrypt:salt:key'),
    });
  });

  it('accepts the numeric-sub token shape issued by the previous backend', async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = legacyToken({
      sub: 7,
      email: 'buyer@example.invalid',
      role: 'customer',
      iat: now,
      exp: now + 60,
      credentialVersion: 'v1',
    });
    expect(await verifyToken(token)).toMatchObject({ sub: 7, role: 'customer' });
  });

  it('rejects tampered and expired tokens', async () => {
    const token = await issueToken({ id: 7, email: 'buyer@example.invalid', role: 'customer' });
    expect(await verifyToken(`${token.slice(0, -2)}xx`)).toBeNull();

    const now = Math.floor(Date.now() / 1000);
    const expired = legacyToken({
      sub: 7,
      email: 'buyer@example.invalid',
      role: 'customer',
      iat: now - 120,
      exp: now - 60,
    });
    expect(await verifyToken(expired)).toBeNull();
  });

  it('signs and verifies cookies with tamper detection', () => {
    const signed = signCookieValue('nonce-value');
    expect(unsignCookieValue(signed)).toBe('nonce-value');
    const signatureStart = signed.lastIndexOf('.') + 1;
    const changedCharacter = signed[signatureStart] === 'A' ? 'B' : 'A';
    const tampered = signed.slice(0, signatureStart) + changedCharacter + signed.slice(signatureStart + 1);
    expect(unsignCookieValue(tampered)).toBeNull();
    expect(unsignCookieValue(undefined)).toBeNull();
  });
});
