'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import PlatformDemoPlayer from './PlatformDemoPlayer';

type RoleId = 'patient' | 'community' | 'doctor' | 'hospital' | 'knowledge';

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
  {id:'patient',label:'For Patients',icon:'♥',eyebrow:'YOUR HEALTH, CONNECTED',headline:'Everything your health needs, connected.',body:'Find doctors and hospitals, book appointments, organise reports and medicines, and keep your health journey together in one private account.',accent:'#38BDF8'},
  {id:'community',label:'Health Communities',icon:'🤝',eyebrow:'SUPPORT BETWEEN APPOINTMENTS',headline:'Stay supported after the consultation ends.',body:'Join condition-focused communities, learn from peer experience, attend Q&A events and post anonymously where a community allows it.',accent:'#34D399'},
  {id:'doctor',label:'For Doctors',icon:'🩺',eyebrow:'YOUR DIGITAL PRACTICE',headline:'Patients, appointments and your practice in one workspace.',body:'Build your HealthConnect profile, publish availability, manage appointments and work with patient-shared health context and hospital affiliations.',accent:'#A78BFA'},
  {id:'hospital',label:'For Hospitals',icon:'🏥',eyebrow:'DIGITAL HOSPITAL ACCESS',headline:'Make your doctors, OPD and services easier to discover.',body:'Publish departments, facilities, affiliated doctors and hospital-specific OPD, then manage appointments from the Hospital workspace.',accent:'#F59E0B'},
  {id:'knowledge',label:'Knowledge Hub',icon:'📚',eyebrow:'HEALTH KNOWLEDGE, IN FAMILIAR LANGUAGE',headline:'Understand more before your next health conversation.',body:'Explore India-focused explainers and guides across diabetes, heart health, women’s health, mental wellbeing and other everyday healthcare topics.',accent:'#60A5FA'},
];

