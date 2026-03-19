'use client';
// src/app/page.tsx
// • Unauthenticated  → landing page
// • Authenticated    → auto-redirect to their dashboard (Gmail-style)
// • Sign Up          → 3 role cards first, then form
// • Sign In          → email + password only (role comes from API)
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore }   from '@/store/uiStore';
import { authAPI }      from '@/lib/api';
import Navbar      from '@/components/landing/Navbar';
import Hero               from '@/components/landing/Hero';
import PlatformNumbers    from '@/components/landing/PlatformNumbers';
import PlatformTour       from '@/components/landing/PlatformTour';
import PlatformSpoke      from '@/components/landing/PlatformSpoke';
import KnowledgeResources from '@/components/landing/KnowledgeResources';
import Footer      from '@/components/landing/Footer';

// Stub components for sections not yet deployed — renders nothing, no build error
const Communities     = () => null;
const StatsTicker     = () => null;
const DoctorDiscovery = () => null;
const KnowledgeHub    = () => null;
const HospitalMap     = () => null;
const Pricing         = () => null;
const Testimonials    = () => null;
const LandingCTA      = () => null;
const Compliance      = () => null;

// ── Helpers ────────────────────────────────────────────────────────────────
function getDashboardRoute(role?: string): string {
  switch ((role ?? '').toUpperCase()) {
    case 'ADMIN':    return '/admin-dashboard';
    case 'DOCTOR':   return '/doctor-dashboard';
    case 'HOSPITAL': return '/hospital-dashboard';
    default:         return '/dashboard';
  }
}

// ── Shared styles ──────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  display: 'block', width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14,
  background: 'rgba(255,255,255,0.04)', color: '#E8F0FE', fontSize: 14,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};

// ── Role cards (step 1 of register) ───────────────────────────────────────
const ROLES = [
  {
    key: 'PATIENT',
    label: 'Patient',
    icon: '🧑‍⚕️',
    desc: 'Manage your health, records & appointments',
  },
  {
    key: 'DOCTOR',
    label: 'Doctor',
    icon: '👨‍⚕️',
    desc: 'Manage patients, schedule & consultations',
  },
  {
    key: 'HOSPITAL',
    label: 'Hospital',
    icon: '🏥',
    desc: 'Manage departments, staff & facilities',
  },
];

