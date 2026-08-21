'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export type LandingAuthMode = 'login' | 'register' | 'forgot';

type Props = {
  mode: LandingAuthMode;
  onClose: () => void;
  onModeChange: (mode: LandingAuthMode) => void;
};

const ROLES = [
  { key:'PATIENT', icon:'♥', title:'Create Patient Account', short:'Patient', desc:'My Health · records · appointments · communities' },
  { key:'DOCTOR', icon:'🩺', title:'Register as a Doctor', short:'Doctor', desc:'Patients · availability · appointments · affiliations' },
  { key:'HOSPITAL', icon:'🏥', title:'Register a Hospital', short:'Hospital', desc:'Doctors · OPD · departments · facilities' },
] as const;

const SIGNIN_DESTINATIONS = [
  ['♥','Patient','My Health · reports · medicines · appointments'],
  ['🩺','Doctor','My Patients · schedules · consultations'],
  ['🏥','Hospital','Doctors · OPD · hospital appointments'],
] as const;

const dashboardFor = (role?: string) => {
  switch (String(role ?? '').toUpperCase()) {
    case 'DOCTOR': return '/doctor-dashboard';
    case 'HOSPITAL': return '/hospital-dashboard';
    case 'ADMIN': return '/admin-dashboard';
    default: return '/dashboard';
  }
};

