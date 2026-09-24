'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../stores/authStore';

export type Tab = 'overview' | 'orders' | 'appointments' | 'wishlist' | 'profile' | 'addresses';

interface LayoutProps {
  activeTab: Tab;
  children: React.ReactNode;
}

export const UserPortalLayout: React.FC<LayoutProps> = ({ activeTab, children }) => {
  const { logout, token } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !token && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, [token, hydrated]);

  if (!hydrated || !token) return null;

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const tabs: { id: Tab; label: string; href: string }[] = [
    { id: 'overview', label: 'Overview', href: '/account' },
    { id: 'orders', label: 'Order History', href: '/account/orders' },
    { id: 'appointments', label: 'Bespoke Appointments', href: '/account/appointments' },
    { id: 'wishlist', label: 'Wishlist', href: '/account/wishlist' },
    { id: 'profile', label: 'Profile & Measurements', href: '/account/profile' },
    { id: 'addresses', label: 'Address Book', href: '/account/addresses' },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8">
      <div className="flex flex-col md:grid md:grid-cols-4 gap-8">
        
        {/* Left Sidebar */}
        <aside className="md:col-span-1 sticky top-[100px] self-start border border-[#EAE3DB] bg-white p-6 pb-2">
          <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible gap-2 md:gap-0 font-sans-clean font-light text-sm tracking-widest text-[#333333] uppercase whitespace-nowrap md:whitespace-normal">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <a
                  key={tab.id}
                  href={tab.href}
                  className={`block px-4 py-3 md:py-4 border-b-2 md:border-b-0 md:border-l-2 transition-colors duration-200 ${
                    isActive 
                      ? 'border-[#4A0E17] text-[#4A0E17] font-medium' 
                      : 'border-transparent text-gray-500 hover:text-[#333333]'
                  }`}
                >
                  {tab.label}
                </a>
              );
            })}
            <button onClick={handleLogout} className="text-left px-4 py-3 md:py-4 mt-4 md:mt-8 text-gray-400 hover:text-[#333333] transition-colors border-b-2 md:border-b-0 md:border-l-2 border-transparent">
              Logout
            </button>
          </nav>
        </aside>

        {/* Right Content Area */}
        <div className="md:col-span-3 min-h-[500px]">
          {children}
        </div>
        
      </div>
    </div>
  );
};
