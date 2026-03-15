'use client';
// src/hooks/useIdleLogout.ts
// Logs out the user after IDLE_MS of no click activity
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const IDLE_MS = 15 * 60 * 1000; // 15 minutes

export function useIdleLogout() {
  const router  = useRouter();
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only activate when the user is authenticated
    const { isAuthenticated } = useAuthStore.getState() as any;
    if (!isAuthenticated) return;

    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        // Logout
        (useAuthStore.getState() as any).clearAuth();
        router.replace('/');
      }, IDLE_MS);
    };

    // Start the timer
    reset();

    // Only clicks reset the timer
    window.addEventListener('click', reset, { passive: true });

    return () => {
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener('click', reset);
    };
  }, [router]);
}
