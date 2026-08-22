'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

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
  { id: 'patient', label: 'For Patients', icon: '♥', eyebrow: 'YOUR HEALTH, CONNECTED', headline: 'Everything your health needs, connected.', body: 'Find doctors and hospitals, book appointments, organise reports and medicines, and keep your health journey together in one private account.', accent: '#38BDF8' },
  { id: 'community', label: 'Health Communities', icon: '🤝', eyebrow: 'SUPPORT BETWEEN APPOINTMENTS', headline: 'Stay supported after the consultation ends.', body: 'Join condition-focused communities, learn from peer experience, attend Q&A events and post anonymously where a community allows it.', accent: '#34D399' },
  { id: 'doctor', label: 'For Doctors', icon: '🩺', eyebrow: 'YOUR DIGITAL PRACTICE', headline: 'Patients, appointments and your practice in one workspace.', body: 'Build your HealthConnect profile, publish availability, manage appointments and work with patient-shared health context and hospital affiliations.', accent: '#A78BFA' },
  { id: 'hospital', label: 'For Hospitals', icon: '🏥', eyebrow: 'DIGITAL HOSPITAL ACCESS', headline: 'Make your doctors, OPD and services easier to discover.', body: 'Publish departments, facilities, affiliated doctors and hospital-specific OPD, then manage appointments from the Hospital workspace.', accent: '#F59E0B' },
  { id: 'knowledge', label: 'Knowledge Hub', icon: '📚', eyebrow: 'HEALTH KNOWLEDGE, IN FAMILIAR LANGUAGE', headline: 'Understand more before your next health conversation.', body: 'Explore India-focused explainers and guides across diabetes, heart health, women’s health, mental wellbeing and other everyday healthcare topics.', accent: '#60A5FA' },
];

function PatientPreview() {
  return <div className="lh-preview-grid">
    <div className="lh-card"><small>MY HEALTH</small><div className="lh-score">67 <span>/100</span></div><p>Health score</p></div>
    <div className="lh-card"><small>NEXT APPOINTMENT</small><b>Dr. Arun Kumar</b><p>Hospital OPD · Confirmed</p></div>
    <div className="lh-card wide"><small>HEALTH JOURNEY</small><div className="lh-flow"><span>Reports</span><i/><span>Medicines</span><i/><span>Visits</span><i/><span>Follow-up</span></div></div>
  </div>;
}

function CommunityPreview() {
  return <div className="lh-preview-stack">
    <div className="lh-card community-feature"><small>ANONYMOUS POST · DIABETES SUPPORT</small><b>“How do others manage meals when glucose readings change after dinner?”</b><p>18 reactions · 7 replies</p></div>
    <div className="lh-preview-grid"><div className="lh-card green"><small>COMMUNITY SAFETY</small><b>Membership · moderation · reporting</b></div><div className="lh-card"><small>Q&A & EVENTS</small><b>Keep learning between visits</b></div></div>
  </div>;
}

function DoctorPreview() {
  return <div className="lh-preview-stack">
    <div className="lh-card"><small>TODAY&apos;S APPOINTMENTS</small><div className="lh-row"><b>10:00</b><span>Priya Sharma</span><em>Confirmed</em></div><div className="lh-row"><b>10:30</b><span>Rahul Verma</span><em>Checked in</em></div><div className="lh-row"><b>11:00</b><span>Meena Iyer</span><em>Pending</em></div></div>
    <div className="lh-preview-grid"><div className="lh-card"><small>AVAILABILITY</small><b>OPD & consultation slots</b></div><div className="lh-card"><small>CARE CONTEXT</small><b>Patient-shared history</b></div></div>
  </div>;
}

function HospitalPreview() {
  return <div className="lh-preview-stack">
    <div className="lh-preview-grid"><div className="lh-card"><small>DOCTORS</small><div className="lh-kpi">2</div></div><div className="lh-card"><small>DEPARTMENTS</small><div className="lh-kpi">2</div></div></div>
    <div className="lh-card"><small>HOSPITAL OPD WORKFLOW</small><div className="lh-flow"><span>Pending</span><i/><span>Confirmed</span><i/><span>Checked in</span><i/><span>In progress</span></div></div>
    <div className="lh-card"><small>PUBLIC PROFILE</small><div className="lh-flow"><span>Facilities</span><span>Insurance</span><span>Affiliated doctors</span><span>Hospital OPD</span></div></div>
  </div>;
}

