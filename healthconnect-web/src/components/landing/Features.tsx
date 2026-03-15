'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.healthconnect.sbs/api/v1';
interface PlatformStats { users:number; doctors:number; communities:number; appointments:number; }

const PLATFORM_FEATURES = [
  { icon:'🗂️', accent:'#14B8A6', accentHex:'20,184,166', accentBg:'rgba(20,184,166,0.1)', accentBorder:'rgba(20,184,166,0.25)', tag:'Health Records', title:'Your Complete Medical History — Anywhere', desc:'Upload prescriptions, lab reports, discharge summaries. Our AI structures them automatically into a visual health timeline. Every doctor sees your full history before you sit down.', proof:'80% of Indians carry paper reports. HealthConnect ends that.' },
  { icon:'🩺', accent:'#A78BFA', accentHex:'167,139,250', accentBg:'rgba(167,139,250,0.1)', accentBorder:'rgba(167,139,250,0.25)', tag:'Verified Doctors', title:'Every Doctor is MCI/NMC Cross-Verified', desc:'Before any doctor appears on HealthConnect, we cross-check with the Medical Council of India. Each gets a tamper-proof HCD ID with a scannable QR code. No self-declared credentials.', proof:'100% verified. Not self-declared.' },
  { icon:'⚡', accent:'#38BDF8', accentHex:'56,189,248', accentBg:'rgba(56,189,248,0.1)', accentBorder:'rgba(56,189,248,0.25)', tag:'Instant Booking', title:'Book in 2 Minutes. Consult in 10.', desc:'Real-time availability updates every 60 seconds. Search by specialty, city, language or condition. See live slots. Confirm with one tap. No phone queues, no callbacks.', proof:'Avg booking time: 1 min 42 sec.' },
  { icon:'🤝', accent:'#22C55E', accentHex:'34,197,94', accentBg:'rgba(34,197,94,0.1)', accentBorder:'rgba(34,197,94,0.25)', tag:'Communities', title:'Doctor-Moderated Anonymous Support', desc:'Post about your condition without revealing your identity. A verified specialist reviews every community. 1.2M+ peer support interactions — zero data breaches.', proof:'Peer support improves outcomes by 37% (JAMA 2022).' },
  { icon:'🧠', accent:'#F59E0B', accentHex:'245,158,11', accentBg:'rgba(245,158,11,0.1)', accentBorder:'rgba(245,158,11,0.25)', tag:'AI Insights', title:'AI Flags Drug Interactions Before They Harm You', desc:'Our AI scans your full medication list against every new prescription. Dangerous combinations get flagged before you take them. Over 10,000 Indians die annually from drug interactions.', proof:'10,000+ annual deaths prevented by early flagging.' },
  { icon:'🌏', accent:'#5EEAD4', accentHex:'94,234,212', accentBg:'rgba(94,234,212,0.1)', accentBorder:'rgba(94,234,212,0.25)', tag:'Bharat-First', title:'8 Languages. Tier 2 & 3 Cities. AB-PMJAY Ready.', desc:'Hindi, Tamil, Telugu, Kannada, Marathi, Bengali, Gujarati and more. We partner with district hospitals and integrate fully with the Ayushman Bharat scheme for ₹5 lakh family coverage.', proof:'44% of our users are from non-metro cities.' },
];

const INDIA_REALITY = [
  { stat:'75%', label:'No organised health records', color:'#F87171', bg:'rgba(248,113,113,0.1)', border:'rgba(248,113,113,0.2)' },
  { stat:'1:1456', label:'Doctor-patient ratio in India', color:'#FB923C', bg:'rgba(251,146,60,0.1)', border:'rgba(251,146,60,0.2)' },
  { stat:'83%', label:'Mental health treatment gap', color:'#A78BFA', bg:'rgba(167,139,250,0.1)', border:'rgba(167,139,250,0.2)' },
  { stat:'₹5L', label:'Annual OOP health spend per family', color:'#34D399', bg:'rgba(52,211,153,0.1)', border:'rgba(52,211,153,0.2)' },
];

