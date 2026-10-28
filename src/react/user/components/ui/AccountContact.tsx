'use client';
import Link from 'next/link';
import { createContext, useContext, type ReactNode } from 'react';
import { useAccountData } from '../../useAccountData';

const ContactContext = createContext<{ email: string; phone: string } | null>(null);
export function AccountContactProvider({ children }: { children: ReactNode }) {
  const { data } = useAccountData<{ email: string; phone: string }>('/store/contact');
  return <ContactContext.Provider value={data}>{children}</ContactContext.Provider>;
}
export function AccountContactLink({ children = 'Contact customer care', subject }: { children?: ReactNode; subject?: string }) {
  const contact = useContext(ContactContext);
  if (contact?.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) return <a className="account-link" href={`mailto:${contact.email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`}>{children}</a>;
  if (contact?.phone && contact.phone.replace(/\D/g, '').length >= 7) return <a className="account-link" href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}>{children}</a>;
  return <Link className="account-link" href="/track-order">Order help</Link>;
}
