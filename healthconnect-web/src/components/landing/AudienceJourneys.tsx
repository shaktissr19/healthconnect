'use client';

import { useEffect, useRef, useState, type TouchEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

type BenefitKey='track'|'history'|'doctor'|'community';

const NAV_ITEMS=[
  {label:'My Health',sub:'Track, organise and prepare',target:'my-health-story',accent:'#0B8F7C',wash:'#DDF5EE',icon:'♥'},
  {label:'Health Communities',sub:'Peer support between visits',target:'health-communities-story',accent:'#7C3AED',wash:'#EEE5FF',icon:'◎'},
  {label:'Doctor Platform',sub:'Patients, practice and follow-up',target:'doctor-platform-story',accent:'#2563EB',wash:'#E4EDFF',icon:'▣'},
  {label:'Find Care',sub:'Doctors and hospitals',target:'care-discovery',accent:'#0F766E',wash:'#DDF3EF',icon:'⌕'},
  {label:'Knowledge Hub',sub:'Understand, learn and prepare',target:'knowledge-hub',accent:'#0284C7',wash:'#E1F3FC',icon:'▤'},
  {label:'Plans',sub:'Simple membership options',target:'plans',accent:'#C2410C',wash:'#FCEBDD',icon:'₹'},
] as const;

const BENEFITS:Record<BenefitKey,{title:string;short:string;detail:string;accent:string;icon:string}>={
  track:{title:'Track your health',short:'Keep symptoms, medicines, vitals and reminders visible.',detail:'See the information that matters day to day so changes are easier to notice and discuss.',accent:'#0B8F7C',icon:'◔'},
  history:{title:'Maintain your health history',short:'Keep reports, prescriptions and past care organised.',detail:'Carry your health story forward instead of searching for old records before every visit.',accent:'#2563EB',icon:'▤'},
  doctor:{title:'Prepare for qualified care',short:'Move from your health context into doctor discovery and consultation.',detail:'Use organised health information to prepare better questions and make the next care conversation more useful.',accent:'#EA580C',icon:'✚'},
  community:{title:'You are not alone',short:'Join a relevant Health Community when peer support can help.',detail:'Connect with people living through similar everyday challenges while professional care remains central.',accent:'#7C3AED',icon:'◎'},
};

export default function AudienceJourneys(){
  const router=useRouter();
  const {user,isAuthenticated}=useAuthStore();
  const {openAuthModal}=useUIStore();
  const [slide,setSlide]=useState(0);
  const [paused,setPaused]=useState(false);
  const [activeBenefit,setActiveBenefit]=useState<BenefitKey>('track');
  const touchStart=useRef<number|null>(null);

  useEffect(()=>{
    if(paused||typeof window==='undefined'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const timer=window.setInterval(()=>setSlide(current=>(current+1)%2),7200);
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
    if(touchStart.current==null)return;
    const end=event.changedTouches[0]?.clientX??touchStart.current;
    if(Math.abs(end-touchStart.current)>48)setSlide(end>touchStart.current?0:1);
    touchStart.current=null;
  };

  const active=BENEFITS[activeBenefit];

  return <section className="journey-root" id="platform-tour">
    <style>{`
      .journey-root{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#fff}
      .journey-nav-wrap{max-width:1380px;margin:0 auto;padding:34px 28px 0}.journey-nav-title{text-align:center;color:#0B7E72;font-size:13px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;margin-bottom:15px}.journey-nav{padding:14px;border-radius:22px;background:linear-gradient(120deg,#064E49,#0B7168);display:grid;grid-template-columns:repeat(6,1fr);gap:10px;box-shadow:0 16px 34px rgba(5,73,67,.14)}
      .journey-pill{min-height:96px;border:0;border-radius:16px;padding:14px 13px;text-align:left;display:flex;align-items:center;gap:11px;cursor:pointer;transition:transform .17s ease,box-shadow .17s ease}.journey-pill:hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(0,0,0,.12)}.journey-icon{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;flex:0 0 auto;background:rgba(255,255,255,.8);font-size:19px;font-weight:900}.journey-pill b{display:block;font-size:14px;line-height:1.25;color:#10243C}.journey-pill span:last-child{display:block;margin-top:4px;font-size:12px;line-height:1.3;color:#405D70}
      .myhealth-section{padding:86px 28px 90px}.myhealth-shell{max-width:1380px;margin:0 auto}.myhealth-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(340px,.58fr);gap:48px;align-items:end;margin-bottom:26px}.myhealth-label{font-size:13px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#0B8F7C;margin-bottom:9px}.myhealth-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.45rem,3.25vw,3.6rem);line-height:1.04;letter-spacing:-.05em;color:#0B2B45;margin:0}.myhealth-head p{font-size:17px;line-height:1.62;color:#35566A;margin:0 0 4px}
      .health-carousel{position:relative;overflow:hidden;border:1px solid #C6E0D9;border-radius:30px;box-shadow:0 22px 54px rgba(27,83,73,.09);background:#EAF8F4}.health-slide{position:relative;aspect-ratio:16/9;min-height:590px;overflow:hidden;background:linear-gradient(125deg,#DFF5EF 0%,#F8FCFB 50%,#E9F8F4 100%)}.health-slide:before{content:'';position:absolute;width:640px;height:640px;right:-220px;top:-320px;border-radius:50%;background:radial-gradient(circle,rgba(35,188,151,.25),rgba(35,188,151,0) 68%)}
      .health-slide-copy{position:absolute;z-index:5;left:52px;top:44px;max-width:760px}.health-eyebrow{font-size:12.5px;font-weight:900;letter-spacing:.15em;text-transform:uppercase;color:#0B8F7C;margin-bottom:9px}.health-slide-copy h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.25rem,2.85vw,3.15rem);line-height:1.04;letter-spacing:-.045em;color:#0B2B45;margin:0}.health-slide-copy p{font-size:15.5px;line-height:1.58;color:#35566A;margin:12px 0 0;max-width:680px}
      .benefit-canvas{position:absolute;left:4.5%;right:4.5%;bottom:8%;height:58%;border-radius:24px;background:linear-gradient(135deg,#0A7166 0%,#0D8E7D 52%,#73D9C1 100%);box-shadow:0 20px 42px rgba(12,111,100,.18);overflow:hidden}.benefit-canvas:before,.benefit-canvas:after{content:'';position:absolute;border:1px solid rgba(255,255,255,.28);border-radius:50%;left:50%;top:50%;transform:translate(-50%,-50%)}.benefit-canvas:before{width:360px;height:360px}.benefit-canvas:after{width:520px;height:520px}.benefit-center{position:absolute;z-index:3;left:50%;top:50%;transform:translate(-50%,-50%);width:210px;height:210px;border-radius:50%;background:#fff;box-shadow:0 18px 36px rgba(0,0,0,.16);display:grid;place-items:center;text-align:center;padding:24px}.benefit-center i{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:#E4F5F0;color:#0B8F7C;font-style:normal;font-size:25px;margin:0 auto 9px}.benefit-center b{font-family:'Sora','DM Sans',sans-serif;font-size:18px;line-height:1.2;color:#14384A}.benefit-center span{display:block;margin-top:7px;font-size:12.5px;line-height:1.42;color:#526A76}
      .benefit-card{position:absolute;z-index:4;width:265px;border:1px solid rgba(255,255,255,.7);background:rgba(255,255,255,.94);border-radius:17px;padding:15px;text-align:left;cursor:pointer;box-shadow:0 12px 28px rgba(6,70,63,.12);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}.benefit-card:hover,.benefit-card.active{transform:translateY(-3px);box-shadow:0 16px 34px rgba(6,70,63,.17)}.benefit-card.one{left:4%;top:9%}.benefit-card.two{right:4%;top:9%}.benefit-card.three{left:4%;bottom:9%}.benefit-card.four{right:4%;bottom:9%}.benefit-card-head{display:flex;align-items:center;gap:10px;margin-bottom:6px}.benefit-card i{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;font-style:normal;font-size:18px}.benefit-card b{font-size:13.5px;color:#173B46}.benefit-card p{font-size:12.2px;line-height:1.42;color:#506A76;margin:0}
      .continuity-canvas{position:absolute;left:4.5%;right:4.5%;bottom:8%;height:58%;border-radius:24px;background:linear-gradient(135deg,#073F3C 0%,#0A615B 44%,#167D70 100%);box-shadow:0 20px 42px rgba(7,77,72,.2);overflow:hidden}.continuity-canvas:before{content:'';position:absolute;left:7%;right:7%;top:54%;height:2px;background:linear-gradient(90deg,rgba(255,255,255,.2),rgba(255,255,255,.8),rgba(255,255,255,.2))}.continuity-intro{position:absolute;left:4%;top:9%;max-width:300px;color:#fff}.continuity-intro b{font-family:'Sora','DM Sans',sans-serif;font-size:18px}.continuity-intro p{font-size:12.5px;line-height:1.45;color:#D7EFEB;margin:7px 0 0}.continuity-nodes{position:absolute;left:5%;right:5%;top:46%;display:grid;grid-template-columns:repeat(5,1fr);gap:12px}.continuity-node{text-align:center;color:#fff}.continuity-node i{width:62px;height:62px;border-radius:18px;background:#fff;display:grid;place-items:center;margin:0 auto 9px;color:#0B8F7C;font-style:normal;font-size:23px;box-shadow:0 9px 20px rgba(0,0,0,.16)}.continuity-node:nth-child(4) i{color:#EA580C}.continuity-node:nth-child(5) i{color:#7C3AED}.continuity-node b{display:block;font-size:12px;line-height:1.22}.continuity-node span{display:block;margin-top:4px;font-size:10.8px;line-height:1.32;color:#CDE5E1}.continuity-note{position:absolute;right:4%;top:9%;max-width:330px;padding:13px 15px;border-radius:14px;background:rgba(255,255,255,.94);color:#234653}.continuity-note b{display:block;font-size:12.5px;color:#0B665C}.continuity-note span{display:block;margin-top:4px;font-size:11.3px;line-height:1.42}
      .health-dots{position:absolute;z-index:8;left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:8px}.health-dot{width:10px;height:10px;border:0;border-radius:999px;background:#B6CFC9;padding:0;cursor:pointer}.health-dot.active{width:30px;background:#0B8F7C}.myhealth-cta-row{display:flex;align-items:center;gap:14px;margin-top:18px}.myhealth-cta{border:0;border-radius:10px;background:#0B8F7C;color:#fff;padding:12px 18px;font:900 13.5px 'DM Sans',Arial,sans-serif;cursor:pointer}.myhealth-note{font-size:13px;color:#587080}.fade-in{animation:fadeIn .35s ease both}@keyframes fadeIn{from{opacity:.2;transform:translateY(3px)}to{opacity:1;transform:none}}
      @media(max-width:1080px){.journey-nav{grid-template-columns:repeat(3,1fr)}.myhealth-head{grid-template-columns:1fr;gap:12px}.health-slide{aspect-ratio:auto;min-height:760px}.benefit-canvas,.continuity-canvas{top:220px;bottom:60px;height:auto}.benefit-card{width:235px}.benefit-center{width:180px;height:180px}.continuity-nodes{top:48%}}
      @media(max-width:720px){.journey-nav-wrap{padding:24px 14px 0}.journey-nav{grid-template-columns:1fr 1fr}.journey-pill{min-height:84px}.myhealth-section{padding:62px 14px 70px}.myhealth-head h2{font-size:2.5rem}.health-slide{min-height:900px}.health-slide-copy{left:22px;right:22px;top:28px}.health-slide-copy h3{font-size:2.25rem}.benefit-canvas,.continuity-canvas{left:18px;right:18px;top:235px;bottom:58px}.benefit-canvas:before,.benefit-canvas:after{display:none}.benefit-center{position:absolute;top:50%;width:150px;height:150px;padding:16px}.benefit-card{width:42%;padding:12px}.benefit-card.one,.benefit-card.three{left:3%}.benefit-card.two,.benefit-card.four{right:3%}.benefit-card b{font-size:12px}.benefit-card p{font-size:11px}.continuity-intro{left:18px;right:18px;max-width:none}.continuity-note{left:18px;right:18px;top:105px;max-width:none}.continuity-canvas:before{display:none}.continuity-nodes{top:220px;bottom:24px;grid-template-columns:1fr;gap:12px}.continuity-node{display:flex;align-items:center;text-align:left;gap:12px;padding-left:18%}.continuity-node i{width:46px;height:46px;margin:0}.continuity-node span{font-size:11px}}
      @media(max-width:480px){.journey-nav{grid-template-columns:1fr}.benefit-center{display:none}.benefit-card{width:44%}.benefit-card p{font-size:10.8px}.myhealth-cta-row{align-items:flex-start;flex-direction:column}}
    `}</style>

    <div className="journey-nav-wrap">
      <div className="journey-nav-title">Explore HealthConnect</div>
      <div className="journey-nav">{NAV_ITEMS.map(item=><button key={item.label} type="button" className="journey-pill" style={{background:item.wash}} onClick={()=>goto(item.target)}><span className="journey-icon" style={{color:item.accent}}>{item.icon}</span><span><b>{item.label}</b><span>{item.sub}</span></span></button>)}</div>
    </div>

    <section className="myhealth-section" id="my-health-story">
      <div className="myhealth-shell">
        <div className="myhealth-head"><div><div className="myhealth-label">My Health · Patient Dashboard</div><h2>Understand your health. Keep your journey together.</h2></div><p>My Health is your private health companion for tracking what matters, maintaining your history, preparing for qualified care and finding support between visits.</p></div>
        <div className="health-carousel" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={()=>setPaused(false)} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {slide===0?<div className="health-slide fade-in"><div className="health-slide-copy"><div className="health-eyebrow">What My Health helps you do</div><h3>More than storage — a clearer way to manage your health.</h3><p>Select a benefit to see how My Health supports you. These cards explain the module; they do not send you to login.</p></div><div className="benefit-canvas"><div className="benefit-center"><div><i style={{color:active.accent}}>♥</i><b>{active.title}</b><span>{active.detail}</span></div></div>{(Object.keys(BENEFITS) as BenefitKey[]).map((key,index)=>{const item=BENEFITS[key];return <button key={key} type="button" className={`benefit-card ${['one','two','three','four'][index]} ${activeBenefit===key?'active':''}`} style={{borderColor:activeBenefit===key?item.accent:undefined}} onClick={()=>setActiveBenefit(key)}><div className="benefit-card-head"><i style={{background:`${item.accent}16`,color:item.accent}}>{item.icon}</i><b>{item.title}</b></div><p>{item.short}</p></button>})}</div></div>:<div className="health-slide fade-in"><div className="health-slide-copy"><div className="health-eyebrow">From today to your next care step</div><h3>Your health history should help you move forward.</h3><p>HealthConnect connects the information you keep with reminders, doctor care, follow-up and peer support — so the journey does not stop at storage.</p></div><div className="continuity-canvas"><div className="continuity-intro"><b>One connected patient journey</b><p>Your health information stays useful because it connects naturally to what comes next.</p></div><div className="continuity-note"><b>You stay in control</b><span>Private health information remains in your authenticated patient workspace while public discovery and community participation stay separate.</span></div><div className="continuity-nodes"><div className="continuity-node"><i>◔</i><div><b>Track</b><span>Symptoms, vitals, medicines</span></div></div><div className="continuity-node"><i>▤</i><div><b>History</b><span>Reports, prescriptions, past care</span></div></div><div className="continuity-node"><i>◷</i><div><b>Prepare</b><span>Reminders and upcoming care</span></div></div><div className="continuity-node"><i>✚</i><div><b>Consult</b><span>Qualified doctors and follow-up</span></div></div><div className="continuity-node"><i>◎</i><div><b>Connect</b><span>Relevant Health Communities</span></div></div></div></div></div>}
          <div className="health-dots" aria-label="My Health stories"><button type="button" aria-label="Show My Health benefits" className={`health-dot ${slide===0?'active':''}`} onClick={()=>setSlide(0)}/><button type="button" aria-label="Show connected patient journey" className={`health-dot ${slide===1?'active':''}`} onClick={()=>setSlide(1)}/></div>
        </div>
        <div className="myhealth-cta-row"><button type="button" className="myhealth-cta" onClick={openPatient}>Explore My Health →</button><span className="myhealth-note">Sign in is required only when you choose to enter your private patient workspace.</span></div>
      </div>
    </section>
  </section>;
}
