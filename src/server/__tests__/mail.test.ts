import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({ send: vi.fn(), close: vi.fn(), create: vi.fn() }));
vi.mock('nodemailer', () => ({ default: { createTransport: (...args: unknown[]) => { fixture.create(...args); return { sendMail: fixture.send, close: fixture.close }; } } }));
import { deliverEmail, sendEmailOtp, sendPasswordReset } from '../lib/mail';

beforeEach(() => {
  fixture.send.mockReset().mockResolvedValue({ accepted: ['customer@example.invalid'] });
  fixture.close.mockClear(); fixture.create.mockClear();
  for (const [key, value] of Object.entries({ NODE_ENV: 'test', SMTP_HOST: 'smtp.example.invalid', SMTP_PORT: '465', SMTP_FROM: 'notifications@mangeshmahadev.com', SMTP_USER: 'notifications@mangeshmahadev.com', SMTP_PASSWORD: 'qa-only-placeholder', SMTP_REPLY_TO: 'support@mangeshmahadev.com', APP_ORIGIN: 'http://localhost:3000', EMAIL_APP_ORIGIN: 'https://mangeshmahadev.com' })) vi.stubEnv(key, value);
});
afterEach(() => vi.unstubAllEnvs());
describe('shared SMTP mail delivery', () => {
  it('uses the notifications sender, support Reply-To and verified TLS for OTP mail', async () => {
    await sendEmailOtp('customer@example.invalid', '123456');
    expect(fixture.create).toHaveBeenCalledWith(expect.objectContaining({ port: 465, secure: true, tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true } }));
    expect(fixture.send).toHaveBeenCalledWith(expect.objectContaining({ from: { name: 'Mangesh Mahadev', address: 'notifications@mangeshmahadev.com' }, replyTo: 'support@mangeshmahadev.com', to: 'customer@example.invalid', text: expect.stringContaining('123456'), html: expect.stringContaining('123456') }));
    expect(fixture.close).toHaveBeenCalledOnce();
  });
  it('builds an encoded password-reset link and readable plain-text line breaks', async () => {
    await sendPasswordReset('customer@example.invalid', 'token&special');
    const content = fixture.send.mock.calls[0][0];
    expect(content.text).toContain('https://mangeshmahadev.com/reset-password?token=token%26special');
    expect(content.text).toContain('\n\n');
    expect(content.text).not.toContain('\\n');
    expect(content.html).toContain('Reset password');
  });
  it('does not report successful delivery if the provider accepts nobody', async () => {
    fixture.send.mockResolvedValue({ accepted: [] });
    await expect(sendEmailOtp('customer@example.invalid', '123456')).rejects.toThrow('not accepted');
    expect(fixture.close).toHaveBeenCalledOnce();
  });
  it('rejects recipient header injection before connecting', async () => {
    await expect(deliverEmail('a@example.invalid\r\nBcc: other@example.invalid', { subject: 'Test', html: '', text: '' })).rejects.toThrow('Invalid email recipient');
    expect(fixture.create).not.toHaveBeenCalled();
  });
});