function KnowledgePreview() {
  return <div className="lh-preview-stack">
    <div className="lh-card knowledge-feature"><small>FEATURED EXPLAINER</small><b>HbA1c — what your diabetes numbers mean</b><p>Understand common health terms before your next conversation with a healthcare professional.</p></div>
    <div className="lh-preview-grid"><div className="lh-card"><small>POPULAR TOPICS</small><b>Heart health · diabetes · women&apos;s health</b></div><div className="lh-card"><small>LEARN & PREPARE</small><b>Guides for everyday health questions</b></div></div>
  </div>;
}

export default function LandingHero() {
  const [active, setActive] = useState<RoleId>('patient');
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const current = useMemo(() => ROLES.find(role => role.id === active) ?? ROLES[0], [active]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setTimeout(() => {
      setActive(previous => {
        const index = ROLES.findIndex(role => role.id === previous);
        return ROLES[(index + 1) % ROLES.length].id;
      });
    }, 5800);
    return () => window.clearTimeout(timer);
  }, [active]);

  const signup = (role: 'PATIENT' | 'DOCTOR' | 'HOSPITAL') => {
    try { sessionStorage.setItem('hc_signup_role', role); } catch {}
    openAuthModal('register');
  };

  const signIn = () => openAuthModal('login');

  const openMyHealth = () => {
    if (!isAuthenticated || !user) {
      try { sessionStorage.setItem('hc_post_login_redirect', '/dashboard'); } catch {}
      signIn();
      return;
    }
    const role = String(user.role ?? '').toUpperCase();
    router.push(role === 'PATIENT' ? '/dashboard' : role === 'DOCTOR' ? '/doctor-dashboard' : role === 'HOSPITAL' ? '/hospital-dashboard' : '/admin-dashboard');
  };

  const preview = active === 'patient' ? <PatientPreview/>
    : active === 'community' ? <CommunityPreview/>
    : active === 'doctor' ? <DoctorPreview/>
    : active === 'hospital' ? <HospitalPreview/>
    : <KnowledgePreview/>;

  const stageLabel = active === 'patient' ? 'MY HEALTH AT A GLANCE'
    : active === 'community' ? 'HEALTH COMMUNITIES IN ACTION'
    : active === 'doctor' ? 'DOCTOR WORKSPACE'
    : active === 'hospital' ? 'HOSPITAL WORKSPACE'
    : 'KNOWLEDGE TO PREPARE';

  return <section className="lh-shell">
    <style>{`
      .lh-shell{background:#fff;padding:82px 28px 18px;font-family:'DM Sans',Arial,sans-serif}
      .lh-wrap{max-width:1280px;height:500px;margin:0 auto;border-radius:22px;overflow:hidden;background:radial-gradient(circle at 87% 10%,rgba(20,184,166,.2),transparent 30%),radial-gradient(circle at 63% 52%,rgba(56,189,248,.07),transparent 27%),linear-gradient(135deg,#061225 0%,#0A1A33 58%,#0B2943 100%);box-shadow:0 16px 42px rgba(15,23,42,.14);border:1px solid rgba(148,163,184,.15);display:grid;grid-template-rows:62px 1fr 44px;position:relative}
      .lh-wrap:before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);background-size:44px 44px;mask-image:linear-gradient(to left,#000,transparent 65%);pointer-events:none}
      .lh-tabs{display:flex;align-items:end;gap:8px;padding:13px 28px 0;overflow-x:auto;scrollbar-width:none;position:relative;z-index:2}
      .lh-tab{position:relative;overflow:hidden;border:1px solid var(--tab-border);background:var(--tab-bg);color:#F3F8FC;border-radius:11px;padding:10px 14px;font-weight:850;font-size:12px;cursor:pointer;white-space:nowrap;min-height:42px;box-shadow:inset 0 1px 0 rgba(255,255,255,.05);transition:.16s}
      .lh-tab:hover{transform:translateY(-1px);background:var(--tab-hover);border-color:var(--accent)}
      .lh-tab.active{color:#fff;border-color:var(--accent);background:var(--tab-active);box-shadow:0 5px 16px rgba(0,0,0,.16),inset 0 1px 0 rgba(255,255,255,.08)}
      .lh-tab.active:after{content:'';position:absolute;left:0;bottom:0;height:3px;background:var(--accent);animation:lhProgress 5.8s linear forwards}
      .lh-tab span{margin-right:6px}
      @keyframes lhProgress{from{width:0}to{width:100%}}
      .lh-main{display:grid;grid-template-columns:minmax(0,.95fr) minmax(440px,1.05fr);gap:36px;align-items:center;padding:16px 52px 18px;height:100%;min-height:0;position:relative;z-index:2}
      .lh-main:after{content:'';position:absolute;right:1.5%;top:12%;width:48%;height:76%;border-radius:42% 58% 50% 44%;background:radial-gradient(circle at 48% 50%,color-mix(in srgb,var(--accent) 13%,transparent),transparent 68%);filter:blur(14px);opacity:.85;pointer-events:none;z-index:-1}
      .lh-copy{align-self:center}.lh-eyebrow{font-size:11px;letter-spacing:.18em;font-weight:900;color:var(--accent);margin-bottom:10px}
      .lh-copy h1{font-family:'Sora','DM Sans',sans-serif;color:#F8FBFF;font-size:clamp(2.2rem,3.2vw,3.3rem);line-height:1.03;letter-spacing:-.045em;margin:0 0 12px;max-width:700px}
      .lh-copy>p{font-size:14.5px;line-height:1.58;color:#C7D8E8;margin:0 0 16px;max-width:650px}
      .lh-actions{display:flex;gap:9px;flex-wrap:wrap}.lh-btn{border-radius:10px;padding:11px 17px;font-size:12px;font-weight:900;cursor:pointer;font-family:inherit;transition:.16s;box-shadow:0 5px 14px rgba(0,0,0,.13)}.lh-btn:hover{transform:translateY(-1px)}
      .lh-primary{border:1px solid var(--accent);background:var(--accent);color:#061225}.lh-secondary{border:1px solid rgba(255,255,255,.78);background:#F8FBFF;color:#16324B}
      .lh-links{display:flex;gap:16px;flex-wrap:wrap;margin-top:11px}.lh-link{border:0;background:none;color:#B8D0E7;padding:0;font-size:11.5px;font-weight:800;cursor:pointer}.lh-link:hover{color:#fff;text-decoration:underline}
      .lh-preview{position:relative;padding:8px 0 6px 24px;min-height:282px;display:flex;flex-direction:column;justify-content:center;background:transparent;border:0;box-shadow:none}
      .lh-preview:before{content:'';position:absolute;inset:-22px -18px -18px -10px;border-radius:46% 34% 42% 28%;background:radial-gradient(circle at 55% 50%,rgba(255,255,255,.09),rgba(255,255,255,.025) 54%,transparent 72%);pointer-events:none}
      .lh-preview-head{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center;color:#B7CAE0;font-size:10.5px;font-weight:900;letter-spacing:.12em;margin:0 2px 12px}.lh-live{color:#86EFAC}
      .lh-preview-grid,.lh-preview-stack{position:relative;z-index:1}.lh-preview-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.lh-preview-stack{display:grid;gap:12px}
      .lh-card{background:linear-gradient(145deg,rgba(250,253,255,.98),rgba(240,248,252,.96));border:1px solid rgba(202,221,233,.88);border-radius:14px;padding:16px 17px;color:#10233C;min-width:0;box-shadow:0 12px 28px rgba(1,12,28,.14)}.lh-card.wide{grid-column:1/-1}.lh-card.green{background:linear-gradient(145deg,#ECFBF5,#E6F7F2);border-color:#AFE3CC}.lh-card.community-feature{background:linear-gradient(145deg,#F7FEFB,#ECFAF5);border-color:#B8E6D2}.lh-card.knowledge-feature{background:linear-gradient(135deg,#EAF3FF,#F8FBFF);border-color:#B9D8F5}
      .lh-card small{display:block;color:#4E7294;font-size:11.5px;font-weight:900;letter-spacing:.085em;margin-bottom:8px}.lh-card b{display:block;font-size:14.5px;line-height:1.4;color:#10233C}.lh-card p{font-size:12.5px;line-height:1.5;color:#4E657D;margin:6px 0 0}
      .lh-score{font-family:'Sora',sans-serif;font-size:35px;color:#0D9488;font-weight:850;line-height:1}.lh-score span{font-size:11px;color:#64748B}
      .lh-flow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.lh-flow span{font-size:11px;font-weight:850;background:#E6F1F9;color:#24405F;padding:6px 9px;border-radius:8px}.lh-flow i{height:1px;width:12px;background:#9FB6CB}
      .lh-row{display:grid;grid-template-columns:58px 1fr auto;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid #DDE8F0;font-size:12.5px;color:#243C55}.lh-row:last-child{border-bottom:0}.lh-row b{font-size:12.5px}.lh-row span{font-size:12.5px}.lh-row em{font-style:normal;background:#CCFBF1;color:#0F766E;padding:5px 8px;border-radius:999px;font-size:10px;font-weight:850}.lh-kpi{font-family:'Sora',sans-serif;font-size:31px;color:#0F4C81;font-weight:850}
      .lh-carousel{border-top:1px solid rgba(148,163,184,.14);background:rgba(2,12,27,.32);display:flex;align-items:center;justify-content:space-between;padding:0 28px;color:#9CB2C9;font-size:10px;position:relative;z-index:2}
      .lh-dots{display:flex;gap:6px}.lh-dot{width:24px;height:3px;border-radius:999px;background:rgba(148,163,184,.24);border:0;padding:0;cursor:pointer}.lh-dot.active{background:var(--accent)}
      .lh-auto{display:flex;align-items:center;gap:7px;font-weight:850;letter-spacing:.08em}.lh-auto:before{content:'';width:6px;height:6px;border-radius:50%;background:#22C55E;box-shadow:0 0 0 3px rgba(34,197,94,.13)}
      @media(max-width:930px){.lh-shell{padding-top:78px}.lh-wrap{height:auto;min-height:0;grid-template-rows:auto auto 44px}.lh-main{grid-template-columns:1fr;height:auto;padding:24px 28px 28px}.lh-preview{max-width:720px;min-height:240px;padding-left:0}.lh-copy h1{font-size:2.45rem}}
      @media(max-width:620px){.lh-shell{padding:76px 12px 14px}.lh-tabs{padding:12px 14px 0;align-items:center}.lh-tab{font-size:10.5px;padding:8px 10px}.lh-main{padding:21px 18px 24px;gap:20px}.lh-copy h1{font-size:2.05rem}.lh-copy>p{font-size:13.5px}.lh-preview-grid{grid-template-columns:1fr}.lh-card.wide{grid-column:auto}.lh-preview{min-height:0}.lh-carousel{padding:0 16px}.lh-auto{font-size:8.5px}}
    `}</style>

    <div className="lh-wrap" style={{ '--accent': current.accent } as CSSProperties}>
      <div className="lh-tabs" role="tablist" aria-label="HealthConnect audiences">
        {ROLES.map(role => <button
          key={role.id}
          role="tab"
          aria-selected={active === role.id}
          className={`lh-tab ${active === role.id ? 'active' : ''}`}
          style={{
            '--accent': role.accent,
            '--tab-bg': `${role.accent}14`,
            '--tab-hover': `${role.accent}24`,
            '--tab-active': `${role.accent}30`,
            '--tab-border': `${role.accent}38`,
          } as CSSProperties}
          onClick={() => setActive(role.id)}
        ><span>{role.icon}</span>{role.label}</button>)}
      </div>

      <div className="lh-main">
        <div className="lh-copy">
          <div className="lh-eyebrow">{current.eyebrow}</div><h1>{current.headline}</h1><p>{current.body}</p>
          {active === 'patient' && <><div className="lh-actions"><button className="lh-btn lh-primary" onClick={() => router.push('/doctors')}>Find Doctors →</button><button className="lh-btn lh-secondary" onClick={() => router.push('/hospitals')}>Find Hospitals</button></div><div className="lh-links"><button className="lh-link" onClick={() => signup('PATIENT')}>Create Patient Account →</button><button className="lh-link" onClick={openMyHealth}>Sign In / My Health →</button></div></>}
          {active === 'community' && <><div className="lh-actions"><button className="lh-btn lh-primary" onClick={() => router.push('/communities')}>Explore Communities →</button><button className="lh-btn lh-secondary" onClick={() => signup('PATIENT')}>Create Account</button></div><div className="lh-links"><button className="lh-link" onClick={signIn}>Already registered? Sign In →</button></div></>}
          {active === 'doctor' && <div className="lh-actions"><button className="lh-btn lh-primary" onClick={() => signup('DOCTOR')}>Register as a Doctor →</button><button className="lh-btn lh-secondary" onClick={signIn}>Doctor Sign In</button></div>}
          {active === 'hospital' && <div className="lh-actions"><button className="lh-btn lh-primary" onClick={() => signup('HOSPITAL')}>Register Hospital →</button><button className="lh-btn lh-secondary" onClick={signIn}>Hospital Sign In</button></div>}
          {active === 'knowledge' && <div className="lh-actions"><button className="lh-btn lh-primary" onClick={() => router.push('/learn')}>Explore Knowledge Hub →</button><button className="lh-btn lh-secondary" onClick={() => signup('PATIENT')}>Create Account</button></div>}
        </div>
        <div className="lh-preview"><div className="lh-preview-head"><span>{stageLabel}</span><span className="lh-live">● LIVE PLATFORM</span></div>{preview}</div>
      </div>

      <div className="lh-carousel"><div className="lh-dots">{ROLES.map(role => <button key={role.id} aria-label={`Show ${role.label}`} className={`lh-dot ${active === role.id ? 'active' : ''}`} style={{ '--accent': role.accent } as CSSProperties} onClick={() => setActive(role.id)}/>)}</div><div className="lh-auto">AUTO ROTATING · {ROLES.findIndex(role => role.id === active) + 1} / {ROLES.length}</div></div>
    </div>
  </section>;
}