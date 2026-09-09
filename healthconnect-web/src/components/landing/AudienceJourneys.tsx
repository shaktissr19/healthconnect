'use client';

import type { CSSProperties, SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import InfoPopover from '@/components/landing/InfoPopover';

const NAV_ITEMS=[
  {label:'My Health',sub:'Track, organise and prepare',target:'my-health-story',accent:'#0F766E',wash:'#DDF3EE',icon:'heart'},
  {label:'Communities',sub:'Peer support between visits',target:'health-communities-story',accent:'#7357D8',wash:'#EDE7FA',icon:'community'},
  {label:'Doctor Platform',sub:'Patients, practice and follow-up',target:'doctor-platform-story',accent:'#2F5BEA',wash:'#E4EBFF',icon:'doctor'},
  {label:'Find Care',sub:'Doctors and hospitals',target:'care-discovery',accent:'#D06B2F',wash:'#F7E7DC',icon:'search'},
  {label:'Knowledge Hub',sub:'Understand, learn and prepare',target:'knowledge-hub',accent:'#147EA7',wash:'#DFF0F6',icon:'book'},
  {label:'Plans',sub:'Simple membership options',target:'plans',accent:'#B7791F',wash:'#F8EFCF',icon:'rupee'},
] as const;

const HEALTH_FEATURES=[
  {title:'Health Score',copy:'See where your health picture may need attention.',icon:'pulse',accent:'#0F766E',wash:'#DDF3EE'},
  {title:'Appointments',copy:'Keep upcoming care organised.',icon:'calendar',accent:'#2F5BEA',wash:'#E4EBFF'},
  {title:'Medications',copy:'Keep medicines and reminders close.',icon:'pill',accent:'#7357D8',wash:'#EDE7FA'},
  {title:'Reports & History',copy:'Bring reports and care history together.',icon:'chat',accent:'#147EA7',wash:'#DFF0F6'},
  {title:'Peer Support',copy:'Find relevant community support between visits.',icon:'community',accent:'#D06B2F',wash:'#F7E7DC'},
  {title:'Private Workspace',copy:'Personal health information stays protected.',icon:'shield',accent:'#13795B',wash:'#E2F2E9'},
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
      .journey-root{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#F6F8FB}.journey-nav-wrap{width:min(calc(100% - 44px),1360px);margin:0 auto;padding:18px 0 12px}.journey-nav-title{text-align:center;color:#17354A;font-size:11.5px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;margin-bottom:8px}.journey-nav{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;padding:9px;border-radius:18px;background:#17384A;box-shadow:0 12px 28px rgba(17,48,64,.12)}.journey-pill{min-height:62px;border:0;border-radius:12px;padding:9px 10px;display:flex;align-items:center;gap:9px;color:#14384B;text-align:left;cursor:pointer;transition:transform .17s ease,box-shadow .17s ease}.journey-pill:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(0,0,0,.11)}.journey-icon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:rgba(255,255,255,.82);flex:0 0 auto}.journey-pill b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:11.7px;line-height:1.18;color:#10243C}.journey-pill small{display:block;margin-top:2px;font-size:9.5px;line-height:1.22;color:#526B7B}
      .mh-section{padding:44px 22px 48px;background:#F3F6FA;scroll-margin-top:76px;border-top:1px solid #DCE4EC}.mh-shell{width:min(100%,1380px);margin:0 auto}.mh-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(330px,.56fr);gap:44px;align-items:end;margin:0 6px 20px}.mh-kicker{font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#0F766E;margin-bottom:7px}.mh-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.05rem,2.7vw,2.95rem);line-height:1.02;letter-spacing:-.05em;color:#102E45;margin:0}.mh-head p{font-size:15.5px;line-height:1.52;color:#4C6678;margin:0 0 4px;max-width:500px}
      .mh-stage{position:relative;min-height:430px;border:1px solid #CAD7E2;border-radius:26px;overflow:hidden;background:linear-gradient(110deg,#FFFFFF 0%,#FFFFFF 49%,#EAF1F8 63%,#DDEBF1 100%);box-shadow:0 16px 36px rgba(24,52,69,.08)}.mh-visual{position:absolute;z-index:0;right:0;top:0;width:54%;height:100%;overflow:hidden;background:linear-gradient(135deg,#E7F1F4 0%,#D7E7EC 100%)}.mh-visual:before{content:'';position:absolute;z-index:2;left:-1px;top:0;bottom:0;width:28%;background:linear-gradient(90deg,#FFFFFF 0%,rgba(255,255,255,.85) 32%,rgba(255,255,255,.30) 72%,transparent 100%);pointer-events:none}.mh-photo{position:absolute;right:4%;bottom:0;width:88%;height:94%;object-fit:contain;object-position:center bottom;display:block}.mh-copy{position:relative;z-index:3;width:56%;padding:32px 34px 28px 38px;box-sizing:border-box}.mh-title-row{display:grid;grid-template-columns:minmax(0,1fr) 196px;gap:18px;align-items:start}.mh-copy h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.7rem,2vw,2.15rem);line-height:1.07;letter-spacing:-.04em;color:#17354A;margin:0}.mh-copy h3 span{display:block;color:#0F766E;margin-top:3px}.mh-intro{font-size:13.4px;line-height:1.45;color:#536B7A;margin:8px 0 12px;max-width:500px}.mh-rule{width:42px;height:3px;border-radius:999px;background:#0F766E;margin-bottom:7px}
      .mh-score-card{border:1px solid #B9CBE0;border-radius:16px;background:linear-gradient(145deg,#EEF3FF 0%,#E6EEF9 100%);padding:11px 12px 10px;box-shadow:0 8px 18px rgba(35,75,120,.08)}.mh-score-top{display:flex;align-items:center;justify-content:space-between;gap:8px}.mh-score-top b{font-size:11px;color:#17354A}.mh-score-body{display:flex;align-items:center;gap:10px;margin-top:6px}.mh-score-gauge{position:relative;width:74px;height:43px;flex:0 0 auto}.mh-score-gauge svg{position:absolute;inset:0;width:74px;height:43px}.mh-score-value{font-family:'Sora','DM Sans',sans-serif;font-size:26px;font-weight:900;line-height:.95;color:#102E45}.mh-score-value span{display:block;margin-top:4px;font:900 9.5px 'DM Sans',Arial,sans-serif;color:#0F766E}.mh-score-meta{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:7px;padding-top:7px;border-top:1px solid #CAD6E4}.mh-score-meta span{font-size:8.8px;color:#61778A}.mh-score-meta b{display:block;color:#2F5BEA;font-size:9px;margin-top:1px}.mh-score-caption{margin-top:6px;font-size:8.8px;color:#6B7F8F}
      .mh-feature-list{display:grid;grid-template-columns:1fr 1fr;gap:0 18px}.mh-feature{display:grid;grid-template-columns:34px 1fr;gap:9px;align-items:start;padding:9px 0;border-bottom:1px solid #DFE6EC}.mh-feature-icon{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:var(--feature-wash);color:var(--feature-accent)}.mh-feature b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:12px;line-height:1.2;color:#17354A}.mh-feature p{font-size:10.7px;line-height:1.33;color:#657A8A;margin:2px 0 0}.mh-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:14px}.mh-action{border-radius:10px;padding:10px 15px;font-size:11.8px;font-weight:900;cursor:pointer;transition:transform .16s ease,box-shadow .16s ease}.mh-action:hover{transform:translateY(-1px)}.mh-action.primary{border:1px solid #2F5BEA;background:#2F5BEA;color:#fff;box-shadow:0 8px 18px rgba(47,91,234,.18)}.mh-action.secondary{background:#F7E7DC;color:#A34F22;border:1px solid #E8C9B4}
      @media(max-width:1050px){.journey-nav{grid-template-columns:repeat(3,1fr)}.mh-head{grid-template-columns:1fr;gap:8px}.mh-stage{min-height:0;padding-top:390px}.mh-visual{top:0;left:0;right:0;width:100%;height:390px}.mh-visual:before{left:0;right:0;top:auto;width:100%;height:30%;bottom:0;background:linear-gradient(180deg,transparent,#FFFFFF)}.mh-photo{right:8%;width:84%;height:94%}.mh-copy{width:100%;padding:28px}.mh-title-row{max-width:760px}}
      @media(max-width:700px){.journey-nav-wrap{width:min(calc(100% - 24px),1380px)}.journey-nav{grid-template-columns:1fr 1fr}.mh-section{padding:36px 12px 40px}.mh-head h2{font-size:2.15rem}.mh-head p{font-size:14.5px}.mh-stage{padding-top:330px}.mh-visual{height:330px}.mh-copy{padding:24px 19px}.mh-title-row{grid-template-columns:1fr}.mh-score-card{width:194px;margin-top:12px}.mh-feature-list{grid-template-columns:1fr}.mh-actions{display:grid;grid-template-columns:1fr 1fr}.mh-action{width:100%}}
      @media(max-width:470px){.journey-nav{grid-template-columns:1fr}.mh-stage{padding-top:295px}.mh-visual{height:295px}.mh-actions{grid-template-columns:1fr}}
    `}</style>

    <div className="journey-nav-wrap"><div className="journey-nav-title">Explore HealthConnect</div><div className="journey-nav">{NAV_ITEMS.map(item=><button key={item.label} type="button" className="journey-pill" style={{background:item.wash}} onClick={()=>goto(item.target)}><span className="journey-icon" style={{color:item.accent}}><Icon kind={item.icon} size={18}/></span><span><b>{item.label}</b><small>{item.sub}</small></span></button>)}</div></div>

    <section className="mh-section" id="my-health-story" aria-labelledby="my-health-title"><div className="mh-shell"><div className="mh-head"><div><div className="mh-kicker">My Health · Patient Dashboard</div><h2 id="my-health-title">Understand your health.<br/>Keep your journey together.</h2></div><p>Track health, history, medicines and appointments in one private workspace, then carry the right context into your next care step.</p></div>
      <div className="mh-stage">
        <div className="mh-visual"><img className="mh-photo" src={PHOTOS.patient} alt="Indian patient using HealthConnect on a smartphone" loading="lazy" decoding="async" onError={hideBrokenImage}/></div>
        <div className="mh-copy">
          <div className="mh-title-row"><div><h3>Your health.<span>All in one place.</span></h3><p className="mh-intro">See the essentials first. Open the dashboard when you need the full detail.</p><div className="mh-rule"/></div><aside className="mh-score-card" aria-label="Illustrative Health Score preview"><div className="mh-score-top"><b>Your Health Score</b><InfoPopover ariaLabel="About Health Score" title="How Health Score works" width={250}>The 84 shown here is an illustrative landing-page example. In My Health, your score is calculated from measurable health information available in your profile. It is not a diagnosis.</InfoPopover></div><div className="mh-score-body"><div className="mh-score-gauge"><svg viewBox="0 0 100 58" aria-hidden="true"><path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="#C9D8E4" strokeWidth="9" strokeLinecap="round"/><path d="M10 50 A40 40 0 0 1 78 22" fill="none" stroke="#18B7A5" strokeWidth="9" strokeLinecap="round"/></svg></div><div className="mh-score-value">84<span>GOOD</span></div></div><div className="mh-score-meta"><span>Physical<b>Good</b></span><span>Lifestyle<b>Review</b></span></div><div className="mh-score-caption">Illustrative preview</div></aside></div>
          <div className="mh-feature-list">{HEALTH_FEATURES.map(feature=><div className="mh-feature" key={feature.title}><span className="mh-feature-icon" style={{'--feature-wash':feature.wash,'--feature-accent':feature.accent} as CSSProperties}><Icon kind={feature.icon} size={17}/></span><div><b>{feature.title}</b><p>{feature.copy}</p></div></div>)}</div>
          <div className="mh-actions"><button type="button" className="mh-action primary" onClick={()=>router.push('/dashboard')}>Open My Health</button><button type="button" className="mh-action secondary" onClick={()=>router.push('/doctors')}>Find a Doctor</button></div>
        </div>
      </div>
    </div></section>
  </section>;
}
