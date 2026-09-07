'use client';

const ITEMS = [
  {title:'Private health workspace',copy:'Personal health information stays behind authenticated access and role-aware permissions.',accent:'#2563EB',wash:'#EAF1FF',icon:'lock',tag:'PRIVATE ACCESS'},
  {title:'Sharing stays your choice',copy:'Supported sharing follows patient choice and the care workflow rather than public discovery.',accent:'#0B8F7C',wash:'#E5F7F1',icon:'share',tag:'YOUR CONTROL'},
  {title:'Provider status is visible',copy:'Doctor and hospital profiles show HealthConnect verification status clearly where supported.',accent:'#7C3AED',wash:'#F1E9FF',icon:'check',tag:'CLEAR STATUS'},
  {title:'Safer community participation',copy:'Reporting, moderation, membership rules and privacy-aware controls support constructive spaces.',accent:'#0891B2',wash:'#E4F7FB',icon:'shield',tag:'SAFER SPACES'},
] as const;

function Icon({kind,size=30}:{kind:string;size?:number}){
  const base={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};
  if(kind==='lock')return <svg {...base}><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2"/></svg>;
  if(kind==='share')return <svg {...base}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg>;
  if(kind==='check')return <svg {...base}><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg>;
  if(kind==='user')return <svg {...base}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
  if(kind==='eye')return <svg {...base}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>;
  return <svg {...base}><path d="M12 3 19 6v5c0 4.8-2.9 8.4-7 10-4.1-1.6-7-5.2-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
}

