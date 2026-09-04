'use client';

import { useState } from 'react';
import Link from 'next/link';

export type PlatformStats = {
  patients: number | null;
  doctors: number | null;
  communities: number | null;
  hospitals: number | null;
};

type CountKey = keyof PlatformStats;

type Card = {
  label: string;
  sub: string;
  desc: string;
  cta: string;
  href: string;
  color: string;
  photo: string;
  countKey: CountKey;
};

const CARDS: Card[] = [
  {
    label: 'Patient Profiles',
    sub: 'My Health · appointments · records',
    desc: 'Patient accounts bring medical history, reports, medicines, symptoms, vitals and appointments into one place so health information is easier to carry from one visit to the next.',
    cta: 'Open My Health',
    href: '/?auth=login&home=1',
    color: '#1A6BB5',
    photo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&q=82',
    countKey: 'patients',
  },
  {
    label: 'Doctor Profiles',
    sub: 'Discovery · availability · booking',
    desc: 'Browse HealthConnect doctor profiles by specialty and location, review consultation options and availability, and move into the live appointment journey when you are ready.',
    cta: 'Find Doctors',
    href: '/doctors',
    color: '#7C3AED',
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=900&q=82',
    countKey: 'doctors',
  },
  {
    label: 'Health Communities',
    sub: 'Peer support between visits',
    desc: 'Condition-focused communities give people a place to ask, share and learn beyond a consultation. Membership rules, anonymous-posting controls, reporting, moderation and Q&A events support safer participation.',
    cta: 'Explore Communities',
    href: '/communities',
    color: '#059669',
    photo: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=900&q=82',
    countKey: 'communities',
  },
  {
    label: 'Hospital Profiles',
    sub: 'Departments · facilities · hospital OPD',
    desc: 'Compare hospital profiles, departments, facilities, accepted insurance or government schemes, affiliated doctors and hospital-specific OPD before deciding where to visit.',
    cta: 'Find Hospitals',
    href: '/hospitals',
    color: '#D97706',
    photo: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=900&q=82',
    countKey: 'hospitals',
  },
];

const formatCount = (value:number|null) => value === null || !Number.isFinite(value) ? '—' : new Intl.NumberFormat('en-IN').format(value);

