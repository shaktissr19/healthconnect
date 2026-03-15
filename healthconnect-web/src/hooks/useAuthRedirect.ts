// src/hooks/useAuthRedirect.ts
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for post-login routing.
//
// Usage in login handler:
//   import { redirectByRole } from '@/hooks/useAuthRedirect';
//   ...
//   const { user, token } = response.data.data;
//   useAuthStore.getState().setAuth(user, token);
//   redirectByRole(user.role, router);
//
// Usage as hook (in layout components):
//   const { redirectIfWrongDashboard } = useAuthRedirect();
//   useEffect(() => { redirectIfWrongDashboard('PATIENT'); }, []);
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback } from 'react';
import { useRouter }   from 'next/navigation';

export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN' | string;

/**
 * Maps a role to its dashboard route.
 */
export function getDashboardRoute(role: UserRole): string {
  switch (role?.toUpperCase()) {
    case 'DOCTOR': return '/doctor-dashboard';
    case 'ADMIN':  return '/admin';
    default:       return '/dashboard';      // PATIENT + anything unknown
  }
}

/**
 * Imperative redirect — call directly in login handlers (no hook needed).
 * e.g. redirectByRole(user.role, router)
 */
export function redirectByRole(role: UserRole, router: ReturnType<typeof useRouter>): void {
  router.replace(getDashboardRoute(role));
}

/**
 * Hook version for layout-level guards.
 */
export function useAuthRedirect() {
  const router = useRouter();

  /**
   * Call inside a layout to kick out wrong-role users.
   * @param expectedRole  The role this dashboard is for ('PATIENT' | 'DOCTOR')
   * @param currentRole   The logged-in user's role (pass user?.role)
   */
  const redirectIfWrongDashboard = useCallback(
    (expectedRole: UserRole, currentRole: UserRole | undefined | null) => {
      if (!currentRole) return;                           // not hydrated yet — wait
      const expected = expectedRole.toUpperCase();
      const current  = currentRole.toUpperCase();
      if (current === expected) return;                   // correct dashboard — do nothing
      router.replace(getDashboardRoute(current));         // wrong dashboard — redirect
    },
    [router]
  );

  return { redirectIfWrongDashboard, redirectByRole: (role: UserRole) => redirectByRole(role, router) };
}
