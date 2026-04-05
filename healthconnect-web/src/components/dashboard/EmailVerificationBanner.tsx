'use client';
// src/components/dashboard/EmailVerificationBanner.tsx
// Shows a dismissible banner in the patient/doctor dashboard
// when the user's email is not yet verified.
// Import and place at the top of dashboard/layout.tsx and doctor-dashboard/layout.tsx
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/lib/api';

export default function EmailVerificationBanner() {
  const user = useAuthStore(s => (s as any).user);
  const [sending, setSending]       = useState(false);
  const [sent, setSent]             = useState(false);
  const [dismissed, setDismissed]   = useState(false);

  // Don't show if: email verified, no user, or dismissed this session
  if (!user || user.isEmailVerified || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await authAPI.resendVerification();
      setSent(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || '';
      if (msg.includes('ALREADY_VERIFIED')) {
        // Update store and hide banner
        const store = useAuthStore.getState() as any;
        store.setAuth({ ...user, isEmailVerified: true }, store.token);
        setDismissed(true);
      }
    } finally {
      setSending(false);
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
        {sent ? (
          <span style={{ fontSize: 12, color: '#15803D', fontWeight: 600 }}>
            ✓ Verification email sent
          </span>
        ) : (
          <button
            onClick={handleResend}
            disabled={sending}
            style={{
              padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: sending ? '#F3F4F6' : '#0D9488',
              color: sending ? '#9CA3AF' : '#fff',
              border: 'none', cursor: sending ? 'not-allowed' : 'pointer',
            }}
          >
            {sending ? 'Sending…' : 'Resend Email'}
          </button>
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
