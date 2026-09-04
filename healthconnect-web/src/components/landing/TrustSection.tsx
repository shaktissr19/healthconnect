'use client';

const ITEMS=[
  {title:'Private health workspace',copy:'Personal health information stays behind authenticated access and role-aware permissions.',accent:'#2563EB',wash:'#EAF1FF',icon:'lock',tag:'PRIVATE ACCESS'},
  {title:'Sharing stays your choice',copy:'Supported sharing follows patient choice and the care workflow rather than public discovery.',accent:'#0B8F7C',wash:'#E5F7F1',icon:'share',tag:'YOUR CONTROL'},
  {title:'Provider status is visible',copy:'Doctor and hospital profiles show HealthConnect verification status clearly where supported.',accent:'#7C3AED',wash:'#F1E9FF',icon:'check',tag:'CLEAR STATUS'},
  {title:'Safer community participation',copy:'Reporting, moderation, membership rules and privacy-aware controls support constructive spaces.',accent:'#0891B2',wash:'#E4F7FB',icon:'shield',tag:'SAFER SPACES'},
] as const;

function Icon({kind}:{kind:string}){
  const base={width:34,height:34,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round' as const,strokeLinejoin:'round' as const};
  if(kind==='lock')return <svg {...base}><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2"/></svg>;
  if(kind==='share')return <svg {...base}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg>;
  if(kind==='check')return <svg {...base}><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg>;
  return <svg {...base}><path d="M12 3 19 6v5c0 4.8-2.9 8.4-7 10-4.1-1.6-7-5.2-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
}

export default function TrustSection(){
  return <section className="trust-section" id="trust-privacy">
    <style>{`
      .trust-section{background:#fff;padding:82px 28px 88px;font-family:'DM Sans',Arial,sans-serif;color:#10243C}.trust-shell{max-width:1380px;margin:0 auto}.trust-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(340px,.58fr);gap:48px;align-items:end;margin-bottom:28px}.trust-kicker{font-size:13px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#0B7E72;margin-bottom:9px}.trust-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.45rem,3.25vw,3.55rem);line-height:1.04;letter-spacing:-.05em;color:#0B2B45;margin:0}.trust-head p{font-size:17px;line-height:1.62;color:#35566A;margin:0 0 4px}.trust-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}.trust-card{border:1px solid #DCE7EA;border-radius:22px;overflow:hidden;background:#fff;box-shadow:0 14px 30px rgba(19,61,74,.06);min-height:330px;display:flex;flex-direction:column}.trust-visual{height:128px;position:relative;display:flex;align-items:center;justify-content:center}.trust-visual:before,.trust-visual:after{content:'';position:absolute;border-radius:50%;border:1px solid currentColor;opacity:.14}.trust-visual:before{width:88px;height:88px}.trust-visual:after{width:126px;height:126px}.trust-icon{width:62px;height:62px;border-radius:18px;display:grid;place-items:center;background:#fff;box-shadow:0 8px 20px rgba(16,55,67,.08);position:relative;z-index:2}.trust-body{padding:22px 22px 24px;display:flex;flex-direction:column;flex:1}.trust-tag{font-size:10.5px;font-weight:900;letter-spacing:.14em;margin-bottom:8px}.trust-card h3{font-family:'Sora','DM Sans',sans-serif;font-size:20px;line-height:1.25;letter-spacing:-.025em;color:#10243C;margin:0 0 9px}.trust-card p{font-size:14px;line-height:1.55;color:#405D70;margin:0}.trust-proof{margin-top:auto;padding-top:18px;font-size:12px;font-weight:850;color:#173B46}.trust-foot{margin-top:20px;border-top:1px solid #E1EAE8;padding-top:18px;display:flex;align-items:center;gap:14px;color:#506876;font-size:13px;line-height:1.5}.trust-foot b{color:#0B665C}.trust-india{flex:0 0 auto;padding:7px 10px;border-radius:999px;background:#E1F4EE;color:#0B665C;font-size:11.5px;font-weight:900}
      @media(max-width:1050px){.trust-head{grid-template-columns:1fr;gap:12px}.trust-grid{grid-template-columns:1fr 1fr}}
      @media(max-width:650px){.trust-section{padding:62px 14px 70px}.trust-head h2{font-size:2.5rem}.trust-grid{grid-template-columns:1fr}.trust-card{min-height:290px}.trust-foot{align-items:flex-start;flex-direction:column;gap:8px}}
    `}</style>
    <div className="trust-shell"><div className="trust-head"><div><div className="trust-kicker">Trust & Privacy</div><h2>Clear controls around the information that matters.</h2></div><p>HealthConnect separates public discovery from private health information and keeps sharing, provider status and community participation easier to understand.</p></div><div className="trust-grid">{ITEMS.map(item=><article key={item.title} className="trust-card"><div className="trust-visual" style={{background:item.wash,color:item.accent}}><div className="trust-icon"><Icon kind={item.icon}/></div></div><div className="trust-body"><div className="trust-tag" style={{color:item.accent}}>{item.tag}</div><h3>{item.title}</h3><p>{item.copy}</p><div className="trust-proof">Designed into the HealthConnect workflow</div></div></article>)}</div><div className="trust-foot"><span className="trust-india">BUILT FOR INDIA</span><span><b>HealthConnect supports discovery, records and care coordination.</b> It does not replace emergency services or a clinician&apos;s diagnosis and treatment decisions.</span></div></div>
  </section>;
}
