'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

type RoleId = 'patient' | 'community' | 'doctor' | 'hospital';

type RoleConfig = {
  id: RoleId;
  label: string;
  icon: string;
  eyebrow: string;
  headline: string;
  body: string;
  accent: string;
};

const ROLES: RoleConfig[] = [
  {
    id: 'patient',
    label: 'For Patients',
    icon: '♥',
    eyebrow: 'YOUR HEALTH, CONNECTED',
    headline: 'Everything your health needs, connected.',
    body: 'Find doctors and hospitals, book appointments, organise reports and medicines, and keep your health journey in one private account.',
    accent: '#38BDF8',
  },
  {
    id: 'community',
    label: 'Health Communities',
    icon: '🤝',
    eyebrow: 'SUPPORT BEYOND THE APPOINTMENT',
    headline: 'Health support should not end when the appointment does.',
    body: 'Join condition-focused communities, ask questions, share experiences, attend Q&A events and use anonymous posting where a community allows it.',
    accent: '#34D399',
  },
  {
    id: 'doctor',
    label: 'For Doctors',
    icon: '🩺',
    eyebrow: 'YOUR DIGITAL PRACTICE',
    headline: 'Patients, appointments and your practice in one workspace.',
    body: 'Build a provider profile, publish availability, manage appointments and work with patient-shared health context and hospital affiliations.',
    accent: '#A78BFA',
  },
  {
    id: 'hospital',
    label: 'For Hospitals',
    icon: '🏥',
    eyebrow: 'DIGITAL HOSPITAL ACCESS',
    headline: 'Make your doctors, OPD and services easier to discover.',
    body: 'Publish departments, facilities, affiliated doctors and hospital-specific OPD, then manage appointments from the Hospital workspace.',
    accent: '#F59E0B',
  },
];

