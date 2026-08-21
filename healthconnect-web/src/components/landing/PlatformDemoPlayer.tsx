'use client';

import { useEffect, useMemo, useState } from 'react';

const CHAPTERS = [
  {id:'discover',label:'Find care',icon:'🩺',accent:'#38BDF8',title:'Find the doctor or hospital you need.',body:'Search explicit Doctor and Hospital directories, review the provider profile and move into the real appointment journey.'},
  {id:'book',label:'Book',icon:'📅',accent:'#A78BFA',title:'Move from discovery to a real appointment.',body:'Availability, Hospital OPD and appointment status connect the patient with the provider workflow rather than ending at a listing.'},
  {id:'health',label:'My Health',icon:'♥',accent:'#2DD4BF',title:'Keep your own health context together.',body:'Medical history, reports, prescriptions, vitals, symptoms, medicines and appointments remain available for the next consultation.'},
  {id:'community',label:'Community',icon:'🤝',accent:'#34D399',title:'Stay supported between appointments.',body:'Condition-focused communities add peer conversation, anonymous posting where enabled, moderation, reporting and Q&A.'},
  {id:'knowledge',label:'Knowledge',icon:'📚',accent:'#60A5FA',title:'Understand more before the next conversation.',body:'India-focused explainers and guides help people prepare better questions without replacing clinical diagnosis or treatment.'},
] as const;

type ChapterId = typeof CHAPTERS[number]['id'];

