'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.healthconnect.sbs/api/v1';

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
  // Kept temporarily for source compatibility with older components.
  // Credentials are no longer stored in Zustand and this remains null.
  token: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;

  setAuth: (user: User, legacyToken?: string) => void;
  clearAuth: () => void;
  setHasHydrated: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,

      // The optional second argument is accepted only so existing callers do not
      // break during migration. It is intentionally ignored.
      setAuth: (user, _legacyToken) => {
        set({ user, token: null, isAuthenticated: true });
      },

      clearAuth: () => {
        const hadSession = get().isAuthenticated;
        set({ user: null, token: null, isAuthenticated: false });

        // Existing dashboard components already call clearAuth() for sign-out.
        // Keep those callers working while ensuring the HttpOnly refresh session
        // is also revoked server-side. Logout is idempotent and cookie-aware.
        if (hadSession && typeof window !== 'undefined') {
          void fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
          }).catch(() => undefined);
        }
      },

      setHasHydrated: (val) => set({ _hasHydrated: val }),
    }),
    {
      name: 'hc-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

// Patient profile updates happen inside the persistent dashboard shell. Keep
// display identity synchronized without requiring a page refresh or re-login.
if (typeof window !== 'undefined') {
  window.addEventListener('hc:patient-profile-updated', (event: Event) => {
    const profile = (event as CustomEvent)?.detail;
    const current = useAuthStore.getState().user;
    if (!profile || !current || current.role !== 'PATIENT') return;
    useAuthStore.setState({
      user: {
        ...current,
        firstName: profile.firstName ?? current.firstName,
        lastName: profile.lastName ?? current.lastName,
      },
    });
  });
}
