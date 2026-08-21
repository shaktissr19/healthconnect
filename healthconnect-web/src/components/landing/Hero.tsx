'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

export type PlatformStats = {
  patients: number | null;
  doctors: number | null;
  communities: number | null;
  hospitals: number | null;
};

type RoleId = 'patient' | 'community' | 'doctor' | 'hospital';
type Action = { label: string; href?: string; action?: 'signup' | 'login' | 'my-health' };
type RoleContent = {
  id: RoleId;
  label: string;
  icon: string;
  eyebrow: string;
  headline: string;
  body: string;
  primary: Action;
  secondary: Action;
  accent: string;
};

const ROLES: RoleContent[] = [
  {
    id: 'patient', label: 'For Patients', icon: '♥', accent: '#38BDF8',
    eyebrow: 'YOUR HEALTH, CONNECTED',
    headline: 'Everything your health needs, connected.',
    body: 'Find doctors and hospitals, book appointments, organise reports and medicines, and keep your healthcare journey together in one private account.',
    primary: { label: 'Find Doctors', href: '/doctors' },
    secondary: { label: 'Find Hospitals', href: '/hospitals' },
  },
  {
    id: 'community', label: 'Health Communities', icon: '🤝', accent: '#34D399',
    eyebrow: 'SUPPORT BEYOND THE APPOINTMENT',
    headline: 'Connect with people who understand the health journey.',
    body: 'Browse condition-focused communities, join conversations, attend Q&A events and use anonymous posting where the community allows it.',
    primary: { label: 'Browse Communities', href: '/communities' },
    secondary: { label: 'Create Free Account', action: 'signup' },
  },
  {
    id: 'doctor', label: 'For Doctors', icon: '🩺', accent: '#A78BFA',
    eyebrow: 'A DIGITAL PRACTICE BUILT AROUND CARE',
    headline: 'Patients, appointments and your digital practice — together.',
    body: 'Create a provider profile, publish availability, manage appointments, review patient-shared health context and coordinate hospital affiliations.',
    primary: { label: 'Register as a Doctor', action: 'signup' },
    secondary: { label: 'Doctor Sign In', action: 'login' },
  },
  {
    id: 'hospital', label: 'For Hospitals', icon: '🏥', accent: '#F59E0B',
    eyebrow: 'DIGITAL HOSPITAL ACCESS',
    headline: 'Put your doctors, OPD and services where patients can find them.',
    body: 'Publish departments, facilities, affiliated doctors and hospital-specific OPD, then manage appointments from the hospital workspace.',
    primary: { label: 'Register Hospital', action: 'signup' },
    secondary: { label: 'Hospital Sign In', action: 'login' },
  },
];

const formatCount = (value: number | null) => value === null || !Number.isFinite(value) ? '—' : new Intl.NumberFormat('en-IN').format(value);

function PatientPreview(){
  return <div className="hero-preview-grid">
    <div className="hero-card"><small>MY HEALTH</small><div className="score"><strong>67</strong><span>/100<br/>Health Score</span></div><div className="meter"><i/></div></div>
    <div className="hero-card"><small>NEXT APPOINTMENT</small><b>Dr. Arun Kumar</b><p>AIIMS New Delhi · Hospital OPD</p><em>Confirmed</em></div>
    <div className="hero-card wide"><small>YOUR HEALTH JOURNEY</small><div className="mini-flow"><span>Reports</span><i/> <span>Medicines</span><i/> <span>Visits</span><i/> <span>Follow-up</span></div></div>
  </div>;
}

function CommunityPreview(){
  return <div className="hero-preview-stack">
    <div className="hero-card"><small>ANONYMOUS COMMUNITY POST</small><b>Diabetes Support</b><p>“How do others manage meals when glucose readings change after dinner?”</p><div className="preview-meta">♡ 18 &nbsp; · &nbsp; 7 replies &nbsp; · &nbsp; Report</div></div>
    <div className="hero-card soft-green"><small>COMMUNITY SAFETY</small><b>Membership, moderation & events</b><p>Anonymous posting can hide identity from other members while reporting and moderation stay available.</p></div>
  </div>;
}

