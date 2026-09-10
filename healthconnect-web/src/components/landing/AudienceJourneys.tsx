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

const HEALTH_JOURNEYS=[
  {label:'UNDERSTAND',title:'Know what needs attention',items:'Health Score · symptoms · vitals',icon:'pulse',accent:'#55D7C7'},
  {label:'ORGANISE',title:'Keep your health story together',items:'Medicines · reports · reminders',icon:'folder',accent:'#91A7FF'},
  {label:'CONTINUE CARE',title:'Move into the next care step',items:'Appointments · doctor context · peer support',icon:'path',accent:'#F6B36B'},
] as const;

const PHOTOS={patient:'/images/my-health/patient-main.png'} as const;

function Icon({kind,size=22}:{kind:string;size?:number}){
  const common={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.9,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};
  if(kind==='heart') return <svg {...common}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>;
  if(kind==='pulse') return <svg {...common}><path d="M3 12h4l2-5 4 10 2-5h6"/></svg>;
  if(kind==='folder') return <svg {...common}><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M8 12h8M8 16h5"/></svg>;
  if(kind==='path') return <svg {...common}><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h2a4 4 0 0 0 4-4v-4a4 4 0 0 1 4-4"/></svg>;
  if(kind==='community') return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>;
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

      .mh-section{padding:46px 22px 52px;background:#F3EFE8;scroll-margin-top:76px;border-top:1px solid #E4DDD2}.mh-shell{width:min(100%,1380px);margin:0 auto}.mh-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(330px,.52fr);gap:48px;align-items:end;margin:0 6px 21px}.mh-kicker{font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#2F5BEA;margin-bottom:7px}.mh-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.1rem,2.75vw,3rem);line-height:1.02;letter-spacing:-.052em;color:#0D2941;margin:0;max-width:720px}.mh-head p{font-size:15px;line-height:1.52;color:#536A7B;margin:0 0 4px;max-width:510px}

      .mh-stage{position:relative;min-height:470px;border-radius:28px;overflow:hidden;background:#102E4A;box-shadow:0 22px 46px rgba(14,42,67,.18);border:1px solid #173D5F}.mh-panel{position:relative;z-index:5;width:49%;min-height:470px;padding:34px 36px 30px 38px;box-sizing:border-box;background:linear-gradient(135deg,#0E2C48 0%,#123A5D 76%,rgba(18,58,93,.94) 100%);color:#fff}.mh-panel:after{content:'';position:absolute;right:-122px;top:0;width:170px;height:100%;background:linear-gradient(90deg,#123A5D 0%,rgba(18,58,93,.87) 26%,rgba(18,58,93,.34) 68%,transparent 100%);pointer-events:none}.mh-panel-top{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}.mh-panel-kicker{font-size:10.5px;font-weight:900;letter-spacing:.15em;text-transform:uppercase;color:#8FD7FF;margin-bottom:7px}.mh-panel h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.75rem,2.05vw,2.25rem);line-height:1.06;letter-spacing:-.045em;color:#fff;margin:0;max-width:470px}.mh-panel-intro{font-size:13px;line-height:1.46;color:#C7D9E6;margin:9px 0 0;max-width:500px}

      .mh-score{margin-top:18px;border-radius:18px;background:linear-gradient(135deg,rgba(255,255,255,.97),rgba(240,246,255,.96));color:#15344E;padding:14px 15px 13px;border:1px solid rgba(255,255,255,.72);box-shadow:0 12px 28px rgba(0,0,0,.13)}.mh-score-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.mh-score-head b{font-family:'Sora','DM Sans',sans-serif;font-size:12.5px}.mh-score-main{display:grid;grid-template-columns:96px 72px 1fr;gap:12px;align-items:center;margin-top:8px}.mh-gauge{position:relative;width:96px;height:55px}.mh-gauge svg{position:absolute;inset:0;width:96px;height:55px}.mh-score-num{font-family:'Sora','DM Sans',sans-serif;font-size:35px;font-weight:900;line-height:.9;color:#0D2941}.mh-score-num span{display:block;font:900 9.5px 'DM Sans',Arial,sans-serif;color:#0F8E7E;letter-spacing:.08em;margin-top:6px}.mh-signal-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.mh-signal{min-width:0;padding-left:8px;border-left:1px solid #CCD9E5}.mh-signal small{display:block;font-size:8.7px;color:#6A7D8D}.mh-signal b{display:block;font-size:10px;margin-top:2px}.mh-signal.good b{color:#0F8E7E}.mh-signal.focus b{color:#D06B2F}.mh-signal.info b{color:#2F5BEA}.mh-score-foot{margin-top:8px;padding-top:7px;border-top:1px solid #D7E1EA;font-size:8.8px;color:#6B7F8E}

      .mh-journeys{margin-top:16px;border-top:1px solid rgba(255,255,255,.13)}.mh-journey{display:grid;grid-template-columns:38px 1fr;gap:11px;align-items:center;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.13)}.mh-journey-icon{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:rgba(255,255,255,.08)}.mh-journey-label{font-size:8.7px;font-weight:900;letter-spacing:.12em;color:var(--journey-accent)}.mh-journey h4{font-family:'Sora','DM Sans',sans-serif;font-size:12.8px;line-height:1.22;color:#fff;margin:2px 0 2px}.mh-journey p{font-size:10.4px;line-height:1.34;color:#BFD1DE;margin:0}.mh-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:16px}.mh-action{border-radius:10px;padding:10px 15px;font-size:11.8px;font-weight:900;cursor:pointer;transition:transform .16s ease,box-shadow .16s ease}.mh-action:hover{transform:translateY(-1px)}.mh-action.primary{border:1px solid #F4C868;background:#F4C868;color:#17324A;box-shadow:0 10px 22px rgba(244,200,104,.18)}.mh-action.secondary{border:1px solid rgba(255,255,255,.34);background:rgba(255,255,255,.08);color:#fff;backdrop-filter:blur(8px)}

      .mh-visual{position:absolute;z-index:1;right:0;top:0;width:57%;height:100%;overflow:hidden;background:#DCEAF0}.mh-visual-bg{position:absolute;inset:-22px;background-position:center;background-size:cover;filter:blur(24px) saturate(.92);transform:scale(1.08);opacity:.54}.mh-visual-wash{position:absolute;inset:0;background:linear-gradient(90deg,rgba(18,58,93,.25) 0%,rgba(18,58,93,.03) 26%,rgba(221,235,240,.08) 100%)}.mh-photo{position:absolute;z-index:2;inset:0;width:100%;height:100%;object-fit:contain;object-position:center bottom;display:block;filter:saturate(.98) contrast(1.01)}.mh-visual:after{content:'';position:absolute;z-index:3;inset:0;background:linear-gradient(90deg,rgba(18,58,93,.48) 0%,rgba(18,58,93,.12) 18%,transparent 34%),linear-gradient(180deg,transparent 78%,rgba(12,39,59,.12) 100%);pointer-events:none}.mh-photo-caption{position:absolute;z-index:4;right:20px;bottom:18px;display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.86);backdrop-filter:blur(9px);border:1px solid rgba(255,255,255,.72);color:#17354A;font-size:9.5px;font-weight:850;box-shadow:0 8px 20px rgba(20,48,65,.10)}.mh-photo-caption i{width:8px;height:8px;border-radius:50%;background:#0F9D8D;box-shadow:0 0 0 4px rgba(15,157,141,.12)}

      @media(max-width:1080px){.journey-nav{grid-template-columns:repeat(3,1fr)}.mh-head{grid-template-columns:1fr;gap:8px}.mh-stage{min-height:0;padding-top:430px}.mh-visual{top:0;left:0;right:0;width:100%;height:430px}.mh-visual:after{background:linear-gradient(180deg,transparent 58%,rgba(14,44,72,.52) 100%)}.mh-panel{width:100%;min-height:0;padding:29px 30px 31px}.mh-panel:after{display:none}.mh-panel-top{max-width:760px}.mh-score{max-width:760px}.mh-journeys{max-width:760px}}
      @media(max-width:700px){.journey-nav-wrap{width:min(calc(100% - 24px),1360px)}.journey-nav{grid-template-columns:1fr 1fr}.mh-section{padding:36px 12px 42px}.mh-head h2{font-size:2.15rem}.mh-head p{font-size:14.5px}.mh-stage{padding-top:340px;border-radius:22px}.mh-visual{height:340px}.mh-panel{padding:25px 19px 27px}.mh-panel h3{font-size:1.85rem}.mh-score-main{grid-template-columns:82px 66px 1fr}.mh-gauge,.mh-gauge svg{width:82px;height:48px}.mh-score-num{font-size:31px}.mh-signal-grid{gap:4px}.mh-actions{display:grid;grid-template-columns:1fr 1fr}.mh-action{width:100%}.mh-photo-caption{right:12px;bottom:12px}}
      @media(max-width:500px){.journey-nav{grid-template-columns:1fr}.mh-stage{padding-top:300px}.mh-visual{height:300px}.mh-score-main{grid-template-columns:80px 1fr}.mh-signal-grid{grid-column:1/-1;border-top:1px solid #D7E1EA;padding-top:7px}.mh-actions{grid-template-columns:1fr}.mh-photo-caption{display:none}}
    `}</style>

    <div className="journey-nav-wrap"><div className="journey-nav-title">Explore HealthConnect</div><div className="journey-nav">{NAV_ITEMS.map(item=><button key={item.label} type="button" className="journey-pill" style={{background:item.wash}} onClick={()=>goto(item.target)}><span className="journey-icon" style={{color:item.accent}}><Icon kind={item.icon} size={18}/></span><span><b>{item.label}</b><small>{item.sub}</small></span></button>)}</div></div>

    <section className="mh-section" id="my-health-story" aria-labelledby="my-health-title"><div className="mh-shell">
      <div className="mh-head"><div><div className="mh-kicker">My Health · Patient workspace</div><h2 id="my-health-title">Your health story. Ready for the next care step.</h2></div><p>Understand what matters, keep your records organised and carry useful context into the next appointment.</p></div>

      <div className="mh-stage">
        <div className="mh-visual" aria-hidden="true"><div className="mh-visual-bg" style={{backgroundImage:`url('${PHOTOS.patient}')`}}/><div className="mh-visual-wash"/><img className="mh-photo" src={PHOTOS.patient} alt="" loading="lazy" decoding="async" onError={hideBrokenImage}/><div className="mh-photo-caption"><i/>Private health workspace</div></div>

        <div className="mh-panel">
          <div className="mh-panel-top"><div><div className="mh-panel-kicker">MY HEALTH AT A GLANCE</div><h3>See what matters now. Keep the full journey behind it.</h3><p className="mh-panel-intro">One calm view for understanding, organisation and the next care action.</p></div></div>

          <aside className="mh-score" aria-label="Illustrative Health Score preview">
            <div className="mh-score-head"><b>Your Health Score</b><InfoPopover ariaLabel="About Health Score" title="How Health Score works" width={250}>The score shown here is an illustrative landing-page preview. In My Health, your Health Score uses measurable information available in your profile. Assessment completion remains separate from the score and the result is not a diagnosis.</InfoPopover></div>
            <div className="mh-score-main">
              <div className="mh-gauge"><svg viewBox="0 0 120 70" aria-hidden="true"><path d="M12 60 A48 48 0 0 1 108 60" fill="none" stroke="#D6E1EA" strokeWidth="10" strokeLinecap="round"/><path d="M12 60 A48 48 0 0 1 96 28" fill="none" stroke="#21B8A6" strokeWidth="10" strokeLinecap="round"/></svg></div>
              <div className="mh-score-num">84<span>GOOD</span></div>
              <div className="mh-signal-grid"><div className="mh-signal good"><small>Physical</small><b>Good</b></div><div className="mh-signal good"><small>Wellbeing</small><b>Good</b></div><div className="mh-signal focus"><small>Lifestyle</small><b>Review</b></div></div>
            </div>
            <div className="mh-score-foot">Illustrative preview · your live dashboard reflects available health data.</div>
          </aside>

          <div className="mh-journeys">
            {HEALTH_JOURNEYS.map(item=><div className="mh-journey" key={item.label} style={{'--journey-accent':item.accent} as CSSProperties}><span className="mh-journey-icon" style={{color:item.accent}}><Icon kind={item.icon} size={18}/></span><div><div className="mh-journey-label">{item.label}</div><h4>{item.title}</h4><p>{item.items}</p></div></div>)}
          </div>

          <div className="mh-actions"><button type="button" className="mh-action primary" onClick={()=>router.push('/dashboard')}>Open My Health</button><button type="button" className="mh-action secondary" onClick={()=>router.push('/doctors')}>Find a Doctor</button></div>
        </div>
      </div>
    </div></section>
  </section>;
}
