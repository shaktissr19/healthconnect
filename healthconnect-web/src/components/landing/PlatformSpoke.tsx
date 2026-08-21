'use client';

import { useState } from 'react';
import Link from 'next/link';

const SPOKES = [
  {
    icon:'♥', title:'My Health', short:'Your health journey', color:'#38BDF8', href:'/?home=1&auth=login',
    desc:'Keep the patient side of HealthConnect in one place: profile, medical history, vitals, symptoms, medicines, reports and appointments.',
    benefits:['Health profile and medical history','Vitals, symptoms and medicines','Reports and prescriptions','Appointments and follow-up'],
    access:'Sign in with a Patient account to open My Health.',
  },
  {
    icon:'🩺', title:'Find Doctors', short:'Search & appointment journey', color:'#8B5CF6', href:'/doctors',
    desc:'Search doctor profiles by specialty and location, review consultation options and move into the real appointment workflow when you are ready.',
    benefits:['Specialty and city discovery','Provider profile and verification status','Availability and consultation options','Direct appointment journey'],
    access:'Doctor discovery is public. Sign in when an authenticated action is required.',
  },
  {
    icon:'🤝', title:'Health Communities', short:'Condition-focused support', color:'#10B981', href:'/communities',
    desc:'Browse condition-focused communities, join conversations, attend community events and use anonymous posting where community rules allow it.',
    benefits:['Public community discovery','Membership and approval rules','Anonymous-post privacy controls','Reporting, moderation, events and RSVP'],
    access:'Browse publicly. Sign in to join and participate.',
  },
  {
    icon:'🏥', title:'Find Hospitals', short:'Know before you visit', color:'#F59E0B', href:'/hospitals',
    desc:'Compare hospital profiles, departments, facilities, accepted insurance or government-scheme information, affiliated doctors and hospital-specific OPD.',
    benefits:['Departments and facilities','Affiliated doctor profiles','Insurance and scheme information','Hospital-specific OPD booking'],
    access:'Hospital discovery is public; booking uses the authenticated patient workflow.',
  },
  {
    icon:'📚', title:'Knowledge Hub', short:'Health explainers & guides', color:'#E11D48', href:'/learn',
    desc:'Explore health explainers and condition guides written for the Indian healthcare context, then return to professional care when a medical decision is needed.',
    benefits:['Condition explainers','India-focused health topics','Practical patient education','Clear separation from diagnosis and treatment'],
    access:'Knowledge content is available publicly.',
  },
] as const;

