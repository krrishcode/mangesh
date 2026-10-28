import { afterEach, describe, expect, it, vi } from 'vitest';
import { emailFrame, emailOrigin, notificationContent } from '../lib/email-templates';

afterEach(() => vi.unstubAllEnvs());
describe('transactional email content', () => {
  it('escapes customer content in HTML while retaining readable plain text', () => {
    const mail = emailFrame('Hello <script>', ['<img src=x onerror=alert(1)> & hello']);
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).not.toContain('<img src=x');
    expect(mail.html).toContain('&lt;img');
    expect(mail.text).toContain('<img src=x');
    expect(mail.html).toContain('support@mangeshmahadev.com');
  });
  it('renders a COD order without claiming payment or shipment', () => {
    vi.stubEnv('APP_ORIGIN', 'http://localhost:3000');
    vi.stubEnv('NODE_ENV', 'test');
    const mail = notificationContent('order_placed', { orderId: 42, name: 'Test', total: '1250', fulfilment: 'home', items: [{ title: 'Kurta', price: '500', quantity: 2, size: 'M' }] });
    expect(mail.subject).toContain('ORD-0042');
    expect(mail.text).toContain('₹1250.00');
    expect(mail.text).toContain('Cash on delivery');
    expect(mail.text).toContain('Kurta · M × 2 — ₹1000.00');
    expect(mail.text).not.toContain('Payment received');
    expect(mail.text).not.toContain('shipped');
  });
  it('uses India time and preserves cancellation wording', () => {
    vi.stubEnv('NODE_ENV', 'test');
    const mail = notificationContent('appointment_cancelled', { appointmentId: 5, scheduledAt: '2026-11-01T09:00:00Z', location: 'Pune', occasion: 'Fitting' });
    expect(mail.text).toContain('India time');
    expect(mail.text).toContain('cancelled');
    expect(mail.text).not.toContain('details are confirmed');
  });
  it('rejects unsafe or non-HTTPS production email origins', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('EMAIL_APP_ORIGIN', 'javascript:alert(1)');
    expect(emailOrigin).toThrow();
    vi.stubEnv('EMAIL_APP_ORIGIN', 'http://localhost:3000');
    expect(emailOrigin).toThrow();
    vi.stubEnv('EMAIL_APP_ORIGIN', 'https://mangeshmahadev.com/path');
    expect(emailOrigin()).toBe('https://mangeshmahadev.com');
  });
});
