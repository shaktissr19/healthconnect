'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const FEATURES = [
  ['Health Profile','Identity and core health context'],
  ['Medical History','Conditions and past care'],
  ['Vitals & Symptoms','Track changes over time'],
  ['Reports','Keep health documents organised'],
  ['Medications','Keep treatment context visible'],
  ['Appointments','Doctor and hospital visits in one journey'],
] as const;

export default function HealthJourney(){
  const router=useRouter();
  const {user,isAuthenticated}=useAuthStore();
  const {openAuthModal}=useUIStore();

  const openMyHealth=()=>{
    if(!isAuthenticated||!user){
      try{sessionStorage.setItem('hc_post_login_redirect','/dashboard');}catch{}
      openAuthModal('login');
      return;
    }
    const role=String(user.role??'').toUpperCase();
    router.push(role==='PATIENT'?'/dashboard':role==='DOCTOR'?'/doctor-dashboard':role==='HOSPITAL'?'/hospital-dashboard':'/admin-dashboard');
  };

  return <section className="journey-section">
    <style>{`
      .journey-section{background:#fff;padding:20px 28px 60px;font-family:'DM Sans',Arial,sans-serif}.journey-shell{max-width:1280px;margin:0 auto;background:radial-gradient(circle at 8% 12%,rgba(56,189,248,.13),transparent 28%),linear-gradient(135deg,#073543 0%,#0B5360 50%,#0F766E 100%);border-radius:22px;padding:38px 42px;display:grid;grid-template-columns:minmax(0,.9fr) minmax(490px,1.1fr);gap:40px;align-items:center;box-shadow:0 16px 42px rgba(15,118,110,.15);overflow:hidden;position:relative}.journey-kicker{font-size:10px;font-weight:900;letter-spacing:.18em;color:#99F6E4;margin-bottom:9px}.journey-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,3vw,3.35rem);line-height:1.06;letter-spacing:-.04em;color:#F8FFFE;margin:0 0 13px}.journey-copy{font-size:13px;line-height:1.68;color:#D1F0EC;margin:0 0 17px;max-width:560px}.journey-flow-copy{font-size:11px;line-height:1.55;color:#B8DED9;padding:11px 13px;border-left:2px solid #5EEAD4;background:rgba(255,255,255,.055);border-radius:0 9px 9px 0;margin-bottom:16px}.journey-cta{border:0;border-radius:9px;padding:10px 16px;background:#fff;color:#0F766E;font-size:11px;font-weight:900;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.12)}.journey-features{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:17px}.journey-feature{padding:8px 9px;border:1px solid rgba(153,246,228,.16);background:rgba(255,255,255,.045);border-radius:9px}.journey-feature b{display:block;color:#ECFEFF;font-size:9.5px;margin-bottom:2px}.journey-feature span{font-size:8px;line-height:1.3;color:#A8D6D2}
      .journey-app{background:#071426;border-radius:17px;padding:11px;border:1px solid rgba(255,255,255,.14);box-shadow:0 20px 50px rgba(0,0,0,.24)}.appbar{height:36px;background:#fff;border-radius:9px 9px 0 0;display:flex;justify-content:space-between;align-items:center;padding:0 11px;border-bottom:1px solid #E5EDF4}.brand{display:flex;align-items:center;gap:7px;font-size:9px;font-weight:900;color:#0F172A}.brand i{width:21px;height:21px;border-radius:6px;background:linear-gradient(135deg,#0D9488,#14B8A6);display:grid;place-items:center;color:#fff;font-size:7px;font-style:normal}.avatar{width:21px;height:21px;border-radius:50%;display:grid;place-items:center;background:#DBEAFE;color:#1D4ED8;font-size:7px;font-weight:900}.appbody{display:grid;grid-template-columns:120px 1fr;background:#fff;min-height:270px;border-radius:0 0 9px 9px;overflow:hidden}.appnav{padding:13px 8px;background:#F8FAFC;border-right:1px solid #E5EDF4}.appnav strong{display:block;font-size:7px;letter-spacing:.09em;color:#94A3B8;margin:0 6px 7px}.appnav span{display:block;font-size:7.5px;color:#475569;padding:5px 6px;border-radius:6px;margin-bottom:2px}.appnav span.active{background:#E6F7F5;color:#0F766E;font-weight:900}.appcontent{padding:14px}.appcontent h4{font-family:'Sora',sans-serif;font-size:13px;color:#0F172A;margin:0 0 3px}.appcontent>p{font-size:7.5px;color:#64748B;margin:0 0 10px}.appcards{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:9px}.appcard{padding:8px;border:1px solid #E5EDF4;border-radius:8px}.appcard small{display:block;font-size:6px;color:#94A3B8;font-weight:900;margin-bottom:4px}.appcard strong{font-size:13px;color:#0F172A}.appcard span{font-size:6px;color:#64748B;margin-left:2px}.care-flow{border:1px solid #E5EDF4;border-radius:9px;padding:9px;background:#FBFDFF}.care-flow>small{display:block;font-size:6.5px;font-weight:900;color:#475569;letter-spacing:.08em;margin-bottom:7px}.dots{display:flex;align-items:center}.dot{width:18px;height:18px;border-radius:50%;display:grid;place-items:center;background:#CCFBF1;color:#0F766E;font-size:6px;font-weight:900}.line{height:1px;background:#CBD5E1;flex:1}.labels{display:grid;grid-template-columns:repeat(4,1fr);margin-top:4px}.labels span{text-align:center;font-size:5.5px;color:#64748B}
      @media(max-width:960px){.journey-shell{grid-template-columns:1fr}.journey-app{max-width:700px}}
      @media(max-width:600px){.journey-section{padding:16px 12px 44px}.journey-shell{padding:28px 18px}.journey-features{grid-template-columns:1fr}.appbody{grid-template-columns:88px 1fr}.appcards{grid-template-columns:1fr}.labels{display:none}}
    `}</style>

    <div className="journey-shell">
      <div>
        <div className="journey-kicker">MY HEALTH · CONTINUITY BETWEEN VISITS</div>
        <h2 className="journey-title">Your health should not start over at every appointment.</h2>
        <p className="journey-copy">My Health keeps the patient side of HealthConnect together before, during and after care — so reports, medicines, symptoms and appointments are easier to find when you need them again.</p>
        <div className="journey-flow-copy">Find a doctor or hospital when you need care today. Sign in to My Health when you want your own health journey organised around you.</div>
        <button className="journey-cta" onClick={openMyHealth}>Open My Health →</button>
        <div className="journey-features">{FEATURES.map(([title,copy])=><div className="journey-feature" key={title}><b>{title}</b><span>{copy}</span></div>)}</div>
      </div>

      <div className="journey-app" aria-label="Illustrative preview of the HealthConnect patient dashboard">
        <div className="appbar"><div className="brand"><i>HC</i>HealthConnect · My Health</div><div className="avatar">PS</div></div>
        <div className="appbody">
          <div className="appnav"><strong>MY HEALTH</strong>{['Overview','Medical History','Vitals','Symptoms','Medications','Reports','Appointments'].map((item,i)=><span className={i===0?'active':''} key={item}>{item}</span>)}</div>
          <div className="appcontent"><h4>Good afternoon, Priya</h4><p>Your health information stays organised around you.</p><div className="appcards"><div className="appcard"><small>HEALTH SCORE</small><strong>67</strong><span>/100</span></div><div className="appcard"><small>REPORTS</small><strong>8</strong><span>stored</span></div><div className="appcard"><small>MEDICATIONS</small><strong>2</strong><span>active</span></div></div><div className="care-flow"><small>CONNECTED CARE JOURNEY</small><div className="dots"><div className="dot">1</div><div className="line"/><div className="dot">2</div><div className="line"/><div className="dot">3</div><div className="line"/><div className="dot">4</div></div><div className="labels"><span>Find</span><span>Book</span><span>Visit</span><span>Follow-up</span></div></div></div>
        </div>
      </div>
    </div>
  </section>;
}
