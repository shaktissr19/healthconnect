'use client';
// src/app/forgot-password/page.tsx
// No useSearchParams here — no Suspense needed
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router  = useRouter();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true); setError('');
    try {
      await authAPI.forgotPassword({ email: email.trim() });
      setSent(true);
    } catch {
      // Always show success — don't reveal if email exists
      setSent(true);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#0D9488,#14B8A6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff' }}>H</div>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#0A1628', fontFamily: 'Poppins, sans-serif' }}>HealthConnect India</span>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: '36px 32px', boxShadow: '0 4px 24px rgba(12,26,58,0.08)', border: '1px solid #C7D7F5' }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>📧</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0A1628', margin: '0 0 12px', fontFamily: 'Poppins, sans-serif' }}>Check your email</h2>
              <p style={{ fontSize: 14, color: '#4A5E7A', lineHeight: 1.7, margin: '0 0 24px' }}>
                If an account exists for <strong style={{ color: '#0A1628' }}>{email}</strong>, you will receive a password reset link within a few minutes.
              </p>
              <p style={{ fontSize: 13, color: '#7A8FA8', marginBottom: 24 }}>Check your spam folder if you don't see it.</p>
              <button onClick={() => router.push('/')} style={{ width: '100%', padding: '13px', borderRadius: 10, background: 'linear-gradient(135deg,#0D9488,#14B8A6)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0A1628', margin: '0 0 8px', fontFamily: 'Poppins, sans-serif' }}>Forgot your password?</h2>
              <p style={{ fontSize: 14, color: '#4A5E7A', margin: '0 0 28px', lineHeight: 1.6 }}>Enter your email address and we'll send you a link to reset your password.</p>

              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E3A6E', marginBottom: 6 }}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="your@email.com"
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #A8C0E8', background: '#F8FAFF', color: '#0A1628', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, marginBottom: 8 }} />

              {error && <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: 'rgba(190,18,60,0.06)', border: '1px solid rgba(190,18,60,0.2)', color: '#BE123C', fontSize: 13 }}>⚠️ {error}</div>}

              <button onClick={handleSubmit} disabled={loading}
                style={{ width: '100%', padding: '13px', borderRadius: 10, background: loading ? '#E2EAF4' : 'linear-gradient(135deg,#0D9488,#14B8A6)', color: loading ? '#7A8FA8' : '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8 }}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
              <button onClick={() => router.push('/')} style={{ width: '100%', marginTop: 12, padding: '11px', borderRadius: 10, background: 'none', border: '1.5px solid #C7D7F5', color: '#1E3A6E', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>← Back to Sign In</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
