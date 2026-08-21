'use client';

const ITEMS = [
  ['🔐','Private by design','Health information is kept behind authenticated access and role-aware permissions.'],
  ['🧾','Consent-controlled sharing','Patients decide when health information is shared into a care workflow.'],
  ['✅','Provider verification status','Doctor and hospital profiles display HealthConnect verification state instead of unsupported external certification claims.'],
  ['🛡️','Community safety controls','Membership rules, moderation, reporting and anonymous-post protections are built into Community workflows.'],
  ['📚','Clear health information','Knowledge content is separated from personal medical advice and points users back to professional care when appropriate.'],
  ['🇮🇳','Built for Indian healthcare journeys','Doctors, hospitals, government-scheme information, OPD discovery and patient records are presented in familiar, explicit language.'],
] as const;

export default function TrustSection(){
  return <section className="trust-section">
    <style>{`
      .trust-section{background:#F7FAFC;padding:70px 28px;font-family:'DM Sans',Arial,sans-serif}.trust-inner{max-width:1280px;margin:0 auto}.trust-head{display:grid;grid-template-columns:1fr .8fr;gap:40px;align-items:end;margin-bottom:28px}.trust-kicker{font-size:11px;font-weight:850;letter-spacing:.17em;color:#0D9488;margin-bottom:10px}.trust-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,3.1vw,3.45rem);line-height:1.06;letter-spacing:-.04em;color:#0F172A;margin:0}.trust-copy{font-size:14px;line-height:1.75;color:#64748B;margin:0}.trust-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:13px}.trust-card{background:#fff;border:1px solid #E0E8EF;border-radius:16px;padding:19px;min-height:150px}.trust-icon{font-size:22px;margin-bottom:12px}.trust-card h3{font-family:'Sora',sans-serif;font-size:13px;color:#0F172A;margin:0 0 6px}.trust-card p{font-size:11px;line-height:1.6;color:#64748B;margin:0}.trust-note{margin-top:20px;padding:12px 15px;border-radius:10px;background:#ECFDF5;border:1px solid #D1FAE5;color:#365B50;font-size:10.5px;line-height:1.55}.trust-note strong{color:#0F766E}
      @media(max-width:900px){.trust-head{grid-template-columns:1fr}.trust-grid{grid-template-columns:1fr 1fr}}
      @media(max-width:600px){.trust-section{padding:54px 16px}.trust-grid{grid-template-columns:1fr}}
    `}</style>
    <div className="trust-inner">
      <div className="trust-head"><div><div className="trust-kicker">TRUST SHOULD BE SPECIFIC</div><h2 className="trust-title">Healthcare confidence comes from what the platform actually does.</h2></div><p className="trust-copy">HealthConnect should earn trust through clear permissions, visible provider status and transparent workflows — not by displaying certification or integration badges before those formal claims are supportable.</p></div>
      <div className="trust-grid">{ITEMS.map(([icon,title,copy])=><article className="trust-card" key={title}><div className="trust-icon">{icon}</div><h3>{title}</h3><p>{copy}</p></article>)}</div>
      <div className="trust-note"><strong>Important:</strong> HealthConnect supports healthcare discovery, records and care coordination. It does not replace emergency services or a clinician’s diagnosis and treatment decisions.</div>
    </div>
  </section>;
}
