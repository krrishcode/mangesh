import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  issueToken,
  verifyToken,
  generateResetToken,
  hashResetToken,
} from '../lib/auth.js';

describe('password hashing', () => {
  it('hashes and verifies a correct password', async () => {
    const hash = await hashPassword('supersecret123');
    expect(hash).toMatch(/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/);
    await expect(verifyPassword('supersecret123', hash)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('supersecret123');
    await expect(verifyPassword('wrongpass', hash)).resolves.toBe(false);
  });

  it('generates a unique salt per hash', async () => {
    const a = await hashPassword('samepassword');
    const b = await hashPassword('samepassword');
    expect(a).not.toBe(b);
  });

  it('returns false for a malformed stored hash', async () => {
    await expect(verifyPassword('x', 'not-a-valid-hash')).resolves.toBe(false);
    await expect(verifyPassword('x', 'bcrypt:abc:def')).resolves.toBe(false);
  });
});

describe('JWT tokens', () => {
  const user = { id: 42, email: 'customer@example.com', role: 'customer' as const };

  it('issues a token and verifies it back to the payload', async () => {
    const token = await issueToken(user);
    const payload = await verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe(42);
    expect(payload?.email).toBe('customer@example.com');
    expect(payload?.role).toBe('customer');
    expect(payload?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('returns null for a tampered token', async () => {
    const token = await issueToken(user);
    const [header, body] = token.split('.');
    const tampered = `${header}.${body}x.eyJleHAiOjAsInN1YiI6MX0`;
    await expect(verifyToken(tampered)).resolves.toBeNull();
  });

  it('returns null for a garbage token', async () => {
    await expect(verifyToken('not.a.jwt')).resolves.toBeNull();
  });

  it('returns null for an expired token', async () => {
    const { sign } = await import('hono/jwt');
    const { env } = await import('../config/index.js');
    const past = Math.floor(Date.now() / 1000) - 3600;
    const expired = await sign(
      { sub: 42, email: user.email, role: user.role, iat: past - 60, exp: past },
      env.jwtSecret,
      'HS256'
    );
    await expect(verifyToken(expired)).resolves.toBeNull();
  });
});

describe('reset tokens', () => {
  it('generates a random token and hashes it deterministically', () => {
    const token = generateResetToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    const hash = hashResetToken(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashResetToken(token)).toBe(hash);
    expect(hashResetToken('different')).not.toBe(hash);
  });
});
