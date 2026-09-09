'use client';

import type { SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const FEATURES=[
  {title:'My Patients',copy:'Patient context and returning-care history stay close to the consultation.',icon:'patients',accent:'#2459C4'},
  {title:'Schedule & Availability',copy:'Availability and bookings stay in one practical workflow.',icon:'calendar',accent:'#087D72'},
  {title:'Consultation Context',copy:'Patient-shared information is visible before care begins.',icon:'context',accent:'#6D45C6'},
] as const;

const DOCTOR_IMAGE='/images/doctor-platform-main.png?v=20260909-3';
const DOCTOR_IMAGE_FALLBACK='/images/doctors-intro.png?v=20260909-3';

function DoctorIcon({kind,size=20}:{kind:string;size?:number}){
  const common={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.9,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};
  if(kind==='patients') return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>;
  if(kind==='calendar') return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h3M13 14h3"/></svg>;
  if(kind==='context') return <svg {...common}><path d="M7 3h10a2 2 0 0 1 2 2v16H5V5a2 2 0 0 1 2-2Z"/><path d="M9 7h6M9 11h6M9 15h3"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
}

export default function CommunityBenefits(){
  const router=useRouter();
  const {isAuthenticated,user}=useAuthStore();
  const {openAuthModal}=useUIStore();

  const openDoctor=()=>{
    if(isAuthenticated&&user){
      const role=String(user.role||'').toUpperCase();
      router.push(role==='DOCTOR'?'/doctor-dashboard':role==='PATIENT'?'/dashboard':role==='HOSPITAL'?'/hospital-dashboard':'/admin-dashboard');
      return;
    }
    try{sessionStorage.setItem('hc_signup_role','DOCTOR')}catch{}
    openAuthModal('register');
  };

  const useFallback=(event:SyntheticEvent<HTMLImageElement>)=>{
    const image=event.currentTarget;if(image.dataset.fallback==='1')return;image.dataset.fallback='1';image.src=DOCTOR_IMAGE_FALLBACK;
  };

  return <section className="doctor-platform-section" id="doctor-platform-story" aria-labelledby="doctor-platform-title">
    <style>{`
      .doctor-platform-section{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#EEF2F6;padding:28px 22px 32px;scroll-margin-top:76px}.doctor-platform-shell{width:min(100%,1380px);margin:0 auto}.doctor-platform-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,.52fr);gap:34px;align-items:end;margin-bottom:13px;padding:0 6px}.doctor-platform-label{font-size:12px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#2459C4;margin-bottom:6px}.doctor-platform-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,2.5vw,2.7rem);line-height:1.03;letter-spacing:-.05em;color:#0B2B45;margin:0}.doctor-platform-head p{font-size:14.5px;line-height:1.48;color:#435F71;margin:0 0 3px;max-width:500px}
      .doctor-platform-canvas{display:grid;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);min-height:385px;border-radius:23px;border:1px solid #CED8E4;overflow:hidden;background:#fff;box-shadow:0 14px 32px rgba(31,75,112,.07)}.doctor-platform-copy{padding:28px 28px 24px 32px;box-sizing:border-box;background:linear-gradient(135deg,#FFFFFF 0%,#F7F9FC 100%)}.doctor-platform-copy h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.7rem,2vw,2.2rem);line-height:1.04;letter-spacing:-.045em;color:#0B2B45;margin:0;max-width:610px}.doctor-platform-intro{font-size:13.8px;line-height:1.46;color:#496477;margin:8px 0 13px;max-width:600px}.doctor-platform-rule{width:40px;height:3px;border-radius:999px;background:#2459C4;margin-bottom:13px}
      .doctor-feature-list{display:grid;gap:7px}.doctor-feature{display:grid;grid-template-columns:38px 1fr;gap:10px;align-items:center;padding:9px 10px;border-radius:12px;border:1px solid #D9E1EA;background:#fff}.doctor-feature-icon{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:#F0F4F8}.doctor-feature b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:13px;line-height:1.18;color:#17354A}.doctor-feature p{font-size:11.7px;line-height:1.35;color:#5A7080;margin:2px 0 0}
      .doctor-care-flow{margin-top:11px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:7px;border-radius:11px;background:#EEF3F8;border:1px solid #DCE5ED}.doctor-care-step{min-width:0;padding:6px 8px}.doctor-care-step+.doctor-care-step{border-left:1px solid #D5DEE7}.doctor-care-step b{display:block;font-size:10.5px;color:#2459C4;text-transform:uppercase;letter-spacing:.06em}.doctor-care-step span{display:block;margin-top:2px;font-size:10.5px;line-height:1.28;color:#5B7080}.doctor-platform-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:12px}.doctor-platform-cta{border:0;border-radius:9px;background:#2459C4;color:#fff;padding:10px 14px;font:900 12.5px 'DM Sans',Arial,sans-serif;cursor:pointer;box-shadow:0 7px 16px rgba(37,89,196,.16)}.doctor-platform-cta:hover{background:#1E4FAF;transform:translateY(-1px)}.doctor-platform-cta:focus-visible{outline:3px solid rgba(37,99,235,.25);outline-offset:3px}.doctor-platform-note{font-size:11px;color:#607585;font-weight:800}
      .doctor-platform-photo-wrap{position:relative;min-height:385px;overflow:hidden;background:#E6EDF3}.doctor-platform-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 42%;display:block}.doctor-platform-photo-wrap:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,255,.12),transparent 18%),linear-gradient(180deg,transparent 78%,rgba(20,48,70,.10));pointer-events:none}
      @media(max-width:1050px){.doctor-platform-head{grid-template-columns:1fr;gap:8px}.doctor-platform-head p{max-width:760px}.doctor-platform-canvas{grid-template-columns:1fr}.doctor-platform-photo-wrap{min-height:420px;order:1}.doctor-platform-copy{order:2;padding:26px}}
      @media(max-width:720px){.doctor-platform-section{padding:24px 12px 28px}.doctor-platform-head h2{font-size:2.05rem}.doctor-platform-head p{font-size:14px}.doctor-platform-copy{padding:22px 18px}.doctor-platform-copy h3{font-size:1.8rem}.doctor-platform-photo-wrap{min-height:350px}.doctor-care-flow{grid-template-columns:1fr}.doctor-care-step+.doctor-care-step{border-left:0;border-top:1px solid #D5DEE7}}
      @media(max-width:480px){.doctor-platform-photo-wrap{min-height:315px}.doctor-platform-actions{display:grid;grid-template-columns:1fr}.doctor-platform-cta{width:100%}}
    `}</style>

    <div className="doctor-platform-shell">
      <div className="doctor-platform-head"><div><div className="doctor-platform-label">Doctor Platform</div><h2 id="doctor-platform-title">A clearer practice journey for doctors.</h2></div><p>Patients, schedule and consultation context stay connected without turning the page into a second dashboard.</p></div>

      <div className="doctor-platform-canvas">
        <div className="doctor-platform-copy">
          <h3>One workspace from appointment to follow-up.</h3>
          <p className="doctor-platform-intro">The essentials stay visible around each consultation, while the full working detail remains inside the doctor dashboard.</p>
          <div className="doctor-platform-rule"/>
          <div className="doctor-feature-list">{FEATURES.map(feature=><article className="doctor-feature" key={feature.title}><span className="doctor-feature-icon" style={{color:feature.accent}}><DoctorIcon kind={feature.icon}/></span><div><b>{feature.title}</b><p>{feature.copy}</p></div></article>)}</div>
          <div className="doctor-care-flow" aria-label="Doctor Platform care flow"><div className="doctor-care-step"><b>Before</b><span>Availability and patient context.</span></div><div className="doctor-care-step"><b>During</b><span>A focused consultation workspace.</span></div><div className="doctor-care-step"><b>After</b><span>Follow-up stays visible.</span></div></div>
          <div className="doctor-platform-actions"><button type="button" className="doctor-platform-cta" onClick={openDoctor}>Explore Doctor Platform →</button><span className="doctor-platform-note">Professional presence · continuity · patient journey</span></div>
        </div>
        <div className="doctor-platform-photo-wrap"><img className="doctor-platform-photo" src={DOCTOR_IMAGE} alt="Indian doctor in a modern clinic with patient care in progress" loading="lazy" decoding="async" onError={useFallback}/></div>
      </div>
    </div>
  </section>;
}
