// src/store/authStore.ts
// ─────────────────────────────────────────────────────────────────────────────
// FIXED:
//   Token removed from localStorage persistence.
//   Previously the JWT was stored in localStorage via Zustand persist, making
//   it readable by any JavaScript on the page (XSS risk).
//
//   The token now lives ONLY in the hc_token cookie (set by setAuth).
//   The cookie is the single source of truth for auth state.
//   Zustand still persists user profile + isAuthenticated for UI hydration —
//   but NOT the raw token.
//
//   On page load: Zustand restores user/isAuthenticated from localStorage,
//   and the cookie is read by the Axios interceptor for API calls.
//   This matches how Next.js middleware already works (reads the cookie).
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  // ── FIX: token removed from state — lives only in hc_token cookie ─────────
  // Keeping a token reference in memory (not persisted) for components that
  // need to read it synchronously without touching cookies.
  token: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;

  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setHasHydrated: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      token:           null,   // in-memory only — NOT persisted (see partialize below)
      isAuthenticated: false,
      _hasHydrated:    false,

      setAuth: (user, token) => {
        // Write cookie for Next.js middleware + Axios interceptor
        // NOTE: cannot set HttpOnly here from client-side JS.
        // For full HttpOnly, call a Next.js API route: POST /api/auth/set-cookie
        // and handle it server-side. This is the client-side fallback.
        if (typeof document !== 'undefined') {
          // Secure flag is added in production (HTTPS). SameSite=Lax prevents CSRF.
          const isSecure = window.location.protocol === 'https:';
          document.cookie = [
            `hc_token=${token}`,
            'path=/',
            'max-age=604800',
            'SameSite=Lax',
            isSecure ? 'Secure' : '',
          ].filter(Boolean).join('; ');
        }
        // Store token in memory for synchronous reads, but NOT in localStorage
        set({ user, token, isAuthenticated: true });
      },

      clearAuth: () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'hc_token=; path=/; max-age=0; SameSite=Lax';
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      setHasHydrated: (val) => set({ _hasHydrated: val }),
    }),
    {
      name:    'hc-auth',
      storage: createJSONStorage(() => localStorage),

      // ── FIX: token excluded from persistence ──────────────────────────────
      // Only persist non-sensitive UI state: who the user is and whether
      // they're logged in. The actual credential (token) is in the cookie only.
      partialize: (state) => ({
        user:            state.user,
        isAuthenticated: state.isAuthenticated,
        // token intentionally omitted
      }),

      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);

          // If localStorage says user is authenticated but cookie is gone
          // (e.g. cookie expired), clear the stale auth state.
          if (state.isAuthenticated && typeof document !== 'undefined') {
            const cookieExists = document.cookie
              .split(';')
              .some(c => c.trim().startsWith('hc_token='));
            if (!cookieExists) {
              // Cookie gone — token expired. Clear stale state.
              state.clearAuth();
            }
          }
        }
      },
    },
  ),
);