function DoctorPreview(){
  return <div className="hero-preview-stack">
    <div className="hero-card"><small>TODAY'S APPOINTMENTS</small>{[['10:00','Priya Sharma','Confirmed'],['10:30','Rahul Verma','Checked in'],['11:00','Meena Iyer','Pending']].map(([t,n,s])=><div className="appt" key={t}><b>{t}</b><span>{n}</span><em>{s}</em></div>)}</div>
    <div className="hero-preview-grid"><div className="hero-card"><small>AVAILABILITY</small><b>OPD & consultation slots</b></div><div className="hero-card"><small>CARE CONTEXT</small><b>Patient-shared history</b></div></div>
  </div>;
}

function HospitalPreview(){
  return <div className="hero-preview-stack">
    <div className="hero-card"><small>HOSPITAL OPERATIONS</small><div className="hospital-kpis"><div><b>2</b><span>Doctors</span></div><div><b>2</b><span>Departments</span></div><div><b>4</b><span>OPD slots</span></div></div></div>
    <div className="hero-card"><small>APPOINTMENT FLOW</small><div className="status-flow"><span>Pending</span><i>→</i><span>Confirmed</span><i>→</i><span>Checked in</span><i>→</i><span>In progress</span></div></div>
    <div className="hero-card"><small>PUBLIC HOSPITAL PROFILE</small><div className="facility-grid"><span>Departments</span><span>Facilities</span><span>Insurance & schemes</span><span>Hospital OPD</span></div></div>
  </div>;
}

