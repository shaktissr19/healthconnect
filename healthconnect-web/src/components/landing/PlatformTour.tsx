'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const SLIDES = [
  {
    num:'01', total:'06', title:'Patient Dashboard',
    tagline:'Your health, always in your hands.',
    headline:'Track records, medications\nand appointments — free.',
    body:'Upload prescriptions, lab reports, and vitals in one encrypted space. Your 7-parameter Health Score updates in real time. Share your complete medical history with any doctor in one tap. Set medication reminders. Track symptoms over time.',
    bullets:['7-parameter health score updated in real time','Upload any prescription, report or doctor note','Share selectively with verified doctors only','Medication reminders and adherence tracking'],
    note:'⚠ Requires a free HealthConnect account.',
    // Indian patient using health app on phone
    photo:'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&q=80',
    accent:'#1A6BB5',
    before:'Scattered reports across clinics, lost prescriptions, no health history overview, repeating your story to every new doctor.',
    after:'One encrypted space for all records. Health score in real time. Share complete history with any doctor in one tap.',
  },
  {
    num:'02', total:'06', title:'Doctor Directory',
    tagline:'Find. Trust. Book in 2 minutes.',
    headline:'NMC-verified doctors,\nreal availability, no queues.',
    body:'Every doctor on HealthConnect carries a tamper-proof HCD ID verified by NMC/MCI. Filter by specialty, city, fee, and language. See real-time slot availability. Confirm your booking in under 2 minutes. No phone calls needed.',
    bullets:['NMC/MCI verified with tamper-proof HCD identity','Real-time availability — no phone calls needed','In-person, video call, or home visit options','Average booking time: 1 minute 42 seconds'],
    note:'✓ Free to search and book for all users.',
    // Doctor in white coat smiling
    photo:'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=900&q=80',
    accent:'#7C3AED',
    before:'No way to verify a doctor\'s credentials. Long phone queues. Drive to clinic to book. No idea if the slot is actually available.',
    after:'HCD-verified identity. Real-time availability. Book in 2 minutes from your phone. In-person, video, or home visit.',
  },
  {
    num:'03', total:'06', title:'Health Communities',
    tagline:'Never face diagnosis alone.',
    headline:'Anonymous communities,\nspecialist-moderated.',
    body:'Condition-specific groups for diabetes, cardiac care, mental health, PCOD and more. Browse communities freely. Post anonymously with a free account. Verified specialists moderate every group. +37% better outcomes in peer-supported care.',
    bullets:['Browse all communities without an account','Post anonymously — zero identity tracking','Specialist-moderated, evidence-based discussions','+37% better outcomes in peer communities (JAMA 2022)'],
    note:'✓ Browse free. Account needed to post.',
    // Group of people in support/community setting
    photo:'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=900&q=80',
    accent:'#059669',
    before:'Googling symptoms alone. Unreliable WhatsApp groups. No specialist to verify information. Fear of judgement for sensitive questions.',
    after:'Anonymous, specialist-moderated groups. Verified answers. 18+ condition communities. Proven to improve outcomes by 37%.',
  },
  {
    num:'04', total:'06', title:'Doctor Dashboard',
    tagline:'For doctors. Built for Bharat.',
    headline:'Manage patients, appointments\nand your digital practice.',
    body:'Doctors get an HCD-verified digital identity. Receive patient health timelines before every consultation, saving 10 minutes per visit. Manage appointment queues, collect verified reviews, and reach patients across India.',
    bullets:['HCD-verified identity visible to patients nationwide','Complete patient health timeline before every visit','Appointment queue management and auto-reminders','Practice analytics, ratings and growth dashboards'],
    note:'⚠ Requires doctor registration and NMC/MCI verification.',
    // Doctor with tablet/digital tools — replaces the brain anatomy model
    photo:'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=900&q=80',
    accent:'#0891B2',
    before:'Unverified online presence. No patient history before consultation. Manual appointment registers. Limited reach to local area only.',
    after:'HCD-verified national profile. Full patient timeline before every visit. Digital queue management. Reach patients across India.',
  },
  {
    num:'05', total:'06', title:'Hospital Directory',
    tagline:'The right hospital, right now.',
    headline:'340+ hospitals with live\navailability and Ayushman Bharat.',
    body:'Find hospitals across India by location, specialty, and real-time bed availability. Integrated with Ayushman Bharat PM-JAY for cashless treatment. Emergency SOS connects you to the nearest available hospital instantly.',
    bullets:['Search hospitals free — no account required','340+ partner hospitals with live bed availability','Ayushman Bharat PM-JAY cashless treatment','Emergency SOS with real-time hospital locator'],
    note:'✓ Free to search for all users.',
    // Modern hospital building/corridor
    photo:'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=900&q=80',
    accent:'#D97706',
    before:'Calling hospitals blindly. No idea about bed availability. Unsure which hospitals accept your insurance or PMJAY scheme.',
    after:'Live bed availability. 340+ hospitals. Ayushman Bharat integration. Emergency SOS to nearest hospital in seconds.',
  },
  {
    num:'06', total:'06', title:'Knowledge Hub',
    tagline:'Healthcare you can trust.',
    headline:'Doctor-reviewed health knowledge\nfor every Indian.',
    body:'Curated articles, condition guides, drug information, and India-wide health trends — all reviewed by verified doctors. India-specific conditions like diabetes, hypertension, dengue covered in depth. Zero ads. Zero sponsored content.',
    bullets:['Every article reviewed by a verified Indian doctor','India-specific condition guides and ICMR guidelines','Drug information and treatment guides','Zero ads, zero sponsored content — always free'],
    note:'✓ Entirely free — no account required.',
    // Person reading health content on laptop
    photo:'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=900&q=80',
    accent:'#E11D48',
    before:'Random Google results. Unreliable health blogs. Sponsored content mixed with real advice. No India-specific guidance.',
    after:'Doctor-reviewed articles. ICMR guidelines. India-specific conditions covered. Zero ads. Completely free.',
  },
];

