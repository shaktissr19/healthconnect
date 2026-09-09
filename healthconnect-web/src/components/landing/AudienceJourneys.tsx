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

const PRIMARY_FEATURES=[
  {title:'Check Health Score',copy:'See your overall health picture and where attention may help.',icon:'pulse',accent:'#087D72',wash:'#EEF6F4'},
  {title:'Book Appointments',copy:'Find care and keep upcoming bookings organised in one journey.',icon:'calendar',accent:'#2459C4',wash:'#EEF3F9'},
] as const;

const SUPPORT_FEATURES=[
  {title:'Track Medications',icon:'pill',accent:'#6D45C6',wash:'#F0ECF7'},
  {title:'Health Communities',icon:'community',accent:'#C4531A',wash:'#F7EEE8'},
  {title:'Reports & History',icon:'chat',accent:'#2459C4',wash:'#EDF2F8'},
  {title:'Secure & Private',icon:'shield',accent:'#167044',wash:'#EEF4F0'},
] as const;

const CARE_STEPS=[
  {title:'Appointments',icon:'calendar'},
  {title:'Medications',icon:'pill'},
  {title:'Health Score',icon:'pulse'},
  {title:'Communities',icon:'community'},
] as const;

const PHOTOS={
  patient:'/images/my-health/patient-main.png',
  consultation:'/images/my-health/consultation.png',
  community:'/images/my-health/community-main.png',
} as const;

