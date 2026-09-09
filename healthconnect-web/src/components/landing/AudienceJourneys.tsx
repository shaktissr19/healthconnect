'use client';

import type { SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import InfoPopover from '@/components/landing/InfoPopover';

const NAV_ITEMS=[
  {label:'My Health',sub:'Track, organise and prepare',target:'my-health-story',accent:'#0B8F7C',wash:'#DDF5EE',icon:'heart'},
  {label:'Health Communities',sub:'Peer support between visits',target:'health-communities-story',accent:'#7C3AED',wash:'#EEE5FF',icon:'community'},
  {label:'Doctor Platform',sub:'Patients, practice and follow-up',target:'doctor-platform-story',accent:'#2563EB',wash:'#E4EDFF',icon:'doctor'},
  {label:'Find Care',sub:'Doctors and hospitals',target:'care-discovery',accent:'#0F766E',wash:'#DDF3EF',icon:'search'},
  {label:'Knowledge Hub',sub:'Understand, learn and prepare',target:'knowledge-hub',accent:'#0284C7',wash:'#E1F3FC',icon:'book'},
  {label:'Plans',sub:'Simple membership options',target:'plans',accent:'#C2410C',wash:'#FCEBDD',icon:'rupee'},
] as const;

const FEATURES=[
  {title:'Check Health Score',copy:'See your overall picture and where attention may help.',icon:'pulse',accent:'#0B8F7C',wash:'#E3F7F2'},
  {title:'Book Appointments',copy:'Find trusted care and keep bookings organised.',icon:'calendar',accent:'#2563EB',wash:'#E7F0FF'},
  {title:'Track Medications',copy:'Keep medicines and reminders together.',icon:'pill',accent:'#7C3AED',wash:'#F0E8FF'},
  {title:'Health Communities',copy:'Find peer support between visits.',icon:'community',accent:'#EA580C',wash:'#FFF0E5'},
  {title:'Share Your Journey',copy:'Keep reports, history and prescriptions together.',icon:'chat',accent:'#2563EB',wash:'#EAF2FF'},
  {title:'Secure & Private',copy:'Stay behind authenticated access and your controls.',icon:'shield',accent:'#15803D',wash:'#E8F7ED'},
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
      .journey-root{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#fff}
      .journey-nav-wrap{width:min(calc(100% - 40px),1380px);margin:0 auto;padding:18px 0 0}
      .journey-nav-title{text-align:center;color:#0B7E72;font-size:11.5px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;margin-bottom:8px}
      .journey-nav{padding:8px;border-radius:17px;background:linear-gradient(120deg,#064E49,#0B7168);display:grid;grid-template-columns:repeat(6,1fr);gap:7px;box-shadow:0 10px 24px rgba(5,73,67,.11)}
      .journey-pill{min-height:66px;border:0;border-radius:12px;padding:8px 9px;text-align:left;display:flex;align-items:center;gap:8px;cursor:pointer;transition:transform .17s ease,box-shadow .17s ease}.journey-pill:hover{transform:translateY(-2px);box-shadow:0 7px 16px rgba(0,0,0,.09)}
      .journey-icon{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;flex:0 0 auto;background:rgba(255,255,255,.84)}.journey-pill b{display:block;font-size:12px;line-height:1.2;color:#10243C}.journey-pill span:last-child{display:block;margin-top:2px;font-size:10px;line-height:1.22;color:#405D70}

      .mh-section{padding:28px 22px 30px;background:#F7FBFA;scroll-margin-top:72px}.mh-shell{width:min(100%,1380px);margin:0 auto}
      .mh-head{display:flex;align-items:flex-end;justify-content:space-between;gap:34px;margin-bottom:12px;padding:0 4px}.mh-head-copy{min-width:0}.mh-kicker{font-size:11.5px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#0B8F7C;margin-bottom:5px}.mh-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,2.6vw,2.8rem);line-height:1.01;letter-spacing:-.05em;color:#0B2B45;margin:0}.mh-head p{font-size:14px;line-height:1.45;color:#23475E;margin:0 0 2px;max-width:430px}

      .mh-canvas{overflow:hidden;border-radius:22px;border:1px solid #B9E2DE;background:#EFF8F8;box-shadow:0 14px 34px rgba(24,69,82,.065)}
      .mh-primary{position:relative;min-height:338px;overflow:hidden;background:linear-gradient(105deg,#F9FCFC 0%,#F3FAFA 46%,#E2F0F1 100%)}
      .mh-main-photo{position:absolute;z-index:0;right:0;top:0;width:59%;height:100%;object-fit:cover;object-position:center 38%;display:block}
      .mh-primary:after{content:'';position:absolute;z-index:1;inset:0;background:linear-gradient(90deg,#F8FCFC 0%,#F8FCFC 45%,rgba(248,252,252,.96) 50%,rgba(248,252,252,.76) 56%,rgba(248,252,252,.18) 66%,transparent 76%);pointer-events:none}
      .mh-left{position:relative;z-index:2;width:56%;padding:24px 25px 22px 30px;box-sizing:border-box}.mh-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.55rem,2vw,2.18rem);line-height:1.03;letter-spacing:-.042em;color:#0B2B45;margin:0}.mh-title span{display:block;color:#0B948B}.mh-subcopy{font-size:12.6px;line-height:1.42;color:#294A5D;margin:8px 0 9px;max-width:580px}.mh-rule{width:38px;height:3px;border-radius:999px;background:#0B948B;margin-bottom:9px}
      .mh-feature-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:1fr;gap:7px}.mh-feature{min-width:0;padding:8px;border-radius:12px;background:rgba(255,255,255,.9);border:1px solid rgba(203,222,225,.84);box-shadow:0 4px 12px rgba(43,77,89,.04);transition:transform .18s ease}.mh-feature:hover{transform:translateY(-2px)}.mh-feature-icon{width:29px;height:29px;border-radius:50%;display:grid;place-items:center;margin-bottom:5px}.mh-feature h3{font-family:'Sora','DM Sans',sans-serif;font-size:10.3px;line-height:1.2;margin:0 0 3px;color:#10243C}.mh-feature p{font-size:8.9px;line-height:1.31;color:#486275;margin:0}

      .mh-score{position:absolute;z-index:4;left:53%;top:14px;width:155px;padding:9px 10px 8px;border-radius:13px;background:rgba(255,255,255,.95);border:1px solid rgba(203,222,225,.9);box-shadow:0 9px 22px rgba(42,72,82,.1);backdrop-filter:blur(7px)}.mh-score-head{display:flex;align-items:center;justify-content:space-between;gap:5px;font-size:9.8px;font-weight:900;color:#15364D}.mh-gauge{position:relative;height:64px;margin:1px 0 0;display:grid;place-items:center}.mh-gauge svg{position:absolute;width:84px;height:52px;top:6px}.mh-score-num{position:relative;margin-top:7px;text-align:center;font-family:'Sora','DM Sans',sans-serif;font-size:26px;font-weight:800;color:#0B2B45;line-height:1}.mh-score-num small{display:block;font-family:'DM Sans',Arial,sans-serif;font-size:8.5px;margin-top:2px;font-weight:800}.mh-score-row{display:grid;grid-template-columns:1fr auto;gap:4px;padding:3.5px 0;border-top:1px solid #E6EEF0;font-size:7.9px;color:#365468}.mh-score-row b{font-size:7.8px;color:#0B8F7C}.mh-score-row.attn b{color:#E87922}.mh-score-foot{display:flex;justify-content:space-between;align-items:center;padding-top:4px;border-top:1px solid #E6EEF0;font-size:7.4px;color:#647B89}
      .mh-steps{position:absolute;z-index:4;left:54%;right:14px;bottom:14px;display:grid;grid-template-columns:repeat(4,1fr);gap:5px;padding:7px;border-radius:12px;background:rgba(255,255,255,.9);border:1px solid rgba(214,231,232,.9);box-shadow:0 8px 20px rgba(25,61,80,.09);backdrop-filter:blur(8px)}.mh-step{min-width:0;display:flex;align-items:center;gap:5px;padding:3px 4px;border-radius:8px}.mh-step-icon{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;flex:0 0 auto;background:#E5F5F2;color:#0B948B}.mh-step:nth-child(4) .mh-step-icon{color:#7C3AED;background:#F0E8FF}.mh-step b{font-size:8px;line-height:1.15;color:#15364D}

      .mh-care-grid{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #D6E7E8;background:#fff}.mh-care-card{min-width:0;min-height:90px;display:grid;grid-template-columns:102px 1fr auto;align-items:stretch;background:rgba(255,255,255,.96)}.mh-care-card+.mh-care-card{border-left:1px solid #D6E7E8}.mh-care-photo{width:102px;height:90px;object-fit:cover;display:block}.mh-care-copy{padding:11px 10px;align-self:center}.mh-care-copy h3{font-family:'Sora','DM Sans',sans-serif;font-size:11px;color:#0B665C;margin:0 0 3px}.mh-care-copy p{font-size:9px;line-height:1.35;color:#486275;margin:0}.mh-action{align-self:center;margin-right:12px;border:0;border-radius:8px;background:#0B948B;color:#fff;padding:8px 10px;font-size:9px;font-weight:900;cursor:pointer;white-space:nowrap}.mh-action:hover{background:#087D75}
      .mh-bottom{display:grid;grid-template-columns:repeat(4,1fr);align-items:center;min-height:68px;border-top:1px solid #D6E7E8;background:#F8FCFB}.mh-bottom-item{min-width:0;padding:9px 14px;display:grid;grid-template-columns:31px 1fr;gap:7px;align-items:center}.mh-bottom-item+.mh-bottom-item{border-left:1px solid #D9E4E6}.mh-bottom-icon{width:31px;height:31px;border-radius:50%;display:grid;place-items:center;background:#E5F5F2;color:#0B8F7C}.mh-bottom-item b{display:block;font-size:9.4px;line-height:1.18;color:#0B665C}.mh-bottom-item span{display:block;margin-top:2px;font-size:8px;line-height:1.28;color:#486275}

      @media(max-height:820px) and (min-width:1101px){.mh-section{padding-top:24px;padding-bottom:26px}.mh-head h2{font-size:clamp(1.9rem,2.45vw,2.55rem)}.mh-primary{min-height:318px}.mh-left{padding-top:20px;padding-bottom:19px}.mh-care-card{min-height:84px}.mh-care-photo{height:84px}.mh-bottom{min-height:62px}}
      @media(max-width:1100px){.journey-nav{grid-template-columns:repeat(3,1fr)}.mh-head{display:block}.mh-head p{max-width:760px;margin-top:8px}.mh-primary{min-height:0;padding-bottom:0}.mh-main-photo{position:relative;width:100%;height:380px;object-position:center 35%}.mh-primary:after{background:linear-gradient(180deg,rgba(247,251,250,.12) 45%,#F7FBFA 100%)}.mh-left{width:100%;padding:24px}.mh-score{left:18px;top:18px}.mh-steps{left:18px;right:18px;bottom:18px}.mh-care-card{grid-template-columns:96px 1fr auto}.mh-care-photo{width:96px}.mh-bottom{grid-template-columns:1fr 1fr}.mh-bottom-item:nth-child(3){border-left:0;border-top:1px solid #D9E4E6}.mh-bottom-item:nth-child(4){border-top:1px solid #D9E4E6}}
      @media(max-width:720px){.journey-nav-wrap{width:min(calc(100% - 24px),1380px)}.journey-nav{grid-template-columns:1fr 1fr}.mh-section{padding:24px 12px 28px}.mh-head h2{font-size:2.05rem}.mh-head p{font-size:13.5px}.mh-main-photo{height:310px}.mh-feature-grid{grid-template-columns:1fr 1fr}.mh-score{width:145px}.mh-steps{grid-template-columns:1fr 1fr}.mh-care-grid{grid-template-columns:1fr}.mh-care-card+.mh-care-card{border-left:0;border-top:1px solid #D6E7E8}.mh-bottom{grid-template-columns:1fr}.mh-bottom-item+.mh-bottom-item{border-left:0;border-top:1px solid #D9E4E6}}
      @media(max-width:460px){.journey-nav{grid-template-columns:1fr}.mh-feature-grid{grid-template-columns:1fr}.mh-main-photo{height:270px}.mh-score{position:relative;left:auto;top:auto;margin:12px;width:auto}.mh-steps{position:relative;left:auto;right:auto;bottom:auto;margin:12px}.mh-care-card{grid-template-columns:82px 1fr}.mh-care-photo{width:82px}.mh-action{grid-column:1/-1;margin:0 10px 10px;width:calc(100% - 20px)}}
    `}</style>

    <div className="journey-nav-wrap">
      <div className="journey-nav-title">Explore HealthConnect</div>
      <div className="journey-nav">
        {NAV_ITEMS.map(item=><button key={item.label} type="button" className="journey-pill" style={{background:item.wash}} onClick={()=>goto(item.target)}><span className="journey-icon" style={{color:item.accent}}><Icon kind={item.icon} size={19}/></span><span><b>{item.label}</b><span>{item.sub}</span></span></button>)}
      </div>
    </div>

    <section className="mh-section" id="my-health-story" aria-labelledby="my-health-title">
      <div className="mh-shell">
        <div className="mh-head">
          <div className="mh-head-copy"><div className="mh-kicker">My Health · Patient Dashboard</div><h2 id="my-health-title">Understand your health.<br/>Keep your journey together.</h2></div>
          <p>Track health, history, appointments and support in one private workspace.</p>
        </div>

        <div className="mh-canvas">
          <div className="mh-primary">
            <img className="mh-main-photo" src={PHOTOS.patient} alt="Indian patient using HealthConnect on a smartphone" loading="lazy" decoding="async" onError={hideBrokenImage}/>
            <div className="mh-left">
              <h3 className="mh-title">Your health.<span>All in one place.</span></h3>
              <p className="mh-subcopy">Organise the health information and care actions you use most, without moving between disconnected tools.</p>
              <div className="mh-rule"/>
              <div className="mh-feature-grid">
                {FEATURES.map(feature=><article className="mh-feature" key={feature.title}><div className="mh-feature-icon" style={{background:feature.wash,color:feature.accent}}><Icon kind={feature.icon} size={18}/></div><h3>{feature.title}</h3><p>{feature.copy}</p></article>)}
              </div>
            </div>

            <aside className="mh-score" aria-label="Illustrative Health Score preview">
              <div className="mh-score-head"><span>Your Health Score</span><InfoPopover ariaLabel="About Health Score" title="How Health Score works" width={230}>The 84 shown here is an illustrative landing-page example. In My Health, your score uses health information available in your profile across measurable areas such as physical health, wellbeing and lifestyle. It is not a diagnosis, and assessment completion is shown separately from the score.</InfoPopover></div>
              <div className="mh-gauge"><svg viewBox="0 0 120 70" aria-hidden="true"><path d="M12 60 A48 48 0 0 1 108 60" fill="none" stroke="#D7E3E5" strokeWidth="10" strokeLinecap="round"/><path d="M12 60 A48 48 0 0 1 96 28" fill="none" stroke="#14B8A6" strokeWidth="10" strokeLinecap="round"/></svg><div className="mh-score-num">84<small>Good</small></div></div>
              <div className="mh-score-row"><span>Physical Health</span><b>Good</b></div><div className="mh-score-row"><span>Mental Wellbeing</span><b>Good</b></div><div className="mh-score-row attn"><span>Lifestyle</span><b>Needs Attention</b></div><div className="mh-score-foot"><span>Illustrative preview</span><Icon kind="clock" size={13}/></div>
            </aside>

            <div className="mh-steps" aria-label="Connected My Health journey">
              {CARE_STEPS.map(step=><div className="mh-step" key={step.title}><div className="mh-step-icon"><Icon kind={step.icon} size={17}/></div><b>{step.title}</b></div>)}
            </div>
          </div>

          <div className="mh-care-grid">
            <article className="mh-care-card"><img className="mh-care-photo" src={PHOTOS.consultation} alt="Doctor consulting with a patient" loading="lazy" decoding="async" onError={hideBrokenImage}/><div className="mh-care-copy"><h3>Connected Care</h3><p>Move from organised health context into doctor discovery and follow-up.</p></div><button type="button" className="mh-action" onClick={()=>router.push('/doctors')}>Consult Now</button></article>
            <article className="mh-care-card"><img className="mh-care-photo" src={PHOTOS.community} alt="HealthConnect community members supporting one another online" loading="lazy" decoding="async" onError={hideBrokenImage}/><div className="mh-care-copy"><h3>Health Community</h3><p>Find condition-focused spaces for learning, sharing and support.</p></div><button type="button" className="mh-action" onClick={()=>router.push('/communities')}>Join Now</button></article>
          </div>

          <div className="mh-bottom">
            <div className="mh-bottom-item"><div className="mh-bottom-icon"><Icon kind="lock" size={18}/></div><div><b>Private & Secure</b><span>Authenticated access to personal health information.</span></div></div>
            <div className="mh-bottom-item"><div className="mh-bottom-icon"><Icon kind="clock" size={18}/></div><div><b>All in One Place</b><span>Reports, medicines, appointments and history.</span></div></div>
            <div className="mh-bottom-item"><div className="mh-bottom-icon"><Icon kind="community" size={18}/></div><div><b>Connected Journey</b><span>Professional care and peer support stay connected.</span></div></div>
            <div className="mh-bottom-item"><div className="mh-bottom-icon"><Icon kind="heart" size={18}/></div><div><b>Built around your care</b><span>Keep the next step clear between visits.</span></div></div>
          </div>
        </div>
      </div>
    </section>
  </section>;
}