export default function PlatformSpoke(){
  const [active,setActive]=useState(0);
  const item=SPOKES[active];

  return <section className="platform-section">
    <style>{`
      .platform-section{background:#fff;padding:34px 28px 54px;font-family:'DM Sans',Arial,sans-serif}.platform-inner{max-width:1280px;margin:0 auto;background:radial-gradient(circle at 88% 8%,rgba(59,130,246,.12),transparent 28%),linear-gradient(135deg,#061225 0%,#0A1628 52%,#0D2140 100%);border-radius:20px;padding:34px 42px 36px;position:relative;overflow:hidden;box-shadow:0 14px 42px rgba(15,23,42,.12)}
      .platform-head{display:grid;grid-template-columns:1fr .72fr;gap:34px;align-items:end;margin-bottom:24px}.platform-kicker{font-size:10px;font-weight:900;letter-spacing:.18em;color:#60A5FA;margin-bottom:8px}.platform-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,3vw,3.25rem);line-height:1.06;letter-spacing:-.04em;color:#F8FBFF;margin:0}.platform-copy{font-size:13px;line-height:1.65;color:#91AAC5;margin:0}
      .platform-tabs{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:19px}.platform-tab{position:relative;border:1px solid rgba(148,163,184,.16);background:rgba(255,255,255,.035);border-radius:12px;padding:13px 8px 12px;text-align:center;cursor:pointer;color:#93AAC3;transition:.18s}.platform-tab:hover{transform:translateY(-1px);color:#fff}.platform-tab.active{background:#fff;border-color:var(--c);color:var(--c);box-shadow:0 8px 24px rgba(0,0,0,.18)}.platform-tab .icon{width:36px;height:36px;border-radius:10px;margin:0 auto 8px;display:grid;place-items:center;background:color-mix(in srgb,var(--c) 13%,transparent);font-size:17px}.platform-tab.active .icon{background:var(--c);color:#fff}.platform-tab b{display:block;font-size:10px;line-height:1.25}.platform-tab small{display:block;font-size:7.5px;line-height:1.25;margin-top:3px;opacity:.72}
      .platform-detail{display:grid;grid-template-columns:1fr 1fr;border:1px solid color-mix(in srgb,var(--c) 28%,transparent);border-top:3px solid var(--c);background:rgba(255,255,255,.045)}.platform-left,.platform-right{padding:22px 27px}.platform-left{border-right:1px solid rgba(148,163,184,.12)}.platform-label{font-size:9px;font-weight:900;letter-spacing:.12em;color:var(--c);margin-bottom:5px;text-transform:uppercase}.platform-detail h3{font-family:'Sora',sans-serif;font-size:20px;color:#F8FBFF;margin:0 0 9px}.platform-detail p{font-size:11px;line-height:1.62;color:#AAC0D7;margin:0 0 12px}.platform-access{font-size:9px;color:#A8C0D7;padding:7px 9px;background:rgba(255,255,255,.035);border-left:2px solid var(--c);margin-bottom:13px}.platform-link{display:inline-flex;text-decoration:none;background:var(--c);color:#071426;border-radius:8px;padding:9px 13px;font-size:9.5px;font-weight:900}.platform-right>small{display:block;font-size:8px;font-weight:900;letter-spacing:.12em;color:#718BA6;margin-bottom:7px}.benefit{display:flex;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid rgba(148,163,184,.1);font-size:10px;color:#C0D0E0}.benefit:last-child{border-bottom:0}.benefit i{width:16px;height:16px;border-radius:5px;background:var(--c);display:grid;place-items:center;color:#fff;font-style:normal;font-size:8px;font-weight:900;flex:0 0 16px}
      @media(max-width:900px){.platform-head,.platform-detail{grid-template-columns:1fr}.platform-tabs{grid-template-columns:repeat(3,1fr)}.platform-left{border-right:0;border-bottom:1px solid rgba(148,163,184,.12)}}
      @media(max-width:600px){.platform-section{padding:24px 12px 42px}.platform-inner{padding:26px 16px}.platform-tabs{grid-template-columns:1fr 1fr}.platform-head{gap:14px}.platform-detail h3{font-size:17px}}
    `}</style>

    <div className="platform-inner" style={{'--c':item.color} as React.CSSProperties}>
      <div className="platform-head">
        <div><div className="platform-kicker">THE HEALTHCONNECT PLATFORM</div><h2 className="platform-title">Everything you need. Nothing you don't.</h2></div>
        <p className="platform-copy">Five connected parts, explained in familiar language. Start with the one you need today and discover the rest when it becomes relevant.</p>
      </div>

      <div className="platform-tabs">
        {SPOKES.map((sp,i)=><button key={sp.title} className={`platform-tab ${active===i?'active':''}`} style={{'--c':sp.color} as React.CSSProperties} onClick={()=>setActive(i)}><span className="icon">{sp.icon}</span><b>{sp.title}</b><small>{sp.short}</small></button>)}
      </div>

      <div className="platform-detail" key={item.title}>
        <div className="platform-left"><div className="platform-label">{item.short}</div><h3>{item.title}</h3><p>{item.desc}</p><div className="platform-access">{item.access}</div><Link className="platform-link" href={item.href}>Explore {item.title} →</Link></div>
        <div className="platform-right"><small>WHAT YOU CAN DO</small>{item.benefits.map(b=><div className="benefit" key={b}><i>✓</i>{b}</div>)}</div>
      </div>
    </div>
  </section>;
}
