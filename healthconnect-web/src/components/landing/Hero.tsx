'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
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

type RoleContent = {
  id: RoleId;
  label: string;
  icon: string;
  eyebrow: string;
  headline: string;
  body: string;
  primary: { label: string; href?: string; action?: 'signup' | 'login' | 'my-health' };
  secondary: { label: string; href?: string; action?: 'signup' | 'login' | 'my-health' };
  note: string;
  accent: string;
};

const ROLES: RoleContent[] = [
  {
    id: 'patient',
    label: 'For Patients',
    icon: '♥',
    eyebrow: 'YOUR HEALTH, CONNECTED',
    headline: 'Everything your health needs, connected.',
    body: 'Find doctors and hospitals, book appointments, organise reports and medicines, track your health and keep your healthcare journey in one private account.',
    primary: { label: 'Find Doctors', href: '/doctors' },
    secondary: { label: 'Find Hospitals', href: '/hospitals' },
    note: 'Already using HealthConnect? Open My Health →',
    accent: '#38BDF8',
  },
  {
    id: 'community',
    label: 'Health Communities',
    icon: '🤝',
    eyebrow: 'SUPPORT BEYOND THE APPOINTMENT',
    headline: 'Health questions feel easier when you do not feel alone.',
    body: 'Browse condition-specific communities, join conversations, attend health Q&A events and post anonymously where the community allows it. Your public identity stays protected in anonymous posts.',
    primary: { label: 'Browse Communities', href: '/communities' },
    secondary: { label: 'Create Free Account', action: 'signup' },
    note: 'Browse without an account. Sign in to participate.',
    accent: '#34D399',
  },
  {
    id: 'doctor',
    label: 'For Doctors',
    icon: '🩺',
    eyebrow: 'A DIGITAL PRACTICE BUILT AROUND CARE',
    headline: 'Patients, appointments and your digital practice — together.',
    body: 'Build a HealthConnect provider profile, publish availability, manage appointments, review patient-shared health information and coordinate hospital affiliations from one workspace.',
    primary: { label: 'Register as a Doctor', action: 'signup' },
    secondary: { label: 'Doctor Sign In', action: 'login' },
    note: 'Provider verification is completed before verified status is displayed.',
    accent: '#A78BFA',
  },
  {
    id: 'hospital',
    label: 'For Hospitals',
    icon: '🏥',
    eyebrow: 'DIGITAL HOSPITAL ACCESS',
    headline: 'Put your doctors, OPD and services where patients can find them.',
    body: 'Publish your hospital profile, departments, facilities, affiliated doctors and hospital-specific OPD. Coordinate appointments and help patients understand available services before they visit.',
    primary: { label: 'Register Hospital', action: 'signup' },
    secondary: { label: 'Find Hospitals', href: '/hospitals' },
    note: 'Verified hospitals can publish real provider and OPD information.',
    accent: '#F59E0B',
  },
];

