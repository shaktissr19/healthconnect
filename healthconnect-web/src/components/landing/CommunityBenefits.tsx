'use client';

import { useEffect, useState, type CSSProperties, type SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const STORIES=[
  {label:'My Patients',title:'Start each visit with the right patient context.',copy:'Keep returning-care history and supported patient-shared information close to the consultation.',icon:'patients',accent:'#7CC8BF',facts:['Returning history','Shared context','Follow-up']},
  {label:'Schedule',title:'Keep availability and bookings in one working rhythm.',copy:'Manage availability and booked appointments without jumping between disconnected tools.',icon:'calendar',accent:'#91B4D2',facts:['Availability','Bookings','Daily view']},
  {label:'Consultation',title:'Bring useful context into the consultation itself.',copy:'Review supported information before care begins, then keep the next care step visible after the visit.',icon:'context',accent:'#B6A4D2',facts:['Pre-visit context','Focused care','Next steps']},
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
    const timer=window.setInterval(()=>setActiveStory(current=>(current+1)%STORIES.length),5000);
    return()=>window.clearInterval(timer);
  },[]);

  const openDoctorPlatform=()=>{
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
      .doctor-platform-section{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#BECBD3;padding:44px 22px 50px;scroll-margin-top:90px;border-top:1px solid #AABBC5;border-bottom:1px solid #AABBC5}.doctor-platform-shell{width:min(100%,1380px);margin:0 auto}.doctor-platform-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(330px,.55fr);gap:44px;align-items:end;margin:0 6px 20px}.doctor-platform-label{font-size:12.5px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#315B69;margin-bottom:7px}.doctor-platform-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.05rem,2.7vw,2.95rem);line-height:1.03;letter-spacing:-.05em;color:#102E45;margin:0}.doctor-platform-head p{font-size:15.5px;line-height:1.5;color:#405D70;margin:0 0 4px;max-width:520px}
      .doctor-platform-stage{position:relative;min-height:410px;border:1px solid #9FB3BF;border-radius:26px;overflow:hidden;background:linear-gradient(108deg,#EAF0F3 0%,#EAF0F3 47%,#DCE8EC 62%,#C9DCE2 100%);box-shadow:0 18px 40px rgba(30,55,72,.14)}.doctor-platform-visual{position:absolute;z-index:0;right:0;top:0;width:58%;height:100%;overflow:hidden;background:#D8E5EA}.doctor-platform-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 42%;display:block}.doctor-platform-visual:before{content:'';position:absolute;z-index:2;left:-1px;top:0;bottom:0;width:34%;background:linear-gradient(90deg,#EAF0F3 0%,rgba(234,240,243,.9) 35%,rgba(234,240,243,.32) 76%,transparent 100%);pointer-events:none}.doctor-platform-copy{position:relative;z-index:3;width:54%;padding:33px 34px 28px 38px;box-sizing:border-box}.doctor-platform-copy>h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.72rem,2vw,2.18rem);line-height:1.08;letter-spacing:-.04em;color:#17354A;margin:0 0 7px}.doctor-platform-intro{font-size:13.8px;line-height:1.46;color:#506B7B;margin:0 0 13px;max-width:520px}.doctor-platform-rule{width:42px;height:3px;border-radius:999px;background:#315B69;margin-bottom:14px}
      .doctor-story{padding:17px 17px 16px;border-radius:17px;background:#294B5D;border:1px solid #3B6074;box-shadow:0 12px 26px rgba(21,48,64,.16);animation:doctorStoryIn .32s ease both;color:#fff}@keyframes doctorStoryIn{from{opacity:.25;transform:translateY(4px)}to{opacity:1;transform:none}}.doctor-story-label{display:flex;align-items:center;gap:9px;font-size:10.8px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;color:var(--story-accent);margin-bottom:8px}.doctor-story-icon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:rgba(255,255,255,.1);color:var(--story-accent);border:1px solid rgba(255,255,255,.12)}.doctor-story h4{font-family:'Sora','DM Sans',sans-serif;font-size:20px;line-height:1.22;letter-spacing:-.03em;color:#fff;margin:0 0 7px;max-width:500px}.doctor-story p{font-size:12.6px;line-height:1.48;color:#DCE8ED;margin:0;max-width:500px}.doctor-story-facts{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.doctor-story-fact{padding:5px 8px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.13);font-size:9.7px;font-weight:850;color:#F1F7F8}.doctor-story-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:11px}.doctor-story-tab{border:1px solid #B6C4CC;background:#DDE5E9;border-radius:9px;padding:9px;color:#4F6878;font:850 10.8px 'DM Sans',Arial,sans-serif;cursor:pointer;transition:background .16s,color .16s,border-color .16s,transform .16s}.doctor-story-tab:hover{transform:translateY(-1px);background:#E7EDF0}.doctor-story-tab.active{background:#315B69;border-color:#315B69;color:#fff;box-shadow:inset 0 3px 0 var(--tab-accent)}
      .doctor-platform-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:17px}.doctor-platform-cta{border-radius:10px;padding:11px 16px;font:900 12px 'DM Sans',Arial,sans-serif;cursor:pointer;transition:transform .16s ease,background .16s ease,box-shadow .16s ease}.doctor-platform-cta:hover{transform:translateY(-1px)}.doctor-platform-cta.primary{border:1px solid #24495D;background:#24495D;color:#fff;box-shadow:0 8px 18px rgba(36,73,93,.18)}.doctor-platform-cta.primary:hover{background:#1C3E51}.doctor-platform-cta.secondary{border:1px solid #2F7D75;background:#2F7D75;color:#fff;box-shadow:0 8px 18px rgba(47,125,117,.18)}.doctor-platform-cta.secondary:hover{background:#276C65}.doctor-platform-note{font-size:10.6px;color:#5A7180;font-weight:800;margin-left:2px}
      @media(max-width:1050px){.doctor-platform-head{grid-template-columns:1fr;gap:8px}.doctor-platform-stage{min-height:0;padding-top:405px}.doctor-platform-visual{top:0;left:0;right:0;width:100%;height:405px}.doctor-platform-visual:before{left:0;right:0;top:auto;width:100%;height:32%;bottom:0;background:linear-gradient(180deg,transparent,#EAF0F3)}.doctor-platform-copy{width:100%;padding:28px;max-width:820px}}
      @media(max-width:650px){.doctor-platform-section{padding:36px 12px 40px}.doctor-platform-head h2{font-size:2.15rem}.doctor-platform-head p{font-size:14.5px}.doctor-platform-stage{padding-top:330px}.doctor-platform-visual{height:330px}.doctor-platform-copy{padding:24px 19px}.doctor-platform-copy>h3{font-size:1.85rem}.doctor-story-tabs{grid-template-columns:1fr}.doctor-platform-actions{display:grid;grid-template-columns:1fr}.doctor-platform-cta{width:100%}.doctor-platform-note{margin-left:0}}
    `}</style>

    <div className="doctor-platform-shell">
      <div className="doctor-platform-head"><div><div className="doctor-platform-label">Doctor Platform</div><h2 id="doctor-platform-title">A clearer practice journey for doctors.</h2></div><p>Patients, scheduling and consultation context stay connected while the detailed working tools stay inside the doctor workspace.</p></div>
      <div className="doctor-platform-stage">
        <div className="doctor-platform-visual"><img className="doctor-platform-photo" src={DOCTOR_IMAGE} alt="Indian doctor in a modern clinic with patient care in progress" loading="lazy" decoding="async" onError={useFallback}/></div>
        <div className="doctor-platform-copy">
          <h3>One workspace from appointment to follow-up.</h3>
          <p className="doctor-platform-intro">See one part of the workflow at a time, then move into the full doctor workspace when you are ready.</p>
          <div className="doctor-platform-rule"/>
          <div className="doctor-story" key={activeStory} style={{'--story-accent':story.accent} as CSSProperties}><div className="doctor-story-label"><span className="doctor-story-icon"><DoctorIcon kind={story.icon} size={17}/></span>{story.label}</div><h4>{story.title}</h4><p>{story.copy}</p><div className="doctor-story-facts">{story.facts.map(fact=><span className="doctor-story-fact" key={fact}>{fact}</span>)}</div></div>
          <div className="doctor-story-tabs" aria-label="Doctor Platform capabilities">{STORIES.map((item,index)=><button key={item.label} type="button" className={`doctor-story-tab ${index===activeStory?'active':''}`} style={{'--tab-accent':item.accent} as CSSProperties} onClick={()=>setActiveStory(index)}>{item.label}</button>)}</div>
          <div className="doctor-platform-actions"><button type="button" className="doctor-platform-cta primary" onClick={openDoctorPlatform}>Explore Doctor Platform</button><button type="button" className="doctor-platform-cta secondary" onClick={()=>router.push('/doctors')}>Browse Doctor Directory</button><span className="doctor-platform-note">Patients · practice · continuity</span></div>
        </div>
      </div>
    </div>
  </section>;
}
