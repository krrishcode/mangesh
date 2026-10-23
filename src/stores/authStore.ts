import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserDto } from '../types';

interface AuthState {
  user: UserDto | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserDto, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user: UserDto, token: string) => {
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        const token = get().token;
        if (token && typeof window !== 'undefined') void fetch('/api/account/auth/logout', { method: 'POST', headers: { Authorization: 'Bearer ' + token } }).catch(() => {});
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'ecommerce-auth-storage',
    }
  )
);
