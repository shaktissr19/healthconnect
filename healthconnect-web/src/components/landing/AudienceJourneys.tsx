'use client';

import type { SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import InfoPopover from '@/components/landing/InfoPopover';

const NAV_ITEMS=[
  {label:'My Health',sub:'Track, organise and prepare',target:'my-health-story',accent:'#0B8F7C',wash:'#E4F3EF',icon:'heart'},
  {label:'Communities',sub:'Peer support between visits',target:'health-communities-story',accent:'#6D45C6',wash:'#EEE8F8',icon:'community'},
  {label:'Doctor Platform',sub:'Patients, practice and follow-up',target:'doctor-platform-story',accent:'#2563EB',wash:'#E7EEF9',icon:'doctor'},
  {label:'Find Care',sub:'Doctors and hospitals',target:'care-discovery',accent:'#0F766E',wash:'#E5F1EF',icon:'search'},
  {label:'Knowledge Hub',sub:'Understand, learn and prepare',target:'knowledge-hub',accent:'#0284C7',wash:'#E7F1F7',icon:'book'},
  {label:'Plans',sub:'Simple membership options',target:'plans',accent:'#B45309',wash:'#F6EEE4',icon:'rupee'},
] as const;

const HEALTH_FEATURES=[
  {title:'Check Health Score',copy:'See your overall health picture and where attention may help.',icon:'pulse',accent:'#0F766E'},
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
      .mh-section{padding:42px 22px 46px;background:#F7F8F9;scroll-margin-top:76px;border-top:1px solid #E1E5E8}.mh-shell{width:min(100%,1380px);margin:0 auto}.mh-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.55fr);gap:42px;align-items:end;margin:0 6px 18px}.mh-kicker{font-size:12px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#0F766E;margin-bottom:6px}.mh-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,2.65vw,2.85rem);line-height:1.03;letter-spacing:-.05em;color:#0B2B45;margin:0}.mh-head p{font-size:15px;line-height:1.5;color:#4E6878;margin:0 0 3px;max-width:500px}
      .mh-stage{position:relative;min-height:392px;border:1px solid #D4DDE3;border-radius:23px;overflow:hidden;background:#EEF2F4;box-shadow:0 12px 28px rgba(24,52,69,.06)}.mh-photo{position:absolute;z-index:0;right:14px;top:14px;width:60%;height:calc(100% - 28px);object-fit:contain;object-position:right center;display:block;border-radius:18px;background:#E8EEF0}.mh-stage:after{content:'';position:absolute;z-index:1;inset:0;background:linear-gradient(90deg,#F9FAFB 0%,#F9FAFB 42%,rgba(249,250,251,.97) 50%,rgba(249,250,251,.80) 58%,rgba(249,250,251,.30) 70%,transparent 80%);pointer-events:none}.mh-copy{position:relative;z-index:2;width:56%;padding:29px 30px 26px 34px;box-sizing:border-box}.mh-title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.mh-copy h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.55rem,1.9vw,2rem);line-height:1.08;letter-spacing:-.04em;color:#17354A;margin:0}.mh-copy h3 span{display:block;color:#0F766E;margin-top:2px}.mh-intro{font-size:13.5px;line-height:1.47;color:#536B7A;margin:8px 0 11px;max-width:520px}.mh-rule{width:40px;height:3px;border-radius:999px;background:#0F766E;margin-bottom:7px}
      .mh-score-mini{flex:0 0 156px;border:1px solid #CBD8E2;border-radius:14px;background:#E7EEF5;padding:9px 10px 8px;box-shadow:0 6px 15px rgba(33,67,88,.06)}.mh-score-top{display:flex;align-items:center;justify-content:space-between;gap:6px}.mh-score-top b{font-size:10.5px;color:#17354A}.mh-score-body{display:flex;align-items:center;gap:8px;margin-top:3px}.mh-score-gauge{position:relative;width:54px;height:31px;flex:0 0 auto}.mh-score-gauge svg{position:absolute;inset:0;width:54px;height:31px}.mh-score-value{font-family:'Sora','DM Sans',sans-serif;font-size:22px;font-weight:900;line-height:1;color:#0B2B45}.mh-score-value span{display:block;margin-top:2px;font:800 9px 'DM Sans',Arial,sans-serif;color:#0F766E}.mh-score-caption{margin-top:4px;font-size:8.8px;color:#687E8D}
      .mh-feature-list{display:grid;grid-template-columns:1fr 1fr;gap:0 18px}.mh-feature{display:grid;grid-template-columns:32px 1fr;gap:8px;align-items:start;padding:8px 0;border-bottom:1px solid #E2E7EA}.mh-feature-icon{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;background:#EEF2F4}.mh-feature b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:11.8px;line-height:1.2;color:#17354A}.mh-feature p{font-size:10.5px;line-height:1.33;color:#667B8B;margin:2px 0 0}.mh-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:13px}.mh-action{border:0;border-radius:9px;padding:10px 14px;font-size:11.5px;font-weight:900;cursor:pointer}.mh-action.primary{background:#17384A;color:#fff}.mh-action.secondary{background:#E8EEF4;color:#2459C4;border:1px solid #C9D6E2}
      @media(max-width:1050px){.journey-nav{grid-template-columns:repeat(3,1fr)}.mh-head{grid-template-columns:1fr;gap:8px}.mh-stage{min-height:0;padding-top:390px}.mh-photo{top:14px;left:14px;right:14px;width:calc(100% - 28px);height:360px;object-position:center}.mh-stage:after{background:linear-gradient(180deg,transparent 0%,rgba(249,250,251,.18) 37%,#F9FAFB 55%,#F9FAFB 100%)}.mh-copy{width:100%;padding:26px}.mh-title-row{max-width:720px}}
      @media(max-width:650px){.journey-nav-wrap{width:min(calc(100% - 24px),1380px)}.journey-nav{grid-template-columns:1fr 1fr}.mh-section{padding:34px 12px 38px}.mh-head h2{font-size:2.05rem}.mh-head p{font-size:14px}.mh-stage{padding-top:320px}.mh-photo{height:290px}.mh-copy{padding:22px 18px}.mh-copy h3{font-size:1.8rem}.mh-title-row{display:block}.mh-score-mini{width:154px;margin:12px 0 6px}.mh-feature-list{grid-template-columns:1fr}.mh-actions{display:grid;grid-template-columns:1fr}.mh-action{width:100%}}
      @media(max-width:470px){.journey-nav{grid-template-columns:1fr}.mh-stage{padding-top:290px}.mh-photo{height:260px}}
    `}</style>

    <div className="journey-nav-wrap"><div className="journey-nav-title">Explore HealthConnect</div><div className="journey-nav">{NAV_ITEMS.map(item=><button key={item.label} type="button" className="journey-pill" style={{background:item.wash}} onClick={()=>goto(item.target)}><span className="journey-icon" style={{color:item.accent}}><Icon kind={item.icon} size={18}/></span><span><b>{item.label}</b><small>{item.sub}</small></span></button>)}</div></div>

    <section className="mh-section" id="my-health-story" aria-labelledby="my-health-title"><div className="mh-shell"><div className="mh-head"><div><div className="mh-kicker">My Health · Patient Dashboard</div><h2 id="my-health-title">Understand your health.<br/>Keep your journey together.</h2></div><p>Track health, history, medicines and appointments in one private workspace, then carry the right context into your next care step.</p></div>
      <div className="mh-stage">
        <img className="mh-photo" src={PHOTOS.patient} alt="Indian patient using HealthConnect on a smartphone" loading="lazy" decoding="async" onError={hideBrokenImage}/>
        <div className="mh-copy">
          <div className="mh-title-row"><div><h3>Your health.<span>All in one place.</span></h3><p className="mh-intro">See the essentials at a glance, while detailed tools remain inside My Health.</p></div><aside className="mh-score-mini" aria-label="Illustrative Health Score preview"><div className="mh-score-top"><b>Health Score</b><InfoPopover ariaLabel="About Health Score" title="How Health Score works" width={240}>The score shown here is an illustrative landing-page example. In My Health, the score uses measurable information available in the patient profile and is shown separately from assessment completion. It is not a diagnosis.</InfoPopover></div><div className="mh-score-body"><div className="mh-score-gauge"><svg viewBox="0 0 60 34" aria-hidden="true"><path d="M5 30 A25 25 0 0 1 55 30" fill="none" stroke="#C9D6DE" strokeWidth="6" strokeLinecap="round"/><path d="M5 30 A25 25 0 0 1 48 14" fill="none" stroke="#16A394" strokeWidth="6" strokeLinecap="round"/></svg></div><div className="mh-score-value">84<span>Good</span></div></div><div className="mh-score-caption">Illustrative preview</div></aside></div>
          <div className="mh-rule"/>
          <div className="mh-feature-list">{HEALTH_FEATURES.map(feature=><div className="mh-feature" key={feature.title}><span className="mh-feature-icon" style={{color:feature.accent}}><Icon kind={feature.icon} size={16}/></span><div><b>{feature.title}</b><p>{feature.copy}</p></div></div>)}</div>
          <div className="mh-actions"><button type="button" className="mh-action primary" onClick={()=>router.push('/dashboard')}>Open My Health</button><button type="button" className="mh-action secondary" onClick={()=>router.push('/doctors')}>Find a Doctor</button></div>
        </div>
      </div>
    </div></section>
  </section>;
}
