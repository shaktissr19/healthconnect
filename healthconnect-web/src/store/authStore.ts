import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ── Types ──────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  registrationId?: string;
  subscriptionTier?: string;
  isEmailVerified?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // ← KEY FIX: tracks when Zustand has finished reading from localStorage
  _hasHydrated: boolean;

  // Actions
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setHasHydrated: (val: boolean) => void;
}

// ── Store ──────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      token:           null,
      isAuthenticated: false,
      _hasHydrated:    false,   // starts false — set to true by onRehydrateStorage

      setAuth: (user, token) => {
        // Also write cookie so Next.js middleware can read it server-side
        if (typeof document !== 'undefined') {
          document.cookie = `hc_token=${token}; path=/; max-age=604800; SameSite=Lax`;
        }
        set({ user, token, isAuthenticated: true });
      },

      clearAuth: () => {
        // Remove cookie
        if (typeof document !== 'undefined') {
          document.cookie = 'hc_token=; path=/; max-age=0';
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      setHasHydrated: (val) => set({ _hasHydrated: val }),
    }),
    {
      name:    'hc-auth',
      storage: createJSONStorage(() => localStorage),

      // Only persist these fields — NOT _hasHydrated (it's always computed)
      partialize: (state) => ({
        user:            state.user,
        token:           state.token,
        isAuthenticated: state.isAuthenticated,
      }),

      // ← KEY FIX: fires after localStorage has been read and state restored
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);

          // Extra safety: if we have a token, sync it to cookie
          // (handles case where cookie expired but localStorage still has token)
          if (state.token && typeof document !== 'undefined') {
            document.cookie = `hc_token=${state.token}; path=/; max-age=604800; SameSite=Lax`;
          }
        }
      },
    }
  )
);
