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

const COMMUNITY_PEOPLE = {
  woman: 'https://images.unsplash.com/photo-1774437890454-634d48db52c8?auto=format&fit=crop&w=700&q=85',
  man: 'https://images.unsplash.com/photo-1774437678715-fb40846dc252?auto=format&fit=crop&w=700&q=85',
  seniorWoman: 'https://images.unsplash.com/photo-1774437790863-88a80bca5b29?auto=format&fit=crop&w=700&q=85',
};

const ROLES: RoleConfig[] = [
  { id: 'patient', label: 'For Patients', icon: '♥', eyebrow: 'YOUR HEALTH, CONNECTED', headline: 'Everything your health needs, connected.', body: 'Find doctors and hospitals, book appointments, organise reports and medicines, and keep your health journey together in one private account.', accent: '#38BDF8' },
  { id: 'community', label: 'Health Communities', icon: '🤝', eyebrow: 'SUPPORT BETWEEN APPOINTMENTS', headline: 'You are not alone in your health journey.', body: 'Join Health Communities where people share experience, ask questions and support each other between appointments — with moderation and anonymous participation where the community allows it.', accent: '#34D399' },
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
  return <div className="lh-community-human">
    <div className="lh-community-ring ring-one"/><div className="lh-community-ring ring-two"/>
    <div className="lh-person hero-main" style={{backgroundImage:`url(${COMMUNITY_PEOPLE.seniorWoman})`}}/>
    <div className="lh-person hero-p1" style={{backgroundImage:`url(${COMMUNITY_PEOPLE.woman})`}}/>
    <div className="lh-person hero-p2" style={{backgroundImage:`url(${COMMUNITY_PEOPLE.man})`}}/>
    <div className="lh-community-quote"><small>EXAMPLE COMMUNITY SENTIMENT</small><b>“Talking to others helped me feel more prepared.”</b><span>Peer support can add perspective between appointments.</span></div>
    <div className="lh-community-cues"><span>Peer support</span><span>Anonymous where allowed</span><span>Moderated</span></div>
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

  return <section className="lh-shell">
    <style>{`
      .lh-shell{background:#fff;padding:82px 28px 18px;font-family:'DM Sans',Arial,sans-serif}
      .lh-wrap{max-width:1280px;height:500px;margin:0 auto;border-radius:22px;overflow:hidden;background:radial-gradient(circle at 88% 8%,rgba(20,184,166,.16),transparent 30%),linear-gradient(135deg,#061225 0%,#0A1A33 58%,#0B2943 100%);box-shadow:0 16px 42px rgba(15,23,42,.14);border:1px solid rgba(148,163,184,.15);display:grid;grid-template-rows:62px 1fr 44px}
      .lh-tabs{display:flex;align-items:end;gap:8px;padding:13px 28px 0;overflow-x:auto;scrollbar-width:none}
      .lh-tab{position:relative;overflow:hidden;border:1px solid var(--tab-border);background:var(--tab-bg);color:#F3F8FC;border-radius:11px;padding:10px 14px;font-weight:850;font-size:12px;cursor:pointer;white-space:nowrap;min-height:42px;box-shadow:inset 0 1px 0 rgba(255,255,255,.05);transition:.16s}
      .lh-tab:hover{transform:translateY(-1px);background:var(--tab-hover);border-color:var(--accent)}
      .lh-tab.active{color:#fff;border-color:var(--accent);background:var(--tab-active);box-shadow:0 5px 16px rgba(0,0,0,.16),inset 0 1px 0 rgba(255,255,255,.08)}
      .lh-tab.active:after{content:'';position:absolute;left:0;bottom:0;height:3px;background:var(--accent);animation:lhProgress 5.8s linear forwards}
      .lh-tab span{margin-right:6px}
      @keyframes lhProgress{from{width:0}to{width:100%}}
      .lh-main{display:grid;grid-template-columns:minmax(0,.96fr) minmax(430px,1.04fr);gap:40px;align-items:center;padding:16px 52px 18px;height:100%;min-height:0}
      .lh-copy{align-self:center}.lh-eyebrow{font-size:11px;letter-spacing:.18em;font-weight:900;color:var(--accent);margin-bottom:10px}
      .lh-copy h1{font-family:'Sora','DM Sans',sans-serif;color:#F8FBFF;font-size:clamp(2.2rem,3.2vw,3.3rem);line-height:1.03;letter-spacing:-.045em;margin:0 0 12px;max-width:700px}
      .lh-copy>p{font-size:14.5px;line-height:1.58;color:#C7D8E8;margin:0 0 16px;max-width:650px}
      .lh-actions{display:flex;gap:9px;flex-wrap:wrap}.lh-btn{border-radius:10px;padding:11px 17px;font-size:12px;font-weight:900;cursor:pointer;font-family:inherit;transition:.16s;box-shadow:0 5px 14px rgba(0,0,0,.13)}.lh-btn:hover{transform:translateY(-1px)}
      .lh-primary{border:1px solid var(--accent);background:var(--accent);color:#061225}.lh-secondary{border:1px solid rgba(255,255,255,.72);background:#F8FBFF;color:#16324B}
      .lh-links{display:flex;gap:16px;flex-wrap:wrap;margin-top:11px}.lh-link{border:0;background:none;color:#B8D0E7;padding:0;font-size:11.5px;font-weight:800;cursor:pointer}.lh-link:hover{color:#fff;text-decoration:underline}
      .lh-preview{background:linear-gradient(145deg,rgba(255,255,255,.09),rgba(255,255,255,.055));border:1px solid rgba(148,163,184,.25);border-radius:18px;padding:16px;box-shadow:0 18px 50px rgba(0,0,0,.2);height:280px;display:flex;flex-direction:column;justify-content:center}
      .lh-preview.community-mode{background:linear-gradient(145deg,#F5FCFA,#EFF8FF);border-color:#A9DDD0;padding:12px}
      .lh-preview-head{display:flex;justify-content:space-between;align-items:center;color:#B4C7DA;font-size:10.5px;font-weight:900;letter-spacing:.11em;margin-bottom:12px}.lh-preview.community-mode .lh-preview-head{color:#476B72}.lh-live{color:#86EFAC}.lh-preview.community-mode .lh-live{color:#0F8A6C}
      .lh-preview-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.lh-preview-stack{display:grid;gap:10px}
      .lh-card{background:#FBFDFF;border:1px solid #D5E2EC;border-radius:12px;padding:13px 14px;color:#10233C;min-width:0;box-shadow:0 3px 10px rgba(15,23,42,.035)}.lh-card.wide{grid-column:1/-1}.lh-card.green{background:#ECFBF5;border-color:#BFEBD5}.lh-card.knowledge-feature{background:linear-gradient(135deg,#EAF3FF,#F8FBFF);border-color:#B9D8F5}
      .lh-card small{display:block;color:#55779A;font-size:10.5px;font-weight:900;letter-spacing:.09em;margin-bottom:7px}.lh-card b{display:block;font-size:13px;line-height:1.4;color:#10233C}.lh-card p{font-size:11.5px;line-height:1.48;color:#536C84;margin:5px 0 0}
      .lh-score{font-family:'Sora',sans-serif;font-size:32px;color:#0D9488;font-weight:850}.lh-score span{font-size:10px;color:#64748B}
      .lh-flow{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.lh-flow span{font-size:10.5px;font-weight:850;background:#E7F2FB;color:#24405F;padding:5px 8px;border-radius:7px}.lh-flow i{height:1px;width:10px;background:#AFC2D5}
      .lh-row{display:grid;grid-template-columns:56px 1fr auto;gap:9px;align-items:center;padding:8px 0;border-bottom:1px solid #E3EBF2;font-size:11.5px;color:#243C55}.lh-row:last-child{border-bottom:0}.lh-row b{font-size:12px}.lh-row span{font-size:11.5px}.lh-row em{font-style:normal;background:#CCFBF1;color:#0F766E;padding:4px 7px;border-radius:999px;font-size:9.5px;font-weight:800}.lh-kpi{font-family:'Sora',sans-serif;font-size:28px;color:#0F4C81;font-weight:850}
      .lh-community-human{height:220px;position:relative;border-radius:14px;overflow:hidden;background:linear-gradient(135deg,#E8FAF5,#FBFEFF 55%,#EAF5FF)}
      .lh-community-ring{position:absolute;border:2px dashed rgba(15,159,132,.22);border-radius:50%;left:45%;top:52%;transform:translate(-50%,-50%)}.ring-one{width:250px;height:165px}.ring-two{width:355px;height:235px;border-color:rgba(39,121,215,.14)}
      .lh-person{position:absolute;border-radius:50%;background-position:center;background-size:cover;border:4px solid #fff;box-shadow:0 8px 22px rgba(15,23,42,.13);z-index:2}.hero-main{width:88px;height:88px;left:39%;top:52%;transform:translate(-50%,-50%);box-shadow:0 0 0 2px #31B89A,0 10px 24px rgba(15,23,42,.12)}.hero-p1{width:50px;height:50px;left:8%;top:14%}.hero-p2{width:52px;height:52px;left:13%;bottom:10%}
      .lh-community-quote{position:absolute;right:5%;top:15%;width:205px;background:rgba(255,255,255,.97);border:1px solid #B9E5D9;border-radius:14px;padding:12px 13px;z-index:4;box-shadow:0 9px 22px rgba(15,23,42,.1)}.lh-community-quote small{display:block;color:#0F8A6C;font-size:8.5px;font-weight:900;letter-spacing:.08em;margin-bottom:6px}.lh-community-quote b{display:block;color:#123B45;font-size:12.5px;line-height:1.35}.lh-community-quote span{display:block;color:#647C8C;font-size:9.5px;line-height:1.35;margin-top:6px}
      .lh-community-cues{position:absolute;left:5%;bottom:5%;display:flex;gap:5px;flex-wrap:wrap;z-index:4}.lh-community-cues span{background:#fff;border:1px solid #C6E8DD;color:#176A58;border-radius:999px;padding:4px 7px;font-size:8.5px;font-weight:850}
      .lh-carousel{border-top:1px solid rgba(148,163,184,.14);background:rgba(2,12,27,.32);display:flex;align-items:center;justify-content:space-between;padding:0 28px;color:#9CB2C9;font-size:10px}
      .lh-dots{display:flex;gap:6px}.lh-dot{width:24px;height:3px;border-radius:999px;background:rgba(148,163,184,.24);border:0;padding:0;cursor:pointer}.lh-dot.active{background:var(--accent)}
      .lh-auto{display:flex;align-items:center;gap:7px;font-weight:850;letter-spacing:.08em}.lh-auto:before{content:'';width:6px;height:6px;border-radius:50%;background:#22C55E;box-shadow:0 0 0 3px rgba(34,197,94,.13)}
      @media(max-width:930px){.lh-shell{padding-top:78px}.lh-wrap{height:auto;min-height:0;grid-template-rows:auto auto 44px}.lh-main{grid-template-columns:1fr;height:auto;padding:24px 28px 28px}.lh-preview{max-width:720px;height:auto;min-height:240px}.lh-copy h1{font-size:2.45rem}}
      @media(max-width:620px){.lh-shell{padding:76px 12px 14px}.lh-tabs{padding:12px 14px 0;align-items:center}.lh-tab{font-size:10.5px;padding:8px 10px}.lh-main{padding:21px 18px 24px;gap:20px}.lh-copy h1{font-size:2.05rem}.lh-copy>p{font-size:13.5px}.lh-preview-grid{grid-template-columns:1fr}.lh-card.wide{grid-column:auto}.lh-preview{height:auto}.lh-carousel{padding:0 16px}.lh-auto{font-size:8.5px}.lh-community-quote{width:180px;right:3%}.hero-main{left:37%}}
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
          {active === 'community' && <><div className="lh-actions"><button className="lh-btn lh-primary" onClick={() => router.push('/communities')}>Explore Communities →</button><button className="lh-btn lh-secondary" onClick={() => signup('PATIENT')}>Join HealthConnect</button></div><div className="lh-links"><button className="lh-link" onClick={signIn}>Already registered? Sign In →</button></div></>}
          {active === 'doctor' && <div className="lh-actions"><button className="lh-btn lh-primary" onClick={() => signup('DOCTOR')}>Register as a Doctor →</button><button className="lh-btn lh-secondary" onClick={signIn}>Doctor Sign In</button></div>}
          {active === 'hospital' && <div className="lh-actions"><button className="lh-btn lh-primary" onClick={() => signup('HOSPITAL')}>Register Hospital →</button><button className="lh-btn lh-secondary" onClick={signIn}>Hospital Sign In</button></div>}
          {active === 'knowledge' && <div className="lh-actions"><button className="lh-btn lh-primary" onClick={() => router.push('/learn')}>Explore Knowledge Hub →</button><button className="lh-btn lh-secondary" onClick={() => signup('PATIENT')}>Create Account</button></div>}
        </div>
        <div className={`lh-preview ${active === 'community' ? 'community-mode' : ''}`}><div className="lh-preview-head"><span>{active === 'community' ? 'HEALTH COMMUNITY PREVIEW' : 'HEALTHCONNECT PRODUCT PREVIEW'}</span><span className="lh-live">● LIVE PLATFORM</span></div>{preview}</div>
      </div>

      <div className="lh-carousel"><div className="lh-dots">{ROLES.map(role => <button key={role.id} aria-label={`Show ${role.label}`} className={`lh-dot ${active === role.id ? 'active' : ''}`} style={{ '--accent': role.accent } as CSSProperties} onClick={() => setActive(role.id)}/>)}</div><div className="lh-auto">AUTO ROTATING · {ROLES.findIndex(role => role.id === active) + 1} / {ROLES.length}</div></div>
    </div>
  </section>;
}
