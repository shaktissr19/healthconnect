'use client';

import type { CSSProperties } from 'react';

const ITEMS = [
  {title:'Private health workspace',copy:'Personal health information stays behind authenticated access and role-aware permissions.',accent:'#2459C4',icon:'lock',tag:'PRIVATE ACCESS'},
  {title:'Sharing stays your choice',copy:'Supported sharing follows patient choice and the care workflow rather than public discovery.',accent:'#087D72',icon:'share',tag:'YOUR CONTROL'},
  {title:'Provider status is visible',copy:'Doctor and hospital profiles show HealthConnect verification status clearly where supported.',accent:'#6D45C6',icon:'check',tag:'CLEAR STATUS'},
  {title:'Safer community participation',copy:'Reporting, moderation and membership rules support constructive spaces.',accent:'#08758F',icon:'shield',tag:'SAFER SPACES'},
] as const;

function Icon({kind,size=30}:{kind:string;size?:number}){
  const base={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};
  if(kind==='lock')return <svg {...base}><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2"/></svg>;
  if(kind==='share')return <svg {...base}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg>;
  if(kind==='check')return <svg {...base}><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg>;
  if(kind==='eye')return <svg {...base}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>;
  return <svg {...base}><path d="M12 3 19 6v5c0 4.8-2.9 8.4-7 10-4.1-1.6-7-5.2-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
}

