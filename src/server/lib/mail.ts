import nodemailer from 'nodemailer';
import { SUPPORT_EMAIL } from '../../lib/contact';
import { emailFrame, emailOrigin, type EmailContent } from './email-templates';

export function mailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM && process.env.APP_ORIGIN);
}

export function mailTransport() {
  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST, port, secure: port === 465,
    ...(process.env.SMTP_USER ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } } : {}),
    requireTLS: port !== 465,
    tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
  });
}

export async function deliverEmail(to: string, content: EmailContent, messageId?: string) {
  if (!mailConfigured()) throw new Error('Email delivery is not configured');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) || /[\r\n]/.test(to)) throw new Error('Invalid email recipient');
  const transport = mailTransport();
  try {
    const result = await transport.sendMail({
      from: { name: 'Mangesh Mahadev', address: process.env.SMTP_FROM! },
      replyTo: process.env.SMTP_REPLY_TO || SUPPORT_EMAIL,
      to, ...content, ...(messageId ? { messageId } : {}),
    });
    if (!result.accepted.length) throw new Error('Email was not accepted by the provider');
  } finally { transport.close(); }
}

export async function sendEmailOtp(email: string, code: string) {
  await deliverEmail(email, emailFrame('Your Mangesh Mahadev sign-in code', [`Your verification code is: ${code}`, 'This code expires in 10 minutes and can only be used once.', 'Do not share this code. If you did not request it, ignore this email.']));
}

export async function sendPasswordReset(email: string, token: string) {
  const url = new URL('/reset-password', emailOrigin());
  url.searchParams.set('token', token);
  await deliverEmail(email, emailFrame('Reset your password', ['Use the button below to reset your password.', 'This link expires in 30 minutes and can only be used once. If you did not request it, ignore this email.'], { label: 'Reset password', url: url.toString() }));
}
