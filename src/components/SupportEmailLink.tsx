'use client';

import { useEffect, useState, type ComponentProps } from 'react';
import { SUPPORT_EMAIL } from '../lib/contact';

let cached: { email: string; expires: number } | null = null;
let pending: Promise<string> | null = null;
function supportEmail() {
  if (cached && cached.expires > Date.now()) return Promise.resolve(cached.email);
  if (!pending) pending = fetch('/api/account/store/contact')
    .then(response => response.ok ? response.json() : null)
    .then(result => {
      const email = result?.data?.email;
      const value = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : SUPPORT_EMAIL;
      cached = { email: value, expires: Date.now() + 60000 };
      return value;
    }).catch(() => SUPPORT_EMAIL).finally(() => { pending = null; });
  return pending;
}

export function SupportEmailLink({ children, subject, ...props }: Omit<ComponentProps<'a'>, 'href'> & { subject?: string }) {
  const [email, setEmail] = useState(SUPPORT_EMAIL);
  useEffect(() => { let active = true; void supportEmail().then(value => { if (active) setEmail(value); }); return () => { active = false; }; }, []);
  return <a {...props} href={`mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`}>{children ?? email}</a>;
}
