import '../src/server/db/load-env';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { mailTransport, deliverEmail } from '../src/server/lib/mail';
import { emailFrame } from '../src/server/lib/email-templates';
import { SUPPORT_EMAIL } from '../src/lib/contact';

const transport = mailTransport();
try { await transport.verify(); }
finally { transport.close(); }
const messageId = `<setup-${randomUUID()}@mangeshmahadev.com>`;
await deliverEmail(SUPPORT_EMAIL, emailFrame('Email setup check · Mangesh Mahadev', [
  'The Mangesh Mahadev website SMTP connection has been configured successfully.',
  'Automatic messages will be sent from notifications@mangeshmahadev.com. Replies will go to support@mangeshmahadev.com.',
  'Enabled scope: login/signup verification, password reset, welcome, order placed and appointment booked/rescheduled/cancelled.',
  'This is a setup test. No order, payment or appointment has been created.',
]), messageId);
await mkdir('artifacts/email-setup', { recursive: true });
await writeFile('artifacts/email-setup/smtp-test.json', JSON.stringify({ checkedAt: new Date().toISOString(), authentication: 'passed', smtpAcceptance: 'passed', recipient: SUPPORT_EMAIL, messageId }, null, 2));
console.log('SMTP authentication passed and the controlled setup email was accepted for the support inbox.');
