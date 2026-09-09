'use client';

import type { SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const PRIMARY_FEATURES=[
  {title:'My Patients',copy:'Keep patient context and returning-care history close to the consultation.',icon:'patients',wash:'#D7E5F6',accent:'#2459C4'},
  {title:'Schedule & Availability',copy:'Manage availability and bookings through one connected flow.',icon:'calendar',wash:'#D4EAE4',accent:'#087D72'},
  {title:'Consultation Context',copy:'See patient-shared information before care begins.',icon:'context',wash:'#E6DDF3',accent:'#6D45C6'},
] as const;
const SECONDARY_FEATURES=[
  {title:'Follow-up Continuity',icon:'followup',wash:'#F1DED2',accent:'#C4531A'},
  {title:'Professional Presence',icon:'profile',wash:'#DCE7F4',accent:'#2459C4'},
  {title:'Better Patient Journey',icon:'heart',wash:'#D8EADB',accent:'#167044'},
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
      .doctor-platform-section{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#DDE8F5;padding:30px 22px 34px;scroll-margin-top:76px}.doctor-platform-shell{width:min(100%,1380px);margin:0 auto}.doctor-platform-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(330px,.55fr);gap:38px;align-items:end;margin-bottom:16px;padding:0 6px}.doctor-platform-label{font-size:12.5px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#2459C4;margin-bottom:7px}.doctor-platform-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.15rem,2.7vw,2.95rem);line-height:1.02;letter-spacing:-.05em;color:#0B2B45;margin:0}.doctor-platform-head p{font-size:16px;line-height:1.5;color:#35566A;margin:0 0 4px;max-width:500px}

      .doctor-platform-canvas{position:relative;min-height:455px;border-radius:24px;border:1px solid #B4CAE2;overflow:hidden;background:linear-gradient(108deg,#F2F6FB 0%,#EDF3FA 50%,#D4E0ED 100%);box-shadow:0 16px 34px rgba(31,75,112,.08)}.doctor-platform-photo{position:absolute;z-index:0;right:0;top:0;width:61%;height:100%;object-fit:cover;object-position:center 42%;display:block}.doctor-platform-canvas:after{content:'';position:absolute;z-index:1;inset:0;background:linear-gradient(90deg,#F2F6FB 0%,#F2F6FB 43%,rgba(242,246,251,.96) 49%,rgba(242,246,251,.74) 57%,rgba(242,246,251,.18) 68%,transparent 78%),linear-gradient(180deg,transparent 62%,rgba(18,48,78,.08) 100%);pointer-events:none}
      .doctor-platform-copy{position:relative;z-index:2;width:57%;padding:31px 27px 28px 34px;box-sizing:border-box}.doctor-platform-eyebrow{font-size:12px;font-weight:900;letter-spacing:.15em;text-transform:uppercase;color:#2459C4;margin-bottom:6px}.doctor-platform-copy h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.75rem,2.15vw,2.4rem);line-height:1.04;letter-spacing:-.045em;color:#0B2B45;margin:0;max-width:610px}.doctor-platform-intro{font-size:14.5px;line-height:1.48;color:#35566A;margin:9px 0 13px;max-width:610px}.doctor-platform-rule{width:42px;height:3px;border-radius:999px;background:#2459C4;margin-bottom:13px}
      .doctor-primary-list{display:grid;gap:7px}.doctor-primary{display:grid;grid-template-columns:41px 1fr;gap:11px;align-items:center;padding:11px 13px;border-radius:14px;border:1px solid rgba(104,137,176,.22)}.doctor-primary-icon{width:39px;height:39px;border-radius:12px;display:grid;place-items:center;background:rgba(255,255,255,.55)}.doctor-primary b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:13.8px;line-height:1.2;color:#16354A}.doctor-primary p{font-size:12.4px;line-height:1.37;color:#526B7B;margin:3px 0 0}
      .doctor-secondary{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.doctor-secondary-item{display:inline-flex;align-items:center;gap:7px;padding:8px 10px;border-radius:999px;color:#244556;font-size:11.7px;font-weight:850;border:1px solid rgba(105,137,169,.2)}.doctor-secondary-icon{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.55)}
      .doctor-outcomes{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:12px;padding:10px 12px;border-radius:12px;background:#183E6E;color:#fff}.doctor-outcome{display:flex;align-items:center;gap:7px;font-size:11.5px;line-height:1.3}.doctor-outcome strong{color:#BFD6FF}.doctor-outcome+ .doctor-outcome{padding-left:14px;border-left:1px solid rgba(255,255,255,.2)}.doctor-platform-cta{margin-top:11px;border:0;border-radius:9px;background:#2459C4;color:#fff;padding:10px 14px;font:900 12.5px 'DM Sans',Arial,sans-serif;cursor:pointer;box-shadow:0 7px 16px rgba(37,89,196,.16)}.doctor-platform-cta:hover{background:#1E4FAF;transform:translateY(-1px)}.doctor-platform-cta:focus-visible{outline:3px solid rgba(37,99,235,.25);outline-offset:3px}

      .doctor-flow-card{position:absolute;z-index:3;left:61%;right:20px;bottom:20px;border-radius:15px;padding:11px 13px;background:rgba(238,244,250,.95);border:1px solid #C4D5E6;box-shadow:0 10px 24px rgba(25,61,80,.11);backdrop-filter:blur(8px)}.doctor-flow-card>strong{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:12px;color:#15364D;margin-bottom:7px}.doctor-flow{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;align-items:start;gap:7px}.doctor-flow-step{min-width:0}.doctor-flow-step b{display:block;font-size:10.8px;color:#2459C4}.doctor-flow-step span{display:block;margin-top:2px;font-size:9.8px;line-height:1.28;color:#5A7180}.doctor-flow-arrow{align-self:center;color:#7A9AB0;font-weight:900;font-size:13px}

      @media(max-width:1100px){.doctor-platform-head{grid-template-columns:1fr;gap:9px}.doctor-platform-head p{max-width:760px}.doctor-platform-canvas{min-height:0;display:flex;flex-direction:column}.doctor-platform-photo{position:relative;order:1;width:100%;height:440px}.doctor-platform-canvas:after{background:linear-gradient(180deg,rgba(242,246,251,.06) 44%,#F2F6FB 100%)}.doctor-platform-copy{order:2;width:100%;padding:27px}.doctor-flow-card{left:20px;right:20px;bottom:auto;top:350px}}
      @media(max-width:720px){.doctor-platform-section{padding:24px 12px 28px}.doctor-platform-head h2{font-size:2.05rem}.doctor-platform-head p{font-size:15px}.doctor-platform-copy{padding:22px 18px}.doctor-platform-copy h3{font-size:1.85rem}.doctor-secondary{display:grid;grid-template-columns:1fr 1fr}.doctor-secondary-item{border-radius:12px}.doctor-platform-photo{height:370px}.doctor-flow-card{top:286px}.doctor-flow{grid-template-columns:1fr}.doctor-flow-arrow{display:none}.doctor-flow-step+.doctor-flow-step{border-top:1px solid #D7E2EC;padding-top:5px;margin-top:4px}.doctor-outcomes{align-items:flex-start;flex-direction:column;gap:7px}.doctor-outcome+.doctor-outcome{padding-left:0;border-left:0;border-top:1px solid rgba(255,255,255,.18);padding-top:7px;width:100%}}
      @media(max-width:480px){.doctor-secondary{grid-template-columns:1fr}.doctor-platform-photo{height:340px}.doctor-flow-card{position:relative;left:auto;right:auto;top:auto;bottom:auto;order:3;margin:0 12px 12px}}
    `}</style>

    <div className="doctor-platform-shell">
      <div className="doctor-platform-head"><div><div className="doctor-platform-label">Doctor Platform</div><h2 id="doctor-platform-title">A clearer practice journey for doctors.</h2></div><p>Patients, schedule, consultation context and follow-up — kept in one connected workspace from the first booking to the next care step.</p></div>

      <div className="doctor-platform-canvas">
        <img className="doctor-platform-photo" src={DOCTOR_IMAGE} alt="Indian doctor in a modern clinic with patient care in progress" loading="lazy" decoding="async" onError={useFallback}/>
        <div className="doctor-platform-copy">
          <div className="doctor-platform-eyebrow">Practice & Patients</div>
          <h3>One workspace from appointment to follow-up.</h3>
          <p className="doctor-platform-intro">Keep the information and actions around each consultation together so the next care step stays visible.</p>
          <div className="doctor-platform-rule"/>
          <div className="doctor-primary-list">{PRIMARY_FEATURES.map(feature=><article className="doctor-primary" key={feature.title} style={{background:feature.wash}}><span className="doctor-primary-icon" style={{color:feature.accent}}><DoctorIcon kind={feature.icon}/></span><div><b>{feature.title}</b><p>{feature.copy}</p></div></article>)}</div>
          <div className="doctor-secondary">{SECONDARY_FEATURES.map(feature=><div className="doctor-secondary-item" key={feature.title} style={{background:feature.wash}}><span className="doctor-secondary-icon" style={{color:feature.accent}}><DoctorIcon kind={feature.icon} size={15}/></span>{feature.title}</div>)}</div>
          <div className="doctor-outcomes"><div className="doctor-outcome"><strong>For doctors</strong><span>Less fragmentation across daily practice.</span></div><div className="doctor-outcome"><strong>For patients</strong><span>A clearer journey into the next care step.</span></div></div>
          <button type="button" className="doctor-platform-cta" onClick={openDoctor}>Explore Doctor Platform →</button>
        </div>

        <aside className="doctor-flow-card" aria-label="Doctor Platform care flow"><strong>Built around the real care flow</strong><div className="doctor-flow"><div className="doctor-flow-step"><b>Before</b><span>Schedule and context.</span></div><span className="doctor-flow-arrow">→</span><div className="doctor-flow-step"><b>During</b><span>Focused consultation.</span></div><span className="doctor-flow-arrow">→</span><div className="doctor-flow-step"><b>After</b><span>Follow-up stays visible.</span></div></div></aside>
      </div>
    </div>
  </section>;
}
