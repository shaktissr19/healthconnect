'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const SECTIONS = [
  { label: 'Home', selector: '.hc-hero' },
  { label: 'My Health', selector: '#my-health-story' },
  { label: 'Communities', selector: '#health-communities-story' },
  { label: 'Doctor Platform', selector: '#doctor-platform-story' },
  { label: 'Find Care', selector: '#care-discovery' },
  { label: 'Knowledge', selector: '#knowledge-hub' },
  { label: 'Platform', selector: '.pn-section' },
  { label: 'Plans', selector: '#plans' },
  { label: 'Trust', selector: '#trust-privacy' },
  { label: 'Connect', selector: '.final-photo-section' },
] as const;

export default function LandingViewportSystem() {
  const [active, setActive] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const elements = useMemo(() => {
    if (typeof document === 'undefined') return [] as HTMLElement[];
    return SECTIONS.map(section => document.querySelector(section.selector) as HTMLElement | null)
      .filter((element): element is HTMLElement => Boolean(element));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const targets = SECTIONS.map(section => document.querySelector(section.selector) as HTMLElement | null);
    const visible = new Map<Element, number>();

    const choose = () => {
      let bestIndex = 0;
      let bestScore = -1;
      targets.forEach((element, index) => {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const viewportAnchor = window.innerHeight * 0.4;
        const containsAnchor = rect.top <= viewportAnchor && rect.bottom >= viewportAnchor;
        const distance = Math.abs(rect.top - viewportAnchor);
        const ratio = visible.get(element) ?? 0;
        const score = (containsAnchor ? 1000 : 0) + ratio * 100 - distance / 100;
        if (score > bestScore) {
          bestScore = score;
          bestIndex = index;
        }
      });
      setActive(bestIndex);
    };

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => visible.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0));
        choose();
      },
      { threshold: [0, 0.05, 0.15, 0.3, 0.55, 0.8], rootMargin: '-12% 0px -48% 0px' },
    );

    targets.forEach(element => element && observer.observe(element));
    const onScroll = () => window.requestAnimationFrame(choose);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    choose();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const safeIndex = Math.max(0, Math.min(SECTIONS.length - 1, index));
    const section = SECTIONS[safeIndex];
    const element = document.querySelector(section.selector) as HTMLElement | null;
    if (!element) return;
    const top = section.selector === '.hc-hero' ? 0 : element.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [reducedMotion]);

  return <>
    <style>{`
      :root{--hc-content:1180px;--hc-wide:1380px;--hc-immersive:1520px}

      /* Desktop proportion system. Mobile/tablet keep their component-specific layouts. */
      @media (min-width:1101px){
        .hc-public-nav{height:68px!important;transition:height .22s ease,box-shadow .2s ease,background .2s ease!important}
        .hc-public-nav.scrolled{height:64px!important}
        .hc-nav-inner{max-width:var(--hc-wide)!important;padding:0 26px!important}
        .hc-brand{margin-right:28px!important;gap:10px!important}
        .hc-brand-logo{width:40px!important;height:40px!important;border-radius:11px!important;font-size:13px!important}
        .hc-brand-copy strong{font-size:18.5px!important}.hc-brand-copy span{font-size:8px!important;margin-top:3px!important}
        .hc-nav-link{padding:21px 8px 19px!important;font-size:12px!important}.hc-nav-link:after{bottom:10px!important}
        .hc-signin,.hc-signup,.hc-dashboard-btn{padding:9px 15px!important}
        .hc-hero{padding-top:68px!important}.hc-hero-canvas{min-height:510px!important}
        .hc-hero-inner{max-width:1280px!important;min-height:510px!important;padding:40px 38px 38px!important}
        .hc-hero-copy{width:min(585px,45vw)!important}.hc-hero-welcome{font-size:19px!important;margin-bottom:10px!important}
        .hc-hero-eyebrow{margin-bottom:14px!important;font-size:12px!important}.hc-hero-title-wrap{height:118px!important}
        .hc-hero h1{font-size:clamp(2.55rem,3.2vw,3.45rem)!important;line-height:1.01!important}.hc-hero-copy p{font-size:16.5px!important;line-height:1.55!important;margin-top:14px!important}
        .hc-hero-actions{margin-top:19px!important}.hc-hero-btn{min-height:46px!important;padding:0 19px!important;font-size:13.5px!important}.hc-hero-trust{margin-top:17px!important;gap:16px!important}.hc-hero-trust span{font-size:12.3px!important}.hc-hero-dots{margin-top:13px!important}

        .journey-nav-wrap{max-width:var(--hc-wide)!important;padding:24px 24px 0!important}.journey-nav-title{font-size:12px!important;margin-bottom:10px!important}
        .journey-nav{padding:10px!important;border-radius:18px!important;gap:8px!important}.journey-pill{min-height:76px!important;border-radius:14px!important;padding:10px 11px!important;gap:9px!important}
        .journey-icon{width:36px!important;height:36px!important;border-radius:10px!important}.journey-pill b{font-size:13px!important}.journey-pill span:last-child{font-size:11px!important;margin-top:3px!important}

        .mh-section{padding:46px 22px 58px!important}.mh-shell{max-width:var(--hc-wide)!important}.mh-head{grid-template-columns:minmax(0,1.35fr) minmax(330px,.65fr)!important;gap:46px!important;margin-bottom:18px!important;padding:0 6px!important}
        .mh-kicker{font-size:12px!important;margin-bottom:7px!important}.mh-head h2{font-size:clamp(2.3rem,3vw,3.35rem)!important;line-height:1!important}.mh-head p{font-size:16px!important;line-height:1.5!important;margin-bottom:2px!important}
        .mh-canvas{aspect-ratio:auto!important;height:clamp(560px,62vh,660px)!important;border-radius:24px!important}
        .mh-left{left:2.7%!important;top:4.8%!important;width:39.5%!important}.mh-title{font-size:clamp(1.75rem,2.55vw,3rem)!important}.mh-subcopy{font-size:clamp(.76rem,.92vw,1rem)!important;line-height:1.47!important;margin:9px 0 12px!important}.mh-rule{margin-bottom:12px!important;height:3px!important}
        .mh-feature-grid{gap:9px!important}.mh-feature{padding:12px 11px!important;border-radius:15px!important}.mh-feature-icon{width:36px!important;height:36px!important;margin-bottom:7px!important}.mh-feature h3{font-size:clamp(.68rem,.78vw,.88rem)!important;margin-bottom:4px!important}.mh-feature p{font-size:clamp(.58rem,.65vw,.72rem)!important;line-height:1.36!important}
        .mh-score{left:44.3%!important;top:3%!important;width:13.5%!important;min-width:172px!important;padding:12px 13px 11px!important;border-radius:16px!important}.mh-score-head{font-size:11px!important}.mh-gauge{height:79px!important;margin:3px 0 0!important}.mh-gauge svg{width:104px!important;height:66px!important;top:9px!important}.mh-score-num{font-size:31px!important;margin-top:8px!important}.mh-score-row{padding:5px 0!important;font-size:9.7px!important}.mh-score-row b{font-size:9.5px!important}.mh-score-foot{padding-top:5px!important;font-size:9px!important}
        .mh-steps{right:2.5%!important;top:4%!important;width:16%!important;gap:9px!important}.mh-step{grid-template-columns:40px 1fr!important;gap:9px!important;min-height:44px!important}.mh-step-icon{width:40px!important;height:40px!important}.mh-step:not(:last-child):after{left:19px!important;top:39px!important;height:18px!important}.mh-step b{font-size:clamp(.63rem,.73vw,.8rem)!important;background:rgba(255,255,255,.74)!important;padding:4px 7px!important;border-radius:8px!important;text-shadow:none!important;box-shadow:0 3px 10px rgba(27,65,78,.05)!important}
        .mh-consult,.mh-community-card{top:54%!important;height:25%!important;border-radius:16px!important}.mh-consult-copy,.mh-community-copy{padding-top:13px!important;padding-bottom:50px!important}.mh-consult-copy h3,.mh-community-copy h3{margin-bottom:5px!important}.mh-community-note{margin-top:5px!important}.mh-action{bottom:12px!important;height:31px!important;width:98px!important;font-size:.62rem!important}
        .mh-bottom{bottom:1.2%!important;height:13.5%!important;border-radius:15px!important}.mh-bottom-item{padding:0 15px!important;grid-template-columns:38px 1fr!important;gap:9px!important}.mh-bottom-icon{width:38px!important;height:38px!important}.mh-bottom-item b{font-size:clamp(.62rem,.72vw,.8rem)!important}.mh-bottom-item span{font-size:clamp(.5rem,.57vw,.64rem)!important;margin-top:2px!important}

        .hc-community-showcase{padding:10px 22px 58px!important}.hc-community-shell{max-width:var(--hc-wide)!important}.hc-community-canvas{min-height:0!important;height:clamp(540px,59vh,620px)!important;border-radius:24px!important}
        .hc-community-left{width:48.5%!important;padding:36px 0 28px 42px!important}.hc-community-title{font-size:clamp(2rem,2.65vw,3rem)!important}.hc-community-intro{font-size:15px!important;line-height:1.48!important;margin-top:12px!important}.hc-community-rule{width:46px!important;height:3px!important;margin:15px 0!important}
        .hc-community-features{gap:9px!important;max-width:680px!important}.hc-community-feature{min-height:138px!important;border-radius:16px!important;padding:13px 12px!important}.hc-community-feature-icon{width:38px!important;height:38px!important;margin-bottom:7px!important}.hc-community-feature b{font-size:13.2px!important}.hc-community-feature span{font-size:11.1px!important;line-height:1.37!important;margin-top:5px!important}
        .hc-community-stats{left:44.2%!important;top:27px!important;width:174px!important;padding:11px 11px 9px!important;border-radius:15px!important}.hc-community-stats-head{font-size:10.8px!important}.hc-community-count{font-size:33px!important;margin:11px 0 1px!important}.hc-community-count-label{font-size:9.7px!important;margin-bottom:7px!important}.hc-community-stat-row{grid-template-columns:21px 1fr auto!important;gap:6px!important;padding:6px 0!important}.hc-community-stat-icon{width:21px!important;height:21px!important}.hc-community-stat-row b{font-size:10.5px!important}.hc-community-stat-row small{font-size:8.8px!important}.hc-community-live{font-size:8px!important;padding:3px 5px!important}.hc-community-explore{font-size:9.8px!important;margin-top:6px!important}
        .hc-community-badge{min-width:136px!important;max-width:172px!important;padding:7px 8px!important;border-radius:13px!important}.hc-community-badge-emoji{width:30px!important;height:30px!important;font-size:15px!important}.hc-community-badge b{font-size:9.9px!important}.hc-community-badge span{font-size:8.6px!important}.hc-community-note-card{width:210px!important;padding:10px 12px!important;bottom:16%!important}.hc-community-note-card b{font-size:11px!important}.hc-community-note-card span{font-size:9.8px!important}.hc-community-joinbar{min-height:70px!important;padding:9px 11px!important;grid-template-columns:40px 1fr auto!important}.hc-community-join-icon{width:38px!important;height:38px!important}.hc-community-joinbar span{font-size:9.8px!important}.hc-community-joinbtn{padding:9px 13px!important;font-size:10.8px!important}
        .hc-community-popular{margin-top:11px!important;border-radius:18px!important}

        .doctor-platform-section{padding:0 22px 58px!important}.doctor-platform-shell{max-width:var(--hc-wide)!important}.doctor-platform-head{grid-template-columns:minmax(0,1.25fr) minmax(340px,.62fr)!important;gap:46px!important;margin-bottom:18px!important}.doctor-platform-label{font-size:12px!important;margin-bottom:7px!important}.doctor-platform-head h2{font-size:clamp(2.15rem,2.75vw,3.1rem)!important}.doctor-platform-head p{font-size:15.5px!important;line-height:1.5!important}
        .doctor-platform-canvas{min-height:0!important;height:clamp(520px,58vh,590px)!important;border-radius:24px!important}.doctor-platform-copy{width:56%!important;padding:32px 0 28px 40px!important}.doctor-platform-eyebrow{font-size:11.8px!important;margin-bottom:7px!important}.doctor-platform-copy h3{font-size:clamp(1.75rem,2.25vw,2.55rem)!important;line-height:1.02!important;max-width:620px!important}.doctor-platform-intro{font-size:13.5px!important;line-height:1.48!important;margin:10px 0 12px!important;max-width:680px!important}.doctor-platform-rule{width:42px!important;height:3px!important;margin-bottom:12px!important}
        .doctor-feature-grid{grid-template-columns:repeat(3,1fr)!important;gap:8px!important;max-width:760px!important}.doctor-feature{min-height:94px!important;padding:10px 10px 9px!important;border-radius:14px!important}.doctor-feature-top{gap:7px!important}.doctor-feature-icon{width:32px!important;height:32px!important;border-radius:10px!important}.doctor-feature b{font-size:11.6px!important}.doctor-feature p{font-size:9.8px!important;line-height:1.34!important;margin-top:6px!important}.doctor-value-row{gap:8px!important;margin-top:8px!important;max-width:760px!important}.doctor-value{padding:9px 11px!important;border-radius:12px!important}.doctor-value strong{font-size:9.9px!important;margin-bottom:2px!important}.doctor-value span{font-size:9.9px!important;line-height:1.35!important}.doctor-platform-cta{margin-top:10px!important;padding:9px 14px!important;font-size:12px!important}.doctor-flow-card{right:2.2%!important;bottom:3.8%!important;width:41%!important;padding:11px 12px!important;border-radius:15px!important}.doctor-flow-card>strong{font-size:11.5px!important;margin-bottom:7px!important}.doctor-flow-step b{font-size:10.3px!important}.doctor-flow-step span{font-size:9px!important}.doctor-flow-arrow{font-size:14px!important}

        .care-discovery{padding:48px 22px 54px!important}.care-inner{max-width:1280px!important}.care-head{max-width:860px!important;margin-bottom:22px!important}.care-kicker{font-size:12px!important;margin-bottom:7px!important}.care-head h2{font-size:clamp(2rem,2.55vw,2.75rem)!important}.care-head p{font-size:14.5px!important;line-height:1.5!important;margin-top:10px!important}.care-grid{gap:17px!important}.care-card{border-radius:18px!important}.care-image{aspect-ratio:16/6.4!important}.care-body{padding:17px 19px 19px!important}.care-tag{font-size:11.5px!important;margin-bottom:5px!important}.care-body h3{font-size:20px!important;margin-bottom:6px!important}.care-body p{font-size:13px!important;line-height:1.48!important;margin-bottom:11px!important}.care-action{font-size:12.3px!important}

        .knowledge-section{padding:50px 22px 56px!important}.knowledge-inner{max-width:1280px!important}.knowledge-head{grid-template-columns:minmax(0,1.05fr) minmax(310px,.68fr)!important;gap:44px!important;margin-bottom:20px!important}.knowledge-kicker{font-size:12px!important;margin-bottom:6px!important}.knowledge-title{font-size:clamp(1.95rem,2.45vw,2.6rem)!important}.knowledge-head-right p{font-size:14px!important;line-height:1.5!important;margin-bottom:11px!important}.knowledge-all{padding:9px 13px!important;font-size:12px!important}.knowledge-arrow{width:35px!important;height:35px!important}.knowledge-grid{gap:15px!important}.knowledge-card{border-radius:16px!important}.knowledge-photo{aspect-ratio:16/7!important}.knowledge-body{padding:15px 16px 17px!important;min-height:174px!important}.knowledge-cat{font-size:10.5px!important;margin-bottom:7px!important;padding:4px 7px!important}.knowledge-card h3{font-size:16px!important;line-height:1.28!important;margin-bottom:7px!important}.knowledge-summary{font-size:12.2px!important;line-height:1.43!important;margin-bottom:12px!important}.knowledge-read{font-size:12px!important}.knowledge-disclaimer{margin-top:15px!important;padding:10px 13px!important;font-size:11.8px!important}

        .pn-section{padding:34px 0 32px!important}.pn-head{max-width:1280px!important;padding:0 34px 18px!important}.pn-kicker{font-size:12px!important;margin-bottom:6px!important}.pn-heading{font-size:clamp(1.95rem,2.45vw,2.65rem)!important}.pn-head p{font-size:12.8px!important;line-height:1.5!important}.pn-stage{padding:0 34px!important}.pn-cards{height:320px!important;max-width:1380px!important}.pn-col-txt{padding:17px 15px!important}.pn-exp-txt{padding:21px 26px!important}.pn-stat{font-size:31px!important}.pn-exp-stat{font-size:41px!important}.pn-exp-title{font-size:17px!important}.pn-exp-desc{font-size:12.2px!important;line-height:1.48!important;margin-bottom:11px!important}.pn-cta{padding:8px 13px!important;font-size:11px!important}

        .hc-plans{padding-top:36px!important;padding-bottom:40px!important}.hc-plans-wrap{max-width:1180px!important}.hc-plans h2{font-size:clamp(1.9rem,2.35vw,2.45rem)!important}

        .trust-section{padding:52px 22px 58px!important}.trust-shell{max-width:1280px!important}.trust-head{grid-template-columns:minmax(0,1fr) minmax(330px,.6fr)!important;gap:42px!important;margin-bottom:20px!important}.trust-kicker{font-size:12px!important;margin-bottom:6px!important}.trust-head h2{font-size:clamp(2rem,2.55vw,2.75rem)!important}.trust-head p{font-size:14.5px!important;line-height:1.5!important}.trust-layout{gap:14px!important}.trust-story{min-height:400px!important;border-radius:22px!important;padding:24px!important}.trust-story h3{font-size:clamp(1.65rem,2.05vw,2.2rem)!important;margin:13px 0 8px!important}.trust-story p{font-size:13px!important;line-height:1.5!important}.trust-flow{margin-top:20px!important;gap:7px!important}.trust-flow-step{grid-template-columns:36px 1fr!important;gap:9px!important;padding:9px 10px!important;border-radius:12px!important}.trust-flow-icon{width:34px!important;height:34px!important}.trust-flow-step b{font-size:11.2px!important}.trust-flow-step span{font-size:10px!important}.trust-story-note{margin-top:12px!important;padding-top:11px!important;font-size:10.3px!important}.trust-grid{gap:14px!important}.trust-card{min-height:190px!important;border-radius:18px!important;padding:17px!important}.trust-card-top{margin-bottom:12px!important}.trust-icon{width:43px!important;height:43px!important;border-radius:13px!important}.trust-tag{font-size:8.7px!important}.trust-card h3{font-size:16px!important;margin-bottom:6px!important}.trust-card p{font-size:11.8px!important;line-height:1.45!important}.trust-proof{padding-top:12px!important;font-size:10.2px!important}.trust-foot{margin-top:14px!important;padding:11px 13px!important;font-size:11.4px!important}

        .final-photo-section{padding:56px 22px 40px!important}.final-photo{max-width:1280px!important;min-height:300px!important;border-radius:22px!important}.final-photo-copy{padding:44px 40px!important}.final-photo-kicker{font-size:12px!important;margin-bottom:8px!important}.final-photo h2{font-size:clamp(2rem,2.7vw,2.9rem)!important;margin-bottom:9px!important}.final-photo p{font-size:14px!important;line-height:1.5!important}.final-photo-actions{margin-top:18px!important}.final-photo-primary,.final-photo-secondary{padding:10px 15px!important;font-size:12.5px!important}

        #my-health-story,#health-communities-story,#doctor-platform-story,#care-discovery,#knowledge-hub,#plans,#trust-privacy{scroll-margin-top:74px!important}
      }

      /* Common short-height laptops: 1366x768 and similar. */
      @media (min-width:1101px) and (max-height:820px){
        .hc-hero-canvas,.hc-hero-inner{min-height:470px!important}.hc-hero-inner{padding-top:32px!important;padding-bottom:30px!important}.hc-hero-title-wrap{height:108px!important}.hc-hero h1{font-size:clamp(2.4rem,3vw,3.2rem)!important}.hc-hero-copy p{font-size:15.5px!important}
        .journey-nav-wrap{padding-top:18px!important}.journey-pill{min-height:70px!important}
        .mh-section{padding-top:34px!important;padding-bottom:46px!important}.mh-head{margin-bottom:14px!important}.mh-head h2{font-size:clamp(2.15rem,2.8vw,3rem)!important}.mh-head p{font-size:15px!important}.mh-canvas{height:560px!important}.mh-feature{padding:10px!important}.mh-feature-icon{width:34px!important;height:34px!important}.mh-subcopy{margin-bottom:9px!important}.mh-rule{margin-bottom:9px!important}
        .hc-community-showcase{padding-bottom:46px!important}.hc-community-canvas{height:540px!important}.hc-community-left{padding-top:30px!important}.hc-community-feature{min-height:132px!important;padding:11px!important}.hc-community-feature-icon{width:35px!important;height:35px!important}.hc-community-stats{top:22px!important}
        .doctor-platform-section{padding-bottom:46px!important}.doctor-platform-head{margin-bottom:14px!important}.doctor-platform-canvas{height:520px!important}.doctor-platform-copy{padding-top:26px!important}.doctor-platform-copy h3{font-size:2rem!important}.doctor-platform-intro{margin:8px 0 10px!important}.doctor-feature{min-height:88px!important}.doctor-feature p{font-size:9.4px!important}.doctor-value{padding:8px 10px!important}.doctor-platform-cta{margin-top:8px!important}
        .care-discovery{padding-top:40px!important;padding-bottom:46px!important}.knowledge-section{padding-top:42px!important;padding-bottom:48px!important}.pn-section{padding-top:28px!important;padding-bottom:28px!important}.pn-cards{height:290px!important}
        .trust-section{padding-top:44px!important;padding-bottom:48px!important}.trust-story{min-height:370px!important}.trust-card{min-height:178px!important}.final-photo-section{padding-top:46px!important}.final-photo{min-height:280px!important}.final-photo-copy{padding-top:36px!important;padding-bottom:36px!important}
      }

      @media (min-width:1101px) and (max-height:720px){
        .hc-public-nav{height:64px!important}.hc-public-nav.scrolled{height:60px!important}.hc-hero{padding-top:64px!important}.hc-hero-canvas,.hc-hero-inner{min-height:440px!important}.hc-hero-inner{padding-top:26px!important;padding-bottom:24px!important}.hc-hero-title-wrap{height:100px!important}.hc-hero h1{font-size:2.85rem!important}.hc-hero-welcome{font-size:17px!important}.hc-hero-copy p{font-size:15px!important}.hc-hero-btn{min-height:42px!important}.hc-hero-trust{margin-top:13px!important}.hc-hero-dots{margin-top:10px!important}
        .journey-nav-wrap{padding-top:14px!important}.journey-nav-title{margin-bottom:7px!important}.journey-pill{min-height:64px!important}.journey-icon{width:32px!important;height:32px!important}.journey-pill b{font-size:12px!important}.journey-pill span:last-child{font-size:10px!important}
        .mh-section{padding-top:28px!important;padding-bottom:38px!important}.mh-canvas{height:535px!important}.mh-head h2{font-size:2.7rem!important}.mh-head p{font-size:14px!important}
        .hc-community-canvas{height:515px!important}.hc-community-title{font-size:2.55rem!important}.hc-community-intro{font-size:14px!important}.hc-community-feature{min-height:125px!important}
        .doctor-platform-canvas{height:500px!important}.doctor-feature{min-height:82px!important}.doctor-feature p{line-height:1.28!important}.doctor-flow-card{bottom:3%!important}
        .care-discovery{padding-top:34px!important;padding-bottom:40px!important}.care-head{margin-bottom:17px!important}.knowledge-section{padding-top:36px!important;padding-bottom:42px!important}.knowledge-head{margin-bottom:16px!important}.knowledge-photo{aspect-ratio:16/6.5!important}.knowledge-body{min-height:158px!important}.pn-cards{height:270px!important}.trust-section{padding-top:36px!important;padding-bottom:42px!important}.trust-head{margin-bottom:16px!important}.trust-story{min-height:350px!important}.trust-card{min-height:166px!important}.final-photo-section{padding-top:38px!important;padding-bottom:32px!important}.final-photo{min-height:260px!important}
      }

      .hc-section-rail{display:none}
      @media (min-width:1220px){
        .hc-section-rail{position:fixed;z-index:850;right:12px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;width:42px;padding:7px 5px;border-radius:18px;background:rgba(255,255,255,.84);border:1px solid rgba(195,215,219,.88);box-shadow:0 10px 28px rgba(19,61,74,.12);backdrop-filter:blur(12px);font-family:'DM Sans',Arial,sans-serif;color:#46606F}
        .hc-rail-arrow{width:28px;height:25px;border:0;background:transparent;border-radius:8px;color:#5C7481;font-size:15px;cursor:pointer;display:grid;place-items:center}.hc-rail-arrow:hover{background:#E8F6F3;color:#087D72}.hc-rail-arrow:disabled{opacity:.24;cursor:default}.hc-rail-arrow:focus-visible,.hc-rail-dot:focus-visible{outline:2px solid #0B8F7C;outline-offset:2px}
        .hc-rail-count{font-size:8px;font-weight:900;letter-spacing:.03em;color:#78909B;margin:2px 0 4px;font-variant-numeric:tabular-nums}
        .hc-section-dots{position:relative;display:flex;flex-direction:column;align-items:center;padding:3px 0}.hc-section-dots:before{content:'';position:absolute;top:12px;bottom:12px;width:1px;background:#D6E5E6}
        .hc-rail-dot{position:relative;z-index:2;width:30px;height:23px;border:0;background:transparent;cursor:pointer;display:grid;place-items:center;padding:0}.hc-rail-dot:before{content:'';width:7px;height:7px;border-radius:50%;background:#B8CCCF;border:2px solid rgba(255,255,255,.96);box-shadow:0 0 0 1px #C7DADB;transition:width .16s ease,height .16s ease,background .16s ease,box-shadow .16s ease}.hc-rail-dot.active:before{width:10px;height:10px;background:#0B948B;box-shadow:0 0 0 3px #DDF5F1}
        .hc-rail-label{position:absolute;right:34px;top:50%;transform:translateY(-50%) translateX(5px);opacity:0;pointer-events:none;white-space:nowrap;background:#0B3F45;color:#fff;border-radius:8px;padding:5px 8px;font-size:9.5px;font-weight:800;box-shadow:0 5px 14px rgba(11,63,69,.18);transition:opacity .15s ease,transform .15s ease}.hc-rail-dot:hover .hc-rail-label,.hc-rail-dot:focus-visible .hc-rail-label,.hc-rail-dot.active .hc-rail-label{opacity:1;transform:translateY(-50%) translateX(0)}
      }
      @media (max-width:1219px){.hc-section-rail{display:none!important}}
      @media (prefers-reduced-motion:reduce){.hc-section-rail *, .hc-public-nav{transition:none!important}}
    `}</style>

    <nav className="hc-section-rail" aria-label="Landing page sections">
      <button type="button" className="hc-rail-arrow" disabled={active === 0} aria-label="Previous section" onClick={() => scrollToIndex(active - 1)}>↑</button>
      <div className="hc-rail-count" aria-live="polite">{String(active + 1).padStart(2, '0')} / {String(SECTIONS.length).padStart(2, '0')}</div>
      <div className="hc-section-dots">
        {SECTIONS.map((section, index) => <button
          key={section.label}
          type="button"
          className={`hc-rail-dot ${active === index ? 'active' : ''}`}
          aria-label={`Go to ${section.label}`}
          aria-current={active === index ? 'step' : undefined}
          onClick={() => scrollToIndex(index)}
        ><span className="hc-rail-label">{section.label}</span></button>)}
      </div>
      <button type="button" className="hc-rail-arrow" disabled={active === SECTIONS.length - 1} aria-label="Next section" onClick={() => scrollToIndex(active + 1)}>↓</button>
    </nav>
  </>;
}
