'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const NAV=[
  ['My Health','#my-health-story','#0B8F7C'],
  ['Health Communities','#health-communities-story','#7C3AED'],
  ['Doctor Platform','#doctor-platform-story','#2563EB'],
  ['Find Care','#care-discovery','#EA580C'],
  ['Knowledge Hub','#knowledge-resources','#0284C7'],
  ['Plans','#plans','#0F766E'],
] as const;

const HEALTH_FLOW=[
  ['Reports & prescriptions','Keep important clinical documents together.','📄'],
  ['Medicines & reminders','Know what you take and what is due next.','💊'],
  ['Appointments','See upcoming care and follow-up in context.','📅'],
  ['Health Communities','Move into relevant peer support between visits.','👥'],
] as const;

export default function AudienceJourneys(){
  const router=useRouter();
  const {user,isAuthenticated}=useAuthStore();
  const {openAuthModal}=useUIStore();
  const [slide,setSlide]=useState(0);
  const [paused,setPaused]=useState(false);
  const touchX=useRef<number|null>(null);

  useEffect(()=>{
    if(paused||typeof window==='undefined'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const timer=window.setInterval(()=>setSlide(v=>(v+1)%2),6800);
    return()=>window.clearInterval(timer);
  },[paused]);

  const openPatient=()=>{
    if(!isAuthenticated||!user){
      try{sessionStorage.setItem('hc_post_login_redirect','/dashboard')}catch{}
      openAuthModal('login');
      return;
    }
    const role=String(user.role||'').toUpperCase();
    router.push(role==='PATIENT'?'/dashboard':role==='DOCTOR'?'/doctor-dashboard':role==='HOSPITAL'?'/hospital-dashboard':'/admin-dashboard');
  };

  const jump=(target:string)=>document.querySelector(target)?.scrollIntoView({behavior:'smooth',block:'start'});
  const previous=()=>setSlide(v=>(v+1)%2);
  const next=()=>setSlide(v=>(v+1)%2);
  const swipeEnd=(x:number)=>{
    if(touchX.current===null)return;
    const d=x-touchX.current;
    if(Math.abs(d)>45)d<0?next():previous();
    touchX.current=null;
  };

  return <section className="patient-journey" id="platform-tour">
    <style>{`
      .patient-journey{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#fff}
      .journey-nav{max-width:1380px;margin:0 auto;padding:24px 28px 0}
      .journey-nav-shell{height:78px;border:1px solid #DDE9E8;border-radius:18px;background:#fff;box-shadow:0 10px 28px rgba(20,65,72,.045);display:grid;grid-template-columns:repeat(6,1fr);align-items:stretch;overflow:hidden}
      .journey-nav-btn{border:0;border-right:1px solid #E5EDEC;background:transparent;padding:12px 10px;display:flex;align-items:center;justify-content:center;gap:9px;font:850 13.5px 'DM Sans',Arial,sans-serif;color:#173A4C;cursor:pointer;transition:background .15s ease}
      .journey-nav-btn:hover{background:#F8FBFB}.journey-nav-btn:last-child{border-right:0}
      .journey-nav-dot{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;font-weight:900;background:color-mix(in srgb,var(--accent) 12%,white);color:var(--accent)}

      .mh-section{padding:76px 28px 82px;background:linear-gradient(180deg,#fff 0%,#F6FBFA 18%,#EAF8F4 100%)}
      .mh-wrap{max-width:1380px;margin:0 auto}
      .mh-head{max-width:900px;margin:0 auto 30px;text-align:center}
      .mh-kicker{font-size:13px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#0B8F7C;margin-bottom:10px}
      .mh-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.5rem,3.6vw,3.95rem);line-height:1.04;letter-spacing:-.05em;color:#0C2A40;margin:0}
      .mh-head p{font-size:16.5px;line-height:1.65;color:#3F6072;margin:14px auto 0;max-width:820px}
      .mh-carousel{position:relative;aspect-ratio:16/8.7;min-height:530px;border:1px solid #CDE4DE;border-radius:28px;overflow:hidden;background:#EAF8F4;box-shadow:0 20px 52px rgba(25,80,69,.09)}
      .mh-slide{position:absolute;inset:0;opacity:0;pointer-events:none;transition:opacity .45s ease;background:linear-gradient(125deg,#EAF8F4 0%,#F9FCFB 48%,#EAF5FF 100%)}
      .mh-slide.active{opacity:1;pointer-events:auto}
      .mh-slide:before{content:'';position:absolute;width:520px;height:520px;border-radius:50%;right:-170px;top:-250px;background:radial-gradient(circle,rgba(45,179,150,.14),rgba(45,179,150,0) 68%)}
      .mh-slide:after{content:'';position:absolute;width:470px;height:470px;border-radius:50%;left:-220px;bottom:-300px;background:radial-gradient(circle,rgba(37,99,235,.09),rgba(37,99,235,0) 68%)}
      .mh-slide-label{font-size:12.5px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#0B8F7C;margin-bottom:8px}
      .mh-slide h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,2.75vw,3rem);line-height:1.06;letter-spacing:-.045em;margin:0;color:#0D2A40}
      .mh-slide p{font-size:15px;line-height:1.58;color:#415F70;margin:12px 0 0}

      .mh-workspace{position:absolute;left:4%;top:8%;bottom:10%;width:62%;border:1px solid #CFE2DE;border-radius:22px;background:rgba(255,255,255,.94);box-shadow:0 24px 56px rgba(17,73,66,.12);overflow:hidden;z-index:2}
      .mh-workspace-top{height:58px;padding:0 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #E3ECEA}
      .mh-workspace-top b{font-size:15px;color:#163B45}.mh-workspace-top span{font-size:12px;color:#5D7580}
      .mh-workspace-grid{display:grid;grid-template-columns:128px minmax(0,1fr) 174px;gap:14px;padding:15px;height:calc(100% - 58px)}
      .mh-side{display:grid;align-content:start;gap:7px}.mh-side span{padding:9px 10px;border-radius:9px;background:#F3F7F6;color:#506A76;font-size:11.7px}.mh-side span:first-child{background:#DDF3EC;color:#087F70;font-weight:900}
      .mh-center{display:grid;grid-template-rows:auto 1fr;gap:11px;min-width:0}.mh-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.mh-kpi{padding:11px;border-radius:11px;background:#F1F7F5;color:#627986;font-size:10.8px}.mh-kpi strong{display:block;margin-top:2px;color:#0B8F7C;font-size:22px}
      .mh-timeline{border:1px solid #E5EEEC;background:#F9FBFB;border-radius:12px;padding:12px;overflow:hidden}.mh-timeline b{font-size:12.5px;color:#183A45}.mh-event{display:flex;justify-content:space-between;gap:10px;border-top:1px solid #E5ECEA;padding:8px 0;font-size:11.3px;color:#526D7A}.mh-event:first-of-type{margin-top:7px}.mh-event em{font-style:normal;color:#8A9BA3;font-size:10.5px}
      .mh-right{display:grid;align-content:start;gap:9px}.mh-right-card{padding:11px;border-radius:12px;border:1px solid #E2ECE9;background:#FBFDFC}.mh-right-card b{display:block;font-size:11.8px;color:#173B46;margin-bottom:5px}.mh-right-card strong{display:block;color:#0B8F7C;font-size:20px}.mh-right-card span{font-size:10.9px;line-height:1.42;color:#607783}.mh-right-card.community{background:#F4EEFF;border-color:#E1D5F6}.mh-right-card.community b{color:#6D28D9}.mh-right-card.community a{display:inline-block;margin-top:7px;color:#6D28D9;font-size:10.8px;font-weight:900;text-decoration:none}
      .mh-one-copy{position:absolute;right:4.5%;top:16%;width:28%;z-index:3}.mh-points{display:grid;gap:10px;margin-top:17px}.mh-point{display:flex;gap:9px;align-items:flex-start;font-size:13.4px;line-height:1.46;color:#2D4D5D}.mh-point i{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#D8F2EB;color:#0B8F7C;font-style:normal;font-weight:900;flex:0 0 auto}
      .mh-cta{display:inline-flex;margin-top:19px;border:0;border-radius:10px;background:#0B8F7C;color:#fff;padding:12px 18px;font:900 13.5px 'DM Sans',Arial,sans-serif;cursor:pointer}

      .mh-two-copy{position:absolute;left:5%;top:14%;width:31%;z-index:3}
      .mh-flow{position:absolute;right:4%;top:11%;bottom:12%;width:57%;z-index:2;display:grid;grid-template-columns:repeat(2,1fr);gap:14px;align-content:center}
      .mh-flow-card{position:relative;min-height:126px;padding:18px 18px 16px 62px;border-radius:18px;border:1px solid rgba(156,201,191,.78);background:rgba(255,255,255,.89);box-shadow:0 12px 30px rgba(20,71,67,.07)}
      .mh-flow-icon{position:absolute;left:17px;top:18px;width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:#DDF4ED;font-size:17px}
      .mh-flow-card strong{display:block;font-size:14.5px;color:#173B46;margin-bottom:5px}.mh-flow-card span{display:block;font-size:13px;line-height:1.48;color:#506B78}
      .mh-flow-card.community{background:#F5EFFF;border-color:#DCCCF5}.mh-flow-card.community .mh-flow-icon{background:#E8DBFF}.mh-flow-card.community strong{color:#5B2AA0}
      .mh-flow-note{grid-column:1/-1;border-radius:16px;padding:14px 18px;background:linear-gradient(90deg,#0B6E63,#0B8F7C);color:#fff;font-size:13.5px;line-height:1.5}.mh-flow-note b{font-weight:900}
      .mh-journey-arrow{position:absolute;left:39%;top:50%;width:55px;height:2px;background:#9ACFC3;z-index:2}.mh-journey-arrow:after{content:'›';position:absolute;right:-3px;top:-14px;color:#0B8F7C;font-size:26px;font-weight:900}

      .mh-controls{position:absolute;left:50%;bottom:17px;transform:translateX(-50%);display:flex;align-items:center;gap:9px;z-index:6}.mh-arrow{width:38px;height:38px;border-radius:50%;border:1px solid #BCD6D1;background:rgba(255,255,255,.96);color:#0A6F63;font-size:20px;cursor:pointer;box-shadow:0 5px 16px rgba(20,70,68,.08)}.mh-dots{display:flex;gap:7px}.mh-dot{width:8px;height:8px;border-radius:999px;border:0;background:#B8D4CF;padding:0;cursor:pointer}.mh-dot.active{width:25px;background:#0B8F7C}.mh-count{position:absolute;right:20px;bottom:21px;z-index:5;font-size:12px;font-weight:800;color:#52717D}

      @media(max-width:1100px){.journey-nav-shell{grid-template-columns:repeat(3,1fr);height:auto}.journey-nav-btn{min-height:64px}.journey-nav-btn:nth-child(3){border-right:0}.journey-nav-btn:nth-child(n+4){border-top:1px solid #E5EDEC}.mh-carousel{aspect-ratio:auto;min-height:700px}.mh-workspace{left:4%;right:4%;top:5%;width:auto;height:47%;bottom:auto}.mh-one-copy{left:7%;right:7%;top:56%;width:auto}.mh-two-copy{left:6%;top:8%;width:38%}.mh-flow{right:4%;width:53%}}
      @media(max-width:760px){.journey-nav{padding:20px 14px 0;overflow:auto}.journey-nav-shell{display:flex;min-width:max-content;height:68px}.journey-nav-btn{min-width:150px;border-top:0!important}.mh-section{padding:58px 14px 64px}.mh-head{text-align:left;margin-bottom:24px}.mh-carousel{min-height:870px;border-radius:22px}.mh-workspace{height:43%}.mh-workspace-grid{grid-template-columns:1fr}.mh-side{display:none}.mh-right{grid-template-columns:repeat(3,1fr)}.mh-one-copy{top:52%}.mh-two-copy{left:7%;right:7%;top:6%;width:auto}.mh-flow{left:7%;right:7%;top:38%;bottom:9%;width:auto}.mh-journey-arrow{display:none}.mh-slide h3{font-size:2.25rem}.mh-count{display:none}}
      @media(max-width:520px){.mh-carousel{min-height:980px}.mh-head h2{font-size:2.4rem}.mh-workspace{height:38%;left:4%;right:4%}.mh-workspace-top{padding:0 13px}.mh-workspace-grid{padding:11px}.mh-right{grid-template-columns:1fr 1fr}.mh-right-card.community{grid-column:1/-1}.mh-one-copy{top:46%}.mh-flow{grid-template-columns:1fr;top:36%;gap:9px}.mh-flow-card{min-height:92px;padding:14px 14px 14px 55px}.mh-flow-icon{left:13px;top:14px}.mh-flow-note{grid-column:auto}}
    `}</style>

    <div className="journey-nav"><div className="journey-nav-shell">{NAV.map(([label,target,color],i)=><button type="button" key={label} className="journey-nav-btn" onClick={()=>jump(target)}><span className="journey-nav-dot" style={{'--accent':color} as React.CSSProperties}>{i+1}</span>{label}</button>)}</div></div>

    <section className="mh-section" id="my-health-story">
      <div className="mh-wrap">
        <div className="mh-head"><div className="mh-kicker">My Health · For patients & families</div><h2>Your health journey, organised around you.</h2><p>Keep the information that matters across visits in one private workspace — then move naturally into reminders, appointments, follow-up and relevant peer support when you need it.</p></div>
        <div className="mh-carousel" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={()=>setPaused(false)} onTouchStart={e=>{touchX.current=e.touches[0]?.clientX??null}} onTouchEnd={e=>swipeEnd(e.changedTouches[0]?.clientX??0)}>
          <article className={`mh-slide ${slide===0?'active':''}`} aria-hidden={slide!==0}>
            <div className="mh-workspace">
              <div className="mh-workspace-top"><b>My Health</b><span>Your private health workspace</span></div>
              <div className="mh-workspace-grid">
                <div className="mh-side"><span>Overview</span><span>Reports</span><span>Prescriptions</span><span>Medicines</span><span>Symptoms & Vitals</span><span>Appointments</span><span>Reminders</span></div>
                <div className="mh-center"><div className="mh-kpis"><div className="mh-kpi">Health Score<strong>82</strong></div><div className="mh-kpi">Reports<strong>8</strong></div><div className="mh-kpi">Upcoming<strong>2</strong></div></div><div className="mh-timeline"><b>Health Timeline</b><div className="mh-event">Prescription added <em>Jan 30</em></div><div className="mh-event">Lab report uploaded <em>Jan 28</em></div><div className="mh-event">Follow-up visit <em>Jan 25</em></div><div className="mh-event">Medicine reminder <em>Today</em></div></div></div>
                <div className="mh-right"><div className="mh-right-card"><b>Next appointment</b><strong>12 Feb</strong><span>Follow-up consultation</span></div><div className="mh-right-card"><b>Medicines</b><strong>5</strong><span>2 reminders today</span></div><div className="mh-right-card community"><b>Health Communities</b><span>Find relevant peer support between visits.</span><a href="/communities">Explore support →</a></div></div>
              </div>
            </div>
            <div className="mh-one-copy"><div className="mh-slide-label">Everything in one place</div><h3>Carry your health story from one visit to the next.</h3><p>Reports, medicines, symptoms, vitals, appointments and reminders stay connected so you can see the bigger picture without searching across separate places.</p><div className="mh-points"><div className="mh-point"><i>✓</i><span>See health information and upcoming care together.</span></div><div className="mh-point"><i>✓</i><span>Keep medicines, reports and follow-up visible.</span></div><div className="mh-point"><i>✓</i><span>Prepare for the next doctor conversation with better context.</span></div></div><button type="button" className="mh-cta" onClick={openPatient}>Explore My Health →</button></div>
          </article>

          <article className={`mh-slide ${slide===1?'active':''}`} aria-hidden={slide!==1}>
            <div className="mh-two-copy"><div className="mh-slide-label">From information to next steps</div><h3>Your health workspace should help you act, not just store files.</h3><p>HealthConnect carries the story forward from records and medicines into upcoming care, follow-up and relevant peer support between appointments.</p><button type="button" className="mh-cta" onClick={openPatient}>Open Patient Workspace →</button></div>
            <div className="mh-journey-arrow" aria-hidden="true"/>
            <div className="mh-flow">{HEALTH_FLOW.map(([title,desc,icon],index)=><div key={title} className={`mh-flow-card ${index===3?'community':''}`}><span className="mh-flow-icon">{icon}</span><strong>{title}</strong><span>{desc}</span></div>)}<div className="mh-flow-note"><b>Continuity matters:</b> useful context can stay visible from one visit to the next instead of forcing you to rebuild the story each time.</div></div>
          </article>

          <div className="mh-controls"><button className="mh-arrow" type="button" aria-label="Previous My Health slide" onClick={previous}>‹</button><div className="mh-dots">{[0,1].map(i=><button key={i} type="button" className={`mh-dot ${slide===i?'active':''}`} aria-label={`Show My Health slide ${i+1}`} onClick={()=>setSlide(i)}/>)}</div><button className="mh-arrow" type="button" aria-label="Next My Health slide" onClick={next}>›</button></div><div className="mh-count">{slide+1} / 2</div>
        </div>
      </div>
    </section>
  </section>;
}
