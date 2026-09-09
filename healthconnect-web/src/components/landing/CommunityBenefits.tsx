'use client';

import type { SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const FEATURES=[
  {title:'My Patients',copy:'Keep patient context and returning-care history close to the consultation.',icon:'patients',accent:'#2459C4'},
  {title:'Schedule & Availability',copy:'Manage availability and booked appointments in one daily flow.',icon:'calendar',accent:'#087D72'},
  {title:'Consultation Context',copy:'Review supported patient-shared information before care begins.',icon:'context',accent:'#6D45C6'},
] as const;

const DOCTOR_IMAGE='/images/doctor-platform-main.png?v=20260909-4';
const DOCTOR_IMAGE_FALLBACK='/images/doctors-intro.png?v=20260909-4';

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
      .doctor-platform-section{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#EEF2F6;padding:40px 22px 44px;scroll-margin-top:76px;border-top:1px solid #DCE3E8}.doctor-platform-shell{width:min(100%,1380px);margin:0 auto}.doctor-platform-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.55fr);gap:42px;align-items:end;margin:0 6px 18px}.doctor-platform-label{font-size:12px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#2459C4;margin-bottom:6px}.doctor-platform-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,2.65vw,2.85rem);line-height:1.03;letter-spacing:-.05em;color:#0B2B45;margin:0}.doctor-platform-head p{font-size:15px;line-height:1.5;color:#4E6878;margin:0 0 3px;max-width:500px}
      .doctor-platform-main{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);border:1px solid #D2DCE6;border-radius:22px;overflow:hidden;background:#fff;box-shadow:0 12px 28px rgba(31,65,93,.06)}.doctor-platform-copy{padding:28px 30px 26px}.doctor-platform-copy h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.55rem,1.9vw,2rem);line-height:1.08;letter-spacing:-.04em;color:#17354A;margin:0}.doctor-platform-intro{font-size:13.5px;line-height:1.47;color:#536B7A;margin:8px 0 13px;max-width:610px}.doctor-platform-rule{width:40px;height:3px;border-radius:999px;background:#2459C4;margin-bottom:9px}
      .doctor-feature-list{display:grid}.doctor-feature{display:grid;grid-template-columns:38px 1fr;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid #E1E7EC}.doctor-feature:last-child{border-bottom:0}.doctor-feature-icon{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:#F0F4F8}.doctor-feature b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:13px;line-height:1.18;color:#17354A}.doctor-feature p{font-size:11.7px;line-height:1.35;color:#607584;margin:2px 0 0}.doctor-platform-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:14px}.doctor-platform-cta{border:0;border-radius:9px;background:#2459C4;color:#fff;padding:10px 14px;font:900 12px 'DM Sans',Arial,sans-serif;cursor:pointer;box-shadow:0 7px 16px rgba(37,89,196,.14)}.doctor-platform-cta:hover{background:#1E4FAF;transform:translateY(-1px)}.doctor-platform-note{font-size:10.8px;color:#667B8B;font-weight:800}.doctor-platform-flow{display:flex;gap:9px;align-items:center;margin-top:12px;padding-top:11px;border-top:1px solid #E1E7EC;color:#617686;font-size:10.8px;line-height:1.35}.doctor-platform-flow b{color:#17354A}.doctor-platform-flow span{color:#9AA8B2}
      .doctor-platform-photo-wrap{position:relative;min-height:392px;overflow:hidden;background:#E6EDF3}.doctor-platform-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 42%;display:block}.doctor-platform-photo-wrap:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 82%,rgba(20,48,70,.08));pointer-events:none}
      @media(max-width:1050px){.doctor-platform-head{grid-template-columns:1fr;gap:8px}.doctor-platform-main{grid-template-columns:1fr}.doctor-platform-photo-wrap{min-height:410px;order:1}.doctor-platform-copy{order:2;padding:26px}}
      @media(max-width:650px){.doctor-platform-section{padding:34px 12px 38px}.doctor-platform-head h2{font-size:2.05rem}.doctor-platform-head p{font-size:14px}.doctor-platform-copy{padding:22px 18px}.doctor-platform-copy h3{font-size:1.8rem}.doctor-platform-photo-wrap{min-height:330px}.doctor-platform-flow{align-items:flex-start;flex-direction:column;gap:3px}.doctor-platform-flow span{display:none}}
      @media(max-width:480px){.doctor-platform-photo-wrap{min-height:300px}.doctor-platform-actions{display:grid;grid-template-columns:1fr}.doctor-platform-cta{width:100%}}
    `}</style>

    <div className="doctor-platform-shell">
      <div className="doctor-platform-head"><div><div className="doctor-platform-label">Doctor Platform</div><h2 id="doctor-platform-title">A clearer practice journey for doctors.</h2></div><p>Keep patients, scheduling and consultation context connected without turning the landing page into another dashboard.</p></div>

      <div className="doctor-platform-main">
        <div className="doctor-platform-copy"><h3>One workspace from appointment to follow-up.</h3><p className="doctor-platform-intro">Show only the essentials here; the detailed working tools stay inside the doctor dashboard.</p><div className="doctor-platform-rule"/>
          <div className="doctor-feature-list">{FEATURES.map(feature=><article className="doctor-feature" key={feature.title}><span className="doctor-feature-icon" style={{color:feature.accent}}><DoctorIcon kind={feature.icon}/></span><div><b>{feature.title}</b><p>{feature.copy}</p></div></article>)}</div>
          <div className="doctor-platform-flow"><b>Before</b> Schedule & context <span>→</span><b>During</b> Focused consultation <span>→</span><b>After</b> Follow-up stays visible</div>
          <div className="doctor-platform-actions"><button type="button" className="doctor-platform-cta" onClick={openDoctor}>Explore Doctor Platform →</button><span className="doctor-platform-note">Professional presence · continuity · patient journey</span></div>
        </div>
        <div className="doctor-platform-photo-wrap"><img className="doctor-platform-photo" src={DOCTOR_IMAGE} alt="Indian doctor in a modern clinic with patient care in progress" loading="lazy" decoding="async" onError={useFallback}/></div>
      </div>
    </div>
  </section>;
}
