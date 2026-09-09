'use client';

import type { CSSProperties } from 'react';

const ITEMS = [
  {title:'Private health workspace',copy:'Personal health information stays behind authenticated access and role-aware permissions.',accent:'#2459C4',wash:'#D5E3F4',icon:'lock',tag:'PRIVATE ACCESS'},
  {title:'Sharing stays your choice',copy:'Supported sharing follows patient choice and the care workflow rather than public discovery.',accent:'#087D72',wash:'#D1E8E0',icon:'share',tag:'YOUR CONTROL'},
  {title:'Provider status is visible',copy:'Doctor and hospital profiles show HealthConnect verification status clearly where supported.',accent:'#6D45C6',wash:'#E3D9F1',icon:'check',tag:'CLEAR STATUS'},
  {title:'Safer community participation',copy:'Reporting, moderation, membership rules and privacy-aware controls support constructive spaces.',accent:'#08758F',wash:'#D3E7EA',icon:'shield',tag:'SAFER SPACES'},
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
      .trust-section{background:#DDEDE8;padding:52px 22px 56px;font-family:'DM Sans',Arial,sans-serif;color:#10243C;border-top:1px solid #C9DDD7}.trust-shell{max-width:1340px;margin:0 auto}.trust-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(340px,.62fr);gap:44px;align-items:end;margin:0 6px 22px}.trust-kicker{font-size:12.5px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#087D72;margin-bottom:7px}.trust-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.1rem,2.8vw,3rem);line-height:1.04;letter-spacing:-.05em;color:#0B2B45;margin:0}.trust-head p{font-size:15.5px;line-height:1.52;color:#35566A;margin:0 0 4px}.trust-layout{display:grid;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);gap:16px;align-items:stretch}
      .trust-story{position:relative;overflow:hidden;border-radius:24px;padding:28px;background:linear-gradient(140deg,#083F48 0%,#075B57 52%,#0B766D 100%);color:#fff;box-shadow:0 17px 38px rgba(11,72,74,.16);min-height:430px}.trust-story:before{content:'';position:absolute;width:300px;height:300px;border-radius:50%;right:-100px;top:-100px;border:1px solid rgba(255,255,255,.12);box-shadow:0 0 0 46px rgba(255,255,255,.035),0 0 0 92px rgba(255,255,255,.022)}.trust-story-top{position:relative;z-index:2;max-width:560px}.trust-story-tag{display:inline-flex;padding:6px 9px;border-radius:999px;background:rgba(153,246,228,.1);border:1px solid rgba(153,246,228,.23);color:#B9FFF2;font-size:10.5px;font-weight:900;letter-spacing:.12em}.trust-story h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.75rem,2.25vw,2.45rem);line-height:1.08;letter-spacing:-.04em;margin:16px 0 10px}.trust-story p{font-size:14px;line-height:1.55;color:#D5ECEA;margin:0;max-width:540px}.trust-flow{position:relative;z-index:2;margin-top:23px;display:grid;gap:7px}.trust-flow-step{display:grid;grid-template-columns:39px 1fr;gap:10px;align-items:center;padding:10px 11px;border-radius:13px;background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.11)}.trust-flow-icon{width:37px;height:37px;border-radius:11px;display:grid;place-items:center;background:rgba(255,255,255,.12);color:#99F6E4}.trust-flow-step b{display:block;font-size:12px;color:#fff}.trust-flow-step span{display:block;margin-top:2px;font-size:10.8px;line-height:1.38;color:#C7DEDF}.trust-story-note{position:relative;z-index:2;margin-top:15px;padding-top:13px;border-top:1px solid rgba(255,255,255,.14);font-size:10.8px;line-height:1.45;color:#BFD8D8}
      .trust-list{display:grid;gap:8px}.trust-row{display:grid;grid-template-columns:48px 1fr auto;gap:13px;align-items:center;border:1px solid rgba(92,130,131,.22);border-radius:17px;padding:14px 15px;background:var(--wash);transition:transform .18s ease,box-shadow .18s ease}.trust-row:hover{transform:translateX(2px);box-shadow:0 10px 22px rgba(19,61,74,.07)}.trust-icon{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:rgba(255,255,255,.5);color:var(--accent)}.trust-row h3{font-family:'Sora','DM Sans',sans-serif;font-size:16px;line-height:1.25;letter-spacing:-.025em;color:#10243C;margin:0 0 4px}.trust-row p{font-size:12.8px;line-height:1.45;color:#405D70;margin:0}.trust-tag{align-self:start;margin-top:3px;font-size:9.7px;font-weight:900;letter-spacing:.12em;color:var(--accent);white-space:nowrap}
      .trust-foot{margin-top:15px;border:1px solid #AFCFC6;border-radius:14px;padding:13px 15px;display:flex;align-items:center;gap:14px;background:#C9E2DB;color:#405E6A;font-size:12.5px;line-height:1.48}.trust-foot b{color:#0A655D}.trust-india{flex:0 0 auto;padding:7px 10px;border-radius:999px;background:#0B625D;color:#fff;font-size:10.5px;font-weight:900}
      @media(max-width:1050px){.trust-head{grid-template-columns:1fr;gap:10px}.trust-layout{grid-template-columns:1fr}.trust-story{min-height:0}.trust-list{grid-template-columns:1fr 1fr}.trust-row{grid-template-columns:45px 1fr}.trust-tag{grid-column:2}}
      @media(max-width:650px){.trust-section{padding:42px 12px 46px}.trust-head{margin:0 4px 18px}.trust-head h2{font-size:2.15rem}.trust-head p{font-size:14.5px}.trust-list{grid-template-columns:1fr}.trust-story{padding:23px 19px;border-radius:21px}.trust-row{grid-template-columns:42px 1fr;padding:13px}.trust-tag{grid-column:2}.trust-foot{align-items:flex-start;flex-direction:column;gap:8px}}
    `}</style>

    <div className="trust-shell">
      <div className="trust-head">
        <div><div className="trust-kicker">Trust & Privacy</div><h2 id="trust-title">Clear controls around the information that matters.</h2></div>
        <p>HealthConnect separates public discovery from private health information and keeps sharing, provider status and community participation easier to understand.</p>
      </div>

      <div className="trust-layout">
        <article className="trust-story">
          <div className="trust-story-top"><span className="trust-story-tag">PRIVACY BUILT INTO THE JOURNEY</span><h3>Discover publicly. Keep personal health context private.</h3><p>You can explore doctors, hospitals, communities and educational content without turning your private health information into public profile content.</p></div>
          <div className="trust-flow" aria-label="HealthConnect privacy flow">
            <div className="trust-flow-step"><span className="trust-flow-icon"><Icon kind="eye" size={21}/></span><span><b>Explore public information</b><span>Browse care options, communities and educational resources.</span></span></div>
            <div className="trust-flow-step"><span className="trust-flow-icon"><Icon kind="lock" size={21}/></span><span><b>Enter your private workspace</b><span>Personal health information sits behind authenticated access.</span></span></div>
            <div className="trust-flow-step"><span className="trust-flow-icon"><Icon kind="share" size={21}/></span><span><b>Share through supported care flows</b><span>Patient-selected sharing stays connected to the care context.</span></span></div>
          </div>
          <div className="trust-story-note">HealthConnect supports safer organisation and sharing workflows. It does not replace emergency services, clinical judgement, diagnosis or treatment decisions.</div>
        </article>

        <div className="trust-list">
          {ITEMS.map(item=><article key={item.title} className="trust-row" style={{'--accent':item.accent,'--wash':item.wash} as CSSProperties}><div className="trust-icon"><Icon kind={item.icon} size={25}/></div><div><h3>{item.title}</h3><p>{item.copy}</p></div><div className="trust-tag">{item.tag}</div></article>)}
        </div>
      </div>

      <div className="trust-foot"><span className="trust-india">BUILT FOR INDIA</span><span><b>HealthConnect supports discovery, records and care coordination.</b> Healthcare information and peer support on the platform do not replace professional medical advice or urgent medical care.</span></div>
    </div>
  </section>;
}
