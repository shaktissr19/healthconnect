'use client';

import { useEffect, useState, type SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const STORIES=[
  {label:'My Patients',title:'Start each visit with the right patient context.',copy:'Keep returning-care history and supported patient-shared information close to the consultation.',icon:'patients',accent:'#2459C4'},
  {label:'Schedule',title:'Keep availability and bookings in one working rhythm.',copy:'Manage availability and booked appointments without jumping between disconnected tools.',icon:'calendar',accent:'#0F766E'},
  {label:'Consultation',title:'Bring useful context into the consultation itself.',copy:'Review supported information before care begins, then keep follow-up visible after the visit.',icon:'context',accent:'#6D45C6'},
] as const;

const DOCTOR_IMAGE='/images/doctor-platform-main.png?v=20260909-5';
const DOCTOR_IMAGE_FALLBACK='/images/doctors-intro.png?v=20260909-5';

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
  const [activeStory,setActiveStory]=useState(0);

  useEffect(()=>{
    if(typeof window==='undefined'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const timer=window.setInterval(()=>setActiveStory(current=>(current+1)%STORIES.length),4800);
    return()=>window.clearInterval(timer);
  },[]);

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

  const story=STORIES[activeStory];

  return <section className="doctor-platform-section" id="doctor-platform-story" aria-labelledby="doctor-platform-title">
    <style>{`
      .doctor-platform-section{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#E9EEF3;padding:42px 22px 46px;scroll-margin-top:76px;border-top:1px solid #D8E1E8}.doctor-platform-shell{width:min(100%,1380px);margin:0 auto}.doctor-platform-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.55fr);gap:42px;align-items:end;margin:0 6px 18px}.doctor-platform-label{font-size:12px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#2459C4;margin-bottom:6px}.doctor-platform-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,2.65vw,2.85rem);line-height:1.03;letter-spacing:-.05em;color:#0B2B45;margin:0}.doctor-platform-head p{font-size:15px;line-height:1.5;color:#4E6878;margin:0 0 3px;max-width:510px}
      .doctor-platform-stage{position:relative;min-height:392px;border:1px solid #CFDAE4;border-radius:23px;overflow:hidden;background:#E4EAF0;box-shadow:0 12px 28px rgba(31,65,93,.06)}.doctor-platform-photo{position:absolute;z-index:0;right:12px;top:12px;width:64%;height:calc(100% - 24px);object-fit:cover;object-position:center 42%;display:block;border-radius:18px;background:#E6EDF3}.doctor-platform-stage:after{content:'';position:absolute;z-index:1;inset:0;background:linear-gradient(90deg,#F8FAFC 0%,#F8FAFC 39%,rgba(248,250,252,.97) 47%,rgba(248,250,252,.80) 56%,rgba(248,250,252,.28) 69%,transparent 79%);pointer-events:none}.doctor-platform-copy{position:relative;z-index:2;width:54%;padding:30px 30px 26px 34px;box-sizing:border-box}.doctor-platform-copy>h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.55rem,1.95vw,2.05rem);line-height:1.08;letter-spacing:-.04em;color:#17354A;margin:0 0 7px}.doctor-platform-intro{font-size:13.5px;line-height:1.47;color:#536B7A;margin:0 0 13px;max-width:525px}.doctor-platform-rule{width:40px;height:3px;border-radius:999px;background:#2459C4;margin-bottom:14px}
      .doctor-story{min-height:124px;animation:doctorStoryIn .35s ease both}@keyframes doctorStoryIn{from{opacity:.2;transform:translateY(5px)}to{opacity:1;transform:none}}.doctor-story-label{display:flex;align-items:center;gap:8px;font-size:10.5px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;color:var(--story-accent);margin-bottom:6px}.doctor-story-icon{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:#EEF2F6}.doctor-story h4{font-family:'Sora','DM Sans',sans-serif;font-size:20px;line-height:1.22;letter-spacing:-.03em;color:#122F45;margin:0 0 7px;max-width:500px}.doctor-story p{font-size:12.4px;line-height:1.45;color:#5B7181;margin:0;max-width:490px}.doctor-story-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:13px}.doctor-story-tab{border:1px solid #CFD9E2;background:#EDF2F6;border-radius:9px;padding:8px 8px;color:#536A7A;font:850 10.5px 'DM Sans',Arial,sans-serif;cursor:pointer;transition:background .16s,color .16s,border-color .16s}.doctor-story-tab.active{background:#17384A;border-color:#17384A;color:#fff}.doctor-story-tab:focus-visible{outline:3px solid rgba(37,89,196,.20);outline-offset:2px}.doctor-platform-flow{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin-top:13px;padding-top:11px;border-top:1px solid #DDE4E9}.doctor-flow-step{padding:0 9px;color:#667B8B;font-size:10.2px;line-height:1.35}.doctor-flow-step:first-child{padding-left:0}.doctor-flow-step+.doctor-flow-step{border-left:1px solid #DDE4E9}.doctor-flow-step b{display:block;color:#17354A;font-size:10.5px;margin-bottom:2px}.doctor-platform-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:14px}.doctor-platform-cta{border:0;border-radius:9px;background:#2459C4;color:#fff;padding:10px 14px;font:900 12px 'DM Sans',Arial,sans-serif;cursor:pointer;box-shadow:0 7px 16px rgba(37,89,196,.14)}.doctor-platform-cta:hover{background:#1E4FAF;transform:translateY(-1px)}.doctor-platform-note{font-size:10.5px;color:#667B8B;font-weight:800}
      @media(max-width:1050px){.doctor-platform-head{grid-template-columns:1fr;gap:8px}.doctor-platform-stage{min-height:0;padding-top:405px}.doctor-platform-photo{top:12px;left:12px;right:12px;width:calc(100% - 24px);height:375px;object-position:center 42%}.doctor-platform-stage:after{background:linear-gradient(180deg,transparent 0%,rgba(248,250,252,.16) 40%,#F8FAFC 57%,#F8FAFC 100%)}.doctor-platform-copy{width:100%;padding:26px;max-width:780px}}
      @media(max-width:650px){.doctor-platform-section{padding:34px 12px 38px}.doctor-platform-head h2{font-size:2.05rem}.doctor-platform-head p{font-size:14px}.doctor-platform-stage{padding-top:335px}.doctor-platform-photo{height:305px}.doctor-platform-copy{padding:22px 18px}.doctor-platform-copy>h3{font-size:1.8rem}.doctor-story-tabs{grid-template-columns:1fr}.doctor-platform-flow{grid-template-columns:1fr}.doctor-flow-step{padding:6px 0}.doctor-flow-step+.doctor-flow-step{border-left:0;border-top:1px solid #DDE4E9}.doctor-platform-actions{display:grid;grid-template-columns:1fr}.doctor-platform-cta{width:100%}}
    `}</style>

    <div className="doctor-platform-shell">
      <div className="doctor-platform-head"><div><div className="doctor-platform-label">Doctor Platform</div><h2 id="doctor-platform-title">A clearer practice journey for doctors.</h2></div><p>Keep patient context, scheduling and follow-up connected while the detailed working tools stay inside the doctor workspace.</p></div>

      <div className="doctor-platform-stage">
        <img className="doctor-platform-photo" src={DOCTOR_IMAGE} alt="Indian doctor in a modern clinic with patient care in progress" loading="lazy" decoding="async" onError={useFallback}/>
        <div className="doctor-platform-copy">
          <h3>One workspace from appointment to follow-up.</h3>
          <p className="doctor-platform-intro">A focused preview of the doctor journey, with the fuller operational detail inside the dashboard.</p>
          <div className="doctor-platform-rule"/>
          <div className="doctor-story" key={activeStory} style={{'--story-accent':story.accent} as React.CSSProperties}><div className="doctor-story-label"><span className="doctor-story-icon"><DoctorIcon kind={story.icon} size={16}/></span>{story.label}</div><h4>{story.title}</h4><p>{story.copy}</p></div>
          <div className="doctor-story-tabs" aria-label="Doctor Platform capabilities">{STORIES.map((item,index)=><button key={item.label} type="button" className={`doctor-story-tab ${index===activeStory?'active':''}`} onClick={()=>setActiveStory(index)}>{item.label}</button>)}</div>
          <div className="doctor-platform-flow" aria-label="Doctor care flow"><div className="doctor-flow-step"><b>Before</b>Availability and patient context</div><div className="doctor-flow-step"><b>During</b>Focused consultation workflow</div><div className="doctor-flow-step"><b>After</b>Follow-up remains visible</div></div>
          <div className="doctor-platform-actions"><button type="button" className="doctor-platform-cta" onClick={openDoctor}>Explore Doctor Platform</button><span className="doctor-platform-note">Patients · practice · continuity</span></div>
        </div>
      </div>
    </div>
  </section>;
}
