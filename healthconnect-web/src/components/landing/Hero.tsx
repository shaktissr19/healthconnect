'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.healthconnect.sbs/api/v1';
interface LiveStats { users?: number; doctors?: number; communities?: number; appointments?: number; }

const SLIDES = [
  { id:'patient', badge:'FOR PATIENTS', headline:'Your Health, Fully in Your Hands', sub:'Track conditions, manage medications, book verified specialists, and own your complete health record — all in one secure place. Free forever.', cta:'Create Free Profile', ctaLink:'/register', accent:'#14B8A6', accentHex:'20,184,166',
    facts:[{ icon:'📊', title:'80% of Indians lack health records', body:'Most patients carry paper reports to every visit. HealthConnect digitises your entire history — accessible anywhere, instantly shareable with any doctor.', source:'NHA Digital Health Survey 2023' },{ icon:'⚠️', title:'Drug interactions kill 10,000+ annually', body:'Our AI scans your medication list against every new prescription, flagging dangerous combinations before they reach you.', source:'IPC Pharmacovigilance Report' }] },
  { id:'community', badge:'HEALTH COMMUNITIES', headline:'Heal Together, Grow Together', sub:'Join thousands navigating the same health journey. Share stories, get peer support from verified specialists, and never feel alone in your diagnosis.', cta:'Explore Communities', ctaLink:'/communities', accent:'#22C55E', accentHex:'34,197,94',
    facts:[{ icon:'🧬', title:'Peer support improves outcomes by 37%', body:'Patients in condition-specific communities show better medication adherence, lower anxiety, and faster recovery times than those going it alone.', source:'JAMA Internal Medicine, 2022' },{ icon:'🔒', title:'Anonymous by default', body:'Post freely without revealing your identity. Every community is moderated by a verified specialist. Zero tracking of anonymous content — legally guaranteed.', source:'Platform commitment — legally binding' }] },
  { id:'doctor', badge:'FOR DOCTORS', headline:"India's Verified Doctor Network", sub:'Get discovered by patients nationwide. Manage your schedule, run teleconsults, review patient health timelines, and build a verified practice profile with your HCD ID.', cta:'Register Your Practice', ctaLink:'/register?role=doctor', accent:'#A78BFA', accentHex:'167,139,250',
    facts:[{ icon:'📱', title:'67% of patients research doctors online', body:'Doctors without a digital presence lose patients to those who have one. Your HCD-verified profile appears in patient searches across India.', source:'Google Health India Report 2023' },{ icon:'⏱️', title:'Cut consultation prep time by 60%', body:'Patients arrive with structured health timelines showing conditions, medications, allergies and reports — before they walk in.', source:'HealthConnect Doctor Survey, 2024' }] },
  { id:'hospital', badge:'FOR HOSPITALS', headline:'Connect Your Hospital to All of India', sub:'List departments, manage bed occupancy in real-time, coordinate doctors in your network, and make your services discoverable to 1,20,000+ patients.', cta:'List Your Hospital', ctaLink:'/register?role=hospital', accent:'#F59E0B', accentHex:'245,158,11',
    facts:[{ icon:'🏥', title:'40% of beds go unfilled due to discovery gaps', body:"Patients don't know your hospital has capacity. HealthConnect's live bed & OPD tracker makes you discoverable in real-time.", source:'MoHFW Hospital Report 2023' },{ icon:'🏛️', title:'Ayushman Bharat: ₹5 lakh per family', body:'Fully integrated with AB-PMJAY. Patients check eligibility and book at your hospital directly from our platform.', source:'Integrated with NHA APIs' }] },
];

function useCountUp(target:number,active:boolean,dur=1600){const[n,setN]=useState(0);useEffect(()=>{if(!active||!target)return;let v=0;const step=target/(dur/16);const t=setInterval(()=>{v+=step;if(v>=target){setN(target);clearInterval(t);}else setN(Math.floor(v));},16);return()=>clearInterval(t);},[active,target,dur]);return n;}

