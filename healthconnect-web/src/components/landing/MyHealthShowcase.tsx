'use client';

import type { CSSProperties, SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import InfoPopover from '@/components/landing/InfoPopover';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const FEATURES = [
  {title:'Appointments',copy:'View and manage upcoming visits.',icon:'calendar',accent:'#315FEA',wash:'#E8EEFF'},
  {title:'Medications',copy:'Track medicines and reminders.',icon:'pill',accent:'#7357D8',wash:'#F0E9FB'},
  {title:'Reports & History',copy:'Keep reports and care history together.',icon:'report',accent:'#1686A8',wash:'#E4F2F6'},
  {title:'Medical History',copy:'Maintain your health record over time.',icon:'history',accent:'#C47722',wash:'#FBF0DE'},
  {title:'Private Workspace',copy:'Personal health information stays protected.',icon:'shield',accent:'#27805C',wash:'#E6F2EB'},
  {title:'Peer Support',copy:'Find communities and relevant support.',icon:'community',accent:'#D66B42',wash:'#F9E9E1'},
] as const;

const PHOTO='/images/my-health/my-health-landing-main.png';
const PHOTO_FALLBACK='/images/my-health/patient-main.png';

function Icon({kind,size=20}:{kind:string;size?:number}){
  const common={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.9,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};
  if(kind==='calendar') return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h3M13 14h3"/></svg>;
  if(kind==='pill') return <svg {...common}><path d="m10.5 13.5 5-5a4 4 0 1 0-5.7-5.7l-5 5a4 4 0 1 0 5.7 5.7Z"/><path d="m7.7 5 5.7 5.7"/></svg>;
  if(kind==='report') return <svg {...common}><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6"/></svg>;
  if(kind==='history') return <svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg>;
  if(kind==='shield') return <svg {...common}><path d="M12 3 19 6v5c0 4.8-2.9 8.4-7 10-4.1-1.6-7-5.2-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
  if(kind==='community') return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>;
  if(kind==='clock') return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
  if(kind==='doctor') return <svg {...common}><path d="M8 3v4a4 4 0 0 0 8 0V3M12 11v10M8 15h8M5 21h14"/></svg>;
  if(kind==='pulse') return <svg {...common}><path d="M3 12h4l2-5 4 10 2-5h6"/></svg>;
  if(kind==='folder') return <svg {...common}><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M8 12h8M8 16h5"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
}

export default function MyHealthShowcase(){
  const router=useRouter();
  const {isAuthenticated,user}=useAuthStore();
  const {openAuthModal}=useUIStore();

  const openMyHealth=()=>{
    if(isAuthenticated&&String(user?.role||'').toUpperCase()==='PATIENT'){
      router.push('/dashboard');
      return;
    }
    try{sessionStorage.setItem('hc_post_login_redirect','/dashboard')}catch{}
    openAuthModal('login');
  };

  const fallbackPhoto=(event:SyntheticEvent<HTMLImageElement>)=>{
    const image=event.currentTarget;
    if(image.dataset.fallback==='1') return;
    image.dataset.fallback='1';
    image.src=PHOTO_FALLBACK;
  };

  return <section className="mhx-section" id="my-health-story" aria-labelledby="mhx-title">
    <style>{`
      .mhx-section{scroll-margin-top:76px;background:#DCE7EE;padding:44px 22px 54px;border-top:1px solid #C8D6DF;border-bottom:1px solid #C1D1DB;font-family:'DM Sans',Arial,sans-serif;color:#10243C}.mhx-shell{width:min(100%,1380px);margin:0 auto}.mhx-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(330px,.56fr);gap:44px;align-items:end;margin:0 7px 20px}.mhx-kicker{font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#16867A;margin-bottom:7px}.mhx-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.1rem,2.75vw,3rem);line-height:1.02;letter-spacing:-.052em;color:#102F49;margin:0;max-width:720px}.mhx-head h2 span{color:#159A8C}.mhx-head p{font-size:14.8px;line-height:1.5;color:#4D687B;margin:0 0 4px;max-width:520px}

      .mhx-canvas{position:relative;min-height:525px;border-radius:28px;overflow:hidden;background:linear-gradient(112deg,#FBFDFE 0%,#F6FBFC 58%,#E5F2F3 100%);border:1px solid #BFD0D9;box-shadow:0 22px 48px rgba(26,55,72,.14)}.mhx-content{position:relative;z-index:5;width:62%;min-height:525px;padding:30px 31px 26px 34px;box-sizing:border-box}.mhx-content:after{content:'';position:absolute;z-index:-1;right:-190px;top:0;width:285px;height:100%;background:linear-gradient(90deg,#F8FCFD 0%,rgba(248,252,253,.95) 30%,rgba(248,252,253,.48) 68%,transparent 100%);pointer-events:none}

      .mhx-preview-row{display:grid;grid-template-columns:1.08fr .92fr;gap:12px}.mhx-score,.mhx-appointment{min-height:142px;border-radius:18px;box-sizing:border-box}.mhx-score{padding:14px 15px 12px;background:linear-gradient(135deg,#E6F1FF 0%,#F2F7FF 100%);border:1px solid #B8CDEB;box-shadow:0 10px 22px rgba(40,76,116,.09)}.mhx-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.mhx-card-head b{font-family:'Sora','DM Sans',sans-serif;font-size:12px;color:#17354A}.mhx-score-body{display:grid;grid-template-columns:96px 70px 1fr;align-items:center;gap:10px;margin-top:8px}.mhx-gauge{position:relative;width:96px;height:56px}.mhx-gauge svg{position:absolute;inset:0;width:96px;height:56px}.mhx-score-num{font-family:'Sora','DM Sans',sans-serif;font-size:34px;font-weight:900;line-height:.9;color:#102F49}.mhx-score-num span{display:block;margin-top:6px;font:900 9px 'DM Sans',Arial,sans-serif;color:#16867A;letter-spacing:.08em}.mhx-signals{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.mhx-signal{padding-left:8px;border-left:1px solid #C6D7E6;min-width:0}.mhx-signal small{display:block;font-size:8px;color:#718596}.mhx-signal b{display:block;font-size:9.2px;margin-top:2px}.mhx-signal.good b{color:#16867A}.mhx-signal.info b{color:#315FEA}.mhx-signal.focus b{color:#D66B42}.mhx-score-foot{margin-top:8px;padding-top:6px;border-top:1px solid #CBD9E6;font-size:8.3px;color:#718596}

      .mhx-appointment{padding:14px 15px;background:linear-gradient(135deg,#FFF0E6 0%,#FFF8F3 100%);border:1px solid #EFC9B6;display:grid;grid-template-rows:auto 1fr auto;box-shadow:0 10px 22px rgba(161,79,46,.07)}.mhx-appointment-top{display:flex;align-items:center;justify-content:space-between;gap:10px}.mhx-appointment-top span:first-child{font-size:9px;font-weight:900;letter-spacing:.10em;text-transform:uppercase;color:#B55B36}.mhx-preview-badge{font-size:7.8px;font-weight:900;padding:4px 6px;border-radius:999px;background:rgba(255,255,255,.74);color:#7D6A60;border:1px solid rgba(125,106,96,.14)}.mhx-doctor{display:grid;grid-template-columns:40px 1fr;gap:10px;align-items:center;margin-top:8px}.mhx-doctor-icon{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:#fff;color:#D66B42;box-shadow:0 5px 12px rgba(176,80,40,.08)}.mhx-doctor b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:11.7px;color:#17354A}.mhx-doctor span{display:block;margin-top:2px;font-size:9.3px;color:#6B7880}.mhx-appt-time{display:flex;align-items:center;gap:6px;margin-top:9px;padding-top:7px;border-top:1px solid #EACDBE;color:#6A6F73;font-size:9px;font-weight:800}

      .mhx-feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}.mhx-feature{min-height:80px;border-radius:15px;padding:11px 10px;background:var(--wash);border:1px solid color-mix(in srgb,var(--accent) 24%, transparent);display:grid;grid-template-columns:34px 1fr;gap:9px;align-items:start;transition:transform .17s ease,box-shadow .17s ease}.mhx-feature:hover{transform:translateY(-1px);box-shadow:0 8px 17px rgba(24,56,74,.07)}.mhx-feature-icon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:rgba(255,255,255,.82);color:var(--accent)}.mhx-feature b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:11px;line-height:1.18;color:#17354A;margin:1px 0 3px}.mhx-feature p{font-size:9.3px;line-height:1.3;color:#596F7F;margin:0}

      .mhx-continuity{display:grid;grid-template-columns:auto repeat(3,1fr);gap:8px;align-items:center;margin-top:12px;padding:10px 11px;border-radius:14px;background:#E5EBF1;border:1px solid #C8D5DF}.mhx-continuity strong{font-size:9.6px;color:#17354A;white-space:nowrap}.mhx-continuity span{display:flex;align-items:center;justify-content:center;gap:6px;font-size:8.9px;color:#5A7080;padding:4px 7px;border-left:1px solid #C2CFDA}.mhx-dot{width:7px;height:7px;border-radius:50%;background:var(--dot);box-shadow:0 0 0 4px color-mix(in srgb,var(--dot) 14%, transparent)}

      .mhx-actions{display:flex;gap:9px;align-items:center;margin-top:12px}.mhx-button{border-radius:10px;padding:10px 15px;font-size:11.7px;font-weight:900;cursor:pointer;transition:transform .16s ease,box-shadow .16s ease}.mhx-button:hover{transform:translateY(-1px)}.mhx-button:focus-visible{outline:3px solid rgba(49,95,234,.25);outline-offset:3px}.mhx-button.primary{border:1px solid #315FEA;background:#315FEA;color:#fff;box-shadow:0 8px 18px rgba(49,95,234,.18)}.mhx-button.secondary{border:1px solid #D8B79F;background:#FFF0E6;color:#A14F2E}

      .mhx-visual{position:absolute;z-index:1;right:0;top:0;width:44%;height:100%;overflow:hidden;background:#DCEDEF}.mhx-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:78% center;display:block}.mhx-visual:before{content:'';position:absolute;z-index:2;inset:0;background:linear-gradient(90deg,rgba(248,252,253,.78) 0%,rgba(248,252,253,.24) 17%,transparent 34%),linear-gradient(180deg,transparent 72%,rgba(20,54,68,.08) 100%);pointer-events:none}.mhx-photo-badge{position:absolute;z-index:3;right:18px;bottom:17px;display:flex;align-items:center;gap:7px;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.88);backdrop-filter:blur(9px);border:1px solid rgba(255,255,255,.78);font-size:9px;font-weight:850;color:#17354A;box-shadow:0 8px 18px rgba(20,48,65,.09)}.mhx-photo-badge i{width:8px;height:8px;border-radius:50%;background:#159A8C;box-shadow:0 0 0 4px rgba(21,154,140,.12)}

      @media(max-width:1080px){.mhx-head{grid-template-columns:1fr;gap:8px}.mhx-canvas{padding-top:400px;min-height:0}.mhx-visual{left:0;right:0;top:0;width:100%;height:400px}.mhx-photo{object-position:70% center}.mhx-content{width:100%;min-height:0;padding:28px}.mhx-content:after{display:none}.mhx-preview-row,.mhx-feature-grid,.mhx-continuity{max-width:820px}}
      @media(max-width:760px){.mhx-section{padding:36px 12px 42px}.mhx-head{margin:0 4px 16px}.mhx-head h2{font-size:2.15rem}.mhx-head p{font-size:14px}.mhx-canvas{padding-top:330px;border-radius:22px}.mhx-visual{height:330px}.mhx-content{padding:22px 18px}.mhx-preview-row{grid-template-columns:1fr}.mhx-feature-grid{grid-template-columns:1fr 1fr}.mhx-continuity{grid-template-columns:1fr 1fr}.mhx-continuity strong{grid-column:1/-1}.mhx-continuity span{border-left:0;justify-content:flex-start}.mhx-score,.mhx-appointment{min-height:0}}
      @media(max-width:500px){.mhx-canvas{padding-top:290px}.mhx-visual{height:290px}.mhx-photo{object-position:73% center}.mhx-feature-grid{grid-template-columns:1fr}.mhx-score-body{grid-template-columns:84px 58px 1fr}.mhx-gauge,.mhx-gauge svg{width:84px}.mhx-signals{grid-template-columns:1fr}.mhx-signal{border-left:0;padding-left:0}.mhx-actions{display:grid;grid-template-columns:1fr}.mhx-button{width:100%}}
    `}</style>

    <div className="mhx-shell">
      <div className="mhx-head">
        <div><div className="mhx-kicker">My Health · Patient Dashboard</div><h2 id="mhx-title">Your health. <span>All in one place.</span></h2></div>
        <p>Health score, visits, medicines, records and support—connected in one private workspace.</p>
      </div>

      <div className="mhx-canvas">
        <div className="mhx-content">
          <div className="mhx-preview-row">
            <article className="mhx-score" aria-label="Illustrative Health Score preview">
              <div className="mhx-card-head"><b>Your Health Score</b><InfoPopover ariaLabel="About Health Score" title="How Health Score works" width={230}>The 84 shown here is an illustrative landing-page example. In My Health, your score uses health information available in your profile across measurable areas such as physical health, wellbeing and lifestyle. It is not a diagnosis, and assessment completion is shown separately from the score.</InfoPopover></div>
              <div className="mhx-score-body">
                <div className="mhx-gauge"><svg viewBox="0 0 120 70" aria-hidden="true"><path d="M12 60 A48 48 0 0 1 108 60" fill="none" stroke="#CAD9E5" strokeWidth="10" strokeLinecap="round"/><path d="M12 60 A48 48 0 0 1 96 28" fill="none" stroke="#15B7A4" strokeWidth="10" strokeLinecap="round"/></svg></div>
                <div className="mhx-score-num">84<span>GOOD</span></div>
                <div className="mhx-signals"><div className="mhx-signal good"><small>Physical</small><b>Good</b></div><div className="mhx-signal info"><small>Wellbeing</small><b>Good</b></div><div className="mhx-signal focus"><small>Lifestyle</small><b>Review</b></div></div>
              </div>
              <div className="mhx-score-foot">Illustrative preview · your live dashboard reflects available health data.</div>
            </article>

            <article className="mhx-appointment" aria-label="Illustrative next appointment preview">
              <div className="mhx-appointment-top"><span>Next appointment</span><span className="mhx-preview-badge">Illustrative</span></div>
              <div className="mhx-doctor"><span className="mhx-doctor-icon"><Icon kind="doctor" size={19}/></span><div><b>Dr. Anisha Sharma</b><span>General Physician</span></div></div>
              <div className="mhx-appt-time"><Icon kind="clock" size={14}/><span>Mon, 12 May · 11:00 AM</span></div>
            </article>
          </div>

          <div className="mhx-feature-grid">
            {FEATURES.map(feature=><article className="mhx-feature" key={feature.title} style={{'--accent':feature.accent,'--wash':feature.wash} as CSSProperties}><span className="mhx-feature-icon"><Icon kind={feature.icon} size={17}/></span><div><b>{feature.title}</b><p>{feature.copy}</p></div></article>)}
          </div>

          <div className="mhx-continuity"><strong>Your care stays connected</strong><span style={{'--dot':'#315FEA'} as CSSProperties}><i className="mhx-dot"/>Records ready</span><span style={{'--dot':'#7357D8'} as CSSProperties}><i className="mhx-dot"/>Medicines tracked</span><span style={{'--dot':'#D66B42'} as CSSProperties}><i className="mhx-dot"/>Support nearby</span></div>

          <div className="mhx-actions"><button type="button" className="mhx-button primary" onClick={openMyHealth}>Open My Health</button><button type="button" className="mhx-button secondary" onClick={()=>router.push('/doctors')}>Find a Doctor</button></div>
        </div>

        <div className="mhx-visual" aria-hidden="true"><img className="mhx-photo" src={PHOTO} alt="" onError={fallbackPhoto}/><div className="mhx-photo-badge"><i/>Private health workspace</div></div>
      </div>
    </div>
  </section>;
}
