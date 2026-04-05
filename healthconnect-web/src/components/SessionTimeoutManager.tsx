'use client';
// src/components/SessionTimeoutManager.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Mounts in root layout.tsx — runs on ALL pages.
// Only activates when user is authenticated (isAuthenticated === true).
//
// Flow:
//   0–10 min inactivity  → silent timer
//   At 10 min            → warning modal with live countdown
//   Warning modal        → "Stay Signed In" resets timer | "Sign Out Now" logs out
//   Any activity         → resets timer, dismisses warning if showing
//   At 15 min            → clearAuth() + navigate to / + inactivity toast
//   Tab hidden           → timer pauses, resumes when tab visible
//
// Inactivity = no mousemove, keydown, scroll, touchstart, click
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

const TIMEOUT_MS       = 15 * 60 * 1000;  // 15 minutes total
const WARNING_AT_MS    = 10 * 60 * 1000;  // Show warning at 10 minutes
const WARNING_DURATION = TIMEOUT_MS - WARNING_AT_MS;  // 5 minutes warning window
const TICK_MS          = 1000;  // Check every second

export default function SessionTimeoutManager() {
  const { isAuthenticated, clearAuth, _hasHydrated } = useAuthStore();

  const [showWarning,       setShowWarning]       = useState(false);
  const [secondsRemaining,  setSecondsRemaining]  = useState(WARNING_DURATION / 1000);

  const lastActivityRef  = useRef<number>(Date.now());
  const intervalRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const isHiddenRef      = useRef<boolean>(false);
  const hiddenAtRef      = useRef<number>(0);

  // ── Reset activity timestamp on any user interaction ─────────────────────
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showWarning) {
      setShowWarning(false);
      setSecondsRemaining(WARNING_DURATION / 1000);
    }
  }, [showWarning]);

  // ── Logout due to inactivity ──────────────────────────────────────────────
  const handleTimeout = useCallback(() => {
    setShowWarning(false);
    clearAuth();
    // Show inactivity message via URL param — picked up by home page or toast
    window.location.replace('/?session=expired');
  }, [clearAuth]);

  // ── Stay signed in ────────────────────────────────────────────────────────
  const handleStaySignedIn = useCallback(() => {
    resetActivity();
    setShowWarning(false);
    setSecondsRemaining(WARNING_DURATION / 1000);
  }, [resetActivity]);

  // ── Sign out now ─────────────────────────────────────────────────────────
  const handleSignOutNow = useCallback(() => {
    setShowWarning(false);
    clearAuth();
    window.location.replace('/');
  }, [clearAuth]);

  // ── Main timer effect — runs when authenticated ───────────────────────────
  useEffect(() => {
    if (!_hasHydrated || !isAuthenticated) {
      // Clear any running timer when logged out
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setShowWarning(false);
      return;
    }

    // Activity events to track
    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(ev => window.addEventListener(ev, resetActivity, { passive: true }));

    // Tab visibility change — pause timer when hidden
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        isHiddenRef.current = true;
        hiddenAtRef.current = Date.now();
      } else {
        if (isHiddenRef.current) {
          // Add the time the tab was hidden to last activity
          // so we don't time out a user who switched tabs briefly
          const hiddenFor = Date.now() - hiddenAtRef.current;
          lastActivityRef.current += hiddenFor;
          isHiddenRef.current = false;
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Reset activity on mount
    lastActivityRef.current = Date.now();

    // Main interval — checks inactivity every second
    intervalRef.current = setInterval(() => {
      if (isHiddenRef.current) return; // Paused while tab is hidden

      const elapsed = Date.now() - lastActivityRef.current;

      if (elapsed >= TIMEOUT_MS) {
        // Hard logout
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        handleTimeout();
        return;
      }

      if (elapsed >= WARNING_AT_MS) {
        // Show warning and count down remaining seconds
        const remaining = Math.ceil((TIMEOUT_MS - elapsed) / 1000);
        setSecondsRemaining(remaining);
        setShowWarning(true);
      } else {
        // Still in safe zone — hide warning if somehow showing
        if (showWarning) setShowWarning(false);
      }
    }, TICK_MS);

    return () => {
      events.forEach(ev => window.removeEventListener(ev, resetActivity));
      document.removeEventListener('visibilitychange', handleVisibility);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [_hasHydrated, isAuthenticated, resetActivity, handleTimeout, showWarning]);

  // Format seconds as MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Don't render anything if not authenticated or warning not showing
  if (!isAuthenticated || !showWarning) return null;

  return (
    <>
      {/* ── Warning Modal Overlay ─────────────────────────────────────── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'stmFadeIn 0.25s ease',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 24,
          padding: '40px 36px',
          maxWidth: 420, width: '100%',
          boxShadow: '0 24px 80px rgba(15,23,42,0.22)',
          textAlign: 'center',
          animation: 'stmSlideUp 0.25s ease',
        }}>
          {/* Icon */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#FFF7ED', border: '2px solid #FED7AA',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, margin: '0 auto 20px',
          }}>
            ⏱️
          </div>

          {/* Heading */}
          <h2 style={{
            margin: '0 0 8px',
            fontSize: 22, fontWeight: 800, color: '#0F172A',
            fontFamily: 'DM Sans, sans-serif', letterSpacing: '-0.3px',
          }}>
            Still there?
          </h2>

          {/* Subtitle */}
          <p style={{
            margin: '0 0 24px',
            fontSize: 14.5, color: '#64748B',
            fontFamily: 'DM Sans, sans-serif', lineHeight: 1.65,
          }}>
            You've been inactive for a while. For your security, you'll be signed out automatically.
          </p>

          {/* Countdown */}
          <div style={{
            background: '#FFF7ED',
            border: '1.5px solid #FED7AA',
            borderRadius: 14, padding: '16px',
            marginBottom: 24,
          }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: '#92400E',
              fontFamily: 'DM Sans, sans-serif', marginBottom: 6,
              letterSpacing: '0.04em',
            }}>
              SIGNING OUT IN
            </div>
            <div style={{
              fontSize: 44, fontWeight: 900, color: '#C2410C',
              fontFamily: 'DM Sans, sans-serif', letterSpacing: '-1px',
              lineHeight: 1,
            }}>
              {formatTime(secondsRemaining)}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
            <button
              onClick={handleStaySignedIn}
              style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, #0D9488, #14B8A6)',
                border: 'none', borderRadius: 12,
                color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                boxShadow: '0 4px 16px rgba(20,184,166,0.3)',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = ''}>
              ✓ Stay Signed In
            </button>
            <button
              onClick={handleSignOutNow}
              style={{
                width: '100%', padding: '13px',
                background: '#fff', border: '1.5px solid #E2E8F0',
                borderRadius: 12, color: '#64748B',
                fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '#FECACA';
                (e.currentTarget as HTMLElement).style.color = '#DC2626';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0';
                (e.currentTarget as HTMLElement).style.color = '#64748B';
              }}>
              Sign Out Now
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes stmFadeIn   { from { opacity: 0 } to { opacity: 1 } }
        @keyframes stmSlideUp  { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
      `}</style>
    </>
  );
}
