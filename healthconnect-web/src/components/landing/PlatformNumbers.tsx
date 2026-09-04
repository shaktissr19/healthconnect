'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

export type PlatformStats = {
  patients: number | null;
  doctors: number | null;
  communities: number | null;
  hospitals: number | null;
};

type CountKey = keyof PlatformStats;

type Module = {
  id: string;
  icon: string;
  label: string;
  eyebrow: string;
  headline: string;
  body: string;
  points: string[];
  cta: string;
  href: string;
  accent: string;
  wash: string;
  photo: string;
  photoAlt: string;
  photoPosition?: string;
  countKey?: CountKey;
  metricLabel: string;
  roleToPrepare?: 'DOCTOR';
};

const MODULES: Module[] = [
  {
    id: 'patient',
    icon: '♥',
    label: 'Patient Dashboard',
    eyebrow: 'MY HEALTH',
    headline: 'Your health story, ready when you need it.',
    body: 'Keep records, medicines, vitals and appointments connected in one private patient workspace.',
    points: ['Medical history', 'Health Score', 'Appointments'],
    cta: 'Open My Health',
    href: '/?auth=login&home=1',
    accent: '#2563EB',
    wash: '#EDF5FF',
    photo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1400&q=86',
    photoAlt: 'Healthcare professional using a mobile device',
    photoPosition: 'center',
    countKey: 'patients',
    metricLabel: 'patient profiles',
  },
  {
    id: 'doctor-directory',
    icon: '🩺',
    label: 'Doctor Directory',
    eyebrow: 'FIND CARE',
    headline: 'Find the right doctor without the phone calls.',
    body: 'Search by specialty and location, review profiles and availability, then move into the booking journey.',
    points: ['Specialty search', 'Doctor profiles', 'Availability'],
    cta: 'Find Doctors',
    href: '/doctors',
    accent: '#7C3AED',
    wash: '#F4F0FF',
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=1400&q=86',
    photoAlt: 'Doctor in a clinical setting',
    photoPosition: 'center 28%',
    countKey: 'doctors',
    metricLabel: 'doctor profiles',
  },
  {
    id: 'communities',
    icon: '🤝',
    label: 'Health Communities',
    eyebrow: 'BETWEEN APPOINTMENTS',
    headline: 'Support that continues after the consultation ends.',
    body: 'Join condition-focused spaces to ask, share and learn with moderation and anonymous participation where enabled.',
    points: ['Peer experience', 'Q&A', 'Participation controls'],
    cta: 'Explore Communities',
    href: '/communities',
    accent: '#0B9B78',
    wash: '#EAF8F3',
    photo: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1400&q=86',
    photoAlt: 'People joining hands in a supportive community',
    photoPosition: 'center',
    countKey: 'communities',
    metricLabel: 'health communities',
  },
  {
    id: 'doctor-workspace',
    icon: '◫',
    label: 'Doctor Dashboard',
    eyebrow: 'DIGITAL PRACTICE',
    headline: 'One workspace for patients, schedules and practice.',
    body: 'Manage availability and appointments, work with patient-shared context and keep your professional presence connected.',
    points: ['Patients', 'Schedules', 'Practice workflow'],
    cta: 'Join as a Doctor',
    href: '/?home=1&auth=register',
    accent: '#0891B2',
    wash: '#EAF8FB',
    // Reuses the stronger doctor visual from the earlier Knowledge Hub reference, as requested.
    photo: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=1400&q=86',
    photoAlt: 'Doctor working with digital practice tools',
    photoPosition: 'center 42%',
    metricLabel: 'doctor workspace',
    roleToPrepare: 'DOCTOR',
  },
  {
    id: 'hospitals',
    icon: '🏥',
    label: 'Hospital Directory',
    eyebrow: 'KNOW BEFORE YOU GO',
    headline: 'See more of the hospital before you arrive.',
    body: 'Compare departments, facilities, affiliated doctors and hospital-specific OPD before deciding where to visit.',
    points: ['Departments', 'Facilities', 'Hospital OPD'],
    cta: 'Find Hospitals',
    href: '/hospitals',
    accent: '#D97706',
    wash: '#FFF6E8',
    photo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1400&q=86',
    photoAlt: 'Modern hospital interior',
    photoPosition: 'center',
    countKey: 'hospitals',
    metricLabel: 'hospital profiles',
  },
  {
    id: 'knowledge',
    icon: '📚',
    label: 'Knowledge Hub',
    eyebrow: 'LEARN & PREPARE',
    headline: 'Medical knowledge that is easier to use.',
    body: 'Explore clear health explainers and India-focused guides that help you prepare better questions for your next health conversation.',
    points: ['Health explainers', 'Condition guides', 'Everyday learning'],
    cta: 'Open Knowledge Hub',
    href: '/learn',
    accent: '#3B82F6',
    wash: '#F2F8FF',
    // Light medical-knowledge visual: books + stethoscope, replacing the generic doctor portrait.
    photo: 'https://images.unsplash.com/photo-1676313496812-f8fc7c4304cf?auto=format&fit=crop&w=1600&q=86',
    photoAlt: 'Medical books with a stethoscope',
    photoPosition: 'center',
    metricLabel: 'public health learning',
  },
];