export default function PlatformNumbersLegacy({ stats }: { stats: PlatformStats }) {
  const [active,setActive] = useState(2);

  return <section className="pn-section">
    <style>{`
      .pn-section{background:#fff;padding:42px 0 38px;font-family:'DM Sans',Arial,sans-serif}.pn-head{max-width:1280px;margin:0 auto;padding:0 48px 24px;display:flex;align-items:end;justify-content:space-between;gap:28px}.pn-kicker{display:flex;align-items:center;gap:8px;margin-bottom:9px;color:#1A6BB5;font-size:13px;font-weight:850;letter-spacing:.15em;text-transform:uppercase}.pn-kicker:before{content:'';width:25px;height:1px;background:#1A6BB5}.pn-heading{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.05rem,2.8vw,3rem);font-weight:900;color:#0A1628;letter-spacing:-.04em;line-height:1.04;margin:0}.pn-head p{font-size:14px;line-height:1.65;color:#5B7691;max-width:350px;margin:0}.pn-stage{padding:0 48px}.pn-cards{display:flex;height:360px;max-width:1480px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 10px 36px rgba(15,30,60,.12)}.pn-card{position:relative;overflow:hidden;cursor:pointer;transition:flex .48s cubic-bezier(.4,0,.2,1);border-right:1px solid rgba(255,255,255,.08)}.pn-card:last-child{border-right:0}.pn-card.col{flex:1}.pn-card.exp{flex:2.35}.pn-photo{position:absolute;inset:0;background-size:cover;background-position:center;transition:opacity .4s ease}.pn-overlay{position:absolute;inset:0;transition:background .4s ease}.pn-col-txt,.pn-exp-txt{position:absolute;left:0;right:0;bottom:0;color:#fff}.pn-col-txt{padding:20px 18px}.pn-exp-txt{padding:26px 32px;animation:pnIn .35s ease both}@keyframes pnIn{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}.pn-stat{font-family:'Sora',sans-serif;font-size:36px;font-weight:900;line-height:1;letter-spacing:-.04em;margin-bottom:5px}.pn-exp-stat{font-family:'Sora',sans-serif;font-size:48px;font-weight:900;line-height:1;letter-spacing:-.045em;margin-bottom:4px}.pn-label{font-size:14px;font-weight:800}.pn-sub{font-size:12px;color:rgba(255,255,255,.72);margin-top:4px;line-height:1.35}.pn-exp-sub{font-size:12px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.78);margin-bottom:6px}.pn-exp-title{font-family:'Sora',sans-serif;font-size:19px;font-weight:800;margin-bottom:8px}.pn-exp-desc{font-size:13.5px;line-height:1.58;color:rgba(255,255,255,.88);max-width:390px;margin:0 0 14px}.pn-cta{display:inline-flex;align-items:center;background:#fff;padding:9px 15px;border-radius:4px;font-family:'Sora',sans-serif;font-size:12px;font-weight:800;text-decoration:none;text-transform:uppercase;letter-spacing:.03em}.pn-hint{position:absolute;top:14px;right:14px;background:rgba(7,22,42,.60);border:1px solid rgba(255,255,255,.22);color:#fff;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:850;letter-spacing:.06em;text-transform:uppercase;backdrop-filter:blur(8px)}
      @media(max-width:820px){.pn-head{padding:0 20px 22px;align-items:start;flex-direction:column}.pn-stage{padding:0 20px}.pn-cards{height:auto;flex-direction:column}.pn-card,.pn-card.col,.pn-card.exp{flex:none;min-height:250px;border-right:0;border-bottom:1px solid rgba(255,255,255,.08)}}
      @media(max-width:520px){.pn-section{padding:34px 0}.pn-stage{padding:0 12px}.pn-head{padding:0 16px 20px}.pn-heading{font-size:2.15rem}}
    `}</style>
    <div className="pn-head">
      <div><div className="pn-kicker">Platform at a glance</div><h2 className="pn-heading">HealthConnect<br/>by the Numbers</h2></div>
      <p>Real platform counts. Select a card to see what each part of HealthConnect actually lets you do.</p>
    </div>
    <div className="pn-stage">
      <div className="pn-cards">
        {CARDS.map((card,index)=>{
          const expanded=active===index;
          const count=formatCount(stats[card.countKey]);
          return <article key={card.label} className={`pn-card ${expanded?'exp':'col'}`} onClick={()=>setActive(index)} onMouseEnter={()=>setActive(index)}>
            <div className="pn-photo" style={{backgroundImage:`url(${card.photo})`,opacity:expanded?1:.4}}/>
            <div className="pn-overlay" style={{background:expanded?`linear-gradient(to top,${card.color}F2 0%,${card.color}A8 45%,rgba(10,22,40,.10) 78%)`:'linear-gradient(to top,#0A1628F2 0%,#0A16288A 65%,rgba(10,22,40,.08) 100%)'}}/>
            {card.countKey==='communities'&&<div className="pn-hint">HealthConnect USP</div>}
            {!expanded?<div className="pn-col-txt"><div className="pn-stat">{count}</div><div className="pn-label">{card.label}</div><div className="pn-sub">{card.sub}</div></div>:<div className="pn-exp-txt"><div className="pn-exp-sub">{card.sub}</div><div className="pn-exp-stat">{count}</div><div className="pn-exp-title">{card.label}</div><p className="pn-exp-desc">{card.desc}</p><Link href={card.href} className="pn-cta" style={{color:card.color}} onClick={e=>e.stopPropagation()}>{card.cta} →</Link></div>}
          </article>;
        })}
      </div>
    </div>
  </section>;
}
