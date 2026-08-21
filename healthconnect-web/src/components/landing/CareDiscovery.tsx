'use client';

import Link from 'next/link';

const paths = [
  {
    icon: '🩺',
    eyebrow: 'FIND A DOCTOR',
    title: 'Search the specialist you need.',
    body: 'Browse doctor profiles by specialty and location, review consultation options and move into the real booking flow when you are ready.',
    bullets: ['Specialty & city discovery', 'Provider profile & verification status', 'Availability & consultation options', 'Direct appointment journey'],
    href: '/doctors',
    cta: 'Find Doctors',
    color: '#2563EB',
    tint: '#EFF6FF',
  },
  {
    icon: '🏥',
    eyebrow: 'FIND A HOSPITAL',
    title: 'Know the hospital before you visit.',
    body: 'Compare hospital profiles, departments, facilities, accepted insurance or government schemes, affiliated doctors and hospital-specific OPD.',
    bullets: ['Departments & facilities', 'Affiliated doctors', 'Insurance & government schemes', 'Hospital-specific OPD booking'],
    href: '/hospitals',
    cta: 'Find Hospitals',
    color: '#0F766E',
    tint: '#ECFDF5',
  },
] as const;

export default function CareDiscovery() {
  return (
    <section className="care-section">
      <style>{`
        .care-section{background:#fff;padding:76px 28px;font-family:'DM Sans',Arial,sans-serif}
        .care-inner{max-width:1280px;margin:0 auto}
        .care-head{display:flex;justify-content:space-between;gap:36px;align-items:end;margin-bottom:32px}
        .care-kicker{font-size:11px;font-weight:850;letter-spacing:.17em;color:#0D9488;margin-bottom:10px}
        .care-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,3.2vw,3.65rem);line-height:1.05;letter-spacing:-.04em;color:#0F172A;margin:0;max-width:700px}
        .care-intro{max-width:420px;color:#64748B;font-size:15px;line-height:1.7;margin:0}
        .care-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        .care-card{position:relative;overflow:hidden;border:1px solid #DFE8EF;border-radius:22px;padding:30px;background:#fff;min-height:350px;box-shadow:0 10px 30px rgba(15,23,42,.055)}
        .care-card:before{content:'';position:absolute;width:250px;height:250px;border-radius:50%;right:-95px;top:-95px;background:var(--tint)}
        .care-card-top{display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1}
        .care-icon{width:52px;height:52px;border-radius:15px;display:grid;place-items:center;background:var(--tint);font-size:23px}
        .care-arrow{width:38px;height:38px;border-radius:50%;border:1px solid #D9E4ED;display:grid;place-items:center;color:var(--color);font-size:17px}
        .care-card h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.6rem,2.2vw,2.35rem);line-height:1.12;letter-spacing:-.035em;color:#0F172A;margin:18px 0 10px;max-width:520px;position:relative;z-index:1}
        .care-card p{font-size:14px;line-height:1.7;color:#5B6F84;max-width:560px;margin:0 0 20px;position:relative;z-index:1}
        .care-list{display:grid;grid-template-columns:1fr 1fr;gap:9px 12px;margin-bottom:24px;position:relative;z-index:1}.care-list span{font-size:11px;font-weight:700;color:#334155;display:flex;align-items:center;gap:7px}.care-list span:before{content:'✓';width:17px;height:17px;border-radius:50%;display:grid;place-items:center;background:var(--tint);color:var(--color);font-size:9px;font-weight:900;flex:0 0 17px}
        .care-cta{display:inline-flex;align-items:center;gap:8px;background:var(--color);color:#fff;text-decoration:none;border-radius:10px;padding:11px 17px;font-size:12px;font-weight:850;position:relative;z-index:1;transition:.18s}.care-cta:hover{transform:translateY(-1px);box-shadow:0 8px 20px color-mix(in srgb,var(--color) 22%,transparent)}
        @media(max-width:850px){.care-head{align-items:start;flex-direction:column}.care-grid{grid-template-columns:1fr}}
        @media(max-width:600px){.care-section{padding:58px 16px}.care-card{padding:24px;min-height:0}.care-list{grid-template-columns:1fr}}
      `}</style>
      <div className="care-inner">
        <div className="care-head">
          <div><div className="care-kicker">START WITH WHAT YOU NEED TODAY</div><h2 className="care-title">Find a doctor. Find a hospital. Start there.</h2></div>
          <p className="care-intro">HealthConnect stays simple at the front door. Search the provider you need first; your health journey can remain connected after that.</p>
        </div>
        <div className="care-grid">
          {paths.map(path => (
            <article className="care-card" key={path.title} style={{ '--color': path.color, '--tint': path.tint } as React.CSSProperties}>
              <div className="care-card-top"><div className="care-icon">{path.icon}</div><div className="care-arrow">↗</div></div>
              <div className="care-kicker" style={{ color: path.color, marginTop: 20 }}>{path.eyebrow}</div>
              <h3>{path.title}</h3>
              <p>{path.body}</p>
              <div className="care-list">{path.bullets.map(item => <span key={item}>{item}</span>)}</div>
              <Link className="care-cta" href={path.href}>{path.cta} →</Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
