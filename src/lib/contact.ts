export const SUPPORT_EMAIL = 'support@mangeshmahadev.com';
export const SUPPORT_PHONE = '097640 02240';
export const SUPPORT_PHONE_E164 = '+919764002240';
export const SUPPORT_PHONE_HREF = `tel:${SUPPORT_PHONE_E164}`;

export function supportWhatsApp(message: string) {
  return `https://wa.me/${SUPPORT_PHONE_E164.slice(1)}?text=${encodeURIComponent(message)}`;
}

export function supportMailto(subject?: string) {
  return `mailto:${SUPPORT_EMAIL}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
}
