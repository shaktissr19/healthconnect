'use client';
import { useState } from 'react';
import Link from 'next/link';

const SPOKES = [
  {
    id: 'patient',
    icon: '❤️',
    title: 'Patient Dashboard',
    short: 'Your complete health record',
    desc: 'Health score, medical history, medications, appointments, vitals, and lab reports — all in one encrypted space. Share with any doctor in one tap. Free forever.',
    benefits: ['7-parameter health score', 'Upload any prescription or report', 'Medication tracker & reminders', 'Book verified doctors in 2 minutes'],
    color: '#1A6BB5',
    bg: '#EBF4FF',
  },
  {
    id: 'doctors',
    icon: '🩺',
    title: 'Doctor Directory',
    short: '37+ NMC-verified doctors',
    desc: 'Every doctor has a tamper-proof HCD ID. See real availability, book in under 2 minutes, read genuine verified reviews. In-person, video, or home visit.',
    benefits: ['NMC/MCI verified with HCD ID', 'Real-time availability & booking', 'Genuine patient reviews', 'Video, in-person & home visits'],
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
  {
    id: 'communities',
    icon: '🤝',
    title: 'Health Communities',
    short: '18+ anonymous communities',
    desc: 'Condition-specific anonymous groups. Post freely without revealing your identity. Verified specialists moderate every community. Peer support proven to improve outcomes.',
    benefits: ['100% anonymous by default', 'Specialist-moderated groups', '18+ condition communities', '+37% better outcomes (JAMA)'],
    color: '#059669',
    bg: '#ECFDF5',
  },
  {
    id: 'hospitals',
    icon: '🏥',
    title: 'Hospital Directory',
    short: '340+ partner hospitals',
    desc: 'Find hospitals with live bed availability, department directories, and AB-PMJAY cashless treatment integration. Emergency SOS with live locator.',
    benefits: ['340+ partner hospitals', 'Live bed availability', 'AB-PMJAY cashless treatment', 'Emergency SOS locator'],
    color: '#D97706',
    bg: '#FFFBEB',
  },
  {
    id: 'knowledge',
    icon: '📚',
    title: 'Knowledge Hub',
    short: 'Doctor-reviewed health info',
    desc: 'Curated health articles, condition guides, drug info, and India-wide health trends — all approved by verified doctors. No ads, no sponsored content. Just truth.',
    benefits: ['100% doctor-reviewed content', 'Condition-specific guides', 'Drug & treatment information', 'Nationwide health trends'],
    color: '#E11D48',
    bg: '#FFF1F2',
  },
];

export default function PlatformSpoke() {
  const [active, setActive] = useState(0);
  const spoke = SPOKES[active];

  return (
    <section style={{ background:'#F8FBFF', padding:'80px 0', borderTop:'1px solid #E8F0F8' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');

        .ps-spoke {
          cursor: pointer; transition: all 0.25s ease;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          padding: 20px 16px; border-radius: 16px; border: 2px solid transparent;
          position: relative; min-width: 130px;
        }
        .ps-spoke:hover { transform: translateY(-3px); }
        .ps-spoke.active { border-color: var(--spoke-color); background: #fff; box-shadow: 0 8px 32px rgba(0,0,0,0.08); }

        .ps-spoke-icon {
          width: 56px; height: 56px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center; font-size: 26px;
          transition: all 0.25s ease;
        }

        /* Connector lines */
        .ps-connector {
          flex: 1; height: 2px; align-self: center; margin-top: -36px; position: relative;
          transition: background 0.3s ease;
        }
        .ps-connector::after {
          content: ''; position: absolute; right: -4px; top: -3px;
          width: 8px; height: 8px; border-radius: 50%; background: inherit;
        }

        @keyframes psContentIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .ps-content-in { animation: psContentIn 0.4s ease both; }

        .ps-benefit {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 0; border-bottom: 1px solid #F0F7FF;
          font-family: 'DM Sans',sans-serif; font-size: 14px; color: #2C4A6A; font-weight: 500;
        }
        .ps-benefit:last-child { border-bottom: none; }

        .ps-cta {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 28px; border-radius: 3px; border: none;
          font-family: 'Sora',sans-serif; font-size: 13px; font-weight: 700;
          cursor: pointer; text-decoration: none; text-transform: uppercase;
          letter-spacing: 0.05em; transition: all 0.2s; color: #fff;
        }
        .ps-cta:hover { transform: translateX(3px); }
      `}</style>

      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 64px' }}>

        {/* Header */}
        <div style={{ marginBottom:56 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <div style={{ width:32, height:1, background:'#1A6BB5' }}/>
            <span style={{ fontSize:11,fontWeight:700,color:'#1A6BB5',letterSpacing:'0.18em',textTransform:'uppercase',fontFamily:"'DM Sans',sans-serif" }}>Platform Features</span>
          </div>
          <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(2rem,3vw,2.8rem)', fontWeight:900, color:'#0A1628', letterSpacing:'-0.03em', lineHeight:1.1, margin:'0 0 12px' }}>
            Everything you need.<br/>
            <span style={{ color:'#1A6BB5' }}>Nothing you don't.</span>
          </h2>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:16, color:'#4A6B8A', maxWidth:480 }}>
            Five integrated pillars working together to give you complete healthcare — in one platform.
          </p>
        </div>

        {/* Hub and Spoke — horizontal */}
        <div style={{ marginBottom:52 }}>
          {/* Top row: spokes with connectors */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'center', marginBottom:0 }}>
            {SPOKES.map((s, i) => (
              <>
                <div
                  key={s.id}
                  className={`ps-spoke ${active===i?'active':''}`}
                  style={{ '--spoke-color':s.color } as React.CSSProperties}
                  onClick={() => setActive(i)}
                >
                  <div
                    className="ps-spoke-icon"
                    style={{ background: active===i ? s.color : s.bg, transition:'all 0.25s' }}
                  >
                    {s.icon}
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color: active===i ? s.color : '#6B87A8', textAlign:'center', fontFamily:"'DM Sans',sans-serif", lineHeight:1.3 }}>{s.title}</div>
                  {active===i && (
                    <div style={{ position:'absolute', bottom:-18, left:'50%', transform:'translateX(-50%)', width:2, height:18, background:s.color }}/>
                  )}
                </div>
                {/* Connector between spokes */}
                {i < SPOKES.length - 1 && (
                  <div key={`conn-${i}`} className="ps-connector" style={{ background: `linear-gradient(to right, ${SPOKES[i].color}40, ${SPOKES[i+1].color}40)` }} />
                )}
              </>
            ))}
          </div>

          {/* Center hub */}
          <div style={{ display:'flex', justifyContent:'center', margin:'0 0 0' }}>
            <div style={{ width:160, height:1, background:`linear-gradient(to right, transparent, ${spoke.color}40, transparent)` }}/>
          </div>
        </div>

        {/* Detail panel */}
        <div
          key={active}
          className="ps-content-in"
          style={{ background:'#fff', borderRadius:20, overflow:'hidden', boxShadow:'0 8px 48px rgba(15,30,60,0.08)', border:`1px solid ${spoke.color}20` }}
        >
          <div style={{ height:4, background:`linear-gradient(to right, ${spoke.color}, ${spoke.color}60)` }}/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>

            {/* Left */}
            <div style={{ padding:'48px 52px', borderRight:`1px solid ${spoke.bg}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24 }}>
                <div style={{ width:56, height:56, borderRadius:16, background:spoke.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>{spoke.icon}</div>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:spoke.color, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:4 }}>{spoke.short}</div>
                  <h3 style={{ fontSize:'clamp(1.4rem,2vw,1.9rem)', fontWeight:900, color:'#0A1628', fontFamily:"'Sora',sans-serif", letterSpacing:'-0.02em', margin:0 }}>{spoke.title}</h3>
                </div>
              </div>
              <p style={{ fontSize:16, lineHeight:1.75, color:'#4A6B8A', margin:'0 0 32px', fontFamily:"'DM Sans',sans-serif" }}>{spoke.desc}</p>
              <Link href="/?home=1#signup" className="ps-cta" style={{ background:spoke.color, boxShadow:`0 4px 16px ${spoke.color}35` }}>
                Get Started →
              </Link>
            </div>

            {/* Right */}
            <div style={{ padding:'48px 52px', background:spoke.bg }}>
              <div style={{ fontSize:11, fontWeight:700, color:spoke.color, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:24 }}>Key Benefits</div>
              <div>
                {spoke.benefits.map((b, i) => (
                  <div key={i} className="ps-benefit">
                    <div style={{ width:20, height:20, borderRadius:6, background:spoke.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                      <span style={{ color:'#fff', fontSize:11, fontWeight:800 }}>✓</span>
                    </div>
                    {b}
                  </div>
                ))}
              </div>

              {/* Spoke nav dots */}
              <div style={{ display:'flex', gap:8, marginTop:32 }}>
                {SPOKES.map((_,i) => (
                  <button key={i} onClick={() => setActive(i)} style={{
                    width: i===active ? 20 : 7, height:7, borderRadius:999,
                    background: i===active ? spoke.color : '#C8DFF0',
                    border:'none', cursor:'pointer', padding:0, transition:'all 0.3s',
                  }}/>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