function formatCount(value: number | null) {
  if (value === null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-IN').format(value);
}

function PatientPreview() {
  return (
    <div className="hc-preview-grid">
      <div className="hc-preview-card hc-preview-score">
        <div className="hc-preview-kicker">MY HEALTH</div>
        <div className="hc-score-row"><strong>67</strong><span>/100<br/>Health Score</span></div>
        <div className="hc-meter"><span style={{ width: '67%' }} /></div>
      </div>
      <div className="hc-preview-card">
        <div className="hc-preview-kicker">NEXT APPOINTMENT</div>
        <strong className="hc-preview-title">Dr. Arun Kumar</strong>
        <span className="hc-preview-copy">AIIMS New Delhi · Hospital OPD</span>
        <span className="hc-preview-chip">Confirmed</span>
      </div>
      <div className="hc-preview-card">
        <div className="hc-preview-kicker">YOUR HEALTH JOURNEY</div>
        <div className="hc-journey-mini">
          <span>Reports</span><i />
          <span>Medicines</span><i />
          <span>Visits</span><i />
          <span>Follow-up</span>
        </div>
      </div>
      <div className="hc-preview-card">
        <div className="hc-preview-kicker">PRIVATE RECORD</div>
        <strong className="hc-preview-title">Your data, your control</strong>
        <span className="hc-preview-copy">Share health information only when you choose.</span>
      </div>
    </div>
  );
}

function CommunityPreview() {
  return (
    <div className="hc-preview-stack">
      <div className="hc-preview-card">
        <div className="hc-preview-head"><span className="hc-avatar">A</span><div><strong>Anonymous member</strong><small>Diabetes Support</small></div></div>
        <p className="hc-preview-post">“How do others manage meals when glucose readings change after dinner?”</p>
        <div className="hc-preview-actions"><span>♡ 18</span><span>💬 7 replies</span><span>Report</span></div>
      </div>
      <div className="hc-preview-card hc-community-safe">
        <div><span className="hc-safe-icon">✓</span><strong>Community safety</strong></div>
        <p>Approved membership, moderation tools, reports and role-aware anonymous posting are built into the Community workflow.</p>
      </div>
      <div className="hc-preview-card hc-event-card">
        <div className="hc-preview-kicker">UPCOMING Q&A</div>
        <strong className="hc-preview-title">Living well with hypertension</strong>
        <span className="hc-preview-copy">Community event · RSVP inside HealthConnect</span>
      </div>
    </div>
  );
}

function DoctorPreview() {
  return (
    <div className="hc-preview-stack">
      <div className="hc-preview-card">
        <div className="hc-preview-kicker">TODAY'S APPOINTMENTS</div>
        {[
          ['10:00', 'Priya Sharma', 'Confirmed'],
          ['10:30', 'Rahul Verma', 'Checked in'],
          ['11:00', 'Meena Iyer', 'Pending'],
        ].map(([time, name, status]) => (
          <div className="hc-appt-row" key={time}><b>{time}</b><span>{name}</span><em>{status}</em></div>
        ))}
      </div>
      <div className="hc-preview-grid two">
        <div className="hc-preview-card"><div className="hc-preview-kicker">AVAILABILITY</div><strong className="hc-preview-title">OPD & consultation slots</strong><span className="hc-preview-copy">Publish and manage your schedule.</span></div>
        <div className="hc-preview-card"><div className="hc-preview-kicker">CARE CONTEXT</div><strong className="hc-preview-title">Patient-shared history</strong><span className="hc-preview-copy">See consented records before a visit.</span></div>
      </div>
    </div>
  );
}

function HospitalPreview() {
  return (
    <div className="hc-preview-stack">
      <div className="hc-preview-card">
        <div className="hc-preview-kicker">HOSPITAL OPERATIONS</div>
        <div className="hc-hospital-stats"><div><strong>2</strong><span>Doctors</span></div><div><strong>2</strong><span>Departments</span></div><div><strong>4</strong><span>OPD slots</span></div></div>
      </div>
      <div className="hc-preview-card">
        <div className="hc-preview-kicker">APPOINTMENT FLOW</div>
        <div className="hc-status-flow"><span>Pending</span><i>→</i><span>Confirmed</span><i>→</i><span>Checked in</span><i>→</i><span>In progress</span></div>
      </div>
      <div className="hc-preview-card">
        <div className="hc-preview-kicker">PUBLIC HOSPITAL PROFILE</div>
        <div className="hc-facility-list"><span>Departments</span><span>Facilities</span><span>Insurance & schemes</span><span>Hospital OPD</span></div>
      </div>
    </div>
  );
}

export default function Hero({ stats }: { stats: PlatformStats }) {
  const [active, setActive] = useState<RoleId>('patient');
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const current = useMemo(() => ROLES.find(r => r.id === active) ?? ROLES[0], [active]);

  const openSignup = (role: 'PATIENT' | 'DOCTOR' | 'HOSPITAL' = 'PATIENT') => {
    try { sessionStorage.setItem('hc_signup_role', role); } catch {}
    openAuthModal('register');
  };

  const openLogin = (redirect?: string) => {
    try { if (redirect) sessionStorage.setItem('hc_post_login_redirect', redirect); } catch {}
    openAuthModal('login');
  };

  const openMyHealth = () => {
    if (isAuthenticated && user) {
      const role = String(user.role ?? '').toUpperCase();
      if (role === 'PATIENT') router.push('/dashboard');
      else if (role === 'DOCTOR') router.push('/doctor-dashboard');
      else if (role === 'HOSPITAL') router.push('/hospital-dashboard');
      else router.push('/admin-dashboard');
      return;
    }
    openLogin('/dashboard');
  };

  const runAction = (item: RoleContent['primary']) => {
    if (item.href) { router.push(item.href); return; }
    if (item.action === 'login') { openLogin(active === 'doctor' ? '/doctor-dashboard' : undefined); return; }
    if (item.action === 'my-health') { openMyHealth(); return; }
    openSignup(active === 'doctor' ? 'DOCTOR' : active === 'hospital' ? 'HOSPITAL' : 'PATIENT');
  };

  const preview = active === 'patient' ? <PatientPreview /> : active === 'community' ? <CommunityPreview /> : active === 'doctor' ? <DoctorPreview /> : <HospitalPreview />;

  return (
    <section className="hc-hero-shell">
      <style>{`
        .hc-hero-shell{padding:84px 28px 0;background:#fff;font-family:'DM Sans',Arial,sans-serif}
        .hc-hero{max-width:1280px;margin:0 auto;min-height:540px;border-radius:24px;overflow:hidden;position:relative;background:radial-gradient(circle at 86% 18%,rgba(20,184,166,.12),transparent 28%),linear-gradient(135deg,#061225 0%,#0A1A33 55%,#0C2744 100%);box-shadow:0 18px 52px rgba(15,23,42,.16);border:1px solid rgba(148,163,184,.14)}
        .hc-hero:before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:42px 42px;mask-image:linear-gradient(to left,#000,transparent 72%);pointer-events:none}
        .hc-role-tabs{display:flex;gap:8px;padding:20px 28px 0;position:relative;z-index:2;overflow-x:auto;scrollbar-width:none}
        .hc-role-tab{border:1px solid rgba(148,163,184,.18);background:rgba(255,255,255,.035);color:#A8BDD6;border-radius:11px;padding:10px 14px;display:flex;align-items:center;gap:8px;white-space:nowrap;cursor:pointer;font-size:13px;font-weight:750;transition:.18s ease}
        .hc-role-tab:hover{color:#fff;border-color:rgba(94,234,212,.32)}
        .hc-role-tab.active{color:#fff;background:rgba(255,255,255,.08);border-color:var(--accent);box-shadow:inset 0 -2px 0 var(--accent)}
        .hc-hero-grid{display:grid;grid-template-columns:minmax(0,1.04fr) minmax(390px,.96fr);gap:44px;padding:42px 54px 44px;align-items:center;position:relative;z-index:2}
        .hc-eyebrow{font-size:11px;font-weight:850;letter-spacing:.17em;color:var(--accent);margin-bottom:14px}
        .hc-hero h1{font-family:'Sora','DM Sans',sans-serif;color:#F8FBFF;font-size:clamp(2.4rem,4vw,4.35rem);line-height:1.03;letter-spacing:-.045em;margin:0 0 18px;max-width:700px}
        .hc-hero-copy{color:#B4C7DE;font-size:16px;line-height:1.72;max-width:650px;margin:0 0 25px}
        .hc-actions{display:flex;gap:11px;flex-wrap:wrap;align-items:center}
        .hc-btn{border-radius:10px;padding:12px 20px;font-size:13px;font-weight:850;letter-spacing:.01em;cursor:pointer;text-decoration:none;border:1px solid transparent;transition:.18s ease;font-family:inherit}
        .hc-btn.primary{background:var(--accent);color:#061225;border-color:var(--accent)}
        .hc-btn.secondary{background:rgba(255,255,255,.04);color:#F8FBFF;border-color:rgba(255,255,255,.2)}
        .hc-btn:hover{transform:translateY(-1px);filter:brightness(1.04)}
        .hc-inline-note{display:inline-flex;margin-top:16px;background:none;border:none;padding:0;color:#8FB0CF;font-size:12px;font-weight:650;cursor:pointer;text-align:left}
        .hc-inline-note:hover{color:#fff}
        .hc-preview-wrap{background:rgba(255,255,255,.055);border:1px solid rgba(148,163,184,.18);border-radius:20px;padding:16px;box-shadow:0 24px 70px rgba(0,0,0,.22);backdrop-filter:blur(12px)}
        .hc-preview-top{display:flex;justify-content:space-between;align-items:center;padding:2px 3px 12px;color:#8EA9C7;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
        .hc-live{display:flex;gap:6px;align-items:center;color:#86EFAC}.hc-live:before{content:'';width:7px;height:7px;border-radius:50%;background:#22C55E;box-shadow:0 0 0 4px rgba(34,197,94,.12)}
        .hc-preview-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.hc-preview-grid.two{grid-template-columns:1fr 1fr}
        .hc-preview-stack{display:flex;flex-direction:column;gap:10px}
        .hc-preview-card{background:#F8FBFF;border:1px solid rgba(219,231,243,.9);border-radius:14px;padding:14px;color:#10233C;min-width:0}
        .hc-preview-kicker{font-size:9px;font-weight:900;letter-spacing:.12em;color:#6B87A8;margin-bottom:8px}
        .hc-preview-title{display:block;font-size:13px;font-weight:850;margin-bottom:4px}.hc-preview-copy{display:block;font-size:11px;color:#64748B;line-height:1.45}.hc-preview-chip{display:inline-block;margin-top:9px;font-size:9px;font-weight:850;color:#0F766E;background:#CCFBF1;border-radius:999px;padding:4px 8px}
        .hc-score-row{display:flex;align-items:flex-end;gap:8px}.hc-score-row strong{font-family:'Sora',sans-serif;font-size:36px;color:#0D9488;line-height:1}.hc-score-row span{font-size:9px;color:#64748B;line-height:1.25}.hc-meter{height:5px;background:#E2E8F0;border-radius:999px;margin-top:12px;overflow:hidden}.hc-meter span{display:block;height:100%;background:linear-gradient(90deg,#0D9488,#38BDF8);border-radius:999px}
        .hc-journey-mini{display:flex;align-items:center;gap:5px;flex-wrap:wrap}.hc-journey-mini span{font-size:9px;font-weight:750;color:#1E3A5F;background:#EDF4FA;padding:5px 7px;border-radius:6px}.hc-journey-mini i{width:8px;height:1px;background:#B7C8D9}
        .hc-preview-head{display:flex;align-items:center;gap:10px}.hc-preview-head strong{display:block;font-size:12px}.hc-preview-head small{display:block;font-size:9px;color:#64748B;margin-top:2px}.hc-avatar{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#ECFDF5;color:#047857;font-weight:900}.hc-preview-post{font-size:12px;line-height:1.55;color:#334155;margin:12px 0}.hc-preview-actions{display:flex;gap:14px;color:#64748B;font-size:9px}.hc-community-safe{background:#F0FDF4;border-color:#BBF7D0}.hc-community-safe>div{display:flex;align-items:center;gap:8px;font-size:12px}.hc-community-safe p{font-size:10px;color:#4B5563;line-height:1.5;margin:8px 0 0}.hc-safe-icon{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#22C55E;color:#fff;font-weight:900}.hc-event-card{border-left:3px solid #34D399}
        .hc-appt-row{display:grid;grid-template-columns:54px 1fr auto;gap:8px;align-items:center;padding:9px 0;border-bottom:1px solid #E8EEF5;font-size:10px}.hc-appt-row:last-child{border-bottom:none}.hc-appt-row b{color:#475569}.hc-appt-row span{font-weight:750}.hc-appt-row em{font-style:normal;color:#0F766E;background:#ECFDF5;padding:3px 6px;border-radius:999px;font-size:8px;font-weight:800}
        .hc-hospital-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.hc-hospital-stats div{background:#EFF6FF;border-radius:9px;padding:9px}.hc-hospital-stats strong{display:block;font-family:'Sora',sans-serif;font-size:21px;color:#0F4C81}.hc-hospital-stats span{font-size:8px;color:#64748B}.hc-status-flow{display:flex;align-items:center;gap:5px;flex-wrap:wrap}.hc-status-flow span{font-size:8px;font-weight:800;padding:5px 7px;border-radius:999px;background:#FFF7ED;color:#9A3412}.hc-status-flow i{font-style:normal;color:#94A3B8}.hc-facility-list{display:grid;grid-template-columns:1fr 1fr;gap:7px}.hc-facility-list span{font-size:9px;font-weight:750;color:#334155;background:#F1F5F9;border-radius:7px;padding:7px}
        .hc-hero-stats{display:grid;grid-template-columns:repeat(4,1fr);max-width:1280px;margin:0 auto;border:1px solid #E2E8F0;border-top:0;border-radius:0 0 18px 18px;background:#fff;box-shadow:0 10px 28px rgba(15,23,42,.06);overflow:hidden}
        .hc-hero-stat{padding:15px 20px;border-right:1px solid #E2E8F0;display:flex;align-items:center;gap:11px}.hc-hero-stat:last-child{border-right:none}.hc-hero-stat strong{font-family:'Sora',sans-serif;font-size:23px;color:#0F172A}.hc-hero-stat span{font-size:10px;color:#64748B;line-height:1.35}.hc-hero-stat b{font-size:17px}
        @media(max-width:950px){.hc-hero-grid{grid-template-columns:1fr;padding:36px 34px}.hc-preview-wrap{max-width:620px}.hc-hero{min-height:0}.hc-hero-stats{grid-template-columns:1fr 1fr}.hc-hero-stat:nth-child(2){border-right:none}.hc-hero-stat:nth-child(-n+2){border-bottom:1px solid #E2E8F0}}
        @media(max-width:640px){.hc-hero-shell{padding:76px 14px 0}.hc-role-tabs{padding:14px 16px 0}.hc-role-tab{font-size:11px;padding:8px 10px}.hc-hero-grid{padding:28px 20px 30px;gap:28px}.hc-hero h1{font-size:2.35rem}.hc-hero-copy{font-size:14px}.hc-actions{display:grid;grid-template-columns:1fr 1fr}.hc-btn{text-align:center;padding:11px 12px}.hc-preview-grid,.hc-preview-grid.two{grid-template-columns:1fr}.hc-hero-stats{margin:0 6px}.hc-hero-stat{padding:12px}.hc-hero-stat strong{font-size:19px}.hc-hero-stat span{font-size:9px}}
      `}</style>

      <div className="hc-hero" style={{ '--accent': current.accent } as React.CSSProperties}>
        <div className="hc-role-tabs" role="tablist" aria-label="HealthConnect for different users">
          {ROLES.map(role => (
            <button key={role.id} role="tab" aria-selected={active === role.id} className={`hc-role-tab ${active === role.id ? 'active' : ''}`} style={{ '--accent': role.accent } as React.CSSProperties} onClick={() => setActive(role.id)}>
              <span>{role.icon}</span>{role.label}
            </button>
          ))}
        </div>

        <div className="hc-hero-grid">
          <div>
            <div className="hc-eyebrow">{current.eyebrow}</div>
            <h1>{current.headline}</h1>
            <p className="hc-hero-copy">{current.body}</p>
            <div className="hc-actions">
              <button className="hc-btn primary" onClick={() => runAction(current.primary)}>{current.primary.label} →</button>
              <button className="hc-btn secondary" onClick={() => runAction(current.secondary)}>{current.secondary.label}</button>
            </div>
            {active === 'patient' ? (
              <button className="hc-inline-note" onClick={openMyHealth}>{current.note}</button>
            ) : (
              <div className="hc-inline-note" style={{ cursor: 'default' }}>{current.note}</div>
            )}
          </div>

          <div className="hc-preview-wrap">
            <div className="hc-preview-top"><span>HealthConnect product preview</span><span className="hc-live">Live platform</span></div>
            {preview}
          </div>
        </div>
      </div>

      <div className="hc-hero-stats" aria-label="Current HealthConnect platform footprint">
        <div className="hc-hero-stat"><b>♥</b><strong>{formatCount(stats.patients)}</strong><span>Patient<br/>profiles</span></div>
        <div className="hc-hero-stat"><b>🩺</b><strong>{formatCount(stats.doctors)}</strong><span>Doctor<br/>profiles</span></div>
        <div className="hc-hero-stat"><b>🏥</b><strong>{formatCount(stats.hospitals)}</strong><span>Hospital<br/>profiles</span></div>
        <div className="hc-hero-stat"><b>🤝</b><strong>{formatCount(stats.communities)}</strong><span>Health<br/>communities</span></div>
      </div>
    </section>
  );
}
