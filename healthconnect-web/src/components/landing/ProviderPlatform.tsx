'use client';

import { useState } from 'react';
import { useUIStore } from '@/store/uiStore';

const PROVIDERS = {
  doctor: {
    label: 'For Doctors',
    icon: '🩺',
    color: '#7C3AED',
    kicker: 'DOCTOR WORKSPACE',
    title: 'A digital practice that keeps care context close.',
    body: 'HealthConnect gives doctors a provider profile and an operational workspace for availability, appointments, patient-shared health context, hospital affiliations and reviews.',
    features: ['Provider profile & verification status', 'Availability and consultation schedules', 'Appointment queue and status workflow', 'Patient-shared health history', 'Hospital affiliations', 'Reviews and practice analytics'],
    signup: 'Register as a Doctor',
    role: 'DOCTOR',
  },
  hospital: {
    label: 'For Hospitals',
    icon: '🏥',
    color: '#0D9488',
    kicker: 'HOSPITAL MANAGEMENT',
    title: 'Your hospital’s digital front door and OPD operations in one place.',
    body: 'Publish a verified hospital profile and manage departments, facilities, affiliated doctors, hospital-specific OPD, appointments, patient reviews and operational analytics.',
    features: ['Hospital profile & verification', 'Departments & facilities', 'Doctor affiliations', 'Hospital-specific OPD', 'Appointment lifecycle', 'Patient reviews & analytics'],
    signup: 'Register Hospital',
    role: 'HOSPITAL',
  },
} as const;

type ProviderKey = keyof typeof PROVIDERS;

