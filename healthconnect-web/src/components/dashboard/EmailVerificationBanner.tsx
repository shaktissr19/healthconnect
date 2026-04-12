'use client';
// src/components/dashboard/EmailVerificationBanner.tsx
// FIXED:
//   1. Single state machine (idle|sending|sent|error) — no more dual booleans
//      that could show "✓ Sent" and "Resend" simultaneously.
//   2. Auto-sends ONE verification email when a new unverified user first
//      arrives on the dashboard — stored in sessionStorage so it only fires
//      once per browser session, not on every navigation.
//   3. useAuthStore called only at top level (no hook inside handler).
//   4. Handles ALREADY_VERIFIED gracefully — updates store and hides banner.

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/lib/api';

type State = 'idle' | 'sending' | 'sent' | 'error';

export default function EmailVerificationBanner() {
  const user  = useAuthStore(s => (s as any).user);
  const store = useAuthStore.getState() as any;

  const [state,     setState]     = useState<State>('idle');
  const [dismissed, setDismissed] = useState(false);
  const [errMsg,    setErrMsg]    = useState('');
  const autoFired = useRef(false);

  // Auto-send once per session when a new unverified user lands on dashboard
  useEffect(() => {
    if (!user || user.isEmailVerified || dismissed || autoFired.current) return;
    const key = `hc_vsent_${user.id ?? user.email}`;
    if (sessionStorage.getItem(key)) return;
    autoFired.current = true;
    sessionStorage.setItem(key, '1');
    // Fire silently — don't update banner state (user hasn't asked yet)
    authAPI.resendVerification().catch(() => {});
  }, [user, dismissed]);

  if (!user || user.isEmailVerified || dismissed) return null;

  const handleResend = async () => {
    if (state === 'sending' || state === 'sent') return;
    setState('sending');
    setErrMsg('');
    try {
      await authAPI.resendVerification();
      setState('sent');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? '';
      if (msg.includes('ALREADY_VERIFIED') || msg.includes('already verified')) {
        // Already verified — update auth store and hide
        if (store.setAuth && store.token) {
          store.setAuth({ ...user, isEmailVerified: true }, store.token);
        }
        setDismissed(true);
        return;
      }
      setErrMsg('Could not send. Please try again.');
      setState('error');
    }
  };

  return (
    <div style={{
      background: '#FFFBEB',
      borderBottom: '1px solid #FDE68A',
      padding: '10px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
      fontSize: 13,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16 }}>📧</span>
        <span style={{ color: '#92400E', fontWeight: 600 }}>
          Please verify your email address
        </span>
        <span style={{ color: '#B45309' }}>
          — check your inbox at <strong>{user.email}</strong> for the verification link.
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* One state at a time — never both "Sent" and "Resend" */}
        {state === 'sent' && (
          <span style={{ fontSize: 12, color: '#15803D', fontWeight: 600 }}>
            ✓ Verification email sent — check your inbox
          </span>
        )}
        {state === 'error' && (
          <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>
            {errMsg}
          </span>
        )}
        {(state === 'idle' || state === 'error') && (
          <button
            onClick={handleResend}
            style={{
              padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: '#0D9488', color: '#fff',
              border: 'none', cursor: 'pointer',
            }}
          >
            {state === 'error' ? 'Try Again' : 'Resend Email'}
          </button>
        )}
        {state === 'sending' && (
          <span style={{ fontSize: 12, color: '#B45309', fontWeight: 600 }}>
            Sending…
          </span>
        )}
        <button
          onClick={() => setDismissed(true)}
          style={{ background: 'none', border: 'none', color: '#B45309', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}
          title="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
