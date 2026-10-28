import { randomBytes, randomInt } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { customerAuthConsents, emailOtpChallenges, users } from '../db/schema';
import { json, type ApiContext } from '../http/context';
import { AppError } from '../lib/errors';
import { issueToken } from '../lib/auth';
import { mailConfigured, sendEmailOtp } from '../lib/mail';
import { developmentOtpAllowed, otpHash, otpMatches, otpUnavailable, OTP_LIFETIME_MS, OTP_RESEND_MS } from '../lib/email-otp';

const requestSchema = z.object({ email: z.string().trim().email().max(255).transform(value => value.toLowerCase()), termsAccepted: z.literal(true) });
const verifySchema = z.object({
  challengeId: z.string().regex(/^[a-f0-9]{64}$/), code: z.string().regex(/^\d{6}$/),
  firstName: z.string().trim().min(1).max(100).optional(), lastName: z.string().trim().min(1).max(100).optional(),
  newsletterOptIn: z.boolean().default(false),
});

export async function requestEmailOtp(c: ApiContext) {
  const parsed = requestSchema.safeParse(c.body);
  if (!parsed.success) throw new AppError(400, 'Enter a valid email and accept the Terms and Privacy Policy to continue.');
  const development = !mailConfigured() && developmentOtpAllowed(c.url);
  if (!mailConfigured() && !development) throw new AppError(503, 'Email sign-in is currently unavailable. Please try again later or continue as a guest.');
  const { email } = parsed.data;
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (user?.role === 'admin') throw new AppError(403, 'Please use the administrator sign-in page for this account.');
  const [recent] = await db.select().from(emailOtpChallenges).where(eq(emailOtpChallenges.email, email)).orderBy(desc(emailOtpChallenges.createdAt)).limit(1);
  if (recent && Date.now() - recent.createdAt.getTime() < OTP_RESEND_MS) {
    const seconds = Math.ceil((OTP_RESEND_MS - (Date.now() - recent.createdAt.getTime())) / 1000);
    throw new AppError(429, `Please wait ${seconds} seconds before requesting another code.`, { 'Retry-After': String(seconds) });
  }
  const challengeId = randomBytes(32).toString('hex');
  const code = String(randomInt(100000, 1000000));
  const browser = c.getCookie('mm_otp_browser') || randomBytes(32).toString('hex');
  await db.insert(emailOtpChallenges).values({
    id: challengeId, email, browserHash: otpHash('browser', browser), codeHash: otpHash(challengeId, code),
    development, expiresAt: new Date(Date.now() + OTP_LIFETIME_MS), termsAcceptedAt: new Date(),
  });
  if (!development) {
    try { await sendEmailOtp(email, code); }
    catch {
      await db.delete(emailOtpChallenges).where(eq(emailOtpChallenges.id, challengeId));
      throw new AppError(503, 'We could not send your code. Please try again.');
    }
  }
  c.setCookie('mm_otp_browser', browser, { httpOnly: true, sameSite: 'Lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 600 });
  return json(c, { success: true, data: { challengeId, email, isNewCustomer: !user, delivery: development ? 'development' : 'email', resendAfter: 60 } });
}

export async function verifyEmailOtp(c: ApiContext) {
  const parsed = verifySchema.safeParse(c.body);
  if (!parsed.success) throw new AppError(400, 'Enter a six-digit code and complete the required name fields.');
  const { challengeId, code, firstName, lastName, newsletterOptIn } = parsed.data;
  const browser = c.getCookie('mm_otp_browser');
  if (!browser) throw new AppError(401, 'Your sign-in session expired. Please request a new code.');
  const result = await db.transaction(async tx => {
    const [challenge] = await tx.select().from(emailOtpChallenges).where(eq(emailOtpChallenges.id, challengeId)).limit(1).for('update');
    if (!challenge || challenge.browserHash !== otpHash('browser', browser) || otpUnavailable(challenge)) return { error: 'This code has expired or has already been used. Please request a new code.' };
    const bypass = challenge.development && !mailConfigured() && developmentOtpAllowed(c.url);
    if (!bypass && !otpMatches(challengeId, code, challenge.codeHash)) {
      await tx.update(emailOtpChallenges).set({ attempts: challenge.attempts + 1 }).where(eq(emailOtpChallenges.id, challengeId));
      return { error: challenge.attempts + 1 >= 5 ? 'Too many attempts. Please request a new code.' : 'That code is incorrect. Please try again.' };
    }
    let [user] = await tx.select().from(users).where(eq(users.email, challenge.email)).limit(1);
    if (user?.role === 'admin') return { error: 'Please use the administrator sign-in page for this account.' };
    if (!user) {
      if (!firstName || !lastName) return { error: 'Please enter your first and last name to create your account.' };
      const [created] = await tx.insert(users).values({ email: challenge.email, name: `${firstName} ${lastName}`, passwordHash: `otp-only:${randomBytes(32).toString('hex')}`, role: 'customer' }).returning();
      await tx.insert(customerAuthConsents).values({ userId: created.id, termsAcceptedAt: challenge.termsAcceptedAt, newsletterOptIn, termsVersion: '2026-10-25' });
      [user] = await tx.select().from(users).where(eq(users.id, created.id)).limit(1);
    }
    await tx.update(emailOtpChallenges).set({ consumedAt: new Date() }).where(eq(emailOtpChallenges.id, challengeId));
    return { user };
  }).catch(error => {
    if (error?.code === '23505' || error?.cause?.code === '23505') throw new AppError(409, 'This account was just created. Go back and request a new sign-in code.');
    throw error;
  });
  if (result.error || !result.user) throw new AppError(401, result.error || 'Unable to sign in. Please request a new code.');
  const { id, email, name, phone, role } = result.user;
  return json(c, { success: true, data: { user: { id, email, name, phone, role }, token: await issueToken(result.user) } });
}
