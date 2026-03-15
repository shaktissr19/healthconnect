'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

const API_BASE = 'https://api.healthconnect.sbs/api/v1';

interface AuthModalProps {
  mode?: 'login' | 'register';
  onClose?: () => void;
}

export default function AuthModal({ mode: initialMode = 'login', onClose }: AuthModalProps) {
  const setAuth = (useAuthStore.getState() as any).setAuth;
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedRole, setSelectedRole] = useState<'PATIENT' | 'DOCTOR' | 'HOSPITAL'>('PATIENT');
  const [form, setForm] = useState({
    identifier: '', password: '', firstName: '', lastName: '', mobile: '', email: '', regPassword: '',
  });
  const set = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const saveAndRedirect = (rawUser: any, token: string) => {
    // FIX 1: SameSite=Lax — Strict blocks the cookie during redirect navigation
    document.cookie = `hc_token=${token}; path=/; max-age=${7*24*60*60}; SameSite=Lax`;

    // FIX 2: Normalize user fields — authStore expects firstName/lastName/role etc.
    // API may return them flat or nested; handle both
    const user = {
      id:               rawUser.id              ?? rawUser._id ?? '',
      email:            rawUser.email           ?? '',
      firstName:        rawUser.firstName       ?? rawUser.name?.split(' ')[0] ?? '',
      lastName:         rawUser.lastName        ?? rawUser.name?.split(' ').slice(1).join(' ') ?? '',
      role:             rawUser.role            ?? 'PATIENT',
      registrationId:   rawUser.registrationId  ?? '',
      subscriptionTier: rawUser.subscriptionTier ?? 'FREE',
      isEmailVerified:  rawUser.isEmailVerified  ?? false,
    };

    setAuth(user, token);
    setSuccess(true);

    // FIX 3: 50ms not 800ms — 800ms was enough time for dashboard/layout's useEffect
    // to see isAuthenticated=false (Zustand not yet hydrated) and push back to '/'
    setTimeout(() => {
      // Replace current history entry so back button skips the login page
      window.history.replaceState(null, '', '/dashboard');
      window.location.replace('/dashboard');
    }, 50);
  };

  const handleLogin = async () => {
    const errs: Record<string, string> = {};
    if (!form.identifier) errs.identifier = 'Please enter your email';
    if (!form.password) errs.password = 'Please enter your password';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setErrors({});
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.identifier, password: form.password }),
      });
      const json = await res.json();
      if (res.ok && json.success !== false) {
        // API returns: { success: true, data: { user: {...}, token: '...' } }
        const payload = json.data ?? json;
        const user    = payload.user  ?? payload;
        const token   = payload.token;
        if (!token) { setErrors({ identifier: 'Unexpected server response.' }); return; }
        saveAndRedirect(user, token);
      } else {
        setErrors({ identifier: json.message || json.error || 'Invalid credentials' });
      }
    } catch {
      setErrors({ identifier: 'Connection error. Please try again.' });
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    const errs: Record<string, string> = {};
    if (!form.firstName) errs.firstName = 'Required';
    if (!form.lastName) errs.lastName = 'Required';
    if (!form.email || !form.email.includes('@')) errs.email = 'Enter valid email';
    if (!form.mobile || form.mobile.length < 10) errs.mobile = 'Enter valid 10-digit mobile';
    if (!form.regPassword || form.regPassword.length < 8) errs.regPassword = 'Min 8 characters';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setErrors({});
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName, lastName: form.lastName,
          email: form.email, mobile: form.mobile,
          password: form.regPassword, role: selectedRole,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success !== false) {
        // API returns: { success: true, data: { user: {...}, token: '...' } }
        const payload = json.data ?? json;
        const user    = payload.user  ?? payload;
        const token   = payload.token;
        if (!token) { setErrors({ email: 'Unexpected server response.' }); return; }
        saveAndRedirect(user, token);
      } else {
        setErrors({ email: json.message || json.error || 'Registration failed.' });
      }
    } catch {
      setErrors({ email: 'Connection error. Please try again.' });
    } finally { setLoading(false); }
  };

  const inp = (val: string, key: string, placeholder: string, type = 'text') => (
    <div style={{ marginBottom: 16 }}>
      <input
        type={type} placeholder={placeholder} value={val}
        onChange={e => set(key, e.target.value)}
        onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
        style={{
          width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)',
          border: `1px solid ${errors[key] ? '#F43F5E' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 12, color: '#F1F5F9', fontSize: 14, outline: 'none', boxSizing: 'border-box',
        }}
      />
      {errors[key] && <div style={{ color: '#F43F5E', fontSize: 12, marginTop: 4 }}>{errors[key]}</div>}
    </div>
  );

  return (
    <div onClick={e => e.target === e.currentTarget && onClose?.()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)', zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}>
      <div style={{
        background: 'linear-gradient(135deg, #0D1B2E 0%, #0F2744 100%)',
        border: '1px solid rgba(20,184,166,0.2)', borderRadius: 20, padding: '40px 36px',
        width: '100%', maxWidth: 460, position: 'relative', boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 8,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#94A3B8', fontSize: 16, cursor: 'pointer',
        }}>X</button>

        <div style={{ marginBottom: 24 }}>
          <div style={{ color: '#14B8A6', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>HealthConnect India</div>
          <div style={{ color: '#F1F5F9', fontWeight: 800, fontSize: 26 }}>
            {success ? '🎉 Welcome!' : mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </div>
          <div style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>
            {success ? 'Redirecting to your dashboard...' : mode === 'login' ? 'Sign in to your account' : 'Join HealthConnect India'}
          </div>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#14B8A6', fontSize: 18, fontWeight: 600 }}>
            ✅ Redirecting to dashboard...
          </div>
        ) : mode === 'login' ? (
          <>
            {inp(form.identifier, 'identifier', 'Email Address')}
            {inp(form.password, 'password', 'Password', 'password')}
            <button onClick={handleLogin} disabled={loading} style={{
              width: '100%', padding: '14px', background: loading ? '#0F766E' : 'linear-gradient(135deg, #0D9488, #14B8A6)',
              border: 'none', borderRadius: 12, color: '#0D1B2E', fontWeight: 800,
              fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 16,
            }}>{loading ? 'Signing in...' : 'Sign In'}</button>
            <div style={{ textAlign: 'center', color: '#64748B', fontSize: 14 }}>
              No account?{' '}
              <span onClick={() => { setMode('register'); setErrors({}); }}
                style={{ color: '#14B8A6', cursor: 'pointer', fontWeight: 600 }}>Sign up free</span>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {(['PATIENT', 'DOCTOR', 'HOSPITAL'] as const).map(r => (
                <button key={r} onClick={() => setSelectedRole(r)} style={{
                  flex: 1, padding: '8px 4px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: selectedRole === r ? 'rgba(20,184,166,0.2)' : 'rgba(255,255,255,0.05)',
                  color: selectedRole === r ? '#14B8A6' : '#64748B',
                }}>
                  {r === 'PATIENT' ? '🧑 Patient' : r === 'DOCTOR' ? '👨‍⚕️ Doctor' : '🏥 Hospital'}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <input placeholder="First Name" value={form.firstName} onChange={e => set('firstName', e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${errors.firstName ? '#F43F5E' : 'rgba(255,255,255,0.12)'}`, borderRadius: 12, color: '#F1F5F9', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                {errors.firstName && <div style={{ color: '#F43F5E', fontSize: 11, marginTop: 2 }}>{errors.firstName}</div>}
              </div>
              <div>
                <input placeholder="Last Name" value={form.lastName} onChange={e => set('lastName', e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${errors.lastName ? '#F43F5E' : 'rgba(255,255,255,0.12)'}`, borderRadius: 12, color: '#F1F5F9', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                {errors.lastName && <div style={{ color: '#F43F5E', fontSize: 11, marginTop: 2 }}>{errors.lastName}</div>}
              </div>
            </div>
            {inp(form.mobile, 'mobile', '10-digit Mobile Number', 'tel')}
            {inp(form.email, 'email', 'Email Address', 'email')}
            {inp(form.regPassword, 'regPassword', 'Password (min 8 chars)', 'password')}
            <button onClick={handleRegister} disabled={loading} style={{
              width: '100%', padding: '14px', background: loading ? '#0F766E' : 'linear-gradient(135deg, #0D9488, #14B8A6)',
              border: 'none', borderRadius: 12, color: '#0D1B2E', fontWeight: 800,
              fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 16,
            }}>{loading ? 'Creating account...' : 'Create Account'}</button>
            <div style={{ textAlign: 'center', color: '#64748B', fontSize: 14 }}>
              Already have an account?{' '}
              <span onClick={() => { setMode('login'); setErrors({}); }}
                style={{ color: '#14B8A6', cursor: 'pointer', fontWeight: 600 }}>Sign in</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
