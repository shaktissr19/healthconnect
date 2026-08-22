'use client';

const ITEMS = [
  {icon:'🔐',title:'Private access',copy:'Personal health information stays behind authenticated access and role-aware permissions.',tone:'blue'},
  {icon:'🧾',title:'You control sharing',copy:'Supported health-information sharing stays tied to patient choice and care workflows.',tone:'teal'},
  {icon:'✅',title:'Provider status is visible',copy:'Doctor and hospital profiles show HealthConnect verification status clearly.',tone:'violet'},
  {icon:'🛡️',title:'Communities have safety controls',copy:'Membership rules, reporting, moderation and anonymous-post controls support safer participation.',tone:'cyan'},
] as const;

export default function TrustSection(){
  return <section className="trust-section">
    <style>{`
      .trust-section{background:linear-gradient(180deg,#F7FAFC 0%,#F2F7F9 100%);padding:44px 28px 50px;font-family:'DM Sans',Arial,sans-serif;border-top:1px solid #DDE8EE;border-bottom:1px solid #DDE8EE}.trust-inner{max-width:1280px;margin:0 auto}.trust-head{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(300px,.85fr);gap:42px;align-items:end;margin-bottom:24px}.trust-kicker{font-size:11px;font-weight:900;letter-spacing:.18em;color:#2563EB;margin-bottom:8px}.trust-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,3vw,3.15rem);line-height:1.04;letter-spacing:-.04em;color:#0F172A;margin:0;max-width:760px}.trust-copy{font-size:14px;line-height:1.62;color:#4D647A;margin:0;max-width:440px}.trust-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.trust-card{border-radius:20px;padding:23px 21px;min-height:210px;box-shadow:0 9px 27px rgba(15,23,42,.06);display:flex;flex-direction:column;align-items:flex-start;transition:.18s;border:1px solid transparent}.trust-card:hover{transform:translateY(-2px);box-shadow:0 15px 34px rgba(15,23,42,.1)}.trust-card.blue{background:#E5EFFB;border-color:#C7DAF2}.trust-card.teal{background:#E2F5EF;border-color:#C2E6D8}.trust-card.violet{background:#EEE8FA;border-color:#D9CBF0}.trust-card.cyan{background:#E4F3F7;border-color:#C4E1E8}.trust-icon{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;font-size:23px;margin-bottom:18px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.58)}.trust-card.blue .trust-icon{background:#CFE0F8}.trust-card.teal .trust-icon{background:#C7ECDD}.trust-card.violet .trust-icon{background:#DED3F4}.trust-card.cyan .trust-icon{background:#CBEAF0}.trust-card h3{font-family:'Sora',sans-serif;font-size:15.5px;line-height:1.3;color:#10233C;margin:0 0 9px}.trust-card p{font-size:12.5px;line-height:1.58;color:#40586E;margin:0}.trust-foot{margin-top:16px;border-radius:13px;background:#E7EEF3;border:1px solid #CEDCE5;padding:13px 16px;display:flex;gap:18px;align-items:center;justify-content:space-between;color:#425B70;font-size:11.5px;line-height:1.48;box-shadow:0 4px 16px rgba(15,23,42,.035)}.trust-foot strong{color:#0F766E}.trust-india{display:flex;align-items:center;gap:9px;color:#243E55;font-weight:850;white-space:nowrap}.trust-india span{width:36px;height:36px;border-radius:50%;background:#DCE8F8;display:grid;place-items:center;font-size:16px}
      @media(max-width:980px){.trust-head{grid-template-columns:1fr;gap:12px}.trust-grid{grid-template-columns:1fr 1fr}}
      @media(max-width:620px){.trust-section{padding:38px 14px 42px}.trust-grid{grid-template-columns:1fr}.trust-card{min-height:0}.trust-foot{align-items:flex-start;flex-direction:column}.trust-india{white-space:normal}.trust-copy{font-size:13.5px}}
    `}</style>

    <div className="trust-inner">
      <div className="trust-head">
        <div><div className="trust-kicker">TRUST & PRIVACY</div><h2 className="trust-title">Clear controls for information that matters.</h2></div>
        <p className="trust-copy">HealthConnect keeps public discovery separate from private health information, while making provider status and supported sharing rules easier to understand.</p>
      </div>

      <div className="trust-grid">{ITEMS.map(item=><article className={`trust-card ${item.tone}`} key={item.title}><div className="trust-icon">{item.icon}</div><h3>{item.title}</h3><p>{item.copy}</p></article>)}</div>

      <div className="trust-foot"><div className="trust-india"><span>🇮🇳</span>Built around familiar Indian healthcare journeys</div><div><strong>HealthConnect supports discovery, records and care coordination.</strong> It does not replace emergency services or a clinician’s diagnosis and treatment decisions.</div></div>
    </div>
  </section>;
}