const formatCount = (value:number|null|undefined) => value == null || !Number.isFinite(value)
  ? null
  : new Intl.NumberFormat('en-IN').format(value);

export default function PlatformNumbers({ stats }: { stats: PlatformStats }) {
  const [activeId,setActiveId] = useState(MODULES[0].id);
  const activeIndex = MODULES.findIndex(item => item.id === activeId);
  const active = useMemo(() => MODULES[Math.max(0,activeIndex)], [activeIndex]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setTimeout(() => {
      const currentIndex = Math.max(0, MODULES.findIndex(item => item.id === activeId));
      setActiveId(MODULES[(currentIndex + 1) % MODULES.length].id);
    }, 6200);
    return () => window.clearTimeout(timer);
  }, [activeId]);

  const metricValue = active.countKey ? formatCount(stats[active.countKey]) : null;

  const prepareRole = () => {
    if (!active.roleToPrepare) return;
    try { sessionStorage.setItem('hc_signup_role', active.roleToPrepare); } catch {}
  };

  return <section className="ps-section" id="platform-tour">
    <style>{`
      .ps-section{background:#F8FBFB;padding:48px 28px 58px;font-family:'DM Sans',Arial,sans-serif}
      .ps-head{max-width:1280px;margin:0 auto 27px;display:flex;align-items:end;justify-content:space-between;gap:40px}
      .ps-kicker{font-size:10px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#0B8F7C;margin-bottom:10px}
      .ps-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.7rem,4.2vw,4.8rem);line-height:.98;letter-spacing:-.055em;color:#0B1930;margin:0;max-width:760px}
      .ps-head p{max-width:340px;margin:0 0 4px;color:#60768A;font-size:14px;line-height:1.6}
      .ps-modules{max-width:1280px;margin:0 auto 18px;display:grid;grid-template-columns:repeat(6,1fr);gap:8px}
      .ps-module{position:relative;border:1px solid #D8E5E6;background:rgba(255,255,255,.72);border-radius:14px;min-height:90px;padding:13px 10px 11px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;color:#527087;cursor:pointer;transition:.18s;overflow:hidden}
      .ps-module:hover{transform:translateY(-2px);background:#fff;box-shadow:0 8px 18px rgba(15,43,58,.07)}
      .ps-module.active{background:#fff;color:#0B1930;box-shadow:0 10px 24px rgba(15,43,58,.09)}
      .ps-module.active:after{content:'';position:absolute;left:0;bottom:0;height:3px;background:currentColor;animation:psProgress 6.2s linear forwards}
      @keyframes psProgress{from{width:0}to{width:100%}}
      .ps-icon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;font-size:16px;font-weight:900}
      .ps-module strong{font-size:10.5px;line-height:1.25;text-align:center}
      .ps-stage{max-width:1280px;min-height:410px;margin:0 auto;border:1px solid #D7E4E5;border-radius:22px;overflow:hidden;display:grid;grid-template-columns:minmax(390px,.9fr) minmax(0,1.1fr);box-shadow:0 16px 38px rgba(15,43,58,.09);position:relative}
      .ps-copy{padding:42px 46px 38px;display:flex;flex-direction:column;justify-content:center;position:relative;z-index:2}
      .ps-eyebrow{font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;margin-bottom:10px}
      .ps-copy h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.15rem,3vw,3.45rem);line-height:1.02;letter-spacing:-.045em;color:#0B1930;margin:0 0 15px;max-width:610px}
      .ps-copy>p{font-size:15px;line-height:1.6;color:#536C80;max-width:590px;margin:0 0 18px}
      .ps-points{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px}.ps-point{padding:7px 10px;background:rgba(255,255,255,.72);border:1px solid rgba(130,160,172,.22);border-radius:999px;color:#29485E;font-size:10.5px;font-weight:800}
      .ps-bottom{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.ps-cta{display:inline-flex;align-items:center;border-radius:10px;padding:11px 16px;color:#fff;text-decoration:none;font-size:11.5px;font-weight:900;box-shadow:0 7px 18px rgba(15,43,58,.12);transition:.16s}.ps-cta:hover{transform:translateY(-1px)}
      .ps-metric{font-size:10px;color:#61788A;font-weight:750}.ps-metric strong{display:block;font-family:'Sora',sans-serif;font-size:17px;color:#0B1930;line-height:1.1;margin-bottom:1px}
      .ps-photo{position:relative;min-height:410px;overflow:hidden;background:#EAF2F2}.ps-photo img{width:100%;height:100%;position:absolute;inset:0;display:block;object-fit:cover;transition:opacity .25s ease,transform .5s ease;animation:psPhotoIn .38s ease both}.ps-stage:hover .ps-photo img{transform:scale(1.015)}
      @keyframes psPhotoIn{from{opacity:.45;transform:scale(1.025)}to{opacity:1;transform:scale(1)}}
      .ps-photo:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(248,251,251,.28),transparent 26%),linear-gradient(0deg,rgba(7,28,42,.08),transparent 42%);pointer-events:none}
      .ps-photo-note{position:absolute;right:18px;bottom:18px;z-index:2;background:rgba(255,255,255,.92);border:1px solid rgba(210,226,226,.94);backdrop-filter:blur(10px);border-radius:12px;padding:9px 12px;color:#15384B;font-size:10px;font-weight:850;box-shadow:0 8px 22px rgba(15,43,58,.09)}
      .ps-dots{max-width:1280px;margin:12px auto 0;display:flex;justify-content:center;gap:6px}.ps-dot{width:6px;height:6px;border-radius:999px;border:0;background:#C6D5D9;padding:0;cursor:pointer;transition:.18s}.ps-dot.active{width:23px}
      @media(max-width:1000px){.ps-head{align-items:start;flex-direction:column;gap:12px}.ps-modules{grid-template-columns:repeat(3,1fr)}.ps-stage{grid-template-columns:1fr}.ps-photo{min-height:300px}.ps-copy{padding:36px 34px}}
      @media(max-width:620px){.ps-section{padding:38px 14px 46px}.ps-head h2{font-size:2.75rem}.ps-modules{display:flex;overflow-x:auto;padding-bottom:5px;scrollbar-width:none}.ps-module{min-width:132px}.ps-stage{border-radius:17px}.ps-copy{padding:30px 24px}.ps-copy h3{font-size:2.35rem}.ps-copy>p{font-size:14px}.ps-photo{min-height:250px}}
    `}</style>

    <div className="ps-head">
      <div><div className="ps-kicker">Explore HealthConnect</div><h2>Everything you need.<br/>Nothing you don&apos;t.</h2></div>
      <p>Six connected parts, each with one clear job. Choose a module or let the story move automatically.</p>
    </div>

    <div className="ps-modules" role="tablist" aria-label="HealthConnect modules">
      {MODULES.map(item => {
        const selected = item.id === active.id;
        return <button key={item.id} type="button" role="tab" aria-selected={selected} className={`ps-module ${selected?'active':''}`} style={{color:selected?item.accent:undefined,borderColor:selected?`${item.accent}80`:undefined}} onClick={()=>setActiveId(item.id)}>
          <span className="ps-icon" style={{background:`${item.accent}13`,color:item.accent}}>{item.icon}</span>
          <strong>{item.label}</strong>
        </button>;
      })}
    </div>

    <div className="ps-stage" key={active.id} style={{background:`linear-gradient(135deg,${active.wash} 0%,#FFFFFF 76%)`}}>
      <div className="ps-copy">
        <div className="ps-eyebrow" style={{color:active.accent}}>{active.eyebrow}</div>
        <h3>{active.headline}</h3>
        <p>{active.body}</p>
        <div className="ps-points">{active.points.map(point=><span className="ps-point" key={point}>{point}</span>)}</div>
        <div className="ps-bottom">
          <Link className="ps-cta" href={active.href} style={{background:active.accent}} onClick={prepareRole}>{active.cta} →</Link>
          <div className="ps-metric">{metricValue?<><strong>{metricValue}</strong>{active.metricLabel}</>:<><strong>{active.label}</strong>{active.metricLabel}</>}</div>
        </div>
      </div>
      <div className="ps-photo">
        <img src={active.photo} alt={active.photoAlt} style={{objectPosition:active.photoPosition || 'center'}}/>
        <div className="ps-photo-note" style={{borderColor:`${active.accent}35`}}>{active.icon} {active.label}</div>
      </div>
    </div>

    <div className="ps-dots" aria-label="Module carousel controls">{MODULES.map(item=><button key={item.id} type="button" aria-label={`Show ${item.label}`} className={`ps-dot ${item.id===active.id?'active':''}`} style={{background:item.id===active.id?active.accent:undefined}} onClick={()=>setActiveId(item.id)}/>)}</div>
  </section>;
}