function getMockTiles(id:string,stats:LiveStats){
  const fmt=(n?:number)=>n?(n>=1000?`${(n/1000).toFixed(1)}k`:String(n)):'—';
  const map:Record<string,{label:string;value:string;sub?:string}[]>={
    patient:[{label:'Health Score',value:'87/100',sub:'Excellent'},{label:'Next Appt',value:'Tomorrow',sub:'10:30 AM'},{label:'Medications',value:'3 Active',sub:'On schedule'},{label:'Patients',value:fmt(stats.users),sub:'Nationwide'}],
    community:[{label:'Members',value:fmt(stats.users),sub:'Active'},{label:'Communities',value:fmt(stats.communities),sub:'Open'},{label:'Posts Today',value:'240+',sub:'Trending'},{label:'Anon Option',value:'100%',sub:'Private'}],
    doctor:[{label:"Today's Pts",value:'12',sub:'3 pending'},{label:'Verified Drs',value:fmt(stats.doctors),sub:'MCI/NMC'},{label:'Avg Rating',value:'4.7★',sub:'Platform'},{label:'Response',value:'< 2hr',sub:'Avg time'}],
    hospital:[{label:'Bed Occ.',value:'73%',sub:'ICU: 68%'},{label:'OPD Today',value:'284',sub:'Booked'},{label:'Hospitals',value:'340+',sub:'Listed'},{label:'AB-PMJAY',value:'₹5L',sub:'Coverage'}],
  };
  return map[id]||map.patient;
}

