'use client';
// src/app/verify-email/page.tsx
// FIX: useSearchParams wrapped in Suspense (Next.js 16 requirement)
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '@/lib/api';

function VerifyEmailContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token') || '';

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError]   = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent]       = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Invalid or missing verification link. Please request a new one from your dashboard.');
      return;
    }
    authAPI.verifyEmail({ token })
      .then(() => {
        setStatus('success');
        setTimeout(() => router.push('/'), 4000);
      })
      .catch((err: any) => {
        setStatus('error');
        setError(err?.response?.data?.message || 'This verification link has expired or is invalid.');
      });
  }, [token, router]);

  const handleResend = async () => {
    setResending(true);
    try {
      await authAPI.resendVerification();
      setResent(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || '';
      if (msg.includes('ALREADY_VERIFIED')) {
        setStatus('success');
      } else {
        alert('Could not resend. Please sign in and try from your dashboard settings.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 460 }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#0D9488,#14B8A6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff' }}>H</div>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#0A1628', fontFamily: 'Poppins, sans-serif' }}>HealthConnect India</span>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, padding: '48px 32px', boxShadow: '0 4px 24px rgba(12,26,58,0.08)', border: '1px solid #C7D7F5', textAlign: 'center' }}>

        {/* VERIFYING */}
        {status === 'verifying' && (
          <>
            <div style={{ width: 52, height: 52, border: '4px solid #E2EAF4', borderTop: '4px solid #0D9488', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 24px' }} />
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0A1628', margin: '0 0 8px', fontFamily: 'Poppins, sans-serif' }}>Verifying your email…</h2>
            <p style={{ fontSize: 14, color: '#4A5E7A', margin: 0 }}>Please wait a moment.</p>
          </>
        )}

        {/* SUCCESS */}
        {status === 'success' && (
          <>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F0FDF4', border: '2px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 20px' }}>✅</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0A1628', margin: '0 0 12px', fontFamily: 'Poppins, sans-serif' }}>Email verified!</h2>
            <p style={{ fontSize: 14, color: '#4A5E7A', margin: '0 0 8px', lineHeight: 1.7 }}>
              Your email has been successfully verified.
            </p>
            <p style={{ fontSize: 13, color: '#7A8FA8', margin: '0 0 28px' }}>
              You now have full access to HealthConnect India. Redirecting in a moment…
            </p>

            {/* What's unlocked */}
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#15803D', marginBottom: 10, letterSpacing: '0.06em' }}>✓ YOUR ACCOUNT IS NOW FULLY ACTIVE</div>
              {['Book appointments with verified doctors', 'Track your health score and vitals', 'Upload and share medical reports', 'Join health communities'].map(item => (
                <div key={item} style={{ fontSize: 13, color: '#166534', padding: '4px 0', display: 'flex', gap: 8 }}>
                  <span>•</span>{item}
                </div>
              ))}
            </div>

            <button onClick={() => router.push('/')} style={{ width: '100%', padding: '13px', borderRadius: 10, background: 'linear-gradient(135deg,#0D9488,#14B8A6)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Sign In to Your Dashboard →
            </button>
          </>
        )}

        {/* ERROR */}
        {status === 'error' && (
          <>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#FFF5F5', border: '2px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 20px' }}>⚠️</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0A1628', margin: '0 0 12px', fontFamily: 'Poppins, sans-serif' }}>Verification failed</h2>
            <p style={{ fontSize: 14, color: '#4A5E7A', margin: '0 0 24px', lineHeight: 1.7 }}>{error}</p>

            {!resent ? (
              <button
                onClick={handleResend}
                disabled={resending}
                style={{ width: '100%', padding: '13px', borderRadius: 10, background: resending ? '#E2EAF4' : 'linear-gradient(135deg,#0D9488,#14B8A6)', color: resending ? '#7A8FA8' : '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: resending ? 'not-allowed' : 'pointer', marginBottom: 10 }}
              >
                {resending ? 'Sending…' : 'Send New Verification Email'}
              </button>
            ) : (
              <div style={{ padding: '12px 16px', borderRadius: 10, background: '#F0FDF4', border: '1px solid #BBF7D0', marginBottom: 10 }}>
                <p style={{ fontSize: 13, color: '#15803D', margin: 0, fontWeight: 600 }}>✓ New verification email sent — check your inbox</p>
              </div>
            )}

            <button onClick={() => router.push('/')} style={{ width: '100%', padding: '11px', borderRadius: 10, background: 'none', border: '1.5px solid #C7D7F5', color: '#1E3A6E', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Back to Sign In
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F0F4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: 'Nunito, sans-serif' }}>
      <Suspense fallback={
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '4px solid #C7D7F5', borderTop: '4px solid #0D9488', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
