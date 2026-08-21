'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const STEPS = [
  ['01', 'Health Profile', 'Identity, core health context and preferences'],
  ['02', 'Medical History', 'Conditions, past care and longitudinal history'],
  ['03', 'Vitals & Symptoms', 'Track measurable health information over time'],
  ['04', 'Reports & Prescriptions', 'Keep documents organised in one health account'],
  ['05', 'Medications', 'Know what you take and follow treatment more consistently'],
  ['06', 'Doctor & Hospital Visits', 'Appointments stay connected to your care journey'],
  ['07', 'Follow-up', 'Keep the next step visible instead of starting over'],
] as const;

export default function HealthJourney() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();

  const openMyHealth = () => {
    if (!isAuthenticated || !user) {
      try { sessionStorage.setItem('hc_post_login_redirect', '/dashboard'); } catch {}
      openAuthModal('login');
      return;
    }
    const role = String(user.role ?? '').toUpperCase();
    if (role === 'PATIENT') router.push('/dashboard');
    else if (role === 'DOCTOR') router.push('/doctor-dashboard');
    else if (role === 'HOSPITAL') router.push('/hospital-dashboard');
    else router.push('/admin-dashboard');
  };

  return (
    <section className="journey-section">
      <style>{`
        .journey-section{background:#F4F8FB;padding:76px 28px;font-family:'DM Sans',Arial,sans-serif}
        .journey-inner{max-width:1280px;margin:0 auto;display:grid;grid-template-columns:minmax(0,.92fr) minmax(500px,1.08fr);gap:54px;align-items:center}
        .journey-kicker{font-size:11px;font-weight:850;letter-spacing:.17em;color:#0D9488;margin-bottom:11px}
        .journey-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.1rem,3.4vw,3.8rem);line-height:1.05;letter-spacing:-.045em;color:#0F172A;margin:0 0 16px}
        .journey-copy{font-size:15px;line-height:1.75;color:#5C7085;margin:0 0 23px;max-width:560px}
        .journey-quote{padding:16px 18px;border-left:3px solid #0D9488;background:#fff;border-radius:0 12px 12px 0;color:#334155;font-size:13px;line-height:1.65;margin-bottom:22px;box-shadow:0 6px 20px rgba(15,23,42,.04)}
        .journey-cta{border:none;border-radius:10px;padding:12px 19px;background:#0D9488;color:#fff;font-size:12px;font-weight:850;cursor:pointer;box-shadow:0 8px 22px rgba(13,148,136,.19)}
        .journey-app{background:#08182D;border-radius:22px;padding:17px;border:1px solid rgba(148,163,184,.18);box-shadow:0 24px 60px rgba(15,23,42,.18)}
        .journey-appbar{height:42px;border-radius:12px 12px 0 0;background:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 14px;border-bottom:1px solid #E5EDF4}.journey-brand{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:850;color:#0F172A}.journey-logo{width:24px;height:24px;border-radius:7px;background:linear-gradient(135deg,#0D9488,#14B8A6);display:grid;place-items:center;color:#fff;font-size:9px}.journey-avatar{width:24px;height:24px;border-radius:50%;background:#DBEAFE;color:#1D4ED8;display:grid;place-items:center;font-size:8px;font-weight:900}
        .journey-appbody{display:grid;grid-template-columns:145px 1fr;background:#fff;min-height:360px;border-radius:0 0 12px 12px;overflow:hidden}.journey-nav{background:#F8FAFC;border-right:1px solid #E5EDF4;padding:16px 10px}.journey-nav strong{display:block;font-size:9px;color:#94A3B8;letter-spacing:.1em;margin:0 7px 8px}.journey-nav span{display:block;font-size:9px;color:#475569;padding:7px 8px;border-radius:7px;margin-bottom:3px}.journey-nav span.active{background:#E6F7F5;color:#0F766E;font-weight:850}
        .journey-content{padding:17px}.journey-content h4{font-family:'Sora',sans-serif;font-size:15px;margin:0 0 4px;color:#0F172A}.journey-content>p{font-size:9px;color:#64748B;margin:0 0 14px}.journey-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}.journey-card{border:1px solid #E5EDF4;border-radius:9px;padding:9px;background:#fff}.journey-card small{display:block;color:#94A3B8;font-size:7px;font-weight:800;letter-spacing:.06em;margin-bottom:5px}.journey-card strong{font-size:16px;color:#0F172A}.journey-card span{font-size:7px;color:#64748B;margin-left:3px}
        .journey-flow{border:1px solid #E5EDF4;border-radius:11px;padding:10px;background:#FBFDFF}.journey-flow-title{font-size:8px;font-weight:900;color:#475569;letter-spacing:.08em;margin-bottom:9px}.journey-step-row{display:flex;align-items:center;gap:6px;overflow:hidden}.journey-step-dot{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#E6F7F5;color:#0F766E;font-size:7px;font-weight:900;flex:0 0 20px}.journey-step-line{height:1px;background:#CBD5E1;flex:1}.journey-step-labels{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:5px}.journey-step-labels span{font-size:6.5px;color:#64748B;text-align:center}
        .journey-list{margin-top:18px;display:grid;gap:8px}.journey-list-row{display:grid;grid-template-columns:38px 1fr;gap:11px;align-items:start}.journey-num{font-family:'Sora',sans-serif;font-size:10px;color:#0D9488;font-weight:900;padding-top:2px}.journey-list-row strong{display:block;font-size:12px;color:#1E293B;margin-bottom:2px}.journey-list-row span{font-size:10px;color:#64748B;line-height:1.45}
        @media(max-width:980px){.journey-inner{grid-template-columns:1fr}.journey-app{max-width:700px}.journey-list{grid-template-columns:1fr 1fr}}
        @media(max-width:640px){.journey-section{padding:58px 16px}.journey-list{grid-template-columns:1fr}.journey-appbody{grid-template-columns:92px 1fr}.journey-nav{padding:12px 6px}.journey-cards{grid-template-columns:1fr}.journey-app{padding:9px}.journey-content{padding:12px}.journey-step-labels{display:none}}
      `}</style>

      <div className="journey-inner">
        <div>
          <div className="journey-kicker">MY HEALTH · YOUR CONTINUOUS HEALTH JOURNEY</div>
          <h2 className="journey-title">Your health should not start over at every appointment.</h2>
          <p className="journey-copy">My Health is the patient side of HealthConnect: one place to organise the information that matters before, during and after a consultation. The goal is continuity — not another folder of disconnected records.</p>
          <div className="journey-quote">“I came to find a doctor” can become “my reports, medicines, appointments and follow-up are still connected when I come back.”</div>
          <button className="journey-cta" onClick={openMyHealth}>Open My Health →</button>
          <div className="journey-list">
            {STEPS.map(([n, title, copy]) => <div className="journey-list-row" key={n}><div className="journey-num">{n}</div><div><strong>{title}</strong><span>{copy}</span></div></div>)}
          </div>
        </div>

        <div className="journey-app" aria-label="Illustrative preview of the HealthConnect patient dashboard">
          <div className="journey-appbar"><div className="journey-brand"><div className="journey-logo">HC</div>HealthConnect · My Health</div><div className="journey-avatar">PS</div></div>
          <div className="journey-appbody">
            <div className="journey-nav"><strong>MY HEALTH</strong>{['Overview','Medical History','Vitals','Symptoms','Medications','Reports','Appointments'].map((item,i)=><span className={i===0?'active':''} key={item}>{item}</span>)}</div>
            <div className="journey-content">
              <h4>Good afternoon, Priya</h4><p>Your health information stays organised around you.</p>
              <div className="journey-cards"><div className="journey-card"><small>HEALTH SCORE</small><strong>67</strong><span>/100</span></div><div className="journey-card"><small>REPORTS</small><strong>8</strong><span>stored</span></div><div className="journey-card"><small>MEDICATIONS</small><strong>2</strong><span>active</span></div></div>
              <div className="journey-flow"><div className="journey-flow-title">CONNECTED CARE JOURNEY</div><div className="journey-step-row"><div className="journey-step-dot">1</div><div className="journey-step-line"/><div className="journey-step-dot">2</div><div className="journey-step-line"/><div className="journey-step-dot">3</div><div className="journey-step-line"/><div className="journey-step-dot">4</div></div><div className="journey-step-labels"><span>Find</span><span>Book</span><span>Visit</span><span>Follow-up</span></div></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
