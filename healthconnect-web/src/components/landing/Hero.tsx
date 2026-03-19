'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const PHRASES = [
  'organised & private.',
  'doctors you trust.',
  'communities that care.',
  'records that travel.',
  'built for Bharat.',
];

export default function Hero() {
  const [idx,  setIdx]  = useState(0);
  const [show, setShow] = useState(true);
  const [in_,  setIn]   = useState(false);

  useEffect(() => { setTimeout(() => setIn(true), 120); }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setShow(false);
      setTimeout(() => { setIdx(p => (p + 1) % PHRASES.length); setShow(true); }, 400);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <section style={{
      width: '100%',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #060E1E 0%, #0A1628 40%, #0D2140 70%, #091830 100%)',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800;900&family=DM+Sans:wght@400;500;600&display=swap');

        /* Diagonal line pattern like HealthEdge */
        .hc-hero-lines {
          position: absolute; inset: 0; pointer-events: none; overflow: hidden;
        }
        .hc-hero-lines svg { position: absolute; right: 0; top: 0; width: 55%; height: 100%; opacity: 0.18; }

        /* Radial glow */
        .hc-hero-glow {
          position: absolute; width: 700px; height: 700px; border-radius: 50%;
          background: radial-gradient(circle, rgba(26,107,181,0.18) 0%, transparent 65%);
          top: -100px; left: -100px; pointer-events: none;
        }
        .hc-hero-glow2 {
          position: absolute; width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(91,156,246,0.12) 0%, transparent 65%);
          bottom: -80px; right: 30%; pointer-events: none;
        }

        /* Fade-up entrance */
        .hc-fu { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .hc-fu.in { opacity: 1; transform: translateY(0); }

        /* Rotating phrase */
        .hc-phrase { transition: opacity 0.38s ease, transform 0.38s ease; display: inline; }
        .hc-phrase.show { opacity: 1; transform: translateY(0); }
        .hc-phrase.hide { opacity: 0; transform: translateY(10px); }

        /* CTA buttons */
        .hc-btn-w {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 15px 34px; border-radius: 3px; border: none;
          background: #1A6BB5; color: #fff;
          font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 700;
          cursor: pointer; text-decoration: none; letter-spacing: 0.02em;
          transition: all 0.2s; text-transform: uppercase;
        }
        .hc-btn-w:hover { background: #2E86D4; transform: translateY(-1px); }

        .hc-btn-o {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 32px; border-radius: 3px;
          border: 1px solid rgba(255,255,255,0.3);
          background: transparent; color: rgba(255,255,255,0.85);
          font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 600;
          cursor: pointer; text-decoration: none; letter-spacing: 0.02em;
          transition: all 0.2s; text-transform: uppercase;
        }
        .hc-btn-o:hover { border-color: #5B9CF6; color: #fff; background: rgba(26,107,181,0.15); }

        /* Trust card (HealthEdge-style floating card) */
        .hc-trust-card {
          background: #fff;
          border-radius: 4px;
          padding: 24px 28px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
          border-top: 3px solid #1A6BB5;
          max-width: 300px;
        }

        /* Scrolling indicator */
        @keyframes hcScrollBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }
        .hc-scroll { animation: hcScrollBounce 2s ease infinite; }
      `}</style>

      {/* Background diagonal lines (HealthEdge signature) */}
      <div className="hc-hero-lines">
        <svg viewBox="0 0 600 900" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <line x1="600" y1="0" x2="200" y2="900" stroke="#5B9CF6" strokeWidth="1"/>
          <line x1="550" y1="0" x2="150" y2="900" stroke="#5B9CF6" strokeWidth="0.7"/>
          <line x1="500" y1="0" x2="100" y2="900" stroke="#5B9CF6" strokeWidth="0.5"/>
          <line x1="450" y1="0" x2="50"  y2="900" stroke="#5B9CF6" strokeWidth="0.4"/>
          <line x1="400" y1="0" x2="0"   y2="900" stroke="#3B82F6" strokeWidth="0.3"/>
          {/* Chevron arrows like HealthEdge */}
          <polyline points="520,200 560,240 520,280" stroke="#E11D48" strokeWidth="1.5" fill="none" opacity="0.6"/>
          <polyline points="540,260 580,300 540,340" stroke="#E11D48" strokeWidth="1" fill="none" opacity="0.4"/>
          <polyline points="560,320 600,360 560,400" stroke="#E11D48" strokeWidth="0.7" fill="none" opacity="0.3"/>
        </svg>
      </div>
      <div className="hc-hero-glow"/><div className="hc-hero-glow2"/>

      {/* Main content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 64px', width: '100%', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 80, alignItems: 'center' }}>

          {/* LEFT — text */}
          <div>
            {/* Eyebrow */}
            <div className={`hc-fu ${in_?'in':''}`} style={{ transitionDelay:'0ms', display:'inline-flex', alignItems:'center', gap:8, marginBottom:32 }}>
              <div style={{ width:32, height:1, background:'#1A6BB5' }}/>
              <span style={{ fontSize:11, fontWeight:700, color:'#5B9CF6', letterSpacing:'0.18em', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif" }}>
                India's Unified Healthcare Platform
              </span>
            </div>

            {/* H1 */}
            <h1 className={`hc-fu ${in_?'in':''}`} style={{
              transitionDelay: '80ms',
              fontFamily: "'Sora',sans-serif",
              fontSize: 'clamp(2.8rem,4.5vw,5rem)',
              fontWeight: 900,
              color: '#EEF4FF',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              margin: '0 0 8px',
            }}>
              Your health,<br/>finally —
            </h1>

            {/* Rotating line */}
            <h1 style={{
              fontFamily: "'Sora',sans-serif",
              fontSize: 'clamp(2.8rem,4.5vw,5rem)',
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              margin: '0 0 32px',
              color: '#5B9CF6',
              minHeight: '1.1em',
            }}>
              <span className={`hc-phrase ${show?'show':'hide'}`}>{PHRASES[idx]}</span>
            </h1>

            {/* Sub */}
            <p className={`hc-fu ${in_?'in':''}`} style={{
              transitionDelay: '180ms',
              fontFamily: "'DM Sans',sans-serif",
              fontSize: 18,
              lineHeight: 1.75,
              color: 'rgba(220,232,255,0.72)',
              maxWidth: 520,
              margin: '0 0 40px',
              fontWeight: 400,
            }}>
              Book verified doctors, track medications, join anonymous health communities, and carry your complete medical history — everywhere. Free, built for India.
            </p>

            {/* CTAs */}
            <div className={`hc-fu ${in_?'in':''}`} style={{ transitionDelay:'260ms', display:'flex', gap:16, flexWrap:'wrap', marginBottom:52 }}>
              <Link href="/?home=1#signup" className="hc-btn-w">Get Started Free →</Link>
              <Link href="/communities"    className="hc-btn-o">Explore Platform</Link>
            </div>

            {/* Bottom stats strip */}
            <div className={`hc-fu ${in_?'in':''}`} style={{ transitionDelay:'340ms', display:'flex', gap:40, flexWrap:'wrap' }}>
              {[
                { v:'37+',  l:'NMC-Verified Doctors' },
                { v:'10k+', l:'Patients Served'       },
                { v:'18+',  l:'Health Communities'    },
              ].map((s,i) => (
                <div key={i} style={{ fontFamily:"'Sora',sans-serif" }}>
                  <div style={{ fontSize:28, fontWeight:900, color:'#fff', letterSpacing:'-0.02em', lineHeight:1 }}>{s.v}</div>
                  <div style={{ fontSize:12, color:'rgba(180,200,240,0.65)', marginTop:4, fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — HealthEdge-style floating trust card */}
          <div className={`hc-fu ${in_?'in':''}`} style={{ transitionDelay:'200ms', alignSelf:'flex-end', paddingBottom:80 }}>
            <div className="hc-trust-card">
              <div style={{ fontSize:10, fontWeight:800, color:'#1A6BB5', letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:12 }}>
                HealthConnect India
              </div>
              <div style={{ fontSize:18, fontWeight:900, color:'#0A1628', fontFamily:"'Sora',sans-serif", lineHeight:1.3, marginBottom:16 }}>
                Free forever.<br/>NMC Verified.<br/>ABDM Compliant.
              </div>
              <div style={{ height:1, background:'#E8F0F8', marginBottom:16 }}/>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { icon:'🔒', t:'End-to-end encrypted' },
                  { icon:'✓',  t:'Zero ads. Zero data sales.' },
                  { icon:'⭐', t:'Trusted by 10,000+ patients' },
                ].map((item,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:'#2C4A6A', fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>
                    <span style={{ fontSize:16 }}>{item.icon}</span>{item.t}
                  </div>
                ))}
              </div>
              <div style={{ marginTop:20 }}>
                <Link href="/?home=1#signup" style={{ display:'block', textAlign:'center', padding:'12px', background:'#0A1628', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none', fontFamily:"'Sora',sans-serif", letterSpacing:'0.06em', textTransform:'uppercase' }}>
                  Create Free Account →
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hc-scroll" style={{ position:'absolute', bottom:32, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
        <div style={{ width:1, height:40, background:'linear-gradient(to bottom,transparent,rgba(91,156,246,0.5))' }}/>
        <div style={{ width:5, height:5, borderRadius:'50%', background:'rgba(91,156,246,0.6)' }}/>
      </div>
    </section>
  );
}
