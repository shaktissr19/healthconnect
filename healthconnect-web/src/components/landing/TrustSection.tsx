'use client';

const ITEMS = [
  {icon:'🔐',title:'Private access',copy:'Personal health information stays behind authenticated access and role-aware permissions.'},
  {icon:'🧾',title:'You control sharing',copy:'Supported sharing stays tied to patient choice and the care workflow.'},
  {icon:'✅',title:'Visible provider status',copy:'Doctor and hospital profiles show HealthConnect verification status clearly.'},
  {icon:'🛡️',title:'Safer communities',copy:'Membership rules, reporting, moderation and anonymous-post controls support safer participation.'},
] as const;

export default function TrustSection(){
  return <section className="trust-section">
    <style>{`
      .trust-section{background:#F7FAFC;padding:42px 28px 52px;font-family:'DM Sans',Arial,sans-serif}.trust-shell{max-width:1280px;margin:0 auto;border-radius:26px;background:linear-gradient(120deg,#E6F2F1 0%,#EAF1F8 100%);border:1px solid #C9DCE2;box-shadow:0 16px 34px rgba(15,23,42,.07);padding:50px 54px 34px;overflow:hidden;position:relative}.trust-shell:before{content:'';position:absolute;width:420px;height:420px;border-radius:50%;right:-150px;top:-190px;background:radial-gradient(circle,#BDE9DF 0%,rgba(189,233,223,.2) 62%,transparent 74%);opacity:.72}.trust-head{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(320px,.92fr);gap:56px;align-items:end;margin-bottom:40px}.trust-kicker{font-size:12px;font-weight:900;letter-spacing:.18em;color:#167C72;margin-bottom:12px}.trust-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.5rem,3.7vw,4rem);line-height:1.02;letter-spacing:-.05em;color:#10233C;margin:0;max-width:760px}.trust-copy{font-size:17px;line-height:1.6;color:#486175;margin:0;max-width:500px}.trust-grid{position:relative;z-index:1;display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid #B9CFD8;border-bottom:1px solid #B9CFD8}.trust-item{padding:28px 26px 30px 0;min-height:195px}.trust-item+.trust-item{border-left:1px solid #B9CFD8;padding-left:26px}.trust-icon{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.7);border:1px solid rgba(151,185,196,.7);font-size:21px;margin-bottom:18px}.trust-item h3{font-family:'Sora',sans-serif;font-size:17px;line-height:1.3;color:#10233C;margin:0 0 10px}.trust-item p{font-size:14px;line-height:1.58;color:#4B6477;margin:0}.trust-foot{position:relative;z-index:1;margin-top:24px;display:grid;grid-template-columns:auto 1fr;gap:26px;align-items:center;color:#496175;font-size:12.5px;line-height:1.5}.trust-foot strong{color:#0F766E}.trust-india{display:flex;align-items:center;gap:10px;color:#17384B;font-weight:850;white-space:nowrap}.trust-india span{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#F8FBFC;border:1px solid #CADCE3;font-size:17px}
      @media(max-width:980px){.trust-head{grid-template-columns:1fr;gap:14px}.trust-grid{grid-template-columns:1fr 1fr}.trust-item:nth-child(3){border-left:0;border-top:1px solid #B9CFD8;padding-left:0}.trust-item:nth-child(4){border-top:1px solid #B9CFD8}}
      @media(max-width:650px){.trust-section{padding:28px 12px 36px}.trust-shell{padding:36px 22px 28px;border-radius:20px}.trust-title{font-size:2.45rem}.trust-copy{font-size:15px}.trust-grid{grid-template-columns:1fr}.trust-item,.trust-item+.trust-item,.trust-item:nth-child(3),.trust-item:nth-child(4){padding:22px 0;border-left:0;border-top:1px solid #B9CFD8;min-height:0}.trust-item:first-child{border-top:0}.trust-foot{grid-template-columns:1fr;gap:12px}.trust-india{white-space:normal}}
    `}</style>

    <div className="trust-shell">
      <div className="trust-head">
        <div>
          <div className="trust-kicker">TRUST & PRIVACY</div>
          <h2 className="trust-title">Clear controls for information that matters.</h2>
        </div>
        <p className="trust-copy">HealthConnect keeps public discovery separate from private health information, while making provider status and supported sharing rules easier to understand.</p>
      </div>

      <div className="trust-grid">
        {ITEMS.map(item=><article className="trust-item" key={item.title}><div className="trust-icon">{item.icon}</div><h3>{item.title}</h3><p>{item.copy}</p></article>)}
      </div>

      <div className="trust-foot">
        <div className="trust-india"><span>🇮🇳</span>Built around familiar Indian healthcare journeys</div>
        <div><strong>HealthConnect supports discovery, records and care coordination.</strong> It does not replace emergency services or a clinician’s diagnosis and treatment decisions.</div>
      </div>
    </div>
  </section>;
}
