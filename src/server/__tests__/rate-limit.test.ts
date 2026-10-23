import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkRateLimit, clientIp, rateLimitBackend, resetRateLimits } from '../http/rate-limit';

beforeEach(() => resetRateLimits());
afterEach(() => vi.unstubAllEnvs());

describe('rate limiting', () => {
  it('allows requests up to the limit and reports a retry window', async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      await expect(checkRateLimit('fixture-key', 3, 60_000)).resolves.toBeNull();
    }
    const retryAfter = await checkRateLimit('fixture-key', 3, 60_000);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });

  it('keeps separate route/IP keys independent', async () => {
    await checkRateLimit('route-a:1.1.1.1', 1, 60_000);
    expect(await checkRateLimit('route-a:1.1.1.1', 1, 60_000)).not.toBeNull();
    expect(await checkRateLimit('route-b:1.1.1.1', 1, 60_000)).toBeNull();
    expect(await checkRateLimit('route-a:2.2.2.2', 1, 60_000)).toBeNull();
  });

  it('derives the client IP from trusted proxy headers', () => {
    expect(clientIp(new Request('http://localhost', { headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' } }))).toBe('203.0.113.7');
    expect(clientIp(new Request('http://localhost', { headers: { 'x-real-ip': '198.51.100.4' } }))).toBe('198.51.100.4');
    expect(clientIp(new Request('http://localhost'))).toBe('local');
  });

  it('uses the shared store only when both Upstash values are configured', () => {
    expect(rateLimitBackend()).toBe('memory');

    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://fixture.upstash.io');
    expect(rateLimitBackend()).toBe('memory');

    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'fixture-token');
    expect(rateLimitBackend()).toBe('upstash');
  });
});
