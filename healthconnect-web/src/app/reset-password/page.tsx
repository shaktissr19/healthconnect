'use client';
// src/app/reset-password/page.tsx
// FIX: useSearchParams() wrapped in Suspense (required by Next.js 16)
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '@/lib/api';

function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token') || '';

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState('');
  const [showPass, setShowPass]   = useState(false);

  useEffect(() => {
    if (!token) setError('Invalid or missing reset token. Please request a new password reset.');
  }, [token]);

  const getStrength = (p: string) => {
    let s = 0;
    if (p.length >= 8)           s++;
    if (/[A-Z]/.test(p))         s++;
    if (/[0-9]/.test(p))         s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const strength      = getStrength(password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#E11D48', '#D97706', '#2563EB', '#16A34A'][strength];

  const handleSubmit = async () => {
    if (!token)               { setError('Invalid reset token.'); return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      await authAPI.resetPassword({ token, password });
      setSuccess(true);
      setTimeout(() => router.push('/'), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Reset link has expired. Please request a new one.');
    } finally { setLoading(false); }
  };

  if (success) return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0A1628', margin: '0 0 12px', fontFamily: 'Poppins, sans-serif' }}>Password reset!</h2>
      <p style={{ fontSize: 14, color: '#4A5E7A', margin: '0 0 24px', lineHeight: 1.6 }}>Updated successfully. Redirecting to sign in…</p>
      <button onClick={() => router.push('/')} style={{ width: '100%', padding: '13px', borderRadius: 10, background: 'linear-gradient(135deg,#0D9488,#14B8A6)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Sign In Now →</button>
    </div>
  );

  return (
    <>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0A1628', margin: '0 0 8px', fontFamily: 'Poppins, sans-serif' }}>Set new password</h2>
      <p style={{ fontSize: 14, color: '#4A5E7A', margin: '0 0 28px', lineHeight: 1.6 }}>Choose a strong password for your HealthConnect account.</p>

      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E3A6E', marginBottom: 6 }}>New password</label>
      <div style={{ position: 'relative', marginBottom: 6 }}>
        <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters"
          style={{ width: '100%', padding: '11px 40px 11px 14px', borderRadius: 10, border: '1.5px solid #A8C0E8', background: '#F8FAFF', color: '#0A1628', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }} />
        <button onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#7A8FA8' }}>{showPass ? '🙈' : '👁'}</button>
      </div>

      {password && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strength ? strengthColor : '#E2EAF4' }} />)}
          </div>
          <span style={{ fontSize: 12, color: strengthColor, fontWeight: 600 }}>{strengthLabel}</span>
        </div>
      )}

      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E3A6E', marginBottom: 6 }}>Confirm password</label>
      <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="Re-enter your password"
        style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${confirm && confirm !== password ? '#E11D48' : '#A8C0E8'}`, background: '#F8FAFF', color: '#0A1628', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, marginBottom: 16 }} />

      {error && <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: 'rgba(190,18,60,0.06)', border: '1px solid rgba(190,18,60,0.2)', color: '#BE123C', fontSize: 13 }}>⚠️ {error}</div>}

      <button onClick={handleSubmit} disabled={loading || !token}
        style={{ width: '100%', padding: '13px', borderRadius: 10, background: loading || !token ? '#E2EAF4' : 'linear-gradient(135deg,#0D9488,#14B8A6)', color: loading || !token ? '#7A8FA8' : '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: loading || !token ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Resetting…' : 'Reset Password'}
      </button>
      <button onClick={() => router.push('/')} style={{ width: '100%', marginTop: 12, padding: '11px', borderRadius: 10, background: 'none', border: '1.5px solid #C7D7F5', color: '#1E3A6E', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>← Back to Sign In</button>
    </>
  );
}

export default function ResetPasswordPage() {
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
          {/* Suspense required: useSearchParams() causes prerender error without it */}
          <Suspense fallback={<div style={{ textAlign: 'center', padding: '20px 0' }}><div style={{ width: 32, height: 32, border: '3px solid #C7D7F5', borderTop: '3px solid #0D9488', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
