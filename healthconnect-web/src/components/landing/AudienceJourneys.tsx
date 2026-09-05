'use client';

import { useState, type SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';

const NAV_ITEMS=[
  {label:'My Health',sub:'Track, organise and prepare',target:'my-health-story',accent:'#0B8F7C',wash:'#DDF5EE',icon:'heart'},
  {label:'Health Communities',sub:'Peer support between visits',target:'health-communities-story',accent:'#7C3AED',wash:'#EEE5FF',icon:'community'},
  {label:'Doctor Platform',sub:'Patients, practice and follow-up',target:'doctor-platform-story',accent:'#2563EB',wash:'#E4EDFF',icon:'doctor'},
  {label:'Find Care',sub:'Doctors and hospitals',target:'care-discovery',accent:'#0F766E',wash:'#DDF3EF',icon:'search'},
  {label:'Knowledge Hub',sub:'Understand, learn and prepare',target:'knowledge-hub',accent:'#0284C7',wash:'#E1F3FC',icon:'book'},
  {label:'Plans',sub:'Simple membership options',target:'plans',accent:'#C2410C',wash:'#FCEBDD',icon:'rupee'},
] as const;

const FEATURES=[
  {title:'Check Health Score',copy:'See your overall health picture and understand where attention may be needed.',icon:'pulse',accent:'#0B8F7C',wash:'#E3F7F2'},
  {title:'Book Appointments',copy:'Find trusted doctors and move into your appointment journey.',icon:'calendar',accent:'#2563EB',wash:'#E7F0FF'},
  {title:'Track Medications',copy:'Keep medicines, reminders and medication information organised.',icon:'pill',accent:'#7C3AED',wash:'#F0E8FF'},
  {title:'Health Communities',copy:'Connect with people on similar health journeys and get support between visits.',icon:'community',accent:'#EA580C',wash:'#FFF0E5'},
  {title:'Share Your Journey',copy:'Keep health history, reports, prescriptions and care context together.',icon:'chat',accent:'#2563EB',wash:'#EAF2FF'},
  {title:'Secure & Private',copy:'Your health information stays behind authenticated access and under your control.',icon:'shield',accent:'#15803D',wash:'#E8F7ED'},
] as const;

const CARE_STEPS=[
  {title:'Book Appointments',icon:'calendar'},
  {title:'Track Medications',icon:'pill'},
  {title:'Check Health Score',icon:'pulse'},
  {title:'Join Health Communities',icon:'community'},
] as const;

const PHOTOS={
  patient:'/images/my-health/patient-main.png',
  consultation:'/images/my-health/consultation.png',
  community:'/images/my-health/community-main.png',
} as const;

function Icon({kind,size=24}:{kind:string;size?:number}){
  const common={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.9,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};
  if(kind==='heart') return <svg {...common}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>;
  if(kind==='pulse') return <svg {...common}><path d="M3 12h4l2-5 4 10 2-5h6"/></svg>;
  if(kind==='calendar') return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h3M13 14h3M8 18h3"/></svg>;
  if(kind==='pill') return <svg {...common}><path d="m10.5 13.5 5-5a4 4 0 1 0-5.7-5.7l-5 5a4 4 0 1 0 5.7 5.7Z"/><path d="m7.7 5 5.7 5.7"/></svg>;
  if(kind==='community') return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>;
  if(kind==='chat') return <svg {...common}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3v-7a4 4 0 0 1-1-2.7V8a4 4 0 0 1 4-4h11a4 4 0 0 1 4 4Z"/><path d="M7 10h.01M12 10h.01M17 10h.01"/></svg>;
  if(kind==='shield') return <svg {...common}><path d="M12 3 19 6v5c0 4.8-2.9 8.4-7 10-4.1-1.6-7-5.2-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
  if(kind==='lock') return <svg {...common}><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2"/></svg>;
  if(kind==='clock') return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
  if(kind==='doctor') return <svg {...common}><path d="M8 3v4a4 4 0 0 0 8 0V3M12 11v10M8 15h8M5 21h14"/></svg>;
  if(kind==='search') return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>;
  if(kind==='book') return <svg {...common}><path d="M4 5a3 3 0 0 1 3-3h5v18H7a3 3 0 0 0-3 3Z"/><path d="M20 5a3 3 0 0 0-3-3h-5v18h5a3 3 0 0 1 3 3Z"/></svg>;
  if(kind==='rupee') return <svg {...common}><path d="M7 5h10M7 9h10M8 5c5 0 7 2 7 4s-2 4-7 4l8 7"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
}

export default function AudienceJourneys(){
  const router=useRouter();
  const [scoreInfoPinned,setScoreInfoPinned]=useState(false);
  const [scoreInfoHover,setScoreInfoHover]=useState(false);
  const showScoreInfo=scoreInfoPinned||scoreInfoHover;
  const goto=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});
  const hideBrokenImage=(event:SyntheticEvent<HTMLImageElement>)=>{event.currentTarget.style.display='none';};

  return <section className="journey-root" id="platform-tour">
    <style>{`
      .journey-root{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#fff}
      .journey-nav-wrap{max-width:1380px;margin:0 auto;padding:34px 28px 0}
      .journey-nav-title{text-align:center;color:#0B7E72;font-size:13px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;margin-bottom:15px}
      .journey-nav{padding:14px;border-radius:22px;background:linear-gradient(120deg,#064E49,#0B7168);display:grid;grid-template-columns:repeat(6,1fr);gap:10px;box-shadow:0 16px 34px rgba(5,73,67,.14)}
      .journey-pill{min-height:96px;border:0;border-radius:16px;padding:14px 13px;text-align:left;display:flex;align-items:center;gap:11px;cursor:pointer;transition:transform .17s ease,box-shadow .17s ease}
      .journey-pill:hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(0,0,0,.12)}
      .journey-icon{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;flex:0 0 auto;background:rgba(255,255,255,.82)}
      .journey-pill b{display:block;font-size:14px;line-height:1.25;color:#10243C}
      .journey-pill span:last-child{display:block;margin-top:4px;font-size:12px;line-height:1.3;color:#405D70}

      .mh-section{padding:68px 22px 84px;background:#fff;scroll-margin-top:92px}
      .mh-shell{width:min(100%,1664px);margin:0 auto}
      .mh-head{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(350px,.7fr);gap:56px;align-items:end;margin-bottom:28px;padding:0 10px}
      .mh-kicker{font-size:13px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#0B8F7C;margin-bottom:10px}
      .mh-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.7rem,4vw,4.6rem);line-height:1.02;letter-spacing:-.055em;color:#0B2B45;margin:0}
      .mh-head p{font-size:18px;line-height:1.56;color:#23475E;margin:0 0 5px}

      .mh-canvas{position:relative;aspect-ratio:1664/936;overflow:hidden;border-radius:28px;border:1px solid #B9E2DE;background:linear-gradient(125deg,#F8FCFC 0%,#EFF8F8 42%,#DCEFF1 100%);box-shadow:0 20px 48px rgba(24,69,82,.08)}
      .mh-canvas:before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 39% 37%,rgba(255,255,255,.94) 0 20%,rgba(255,255,255,.48) 34%,transparent 56%);pointer-events:none;z-index:1}
      .mh-main-photo{position:absolute;z-index:0;right:0;top:0;width:62%;height:78%;object-fit:cover;object-position:center 38%;transform:scale(.70);transform-origin:right top;transition:opacity .25s ease,transform .25s ease}
      .mh-photo-fallback{position:absolute;right:0;top:0;width:62%;height:78%;background:linear-gradient(135deg,#DDECEE,#BDDDE0);z-index:0}
      .mh-left{position:absolute;z-index:3;left:2.8%;top:5.6%;width:38.2%}
      .mh-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.9rem,3vw,3.7rem);line-height:1.02;letter-spacing:-.045em;color:#0B2B45;margin:0}
      .mh-title span{display:block;color:#0B948B}
      .mh-subcopy{font-size:clamp(.8rem,1.05vw,1.12rem);line-height:1.55;color:#294A5D;margin:12px 0 18px;max-width:94%}
      .mh-rule{width:42px;height:3px;border-radius:999px;background:#0B948B;margin-bottom:18px}
      .mh-feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
      .mh-feature{min-width:0;padding:16px 15px 15px;border-radius:18px;background:rgba(255,255,255,.9);border:1px solid rgba(203,222,225,.82);box-shadow:0 10px 26px rgba(43,77,89,.07);backdrop-filter:blur(4px);transition:transform .18s ease,box-shadow .18s ease}
      .mh-feature:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(43,77,89,.11)}
      .mh-feature-icon{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;margin-bottom:10px}
      .mh-feature h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(.7rem,.9vw,1rem);line-height:1.25;margin:0 0 6px;color:#10243C}
      .mh-feature p{font-size:clamp(.58rem,.72vw,.8rem);line-height:1.42;color:#486275;margin:0}

      .mh-score{position:absolute;z-index:8;left:44.3%;top:3.4%;width:14.6%;min-width:190px;padding:15px 16px 14px;border-radius:18px;background:rgba(255,255,255,.95);border:1px solid rgba(203,222,225,.86);box-shadow:0 16px 34px rgba(42,72,82,.12);backdrop-filter:blur(8px);transition:transform .18s ease,box-shadow .18s ease}
      .mh-score:hover{transform:translateY(-3px);box-shadow:0 20px 42px rgba(42,72,82,.16)}
      .mh-score-head{display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:900;color:#15364D}
      .mh-info-wrap{position:relative;display:inline-flex}
      .mh-info{width:22px;height:22px;border:1.5px solid #466378;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:900;background:#fff;color:#23475E;cursor:pointer;padding:0;transition:background .16s ease,color .16s ease,border-color .16s ease}
      .mh-info:hover,.mh-info:focus-visible,.mh-info[aria-expanded='true']{background:#0B948B;color:#fff;border-color:#0B948B;outline:none}
      .mh-score-popover{position:absolute;right:-8px;top:30px;width:286px;padding:14px 15px;border-radius:14px;background:#0B2B45;color:#fff;box-shadow:0 18px 42px rgba(11,43,69,.24);font-size:12px;font-weight:500;line-height:1.48;z-index:30}
      .mh-score-popover:before{content:'';position:absolute;right:12px;top:-6px;width:12px;height:12px;background:#0B2B45;transform:rotate(45deg)}
      .mh-score-popover b{display:block;margin-bottom:5px;font-size:12.5px;color:#D9FFFA}
      .mh-gauge{position:relative;height:96px;margin:6px 0 2px;display:grid;place-items:center}
      .mh-gauge svg{position:absolute;width:118px;height:74px;top:13px}
      .mh-score-num{position:relative;margin-top:10px;text-align:center;font-family:'Sora','DM Sans',sans-serif;font-size:36px;font-weight:800;color:#0B2B45;line-height:1}
      .mh-score-num small{display:block;font-family:'DM Sans',Arial,sans-serif;font-size:12px;margin-top:3px;font-weight:800}
      .mh-score-row{display:grid;grid-template-columns:1fr auto;gap:8px;padding:7px 0;border-top:1px solid #E6EEF0;font-size:10.6px;color:#365468}
      .mh-score-row b{font-size:10.2px;color:#0B8F7C}.mh-score-row.attn b{color:#E87922}
      .mh-score-foot{display:flex;justify-content:space-between;align-items:center;padding-top:7px;border-top:1px solid #E6EEF0;font-size:9.7px;color:#647B89}

      .mh-steps{position:absolute;z-index:4;right:2.8%;top:4.7%;width:15.2%;display:grid;gap:14px}
      .mh-step{position:relative;display:grid;grid-template-columns:46px 1fr;gap:12px;align-items:center;min-height:52px}
      .mh-step:not(:last-child):after{content:'';position:absolute;left:22px;top:47px;height:22px;border-left:1.5px dashed rgba(255,255,255,.95)}
      .mh-step-icon{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.95);color:#0B948B;box-shadow:0 8px 20px rgba(42,72,82,.1)}
      .mh-step:nth-child(4) .mh-step-icon{color:#7C3AED}
      .mh-step b{font-size:clamp(.66rem,.82vw,.92rem);line-height:1.22;color:#0B2B45;text-shadow:0 1px 0 rgba(255,255,255,.65)}

      .mh-consult{position:absolute;z-index:5;left:42.4%;top:55.5%;width:30.5%;height:24%;display:grid;grid-template-columns:58% 42%;overflow:hidden;border-radius:18px;background:linear-gradient(135deg,#EDF7F7,#D8ECEE);border:1px solid rgba(203,222,225,.86);box-shadow:0 16px 34px rgba(42,72,82,.1);backdrop-filter:blur(8px)}
      .mh-consult-photo{width:100%;height:100%;object-fit:cover;object-position:center}
      .mh-consult-copy{height:100%;box-sizing:border-box;padding:16px 15px 58px;display:flex;flex-direction:column;min-width:0;background:rgba(255,255,255,.94)}
      .mh-consult-copy h3,.mh-community-copy h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(.75rem,1vw,1.08rem);color:#0B665C;margin:0 0 8px}
      .mh-consult-copy p,.mh-community-copy p{font-size:clamp(.58rem,.72vw,.8rem);line-height:1.5;color:#37566A;margin:0}
      .mh-action{position:absolute;bottom:16px;width:104px;height:34px;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;border:0;border-radius:8px;background:#0B948B;color:#fff;padding:0 10px;line-height:1;font-size:clamp(.56rem,.64vw,.7rem);font-weight:900;cursor:pointer;box-shadow:0 6px 14px rgba(11,148,139,.16);z-index:4}
      .mh-consult>.mh-action{left:calc(58% + 15px)}
      .mh-community-card>.mh-action{left:15px}
      .mh-action:hover{background:#087D75}

      .mh-community-card{position:absolute;z-index:5;right:2.3%;top:55.5%;width:24.4%;height:24%;overflow:hidden;border-radius:18px;background:#EEF7F7;border:1px solid rgba(203,222,225,.86);box-shadow:0 16px 34px rgba(42,72,82,.1)}
      .mh-community-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center center;transform:scale(.9);transform-origin:right center;transition:transform .25s ease}
      .mh-community-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,255,.98) 0%,rgba(255,255,255,.96) 34%,rgba(255,255,255,.82) 50%,rgba(255,255,255,.24) 69%,rgba(255,255,255,0) 100%)}
      .mh-community-copy{position:relative;z-index:2;width:52%;height:100%;box-sizing:border-box;padding:16px 15px 58px;display:flex;flex-direction:column;min-width:0}
      .mh-community-note{display:block;margin-top:7px;font-size:clamp(.5rem,.62vw,.69rem);line-height:1.35;color:#627784}

      .mh-bottom{position:absolute;z-index:6;left:1.2%;right:1.2%;bottom:1.4%;height:14.5%;border-radius:18px;background:rgba(255,255,255,.92);border:1px solid rgba(203,222,225,.78);display:grid;grid-template-columns:1.05fr 1fr 1.05fr 1.35fr;align-items:center;box-shadow:0 10px 25px rgba(42,72,82,.07);backdrop-filter:blur(8px)}
      .mh-bottom-item{min-width:0;padding:0 22px;display:grid;grid-template-columns:46px 1fr;gap:12px;align-items:center}
      .mh-bottom-item+.mh-bottom-item{border-left:1px solid #D9E4E6}
      .mh-bottom-icon{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:#E5F5F2;color:#0B8F7C}
      .mh-bottom-item b{display:block;font-size:clamp(.66rem,.82vw,.92rem);line-height:1.2;color:#0B665C}
      .mh-bottom-item span{display:block;margin-top:4px;font-size:clamp(.53rem,.65vw,.72rem);line-height:1.4;color:#486275}

      @media(max-width:1180px){
        .mh-head{grid-template-columns:1fr;gap:12px}.mh-head p{max-width:760px}
        .mh-score{min-width:170px}.mh-feature{padding:12px}.mh-bottom-item{padding:0 14px;grid-template-columns:38px 1fr}.mh-bottom-icon{width:38px;height:38px}
      }
      @media(max-width:900px){
        .journey-nav{grid-template-columns:repeat(3,1fr)}
        .mh-section{padding:56px 14px 72px}.mh-canvas{aspect-ratio:auto;overflow:visible;border-radius:24px;padding:24px;background:linear-gradient(180deg,#F5FBFB,#EAF6F6)}
        .mh-canvas:before{display:none}.mh-photo-fallback{display:none}
        .mh-main-photo{position:relative;width:100%;height:360px;border-radius:20px;object-position:center 35%;transform:none}
        .mh-left,.mh-score,.mh-steps,.mh-consult,.mh-community-card,.mh-bottom{position:relative;left:auto;right:auto;top:auto;bottom:auto;width:auto;height:auto;min-width:0}
        .mh-left{margin-top:22px}.mh-title{font-size:2.7rem}.mh-subcopy{font-size:1rem}.mh-feature-grid{gap:12px}
        .mh-score{margin:18px 0}.mh-score-popover{right:0;left:auto;width:min(286px,80vw)}
        .mh-steps{grid-template-columns:repeat(4,1fr);gap:10px}.mh-step{grid-template-columns:1fr;text-align:center}.mh-step:not(:last-child):after{display:none}.mh-step-icon{margin:0 auto}.mh-step b{font-size:.78rem}
        .mh-consult{margin-top:18px;min-height:250px}.mh-community-card{margin-top:14px;min-height:280px}.mh-consult-copy,.mh-community-copy{padding:24px 20px 62px}.mh-community-copy{width:48%}.mh-community-photo{object-position:center center;transform:scale(.92);transform-origin:right center}
        .mh-consult>.mh-action{left:calc(58% + 20px);bottom:20px}.mh-community-card>.mh-action{left:20px;bottom:20px}
        .mh-bottom{margin-top:14px;grid-template-columns:1fr 1fr;gap:0}.mh-bottom-item{padding:18px}.mh-bottom-item:nth-child(3){border-left:0;border-top:1px solid #D9E4E6}.mh-bottom-item:nth-child(4){border-top:1px solid #D9E4E6}
      }
      @media(max-width:650px){
        .journey-nav-wrap{padding:24px 14px 0}.journey-nav{grid-template-columns:1fr 1fr}.journey-pill{min-height:84px}
        .mh-section{padding:46px 10px 62px}.mh-head{padding:0 4px}.mh-head h2{font-size:2.55rem}.mh-head p{font-size:16px}
        .mh-canvas{padding:14px}.mh-main-photo{height:290px}.mh-title{font-size:2.25rem}.mh-feature-grid{grid-template-columns:1fr 1fr}.mh-feature h3{font-size:.88rem}.mh-feature p{font-size:.73rem}
        .mh-steps{grid-template-columns:1fr 1fr}.mh-consult{grid-template-columns:1fr;min-height:0}.mh-consult-photo{height:220px}.mh-community-card{min-height:300px}.mh-community-copy{width:64%;padding:22px 18px 62px}.mh-consult-copy{padding:22px 18px 62px}.mh-community-shade{background:linear-gradient(90deg,rgba(255,255,255,.99) 0%,rgba(255,255,255,.96) 45%,rgba(255,255,255,.66) 67%,rgba(255,255,255,.08) 100%)}.mh-community-photo{object-position:58% center;transform:scale(.94)}
        .mh-consult>.mh-action,.mh-community-card>.mh-action{left:18px;bottom:18px}
        .mh-bottom{grid-template-columns:1fr}.mh-bottom-item+.mh-bottom-item{border-left:0;border-top:1px solid #D9E4E6}
      }
      @media(max-width:460px){.journey-nav{grid-template-columns:1fr}.mh-feature-grid{grid-template-columns:1fr}.mh-steps{grid-template-columns:1fr}.mh-main-photo{height:240px}.mh-title{font-size:2rem}.mh-community-copy{width:72%}.mh-community-photo{object-position:62% center;transform:scale(.95)}}
    `}</style>

    <div className="journey-nav-wrap">
      <div className="journey-nav-title">Explore HealthConnect</div>
      <div className="journey-nav">
        {NAV_ITEMS.map(item=><button key={item.label} type="button" className="journey-pill" style={{background:item.wash}} onClick={()=>goto(item.target)}><span className="journey-icon" style={{color:item.accent}}><Icon kind={item.icon} size={20}/></span><span><b>{item.label}</b><span>{item.sub}</span></span></button>)}
      </div>
    </div>

    <section className="mh-section" id="my-health-story" aria-labelledby="my-health-title">
      <div className="mh-shell">
        <div className="mh-head">
          <div><div className="mh-kicker">My Health · Patient Dashboard</div><h2 id="my-health-title">Understand your health.<br/>Keep your journey together.</h2></div>
          <p>My Health is your private health companion for tracking what matters, maintaining your history, preparing for qualified care and finding support between visits.</p>
        </div>

        <div className="mh-canvas">
          <div className="mh-photo-fallback" aria-hidden="true"/>
          <img className="mh-main-photo" src={PHOTOS.patient} alt="Indian patient using HealthConnect on a smartphone" loading="lazy" decoding="async" onError={hideBrokenImage}/>

          <div className="mh-left">
            <h3 className="mh-title">Your health.<span>All in one place.</span></h3>
            <p className="mh-subcopy">Track, understand and take charge of your health with connected care, smart tools and a community that supports you.</p>
            <div className="mh-rule"/>
            <div className="mh-feature-grid">
              {FEATURES.map(feature=><article className="mh-feature" key={feature.title}><div className="mh-feature-icon" style={{background:feature.wash,color:feature.accent}}><Icon kind={feature.icon} size={22}/></div><h3>{feature.title}</h3><p>{feature.copy}</p></article>)}
            </div>
          </div>

          <aside className="mh-score" aria-label="Illustrative Health Score preview">
            <div className="mh-score-head"><span>Your Health Score</span><span className="mh-info-wrap" onMouseEnter={()=>setScoreInfoHover(true)} onMouseLeave={()=>setScoreInfoHover(false)}><button type="button" className="mh-info" aria-label="About Health Score" aria-expanded={showScoreInfo} aria-controls="mh-score-info" onClick={()=>setScoreInfoPinned(value=>!value)} onFocus={()=>setScoreInfoHover(true)} onBlur={()=>setScoreInfoHover(false)} onKeyDown={event=>{if(event.key==='Escape'){setScoreInfoPinned(false);setScoreInfoHover(false);}}}>i</button>{showScoreInfo&&<span className="mh-score-popover" id="mh-score-info" role="tooltip"><b>How Health Score works</b>The 84 shown here is an illustrative landing-page example. In My Health, your score uses the health information available in your profile across measurable areas such as physical health, wellbeing and lifestyle. It is not a diagnosis, and assessment completion is shown separately from the score.</span>}</span></div>
            <div className="mh-gauge">
              <svg viewBox="0 0 120 70" aria-hidden="true"><path d="M12 60 A48 48 0 0 1 108 60" fill="none" stroke="#D7E3E5" strokeWidth="10" strokeLinecap="round"/><path d="M12 60 A48 48 0 0 1 96 28" fill="none" stroke="#14B8A6" strokeWidth="10" strokeLinecap="round"/></svg>
              <div className="mh-score-num">84<small>Good</small></div>
            </div>
            <div className="mh-score-row"><span>Physical Health</span><b>Good</b></div>
            <div className="mh-score-row"><span>Mental Wellbeing</span><b>Good</b></div>
            <div className="mh-score-row attn"><span>Lifestyle</span><b>Needs Attention</b></div>
            <div className="mh-score-foot"><span>Illustrative preview</span><Icon kind="clock" size={15}/></div>
          </aside>

          <div className="mh-steps" aria-label="Connected My Health journey">
            {CARE_STEPS.map(step=><div className="mh-step" key={step.title}><div className="mh-step-icon"><Icon kind={step.icon} size={23}/></div><b>{step.title}</b></div>)}
          </div>

          <article className="mh-consult">
            <img className="mh-consult-photo" src={PHOTOS.consultation} alt="Doctor consulting with a patient" loading="lazy" decoding="async" onError={hideBrokenImage}/>
            <div className="mh-consult-copy"><h3>Connected Care</h3><p>Move from organised health context into doctor discovery, consultation and follow-up.</p></div>
            <button type="button" className="mh-action" onClick={()=>router.push('/doctors')}>Consult Now</button>
          </article>

          <article className="mh-community-card">
            <img className="mh-community-photo" src={PHOTOS.community} alt="HealthConnect community members supporting one another online" loading="lazy" decoding="async" onError={hideBrokenImage}/>
            <div className="mh-community-shade" aria-hidden="true"/>
            <div className="mh-community-copy"><h3>Health Community</h3><p>Real conversations.<br/>Shared experiences.<br/>Support between visits.</p><span className="mh-community-note">Find condition-focused spaces where people can learn, share and feel less alone.</span></div>
            <button type="button" className="mh-action" onClick={()=>router.push('/communities')}>Join Now</button>
          </article>

          <div className="mh-bottom">
            <div className="mh-bottom-item"><div className="mh-bottom-icon"><Icon kind="lock" size={23}/></div><div><b>Private & Secure Workspace</b><span>Personal health information stays behind authenticated access.</span></div></div>
            <div className="mh-bottom-item"><div className="mh-bottom-icon"><Icon kind="clock" size={23}/></div><div><b>All in One Place</b><span>Reports, medicines, appointments and health history together.</span></div></div>
            <div className="mh-bottom-item"><div className="mh-bottom-icon"><Icon kind="community" size={23}/></div><div><b>Connected Care Journey</b><span>Health information, professional care and peer support stay connected.</span></div></div>
            <div className="mh-bottom-item"><div className="mh-bottom-icon"><Icon kind="heart" size={23}/></div><div><b>Built around your care journey</b><span>Organise what matters and move more confidently between each care step.</span></div></div>
          </div>
        </div>
      </div>
    </section>
  </section>;
}