import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({
  rows: [] as unknown[][],
  inserted: [] as Record<string, unknown>[],
  updated: [] as Record<string, unknown>[],
  mailConfigured: false,
  send: vi.fn(),
  issue: vi.fn(async () => 'session-token'),
}));
vi.mock('../db', () => {
  const database = {
    select: () => {
      const query = {
        from: () => query, where: () => query, orderBy: () => query,
        limit: () => {
          const result = Promise.resolve(fixture.rows.shift() || []);
          return Object.assign(result, { for: () => result });
        },
      };
      return query;
    },
    insert: () => ({ values: (data: Record<string, unknown>) => { fixture.inserted.push(data); const result = Promise.resolve([{ id: 42 }]); return Object.assign(result, { returning: () => result }); } }),
    update: () => ({ set: (data: Record<string, unknown>) => ({ where: async () => { fixture.updated.push(data); } }) }),
    delete: () => ({ where: async () => {} }),
    transaction: async <T>(run: (tx: unknown) => Promise<T>): Promise<T> => run(database),
  };
  return { db: database };
});
vi.mock('../lib/mail', () => ({ mailConfigured: () => fixture.mailConfigured, sendEmailOtp: fixture.send }));
vi.mock('../lib/auth', () => ({ issueToken: fixture.issue }));

import { createContext } from '../http/context';
import { requestEmailOtp, verifyEmailOtp } from '../modules/email-otp';
import { developmentOtpAllowed, otpHash, otpMatches, otpUnavailable } from '../lib/email-otp';

const challengeId = 'a'.repeat(64);
const browser = 'browser-secret';
const user = { id: 42, email: 'customer@example.invalid', name: 'Test Customer', phone: null, role: 'customer', passwordHash: 'otp-only:random' };
const challenge = () => ({
  id: challengeId, email: user.email, browserHash: otpHash('browser', browser), codeHash: otpHash(challengeId, '246810'),
  development: false, attempts: 0, consumedAt: null, expiresAt: new Date(Date.now() + 600000), termsAcceptedAt: new Date(),
});
const context = (body: unknown, cookie = true, host = 'localhost') => createContext(new Request(`http://${host}/api/account/auth/otp`, {
  method: 'POST', headers: cookie ? { cookie: `mm_otp_browser=${browser}` } : {},
}), {}, body);
const request = () => requestEmailOtp(context({ email: ' Customer@Example.invalid ', termsAccepted: true }));
const verify = (extra = {}, cookie = true) => verifyEmailOtp(context({ challengeId, code: '246810', ...extra }, cookie));

beforeEach(() => {
  fixture.rows = []; fixture.inserted = []; fixture.updated = []; fixture.mailConfigured = false;
  fixture.send.mockReset(); fixture.issue.mockClear();
  vi.stubEnv('NODE_ENV', 'test'); vi.stubEnv('AUTH_OTP_DEV_BYPASS', 'true');
});
afterEach(() => vi.unstubAllEnvs());

describe('email OTP configuration', () => {
  it('only enables the explicit development override on loopback', () => {
    expect(developmentOtpAllowed(new URL('http://localhost'))).toBe(true);
    expect(developmentOtpAllowed(new URL('http://shop.example'))).toBe(false);
    vi.stubEnv('NODE_ENV', 'production');
    expect(developmentOtpAllowed(new URL('http://localhost'))).toBe(false);
  });
  it('fails closed in production without SMTP even when the flag is true', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    await expect(request()).rejects.toMatchObject({ status: 503 });
    expect(fixture.inserted).toHaveLength(0);
  });
  it('requires consent before starting a challenge', async () => {
    await expect(requestEmailOtp(context({ email: user.email, termsAccepted: false }))).rejects.toMatchObject({ status: 400 });
  });
  it('creates a browser-bound development challenge without sending email', async () => {
    fixture.rows = [[], []];
    const response = await request(); const body = await response.json();
    expect(body.data).toMatchObject({ email: user.email, isNewCustomer: true, delivery: 'development' });
    expect(body.data.code).toBeUndefined(); expect(fixture.inserted[0].codeHash).toHaveLength(64);
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(fixture.send).not.toHaveBeenCalled();
  });
  it('uses a real emailed code as soon as SMTP is configured', async () => {
    fixture.mailConfigured = true; fixture.rows = [[user], []];
    const response = await request();
    expect((await response.json()).data).toMatchObject({ isNewCustomer: false, delivery: 'email' });
    expect(fixture.inserted[0].development).toBe(false);
    expect(fixture.send).toHaveBeenCalledWith(user.email, expect.stringMatching(/^\d{6}$/));
  });
  it('enforces a resend cooldown', async () => {
    fixture.rows = [[], [{ createdAt: new Date() }]];
    await expect(request()).rejects.toMatchObject({ status: 429 });
  });
  it('rejects administrator email OTP access', async () => {
    fixture.rows = [[{ ...user, role: 'admin' }]];
    await expect(request()).rejects.toMatchObject({ status: 403 });
  });
  it('reports email provider failure without claiming a code was sent', async () => {
    fixture.mailConfigured = true; fixture.rows = [[], []]; fixture.send.mockRejectedValue(new Error('SMTP unavailable'));
    await expect(request()).rejects.toMatchObject({ status: 503 });
  });
});

