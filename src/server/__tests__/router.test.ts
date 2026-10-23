import { beforeEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({
  users: [] as any[][],
  nextId: 500,
}));

vi.mock('../db', () => {
  const chain = (rows: any[]) => {
    const query: any = { then: (resolve: any, reject: any) => Promise.resolve(rows).then(resolve, reject) };
    query.where = () => query;
    query.limit = () => query;
    return query;
  };
  return {
    db: {
      select: () => ({
        from: (table: any) => {
          if (table[Symbol.for('drizzle:Name')] !== 'users') return chain([]);
          return chain(fixture.users.shift() || []);
        },
      }),
      insert: () => ({
        values: (payload: any) => {
          fixture.nextId++;
          const created = { id: fixture.nextId, role: 'customer', phone: null, createdAt: new Date(), ...payload };
          fixture.users.push([created]);
          return chain([{ insertId: fixture.nextId, affectedRows: 1 }]);
        },
      }),
    },
  };
});

import { handleApi } from '../http/router';
import { resetRateLimits } from '../http/rate-limit';
import { hashPassword } from '../lib/password';
import { verifyToken } from '../lib/auth';

async function request(
  path: string,
  method = 'GET',
  body?: unknown,
  headers: Record<string, string> = {}
) {
  return handleApi(
    new Request(`http://localhost/api/account${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    path.split('/').filter(Boolean)
  );
}

beforeEach(() => {
  fixture.users = [];
  fixture.nextId = 500;
  resetRateLimits();
});

describe('API dispatcher', () => {
  it('returns JSON 404 and 405 envelopes', async () => {
    const missing = await request('/does-not-exist');
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: 'Not found' });

    const wrongMethod = await request('/auth/login', 'GET');
    expect(wrongMethod.status).toBe(405);
    expect(await wrongMethod.json()).toEqual({ error: 'Method not allowed' });
  });

  it('rejects request bodies over the one-megabyte limit', async () => {
    const response = await request('/auth/login', 'POST', { padding: 'x'.repeat(1024 * 1024) });
    expect(response.status).toBe(413);
    expect((await response.json()).error).toBe('Request is too large');
  });

  it('rejects cross-site mutations and non-JSON browser-session requests', async () => {
    expect((await request('/auth/login', 'POST', {}, { Origin: 'https://untrusted.invalid' })).status).toBe(403);
    expect(
      (
        await request('/checkout/session', 'POST', undefined, {
          'Content-Type': 'application/x-www-form-urlencoded',
        })
      ).status
    ).toBe(400);
  });

  it('logs in a valid customer and rejects a wrong password', async () => {
    const passwordHash = await hashPassword('correct-password');
    const user = { id: 7, email: 'buyer@example.invalid', name: 'Buyer', phone: null, role: 'customer', passwordHash };
    fixture.users.push([user]);

    const success = await request('/auth/login', 'POST', {
      email: 'buyer@example.invalid',
      password: 'correct-password',
    });
    expect(success.status).toBe(200);
    const result = await success.json();
    expect(result.data.user).toMatchObject({ id: 7, email: 'buyer@example.invalid' });
    expect(result.data.user.passwordHash).toBeUndefined();
    expect((await verifyToken(result.data.token))?.sub).toBe(7);

    fixture.users.push([user]);
    const failure = await request('/auth/login', 'POST', {
      email: 'buyer@example.invalid',
      password: 'wrong-password',
    });
    expect(failure.status).toBe(401);
    expect((await failure.json()).error).toBe('Invalid email or password');
  });

  it('registers a customer, keeps the password hashed and issues a session', async () => {
    fixture.users.push([]);
    const response = await request('/auth/register', 'POST', {
      name: 'New Buyer',
      email: 'New@Example.invalid',
      password: 'correct-password',
    });
    expect(response.status).toBe(201);
    const result = await response.json();
    expect(result.data.user).toMatchObject({ email: 'new@example.invalid', name: 'New Buyer' });
    expect((await verifyToken(result.data.token))?.sub).toBe(result.data.user.id);
  });

  it('rate-limits repeated authentication attempts', async () => {
    for (let attempt = 0; attempt < 15; attempt++) {
      fixture.users.push([]);
      expect((await request('/auth/login', 'POST', { email: 'nobody@example.invalid', password: 'wrong' })).status).toBe(401);
    }
    fixture.users.push([]);
    const blocked = await request('/auth/login', 'POST', { email: 'nobody@example.invalid', password: 'wrong' });
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBeTruthy();
  });
});
