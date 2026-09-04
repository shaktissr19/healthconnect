'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, authAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export type LandingAuthMode = 'login' | 'register' | 'forgot';

type Props = {
  mode: LandingAuthMode;
  onClose: () => void;
  onModeChange: (mode: LandingAuthMode) => void;
};

type PublicPlan = {
  id: string;
  name: string;
  displayName: string;
  targetRole: string;
  features?: string[];
  pricing?: { monthlyPaise?: number; currency?: string };
  introOffer?: { code?: string; amountPaise?: number; cycles?: number; available?: boolean; description?: string } | null;
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

const membershipFor = (role?: string, reason = 'required') => {
  const upper = String(role ?? '').toUpperCase();
  if (upper === 'DOCTOR') return `/doctor-dashboard/membership?membership=${encodeURIComponent(reason)}`;
  return `/dashboard?tab=subscription&membership=${encodeURIComponent(reason)}`;
};

const money = (paise?: number) => `₹${(Number(paise || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const unwrap = (response:any) => response?.data?.data ?? response?.data ?? null;

export default function LandingAuthModal({ mode, onClose, onModeChange }: Props){
  const router = useRouter();
  const [step,setStep] = useState<'role'|'plan'|'form'>('role');
  const [role,setRole] = useState('PATIENT');
  const [plans,setPlans] = useState<PublicPlan[]>([]);
  const [plansLoading,setPlansLoading] = useState(false);
  const [selectedPlanId,setSelectedPlanId] = useState('');
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
  const rolePlans = useMemo(()=>plans.filter(p=>p.targetRole===role && Number(p.pricing?.monthlyPaise || 0) > 0),[plans,role]);
  const selectedPlan = useMemo(()=>rolePlans.find(p=>p.id===selectedPlanId) ?? rolePlans[0] ?? null,[rolePlans,selectedPlanId]);

  useEffect(()=>{
    let active=true;
    setPlansLoading(true);
    api.get('/subscription/plans')
      .then(r=>{ if(!active)return; const data=unwrap(r); setPlans(Array.isArray(data)?data:[]); })
      .catch(()=>{ if(active)setPlans([]); })
      .finally(()=>{ if(active)setPlansLoading(false); });
    return()=>{active=false};
  },[]);

  useEffect(()=>{
    setError('');
    setForgotSent(false);
    if(mode==='register'){
      let requested = 'PATIENT';
      try { requested = sessionStorage.getItem('hc_signup_role') || 'PATIENT'; sessionStorage.removeItem('hc_signup_role'); } catch {}
      if(ROLES.some(r=>r.key===requested)) setRole(requested);
      setSelectedPlanId('');
      setStep('role');
    } else {
      setStep('form');
    }
  },[mode]);

  useEffect(()=>{
    if(step!=='plan') return;
    if(rolePlans.length && !rolePlans.some(p=>p.id===selectedPlanId)) setSelectedPlanId(rolePlans[0].id);
  },[step,rolePlans,selectedPlanId]);

  const continueFromRole = () => {
    setError('');
    if(role==='HOSPITAL') { setStep('form'); return; }
    setStep('plan');
  };

  const continueFromPlan = () => {
    if(!selectedPlan && !plansLoading){ setError('No paid membership is currently available for this account type.'); return; }
    setError('');
    setStep('form');
  };

  const resolvePostAuthDestination = async(user:any, registering:boolean) => {
    const upper = String(user?.role ?? '').toUpperCase();
    const isMemberRole = upper === 'PATIENT' || upper === 'DOCTOR';

    if(registering && isMemberRole){
      try {
        if(selectedPlan){
          sessionStorage.setItem('hc_selected_plan_id',selectedPlan.id);
          sessionStorage.setItem('hc_selected_plan_name',selectedPlan.displayName);
          sessionStorage.setItem('hc_selected_plan_role',upper);
        }
        sessionStorage.setItem('hc_membership_notice','onboarding');
      } catch {}
      return membershipFor(upper,'onboarding');
    }

    if(!isMemberRole){
      let requested='';
      try { requested=sessionStorage.getItem('hc_post_login_redirect')||''; sessionStorage.removeItem('hc_post_login_redirect'); } catch {}
      return requested || dashboardFor(upper);
    }

    try{
      const currentResponse = await api.get('/subscription/current');
      const current = unwrap(currentResponse);
      const endOk = !current?.endDate || new Date(current.endDate).getTime() > Date.now();
      const active = Boolean(current && current.status === 'ACTIVE' && endOk && Number(current.amountPaise || 0) > 0);
      if(!active){
        const reason = current ? 'expired' : 'required';
        try { sessionStorage.setItem('hc_membership_notice',reason); } catch {}
        return membershipFor(upper,reason);
      }
    }catch{
      // Do not lock a valid user out because a membership-status request had a temporary network failure.
      return dashboardFor(upper);
    }

    let requested='';
    try { requested=sessionStorage.getItem('hc_post_login_redirect')||''; sessionStorage.removeItem('hc_post_login_redirect'); } catch {}
    return requested || dashboardFor(upper);
  };

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
      const destination = await resolvePostAuthDestination(user,!isLogin);
      onClose();
      router.replace(destination);
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

  const registrationStep = step==='role' ? 'STEP 1 OF 3' : step==='plan' ? 'STEP 2 OF 3' : `STEP 3 OF 3 · ${selectedRole.short.toUpperCase()}`;
  const heading = isForgot ? 'Reset your password' : isLogin ? 'Welcome back' : step==='role' ? 'How do you want to register?' : step==='plan' ? 'Choose your membership' : 'Create your account';
  const subheading = isForgot ? 'Enter your email and we will send reset instructions.' : isLogin ? 'Sign in once. If your Patient or Doctor membership is not active, we will take you directly to Membership & Billing.' : step==='role' ? 'Choose the account type you are creating.' : step==='plan' ? `Select the ${selectedRole.short} membership before creating your account.` : selectedRole.title;

  return <div className="auth-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <style>{`
      .auth-backdrop{position:fixed;inset:0;z-index:5000;background:rgba(3,10,22,.82);backdrop-filter:blur(10px);display:grid;place-items:center;padding:18px;font-family:'DM Sans',Arial,sans-serif}.auth-modal{width:min(540px,96vw);max-height:92vh;overflow:auto;background:linear-gradient(180deg,#0B182C,#091426);border:1px solid rgba(45,212,191,.18);border-radius:22px;padding:28px;color:#fff;box-shadow:0 30px 90px rgba(0,0,0,.46)}.auth-head{display:flex;justify-content:space-between;gap:20px;align-items:start;margin-bottom:20px}.auth-step{font-size:9px;font-weight:900;letter-spacing:.16em;color:#2DD4BF;margin-bottom:7px}.auth-head h2{font-family:'Sora',sans-serif;font-size:25px;letter-spacing:-.025em;margin:0 0 5px}.auth-head p{font-size:12px;line-height:1.5;color:#8399B5;margin:0;max-width:430px}.auth-close{width:34px;height:34px;border-radius:50%;border:1px solid rgba(148,163,184,.18);background:rgba(255,255,255,.05);color:#93A9C3;font-size:18px;cursor:pointer}.auth-roles{display:grid;gap:9px}.auth-role{width:100%;display:flex;align-items:center;gap:13px;text-align:left;border:1px solid rgba(148,163,184,.16);background:rgba(255,255,255,.025);border-radius:13px;padding:13px 14px;color:#fff;cursor:pointer}.auth-role.active{border-color:#2DD4BF;background:rgba(45,212,191,.08)}.auth-role-icon{width:34px;height:34px;border-radius:10px;background:rgba(45,212,191,.08);display:grid;place-items:center;font-size:16px;color:#2DD4BF}.auth-role strong{display:block;font-size:13px;margin-bottom:2px}.auth-role span{display:block;font-size:10px;color:#8298B3}.auth-radio{margin-left:auto;width:16px;height:16px;border-radius:50%;border:2px solid #486078;position:relative}.auth-role.active .auth-radio{border-color:#2DD4BF}.auth-role.active .auth-radio:after{content:'';position:absolute;width:6px;height:6px;border-radius:50%;background:#2DD4BF;inset:3px}.auth-main-btn{width:100%;border:0;border-radius:11px;padding:12px 14px;background:linear-gradient(135deg,#0D9488,#2DD4BF);color:#fff;font-size:13px;font-weight:900;cursor:pointer;margin-top:16px}.auth-main-btn:disabled{opacity:.55;cursor:not-allowed}.auth-linkline{text-align:center;color:#8298B3;font-size:11px;margin:14px 0 0}.auth-text-btn{background:none;border:0;color:#2DD4BF;font-weight:850;cursor:pointer;padding:0;font-size:11px}.auth-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.auth-input{width:100%;box-sizing:border-box;border:1px solid rgba(148,163,184,.17);background:rgba(255,255,255,.04);color:#F5F9FF;border-radius:10px;padding:11px 12px;outline:none;font-size:12px;margin-bottom:9px}.auth-input:focus{border-color:#2DD4BF;box-shadow:0 0 0 3px rgba(45,212,191,.08)}.auth-input::placeholder{color:#687E99}.auth-error{font-size:11px;line-height:1.5;color:#FDA4AF;background:rgba(225,29,72,.08);border:1px solid rgba(244,63,94,.18);border-radius:9px;padding:9px 11px;margin-bottom:9px}.auth-context{margin-top:18px;padding-top:15px;border-top:1px solid rgba(148,163,184,.12)}.auth-context-title{font-size:9px;color:#647D99;font-weight:900;letter-spacing:.12em;margin-bottom:7px}.auth-destination{display:grid;grid-template-columns:27px 58px 1fr;gap:8px;align-items:center;padding:6px 0}.auth-destination b{font-size:10px;color:#DDE8F5}.auth-destination span{font-size:9px;color:#7189A4}.auth-back{background:none;border:0;color:#91A7C0;font-size:10px;font-weight:700;cursor:pointer;padding:0 0 10px}.auth-forgot-row{text-align:right;margin:-2px 0 10px}.auth-reset{text-align:center;padding:8px 0 3px}.auth-reset-icon{font-size:34px;margin-bottom:8px}.auth-reset p{font-size:11px;line-height:1.6;color:#8298B3}.auth-role-note{font-size:10px;color:#728AA5;line-height:1.5;margin-top:10px}
      .auth-plans{display:grid;gap:10px}.auth-plan{position:relative;width:100%;border:1px solid rgba(148,163,184,.18);background:rgba(255,255,255,.035);border-radius:15px;padding:15px 16px;color:#fff;text-align:left;cursor:pointer}.auth-plan.selected{border-color:#2DD4BF;background:linear-gradient(135deg,rgba(45,212,191,.10),rgba(37,99,235,.07));box-shadow:inset 0 0 0 1px rgba(45,212,191,.08)}.auth-plan-top{display:flex;justify-content:space-between;gap:12px;align-items:start}.auth-plan-name{font-family:'Sora',sans-serif;font-size:15px;font-weight:800}.auth-plan-price{font-family:'Sora',sans-serif;font-size:20px;font-weight:900;color:#5EEAD4;white-space:nowrap}.auth-plan-price span{font-family:'DM Sans',sans-serif;font-size:9px;color:#7F96B0;font-weight:600}.auth-plan-features{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}.auth-plan-features span{padding:5px 8px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid rgba(148,163,184,.12);font-size:9px;color:#AFC2D7}.auth-plan-offer{margin-top:10px;padding:8px 9px;border-radius:9px;background:rgba(245,158,11,.10);border:1px solid rgba(245,158,11,.20);color:#FDE68A;font-size:9.5px;line-height:1.45}.auth-plan-check{width:18px;height:18px;border-radius:50%;border:2px solid #486078;position:absolute;right:15px;bottom:15px}.auth-plan.selected .auth-plan-check{border-color:#2DD4BF}.auth-plan.selected .auth-plan-check:after{content:'';position:absolute;width:7px;height:7px;border-radius:50%;background:#2DD4BF;inset:3.5px}.auth-plan-help{margin-top:10px;font-size:9.5px;color:#7189A4;line-height:1.55}.auth-plan-help strong{color:#A8BDD3}
      @media(max-width:520px){.auth-modal{padding:22px}.auth-form-grid{grid-template-columns:1fr}.auth-head h2{font-size:22px}}
    `}</style>
    <div className="auth-modal" onKeyDown={e=>{if(e.key==='Enter'&&!isForgot&&step==='form')void submit()}}>
      <div className="auth-head"><div><div className="auth-step">{isForgot?'ACCOUNT RECOVERY':isLogin?'ONE HEALTHCONNECT SIGN IN':registrationStep}</div><h2>{heading}</h2><p>{subheading}</p></div><button className="auth-close" onClick={onClose}>×</button></div>

      {isForgot ? (forgotSent ? <div className="auth-reset"><div className="auth-reset-icon">✉️</div><h3>Check your inbox</h3><p>If an account exists for <b>{forgotEmail}</b>, password-reset instructions will be sent. We do not reveal whether an email is registered.</p><button className="auth-main-btn" onClick={()=>onModeChange('login')}>Back to Sign In</button></div> : <><input className="auth-input" type="email" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} placeholder="Email address" autoFocus/><button className="auth-main-btn" disabled={loading} onClick={()=>void sendReset()}>{loading?'Sending…':'Send Reset Link'}</button><p className="auth-linkline"><button className="auth-text-btn" onClick={()=>onModeChange('login')}>← Back to Sign In</button></p></>) : null}

      {!isForgot && !isLogin && step==='role' && <><div className="auth-roles">{ROLES.map(r=><button className={`auth-role ${role===r.key?'active':''}`} key={r.key} onClick={()=>{setRole(r.key);setSelectedPlanId('')}}><div className="auth-role-icon">{r.icon}</div><div><strong>{r.title}</strong><span>{r.desc}</span></div><div className="auth-radio"/></button>)}</div><button className="auth-main-btn" onClick={continueFromRole}>Continue as {selectedRole.short} →</button><p className="auth-linkline">Already have an account? <button className="auth-text-btn" onClick={()=>onModeChange('login')}>Sign in</button></p></>}

      {!isForgot && !isLogin && step==='plan' && <><button className="auth-back" onClick={()=>{setStep('role');setError('')}}>← Change account type</button>{plansLoading?<div className="auth-plan-help">Loading current HealthConnect memberships…</div>:<div className="auth-plans">{rolePlans.map(plan=><button key={plan.id} type="button" className={`auth-plan ${selectedPlan?.id===plan.id?'selected':''}`} onClick={()=>setSelectedPlanId(plan.id)}><div className="auth-plan-top"><div><div className="auth-plan-name">{plan.displayName}</div><div style={{fontSize:9.5,color:'#7F96B0',marginTop:3}}>{role==='PATIENT'?'Personal health platform membership':'Professional HealthConnect workspace'}</div></div><div className="auth-plan-price">{money(plan.pricing?.monthlyPaise)} <span>/ month</span></div></div>{plan.introOffer?.available&&<div className="auth-plan-offer">{plan.introOffer.description || `${money(plan.introOffer.amountPaise)} for the first ${plan.introOffer.cycles||3} billing cycles.`}</div>}<div className="auth-plan-features">{(plan.features||[]).slice(0,3).map((feature,i)=><span key={`${feature}-${i}`}>{feature}</span>)}</div><div className="auth-plan-check"/></button>)}{!rolePlans.length&&<div className="auth-error">Membership catalog is temporarily unavailable. Please try again.</div>}</div>}<div className="auth-plan-help"><strong>Consultations are separate.</strong> Doctor consultation fees are set by individual doctors and are not included in the platform membership.</div>{error&&<div className="auth-error" style={{marginTop:10}}>{error}</div>}<button className="auth-main-btn" disabled={plansLoading||(!selectedPlan&&rolePlans.length===0)} onClick={continueFromPlan}>Continue with {selectedPlan?.displayName||selectedRole.short} →</button></>}

      {!isForgot && (isLogin || step==='form') && <>{!isLogin&&<button className="auth-back" onClick={()=>{setStep(role==='HOSPITAL'?'role':'plan');setError('')}}>← {role==='HOSPITAL'?'Change account type':'Change membership'}</button>}{!isLogin&&selectedPlan&&<div className="auth-plan-help" style={{marginBottom:10,padding:'8px 10px',borderRadius:9,background:'rgba(45,212,191,.07)',border:'1px solid rgba(45,212,191,.12)'}}>Selected: <strong>{selectedPlan.displayName} · {money(selectedPlan.pricing?.monthlyPaise)}/month</strong>. Your account is created first, then secure membership checkout follows.</div>}{!isLogin&&<div className="auth-form-grid"><input className="auth-input" value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="First name"/><input className="auth-input" value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Last name"/></div>}<input className="auth-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" autoComplete="email"/><input className="auth-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" autoComplete={isLogin?'current-password':'new-password'}/>{isLogin&&<div className="auth-forgot-row"><button className="auth-text-btn" onClick={()=>onModeChange('forgot')}>Forgot password?</button></div>}{error&&<div className="auth-error">⚠ {error}</div>}<button className="auth-main-btn" disabled={loading} onClick={()=>void submit()}>{loading?'Please wait…':isLogin?'Sign In':'Create Account & Continue →'}</button>{isLogin&&<div className="auth-context"><div className="auth-context-title">ONE SIGN IN · MEMBERSHIP STATUS CHECKED AUTOMATICALLY</div>{SIGNIN_DESTINATIONS.map(([icon,title,copy])=><div className="auth-destination" key={title}><span>{icon}</span><b>{title}</b><span>{copy}</span></div>)}<div className="auth-role-note">Patient and Doctor workspaces require an active membership. If a membership has expired or is missing, HealthConnect keeps the account signed in and routes directly to Membership & Billing to renew.</div></div>}<p className="auth-linkline">{isLogin?'New to HealthConnect? ':'Already have an account? '}<button className="auth-text-btn" onClick={()=>onModeChange(isLogin?'register':'login')}>{isLogin?'Create account':'Sign in'}</button></p></>}
    </div>
  </div>;
}
