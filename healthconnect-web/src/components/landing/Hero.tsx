'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

// PHRASES and RIGHT_ITEMS are index-paired — same length, same order.
// When left says "doctors you trust." right shows the Doctors panel. etc.
const CAROUSEL_ITEMS: {
  phrase: string;
  type: string; label: string; name: string;
  icon: string; color: string;
  bullets?: string[];
  story?: string;
}[] = [
  {
    phrase: 'organised & private.',
    type:'feature', label:'For Patients', name:'Track your health, your way',
    icon:'❤️', color:'#5B9CF6',
    bullets:[
      'Personal health score across 7 parameters',
      'Complete medical history for you & your family',
      'Book verified doctors in under 2 minutes',
      'Medication reminders — never miss a dose',
    ],
  },
  {
    phrase: 'doctors you trust.',
    type:'feature', label:'Book Doctors', name:'Verified doctors, real availability',
    icon:'🩺', color:'#A78BFA',
    bullets:[
      'Every doctor NMC/MCI verified with HCD identity',
      'Real-time slots — no phone calls, no waiting',
      'In-person, video consultation, or home visit',
      'Average booking time: 1 minute 42 seconds',
    ],
  },
  {
    phrase: 'records that travel.',
    type:'story', label:'Patient · New Delhi', name:'Priya Sharma',
    icon:'PS', color:'#5B9CF6', bullets:[],
    story:'"I uploaded 3 years of reports in one go. My cardiologist saw everything before I sat down. First time I didn\'t have to repeat my entire history."',
  },
  {
    phrase: 'communities that care.',
    type:'feature', label:'Health Communities', name:'Find people who understand you',
    icon:'🤝', color:'#34D399',
    bullets:[
      'Find & join people dealing with your condition',
      'Discuss symptoms, treatments — 100% anonymously',
      'Get answers from verified specialist doctors',
      'Diabetes, cardiac, PCOD, mental health & more',
    ],
  },
  {
    phrase: 'a doctor in 2 minutes.',
    type:'feature', label:'For Doctors', name:'Grow your practice across India',
    icon:'👨‍⚕️', color:'#38BDF8',
    bullets:[
      'HCD-verified digital identity nationwide',
      'Patient health timelines before every visit',
      'Appointment queue & reminder management',
      'Build reviews, expand patient reach',
    ],
  },
  {
    phrase: 'hospitals when you need.',
    type:'feature', label:'Hospitals & Emergency', name:'Right hospital, right now',
    icon:'🏥', color:'#FBB040',
    bullets:[
      '340+ hospitals — search by location or specialty',
      'Live bed availability — instant visibility',
      'Ayushman Bharat PM-JAY cashless treatment',
      'Emergency SOS to nearest available hospital',
    ],
  },
  {
    phrase: 'care that remembers you.',
    type:'story', label:'Cardiologist · Mumbai', name:'Dr. Arvind Mehta',
    icon:'AM', color:'#C4B5FD', bullets:[],
    story:'"12 appointment requests in my first week. Patient timelines save me 10 minutes per consultation. I see more patients and give better care."',
  },
  {
    phrase: 'built for Bharat.',
    type:'feature', label:'Knowledge Hub', name:'Health knowledge you can trust',
    icon:'📚', color:'#F87171',
    bullets:[
      'Doctor-reviewed articles on Indian conditions',
      'Drug information, dosage guides — verified',
      'ICMR guidelines, seasonal disease alerts',
      'Zero ads, zero sponsored content — free',
    ],
  },
];

const HERO_PHOTO = '/images/hero-photo.png';

const QUESTIONS = [
  { q:'What is your age group?', opts:['Under 18','18–30','31–45','46–60','60+'] },
  { q:'Do you have any chronic condition?', opts:['None','Diabetes','High BP','Heart condition','Other'] },
  { q:'How often do you exercise?', opts:['Daily','3–5x/week','1–2x/week','Rarely','Never'] },
  { q:'How many hours do you sleep?', opts:['8+ hours','7–8 hours','6–7 hours','5–6 hours','Under 5'] },
  { q:'Do you take medications regularly?', opts:['No medications','Yes, always on time','Sometimes miss doses','Often miss doses'] },
  { q:'How would you rate your stress level?', opts:['Very low','Low','Moderate','High','Very high'] },
  { q:'When was your last health checkup?', opts:['Last 3 months','3–6 months ago','6–12 months ago','Over a year ago','Never'] },
];

