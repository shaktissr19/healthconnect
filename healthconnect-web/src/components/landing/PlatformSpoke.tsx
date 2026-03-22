'use client';
import { useState } from 'react';
import Link from 'next/link';

const SPOKES = [
  {
    icon:'❤️', title:'Patient Dashboard', short:'Health records & score',
    desc:'Your complete medical history, 7-parameter health score, medications, appointments, and vitals — all encrypted in one private space. Built for the needs of Indian patients managing chronic conditions like diabetes, hypertension, and heart disease.',
    benefits:['Track health score across 7 parameters','Upload prescriptions, reports, doctor notes','Set medication reminders and track adherence','Book verified doctors and manage appointments'],
    access:'Requires a free HealthConnect account.',
    color:'#1A6BB5', href:'/?home=1#signup',
  },
  {
    icon:'🩺', title:'Doctor Directory', short:'NMC-verified, book in 2 min',
    desc:'37+ NMC/MCI-verified doctors each with a tamper-proof HCD identity. See real-time availability, book in under 2 minutes, read genuine patient reviews. Covers all major Indian cities and specialties including general physicians, diabetologists, cardiologists, and more.',
    benefits:['NMC/MCI verified with HCD identity badge','Real-time availability — no phone calls','In-person, video, or home visit options','Genuine verified patient reviews'],
    access:'Free to search and book for all users.',
    color:'#7C3AED', href:'/doctors',
  },
  {
    icon:'🤝', title:'Health Communities', short:'Anonymous peer support',
    desc:'Condition-specific groups covering India\'s most prevalent conditions: diabetes, hypertension, cardiac disease, PCOD, thyroid disorders, mental health, and more. Post completely anonymously. Browse for free. Every group moderated by a verified specialist.',
    benefits:['Browse all communities without any account','Post anonymously — zero identity tracking','Specialist-moderated, evidence-based groups','+37% better outcomes in peer communities (JAMA)'],
    access:'Browse free. Account needed to post.',
    color:'#059669', href:'/communities',
  },
  {
    icon:'🏥', title:'Hospital Directory', short:'340+ hospitals, Ayushman Bharat',
    desc:'Find hospitals across India by location, specialty, and live bed availability. Fully integrated with Ayushman Bharat PM-JAY for cashless treatment at 340+ partner hospitals. Covers government and private hospitals across Tier 1, Tier 2, and Tier 3 cities.',
    benefits:['Search hospitals free — no account needed','Live bed availability tracking nationwide','Ayushman Bharat PM-JAY cashless integration','Emergency SOS with real-time locator'],
    access:'Free to search for all users.',
    color:'#D97706', href:'/hospitals',
  },
  {
    icon:'📚', title:'Knowledge Hub', short:'Doctor-reviewed health info',
    desc:'Articles, condition guides, drug information, and India-wide health trends — all reviewed by verified doctors on HealthConnect. Covers India-specific health conditions, ICMR guidelines, seasonal disease alerts, and ABDM-compliant health standards. Zero ads.',
    benefits:['Every article reviewed by a verified doctor','India-specific conditions and ICMR guidelines','Drug information and treatment guides','Zero ads, zero sponsored content — always free'],
    access:'Entirely free for everyone.',
    color:'#E11D48', href:'/learn',
  },
];

