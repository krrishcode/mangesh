import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../env';

export const OTP_LIFETIME_MS = 10 * 60 * 1000;
export const OTP_RESEND_MS = 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export function developmentOtpAllowed(url: URL) {
  return ['development', 'test'].includes(process.env.NODE_ENV || 'development')
    && process.env.AUTH_OTP_DEV_BYPASS === 'true'
    && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
}

export function otpHash(challengeId: string, value: string) {
  return createHmac('sha256', env.jwtSecret).update(`${challengeId}:${value}`).digest('hex');
}

export function otpMatches(challengeId: string, code: string, hash: string) {
  const expected = Buffer.from(hash, 'hex');
  const actual = Buffer.from(otpHash(challengeId, code), 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function otpUnavailable(challenge: { consumedAt: Date | null; expiresAt: Date; attempts: number }) {
  return Boolean(challenge.consumedAt) || challenge.expiresAt.getTime() <= Date.now() || challenge.attempts >= OTP_MAX_ATTEMPTS;
}