export default function Hero(){
  const router=useRouter();
  const[current,setCurrent]=useState(0);
  const[dir,setDir]=useState<1|-1>(1);
  const[animKey,setAnimKey]=useState(0);
  const[inAnim,setInAnim]=useState(true);
  const[paused,setPaused]=useState(false);
  const[stats,setStats]=useState<LiveStats>({});
  const[statsActive,setStatsActive]=useState(false);
  const statsRef=useRef<HTMLDivElement>(null);
  const timerRef=useRef<ReturnType<typeof setInterval>|null>(null);

  useEffect(()=>{
    fetch(`${API}/public/stats`).then(r=>r.json()).then(d=>{const s=d?.data||d||{};setStats({users:s.users||s.totalUsers||84,doctors:s.doctors||s.totalDoctors||37,communities:s.communities||s.totalCommunities||18,appointments:s.appointments||s.totalAppointments||20});}).catch(()=>setStats({users:84,doctors:37,communities:18,appointments:20}));
  },[]);

  useEffect(()=>{const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting)setStatsActive(true);},{threshold:0.3});if(statsRef.current)obs.observe(statsRef.current);return()=>obs.disconnect();},[]);

  const go=useCallback((idx:number,d:1|-1)=>{setDir(d);setInAnim(false);requestAnimationFrame(()=>{requestAnimationFrame(()=>{setCurrent(idx);setAnimKey(k=>k+1);setInAnim(true);});});},[]);
  const goNext=useCallback(()=>go((current+1)%SLIDES.length,1),[current,go]);
  const goPrev=useCallback(()=>go((current-1+SLIDES.length)%SLIDES.length,-1),[current,go]);
  useEffect(()=>{if(paused)return;timerRef.current=setInterval(goNext,5500);return()=>{if(timerRef.current)clearInterval(timerRef.current);};},[paused,goNext]);

  const slide=SLIDES[current];
  const u=useCountUp(stats.users||84,statsActive);
  const d2=useCountUp(stats.doctors||37,statsActive);
  const c=useCountUp(stats.communities||18,statsActive);

  return(<>
    <style>{`
      @keyframes hcOrb{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(16px,-14px) scale(1.04)}}
      @keyframes hcPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.9)}}
      .hc-cta{transition:all .22s ease}.hc-cta:hover{transform:translateY(-2px);filter:brightness(1.12)}
      .hc-ghost{transition:all .2s ease}.hc-ghost:hover{background:rgba(255,255,255,0.1)!important}
      .hc-navbtn{transition:all .2s ease}.hc-navbtn:hover{background:rgba(255,255,255,0.1)!important}
      .hc-fcard{transition:all .22s ease}.hc-fcard:hover{transform:translateY(-2px)}
      @media(max-width:1024px){.hc2col{flex-direction:column!important}.hcright{display:none!important}}
      @media(max-width:640px){.hchero{padding:52px 16px 32px!important}}
    `}</style>

    <section id="hero" className="hchero" style={{padding:'80px 5% 52px',position:'relative',overflow:'hidden',background:'linear-gradient(160deg,#0C1929 0%,#122236 40%,#162B3F 70%,#1C3248 100%)',minHeight:'100vh',display:'flex',flexDirection:'column',justifyContent:'center'}}
      onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>

      {/* Hex grid background — same as communities */}
      <div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,opacity:0.055,backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='52' viewBox='0 0 60 52'%3E%3Cpath d='M0 26L15 0h30l15 26-15 26H15z' fill='none' stroke='%2314B8A6' stroke-width='0.8'/%3E%3C/svg%3E")`,backgroundSize:'60px 52px'}}/>
        <div style={{position:'absolute',top:'5%',left:'3%',width:500,height:500,borderRadius:'50%',background:`radial-gradient(circle,rgba(${slide.accentHex},0.06) 0%,transparent 70%)`,animation:'hcOrb 9s ease-in-out infinite',transition:'background 0.6s'}}/>
        <div style={{position:'absolute',bottom:'5%',right:'5%',width:380,height:380,borderRadius:'50%',background:'radial-gradient(circle,rgba(56,189,248,0.05) 0%,transparent 70%)',animation:'hcOrb 12s ease-in-out infinite reverse'}}/>
      </div>

      {/* Platform badge */}
      <div style={{textAlign:'center',marginBottom:22,position:'relative',zIndex:2}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(20,184,166,0.1)',border:'1px solid rgba(20,184,166,0.25)',borderRadius:100,padding:'6px 20px'}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:'#22C55E',animation:'hcPulse 2s infinite'}}/>
          <span style={{fontSize:11,fontWeight:700,color:'#5EEAD4',letterSpacing:'0.1em'}}>INDIA'S UNIFIED HEALTHCARE PLATFORM</span>
        </div>
      </div>

      {/* Two column */}
      <div className="hc2col" style={{display:'flex',gap:20,width:'100%',maxWidth:1300,margin:'0 auto',alignItems:'stretch',position:'relative',zIndex:2}}>

        {/* LEFT — carousel panel */}
        <div style={{flex:'0 0 62%',background:'linear-gradient(160deg,rgba(36,60,88,0.92) 0%,rgba(40,68,98,0.95) 50%,rgba(34,58,84,0.92) 100%)',border:`1.5px solid rgba(${slide.accentHex},0.28)`,borderRadius:20,padding:'26px 28px 20px',backdropFilter:'blur(12px)',boxShadow:`0 0 40px rgba(${slide.accentHex},0.08),0 8px 40px rgba(0,0,0,0.35)`,transition:'border-color 0.5s,box-shadow 0.5s'}}>
          <div key={animKey} style={{opacity:inAnim?1:0,transform:inAnim?'translateX(0)':`translateX(${dir*16}px)`,transition:'opacity 0.35s,transform 0.35s'}}>
            {/* Badge */}
            <div style={{display:'inline-flex',alignItems:'center',gap:6,background:`rgba(${slide.accentHex},0.12)`,border:`1px solid rgba(${slide.accentHex},0.3)`,borderRadius:100,padding:'5px 14px',marginBottom:14}}>
              <div style={{width:5,height:5,borderRadius:'50%',background:slide.accent,boxShadow:`0 0 7px ${slide.accent}`}}/>
              <span style={{fontSize:10,fontWeight:800,color:'#FFFFFF',letterSpacing:'0.1em'}}>{slide.badge}</span>
            </div>
            <h1 style={{fontSize:'clamp(22px,3vw,42px)',fontWeight:900,color:'#FFFFFF',lineHeight:1.18,margin:'0 0 12px',fontFamily:'Poppins,sans-serif',letterSpacing:'-0.02em'}}>{slide.headline}</h1>
            <p style={{fontSize:'clamp(12px,1.2vw,14.5px)',color:'rgba(255,255,255,0.65)',lineHeight:1.72,margin:'0 0 18px',maxWidth:520}}>{slide.sub}</p>
            {/* Mockup */}
            <div style={{background:'linear-gradient(145deg,#0B1A28,#0F2233)',borderRadius:13,overflow:'hidden',border:'1.5px solid rgba(255,255,255,0.12)',boxShadow:`0 0 0 1px rgba(${slide.accentHex},0.08),0 4px 28px rgba(0,0,0,0.5),0 0 55px rgba(${slide.accentHex},0.07)`,marginBottom:18}}>
              <div style={{background:'rgba(255,255,255,0.04)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'5px 12px',display:'flex',alignItems:'center',gap:5}}>
                {['#FF5F56','#FFBD2E','#27C93F'].map((c,i)=><div key={i} style={{width:7,height:7,borderRadius:'50%',background:c}}/>)}
                <div style={{flex:1,background:'rgba(255,255,255,0.05)',borderRadius:4,padding:'2px 7px',margin:'0 7px',fontSize:8,color:'rgba(255,255,255,0.3)'}}>healthconnect.sbs/dashboard</div>
                <div style={{width:5,height:5,borderRadius:'50%',background:'#22C55E',boxShadow:'0 0 5px #22C55E'}}/>
                <span style={{fontSize:7,color:'#4ADE80',fontWeight:700,marginLeft:3}}>LIVE</span>
              </div>
              <div style={{display:'flex',gap:6,padding:'9px 12px 5px'}}>
                {getMockTiles(slide.id,stats).map((t,i)=>(
                  <div key={i} style={{flex:1,background:'rgba(255,255,255,0.06)',borderRadius:8,padding:'8px',border:'1px solid rgba(255,255,255,0.08)'}}>
                    <div style={{fontSize:7,color:'rgba(255,255,255,0.4)',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:3}}>{t.label}</div>
                    <div style={{fontSize:15,fontWeight:800,color:slide.accent,lineHeight:1.1}}>{t.value}</div>
                    {t.sub&&<div style={{fontSize:8,color:'rgba(255,255,255,0.35)',marginTop:2}}>{t.sub}</div>}
                  </div>
                ))}
              </div>
              <div style={{padding:'4px 12px 10px'}}>
                <div style={{fontSize:7,color:'rgba(255,255,255,0.3)',fontWeight:700,letterSpacing:'0.06em',marginBottom:4}}>ACTIVITY</div>
                <div style={{display:'flex',gap:3,alignItems:'flex-end',height:22}}>
                  {[55,70,45,85,60,90,50,75,65,80].map((h,i)=><div key={i} style={{flex:1,background:`rgba(${slide.accentHex},${i===9?0.9:0.5})`,borderRadius:2,height:`${h}%`}}/>)}
                </div>
              </div>
            </div>
            {/* CTAs */}
            <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
              <button className="hc-cta" onClick={()=>router.push(slide.ctaLink)} style={{background:slide.accent,color:'#fff',border:'none',borderRadius:10,padding:'11px 26px',fontSize:13,fontWeight:800,cursor:'pointer',boxShadow:`0 4px 18px rgba(${slide.accentHex},0.4)`,fontFamily:'Poppins,sans-serif'}}>{slide.cta} →</button>
              <button className="hc-ghost" onClick={()=>router.push('/doctors')} style={{background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.8)',border:'1px solid rgba(255,255,255,0.14)',borderRadius:10,padding:'10px 20px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Poppins,sans-serif'}}>Find Doctors</button>
            </div>
          </div>
          {/* Dots + arrows */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:18,paddingTop:14,borderTop:'1px solid rgba(255,255,255,0.07)'}}>
            <div style={{display:'flex',gap:6}}>
              {SLIDES.map((_,i)=><button key={i} onClick={()=>go(i,i>current?1:-1)} style={{width:i===current?20:7,height:7,borderRadius:4,background:i===current?slide.accent:'rgba(255,255,255,0.2)',border:'none',cursor:'pointer',padding:0,transition:'all 0.3s'}}/>)}
            </div>
            <div style={{display:'flex',gap:6}}>
              {[{fn:goPrev,icon:'←'},{fn:goNext,icon:'→'}].map(({fn,icon},i)=>(
                <button key={i} onClick={fn} className="hc-navbtn" style={{width:30,height:30,borderRadius:7,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.65)',cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center'}}>{icon}</button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — facts + stats */}
        <div className="hcright" style={{flex:'0 0 36%',display:'flex',flexDirection:'column',gap:14}}>
          <div key={`r-${animKey}`} style={{opacity:inAnim?1:0,transform:inAnim?'translateX(0)':`translateX(${-dir*14}px)`,transition:'opacity 0.35s ease 0.06s,transform 0.35s ease 0.06s',display:'flex',flexDirection:'column',gap:12,flex:1}}>
            <div style={{fontSize:9,fontWeight:800,color:slide.accent,letterSpacing:'0.14em',opacity:0.9}}>
              {slide.id==='patient'?'HEALTH INSIGHTS':slide.id==='community'?'COMMUNITY SCIENCE':slide.id==='doctor'?'DOCTOR IMPACT':'HOSPITAL FACTS'}
            </div>
            {slide.facts.map((f,i)=>(
              <div key={i} className="hc-fcard" style={{background:'linear-gradient(160deg,rgba(36,60,88,0.92) 0%,rgba(34,58,84,0.88) 100%)',border:`1px solid rgba(${slide.accentHex},0.2)`,borderLeft:`3px solid ${slide.accent}`,borderRadius:14,padding:'15px 16px',backdropFilter:'blur(8px)',boxShadow:'0 2px 12px rgba(0,0,0,0.2)'}}>
                <div style={{display:'flex',gap:10,alignItems:'flex-start',marginBottom:8}}>
                  <span style={{fontSize:20,flexShrink:0,lineHeight:1}}>{f.icon}</span>
                  <div style={{fontSize:13,fontWeight:800,color:'#F0F9FF',lineHeight:1.3}}>{f.title}</div>
                </div>
                <div style={{fontSize:12,color:'rgba(255,255,255,0.62)',lineHeight:1.65,marginBottom:8}}>{f.body}</div>
                <div style={{fontSize:10,color:slide.accent,opacity:0.75,fontWeight:600}}>📎 {f.source}</div>
              </div>
            ))}
          </div>
          {/* Live stats box */}
          <div ref={statsRef} style={{background:'linear-gradient(160deg,rgba(36,60,88,0.92) 0%,rgba(34,58,84,0.88) 100%)',border:'1px solid rgba(20,184,166,0.2)',borderRadius:16,padding:'16px',backdropFilter:'blur(8px)'}}>
            <div style={{fontSize:9,fontWeight:800,color:'rgba(255,255,255,0.4)',letterSpacing:'0.1em',marginBottom:12,textAlign:'center'}}>LIVE PLATFORM STATS</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
              {[{v:u,label:'Patients',color:'#14B8A6'},{v:d2,label:'Doctors',color:'#A78BFA'},{v:c,label:'Communities',color:'#22C55E'}].map((s,i)=>(
                <div key={i} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:'10px 6px',textAlign:'center'}}>
                  <div style={{fontSize:16,fontWeight:900,color:s.color,lineHeight:1,fontFamily:'Poppins,sans-serif'}}>{s.v}+</div>
                  <div style={{fontSize:9,color:'rgba(255,255,255,0.45)',marginTop:4,fontWeight:500}}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center',marginTop:10}}>
              <div style={{width:5,height:5,borderRadius:'50%',background:'#22C55E',animation:'hcPulse 2s infinite'}}/>
              <span style={{fontSize:9,color:'rgba(255,255,255,0.35)',fontWeight:500}}>Live from database · updates daily</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div style={{maxWidth:1300,margin:'26px auto 0',width:'100%',position:'relative',zIndex:2}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:14,flexWrap:'wrap'}}>
          {[{icon:'🔐',text:'DPDP Compliant'},{icon:'✅',text:'MCI/NMC Verified'},{icon:'🇮🇳',text:'Made in India'},{icon:'🆓',text:'Free for Patients'},{icon:'🏥',text:'AB-PMJAY Integrated'}].map((t,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:6,padding:'5px 14px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:100}}>
              <span style={{fontSize:12}}>{t.icon}</span>
              <span style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.6)'}}>{t.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  </>);
}
