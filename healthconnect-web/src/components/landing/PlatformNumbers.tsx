'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const BASE_CARDS = [
  {
    stat: '10,000+', label: 'Patients Served', sub: 'Across India',
    desc: 'From Delhi to Kochi, patients across India use HealthConnect to organise their health records, track medications, book verified doctors, and connect with health communities. Free to get started.',
    cta: 'Create Your Profile', href: '/?home=1#signup', color: '#1A6BB5',
    photo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=700&q=80',
    countKey: 'patients' as const,
  },
  {
    stat: '37+', label: 'Verified Doctors', sub: 'NMC/MCI with HCD ID',
    desc: 'Every doctor carries a tamper-proof HCD identity verified by NMC/MCI. See real-time availability. Book in under 2 minutes. Read genuine patient reviews. In-person, video, or home visit.',
    cta: 'Find a Doctor', href: '/doctors', color: '#7C3AED',
    photo: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=700&q=80',
    countKey: 'doctors' as const,
  },
  {
    stat: '18+', label: 'Health Communities', sub: 'Specialist-Moderated',
    desc: 'Anonymous condition-specific groups for diabetes, cardiac care, mental health, PCOD and more. Browse freely. Post with a free account. Verified specialists moderate every group.',
    cta: 'Explore Communities', href: '/communities', color: '#059669',
    photo: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=700&q=80',
    countKey: 'communities' as const,
  },
  {
    stat: '340+', label: 'Partner Hospitals', sub: 'AB-PMJAY Integrated',
    desc: 'Find hospitals with live bed availability across India. Integrated with Ayushman Bharat PM-JAY for cashless treatment. Emergency SOS with live locator built in.',
    cta: 'Find Hospitals', href: '/hospitals', color: '#D97706',
    photo: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=700&q=80',
    countKey: 'hospitals' as const,
  },
];