export default function TrustSection(){
  return <section className="trust-section" id="trust-privacy" aria-labelledby="trust-title">
    <style>{`
      .trust-section{background:#F5F7F8;padding:34px 22px 38px;font-family:'DM Sans',Arial,sans-serif;color:#10243C;border-top:1px solid #DDE4E8}.trust-shell{max-width:1340px;margin:0 auto}.trust-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.58fr);gap:38px;align-items:end;margin:0 6px 16px}.trust-kicker{font-size:12px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#137B73;margin-bottom:6px}.trust-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.95rem,2.5vw,2.65rem);line-height:1.04;letter-spacing:-.05em;color:#0B2B45;margin:0}.trust-head p{font-size:14px;line-height:1.48;color:#4A6576;margin:0 0 3px}.trust-layout{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:14px;align-items:stretch}
      .trust-story{position:relative;overflow:hidden;border-radius:21px;padding:22px 23px;background:linear-gradient(140deg,#17324D 0%,#124B5A 58%,#176276 100%);color:#fff;box-shadow:0 14px 32px rgba(20,50,67,.13)}.trust-story:before{content:'';position:absolute;width:250px;height:250px;border-radius:50%;right:-95px;top:-95px;border:1px solid rgba(255,255,255,.09);box-shadow:0 0 0 38px rgba(255,255,255,.025),0 0 0 76px rgba(255,255,255,.016)}.trust-story-top{position:relative;z-index:2;max-width:560px}.trust-story-tag{display:inline-flex;padding:5px 8px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);color:#D6F7F1;font-size:9.5px;font-weight:900;letter-spacing:.11em}.trust-story h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.5rem,1.9vw,1.95rem);line-height:1.08;letter-spacing:-.04em;margin:12px 0 8px}.trust-story p{font-size:12.8px;line-height:1.5;color:#D8E8EC;margin:0;max-width:540px}.trust-flow{position:relative;z-index:2;margin-top:15px;display:grid;gap:6px}.trust-flow-step{display:grid;grid-template-columns:34px 1fr;gap:9px;align-items:center;padding:8px 9px;border-radius:11px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.10)}.trust-flow-icon{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:rgba(255,255,255,.11);color:#A9EDE2}.trust-flow-step b{display:block;font-size:11.2px;color:#fff}.trust-flow-step span{display:block;margin-top:1px;font-size:10px;line-height:1.33;color:#C8DCE1}.trust-story-note{position:relative;z-index:2;margin-top:11px;padding-top:10px;border-top:1px solid rgba(255,255,255,.12);font-size:9.8px;line-height:1.4;color:#BED3D9}
      .trust-list{display:grid;grid-template-columns:1fr 1fr;gap:8px}.trust-row{display:grid;grid-template-columns:42px 1fr;gap:11px;align-content:start;border:1px solid #D9E1E7;border-top:3px solid var(--accent);border-radius:15px;padding:13px;background:#fff;transition:transform .18s ease,box-shadow .18s ease}.trust-row:hover{transform:translateY(-1px);box-shadow:0 9px 20px rgba(19,61,74,.06)}.trust-icon{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;background:#F0F4F7;color:var(--accent)}.trust-row h3{font-family:'Sora','DM Sans',sans-serif;font-size:14px;line-height:1.24;letter-spacing:-.02em;color:#10243C;margin:0 0 3px}.trust-row p{font-size:11.5px;line-height:1.4;color:#4F6878;margin:0}.trust-tag{grid-column:2;margin-top:7px;font-size:8.8px;font-weight:900;letter-spacing:.11em;color:var(--accent)}
      .trust-foot{margin-top:12px;border:1px solid #D4DDE3;border-radius:12px;padding:10px 12px;display:flex;align-items:center;gap:12px;background:#ECEFF1;color:#506875;font-size:11.5px;line-height:1.42}.trust-foot b{color:#17384A}.trust-india{flex:0 0 auto;padding:6px 9px;border-radius:999px;background:#17324D;color:#fff;font-size:9.5px;font-weight:900}
      @media(max-width:1050px){.trust-head{grid-template-columns:1fr;gap:8px}.trust-layout{grid-template-columns:1fr}.trust-list{grid-template-columns:1fr 1fr}}
      @media(max-width:650px){.trust-section{padding:30px 12px 34px}.trust-head{margin:0 4px 14px}.trust-head h2{font-size:2.05rem}.trust-head p{font-size:13.5px}.trust-list{grid-template-columns:1fr}.trust-story{padding:20px 18px;border-radius:19px}.trust-foot{align-items:flex-start;flex-direction:column;gap:7px}}
    `}</style>

    <div className="trust-shell">
      <div className="trust-head">
        <div><div className="trust-kicker">Trust & Privacy</div><h2 id="trust-title">Clear controls around the information that matters.</h2></div>
        <p>Public discovery stays separate from private health information, with sharing and provider status kept understandable.</p>
      </div>

      <div className="trust-layout">
        <article className="trust-story">
          <div className="trust-story-top"><span className="trust-story-tag">PRIVACY BUILT INTO THE JOURNEY</span><h3>Discover publicly. Keep personal health context private.</h3><p>Explore doctors, hospitals, communities and educational content without turning private health information into public profile content.</p></div>
          <div className="trust-flow" aria-label="HealthConnect privacy flow">
            <div className="trust-flow-step"><span className="trust-flow-icon"><Icon kind="eye" size={18}/></span><span><b>Explore public information</b><span>Browse care options, communities and educational resources.</span></span></div>
            <div className="trust-flow-step"><span className="trust-flow-icon"><Icon kind="lock" size={18}/></span><span><b>Enter your private workspace</b><span>Personal health information sits behind authenticated access.</span></span></div>
            <div className="trust-flow-step"><span className="trust-flow-icon"><Icon kind="share" size={18}/></span><span><b>Share through supported care flows</b><span>Patient-selected sharing stays connected to care context.</span></span></div>
          </div>
          <div className="trust-story-note">HealthConnect supports organisation and sharing workflows; it does not replace emergency services, clinical judgement, diagnosis or treatment decisions.</div>
        </article>

        <div className="trust-list">
          {ITEMS.map(item=><article key={item.title} className="trust-row" style={{'--accent':item.accent} as CSSProperties}><div className="trust-icon"><Icon kind={item.icon} size={22}/></div><div><h3>{item.title}</h3><p>{item.copy}</p></div><div className="trust-tag">{item.tag}</div></article>)}
        </div>
      </div>

      <div className="trust-foot"><span className="trust-india">BUILT FOR INDIA</span><span><b>HealthConnect supports discovery, records and care coordination.</b> Healthcare information and peer support do not replace professional medical advice or urgent medical care.</span></div>
    </div>
  </section>;
}
