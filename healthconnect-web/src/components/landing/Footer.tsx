'use client';

import Link from 'next/link';

const COLUMNS = [
  {
    title:'Platform',
    links:[
      ['Find Doctors','/doctors'],
      ['Find Hospitals','/hospitals'],
      ['Health Communities','/communities'],
      ['Knowledge Hub','/learn'],
    ],
  },
  {
    title:'Your HealthConnect',
    links:[
      ['My Health','/?auth=login'],
      ['My Patients','/?auth=login'],
      ['Doctor Registration','/?auth=register'],
      ['Hospital Registration','/?auth=register'],
    ],
  },
  {
    title:'Company & Support',
    links:[
      ['About HealthConnect','/about'],
      ['Contact & Support','/contact'],
      ['Privacy Policy','/privacy'],
      ['Terms of Use','/terms'],
      ['Data & Privacy','/data-privacy'],
      ['Data Deletion','/data-deletion'],
    ],
  },
] as const;

export default function Footer(){
  return <footer className="hc-footer">
    <style>{`
      .hc-footer{background:#071426;color:#fff;padding:54px 28px 24px;font-family:'DM Sans',Arial,sans-serif}.hc-footer-inner{max-width:1280px;margin:0 auto}.hc-footer-grid{display:grid;grid-template-columns:1.35fr repeat(3,1fr);gap:42px;padding-bottom:38px}.hc-footer-brand{display:flex;align-items:center;gap:10px;margin-bottom:14px}.hc-footer-logo{width:40px;height:40px;border-radius:11px;background:linear-gradient(135deg,#0D9488,#14B8A6);display:grid;place-items:center;font-family:'Sora',sans-serif;font-weight:900}.hc-footer-name{font-family:'Sora',sans-serif;font-size:15px;font-weight:850}.hc-footer-domain{font-size:9px;color:#5EEAD4;margin-top:2px}.hc-footer-desc{font-size:12px;line-height:1.7;color:#8CA4BF;max-width:300px;margin:0 0 17px}.hc-footer-trust{display:flex;gap:6px;flex-wrap:wrap}.hc-footer-trust span{font-size:8.5px;font-weight:800;color:#99F6E4;background:rgba(45,212,191,.06);border:1px solid rgba(45,212,191,.16);border-radius:7px;padding:4px 7px}.hc-footer-col h3{font-size:9px;letter-spacing:.13em;text-transform:uppercase;color:#E5EEF8;margin:3px 0 14px}.hc-footer-links{display:grid;gap:9px}.hc-footer-links a{color:#7F98B5;text-decoration:none;font-size:11px;transition:.15s}.hc-footer-links a:hover{color:#5EEAD4}.hc-footer-bottom{border-top:1px solid rgba(148,163,184,.1);padding-top:18px;display:flex;justify-content:space-between;gap:18px;align-items:center;flex-wrap:wrap}.hc-footer-bottom span{font-size:9.5px;color:#5E7692}.hc-footer-bottom-links{display:flex;gap:15px;flex-wrap:wrap}.hc-footer-bottom-links a{font-size:9px;color:#7188A2;text-decoration:none}.hc-footer-bottom-links a:hover{color:#5EEAD4}
      @media(max-width:900px){.hc-footer-grid{grid-template-columns:1fr 1fr}.hc-footer-brand-col{grid-column:1/-1}}
      @media(max-width:560px){.hc-footer{padding:42px 18px 22px}.hc-footer-grid{grid-template-columns:1fr;gap:28px}.hc-footer-brand-col{grid-column:auto}.hc-footer-bottom{align-items:flex-start;flex-direction:column}}
    `}</style>
    <div className="hc-footer-inner">
      <div className="hc-footer-grid">
        <div className="hc-footer-brand-col"><div className="hc-footer-brand"><div className="hc-footer-logo">HC</div><div><div className="hc-footer-name">HealthConnect India</div><div className="hc-footer-domain">healthconnect.sbs</div></div></div><p className="hc-footer-desc">A connected healthcare platform for patients, doctors, hospitals and health communities — designed around clear access, continuity and privacy.</p><div className="hc-footer-trust"><span>Privacy-first</span><span>Role-based access</span><span>Consent-controlled sharing</span></div></div>
        {COLUMNS.map(column=><div className="hc-footer-col" key={column.title}><h3>{column.title}</h3><div className="hc-footer-links">{column.links.map(([label,href])=><Link key={label} href={href}>{label}</Link>)}</div></div>)}
      </div>
      <div className="hc-footer-bottom"><span>© 2026 HealthConnect India. Healthcare information on this platform does not replace professional medical advice.</span><div className="hc-footer-bottom-links"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/data-privacy">Data & Privacy</Link><Link href="/contact">Support</Link></div></div>
    </div>
  </footer>;
}