export default function LandingHero(){
  const [active,setActive] = useState<RoleId>('patient');
  const router = useRouter();
  const { user,isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const current = useMemo(()=>ROLES.find(r=>r.id===active) ?? ROLES[0],[active]);

  useEffect(()=>{
    if(typeof window!=='undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setTimeout(()=>{
      setActive(prev=>{
        const index = ROLES.findIndex(r=>r.id===prev);
        return ROLES[(index+1)%ROLES.length].id;
      });
    },5600);
    return()=>window.clearTimeout(timer);
  },[active]);

  const signup = (role:'PATIENT'|'DOCTOR'|'HOSPITAL')=>{
    try{sessionStorage.setItem('hc_signup_role',role);}catch{}
    openAuthModal('register');
  };

  const signIn = ()=>openAuthModal('login');

  const openMyHealth = ()=>{
    if(!isAuthenticated || !user){
      try{sessionStorage.setItem('hc_post_login_redirect','/dashboard');}catch{}
      signIn();
      return;
    }
    const role=String(user.role??'').toUpperCase();
    router.push(role==='PATIENT'?'/dashboard':role==='DOCTOR'?'/doctor-dashboard':role==='HOSPITAL'?'/hospital-dashboard':'/admin-dashboard');
  };

  const preview = active==='patient' ? (
    <div className="lh-preview-grid">
      <div className="lh-card"><small>MY HEALTH</small><div className="lh-score">67 <span>/100</span></div><p>Health score</p></div>
      <div className="lh-card"><small>NEXT APPOINTMENT</small><b>Dr. Arun Kumar</b><p>Hospital OPD · Confirmed</p></div>
      <div className="lh-card wide"><small>HEALTH JOURNEY</small><div className="lh-flow"><span>Reports</span><i/> <span>Medicines</span><i/> <span>Visits</span><i/> <span>Follow-up</span></div></div>
    </div>
  ) : active==='community' ? (
    <div className="lh-community-preview">
      <div className="lh-card"><small>ANONYMOUS POST · DIABETES SUPPORT</small><b>“How do others manage meals when glucose readings change after dinner?”</b><p>18 reactions · 7 replies</p></div>
      <div className="lh-card green"><small>COMMUNITY SAFETY</small><b>Membership · Moderation · Q&A events</b><p>Anonymous posting can hide identity from other members while reporting and moderation remain available.</p></div>
    </div>
  ) : active==='doctor' ? (
    <div className="lh-community-preview">
      <div className="lh-card"><small>TODAY'S APPOINTMENTS</small><div className="lh-row"><b>10:00</b><span>Priya Sharma</span><em>Confirmed</em></div><div className="lh-row"><b>10:30</b><span>Rahul Verma</span><em>Checked in</em></div><div className="lh-row"><b>11:00</b><span>Meena Iyer</span><em>Pending</em></div></div>
      <div className="lh-preview-grid"><div className="lh-card"><small>AVAILABILITY</small><b>OPD & consultation slots</b></div><div className="lh-card"><small>CARE CONTEXT</small><b>Patient-shared history</b></div></div>
    </div>
  ) : (
    <div className="lh-community-preview">
      <div className="lh-preview-grid"><div className="lh-card"><small>DOCTORS</small><div className="lh-kpi">2</div></div><div className="lh-card"><small>DEPARTMENTS</small><div className="lh-kpi">2</div></div></div>
      <div className="lh-card"><small>HOSPITAL OPD WORKFLOW</small><div className="lh-flow"><span>Pending</span><i/> <span>Confirmed</span><i/> <span>Checked in</span><i/> <span>In progress</span></div></div>
    </div>
  );

  return <section className="lh-shell">
    <style>{`
      .lh-shell{background:#fff;padding:18px 28px 24px;font-family:'DM Sans',Arial,sans-serif}.lh-wrap{max-width:1280px;margin:0 auto;border-radius:22px;overflow:hidden;background:radial-gradient(circle at 88% 8%,rgba(20,184,166,.16),transparent 30%),linear-gradient(135deg,#061225 0%,#0A1A33 58%,#0B2943 100%);box-shadow:0 16px 42px rgba(15,23,42,.14);border:1px solid rgba(148,163,184,.15)}
      .lh-tabs{display:flex;gap:7px;padding:14px 28px 0;overflow-x:auto;scrollbar-width:none}.lh-tab{position:relative;overflow:hidden;border:1px solid rgba(148,163,184,.18);background:rgba(255,255,255,.035);color:#AFC2D8;border-radius:10px;padding:10px 15px;font-weight:850;font-size:12px;cursor:pointer;white-space:nowrap}.lh-tab.active{color:#fff;border-color:var(--accent);background:rgba(255,255,255,.075)}.lh-tab.active:after{content:'';position:absolute;left:0;bottom:0;height:2px;background:var(--accent);animation:lhProgress 5.6s linear forwards}.lh-tab span{margin-right:6px}@keyframes lhProgress{from{width:0}to{width:100%}}
      .lh-main{display:grid;grid-template-columns:minmax(0,1.02fr) minmax(380px,.98fr);gap:40px;align-items:center;padding:28px 54px 30px;min-height:300px}.lh-eyebrow{font-size:10px;letter-spacing:.18em;font-weight:900;color:var(--accent);margin-bottom:10px}.lh-copy h1{font-family:'Sora','DM Sans',sans-serif;color:#F8FBFF;font-size:clamp(2.25rem,3.45vw,3.5rem);line-height:1.03;letter-spacing:-.045em;margin:0 0 12px}.lh-copy>p{font-size:14px;line-height:1.65;color:#BCD0E5;margin:0 0 18px;max-width:650px}.lh-actions{display:flex;gap:9px;flex-wrap:wrap}.lh-btn{border-radius:9px;padding:10px 16px;font-size:11.5px;font-weight:900;cursor:pointer;font-family:inherit}.lh-primary{border:1px solid var(--accent);background:var(--accent);color:#061225}.lh-secondary{border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.04);color:#fff}.lh-links{display:flex;gap:16px;flex-wrap:wrap;margin-top:12px}.lh-link{border:0;background:none;color:#8FB1D2;padding:0;font-size:10.5px;font-weight:800;cursor:pointer}.lh-link:hover{color:#fff;text-decoration:underline}
      .lh-preview{background:rgba(255,255,255,.055);border:1px solid rgba(148,163,184,.18);border-radius:17px;padding:13px;box-shadow:0 18px 50px rgba(0,0,0,.2)}.lh-preview-head{display:flex;justify-content:space-between;align-items:center;color:#8CA6C4;font-size:8.5px;font-weight:900;letter-spacing:.13em;margin-bottom:9px}.lh-live{color:#86EFAC}.lh-preview-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.lh-community-preview{display:grid;gap:8px}.lh-card{background:#F8FBFF;border:1px solid #DCE7F0;border-radius:11px;padding:11px;color:#10233C}.lh-card.wide{grid-column:1/-1}.lh-card.green{background:#F0FDF4;border-color:#BBF7D0}.lh-card small{display:block;color:#718BA9;font-size:7.5px;font-weight:900;letter-spacing:.1em;margin-bottom:6px}.lh-card b{display:block;font-size:10.5px;line-height:1.4}.lh-card p{font-size:8.5px;line-height:1.42;color:#64748B;margin:4px 0 0}.lh-score{font-family:'Sora',sans-serif;font-size:28px;color:#0D9488;font-weight:850}.lh-score span{font-size:8px;color:#64748B}.lh-flow{display:flex;align-items:center;gap:5px;flex-wrap:wrap}.lh-flow span{font-size:7.5px;font-weight:850;background:#EDF4FA;color:#24405F;padding:4px 6px;border-radius:6px}.lh-flow i{height:1px;width:8px;background:#B8C8D9}.lh-row{display:grid;grid-template-columns:48px 1fr auto;gap:7px;align-items:center;padding:6px 0;border-bottom:1px solid #E5EDF4;font-size:8px}.lh-row:last-child{border-bottom:0}.lh-row em{font-style:normal;background:#CCFBF1;color:#0F766E;padding:3px 5px;border-radius:999px;font-size:7px}.lh-kpi{font-family:'Sora',sans-serif;font-size:24px;color:#0F4C81;font-weight:850}
      .lh-carousel{border-top:1px solid rgba(148,163,184,.14);background:rgba(2,12,27,.32);display:flex;align-items:center;justify-content:space-between;padding:10px 28px;color:#819AB6;font-size:9px}.lh-dots{display:flex;gap:6px}.lh-dot{width:24px;height:3px;border-radius:999px;background:rgba(148,163,184,.24);border:0;padding:0;cursor:pointer}.lh-dot.active{background:var(--accent)}.lh-auto{display:flex;align-items:center;gap:7px;font-weight:850;letter-spacing:.08em}.lh-auto:before{content:'';width:6px;height:6px;border-radius:50%;background:#22C55E;box-shadow:0 0 0 3px rgba(34,197,94,.13)}
      @media(max-width:930px){.lh-main{grid-template-columns:1fr;padding:25px 28px 28px}.lh-preview{max-width:720px}.lh-copy h1{font-size:2.45rem}}
      @media(max-width:620px){.lh-shell{padding:10px 12px 18px}.lh-tabs{padding:12px 14px 0}.lh-main{padding:22px 18px 24px}.lh-copy h1{font-size:2.05rem}.lh-preview-grid{grid-template-columns:1fr}.lh-card.wide{grid-column:auto}.lh-carousel{padding:10px 16px}}
    `}</style>
    <div className="lh-wrap" style={{'--accent':current.accent} as React.CSSProperties}>
      <div className="lh-tabs">{ROLES.map(role=><button key={role.id} className={`lh-tab ${active===role.id?'active':''}`} style={{'--accent':role.accent} as React.CSSProperties} onClick={()=>setActive(role.id)}><span>{role.icon}</span>{role.label}</button>)}</div>
      <div className="lh-main">
        <div className="lh-copy">
          <div className="lh-eyebrow">{current.eyebrow}</div>
          <h1>{current.headline}</h1>
          <p>{current.body}</p>
          {active==='patient'&&<><div className="lh-actions"><button className="lh-btn lh-primary" onClick={()=>router.push('/doctors')}>Find Doctors →</button><button className="lh-btn lh-secondary" onClick={()=>router.push('/hospitals')}>Find Hospitals</button></div><div className="lh-links"><button className="lh-link" onClick={()=>signup('PATIENT')}>New here? Create Patient Account →</button><button className="lh-link" onClick={openMyHealth}>Already registered? Sign In / My Health →</button></div></>}
          {active==='community'&&<><div className="lh-actions"><button className="lh-btn lh-primary" onClick={()=>router.push('/communities')}>Explore Communities →</button><button className="lh-btn lh-secondary" onClick={()=>signup('PATIENT')}>Create Free Account</button></div><div className="lh-links"><button className="lh-link" onClick={signIn}>Already registered? Sign In →</button></div></>}
          {active==='doctor'&&<div className="lh-actions"><button className="lh-btn lh-primary" onClick={()=>signup('DOCTOR')}>Register as a Doctor →</button><button className="lh-btn lh-secondary" onClick={signIn}>Doctor Sign In</button></div>}
          {active==='hospital'&&<div className="lh-actions"><button className="lh-btn lh-primary" onClick={()=>signup('HOSPITAL')}>Register Hospital →</button><button className="lh-btn lh-secondary" onClick={signIn}>Hospital Sign In</button></div>}
        </div>
        <div className="lh-preview"><div className="lh-preview-head"><span>HEALTHCONNECT PRODUCT PREVIEW</span><span className="lh-live">● LIVE PLATFORM</span></div>{preview}</div>
      </div>
      <div className="lh-carousel"><div className="lh-dots">{ROLES.map(role=><button key={role.id} aria-label={`Show ${role.label}`} className={`lh-dot ${active===role.id?'active':''}`} onClick={()=>setActive(role.id)}/>)}</div><div className="lh-auto">AUTO ROTATING · {ROLES.findIndex(r=>r.id===active)+1} / {ROLES.length}</div></div>
    </div>
  </section>;
}
