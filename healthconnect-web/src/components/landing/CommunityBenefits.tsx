'use client';

import { useEffect, useState, type CSSProperties, type SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const STORIES=[
  {label:'My Patients',title:'Start each visit with the right patient context.',copy:'Keep returning-care history and supported patient-shared information close to the consultation.',icon:'patients',accent:'#2F5BEA',wash:'#E4EBFF',facts:['Returning history','Shared context','Follow-up']},
  {label:'Schedule',title:'Keep availability and bookings in one working rhythm.',copy:'Manage availability and booked appointments without jumping between disconnected tools.',icon:'calendar',accent:'#0F766E',wash:'#DDF3EE',facts:['Availability','Bookings','Daily view']},
  {label:'Consultation',title:'Bring useful context into the consultation itself.',copy:'Review supported information before care begins, then keep the next care step visible after the visit.',icon:'context',accent:'#7357D8',wash:'#EDE7FA',facts:['Pre-visit context','Focused care','Next steps']},
] as const;

const DOCTOR_IMAGE='/images/doctor-platform-main.png?v=20260910-1';
const DOCTOR_IMAGE_FALLBACK='/images/doctors-intro.png?v=20260910-1';

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
      .doctor-platform-section{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#EAF0F7;padding:44px 22px 48px;scroll-margin-top:76px;border-top:1px solid #D3DFEA}.doctor-platform-shell{width:min(100%,1380px);margin:0 auto}.doctor-platform-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(330px,.55fr);gap:44px;align-items:end;margin:0 6px 20px}.doctor-platform-label{font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#2F5BEA;margin-bottom:7px}.doctor-platform-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.05rem,2.7vw,2.95rem);line-height:1.03;letter-spacing:-.05em;color:#102E45;margin:0}.doctor-platform-head p{font-size:15.5px;line-height:1.52;color:#4D6678;margin:0 0 4px;max-width:520px}
      .doctor-platform-stage{position:relative;min-height:430px;border:1px solid #C9D7E4;border-radius:26px;overflow:hidden;background:linear-gradient(110deg,#F9FBFD 0%,#F9FBFD 48%,#E3EDF7 63%,#D6E6F2 100%);box-shadow:0 16px 36px rgba(31,65,93,.08)}.doctor-platform-visual{position:absolute;z-index:0;right:0;top:0;width:57%;height:100%;overflow:hidden;background:#DDE9F2}.doctor-platform-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 42%;display:block}.doctor-platform-visual:before{content:'';position:absolute;z-index:2;left:-1px;top:0;bottom:0;width:30%;background:linear-gradient(90deg,#F9FBFD 0%,rgba(249,251,253,.84) 34%,rgba(249,251,253,.28) 75%,transparent 100%);pointer-events:none}.doctor-platform-copy{position:relative;z-index:3;width:55%;padding:32px 34px 28px 38px;box-sizing:border-box}.doctor-platform-copy>h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.7rem,2vw,2.15rem);line-height:1.08;letter-spacing:-.04em;color:#17354A;margin:0 0 7px}.doctor-platform-intro{font-size:13.5px;line-height:1.46;color:#566D7D;margin:0 0 12px;max-width:520px}.doctor-platform-rule{width:42px;height:3px;border-radius:999px;background:#2F5BEA;margin-bottom:12px}
      .doctor-story{padding:14px 15px 13px;border-radius:15px;background:var(--story-wash);border:1px solid rgba(30,55,80,.09);animation:doctorStoryIn .35s ease both}@keyframes doctorStoryIn{from{opacity:.2;transform:translateY(5px)}to{opacity:1;transform:none}}.doctor-story-label{display:flex;align-items:center;gap:8px;font-size:10.5px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;color:var(--story-accent);margin-bottom:7px}.doctor-story-icon{width:31px;height:31px;border-radius:9px;display:grid;place-items:center;background:rgba(255,255,255,.76)}.doctor-story h4{font-family:'Sora','DM Sans',sans-serif;font-size:20px;line-height:1.22;letter-spacing:-.03em;color:#122F45;margin:0 0 7px;max-width:500px}.doctor-story p{font-size:12.3px;line-height:1.45;color:#587080;margin:0;max-width:500px}.doctor-story-facts{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.doctor-story-fact{padding:5px 8px;border-radius:999px;background:rgba(255,255,255,.72);border:1px solid rgba(31,57,82,.08);font-size:9.5px;font-weight:850;color:#385267}.doctor-story-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:11px}.doctor-story-tab{border:1px solid #C5D2DF;background:#F4F7FA;border-radius:9px;padding:8px;color:#566E7F;font:850 10.5px 'DM Sans',Arial,sans-serif;cursor:pointer;transition:background .16s,color .16s,border-color .16s,transform .16s}.doctor-story-tab:hover{transform:translateY(-1px)}.doctor-story-tab.active{background:var(--tab-accent);border-color:var(--tab-accent);color:#fff}.doctor-platform-flow{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin-top:12px;padding-top:11px;border-top:1px solid #D8E2EB}.doctor-flow-step{padding:0 9px;color:#667B8B;font-size:10.1px;line-height:1.35}.doctor-flow-step:first-child{padding-left:0}.doctor-flow-step+.doctor-flow-step{border-left:1px solid #D8E2EB}.doctor-flow-step b{display:block;color:#17354A;font-size:10.5px;margin-bottom:2px}.doctor-platform-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:14px}.doctor-platform-cta{border:1px solid #2F5BEA;border-radius:10px;background:#2F5BEA;color:#fff;padding:10px 15px;font:900 11.8px 'DM Sans',Arial,sans-serif;cursor:pointer;box-shadow:0 8px 18px rgba(47,91,234,.18)}.doctor-platform-cta:hover{background:#244BC4;transform:translateY(-1px)}.doctor-platform-note{font-size:10.5px;color:#64798A;font-weight:800}
      @media(max-width:1050px){.doctor-platform-head{grid-template-columns:1fr;gap:8px}.doctor-platform-stage{min-height:0;padding-top:405px}.doctor-platform-visual{top:0;left:0;right:0;width:100%;height:405px}.doctor-platform-visual:before{left:0;right:0;top:auto;width:100%;height:30%;bottom:0;background:linear-gradient(180deg,transparent,#F9FBFD)}.doctor-platform-copy{width:100%;padding:28px;max-width:800px}}
      @media(max-width:650px){.doctor-platform-section{padding:36px 12px 40px}.doctor-platform-head h2{font-size:2.15rem}.doctor-platform-head p{font-size:14.5px}.doctor-platform-stage{padding-top:330px}.doctor-platform-visual{height:330px}.doctor-platform-copy{padding:24px 19px}.doctor-platform-copy>h3{font-size:1.85rem}.doctor-story-tabs{grid-template-columns:1fr}.doctor-platform-flow{grid-template-columns:1fr}.doctor-flow-step{padding:6px 0}.doctor-flow-step+.doctor-flow-step{border-left:0;border-top:1px solid #D8E2EB}.doctor-platform-actions{display:grid;grid-template-columns:1fr}.doctor-platform-cta{width:100%}}
    `}</style>

    <div className="doctor-platform-shell">
      <div className="doctor-platform-head"><div><div className="doctor-platform-label">Doctor Platform</div><h2 id="doctor-platform-title">A clearer practice journey for doctors.</h2></div><p>Patients, scheduling and consultation context stay connected while the detailed working tools stay inside the doctor workspace.</p></div>

      <div className="doctor-platform-stage">
        <div className="doctor-platform-visual"><img className="doctor-platform-photo" src={DOCTOR_IMAGE} alt="Indian doctor in a modern clinic with patient care in progress" loading="lazy" decoding="async" onError={useFallback}/></div>
        <div className="doctor-platform-copy">
          <h3>One workspace from appointment to follow-up.</h3>
          <p className="doctor-platform-intro">One focused story at a time keeps the landing page clear while still showing how the workflow connects.</p>
          <div className="doctor-platform-rule"/>
          <div className="doctor-story" key={activeStory} style={{'--story-accent':story.accent,'--story-wash':story.wash} as CSSProperties}><div className="doctor-story-label"><span className="doctor-story-icon"><DoctorIcon kind={story.icon} size={17}/></span>{story.label}</div><h4>{story.title}</h4><p>{story.copy}</p><div className="doctor-story-facts">{story.facts.map(fact=><span className="doctor-story-fact" key={fact}>{fact}</span>)}</div></div>
          <div className="doctor-story-tabs" aria-label="Doctor Platform capabilities">{STORIES.map((item,index)=><button key={item.label} type="button" className={`doctor-story-tab ${index===activeStory?'active':''}`} style={{'--tab-accent':item.accent} as CSSProperties} onClick={()=>setActiveStory(index)}>{item.label}</button>)}</div>
          <div className="doctor-platform-flow" aria-label="Doctor care flow"><div className="doctor-flow-step"><b>Before</b>Availability and patient context</div><div className="doctor-flow-step"><b>During</b>Focused consultation workflow</div><div className="doctor-flow-step"><b>After</b>Follow-up remains visible</div></div>
          <div className="doctor-platform-actions"><button type="button" className="doctor-platform-cta" onClick={openDoctor}>Explore Doctor Platform</button><span className="doctor-platform-note">Patients · practice · continuity</span></div>
        </div>
      </div>
    </div>
  </section>;
}
