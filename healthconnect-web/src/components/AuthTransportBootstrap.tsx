'use client';

import { useEffect } from 'react';
import axios from 'axios';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.healthconnect.sbs/api/v1';

let configured = false;
let refreshPromise: Promise<void> | null = null;

const redirectToLoginIfNeeded = () => {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname;
  if (
    path.startsWith('/dashboard') ||
    path.startsWith('/doctor-dashboard') ||
    path.startsWith('/hospital-dashboard') ||
    path.startsWith('/admin-dashboard')
  ) {
    window.location.href = '/';
  }
};

const configureAxiosTransport = () => {
  if (configured) return;
  configured = true;

  api.defaults.withCredentials = true;

  // Remove the legacy hc_token request/response interceptors defined in api.ts.
  // Axios 1.x exposes clear() on the interceptor managers. This lets us migrate
  // authentication without rewriting the large shared API contract in one step.
  api.interceptors.request.clear();
  api.interceptors.response.clear();

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config as (typeof error.config & { _hcRetry?: boolean }) | undefined;
      const status = error.response?.status;
      const url = String(original?.url || '');

      const isAuthEndpoint =
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/refresh') ||
        url.includes('/auth/forgot-password') ||
        url.includes('/auth/reset-password') ||
        url.includes('/auth/verify-email');

      if (status !== 401 || !original || original._hcRetry || isAuthEndpoint) {
        return Promise.reject(error);
      }

      original._hcRetry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true, timeout: 15000 })
            .then(() => undefined)
            .finally(() => {
              refreshPromise = null;
            });
        }

        await refreshPromise;
        return api(original);
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
        redirectToLoginIfNeeded();
        return Promise.reject(refreshError);
      }
    },
  );
};

configureAxiosTransport();

export default function AuthTransportBootstrap() {
  useEffect(() => {
    let cancelled = false;

    const validatePersistedSession = async () => {
      const state = useAuthStore.getState();
      if (!state.isAuthenticated) return;

      try {
        const response = await api.get('/auth/me');
        if (cancelled) return;
        const payload = response?.data?.data ?? response?.data;
        if (payload?.id) {
          useAuthStore.getState().setAuth(payload);
        }
      } catch {
        if (!cancelled) {
          useAuthStore.getState().clearAuth();
        }
      }
    };

    void validatePersistedSession();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
