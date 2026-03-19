'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const FEATURES = [
  {
    id: 'patient',
    tab: 'Patient Dashboard',
    tagline: 'Your health, always in your hands.',
    headline: 'Complete health management — free forever.',
    body: 'Upload prescriptions, lab reports and vitals. A 7-parameter health score updates in real time. Share your full medical history with any doctor in one tap. Book appointments, track medications, and set reminders — all in one private space.',
    stats: [{ v:'87%', l:'Medication adherence improvement' }, { v:'7', l:'Health parameters tracked' }, { v:'Free', l:'Always, no premium required' }],
    photo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
    accent: '#1A6BB5',
    light: '#EBF4FF',
  },
  {
    id: 'doctors',
    tab: 'Doctor Directory',
    tagline: 'Find. Trust. Book.',
    headline: 'NMC-verified doctors, real availability, 2-minute booking.',
    body: 'Every doctor carries a tamper-proof HCD ID verified by NMC/MCI. Filter by specialty, location, consultation fee, and language. See real-time availability. Read genuine verified reviews. Confirm your slot in under 2 minutes — no phone queues, no waiting.',
    stats: [{ v:'37+', l:'Verified doctors on platform' }, { v:'1:42', l:'Average booking time' }, { v:'4.8★', l:'Average doctor rating' }],
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80',
    accent: '#7C3AED',
    light: '#F5F3FF',
  },
  {
    id: 'communities',
    tab: 'Health Communities',
    tagline: 'Never face diagnosis alone.',
    headline: '18+ anonymous, specialist-moderated communities.',
    body: 'Condition-specific groups for diabetes, cardiac care, mental health, PCOD and more. Post completely anonymously — zero identity tracking, legally guaranteed. Verified specialists moderate every group. Peer-supported patients show 37% better health outcomes.',
    stats: [{ v:'+37%', l:'Better outcomes (JAMA 2022)' }, { v:'100%', l:'Anonymous by default' }, { v:'18+', l:'Condition communities' }],
    photo: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80',
    accent: '#059669',
    light: '#ECFDF5',
  },
  {
    id: 'doctor-dashboard',
    tab: 'Doctor Dashboard',
    tagline: 'For doctors. Built for Bharat.',
    headline: 'Grow your practice. Reach all of India.',
    body: 'Get an HCD-verified digital identity. Receive complete patient health timelines before every consultation — saving 10 minutes per visit. Manage appointment queues, track outcomes, collect verified reviews, and expand your reach to patients across India.',
    stats: [{ v:'10 min', l:'Saved per consultation' }, { v:'32+', l:'Avg appointments/week' }, { v:'HCD', l:'Tamper-proof verified ID' }],
    photo: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=800&q=80',
    accent: '#0891B2',
    light: '#ECFEFF',
  },
  {
    id: 'hospitals',
    tab: 'Hospital Directory',
    tagline: 'The right hospital. Right now.',
    headline: '340+ hospitals with live availability and AB-PMJAY.',
    body: 'Find hospitals by location, specialty, and real-time bed availability. Integrated with Ayushman Bharat PM-JAY for cashless treatment at 340+ partner hospitals. Emergency SOS with live hospital locator. Department directories and specialist listings.',
    stats: [{ v:'340+', l:'Partner hospitals' }, { v:'PMJAY', l:'Cashless treatment integrated' }, { v:'Live', l:'Bed availability tracking' }],
    photo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
    accent: '#D97706',
    light: '#FFFBEB',
  },
  {
    id: 'knowledge',
    tab: 'Knowledge Hub',
    tagline: 'Healthcare you can trust.',
    headline: 'Doctor-reviewed health knowledge for every Indian.',
    body: 'Curated articles, condition guides, drug information, and nationwide health trends — all reviewed and approved by verified doctors. No misinformation, no clickbait. From understanding your blood report to navigating India\'s healthcare system — answers you can trust.',
    stats: [{ v:'100%', l:'Doctor-reviewed content' }, { v:'0', l:'Ads or sponsored content' }, { v:'Free', l:'Access for everyone' }],
    photo: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&q=80',
    accent: '#E11D48',
    light: '#FFF1F2',
  },
];

