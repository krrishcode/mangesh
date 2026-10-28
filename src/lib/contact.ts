export const SUPPORT_EMAIL = 'support@mangeshmahadev.com';

export function supportMailto(subject?: string) {
  return `mailto:${SUPPORT_EMAIL}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
}
