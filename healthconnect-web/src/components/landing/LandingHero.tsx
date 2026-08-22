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
  image?: string;
  imageAlt?: string;
};

const COMMUNITY_PEOPLE = {
  woman: 'https://images.unsplash.com/photo-1774437890454-634d48db52c8?auto=format&fit=crop&w=700&q=85',
  man: 'https://images.unsplash.com/photo-1774437678715-fb40846dc252?auto=format&fit=crop&w=700&q=85',
  seniorWoman: 'https://images.unsplash.com/photo-1774437790863-88a80bca5b29?auto=format&fit=crop&w=700&q=85',
};

const ROLES: RoleConfig[] = [
  {
    id: 'patient', label: 'For Patients', icon: '♥', eyebrow: 'YOUR HEALTH, CONNECTED',
    headline: 'Everything your health needs, connected.',
    body: 'Find doctors and hospitals, book appointments, organise reports and medicines, and keep your health journey together in one private account.',
    accent: '#38BDF8', image: '/images/landing/hero-patient.webp',
    imageAlt: 'Indian patient speaking with a doctor during a consultation',
  },
  {
    id: 'community', label: 'Health Communities', icon: '🤝', eyebrow: 'SUPPORT BETWEEN APPOINTMENTS',
    headline: 'You are not alone in your health journey.',
    body: 'Join Health Communities where people share experience, ask questions and support each other between appointments — with moderation and anonymous participation where the community allows it.',
    accent: '#34D399',
  },
  {
    id: 'doctor', label: 'For Doctors', icon: '🩺', eyebrow: 'YOUR DIGITAL PRACTICE',
    headline: 'Patients, appointments and your practice in one workspace.',
    body: 'Build your HealthConnect profile, publish availability, manage appointments and work with patient-shared health context and hospital affiliations.',
    accent: '#A78BFA', image: '/images/landing/hero-doctor.webp',
    imageAlt: 'Indian doctor using a digital workspace in a modern clinic',
  },
  {
    id: 'hospital', label: 'For Hospitals', icon: '🏥', eyebrow: 'DIGITAL HOSPITAL ACCESS',
    headline: 'Make your doctors, OPD and services easier to discover.',
    body: 'Publish departments, facilities, affiliated doctors and hospital-specific OPD, then manage appointments from the Hospital workspace.',
    accent: '#F59E0B', image: '/images/landing/hero-hospital.webp',
    imageAlt: 'Modern Indian hospital reception and OPD environment',
  },
  {
    id: 'knowledge', label: 'Knowledge Hub', icon: '📚', eyebrow: 'HEALTH KNOWLEDGE, IN FAMILIAR LANGUAGE',
    headline: 'Understand more before your next health conversation.',
    body: 'Explore India-focused explainers and guides across diabetes, heart health, women’s health, mental wellbeing and other everyday healthcare topics.',
    accent: '#60A5FA', image: '/images/landing/hero-knowledge.webp',
    imageAlt: 'Indian woman learning about health topics on a laptop at home',
  },
];

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
      .lh-main{display:grid;grid-template-columns:minmax(0,.92fr) minmax(470px,1.08fr);gap:34px;align-items:center;padding:14px 42px 18px;height:100%;min-height:0}
      .lh-copy{align-self:center}.lh-eyebrow{font-size:11px;letter-spacing:.18em;font-weight:900;color:var(--accent);margin-bottom:10px}
      .lh-copy h1{font-family:'Sora','DM Sans',sans-serif;color:#F8FBFF;font-size:clamp(2.25rem,3.2vw,3.35rem);line-height:1.03;letter-spacing:-.045em;margin:0 0 12px;max-width:700px}
      .lh-copy>p{font-size:15px;line-height:1.58;color:#C7D8E8;margin:0 0 16px;max-width:650px}
      .lh-actions{display:flex;gap:9px;flex-wrap:wrap}.lh-btn{border-radius:10px;padding:11px 17px;font-size:12px;font-weight:900;cursor:pointer;font-family:inherit;transition:.16s;box-shadow:0 5px 14px rgba(0,0,0,.13)}.lh-btn:hover{transform:translateY(-1px)}
      .lh-primary{border:1px solid var(--accent);background:var(--accent);color:#061225}.lh-secondary{border:1px solid rgba(255,255,255,.72);background:#F8FBFF;color:#16324B}
      .lh-links{display:flex;gap:16px;flex-wrap:wrap;margin-top:11px}.lh-link{border:0;background:none;color:#B8D0E7;padding:0;font-size:11.5px;font-weight:800;cursor:pointer}.lh-link:hover{color:#fff;text-decoration:underline}
      .lh-photo-frame{height:310px;border-radius:20px;overflow:hidden;position:relative;background:#EAF5F4;border:1px solid rgba(255,255,255,.22);box-shadow:0 18px 50px rgba(0,0,0,.22)}
      .lh-photo-frame:after{content:'';position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)}
      .lh-photo{display:block;width:100%;height:100%;object-fit:cover;object-position:center;transition:opacity .2s ease}
      .lh-photo-badge{position:absolute;left:14px;bottom:14px;background:rgba(6,18,37,.78);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.22);border-radius:999px;color:#F7FBFF;padding:7px 11px;font-size:10px;font-weight:850;letter-spacing:.04em;z-index:2}
      .lh-community-frame{height:310px;border-radius:20px;overflow:hidden;background:linear-gradient(145deg,#F5FCFA,#EFF8FF);border:1px solid #A9DDD0;padding:15px;box-shadow:0 18px 50px rgba(0,0,0,.18)}
      .lh-community-head{display:flex;justify-content:space-between;align-items:center;color:#476B72;font-size:10.5px;font-weight:900;letter-spacing:.11em;margin-bottom:10px}.lh-live{color:#0F8A6C}
      .lh-community-human{height:244px;position:relative;border-radius:14px;overflow:hidden;background:linear-gradient(135deg,#E8FAF5,#FBFEFF 55%,#EAF5FF)}
      .lh-community-ring{position:absolute;border:2px dashed rgba(15,159,132,.22);border-radius:50%;left:45%;top:52%;transform:translate(-50%,-50%)}.ring-one{width:250px;height:165px}.ring-two{width:355px;height:235px;border-color:rgba(39,121,215,.14)}
      .lh-person{position:absolute;border-radius:50%;background-position:center;background-size:cover;border:4px solid #fff;box-shadow:0 8px 22px rgba(15,23,42,.13);z-index:2}.hero-main{width:94px;height:94px;left:39%;top:52%;transform:translate(-50%,-50%);box-shadow:0 0 0 2px #31B89A,0 10px 24px rgba(15,23,42,.12)}.hero-p1{width:54px;height:54px;left:8%;top:14%}.hero-p2{width:56px;height:56px;left:13%;bottom:10%}
      .lh-community-quote{position:absolute;right:5%;top:15%;width:215px;background:rgba(255,255,255,.97);border:1px solid #B9E5D9;border-radius:14px;padding:13px 14px;z-index:4;box-shadow:0 9px 22px rgba(15,23,42,.1)}.lh-community-quote small{display:block;color:#0F8A6C;font-size:8.5px;font-weight:900;letter-spacing:.08em;margin-bottom:6px}.lh-community-quote b{display:block;color:#123B45;font-size:13px;line-height:1.35}.lh-community-quote span{display:block;color:#647C8C;font-size:9.5px;line-height:1.35;margin-top:6px}
      .lh-community-cues{position:absolute;left:5%;bottom:5%;display:flex;gap:5px;flex-wrap:wrap;z-index:4}.lh-community-cues span{background:#fff;border:1px solid #C6E8DD;color:#176A58;border-radius:999px;padding:4px 7px;font-size:8.5px;font-weight:850}
      .lh-carousel{border-top:1px solid rgba(148,163,184,.14);background:rgba(2,12,27,.32);display:flex;align-items:center;justify-content:space-between;padding:0 28px;color:#9CB2C9;font-size:10px}
      .lh-dots{display:flex;gap:6px}.lh-dot{width:24px;height:3px;border-radius:999px;background:rgba(148,163,184,.24);border:0;padding:0;cursor:pointer}.lh-dot.active{background:var(--accent)}
      .lh-auto{display:flex;align-items:center;gap:7px;font-weight:850;letter-spacing:.08em}.lh-auto:before{content:'';width:6px;height:6px;border-radius:50%;background:#22C55E;box-shadow:0 0 0 3px rgba(34,197,94,.13)}
      @media(max-width:930px){.lh-shell{padding-top:78px}.lh-wrap{height:auto;min-height:0;grid-template-rows:auto auto 44px}.lh-main{grid-template-columns:1fr;height:auto;padding:24px 28px 28px}.lh-photo-frame,.lh-community-frame{max-width:760px;width:100%;height:330px}.lh-copy h1{font-size:2.45rem}}
      @media(max-width:620px){.lh-shell{padding:76px 12px 14px}.lh-tabs{padding:12px 14px 0;align-items:center}.lh-tab{font-size:10.5px;padding:8px 10px}.lh-main{padding:21px 18px 24px;gap:20px}.lh-copy h1{font-size:2.05rem}.lh-copy>p{font-size:13.5px}.lh-photo-frame,.lh-community-frame{height:290px}.lh-carousel{padding:0 16px}.lh-auto{font-size:8.5px}.lh-community-quote{width:180px;right:3%}.hero-main{left:37%}}
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

        {active === 'community'
          ? <div className="lh-community-frame"><div className="lh-community-head"><span>HEALTH COMMUNITY PREVIEW</span><span className="lh-live">● LIVE PLATFORM</span></div><CommunityPreview/></div>
          : <div className="lh-photo-frame">
              <img key={current.id} className="lh-photo" src={current.image} alt={current.imageAlt ?? ''}/>
              <div className="lh-photo-badge">HealthConnect · {current.label}</div>
            </div>}
      </div>

      <div className="lh-carousel"><div className="lh-dots">{ROLES.map(role => <button key={role.id} aria-label={`Show ${role.label}`} className={`lh-dot ${active === role.id ? 'active' : ''}`} style={{ '--accent': role.accent } as CSSProperties} onClick={() => setActive(role.id)}/>)}</div><div className="lh-auto">AUTO ROTATING · {ROLES.findIndex(role => role.id === active) + 1} / {ROLES.length}</div></div>
    </div>
  </section>;
}