import { beforeEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({ error: new Error('Database unavailable') as unknown }));
vi.mock('../db', () => ({
  db: {
    select: () => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) }),
    insert: () => ({ values: () => ({ returning: () => Promise.reject(fixture.error) }) }),
  },
}));

import { register } from '../modules/auth';
import { createContext } from '../http/context';

const attempt = () => register(createContext(
  new Request('http://localhost/api/account/auth/register', { method: 'POST' }),
  {},
  { email: 'customer@example.invalid', password: 'Customer-test-password', name: 'Test Customer' }
));

beforeEach(() => { fixture.error = new Error('Database unavailable'); });

describe('concurrent registration', () => {
  it.each([
    { code: '23505' },
    { cause: { code: '23505' } },
  ])('returns an account conflict when another signup wins the insert race', async error => {
    fixture.error = error;
    await expect(attempt()).rejects.toMatchObject({ status: 409, message: 'An account with this email already exists' });
  });

  it('does not turn a database outage into a duplicate-account message', async () => {
    await expect(attempt()).rejects.toBe(fixture.error);
  });
});
