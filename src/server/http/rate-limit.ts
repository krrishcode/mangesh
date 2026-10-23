import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const attempts = new Map<string, { count: number; expires: number }>();
const upstashLimiters = new Map<string, Ratelimit>();

function memoryRateLimit(key: string, limit: number, windowMs: number): number | null {
  const now = Date.now();
  if (attempts.size > 10000) {
    for (const [attemptKey, value] of attempts) if (value.expires <= now) attempts.delete(attemptKey);
  }
  const current = attempts.get(key);
  const entry = current && current.expires > now ? current : { count: 0, expires: now + windowMs };
  entry.count++;
  attempts.set(key, entry);
  return entry.count > limit ? Math.ceil((entry.expires - now) / 1000) : null;
}

function upstashLimiter(limit: number, windowMs: number): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const cacheKey = `${limit}:${windowMs}`;
  let limiter = upstashLimiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(limit, `${Math.max(1, Math.ceil(windowMs / 1000))} s`),
      prefix: 'mm-rate-limit',
    });
    upstashLimiters.set(cacheKey, limiter);
  }
  return limiter;
}

export function rateLimitBackend(): 'upstash' | 'memory' {
  return process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? 'upstash'
    : 'memory';
}

// A shared store is used when configured; otherwise the per-instance map is a
// best-effort fallback so a store outage never takes the storefront down.
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs = 15 * 60 * 1000
): Promise<number | null> {
  const limiter = upstashLimiter(limit, windowMs);
  if (limiter) {
    try {
      const result = await limiter.limit(key);
      if (result.success) return null;
      return Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
    } catch (error) {
      console.error('Rate limit store unavailable; using the in-memory fallback.', error);
    }
  }
  return memoryRateLimit(key, limit, windowMs);
}

export function clientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'local'
  );
}

export function resetRateLimits(): void {
  attempts.clear();
  upstashLimiters.clear();
}
