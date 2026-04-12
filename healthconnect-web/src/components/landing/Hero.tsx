'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

const TABS = [
  {
    id: 'patient',
    icon: '❤️',
    label: "I'm a Patient",
    accent: '#4B9FE1',
    accentDark: '#1A6BB5',
    tagline: 'FOR PATIENTS',
    headline: 'Everything your health\nneeds — in one place.',
    sub: 'Upload reports. Book NMC-verified doctors. Track your 7-parameter health score. Join anonymous communities for your condition. Free forever.',
    bullets: [
      { icon: '📋', text: 'Complete medical history — prescriptions, reports, vitals' },
      { icon: '🩺', text: 'Book verified doctors in under 2 minutes' },
      { icon: '💊', text: 'Medication reminders & health score tracking' },
      { icon: '🔒', text: 'End-to-end encrypted. DPDP 2023 compliant.' },
    ],
    cta1: { label: 'Create Free Account →', href: '/?home=1#signup' },
    cta2: { label: 'See How It Works', href: '#platform-tour' },
    badge: null,
    note: '✓ Free to sign up. No credit card required.',
  },
  {
    id: 'community',
    icon: '🤝',
    label: 'Health Communities',
    accent: '#34D399',
    accentDark: '#059669',
    tagline: 'ANONYMOUS · FREE TO BROWSE',
    headline: 'Ask anything.\nNobody knows it\'s you.',
    sub: '18+ condition-specific groups — diabetes, cardiac care, mental health, PCOD and more. Post anonymously. Get answers from verified specialist doctors. Browse free.',
    bullets: [
      { icon: '🎭', text: 'Post anonymously — zero identity tracking' },
      { icon: '👨‍⚕️', text: 'Every group moderated by a verified specialist' },
      { icon: '🔍', text: 'Browse all communities without any account' },
      { icon: '📊', text: '+37% better outcomes in peer communities (JAMA 2022)' },
    ],
    cta1: { label: 'Browse Communities →', href: '/communities' },
    cta2: { label: 'Post Anonymously', href: '/communities' },
    badge: 'India Only',
    note: '✓ Browse free. Account needed to post.',
  },
  {
    id: 'doctor',
    icon: '🩺',
    label: "I'm a Doctor",
    accent: '#A78BFA',
    accentDark: '#7C3AED',
    tagline: 'FOR DOCTORS',
    headline: 'Reach patients across\nIndia. Verified.',
    sub: 'Get your HCD-verified digital identity recognised by NMC/MCI. Receive complete patient health timelines before every consultation. Manage appointments. Zero paperwork.',
    bullets: [
      { icon: '🪪', text: 'Tamper-proof HCD identity verified by NMC/MCI' },
      { icon: '📁', text: 'Full patient health timeline before every visit' },
      { icon: '📅', text: 'Appointment queue management & auto-reminders' },
      { icon: '📈', text: 'Practice analytics, ratings & national reach' },
    ],
    cta1: { label: 'Join as a Doctor →', href: '/?home=1#signup' },
    cta2: { label: 'See Doctor Features', href: '#platform-tour' },
    badge: 'NMC/MCI Verified',
    note: '⚠ Requires NMC/MCI registration & verification.',
  },
  {
    id: 'hospital',
    icon: '🏥',
    label: "I'm a Hospital",
    accent: '#FBB040',
    accentDark: '#D97706',
    tagline: 'FOR HOSPITALS',
    headline: 'Connect with patients\nwho need you most.',
    sub: 'List with live bed availability. Ayushman Bharat PM-JAY integration for cashless treatment. Emergency SOS network. Reach patients across India.',
    bullets: [
      { icon: '🛏️', text: 'Live bed availability visible to patients nationally' },
      { icon: '💳', text: 'Ayushman Bharat PM-JAY cashless treatment' },
      { icon: '🚨', text: 'Emergency SOS — patients routed to nearest hospital' },
      { icon: '🗺️', text: 'Searchable by location, specialty & availability' },
    ],
    cta1: { label: 'Register Your Hospital →', href: '/?home=1#signup' },
    cta2: { label: 'Learn More', href: '#platform-tour' },
    badge: 'AB-PMJAY',
    note: '⚠ Contact us to register your hospital.',
  },
] as const;