export default function Hero({ stats }: { stats: PlatformStats }){
  const [active,setActive] = useState<RoleId>('patient');
  const [paused,setPaused] = useState(false);
  const router = useRouter();
  const { user,isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const current = useMemo(()=>ROLES.find(r=>r.id===active) ?? ROLES[0],[active]);

  useEffect(()=>{
    if(paused) return;
    if(typeof window!=='undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setTimeout(()=>{
      setActive(prev=>{
        const index = ROLES.findIndex(r=>r.id===prev);
        return ROLES[(index+1)%ROLES.length].id;
      });
    },6500);
    return()=>window.clearTimeout(timer);
  },[active,paused]);

  const signup = (role:'PATIENT'|'DOCTOR'|'HOSPITAL'='PATIENT')=>{
    try{sessionStorage.setItem('hc_signup_role',role);}catch{}
    openAuthModal('register');
  };
  const login = (redirect?:string)=>{
    try{if(redirect) sessionStorage.setItem('hc_post_login_redirect',redirect);}catch{}
    openAuthModal('login');
  };
  const myHealth = ()=>{
    if(!isAuthenticated || !user){login('/dashboard');return;}
    const role=String(user.role??'').toUpperCase();
    router.push(role==='PATIENT'?'/dashboard':role==='DOCTOR'?'/doctor-dashboard':role==='HOSPITAL'?'/hospital-dashboard':'/admin-dashboard');
  };
  const run = (action:Action)=>{
    if(action.href){router.push(action.href);return;}
    if(action.action==='login'){
      login(active==='doctor'?'/doctor-dashboard':active==='hospital'?'/hospital-dashboard':active==='patient'?'/dashboard':undefined);
      return;
    }
    if(action.action==='my-health'){myHealth();return;}
    signup(active==='doctor'?'DOCTOR':active==='hospital'?'HOSPITAL':'PATIENT');
  };

  const preview = active==='patient'?<PatientPreview/>:active==='community'?<CommunityPreview/>:active==='doctor'?<DoctorPreview/>:<HospitalPreview/>;
  const metrics = [
    ['♥',formatCount(stats.patients),'Patient profiles'],
    ['🩺',formatCount(stats.doctors),'Doctor profiles'],
    ['🏥',formatCount(stats.hospitals),'Hospital profiles'],
    ['🤝',formatCount(stats.communities),'Health communities'],
  ];

  return <section className="hero-shell">
    <style>{`
      .hero-shell{padding:76px 28px 26px;background:#fff;font-family:'DM Sans',Arial,sans-serif}
      .hero-wrap{max-width:1280px;margin:0 auto;border-radius:22px;overflow:hidden;background:radial-gradient(circle at 88% 12%,rgba(20,184,166,.16),transparent 30%),linear-gradient(135deg,#061225 0%,#0A1A33 56%,#0C2A45 100%);border:1px solid rgba(148,163,184,.15);box-shadow:0 16px 46px rgba(15,23,42,.15);position:relative}
      .hero-wrap:before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px);background-size:40px 40px;mask-image:linear-gradient(to left,#000,transparent 70%);pointer-events:none}
      .role-tabs{height:55px;display:flex;align-items:center;gap:7px;padding:0 28px;position:relative;z-index:2;overflow-x:auto;scrollbar-width:none}
      .role-tab{position:relative;overflow:hidden;border:1px solid rgba(148,163,184,.18);background:rgba(255,255,255,.035);color:#A9BED6;border-radius:10px;padding:9px 14px;display:flex;gap:7px;align-items:center;font-size:12px;font-weight:800;white-space:nowrap;cursor:pointer}
      .role-tab.active{color:#fff;background:rgba(255,255,255,.08);border-color:var(--accent)}
      .role-tab.active:after{content:'';position:absolute;left:0;bottom:0;height:2px;background:var(--accent);animation:roleProgress 6.5s linear forwards}
      @keyframes roleProgress{from{width:0}to{width:100%}}
      .hero-main{min-height:315px;display:grid;grid-template-columns:minmax(0,1.03fr) minmax(390px,.97fr);gap:40px;align-items:center;padding:24px 54px 28px;position:relative;z-index:2}
      .hero-eyebrow{font-size:10px;font-weight:900;letter-spacing:.18em;color:var(--accent);margin-bottom:10px}.hero-main h1{font-family:'Sora','DM Sans',sans-serif;color:#F8FBFF;font-size:clamp(2.25rem,3.45vw,3.55rem);line-height:1.04;letter-spacing:-.045em;margin:0 0 13px;max-width:690px}.hero-copy{font-size:14px;line-height:1.65;color:#BCD0E5;max-width:650px;margin:0 0 18px}
      .hero-actions{display:flex;gap:9px;flex-wrap:wrap}.hero-btn{border-radius:9px;padding:10px 17px;font-size:11.5px;font-weight:900;cursor:pointer;border:1px solid transparent;font-family:inherit}.hero-btn.primary{background:var(--accent);color:#061225}.hero-btn.secondary{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.22);color:#fff}.hero-account-links{display:flex;gap:15px;align-items:center;flex-wrap:wrap;margin-top:12px}.hero-text-link{background:none;border:0;padding:0;color:#8FB1D2;font-size:10.5px;font-weight:750;cursor:pointer}.hero-text-link:hover{color:#fff;text-decoration:underline}
      .preview-shell{background:rgba(255,255,255,.055);border:1px solid rgba(148,163,184,.18);border-radius:17px;padding:13px;box-shadow:0 20px 55px rgba(0,0,0,.2)}.preview-top{display:flex;justify-content:space-between;align-items:center;padding:0 2px 9px;font-size:8.5px;font-weight:900;letter-spacing:.13em;color:#8CA6C4;text-transform:uppercase}.live{color:#86EFAC;display:flex;align-items:center;gap:6px}.live:before{content:'';width:6px;height:6px;border-radius:50%;background:#22C55E;box-shadow:0 0 0 4px rgba(34,197,94,.12)}
      .hero-preview-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.hero-preview-stack{display:grid;gap:8px}.hero-card{background:#F8FBFF;border:1px solid #DCE7F0;border-radius:11px;padding:11px;color:#10233C;min-width:0}.hero-card.wide{grid-column:1/-1}.hero-card small{display:block;font-size:7.5px;font-weight:900;letter-spacing:.11em;color:#718BA9;margin-bottom:6px}.hero-card>b{display:block;font-size:11px}.hero-card p{font-size:9px;line-height:1.4;color:#64748B;margin:4px 0 7px}.hero-card em{font-style:normal;font-size:7.5px;font-weight:850;color:#0F766E;background:#CCFBF1;padding:3px 6px;border-radius:999px}.score{display:flex;gap:6px;align-items:end}.score strong{font-family:'Sora',sans-serif;font-size:29px;line-height:1;color:#0D9488}.score span{font-size:7px;color:#64748B}.meter{height:4px;border-radius:999px;background:#E2E8F0;margin-top:9px;overflow:hidden}.meter i{display:block;height:100%;width:67%;background:linear-gradient(90deg,#0D9488,#38BDF8)}.mini-flow{display:flex;align-items:center;gap:5px;flex-wrap:wrap}.mini-flow span,.facility-grid span,.status-flow span{font-size:7.5px;font-weight:800;border-radius:6px;padding:4px 6px;background:#EDF4FA;color:#24405F}.mini-flow i{width:8px;height:1px;background:#B8C8D9}.preview-meta{font-size:8px;color:#718096}.soft-green{background:#F0FDF4;border-color:#BBF7D0}.appt{display:grid;grid-template-columns:46px 1fr auto;gap:7px;padding:6px 0;border-bottom:1px solid #E5EDF4;font-size:8px}.appt:last-child{border-bottom:0}.appt em{font-size:7px}.hospital-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.hospital-kpis div{padding:7px;border-radius:7px;background:#EFF6FF}.hospital-kpis b{display:block;font-family:'Sora',sans-serif;font-size:16px;color:#0F4C81}.hospital-kpis span{font-size:7px;color:#64748B}.status-flow{display:flex;gap:4px;align-items:center;flex-wrap:wrap}.status-flow i{font-style:normal;color:#94A3B8}.facility-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px}
      .hero-stats{position:relative;z-index:2;display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid rgba(148,163,184,.15);background:rgba(2,12,27,.38)}.hero-stat{display:flex;align-items:center;justify-content:center;gap:9px;padding:11px 14px;border-right:1px solid rgba(148,163,184,.13)}.hero-stat:last-child{border-right:0}.hero-stat .icon{font-size:13px}.hero-stat strong{font-family:'Sora',sans-serif;font-size:18px;color:#F8FBFF;line-height:1}.hero-stat span{font-size:8.5px;line-height:1.25;color:#89A7C5}
      @media(max-width:950px){.hero-main{grid-template-columns:1fr;padding:28px 32px}.preview-shell{max-width:620px}.hero-stats{grid-template-columns:1fr 1fr}.hero-stat:nth-child(2){border-right:0}.hero-stat:nth-child(-n+2){border-bottom:1px solid rgba(148,163,184,.13)}}
      @media(max-width:640px){.hero-shell{padding:72px 12px 22px}.role-tabs{padding:0 14px;height:50px}.role-tab{font-size:10px;padding:8px 9px}.hero-main{padding:22px 18px 24px;gap:22px}.hero-main h1{font-size:2.05rem}.hero-copy{font-size:13px}.hero-preview-grid{grid-template-columns:1fr}.hero-card.wide{grid-column:auto}.hero-actions{display:grid;grid-template-columns:1fr 1fr}.hero-stats{grid-template-columns:1fr 1fr}.hero-stat{justify-content:flex-start;padding:10px 12px}}
    `}</style>

    <div className="hero-wrap" style={{'--accent':current.accent} as React.CSSProperties} onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>
      <div className="role-tabs" role="tablist" aria-label="HealthConnect for different users">
        {ROLES.map(role=><button key={role.id} className={`role-tab ${active===role.id?'active':''}`} style={{'--accent':role.accent} as React.CSSProperties} onClick={()=>setActive(role.id)} role="tab" aria-selected={active===role.id}><span>{role.icon}</span>{role.label}</button>)}
      </div>

      <div className="hero-main">
        <div>
          <div className="hero-eyebrow">{current.eyebrow}</div>
          <h1>{current.headline}</h1>
          <p className="hero-copy">{current.body}</p>
          <div className="hero-actions"><button className="hero-btn primary" onClick={()=>run(current.primary)}>{current.primary.label} →</button><button className="hero-btn secondary" onClick={()=>run(current.secondary)}>{current.secondary.label}</button></div>
          <div className="hero-account-links">
            {active==='patient'&&<><button className="hero-text-link" onClick={()=>signup('PATIENT')}>New here? Create Patient Account →</button><button className="hero-text-link" onClick={myHealth}>Already registered? Sign In / My Health →</button></>}
            {active==='community'&&<button className="hero-text-link" onClick={()=>login()}>Already have an account? Sign In →</button>}
            {active==='doctor'&&<span className="hero-text-link" style={{cursor:'default'}}>Provider verification status is displayed after review.</span>}
            {active==='hospital'&&<span className="hero-text-link" style={{cursor:'default'}}>Verified hospitals can publish doctors, services and hospital OPD.</span>}
          </div>
        </div>
        <div className="preview-shell"><div className="preview-top"><span>HealthConnect product preview</span><span className="live">Live platform</span></div>{preview}</div>
      </div>

      <div className="hero-stats" aria-label="Current HealthConnect platform footprint">
        {metrics.map(([icon,value,label])=><div className="hero-stat" key={label}><span className="icon">{icon}</span><strong>{value}</strong><span>{label}</span></div>)}
      </div>
    </div>
  </section>;
}