function scoreFromAnswers(ans: number[]): number {
  if (ans.length < QUESTIONS.length) return 0;
  const weights = [
    [85,82,78,72,65],[90,65,60,55,70],[95,88,75,55,40],
    [92,88,78,60,40],[88,92,72,50],[92,85,75,55,40],[90,82,70,55,40],
  ];
  let total = 0;
  ans.forEach((a,i) => { total += (weights[i]?.[a] ?? 70); });
  return Math.round(Math.min(98, Math.max(30, total / QUESTIONS.length)));
}

function HealthScoreModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState<number|null>(null);
  const pick = (optIdx: number) => {
    const newAns = [...answers, optIdx];
    setAnswers(newAns);
    if (step < QUESTIONS.length - 1) setStep(step + 1);
    else setScore(scoreFromAnswers(newAns));
  };
  const scoreColor = score ? (score >= 80 ? '#059669' : score >= 60 ? '#D97706' : '#E11D48') : '#1A6BB5';
  const scoreLabel = score ? (score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Needs Attention') : '';
  return (
    <div style={{ position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(6,14,30,0.75)',backdropFilter:'blur(6px)' }} onClick={onClose}>
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
              {QUESTIONS[step].opts.map((opt,i)=>(
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
            <p style={{ fontSize:13,color:'#4A6B8A',fontFamily:"'DM Sans',sans-serif",lineHeight:1.65,marginBottom:24,maxWidth:320,margin:'0 auto 24px' }}>Sign up free to track your real health score with detailed insights.</p>
            <Link href="/?home=1#signup" onClick={onClose} style={{ display:'block',padding:'14px',background:'#1A6BB5',color:'#fff',borderRadius:10,fontFamily:"'Sora',sans-serif",fontSize:14,fontWeight:700,textDecoration:'none',textTransform:'uppercase',letterSpacing:'0.05em' }}>Track My Real Score — Free →</Link>
            <button onClick={()=>{setStep(0);setAnswers([]);setScore(null);}} style={{ marginTop:12,background:'none',border:'none',color:'#94A3B8',fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>Retake quiz</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Avatar({ icon, color }: { icon:string; color:string }) {
  const isEmoji = /\p{Emoji}/u.test(icon);
  return (
    <div style={{ width:36,height:36,borderRadius:'50%',flexShrink:0,background:isEmoji?`${color}22`:`linear-gradient(135deg,${color},${color}99)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:isEmoji?18:12,fontWeight:800,color:isEmoji?color:'#fff',fontFamily:"'Sora',sans-serif" }}>{icon}</div>
  );
}

// Plain text — NO card, NO background, NO border, NO backdrop. Pure text over hero.
function RightPanel({ ri, rightIdx, rightShow }: { ri:typeof CAROUSEL_ITEMS[0]; rightIdx:number; rightShow:boolean }) {
  const isStory = ri.type === 'story';
  return (
    <div className={`hh-rp ${rightShow?'on':'off'}`}>
      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:16 }}>
        <div style={{ width:2,height:18,background:ri.color,borderRadius:2,flexShrink:0 }}/>
        <span style={{ fontSize:11.5,fontWeight:700,color:ri.color,letterSpacing:'0.18em',textTransform:'uppercase',fontFamily:"'DM Sans',sans-serif" }}>
          {isStory ? 'User Story' : ri.label}
        </span>
      </div>
      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:18 }}>
        <Avatar icon={ri.icon} color={ri.color}/>
        <div style={{ fontSize:19.5,fontWeight:800,color:'#fff',fontFamily:"'Sora',sans-serif",lineHeight:1.2,textShadow:'0 1px 8px rgba(6,14,30,0.6)' }}>{ri.name}</div>
      </div>
      {isStory && (ri as any).story && (
        <>
          <p style={{ fontSize:16,lineHeight:1.8,color:'rgba(240,248,255,0.95)',fontFamily:"'DM Sans',sans-serif",fontStyle:'italic',fontWeight:500,margin:'0 0 14px',paddingLeft:12,borderLeft:`2px solid ${ri.color}80`,textShadow:'0 1px 6px rgba(6,14,30,0.5)' }}>
            {(ri as any).story}
          </p>
          <div style={{ display:'flex',gap:2,paddingLeft:12 }}>
            {[1,2,3,4,5].map(n=><span key={n} style={{ color:'#F59E0B',fontSize:13 }}>★</span>)}
          </div>
        </>
      )}
      {!isStory && (ri.bullets?.length ?? 0) > 0 && (
        <div style={{ display:'flex',flexDirection:'column',gap:11 }}>
          {(ri.bullets ?? []).map((b,i)=>(
            <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:10 }}>
              <div style={{ width:5,height:5,borderRadius:'50%',background:ri.color,flexShrink:0,marginTop:6 }}/>
              <span style={{ fontSize:15,lineHeight:1.65,color:'rgba(230,242,255,0.92)',fontFamily:"'DM Sans',sans-serif",fontWeight:500,textShadow:'0 1px 6px rgba(6,14,30,0.45)' }}>{b}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display:'flex',gap:5,marginTop:24,alignItems:'center' }}>
        {CAROUSEL_ITEMS.map((_,i)=>(
          <div key={i} style={{ width:i===rightIdx?18:4,height:3,borderRadius:999,background:i===rightIdx?ri.color:'rgba(255,255,255,0.2)',transition:'all 0.35s' }}/>
        ))}
      </div>
    </div>
  );
}

const INTRO_PHOTO    = '/images/hero-intro.png';
const INTRO_DURATION = 9000;   // intro splash stays 9 seconds
const INTRO_FADE_MS  = 700;

export default function Hero() {
  const [showIntro,   setShowIntro]   = useState(true);
  const [introFading, setIntroFading] = useState(false);
  const [phase,      setPhase]      = useState<'photo'|'rotating'>('photo');
  const [photoShow,  setPhotoShow]  = useState(true);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [carouselShow,setCarouselShow]= useState(false);
  const [mounted,    setMounted]    = useState(false);
  const [showModal,  setShowModal]  = useState(false);
  const [counts,     setCounts]     = useState({ patients:'—', doctors:'—', communities:'—', hospitals:'—' });
  const [sessionToast, setSessionToast] = useState(false);
  const rotRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const introTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const skipIntro = () => {
    setIntroFading(true);
    setTimeout(() => {
      setShowIntro(false);
      setMounted(true);
    }, INTRO_FADE_MS);
  };

  // Check for session=expired param and skip intro for repeat visitors
  useEffect(() => {
    // Session expired toast
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('session') === 'expired') {
        setSessionToast(true);
        // Clean the URL without reload
        const url = new URL(window.location.href);
        url.searchParams.delete('session');
        window.history.replaceState({}, '', url.toString());
        setTimeout(() => setSessionToast(false), 5000);
      }

      // Skip intro for repeat visitors
      if (sessionStorage.getItem('hc_intro_seen')) {
        setShowIntro(false);
        setMounted(true);
      } else {
        sessionStorage.setItem('hc_intro_seen', '1');
      }
    }
  }, []);

  // Single sequential chain:
  // 0s        → intro shows
  // 9s        → intro starts fading
  // 9.7s      → intro fully gone, hero photo appears
  // 9.7+5s    → hero photo fades, carousel starts
  // every 5s  → carousel advances (left + right in sync)
  useEffect(() => {
    const TOTAL_INTRO = INTRO_DURATION + INTRO_FADE_MS; // 9700ms

    // Step 1: start fading intro at 9s
    const t1 = setTimeout(() => setIntroFading(true), INTRO_DURATION);

    // Step 2: unmount intro at 9.7s, hero photo is now visible
    const t2 = setTimeout(() => {
      setShowIntro(false);
      setMounted(true); // trigger hero left-content fade-in at same moment
    }, TOTAL_INTRO);

    // Step 3: after 5s of hero photo, fade it out and start carousel
    const phaseTimer = setTimeout(() => {
      setPhotoShow(false);
      setTimeout(() => {
        setPhase('rotating');
        setCarouselIdx(0); setCarouselShow(true);
        let ci = 0;
        rotRef.current = setInterval(() => {
          setCarouselShow(false);
          setTimeout(() => {
            ci = (ci + 1) % CAROUSEL_ITEMS.length;
            setCarouselIdx(ci);
            setCarouselShow(true);
          }, 400);
        }, 5000); // each slide stays 5s
      }, 500);
    }, TOTAL_INTRO + 5000); // starts 5s after intro fully gone

    // API calls — fire immediately on mount
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

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(phaseTimer);
      if(rotRef.current) clearInterval(rotRef.current);
    };
  }, []);

  const ci = CAROUSEL_ITEMS[carouselIdx];

  return (
    <>
      {showModal && <HealthScoreModal onClose={()=>setShowModal(false)}/>}

      {/* Session expired toast */}
      {sessionToast && (
        <div style={{ position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',zIndex:9999,background:'#1E293B',border:'1px solid rgba(255,255,255,0.12)',borderRadius:10,padding:'12px 20px',display:'flex',alignItems:'center',gap:12,boxShadow:'0 8px 32px rgba(0,0,0,0.35)',whiteSpace:'nowrap' }}>
          <span style={{ fontSize:16 }}>🔒</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,color:'rgba(255,255,255,0.88)' }}>You were signed out due to inactivity.</span>
          <button onClick={()=>setSessionToast(false)} style={{ background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:16,padding:'0 0 0 8px',lineHeight:1 }}>✕</button>
        </div>
      )}

      {/* Health Score button — hidden while intro is showing */}
      <div style={{
        position:'fixed', top:76, right:24, zIndex:1001,
        opacity: showIntro ? 0 : 1,
        pointerEvents: showIntro ? 'none' : 'auto',
        transition:'opacity 0.5s ease',
      }}>
        <button onClick={()=>setShowModal(true)} style={{ display:'flex',alignItems:'center',gap:7,padding:'9px 16px',borderRadius:999,background:'linear-gradient(135deg,#1A6BB5,#2E86D4)',border:'none',color:'#fff',fontFamily:"'Sora',sans-serif",fontSize:12,fontWeight:700,cursor:'pointer',letterSpacing:'0.03em',boxShadow:'0 4px 20px rgba(26,107,181,0.4)',transition:'all 0.2s',whiteSpace:'nowrap' }}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-1px)';(e.currentTarget as HTMLElement).style.boxShadow='0 8px 28px rgba(26,107,181,0.5)';}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='';(e.currentTarget as HTMLElement).style.boxShadow='0 4px 20px rgba(26,107,181,0.4)';}}
        ><span style={{ fontSize:14 }}>✦</span>Check Your Health Score</button>
      </div>

      <div style={{ background:'#fff', padding:'80px 48px 0' }}>
        <section style={{ width:'100%',minHeight:'calc(80vh - 80px)',background:'linear-gradient(135deg,#060E1E 0%,#0A1628 40%,#0D2140 70%,#091830 100%)',position:'relative',overflow:'hidden',borderRadius:'16px' }}>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800;900&family=DM+Sans:wght@400;500;600&display=swap');
            .hh-glow1{position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(26,107,181,0.12) 0%,transparent 65%);top:-80px;left:-80px;pointer-events:none;}
            .hh-glow2{position:absolute;width:380px;height:380px;border-radius:50%;background:radial-gradient(circle,rgba(91,156,246,0.06) 0%,transparent 65%);bottom:-40px;left:30%;pointer-events:none;}
            .hh-fu{opacity:0;transform:translateY(20px);transition:opacity 0.65s ease,transform 0.65s ease;}
            .hh-fu.in{opacity:1;transform:translateY(0);}
            .hh-phrase{transition:opacity 0.35s ease,transform 0.35s ease;display:inline;}
            .hh-phrase.on{opacity:1;transform:translateY(0);}
            .hh-phrase.off{opacity:0;transform:translateY(8px);}

            /* PHOTO: fills entire right half, mask-blends left edge into dark bg */
            .hh-photo-wrap{
              position:absolute;right:0;top:0;bottom:0;width:55%;
              transition:opacity 0.8s ease;
              pointer-events:none;
            }
            .hh-photo-wrap.show{opacity:1;}
            .hh-photo-wrap.hide{opacity:0;}
            .hh-photo-inner{
              position:absolute;inset:0;
              background-size:cover;
              background-position:center top;
              /* CSS mask: left side dissolves into dark background naturally */
              -webkit-mask-image:linear-gradient(to right, transparent 0%, rgba(0,0,0,0.05) 8%, rgba(0,0,0,0.4) 22%, rgba(0,0,0,0.85) 40%, black 60%);
              mask-image:linear-gradient(to right, transparent 0%, rgba(0,0,0,0.05) 8%, rgba(0,0,0,0.4) 22%, rgba(0,0,0,0.85) 40%, black 60%);
            }
            /* Top/bottom edge fade */
            .hh-photo-inner::after{
              content:'';position:absolute;inset:0;
              background:
                linear-gradient(to bottom, rgba(6,14,30,0.3) 0%, transparent 12%, transparent 82%, rgba(6,14,30,0.5) 100%);
            }
            @keyframes photoIn{from{opacity:0;transform:scale(1.04)}to{opacity:1;transform:scale(1)}}
            .hh-photo-enter{animation:photoIn 1.1s ease both;}

            /* CAROUSEL: plain text, anchored to right edge */
            .hh-carousel{
              position:absolute;right:0;top:0;bottom:0;width:48%;
              display:flex;align-items:center;justify-content:flex-end;
              padding:0 56px 0 24px;
              transition:opacity 0.5s ease;
              z-index:3;
            }
            .hh-carousel.visible{opacity:1;}
            .hh-carousel.hidden{opacity:0;pointer-events:none;}

            /* Carousel text transitions */
            .hh-rp{transition:opacity 0.4s ease,transform 0.4s ease;}
            .hh-rp.on{opacity:1;transform:translateY(0);}
            .hh-rp.off{opacity:0;transform:translateY(12px);}

            .hh-btn-s{display:inline-flex;align-items:center;gap:8px;padding:12px 28px;border:none;background:#1A6BB5;color:#fff;font-family:'Sora',sans-serif;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none;letter-spacing:0.05em;text-transform:uppercase;transition:all 0.2s;border-radius:3px;}
            .hh-btn-s:hover{background:#2E86D4;transform:translateY(-1px);}
            .hh-btn-o{display:inline-flex;align-items:center;gap:8px;padding:11px 26px;border:1px solid rgba(255,255,255,0.22);background:transparent;color:rgba(255,255,255,0.78);font-family:'Sora',sans-serif;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none;letter-spacing:0.05em;text-transform:uppercase;transition:all 0.2s;border-radius:3px;}
            .hh-btn-o:hover{border-color:#5B9CF6;color:#fff;}
            @keyframes scrollB{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}
            .hh-scroll{animation:scrollB 2s ease infinite;}
            @media(max-width:1024px){.hh-photo-wrap{display:none!important;}.hh-carousel{display:none!important;}}
            @media(max-width:768px){.hh-inner{padding:32px 24px!important;}.hh-h1{font-size:2rem!important;}}

            /* ── INTRO SPLASH ───────────────────────────────────────── */
            @keyframes hhiFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
            @keyframes hhiBarGrow{from{width:0%}to{width:100%}}
            @keyframes hhiDotPulse{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.45)}}
            .hhi-block{animation:hhiFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both}
            .hhi-d1{animation-delay:0.1s}.hhi-d2{animation-delay:0.27s}
            .hhi-d3{animation-delay:0.45s}.hhi-d4{animation-delay:0.62s}
            .hhi-bar{animation:hhiBarGrow ${INTRO_DURATION}ms linear 0.15s both}
            .hhi-dot{display:inline-block;animation:hhiDotPulse 2s ease infinite;margin:0 9px;color:#1a3a5c;line-height:1}
            /* ─────────────────────────────────────────────────────────── */
          `}</style>

          <div className="hh-glow1"/><div className="hh-glow2"/>

          {/* ── INTRO SPLASH (9s) ─────────────────────────────────────
               position:absolute = inside hero box only.
               Navbar + sections below remain fully visible & scrollable.
          ──────────────────────────────────────────────────────────── */}
          {showIntro && (
            <div style={{
              position:'absolute', inset:0, zIndex:20,
              borderRadius:16, overflow:'hidden',
              opacity: introFading ? 0 : 1,
              transition:`opacity ${INTRO_FADE_MS}ms ease`,
              pointerEvents: introFading ? 'none' : 'auto',
            }}>
              <div style={{ position:'absolute',inset:0,backgroundImage:`url(${INTRO_PHOTO})`,backgroundSize:'cover',backgroundPosition:'center center' }}/>

              {/* Text — centred in clear upper zone, no card/bg */}
              <div style={{ position:'absolute',top:'42%',left:'50%',transform:'translate(-50%,-50%)',width:'min(700px,88%)',textAlign:'center' }}>

                {/* "HealthConnect" — no colon, dark navy */}
                <div className="hhi-block hhi-d1" style={{ fontFamily:"'Sora',sans-serif",fontSize:'clamp(1.7rem,3.2vw,2.8rem)',fontWeight:900,color:'#071428',lineHeight:1.08,letterSpacing:'-0.025em',marginBottom:6,textShadow:'0 1px 12px rgba(255,255,255,0.55)' }}>
                  HealthConnect
                </div>

                {/* "India's Unified Healthcare Platform" — distinct blue, one line */}
                <div className="hhi-block hhi-d2" style={{ fontFamily:"'Sora',sans-serif",fontSize:'clamp(1.35rem,2.5vw,2.2rem)',fontWeight:800,color:'#1A4A8A',lineHeight:1.1,letterSpacing:'-0.015em',whiteSpace:'nowrap',marginBottom:18,textShadow:'0 1px 10px rgba(255,255,255,0.5)' }}>
                  India's Unified Healthcare Platform
                </div>

                {/* Sub-items — near-black */}
                <div className="hhi-block hhi-d3" style={{ fontFamily:"'DM Sans',sans-serif",fontSize:'clamp(0.9rem,1.45vw,1.15rem)',fontWeight:700,color:'#0A0F1A',display:'flex',alignItems:'center',justifyContent:'center',flexWrap:'nowrap',gap:0,marginBottom:16,textShadow:'0 1px 8px rgba(255,255,255,0.6)' }}>
                  {['Patients Health','Communities','Find A Doctor','Find A Hospital'].map((item,i,arr)=>(
                    <span key={i} style={{ display:'flex',alignItems:'center',whiteSpace:'nowrap' }}>
                      <span>{item}</span>
                      {i<arr.length-1 && <span className="hhi-dot">•</span>}
                    </span>
                  ))}
                </div>

                {/* CTA — semi-dark green, bolder */}
                <div className="hhi-block hhi-d4" style={{ fontFamily:"'Sora',sans-serif",fontSize:'clamp(0.78rem,1.15vw,0.95rem)',fontWeight:800,color:'#0D6B4A',letterSpacing:'0.11em',textTransform:'uppercase',textShadow:'0 1px 8px rgba(255,255,255,0.55)' }}>
                  — Let's start your Health Journey —
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ position:'absolute',bottom:0,left:0,right:0,height:3,background:'rgba(13,107,74,0.15)' }}>
                <div className="hhi-bar" style={{ height:'100%',background:'linear-gradient(to right,#0D9488,#0D6B4A,#14B8A6)',borderRadius:'0 0 0 16px' }}/>
              </div>

              {/* Skip button */}
              <button
                onClick={skipIntro}
                style={{ position:'absolute',bottom:18,right:20,background:'rgba(0,0,0,0.28)',border:'1px solid rgba(255,255,255,0.25)',borderRadius:999,padding:'6px 16px',color:'rgba(255,255,255,0.8)',fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,cursor:'pointer',letterSpacing:'0.06em',textTransform:'uppercase',transition:'all 0.2s',zIndex:10 }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(0,0,0,0.5)';(e.currentTarget as HTMLElement).style.color='#fff';}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(0,0,0,0.28)';(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.8)';}}
              >Skip →</button>
            </div>
          )}
          {/* ── END INTRO SPLASH ──────────────────────────────────────── */}

          {/* Subtle lines left side only */}
          <div style={{ position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden',borderRadius:16,zIndex:1 }}>
            <svg viewBox="0 0 500 900" style={{ position:'absolute',left:0,top:0,width:'45%',height:'100%',opacity:0.07 }} preserveAspectRatio="none">
              <line x1="500" y1="0" x2="100" y2="900" stroke="#5B9CF6" strokeWidth="1"/>
              <line x1="450" y1="0" x2="50"  y2="900" stroke="#5B9CF6" strokeWidth="0.6"/>
              <line x1="400" y1="0" x2="0"   y2="900" stroke="#5B9CF6" strokeWidth="0.4"/>
            </svg>
          </div>

          {/* PHOTO — full bleed, mask-blended, no border radius card look */}
          <div className={`hh-photo-wrap ${photoShow?'show':'hide'}`}>
            <div className="hh-photo-inner hh-photo-enter" style={{ backgroundImage:`url(${HERO_PHOTO})` }}/>
          </div>

          {/* CAROUSEL — plain text overlay, anchored right */}
          <div className={`hh-carousel ${phase==='rotating'?'visible':'hidden'}`}>
            <div style={{ maxWidth:340, width:'100%' }}>
              <RightPanel ri={ci} rightIdx={carouselIdx} rightShow={carouselShow}/>
            </div>
          </div>

          {/* LEFT TEXT CONTENT */}
          <div className="hh-inner" style={{ position:'relative',zIndex:2,maxWidth:1280,margin:'0 auto',padding:'44px 56px',minHeight:'calc(80vh - 80px)',display:'flex',alignItems:'center' }}>
            <div style={{ maxWidth:'46%' }}>
              <div className={`hh-fu ${mounted?'in':''}`} style={{ transitionDelay:'0ms',display:'flex',alignItems:'center',gap:10,marginBottom:18 }}>
                <div style={{ width:28,height:1,background:'#5B9CF6' }}/>
                <span style={{ fontSize:12,fontWeight:700,color:'#5B9CF6',letterSpacing:'0.18em',textTransform:'uppercase',fontFamily:"'DM Sans',sans-serif" }}>India's Unified Healthcare Platform</span>
              </div>

              <h1 className={`hh-fu hh-h1 ${mounted?'in':''}`} style={{ transitionDelay:'80ms',fontFamily:"'Sora',sans-serif",fontSize:'clamp(2.1rem,3.4vw,3.8rem)',fontWeight:900,color:'#EEF4FF',lineHeight:1.08,letterSpacing:'-0.03em',margin:'0 0 4px' }}>
                Your health,<br/>finally —
              </h1>

              <h1 style={{ fontFamily:"'Sora',sans-serif",fontSize:'clamp(2.1rem,3.4vw,3.8rem)',fontWeight:900,lineHeight:1.08,letterSpacing:'-0.03em',margin:'0 0 20px',color:'#5B9CF6',minHeight:'1.1em' }}>
                {phase==='photo'
                  ? <span style={{ opacity:0 }}>organised &amp; private.</span>
                  : <span className={`hh-phrase ${carouselShow?'on':'off'}`}>{ci.phrase}</span>
                }
              </h1>

              <p className={`hh-fu ${mounted?'in':''}`} style={{ transitionDelay:'160ms',fontFamily:"'DM Sans',sans-serif",fontSize:15,lineHeight:1.72,color:'rgba(210,228,255,0.68)',maxWidth:440,margin:'0 0 26px' }}>
                Book NMC-verified doctors, manage your health records, and connect with anonymous health communities — free to explore, proudly built for India.
              </p>

              <div className={`hh-fu ${mounted?'in':''}`} style={{ transitionDelay:'230ms',display:'flex',gap:12,flexWrap:'wrap',marginBottom:30 }}>
                <Link href="/?home=1#signup" className="hh-btn-s">Get Started Free →</Link>
                <Link href="/doctors" className="hh-btn-o">Find a Doctor</Link>
              </div>

              <div className={`hh-fu ${mounted?'in':''}`} style={{ transitionDelay:'300ms',display:'flex',gap:28,flexWrap:'wrap' }}>
                {[
                  { v:counts.patients,    l:'Patients'         },
                  { v:counts.doctors,     l:'Verified Doctors' },
                  { v:counts.communities, l:'Communities'      },
                  { v:counts.hospitals,   l:'Hospitals'        },
                ].map((s,i)=>(
                  <div key={i} style={{ fontFamily:"'Sora',sans-serif" }}>
                    <div style={{ fontSize:24,fontWeight:900,color:'#fff',letterSpacing:'-0.02em',lineHeight:1 }}>{s.v}</div>
                    <div style={{ fontSize:10,color:'rgba(170,195,240,0.5)',marginTop:3,fontFamily:"'DM Sans',sans-serif",fontWeight:500 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="hh-scroll" style={{ position:'absolute',bottom:16,left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:4,zIndex:4 }}>
            <div style={{ width:1,height:24,background:'linear-gradient(to bottom,transparent,rgba(91,156,246,0.35))' }}/>
            <div style={{ width:4,height:4,borderRadius:'50%',background:'rgba(91,156,246,0.4)' }}/>
          </div>
        </section>
      </div>
    </>
  );
}
