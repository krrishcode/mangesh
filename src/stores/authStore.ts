import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserDto } from '../types';
import { useAdminAuthStore } from './adminAuthStore';

interface AuthState {
  user: UserDto | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserDto, token: string) => void;
  logout: () => void;
}

let migratingLegacyAdmin = false;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user: UserDto, token: string) => {
        if (user.role === 'admin') {
          useAdminAuthStore.getState().setAuth(user, token);
          return;
        }
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
      merge: (persisted, current) => {
        const saved = persisted as Partial<AuthState> | undefined;
        if (saved?.user?.role === 'admin' && saved.token) {
          // Migrate the former shared console session without revoking it.
          if (!useAdminAuthStore.getState().token) useAdminAuthStore.getState().setAuth(saved.user, saved.token);
          migratingLegacyAdmin = true;
          return { ...current, user: null, token: null, isAuthenticated: false };
        }
        return { ...current, ...saved };
      },
      onRehydrateStorage: () => state => {
        if (migratingLegacyAdmin && state) {
          migratingLegacyAdmin = false;
          state.logout();
        }
      },
    }
  )
);