type TabId = typeof TABS[number]['id'];

const INTRO_PHOTO    = '/images/hero-intro.png';
const INTRO_DURATION = 4000;
const INTRO_FADE_MS  = 700;
const TAB_INTERVAL   = 5000; // auto-rotate every 5s

// ─── Health Score Modal ───────────────────────────────────────────────────────
const QUESTIONS = [
  { q: 'What is your age group?', opts: ['Under 18', '18–30', '31–45', '46–60', '60+'] },
  { q: 'Do you have any chronic condition?', opts: ['None', 'Diabetes', 'High BP', 'Heart condition', 'Other'] },
  { q: 'How often do you exercise?', opts: ['Daily', '3–5x/week', '1–2x/week', 'Rarely', 'Never'] },
  { q: 'How many hours do you sleep?', opts: ['8+ hours', '7–8 hours', '6–7 hours', '5–6 hours', 'Under 5'] },
  { q: 'Do you take medications regularly?', opts: ['No medications', 'Yes, always on time', 'Sometimes miss doses', 'Often miss doses'] },
  { q: 'How would you rate your stress level?', opts: ['Very low', 'Low', 'Moderate', 'High', 'Very high'] },
  { q: 'When was your last health checkup?', opts: ['Last 3 months', '3–6 months ago', '6–12 months ago', 'Over a year ago', 'Never'] },
];

function scoreFromAnswers(ans: number[]): number {
  const weights = [
    [85,82,78,72,65],[90,65,60,55,70],[95,88,75,55,40],
    [92,88,78,60,40],[88,92,72,50],[92,85,75,55,40],[90,82,70,55,40],
  ];
  let total = 0;
  ans.forEach((a, i) => { total += (weights[i]?.[a] ?? 70); });
  return Math.round(Math.min(98, Math.max(30, total / QUESTIONS.length)));
}

function HealthScoreModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const pick = (optIdx: number) => {
    const newAns = [...answers, optIdx];
    setAnswers(newAns);
    if (step < QUESTIONS.length - 1) setStep(step + 1);
    else setScore(scoreFromAnswers(newAns));
  };
  const scoreColor = score ? (score >= 80 ? '#059669' : score >= 60 ? '#D97706' : '#E11D48') : '#1A6BB5';
  const scoreLabel = score ? (score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Needs Attention') : '';
  return (
    <div style={{ position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(6,14,30,0.78)',backdropFilter:'blur(6px)' }} onClick={onClose}>
      <div style={{ background:'#fff',borderRadius:20,padding:'36px 32px',maxWidth:480,width:'90%',position:'relative',boxShadow:'0 24px 80px rgba(0,0,0,0.35)' }} onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} style={{ position:'absolute',top:16,right:16,background:'#F3F4F6',border:'none',borderRadius:'50%',width:32,height:32,cursor:'pointer',fontSize:16 }}>✕</button>
        {score === null ? (
          <>
            <div style={{ marginBottom:24 }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8 }}>
                <span style={{ fontSize:11,fontWeight:700,color:'#1A6BB5',letterSpacing:'0.1em',textTransform:'uppercase',fontFamily:"'DM Sans',sans-serif" }}>Health Score Check</span>
                <span style={{ fontSize:11,color:'#94A3B8',fontFamily:"'DM Sans',sans-serif" }}>{step+1} / {QUESTIONS.length}</span>
              </div>
              <div style={{ height:4,background:'#E8F0F8',borderRadius:2 }}>
                <div style={{ height:'100%',borderRadius:2,background:'linear-gradient(90deg,#1A6BB5,#5B9CF6)',width:`${((step+1)/QUESTIONS.length)*100}%`,transition:'width 0.3s ease' }}/>
              </div>
            </div>
            <h3 style={{ fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,color:'#0A1628',marginBottom:20,lineHeight:1.35 }}>{QUESTIONS[step].q}</h3>
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              {QUESTIONS[step].opts.map((opt, i) => (
                <button key={i} onClick={()=>pick(i)} style={{ padding:'12px 16px',borderRadius:10,border:'1.5px solid #E8F0F8',background:'#F8FBFF',textAlign:'left',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,color:'#2C4A6A',transition:'all 0.15s' }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='#1A6BB5';(e.currentTarget as HTMLElement).style.background='#EBF4FF';}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='#E8F0F8';(e.currentTarget as HTMLElement).style.background='#F8FBFF';}}>
                  {opt}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign:'center',padding:'8px 0 24px' }}>
            <div style={{ fontSize:11,fontWeight:700,color:'#6B87A8',letterSpacing:'0.12em',textTransform:'uppercase',fontFamily:"'DM Sans',sans-serif",marginBottom:16 }}>Your Sample Health Score</div>
            <div style={{ width:120,height:120,borderRadius:'50%',border:`6px solid ${scoreColor}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',background:`${scoreColor}08` }}>
              <div style={{ fontSize:38,fontWeight:900,color:scoreColor,fontFamily:"'Sora',sans-serif",lineHeight:1 }}>{score}</div>
              <div style={{ fontSize:11,fontWeight:700,color:scoreColor,fontFamily:"'DM Sans',sans-serif" }}>/100</div>
            </div>
            <div style={{ fontSize:18,fontWeight:800,color:'#0A1628',fontFamily:"'Sora',sans-serif",marginBottom:8 }}>{scoreLabel}</div>
            <p style={{ fontSize:13,color:'#4A6B8A',fontFamily:"'DM Sans',sans-serif",lineHeight:1.65,margin:'0 auto 24px',maxWidth:320 }}>Sign up free to track your real health score with detailed insights.</p>
            <Link href="/?home=1#signup" onClick={onClose} style={{ display:'block',padding:'14px',background:'#1A6BB5',color:'#fff',borderRadius:10,fontFamily:"'Sora',sans-serif",fontSize:14,fontWeight:700,textDecoration:'none',textTransform:'uppercase',letterSpacing:'0.05em' }}>Track My Real Score — Free →</Link>
            <button onClick={()=>{setStep(0);setAnswers([]);setScore(null);}} style={{ marginTop:12,background:'none',border:'none',color:'#94A3B8',fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>Retake quiz</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Hero ────────────────────────────────────────────────────────────────
export default function Hero() {
  const [showIntro,    setShowIntro]    = useState(true);
  const [introFading,  setIntroFading]  = useState(false);
  const [mounted,      setMounted]      = useState(false);
  const [showModal,    setShowModal]    = useState(false);
  const [activeIdx,    setActiveIdx]    = useState(0);
  const [animKey,      setAnimKey]      = useState(0);
  const [paused,       setPaused]       = useState(false);
  const [counts,       setCounts]       = useState({ patients:'—', doctors:'—', communities:'—', hospitals:'—' });
  const [sessionToast, setSessionToast] = useState(false);
  const autoRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const tab = TABS[activeIdx];

  const goTo = (idx: number) => {
    setActiveIdx(idx);
    setAnimKey(k => k + 1);
  };

  const skipIntro = () => {
    setIntroFading(true);
    setTimeout(() => { setShowIntro(false); setMounted(true); }, INTRO_FADE_MS);
  };

  // Auto-rotate tabs
  useEffect(() => {
    if (paused) { if (autoRef.current) clearInterval(autoRef.current); return; }
    autoRef.current = setInterval(() => {
      setActiveIdx(i => (i + 1) % TABS.length);
      setAnimKey(k => k + 1);
    }, TAB_INTERVAL);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [paused]);

  // Session expired + repeat visitor
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('session') === 'expired') {
        setSessionToast(true);
        const url = new URL(window.location.href);
        url.searchParams.delete('session');
        window.history.replaceState({}, '', url.toString());
        setTimeout(() => setSessionToast(false), 5000);
      }
      // Always show intro on every page load — 4s is short enough not to be annoying
      // (sessionStorage check removed intentionally)
    }
  }, []);

  // Intro timer + stats fetch
  useEffect(() => {
    const TOTAL_INTRO = INTRO_DURATION + INTRO_FADE_MS;
    const t1 = setTimeout(() => setIntroFading(true), INTRO_DURATION);
    const t2 = setTimeout(() => { setShowIntro(false); setMounted(true); }, TOTAL_INTRO);

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

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <>
      {showModal && <HealthScoreModal onClose={() => setShowModal(false)}/>}

      {/* Session expired toast */}
      {sessionToast && (
        <div style={{ position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',zIndex:9999,background:'#1E293B',border:'1px solid rgba(255,255,255,0.12)',borderRadius:10,padding:'12px 20px',display:'flex',alignItems:'center',gap:12,boxShadow:'0 8px 32px rgba(0,0,0,0.35)',whiteSpace:'nowrap' }}>
          <span style={{ fontSize:16 }}>🔒</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,color:'rgba(255,255,255,0.88)' }}>You were signed out due to inactivity.</span>
          <button onClick={()=>setSessionToast(false)} style={{ background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:16,padding:'0 0 0 8px',lineHeight:1 }}>✕</button>
        </div>
      )}

      {/* Health Score button */}
      <div style={{ position:'fixed',top:76,right:24,zIndex:1001,opacity:showIntro?0:1,pointerEvents:showIntro?'none':'auto',transition:'opacity 0.5s ease' }}>
        <button onClick={()=>setShowModal(true)}
          style={{ display:'flex',alignItems:'center',gap:7,padding:'9px 16px',borderRadius:999,background:'linear-gradient(135deg,#1A6BB5,#2E86D4)',border:'none',color:'#fff',fontFamily:"'Sora',sans-serif",fontSize:12,fontWeight:700,cursor:'pointer',letterSpacing:'0.03em',boxShadow:'0 4px 20px rgba(26,107,181,0.4)',transition:'all 0.2s',whiteSpace:'nowrap' }}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-1px)';}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='';}}
        ><span style={{ fontSize:14 }}>✦</span>Check Your Health Score</button>
      </div>

      <div style={{ background:'#fff', padding:'80px 48px 0' }}>
        <section
          style={{ width:'100%',background:'linear-gradient(135deg,#060E1E 0%,#0A1628 45%,#0D2140 75%,#091830 100%)',position:'relative',overflow:'hidden',borderRadius:'16px' }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800;900&family=DM+Sans:wght@400;500;600&display=swap');

            .hh-glow1{position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(26,107,181,0.12) 0%,transparent 65%);top:-60px;left:-60px;pointer-events:none;}
            .hh-glow2{position:absolute;width:350px;height:350px;border-radius:50%;background:radial-gradient(circle,rgba(91,156,246,0.06) 0%,transparent 65%);bottom:0;right:10%;pointer-events:none;}

            /* Tab buttons */
            .hh-tab{
              display:inline-flex;align-items:center;gap:6px;
              padding:8px 15px;border-radius:8px;
              font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;
              cursor:pointer;transition:all 0.2s ease;
              border:1.5px solid transparent;white-space:nowrap;
              background:transparent;
            }
            .hh-tab:hover:not(.active){
              background:rgba(255,255,255,0.06);
              color:rgba(255,255,255,0.85) !important;
            }

            /* Progress bar under active tab */
            .hh-tab-progress{
              position:absolute;bottom:0;left:0;height:2px;border-radius:1px;
              animation:tabProgress ${TAB_INTERVAL}ms linear forwards;
            }
            @keyframes tabProgress{from{width:0%}to{width:100%}}

            /* Content animation */
            @keyframes hhTabIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
            .hh-tab-content{animation:hhTabIn 0.32s cubic-bezier(0.22,1,0.36,1) both;}

            /* Bullet rows */
            .hh-bullet{
              display:flex;align-items:center;gap:11px;
              padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.06);
              font-family:'DM Sans',sans-serif;font-size:13.5px;
              color:#CBD5E1;font-weight:500;line-height:1.4;
            }
            .hh-bullet:last-child{border-bottom:none;}
            .hh-bullet-icon{
              width:30px;height:30px;border-radius:7px;
              display:flex;align-items:center;justify-content:center;
              font-size:14px;flex-shrink:0;
            }

            /* Primary CTA */
            .hh-btn-p{
              display:inline-flex;align-items:center;gap:8px;
              padding:12px 24px;border:none;border-radius:5px;
              font-family:'Sora',sans-serif;font-size:12.5px;font-weight:700;
              cursor:pointer;text-decoration:none;
              letter-spacing:0.05em;text-transform:uppercase;
              transition:all 0.2s;color:#fff;
            }
            .hh-btn-p:hover{transform:translateY(-1px);filter:brightness(1.1);}
            /* Secondary CTA */
            .hh-btn-o{
              display:inline-flex;align-items:center;gap:8px;
              padding:11px 20px;border-radius:5px;
              font-family:'Sora',sans-serif;font-size:12.5px;font-weight:600;
              cursor:pointer;text-decoration:none;
              letter-spacing:0.05em;text-transform:uppercase;
              transition:all 0.2s;background:transparent;
              border:1.5px solid rgba(255,255,255,0.25);
              color:#E2E8F0;
            }
            .hh-btn-o:hover{border-color:rgba(255,255,255,0.55);color:#fff;background:rgba(255,255,255,0.05);}

            /* Stat items */
            .hh-stat{
              display:flex;flex-direction:column;
              padding:0 20px;border-right:1px solid rgba(255,255,255,0.08);
            }
            .hh-stat:first-child{padding-left:0;}
            .hh-stat:last-child{border-right:none;}

            /* Right card */
            .hh-card{
              background:rgba(255,255,255,0.05);
              border:1px solid rgba(255,255,255,0.1);
              border-radius:14px;padding:22px 24px;
              backdrop-filter:blur(12px);
              -webkit-backdrop-filter:blur(12px);
            }

            /* Mount animation */
            .hh-fu{opacity:0;transform:translateY(14px);transition:opacity 0.55s ease,transform 0.55s ease;}
            .hh-fu.in{opacity:1;transform:translateY(0);}

            /* India Only badge */
            .hh-badge-green{
              font-size:9px;font-weight:800;padding:2px 7px;border-radius:4px;
              text-transform:uppercase;letter-spacing:0.07em;
              background:rgba(52,211,153,0.18);color:#34D399;
              border:1px solid rgba(52,211,153,0.28);
            }

            /* Intro splash */
            @keyframes hhiFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
            @keyframes hhiBarGrow{from{width:0%}to{width:100%}}
            @keyframes hhiDotPulse{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.45)}}
            .hhi-block{animation:hhiFadeUp 0.65s cubic-bezier(0.22,1,0.36,1) both}
            .hhi-d1{animation-delay:0.1s}.hhi-d2{animation-delay:0.3s}
            .hhi-d3{animation-delay:0.55s}.hhi-d4{animation-delay:0.8s}
            .hhi-bar{animation:hhiBarGrow ${INTRO_DURATION}ms linear 0.15s both}
            .hhi-dot{display:inline-block;animation:hhiDotPulse 2s ease infinite;margin:0 9px;color:#1a3a5c;line-height:1}

            @keyframes scrollB{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}
            .hh-scroll{animation:scrollB 2s ease infinite;}

            /* Dot nav */
            .hh-dot{border:none;cursor:pointer;padding:0;border-radius:999px;transition:all 0.3s ease;}

            @media(max-width:1100px){
              .hh-right-col{display:none!important;}
              .hh-grid{grid-template-columns:1fr!important;}
            }
            @media(max-width:768px){
              .hh-inner{padding:24px 20px 28px!important;}
              .hh-headline{font-size:1.85rem!important;}
              .hh-tabs-row{gap:3px!important;}
              .hh-tab{padding:6px 10px!important;font-size:11.5px!important;}
            }
          `}</style>

          <div className="hh-glow1"/><div className="hh-glow2"/>

          {/* ── INTRO SPLASH ────────────────────────────────────────────── */}
          {showIntro && (
            <div style={{ position:'absolute',inset:0,zIndex:20,borderRadius:16,overflow:'hidden',opacity:introFading?0:1,transition:`opacity ${INTRO_FADE_MS}ms ease`,pointerEvents:introFading?'none':'auto' }}>
              {/* Medical background — Indian doctor/patient context */}
              <div style={{ position:'absolute',inset:0,backgroundImage:`url(${INTRO_PHOTO})`,backgroundSize:'cover',backgroundPosition:'center center' }}/>
              {/* Dark overlay for text readability — stronger at bottom */}
              <div style={{ position:'absolute',inset:0,background:'linear-gradient(to bottom, rgba(4,10,22,0.45) 0%, rgba(4,10,22,0.35) 40%, rgba(4,10,22,0.65) 80%, rgba(4,10,22,0.85) 100%)' }}/>

              {/* Centred content block */}
              <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'min(720px,90%)',textAlign:'center' }}>

                {/* HC badge */}
                <div className="hhi-block hhi-d1" style={{ display:'flex',justifyContent:'center',marginBottom:16 }}>
                  <div style={{ width:56,height:56,borderRadius:14,background:'linear-gradient(135deg,#0D9488,#14B8A6)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Sora',sans-serif",fontWeight:900,fontSize:20,color:'#fff',boxShadow:'0 4px 24px rgba(20,184,166,0.4)',letterSpacing:'-0.5px' }}>HC</div>
                </div>

                {/* HealthConnect — largest, bold, dark navy with white shadow */}
                <div className="hhi-block hhi-d2" style={{ fontFamily:"'Sora',sans-serif",fontSize:'clamp(2.4rem,5vw,4rem)',fontWeight:900,color:'#fff',lineHeight:1,letterSpacing:'-0.035em',marginBottom:10,textShadow:'0 2px 20px rgba(4,10,22,0.7)' }}>
                  HealthConnect
                </div>

                {/* Tagline — medium, teal */}
                <div className="hhi-block hhi-d3" style={{ fontFamily:"'Sora',sans-serif",fontSize:'clamp(1rem,2vw,1.5rem)',fontWeight:700,color:'#5EEAD4',lineHeight:1.2,letterSpacing:'-0.01em',marginBottom:24,textShadow:'0 1px 12px rgba(4,10,22,0.6)' }}>
                  India's Unified Healthcare Platform
                </div>

                {/* Four pillars — dot separated */}
                <div className="hhi-block hhi-d4" style={{ display:'flex',alignItems:'center',justifyContent:'center',flexWrap:'wrap',gap:0,marginBottom:28 }}>
                  {[
                    { icon:'❤️', label:'Patients' },
                    { icon:'🤝', label:'Communities' },
                    { icon:'🩺', label:'Doctors' },
                    { icon:'🏥', label:'Hospitals' },
                  ].map((item, i, arr) => (
                    <span key={i} style={{ display:'flex',alignItems:'center' }}>
                      <span style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 12px',background:'rgba(255,255,255,0.1)',borderRadius:999,border:'1px solid rgba(255,255,255,0.15)',backdropFilter:'blur(4px)' }}>
                        <span style={{ fontSize:13 }}>{item.icon}</span>
                        <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.92)',letterSpacing:'0.02em' }}>{item.label}</span>
                      </span>
                      {i < arr.length-1 && (
                        <span style={{ width:16,height:1,background:'rgba(255,255,255,0.2)',margin:'0 4px' }}/>
                      )}
                    </span>
                  ))}
                </div>

                {/* CTA line */}
                <div className="hhi-block hhi-d4" style={{ fontFamily:"'Sora',sans-serif",fontSize:'clamp(0.72rem,1.1vw,0.9rem)',fontWeight:700,color:'rgba(94,234,212,0.8)',letterSpacing:'0.14em',textTransform:'uppercase' }}>
                  — Free · Private · Built for Bharat —
                </div>
              </div>

              {/* Progress bar at bottom */}
              <div style={{ position:'absolute',bottom:0,left:0,right:0,height:3,background:'rgba(13,107,74,0.15)' }}>
                <div className="hhi-bar" style={{ height:'100%',background:'linear-gradient(to right,#0D9488,#14B8A6,#5EEAD4)' }}/>
              </div>

              {/* Skip button */}
              <button onClick={skipIntro}
                style={{ position:'absolute',bottom:18,right:20,background:'rgba(0,0,0,0.32)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:999,padding:'6px 16px',color:'rgba(255,255,255,0.78)',fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,cursor:'pointer',letterSpacing:'0.06em',textTransform:'uppercase',transition:'all 0.2s',zIndex:10 }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(0,0,0,0.55)';(e.currentTarget as HTMLElement).style.color='#fff';}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(0,0,0,0.32)';(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.78)';}}
              >Skip →</button>
            </div>
          )}

          {/* Subtle diagonal lines */}
          <div style={{ position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden',borderRadius:16,zIndex:1 }}>
            <svg viewBox="0 0 800 600" style={{ position:'absolute',right:0,top:0,width:'55%',height:'100%',opacity:0.04 }} preserveAspectRatio="none">
              <line x1="800" y1="0" x2="300" y2="600" stroke="#5B9CF6" strokeWidth="1.5"/>
              <line x1="650" y1="0" x2="150" y2="600" stroke="#5B9CF6" strokeWidth="1"/>
              <line x1="500" y1="0" x2="0" y2="600" stroke="#5B9CF6" strokeWidth="0.6"/>
            </svg>
          </div>

          {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
          <div className="hh-inner" style={{ position:'relative',zIndex:2,maxWidth:1280,margin:'0 auto',padding:'22px 52px 20px' }}>

            {/* Platform label */}
            <div className={`hh-fu ${mounted?'in':''}`} style={{ transitionDelay:'0ms',display:'flex',alignItems:'center',gap:8,marginBottom:10 }}>
              <div style={{ width:22,height:1,background:'#5B9CF6' }}/>
              <span style={{ fontSize:11,fontWeight:700,color:'#7EB3F5',letterSpacing:'0.18em',textTransform:'uppercase',fontFamily:"'DM Sans',sans-serif" }}>India's Unified Healthcare Platform</span>
            </div>

            {/* Tab switcher */}
            <div className={`hh-fu ${mounted?'in':''}`} style={{ transitionDelay:'60ms',marginBottom:18 }}>
              <div className="hh-tabs-row" style={{ display:'flex',alignItems:'center',gap:4,flexWrap:'wrap' }}>
                {TABS.map((t, i) => (
                  <div key={t.id} style={{ position:'relative' }}>
                    <button
                      onClick={() => { goTo(i); setPaused(true); setTimeout(() => setPaused(false), 10000); }}
                      className={`hh-tab ${activeIdx===i?'active':''}`}
                      style={{
                        color: activeIdx===i ? '#FFFFFF' : 'rgba(148,163,184,0.72)',
                        borderColor: activeIdx===i ? `${t.accentDark}70` : 'transparent',
                        background: activeIdx===i ? `${t.accentDark}28` : 'transparent',
                      }}
                    >
                      <span style={{ fontSize:15 }}>{t.icon}</span>
                      <span>{t.label}</span>
                      {t.id === 'community' && <span className="hh-badge-green">India Only</span>}
                    </button>
                    {/* Progress bar under active tab */}
                    {activeIdx===i && !paused && (
                      <div key={animKey} className="hh-tab-progress" style={{ background:t.accent }}/>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Two-column grid */}
            <div className="hh-grid" style={{ display:'grid',gridTemplateColumns:'1fr 380px',gap:48,alignItems:'center' }}>

              {/* LEFT */}
              <div key={`L${animKey}`}>
                <div className="hh-tab-content">
                  {/* Tagline */}
                  <div style={{ fontSize:10,fontWeight:800,color:tab.accent,letterSpacing:'0.2em',textTransform:'uppercase',fontFamily:"'DM Sans',sans-serif",marginBottom:10 }}>
                    {tab.tagline}
                  </div>

                  {/* Headline — pure white, large, high contrast */}
                  <h1 className="hh-headline" style={{ fontFamily:"'Sora',sans-serif",fontSize:'clamp(1.95rem,3vw,3.2rem)',fontWeight:900,color:'#F1F5F9',lineHeight:1.1,letterSpacing:'-0.03em',margin:'0 0 12px',whiteSpace:'pre-line' }}>
                    {tab.headline}
                  </h1>

                  {/* Subtitle — clearly readable */}
                  <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:15,lineHeight:1.68,color:'#94A3B8',margin:'0 0 20px',maxWidth:480 }}>
                    {tab.sub}
                  </p>

                  {/* CTAs */}
                  <div style={{ display:'flex',gap:10,flexWrap:'wrap',marginBottom:20 }}>
                    <Link href={tab.cta1.href} className="hh-btn-p" style={{ background:tab.accentDark,boxShadow:`0 4px 16px ${tab.accentDark}50` }}>
                      {tab.cta1.label}
                    </Link>
                    <Link href={tab.cta2.href} className="hh-btn-o">
                      {tab.cta2.label}
                    </Link>
                  </div>

                  {/* Stats bar + dots on same row */}
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:14,borderTop:'1px solid rgba(255,255,255,0.07)' }}>
                    {/* Stats */}
                    <div style={{ display:'flex',alignItems:'center' }}>
                      {[
                        { v:counts.patients,    l:'Patients'         },
                        { v:counts.doctors,     l:'Verified Doctors' },
                        { v:counts.communities, l:'Communities'      },
                        { v:counts.hospitals,   l:'Hospitals'        },
                      ].map((s, i) => (
                        <div key={i} className="hh-stat">
                          <div style={{ fontSize:21,fontWeight:900,color:'#F1F5F9',letterSpacing:'-0.02em',lineHeight:1,fontFamily:"'Sora',sans-serif" }}>{s.v}</div>
                          <div style={{ fontSize:10,color:'#475569',marginTop:4,fontFamily:"'DM Sans',sans-serif",fontWeight:500 }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                    {/* Dots — right side of same row */}
                    <div style={{ display:'flex',gap:5,alignItems:'center',flexShrink:0 }}>
                      {TABS.map((t, i) => (
                        <button key={i} className="hh-dot"
                          onClick={() => { goTo(i); setPaused(true); setTimeout(() => setPaused(false), 10000); }}
                          style={{ width:i===activeIdx?18:5,height:5,background:i===activeIdx?tab.accent:'rgba(255,255,255,0.18)' }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT — feature card */}
              <div className="hh-right-col" key={`R${animKey}`}>
                <div className="hh-tab-content hh-card">

                  {/* Card header */}
                  <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:14,paddingBottom:12,borderBottom:`1px solid rgba(255,255,255,0.08)` }}>
                    <div style={{ width:36,height:36,borderRadius:9,background:`${tab.accentDark}28`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0 }}>
                      {tab.icon}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:9.5,fontWeight:700,color:tab.accent,letterSpacing:'0.14em',textTransform:'uppercase',fontFamily:"'DM Sans',sans-serif",marginBottom:1 }}>What you get</div>
                      <div style={{ fontSize:13.5,fontWeight:800,color:'#F1F5F9',fontFamily:"'Sora',sans-serif" }}>{tab.label}</div>
                    </div>
                    {tab.badge && (
                      <div style={{ background:`${tab.accentDark}22`,border:`1px solid ${tab.accentDark}45`,borderRadius:5,padding:'3px 8px',fontSize:9,fontWeight:800,color:tab.accent,textTransform:'uppercase',letterSpacing:'0.06em',fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap',flexShrink:0 }}>
                        {tab.badge}
                      </div>
                    )}
                  </div>

                  {/* Bullets — clearly readable */}
                  {tab.bullets.map((b, i) => (
                    <div key={i} className="hh-bullet">
                      <div className="hh-bullet-icon" style={{ background:`${tab.accentDark}22` }}>{b.icon}</div>
                      <span>{b.text}</span>
                    </div>
                  ))}

                  {/* Access note */}
                  <div style={{ marginTop:12,padding:'7px 11px',background:`${tab.accentDark}12`,borderLeft:`2px solid ${tab.accentDark}60`,borderRadius:'0 4px 4px 0' }}>
                    <span style={{ fontSize:11,color:tab.accent,fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontStyle:'italic' }}>
                      {tab.note}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>{/* end hh-inner */}

          {/* Scroll indicator */}
          <div className="hh-scroll" style={{ position:'absolute',bottom:12,left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:4,zIndex:4 }}>
            <div style={{ width:1,height:20,background:'linear-gradient(to bottom,transparent,rgba(91,156,246,0.25))' }}/>
            <div style={{ width:4,height:4,borderRadius:'50%',background:'rgba(91,156,246,0.3)' }}/>
          </div>

        </section>
      </div>
    </>
  );
}
