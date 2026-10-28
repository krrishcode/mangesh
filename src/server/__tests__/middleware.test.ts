import { beforeEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({
  user: { id: 7, email: 'buyer@example.invalid', role: 'customer', passwordHash: 'new-hash' } as any,
  revoked: false,
}));

vi.mock('../lib/auth', () => ({
  verifyToken: vi.fn(),
  credentialVersion: (hash: string) => 'version:' + hash,
  hashResetToken: () => 'test-token-hash',
}));

vi.mock('../db', () => ({
  db: {
    select: () => ({
      from: (table: any) => {
        const rows =
          table[Symbol.for('drizzle:Name')] === 'users'
            ? fixture.user
              ? [fixture.user]
              : []
            : fixture.revoked
              ? [{ tokenHash: 'test-token-hash' }]
              : [];
        const chain: any = { where: () => chain, limit: () => Promise.resolve(rows) };
        return chain;
      },
    }),
  },
}));

import { verifyToken } from '../lib/auth';
import { authenticate, optionalAuthenticate } from '../http/auth';

const payload = {
  sub: 7,
  email: 'buyer@example.invalid',
  role: 'customer' as const,
  exp: 1e12,
  credentialVersion: 'version:new-hash',
};

async function secureRequest(authorization = 'Bearer valid'): Promise<{ status: number; body: any }> {
  try {
    const user = await authenticate(
      new Request('http://localhost/secure', { headers: { Authorization: authorization } })
    );
    return { status: 200, body: { user } };
  } catch (error: any) {
    return { status: error.status, body: { error: error.message } };
  }
}

async function publicRequest(authorization = 'Bearer valid'): Promise<{ status: number; body: any }> {
  const user = await optionalAuthenticate(
    new Request('http://localhost/public', { headers: { Authorization: authorization } })
  );
  return { status: 200, body: { user } };
}

beforeEach(() => {
  vi.mocked(verifyToken).mockReset();
  fixture.user = { id: 7, email: 'buyer@example.invalid', role: 'customer', passwordHash: 'new-hash' };
  fixture.revoked = false;
});

describe('account access and session revocation', () => {
  it('requires bearer authentication', async () => {
    expect((await secureRequest('')).status).toBe(401);
    expect((await secureRequest('Basic abc')).status).toBe(401);
  });

  it('rejects invalid or expired tokens', async () => {
    vi.mocked(verifyToken).mockResolvedValue(null);
    expect((await secureRequest()).status).toBe(401);
  });

  it('accepts an active session using current database identity', async () => {
    vi.mocked(verifyToken).mockResolvedValue(payload);
    const response = await secureRequest();
    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({ id: 7, email: 'buyer@example.invalid', role: 'customer' });
  });

  it('rejects sessions issued before a password change', async () => {
    vi.mocked(verifyToken).mockResolvedValue({ ...payload, credentialVersion: 'version:old-hash' });
    expect((await secureRequest()).status).toBe(401);
  });

  it('rejects logged-out sessions', async () => {
    fixture.revoked = true;
    vi.mocked(verifyToken).mockResolvedValue(payload);
    expect((await secureRequest()).status).toBe(401);
  });

  it('rejects legacy sessions without a credential version', async () => {
    vi.mocked(verifyToken).mockResolvedValue({ ...payload, credentialVersion: undefined });
    expect((await secureRequest()).status).toBe(401);
  });

  it('rejects a deleted account', async () => {
    fixture.user = null;
    vi.mocked(verifyToken).mockResolvedValue(payload);
    expect((await secureRequest()).status).toBe(401);
  });

  it('does not trust a stale admin role in the token', async () => {
    vi.mocked(verifyToken).mockResolvedValue({ ...payload, role: 'admin' });
    const response = await secureRequest();
    expect(response.body.user.role).toBe('customer');
  });

  it('allows anonymous public reads', async () => {
    const response = await publicRequest('');
    expect(response.status).toBe(200);
    expect(response.body.user).toBeNull();
  });

  it('ignores an invalid optional session', async () => {
    vi.mocked(verifyToken).mockResolvedValue(null);
    expect((await publicRequest()).body.user).toBeNull();
  });

  it('ignores a revoked optional session', async () => {
    fixture.revoked = true;
    vi.mocked(verifyToken).mockResolvedValue(payload);
    expect((await publicRequest()).body.user).toBeNull();
  });

  it('loads identity for a valid optional session', async () => {
    vi.mocked(verifyToken).mockResolvedValue(payload);
    expect((await publicRequest()).body.user.id).toBe(7);
  });
});
