'use client';

import type { CSSProperties, SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import InfoPopover from '@/components/landing/InfoPopover';

const NAV_ITEMS=[
  {label:'My Health',sub:'Track, organise and prepare',target:'my-health-story',accent:'#0F8F83',wash:'#DDF5F0',icon:'heart'},
  {label:'Communities',sub:'Peer support between visits',target:'health-communities-story',accent:'#7357D8',wash:'#EEE8FA',icon:'community'},
  {label:'Doctor Platform',sub:'Patients, practice and follow-up',target:'doctor-platform-story',accent:'#315FEA',wash:'#E7EDFF',icon:'doctor'},
  {label:'Find Care',sub:'Doctors and hospitals',target:'care-discovery',accent:'#D66B42',wash:'#F9E8DF',icon:'search'},
  {label:'Knowledge Hub',sub:'Understand, learn and prepare',target:'knowledge-hub',accent:'#1686A8',wash:'#E0F1F6',icon:'book'},
  {label:'Plans',sub:'Simple membership options',target:'plans',accent:'#B7791F',wash:'#F8EFCF',icon:'rupee'},
] as const;

const FEATURES=[
  {title:'Appointments',copy:'View and manage upcoming visits.',icon:'calendar',accent:'#315FEA',wash:'#E7EDFF'},
  {title:'Medications',copy:'Track medicines and reminders.',icon:'pill',accent:'#7357D8',wash:'#EEE8FA'},
  {title:'Reports & History',copy:'Keep reports and care history together.',icon:'report',accent:'#1686A8',wash:'#E0F1F6'},
  {title:'Medical History',copy:'Maintain your health record over time.',icon:'history',accent:'#C47722',wash:'#FAEEDC'},
  {title:'Private Workspace',copy:'Personal health information stays protected.',icon:'shield',accent:'#27805C',wash:'#E4F1E9'},
  {title:'Peer Support',copy:'Find relevant health communities and support.',icon:'community',accent:'#D66B42',wash:'#F9E8DF'},
] as const;

const PHOTO='/images/my-health/my-health-landing-main.png';
const PHOTO_FALLBACK='/images/my-health/patient-main.png';

function Icon({kind,size=20}:{kind:string;size?:number}){
  const common={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.9,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};
  if(kind==='heart') return <svg {...common}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>;
  if(kind==='calendar') return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h3M13 14h3"/></svg>;
  if(kind==='pill') return <svg {...common}><path d="m10.5 13.5 5-5a4 4 0 1 0-5.7-5.7l-5 5a4 4 0 1 0 5.7 5.7Z"/><path d="m7.7 5 5.7 5.7"/></svg>;
  if(kind==='report') return <svg {...common}><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6"/></svg>;
  if(kind==='history') return <svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg>;
  if(kind==='shield') return <svg {...common}><path d="M12 3 19 6v5c0 4.8-2.9 8.4-7 10-4.1-1.6-7-5.2-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
  if(kind==='community') return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>;
  if(kind==='doctor') return <svg {...common}><path d="M8 3v4a4 4 0 0 0 8 0V3M12 11v10M8 15h8M5 21h14"/></svg>;
  if(kind==='search') return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>;
  if(kind==='book') return <svg {...common}><path d="M4 5a3 3 0 0 1 3-3h5v18H7a3 3 0 0 0-3 3Z"/><path d="M20 5a3 3 0 0 0-3-3h-5v18h5a3 3 0 0 1 3 3Z"/></svg>;
  if(kind==='rupee') return <svg {...common}><path d="M7 5h10M7 9h10M8 5c5 0 7 2 7 4s-2 4-7 4l8 7"/></svg>;
  if(kind==='pulse') return <svg {...common}><path d="M3 12h4l2-5 4 10 2-5h6"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
}

export default function AudienceJourneys(){
  const router=useRouter();
  const goto=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});
  const fallbackPhoto=(event:SyntheticEvent<HTMLImageElement>)=>{const image=event.currentTarget;if(image.dataset.fallback==='1')return;image.dataset.fallback='1';image.src=PHOTO_FALLBACK;};

  return <section className="journey-root" id="platform-tour">
    <style>{`
      .journey-root{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#D6E0E8}.journey-nav-wrap{width:min(calc(100% - 44px),1360px);margin:0 auto;padding:18px 0 13px}.journey-nav-title{text-align:center;color:#17354A;font-size:11.5px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;margin-bottom:8px}.journey-nav{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;padding:9px;border-radius:18px;background:#17384A;box-shadow:0 12px 28px rgba(17,48,64,.12)}.journey-pill{min-height:62px;border:0;border-radius:12px;padding:9px 10px;display:flex;align-items:center;gap:9px;text-align:left;cursor:pointer;transition:transform .17s ease,box-shadow .17s ease}.journey-pill:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(0,0,0,.11)}.journey-pill:focus-visible,.mh-button:focus-visible{outline:3px solid rgba(49,95,234,.26);outline-offset:3px}.journey-icon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:rgba(255,255,255,.82);flex:0 0 auto}.journey-pill b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:11.7px;line-height:1.18;color:#10243C}.journey-pill small{display:block;margin-top:2px;font-size:9.5px;line-height:1.22;color:#526B7B}

      .mh-section{scroll-margin-top:76px;background:#E9F0F4;padding:44px 22px 52px;border-top:1px solid #C9D6DE;border-bottom:1px solid #C4D2DA}.mh-shell{width:min(100%,1380px);margin:0 auto}.mh-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(350px,.55fr);gap:46px;align-items:end;margin:0 7px 20px}.mh-kicker{font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#16867A;margin-bottom:6px}.mh-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.05rem,2.65vw,2.8rem);line-height:1.02;letter-spacing:-.05em;color:#102F49;margin:0;max-width:700px}.mh-head p{font-size:14.5px;line-height:1.5;color:#4E687A;margin:0 0 3px;max-width:520px}

      .mh-canvas{position:relative;min-height:515px;border-radius:26px;overflow:hidden;background:linear-gradient(112deg,#FCFEFF 0%,#F4FAFB 56%,#E2F0F1 100%);border:1px solid #C6D7DF;box-shadow:0 20px 46px rgba(22,53,72,.13)}.mh-content{position:relative;z-index:4;width:61%;min-height:515px;padding:31px 30px 27px 34px;box-sizing:border-box}.mh-content:after{content:'';position:absolute;z-index:-1;right:-170px;top:0;width:250px;height:100%;background:linear-gradient(90deg,#F8FCFD 0%,rgba(248,252,253,.92) 30%,rgba(248,252,253,.42) 68%,transparent 100%);pointer-events:none}.mh-title-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:22px;align-items:start}.mh-title h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.8rem,2.05vw,2.2rem);line-height:1.02;letter-spacing:-.045em;color:#102F49;margin:0}.mh-title h3 span{display:block;color:#159A8C;margin-top:3px}.mh-title p{font-size:12.8px;line-height:1.46;color:#557081;margin:8px 0 0;max-width:430px}.mh-rule{width:42px;height:3px;border-radius:999px;background:#159A8C;margin-top:12px}

      .mh-score{width:235px;border-radius:16px;padding:12px 13px 11px;background:#E7F1FF;border:1px solid #B7CDEE;box-shadow:0 10px 23px rgba(35,78,124,.10)}.mh-score-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.mh-score-head b{font-family:'Sora','DM Sans',sans-serif;font-size:11px;color:#17354A}.mh-score-main{display:grid;grid-template-columns:74px 58px 1fr;align-items:center;gap:9px;margin-top:6px}.mh-gauge{position:relative;width:74px;height:45px}.mh-gauge svg{position:absolute;inset:0;width:74px;height:45px}.mh-score-num{font-family:'Sora','DM Sans',sans-serif;font-size:28px;font-weight:900;line-height:.9;color:#102F49}.mh-score-num span{display:block;font:900 8.5px 'DM Sans',Arial,sans-serif;color:#16867A;letter-spacing:.06em;margin-top:5px}.mh-score-signals{display:grid;gap:4px}.mh-score-signal{font-size:8.4px;color:#61788A;line-height:1.1}.mh-score-signal b{display:block;font-size:9.1px;margin-top:1px}.mh-score-signal.good b{color:#16867A}.mh-score-signal.focus b{color:#D66B42}.mh-score-foot{font-size:8.1px;color:#718596;margin-top:7px;padding-top:6px;border-top:1px solid #C7D7E7}

      .mh-preview-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:10px;margin-top:16px}.mh-appointment{border-radius:15px;padding:12px 13px;background:#FFF1E7;border:1px solid #F0CDBA;display:grid;grid-template-columns:42px 1fr;gap:10px;align-items:center}.mh-appointment-icon{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:#fff;color:#D66B42;box-shadow:0 5px 12px rgba(176,80,40,.08)}.mh-appointment small{display:block;font-size:8.5px;letter-spacing:.08em;font-weight:900;color:#B95B36;text-transform:uppercase}.mh-appointment b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:12px;color:#17354A;margin-top:2px}.mh-appointment span{display:block;font-size:9.7px;color:#627888;margin-top:2px}.mh-connected{border-radius:15px;padding:11px 12px;background:#E6F4EF;border:1px solid #BFDED2;display:grid;grid-template-columns:36px 1fr;gap:9px;align-items:center}.mh-connected-icon{width:35px;height:35px;border-radius:11px;display:grid;place-items:center;background:#fff;color:#27805C}.mh-connected b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:11px;color:#17354A}.mh-connected span{display:block;font-size:9.4px;color:#5A7468;margin-top:2px;line-height:1.3}

      .mh-feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:11px}.mh-feature{min-height:72px;border-radius:14px;padding:10px 10px 9px;background:var(--wash);border:1px solid color-mix(in srgb,var(--accent) 22%, transparent);display:grid;grid-template-columns:34px 1fr;gap:8px;align-items:start}.mh-feature-icon{width:33px;height:33px;border-radius:10px;display:grid;place-items:center;background:rgba(255,255,255,.78);color:var(--accent)}.mh-feature b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:10.8px;line-height:1.18;color:#17354A;margin:1px 0 3px}.mh-feature p{font-size:9.2px;line-height:1.28;color:#5A7080;margin:0}

      .mh-continuity{margin-top:11px;border-radius:14px;background:#E7EDF4;border:1px solid #CCD8E2;padding:9px 11px;display:grid;grid-template-columns:auto repeat(3,1fr);gap:8px;align-items:center}.mh-continuity strong{font-size:9.5px;color:#17354A;white-space:nowrap}.mh-continuity span{font-size:8.9px;color:#566E7F;text-align:center;padding:5px 7px;border-left:1px solid #C5D1DC}.mh-actions{display:flex;gap:9px;align-items:center;margin-top:12px}.mh-button{border-radius:10px;padding:9px 14px;font-size:11.5px;font-weight:900;cursor:pointer}.mh-button.primary{border:1px solid #315FEA;background:#315FEA;color:#fff;box-shadow:0 8px 18px rgba(49,95,234,.18)}.mh-button.secondary{border:1px solid #BFD0DB;background:#F5F8FA;color:#17354A}

      .mh-visual{position:absolute;z-index:1;right:0;top:0;width:44%;height:100%;overflow:hidden;background:#D9EAEB}.mh-visual:before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(248,252,253,.70) 0%,rgba(248,252,253,.18) 18%,transparent 38%);z-index:2;pointer-events:none}.mh-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:76% center;display:block}.mh-photo-note{position:absolute;z-index:3;right:18px;bottom:18px;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.88);border:1px solid rgba(255,255,255,.86);backdrop-filter:blur(8px);font-size:9.5px;font-weight:850;color:#17354A;box-shadow:0 8px 20px rgba(20,48,65,.10)}.mh-photo-note i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#159A8C;margin-right:6px;box-shadow:0 0 0 4px rgba(21,154,140,.12)}

      @media(max-width:1120px){.journey-nav{grid-template-columns:repeat(3,1fr)}.mh-head{grid-template-columns:1fr;gap:8px}.mh-canvas{padding-top:400px}.mh-visual{left:0;right:0;width:100%;height:400px}.mh-photo{object-position:72% center}.mh-content{width:100%;min-height:0}.mh-content:after{display:none}}
      @media(max-width:760px){.journey-nav-wrap{width:min(calc(100% - 24px),1360px)}.journey-nav{grid-template-columns:1fr 1fr}.mh-section{padding:36px 12px 42px}.mh-head h2{font-size:2.1rem}.mh-head p{font-size:14px}.mh-canvas{padding-top:310px;border-radius:21px}.mh-visual{height:310px}.mh-content{padding:24px 18px}.mh-title-row{grid-template-columns:1fr}.mh-score{width:auto}.mh-preview-grid{grid-template-columns:1fr}.mh-feature-grid{grid-template-columns:1fr 1fr}.mh-continuity{grid-template-columns:1fr 1fr}.mh-continuity strong{grid-column:1/-1}.mh-continuity span{border-left:0;background:rgba(255,255,255,.48);border-radius:8px}.mh-actions{flex-wrap:wrap}}
      @media(max-width:480px){.journey-nav{grid-template-columns:1fr}.mh-feature-grid{grid-template-columns:1fr}.mh-score-main{grid-template-columns:70px 55px 1fr}.mh-continuity{grid-template-columns:1fr}.mh-actions{display:grid;grid-template-columns:1fr}.mh-button{width:100%}}
    `}</style>

    <div className="journey-nav-wrap">
      <div className="journey-nav-title">Explore HealthConnect</div>
      <div className="journey-nav">{NAV_ITEMS.map(item=><button key={item.label} type="button" className="journey-pill" style={{background:item.wash}} onClick={()=>goto(item.target)}><span className="journey-icon" style={{color:item.accent}}><Icon kind={item.icon} size={18}/></span><span><b>{item.label}</b><small>{item.sub}</small></span></button>)}</div>
    </div>

    <section className="mh-section" id="my-health-story" aria-labelledby="my-health-title">
      <div className="mh-shell">
        <div className="mh-head"><div><div className="mh-kicker">My Health · Patient Dashboard</div><h2 id="my-health-title">Your health journey, organised around what matters next.</h2></div><p>Understand your health, keep records and medicines together, and carry the right context into appointments and ongoing care.</p></div>

        <div className="mh-canvas">
          <div className="mh-content">
            <div className="mh-title-row">
              <div className="mh-title"><h3>Your health.<span>All in one place.</span></h3><p>Track. Understand. Organise. Continue care without switching between disconnected tools.</p><div className="mh-rule"/></div>
              <aside className="mh-score" aria-label="Illustrative Health Score preview"><div className="mh-score-head"><b>Your Health Score</b><InfoPopover ariaLabel="About Health Score" title="How Health Score works" width={230}>The score shown here is an illustrative landing-page example. In My Health, the live score uses health information available in your profile across measurable areas such as physical health, wellbeing and lifestyle. It is not a diagnosis.</InfoPopover></div><div className="mh-score-main"><div className="mh-gauge"><svg viewBox="0 0 110 65" aria-hidden="true"><path d="M12 56 A43 43 0 0 1 98 56" fill="none" stroke="#CBD9E5" strokeWidth="10" strokeLinecap="round"/><path d="M12 56 A43 43 0 0 1 85 25" fill="none" stroke="#15B8A6" strokeWidth="10" strokeLinecap="round"/></svg></div><div className="mh-score-num">84<span>GOOD</span></div><div className="mh-score-signals"><div className="mh-score-signal good">Physical<b>Good</b></div><div className="mh-score-signal good">Wellbeing<b>Good</b></div><div className="mh-score-signal focus">Lifestyle<b>Review</b></div></div></div><div className="mh-score-foot">Illustrative preview · your live dashboard reflects available health data.</div></aside>
            </div>

            <div className="mh-preview-grid"><div className="mh-appointment"><span className="mh-appointment-icon"><Icon kind="calendar"/></span><div><small>Next appointment</small><b>Dr. Anisha Sharma · General Physician</b><span>Mon, 12 May · 11:00 AM · Illustrative preview</span></div></div><div className="mh-connected"><span className="mh-connected-icon"><Icon kind="pulse" size={18}/></span><div><b>Your care stays connected</b><span>Health context stays close to the next care action.</span></div></div></div>

            <div className="mh-feature-grid">{FEATURES.map(feature=><article className="mh-feature" key={feature.title} style={{'--accent':feature.accent,'--wash':feature.wash} as CSSProperties}><span className="mh-feature-icon"><Icon kind={feature.icon} size={17}/></span><div><b>{feature.title}</b><p>{feature.copy}</p></div></article>)}</div>

            <div className="mh-continuity"><strong>Your care, connected</strong><span>Records ready</span><span>Medicines tracked</span><span>Support nearby</span></div>
            <div className="mh-actions"><button type="button" className="mh-button primary" onClick={()=>router.push('/dashboard')}>Open My Health</button><button type="button" className="mh-button secondary" onClick={()=>router.push('/doctors')}>Find a Doctor</button></div>
          </div>

          <div className="mh-visual"><img className="mh-photo" src={PHOTO} alt="Indian patient using HealthConnect in a bright home setting" loading="lazy" decoding="async" onError={fallbackPhoto}/><div className="mh-photo-note"><i/>Your Health Journey Matters</div></div>
        </div>
      </div>
    </section>
  </section>;
}
