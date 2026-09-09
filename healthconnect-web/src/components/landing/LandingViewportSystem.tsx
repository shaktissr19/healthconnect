'use client';

import { useCallback, useEffect, useState } from 'react';

const SECTIONS=[
  {label:'Home',selector:'.hc-hero'},
  {label:'My Health',selector:'#my-health-story'},
  {label:'Communities',selector:'#health-communities-story'},
  {label:'Doctor Platform',selector:'#doctor-platform-story'},
  {label:'Find Care',selector:'#care-discovery'},
  {label:'Knowledge',selector:'#knowledge-hub'},
  {label:'Platform',selector:'.pn-section'},
  {label:'Plans',selector:'#plans'},
  {label:'Trust',selector:'#trust-privacy'},
  {label:'Connect',selector:'.final-photo-section'},
] as const;

export default function LandingViewportSystem(){
  const [active,setActive]=useState(0);
  const [reducedMotion,setReducedMotion]=useState(false);

  useEffect(()=>{
    if(typeof window==='undefined')return;
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync=()=>setReducedMotion(media.matches);
    sync();media.addEventListener?.('change',sync);return()=>media.removeEventListener?.('change',sync);
  },[]);

  useEffect(()=>{
    if(typeof window==='undefined')return;
    const targets=SECTIONS.map(section=>document.querySelector(section.selector) as HTMLElement|null);
    const visible=new Map<Element,number>();
    const choose=()=>{
      const anchor=window.innerHeight*.42;let best=0;let bestScore=-Infinity;
      targets.forEach((element,index)=>{if(!element)return;const rect=element.getBoundingClientRect();const contains=rect.top<=anchor&&rect.bottom>=anchor;const ratio=visible.get(element)??0;const score=(contains?1000:0)+(ratio*100)-(Math.abs(rect.top-anchor)/100);if(score>bestScore){bestScore=score;best=index}});
      setActive(best);
    };
    const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>visible.set(entry.target,entry.isIntersecting?entry.intersectionRatio:0));choose()},{threshold:[0,.05,.15,.3,.55,.8],rootMargin:'-10% 0px -46% 0px'});
    targets.forEach(element=>element&&observer.observe(element));
    let frame=0;const onScroll=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(choose)};
    window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onScroll);choose();
    return()=>{observer.disconnect();cancelAnimationFrame(frame);window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onScroll)};
  },[]);

  const scrollToIndex=useCallback((index:number)=>{
    const safe=Math.max(0,Math.min(SECTIONS.length-1,index));const section=SECTIONS[safe];const element=document.querySelector(section.selector) as HTMLElement|null;if(!element)return;
    const top=section.selector==='.hc-hero'?0:element.getBoundingClientRect().top+window.scrollY-72;
    window.scrollTo({top:Math.max(0,top),behavior:reducedMotion?'auto':'smooth'});
  },[reducedMotion]);

  return <>
    <style>{`
      :root{--hc-content:1180px;--hc-wide:1380px;--hc-immersive:1520px}
      #my-health-story,#health-communities-story,#doctor-platform-story,#care-discovery,#knowledge-hub,#plans,#trust-privacy{scroll-margin-top:76px}
      .hc-section-rail{display:none}
      @media(min-width:1220px){
        .hc-section-rail{position:fixed;z-index:850;right:2px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;width:20px;padding:5px 0;border-radius:12px 0 0 12px;background:rgba(250,253,253,.84);border:1px solid rgba(196,216,219,.86);border-right:0;box-shadow:0 7px 18px rgba(19,61,74,.08);backdrop-filter:blur(10px);font-family:'DM Sans',Arial,sans-serif;color:#55727E}
        .hc-rail-arrow{width:18px;height:20px;border:0;background:transparent;border-radius:6px;color:#66828D;font-size:11px;cursor:pointer;display:grid;place-items:center;padding:0}.hc-rail-arrow:hover{background:#E8F6F3;color:#087D72}.hc-rail-arrow:disabled{opacity:.2;cursor:default}.hc-rail-arrow:focus-visible,.hc-rail-dot:focus-visible{outline:2px solid #0B8F7C;outline-offset:1px}
        .hc-rail-count{font-size:6.7px;font-weight:900;color:#78909B;margin:1px 0 3px;font-variant-numeric:tabular-nums;line-height:1}
        .hc-section-dots{position:relative;display:flex;flex-direction:column;align-items:center;padding:2px 0}.hc-section-dots:before{content:'';position:absolute;top:8px;bottom:8px;width:1px;background:#D7E5E6}
        .hc-rail-dot{position:relative;z-index:2;width:18px;height:18px;border:0;background:transparent;cursor:pointer;display:grid;place-items:center;padding:0}.hc-rail-dot:before{content:'';width:4px;height:4px;border-radius:50%;background:#B7CCCF;border:1px solid #fff;box-shadow:0 0 0 1px #C7DADB;transition:width .15s ease,height .15s ease,background .15s ease,box-shadow .15s ease}.hc-rail-dot.active:before{width:7px;height:7px;background:#0B948B;box-shadow:0 0 0 2px #DDF5F1}.hc-rail-dot:hover:before{background:#4FAFA6}
      }
      @media(max-width:1219px){.hc-section-rail{display:none!important}}
      @media(prefers-reduced-motion:reduce){.hc-section-rail *{transition:none!important}}
    `}</style>

    <nav className="hc-section-rail" aria-label="Landing page sections">
      <button type="button" className="hc-rail-arrow" disabled={active===0} aria-label="Previous section" onClick={()=>scrollToIndex(active-1)}>↑</button>
      <div className="hc-rail-count" aria-live="polite">{String(active+1).padStart(2,'0')}/{String(SECTIONS.length).padStart(2,'0')}</div>
      <div className="hc-section-dots">{SECTIONS.map((section,index)=><button key={section.label} type="button" className={`hc-rail-dot ${active===index?'active':''}`} aria-label={`Go to ${section.label}`} aria-current={active===index?'step':undefined} title={section.label} onClick={()=>scrollToIndex(index)}/>)}</div>
      <button type="button" className="hc-rail-arrow" disabled={active===SECTIONS.length-1} aria-label="Next section" onClick={()=>scrollToIndex(active+1)}>↓</button>
    </nav>
  </>;
}
