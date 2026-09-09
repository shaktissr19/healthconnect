'use client';

import type { SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';

const NAV_ITEMS=[
  {label:'My Health',sub:'Track, organise and prepare',target:'my-health-story',accent:'#0B8F7C',wash:'#E4F3EF',icon:'heart'},
  {label:'Communities',sub:'Peer support between visits',target:'health-communities-story',accent:'#6D45C6',wash:'#EEE8F8',icon:'community'},
  {label:'Doctor Platform',sub:'Patients, practice and follow-up',target:'doctor-platform-story',accent:'#2563EB',wash:'#E7EEF9',icon:'doctor'},
  {label:'Find Care',sub:'Doctors and hospitals',target:'care-discovery',accent:'#0F766E',wash:'#E5F1EF',icon:'search'},
  {label:'Knowledge Hub',sub:'Understand, learn and prepare',target:'knowledge-hub',accent:'#0284C7',wash:'#E7F1F7',icon:'book'},
  {label:'Plans',sub:'Simple membership options',target:'plans',accent:'#B45309',wash:'#F6EEE4',icon:'rupee'},
] as const;

const HEALTH_FEATURES=[
  {title:'Check Health Score',copy:'See your overall health picture and understand where attention may help.',icon:'pulse',accent:'#0F766E'},
  {title:'Book Appointments',copy:'Find care and keep upcoming bookings organised.',icon:'calendar',accent:'#2459C4'},
  {title:'Track Medications',copy:'Keep medicines and reminders close at hand.',icon:'pill',accent:'#6D45C6'},
  {title:'Reports & History',copy:'Keep reports, history and prescriptions together.',icon:'chat',accent:'#2459C4'},
  {title:'Health Communities',copy:'Find relevant peer support between visits.',icon:'community',accent:'#C4531A'},
  {title:'Secure & Private',copy:'Keep personal health information behind authenticated access.',icon:'shield',accent:'#167044'},
] as const;

const PHOTOS={patient:'/images/my-health/patient-main.png'} as const;

function Icon({kind,size=22}:{kind:string;size?:number}){
  const common={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.9,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};
  if(kind==='heart') return <svg {...common}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>;
  if(kind==='pulse') return <svg {...common}><path d="M3 12h4l2-5 4 10 2-5h6"/></svg>;
  if(kind==='calendar') return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h3M13 14h3M8 18h3"/></svg>;
  if(kind==='pill') return <svg {...common}><path d="m10.5 13.5 5-5a4 4 0 1 0-5.7-5.7l-5 5a4 4 0 1 0 5.7 5.7Z"/><path d="m7.7 5 5.7 5.7"/></svg>;
  if(kind==='community') return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>;
  if(kind==='chat') return <svg {...common}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3v-7a4 4 0 0 1-1-2.7V8a4 4 0 0 1 4-4h11a4 4 0 0 1 4 4Z"/><path d="M7 10h.01M12 10h.01M17 10h.01"/></svg>;
  if(kind==='shield') return <svg {...common}><path d="M12 3 19 6v5c0 4.8-2.9 8.4-7 10-4.1-1.6-7-5.2-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
  if(kind==='doctor') return <svg {...common}><path d="M8 3v4a4 4 0 0 0 8 0V3M12 11v10M8 15h8M5 21h14"/></svg>;
  if(kind==='search') return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>;
  if(kind==='book') return <svg {...common}><path d="M4 5a3 3 0 0 1 3-3h5v18H7a3 3 0 0 0-3 3Z"/><path d="M20 5a3 3 0 0 0-3-3h-5v18h5a3 3 0 0 1 3 3Z"/></svg>;
  if(kind==='rupee') return <svg {...common}><path d="M7 5h10M7 9h10M8 5c5 0 7 2 7 4s-2 4-7 4l8 7"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
}

export default function AudienceJourneys(){
  const router=useRouter();
  const goto=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});
  const hideBrokenImage=(event:SyntheticEvent<HTMLImageElement>)=>{event.currentTarget.style.display='none';};

  return <section className="journey-root" id="platform-tour">
    <style>{`
      .journey-root{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#F4F6F8}.journey-nav-wrap{width:min(calc(100% - 44px),1360px);margin:0 auto;padding:18px 0 10px}.journey-nav-title{text-align:center;color:#17354A;font-size:11.5px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;margin-bottom:8px}.journey-nav{display:grid;grid-template-columns:repeat(6,1fr);gap:7px;padding:8px;border-radius:17px;background:linear-gradient(120deg,#17384A,#214A5B);box-shadow:0 10px 24px rgba(17,48,64,.10)}.journey-pill{min-height:60px;border:0;border-radius:12px;padding:8px 9px;display:flex;align-items:center;gap:8px;color:#14384B;text-align:left;cursor:pointer;transition:transform .17s ease,box-shadow .17s ease}.journey-pill:hover{transform:translateY(-2px);box-shadow:0 7px 16px rgba(0,0,0,.10)}.journey-icon{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:rgba(255,255,255,.78);flex:0 0 auto}.journey-pill b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:11.5px;line-height:1.18;color:#10243C}.journey-pill small{display:block;margin-top:2px;font-size:9.3px;line-height:1.22;color:#526B7B}
      .mh-section{padding:40px 22px 44px;background:#F7F8F9;scroll-margin-top:76px;border-top:1px solid #E1E5E8}.mh-shell{width:min(100%,1380px);margin:0 auto}.mh-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.55fr);gap:42px;align-items:end;margin:0 6px 18px}.mh-kicker{font-size:12px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#0F766E;margin-bottom:6px}.mh-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,2.65vw,2.85rem);line-height:1.03;letter-spacing:-.05em;color:#0B2B45;margin:0}.mh-head p{font-size:15px;line-height:1.5;color:#4E6878;margin:0 0 3px;max-width:500px}
      .mh-main{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);border:1px solid #D4DDE3;border-radius:22px;overflow:hidden;background:#fff;box-shadow:0 12px 28px rgba(24,52,69,.06)}.mh-copy{padding:28px 30px 26px}.mh-copy h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.55rem,1.9vw,2rem);line-height:1.08;letter-spacing:-.04em;color:#17354A;margin:0}.mh-copy h3 span{color:#0F766E}.mh-intro{font-size:13.5px;line-height:1.47;color:#536B7A;margin:8px 0 13px}.mh-rule{width:40px;height:3px;border-radius:999px;background:#0F766E;margin-bottom:9px}.mh-feature-list{display:grid;grid-template-columns:1fr 1fr;gap:0 18px}.mh-feature{display:grid;grid-template-columns:34px 1fr;gap:9px;align-items:start;padding:9px 0;border-bottom:1px solid #E3E8EC}.mh-feature-icon{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:#F1F4F6}.mh-feature b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:12.2px;line-height:1.2;color:#17354A}.mh-feature p{font-size:10.8px;line-height:1.34;color:#667B8B;margin:2px 0 0}.mh-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:14px}.mh-action{border:0;border-radius:9px;padding:10px 13px;font-size:11.5px;font-weight:900;cursor:pointer}.mh-action.primary{background:#17384A;color:#fff}.mh-action.secondary{background:#EEF3F8;color:#2459C4;border:1px solid #D5E0EA}.mh-note{font-size:10.5px;color:#708390;font-weight:800}.mh-photo-wrap{position:relative;min-height:392px;overflow:hidden;background:#E8EDF0}.mh-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 38%;display:block}.mh-photo-wrap:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 82%,rgba(15,39,52,.08));pointer-events:none}
      @media(max-width:1050px){.journey-nav{grid-template-columns:repeat(3,1fr)}.mh-head{grid-template-columns:1fr;gap:8px}.mh-main{grid-template-columns:1fr}.mh-photo-wrap{min-height:410px;order:1}.mh-copy{order:2;padding:26px}}
      @media(max-width:650px){.journey-nav-wrap{width:min(calc(100% - 24px),1380px)}.journey-nav{grid-template-columns:1fr 1fr}.mh-section{padding:34px 12px 38px}.mh-head h2{font-size:2.05rem}.mh-head p{font-size:14px}.mh-copy{padding:22px 18px}.mh-copy h3{font-size:1.8rem}.mh-photo-wrap{min-height:330px}.mh-feature-list{grid-template-columns:1fr}.mh-actions{display:grid;grid-template-columns:1fr}.mh-action{width:100%}}
      @media(max-width:470px){.journey-nav{grid-template-columns:1fr}.mh-photo-wrap{min-height:300px}}
    `}</style>

    <div className="journey-nav-wrap"><div className="journey-nav-title">Explore HealthConnect</div><div className="journey-nav">{NAV_ITEMS.map(item=><button key={item.label} type="button" className="journey-pill" style={{background:item.wash}} onClick={()=>goto(item.target)}><span className="journey-icon" style={{color:item.accent}}><Icon kind={item.icon} size={18}/></span><span><b>{item.label}</b><small>{item.sub}</small></span></button>)}</div></div>

    <section className="mh-section" id="my-health-story" aria-labelledby="my-health-title"><div className="mh-shell"><div className="mh-head"><div><div className="mh-kicker">My Health · Patient Dashboard</div><h2 id="my-health-title">Understand your health.<br/>Keep your journey together.</h2></div><p>Track health, history, appointments and support in one private workspace without covering the primary image in dashboard-style overlays.</p></div>
      <div className="mh-main"><div className="mh-copy"><h3>Your health. <span>All in one place.</span></h3><p className="mh-intro">Keep the actions people use most easy to scan, while the detailed tools stay inside My Health.</p><div className="mh-rule"/><div className="mh-feature-list">{HEALTH_FEATURES.map(feature=><div className="mh-feature" key={feature.title}><span className="mh-feature-icon" style={{color:feature.accent}}><Icon kind={feature.icon} size={17}/></span><div><b>{feature.title}</b><p>{feature.copy}</p></div></div>)}</div><div className="mh-actions"><button type="button" className="mh-action primary" onClick={()=>router.push('/dashboard')}>Open My Health →</button><button type="button" className="mh-action secondary" onClick={()=>router.push('/doctors')}>Find a Doctor →</button><span className="mh-note">Private workspace · connected care journey</span></div></div><div className="mh-photo-wrap"><img className="mh-photo" src={PHOTOS.patient} alt="Indian patient using HealthConnect on a smartphone" loading="lazy" decoding="async" onError={hideBrokenImage}/></div></div>
    </div></section>
  </section>;
}
