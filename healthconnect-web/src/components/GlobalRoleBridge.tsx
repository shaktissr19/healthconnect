'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * Exposes the hydrated application role as a document-level data attribute.
 * This keeps shared public/private navigation styling role-aware without
 * coupling individual pages to authentication implementation details.
 */
export default function GlobalRoleBridge() {
  useEffect(() => {
    const apply = (state: any) => {
      const role = state?.isAuthenticated ? String(state?.user?.role ?? '').toUpperCase() : '';
      if (role) document.documentElement.dataset.hcRole = role;
      else delete document.documentElement.dataset.hcRole;
    };

    apply(useAuthStore.getState() as any);
    const unsub = (useAuthStore as any).subscribe((state: any) => apply(state));

    return () => {
      unsub?.();
      delete document.documentElement.dataset.hcRole;
    };
  }, []);

  return null;
}
