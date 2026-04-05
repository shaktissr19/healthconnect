'use client';

const C = {
  bg:        '#D6EAF8',
  white:     '#FFFFFF',
  border:    '#C8DFF0',
  navy:      '#0A1628',
  blue:      '#1A365D',
  mid:       '#2C5282',
  muted:     '#4A6FA5',
  teal:      '#1A6BB5',
  tealLight: '#2E86D4',
  tealBg:    'rgba(46,134,212,0.08)',
  green:     '#15803D',
  amber:     '#B45309',
  purple:    '#5B21B6',
};

const SPECIALTIES = [
  { icon: '❤️', name: 'Cardiologist',    desc: 'Heart & blood vessel conditions' },
  { icon: '🧠', name: 'Neurologist',     desc: 'Brain, spine & nervous system' },
  { icon: '🦴', name: 'Orthopedic',      desc: 'Bones, joints & sports injuries' },
  { icon: '👶', name: 'Pediatrician',    desc: 'Child & adolescent health' },
  { icon: '🌸', name: 'Gynaecologist',   desc: "Women's health & fertility" },
  { icon: '🧴', name: 'Dermatologist',   desc: 'Skin, hair & nail conditions' },
  { icon: '👁️', name: 'Ophthalmologist', desc: 'Eyes & vision care' },
  { icon: '🩺', name: 'General Medicine',desc: 'Primary care & preventive health' },
];

const TIPS = [
  { icon: '✅', title: 'Check Verified Badge',    body: 'All doctors on HealthConnect are MBBS verified. Look for the green verified badge before booking.' },
  { icon: '⭐', title: 'Read Ratings & Reviews',  body: 'Patient reviews help you choose the right doctor. Filter by rating to find top-rated specialists.' },
  { icon: '📋', title: 'Bring Your History',      body: 'Share your Medical History summary from the My Health section with your new doctor for a better first consultation.' },
  { icon: '📹', title: 'Video Consult Available', body: 'Can\'t travel? Book a teleconsult from home. Available for most specializations.' },
];

const STATS = [
  { value: '37+',   label: 'Verified Doctors',     color: C.teal   },
  { value: '15+',   label: 'Specializations',       color: C.purple },
  { value: '4.8★',  label: 'Average Rating',        color: C.amber  },
  { value: '100%',  label: 'Background Verified',   color: C.green  },
];

