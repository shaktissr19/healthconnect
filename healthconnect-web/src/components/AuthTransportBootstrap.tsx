'use client';

import { useEffect } from 'react';
import axios from 'axios';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.healthconnect.sbs/api/v1';
const SESSION_COOKIE_NAME = 'hc_session';

let configured = false;
let refreshPromise: Promise<void> | null = null;

const hasSessionHint = () => {
  if (typeof document === 'undefined') return false;
  return document.cookie
    .split(';')
    .some((cookie) => cookie.trim() === `${SESSION_COOKIE_NAME}=1`);
};

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

  // Remove only the legacy auth interceptors configured by api.ts. The shared
  // endpoint definitions remain untouched.
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
        url.includes('/auth/verify-email') ||
        url.includes('/auth/change-password');

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

    const validateSession = async () => {
      const state = useAuthStore.getState();
      const shouldValidate = state.isAuthenticated || hasSessionHint();

      if (!shouldValidate) {
        // Local UI state cannot manufacture a session. If neither the persisted
        // UI state nor server-issued non-secret hint exists, remain signed out.
        if (state.isAuthenticated) useAuthStore.getState().clearAuth();
        return;
      }

      try {
        // /auth/me is authoritative. If the access cookie expired, the Axios
        // response interceptor performs one refresh and retries this request.
        const response = await api.get('/auth/me');
        if (cancelled) return;

        const payload = response?.data?.data ?? response?.data;
        if (payload?.id) {
          useAuthStore.getState().setAuth(payload);
        } else {
          useAuthStore.getState().clearAuth();
        }
      } catch {
        if (!cancelled) {
          useAuthStore.getState().clearAuth();
        }
      }
    };

    void validateSession();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
