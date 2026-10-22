'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import type { UserDto } from '../../../types';
import '../../../styles/account.css';

export type Tab = 'overview' | 'orders' | 'appointments' | 'wishlist' | 'profile' | 'addresses';
const tabs: Array<{ id: Tab; label: string; href: string; description: string; icon: string }> = [
  { id: 'overview', label: 'Overview', href: '/account', description: 'Your orders, appointments and account details in one place.', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
  { id: 'orders', label: 'Orders', href: '/account/orders', description: 'Track your purchases and view order details.', icon: 'm3 7 9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10' },
  { id: 'appointments', label: 'Appointments', href: '/account/appointments', description: 'Book a fitting or manage an existing appointment.', icon: 'M8 2v4M16 2v4M3 10h18M3 5h18v16H3z' },
  { id: 'wishlist', label: 'Wishlist', href: '/account/wishlist', description: 'The pieces you’ve saved for later.', icon: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z' },
  { id: 'profile', label: 'Profile & measurements', href: '/account/profile', description: 'Update your contact details and saved measurements.', icon: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-2a8 8 0 0 1 16 0v2' },
  { id: 'addresses', label: 'Addresses', href: '/account/addresses', description: 'Manage your delivery and billing addresses.', icon: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0' },
];

export function UserPortalLayout({ activeTab, children }: { activeTab: Tab; children: ReactNode }) {
  const router = useRouter();
  const { logout, token, user } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  useEffect(() => { if (hydrated && !token) router.replace('/login?next=' + encodeURIComponent(tabs.find(tab => tab.id === activeTab)!.href)); }, [hydrated, token, router, activeTab]);
  if (!hydrated || !token) return <div className="account-shell account-auth-loading" role="status">Loading your account…</div>;
  return <AccountShell activeTab={activeTab} user={user} onSignOut={() => { logout(); router.replace('/login'); }}>{children}</AccountShell>;
}

export function AccountShell({ activeTab, user, onSignOut, children }: { activeTab: Tab; user: UserDto | null; onSignOut: () => void; children: ReactNode }) {
  const current = tabs.find((tab) => tab.id === activeTab)!;
  return <div className="account-shell">
    <div className="account-topline"><Link href="/shop">Continue shopping</Link><span>My account</span></div>
    <div className="account-layout">
      <aside className="account-sidebar">
        <div className="account-identity"><span className="account-initial" aria-hidden="true">{user?.name?.trim().charAt(0) || 'M'}</span><div><p>{user?.name || 'My account'}</p><span>{user?.email}</span></div></div>
        <nav aria-label="Account navigation">{tabs.map((tab) => <Link key={tab.id} href={tab.href} aria-current={activeTab === tab.id ? 'page' : undefined}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={tab.icon} /></svg>{tab.label}
        </Link>)}</nav>
        <button className="account-signout" type="button" onClick={onSignOut}>Sign out</button>
        <div className="account-sidebar-help"><p>Need assistance?</p><a href="mailto:care@shrutimangesh.com" className="account-link">Contact customer care</a></div>
      </aside>
      <div className="account-content">
        <header className="account-page-heading"><h1>{current.label}</h1><p>{activeTab === 'overview' ? `Welcome back, ${user?.name?.trim().split(' ')[0] || 'there'}.` : current.description}</p></header>
        {children}
      </div>
    </div>
  </div>;
}