export default function FindDoctorsLandingPage() {
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Hero Section — compact 30% shorter ───────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0D3349 0%, #0F4C6B 55%, #1A3A6B 100%)',
        borderRadius: 20, padding: '32px 40px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 24, overflow: 'hidden', position: 'relative',
        boxShadow: '0 10px 32px rgba(13,51,73,0.35)',
      }}>
        {/* Background decorative circles */}
        <div style={{ position:'absolute', top:-40, right:160, width:180, height:180, borderRadius:'50%', background:'rgba(91,156,246,0.07)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-30, right:60, width:130, height:130, borderRadius:'50%', background:'rgba(91,156,246,0.05)', pointerEvents:'none' }}/>

        {/* Text content */}
        <div style={{ flex: 1, position:'relative', zIndex:1 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'rgba(100,116,139,0.75)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>
            HealthConnect India · Verified Specialists
          </div>
          <h1 style={{ fontSize:26, fontWeight:900, color:'#FFFFFF', margin:'0 0 10px', lineHeight:1.25 }}>
            Find Your Perfect <span style={{ color:'#60A5FA' }}>Doctor in India</span>
          </h1>
          <p style={{ fontSize:13, color:'rgba(196,220,255,0.85)', margin:'0 0 20px', maxWidth:440, lineHeight:1.6 }}>
            Browse 37+ verified specialists across 15+ disciplines. Read real patient reviews and book in-person or video consultations.
          </p>
          <a href="/doctors" style={{ textDecoration:'none' }}>
            <button style={{
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #2E6BE6, #5B9CF6)',
              color: '#FFFFFF', border: 'none', borderRadius: 12,
              fontSize: 14, fontWeight: 800, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 18px rgba(46,107,230,0.4)',
              fontFamily: 'inherit',
            }}>
              🔍 Browse All Doctors
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </a>
          <div style={{ marginTop:10, fontSize:11, color:'rgba(100,116,139,0.5)' }}>No account needed · Book in under 2 minutes</div>
        </div>

        {/* Compact doctor illustration */}
        <div style={{ flexShrink:0, position:'relative', zIndex:1 }}>
          <svg width="160" height="160" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="110" cy="185" rx="70" ry="30" fill="rgba(255,255,255,0.06)"/>
            <rect x="55" y="115" width="110" height="90" rx="20" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
            <path d="M85 115 L110 145 L135 115" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none"/>
            <rect x="72" y="118" width="76" height="85" rx="8" fill="rgba(46,107,230,0.3)"/>
            <circle cx="110" cy="88" r="32" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
            <circle cx="100" cy="84" r="3" fill="rgba(255,255,255,0.5)"/>
            <circle cx="120" cy="84" r="3" fill="rgba(255,255,255,0.5)"/>
            <path d="M103 96 Q110 102 117 96" stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M88 130 Q75 145 75 160 Q75 172 85 172 Q95 172 95 162 Q95 152 105 148" stroke="rgba(96,165,250,0.8)" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <circle cx="105" cy="148" r="7" fill="rgba(96,165,250,0.6)" stroke="rgba(96,165,250,0.9)" strokeWidth="1.5"/>
            <circle cx="168" cy="68" r="15" fill="rgba(34,197,94,0.2)" stroke="rgba(74,222,128,0.6)" strokeWidth="1.5"/>
            <path d="M161 68 L166 74 L175 62" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
        {STATS.map((s, i) => (
          <div key={i} style={{ background:C.white, borderRadius:16, padding:'20px 22px', textAlign:'center', border:`1px solid ${C.border}`, boxShadow:'0 2px 10px rgba(27,59,111,0.08)' }}>
            <div style={{ fontSize:30, fontWeight:900, color:s.color, lineHeight:1, marginBottom:6 }}>{s.value}</div>
            <div style={{ fontSize:12, color:C.mid, fontWeight:600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Browse by Specialty ───────────────────────────────────────────── */}
      <div style={{ background:C.white, borderRadius:20, padding:'24px 26px', marginBottom:28, border:`1px solid ${C.border}`, boxShadow:'0 2px 10px rgba(27,59,111,0.08)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <h2 style={{ fontSize:18, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>Browse by Specialization</h2>
            <p style={{ fontSize:13, color:C.muted, margin:0 }}>Click any specialty to find matching doctors</p>
          </div>
          <a href="/doctors" style={{ textDecoration:'none' }}>
            <button style={{ padding:'8px 18px', borderRadius:10, border:`1.5px solid ${C.teal}`, background:'transparent', color:C.teal, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              View All →
            </button>
          </a>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {SPECIALTIES.map((sp, i) => (
            <a key={i} href={`/doctors?spec=${encodeURIComponent(sp.name)}`} style={{ textDecoration:'none' }}>
              <div style={{ background:C.bg, borderRadius:14, padding:'16px 14px', border:`1px solid ${C.border}`, cursor:'pointer', transition:'all 0.2s', textAlign:'center' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(46,134,212,0.1)'; (e.currentTarget as HTMLElement).style.borderColor = C.tealLight; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.bg; (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
              >
                <div style={{ fontSize:28, marginBottom:8 }}>{sp.icon}</div>
                <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:4 }}>{sp.name}</div>
                <div style={{ fontSize:11, color:C.muted, lineHeight:1.4 }}>{sp.desc}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ── Emergency info strip ────────────────────────────────────────── */}
      <div style={{ background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.18)', borderRadius:14, padding:'14px 20px', display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ fontSize:20, flexShrink:0 }}>🚨</span>
        <div style={{ flex:1 }}>
          <span style={{ fontSize:13, fontWeight:700, color:'#991B1B' }}>Medical Emergency? </span>
          <span style={{ fontSize:13, color:'#7F1D1D' }}>Do not use this directory for emergencies. Call <strong>108</strong> (ambulance) or <strong>112</strong> immediately.</span>
        </div>
      </div>

    </div>
  );
}
