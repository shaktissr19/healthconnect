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
    sync(); media.addEventListener?.('change',sync); return()=>media.removeEventListener?.('change',sync);
  },[]);

  useEffect(()=>{
    if(typeof window==='undefined')return;
    const targets=SECTIONS.map(section=>document.querySelector(section.selector) as HTMLElement|null);
    const visible=new Map<Element,number>();
    const choose=()=>{
      const anchor=window.innerHeight*.4; let best=0; let bestScore=-Infinity;
      targets.forEach((element,index)=>{if(!element)return;const rect=element.getBoundingClientRect();const contains=rect.top<=anchor&&rect.bottom>=anchor;const ratio=visible.get(element)??0;const score=(contains?1000:0)+(ratio*100)-(Math.abs(rect.top-anchor)/100);if(score>bestScore){bestScore=score;best=index}});
      setActive(best);
    };
    const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>visible.set(entry.target,entry.isIntersecting?entry.intersectionRatio:0));choose()},{threshold:[0,.05,.15,.3,.55,.8],rootMargin:'-12% 0px -48% 0px'});
    targets.forEach(element=>element&&observer.observe(element));
    let frame=0;const onScroll=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(choose)};
    window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onScroll);choose();
    return()=>{observer.disconnect();cancelAnimationFrame(frame);window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onScroll)};
  },[]);

  const scrollToIndex=useCallback((index:number)=>{
    const safe=Math.max(0,Math.min(SECTIONS.length-1,index));const section=SECTIONS[safe];const element=document.querySelector(section.selector) as HTMLElement|null;if(!element)return;
    const top=section.selector==='.hc-hero'?0:element.getBoundingClientRect().top+window.scrollY-68;
    window.scrollTo({top:Math.max(0,top),behavior:reducedMotion?'auto':'smooth'});
  },[reducedMotion]);

  return <>
    <style>{`
      :root{--hc-content:1180px;--hc-wide:1380px;--hc-immersive:1520px}
      @media(min-width:1101px){
        .hc-public-nav{height:68px!important;transition:height .22s ease,box-shadow .2s ease,background .2s ease!important}.hc-public-nav.scrolled{height:64px!important}.hc-nav-inner{max-width:var(--hc-wide)!important;padding:0 24px!important}.hc-brand{margin-right:26px!important;gap:9px!important}.hc-brand-logo{width:40px!important;height:40px!important;border-radius:11px!important;font-size:13px!important}.hc-brand-copy strong{font-size:18.5px!important}.hc-brand-copy span{font-size:8px!important;margin-top:3px!important}.hc-nav-link{padding:21px 8px 19px!important;font-size:12px!important}.hc-nav-link:after{bottom:10px!important}.hc-signin,.hc-signup,.hc-dashboard-btn{padding:9px 15px!important}
        .hc-hero{padding-top:68px!important}.hc-hero-canvas,.hc-hero-inner{min-height:500px!important}.hc-hero-inner{max-width:1280px!important;padding:36px 36px 34px!important}.hc-hero-copy{width:min(580px,45vw)!important}.hc-hero-welcome{font-size:18px!important;margin-bottom:9px!important}.hc-hero-eyebrow{margin-bottom:12px!important;font-size:11.5px!important}.hc-hero-title-wrap{height:112px!important}.hc-hero h1{font-size:clamp(2.5rem,3.1vw,3.35rem)!important;line-height:1.01!important}.hc-hero-copy p{font-size:16px!important;line-height:1.52!important;margin-top:12px!important}.hc-hero-actions{margin-top:17px!important}.hc-hero-btn{min-height:44px!important;padding:0 18px!important;font-size:13px!important}.hc-hero-trust{margin-top:15px!important;gap:15px!important}.hc-hero-trust span{font-size:12px!important}.hc-hero-dots{margin-top:11px!important}

        .care-discovery{padding:42px 22px 48px!important}.care-inner{max-width:1280px!important}.care-head{max-width:850px!important;margin-bottom:18px!important}.care-kicker{font-size:11.5px!important;margin-bottom:6px!important}.care-head h2{font-size:clamp(1.95rem,2.45vw,2.6rem)!important}.care-head p{font-size:14px!important;line-height:1.48!important;margin-top:8px!important}.care-grid{gap:15px!important}.care-card{border-radius:17px!important}.care-image{aspect-ratio:16/6!important}.care-body{padding:15px 17px 17px!important}.care-tag{font-size:11px!important;margin-bottom:4px!important}.care-body h3{font-size:19px!important;margin-bottom:5px!important}.care-body p{font-size:12.5px!important;line-height:1.45!important;margin-bottom:9px!important}.care-action{font-size:12px!important}

        .knowledge-section{padding:44px 22px 48px!important}.knowledge-inner{max-width:1280px!important}.knowledge-head{grid-template-columns:minmax(0,1.05fr) minmax(310px,.68fr)!important;gap:40px!important;margin-bottom:17px!important}.knowledge-kicker{font-size:11.5px!important;margin-bottom:5px!important}.knowledge-title{font-size:clamp(1.9rem,2.35vw,2.5rem)!important}.knowledge-head-right p{font-size:13.5px!important;line-height:1.48!important;margin-bottom:10px!important}.knowledge-all{padding:8px 12px!important;font-size:11.5px!important}.knowledge-arrow{width:33px!important;height:33px!important}.knowledge-grid{gap:13px!important}.knowledge-card{border-radius:15px!important}.knowledge-photo{aspect-ratio:16/6.5!important}.knowledge-body{padding:13px 15px 15px!important;min-height:160px!important}.knowledge-cat{font-size:10px!important;margin-bottom:6px!important;padding:4px 7px!important}.knowledge-card h3{font-size:15.5px!important;line-height:1.26!important;margin-bottom:6px!important}.knowledge-summary{font-size:11.8px!important;line-height:1.4!important;margin-bottom:10px!important}.knowledge-read{font-size:11.5px!important}.knowledge-disclaimer{margin-top:13px!important;padding:9px 12px!important;font-size:11.3px!important}

        .pn-section{padding:30px 0 28px!important}.pn-head{max-width:1280px!important;padding:0 30px 15px!important}.pn-kicker{font-size:11.5px!important;margin-bottom:5px!important}.pn-heading{font-size:clamp(1.9rem,2.35vw,2.5rem)!important}.pn-head p{font-size:12.5px!important;line-height:1.46!important}.pn-stage{padding:0 30px!important}.pn-cards{height:290px!important;max-width:1380px!important}.pn-col-txt{padding:15px 13px!important}.pn-exp-txt{padding:18px 22px!important}.pn-stat{font-size:29px!important}.pn-exp-stat{font-size:38px!important}.pn-exp-title{font-size:16px!important}.pn-exp-desc{font-size:11.8px!important;line-height:1.44!important;margin-bottom:9px!important}.pn-cta{padding:7px 12px!important;font-size:10.5px!important}

        .hc-plans{padding-top:32px!important;padding-bottom:36px!important}.hc-plans-wrap{max-width:1180px!important}.hc-plans h2{font-size:clamp(1.85rem,2.25vw,2.35rem)!important}
        .trust-section{padding:44px 22px 48px!important}.trust-shell{max-width:1280px!important}.trust-head{grid-template-columns:minmax(0,1fr) minmax(330px,.6fr)!important;gap:38px!important;margin-bottom:17px!important}.trust-kicker{font-size:11.5px!important;margin-bottom:5px!important}.trust-head h2{font-size:clamp(1.95rem,2.4vw,2.55rem)!important}.trust-head p{font-size:14px!important;line-height:1.48!important}.trust-layout{gap:12px!important}.trust-story{min-height:360px!important;border-radius:20px!important;padding:21px!important}.trust-story h3{font-size:clamp(1.55rem,1.95vw,2.05rem)!important;margin:11px 0 7px!important}.trust-story p{font-size:12.5px!important;line-height:1.46!important}.trust-flow{margin-top:16px!important;gap:6px!important}.trust-flow-step{grid-template-columns:33px 1fr!important;gap:8px!important;padding:8px 9px!important;border-radius:11px!important}.trust-flow-icon{width:32px!important;height:32px!important}.trust-flow-step b{font-size:10.8px!important}.trust-flow-step span{font-size:9.6px!important}.trust-story-note{margin-top:10px!important;padding-top:9px!important;font-size:9.9px!important}.trust-grid{gap:12px!important}.trust-card{min-height:168px!important;border-radius:16px!important;padding:15px!important}.trust-card-top{margin-bottom:10px!important}.trust-icon{width:40px!important;height:40px!important;border-radius:12px!important}.trust-tag{font-size:8.4px!important}.trust-card h3{font-size:15px!important;margin-bottom:5px!important}.trust-card p{font-size:11.3px!important;line-height:1.42!important}.trust-proof{padding-top:10px!important;font-size:9.8px!important}.trust-foot{margin-top:12px!important;padding:10px 12px!important;font-size:11px!important}
        .final-photo-section{padding:46px 22px 34px!important}.final-photo{max-width:1280px!important;min-height:280px!important;border-radius:20px!important}.final-photo-copy{padding:38px 36px!important}.final-photo-kicker{font-size:11.5px!important;margin-bottom:7px!important}.final-photo h2{font-size:clamp(1.9rem,2.55vw,2.7rem)!important;margin-bottom:8px!important}.final-photo p{font-size:13.5px!important;line-height:1.48!important}.final-photo-actions{margin-top:15px!important}.final-photo-primary,.final-photo-secondary{padding:9px 14px!important;font-size:12px!important}
        #my-health-story,#health-communities-story,#doctor-platform-story,#care-discovery,#knowledge-hub,#plans,#trust-privacy{scroll-margin-top:72px!important}
      }

      @media(min-width:1101px) and (max-height:820px){
        .hc-hero-canvas,.hc-hero-inner{min-height:455px!important}.hc-hero-inner{padding-top:28px!important;padding-bottom:27px!important}.hc-hero-title-wrap{height:102px!important}.hc-hero h1{font-size:clamp(2.3rem,2.8vw,3rem)!important}.hc-hero-copy p{font-size:15px!important}.care-discovery{padding-top:36px!important;padding-bottom:40px!important}.knowledge-section{padding-top:38px!important;padding-bottom:42px!important}.pn-section{padding-top:25px!important;padding-bottom:25px!important}.pn-cards{height:270px!important}.trust-section{padding-top:38px!important;padding-bottom:42px!important}.trust-story{min-height:340px!important}.trust-card{min-height:158px!important}.final-photo-section{padding-top:39px!important}.final-photo{min-height:260px!important}
      }
      @media(min-width:1101px) and (max-height:720px){.hc-public-nav{height:64px!important}.hc-public-nav.scrolled{height:60px!important}.hc-hero{padding-top:64px!important}.hc-hero-canvas,.hc-hero-inner{min-height:425px!important}.hc-hero-title-wrap{height:96px!important}.hc-hero h1{font-size:2.7rem!important}.pn-cards{height:250px!important}.trust-story{min-height:325px!important}.trust-card{min-height:150px!important}.final-photo{min-height:245px!important}}

      .hc-section-rail{display:none}
      @media(min-width:1220px){
        .hc-section-rail{position:fixed;z-index:850;right:12px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;width:42px;padding:7px 5px;border-radius:18px;background:rgba(255,255,255,.86);border:1px solid rgba(195,215,219,.9);box-shadow:0 10px 28px rgba(19,61,74,.12);backdrop-filter:blur(12px);font-family:'DM Sans',Arial,sans-serif;color:#46606F}.hc-rail-arrow{width:28px;height:25px;border:0;background:transparent;border-radius:8px;color:#5C7481;font-size:15px;cursor:pointer;display:grid;place-items:center}.hc-rail-arrow:hover{background:#E8F6F3;color:#087D72}.hc-rail-arrow:disabled{opacity:.24;cursor:default}.hc-rail-arrow:focus-visible,.hc-rail-dot:focus-visible{outline:2px solid #0B8F7C;outline-offset:2px}.hc-rail-count{font-size:8px;font-weight:900;letter-spacing:.03em;color:#78909B;margin:2px 0 4px;font-variant-numeric:tabular-nums}.hc-section-dots{position:relative;display:flex;flex-direction:column;align-items:center;padding:3px 0}.hc-section-dots:before{content:'';position:absolute;top:12px;bottom:12px;width:1px;background:#D6E5E6}.hc-rail-dot{position:relative;z-index:2;width:30px;height:23px;border:0;background:transparent;cursor:pointer;display:grid;place-items:center;padding:0}.hc-rail-dot:before{content:'';width:7px;height:7px;border-radius:50%;background:#B8CCCF;border:2px solid rgba(255,255,255,.96);box-shadow:0 0 0 1px #C7DADB;transition:.16s ease}.hc-rail-dot.active:before{width:10px;height:10px;background:#0B948B;box-shadow:0 0 0 3px #DDF5F1}.hc-rail-label{position:absolute;right:34px;top:50%;transform:translateY(-50%) translateX(5px);opacity:0;pointer-events:none;white-space:nowrap;background:#0B3F45;color:#fff;border-radius:8px;padding:5px 8px;font-size:9.5px;font-weight:800;box-shadow:0 5px 14px rgba(11,63,69,.18);transition:opacity .15s ease,transform .15s ease}.hc-rail-dot:hover .hc-rail-label,.hc-rail-dot:focus-visible .hc-rail-label,.hc-rail-dot.active .hc-rail-label{opacity:1;transform:translateY(-50%)}
      }
      @media(max-width:1219px){.hc-section-rail{display:none!important}}@media(prefers-reduced-motion:reduce){.hc-section-rail *,.hc-public-nav{transition:none!important}}
    `}</style>

    <nav className="hc-section-rail" aria-label="Landing page sections">
      <button type="button" className="hc-rail-arrow" disabled={active===0} aria-label="Previous section" onClick={()=>scrollToIndex(active-1)}>↑</button>
      <div className="hc-rail-count" aria-live="polite">{String(active+1).padStart(2,'0')} / {String(SECTIONS.length).padStart(2,'0')}</div>
      <div className="hc-section-dots">{SECTIONS.map((section,index)=><button key={section.label} type="button" className={`hc-rail-dot ${active===index?'active':''}`} aria-label={`Go to ${section.label}`} aria-current={active===index?'step':undefined} onClick={()=>scrollToIndex(index)}><span className="hc-rail-label">{section.label}</span></button>)}</div>
      <button type="button" className="hc-rail-arrow" disabled={active===SECTIONS.length-1} aria-label="Next section" onClick={()=>scrollToIndex(active+1)}>↓</button>
    </nav>
  </>;
}