export default function ProviderPlatform() {
  const [active, setActive] = useState<ProviderKey>('doctor');
  const { openAuthModal } = useUIStore();
  const p = PROVIDERS[active];

  const signup = () => {
    try { sessionStorage.setItem('hc_signup_role', p.role); } catch {}
    openAuthModal('register');
  };
  const signin = () => {
    try { sessionStorage.setItem('hc_post_login_redirect', active === 'doctor' ? '/doctor-dashboard' : '/hospital-dashboard'); } catch {}
    openAuthModal('login');
  };

  return (
    <section className="provider-section">
      <style>{`
        .provider-section{background:#fff;padding:76px 28px;font-family:'DM Sans',Arial,sans-serif}.provider-inner{max-width:1280px;margin:0 auto}.provider-kicker{font-size:11px;font-weight:850;letter-spacing:.17em;color:#64748B;margin-bottom:10px}.provider-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,3.2vw,3.65rem);line-height:1.05;letter-spacing:-.045em;color:#0F172A;margin:0;max-width:720px}.provider-head{display:flex;align-items:end;justify-content:space-between;gap:30px;margin-bottom:30px}.provider-head p{font-size:14px;color:#64748B;line-height:1.7;max-width:430px;margin:0}.provider-tabs{display:flex;gap:8px;margin-bottom:14px}.provider-tab{border:1px solid #DBE5EE;background:#F8FAFC;border-radius:10px;padding:9px 14px;font-size:12px;font-weight:800;color:#475569;cursor:pointer}.provider-tab.active{background:#0F172A;color:#fff;border-color:#0F172A}
        .provider-panel{display:grid;grid-template-columns:.92fr 1.08fr;border:1px solid #DFE8EF;border-radius:22px;overflow:hidden;box-shadow:0 14px 40px rgba(15,23,42,.06)}.provider-copy{padding:36px;background:#F8FBFD}.provider-copy .provider-kicker{color:var(--accent)}.provider-copy h3{font-family:'Sora',sans-serif;font-size:clamp(1.8rem,2.5vw,2.7rem);line-height:1.1;color:#0F172A;margin:0 0 13px;letter-spacing:-.04em}.provider-copy>p{font-size:14px;line-height:1.72;color:#5A6F85;margin:0 0 22px}.provider-actions{display:flex;gap:9px;flex-wrap:wrap}.provider-primary,.provider-secondary{border-radius:10px;padding:11px 16px;font-size:11px;font-weight:900;cursor:pointer}.provider-primary{border:1px solid var(--accent);background:var(--accent);color:#fff}.provider-secondary{border:1px solid #CBD5E1;background:#fff;color:#334155}
        .provider-demo{padding:28px;background:linear-gradient(135deg,#08162A,#0D213E);color:#fff}.provider-demo-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.provider-demo-top strong{font-family:'Sora',sans-serif;font-size:14px}.provider-badge{font-size:8px;text-transform:uppercase;letter-spacing:.09em;color:#A7F3D0;border:1px solid rgba(167,243,208,.2);padding:4px 7px;border-radius:999px;background:rgba(16,185,129,.08)}.provider-feature-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.provider-feature{background:rgba(255,255,255,.06);border:1px solid rgba(148,163,184,.13);border-radius:12px;padding:13px;min-height:78px}.provider-feature span{display:grid;place-items:center;width:22px;height:22px;border-radius:7px;background:color-mix(in srgb,var(--accent) 18%,transparent);color:var(--accent);font-size:10px;font-weight:900;margin-bottom:9px}.provider-feature strong{font-size:11px;line-height:1.35;color:#EAF2FC}.provider-flow{margin-top:11px;background:rgba(255,255,255,.05);border:1px solid rgba(148,163,184,.12);border-radius:12px;padding:13px}.provider-flow small{display:block;font-size:8px;color:#829AB5;letter-spacing:.1em;font-weight:900;margin-bottom:9px}.provider-flow-row{display:flex;gap:5px;align-items:center;flex-wrap:wrap}.provider-flow-row span{font-size:8px;background:rgba(255,255,255,.07);border-radius:999px;padding:5px 7px;color:#D9E6F4}.provider-flow-row i{font-style:normal;color:#5F7692}
        @media(max-width:900px){.provider-head{align-items:start;flex-direction:column}.provider-panel{grid-template-columns:1fr}}
        @media(max-width:600px){.provider-section{padding:58px 16px}.provider-copy,.provider-demo{padding:24px}.provider-feature-grid{grid-template-columns:1fr}}
      `}</style>
      <div className="provider-inner">
        <div className="provider-head"><div><div className="provider-kicker">FOR HEALTHCARE PROVIDERS</div><h2 className="provider-title">Not just a listing. A workspace behind the profile.</h2></div><p>Patients discover providers publicly. Doctors and hospitals sign in to role-specific operational dashboards behind those public profiles.</p></div>
        <div className="provider-tabs">{(Object.keys(PROVIDERS) as ProviderKey[]).map(key => <button key={key} className={`provider-tab ${active===key?'active':''}`} onClick={()=>setActive(key)}>{PROVIDERS[key].icon} {PROVIDERS[key].label}</button>)}</div>
        <div className="provider-panel" style={{ '--accent': p.color } as React.CSSProperties}>
          <div className="provider-copy"><div className="provider-kicker">{p.kicker}</div><h3>{p.title}</h3><p>{p.body}</p><div className="provider-actions"><button className="provider-primary" onClick={signup}>{p.signup} →</button><button className="provider-secondary" onClick={signin}>Sign In</button></div></div>
          <div className="provider-demo"><div className="provider-demo-top"><strong>{p.icon} HealthConnect · {p.label}</strong><span className="provider-badge">Product workspace</span></div><div className="provider-feature-grid">{p.features.map((feature,i)=><div className="provider-feature" key={feature}><span>{String(i+1).padStart(2,'0')}</span><strong>{feature}</strong></div>)}</div><div className="provider-flow"><small>CONNECTED WORKFLOW</small><div className="provider-flow-row">{active==='doctor'?<><span>Profile</span><i>→</i><span>Availability</span><i>→</i><span>Appointment</span><i>→</i><span>Patient context</span><i>→</i><span>Follow-up</span></>:<><span>Profile</span><i>→</i><span>Doctors</span><i>→</i><span>Hospital OPD</span><i>→</i><span>Appointment</span><i>→</i><span>Review</span></>}</div></div></div>
        </div>
      </div>
    </section>
  );
}
