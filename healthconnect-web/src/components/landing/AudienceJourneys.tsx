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
  const goto=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});
  const hideBrokenImage=(event:SyntheticEvent<HTMLImageElement>)=>{event.currentTarget.style.display='none';};

  return <section className="journey-root" id="platform-tour">
    <style>{`
      .journey-root{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#fff}
      .journey-nav-wrap{width:min(calc(100% - 40px),1380px);margin:0 auto;padding:22px 0 0}
      .journey-nav-title{text-align:center;color:#0B7E72;font-size:12px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;margin-bottom:9px}
      .journey-nav{padding:9px;border-radius:18px;background:linear-gradient(120deg,#064E49,#0B7168);display:grid;grid-template-columns:repeat(6,1fr);gap:7px;box-shadow:0 12px 28px rgba(5,73,67,.12)}
      .journey-pill{min-height:72px;border:0;border-radius:13px;padding:9px 10px;text-align:left;display:flex;align-items:center;gap:8px;cursor:pointer;transition:transform .17s ease,box-shadow .17s ease}.journey-pill:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(0,0,0,.1)}
      .journey-icon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;flex:0 0 auto;background:rgba(255,255,255,.84)}.journey-pill b{display:block;font-size:12.6px;line-height:1.22;color:#10243C}.journey-pill span:last-child{display:block;margin-top:3px;font-size:10.5px;line-height:1.25;color:#405D70}

      .mh-section{padding:40px 22px 50px;background:#fff;scroll-margin-top:76px}.mh-shell{width:min(100%,1380px);margin:0 auto}
      .mh-head{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(330px,.7fr);gap:42px;align-items:end;margin-bottom:16px;padding:0 4px}.mh-kicker{font-size:12px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#0B8F7C;margin-bottom:6px}.mh-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.15rem,2.85vw,3.05rem);line-height:1.01;letter-spacing:-.052em;color:#0B2B45;margin:0}.mh-head p{font-size:15.5px;line-height:1.48;color:#23475E;margin:0 0 2px;max-width:500px}

      .mh-canvas{overflow:hidden;border-radius:24px;border:1px solid #B9E2DE;background:linear-gradient(125deg,#F8FCFC 0%,#EFF8F8 48%,#DCEFF1 100%);box-shadow:0 16px 38px rgba(24,69,82,.07)}
      .mh-primary{display:grid;grid-template-columns:minmax(0,1.06fr) minmax(430px,.94fr);min-height:365px}
      .mh-left{padding:27px 27px 24px 32px;min-width:0}.mh-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.65rem,2.2vw,2.4rem);line-height:1.03;letter-spacing:-.043em;color:#0B2B45;margin:0}.mh-title span{display:block;color:#0B948B}.mh-subcopy{font-size:13.2px;line-height:1.46;color:#294A5D;margin:9px 0 11px;max-width:610px}.mh-rule{width:40px;height:3px;border-radius:999px;background:#0B948B;margin-bottom:11px}
      .mh-feature-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:1fr;gap:8px}.mh-feature{min-width:0;padding:9px 9px 8px;border-radius:13px;background:rgba(255,255,255,.92);border:1px solid rgba(203,222,225,.86);box-shadow:0 5px 14px rgba(43,77,89,.045);transition:transform .18s ease}.mh-feature:hover{transform:translateY(-2px)}.mh-feature-icon{width:31px;height:31px;border-radius:50%;display:grid;place-items:center;margin-bottom:6px}.mh-feature h3{font-family:'Sora','DM Sans',sans-serif;font-size:10.8px;line-height:1.22;margin:0 0 4px;color:#10243C}.mh-feature p{font-size:9.45px;line-height:1.34;color:#486275;margin:0}

      .mh-visual{position:relative;min-height:365px;overflow:hidden;background:linear-gradient(135deg,#DDECEE,#BDDDE0)}.mh-main-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 38%;display:block}.mh-visual-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(236,248,248,.35),transparent 30%),linear-gradient(180deg,transparent 52%,rgba(9,52,64,.18) 100%)}
      .mh-score{position:absolute;z-index:3;left:14px;top:14px;width:158px;padding:10px 11px 9px;border-radius:14px;background:rgba(255,255,255,.95);border:1px solid rgba(203,222,225,.9);box-shadow:0 10px 24px rgba(42,72,82,.11);backdrop-filter:blur(7px)}.mh-score-head{display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:10.3px;font-weight:900;color:#15364D}.mh-gauge{position:relative;height:68px;margin:2px 0 0;display:grid;place-items:center}.mh-gauge svg{position:absolute;width:88px;height:56px;top:6px}.mh-score-num{position:relative;margin-top:7px;text-align:center;font-family:'Sora','DM Sans',sans-serif;font-size:27px;font-weight:800;color:#0B2B45;line-height:1}.mh-score-num small{display:block;font-family:'DM Sans',Arial,sans-serif;font-size:9px;margin-top:2px;font-weight:800}.mh-score-row{display:grid;grid-template-columns:1fr auto;gap:5px;padding:4px 0;border-top:1px solid #E6EEF0;font-size:8.2px;color:#365468}.mh-score-row b{font-size:8px;color:#0B8F7C}.mh-score-row.attn b{color:#E87922}.mh-score-foot{display:flex;justify-content:space-between;align-items:center;padding-top:4px;border-top:1px solid #E6EEF0;font-size:7.7px;color:#647B89}
      .mh-steps{position:absolute;z-index:3;left:14px;right:14px;bottom:14px;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:8px;border-radius:13px;background:rgba(255,255,255,.92);border:1px solid rgba(214,231,232,.9);box-shadow:0 9px 22px rgba(25,61,80,.1);backdrop-filter:blur(8px)}.mh-step{min-width:0;display:flex;align-items:center;gap:6px;padding:4px 5px;border-radius:9px}.mh-step-icon{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;flex:0 0 auto;background:#E5F5F2;color:#0B948B}.mh-step:nth-child(4) .mh-step-icon{color:#7C3AED;background:#F0E8FF}.mh-step b{font-size:8.6px;line-height:1.18;color:#15364D}

      .mh-care-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:1px solid #D6E7E8}.mh-care-card{min-width:0;min-height:108px;display:grid;grid-template-columns:118px 1fr auto;align-items:stretch;background:rgba(255,255,255,.92)}.mh-care-card+.mh-care-card{border-left:1px solid #D6E7E8}.mh-care-photo{width:118px;height:108px;object-fit:cover;display:block}.mh-care-copy{padding:14px 13px;align-self:center}.mh-care-copy h3{font-family:'Sora','DM Sans',sans-serif;font-size:12.5px;color:#0B665C;margin:0 0 4px}.mh-care-copy p{font-size:9.8px;line-height:1.38;color:#37566A;margin:0}.mh-community-note{display:block;margin-top:4px;font-size:8.6px;line-height:1.28;color:#627784}.mh-action{align-self:center;margin-right:13px;border:0;border-radius:8px;background:#0B948B;color:#fff;padding:8px 10px;line-height:1;font-size:9.5px;font-weight:900;cursor:pointer;white-space:nowrap;box-shadow:0 5px 12px rgba(11,148,139,.14)}.mh-action:hover{background:#087D75}

      .mh-bottom{margin-top:10px;min-height:72px;border-radius:15px;background:#F8FCFB;border:1px solid #D2E7E4;display:grid;grid-template-columns:1fr 1fr 1fr 1.25fr;align-items:stretch;overflow:hidden}.mh-bottom-item{min-width:0;padding:11px 13px;display:grid;grid-template-columns:32px 1fr;gap:8px;align-items:center}.mh-bottom-item+.mh-bottom-item{border-left:1px solid #D9E6E6}.mh-bottom-icon{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:#E5F5F2;color:#0B8F7C}.mh-bottom-item b{display:block;font-size:9.7px;line-height:1.18;color:#0B665C}.mh-bottom-item span{display:block;margin-top:2px;font-size:8.4px;line-height:1.28;color:#486275}

      @media(max-height:820px) and (min-width:1101px){.mh-section{padding-top:32px;padding-bottom:42px}.mh-head{margin-bottom:13px}.mh-head h2{font-size:clamp(2rem,2.6vw,2.75rem)}.mh-head p{font-size:14.5px}.mh-primary,.mh-visual{min-height:345px}.mh-left{padding-top:23px;padding-bottom:20px}.mh-feature{padding:8px}.mh-care-card{min-height:100px}.mh-care-photo{height:100px}.mh-bottom{min-height:66px}}
      @media(max-width:1100px){.journey-nav{grid-template-columns:repeat(3,1fr)}.mh-head{grid-template-columns:1fr;gap:8px}.mh-head p{max-width:760px}.mh-primary{grid-template-columns:1fr}.mh-visual{min-height:410px}.mh-care-grid{grid-template-columns:1fr}.mh-care-card+.mh-care-card{border-left:0;border-top:1px solid #D6E7E8}.mh-bottom{grid-template-columns:1fr 1fr}.mh-bottom-item:nth-child(3){border-left:0;border-top:1px solid #D9E6E6}.mh-bottom-item:nth-child(4){border-top:1px solid #D9E6E6}}
      @media(max-width:700px){.journey-nav-wrap{width:min(calc(100% - 24px),1380px);padding-top:16px}.journey-nav{grid-template-columns:1fr 1fr}.mh-section{padding:32px 10px 42px}.mh-head h2{font-size:2.2rem}.mh-head p{font-size:14.5px}.mh-left{padding:22px 16px}.mh-title{font-size:1.95rem}.mh-feature-grid{grid-template-columns:1fr 1fr}.mh-visual{min-height:360px}.mh-score{width:145px}.mh-steps{grid-template-columns:1fr 1fr}.mh-care-card{grid-template-columns:96px 1fr}.mh-care-photo{width:96px}.mh-action{grid-column:1/-1;margin:0 12px 12px;justify-self:start}.mh-bottom{grid-template-columns:1fr}.mh-bottom-item+.mh-bottom-item{border-left:0;border-top:1px solid #D9E6E6}}
      @media(max-width:460px){.journey-nav{grid-template-columns:1fr}.mh-feature-grid{grid-template-columns:1fr}.mh-visual{min-height:430px}.mh-steps{grid-template-columns:1fr 1fr}.mh-care-card{grid-template-columns:84px 1fr}.mh-care-photo{width:84px}}
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
          <div><div className="mh-kicker">My Health · Patient Dashboard</div><h2 id="my-health-title">Understand your health.<br/>Keep your journey together.</h2></div>
          <p>My Health is your private health companion for tracking what matters, maintaining your history, preparing for qualified care and finding support between visits.</p>
        </div>

        <div className="mh-canvas">
          <div className="mh-primary">
            <div className="mh-left">
              <h3 className="mh-title">Your health.<span>All in one place.</span></h3>
              <p className="mh-subcopy">Track, understand and take charge of your health with connected care, smart tools and a community that supports you.</p>
              <div className="mh-rule"/>
              <div className="mh-feature-grid">
                {FEATURES.map(feature=><article className="mh-feature" key={feature.title}><div className="mh-feature-icon" style={{background:feature.wash,color:feature.accent}}><Icon kind={feature.icon} size={19}/></div><h3>{feature.title}</h3><p>{feature.copy}</p></article>)}
              </div>
            </div>

            <div className="mh-visual">
              <img className="mh-main-photo" src={PHOTOS.patient} alt="Indian patient using HealthConnect on a smartphone" loading="lazy" decoding="async" onError={hideBrokenImage}/>
              <div className="mh-visual-shade" aria-hidden="true"/>
              <aside className="mh-score" aria-label="Illustrative Health Score preview">
                <div className="mh-score-head"><span>Your Health Score</span><InfoPopover ariaLabel="About Health Score" title="How Health Score works" width={230}>The 84 shown here is an illustrative landing-page example. In My Health, your score uses health information available in your profile across measurable areas such as physical health, wellbeing and lifestyle. It is not a diagnosis, and assessment completion is shown separately from the score.</InfoPopover></div>
                <div className="mh-gauge"><svg viewBox="0 0 120 70" aria-hidden="true"><path d="M12 60 A48 48 0 0 1 108 60" fill="none" stroke="#D7E3E5" strokeWidth="10" strokeLinecap="round"/><path d="M12 60 A48 48 0 0 1 96 28" fill="none" stroke="#14B8A6" strokeWidth="10" strokeLinecap="round"/></svg><div className="mh-score-num">84<small>Good</small></div></div>
                <div className="mh-score-row"><span>Physical Health</span><b>Good</b></div><div className="mh-score-row"><span>Mental Wellbeing</span><b>Good</b></div><div className="mh-score-row attn"><span>Lifestyle</span><b>Needs Attention</b></div><div className="mh-score-foot"><span>Illustrative preview</span><Icon kind="clock" size={12}/></div>
              </aside>
              <div className="mh-steps" aria-label="Connected My Health journey">{CARE_STEPS.map(step=><div className="mh-step" key={step.title}><div className="mh-step-icon"><Icon kind={step.icon} size={16}/></div><b>{step.title}</b></div>)}</div>
            </div>
          </div>

          <div className="mh-care-grid">
            <article className="mh-care-card"><img className="mh-care-photo" src={PHOTOS.consultation} alt="Doctor consulting with a patient" loading="lazy" decoding="async" onError={hideBrokenImage}/><div className="mh-care-copy"><h3>Connected Care</h3><p>Move from organised health context into doctor discovery, consultation and follow-up.</p></div><button type="button" className="mh-action" onClick={()=>router.push('/doctors')}>Consult Now</button></article>
            <article className="mh-care-card"><img className="mh-care-photo" src={PHOTOS.community} alt="HealthConnect community members supporting one another online" loading="lazy" decoding="async" onError={hideBrokenImage}/><div className="mh-care-copy"><h3>Health Community</h3><p>Real conversations. Shared experiences. Support between visits.</p><span className="mh-community-note">Find condition-focused spaces to learn, share and feel less alone.</span></div><button type="button" className="mh-action" onClick={()=>router.push('/communities')}>Join Now</button></article>
          </div>
        </div>

        <div className="mh-bottom">
          <div className="mh-bottom-item"><div className="mh-bottom-icon"><Icon kind="lock" size={18}/></div><div><b>Private & Secure Workspace</b><span>Personal health information stays behind authenticated access.</span></div></div>
          <div className="mh-bottom-item"><div className="mh-bottom-icon"><Icon kind="clock" size={18}/></div><div><b>All in One Place</b><span>Reports, medicines, appointments and health history together.</span></div></div>
          <div className="mh-bottom-item"><div className="mh-bottom-icon"><Icon kind="community" size={18}/></div><div><b>Connected Care Journey</b><span>Health information, professional care and peer support stay connected.</span></div></div>
          <div className="mh-bottom-item"><div className="mh-bottom-icon"><Icon kind="heart" size={18}/></div><div><b>Built around your care journey</b><span>Organise what matters and move more confidently between each care step.</span></div></div>
        </div>
      </div>
    </section>
  </section>;
}
