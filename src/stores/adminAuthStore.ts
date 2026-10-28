import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserDto } from '../types';

interface AdminAuthState {
  user: UserDto | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserDto, token: string) => void;
  logout: () => void;
}

// Keep console sign-in independent from the customer's shopping session.
export const useAdminAuthStore = create<AdminAuthState>()(persist((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setAuth: (user, token) => {
    if (user.role !== 'admin') return;
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    const token = get().token;
    if (token && typeof window !== 'undefined') void fetch('/api/account/auth/logout', {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    set({ user: null, token: null, isAuthenticated: false });
  },
}), { name: 'ecommerce-admin-auth-storage' }));
