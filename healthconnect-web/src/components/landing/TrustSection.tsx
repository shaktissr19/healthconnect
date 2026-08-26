'use client';

const ITEMS=[
  {title:'Private health workspace',copy:'Personal health information stays behind authenticated access and role-aware permissions.',accent:'#2563EB',wash:'#EEF4FF',icon:'lock'},
  {title:'Sharing stays your choice',copy:'Supported sharing is tied to patient choice and the care workflow rather than public discovery.',accent:'#0B8F7C',wash:'#EAF8F4',icon:'share'},
  {title:'Provider status is visible',copy:'Doctor and hospital profiles display HealthConnect verification status clearly where supported.',accent:'#7C3AED',wash:'#F5EFFF',icon:'check'},
  {title:'Safer community participation',copy:'Membership rules, reporting, moderation and privacy-aware controls support more constructive spaces.',accent:'#0891B2',wash:'#EAF8FC',icon:'shield'},
] as const;

function Icon({kind}:{kind:string}){
  const base={width:28,height:28,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round' as const,strokeLinejoin:'round' as const};
  if(kind==='lock')return <svg {...base}><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2"/></svg>;
  if(kind==='share')return <svg {...base}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg>;
  if(kind==='check')return <svg {...base}><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg>;
  return <svg {...base}><path d="M12 3 19 6v5c0 4.8-2.9 8.4-7 10-4.1-1.6-7-5.2-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
}

export default function TrustSection(){
  return <section className="trust-section" id="trust-privacy">
    <style>{`
      .trust-section{background:#fff;padding:78px 28px 86px;font-family:'DM Sans',Arial,sans-serif;color:#10243C}.trust-shell{max-width:1380px;margin:0 auto}.trust-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(340px,.58fr);gap:48px;align-items:end;margin-bottom:26px}.trust-kicker{font-size:13px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#0B7E72;margin-bottom:8px}.trust-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.4rem,3.25vw,3.55rem);line-height:1.03;letter-spacing:-.05em;color:#0B2B45;margin:0}.trust-head p{font-size:16px;line-height:1.6;color:#405D70;margin:0 0 4px}.trust-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.trust-card{min-height:245px;border-radius:22px;padding:24px 22px;border:1px solid rgba(24,65,76,.09);box-shadow:0 14px 30px rgba(19,61,74,.06);display:flex;flex-direction:column;position:relative;overflow:hidden}.trust-card:after{content:'';position:absolute;width:170px;height:170px;border-radius:50%;right:-70px;bottom:-90px;background:currentColor;opacity:.045}.trust-icon{width:54px;height:54px;border-radius:16px;display:grid;place-items:center;background:rgba(255,255,255,.82);box-shadow:0 7px 16px rgba(20,57,70,.06);margin-bottom:26px}.trust-card h3{font-family:'Sora','DM Sans',sans-serif;font-size:20px;line-height:1.25;letter-spacing:-.025em;color:#10243C;margin:0 0 9px}.trust-card p{font-size:14px;line-height:1.55;color:#455F70;margin:0;max-width:280px}.trust-card strong{margin-top:auto;padding-top:22px;font-size:12px;letter-spacing:.04em}.trust-foot{margin-top:22px;padding:16px 18px;border-radius:15px;background:#F4F8F7;border:1px solid #DCE9E6;display:flex;align-items:center;gap:16px;color:#506876;font-size:13px;line-height:1.5}.trust-foot b{color:#0B665C}.trust-india{flex:0 0 auto;padding:7px 10px;border-radius:999px;background:#E1F4EE;color:#0B665C;font-size:11.5px;font-weight:900}
      @media(max-width:1000px){.trust-head{grid-template-columns:1fr;gap:12px}.trust-grid{grid-template-columns:1fr 1fr}}
      @media(max-width:650px){.trust-section{padding:60px 14px 66px}.trust-head h2{font-size:2.5rem}.trust-grid{grid-template-columns:1fr}.trust-card{min-height:210px}.trust-foot{align-items:flex-start;flex-direction:column;gap:8px}}
    `}</style>
    <div className="trust-shell">
      <div className="trust-head"><div><div className="trust-kicker">Trust & Privacy</div><h2>Your health information stays under your control.</h2></div><p>Public care discovery and private health information are intentionally separated, with clear access, sharing and participation controls.</p></div>
      <div className="trust-grid">{ITEMS.map(item=><article key={item.title} className="trust-card" style={{background:item.wash,color:item.accent}}><div className="trust-icon"><Icon kind={item.icon}/></div><h3>{item.title}</h3><p>{item.copy}</p><strong style={{color:item.accent}}>HEALTHCONNECT CONTROL</strong></article>)}</div>
      <div className="trust-foot"><span className="trust-india">BUILT FOR INDIA</span><span><b>HealthConnect supports discovery, records and care coordination.</b> It does not replace emergency services or a clinician&apos;s diagnosis and treatment decisions.</span></div>
    </div>
  </section>;
}
