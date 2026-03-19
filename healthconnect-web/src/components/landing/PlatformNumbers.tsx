'use client';
import { useState } from 'react';
import Link from 'next/link';

// Free Unsplash photos — healthcare themed, no auth needed
const CARDS = [
  {
    stat: '10,000+',
    label: 'Patients Served',
    sub: 'Across India',
    desc: 'From Delhi to Kochi, patients use HealthConnect to manage their complete health record, track medications, book verified doctors, and join communities that understand their conditions.',
    cta: 'Create Patient Profile',
    href: '/?home=1#signup',
    color: '#1A6BB5',
    photo: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=600&q=80',
    photoAlt: 'Patient with doctor',
  },
  {
    stat: '37+',
    label: 'NMC-Verified Doctors',
    sub: 'With HCD Identity',
    desc: 'Every doctor on HealthConnect carries a tamper-proof HCD ID verified by NMC/MCI. Average booking time: 1 min 42 sec. Patients see real availability and genuine reviews before booking.',
    cta: 'Find a Doctor',
    href: '/doctors',
    color: '#7C3AED',
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80',
    photoAlt: 'Doctor consultation',
  },
  {
    stat: '18+',
    label: 'Health Communities',
    sub: 'Specialist-Moderated',
    desc: 'Anonymous, condition-specific communities for diabetes, cardiac care, mental health and more. Peer-supported patients show 37% better health outcomes (JAMA 2022). Post freely, stay private.',
    cta: 'Find Your Community',
    href: '/communities',
    color: '#059669',
    photo: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80',
    photoAlt: 'Health community support group',
  },
  {
    stat: '340+',
    label: 'Partner Hospitals',
    sub: 'AB-PMJAY Integrated',
    desc: 'Find hospitals by location, specialty, and bed availability. Cashless treatment at 340+ partner hospitals under Ayushman Bharat. Emergency SOS with live hospital locator.',
    cta: 'Find Hospitals',
    href: '/hospitals',
    color: '#D97706',
    photo: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&q=80',
    photoAlt: 'Modern hospital building',
  },
];

export default function PlatformNumbers() {
  const [active, setActive] = useState(1); // default: doctors card expanded

  return (
    <section style={{ background: '#fff', padding: '80px 0 0' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap');

        .pn-card {
          position: relative; overflow: hidden; cursor: pointer;
          transition: flex 0.55s cubic-bezier(0.4,0,0.2,1), background 0.3s;
          border-right: 1px solid #E8F0F8;
        }
        .pn-card:last-child { border-right: none; }
        .pn-card.collapsed { flex: 1; }
        .pn-card.expanded  { flex: 3.2; }
        .pn-card:hover .pn-stat { opacity: 1; }

        .pn-photo {
          position: absolute; inset: 0;
          background-size: cover; background-position: center;
          transition: opacity 0.5s ease;
        }
        .pn-photo-overlay {
          position: absolute; inset: 0;
          transition: opacity 0.4s ease;
        }

        .pn-content-collapsed {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 28px 24px;
          transition: opacity 0.3s ease;
        }
        .pn-content-expanded {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 40px 44px;
          transition: opacity 0.35s ease;
        }

        @keyframes pnFadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .pn-anim { animation: pnFadeIn 0.4s ease 0.15s both; }

        .pn-cta-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 24px; border-radius: 3px; border: none;
          background: #fff; font-family: 'Sora',sans-serif;
          font-size: 13px; font-weight: 700; cursor: pointer;
          text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em;
          transition: all 0.2s;
        }
        .pn-cta-btn:hover { transform: translateX(3px); }
      `}</style>

      {/* Section header */}
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 64px 48px' }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <div style={{ width:32, height:1, background:'#1A6BB5' }}/>
              <span style={{ fontSize:11,fontWeight:700,color:'#1A6BB5',letterSpacing:'0.18em',textTransform:'uppercase',fontFamily:"'DM Sans',sans-serif" }}>Platform at a Glance</span>
            </div>
            <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(2rem,3vw,2.8rem)', fontWeight:900, color:'#0A1628', letterSpacing:'-0.03em', lineHeight:1.1, margin:0 }}>
              HealthConnect<br/>by the Numbers
            </h2>
          </div>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:16, color:'#4A6B8A', maxWidth:360, textAlign:'right', lineHeight:1.65, margin:0 }}>
            Click any card to learn more about how HealthConnect is changing healthcare across India.
          </p>
        </div>
      </div>

      {/* Expandable card row */}
      <div style={{ display:'flex', height:500 }}>
        {CARDS.map((c, i) => {
          const isExp = active === i;
          return (
            <div
              key={i}
              className={`pn-card ${isExp?'expanded':'collapsed'}`}
              onClick={() => setActive(i)}
            >
              {/* Photo background */}
              <div
                className="pn-photo"
                style={{ backgroundImage:`url(${c.photo})`, opacity: isExp ? 1 : 0.35 }}
              />
              {/* Overlay */}
              <div
                className="pn-photo-overlay"
                style={{ background: isExp
                  ? `linear-gradient(to top, ${c.color}EE 0%, ${c.color}99 40%, transparent 70%)`
                  : `linear-gradient(to top, #0A1628F0 0%, #0A162880 60%, transparent 100%)`
                }}
              />

              {/* COLLAPSED state */}
              {!isExp && (
                <div className="pn-content-collapsed">
                  <div style={{ fontSize:42,fontWeight:900,color:'#fff',letterSpacing:'-0.03em',lineHeight:1,fontFamily:"'Sora',sans-serif",marginBottom:6 }}>{c.stat}</div>
                  <div style={{ fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.9)',fontFamily:"'DM Sans',sans-serif" }}>{c.label}</div>
                  <div style={{ fontSize:11,color:'rgba(255,255,255,0.55)',marginTop:3,fontFamily:"'DM Sans',sans-serif" }}>{c.sub}</div>
                </div>
              )}

              {/* EXPANDED state */}
              {isExp && (
                <div className="pn-content-expanded pn-anim">
                  <div style={{ fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.7)',letterSpacing:'0.12em',textTransform:'uppercase',fontFamily:"'DM Sans',sans-serif",marginBottom:10 }}>{c.sub}</div>
                  <div style={{ fontSize:58,fontWeight:900,color:'#fff',letterSpacing:'-0.04em',lineHeight:1,fontFamily:"'Sora',sans-serif",marginBottom:8 }}>{c.stat}</div>
                  <div style={{ fontSize:22,fontWeight:800,color:'#fff',fontFamily:"'Sora',sans-serif",marginBottom:16,letterSpacing:'-0.01em' }}>{c.label}</div>
                  <p style={{ fontSize:15,color:'rgba(255,255,255,0.82)',lineHeight:1.7,maxWidth:400,margin:'0 0 28px',fontFamily:"'DM Sans',sans-serif" }}>{c.desc}</p>
                  <Link href={c.href} className="pn-cta-btn" style={{ color:c.color }}>
                    {c.cta} →
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