export default function PlatformNumbers() {
  const [active, setActive] = useState(1);
  const [counts, setCounts] = useState({ doctors:'—', communities:'—', hospitals:'—', patients:'—' });

  useEffect(() => {
    fetch('https://api.healthconnect.sbs/api/v1/public/stats')
      .then(r => r.json())
      .then(d => {
        if (!d?.success || !d?.data) return;
        const { patients, doctors, communities, hospitals } = d.data;
        setCounts({
          patients:    patients    > 0 ? `${patients}+`    : '—',
          doctors:     doctors     > 0 ? `${doctors}+`     : '—',
          communities: communities > 0 ? `${communities}+` : '—',
          hospitals:   hospitals   > 0 ? `${hospitals}+`   : '—',
        });
      }).catch(() => {});
  }, []);

  const cards = BASE_CARDS.map(c => ({
    ...c,
    stat: c.countKey === 'doctors' ? counts.doctors
        : c.countKey === 'communities' ? counts.communities
        : c.countKey === 'hospitals' ? counts.hospitals
        : counts.patients,
  }));

  return (
    <section style={{ background:'#fff', padding:'72px 0 0' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap');

        .pn-card {
          position:relative;overflow:hidden;cursor:pointer;
          transition:flex 0.5s cubic-bezier(0.4,0,0.2,1);
          border-right:1px solid rgba(255,255,255,0.06);
        }
        .pn-card:first-child { border-radius: 16px 0 0 16px; }
        .pn-card:last-child  { border-radius: 0 16px 16px 0; border-right:none; }
        .pn-card.col { flex:1; }
        .pn-card.exp { flex:2.4; }

        .pn-photo{position:absolute;inset:0;background-size:cover;background-position:center;transition:opacity 0.45s ease;}
        .pn-overlay{position:absolute;inset:0;transition:background 0.4s ease;}

        .pn-col-txt{position:absolute;bottom:0;left:0;right:0;padding:20px 18px;}
        .pn-exp-txt{position:absolute;bottom:0;left:0;right:0;padding:28px 34px;}

        @keyframes pnIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .pn-in{animation:pnIn 0.38s ease 0.08s both;}

        .pn-cta{display:inline-flex;align-items:center;gap:6px;background:#fff;padding:9px 18px;font-family:'Sora',sans-serif;font-size:12px;font-weight:700;text-decoration:none;text-transform:uppercase;letter-spacing:0.06em;transition:gap 0.2s;}
        .pn-cta:hover{gap:10px;}

        /* Heading — synced with Hero */
        .pn-heading{font-family:'Sora',sans-serif;font-size:clamp(2.1rem,3.4vw,3.8rem);font-weight:900;color:#0A1628;letter-spacing:-0.03em;line-height:1.1;margin:0;}

        @media(max-width:768px){
          .pn-cards{flex-direction:column!important;height:auto!important;}
          .pn-card{flex:1!important;min-height:280px;border-right:none!important;border-bottom:1px solid rgba(255,255,255,0.06);}
          .pn-card:first-child{border-radius:16px 16px 0 0!important;}
          .pn-card:last-child{border-radius:0 0 16px 16px!important;}
        }
      `}</style>

      {/* Header */}
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 64px 40px' }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <div style={{ width:28, height:1, background:'#1A6BB5' }}/>
              <span style={{ fontSize:11, fontWeight:700, color:'#1A6BB5', letterSpacing:'0.18em', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif" }}>Platform at a Glance</span>
            </div>
            <h2 className="pn-heading">HealthConnect<br/>by the Numbers</h2>
          </div>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, color:'#4A6B8A', maxWidth:320, lineHeight:1.6, margin:0 }}>
            Click any card to see how each part of the platform works.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div style={{ padding:'0 48px' }}>
        <div className="pn-cards" style={{ display:'flex', height:350, borderRadius:16, overflow:'hidden', boxShadow:'0 8px 40px rgba(15,30,60,0.12)' }}>
          {cards.map((c,i) => {
            const isExp = active===i;
            return (
              <div key={i} className={`pn-card ${isExp?'exp':'col'}`} onClick={()=>setActive(i)}>
                <div className="pn-photo" style={{ backgroundImage:`url(${c.photo})`, opacity:isExp?1:0.36 }}/>
                <div className="pn-overlay" style={{ background:isExp
                  ? `linear-gradient(to top,${c.color}EE 0%,${c.color}88 45%,transparent 72%)`
                  : 'linear-gradient(to top,#0A1628F2 0%,#0A162878 65%,transparent 100%)'
                }}/>
                {!isExp && (
                  <div className="pn-col-txt">
                    <div style={{ fontSize:36, fontWeight:900, color:'#fff', letterSpacing:'-0.03em', lineHeight:1, fontFamily:"'Sora',sans-serif", marginBottom:4 }}>{c.stat}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.88)', fontFamily:"'DM Sans',sans-serif" }}>{c.label}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', marginTop:2, fontFamily:"'DM Sans',sans-serif" }}>{c.sub}</div>
                  </div>
                )}
                {isExp && (
                  <div className="pn-exp-txt pn-in">
                    <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.6)', letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:5 }}>{c.sub}</div>
                    <div style={{ fontSize:50, fontWeight:900, color:'#fff', letterSpacing:'-0.04em', lineHeight:1, fontFamily:"'Sora',sans-serif", marginBottom:5 }}>{c.stat}</div>
                    <div style={{ fontSize:19, fontWeight:800, color:'#fff', fontFamily:"'Sora',sans-serif", marginBottom:10, letterSpacing:'-0.01em' }}>{c.label}</div>
                    <p style={{ fontSize:13, color:'rgba(255,255,255,0.78)', lineHeight:1.65, maxWidth:340, margin:'0 0 18px', fontFamily:"'DM Sans',sans-serif" }}>{c.desc}</p>
                    <Link href={c.href} className="pn-cta" style={{ color:c.color }}>{c.cta} →</Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