export default function PlatformTour() {
  const [active,  setActive]  = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [paused,  setPaused]  = useState(false);
  const [showBA,  setShowBA]  = useState(false);
  const [baView,  setBaView]  = useState<'before'|'after'>('before');

  const goTo = useCallback((i: number) => {
    setActive(i); setAnimKey(k=>k+1); setShowBA(false);
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => goTo((active+1) % SLIDES.length), 5500);
    return () => clearInterval(t);
  }, [active, paused, goTo]);

  const s = SLIDES[active];

  return (
    <section id="platform-tour" style={{ background:'#fff', padding:'48px 48px 0' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800;900&family=DM+Sans:wght@400;500;600&display=swap');

        @keyframes ptIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .pt-in{animation:ptIn 0.42s ease both;}
        @keyframes ptImg{from{opacity:0;transform:scale(1.03)}to{opacity:1;transform:scale(1)}}
        .pt-img{animation:ptImg 0.5s ease both;}

        .pt-bullet{display:flex;align-items:flex-start;gap:10px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.07);font-family:'DM Sans',sans-serif;font-size:13px;color:rgba(200,220,255,0.78);font-weight:500;}
        .pt-bullet:last-child{border-bottom:none;}
        .pt-cta{display:inline-flex;align-items:center;gap:8px;padding:11px 24px;border:none;font-family:'Sora',sans-serif;font-size:12px;font-weight:700;cursor:pointer;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em;color:#fff;transition:all 0.2s;}
        .pt-cta:hover{transform:translateX(3px);}
        .pt-dot{transition:all 0.3s ease;border:none;cursor:pointer;padding:0;}
        .pt-ba-btn{padding:6px 14px;border:none;cursor:pointer;font-family:'Sora',sans-serif;font-size:11px;font-weight:700;transition:all 0.2s;letter-spacing:0.05em;text-transform:uppercase;}
        @keyframes baIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .pt-ba-content{animation:baIn 0.25s ease both;}

        @media(max-width:1024px){.pt-grid{grid-template-columns:1fr!important;}.pt-photo-col{height:200px!important;}}
        @media(max-width:768px){.pt-text-pad{padding:28px 24px 32px!important;}}
      `}</style>

      <div
        style={{ background:'#0A1628', borderRadius:16, overflow:'hidden', height:'72vh', minHeight:520, position:'relative' }}
        onMouseEnter={()=>setPaused(true)}
        onMouseLeave={()=>setPaused(false)}
      >
        {/* Top-left label — clear of content */}
        <div style={{ position:'absolute', top:16, left:28, zIndex:10, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.28)', fontFamily:"'DM Sans',sans-serif", letterSpacing:'0.1em' }}>{s.num} / {s.total}</span>
          <span style={{ width:16, height:1, background:'rgba(255,255,255,0.14)' }}/>
          <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.38)', fontFamily:"'DM Sans',sans-serif", letterSpacing:'0.08em', textTransform:'uppercase' }}>{s.title}</span>
        </div>

        <div className="pt-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', height:'100%' }}>

          {/* LEFT — 68px top padding clears label */}
          <div className="pt-text-pad" style={{ display:'flex', alignItems:'center', padding:'68px 48px 36px', position:'relative', zIndex:2, overflowY:'auto' }}>
            <div key={`t${active}${animKey}`} className="pt-in" style={{ width:'100%' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <div style={{ width:3, height:22, background:s.accent, borderRadius:2 }}/>
                <span style={{ fontSize:11, fontWeight:700, color:s.accent, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif" }}>{s.tagline}</span>
              </div>

              <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(1.4rem,1.9vw,2rem)', fontWeight:900, color:'#EEF4FF', letterSpacing:'-0.025em', lineHeight:1.18, margin:'0 0 12px', whiteSpace:'pre-line' }}>
                {s.headline}
              </h2>

              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, lineHeight:1.7, color:'rgba(195,215,255,0.68)', margin:'0 0 16px', maxWidth:420 }}>
                {s.body}
              </p>

              {!showBA && (
                <div style={{ marginBottom:14 }}>
                  {s.bullets.map((b,i)=>(
                    <div key={i} className="pt-bullet">
                      <span style={{ color:s.accent, flexShrink:0, marginTop:1 }}>→</span>{b}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginBottom:14 }}>
                <button onClick={()=>setShowBA(!showBA)} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:`1px solid ${s.accent}50`, padding:'5px 12px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, color:s.accent, letterSpacing:'0.06em', textTransform:'uppercase', borderRadius:4, transition:'all 0.2s' }}>
                  <span>{showBA?'▲ Hide':'▼ Show'} Before vs After</span>
                </button>
                {showBA && (
                  <div className="pt-ba-content" style={{ marginTop:10, background:'rgba(255,255,255,0.04)', border:`1px solid ${s.accent}25`, borderRadius:8, overflow:'hidden' }}>
                    <div style={{ display:'flex', borderBottom:`1px solid ${s.accent}20` }}>
                      <button className="pt-ba-btn" onClick={()=>setBaView('before')} style={{ flex:1, background:baView==='before'?'rgba(231,70,70,0.15)':'transparent', color:baView==='before'?'#F87171':'rgba(255,255,255,0.4)', borderRight:`1px solid ${s.accent}20`, padding:'8px 0' }}>✗ Before</button>
                      <button className="pt-ba-btn" onClick={()=>setBaView('after')} style={{ flex:1, background:baView==='after'?`${s.accent}18`:'transparent', color:baView==='after'?s.accent:'rgba(255,255,255,0.4)', padding:'8px 0' }}>✓ After</button>
                    </div>
                    <div style={{ padding:'12px 16px' }}>
                      <p className="pt-ba-content" key={baView} style={{ margin:0, fontSize:13, lineHeight:1.65, fontFamily:"'DM Sans',sans-serif", color:baView==='before'?'rgba(248,113,113,0.9)':'rgba(134,239,172,0.9)', fontStyle:'italic' }}>
                        {baView==='before' ? s.before : s.after}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ fontSize:11, color:`${s.accent}AA`, fontFamily:"'DM Sans',sans-serif", marginBottom:14, padding:'6px 10px', background:`${s.accent}10`, borderLeft:`2px solid ${s.accent}55`, fontStyle:'italic' }}>
                {s.note}
              </div>

              <Link
                href={
                  s.title === 'Doctor Dashboard' ? '/?home=1#signup&role=doctor' :
                  s.title === 'Hospital Directory' ? '/?home=1#signup&role=hospital' :
                  '/?home=1#signup'
                }
                className="pt-cta"
                style={{ background:s.accent, boxShadow:`0 4px 16px ${s.accent}45` }}
              >
                {s.title === 'Doctor Dashboard' ? 'Join as a Doctor →' :
                 s.title === 'Hospital Directory' ? 'Register Hospital →' :
                 'Get Started →'}
              </Link>
            </div>
          </div>

          {/* RIGHT photo */}
          <div className="pt-photo-col" style={{ position:'relative', overflow:'hidden' }}>
            <div key={`i${active}${animKey}`} className="pt-img"
              style={{ position:'absolute', inset:0, backgroundImage:`url(${s.photo})`, backgroundSize:'cover', backgroundPosition:'center' }}
            />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right,#0A1628 0%,rgba(10,22,40,0.18) 38%,transparent 65%)' }}/>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,#0A1628 0%,transparent 28%)' }}/>
          </div>
        </div>

        {/* Dot nav */}
        <div style={{ position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6, zIndex:10 }}>
          {SLIDES.map((_,i)=>(
            <button key={i} className="pt-dot" onClick={()=>goTo(i)}
              style={{ width:i===active?22:6, height:6, borderRadius:999, background:i===active?s.accent:'rgba(255,255,255,0.2)' }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
