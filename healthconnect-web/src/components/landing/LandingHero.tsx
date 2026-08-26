'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const HEADLINES=[
  ['Your health journey.','Connected around you.'],
  ['Find care. Stay informed.','Stay connected.'],
  ['One health journey.','Wherever care takes you.'],
] as const;

export default function LandingHero(){
  const {isAuthenticated,user}=useAuthStore();
  const {openAuthModal}=useUIStore();
  const [headlineIndex,setHeadlineIndex]=useState(0);

  useEffect(()=>{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const timer=window.setInterval(()=>setHeadlineIndex(current=>(current+1)%HEADLINES.length),5200);
    return()=>window.clearInterval(timer);
  },[]);

  const explore=()=>document.getElementById('platform-tour')?.scrollIntoView({behavior:'smooth',block:'start'});
  const go=(href:string)=>{if(typeof window!=='undefined')window.location.href=href};
  const accountAction=()=>{
    if(isAuthenticated&&user){const role=String(user.role||'').toUpperCase();go(role==='PATIENT'?'/dashboard':role==='DOCTOR'?'/doctor-dashboard':role==='HOSPITAL'?'/hospital-dashboard':'/admin-dashboard');return;}
    openAuthModal('register');
  };
  void accountAction;

  return <section className="hc-hero" aria-label="HealthConnect India">
    <style>{`
      .hc-hero{padding-top:76px;background:#F5FBF9;font-family:'DM Sans',Arial,sans-serif;color:#0C2635}.hc-hero-canvas{position:relative;min-height:536px;overflow:hidden;background:linear-gradient(90deg,#F5FBF9 0%,#F2FAF8 46%,#EBF6F4 100%)}
      .hc-hero-photo{position:absolute;inset:0;background-image:url('/images/hero-intro.png');background-size:auto 90%;background-position:calc(100% - 18px) 58%;background-repeat:no-repeat}.hc-hero-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(246,252,250,1) 0%,rgba(244,251,249,.99) 29%,rgba(244,251,249,.86) 39%,rgba(244,251,249,.38) 48%,rgba(244,251,249,.08) 57%,rgba(244,251,249,0) 64%)}
      .hc-hero-inner{position:relative;z-index:2;max-width:1380px;margin:0 auto;padding:50px 44px 44px;min-height:536px;display:flex;align-items:center}.hc-hero-copy{width:min(610px,46vw)}.hc-hero-welcome{font-family:'Sora','DM Sans',sans-serif;font-size:21px;font-weight:750;color:#0A315B;margin-bottom:13px;letter-spacing:-.02em}.hc-hero-eyebrow{display:flex;align-items:center;gap:9px;color:#087F70;font-size:13px;font-weight:900;letter-spacing:.15em;text-transform:uppercase;margin-bottom:18px}.hc-hero-eyebrow:before{content:'';width:20px;height:2px;background:#0D9488;border-radius:2px}
      .hc-hero-title-wrap{height:146px;display:flex;align-items:flex-start}.hc-hero h1{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.9rem,3.9vw,4.15rem);line-height:1.02;letter-spacing:-.052em;color:#0A315B;margin:0;max-width:620px;animation:hcHeadlineIn .45s ease both}@keyframes hcHeadlineIn{from{opacity:.2;transform:translateY(6px)}to{opacity:1;transform:none}}.hc-hero-line{display:block;white-space:nowrap}.hc-hero-copy p{font-size:18px;line-height:1.62;color:#294F63;max-width:575px;margin:18px 0 0}.hc-hero-actions{display:flex;gap:13px;flex-wrap:wrap;margin-top:24px}.hc-hero-btn{min-height:50px;border-radius:11px;padding:0 22px;font:850 14px 'DM Sans',Arial,sans-serif;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:12px;transition:transform .16s ease,box-shadow .16s ease}.hc-hero-btn:hover{transform:translateY(-1px)}.hc-hero-primary{border:1px solid #0B7B6E;background:#0B7B6E;color:#fff;box-shadow:0 10px 24px rgba(11,123,110,.17)}.hc-hero-secondary{border:1px solid #B7D0CD;background:rgba(255,255,255,.94);color:#0A315B}.hc-hero-trust{display:flex;gap:20px;flex-wrap:wrap;margin-top:22px}.hc-hero-trust span{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:750;color:#385D6E}.hc-hero-trust i{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#DDF5EE;color:#0A8A78;font-style:normal;font-size:12px}.hc-hero-dots{display:flex;gap:7px;margin-top:17px}.hc-hero-dot{width:7px;height:7px;border-radius:999px;border:0;padding:0;background:#BFD6D2;cursor:pointer}.hc-hero-dot.active{width:22px;background:#0B8F7C}
      @media(max-width:1120px){.hc-hero-photo{background-size:auto 84%;background-position:calc(100% + 20px) 60%}.hc-hero-shade{background:linear-gradient(90deg,rgba(246,252,250,1) 0%,rgba(244,251,249,.98) 38%,rgba(244,251,249,.58) 51%,rgba(244,251,249,.08) 68%)}.hc-hero-copy{width:min(570px,54vw)}.hc-hero h1{font-size:clamp(2.7rem,4.7vw,3.75rem)}}
      @media(max-width:820px){.hc-hero-canvas{min-height:auto;padding-bottom:320px}.hc-hero-photo{top:auto;height:340px;background-size:auto 94%;background-position:center bottom}.hc-hero-shade{background:linear-gradient(180deg,#F5FBF9 0%,#F5FBF9 53%,rgba(245,251,249,.62) 72%,rgba(245,251,249,0) 100%)}.hc-hero-inner{min-height:auto;padding:42px 26px 38px}.hc-hero-copy{width:100%;max-width:640px}.hc-hero-title-wrap{height:138px}.hc-hero-line{white-space:normal}.hc-hero-copy p{max-width:600px}}
      @media(max-width:560px){.hc-hero{padding-top:72px}.hc-hero-canvas{padding-bottom:260px}.hc-hero-photo{height:280px}.hc-hero-inner{padding:36px 18px 30px}.hc-hero-welcome{font-size:18px}.hc-hero-eyebrow{font-size:11.5px;letter-spacing:.13em}.hc-hero h1{font-size:clamp(2.35rem,10.8vw,2.95rem)}.hc-hero-title-wrap{height:138px}.hc-hero-copy p{font-size:16px}.hc-hero-actions{display:grid;grid-template-columns:1fr 1fr}.hc-hero-btn{padding:0 14px}.hc-hero-trust{gap:12px}.hc-hero-trust span{font-size:12.5px}}
      @media(max-width:420px){.hc-hero-actions{grid-template-columns:1fr}}
    `}</style>
    <div className="hc-hero-canvas"><div className="hc-hero-photo" aria-hidden="true"/><div className="hc-hero-shade" aria-hidden="true"/><div className="hc-hero-inner"><div className="hc-hero-copy"><div className="hc-hero-welcome">Welcome to HealthConnect</div><div className="hc-hero-eyebrow">India&apos;s unified healthcare platform</div><div className="hc-hero-title-wrap"><h1 key={headlineIndex}><span className="hc-hero-line">{HEADLINES[headlineIndex][0]}</span><span className="hc-hero-line">{HEADLINES[headlineIndex][1]}</span></h1></div><p>Find trusted doctors and hospitals, organise your health information, and stay connected between visits — all in one secure HealthConnect journey.</p><div className="hc-hero-actions"><button type="button" className="hc-hero-btn hc-hero-primary" onClick={explore}>Explore HealthConnect <span>→</span></button><button type="button" className="hc-hero-btn hc-hero-secondary" onClick={()=>go('/doctors')}>Find a Doctor <span>→</span></button></div><div className="hc-hero-trust"><span><i>✓</i>Private & secure workspace</span><span><i>✓</i>Built for Indian care journeys</span><span><i>✓</i>Connected patient & provider flows</span></div><div className="hc-hero-dots" aria-label="Hero messages">{HEADLINES.map((_,index)=><button key={index} type="button" aria-label={`Show message ${index+1}`} onClick={()=>setHeadlineIndex(index)} className={`hc-hero-dot ${index===headlineIndex?'active':''}`}/>)}</div></div></div></div>
  </section>;
}