function Icon({kind,size=22}:{kind:string;size?:number}){
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
  const goto=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});
  const hideBrokenImage=(event:SyntheticEvent<HTMLImageElement>)=>{event.currentTarget.style.display='none';};

  return <section className="journey-root" id="platform-tour">
    <style>{`
      .journey-root{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#F4F6F8}
      .journey-nav-wrap{width:min(calc(100% - 44px),1360px);margin:0 auto;padding:18px 0 10px}.journey-nav-title{text-align:center;color:#17354A;font-size:11.5px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;margin-bottom:8px}.journey-nav{display:grid;grid-template-columns:repeat(6,1fr);gap:7px;padding:8px;border-radius:17px;background:linear-gradient(120deg,#17384A,#214A5B);box-shadow:0 10px 24px rgba(17,48,64,.10)}.journey-pill{min-height:60px;border:0;border-radius:12px;padding:8px 9px;display:flex;align-items:center;gap:8px;color:#14384B;text-align:left;cursor:pointer;transition:transform .17s ease,box-shadow .17s ease}.journey-pill:hover{transform:translateY(-2px);box-shadow:0 7px 16px rgba(0,0,0,.10)}.journey-pill:focus-visible{outline:3px solid rgba(255,255,255,.8);outline-offset:2px}.journey-icon{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:rgba(255,255,255,.78);flex:0 0 auto}.journey-pill b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:11.5px;line-height:1.18;color:#10243C}.journey-pill small{display:block;margin-top:2px;font-size:9.3px;line-height:1.22;color:#526B7B}

      .mh-section{padding:28px 22px 32px;background:#F5F7F8;scroll-margin-top:76px}.mh-shell{width:min(100%,1380px);margin:0 auto}.mh-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.55fr);gap:38px;align-items:end;margin-bottom:16px;padding:0 6px}.mh-kicker{font-size:12px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#137B73;margin-bottom:7px}.mh-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.05rem,2.65vw,2.85rem);line-height:1.02;letter-spacing:-.05em;color:#0B2B45;margin:0}.mh-head p{font-size:15px;line-height:1.48;color:#405D70;margin:0 0 4px;max-width:470px}

      .mh-canvas{overflow:hidden;border-radius:24px;border:1px solid #D3DDE3;background:#fff;box-shadow:0 14px 32px rgba(25,55,72,.07)}.mh-primary{position:relative;min-height:420px;overflow:hidden;background:linear-gradient(105deg,#FFFFFF 0%,#F8FAFB 49%,#E9EEF1 100%)}.mh-main-photo{position:absolute;z-index:0;right:0;top:0;width:61%;height:100%;object-fit:cover;object-position:center 38%;display:block}.mh-primary:after{content:'';position:absolute;z-index:1;inset:0;background:linear-gradient(90deg,#FFFFFF 0%,#FFFFFF 43%,rgba(255,255,255,.96) 49%,rgba(255,255,255,.74) 57%,rgba(255,255,255,.16) 68%,transparent 78%);pointer-events:none}
      .mh-left{position:relative;z-index:2;width:57%;padding:29px 30px 26px 34px;box-sizing:border-box}.mh-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.7rem,2.05vw,2.25rem);line-height:1.04;letter-spacing:-.045em;color:#0B2B45;margin:0}.mh-title span{display:block;color:#137B73}.mh-subcopy{font-size:13.8px;line-height:1.48;color:#486474;margin:9px 0 13px;max-width:600px}.mh-rule{width:42px;height:3px;border-radius:999px;background:#137B73;margin-bottom:13px}
      .mh-featured{display:grid;grid-template-columns:1fr 1fr;gap:9px}.mh-featured-item{min-width:0;padding:12px 13px;border-radius:14px;border:1px solid #DCE3E8;display:grid;grid-template-columns:40px 1fr;gap:10px;align-items:start}.mh-feature-icon{width:38px;height:38px;border-radius:11px;display:grid;place-items:center}.mh-featured-item h3{font-family:'Sora','DM Sans',sans-serif;font-size:13.5px;line-height:1.23;margin:1px 0 3px;color:#102E43}.mh-featured-item p{font-size:11.8px;line-height:1.38;color:#526B7B;margin:0}
      .mh-support-list{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;margin-top:10px}.mh-support-item{display:grid;grid-template-columns:30px 1fr;gap:8px;align-items:center;padding:7px 3px;border-bottom:1px solid #E0E5E9}.mh-support-icon{width:29px;height:29px;border-radius:8px;display:grid;place-items:center}.mh-support-item b{font-family:'Sora','DM Sans',sans-serif;font-size:12px;line-height:1.22;color:#18384A}

      .mh-score{position:absolute;z-index:4;left:58%;top:18px;width:184px;padding:12px 13px 10px;border-radius:15px;background:rgba(255,255,255,.95);border:1px solid #D4DEE4;box-shadow:0 10px 22px rgba(26,63,74,.10);backdrop-filter:blur(8px)}.mh-score-head{display:flex;align-items:center;justify-content:space-between;gap:7px;font-size:11.8px;font-weight:900;color:#15364D}.mh-gauge{position:relative;height:70px;display:grid;place-items:center}.mh-gauge svg{position:absolute;width:92px;height:56px;top:6px}.mh-score-num{position:relative;margin-top:11px;text-align:center;font-family:'Sora','DM Sans',sans-serif;font-size:29px;font-weight:800;color:#0B2B45;line-height:1}.mh-score-num small{display:block;font-family:'DM Sans',Arial,sans-serif;font-size:10px;margin-top:3px;font-weight:800}.mh-score-row{display:grid;grid-template-columns:1fr auto;gap:6px;padding:4px 0;border-top:1px solid #E2E8EC;font-size:10px;color:#365468}.mh-score-row b{font-size:10px;color:#137B73}.mh-score-row.attn b{color:#C65D18}.mh-score-foot{display:flex;justify-content:space-between;align-items:center;padding-top:5px;border-top:1px solid #E2E8EC;font-size:9.5px;color:#647B89}
      .mh-steps{position:absolute;z-index:4;left:59%;right:18px;bottom:18px;display:grid;grid-template-columns:repeat(4,1fr);gap:5px;padding:7px;border-radius:13px;background:rgba(248,250,251,.94);border:1px solid #D6E0E5;box-shadow:0 8px 20px rgba(25,61,80,.08);backdrop-filter:blur(8px)}.mh-step{min-width:0;display:flex;align-items:center;gap:6px;padding:4px 5px}.mh-step-icon{width:29px;height:29px;border-radius:50%;display:grid;place-items:center;flex:0 0 auto;background:#E7F1EF;color:#137B73}.mh-step:nth-child(4) .mh-step-icon{color:#6D45C6;background:#F0ECF7}.mh-step b{font-size:10px;line-height:1.15;color:#15364D}

      .mh-care-grid{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #D9E1E6;background:#F1F4F6}.mh-care-card{min-width:0;min-height:94px;display:grid;grid-template-columns:110px 1fr auto;align-items:stretch;background:transparent}.mh-care-card+.mh-care-card{border-left:1px solid #D5DEE4}.mh-care-photo{width:110px;height:94px;object-fit:cover;display:block}.mh-care-copy{padding:12px 11px;align-self:center}.mh-care-copy h3{font-family:'Sora','DM Sans',sans-serif;font-size:13px;color:#17384A;margin:0 0 3px}.mh-care-copy p{font-size:11.8px;line-height:1.38;color:#526B7B;margin:0}.mh-action{align-self:center;margin-right:14px;border:0;border-radius:9px;background:#137B73;color:#fff;padding:9px 12px;font-size:11px;font-weight:900;cursor:pointer;white-space:nowrap}.mh-action:hover{background:#0F6963}
      .mh-bottom{display:grid;grid-template-columns:repeat(4,1fr);align-items:center;min-height:58px;background:#17384A;color:#fff}.mh-bottom-item{min-width:0;padding:10px 14px;display:grid;grid-template-columns:30px 1fr;gap:8px;align-items:center}.mh-bottom-item+.mh-bottom-item{border-left:1px solid rgba(255,255,255,.12)}.mh-bottom-icon{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.10);color:#A9EDE2}.mh-bottom-item b{display:block;font-size:11px;line-height:1.2;color:#fff}.mh-bottom-item span{display:block;margin-top:2px;font-size:10px;line-height:1.28;color:#D4E1E6}

      @media(max-width:1100px){.journey-nav{grid-template-columns:repeat(3,1fr)}.mh-head{grid-template-columns:1fr;gap:9px}.mh-head p{max-width:760px}.mh-primary{min-height:0;display:flex;flex-direction:column}.mh-main-photo{position:relative;order:1;width:100%;height:410px;object-position:center 35%}.mh-primary:after{background:linear-gradient(180deg,rgba(255,255,255,.06) 48%,#FFFFFF 100%)}.mh-left{order:2;width:100%;padding:25px}.mh-score{left:20px;top:20px}.mh-steps{left:20px;right:20px;bottom:auto;top:327px}.mh-care-card{grid-template-columns:100px 1fr auto}.mh-care-photo{width:100px}.mh-bottom{grid-template-columns:1fr 1fr}.mh-bottom-item:nth-child(3){border-left:0;border-top:1px solid rgba(255,255,255,.12)}.mh-bottom-item:nth-child(4){border-top:1px solid rgba(255,255,255,.12)}}
      @media(max-width:720px){.journey-nav-wrap{width:min(calc(100% - 24px),1380px)}.journey-nav{grid-template-columns:1fr 1fr}.mh-section{padding:24px 12px 28px}.mh-head h2{font-size:2.05rem}.mh-head p{font-size:14px}.mh-main-photo{height:340px}.mh-steps{top:268px;grid-template-columns:1fr 1fr}.mh-featured,.mh-support-list{grid-template-columns:1fr}.mh-care-grid{grid-template-columns:1fr}.mh-care-card+.mh-care-card{border-left:0;border-top:1px solid #D5DEE4}.mh-bottom{grid-template-columns:1fr}}
      @media(max-width:470px){.journey-nav{grid-template-columns:1fr}.mh-main-photo{height:300px}.mh-score{width:168px}.mh-steps{position:relative;left:auto;right:auto;top:auto;bottom:auto;order:3;margin:12px}.mh-score-row{font-size:10px}.mh-left{padding:22px 18px}.mh-care-card{grid-template-columns:88px 1fr}.mh-care-photo{width:88px}.mh-action{grid-column:1/-1;margin:0 12px 12px;width:calc(100% - 24px)}}
    `}</style>

    <div className="journey-nav-wrap">
      <div className="journey-nav-title">Explore HealthConnect</div>
      <div className="journey-nav">
        {NAV_ITEMS.map(item=><button key={item.label} type="button" className="journey-pill" style={{background:item.wash}} onClick={()=>goto(item.target)}><span className="journey-icon" style={{color:item.accent}}><Icon kind={item.icon} size={18}/></span><span><b>{item.label}</b><small>{item.sub}</small></span></button>)}
      </div>
    </div>

    <section className="mh-section" id="my-health-story" aria-labelledby="my-health-title">
      <div className="mh-shell">
        <div className="mh-head">
          <div><div className="mh-kicker">My Health · Patient Dashboard</div><h2 id="my-health-title">Understand your health.<br/>Keep your journey together.</h2></div>
          <p>Track health, history, appointments and support in one private workspace, with the next care step always close at hand.</p>
        </div>

        <div className="mh-canvas">
          <div className="mh-primary">
            <img className="mh-main-photo" src={PHOTOS.patient} alt="Indian patient using HealthConnect on a smartphone" loading="lazy" decoding="async" onError={hideBrokenImage}/>
            <div className="mh-left">
              <h3 className="mh-title">Your health.<span>All in one place.</span></h3>
              <p className="mh-subcopy">Start with the two actions people use most, then keep the rest of the journey close at hand.</p>
              <div className="mh-rule"/>
              <div className="mh-featured">
                {PRIMARY_FEATURES.map(feature=><article className="mh-featured-item" key={feature.title} style={{background:feature.wash}}><div className="mh-feature-icon" style={{background:'rgba(255,255,255,.72)',color:feature.accent}}><Icon kind={feature.icon} size={20}/></div><div><h3>{feature.title}</h3><p>{feature.copy}</p></div></article>)}
              </div>
              <div className="mh-support-list">
                {SUPPORT_FEATURES.map(feature=><div className="mh-support-item" key={feature.title}><span className="mh-support-icon" style={{background:feature.wash,color:feature.accent}}><Icon kind={feature.icon} size={16}/></span><b>{feature.title}</b></div>)}
              </div>
            </div>

            <aside className="mh-score" aria-label="Illustrative Health Score preview">
              <div className="mh-score-head"><span>Your Health Score</span><InfoPopover ariaLabel="About Health Score" title="How Health Score works" width={230}>The 84 shown here is an illustrative landing-page example. In My Health, your score uses health information available in your profile across measurable areas such as physical health, wellbeing and lifestyle. It is not a diagnosis, and assessment completion is shown separately from the score.</InfoPopover></div>
              <div className="mh-gauge"><svg viewBox="0 0 120 70" aria-hidden="true"><path d="M12 60 A48 48 0 0 1 108 60" fill="none" stroke="#D7E3E5" strokeWidth="10" strokeLinecap="round"/><path d="M12 60 A48 48 0 0 1 96 28" fill="none" stroke="#14B8A6" strokeWidth="10" strokeLinecap="round"/></svg><div className="mh-score-num">84<small>Good</small></div></div>
              <div className="mh-score-row"><span>Physical Health</span><b>Good</b></div><div className="mh-score-row"><span>Mental Wellbeing</span><b>Good</b></div><div className="mh-score-row attn"><span>Lifestyle</span><b>Needs Attention</b></div><div className="mh-score-foot"><span>Illustrative preview</span><Icon kind="clock" size={14}/></div>
            </aside>

            <div className="mh-steps" aria-label="Connected My Health journey">
              {CARE_STEPS.map(step=><div className="mh-step" key={step.title}><div className="mh-step-icon"><Icon kind={step.icon} size={16}/></div><b>{step.title}</b></div>)}
            </div>
          </div>

          <div className="mh-care-grid">
            <article className="mh-care-card"><img className="mh-care-photo" src={PHOTOS.consultation} alt="Doctor consulting with a patient" loading="lazy" decoding="async" onError={hideBrokenImage}/><div className="mh-care-copy"><h3>Connected Care</h3><p>Move from organised health context into doctor discovery and follow-up.</p></div><button type="button" className="mh-action" onClick={()=>router.push('/doctors')}>Consult Now</button></article>
            <article className="mh-care-card"><img className="mh-care-photo" src={PHOTOS.community} alt="HealthConnect community members supporting one another online" loading="lazy" decoding="async" onError={hideBrokenImage}/><div className="mh-care-copy"><h3>Health Community</h3><p>Find condition-focused spaces for learning, sharing and support.</p></div><button type="button" className="mh-action" onClick={()=>router.push('/communities')}>Join Now</button></article>
          </div>

          <div className="mh-bottom">
            <div className="mh-bottom-item"><div className="mh-bottom-icon"><Icon kind="lock" size={17}/></div><div><b>Private & Secure</b><span>Authenticated personal workspace.</span></div></div>
            <div className="mh-bottom-item"><div className="mh-bottom-icon"><Icon kind="clock" size={17}/></div><div><b>All in One Place</b><span>Reports, medicines and appointments.</span></div></div>
            <div className="mh-bottom-item"><div className="mh-bottom-icon"><Icon kind="community" size={17}/></div><div><b>Connected Journey</b><span>Professional care and peer support.</span></div></div>
            <div className="mh-bottom-item"><div className="mh-bottom-icon"><Icon kind="heart" size={17}/></div><div><b>Built around your care</b><span>Keep the next step clear.</span></div></div>
          </div>
        </div>
      </div>
    </section>
  </section>;
}
