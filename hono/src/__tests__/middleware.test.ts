import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

// Mock the token verification so middleware tests are hermetic (no JWT/secret).
vi.mock('../lib/auth.js', () => ({
  verifyToken: vi.fn(),
}));

import { verifyToken } from '../lib/auth.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

function buildApp() {
  const app = new Hono();
  app.get('/secure', requireAuth, (c) => c.json({ success: true, authUser: c.get('authUser') }));
  app.get('/public', optionalAuth, (c) => c.json({ success: true, authUser: c.get('authUser') ?? null }));
  return app;
}

describe('requireAuth', () => {
  let app: Hono;

  beforeEach(() => {
    app = buildApp();
    vi.mocked(verifyToken).mockReset();
  });

  it('returns 401 when no Authorization header', async () => {
    const res = await app.request('/secure');
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('returns 401 for a non-Bearer header', async () => {
    const res = await app.request('/secure', { headers: { Authorization: 'Basic abc' } });
    expect(res.status).toBe(401);
  });

  it('returns 401 when the token is invalid or expired', async () => {
    vi.mocked(verifyToken).mockResolvedValue(null);
    const res = await app.request('/secure', { headers: { Authorization: 'Bearer bad.token.here' } });
    expect(res.status).toBe(401);
    expect(verifyToken).toHaveBeenCalledWith('bad.token.here');
  });

  it('sets authUser and proceeds for a valid token', async () => {
    vi.mocked(verifyToken).mockResolvedValue({ sub: 7, email: 'a@b.com', role: 'customer', exp: 1e12 });
    const res = await app.request('/secure', { headers: { Authorization: 'Bearer valid.token' } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.authUser).toEqual({ id: 7, email: 'a@b.com', role: 'customer' });
  });
});

describe('optionalAuth', () => {
  let app: Hono;

  beforeEach(() => {
    app = buildApp();
    vi.mocked(verifyToken).mockReset();
  });

  it('passes through with authUser null when no header', async () => {
    const res = await app.request('/public');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.authUser).toBeNull();
  });

  it('sets authUser when a valid token is present', async () => {
    vi.mocked(verifyToken).mockResolvedValue({ sub: 9, email: 'c@d.com', role: 'admin', exp: 1e12 });
    const res = await app.request('/public', { headers: { Authorization: 'Bearer ok' } });
    const body = await res.json();
    expect(body.authUser).toEqual({ id: 9, email: 'c@d.com', role: 'admin' });
  });

  it('ignores an invalid token (still passes through)', async () => {
    vi.mocked(verifyToken).mockResolvedValue(null);
    const res = await app.request('/public', { headers: { Authorization: 'Bearer nope' } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.authUser).toBeNull();
  });
});
