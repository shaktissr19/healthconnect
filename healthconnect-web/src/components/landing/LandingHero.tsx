'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const HEADLINES = [
  'Your health. Connected around you.',
  'From finding care to staying connected.',
  'One health journey. Wherever care takes you.',
  'Care, records and support. Connected.',
] as const;

export default function LandingHero(){
  const {isAuthenticated,user}=useAuthStore();
  const {openAuthModal}=useUIStore();
  const [headlineIndex,setHeadlineIndex]=useState(0);
  const [visible,setVisible]=useState(true);

  useEffect(()=>{
    const timer=window.setInterval(()=>{
      setVisible(false);
      window.setTimeout(()=>{
        setHeadlineIndex(i=>(i+1)%HEADLINES.length);
        setVisible(true);
      },260);
    },4800);
    return()=>window.clearInterval(timer);
  },[]);

  const explore=()=>document.getElementById('platform-tour')?.scrollIntoView({behavior:'smooth',block:'start'});
  const go=(href:string)=>{if(typeof window!=='undefined')window.location.href=href};

  return <section className="hc-premium-hero" aria-label="HealthConnect India">
    <style>{`
      .hc-premium-hero{padding-top:74px;background:#F7FBFA;font-family:'DM Sans',Arial,sans-serif;color:#092A32}
      .hc-hero-canvas{position:relative;max-width:1600px;min-height:520px;margin:0 auto;overflow:hidden;background:#EAF6F3 url('/images/hero-photo.png') 72% center/cover no-repeat}
      .hc-hero-canvas:before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,#F7FCFA 0%,rgba(247,252,250,.995) 31%,rgba(247,252,250,.94) 42%,rgba(247,252,250,.68) 54%,rgba(247,252,250,.18) 70%,rgba(247,252,250,0) 84%)}
      .hc-hero-canvas:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,0) 76%,rgba(5,79,71,.06) 100%);pointer-events:none}
      .hc-hero-inner{position:relative;z-index:2;max-width:1420px;min-height:520px;margin:0 auto;padding:56px 56px;display:flex;align-items:center}
      .hc-hero-copy{width:min(620px,46vw)}
      .hc-hero-eyebrow{display:flex;align-items:center;gap:11px;font-size:13px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#087F70;margin-bottom:18px}.hc-hero-eyebrow:before{content:'';width:38px;height:2px;background:#0D9488}
      .hc-hero-title-wrap{min-height:142px;display:flex;align-items:flex-start}
      .hc-hero-copy h1{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.9rem,4.15vw,4.55rem);line-height:1.01;letter-spacing:-.052em;margin:0;color:#0A315B;max-width:620px;text-wrap:balance;transition:opacity .26s ease,transform .26s ease}.hc-hero-copy h1.hidden{opacity:0;transform:translateY(7px)}.hc-hero-copy h1.visible{opacity:1;transform:translateY(0)}
      .hc-hero-copy p{font-size:18px;line-height:1.6;color:#35566B;max-width:590px;margin:18px 0 0}
      .hc-hero-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:26px}.hc-hero-btn{min-height:48px;border-radius:10px;padding:0 21px;font:850 14px 'DM Sans',Arial,sans-serif;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:13px;transition:.16s}.hc-hero-btn:hover{transform:translateY(-1px)}.hc-hero-primary{border:1px solid #0B7B6E;background:#0B7B6E;color:#fff;box-shadow:0 9px 22px rgba(11,123,110,.18)}.hc-hero-secondary{border:1px solid #B8D0CF;background:rgba(255,255,255,.94);color:#0A315B;box-shadow:0 5px 14px rgba(20,55,68,.04)}
      .hc-hero-trust{display:flex;gap:18px;flex-wrap:wrap;margin-top:24px;color:#456778;font-size:13px;font-weight:750}.hc-hero-trust span{display:flex;gap:7px;align-items:center}.hc-hero-trust i{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:#DDF5EE;color:#0B7B6E;font-style:normal;font-size:11px}
      .hc-hero-story{position:absolute;z-index:3;right:44px;bottom:28px;background:rgba(255,255,255,.91);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.92);border-radius:13px;padding:11px 14px;color:#184958;box-shadow:0 12px 30px rgba(13,67,72,.12)}.hc-hero-story strong{display:block;font-size:13px}.hc-hero-story span{display:block;font-size:12px;color:#64808B;margin-top:3px}
      .hc-hero-dots{display:flex;gap:7px;margin-top:18px}.hc-hero-dot{width:20px;height:3px;border-radius:999px;background:#C8DDD8;transition:.2s}.hc-hero-dot.active{width:34px;background:#0D9488}
      @media(max-width:1100px){.hc-hero-canvas{background-position:67% center}.hc-hero-canvas:before{background:linear-gradient(90deg,#F7FCFA 0%,rgba(247,252,250,.99) 39%,rgba(247,252,250,.80) 60%,rgba(247,252,250,.22) 100%)}.hc-hero-inner{padding:50px 34px}.hc-hero-copy{width:min(590px,61vw)}.hc-hero-story{display:none}}
      @media(max-width:720px){.hc-premium-hero{padding-top:74px}.hc-hero-canvas{min-height:690px;background-position:64% bottom}.hc-hero-canvas:before{background:linear-gradient(180deg,#F7FCFA 0%,rgba(247,252,250,.995) 49%,rgba(247,252,250,.76) 68%,rgba(247,252,250,.12) 100%)}.hc-hero-inner{min-height:690px;align-items:flex-start;padding:40px 20px 255px}.hc-hero-copy{width:100%;max-width:600px}.hc-hero-title-wrap{min-height:118px}.hc-hero-copy h1{font-size:clamp(2.55rem,11.5vw,3.6rem)}.hc-hero-copy p{font-size:16px}.hc-hero-trust{font-size:12.5px;gap:11px}}
      @media(max-width:500px){.hc-hero-actions{display:grid;grid-template-columns:1fr}.hc-hero-btn{width:100%}.hc-hero-title-wrap{min-height:130px}}
    `}</style>
    <div className="hc-hero-canvas">
      <div className="hc-hero-inner">
        <div className="hc-hero-copy">
          <div className="hc-hero-eyebrow">India&apos;s unified healthcare platform</div>
          <div className="hc-hero-title-wrap"><h1 className={visible?'visible':'hidden'}>{HEADLINES[headlineIndex]}</h1></div>
          <p>Find doctors and hospitals, organise important health information, and stay supported between visits through one connected HealthConnect journey.</p>
          <div className="hc-hero-actions">
            <button type="button" className="hc-hero-btn hc-hero-primary" onClick={explore}>Explore HealthConnect <span>→</span></button>
            <button type="button" className="hc-hero-btn hc-hero-secondary" onClick={()=>go('/doctors')}>Find a Doctor <span>→</span></button>
          </div>
          <div className="hc-hero-trust"><span><i>✓</i>Private health workspace</span><span><i>✓</i>Built for Indian care journeys</span><span><i>✓</i>Connected patient & provider flows</span></div>
          <div className="hc-hero-dots" aria-hidden="true">{HEADLINES.map((_,i)=><span className={`hc-hero-dot ${i===headlineIndex?'active':''}`} key={i}/>)}</div>
        </div>
      </div>
      <div className="hc-hero-story"><strong>Care with context</strong><span>Discovery, health information and follow-up connected.</span></div>
    </div>
  </section>;
}
