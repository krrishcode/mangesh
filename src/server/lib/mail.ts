import nodemailer from 'nodemailer';

export function mailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM && process.env.APP_ORIGIN);
}

export async function sendPasswordReset(email: string, token: string) {
  if (!mailConfigured()) throw new Error('Email recovery is not configured');
  const origin = new URL(process.env.APP_ORIGIN!);
  if (!['http:', 'https:'].includes(origin.protocol)) throw new Error('Invalid application origin');
  const url = new URL('/reset-password', origin);
  url.searchParams.set('token', token);
  const port = Number(process.env.SMTP_PORT || 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port, secure: port === 465,
    ...(process.env.SMTP_USER ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } } : {}),
    requireTLS: process.env.NODE_ENV === 'production' && port !== 465,
    connectionTimeout: 10000, socketTimeout: 15000,
  });
  try {
    const result = await transport.sendMail({
      from: process.env.SMTP_FROM, to: email, subject: 'Reset your password',
      text: `Use this link to reset your password:\n\n${url.toString()}\n\nThis link expires in 30 minutes. If you did not request it, you can ignore this email.`,
    });
    if (!result.accepted.length) throw new Error('Reset email was not accepted');
  } finally { transport.close(); }
}