function PatientPreview(){return <div className="lh-preview-grid"><div className="lh-card"><small>MY HEALTH</small><div className="lh-score">67 <span>/100</span></div><p>Health score</p></div><div className="lh-card"><small>NEXT APPOINTMENT</small><b>Dr. Arun Kumar</b><p>Hospital OPD · Confirmed</p></div><div className="lh-card wide"><small>HEALTH JOURNEY</small><div className="lh-flow"><span>Reports</span><i/><span>Medicines</span><i/><span>Visits</span><i/><span>Follow-up</span></div></div></div>}
function CommunityPreview(){return <div className="lh-preview-stack"><div className="lh-card"><small>ANONYMOUS POST · DIABETES SUPPORT</small><b>“How do others manage meals when glucose readings change after dinner?”</b><p>18 reactions · 7 replies</p></div><div className="lh-preview-grid"><div className="lh-card green"><small>COMMUNITY SAFETY</small><b>Membership · moderation · reporting</b></div><div className="lh-card"><small>Q&A & EVENTS</small><b>Keep learning between visits</b></div></div></div>}
function DoctorPreview(){return <div className="lh-preview-stack"><div className="lh-card"><small>TODAY'S APPOINTMENTS</small><div className="lh-row"><b>10:00</b><span>Priya Sharma</span><em>Confirmed</em></div><div className="lh-row"><b>10:30</b><span>Rahul Verma</span><em>Checked in</em></div><div className="lh-row"><b>11:00</b><span>Meena Iyer</span><em>Pending</em></div></div><div className="lh-preview-grid"><div className="lh-card"><small>AVAILABILITY</small><b>OPD & consultation slots</b></div><div className="lh-card"><small>CARE CONTEXT</small><b>Patient-shared history</b></div></div></div>}
function HospitalPreview(){return <div className="lh-preview-stack"><div className="lh-preview-grid"><div className="lh-card"><small>DOCTORS</small><div className="lh-kpi">2</div></div><div className="lh-card"><small>DEPARTMENTS</small><div className="lh-kpi">2</div></div></div><div className="lh-card"><small>HOSPITAL OPD WORKFLOW</small><div className="lh-flow"><span>Pending</span><i/><span>Confirmed</span><i/><span>Checked in</span><i/><span>In progress</span></div></div><div className="lh-card"><small>PUBLIC PROFILE</small><div className="lh-flow"><span>Facilities</span><span>Insurance</span><span>Affiliated doctors</span><span>Hospital OPD</span></div></div></div>}
function KnowledgePreview(){return <div className="lh-preview-stack"><div className="lh-card knowledge-feature"><small>FEATURED EXPLAINER</small><b>HbA1c — what your diabetes numbers mean</b><p>Understand common health terms before your next conversation with a healthcare professional.</p></div><div className="lh-preview-grid"><div className="lh-card"><small>POPULAR TOPICS</small><b>Heart health · diabetes · women’s health</b></div><div className="lh-card"><small>LEARN & PREPARE</small><b>Guides for everyday health questions</b></div></div></div>}

export default function LandingHero(){
  const [active,setActive]=useState<RoleId>('patient');
  const router=useRouter();
  const {user,isAuthenticated}=useAuthStore();
  const {openAuthModal}=useUIStore();
  const current=useMemo(()=>ROLES.find(r=>r.id===active)??ROLES[0],[active]);

  useEffect(()=>{
    if(typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
    const timer=window.setTimeout(()=>setActive(prev=>{const index=ROLES.findIndex(r=>r.id===prev);return ROLES[(index+1)%ROLES.length].id}),5800);
    return()=>window.clearTimeout(timer);
  },[active]);

  const signup=(role:'PATIENT'|'DOCTOR'|'HOSPITAL')=>{try{sessionStorage.setItem('hc_signup_role',role)}catch{}openAuthModal('register')};
  const signIn=()=>openAuthModal('login');
  const openMyHealth=()=>{if(!isAuthenticated||!user){try{sessionStorage.setItem('hc_post_login_redirect','/dashboard')}catch{}signIn();return}const role=String(user.role??'').toUpperCase();router.push(role==='PATIENT'?'/dashboard':role==='DOCTOR'?'/doctor-dashboard':role==='HOSPITAL'?'/hospital-dashboard':'/admin-dashboard')};
  const preview=active==='patient'?<PatientPreview/>:active==='community'?<CommunityPreview/>:active==='doctor'?<DoctorPreview/>:active==='hospital'?<HospitalPreview/>:<KnowledgePreview/>;

  return <section className="lh-shell">
    <style>{`
      .lh-shell{background:#fff;padding:82px 28px 18px;font-family:'DM Sans',Arial,sans-serif}.lh-wrap{max-width:1340px;height:500px;margin:0 auto;border-radius:22px;overflow:hidden;background:radial-gradient(circle at 88% 8%,rgba(20,184,166,.16),transparent 30%),linear-gradient(135deg,#061225 0%,#0A1A33 58%,#0B2943 100%);box-shadow:0 16px 42px rgba(15,23,42,.14);border:1px solid rgba(148,163,184,.15);display:grid;grid-template-rows:62px 1fr 44px}.lh-tabs{display:flex;align-items:end;gap:7px;padding:13px 28px 0;overflow-x:auto;scrollbar-width:none}.lh-tab{position:relative;overflow:hidden;border:1px solid rgba(148,163,184,.18);background:rgba(255,255,255,.035);color:#AFC2D8;border-radius:10px;padding:10px 14px;font-weight:850;font-size:11.5px;cursor:pointer;white-space:nowrap;min-height:42px}.lh-tab.active{color:#fff;border-color:var(--accent);background:rgba(255,255,255,.075)}.lh-tab.active:after{content:'';position:absolute;left:0;bottom:0;height:2px;background:var(--accent);animation:lhProgress 5.8s linear forwards}.lh-tab span{margin-right:6px}@keyframes lhProgress{from{width:0}to{width:100%}}
      .lh-main{display:grid;grid-template-columns:minmax(0,1.06fr) minmax(255px,.70fr) minmax(285px,.78fr);gap:18px;align-items:center;padding:18px 30px;height:100%;min-height:0}.lh-copy{align-self:center}.lh-eyebrow{font-size:10px;letter-spacing:.18em;font-weight:900;color:var(--accent);margin-bottom:9px}.lh-copy h1{font-family:'Sora','DM Sans',sans-serif;color:#F8FBFF;font-size:clamp(2.05rem,2.75vw,3rem);line-height:1.03;letter-spacing:-.045em;margin:0 0 11px;max-width:600px}.lh-copy>p{font-size:13px;line-height:1.58;color:#BCD0E5;margin:0 0 15px;max-width:580px}.lh-actions{display:flex;gap:8px;flex-wrap:wrap}.lh-btn{border-radius:9px;padding:9px 14px;font-size:11px;font-weight:900;cursor:pointer;font-family:inherit}.lh-primary{border:1px solid var(--accent);background:var(--accent);color:#061225}.lh-secondary{border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.04);color:#fff}.lh-links{display:flex;gap:14px;flex-wrap:wrap;margin-top:9px}.lh-link{border:0;background:none;color:#91B5D7;padding:0;font-size:10px;font-weight:800;cursor:pointer}.lh-link:hover{color:#fff;text-decoration:underline}
      .lh-preview{background:rgba(255,255,255,.055);border:1px solid rgba(148,163,184,.18);border-radius:17px;padding:12px;box-shadow:0 18px 50px rgba(0,0,0,.18);height:235px;display:flex;flex-direction:column;justify-content:center}.lh-preview-head{display:flex;justify-content:space-between;align-items:center;color:#9AB1C8;font-size:8.5px;font-weight:900;letter-spacing:.12em;margin-bottom:9px}.lh-live{color:#86EFAC}.lh-preview-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.lh-preview-stack{display:grid;gap:7px}.lh-card{background:#F8FBFF;border:1px solid #DCE7F0;border-radius:11px;padding:9px;color:#10233C;min-width:0}.lh-card.wide{grid-column:1/-1}.lh-card.green{background:#F0FDF4;border-color:#BBF7D0}.lh-card.knowledge-feature{background:linear-gradient(135deg,#EFF6FF,#F8FBFF);border-color:#BFDBFE}.lh-card small{display:block;color:#6382A0;font-size:8px;font-weight:900;letter-spacing:.09em;margin-bottom:5px}.lh-card b{display:block;font-size:10px;line-height:1.38}.lh-card p{font-size:8.5px;line-height:1.4;color:#64748B;margin:4px 0 0}.lh-score{font-family:'Sora',sans-serif;font-size:26px;color:#0D9488;font-weight:850}.lh-score span{font-size:8px;color:#64748B}.lh-flow{display:flex;align-items:center;gap:4px;flex-wrap:wrap}.lh-flow span{font-size:7.5px;font-weight:850;background:#EDF4FA;color:#24405F;padding:4px 5px;border-radius:6px}.lh-flow i{height:1px;width:6px;background:#B8C8D9}.lh-row{display:grid;grid-template-columns:42px 1fr auto;gap:5px;align-items:center;padding:4px 0;border-bottom:1px solid #E5EDF4;font-size:7.5px}.lh-row:last-child{border-bottom:0}.lh-row em{font-style:normal;background:#CCFBF1;color:#0F766E;padding:3px 4px;border-radius:999px;font-size:6.5px}.lh-kpi{font-family:'Sora',sans-serif;font-size:22px;color:#0F4C81;font-weight:850}
      .lh-carousel{border-top:1px solid rgba(148,163,184,.14);background:rgba(2,12,27,.32);display:flex;align-items:center;justify-content:space-between;padding:0 28px;color:#819AB6;font-size:9px}.lh-dots{display:flex;gap:6px}.lh-dot{width:24px;height:3px;border-radius:999px;background:rgba(148,163,184,.24);border:0;padding:0;cursor:pointer}.lh-dot.active{background:var(--accent)}.lh-auto{display:flex;align-items:center;gap:7px;font-weight:850;letter-spacing:.08em}.lh-auto:before{content:'';width:6px;height:6px;border-radius:50%;background:#22C55E;box-shadow:0 0 0 3px rgba(34,197,94,.13)}
      @media(max-width:1120px){.lh-wrap{height:auto;min-height:500px}.lh-main{grid-template-columns:1fr 1fr}.lh-copy{grid-row:1/3}.lh-preview,.pdp-card{height:205px}.lh-wrap{grid-template-rows:auto auto 44px}}
      @media(max-width:930px){.lh-shell{padding-top:78px}.lh-main{grid-template-columns:1fr;height:auto;padding:24px 28px 28px}.lh-copy{grid-row:auto}.lh-preview{max-width:720px;height:auto;min-height:210px}.lh-copy h1{font-size:2.45rem}}
      @media(max-width:620px){.lh-shell{padding:76px 12px 14px}.lh-tabs{padding:12px 14px 0;align-items:center}.lh-tab{font-size:10px;padding:8px 10px}.lh-main{padding:21px 18px 24px;gap:20px}.lh-copy h1{font-size:2.05rem}.lh-preview-grid{grid-template-columns:1fr}.lh-card.wide{grid-column:auto}.lh-preview{height:auto}.lh-carousel{padding:0 16px}.lh-auto{font-size:8px}}
    `}</style>

    <div className="lh-wrap" style={{'--accent':current.accent} as CSSProperties}>
      <div className="lh-tabs" role="tablist" aria-label="HealthConnect audiences">{ROLES.map(role=><button key={role.id} role="tab" aria-selected={active===role.id} className={`lh-tab ${active===role.id?'active':''}`} style={{'--accent':role.accent} as CSSProperties} onClick={()=>setActive(role.id)}><span>{role.icon}</span>{role.label}</button>)}</div>

      <div className="lh-main">
        <div className="lh-copy"><div className="lh-eyebrow">{current.eyebrow}</div><h1>{current.headline}</h1><p>{current.body}</p>
          {active==='patient'&&<><div className="lh-actions"><button className="lh-btn lh-primary" onClick={()=>router.push('/doctors')}>Find Doctors →</button><button className="lh-btn lh-secondary" onClick={()=>router.push('/hospitals')}>Find Hospitals</button></div><div className="lh-links"><button className="lh-link" onClick={()=>signup('PATIENT')}>Create Patient Account →</button><button className="lh-link" onClick={openMyHealth}>Sign In / My Health →</button></div></>}
          {active==='community'&&<><div className="lh-actions"><button className="lh-btn lh-primary" onClick={()=>router.push('/communities')}>Explore Communities →</button><button className="lh-btn lh-secondary" onClick={()=>signup('PATIENT')}>Create Account</button></div><div className="lh-links"><button className="lh-link" onClick={signIn}>Already registered? Sign In →</button></div></>}
          {active==='doctor'&&<div className="lh-actions"><button className="lh-btn lh-primary" onClick={()=>signup('DOCTOR')}>Register as a Doctor →</button><button className="lh-btn lh-secondary" onClick={signIn}>Doctor Sign In</button></div>}
          {active==='hospital'&&<div className="lh-actions"><button className="lh-btn lh-primary" onClick={()=>signup('HOSPITAL')}>Register Hospital →</button><button className="lh-btn lh-secondary" onClick={signIn}>Hospital Sign In</button></div>}
          {active==='knowledge'&&<div className="lh-actions"><button className="lh-btn lh-primary" onClick={()=>router.push('/learn')}>Explore Knowledge Hub →</button><button className="lh-btn lh-secondary" onClick={()=>signup('PATIENT')}>Create Account</button></div>}
        </div>
        <div className="lh-preview"><div className="lh-preview-head"><span>PRODUCT PREVIEW</span><span className="lh-live">● LIVE</span></div>{preview}</div>
        <PlatformDemoPlayer compact/>
      </div>

      <div className="lh-carousel"><div className="lh-dots">{ROLES.map(role=><button key={role.id} aria-label={`Show ${role.label}`} className={`lh-dot ${active===role.id?'active':''}`} style={{'--accent':role.accent} as CSSProperties} onClick={()=>setActive(role.id)}/>)}</div><div className="lh-auto">AUTO ROTATING · {ROLES.findIndex(r=>r.id===active)+1} / {ROLES.length}</div></div>
    </div>
  </section>;
}