export default function PlatformSpoke() {
  const [active, setActive] = useState(0);
  const s = SPOKES[active];

  return (
    <section style={{ background:'#fff', padding:'52px 48px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');

        .ps-node{cursor:pointer;transition:all 0.25s ease;display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 12px;border-radius:14px;border:2px solid transparent;position:relative;flex:1;}
        .ps-node:hover{transform:translateY(-2px);}
        .ps-node.act{border-color:var(--c);background:#fff;box-shadow:0 6px 24px rgba(0,0,0,0.12);}
        .ps-icon{width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:20px;transition:all 0.25s ease;}
        .ps-line{flex:1;height:1.5px;align-self:center;margin-top:-24px;opacity:0.3;background:rgba(150,185,230,0.4);}
        @keyframes psIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .ps-in{animation:psIn 0.38s ease both;}
        .ps-ben{display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-family:'DM Sans',sans-serif;font-size:13px;color:rgba(210,228,255,0.8);font-weight:500;line-height:1.4;}
        .ps-ben:last-child{border-bottom:none;}
        .ps-cta{display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border:none;font-family:'Sora',sans-serif;font-size:12px;font-weight:700;cursor:pointer;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em;color:#fff;transition:all 0.2s;}
        .ps-cta:hover{transform:translateX(3px);}
        .ps-dot{transition:all 0.3s;border:none;cursor:pointer;padding:0;}

        /* Heading — synced with Hero clamp */
        .ps-heading{font-family:'Sora',sans-serif;font-size:clamp(2.1rem,3.4vw,3.8rem);font-weight:900;color:#EEF4FF;letter-spacing:-0.03em;line-height:1.1;margin:0;}

        @media(max-width:1024px){
          .ps-detail{grid-template-columns:1fr!important;}
        }
        @media(max-width:768px){
          .ps-nodes{flex-wrap:wrap;gap:8px!important;}
          .ps-node{min-width:100px;flex:calc(50% - 8px);}
          .ps-line{display:none!important;}
          .ps-inner{margin:0 16px!important;padding:36px 24px!important;}
        }
      `}</style>

      {/* Inner dark card — height reduced ~17% via tighter padding */}
      <div className="ps-inner" style={{ background:'linear-gradient(135deg,#060E1E 0%,#0A1628 50%,#0D2140 100%)', padding:'44px 52px', borderRadius:16, position:'relative', overflow:'hidden' }}>

        {/* Background lines */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
          <svg viewBox="0 0 800 600" style={{ position:'absolute', right:0, top:0, width:'50%', height:'100%', opacity:0.07 }} preserveAspectRatio="none">
            <line x1="800" y1="0" x2="400" y2="600" stroke="#5B9CF6" strokeWidth="1"/>
            <line x1="700" y1="0" x2="300" y2="600" stroke="#5B9CF6" strokeWidth="0.6"/>
            <line x1="600" y1="0" x2="200" y2="600" stroke="#5B9CF6" strokeWidth="0.4"/>
          </svg>
        </div>

        {/* Header */}
        <div style={{ marginBottom:36, position:'relative', zIndex:2 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <div style={{ width:28, height:1, background:'#1A6BB5' }}/>
            <span style={{ fontSize:11, fontWeight:700, color:'#5B9CF6', letterSpacing:'0.18em', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif" }}>Platform Features</span>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <h2 className="ps-heading">Everything you need.<br/>Nothing you don't.</h2>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:'rgba(180,210,255,0.5)', maxWidth:340, lineHeight:1.6, margin:0 }}>
              Five integrated pillars — click any to see what it does, who it's for, and what's free.
            </p>
          </div>
        </div>

        {/* Spoke nodes */}
        <div className="ps-nodes" style={{ display:'flex', alignItems:'flex-start', justifyContent:'center', marginBottom:36, position:'relative', zIndex:2, gap:0 }}>
          {SPOKES.map((sp,i) => (
            <>
              <div key={sp.title} className={`ps-node ${active===i?'act':''}`} style={{ '--c':sp.color } as React.CSSProperties} onClick={()=>setActive(i)}>
                <div className="ps-icon" style={{ background:active===i?sp.color:`${sp.color}20` }}>{sp.icon}</div>
                <div style={{ fontSize:11, fontWeight:700, color:active===i?sp.color:'rgba(180,210,255,0.5)', textAlign:'center', fontFamily:"'DM Sans',sans-serif", lineHeight:1.3 }}>{sp.title}</div>
                {active===i && <div style={{ position:'absolute', bottom:-16, left:'50%', transform:'translateX(-50%)', width:1.5, height:16, background:sp.color }}/>}
              </div>
              {i<SPOKES.length-1 && <div key={`l${i}`} className="ps-line"/>}
            </>
          ))}
        </div>

        {/* Detail panel */}
        <div key={active} className="ps-in ps-detail" style={{ position:'relative', zIndex:2, display:'grid', gridTemplateColumns:'1fr 1fr', background:'rgba(255,255,255,0.04)', border:`1px solid ${s.color}28`, borderTop:`3px solid ${s.color}`, borderRadius:0 }}>
          <div style={{ padding:'28px 32px', borderRight:`1px solid ${s.color}18` }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              <div style={{ width:40, height:40, borderRadius:11, background:`${s.color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:19 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:s.color, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:2 }}>{s.short}</div>
                <h3 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(1rem,1.5vw,1.4rem)', fontWeight:900, color:'#EEF4FF', letterSpacing:'-0.02em', margin:0 }}>{s.title}</h3>
              </div>
            </div>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, lineHeight:1.7, color:'rgba(195,215,255,0.7)', margin:'0 0 14px' }}>{s.desc}</p>
            <div style={{ fontSize:11, color:`${s.color}CC`, fontFamily:"'DM Sans',sans-serif", marginBottom:18, padding:'6px 10px', background:`${s.color}14`, borderLeft:`2px solid ${s.color}` }}>
              {s.access}
            </div>
            <Link href={s.href} className="ps-cta" style={{ background:s.color, boxShadow:`0 4px 14px ${s.color}38` }}>Explore →</Link>
          </div>
          <div style={{ padding:'28px 32px' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'rgba(180,210,255,0.45)', letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:16 }}>What you get</div>
            <div>{s.benefits.map((b,i)=>(
              <div key={i} className="ps-ben">
                <div style={{ width:17, height:17, borderRadius:5, background:s.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                  <span style={{ color:'#fff', fontSize:9, fontWeight:800 }}>✓</span>
                </div>{b}
              </div>
            ))}</div>
            <div style={{ display:'flex', gap:6, marginTop:20 }}>
              {SPOKES.map((_,i)=>(<button key={i} className="ps-dot" onClick={()=>setActive(i)} style={{ width:i===active?18:5, height:5, borderRadius:999, background:i===active?s.color:'rgba(255,255,255,0.18)' }}/>))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
