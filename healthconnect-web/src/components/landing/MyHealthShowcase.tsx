'use client';

import type { CSSProperties, SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import InfoPopover from '@/components/landing/InfoPopover';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const FEATURES = [
  {title:'Appointments',copy:'View and manage upcoming visits in one place.',icon:'calendar',bg:'#2F4E6F',iconBg:'#426683',meta:'Plan the next care step'},
  {title:'Medications',copy:'Track medicines, schedules and reminders.',icon:'pill',bg:'#5C5574',iconBg:'#716985',meta:'Stay on schedule'},
  {title:'Health Records',copy:'Keep reports, medical history and health documents together.',icon:'report',bg:'#2F6670',iconBg:'#447C85',meta:'History ready when needed'},
  {title:'Peer Support',copy:'Find relevant health communities and lived experience.',icon:'community',bg:'#765B52',iconBg:'#8B7067',meta:'Support between visits'},
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
      .mhx-section{scroll-margin-top:76px;background:#D9E3E8;padding:42px 22px 52px;border-top:1px solid #C1CFD7;border-bottom:1px solid #C1CFD7;font-family:'DM Sans',Arial,sans-serif;color:#10243C}.mhx-shell{width:min(100%,1380px);margin:0 auto}.mhx-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(340px,.52fr);gap:42px;align-items:end;margin:0 6px 18px}.mhx-kicker{font-size:13px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#2B746E;margin-bottom:7px}.mhx-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.05rem,2.7vw,2.9rem);line-height:1.03;letter-spacing:-.05em;color:#17364D;margin:0}.mhx-head h2 span{color:#2F7D75}.mhx-head p{font-size:15.5px;line-height:1.48;color:#465F70;margin:0 0 3px;max-width:530px}
      .mhx-canvas{position:relative;min-height:500px;border-radius:28px;overflow:hidden;background:linear-gradient(112deg,#F8FAFB 0%,#EEF4F6 55%,#DDEBED 100%);border:1px solid #B7C8D1;box-shadow:0 18px 42px rgba(26,55,72,.12)}.mhx-content{position:relative;z-index:4;width:59%;min-height:500px;padding:30px 30px 24px 32px;box-sizing:border-box;background:linear-gradient(90deg,rgba(248,250,251,.995) 0%,rgba(244,248,249,.98) 83%,rgba(244,248,249,.08) 100%)}
      .mhx-topline{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}.mhx-title h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.78rem,2.05vw,2.18rem);line-height:1.04;letter-spacing:-.045em;color:#17364D;margin:0}.mhx-title h3 span{display:block;color:#2F7D75;margin-top:3px}.mhx-title p{font-size:13.5px;line-height:1.42;color:#526979;margin:8px 0 0;max-width:365px}.mhx-rule{width:42px;height:3px;border-radius:999px;background:#2F7D75;margin-top:11px}
      .mhx-score{width:250px;border-radius:17px;padding:13px 14px 12px;background:#E7EEF4;border:1px solid #AFC2D0;box-shadow:0 9px 20px rgba(40,76,116,.08)}.mhx-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.mhx-card-head b{font-family:'Sora','DM Sans',sans-serif;font-size:12px;color:#17364D}.mhx-score-body{display:grid;grid-template-columns:76px 60px 1fr;align-items:center;gap:9px;margin-top:8px}.mhx-gauge{position:relative;width:76px;height:46px}.mhx-gauge svg{position:absolute;inset:0;width:76px;height:46px}.mhx-score-num{font-family:'Sora','DM Sans',sans-serif;font-size:30px;font-weight:900;line-height:.9;color:#17364D}.mhx-score-num span{display:block;margin-top:6px;font:900 8.5px 'DM Sans',Arial,sans-serif;color:#2F7D75;letter-spacing:.08em}.mhx-signals{display:grid;gap:4px}.mhx-signal{font-size:8.5px;color:#667C8B;line-height:1.08}.mhx-signal b{display:block;font-size:9.2px;margin-top:1px}.mhx-signal.good b{color:#2F7D75}.mhx-signal.info b{color:#405F82}.mhx-signal.focus b{color:#A05A3D}.mhx-score-foot{margin-top:7px;padding-top:6px;border-top:1px solid #C8D5DE;font-size:8.6px;line-height:1.25;color:#5C7180}
      .mhx-feature-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px}.mhx-feature{min-height:106px;border-radius:16px;padding:15px 16px;background:var(--card-bg);border:1px solid rgba(255,255,255,.10);display:grid;grid-template-columns:44px 1fr;gap:13px;align-items:start;color:#fff;box-shadow:0 10px 22px rgba(24,48,72,.10);transition:transform .17s ease,box-shadow .17s ease}.mhx-feature:hover{transform:translateY(-2px);box-shadow:0 14px 26px rgba(24,48,72,.14)}.mhx-feature-icon{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:var(--icon-bg);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.10)}.mhx-feature b{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:14px;line-height:1.2;color:#fff;margin:1px 0 5px}.mhx-feature p{font-size:12px;line-height:1.42;color:#E5EDF1;margin:0}.mhx-feature small{display:inline-flex;margin-top:8px;padding:4px 7px;border-radius:999px;background:rgba(255,255,255,.10);font-size:9.4px;line-height:1;color:#F1F5F7;font-weight:800}
      .mhx-continuity{display:grid;grid-template-columns:auto repeat(3,1fr);gap:8px;align-items:center;margin-top:13px;padding:10px 11px;border-radius:13px;background:#203A4D;border:1px solid #315064;color:#fff}.mhx-continuity strong{font-size:10.4px;color:#fff;white-space:nowrap}.mhx-continuity span{display:flex;align-items:center;justify-content:center;gap:6px;font-size:9.7px;color:#D8E3E9;padding:4px 6px;border-left:1px solid rgba(255,255,255,.13)}.mhx-dot{width:7px;height:7px;border-radius:50%;background:var(--dot);box-shadow:0 0 0 4px color-mix(in srgb,var(--dot) 18%, transparent)}
      .mhx-actions{display:flex;gap:10px;align-items:center;margin-top:13px}.mhx-button{border-radius:10px;padding:10px 15px;font-size:12.3px;font-weight:900;cursor:pointer;transition:transform .16s ease,box-shadow .16s ease}.mhx-button:hover{transform:translateY(-1px)}.mhx-button:focus-visible{outline:3px solid rgba(47,78,111,.25);outline-offset:3px}.mhx-button.primary{border:1px solid #2F4E6F;background:#2F4E6F;color:#fff;box-shadow:0 8px 18px rgba(47,78,111,.18)}.mhx-button.secondary{border:1px solid #AFC1CC;background:#EEF3F5;color:#35546A}.mhx-privacy-note{display:flex;align-items:center;gap:7px;margin-top:10px;color:#526A79;font-size:10.8px;font-weight:700}.mhx-privacy-note i{width:27px;height:27px;border-radius:9px;display:grid;place-items:center;background:#DDEAE5;color:#2F6F59;font-style:normal}
      .mhx-visual{position:absolute;z-index:1;right:0;top:0;width:44%;height:100%;overflow:hidden;background:#D9E8EA}.mhx-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:82% 50%;display:block}.mhx-visual:before{content:'';position:absolute;z-index:2;inset:0;background:linear-gradient(90deg,rgba(244,248,249,.72) 0%,rgba(244,248,249,.16) 18%,transparent 34%),linear-gradient(180deg,transparent 74%,rgba(20,54,68,.07) 100%);pointer-events:none}.mhx-photo-badge{position:absolute;z-index:3;right:17px;bottom:16px;display:flex;align-items:center;gap:7px;padding:8px 11px;border-radius:999px;background:rgba(255,255,255,.88);backdrop-filter:blur(9px);border:1px solid rgba(255,255,255,.76);font-size:9.5px;font-weight:850;color:#17364D;box-shadow:0 8px 18px rgba(20,48,65,.08)}.mhx-photo-badge i{width:8px;height:8px;border-radius:50%;background:#2F7D75;box-shadow:0 0 0 4px rgba(47,125,117,.12)}
      @media(max-width:1080px){.mhx-head{grid-template-columns:1fr;gap:8px}.mhx-canvas{padding-top:400px;min-height:0}.mhx-visual{left:0;right:0;top:0;width:100%;height:400px}.mhx-photo{object-position:76% 50%}.mhx-content{width:100%;min-height:0;padding:27px}.mhx-feature-grid,.mhx-continuity{max-width:820px}}@media(max-width:760px){.mhx-section{padding:34px 12px 40px}.mhx-head{margin:0 4px 15px}.mhx-head h2{font-size:2.05rem}.mhx-head p{font-size:14.5px}.mhx-canvas{padding-top:330px;border-radius:22px}.mhx-visual{height:330px}.mhx-content{padding:22px 18px}.mhx-topline{display:grid;grid-template-columns:1fr}.mhx-score{width:100%;max-width:400px}.mhx-feature-grid{grid-template-columns:1fr}.mhx-continuity{grid-template-columns:1fr}.mhx-continuity span{justify-content:flex-start;border-left:0;border-top:1px solid rgba(255,255,255,.13)}.mhx-actions{flex-wrap:wrap}}@media(max-width:480px){.mhx-canvas{padding-top:280px}.mhx-visual{height:280px}.mhx-actions{display:grid;grid-template-columns:1fr 1fr}.mhx-button{width:100%}}
    `}</style>

    <div className="mhx-shell">
      <div className="mhx-head"><div><div className="mhx-kicker">My Health · Patient Dashboard</div><h2 id="mhx-title">Your health, organised for <span>what comes next.</span></h2></div><p>See your health status, appointments, medicines, records and support in one connected private workspace.</p></div>

      <div className="mhx-canvas">
        <div className="mhx-content">
          <div className="mhx-topline">
            <div className="mhx-title"><h3>Your health.<span>All in one place.</span></h3><p>Track. Understand. Organise. Continue care.</p><div className="mhx-rule"/></div>
            <aside className="mhx-score" aria-label="Illustrative Health Score preview">
              <div className="mhx-card-head"><b>Your Health Score</b><InfoPopover ariaLabel="About Health Score" title="How Health Score works" width={235}>The score shown here is illustrative. In My Health, your score uses measurable health information available in your profile. It is not a diagnosis, and assessment completion is shown separately.</InfoPopover></div>
              <div className="mhx-score-body">
                <div className="mhx-gauge"><svg viewBox="0 0 120 70" aria-hidden="true"><path d="M12 60 A48 48 0 0 1 108 60" fill="none" stroke="#D5E1E7" strokeWidth="10" strokeLinecap="round"/><path d="M12 60 A48 48 0 0 1 96 28" fill="none" stroke="#5AA79D" strokeWidth="10" strokeLinecap="round"/></svg></div>
                <div className="mhx-score-num">84<span>GOOD</span></div>
                <div className="mhx-signals"><div className="mhx-signal good">Physical<b>Good</b></div><div className="mhx-signal info">Wellbeing<b>Good</b></div><div className="mhx-signal focus">Lifestyle<b>Review</b></div></div>
              </div>
              <div className="mhx-score-foot">Illustrative preview · your live dashboard reflects available health data.</div>
            </aside>
          </div>

          <div className="mhx-feature-grid">
            {FEATURES.map(feature=><article className="mhx-feature" key={feature.title} style={{'--card-bg':feature.bg,'--icon-bg':feature.iconBg} as CSSProperties}><span className="mhx-feature-icon"><Icon kind={feature.icon} size={18}/></span><div><b>{feature.title}</b><p>{feature.copy}</p><small>{feature.meta}</small></div></article>)}
          </div>

          <div className="mhx-continuity"><strong>Your care stays connected</strong><span><i className="mhx-dot" style={{'--dot':'#67A7B1'} as CSSProperties}/>Records ready</span><span><i className="mhx-dot" style={{'--dot':'#8E84AB'} as CSSProperties}/>Medicines tracked</span><span><i className="mhx-dot" style={{'--dot':'#B18B78'} as CSSProperties}/>Support nearby</span></div>

          <div className="mhx-actions"><button type="button" className="mhx-button primary" onClick={openMyHealth}>Open My Health</button><button type="button" className="mhx-button secondary" onClick={()=>router.push('/doctors')}>Find a Doctor</button></div>
          <div className="mhx-privacy-note"><i><Icon kind="lock" size={15}/></i>Private health information stays inside your authenticated workspace.</div>
        </div>

        <div className="mhx-visual"><img className="mhx-photo" src={PHOTO} alt="Indian patient using HealthConnect at home" loading="lazy" decoding="async" onError={fallbackPhoto}/><div className="mhx-photo-badge"><i/>Your health journey, connected</div></div>
      </div>
    </div>
  </section>;
}
