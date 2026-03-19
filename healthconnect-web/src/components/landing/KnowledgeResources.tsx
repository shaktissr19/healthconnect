'use client';
import Link from 'next/link';

// Unsplash photos for resource cards
const RESOURCES = [
  {
    photo: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&q=80',
    cat: 'Patient Story',
    catColor: '#1A6BB5',
    title: 'How Priya managed 3 years of diabetes records — and finally felt understood by her doctor.',
    desc: 'Uploaded everything in one session. Her cardiologist saw the full picture before she even sat down.',
    cta: 'Read Story',
  },
  {
    photo: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80',
    cat: 'Health Research',
    catColor: '#059669',
    title: 'Peer support communities improve medication adherence by 37% — JAMA Internal Medicine 2022.',
    desc: 'Why condition-specific anonymous communities are changing chronic illness outcomes in India.',
    cta: 'Read Article',
  },
  {
    photo: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=600&q=80',
    cat: 'Doctor Insight',
    catColor: '#7C3AED',
    title: 'Dr. Arvind Mehta: How digital patient timelines changed how I practice cardiology.',
    desc: '10 minutes saved per consultation. Better care. Fewer repeat questions. More time for patients.',
    cta: 'Read More',
  },
  {
    photo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
    cat: 'India Health Trends',
    catColor: '#D97706',
    title: '67% of Indians research doctors online before booking — but most can\'t verify credentials.',
    desc: 'Why NMC verification and HCD IDs are the most important trust signal in Indian healthcare today.',
    cta: 'Read Report',
  },
];

const STORIES = [
  { q: "I uploaded 3 years of reports in one go. My cardiologist saw everything before I even sat down.", name:'Priya Sharma', role:'Patient · Delhi', col:'#1A6BB5', init:'P', photo:'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=120&q=80' },
  { q: "12 appointment requests in my first week. Patient timelines save me 10 minutes per consultation.", name:'Dr. Arvind Mehta', role:'Cardiologist · Mumbai', col:'#7C3AED', init:'A', photo:'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=120&q=80' },
  { q: "Anonymous posting meant I could ask the embarrassing questions. An endocrinologist answered within hours.", name:'Sunita Rao', role:'Community Member · Bangalore', col:'#059669', init:'S', photo:'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=80' },
];