export default function TrustSection(){
  return <section className="trust-section" id="trust-privacy" aria-labelledby="trust-title">
    <style>{`
      .trust-section{background:linear-gradient(180deg,#F8FBFC 0%,#FFFFFF 100%);padding:78px 28px 86px;font-family:'DM Sans',Arial,sans-serif;color:#10243C;border-top:1px solid #E5EEF0}.trust-shell{max-width:1380px;margin:0 auto}.trust-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(340px,.62fr);gap:48px;align-items:end;margin-bottom:28px}.trust-kicker{font-size:13px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#0B7E72;margin-bottom:9px}.trust-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.2rem,2.95vw,3.2rem);line-height:1.04;letter-spacing:-.05em;color:#0B2B45;margin:0}.trust-head p{font-size:16px;line-height:1.62;color:#35566A;margin:0 0 4px}.trust-layout{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:18px;align-items:stretch}
      .trust-story{position:relative;overflow:hidden;border-radius:26px;padding:31px;background:linear-gradient(140deg,#083F48 0%,#075B57 52%,#0B766D 100%);color:#fff;box-shadow:0 18px 40px rgba(11,72,74,.16);min-height:480px}.trust-story:before{content:'';position:absolute;width:310px;height:310px;border-radius:50%;right:-90px;top:-90px;border:1px solid rgba(255,255,255,.12);box-shadow:0 0 0 48px rgba(255,255,255,.035),0 0 0 96px rgba(255,255,255,.022)}.trust-story-top{position:relative;z-index:2;max-width:560px}.trust-story-tag{display:inline-flex;padding:6px 9px;border-radius:999px;background:rgba(153,246,228,.1);border:1px solid rgba(153,246,228,.23);color:#B9FFF2;font-size:10.5px;font-weight:900;letter-spacing:.12em}.trust-story h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.8rem,2.4vw,2.55rem);line-height:1.08;letter-spacing:-.04em;margin:18px 0 11px}.trust-story p{font-size:14.5px;line-height:1.62;color:#D5ECEA;margin:0;max-width:540px}.trust-flow{position:relative;z-index:2;margin-top:30px;display:grid;gap:9px}.trust-flow-step{display:grid;grid-template-columns:42px 1fr;gap:11px;align-items:center;padding:12px 13px;border-radius:15px;background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.11);backdrop-filter:blur(7px)}.trust-flow-icon{width:39px;height:39px;border-radius:12px;display:grid;place-items:center;background:rgba(255,255,255,.12);color:#99F6E4}.trust-flow-step b{display:block;font-size:12.5px;color:#fff}.trust-flow-step span{display:block;margin-top:3px;font-size:11.2px;line-height:1.42;color:#C7DEDF}.trust-story-note{position:relative;z-index:2;margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,.14);font-size:11.5px;line-height:1.5;color:#BFD8D8}
      .trust-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.trust-card{border:1px solid #DCE7EA;border-radius:22px;background:#fff;box-shadow:0 12px 28px rgba(19,61,74,.06);min-height:230px;padding:21px;display:flex;flex-direction:column;transition:transform .18s ease,box-shadow .18s ease}.trust-card:hover{transform:translateY(-2px);box-shadow:0 16px 34px rgba(19,61,74,.10)}.trust-card-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:17px}.trust-icon{width:50px;height:50px;border-radius:15px;display:grid;place-items:center;background:var(--wash);color:var(--accent)}.trust-tag{font-size:9.5px;font-weight:900;letter-spacing:.13em;color:var(--accent);text-align:right}.trust-card h3{font-family:'Sora','DM Sans',sans-serif;font-size:18px;line-height:1.25;letter-spacing:-.025em;color:#10243C;margin:0 0 8px}.trust-card p{font-size:13.2px;line-height:1.55;color:#405D70;margin:0}.trust-proof{margin-top:auto;padding-top:17px;font-size:11.5px;font-weight:850;color:#173B46}.trust-proof:before{content:'✓';display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;margin-right:7px;background:var(--wash);color:var(--accent);font-size:10px}.trust-foot{margin-top:20px;border:1px solid #D9E7E4;border-radius:15px;padding:14px 16px;display:flex;align-items:center;gap:14px;background:linear-gradient(100deg,#EDF8F5,#F1F7FB);color:#506876;font-size:12.5px;line-height:1.5}.trust-foot b{color:#0B665C}.trust-india{flex:0 0 auto;padding:7px 10px;border-radius:999px;background:#DDF3ED;color:#0B665C;font-size:10.5px;font-weight:900}
      @media(max-width:1050px){.trust-head{grid-template-columns:1fr;gap:12px}.trust-layout{grid-template-columns:1fr}.trust-story{min-height:0}.trust-grid{grid-template-columns:1fr 1fr}}
      @media(max-width:650px){.trust-section{padding:58px 14px 66px}.trust-head h2{font-size:2.35rem}.trust-layout,.trust-grid{grid-template-columns:1fr}.trust-story{padding:24px 20px;border-radius:22px}.trust-card{min-height:0}.trust-foot{align-items:flex-start;flex-direction:column;gap:8px}}
    `}</style>

    <div className="trust-shell">
      <div className="trust-head">
        <div><div className="trust-kicker">Trust & Privacy</div><h2 id="trust-title">Clear controls around the information that matters.</h2></div>
        <p>HealthConnect separates public discovery from private health information and keeps sharing, provider status and community participation easier to understand.</p>
      </div>

      <div className="trust-layout">
        <article className="trust-story">
          <div className="trust-story-top"><span className="trust-story-tag">PRIVACY BUILT INTO THE JOURNEY</span><h3>Discover publicly. Keep personal health context private.</h3><p>You can explore doctors, hospitals, communities and educational content without turning your private health information into public profile content. Authenticated workflows keep personal information separated from public discovery.</p></div>
          <div className="trust-flow" aria-label="HealthConnect privacy flow">
            <div className="trust-flow-step"><span className="trust-flow-icon"><Icon kind="eye" size={22}/></span><span><b>Explore public information</b><span>Browse care options, communities and educational resources.</span></span></div>
            <div className="trust-flow-step"><span className="trust-flow-icon"><Icon kind="lock" size={22}/></span><span><b>Enter your private workspace</b><span>Personal health information sits behind authenticated access.</span></span></div>
            <div className="trust-flow-step"><span className="trust-flow-icon"><Icon kind="share" size={22}/></span><span><b>Share through supported care flows</b><span>Patient-selected sharing stays connected to the care context.</span></span></div>
          </div>
          <div className="trust-story-note">HealthConnect supports safer organisation and sharing workflows. It does not replace emergency services, clinical judgement, diagnosis or treatment decisions.</div>
        </article>

        <div className="trust-grid">
          {ITEMS.map(item=><article key={item.title} className="trust-card" style={{'--accent':item.accent,'--wash':item.wash} as React.CSSProperties}><div className="trust-card-top"><div className="trust-icon"><Icon kind={item.icon}/></div><div className="trust-tag">{item.tag}</div></div><h3>{item.title}</h3><p>{item.copy}</p><div className="trust-proof">Designed into the HealthConnect workflow</div></article>)}
        </div>
      </div>

      <div className="trust-foot"><span className="trust-india">BUILT FOR INDIA</span><span><b>HealthConnect supports discovery, records and care coordination.</b> Healthcare information and peer support on the platform do not replace professional medical advice or urgent medical care.</span></div>
    </div>
  </section>;
}
