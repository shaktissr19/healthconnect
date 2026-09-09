'use client';

import { useEffect, useState } from 'react';

const HERO_IMAGE='/images/landing-hero.png';

const HEADLINES=[
  ['Your health journey.','Connected around you.'],
  ['Find care. Stay informed.','Stay connected.'],
  ['One health journey.','Wherever care takes you.'],
] as const;

export default function LandingHero(){
  const [headlineIndex,setHeadlineIndex]=useState(0);

  useEffect(()=>{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const timer=window.setInterval(()=>setHeadlineIndex(current=>(current+1)%HEADLINES.length),5200);
    return()=>window.clearInterval(timer);
  },[]);

  const explore=()=>document.getElementById('platform-tour')?.scrollIntoView({behavior:'smooth',block:'start'});
  const go=(href:string)=>{if(typeof window!=='undefined')window.location.href=href};

  return <section className="hc-hero" aria-label="HealthConnect India">
    <style>{`
      .hc-hero{padding-top:72px;background:#F4FAF8;font-family:'DM Sans',Arial,sans-serif;color:#0C2635}.hc-hero-canvas{position:relative;min-height:520px;overflow:hidden;background:#F4FAF8}
      .hc-hero-photo{position:absolute;inset:0;background-size:auto 100%;background-position:right center;background-repeat:no-repeat}.hc-hero-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(246,251,250,.99) 0%,rgba(246,251,250,.95) 25%,rgba(246,251,250,.74) 36%,rgba(246,251,250,.28) 48%,rgba(246,251,250,0) 60%)}
      .hc-hero-inner{position:relative;z-index:2;max-width:1340px;margin:0 auto;padding:42px 40px 38px;min-height:520px;display:flex;align-items:center}.hc-hero-copy{width:min(610px,47vw)}.hc-hero-welcome{font-family:'Sora','DM Sans',sans-serif;font-size:20px;font-weight:750;color:#0A315B;margin-bottom:10px;letter-spacing:-.02em}.hc-hero-eyebrow{display:flex;align-items:center;gap:9px;color:#087F70;font-size:12px;font-weight:900;letter-spacing:.15em;text-transform:uppercase;margin-bottom:14px}.hc-hero-eyebrow:before{content:'';width:18px;height:2px;background:#0D9488;border-radius:2px}
      .hc-hero-title-wrap{height:124px;display:flex;align-items:flex-start}.hc-hero h1{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.55rem,3.25vw,3.55rem);line-height:1.02;letter-spacing:-.052em;color:#0A315B;margin:0;max-width:620px;animation:hcHeadlineIn .45s ease both}@keyframes hcHeadlineIn{from{opacity:.2;transform:translateY(6px)}to{opacity:1;transform:none}}.hc-hero-line{display:block;white-space:nowrap}.hc-hero-copy p{font-size:16.5px;line-height:1.56;color:#294F63;max-width:575px;margin:14px 0 0}.hc-hero-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:20px}.hc-hero-btn{min-height:47px;border-radius:11px;padding:0 20px;font:850 13.5px 'DM Sans',Arial,sans-serif;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:12px;transition:transform .16s ease,box-shadow .16s ease}.hc-hero-btn:hover{transform:translateY(-1px)}.hc-hero-btn:focus-visible{outline:3px solid rgba(11,143,124,.26);outline-offset:3px}.hc-hero-primary{border:1px solid #0B7B6E;background:#0B7B6E;color:#fff;box-shadow:0 10px 24px rgba(11,123,110,.17)}.hc-hero-secondary{border:1px solid #ABCBC5;background:#E6F0ED;color:#0A315B}.hc-hero-trust{display:flex;gap:17px;flex-wrap:wrap;margin-top:18px}.hc-hero-trust span{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:750;color:#385D6E}.hc-hero-trust i{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#CEE9E1;color:#0A8A78;font-style:normal;font-size:12px}.hc-hero-dots{display:flex;gap:7px;margin-top:13px}.hc-hero-dot{width:7px;height:7px;border-radius:999px;border:0;padding:0;background:#BFD6D2;cursor:pointer}.hc-hero-dot.active{width:22px;background:#0B8F7C}.hc-hero-dot:focus-visible{outline:2px solid #0B8F7C;outline-offset:3px}
      @media(max-width:1120px){.hc-hero-photo{background-size:auto 96%;background-position:right center}.hc-hero-shade{background:linear-gradient(90deg,rgba(246,251,250,1) 0%,rgba(246,251,250,.96) 34%,rgba(246,251,250,.64) 46%,rgba(246,251,250,.12) 64%)}.hc-hero-copy{width:min(570px,54vw)}.hc-hero h1{font-size:clamp(2.45rem,4.2vw,3.4rem)}}
      @media(max-width:820px){.hc-hero-canvas{min-height:auto;padding-bottom:330px}.hc-hero-photo{top:auto;height:350px;background-size:auto 100%;background-position:right center}.hc-hero-shade{background:linear-gradient(180deg,#F4FAF8 0%,#F4FAF8 54%,rgba(244,250,248,.72) 68%,rgba(244,250,248,0) 100%)}.hc-hero-inner{min-height:auto;padding:38px 26px 34px}.hc-hero-copy{width:100%;max-width:640px}.hc-hero-title-wrap{height:124px}.hc-hero-line{white-space:normal}.hc-hero-copy p{max-width:600px}}
      @media(max-width:560px){.hc-hero{padding-top:72px}.hc-hero-canvas{padding-bottom:270px}.hc-hero-photo{height:290px}.hc-hero-inner{padding:34px 18px 28px}.hc-hero-welcome{font-size:18px}.hc-hero-eyebrow{font-size:11.5px;letter-spacing:.13em}.hc-hero h1{font-size:clamp(2.15rem,10vw,2.7rem)}.hc-hero-title-wrap{height:128px}.hc-hero-copy p{font-size:15.5px}.hc-hero-actions{display:grid;grid-template-columns:1fr 1fr}.hc-hero-btn{padding:0 14px}.hc-hero-trust{gap:12px}.hc-hero-trust span{font-size:12px}}
      @media(max-width:420px){.hc-hero-actions{grid-template-columns:1fr}}
    `}</style>
    <div className="hc-hero-canvas"><div className="hc-hero-photo" style={{backgroundImage:`url('${HERO_IMAGE}')`}} aria-hidden="true"/><div className="hc-hero-shade" aria-hidden="true"/><div className="hc-hero-inner"><div className="hc-hero-copy"><div className="hc-hero-welcome">Welcome to HealthConnect</div><div className="hc-hero-eyebrow">India&apos;s unified healthcare platform</div><div className="hc-hero-title-wrap" aria-live="polite"><h1 key={headlineIndex}><span className="hc-hero-line">{HEADLINES[headlineIndex][0]}</span><span className="hc-hero-line">{HEADLINES[headlineIndex][1]}</span></h1></div><p>Find trusted doctors and hospitals, organise your health information, and stay connected between visits — all in one secure HealthConnect journey.</p><div className="hc-hero-actions"><button type="button" className="hc-hero-btn hc-hero-primary" onClick={explore}>Explore HealthConnect</button><button type="button" className="hc-hero-btn hc-hero-secondary" onClick={()=>go('/doctors')}>Find a Doctor</button></div><div className="hc-hero-trust"><span><i>✓</i>Private & secure workspace</span><span><i>✓</i>Built for Indian care journeys</span><span><i>✓</i>Connected patient & provider flows</span></div><div className="hc-hero-dots" aria-label="Hero messages">{HEADLINES.map((_,index)=><button key={index} type="button" aria-label={`Show message ${index+1}`} onClick={()=>setHeadlineIndex(index)} className={`hc-hero-dot ${index===headlineIndex?'active':''}`}/>)}</div></div></div></div>
  </section>;
}