export default function KnowledgeResources() {
  return (
    <div>
      {/* ── Resources Section ── */}
      <section style={{ background:'#fff', padding:'80px 0', borderTop:'1px solid #E8F0F8' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');

          .kr-card {
            background: #fff; border-radius: 8px; overflow: hidden;
            border: 1px solid #E8F0F8; transition: all 0.25s ease;
            display: flex; flex-direction: column;
          }
          .kr-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(15,30,60,0.1); }
          .kr-card-img {
            width: 100%; height: 200px; object-fit: cover;
            background-size: cover; background-position: center;
          }
          .kr-read-btn {
            display: inline-flex; align-items: center; gap: 6px;
            font-family: 'Sora',sans-serif; font-size: 12px; font-weight: 700;
            text-decoration: none; text-transform: uppercase; letter-spacing: 0.08em;
            transition: gap 0.2s ease;
          }
          .kr-read-btn:hover { gap: 10px; }

          .kr-story {
            background: #fff; border-radius: 16px; padding: 28px 24px;
            border: 1px solid #E8F0F8; transition: all 0.2s ease;
          }
          .kr-story:hover { box-shadow: 0 8px 32px rgba(15,30,60,0.08); transform: translateY(-2px); }
        `}</style>

        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 64px' }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:48 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <div style={{ width:32, height:1, background:'#1A6BB5' }}/>
                <span style={{ fontSize:11,fontWeight:700,color:'#1A6BB5',letterSpacing:'0.18em',textTransform:'uppercase',fontFamily:"'DM Sans',sans-serif" }}>Knowledge Hub</span>
              </div>
              <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(2rem,3vw,2.8rem)', fontWeight:900, color:'#0A1628', letterSpacing:'-0.03em', lineHeight:1.1, margin:0 }}>
                Further Resources
              </h2>
            </div>
            <Link href="/knowledge" style={{ fontFamily:"'Sora',sans-serif", fontSize:13, fontWeight:700, color:'#1A6BB5', textDecoration:'none', textTransform:'uppercase', letterSpacing:'0.08em', display:'flex', alignItems:'center', gap:6 }}>
              View All Articles →
            </Link>
          </div>

          {/* 4-column cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:24, marginBottom:72 }}>
            {RESOURCES.map((r, i) => (
              <div key={i} className="kr-card">
                <div className="kr-card-img" style={{ backgroundImage:`url(${r.photo})` }}/>
                <div style={{ padding:'20px', flex:1, display:'flex', flexDirection:'column' }}>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:`${r.catColor}12`, padding:'3px 10px', borderRadius:999, marginBottom:12, width:'fit-content' }}>
                    <span style={{ fontSize:10, fontWeight:700, color:r.catColor, textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:"'DM Sans',sans-serif" }}>{r.cat}</span>
                  </div>
                  <h4 style={{ fontFamily:"'Sora',sans-serif", fontSize:15, fontWeight:800, color:'#0A1628', lineHeight:1.4, margin:'0 0 10px', flex:1 }}>{r.title}</h4>
                  <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'#6B87A8', lineHeight:1.6, margin:'0 0 16px' }}>{r.desc}</p>
                  <Link href="/knowledge" className="kr-read-btn" style={{ color:r.catColor }}>
                    {r.cta} <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Stories row */}
          <div style={{ marginBottom:0 }}>
            <h3 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(1.5rem,2vw,2rem)', fontWeight:900, color:'#0A1628', letterSpacing:'-0.025em', margin:'0 0 28px' }}>
              Real people. Real stories.
            </h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
              {STORIES.map((s,i) => (
                <div key={i} className="kr-story">
                  <div style={{ fontSize:32, color:`${s.col}20`, lineHeight:1, fontFamily:'Georgia,serif', marginBottom:-4 }}>"</div>
                  <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, lineHeight:1.75, color:'#2C4A6A', fontStyle:'italic', margin:'0 0 20px', fontWeight:500 }}>{s.q}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:44, height:44, borderRadius:'50%', backgroundImage:`url(${s.photo})`, backgroundSize:'cover', backgroundPosition:'center', flexShrink:0, border:`2px solid ${s.col}30` }}/>
                    <div>
                      <div style={{ fontFamily:"'Sora',sans-serif", fontSize:14, fontWeight:800, color:'#0A1628' }}>{s.name}</div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:'#6B87A8' }}>{s.role}</div>
                    </div>
                    <div style={{ marginLeft:'auto', display:'flex', gap:1 }}>
                      {[1,2,3,4,5].map(n=><span key={n} style={{ color:'#F59E0B', fontSize:12 }}>★</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ background:'linear-gradient(135deg,#060E1E 0%,#0A1628 40%,#0D2140 100%)', padding:'80px 64px', position:'relative', overflow:'hidden' }}>
        {/* Diagonal lines */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
          <svg viewBox="0 0 800 400" style={{ position:'absolute', right:0, top:0, width:'60%', height:'100%', opacity:0.1 }} preserveAspectRatio="none">
            <line x1="800" y1="0" x2="400" y2="400" stroke="#5B9CF6" strokeWidth="1"/>
            <line x1="720" y1="0" x2="320" y2="400" stroke="#5B9CF6" strokeWidth="0.7"/>
            <line x1="640" y1="0" x2="240" y2="400" stroke="#5B9CF6" strokeWidth="0.5"/>
          </svg>
        </div>

        <div style={{ maxWidth:1280, margin:'0 auto', position:'relative', zIndex:2 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:80, alignItems:'center' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
                <div style={{ width:32, height:1, background:'#1A6BB5' }}/>
                <span style={{ fontSize:11,fontWeight:700,color:'#5B9CF6',letterSpacing:'0.18em',textTransform:'uppercase',fontFamily:"'DM Sans',sans-serif" }}>Join 10,000+ Indians</span>
              </div>
              <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(2.2rem,3.5vw,3.5rem)', fontWeight:900, color:'#EEF4FF', letterSpacing:'-0.03em', lineHeight:1.1, margin:'0 0 16px' }}>
                Your health deserves<br/>a better system.
              </h2>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:17, color:'rgba(200,220,255,0.65)', lineHeight:1.7, maxWidth:480, margin:0 }}>
                Free forever. Setup in 60 seconds. No credit card. Join HealthConnect and take control of your health story today.
              </p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14, minWidth:260 }}>
              <Link href="/?home=1#signup" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'16px 32px', background:'#1A6BB5', color:'#fff', fontSize:14, fontWeight:700, textDecoration:'none', fontFamily:"'Sora',sans-serif", textTransform:'uppercase', letterSpacing:'0.06em', transition:'all 0.2s', borderRadius:3 }}>
                Get Started Free →
              </Link>
              <Link href="/doctors" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'15px 32px', border:'1px solid rgba(255,255,255,0.25)', color:'rgba(255,255,255,0.85)', fontSize:14, fontWeight:600, textDecoration:'none', fontFamily:"'Sora',sans-serif", textTransform:'uppercase', letterSpacing:'0.06em', transition:'all 0.2s', borderRadius:3 }}>
                Find a Doctor
              </Link>
              <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap', marginTop:4 }}>
                {['🔒 Encrypted','✓ ABDM','⭐ NMC Verified'].map(b=>(
                  <span key={b} style={{ fontSize:11, color:'rgba(180,200,240,0.5)', fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>{b}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
