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
      .trust-section{background:linear-gradient(180deg,#F3F8FC 0%,#F8FCFB 100%);padding:44px 28px 48px;font-family:'DM Sans',Arial,sans-serif;border-top:1px solid #E3EDF2;border-bottom:1px solid #E3EDF2}.trust-inner{max-width:1280px;margin:0 auto}.trust-head{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(300px,.85fr);gap:42px;align-items:end;margin-bottom:22px}.trust-kicker{font-size:10px;font-weight:900;letter-spacing:.18em;color:#2563EB;margin-bottom:8px}.trust-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,3vw,3.15rem);line-height:1.04;letter-spacing:-.04em;color:#0F172A;margin:0;max-width:760px}.trust-copy{font-size:13px;line-height:1.62;color:#64748B;margin:0;max-width:420px}.trust-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.trust-card{border-radius:20px;padding:22px 20px;min-height:205px;box-shadow:0 8px 26px rgba(15,23,42,.05);display:flex;flex-direction:column;align-items:flex-start;transition:.18s;border:1px solid transparent}.trust-card:hover{transform:translateY(-2px);box-shadow:0 14px 32px rgba(15,23,42,.08)}.trust-card.blue{background:#F2F7FF;border-color:#D5E5FF}.trust-card.teal{background:#F0FCF8;border-color:#D1F4E8}.trust-card.violet{background:#F8F5FF;border-color:#E7DDFB}.trust-card.cyan{background:#F1FAFD;border-color:#D5EEF5}.trust-icon{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;font-size:22px;margin-bottom:17px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.55)}.trust-card.blue .trust-icon{background:#DDEAFF}.trust-card.teal .trust-icon{background:#D1FAEA}.trust-card.violet .trust-icon{background:#EDE5FF}.trust-card.cyan .trust-icon{background:#DDF5FA}.trust-card h3{font-family:'Sora',sans-serif;font-size:14px;line-height:1.3;color:#0F172A;margin:0 0 8px}.trust-card p{font-size:10.5px;line-height:1.55;color:#5F7187;margin:0}.trust-foot{margin-top:14px;border-radius:13px;background:rgba(255,255,255,.78);border:1px solid #DBE7EC;padding:12px 15px;display:flex;gap:16px;align-items:center;justify-content:space-between;color:#64748B;font-size:9.5px;line-height:1.45;box-shadow:0 4px 16px rgba(15,23,42,.025)}.trust-foot strong{color:#0F766E}.trust-india{display:flex;align-items:center;gap:8px;color:#334155;font-weight:800;white-space:nowrap}.trust-india span{width:34px;height:34px;border-radius:50%;background:#E8F1FF;display:grid;place-items:center;font-size:15px}
      @media(max-width:980px){.trust-head{grid-template-columns:1fr;gap:12px}.trust-grid{grid-template-columns:1fr 1fr}}
      @media(max-width:620px){.trust-section{padding:38px 14px 42px}.trust-grid{grid-template-columns:1fr}.trust-card{min-height:0}.trust-foot{align-items:flex-start;flex-direction:column}.trust-india{white-space:normal}}
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
