'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const SCENES = [
  {
    icon:'🩺', label:'Find Doctors', accent:'#38BDF8', title:'Start with the specialist you need.',
    copy:'Search doctor profiles by specialty and location, review consultation options and move into the real appointment journey when you are ready.',
    points:['Doctor profile & HealthConnect status','Availability and consultation options','Appointment booking workflow'], href:'/doctors'
  },
  {
    icon:'🤝', label:'Health Communities', accent:'#34D399', title:'Stay supported between appointments.',
    copy:'Join condition-focused communities, ask questions, attend Q&A events and use anonymous posting where the community allows it.',
    points:['Condition-focused support','Anonymous-post controls','Membership, reports & moderation'], href:'/communities'
  },
  {
    icon:'🏥', label:'Find Hospitals', accent:'#F59E0B', title:'Know the hospital before you visit.',
    copy:'Compare departments, facilities, affiliated doctors, accepted schemes or insurance information and hospital-specific OPD.',
    points:['Departments & facilities','Affiliated doctors','Hospital-specific OPD'], href:'/hospitals'
  },
  {
    icon:'♥', label:'My Health', accent:'#2DD4BF', title:'Keep the health journey together.',
    copy:'Bring reports, medicines, symptoms, vitals and appointments into one patient workspace so the next visit does not start from zero.',
    points:['Medical history & reports','Vitals, symptoms & medicines','Appointments and follow-up'], href:'/?home=1&auth=login'
  },
  {
    icon:'📚', label:'Knowledge Hub', accent:'#A78BFA', title:'Understand more before the next conversation.',
    copy:'Use India-focused health explainers and condition guides to prepare better questions for a healthcare professional.',
    points:['Condition explainers','India-focused health topics','Educational content, not diagnosis'], href:'/learn'
  },
] as const;

