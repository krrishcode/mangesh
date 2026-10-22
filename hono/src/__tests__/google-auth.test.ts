import { beforeEach, describe, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({ payload: {} as Record<string, unknown>, verify: vi.fn() }));
vi.mock('google-auth-library', () => ({ OAuth2Client: class { verifyIdToken = fixture.verify; } }));
import { verifyGoogleCredential } from '../lib/google-auth.js';
beforeEach(() => { vi.stubEnv('GOOGLE_CLIENT_ID', 'fixture-client'); fixture.payload = { sub: 'google-subject', email: 'buyer@gmail.com', email_verified: true, nonce: 'browser-nonce', name: 'Fixture Buyer' }; fixture.verify.mockReset().mockImplementation(async () => ({ getPayload: () => fixture.payload })); });
describe('Google ID token validation', () => {
  it('delegates signature, issuer, audience and expiry validation to the Google SDK', async () => { expect((await verifyGoogleCredential('signed-token', 'browser-nonce')).subject).toBe('google-subject'); expect(fixture.verify).toHaveBeenCalledWith({ idToken: 'signed-token', audience: 'fixture-client' }); });
  it('rejects invalid signatures and expired or wrong-audience tokens', async () => { fixture.verify.mockRejectedValue(new Error('Invalid token')); await expect(verifyGoogleCredential('invalid', 'browser-nonce')).rejects.toMatchObject({ status: 401 }); });
  it('rejects mismatched browser nonce', async () => { await expect(verifyGoogleCredential('token', 'different-browser')).rejects.toMatchObject({ status: 401 }); });
  it('rejects unverified email', async () => { fixture.payload.email_verified = false; await expect(verifyGoogleCredential('token', 'browser-nonce')).rejects.toMatchObject({ status: 401 }); });
  it('does not treat third-party Google email aliases as authoritative mailboxes', async () => { fixture.payload.email = 'buyer@example.invalid'; expect((await verifyGoogleCredential('token', 'browser-nonce')).authoritative).toBe(false); });
});
