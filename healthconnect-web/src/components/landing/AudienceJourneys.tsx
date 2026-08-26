'use client';

import { useEffect, useRef, useState, type TouchEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const NAV_ITEMS=[
  {label:'My Health',sub:'Your private health workspace',target:'my-health-story',accent:'#0B8F7C',wash:'#DFF6EF',icon:'♥'},
  {label:'Health Communities',sub:'Peer support between visits',target:'health-communities-story',accent:'#7C3AED',wash:'#EEE4FF',icon:'◎'},
  {label:'Doctor Platform',sub:'Patients, practice and follow-up',target:'doctor-platform-story',accent:'#2563EB',wash:'#E4EDFF',icon:'▣'},
  {label:'Find Care',sub:'Doctors and hospitals',target:'care-discovery',accent:'#0F766E',wash:'#DCF3EF',icon:'⌕'},
  {label:'Knowledge Hub',sub:'Understand, learn and prepare',target:'knowledge-hub',accent:'#0284C7',wash:'#E1F3FC',icon:'▤'},
  {label:'Plans',sub:'Simple membership options',target:'plans',accent:'#C2410C',wash:'#FDEBDD',icon:'₹'},
] as const;

export default function AudienceJourneys(){
  const router=useRouter();
  const {user,isAuthenticated}=useAuthStore();
  const {openAuthModal}=useUIStore();
  const [slide,setSlide]=useState(0);
  const [paused,setPaused]=useState(false);
  const touchStart=useRef<number|null>(null);

  useEffect(()=>{
    if(paused || typeof window==='undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer=window.setInterval(()=>setSlide(current=>(current+1)%2),6800);
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
  const goto=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});
  const onTouchStart=(event:TouchEvent<HTMLElement>)=>{touchStart.current=event.touches[0]?.clientX??null};
  const onTouchEnd=(event:TouchEvent<HTMLElement>)=>{
    if(touchStart.current==null) return;
    const end=event.changedTouches[0]?.clientX??touchStart.current;
    if(Math.abs(end-touchStart.current)>48) setSlide(end>touchStart.current?0:1);
    touchStart.current=null;
  };

  const dashboardNav=['Overview','Reports','Prescriptions','Medicines','Symptoms & Vitals','Appointments','Reminders'];

  return <section className="journey-root" id="platform-tour">
    <style>{`
      .journey-root{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#fff}
      .journey-nav-wrap{max-width:1380px;margin:0 auto;padding:34px 28px 0}.journey-nav-title{text-align:center;color:#0B7E72;font-size:13px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;margin-bottom:15px}.journey-nav{padding:14px;border-radius:22px;background:linear-gradient(120deg,#075E57,#0B7168);display:grid;grid-template-columns:repeat(6,1fr);gap:10px;box-shadow:0 16px 34px rgba(5,73,67,.14)}
      .journey-pill{min-height:92px;border:0;border-radius:16px;padding:14px 13px;text-align:left;display:flex;align-items:center;gap:11px;cursor:pointer;transition:transform .17s ease,box-shadow .17s ease;box-shadow:inset 0 0 0 1px rgba(0,0,0,.04)}.journey-pill:hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(0,0,0,.12)}.journey-icon{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;flex:0 0 auto;background:rgba(255,255,255,.75);font-size:19px;font-weight:900}.journey-pill b{display:block;font-size:13.5px;line-height:1.25;color:#10243C}.journey-pill span:last-child{display:block;margin-top:3px;font-size:11.5px;line-height:1.3;color:#506779}
      .myhealth-section{padding:86px 28px 88px}.myhealth-shell{max-width:1380px;margin:0 auto}.myhealth-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(340px,.58fr);gap:48px;align-items:end;margin-bottom:24px}.myhealth-label{font-size:13px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#0B8F7C;margin-bottom:8px}.myhealth-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.45rem,3.25vw,3.6rem);line-height:1.03;letter-spacing:-.05em;color:#0B2B45;margin:0}.myhealth-head p{font-size:16px;line-height:1.6;color:#405D70;margin:0 0 4px}
      .health-carousel{position:relative;overflow:hidden;border:1px solid #CBE3DD;border-radius:28px;box-shadow:0 20px 50px rgba(27,83,73,.08);background:#EAF8F4}.health-slide{position:relative;aspect-ratio:16/9;min-height:560px;overflow:hidden;background:linear-gradient(125deg,#DFF5EF 0%,#F9FCFB 55%,#E6F7F2 100%)}.health-slide:before{content:'';position:absolute;width:560px;height:560px;right:-160px;top:-290px;border-radius:50%;background:radial-gradient(circle,rgba(36,179,143,.24),rgba(36,179,143,0) 68%)}
      .slide-copy{position:absolute;z-index:4;left:52px;top:44px;max-width:610px}.slide-copy .eyebrow{font-size:12.5px;font-weight:900;letter-spacing:.15em;text-transform:uppercase;color:#0B8F7C;margin-bottom:9px}.slide-copy h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.2rem,2.8vw,3.15rem);line-height:1.04;letter-spacing:-.045em;color:#0B2B45;margin:0}.slide-copy p{font-size:15px;line-height:1.55;color:#456273;margin:12px 0 0;max-width:580px}.health-chip-row{position:absolute;right:46px;top:48px;display:flex;gap:9px;z-index:4}.health-chip{padding:9px 12px;border-radius:999px;background:rgba(255,255,255,.88);border:1px solid #CDE2DD;color:#0B665C;font-size:11.5px;font-weight:850;box-shadow:0 7px 16px rgba(30,94,81,.06)}
      .dashboard-window{position:absolute;z-index:3;left:4.8%;right:4.8%;bottom:8%;height:57%;border-radius:20px;background:rgba(255,255,255,.98);border:1px solid #C9DEDA;box-shadow:0 24px 44px rgba(19,79,69,.13);overflow:hidden}.dash-top{height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;border-bottom:1px solid #E4EEEC}.dash-top b{font-size:14px}.dash-top span{font-size:11.5px;color:#6A7F89}.dash-layout{height:calc(100% - 52px);display:grid;grid-template-columns:170px minmax(0,1fr) 240px}.dash-nav{padding:13px;background:#F7FAF9;border-right:1px solid #E5EEEC;display:grid;align-content:start;gap:7px}.dash-nav button{border:0;text-align:left;border-radius:9px;background:#EEF4F2;color:#496371;padding:8px 10px;font:750 11.5px 'DM Sans',Arial,sans-serif;cursor:pointer}.dash-nav button:first-child{background:#D8F0E9;color:#087F70}.dash-main{padding:13px 14px}.dash-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.dash-kpi{padding:10px;border-radius:10px;background:#F2F8F6;color:#6A7E87;font-size:10.5px}.dash-kpi strong{display:block;color:#0B8F7C;font-size:22px;margin-top:2px}.dash-timeline{margin-top:10px;border:1px solid #E2ECEA;border-radius:11px;padding:10px}.dash-timeline b{font-size:11.5px}.dash-row{display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid #E6EEEC;font-size:10.8px;color:#536D79}.dash-row:first-of-type{margin-top:5px}.dash-rail{padding:13px;border-left:1px solid #E5EEEC;background:#FCFDFD;display:grid;align-content:start;gap:8px}.rail-card{padding:10px;border-radius:11px;border:1px solid #DFEAE7;background:#fff}.rail-card b{display:block;font-size:10.8px;color:#173B46}.rail-card strong{display:block;font-size:18px;color:#0B8F7C;margin:3px 0}.rail-card span{font-size:10.5px;line-height:1.35;color:#607985}.rail-card.community{background:#F5EEFF;border-color:#E0D2F4}.rail-card.community b,.rail-card.community strong{color:#6D28D9}.rail-card.community{cursor:pointer}
      .journey-map{position:absolute;left:5%;right:5%;bottom:10%;height:55%;border-radius:24px;background:linear-gradient(135deg,#08675E 0%,#0D8B79 50%,#75D8C0 100%);box-shadow:0 20px 42px rgba(12,111,100,.16);overflow:hidden}.journey-map:before{content:'';position:absolute;left:7%;right:7%;top:55%;height:2px;background:rgba(255,255,255,.5)}.journey-callout{position:absolute;left:5%;top:9%;max-width:250px;padding:13px 14px;border-radius:14px;background:rgba(255,255,255,.94);box-shadow:0 10px 24px rgba(0,0,0,.11)}.journey-callout b{display:block;color:#0B665C;font-size:12px}.journey-callout span{display:block;margin-top:3px;font-size:11.2px;line-height:1.42;color:#516A76}.journey-node{position:absolute;top:55%;transform:translate(-50%,-50%);text-align:center;width:120px}.journey-node:nth-of-type(2){left:12%}.journey-node:nth-of-type(3){left:31%}.journey-node:nth-of-type(4){left:50%}.journey-node:nth-of-type(5){left:69%}.journey-node:nth-of-type(6){left:88%}.journey-node i{width:62px;height:62px;border-radius:18px;background:#fff;display:grid;place-items:center;margin:0 auto 8px;color:#0B8F7C;font-style:normal;font-size:23px;box-shadow:0 9px 20px rgba(0,0,0,.12)}.journey-node:last-child i{color:#7C3AED}.journey-node b{display:block;color:#fff;font-size:11.5px;line-height:1.2}.journey-benefits{position:absolute;right:5%;top:10%;display:grid;grid-template-columns:1fr 1fr;gap:8px;max-width:380px}.journey-benefit{padding:9px 11px;border-radius:12px;background:rgba(255,255,255,.91);color:#234553;font-size:11.5px;font-weight:750}
      .health-dots{position:absolute;z-index:7;left:50%;bottom:17px;transform:translateX(-50%);display:flex;gap:7px}.health-dot{width:9px;height:9px;border:0;border-radius:999px;background:#B8D2CC;padding:0;cursor:pointer}.health-dot.active{width:28px;background:#0B8F7C}.fade-in{animation:fadeIn .35s ease both}@keyframes fadeIn{from{opacity:.2;transform:translateY(3px)}to{opacity:1;transform:none}}
      @media(max-width:1080px){.journey-nav{grid-template-columns:repeat(3,1fr)}.myhealth-head{grid-template-columns:1fr;gap:12px}.health-slide{aspect-ratio:auto;min-height:760px}.health-chip-row{left:52px;right:auto;top:178px}.dashboard-window{top:250px;bottom:55px;height:auto}.journey-map{top:245px;bottom:60px;height:auto}.journey-benefits{left:52px;right:auto;top:178px}}
      @media(max-width:720px){.journey-nav-wrap{padding:24px 14px 0}.journey-nav{grid-template-columns:1fr 1fr}.journey-pill{min-height:82px}.myhealth-section{padding:62px 14px 68px}.myhealth-head h2{font-size:2.5rem}.health-slide{min-height:900px}.slide-copy{left:22px;right:22px;top:28px}.slide-copy h3{font-size:2.3rem}.health-chip-row,.journey-benefits{left:22px;right:22px;top:188px;flex-wrap:wrap}.dashboard-window{left:18px;right:18px;top:275px;bottom:58px}.dash-layout{grid-template-columns:1fr}.dash-nav{grid-template-columns:repeat(3,1fr);border-right:0;border-bottom:1px solid #E5EEEC}.dash-rail{grid-template-columns:repeat(3,1fr);border-left:0;border-top:1px solid #E5EEEC}.journey-map{left:18px;right:18px;top:280px;bottom:60px}.journey-map:before{left:50%;right:auto;top:12%;bottom:12%;width:2px;height:auto}.journey-node{left:50%!important;top:auto}.journey-node:nth-of-type(2){top:22%}.journey-node:nth-of-type(3){top:36%}.journey-node:nth-of-type(4){top:50%}.journey-node:nth-of-type(5){top:64%}.journey-node:nth-of-type(6){top:78%}.journey-callout{left:14px;top:14px}.journey-benefits{grid-template-columns:1fr 1fr}}
      @media(max-width:480px){.journey-nav{grid-template-columns:1fr}.health-chip-row{display:none}.dashboard-window{top:250px}.dash-nav{grid-template-columns:1fr 1fr}.dash-rail{grid-template-columns:1fr}.journey-benefits{display:none}.journey-map{top:245px}.slide-copy h3{font-size:2.1rem}}
    `}</style>

    <div className="journey-nav-wrap">
      <div className="journey-nav-title">Explore HealthConnect</div>
      <div className="journey-nav">{NAV_ITEMS.map(item=><button key={item.label} type="button" className="journey-pill" style={{background:item.wash}} onClick={()=>goto(item.target)}><span className="journey-icon" style={{color:item.accent}}>{item.icon}</span><span><b>{item.label}</b><span>{item.sub}</span></span></button>)}</div>
    </div>

    <section className="myhealth-section" id="my-health-story">
      <div className="myhealth-shell">
        <div className="myhealth-head"><div><div className="myhealth-label">My Health · Patient Dashboard</div><h2>Your health journey, organised around you.</h2></div><p>One private workspace for health information, upcoming care and the support you may need between visits.</p></div>
        <div className="health-carousel" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={()=>setPaused(false)} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {slide===0?<div className="health-slide fade-in">
            <div className="slide-copy"><div className="eyebrow">Everything in one place</div><h3>Your health information, ready when care continues.</h3><p>Reports, medicines, appointments, reminders and recent activity stay visible in one patient workspace.</p></div>
            <div className="health-chip-row"><span className="health-chip">Reports & prescriptions</span><span className="health-chip">Upcoming care</span><span className="health-chip">Community support</span></div>
            <div className="dashboard-window"><div className="dash-top"><b>My Health</b><span>Your private health workspace</span></div><div className="dash-layout"><div className="dash-nav">{dashboardNav.map(item=><button key={item} type="button" onClick={openPatient}>{item}</button>)}</div><div className="dash-main"><div className="dash-kpis"><div className="dash-kpi">Health Score<strong>82</strong></div><div className="dash-kpi">Reports<strong>8</strong></div><div className="dash-kpi">Upcoming<strong>2</strong></div></div><div className="dash-timeline"><b>Health Timeline</b><div className="dash-row"><span>Prescription added</span><span>Jan 30</span></div><div className="dash-row"><span>Lab report uploaded</span><span>Jan 28</span></div><div className="dash-row"><span>Follow-up visit</span><span>Jan 25</span></div><div className="dash-row"><span>Medicine reminder</span><span>Today</span></div></div></div><div className="dash-rail"><div className="rail-card"><b>Next appointment</b><strong>12 Feb</strong><span>Follow-up consultation</span></div><div className="rail-card"><b>Medicines</b><strong>5</strong><span>2 reminders today</span></div><button className="rail-card community" type="button" onClick={()=>router.push('/communities')}><b>Health Communities</b><strong>Support</strong><span>Join a condition-focused space</span></button></div></div></div>
          </div>:<div className="health-slide fade-in">
            <div className="slide-copy"><div className="eyebrow">From information to next steps</div><h3>Your health story should help you know what comes next.</h3><p>HealthConnect connects what happened with reminders, appointments, follow-up and relevant peer support.</p></div>
            <div className="journey-benefits"><span className="journey-benefit">Better prepared for the next visit</span><span className="journey-benefit">Less searching across separate places</span><span className="journey-benefit">Follow-up stays visible</span><span className="journey-benefit">Support between appointments</span></div>
            <div className="journey-map"><div className="journey-callout"><b>One connected journey</b><span>Health information becomes more useful when it leads naturally into the next step.</span></div><div className="journey-node"><i>▤</i><b>Health records</b></div><div className="journey-node"><i>◷</i><b>Reminders</b></div><div className="journey-node"><i>▣</i><b>Appointment</b></div><div className="journey-node"><i>↻</i><b>Follow-up</b></div><div className="journey-node"><i>◎</i><b>Community support</b></div></div>
          </div>}
          <div className="health-dots" aria-label="My Health stories"><button type="button" aria-label="Show My Health dashboard" className={`health-dot ${slide===0?'active':''}`} onClick={()=>setSlide(0)}/><button type="button" aria-label="Show connected health journey" className={`health-dot ${slide===1?'active':''}`} onClick={()=>setSlide(1)}/></div>
        </div>
      </div>
    </section>
  </section>;
}