// ── Auth Modal ─────────────────────────────────────────────────────────────
function AuthModal({
  mode,
  onClose,
  onSwitchMode,
}: {
  mode: 'login' | 'register';
  onClose: () => void;
  onSwitchMode: () => void;
}) {
  const router        = useRouter();
  const uiStore       = useUIStore() as any;
  const isLogin       = mode === 'login';

  // Register step: 'role' | 'form'
  const [step,      setStep]      = useState<'role' | 'form'>(isLogin ? 'form' : 'role');
  const [role,      setRole]      = useState('PATIENT');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [firstName, setFirst]     = useState('');
  const [lastName,  setLast]      = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const hasRedirected = useRef(false);

  // Reset step when mode changes
  useEffect(() => {
    setStep(isLogin ? 'form' : 'role');
    setError('');
  }, [isLogin]);

  const handleSubmit = useCallback(async () => {
    setError('');
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields.'); return; }
    if (!isLogin && (!firstName.trim() || !lastName.trim())) { setError('Please enter your full name.'); return; }
    setLoading(true);
    try {
      const res: any = isLogin
        ? await authAPI.login({ email: email.trim(), password })
        : await authAPI.register({
            email: email.trim(),
            password,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            role,
          });
      const payload       = res?.data?.data ?? res?.data;
      const { user, token } = payload;
      (useAuthStore.getState() as any).setAuth(user, token);
      if ((user.role ?? '').toUpperCase() === 'DOCTOR') uiStore.setActivePage?.('home');
      else uiStore.setActivePage?.('my-health');
      onClose();
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        router.replace(getDashboardRoute(user.role));
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        (isLogin ? 'Invalid email or password.' : 'Registration failed. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  }, [email, password, firstName, lastName, isLogin, role, uiStore, onClose, router]);

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(2,8,20,0.85)', backdropFilter:'blur(14px)', padding:'0 16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{ background:'#0C1628', borderRadius:20, padding:'36px 32px', width:'100%', maxWidth: step === 'role' ? 520 : 440, border:'1px solid rgba(20,184,166,0.2)', boxShadow:'0 32px 80px rgba(0,0,0,0.6)', transition:'max-width 0.3s ease' }}
        onKeyDown={e => { if (e.key === 'Enter' && step === 'form') handleSubmit(); }}
      >
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: step === 'role' ? 24 : 28 }}>
          <div>
            {!isLogin && step === 'role' && (
              <p style={{ color:'#14B8A6', fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', margin:'0 0 4px' }}>Step 1 of 2</p>
            )}
            {!isLogin && step === 'form' && (
              <p style={{ color:'#14B8A6', fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', margin:'0 0 4px' }}>Step 2 of 2 · {ROLES.find(r => r.key === role)?.label}</p>
            )}
            <h2 style={{ color:'#E8F0FE', fontSize:22, fontWeight:800, margin:'0 0 4px' }}>
              {isLogin ? 'Welcome back' : step === 'role' ? 'Who are you?' : 'Create your account'}
            </h2>
            <p style={{ color:'#7A8FAF', fontSize:13, margin:0 }}>
              {isLogin
                ? 'Sign in to HealthConnect'
                : step === 'role'
                  ? 'Choose your role to get started'
                  : `Signing up as a ${ROLES.find(r => r.key === role)?.label}`}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ width:32, height:32, borderRadius:'50%', cursor:'pointer', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', color:'#7A8FAF', fontSize:16, flexShrink:0 }}
          >✕</button>
        </div>

        {/* ── STEP 1: Role selection ── */}
        {!isLogin && step === 'role' && (
          <>
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:24 }}>
              {ROLES.map(r => (
                <button
                  key={r.key}
                  onClick={() => setRole(r.key)}
                  style={{
                    display:'flex', alignItems:'center', gap:16, padding:'16px 18px',
                    borderRadius:12, border: role === r.key ? '2px solid #14B8A6' : '2px solid rgba(255,255,255,0.06)',
                    background: role === r.key ? 'rgba(20,184,166,0.08)' : 'rgba(255,255,255,0.02)',
                    cursor:'pointer', textAlign:'left', transition:'all 0.15s ease', width:'100%',
                  }}
                >
                  <span style={{ fontSize:28, lineHeight:1 }}>{r.icon}</span>
                  <div>
                    <div style={{ color: role === r.key ? '#14B8A6' : '#E8F0FE', fontWeight:700, fontSize:15, marginBottom:2 }}>{r.label}</div>
                    <div style={{ color:'#7A8FAF', fontSize:12 }}>{r.desc}</div>
                  </div>
                  <div style={{ marginLeft:'auto', width:18, height:18, borderRadius:'50%', border: role === r.key ? '6px solid #14B8A6' : '2px solid rgba(255,255,255,0.15)', transition:'all 0.15s ease' }} />
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep('form')}
              style={{ width:'100%', padding:'13px 0', borderRadius:10, border:'none', marginBottom:16, background:'linear-gradient(135deg,#0D9488,#14B8A6)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
            >
              Continue as {ROLES.find(r => r.key === role)?.label} →
            </button>
            <p style={{ textAlign:'center', color:'#7A8FAF', fontSize:13, margin:0 }}>
              Already have an account?{' '}
              <button onClick={onSwitchMode} style={{ background:'none', border:'none', color:'#14B8A6', cursor:'pointer', fontSize:13, fontWeight:700, padding:0 }}>Sign in</button>
            </p>
          </>
        )}

        {/* ── STEP 2: Form (register) or login form ── */}
        {(isLogin || step === 'form') && (
          <>
            {/* Back button for register step 2 */}
            {!isLogin && (
              <button
                onClick={() => { setStep('role'); setError(''); }}
                style={{ background:'none', border:'none', color:'#7A8FAF', cursor:'pointer', fontSize:13, padding:'0 0 16px', display:'flex', alignItems:'center', gap:6 }}
              >← Change role</button>
            )}

            {!isLogin && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <input value={firstName} onChange={e => setFirst(e.target.value)} placeholder="First name" style={inp} />
                <input value={lastName}  onChange={e => setLast(e.target.value)}  placeholder="Last name"  style={inp} />
              </div>
            )}
            <input type="email"    value={email}    onChange={e => setEmail(e.target.value)}    placeholder="Email address" style={inp} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"      style={inp} />

            {error && (
              <div style={{ padding:'10px 14px', borderRadius:9, marginBottom:16, background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.2)', color:'#F43F5E', fontSize:13 }}>
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ width:'100%', padding:'13px 0', borderRadius:10, border:'none', marginBottom:16, background:loading?'rgba(255,255,255,0.06)':'linear-gradient(135deg,#0D9488,#14B8A6)', color:loading?'#7A8FAF':'#fff', fontSize:15, fontWeight:700, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit' }}
            >
              {loading ? '⟳  Please wait…' : isLogin ? 'Sign In' : 'Create Account'}
            </button>

            <p style={{ textAlign:'center', color:'#7A8FAF', fontSize:13, margin:0 }}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={onSwitchMode} style={{ background:'none', border:'none', color:'#14B8A6', cursor:'pointer', fontSize:13, fontWeight:700, padding:0 }}>
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Landing Page ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const router                            = useRouter();
  const { authModal, openAuthModal, closeAuthModal } = useUIStore() as any;
  const [authChecked, setAuthChecked]     = useState(false);

  useEffect(() => {
    let done = false;

    const tryRedirect = (s: any) => {
      if (done) return;
      // Wait for Zustand to finish reading localStorage
      if (!s._hasHydrated) return;
      const params = new URLSearchParams(window.location.search);
      if (params.get('home') === '1') { setAuthChecked(true); done = true; return; }
      done = true;

      if (s.isAuthenticated && s.user?.role) {
        // Logged-in user → send to their dashboard (Gmail-style)
        router.replace(getDashboardRoute(s.user.role));
      } else {
        // Not logged in → show landing page
        setAuthChecked(true);
      }
    };

    tryRedirect(useAuthStore.getState() as any);
    if (done) return;

    const unsub = (useAuthStore as any).subscribe((s: any) => tryRedirect(s));
    return () => { unsub(); done = true; };
  }, [router]);

  // Show nothing until we know auth state (prevents flash)
  if (!authChecked) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg-base)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid rgba(20,184,166,0.2)', borderTop:'3px solid #14B8A6', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main>
        <Hero />
            <PlatformNumbers />
            <PlatformTour />
            <PlatformSpoke />
            <KnowledgeResources />
        <DoctorDiscovery />
        <KnowledgeHub />
        <HospitalMap />
        <Pricing />
        <Testimonials />
        <LandingCTA />
        <Compliance />
      </main>
      <Footer />
      {(authModal === 'login' || authModal === 'register') && (
        <AuthModal
          mode={authModal}
          onClose={closeAuthModal}
          onSwitchMode={() => openAuthModal(authModal === 'login' ? 'register' : 'login')}
        />
      )}
    </>
  );
}
