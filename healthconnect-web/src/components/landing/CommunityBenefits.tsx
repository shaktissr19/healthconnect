'use client';

import type { SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const DOCTOR_FEATURES=[
  {title:'My Patients',copy:'Patient context and returning-care history.',icon:'patients',wash:'#E8F2FF',accent:'#2563EB'},
  {title:'Schedule & Availability',copy:'Availability and bookings in one flow.',icon:'calendar',wash:'#E9F8F4',accent:'#0B8F7C'},
  {title:'Consultation Context',copy:'Patient-shared information before care.',icon:'context',wash:'#F2EAFE',accent:'#7C3AED'},
  {title:'Follow-up Continuity',copy:'Keep the next care step visible.',icon:'followup',wash:'#FFF1E8',accent:'#EA580C'},
  {title:'Professional Presence',copy:'Profile and practice information connected.',icon:'profile',wash:'#EAF4FF',accent:'#1D4ED8'},
  {title:'Better Patient Journey',copy:'Less disconnected context for patients.',icon:'heart',wash:'#EAF8EE',accent:'#15803D'},
] as const;

const DOCTOR_IMAGE='/images/doctor-platform-main.png?v=20260909-3';
const DOCTOR_IMAGE_FALLBACK='/images/doctors-intro.png?v=20260909-3';

function DoctorIcon({kind,size=20}:{kind:string;size?:number}){
  const common={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.9,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};
  if(kind==='patients') return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>;
  if(kind==='calendar') return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h3M13 14h3"/></svg>;
  if(kind==='context') return <svg {...common}><path d="M7 3h10a2 2 0 0 1 2 2v16H5V5a2 2 0 0 1 2-2Z"/><path d="M9 7h6M9 11h6M9 15h3"/></svg>;
  if(kind==='followup') return <svg {...common}><path d="M20 7v5h-5"/><path d="M18.5 15a7 7 0 1 1 .5-7.7L20 12"/></svg>;
  if(kind==='profile') return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/><path d="M18 4h3M19.5 2.5v3"/></svg>;
  if(kind==='heart') return <svg {...common}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/><path d="M7 12h2l1.3-3 2.2 6 1.4-3H17"/></svg>;
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
      .doctor-platform-section{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#F4F7FF;padding:28px 22px 32px;scroll-margin-top:72px}
      .doctor-platform-shell{width:min(100%,1380px);margin:0 auto}
      .doctor-platform-head{margin-bottom:12px;padding:0 4px}.doctor-platform-label{font-size:11.5px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#2563EB;margin-bottom:5px}.doctor-platform-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,2.55vw,2.75rem);line-height:1.02;letter-spacing:-.048em;color:#0B2B45;margin:0}.doctor-platform-head p{font-size:13.5px;line-height:1.42;color:#35566A;margin:6px 0 0;max-width:650px}

      .doctor-platform-canvas{position:relative;min-height:430px;border-radius:22px;border:1px solid #C9DDEC;overflow:hidden;background:linear-gradient(110deg,#EEF6FF 0%,#F8FBFF 50%,#DDEAF4 100%);box-shadow:0 14px 34px rgba(31,75,112,.07)}
      .doctor-platform-photo{position:absolute;z-index:0;right:0;top:0;width:60%;height:100%;object-fit:cover;object-position:center 42%;display:block}
      .doctor-platform-canvas:after{content:'';position:absolute;z-index:1;inset:0;background:linear-gradient(90deg,#F0F6FF 0%,#F0F6FF 45%,rgba(240,246,255,.96) 50%,rgba(240,246,255,.72) 57%,rgba(240,246,255,.18) 68%,transparent 78%),linear-gradient(180deg,transparent 58%,rgba(18,48,78,.08) 100%);pointer-events:none}
      .doctor-platform-copy{position:relative;z-index:2;width:57%;padding:26px 24px 24px 32px;box-sizing:border-box}.doctor-platform-eyebrow{font-size:11px;font-weight:900;letter-spacing:.15em;text-transform:uppercase;color:#2563EB;margin-bottom:5px}.doctor-platform-copy h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.55rem,2vw,2.18rem);line-height:1.04;letter-spacing:-.042em;color:#0B2B45;margin:0;max-width:610px}.doctor-platform-intro{font-size:12.2px;line-height:1.4;color:#35566A;margin:7px 0 9px;max-width:610px}.doctor-platform-rule{width:38px;height:3px;border-radius:999px;background:#2563EB;margin-bottom:9px}

      .doctor-feature-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:1fr;gap:7px}.doctor-feature{min-width:0;min-height:78px;padding:8px;border-radius:12px;border:1px solid rgba(192,213,229,.86);box-shadow:0 4px 12px rgba(40,77,112,.04);transition:transform .18s ease,box-shadow .18s ease}.doctor-feature:hover{transform:translateY(-2px);box-shadow:0 8px 16px rgba(40,77,112,.07)}.doctor-feature-top{display:flex;align-items:center;gap:6px}.doctor-feature-icon{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;flex:0 0 auto}.doctor-feature b{font-family:'Sora','DM Sans',sans-serif;font-size:10.2px;line-height:1.18;color:#16354A}.doctor-feature p{font-size:8.8px;line-height:1.28;color:#526B7B;margin:5px 0 0}
      .doctor-value-row{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:7px}.doctor-value{border-radius:10px;padding:7px 9px;background:rgba(255,255,255,.82);border:1px solid #CDDEEA}.doctor-value strong{display:block;font-size:8.7px;letter-spacing:.05em;text-transform:uppercase;color:#2563EB;margin-bottom:1px}.doctor-value span{display:block;font-size:8.8px;line-height:1.28;color:#486275}.doctor-platform-cta{margin-top:8px;border:0;border-radius:8px;background:#2563EB;color:#fff;padding:8px 12px;font:900 10.8px 'DM Sans',Arial,sans-serif;cursor:pointer;box-shadow:0 6px 14px rgba(37,99,235,.15)}.doctor-platform-cta:hover{background:#1D4ED8;transform:translateY(-1px)}.doctor-platform-cta:focus-visible{outline:3px solid rgba(37,99,235,.25);outline-offset:3px}

      .doctor-flow-card{position:absolute;z-index:3;left:61%;right:18px;bottom:18px;border-radius:13px;padding:9px 10px;background:rgba(255,255,255,.93);border:1px solid rgba(205,222,234,.94);box-shadow:0 9px 22px rgba(25,61,80,.1);backdrop-filter:blur(8px)}.doctor-flow-card>strong{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:10px;color:#15364D;margin-bottom:5px}.doctor-flow{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;align-items:start;gap:5px}.doctor-flow-step{min-width:0}.doctor-flow-step b{display:block;font-size:8.6px;color:#2563EB}.doctor-flow-step span{display:block;margin-top:1px;font-size:7.5px;line-height:1.25;color:#5A7180}.doctor-flow-arrow{align-self:center;color:#7A9AB0;font-weight:900;font-size:12px}

      @media(max-height:820px) and (min-width:1101px){.doctor-platform-section{padding-top:24px;padding-bottom:28px}.doctor-platform-canvas{min-height:408px}.doctor-platform-copy{padding-top:22px;padding-bottom:21px}.doctor-platform-head h2{font-size:clamp(1.9rem,2.4vw,2.55rem)}}
      @media(max-width:1100px){.doctor-platform-head p{max-width:760px}.doctor-platform-canvas{min-height:0}.doctor-platform-photo{position:relative;width:100%;height:430px}.doctor-platform-canvas:after{background:linear-gradient(180deg,rgba(244,247,255,.08) 43%,#F4F7FF 100%)}.doctor-platform-copy{width:100%;padding:25px}.doctor-flow-card{left:18px;right:18px;bottom:18px}.doctor-feature-grid{grid-template-columns:repeat(3,1fr)}}
      @media(max-width:720px){.doctor-platform-section{padding:24px 12px 28px}.doctor-platform-head h2{font-size:2.05rem}.doctor-platform-head p{font-size:13px}.doctor-platform-copy{padding:22px 18px}.doctor-platform-copy h3{font-size:1.8rem}.doctor-feature-grid{grid-template-columns:1fr 1fr}.doctor-value-row{grid-template-columns:1fr}.doctor-platform-photo{height:370px}.doctor-flow{grid-template-columns:1fr}.doctor-flow-arrow{display:none}.doctor-flow-step+.doctor-flow-step{border-top:1px solid #E2EAF0;padding-top:4px;margin-top:3px}}
      @media(max-width:480px){.doctor-feature-grid{grid-template-columns:1fr}.doctor-platform-photo{height:340px}.doctor-flow-card{left:12px;right:12px;bottom:12px}}
    `}</style>

    <div className="doctor-platform-shell">
      <div className="doctor-platform-head"><div className="doctor-platform-label">Doctor Platform</div><h2 id="doctor-platform-title">A clearer practice journey for doctors.</h2><p>Patients, schedule, consultation context and follow-up—kept in one connected workspace.</p></div>

      <div className="doctor-platform-canvas">
        <img className="doctor-platform-photo" src={DOCTOR_IMAGE} alt="Indian doctor in a modern clinic with patient care in progress" loading="lazy" decoding="async" onError={useFallback}/>
        <div className="doctor-platform-copy">
          <div className="doctor-platform-eyebrow">Practice & Patients</div>
          <h3>One workspace from appointment to follow-up.</h3>
          <p className="doctor-platform-intro">Keep the information and actions around each consultation together, so doctors spend less time moving between screens.</p>
          <div className="doctor-platform-rule"/>
          <div className="doctor-feature-grid">{DOCTOR_FEATURES.map(feature=><article className="doctor-feature" key={feature.title} style={{background:feature.wash}}><div className="doctor-feature-top"><span className="doctor-feature-icon" style={{background:'#fff',color:feature.accent}}><DoctorIcon kind={feature.icon}/></span><b>{feature.title}</b></div><p>{feature.copy}</p></article>)}</div>
          <div className="doctor-value-row"><div className="doctor-value"><strong>For doctors</strong><span>Less fragmentation across daily practice.</span></div><div className="doctor-value"><strong>For patients</strong><span>A clearer journey into the next care step.</span></div></div>
          <button type="button" className="doctor-platform-cta" onClick={openDoctor}>Explore Doctor Platform →</button>
        </div>

        <aside className="doctor-flow-card" aria-label="Doctor Platform care flow"><strong>Built around the real care flow</strong><div className="doctor-flow"><div className="doctor-flow-step"><b>Before</b><span>Schedule and context.</span></div><span className="doctor-flow-arrow">→</span><div className="doctor-flow-step"><b>During</b><span>Focused consultation.</span></div><span className="doctor-flow-arrow">→</span><div className="doctor-flow-step"><b>After</b><span>Follow-up stays visible.</span></div></div></aside>
      </div>
    </div>
  </section>;
}
