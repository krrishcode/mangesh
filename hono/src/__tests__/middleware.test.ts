import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
const fixture = vi.hoisted(() => ({ user: { id: 7, email: 'buyer@example.invalid', role: 'customer', passwordHash: 'new-hash' } as any, revoked: false }));
vi.mock('../lib/auth.js', () => ({ verifyToken: vi.fn(), credentialVersion: (hash: string) => 'version:' + hash, hashResetToken: () => 'test-token-hash' }));
vi.mock('../db/index.js', () => ({ db: { select: () => ({ from: (table: any) => {
  const rows = table[Symbol.for('drizzle:Name')] === 'users' ? (fixture.user ? [fixture.user] : []) : fixture.revoked ? [{ tokenHash: 'test-token-hash' }] : [];
  const chain: any = { where: () => chain, limit: () => Promise.resolve(rows) }; return chain;
} }) } }));
import { verifyToken } from '../lib/auth.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
const payload = { sub: 7, email: 'buyer@example.invalid', role: 'customer' as const, exp: 1e12, credentialVersion: 'version:new-hash' };
const buildApp = () => { const app = new Hono(); app.get('/secure', requireAuth, c => c.json({ user: c.get('authUser') })); app.get('/public', optionalAuth, c => c.json({ user: c.get('authUser') || null })); return app; };
const request = (path = '/secure', authorization = 'Bearer valid') => buildApp().request(path, { headers: { Authorization: authorization } });
beforeEach(() => { vi.mocked(verifyToken).mockReset(); fixture.user = { id: 7, email: 'buyer@example.invalid', role: 'customer', passwordHash: 'new-hash' }; fixture.revoked = false; });
describe('account access and session revocation', () => {
  it('requires bearer authentication', async () => { expect((await buildApp().request('/secure')).status).toBe(401); expect((await request('/secure', 'Basic abc')).status).toBe(401); });
  it('rejects invalid or expired tokens', async () => { vi.mocked(verifyToken).mockResolvedValue(null); expect((await request()).status).toBe(401); });
  it('accepts an active session using current database identity', async () => { vi.mocked(verifyToken).mockResolvedValue(payload); const response = await request(); expect(response.status).toBe(200); expect((await response.json()).user).toEqual({ id: 7, email: 'buyer@example.invalid', role: 'customer' }); });
  it('rejects sessions issued before a password change', async () => { vi.mocked(verifyToken).mockResolvedValue({ ...payload, credentialVersion: 'version:old-hash' }); expect((await request()).status).toBe(401); });
  it('rejects logged-out sessions', async () => { fixture.revoked = true; vi.mocked(verifyToken).mockResolvedValue(payload); expect((await request()).status).toBe(401); });
  it('rejects legacy sessions without a credential version', async () => { vi.mocked(verifyToken).mockResolvedValue({ ...payload, credentialVersion: undefined }); expect((await request()).status).toBe(401); });
  it('rejects a deleted account', async () => { fixture.user = null; vi.mocked(verifyToken).mockResolvedValue(payload); expect((await request()).status).toBe(401); });
  it('does not trust a stale admin role in the token', async () => { vi.mocked(verifyToken).mockResolvedValue({ ...payload, role: 'admin' }); const response = await request(); expect((await response.json()).user.role).toBe('customer'); });
  it('allows anonymous public reads', async () => { const response = await buildApp().request('/public'); expect(response.status).toBe(200); expect((await response.json()).user).toBe(null); });
  it('ignores an invalid optional session', async () => { vi.mocked(verifyToken).mockResolvedValue(null); expect((await (await request('/public')).json()).user).toBe(null); });
  it('ignores a revoked optional session', async () => { fixture.revoked = true; vi.mocked(verifyToken).mockResolvedValue(payload); expect((await (await request('/public')).json()).user).toBe(null); });
  it('loads identity for a valid optional session', async () => { vi.mocked(verifyToken).mockResolvedValue(payload); expect((await (await request('/public')).json()).user.id).toBe(7); });
});