export default function LandingAuthModal({ mode, onClose, onModeChange }: Props){
  const router = useRouter();
  const [step,setStep] = useState<'role'|'form'>('role');
  const [role,setRole] = useState('PATIENT');
  const [firstName,setFirstName] = useState('');
  const [lastName,setLastName] = useState('');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [forgotEmail,setForgotEmail] = useState('');
  const [forgotSent,setForgotSent] = useState(false);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');

  const isLogin = mode === 'login';
  const isForgot = mode === 'forgot';
  const selectedRole = useMemo(()=>ROLES.find(r=>r.key===role) ?? ROLES[0],[role]);

  useEffect(()=>{
    setError('');
    setForgotSent(false);
    if(mode==='register'){
      let requested = 'PATIENT';
      try { requested = sessionStorage.getItem('hc_signup_role') || 'PATIENT'; sessionStorage.removeItem('hc_signup_role'); } catch {}
      if(ROLES.some(r=>r.key===requested)) setRole(requested);
      setStep('role');
    } else {
      setStep('form');
    }
  },[mode]);

  const submit = async() => {
    setError('');
    if(!email.trim() || !password){ setError('Enter your email and password.'); return; }
    if(!isLogin && (!firstName.trim() || !lastName.trim())){ setError('Enter your first and last name.'); return; }
    setLoading(true);
    try{
      const response:any = isLogin
        ? await authAPI.login({email:email.trim(),password})
        : await authAPI.register({email:email.trim(),password,firstName:firstName.trim(),lastName:lastName.trim(),role});
      const payload = response?.data?.data ?? response?.data;
      const user = payload?.user;
      const token = payload?.token;
      if(!user) throw new Error('Authentication response did not include a user.');
      (useAuthStore.getState() as any).setAuth(user,token);
      try { sessionStorage.removeItem('hc_post_login_redirect'); } catch {}
      onClose();
      router.replace(dashboardFor(user.role));
    }catch(e:any){
      setError(e?.response?.data?.message ?? e?.response?.data?.error ?? (isLogin?'Unable to sign in with those credentials.':'Unable to create this account.'));
    }finally{setLoading(false);}
  };

  const sendReset = async() => {
    if(!forgotEmail.trim()) return;
    setLoading(true);
    try{ await authAPI.forgotPassword({email:forgotEmail.trim()}); }
    catch{/* Intentionally do not reveal account existence. */}
    finally{setLoading(false);setForgotSent(true);}
  };

  return <div className="auth-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <style>{`
      .auth-backdrop{position:fixed;inset:0;z-index:5000;background:rgba(3,10,22,.82);backdrop-filter:blur(10px);display:grid;place-items:center;padding:18px;font-family:'DM Sans',Arial,sans-serif}.auth-modal{width:min(520px,96vw);max-height:92vh;overflow:auto;background:linear-gradient(180deg,#0B182C,#091426);border:1px solid rgba(45,212,191,.18);border-radius:22px;padding:28px;color:#fff;box-shadow:0 30px 90px rgba(0,0,0,.46)}.auth-head{display:flex;justify-content:space-between;gap:20px;align-items:start;margin-bottom:20px}.auth-step{font-size:9px;font-weight:900;letter-spacing:.16em;color:#2DD4BF;margin-bottom:7px}.auth-head h2{font-family:'Sora',sans-serif;font-size:25px;letter-spacing:-.025em;margin:0 0 5px}.auth-head p{font-size:12px;color:#8399B5;margin:0}.auth-close{width:34px;height:34px;border-radius:50%;border:1px solid rgba(148,163,184,.18);background:rgba(255,255,255,.05);color:#93A9C3;font-size:18px;cursor:pointer}.auth-roles{display:grid;gap:9px}.auth-role{width:100%;display:flex;align-items:center;gap:13px;text-align:left;border:1px solid rgba(148,163,184,.16);background:rgba(255,255,255,.025);border-radius:13px;padding:13px 14px;color:#fff;cursor:pointer}.auth-role.active{border-color:#2DD4BF;background:rgba(45,212,191,.08)}.auth-role-icon{width:34px;height:34px;border-radius:10px;background:rgba(45,212,191,.08);display:grid;place-items:center;font-size:16px;color:#2DD4BF}.auth-role strong{display:block;font-size:13px;margin-bottom:2px}.auth-role span{display:block;font-size:10px;color:#8298B3}.auth-radio{margin-left:auto;width:16px;height:16px;border-radius:50%;border:2px solid #486078;position:relative}.auth-role.active .auth-radio{border-color:#2DD4BF}.auth-role.active .auth-radio:after{content:'';position:absolute;width:6px;height:6px;border-radius:50%;background:#2DD4BF;inset:3px}.auth-main-btn{width:100%;border:0;border-radius:11px;padding:12px 14px;background:linear-gradient(135deg,#0D9488,#2DD4BF);color:#fff;font-size:13px;font-weight:900;cursor:pointer;margin-top:16px}.auth-main-btn:disabled{opacity:.55;cursor:not-allowed}.auth-linkline{text-align:center;color:#8298B3;font-size:11px;margin:14px 0 0}.auth-text-btn{background:none;border:0;color:#2DD4BF;font-weight:850;cursor:pointer;padding:0;font-size:11px}.auth-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.auth-input{width:100%;box-sizing:border-box;border:1px solid rgba(148,163,184,.17);background:rgba(255,255,255,.04);color:#F5F9FF;border-radius:10px;padding:11px 12px;outline:none;font-size:12px;margin-bottom:9px}.auth-input:focus{border-color:#2DD4BF;box-shadow:0 0 0 3px rgba(45,212,191,.08)}.auth-input::placeholder{color:#687E99}.auth-error{font-size:11px;line-height:1.5;color:#FDA4AF;background:rgba(225,29,72,.08);border:1px solid rgba(244,63,94,.18);border-radius:9px;padding:9px 11px;margin-bottom:9px}.auth-context{margin-top:18px;padding-top:15px;border-top:1px solid rgba(148,163,184,.12)}.auth-context-title{font-size:9px;color:#647D99;font-weight:900;letter-spacing:.12em;margin-bottom:7px}.auth-destination{display:grid;grid-template-columns:27px 58px 1fr;gap:8px;align-items:center;padding:6px 0}.auth-destination b{font-size:10px;color:#DDE8F5}.auth-destination span{font-size:9px;color:#7189A4}.auth-back{background:none;border:0;color:#91A7C0;font-size:10px;font-weight:700;cursor:pointer;padding:0 0 10px}.auth-forgot-row{text-align:right;margin:-2px 0 10px}.auth-reset{text-align:center;padding:8px 0 3px}.auth-reset-icon{font-size:34px;margin-bottom:8px}.auth-reset p{font-size:11px;line-height:1.6;color:#8298B3}.auth-role-note{font-size:10px;color:#728AA5;line-height:1.5;margin-top:10px}
      @media(max-width:520px){.auth-modal{padding:22px}.auth-form-grid{grid-template-columns:1fr}.auth-head h2{font-size:22px}}
    `}</style>
    <div className="auth-modal" onKeyDown={e=>{if(e.key==='Enter'&&!isForgot&&step==='form')void submit()}}>
      <div className="auth-head"><div><div className="auth-step">{isForgot?'ACCOUNT RECOVERY':isLogin?'ONE HEALTHCONNECT SIGN IN':step==='role'?'STEP 1 OF 2':`STEP 2 OF 2 · ${selectedRole.short.toUpperCase()}`}</div><h2>{isForgot?'Reset your password':isLogin?'Welcome back':step==='role'?'How do you want to register?':'Create your account'}</h2><p>{isForgot?'Enter your email and we will send reset instructions.':isLogin?'One sign in. HealthConnect takes you to the dashboard linked to your account.':step==='role'?'Choose the account type you are creating.':selectedRole.title}</p></div><button className="auth-close" onClick={onClose}>×</button></div>

      {isForgot ? (forgotSent ? <div className="auth-reset"><div className="auth-reset-icon">✉️</div><h3>Check your inbox</h3><p>If an account exists for <b>{forgotEmail}</b>, password-reset instructions will be sent. We do not reveal whether an email is registered.</p><button className="auth-main-btn" onClick={()=>onModeChange('login')}>Back to Sign In</button></div> : <><input className="auth-input" type="email" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} placeholder="Email address" autoFocus/><button className="auth-main-btn" disabled={loading} onClick={()=>void sendReset()}>{loading?'Sending…':'Send Reset Link'}</button><p className="auth-linkline"><button className="auth-text-btn" onClick={()=>onModeChange('login')}>← Back to Sign In</button></p></>) : null}

      {!isForgot && !isLogin && step==='role' && <><div className="auth-roles">{ROLES.map(r=><button className={`auth-role ${role===r.key?'active':''}`} key={r.key} onClick={()=>setRole(r.key)}><div className="auth-role-icon">{r.icon}</div><div><strong>{r.title}</strong><span>{r.desc}</span></div><div className="auth-radio"/></button>)}</div><button className="auth-main-btn" onClick={()=>setStep('form')}>Continue as {selectedRole.short} →</button><p className="auth-linkline">Already have an account? <button className="auth-text-btn" onClick={()=>onModeChange('login')}>Sign in</button></p></>}

      {!isForgot && (isLogin || step==='form') && <>{!isLogin&&<button className="auth-back" onClick={()=>{setStep('role');setError('')}}>← Change account type</button>}{!isLogin&&<div className="auth-form-grid"><input className="auth-input" value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="First name"/><input className="auth-input" value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Last name"/></div>}<input className="auth-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" autoComplete="email"/><input className="auth-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" autoComplete={isLogin?'current-password':'new-password'}/>{isLogin&&<div className="auth-forgot-row"><button className="auth-text-btn" onClick={()=>onModeChange('forgot')}>Forgot password?</button></div>}{error&&<div className="auth-error">⚠ {error}</div>}<button className="auth-main-btn" disabled={loading} onClick={()=>void submit()}>{loading?'Please wait…':isLogin?'Sign In':'Create Account'}</button>{isLogin&&<div className="auth-context"><div className="auth-context-title">YOUR ACCOUNT DECIDES WHERE YOU GO AFTER SIGN IN</div>{SIGNIN_DESTINATIONS.map(([icon,title,copy])=><div className="auth-destination" key={title}><span>{icon}</span><b>{title}</b><span>{copy}</span></div>)}<div className="auth-role-note">You do not need to choose Patient, Doctor or Hospital before signing in. Your registered account role is the source of truth.</div></div>}<p className="auth-linkline">{isLogin?'New to HealthConnect? ':'Already have an account? '}<button className="auth-text-btn" onClick={()=>onModeChange(isLogin?'register':'login')}>{isLogin?'Create account':'Sign in'}</button></p></>}
    </div>
  </div>;
}