export default function PlatformTour() {
  const [active,  setActive]  = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [paused,  setPaused]  = useState(false);

  const goTo = useCallback((i: number) => {
    setActive(i);
    setAnimKey(k => k + 1);
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => goTo((active + 1) % FEATURES.length), 5000);
    return () => clearInterval(t);
  }, [active, paused, goTo]);

  const f = FEATURES[active];

  return (
    <section
      style={{ width:'100%', height:'100vh', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden', background:'#0A1628' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800;900&family=DM+Sans:wght@400;500;600&display=swap');

        .pt-tab-btn {
          padding: 14px 20px; cursor: pointer; white-space: nowrap;
          font-family: 'Sora',sans-serif; font-size: 13px; font-weight: 600;
          border: none; background: transparent;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease; color: rgba(255,255,255,0.45);
          letter-spacing: 0.01em;
        }
        .pt-tab-btn.active { color: #fff; }
        .pt-tab-btn:hover:not(.active) { color: rgba(255,255,255,0.75); }

        @keyframes ptSlideIn { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        .pt-content-in { animation: ptSlideIn 0.45s ease both; }

        @keyframes ptImgIn { from{opacity:0;transform:scale(1.04)} to{opacity:1;transform:scale(1)} }
        .pt-img-in { animation: ptImgIn 0.5s ease both; }

        .pt-stat { border-left: 2px solid; padding: 0 0 0 16px; }

        .pt-cta {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 28px; border-radius: 3px; border: none;
          font-family: 'Sora',sans-serif; font-size: 13px; font-weight: 700;
          cursor: pointer; text-decoration: none; text-transform: uppercase;
          letter-spacing: 0.05em; transition: all 0.2s;
        }

        /* Progress bar */
        @keyframes ptProgress { from{width:0%} to{width:100%} }
        .pt-progress { animation: ptProgress 5s linear both; }
        .pt-progress-paused { animation-play-state: paused; }
      `}</style>

      {/* Top tab bar */}
      <div style={{ borderBottom:`1px solid rgba(255,255,255,0.08)`, background:'rgba(0,0,0,0.3)', backdropFilter:'blur(8px)', flexShrink:0 }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 64px', display:'flex', overflowX:'auto' }}>
          {FEATURES.map((feat, i) => (
            <button
              key={feat.id}
              className={`pt-tab-btn ${active===i?'active':''}`}
              onClick={() => goTo(i)}
              style={{ borderBottomColor: active===i ? feat.accent : 'transparent' }}
            >
              {feat.tab}
              {active===i && (
                <div style={{ position:'relative', height:2, marginTop:10, background:'rgba(255,255,255,0.1)', borderRadius:1 }}>
                  <div
                    key={animKey}
                    className={`pt-progress ${paused?'pt-progress-paused':''}`}
                    style={{ position:'absolute', top:0, left:0, height:'100%', background:feat.accent, borderRadius:1 }}
                  />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main content — full remaining height */}
      <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 1fr', overflow:'hidden' }}>

        {/* LEFT: text */}
        <div style={{ display:'flex', alignItems:'center', padding:'0 64px 0 64px', position:'relative', zIndex:2 }}>
          <div key={`txt-${active}-${animKey}`} className="pt-content-in">

            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <div style={{ width:3, height:32, background:f.accent, borderRadius:2 }}/>
              <span style={{ fontSize:12, fontWeight:700, color:f.accent, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif" }}>{f.tagline}</span>
            </div>

            <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(1.8rem,2.5vw,2.8rem)', fontWeight:900, color:'#EEF4FF', letterSpacing:'-0.025em', lineHeight:1.15, margin:'0 0 20px' }}>
              {f.headline}
            </h2>

            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:16, lineHeight:1.75, color:'rgba(200,220,255,0.75)', margin:'0 0 32px', maxWidth:480 }}>
              {f.body}
            </p>

            {/* Stats */}
            <div style={{ display:'flex', gap:32, marginBottom:36, flexWrap:'wrap' }}>
              {f.stats.map((s,i) => (
                <div key={i} className="pt-stat" style={{ borderLeftColor:`${f.accent}80` }}>
                  <div style={{ fontSize:26, fontWeight:900, color:'#fff', letterSpacing:'-0.02em', lineHeight:1, fontFamily:"'Sora',sans-serif" }}>{s.v}</div>
                  <div style={{ fontSize:11, color:'rgba(180,200,240,0.6)', marginTop:4, fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>{s.l}</div>
                </div>
              ))}
            </div>

            <Link href="/?home=1#signup" className="pt-cta" style={{ background:f.accent, color:'#fff', boxShadow:`0 4px 20px ${f.accent}50` }}>
              Get Started Free →
            </Link>
          </div>
        </div>

        {/* RIGHT: photo */}
        <div style={{ position:'relative', overflow:'hidden' }}>
          <div
            key={`img-${active}-${animKey}`}
            className="pt-img-in"
            style={{
              position:'absolute', inset:0,
              backgroundImage:`url(${f.photo})`,
              backgroundSize:'cover',
              backgroundPosition:'center',
            }}
          />
          {/* Left gradient fade */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, #0A1628 0%, rgba(10,22,40,0.3) 40%, transparent 70%)' }}/>
          {/* Bottom gradient */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, #0A1628 0%, transparent 30%)' }}/>

          {/* Feature label on photo */}
          <div style={{ position:'absolute', top:32, right:32 }}>
            <div style={{ background:`${f.accent}22`, border:`1px solid ${f.accent}60`, borderRadius:4, padding:'8px 16px', backdropFilter:'blur(8px)' }}>
              <span style={{ fontSize:12, fontWeight:700, color:f.accent, fontFamily:"'DM Sans',sans-serif", letterSpacing:'0.1em', textTransform:'uppercase' }}>{f.tab}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom dot navigation */}
      <div style={{ position:'absolute', bottom:24, left:'50%', transform:'translateX(-50%)', display:'flex', gap:8, zIndex:10 }}>
        {FEATURES.map((_,i) => (
          <button key={i} onClick={() => goTo(i)} style={{
            width: i===active ? 28 : 8, height:8, borderRadius:999,
            background: i===active ? f.accent : 'rgba(255,255,255,0.25)',
            border:'none', cursor:'pointer', padding:0,
            transition:'all 0.3s ease',
          }}/>
        ))}
      </div>
    </section>
  );
}