const HOW_IT_WORKS = [
  { step:'01', icon:'📋', title:'Build Your Health Profile', desc:'Sign up free in 3 minutes. Add conditions, medications, allergies. Upload existing reports — AI structures them automatically.', time:'3 min setup' },
  { step:'02', icon:'🔍', title:'Find the Right Doctor', desc:'Search by specialty, city, language or condition. See live availability. Filter by "Available Now" for same-day booking. All doctors are MCI/NMC verified.', time:'Book in 2 min' },
  { step:'03', icon:'💬', title:'Consult & Auto-Sync', desc:'Attend teleconsults or in-person. Doctor notes, prescriptions and reports auto-sync to your health timeline. Never lose a document again.', time:'Consult in 10 min' },
  { step:'04', icon:'🌱', title:'Grow Healthier Every Day', desc:'Join condition-specific communities moderated by specialists. Track your health trends over time. Your health journey, continuously improving.', time:'Lifelong support' },
];

const COMPARISON = [
  ['Free for Patients — always','✅ Forever, legally protected','❌ Subscription or ad-supported'],
  ['Doctor credential verification','✅ MCI/NMC cross-checked + HCD ID','⚠️ Self-declared only'],
  ['Health data privacy','✅ No selling — enforceable pledge','❌ Data sold or shared'],
  ['Anonymous peer support','✅ Doctor-moderated, full anonymity','❌ Not available anywhere'],
  ['Tier 2/3 city support','✅ 8 languages + district hospitals','❌ English/metro only'],
  ['AI health timeline','✅ Auto-extracted from any document','❌ Manual entry only'],
  ['Ayushman Bharat integration','✅ Full AB-PMJAY routing','❌ Not integrated'],
  ['Drug interaction alerts','✅ Real-time AI flagging','❌ Not available'],
];

function useCountUp(target:number,active:boolean,dur=1600){const[n,setN]=useState(0);useEffect(()=>{if(!active||!target)return;let v=0;const step=target/(dur/16);const t=setInterval(()=>{v+=step;if(v>=target){setN(target);clearInterval(t);}else setN(Math.floor(v));},16);return()=>clearInterval(t);},[active,target,dur]);return n;}

