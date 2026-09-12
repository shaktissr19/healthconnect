'use client';

import type { CSSProperties, SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import InfoPopover from '@/components/landing/InfoPopover';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const FEATURES = [
  {title:'Appointments',copy:'View and manage upcoming visits in one place.',icon:'calendar',bg:'#2449B8',iconBg:'#3A61CF',meta:'Plan the next care step'},
  {title:'Medications',copy:'Track medicines, schedules and reminders.',icon:'pill',bg:'#6240A8',iconBg:'#7754BC',meta:'Stay on schedule'},
  {title:'Health Records',copy:'Keep reports, medical history and health documents together.',icon:'report',bg:'#116774',iconBg:'#23808C',meta:'History ready when needed'},
  {title:'Peer Support',copy:'Find relevant health communities and lived experience.',icon:'community',bg:'#A54E3E',iconBg:'#BB6556',meta:'Support between visits'},
] as const;

const PHOTO='/images/my-health-landing-main.png';
const PHOTO_FALLBACK='/images/my-health/patient-main.png';

function Icon({kind,size=20}:{kind:string;size?:number}){
  const c={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.9,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};
  if(kind==='calendar')return <svg {...c}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h3M13 14h3"/></svg>;
  if(kind==='pill')return <svg {...c}><path d="m10.5 13.5 5-5a4 4 0 1 0-5.7-5.7l-5 5a4 4 0 1 0 5.7 5.7Z"/><path d="m7.7 5 5.7 5.7"/></svg>;
  if(kind==='report')return <svg {...c}><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6"/></svg>;
  if(kind==='community')return <svg {...c}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>;
  if(kind==='lock')return <svg {...c}><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2"/></svg>;
  return <svg {...c}><path d="M3 12h4l2-5 4 10 2-5h6"/></svg>;
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
    if(image.dataset.fallback==='1')return;
    image.dataset.fallback='1';
    image.src=PHOTO_FALLBACK;
  };

  return <section className="mhx-section" id="my-health-story" aria-labelledby="mhx-title">
    <style>{`
      .mhx-section{scroll-margin-top:76px;background:#CFDCE6;padding:42px 22px 52px;border-top:1px solid #B9CAD6;border-bottom:1px solid #B7C8D4;font-family:'DM Sans',Arial,sans-serif;color:#10243C}.mhx-shell{width:min(100%,1380px);margin:0 auto}.mhx-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(340px,.52fr);gap:42px;align-items:end;margin:0 6px 18px}.mhx-kicker{font-size:13px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#117E76;margin-bottom:7px}.mhx-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.05rem,2.7vw,2.9rem);line-height:1.03;letter-spacing:-.05em;color:#102F49;margin:0}.mhx-head h2 span{color:#118D82}.mhx-head p{font-size:15.5px;line-height:1.48;color:#405E73;margin:0 0 3px;max-width:530px}
      .mhx-canvas{position:relative;min-height:500px;border-radius:28px;overflow:hidden;background:linear-gradient(112deg,#F8FBFD 0%,#EEF5F8 55%,#D7E9EC 100%);border:1px solid #AFC3D0;box-shadow:0 22px 48px rgba(26,55,72,.15)}.mhx-content{position:relative;z-index:4;width:59%;min-height:500px;padding:30px 30px 24px 32px;box-sizing:border-box;background:linear-gradient(90deg,rgba(248,251,253,.99) 0%,rgba(245,250,252,.97) 83%,rgba(245,250,252,.10) 100%)}
      .mhx-topline{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.mhx-title h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.78rem,2.05vw,2.18rem);line-height:1.04;letter-spacing:-.045em;color:#102F49;margin:0}.mhx-title h3 span{display:block;color:#118D82;margin-top:3px}.mhx-title p{font-size:13.5px;line-height:1.42;color:#4E6A7C;margin:8px 0 0;max-width:365px}.mhx-rule{width:42px;height:3px;border-radius:999px;background:#118D82;margin-top:11px}
      .mhx-score{width:248px;border-radius:17px;padding:12px 13px 11px;background:linear-gradient(135deg,#DCEBFF 0%,#F5F8FF 100%);border:1px solid #9EB9DF;box-shadow:0 10px 22px rgba(40,76,116,.10)}.mhx-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.mhx-card-head b{font-family:'Sora','DM Sans',sans-serif;font-size:11.5px;color:#17354A}.mhx-score-body{display:grid;grid-template-columns:76px 60px 1fr;align-items:center;gap:9px;margin-top:7px}.mhx-gauge{position:relative;width:76px;height:46px}.mhx-gauge svg{position:absolute;inset:0;width:76px;height:46px}.mhx-score-num{font-family:'Sora','DM Sans',sans-serif;font-size:30px;font-weight:900;line-height:.9;color:#102F49}.mhx-score-num span{display:block;margin-top:6px;font:900 8.5px 'DM Sans',Arial,sans-serif;color:#118D82;letter-spacing:.08em}.mhx-signals{display:grid;gap:4px}.mhx-signal{font-size:8.3px;color:#667E90;line-height:1.08}.mhx-signal b{display:block;font-size:9.1px;margin-top:1px}.mhx-signal.good b{color:#118D82}.mhx-signal.info b{color:#315FEA}.mhx-signal.focus b{color:#D66B42}.mhx-score-foot{margin-top:7px;padding-top:6px;border-top:1px solid #C4D4E3;font-size:8.2px;line-height:1.25;color:#637A8C}
      .mhx-feature-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px}.mhx-feature{min-height:108px;border-radius:16px;padding:15px 16px;background:var(--card-bg);border:1px solid rgba(255,255,255,.14);display:grid;grid-template-columns:44px 1fr;gap:13px;align-items:start;color:#fff;box-shadow:0 12px 24px rgba(24,48,72,.12);transition:transform .17s ease,box-shadow .17s ease}.mhx-feature:hover{transform:translateY(-2px);box-shadow:0 16px 29px rgba(24,48,72,.17)}.mhx-feature-icon{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:var(--icon-bg);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.12)}.mhx-feature b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:14px;line-height:1.2;color:#fff;margin:1px 0 5px}.mhx-feature p{font-size:11.8px;line-height:1.4;color:rgba(255,255,255,.82);margin:0}.mhx-feature small{display:inline-flex;margin-top:8px;padding:4px 7px;border-radius:999px;background:rgba(255,255,255,.12);font-size:9px;line-height:1;color:rgba(255,255,255,.92);font-weight:800}
      .mhx-continuity{display:grid;grid-template-columns:auto repeat(3,1fr);gap:8px;align-items:center;margin-top:13px;padding:10px 11px;border-radius:13px;background:#223B52;border:1px solid #34536B;color:#fff}.mhx-continuity strong{font-size:10px;color:#fff;white-space:nowrap}.mhx-continuity span{display:flex;align-items:center;justify-content:center;gap:6px;font-size:9.2px;color:#D7E3EB;padding:4px 6px;border-left:1px solid rgba(255,255,255,.14)}.mhx-dot{width:7px;height:7px;border-radius:50%;background:var(--dot);box-shadow:0 0 0 4px color-mix(in srgb,var(--dot) 18%, transparent)}
      .mhx-actions{display:flex;gap:10px;align-items:center;margin-top:13px}.mhx-button{border-radius:10px;padding:10px 15px;font-size:12.3px;font-weight:900;cursor:pointer;transition:transform .16s ease,box-shadow .16s ease}.mhx-button:hover{transform:translateY(-1px)}.mhx-button:focus-visible{outline:3px solid rgba(49,95,234,.25);outline-offset:3px}.mhx-button.primary{border:1px solid #315FEA;background:#315FEA;color:#fff;box-shadow:0 8px 18px rgba(49,95,234,.20)}.mhx-button.secondary{border:1px solid #D49A72;background:#FFF0E6;color:#954725}.mhx-privacy-note{display:flex;align-items:center;gap:7px;margin-top:10px;color:#526D7F;font-size:10.5px;font-weight:700}.mhx-privacy-note i{width:27px;height:27px;border-radius:9px;display:grid;place-items:center;background:#E1EEE8;color:#27805C;font-style:normal}
      .mhx-visual{position:absolute;z-index:1;right:0;top:0;width:44%;height:100%;overflow:hidden;background:#D7E8EA}.mhx-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:82% 50%;display:block}.mhx-visual:before{content:'';position:absolute;z-index:2;inset:0;background:linear-gradient(90deg,rgba(245,250,252,.74) 0%,rgba(245,250,252,.18) 18%,transparent 34%),linear-gradient(180deg,transparent 72%,rgba(20,54,68,.08) 100%);pointer-events:none}.mhx-photo-badge{position:absolute;z-index:3;right:17px;bottom:16px;display:flex;align-items:center;gap:7px;padding:8px 11px;border-radius:999px;background:rgba(255,255,255,.88);backdrop-filter:blur(9px);border:1px solid rgba(255,255,255,.78);font-size:9.2px;font-weight:850;color:#17354A;box-shadow:0 8px 18px rgba(20,48,65,.09)}.mhx-photo-badge i{width:8px;height:8px;border-radius:50%;background:#159A8C;box-shadow:0 0 0 4px rgba(21,154,140,.12)}
      @media(max-width:1080px){.mhx-head{grid-template-columns:1fr;gap:8px}.mhx-canvas{padding-top:400px;min-height:0}.mhx-visual{left:0;right:0;top:0;width:100%;height:400px}.mhx-photo{object-position:76% 50%}.mhx-content{width:100%;min-height:0;padding:27px}.mhx-feature-grid,.mhx-continuity{max-width:820px}}@media(max-width:760px){.mhx-section{padding:34px 12px 40px}.mhx-head{margin:0 4px 15px}.mhx-head h2{font-size:2.05rem}.mhx-head p{font-size:14.5px}.mhx-canvas{padding-top:330px;border-radius:22px}.mhx-visual{height:330px}.mhx-content{padding:22px 18px}.mhx-topline{display:grid;grid-template-columns:1fr}.mhx-score{width:100%;max-width:400px}.mhx-feature-grid{grid-template-columns:1fr}.mhx-continuity{grid-template-columns:1fr}.mhx-continuity span{justify-content:flex-start;border-left:0;border-top:1px solid rgba(255,255,255,.14)}.mhx-actions{flex-wrap:wrap}}@media(max-width:480px){.mhx-canvas{padding-top:280px}.mhx-visual{height:280px}.mhx-actions{display:grid;grid-template-columns:1fr 1fr}.mhx-button{width:100%}}
    `}</style>
    <div className="mhx-shell">
      <div className="mhx-head"><div><div className="mhx-kicker">My Health · Patient Dashboard</div><h2 id="mhx-title">Your health, organised for <span>what comes next.</span></h2></div><p>See your health status, appointments, medicines, records and support in one connected private workspace.</p></div>
      <div className="mhx-canvas">
        <div className="mhx-content">
          <div className="mhx-topline">
            <div className="mhx-title"><h3>Your health.<span>All in one place.</span></h3><p>Track. Understand. Organise. Continue care.</p><div className="mhx-rule"/></div>
            <aside className="mhx-score" aria-label="Illustrative Health Score preview"><div className="mhx-card-head"><b>Your Health Score</b><InfoPopover ariaLabel="About Health Score" title="How Health Score works" width={235}>The score shown here is illustrative. In My Health, your score uses measurable health information available in your profile. It is not a diagnosis, and assessment completion is shown separately.</InfoPopover></div><div className="mhx-score-body"><div className="mhx-gauge"><svg viewBox="0 0 120 70" aria-hidden="true"><path d="M12 60 A48 48 0 0 1 108 60" fill="none" stroke="#D5E1E7" strokeWidth="10" strokeLinecap="round"/><path d="M12 60 A48 48 0 0 1 96 28" fill="none" stroke="#14B8A6" strokeWidth="10" strokeLinecap="round"/></svg></div><div className="mhx-score-num">84<span>GOOD</span></div><div className="mhx-signals"><div className="mhx-signal good">Physical<b>Good</b></div><div className="mhx-signal info">Wellbeing<b>Good</b></div><div className="mhx-signal focus">Lifestyle<b>Review</b></div></div></div><div className="mhx-score-foot">Illustrative preview · your live dashboard reflects available health data.</div></aside>
          </div>
          <div className="mhx-feature-grid">{FEATURES.map(feature=><article className="mhx-feature" key={feature.title} style={{'--card-bg':feature.bg,'--icon-bg':feature.iconBg} as CSSProperties}><span className="mhx-feature-icon"><Icon kind={feature.icon} size={20}/></span><div><b>{feature.title}</b><p>{feature.copy}</p><small>{feature.meta}</small></div></article>)}</div>
          <div className="mhx-continuity"><strong>Your care stays connected</strong><span><i className="mhx-dot" style={{'--dot':'#39B7C9'} as CSSProperties}/>Records ready</span><span><i className="mhx-dot" style={{'--dot':'#9D83EF'} as CSSProperties}/>Medicines tracked</span><span><i className="mhx-dot" style={{'--dot':'#F08A63'} as CSSProperties}/>Support nearby</span></div>
          <div className="mhx-actions"><button type="button" className="mhx-button primary" onClick={openMyHealth}>Open My Health</button><button type="button" className="mhx-button secondary" onClick={()=>router.push('/doctors')}>Find a Doctor</button></div>
          <div className="mhx-privacy-note"><i><Icon kind="lock" size={15}/></i>Personal health information stays inside your private workspace.</div>
        </div>
        <div className="mhx-visual"><img className="mhx-photo" src={PHOTO} alt="Indian patient using HealthConnect at home" loading="lazy" decoding="async" onError={fallbackPhoto}/><div className="mhx-photo-badge"><i/>Your health journey, connected</div></div>
      </div>
    </div>
  </section>;
}
