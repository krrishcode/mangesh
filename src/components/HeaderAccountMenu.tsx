'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DropdownMenu } from 'radix-ui';
import { useAuthStore } from '../stores/authStore';
import { clearAccountDataCache } from '../react/user/useAccountData';

const accountLinks = [
  { label: 'My Account', href: '/account' },
  { label: 'Profile', href: '/account/profile' },
  { label: 'My Orders', href: '/account/orders' },
  { label: 'Wishlist', href: '/account/wishlist' },
  { label: 'Saved Addresses', href: '/account/addresses' },
  { label: 'Appointments', href: '/account/appointments' },
];

export function HeaderAccountMenu({ open, onOpenChange, hydrated }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hydrated: boolean;
}) {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const authenticated = useAuthStore(state => state.isAuthenticated);
  const signedIn = hydrated && authenticated && Boolean(user);
  return <div className="site-account-menu">
    <DropdownMenu.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="site-header-account site-icon-button" aria-label="Account options">
          <svg className="site-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M5 21v-2a7 7 0 0 1 14 0v2" />
          </svg>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content className="site-account-dropdown" align="end" sideOffset={8} collisionPadding={16} loop aria-label="Account options">
        <DropdownMenu.Arrow className="site-account-dropdown-arrow" width={14} height={7} />
        {signedIn ? <DropdownMenu.Label className="site-account-greeting">Hi, {user?.name}</DropdownMenu.Label> : (
          <DropdownMenu.Item asChild>
            <Link className="site-account-signin" href="/login?next=%2Faccount">Log In / Sign Up</Link>
          </DropdownMenu.Item>
        )}
        {accountLinks.map(link => <DropdownMenu.Item key={link.href} asChild>
          <Link className="site-account-item" href={link.href}>{link.label}</Link>
        </DropdownMenu.Item>)}
        <DropdownMenu.Separator className="site-account-divider" />
        <DropdownMenu.Item asChild><Link className="site-account-item" href="/#contact-us">Contact Us</Link></DropdownMenu.Item>
        {signedIn && <DropdownMenu.Item className="site-account-item site-account-logout" onSelect={() => {
          clearAccountDataCache();
          useAuthStore.getState().logout();
          router.replace('/login');
        }}>Log Out</DropdownMenu.Item>}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>;
}