export default function PlatformExplainer(){
  const [active,setActive]=useState(0);
  const [playing,setPlaying]=useState(true);

  useEffect(()=>{
    if(!playing) return;
    if(typeof window!=='undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer=window.setTimeout(()=>setActive(i=>(i+1)%SCENES.length),4800);
    return()=>window.clearTimeout(timer);
  },[active,playing]);

  const scene=SCENES[active];

  return <section className="explainer-section">
    <style>{`
      .explainer-section{background:#F8FAFC;padding:48px 28px 52px;font-family:'DM Sans',Arial,sans-serif}.explainer-inner{max-width:1280px;margin:0 auto}.explainer-head{display:flex;justify-content:space-between;align-items:end;gap:34px;margin-bottom:20px}.explainer-kicker{font-size:10px;font-weight:900;letter-spacing:.18em;color:#2563EB;margin-bottom:8px}.explainer-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,3.1vw,3.45rem);line-height:1.03;letter-spacing:-.045em;color:#0F172A;margin:0}.explainer-copy{max-width:430px;font-size:13px;line-height:1.6;color:#64748B;margin:0}
      .explainer-frame{background:radial-gradient(circle at 20% 10%,rgba(56,189,248,.12),transparent 28%),linear-gradient(135deg,#061225,#0A1C35 62%,#0D2945);border-radius:22px;overflow:hidden;box-shadow:0 18px 52px rgba(15,23,42,.14);border:1px solid #102A48}.explainer-stage{height:390px;display:grid;grid-template-columns:.95fr 1.05fr;gap:34px;align-items:center;padding:34px 42px;position:relative}.explainer-stage:before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px);background-size:40px 40px;mask-image:linear-gradient(to right,transparent,#000 38%,#000);pointer-events:none}
      .scene-copy{position:relative;z-index:1}.scene-label{display:flex;align-items:center;gap:9px;font-size:10px;font-weight:900;letter-spacing:.14em;color:var(--accent);margin-bottom:11px}.scene-icon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:color-mix(in srgb,var(--accent) 14%,transparent);font-size:17px}.scene-copy h3{font-family:'Sora',sans-serif;color:#F8FBFF;font-size:clamp(2rem,3vw,3.35rem);line-height:1.04;letter-spacing:-.045em;margin:0 0 13px;max-width:560px}.scene-copy p{font-size:13px;line-height:1.65;color:#B7CCE2;max-width:570px;margin:0 0 17px}.scene-points{display:grid;gap:7px;margin-bottom:18px}.scene-points span{display:flex;align-items:center;gap:8px;font-size:10px;color:#D6E4F2}.scene-points span:before{content:'✓';width:17px;height:17px;border-radius:5px;background:var(--accent);color:#061225;display:grid;place-items:center;font-size:8px;font-weight:900}.scene-link{display:inline-flex;padding:9px 13px;border-radius:8px;background:var(--accent);color:#061225;font-size:10px;font-weight:900;text-decoration:none}
      .scene-visual{position:relative;z-index:1;background:rgba(255,255,255,.05);border:1px solid rgba(148,163,184,.17);border-radius:18px;padding:16px;min-height:300px}.visual-top{display:flex;align-items:center;justify-content:space-between;color:#8EA8C4;font-size:8px;font-weight:900;letter-spacing:.12em;margin-bottom:14px}.visual-live{display:flex;align-items:center;gap:6px;color:#86EFAC}.visual-live:before{content:'';width:6px;height:6px;border-radius:50%;background:#22C55E;box-shadow:0 0 0 4px rgba(34,197,94,.12)}.journey-map{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;align-items:stretch}.journey-node{min-height:168px;border-radius:13px;background:rgba(255,255,255,.045);border:1px solid rgba(148,163,184,.12);padding:13px 9px;display:flex;flex-direction:column;justify-content:space-between;opacity:.47;transition:.3s}.journey-node.active{background:#F8FBFF;border-color:var(--accent);opacity:1;transform:translateY(-4px);box-shadow:0 12px 30px rgba(0,0,0,.16)}.journey-node i{font-style:normal;font-size:21px}.journey-node b{font-size:9px;line-height:1.3;color:#AFC4DA}.journey-node.active b{color:#0F172A}.journey-node small{font-size:6.5px;line-height:1.35;color:#7390AE}.journey-node.active small{color:#64748B}.community-callout{margin-top:10px;border-radius:10px;padding:9px 11px;background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.14);font-size:8.5px;line-height:1.4;color:#B8ECDC}.community-callout strong{color:#6EE7B7}
      .explainer-controls{height:52px;background:#030B16;border-top:1px solid rgba(148,163,184,.12);display:flex;align-items:center;gap:12px;padding:0 16px}.play-btn{width:34px;height:34px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:#0C1725;color:#fff;cursor:pointer;font-size:13px}.timeline{display:flex;gap:6px;align-items:center;flex:1}.timeline-btn{height:6px;flex:1;border:0;border-radius:999px;background:#263548;padding:0;overflow:hidden;cursor:pointer}.timeline-btn span{display:block;height:100%;width:0;background:#38BDF8}.timeline-btn.done span{width:100%;background:#4A6582}.timeline-btn.active span{animation:timelineFill 4.8s linear forwards;background:var(--accent)}@keyframes timelineFill{from{width:0}to{width:100%}}.time-label{font-size:8px;color:#8EA8C4;white-space:nowrap}.scene-tabs{display:none}
      @media(max-width:950px){.explainer-stage{height:auto;grid-template-columns:1fr;padding:32px}.scene-visual{min-height:260px}}
      @media(max-width:650px){.explainer-section{padding:40px 14px}.explainer-head{align-items:start;flex-direction:column}.explainer-stage{padding:25px 18px}.scene-copy h3{font-size:2.15rem}.journey-map{grid-template-columns:1fr 1fr}.journey-node{min-height:110px}.journey-node:last-child{grid-column:1/-1}.explainer-controls{height:48px}.time-label{display:none}}
    `}</style>

    <div className="explainer-inner">
      <div className="explainer-head">
        <div><div className="explainer-kicker">HOW HEALTHCONNECT WORKS</div><h2 className="explainer-title">One platform. Five connected ways to use it.</h2></div>
        <p className="explainer-copy">Like a short product video, this overview plays through the HealthConnect journey automatically. Pause it, choose any chapter, or follow the links into the live platform.</p>
      </div>

      <div className="explainer-frame" style={{'--accent':scene.accent} as React.CSSProperties}>
        <div className="explainer-stage">
          <div className="scene-copy" key={`copy-${active}`}>
            <div className="scene-label"><span className="scene-icon">{scene.icon}</span>{String(active+1).padStart(2,'0')} · {scene.label.toUpperCase()}</div>
            <h3>{scene.title}</h3><p>{scene.copy}</p>
            <div className="scene-points">{scene.points.map(point=><span key={point}>{point}</span>)}</div>
            <Link className="scene-link" href={scene.href}>Explore {scene.label} →</Link>
          </div>

          <div className="scene-visual">
            <div className="visual-top"><span>HEALTHCONNECT · INTERACTIVE OVERVIEW</span><span className="visual-live">LIVE PLATFORM</span></div>
            <div className="journey-map">
              {SCENES.map((item,i)=><button key={item.label} className={`journey-node ${i===active?'active':''}`} style={{'--accent':item.accent} as React.CSSProperties} onClick={()=>{setActive(i);setPlaying(false)}}><i>{item.icon}</i><div><b>{item.label}</b><small>{i===0?'Search & book':i===1?'Peer support':i===2?'Hospital OPD':i===3?'Health journey':'Learn & prepare'}</small></div></button>)}
            </div>
            <div className="community-callout"><strong>Health Communities is a core HealthConnect pillar.</strong> It extends support beyond a single appointment and connects peer conversation, Q&A and moderation to the same platform where users already find care and manage health information.</div>
          </div>
        </div>

        <div className="explainer-controls">
          <button className="play-btn" onClick={()=>setPlaying(v=>!v)} aria-label={playing?'Pause overview':'Play overview'}>{playing?'Ⅱ':'▶'}</button>
          <div className="timeline">{SCENES.map((item,i)=><button key={item.label} className={`timeline-btn ${i<active?'done':''} ${i===active?'active':''}`} style={{'--accent':item.accent} as React.CSSProperties} onClick={()=>{setActive(i);setPlaying(false)}} aria-label={`Show ${item.label}`}><span/></button>)}</div>
          <span className="time-label">{active+1} / {SCENES.length} · {playing?'PLAYING':'PAUSED'}</span>
        </div>
      </div>
    </div>
  </section>;
}