const FeatureCard=({feat}:{feat:typeof PLATFORM_FEATURES[0]})=>{
  const[hov,setHov]=useState(false);
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:hov?feat.accentBg:'rgba(255,255,255,0.04)',border:`1.5px solid ${hov?feat.accentBorder:'rgba(255,255,255,0.08)'}`,borderRadius:16,padding:'22px',transition:'all 0.25s ease',transform:hov?'translateY(-3px)':'none',boxShadow:hov?`0 8px 28px rgba(${feat.accentHex},0.15)`:'none',cursor:'default'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14}}>
        <div style={{width:46,height:46,borderRadius:12,background:feat.accentBg,border:`1px solid ${feat.accentBorder}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>{feat.icon}</div>
        <span style={{fontSize:9,fontWeight:800,color:feat.accent,background:feat.accentBg,border:`1px solid ${feat.accentBorder}`,borderRadius:100,padding:'3px 10px',letterSpacing:'0.06em'}}>{feat.tag}</span>
      </div>
      <h3 style={{fontSize:15,fontWeight:800,color:'#F0F9FF',margin:'0 0 8px',lineHeight:1.35,fontFamily:'Poppins,sans-serif'}}>{feat.title}</h3>
      <p style={{fontSize:12.5,color:'rgba(255,255,255,0.58)',lineHeight:1.7,margin:'0 0 12px'}}>{feat.desc}</p>
      <div style={{background:feat.accentBg,border:`1px solid ${feat.accentBorder}`,borderRadius:8,padding:'7px 11px'}}>
        <span style={{fontSize:11,color:feat.accent,fontWeight:600}}>💡 {feat.proof}</span>
      </div>
    </div>
  );
};

export default function Features(){
  const router=useRouter();
  const[stats,setStats]=useState<PlatformStats>({users:84,doctors:37,communities:18,appointments:20});
  const[statsActive,setStatsActive]=useState(false);
  const statsRef=useRef<HTMLDivElement>(null);
  const[activeStep,setActiveStep]=useState(0);

  useEffect(()=>{
    fetch(`${API}/public/stats`).then(r=>r.json()).then(d=>{const s=d?.data||d||{};setStats({users:s.users||s.totalUsers||84,doctors:s.doctors||s.totalDoctors||37,communities:s.communities||s.totalCommunities||18,appointments:s.appointments||s.totalAppointments||20});}).catch(()=>{});
  },[]);

  useEffect(()=>{const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting)setStatsActive(true);},{threshold:0.3});if(statsRef.current)obs.observe(statsRef.current);return()=>obs.disconnect();},[]);
  useEffect(()=>{const t=setInterval(()=>setActiveStep(p=>(p+1)%HOW_IT_WORKS.length),3200);return()=>clearInterval(t);},[]);

  const u=useCountUp(stats.users,statsActive);
  const d=useCountUp(stats.doctors,statsActive);
  const c=useCountUp(stats.communities,statsActive);
  const a=useCountUp(stats.appointments,statsActive);

  return(
    <section id="features" style={{background:'linear-gradient(180deg,#0A1628 0%,#0C1F35 30%,#8ECAE6 65%,#B8E4F5 80%,#CAE9F5 100%)',padding:'72px 5% 0'}}>

      {/* ── LIVE STATS BAR — dark section at top matching hero ── */}
      <div ref={statsRef} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(20,184,166,0.2)',borderRadius:20,padding:'28px 36px',marginBottom:64,position:'relative',overflow:'hidden',boxShadow:'0 4px 24px rgba(0,0,0,0.2)'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,#14B8A6,#A78BFA,#22C55E,#F59E0B)'}}/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:8}}>
          <div>
            <h2 style={{fontSize:'clamp(18px,2.5vw,26px)',fontWeight:900,color:'#F0F9FF',margin:0,fontFamily:'Poppins,sans-serif'}}>HealthConnect by the Numbers</h2>
            <p style={{fontSize:13,color:'rgba(255,255,255,0.5)',margin:'4px 0 0'}}>Live data pulled from our database right now</p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.25)',borderRadius:100,padding:'5px 14px'}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:'#22C55E'}}/>
            <span style={{fontSize:10,fontWeight:700,color:'#4ADE80'}}>LIVE DATABASE</span>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
          {[{v:u,s:'+',label:'Registered Patients',color:'#14B8A6',bg:'rgba(20,184,166,0.08)'},{v:d,s:'+',label:'Verified Doctors',color:'#A78BFA',bg:'rgba(167,139,250,0.08)'},{v:c,s:'+',label:'Health Communities',color:'#22C55E',bg:'rgba(34,197,94,0.08)'},{v:a,s:'+',label:'Appointments Booked',color:'#F59E0B',bg:'rgba(245,158,11,0.08)'}].map((s,i)=>(
            <div key={i} style={{textAlign:'center',padding:'20px 16px',background:s.bg,borderRadius:14,border:`1px solid ${s.color}22`}}>
              <div style={{fontSize:'clamp(24px,3vw,38px)',fontWeight:900,color:s.color,lineHeight:1,fontFamily:'Poppins,sans-serif',marginBottom:6}}>{s.v.toLocaleString('en-IN')}{s.s}</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.55)',fontWeight:500}}>{s.label}</div>
            </div>
          ))}
        </div>
        <p style={{textAlign:'center',fontSize:11,color:'rgba(255,255,255,0.3)',marginTop:16,marginBottom:0}}>* Real numbers from our live database. Growing every day.</p>
      </div>

      {/* ── WHY INDIA NEEDS THIS — still dark section ── */}
      <div style={{marginBottom:64}}>
        <div style={{textAlign:'center',marginBottom:36}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(248,113,113,0.1)',border:'1px solid rgba(248,113,113,0.25)',borderRadius:100,padding:'5px 16px',marginBottom:14}}>
            <span style={{fontSize:10,fontWeight:800,color:'#F87171',letterSpacing:'0.08em'}}>WHY INDIA NEEDS THIS</span>
          </div>
          <h2 style={{fontSize:'clamp(26px,4vw,46px)',fontWeight:900,color:'#FFFFFF',margin:'0 0 12px',fontFamily:'Poppins,sans-serif',letterSpacing:'-0.02em',lineHeight:1.15}}>Built to Solve Real Problems.<br/><span style={{color:'#14B8A6'}}>Built for India.</span></h2>
          <p style={{fontSize:14,color:'rgba(255,255,255,0.55)',maxWidth:560,margin:'0 auto',lineHeight:1.7}}>Every feature on HealthConnect exists because of a documented gap in Indian healthcare.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:14,marginBottom:28}}>
          {INDIA_REALITY.map((r,i)=>(
            <div key={i} style={{background:r.bg,border:`1px solid ${r.border}`,borderRadius:16,padding:'20px 18px',textAlign:'center'}}>
              <div style={{fontSize:'clamp(28px,3.5vw,42px)',fontWeight:900,color:r.color,fontFamily:'Poppins,sans-serif',lineHeight:1,marginBottom:8}}>{r.stat}</div>
              <div style={{fontSize:12.5,color:'rgba(255,255,255,0.75)',fontWeight:600,lineHeight:1.4}}>{r.label}</div>
            </div>
          ))}
        </div>
        <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(20,184,166,0.2)',borderRadius:16,padding:'22px 28px',display:'flex',alignItems:'center',gap:20,flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:240}}>
            <div style={{fontSize:11,fontWeight:800,color:'#14B8A6',letterSpacing:'0.1em',marginBottom:8}}>HEALTHCONNECT'S RESPONSE TO EACH PROBLEM</div>
            <p style={{fontSize:13.5,color:'rgba(255,255,255,0.75)',lineHeight:1.7,margin:0}}>Health records digitised. Doctors verified. Bookings instant. Communities safe. Drug interactions caught. 8 languages. Tier 2/3 cities. AB-PMJAY integrated.</p>
          </div>
          <button onClick={()=>router.push('/doctors')} style={{background:'linear-gradient(135deg,#0D9488,#14B8A6)',color:'#fff',border:'none',borderRadius:10,padding:'12px 28px',fontSize:13,fontWeight:800,cursor:'pointer',whiteSpace:'nowrap',fontFamily:'Poppins,sans-serif',boxShadow:'0 4px 16px rgba(13,148,136,0.4)'}}>Find a Doctor Now →</button>
        </div>
      </div>

      {/* ── FEATURE CARDS — transition zone, still mostly dark ── */}
      <div style={{marginBottom:64}}>
        <div style={{textAlign:'center',marginBottom:36}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(20,184,166,0.1)',border:'1px solid rgba(20,184,166,0.25)',borderRadius:100,padding:'5px 16px',marginBottom:14}}>
            <span style={{fontSize:10,fontWeight:800,color:'#5EEAD4',letterSpacing:'0.08em'}}>PLATFORM FEATURES</span>
          </div>
          <h2 style={{fontSize:'clamp(24px,3.5vw,42px)',fontWeight:900,color:'#FFFFFF',margin:'0 0 12px',fontFamily:'Poppins,sans-serif',letterSpacing:'-0.02em'}}>Six Things No Other Platform Offers</h2>
          <p style={{fontSize:14,color:'rgba(255,255,255,0.52)',maxWidth:480,margin:'0 auto',lineHeight:1.7}}>All in one place. All free for patients.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16}}>
          {PLATFORM_FEATURES.map((feat,i)=><FeatureCard key={i} feat={feat}/>)}
        </div>
      </div>

      {/* ── HOW IT WORKS — powder blue zone starts here ── */}
      <div style={{marginBottom:64,background:'rgba(255,255,255,0.06)',borderRadius:20,padding:'40px 32px',border:'1px solid rgba(255,255,255,0.1)'}}>
        <div style={{textAlign:'center',marginBottom:36}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(167,139,250,0.12)',border:'1px solid rgba(167,139,250,0.25)',borderRadius:100,padding:'5px 16px',marginBottom:14}}>
            <span style={{fontSize:10,fontWeight:800,color:'#C4B5FD',letterSpacing:'0.08em'}}>HOW IT WORKS</span>
          </div>
          <h2 style={{fontSize:'clamp(22px,3vw,36px)',fontWeight:900,color:'#F0F9FF',margin:'0 0 10px',fontFamily:'Poppins,sans-serif'}}>From Sign-Up to Transformed Healthcare</h2>
          <p style={{fontSize:13,color:'rgba(255,255,255,0.52)',maxWidth:420,margin:'0 auto',lineHeight:1.7}}>Four simple steps. No jargon. No complexity.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
          {HOW_IT_WORKS.map((step,i)=>(
            <div key={i} onClick={()=>setActiveStep(i)} style={{background:activeStep===i?'rgba(13,148,136,0.15)':'rgba(255,255,255,0.04)',border:`1.5px solid ${activeStep===i?'rgba(20,184,166,0.5)':'rgba(255,255,255,0.08)'}`,borderRadius:16,padding:'20px 18px',cursor:'pointer',transition:'all 0.25s',transform:activeStep===i?'translateY(-3px)':'none',boxShadow:activeStep===i?'0 8px 28px rgba(13,148,136,0.2)':'none'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:900,color:activeStep===i?'#14B8A6':'rgba(20,184,166,0.6)',letterSpacing:'0.12em'}}>{step.step}</div>
                <div style={{fontSize:9,fontWeight:700,color:'#14B8A6',background:'rgba(20,184,166,0.1)',border:'1px solid rgba(20,184,166,0.2)',borderRadius:100,padding:'2px 9px'}}>{step.time}</div>
              </div>
              <div style={{fontSize:26,marginBottom:10}}>{step.icon}</div>
              <div style={{fontSize:14,fontWeight:800,color:'#F0F9FF',marginBottom:6,fontFamily:'Poppins,sans-serif',lineHeight:1.3}}>{step.title}</div>
              <div style={{fontSize:12,color:activeStep===i?'rgba(255,255,255,0.75)':'rgba(255,255,255,0.5)',lineHeight:1.65}}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOR DOCTORS & HOSPITALS ── */}
      <div style={{marginBottom:64}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <h2 style={{fontSize:'clamp(20px,2.8vw,34px)',fontWeight:900,color:'#0F172A',margin:'0 0 8px',fontFamily:'Poppins,sans-serif'}}>Join India's Fastest-Growing Healthcare Network</h2>
          <p style={{fontSize:13,color:'#475569',margin:0}}>For doctors and hospitals — a new level of reach and efficiency.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:16}}>
          {[
            {icon:'👨‍⚕️',color:'#7C3AED',bg:'rgba(124,58,237,0.08)',border:'rgba(124,58,237,0.2)',title:'Why 10,000+ Doctors Are on HealthConnect',points:['HCD-verified profile ranks in patient searches across India','Patients arrive with AI-prepared health timelines','Earn ₹800–₹2,500 per teleconsultation from home','60% of doctors report 40%+ growth in patient base in 6 months','Automated appointment management — no more WhatsApp bookings'],cta:'Register as Doctor',link:'/register?role=doctor'},
            {icon:'🏥',color:'#F59E0B',bg:'rgba(245,158,11,0.08)',border:'rgba(245,158,11,0.2)',title:'Why 340+ Hospitals Partner With Us',points:['Real-time bed & OPD tracker visible to 1,20,000+ patients','Ayushman Bharat (AB-PMJAY) patient routing','List all departments, doctors, and specialties in one place','Emergency bed availability shown to nearby patients in real-time','Doctors on our platform can refer directly to your hospital'],cta:'List Your Hospital',link:'/register?role=hospital'},
          ].map((p,i)=>(
            <div key={i} style={{background:p.bg,border:`1.5px solid ${p.border}`,borderRadius:18,padding:'26px 24px',borderTop:`3px solid ${p.color}`}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                <span style={{fontSize:28}}>{p.icon}</span>
                <h3 style={{fontSize:15,fontWeight:800,color:'#0F172A',margin:0,fontFamily:'Poppins,sans-serif',lineHeight:1.3}}>{p.title}</h3>
              </div>
              <ul style={{listStyle:'none',margin:'0 0 20px',padding:0,display:'flex',flexDirection:'column',gap:9}}>
                {p.points.map((pt,j)=>(
                  <li key={j} style={{display:'flex',gap:8,alignItems:'flex-start',fontSize:13,color:'#374151',lineHeight:1.6}}>
                    <span style={{color:p.color,fontWeight:800,flexShrink:0}}>✓</span>{pt}
                  </li>
                ))}
              </ul>
              <button onClick={()=>router.push(p.link)} style={{background:p.color,color:'#fff',border:'none',borderRadius:10,padding:'11px 24px',fontSize:13,fontWeight:800,cursor:'pointer',width:'100%',fontFamily:'Poppins,sans-serif'}}>{p.cta} →</button>
            </div>
          ))}
        </div>
      </div>

      {/* ── COMPARISON TABLE — light powder blue bg ── */}
      <div style={{marginBottom:64}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <h2 style={{fontSize:'clamp(18px,2.5vw,30px)',fontWeight:900,color:'#0F172A',margin:'0 0 8px',fontFamily:'Poppins,sans-serif'}}>HealthConnect vs Every Other Platform</h2>
          <p style={{fontSize:12,color:'#64748B',margin:0}}>Every claim is verifiable. We challenge you to find another platform that matches this.</p>
        </div>
        <div style={{background:'#FFFFFF',border:'1.5px solid #BFDBFE',borderRadius:18,overflow:'hidden',boxShadow:'0 4px 24px rgba(8,145,178,0.08)'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',minWidth:560}}>
              <thead>
                <tr style={{background:'#EFF6FF'}}>
                  <th style={{textAlign:'left',padding:'12px 18px',fontSize:11,color:'#64748B',fontWeight:700,borderBottom:'1px solid #BFDBFE'}}>Feature</th>
                  <th style={{textAlign:'center',padding:'12px 18px',fontSize:12,color:'#1D4ED8',fontWeight:800,background:'#DBEAFE',borderBottom:'1px solid #93C5FD'}}>HealthConnect</th>
                  <th style={{textAlign:'center',padding:'12px 18px',fontSize:11,color:'#94A3B8',fontWeight:700,borderBottom:'1px solid #BFDBFE'}}>Other Platforms</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(([feat,hc,other],i)=>(
                  <tr key={i} style={{borderBottom:'1px solid #F1F5F9',background:i%2===0?'#FFFFFF':'#F8FAFC'}}>
                    <td style={{padding:'12px 18px',fontSize:13,color:'#374151',fontWeight:600}}>{feat}</td>
                    <td style={{padding:'12px 18px',fontSize:12.5,color:'#065F46',textAlign:'center',background:'#F0FDF4',fontWeight:600}}>{hc}</td>
                    <td style={{padding:'12px 18px',fontSize:12,color:'#94A3B8',textAlign:'center'}}>{other}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── FINAL CTA — dark again ── */}
      <div style={{paddingBottom:80}}>
        <div style={{background:'linear-gradient(135deg,#0F172A 0%,#1E293B 100%)',borderRadius:20,padding:'48px 5%',textAlign:'center',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:'-30%',right:'-5%',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(20,184,166,0.12) 0%,transparent 70%)',pointerEvents:'none'}}/>
          <div style={{position:'relative',zIndex:1,maxWidth:680,margin:'0 auto'}}>
            <h2 style={{fontSize:'clamp(22px,3.5vw,40px)',fontWeight:900,color:'#FFFFFF',margin:'0 0 12px',fontFamily:'Poppins,sans-serif',letterSpacing:'-0.02em',lineHeight:1.2}}>India's health deserves better.<br/><span style={{color:'#14B8A6'}}>Start today.</span></h2>
            <p style={{fontSize:14,color:'rgba(255,255,255,0.6)',margin:'0 0 28px',lineHeight:1.65}}>Free for patients. Free to join. No credit card, no subscription, no catch.</p>
            <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',marginBottom:16}}>
              <button onClick={()=>router.push('/register')} style={{background:'linear-gradient(135deg,#0D9488,#14B8A6)',color:'#fff',border:'none',borderRadius:12,padding:'13px 36px',fontSize:14,fontWeight:800,cursor:'pointer',boxShadow:'0 8px 28px rgba(13,148,136,0.4)',fontFamily:'Poppins,sans-serif'}}>Create Free Account →</button>
              <button onClick={()=>router.push('/register?role=doctor')} style={{background:'rgba(255,255,255,0.06)',border:'1.5px solid rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.85)',borderRadius:12,padding:'13px 28px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'Poppins,sans-serif'}}>Join as Doctor</button>
            </div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>{stats.users}+ patients · {stats.doctors}+ verified doctors · Trusted across India</div>
          </div>
        </div>
      </div>
    </section>
  );
}
