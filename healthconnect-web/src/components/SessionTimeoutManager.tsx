'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

// HealthConnect browser-session policy:
//   0–13 min idle  : silent
//   13–15 min idle : explicit warning
//   15 min idle    : server logout + local logout
// The backend separately enforces the absolute reauthentication window.
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const WARNING_AT_MS = 13 * 60 * 1000;
const WARNING_DURATION_MS = IDLE_TIMEOUT_MS - WARNING_AT_MS;
const CHECK_INTERVAL_MS = 1000;
const ACTIVITY_WRITE_THROTTLE_MS = 5000;
const LAST_ACTIVITY_KEY = 'hc_last_activity';

const readSharedActivity = (): number => {
  if (typeof window === 'undefined') return Date.now();
  const raw = window.localStorage.getItem(LAST_ACTIVITY_KEY);
  const value = raw ? Number(raw) : NaN;
  return Number.isFinite(value) && value > 0 ? value : Date.now();
};

const writeSharedActivity = (value: number) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LAST_ACTIVITY_KEY, String(value));
};

export default function SessionTimeoutManager() {
  const { isAuthenticated, clearAuth, _hasHydrated } = useAuthStore();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(
    WARNING_DURATION_MS / 1000,
  );
  const [renewing, setRenewing] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastWriteRef = useRef(0);
  const warningRef = useRef(false);
  const logoutStartedRef = useRef(false);

  useEffect(() => {
    warningRef.current = showWarning;
  }, [showWarning]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const performLogout = useCallback(
    async (reason: 'idle' | 'manual') => {
      if (logoutStartedRef.current) return;
      logoutStartedRef.current = true;
      clearTimer();
      setShowWarning(false);

      try {
        await api.post('/auth/logout');
      } catch {
        // Cookies/session may already be expired; local cleanup must still happen.
      } finally {
        clearAuth();
        try {
          window.localStorage.removeItem(LAST_ACTIVITY_KEY);
        } catch {
          // Ignore storage failures during logout.
        }
        window.location.replace(reason === 'idle' ? '/?session=expired' : '/');
      }
    },
    [clearAuth, clearTimer],
  );

  const recordActivity = useCallback(() => {
    // Once the warning is visible, require an explicit Stay Signed In action.
    // This prevents background/accidental mouse movement from renewing a
    // sensitive healthcare session without clear user intent.
    if (warningRef.current) return;

    const now = Date.now();
    if (now - lastWriteRef.current < ACTIVITY_WRITE_THROTTLE_MS) return;
    lastWriteRef.current = now;
    writeSharedActivity(now);
  }, []);

  const handleStaySignedIn = useCallback(async () => {
    if (renewing) return;
    setRenewing(true);

    try {
      // Explicitly rotate/validate the refresh session. The backend preserves
      // the original session start time, so this cannot bypass the absolute
      // reauthentication limit.
      await api.post('/auth/refresh', {});
      const now = Date.now();
      lastWriteRef.current = now;
      writeSharedActivity(now);
      setSecondsRemaining(WARNING_DURATION_MS / 1000);
      setShowWarning(false);
    } catch {
      await performLogout('idle');
    } finally {
      setRenewing(false);
    }
  }, [performLogout, renewing]);

  const handleSignOutNow = useCallback(() => {
    void performLogout('manual');
  }, [performLogout]);

  useEffect(() => {
    if (!_hasHydrated || !isAuthenticated) {
      clearTimer();
      setShowWarning(false);
      logoutStartedRef.current = false;
      return;
    }

    logoutStartedRef.current = false;

    const existing = readSharedActivity();
    if (!window.localStorage.getItem(LAST_ACTIVITY_KEY)) {
      writeSharedActivity(existing);
    }

    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'] as const;
    events.forEach((event) =>
      window.addEventListener(event, recordActivity, { passive: true }),
    );

    // Storage events keep multiple HealthConnect tabs synchronized. The timer
    // intentionally does NOT pause when a tab becomes hidden.
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LAST_ACTIVITY_KEY || warningRef.current) return;
      if (event.newValue) {
        setShowWarning(false);
        setSecondsRemaining(WARNING_DURATION_MS / 1000);
      }
    };
    window.addEventListener('storage', handleStorage);

    clearTimer();
    intervalRef.current = setInterval(() => {
      const lastActivity = readSharedActivity();
      const elapsed = Date.now() - lastActivity;

      if (elapsed >= IDLE_TIMEOUT_MS) {
        void performLogout('idle');
        return;
      }

      if (elapsed >= WARNING_AT_MS) {
        setSecondsRemaining(Math.max(0, Math.ceil((IDLE_TIMEOUT_MS - elapsed) / 1000)));
        setShowWarning(true);
      } else if (warningRef.current) {
        setShowWarning(false);
        setSecondsRemaining(WARNING_DURATION_MS / 1000);
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      events.forEach((event) => window.removeEventListener(event, recordActivity));
      window.removeEventListener('storage', handleStorage);
      clearTimer();
    };
  }, [
    _hasHydrated,
    isAuthenticated,
    clearTimer,
    performLogout,
    recordActivity,
  ]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${remainder.toString().padStart(2, '0')}`;
  };

  if (!isAuthenticated || !showWarning) return null;

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hc-session-warning-title"
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
          animation: 'stmFadeIn 0.25s ease',
        }}
      >
        <div style={{
          background: '#fff', borderRadius: 24, padding: '40px 36px',
          maxWidth: 420, width: '100%',
          boxShadow: '0 24px 80px rgba(15,23,42,0.22)',
          textAlign: 'center', animation: 'stmSlideUp 0.25s ease',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#FFF7ED', border: '2px solid #FED7AA',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, margin: '0 auto 20px',
          }}>
            ⏱️
          </div>

          <h2 id="hc-session-warning-title" style={{
            margin: '0 0 8px', fontSize: 22, fontWeight: 800,
            color: '#0F172A', fontFamily: 'DM Sans, sans-serif',
            letterSpacing: '-0.3px',
          }}>
            Still there?
          </h2>

          <p style={{
            margin: '0 0 24px', fontSize: 14.5, color: '#64748B',
            fontFamily: 'DM Sans, sans-serif', lineHeight: 1.65,
          }}>
            For your privacy, HealthConnect signs you out after 15 minutes of inactivity.
            Confirm that you want to continue this session.
          </p>

          <div style={{
            background: '#FFF7ED', border: '1.5px solid #FED7AA',
            borderRadius: 14, padding: '16px', marginBottom: 24,
          }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: '#92400E',
              fontFamily: 'DM Sans, sans-serif', marginBottom: 6,
              letterSpacing: '0.04em',
            }}>
              SIGNING OUT IN
            </div>
            <div aria-live="polite" style={{
              fontSize: 44, fontWeight: 900, color: '#C2410C',
              fontFamily: 'DM Sans, sans-serif', letterSpacing: '-1px', lineHeight: 1,
            }}>
              {formatTime(secondsRemaining)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
            <button
              onClick={() => void handleStaySignedIn()}
              disabled={renewing}
              autoFocus
              style={{
                width: '100%', padding: '14px',
                background: renewing ? '#94A3B8' : 'linear-gradient(135deg, #0D9488, #14B8A6)',
                border: 'none', borderRadius: 12, color: '#fff',
                fontSize: 15, fontWeight: 700,
                cursor: renewing ? 'wait' : 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                boxShadow: '0 4px 16px rgba(20,184,166,0.3)',
              }}
            >
              {renewing ? 'Checking session…' : '✓ Stay Signed In'}
            </button>

            <button
              onClick={handleSignOutNow}
              disabled={renewing}
              style={{
                width: '100%', padding: '13px', background: '#fff',
                border: '1.5px solid #E2E8F0', borderRadius: 12,
                color: '#64748B', fontSize: 14, fontWeight: 600,
                cursor: renewing ? 'not-allowed' : 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              Sign Out Now
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes stmFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes stmSlideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
      `}</style>
    </>
  );
}
