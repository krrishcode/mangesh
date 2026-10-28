import { SUPPORT_EMAIL } from '../../lib/contact';

export type EmailContent = { subject: string; text: string; html: string };
export type NotificationKind = 'welcome' | 'order_placed' | 'appointment_booked' | 'appointment_rescheduled' | 'appointment_cancelled';
export type NotificationData = {
  name?: string; email?: string; staff?: boolean; orderId?: number; total?: string;
  fulfilment?: string; shippingAddress?: string | null; guest?: boolean;
  items?: Array<{ title: string; quantity: number; price: string; size?: string; color?: string }>;
  appointmentId?: number; location?: string; occasion?: string; scheduledAt?: string;
};
export const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function emailFrame(subject: string, paragraphs: string[], action?: { label: string; url: string }): EmailContent {
  const support = process.env.SMTP_REPLY_TO || SUPPORT_EMAIL;
  return {
    subject,
    text: [...paragraphs, ...(action ? [`${action.label}: ${action.url}`] : []), `Need help? ${support}`, 'Mangesh Mahadev'].join('\n\n'),
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f5f4f1;color:#292724;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:auto;background:#fff;border:1px solid #e8e5df"><tr><td style="padding:32px 28px;border-bottom:1px solid #e8e5df;text-align:center;font-family:Georgia,serif;font-size:21px;letter-spacing:3px">MANGESH MAHADEV</td></tr><tr><td style="padding:28px"><h1 style="font-size:22px;font-weight:500;line-height:1.4;margin:0 0 24px">${escapeHtml(subject)}</h1>${paragraphs.map(p => `<p style="font-size:15px;line-height:1.7;white-space:pre-line;margin:0 0 18px">${escapeHtml(p)}</p>`).join('')}${action ? `<p style="margin:28px 0"><a href="${escapeHtml(action.url)}" style="display:inline-block;background:#292724;color:#fff;padding:14px 22px;text-decoration:none;font-size:14px">${escapeHtml(action.label)}</a></p>` : ''}<p style="font-size:13px;line-height:1.6;color:#69645c;margin:28px 0 0">Need help? <a href="mailto:${escapeHtml(support)}" style="color:#51442d">${escapeHtml(support)}</a></p></td></tr><tr><td style="padding:18px 28px;border-top:1px solid #e8e5df;color:#777;font-size:12px">Couture &amp; Bespoke · Mangesh Mahadev</td></tr></table></td></tr></table></body></html>`,
  };
}

export function emailOrigin() {
  const url = new URL(process.env.EMAIL_APP_ORIGIN || process.env.APP_ORIGIN || 'http://localhost:3000');
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid email application origin');
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') throw new Error('Production email links require an HTTPS origin');
  return url.origin;
}

export function notificationContent(kind: NotificationKind, data: NotificationData): EmailContent {
  const hello = `Hello ${data.name || 'there'},`;
  if (kind === 'welcome') return emailFrame('Welcome to Mangesh Mahadev', [hello, 'Your account is ready. Sign in to find your favourites, saved addresses, appointments and orders.'], { label: 'View my account', url: `${emailOrigin()}/account` });
  if (kind === 'order_placed') {
    const number = `ORD-${String(data.orderId).padStart(4, '0')}`;
    const items = (data.items || []).map(item => `${item.title}${item.size ? ` · ${item.size}` : ''}${item.color ? ` · ${item.color}` : ''} × ${item.quantity} — ₹${(Number(item.price) * item.quantity).toFixed(2)}`).join('\n');
    let address = '';
    if (data.shippingAddress) { try { const a = JSON.parse(data.shippingAddress); address = [a.fullName, a.line1, a.line2, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(', '); } catch { /* Ignore malformed snapshots. */ } }
    return emailFrame(`${data.staff ? 'New order' : 'Order received'} · ${number}`, [data.staff ? `A new order was placed by ${data.name || 'a customer'} (${data.email || ''}).` : hello, data.staff ? 'The order has been recorded for your team to process.' : 'Your order has been received. Our team will help with the next steps.', items, `Total: ₹${Number(data.total || 0).toFixed(2)}\nPayment: ${data.fulfilment === 'pickup' ? 'Pay at store collection' : 'Cash on delivery'}\nMethod: ${data.fulfilment === 'pickup' ? 'Store pickup' : 'Home delivery'}${address ? `\nDelivery address: ${address}` : ''}`], { label: data.staff ? 'Open orders' : 'View orders', url: `${emailOrigin()}${data.staff ? '/admin/orders' : data.guest ? '/track-order' : '/account/orders'}` });
  }
  const cancelled = kind === 'appointment_cancelled';
  const title = kind === 'appointment_booked' ? 'Appointment booked' : cancelled ? 'Appointment cancelled' : 'Appointment rescheduled';
  const date = data.scheduledAt ? new Date(data.scheduledAt) : null;
  const when = date && Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(date) + ' (India time)' : 'Contact our team to confirm the time';
  return emailFrame(`${data.staff ? 'Customer ' + title.toLowerCase() : title} · #${data.appointmentId}`, [data.staff ? `Customer: ${data.name || ''} (${data.email || ''})` : hello, cancelled ? 'The appointment has been cancelled. Contact our team if you would like to arrange another visit.' : 'The appointment details are confirmed below.', `Date and time: ${when}\nLocation: ${data.location || ''}\nOccasion: ${data.occasion || ''}`], { label: data.staff ? 'Open appointments' : 'View appointments', url: `${emailOrigin()}${data.staff ? '/admin/appointments' : '/account/appointments'}` });
}