export default function PlatformDemoPlayer({compact=false}:{compact?:boolean}){
  const [open,setOpen]=useState(false);
  const [active,setActive]=useState<ChapterId>('discover');
  const current=useMemo(()=>CHAPTERS.find(ch=>ch.id===active)??CHAPTERS[0],[active]);

  useEffect(()=>{
    if(!open) return;
    if(typeof window!=='undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer=window.setTimeout(()=>{
      setActive(prev=>{
        const index=CHAPTERS.findIndex(ch=>ch.id===prev);
        return CHAPTERS[(index+1)%CHAPTERS.length].id;
      });
    },6200);
    return()=>window.clearTimeout(timer);
  },[open,active]);

  useEffect(()=>{
    if(!open) return;
    const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)};
    document.addEventListener('keydown',close);
    return()=>document.removeEventListener('keydown',close);
  },[open]);

  return <>
    <style>{`
      .pdp-card{position:relative;height:235px;border-radius:17px;overflow:hidden;border:1px solid rgba(94,234,212,.22);background:#07192C;box-shadow:0 18px 50px rgba(0,0,0,.22);cursor:pointer;text-align:left;color:#fff;padding:0;font-family:'DM Sans',Arial,sans-serif}.pdp-card:before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(3,12,26,.08),rgba(3,12,26,.82)),url('/images/hero-photo.png') center/cover no-repeat;transform:scale(1.02)}.pdp-card:after{content:'';position:absolute;inset:0;background:linear-gradient(115deg,rgba(13,148,136,.05),transparent 48%,rgba(56,189,248,.09))}.pdp-card-inner{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;justify-content:space-between;padding:14px}.pdp-label{display:flex;justify-content:space-between;align-items:center;font-size:8.5px;font-weight:900;letter-spacing:.12em;color:#D6ECFA}.pdp-duration{border:1px solid rgba(255,255,255,.22);background:rgba(2,12,27,.46);border-radius:999px;padding:4px 7px;color:#DDF8F3;letter-spacing:.06em}.pdp-play-wrap{display:grid;place-items:center}.pdp-play{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.94);color:#0B3550;font-size:21px;box-shadow:0 12px 34px rgba(0,0,0,.28);padding-left:3px}.pdp-bottom strong{font-family:'Sora',sans-serif;display:block;font-size:15px;margin-bottom:3px}.pdp-bottom span{font-size:9.5px;color:#C7DCEB}.pdp-card:hover .pdp-play{transform:scale(1.05)}
      .pdp-overlay{position:fixed;inset:0;z-index:5000;background:rgba(2,8,20,.86);backdrop-filter:blur(10px);display:grid;place-items:center;padding:26px;font-family:'DM Sans',Arial,sans-serif}.pdp-modal{width:min(1120px,94vw);border-radius:22px;overflow:hidden;background:#07182A;border:1px solid rgba(125,211,252,.2);box-shadow:0 28px 90px rgba(0,0,0,.45)}.pdp-modal-head{height:58px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;border-bottom:1px solid rgba(148,163,184,.15);color:#E8F3FB}.pdp-modal-head strong{font-family:'Sora',sans-serif;font-size:14px}.pdp-modal-head span{display:block;font-size:9px;color:#90A9C1;margin-top:2px}.pdp-close{width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);color:#fff;font-size:18px;cursor:pointer}.pdp-stage{min-height:480px;display:grid;grid-template-columns:1.06fr .94fr;background:radial-gradient(circle at 84% 16%,rgba(20,184,166,.16),transparent 30%),linear-gradient(135deg,#061225,#0A1D35 58%,#0B3443)}.pdp-visual{position:relative;min-height:480px;background:linear-gradient(180deg,rgba(3,12,26,.06),rgba(3,12,26,.72)),url('/images/hero-photo.png') center/cover no-repeat}.pdp-visual-chip{position:absolute;left:22px;top:22px;border-radius:999px;padding:7px 10px;background:rgba(2,12,27,.62);border:1px solid rgba(255,255,255,.18);color:#E8F4FB;font-size:9px;font-weight:850}.pdp-big-play{position:absolute;inset:0;display:grid;place-items:center}.pdp-big-play span{width:72px;height:72px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.93);color:#0F4C66;font-size:28px;padding-left:4px;box-shadow:0 18px 44px rgba(0,0,0,.32)}.pdp-caption{position:absolute;left:22px;right:22px;bottom:20px;border-radius:12px;padding:12px 14px;background:rgba(2,12,27,.72);border:1px solid rgba(255,255,255,.13);color:#F8FBFF;font-size:11px;line-height:1.5}.pdp-story{padding:34px 30px;display:flex;flex-direction:column;justify-content:center}.pdp-chapter-icon{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;font-size:22px;background:color-mix(in srgb,var(--chapter-accent) 18%,transparent);border:1px solid color-mix(in srgb,var(--chapter-accent) 32%,transparent);margin-bottom:18px}.pdp-story small{font-size:9px;font-weight:900;letter-spacing:.17em;color:var(--chapter-accent)}.pdp-story h3{font-family:'Sora',sans-serif;color:#F8FBFF;font-size:2.15rem;line-height:1.08;letter-spacing:-.035em;margin:10px 0 14px}.pdp-story p{font-size:13px;line-height:1.68;color:#B9CFE1;margin:0;max-width:470px}.pdp-player{border-top:1px solid rgba(148,163,184,.14);background:#051322;padding:13px 18px 15px}.pdp-track{height:4px;background:rgba(148,163,184,.2);border-radius:999px;overflow:hidden;margin-bottom:11px}.pdp-progress{height:100%;background:var(--chapter-accent);animation:pdpProgress 6.2s linear forwards}@keyframes pdpProgress{from{width:0}to{width:100%}}.pdp-controls{display:flex;align-items:center;gap:8px}.pdp-chapter{flex:1;border:1px solid rgba(148,163,184,.16);background:rgba(255,255,255,.035);border-radius:9px;padding:8px 6px;color:#8FA7BE;font-size:8.5px;font-weight:800;cursor:pointer;text-align:center}.pdp-chapter.active{color:#fff;border-color:var(--chapter-accent);background:color-mix(in srgb,var(--chapter-accent) 10%,transparent)}.pdp-note{margin-left:8px;color:#6F8AA5;font-size:8px;white-space:nowrap}.pdp-note b{color:#A8C1D6}.pdp-compact{height:210px}
      @media(max-width:850px){.pdp-stage{grid-template-columns:1fr}.pdp-visual{min-height:300px}.pdp-story{padding:28px}.pdp-story h3{font-size:1.8rem}.pdp-note{display:none}}
      @media(max-width:580px){.pdp-overlay{padding:10px}.pdp-modal-head{height:54px}.pdp-stage{min-height:0}.pdp-visual{min-height:240px}.pdp-story{padding:22px}.pdp-story h3{font-size:1.55rem}.pdp-controls{overflow-x:auto}.pdp-chapter{min-width:92px}}
    `}</style>

    <button className={`pdp-card ${compact?'pdp-compact':''}`} onClick={()=>setOpen(true)} aria-label="Open HealthConnect platform demo">
      <div className="pdp-card-inner">
        <div className="pdp-label"><span>HEALTHCONNECT PLATFORM DEMO</span><span className="pdp-duration">▶ 90 SEC</span></div>
        <div className="pdp-play-wrap"><span className="pdp-play">▶</span></div>
        <div className="pdp-bottom"><strong>See the whole platform in one story</strong><span>Patients · Communities · Doctors · Hospitals · Knowledge</span></div>
      </div>
    </button>

    {open&&<div className="pdp-overlay" role="dialog" aria-modal="true" aria-label="HealthConnect platform demo" onMouseDown={event=>{if(event.target===event.currentTarget)setOpen(false)}}>
      <div className="pdp-modal" style={{'--chapter-accent':current.accent} as React.CSSProperties}>
        <div className="pdp-modal-head"><div><strong>HealthConnect Platform Demo</strong><span>Interactive storyboard · final narrated video will use this journey</span></div><button className="pdp-close" onClick={()=>setOpen(false)} aria-label="Close platform demo">×</button></div>
        <div className="pdp-stage">
          <div className="pdp-visual"><span className="pdp-visual-chip">{current.icon} {current.label}</span><div className="pdp-big-play"><span>▶</span></div><div className="pdp-caption">{current.title}</div></div>
          <div className="pdp-story"><div className="pdp-chapter-icon">{current.icon}</div><small>{current.label.toUpperCase()} · HEALTHCONNECT JOURNEY</small><h3>{current.title}</h3><p>{current.body}</p></div>
        </div>
        <div className="pdp-player"><div className="pdp-track"><div key={active} className="pdp-progress"/></div><div className="pdp-controls">{CHAPTERS.map(ch=><button key={ch.id} className={`pdp-chapter ${active===ch.id?'active':''}`} onClick={()=>setActive(ch.id)}>{ch.icon} {ch.label}</button>)}<span className="pdp-note"><b>AUTO</b> · voice + captions planned</span></div></div>
      </div>
    </div>}
  </>;
}
