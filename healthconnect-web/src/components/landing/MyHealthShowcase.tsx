'use client';

import type { CSSProperties, SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import InfoPopover from '@/components/landing/InfoPopover';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const FEATURES = [
  {title:'Appointments',copy:'View and manage upcoming visits.',icon:'calendar',accent:'#315FEA',wash:'#E8EEFF'},
  {title:'Medications',copy:'Track medicines and reminders.',icon:'pill',accent:'#7357D8',wash:'#F0E9FB'},
  {title:'Reports Vault',copy:'Keep test reports and documents organised.',icon:'report',accent:'#1686A8',wash:'#E4F2F6'},
  {title:'Medical History',copy:'Maintain your health record over time.',icon:'history',accent:'#C47722',wash:'#FBF0DE'},
  {title:'Private Workspace',copy:'Personal health information stays protected.',icon:'shield',accent:'#27805C',wash:'#E6F2EB'},
  {title:'Peer Support',copy:'Find relevant communities and support.',icon:'community',accent:'#D66B42',wash:'#F9E9E1'},
] as const;

const PHOTO='/images/my-health-landing-main.png';
const PHOTO_FALLBACK='/images/my-health/patient-main.png';

function Icon({kind,size=20}:{kind:string;size?:number}){
  const c={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.9,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};
  if(kind==='calendar')return <svg {...c}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h3M13 14h3"/></svg>;
  if(kind==='pill')return <svg {...c}><path d="m10.5 13.5 5-5a4 4 0 1 0-5.7-5.7l-5 5a4 4 0 1 0 5.7 5.7Z"/><path d="m7.7 5 5.7 5.7"/></svg>;
  if(kind==='report')return <svg {...c}><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6"/></svg>;
  if(kind==='history')return <svg {...c}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg>;
  if(kind==='shield')return <svg {...c}><path d="M12 3 19 6v5c0 4.8-2.9 8.4-7 10-4.1-1.6-7-5.2-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
  if(kind==='community')return <svg {...c}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>;
  if(kind==='doctor')return <svg {...c}><path d="M8 3v4a4 4 0 0 0 8 0V3M12 11v10M8 15h8M5 21h14"/></svg>;
  if(kind==='clock')return <svg {...c}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
  return <svg {...c}><path d="M3 12h4l2-5 4 10 2-5h6"/></svg>;
}

export default function MyHealthShowcase(){
  const router=useRouter();
  const {isAuthenticated,user}=useAuthStore();
  const {openAuthModal}=useUIStore();

  const openMyHealth=()=>{
    if(isAuthenticated&&String(user?.role||'').toUpperCase()==='PATIENT'){router.push('/dashboard');return;}
    try{sessionStorage.setItem('hc_post_login_redirect','/dashboard')}catch{}
    openAuthModal('login');
  };

  const fallbackPhoto=(event:SyntheticEvent<HTMLImageElement>)=>{
    const image=event.currentTarget;
    if(image.dataset.fallback==='1')return;
    image.dataset.fallback='1';
    image.src=PHOTO_FALLBACK;
  };

  return <section className="mhx-section" id="my-health-story" aria-labelledby="mhx-title">
    <style>{`
      .mhx-section{scroll-margin-top:76px;background:#D9E5EC;padding:42px 22px 52px;border-top:1px solid #C3D2DB;border-bottom:1px solid #C1D1DB;font-family:'DM Sans',Arial,sans-serif;color:#10243C}.mhx-shell{width:min(100%,1380px);margin:0 auto}.mhx-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(340px,.54fr);gap:44px;align-items:end;margin:0 6px 18px}.mhx-kicker{font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#16867A;margin-bottom:6px}.mhx-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,2.65vw,2.85rem);line-height:1.03;letter-spacing:-.05em;color:#102F49;margin:0}.mhx-head h2 span{color:#159A8C}.mhx-head p{font-size:14.5px;line-height:1.48;color:#4D687B;margin:0 0 3px;max-width:520px}

      .mhx-canvas{position:relative;min-height:520px;border-radius:28px;overflow:hidden;background:linear-gradient(112deg,#FBFDFE 0%,#F5FAFC 54%,#E2F0F2 100%);border:1px solid #BBCDD7;box-shadow:0 22px 48px rgba(26,55,72,.14)}.mhx-content{position:relative;z-index:4;width:61%;min-height:520px;padding:29px 30px 25px 32px;box-sizing:border-box;background:linear-gradient(90deg,rgba(251,253,254,.99) 0%,rgba(248,252,253,.97) 80%,rgba(248,252,253,.1) 100%)}

      .mhx-topline{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.mhx-title h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.72rem,2vw,2.12rem);line-height:1.03;letter-spacing:-.045em;color:#102F49;margin:0}.mhx-title h3 span{display:block;color:#159A8C;margin-top:3px}.mhx-title p{font-size:12.6px;line-height:1.42;color:#567081;margin:7px 0 0;max-width:360px}.mhx-rule{width:40px;height:3px;border-radius:999px;background:#159A8C;margin-top:10px}

      .mhx-score{width:235px;border-radius:16px;padding:11px 12px 10px;background:linear-gradient(135deg,#E3F0FF 0%,#F5F8FF 100%);border:1px solid #B8CCE8;box-shadow:0 9px 21px rgba(40,76,116,.09)}.mhx-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.mhx-card-head b{font-family:'Sora','DM Sans',sans-serif;font-size:10.8px;color:#17354A}.mhx-score-body{display:grid;grid-template-columns:72px 58px 1fr;align-items:center;gap:8px;margin-top:6px}.mhx-gauge{position:relative;width:72px;height:44px}.mhx-gauge svg{position:absolute;inset:0;width:72px;height:44px}.mhx-score-num{font-family:'Sora','DM Sans',sans-serif;font-size:28px;font-weight:900;line-height:.9;color:#102F49}.mhx-score-num span{display:block;margin-top:5px;font:900 8px 'DM Sans',Arial,sans-serif;color:#16867A;letter-spacing:.08em}.mhx-signals{display:grid;gap:3px}.mhx-signal{font-size:7.7px;color:#718596;line-height:1.08}.mhx-signal b{display:block;font-size:8.6px;margin-top:1px}.mhx-signal.good b{color:#16867A}.mhx-signal.info b{color:#315FEA}.mhx-signal.focus b{color:#D66B42}.mhx-score-foot{margin-top:6px;padding-top:5px;border-top:1px solid #CBD9E6;font-size:7.8px;color:#718596}

      .mhx-preview-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:10px;margin-top:14px}.mhx-appointment,.mhx-context{min-height:88px;border-radius:15px;padding:11px 12px;box-sizing:border-box}.mhx-appointment{background:#FFF1E7;border:1px solid #F0CDBA;display:grid;grid-template-columns:38px 1fr;gap:9px;align-items:center}.mhx-context{background:#E6F4EF;border:1px solid #BFDED2;display:grid;grid-template-columns:38px 1fr;gap:9px;align-items:center}.mhx-preview-icon{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:#fff;box-shadow:0 5px 12px rgba(31,58,75,.07)}.mhx-appointment .mhx-preview-icon{color:#D66B42}.mhx-context .mhx-preview-icon{color:#27805C}.mhx-preview-copy small{display:block;font-size:8px;font-weight:900;letter-spacing:.09em;text-transform:uppercase}.mhx-appointment small{color:#B95B36}.mhx-context small{color:#27805C}.mhx-preview-copy b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:11.1px;color:#17354A;margin-top:2px}.mhx-preview-copy span{display:block;font-size:9px;line-height:1.3;color:#627888;margin-top:2px}

      .mhx-feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:11px}.mhx-feature{min-height:76px;border-radius:14px;padding:10px;background:var(--wash);border:1px solid color-mix(in srgb,var(--accent) 24%, transparent);display:grid;grid-template-columns:32px 1fr;gap:8px;align-items:start;transition:transform .17s ease,box-shadow .17s ease}.mhx-feature:hover{transform:translateY(-1px);box-shadow:0 8px 17px rgba(24,56,74,.07)}.mhx-feature-icon{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:rgba(255,255,255,.84);color:var(--accent)}.mhx-feature b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:10.6px;line-height:1.16;color:#17354A;margin:1px 0 3px}.mhx-feature p{font-size:8.9px;line-height:1.27;color:#596F7F;margin:0}

      .mhx-continuity{display:grid;grid-template-columns:auto repeat(3,1fr);gap:7px;align-items:center;margin-top:11px;padding:9px 10px;border-radius:13px;background:#E3EAF1;border:1px solid #C8D5DF}.mhx-continuity strong{font-size:9.3px;color:#17354A;white-space:nowrap}.mhx-continuity span{display:flex;align-items:center;justify-content:center;gap:6px;font-size:8.6px;color:#5A7080;padding:4px 6px;border-left:1px solid #C2CFDA}.mhx-dot{width:7px;height:7px;border-radius:50%;background:var(--dot);box-shadow:0 0 0 4px color-mix(in srgb,var(--dot) 14%, transparent)}

      .mhx-actions{display:flex;gap:9px;align-items:center;margin-top:11px}.mhx-button{border-radius:10px;padding:9px 14px;font-size:11.5px;font-weight:900;cursor:pointer;transition:transform .16s ease,box-shadow .16s ease}.mhx-button:hover{transform:translateY(-1px)}.mhx-button:focus-visible{outline:3px solid rgba(49,95,234,.25);outline-offset:3px}.mhx-button.primary{border:1px solid #315FEA;background:#315FEA;color:#fff;box-shadow:0 8px 18px rgba(49,95,234,.18)}.mhx-button.secondary{border:1px solid #D8B79F;background:#FFF0E6;color:#A14F2E}

      .mhx-visual{position:absolute;z-index:1;right:0;top:0;width:43%;height:100%;overflow:hidden;background:#DCEDEF}.mhx-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:82% 50%;display:block}.mhx-visual:before{content:'';position:absolute;z-index:2;inset:0;background:linear-gradient(90deg,rgba(248,252,253,.78) 0%,rgba(248,252,253,.22) 18%,transparent 34%),linear-gradient(180deg,transparent 72%,rgba(20,54,68,.08) 100%);pointer-events:none}.mhx-photo-badge{position:absolute;z-index:3;right:17px;bottom:16px;display:flex;align-items:center;gap:7px;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.88);backdrop-filter:blur(9px);border:1px solid rgba(255,255,255,.78);font-size:8.8px;font-weight:850;color:#17354A;box-shadow:0 8px 18px rgba(20,48,65,.09)}.mhx-photo-badge i{width:8px;height:8px;border-radius:50%;background:#159A8C;box-shadow:0 0 0 4px rgba(21,154,140,.12)}

      @media(max-width:1080px){.mhx-head{grid-template-columns:1fr;gap:8px}.mhx-canvas{padding-top:400px;min-height:0}.mhx-visual{left:0;right:0;top:0;width:100%;height:400px}.mhx-photo{object-position:76% 50%}.mhx-content{width:100%;min-height:0;padding:27px}.mhx-preview-grid,.mhx-feature-grid,.mhx-continuity{max-width:820px}}
      @media(max-width:760px){.mhx-section{padding:34px 12px 40px}.mhx-head{margin:0 4px 15px}.mhx-head h2{font-size:2.05rem}.mhx-head p{font-size:14px}.mhx-canvas{padding-top:330px;border-radius:22px}.mhx-visual{height:330px}.mhx-content{padding:22px 18px}.mhx-topline{display:grid;grid-template-columns:1fr}.mhx-score{width:100%;max-width:390px}.mhx-preview-grid{grid-template-columns:1fr}.mhx-feature-grid{grid-template-columns:1fr 1fr}.mhx-continuity{grid-template-columns:1fr}.mhx-continuity span{justify-content:flex-start;border-left:0;border-top:1px solid #C2CFDA}.mhx-actions{flex-wrap:wrap}}
      @media(max-width:480px){.mhx-canvas{padding-top:280px}.mhx-visual{height:280px}.mhx-feature-grid{grid-template-columns:1fr}.mhx-score-body{grid-template-columns:72px 58px 1fr}.mhx-actions{display:grid;grid-template-columns:1fr 1fr}.mhx-button{width:100%}}
    `}</style>

    <div className="mhx-shell">
      <div className="mhx-head">
        <div><div className="mhx-kicker">My Health · Patient Dashboard</div><h2 id="mhx-title">Your health, organised for <span>what comes next.</span></h2></div>
        <p>See your health status, appointments, medicines, records and support in one connected private workspace.</p>
      </div>

      <div className="mhx-canvas">
        <div className="mhx-content">
          <div className="mhx-topline">
            <div className="mhx-title"><h3>Your health.<span>All in one place.</span></h3><p>Track. Understand. Organise. Continue care.</p><div className="mhx-rule"/></div>
            <aside className="mhx-score" aria-label="Illustrative Health Score preview">
              <div className="mhx-card-head"><b>Your Health Score</b><InfoPopover ariaLabel="About Health Score" title="How Health Score works" width={235}>The score shown here is illustrative. In My Health, your score uses measurable health information available in your profile. It is not a diagnosis, and assessment completion is shown separately.</InfoPopover></div>
              <div className="mhx-score-body">
                <div className="mhx-gauge"><svg viewBox="0 0 120 70" aria-hidden="true"><path d="M12 60 A48 48 0 0 1 108 60" fill="none" stroke="#D5E1E7" strokeWidth="10" strokeLinecap="round"/><path d="M12 60 A48 48 0 0 1 96 28" fill="none" stroke="#14B8A6" strokeWidth="10" strokeLinecap="round"/></svg></div>
                <div className="mhx-score-num">84<span>GOOD</span></div>
                <div className="mhx-signals"><div className="mhx-signal good">Physical<b>Good</b></div><div className="mhx-signal info">Wellbeing<b>Good</b></div><div className="mhx-signal focus">Lifestyle<b>Review</b></div></div>
              </div>
              <div className="mhx-score-foot">Illustrative preview · your live dashboard reflects available health data.</div>
            </aside>
          </div>

          <div className="mhx-preview-grid">
            <div className="mhx-appointment"><span className="mhx-preview-icon"><Icon kind="calendar" size={18}/></span><div className="mhx-preview-copy"><small>Next appointment</small><b>General Physician</b><span>Upcoming visit · schedule and context together</span></div></div>
            <div className="mhx-context"><span className="mhx-preview-icon"><Icon kind="doctor" size={18}/></span><div className="mhx-preview-copy"><small>Care context</small><b>Ready for the next visit</b><span>Records, medicines and history stay connected</span></div></div>
          </div>

          <div className="mhx-feature-grid">
            {FEATURES.map(feature=><article className="mhx-feature" key={feature.title} style={{'--accent':feature.accent,'--wash':feature.wash} as CSSProperties}><span className="mhx-feature-icon"><Icon kind={feature.icon} size={17}/></span><div><b>{feature.title}</b><p>{feature.copy}</p></div></article>)}
          </div>

          <div className="mhx-continuity"><strong>Your care stays connected</strong><span><i className="mhx-dot" style={{'--dot':'#1686A8'} as CSSProperties}/>Records ready</span><span><i className="mhx-dot" style={{'--dot':'#7357D8'} as CSSProperties}/>Medicines tracked</span><span><i className="mhx-dot" style={{'--dot':'#D66B42'} as CSSProperties}/>Support nearby</span></div>

          <div className="mhx-actions"><button type="button" className="mhx-button primary" onClick={openMyHealth}>Open My Health</button><button type="button" className="mhx-button secondary" onClick={()=>router.push('/doctors')}>Find a Doctor</button></div>
        </div>

        <div className="mhx-visual"><img className="mhx-photo" src={PHOTO} alt="Indian patient using HealthConnect at home" loading="lazy" decoding="async" onError={fallbackPhoto}/><div className="mhx-photo-badge"><i/>Your health journey, connected</div></div>
      </div>
    </div>
  </section>;
}