describe('email OTP verification', () => {
  it('hashes codes with their challenge and compares the complete hash', () => {
    const hash = otpHash(challengeId, '246810');
    expect(otpMatches(challengeId, '246810', hash)).toBe(true);
    expect(otpMatches(challengeId, '000000', hash)).toBe(false);
    expect(otpMatches('b'.repeat(64), '246810', hash)).toBe(false);
  });
  it.each(['123', '1234567', 'abcdef'])('requires six numeric digits: %s', async code => {
    await expect(verify({ code })).rejects.toMatchObject({ status: 400 });
  });
  it('requires the original browser cookie', async () => {
    await expect(verify({}, false)).rejects.toMatchObject({ status: 401 });
  });
  it.each([
    { consumedAt: new Date() }, { expiresAt: new Date(Date.now() - 1000) }, { attempts: 5 }, { browserHash: 'other-browser' },
  ])('rejects used, expired, exhausted or foreign challenges', async change => {
    fixture.rows = [[{ ...challenge(), ...change }]];
    await expect(verify()).rejects.toMatchObject({ status: 401 });
    expect(fixture.issue).not.toHaveBeenCalled();
  });
  it('counts an incorrect attempt without issuing a token', async () => {
    fixture.rows = [[challenge()]];
    await expect(verify({ code: '000000' })).rejects.toMatchObject({ status: 401 });
    expect(fixture.updated).toEqual([{ attempts: 1 }]); expect(fixture.issue).not.toHaveBeenCalled();
  });
  it('signs an existing customer in without requiring names', async () => {
    fixture.rows = [[challenge()], [user]];
    const response = await verify();
    expect((await response.json()).data.user.name).toBe(user.name);
    expect(fixture.inserted).toHaveLength(0); expect(fixture.updated[0].consumedAt).toBeInstanceOf(Date);
  });
  it('creates a new customer, persists optional consent and signs in', async () => {
    fixture.rows = [[challenge()], [], [user]];
    const response = await verify({ firstName: ' Test ', lastName: ' Customer ', newsletterOptIn: true });
    expect((await response.json()).data.token).toBe('session-token');
    expect(fixture.inserted[0]).toMatchObject({ name: 'Test Customer', role: 'customer', passwordHash: expect.stringMatching(/^otp-only:/) });
    expect(fixture.inserted[1]).toMatchObject({ userId: 42, newsletterOptIn: true, termsVersion: '2026-10-25' });
  });
  it('does not create an account without both names', async () => {
    fixture.rows = [[challenge()], []];
    await expect(verify({ firstName: 'Test' })).rejects.toMatchObject({ status: 401 });
    expect(fixture.inserted).toHaveLength(0);
  });
  it('accepts any six-digit code only for a locally issued development challenge', async () => {
    fixture.rows = [[{ ...challenge(), development: true }], [user]];
    expect((await verify({ code: '000000' })).status).toBe(200);
  });
  it.each(['production', 'smtp'])('does not bypass verification after switching to %s', async mode => {
    if (mode === 'production') vi.stubEnv('NODE_ENV', 'production'); else fixture.mailConfigured = true;
    fixture.rows = [[{ ...challenge(), development: true }]];
    await expect(verify({ code: '000000' })).rejects.toMatchObject({ status: 401 });
    expect(fixture.issue).not.toHaveBeenCalled();
  });
  it('also checks the current account role when completing a challenge', async () => {
    fixture.rows = [[challenge()], [{ ...user, role: 'admin' }]];
    await expect(verify()).rejects.toMatchObject({ status: 401 });
  });
  it('recognises the exact expiry boundary', () => {
    expect(otpUnavailable({ ...challenge(), expiresAt: new Date() })).toBe(true);
  });
});
