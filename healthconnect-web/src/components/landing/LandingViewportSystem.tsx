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
    const top=section.selector==='.hc-hero'?0:element.getBoundingClientRect().top+window.scrollY-66;
    window.scrollTo({top:Math.max(0,top),behavior:reducedMotion?'auto':'smooth'});
  },[reducedMotion]);

  return <>
    <style>{`
      :root{--hc-content:1180px;--hc-wide:1380px;--hc-immersive:1520px}

      /* Section rhythm: subtle colour shifts make the long page easier to scan. */
      .mh-section{background:#F7FBFA!important;border-top:1px solid #E7F1EF}
      .hc-community-showcase{background:#F7F4FB!important;border-top:1px solid #E9E2F2}
      .doctor-platform-section{background:#F3F7FE!important;border-top:1px solid #DFE9F8}
      .care-discovery{background:#FBF8F2!important;border-top:1px solid #EEE7DB}
      .knowledge-section{background:#F6F8FC!important;border-top:1px solid #E5EAF3}
      .pn-section{background:#EEF7F6!important;border-top:1px solid #DCEBE8}
      .landing-membership .hc-plans{background:linear-gradient(135deg,#F4F7FD 0%,#F6F4FB 50%,#EFF8F5 100%)!important;border-top:1px solid #E1E7F0!important}
      .trust-section{background:#F5FAF8!important;border-top:1px solid #DDEBE7}
      .final-photo-section{background:#FBF8F4!important;border-top:1px solid #EEE5D9}

      @media(min-width:1101px){
        .hc-public-nav{height:66px!important;transition:height .22s ease,box-shadow .2s ease,background .2s ease!important}.hc-public-nav.scrolled{height:62px!important}.hc-nav-inner{max-width:var(--hc-wide)!important;padding:0 24px!important}.hc-brand{margin-right:25px!important;gap:9px!important}.hc-brand-logo{width:39px!important;height:39px!important;border-radius:10px!important;font-size:13px!important}.hc-brand-copy strong{font-size:18px!important}.hc-brand-copy span{font-size:8px!important;margin-top:2px!important}.hc-nav-link{padding:20px 8px 18px!important;font-size:12px!important}.hc-nav-link:after{bottom:9px!important}.hc-signin,.hc-signup,.hc-dashboard-btn{padding:9px 15px!important}
        .hc-hero{padding-top:66px!important}.hc-hero-canvas,.hc-hero-inner{min-height:490px!important}.hc-hero-inner{max-width:1280px!important;padding:34px 35px 32px!important}.hc-hero-copy{width:min(570px,45vw)!important}.hc-hero-welcome{font-size:18px!important;margin-bottom:8px!important}.hc-hero-eyebrow{margin-bottom:11px!important;font-size:11.5px!important}.hc-hero-title-wrap{height:108px!important}.hc-hero h1{font-size:clamp(2.45rem,3vw,3.25rem)!important;line-height:1.01!important}.hc-hero-copy p{font-size:15.5px!important;line-height:1.5!important;margin-top:11px!important}.hc-hero-actions{margin-top:16px!important}.hc-hero-btn{min-height:43px!important;padding:0 17px!important;font-size:12.8px!important}.hc-hero-trust{margin-top:14px!important;gap:14px!important}.hc-hero-trust span{font-size:11.8px!important}.hc-hero-dots{margin-top:10px!important}

        .care-discovery{padding:36px 22px 40px!important}.care-inner{max-width:1280px!important}.care-head{max-width:840px!important;margin-bottom:16px!important}.care-kicker{font-size:11.5px!important;margin-bottom:5px!important}.care-head h2{font-size:clamp(1.9rem,2.35vw,2.5rem)!important}.care-head p{font-size:13.5px!important;line-height:1.45!important;margin-top:7px!important}.care-grid{gap:14px!important}.care-card{border-radius:16px!important}.care-image{aspect-ratio:16/5.8!important}.care-body{padding:14px 16px 16px!important}.care-tag{font-size:10.5px!important;margin-bottom:4px!important}.care-body h3{font-size:18px!important;margin-bottom:5px!important}.care-body p{font-size:12px!important;line-height:1.42!important;margin-bottom:8px!important}.care-action{font-size:11.8px!important}

        .knowledge-section{padding:38px 22px 42px!important}.knowledge-inner{max-width:1280px!important}.knowledge-head{grid-template-columns:minmax(0,1.05fr) minmax(300px,.65fr)!important;gap:36px!important;margin-bottom:15px!important}.knowledge-kicker{font-size:11.2px!important;margin-bottom:5px!important}.knowledge-title{font-size:clamp(1.85rem,2.25vw,2.4rem)!important}.knowledge-head-right p{font-size:13px!important;line-height:1.45!important;margin-bottom:9px!important}.knowledge-all{padding:8px 11px!important;font-size:11px!important}.knowledge-arrow{width:32px!important;height:32px!important}.knowledge-grid{gap:12px!important}.knowledge-card{border-radius:15px!important}.knowledge-photo{aspect-ratio:16/6.2!important}.knowledge-body{padding:12px 14px 14px!important;min-height:150px!important}.knowledge-cat{font-size:9.8px!important;margin-bottom:5px!important;padding:3px 6px!important}.knowledge-card h3{font-size:15px!important;line-height:1.24!important;margin-bottom:5px!important}.knowledge-summary{font-size:11.4px!important;line-height:1.38!important;margin-bottom:9px!important}.knowledge-read{font-size:11.2px!important}.knowledge-disclaimer{margin-top:12px!important;padding:9px 11px!important;font-size:11px!important}

        .pn-section{padding:28px 0 28px!important}.pn-head{max-width:1280px!important;padding:0 30px 14px!important}.pn-kicker{font-size:11.5px!important;margin-bottom:5px!important}.pn-heading{font-size:clamp(1.85rem,2.3vw,2.45rem)!important}.pn-head p{font-size:12.2px!important;line-height:1.45!important}.pn-stage{padding:0 30px!important}.pn-cards{height:282px!important;max-width:1380px!important}.pn-col-txt{padding:15px 13px!important}.pn-exp-txt{padding:18px 22px!important}.pn-stat{font-size:29px!important}.pn-exp-stat{font-size:38px!important}.pn-exp-title{font-size:16px!important}.pn-exp-desc{font-size:11.5px!important;line-height:1.43!important;margin-bottom:9px!important}.pn-cta{padding:7px 11px!important;font-size:10.5px!important}

        .landing-membership .hc-plans{padding:32px 24px 34px!important}.landing-membership .hc-plans-wrap{max-width:1180px!important}.landing-membership .hc-plans-head{margin-bottom:15px!important}.landing-membership .hc-plans h2{font-size:clamp(1.8rem,2.2vw,2.3rem)!important}.landing-membership .hc-plan-card{padding:18px 20px!important}.landing-membership .hc-plan-title{font-size:19px!important}.landing-membership .hc-plan-price strong{font-size:29px!important}

        .trust-section{padding:38px 22px 42px!important}.trust-shell{max-width:1280px!important}.trust-head{gap:36px!important;margin-bottom:16px!important}.trust-kicker{font-size:11.5px!important;margin-bottom:5px!important}.trust-head h2{font-size:clamp(1.9rem,2.35vw,2.5rem)!important}.trust-head p{font-size:13.5px!important;line-height:1.45!important}.trust-layout{gap:12px!important}.trust-story{min-height:350px!important;border-radius:20px!important;padding:21px!important}.trust-story h3{font-size:clamp(1.5rem,1.9vw,2rem)!important;margin:10px 0 7px!important}.trust-story p{font-size:12.3px!important;line-height:1.45!important}.trust-flow{margin-top:16px!important}.trust-card{min-height:160px!important;border-radius:16px!important;padding:15px!important}.trust-card h3{font-size:15px!important}.trust-card p{font-size:11.2px!important;line-height:1.42!important}.trust-foot{margin-top:11px!important;padding:10px 12px!important;font-size:10.8px!important}

        .final-photo-section{padding:40px 22px 34px!important}.final-photo{max-width:1280px!important;min-height:270px!important;border-radius:20px!important}.final-photo-copy{padding:34px 34px!important}.final-photo-kicker{font-size:11.5px!important;margin-bottom:7px!important}.final-photo h2{font-size:clamp(1.9rem,2.5vw,2.65rem)!important;margin-bottom:8px!important}.final-photo p{font-size:13.5px!important;line-height:1.45!important}.final-photo-actions{margin-top:15px!important}

        #my-health-story,#health-communities-story,#doctor-platform-story,#care-discovery,#knowledge-hub,#plans,#trust-privacy{scroll-margin-top:70px!important}
      }

      @media(min-width:1101px) and (max-height:820px){
        .hc-hero-canvas,.hc-hero-inner{min-height:455px!important}.hc-hero-inner{padding-top:28px!important;padding-bottom:26px!important}.hc-hero-title-wrap{height:100px!important}.hc-hero h1{font-size:clamp(2.3rem,2.8vw,3rem)!important}.hc-hero-copy p{font-size:14.8px!important}.care-discovery{padding-top:30px!important;padding-bottom:34px!important}.knowledge-section{padding-top:32px!important;padding-bottom:35px!important}.pn-cards{height:260px!important}.trust-section{padding-top:32px!important;padding-bottom:36px!important}.trust-story{min-height:325px!important}.trust-card{min-height:150px!important}.final-photo-section{padding-top:34px!important}.final-photo{min-height:250px!important}
      }

      .hc-section-rail{display:none}
      @media(min-width:1220px){
        .hc-section-rail{position:fixed;z-index:850;right:2px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;width:20px;padding:5px 0;border-radius:12px 0 0 12px;background:rgba(250,253,253,.82);border:1px solid rgba(196,216,219,.82);border-right:0;box-shadow:0 7px 18px rgba(19,61,74,.08);backdrop-filter:blur(10px);font-family:'DM Sans',Arial,sans-serif;color:#55727E}
        .hc-rail-arrow{width:18px;height:20px;border:0;background:transparent;border-radius:6px;color:#66828D;font-size:11px;cursor:pointer;display:grid;place-items:center;padding:0}.hc-rail-arrow:hover{background:#E8F6F3;color:#087D72}.hc-rail-arrow:disabled{opacity:.2;cursor:default}.hc-rail-arrow:focus-visible,.hc-rail-dot:focus-visible{outline:2px solid #0B8F7C;outline-offset:1px}
        .hc-rail-count{font-size:6.7px;font-weight:900;color:#78909B;margin:1px 0 3px;font-variant-numeric:tabular-nums;line-height:1}
        .hc-section-dots{position:relative;display:flex;flex-direction:column;align-items:center;padding:2px 0}.hc-section-dots:before{content:'';position:absolute;top:8px;bottom:8px;width:1px;background:#D7E5E6}
        .hc-rail-dot{position:relative;z-index:2;width:18px;height:18px;border:0;background:transparent;cursor:pointer;display:grid;place-items:center;padding:0}.hc-rail-dot:before{content:'';width:4px;height:4px;border-radius:50%;background:#B7CCCF;border:1px solid #fff;box-shadow:0 0 0 1px #C7DADB;transition:width .15s ease,height .15s ease,background .15s ease,box-shadow .15s ease}.hc-rail-dot.active:before{width:7px;height:7px;background:#0B948B;box-shadow:0 0 0 2px #DDF5F1}.hc-rail-dot:hover:before{background:#4FAFA6}
      }
      @media(max-width:1219px){.hc-section-rail{display:none!important}}
      @media(prefers-reduced-motion:reduce){.hc-section-rail *,.hc-public-nav{transition:none!important}}
    `}</style>

    <nav className="hc-section-rail" aria-label="Landing page sections">
      <button type="button" className="hc-rail-arrow" disabled={active===0} aria-label="Previous section" onClick={()=>scrollToIndex(active-1)}>↑</button>
      <div className="hc-rail-count" aria-live="polite">{String(active+1).padStart(2,'0')}/{String(SECTIONS.length).padStart(2,'0')}</div>
      <div className="hc-section-dots">{SECTIONS.map((section,index)=><button key={section.label} type="button" className={`hc-rail-dot ${active===index?'active':''}`} aria-label={`Go to ${section.label}`} aria-current={active===index?'step':undefined} title={section.label} onClick={()=>scrollToIndex(index)}/>)}</div>
      <button type="button" className="hc-rail-arrow" disabled={active===SECTIONS.length-1} aria-label="Next section" onClick={()=>scrollToIndex(active+1)}>↓</button>
    </nav>
  </>;
}
