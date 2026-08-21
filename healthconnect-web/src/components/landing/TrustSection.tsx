'use client';

const ITEMS = [
  ['🔐','Private by design','Personal health information stays behind authenticated access and role-aware permissions.'],
  ['🧾','Consent-controlled sharing','Patients stay in control of supported health-information sharing within care workflows.'],
  ['✅','Visible provider status','Doctor and hospital profiles show HealthConnect verification status clearly.'],
  ['🛡️','Community safety controls','Membership rules, moderation, reporting and anonymous-post protections are built into Community workflows.'],
  ['📚','Clear health information','Knowledge content supports informed conversations and stays separate from diagnosis or personal medical advice.'],
  ['🇮🇳','Built for Indian healthcare journeys','Doctors, hospitals, schemes, OPD discovery and patient records use familiar, explicit language.'],
] as const;

export default function TrustSection(){
  return <section className="trust-section"><style>{`
    .trust-section{background:#F7FAFC;padding:46px 28px 48px;font-family:'DM Sans',Arial,sans-serif}.trust-inner{max-width:1280px;margin:0 auto}.trust-head{display:grid;grid-template-columns:1fr .8fr;gap:36px;align-items:end;margin-bottom:20px}.trust-kicker{font-size:10px;font-weight:900;letter-spacing:.18em;color:#0D9488;margin-bottom:8px}.trust-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,3vw,3.3rem);line-height:1.04;letter-spacing:-.04em;color:#0F172A;margin:0}.trust-copy{font-size:12px;line-height:1.6;color:#64748B;margin:0}.trust-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.trust-card{background:#fff;border:1px solid #E0E8EF;border-radius:14px;padding:15px;min-height:118px}.trust-icon{font-size:19px;margin-bottom:8px}.trust-card h3{font-family:'Sora',sans-serif;font-size:11.5px;color:#0F172A;margin:0 0 5px}.trust-card p{font-size:9.5px;line-height:1.5;color:#64748B;margin:0}.trust-note{margin-top:14px;padding:9px 12px;border-radius:9px;background:#ECFDF5;border:1px solid #D1FAE5;color:#365B50;font-size:9px;line-height:1.45}.trust-note strong{color:#0F766E}@media(max-width:900px){.trust-head{grid-template-columns:1fr}.trust-grid{grid-template-columns:1fr 1fr}}@media(max-width:600px){.trust-section{padding:40px 14px}.trust-grid{grid-template-columns:1fr}}
  `}</style><div className="trust-inner"><div className="trust-head"><div><div className="trust-kicker">TRUST & PRIVACY</div><h2 className="trust-title">Know what HealthConnect protects, shares and shows.</h2></div><p className="trust-copy">Healthcare trust starts with understandable permissions, visible provider status and clear boundaries between public discovery and private health information.</p></div><div className="trust-grid">{ITEMS.map(([icon,title,copy])=><article className="trust-card" key={title}><div className="trust-icon">{icon}</div><h3>{title}</h3><p>{copy}</p></article>)}</div><div className="trust-note"><strong>Important:</strong> HealthConnect supports healthcare discovery, records and care coordination. It does not replace emergency services or a clinician's diagnosis and treatment decisions.</div></div></section>;
}
