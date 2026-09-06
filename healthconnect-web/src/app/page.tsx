'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PublicNavbar from '@/components/PublicNavbar';
import LandingHero from '@/components/landing/LandingHero';
import PlatformNumbersLegacy, { type PlatformStats } from '@/components/landing/PlatformNumbersLegacy';
import AudienceJourneys from '@/components/landing/AudienceJourneys';
import HealthCommunitiesShowcase from '@/components/landing/HealthCommunitiesShowcase';
import CommunityBenefits from '@/components/landing/CommunityBenefits';
import CareDiscoveryStrip from '@/components/landing/CareDiscoveryStrip';
import KnowledgeResources from '@/components/landing/KnowledgeResources';
import MembershipPlans from '@/components/landing/MembershipPlans';
import TrustSection from '@/components/landing/TrustSection';
import FinalCTA from '@/components/landing/FinalCTA';
import Footer from '@/components/landing/Footer';
import LandingAuthModal, { type LandingAuthMode } from '@/components/landing/LandingAuthModal';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const EMPTY_STATS: PlatformStats = { patients:null, doctors:null, communities:null, hospitals:null };

function getDashboardRoute(role?: string): string {
  switch (String(role ?? '').toUpperCase()) {
    case 'ADMIN': return '/admin-dashboard';
    case 'DOCTOR': return '/doctor-dashboard';
    case 'HOSPITAL': return '/hospital-dashboard';
    default: return '/dashboard';
  }
}

export default function LandingPage(){
  const router = useRouter();
  const { authModal, openAuthModal, closeAuthModal } = useUIStore() as any;
  const [authChecked,setAuthChecked] = useState(false);
  const [stats,setStats] = useState<PlatformStats>(EMPTY_STATS);

  useEffect(()=>{
    let active = true;
    const load = async() => {
      try{
        const response:any = await api.get('/public/stats');
        const data = response?.data?.data ?? response?.data ?? {};
        if(!active) return;
        setStats({
          patients: Number.isFinite(Number(data.patients)) ? Number(data.patients) : null,
          doctors: Number.isFinite(Number(data.doctors)) ? Number(data.doctors) : null,
          communities: Number.isFinite(Number(data.communities)) ? Number(data.communities) : null,
          hospitals: Number.isFinite(Number(data.hospitals)) ? Number(data.hospitals) : null,
        });
      }catch{ if(active) setStats(EMPTY_STATS); }
    };
    void load();
    return()=>{active=false};
  },[]);

  useEffect(()=>{
    let done = false;
    const resolve = (state:any) => {
      if(done || !state._hasHydrated) return;
      done = true;
      const params = new URLSearchParams(window.location.search);
      const home = params.get('home') === '1';
      const requestedAuth = params.get('auth') as LandingAuthMode | null;

      if(requestedAuth && ['login','register','forgot'].includes(requestedAuth)){
        openAuthModal(requestedAuth);
        params.delete('auth');
        const query = params.toString();
        window.history.replaceState({},'',`${window.location.pathname}${query?`?${query}`:''}${window.location.hash}`);
      }

      if(state.isAuthenticated && state.user?.role && !home){
        router.replace(getDashboardRoute(state.user.role));
        return;
      }
      setAuthChecked(true);
    };

    resolve(useAuthStore.getState() as any);
    if(done) return;
    const unsub = (useAuthStore as any).subscribe((state:any)=>resolve(state));
    return()=>{done=true;unsub()};
  },[router,openAuthModal]);

  useEffect(()=>{
    if(!authChecked) return;
    if(window.location.hash==='#signup') openAuthModal('register');
  },[authChecked,openAuthModal]);

  useEffect(()=>{
    const getOpenInfoButtons=()=>Array.from(document.querySelectorAll<HTMLButtonElement>('button[aria-expanded="true"][class*="info"]'));

    const closeOnOutside=(event:PointerEvent)=>{
      const target=event.target as Node | null;
      getOpenInfoButtons().forEach(button=>{
        const wrapper=button.closest('[class*="info-wrap"]') ?? button.parentElement;
        if(!wrapper?.contains(target)) button.click();
      });
    };

    const closeOnEscape=(event:KeyboardEvent)=>{
      if(event.key!=='Escape') return;
      getOpenInfoButtons().forEach(button=>button.click());
    };

    document.addEventListener('pointerdown',closeOnOutside);
    document.addEventListener('keydown',closeOnEscape);
    return()=>{
      document.removeEventListener('pointerdown',closeOnOutside);
      document.removeEventListener('keydown',closeOnEscape);
    };
  },[]);

  if(!authChecked){
    return <div style={{minHeight:'100vh',background:'#F8FAFC',display:'grid',placeItems:'center'}}><div style={{width:38,height:38,border:'3px solid #CCFBF1',borderTopColor:'#0D9488',borderRadius:'50%',animation:'landingSpin .8s linear infinite'}}/><style>{`@keyframes landingSpin{to{transform:rotate(360deg)}}`}</style></div>;
  }

  return <>
    <PublicNavbar/>
    <style>{`
      .workspace-topbar span{font-size:12.5px!important;color:#506875!important}.workspace-nav span{font-size:12px!important;color:#405A68!important}.workspace-kpi{font-size:12px!important;color:#526B78!important}.workspace-kpi strong{font-size:22px!important}.workspace-timeline b{font-size:12.5px!important}.workspace-row{font-size:12px!important;color:#455F6D!important}.workspace-row em{color:#748A95!important}.workspace-rail-card b{font-size:12px!important}.workspace-rail-card span{font-size:12px!important;color:#4C6673!important}.continuity-node b{font-size:12px!important}.continuity-callout b{font-size:12.5px!important}.continuity-callout span{font-size:12px!important;color:#405B69!important}.community-phone-top span,.community-post-head span,.community-member span{font-size:11.5px!important;color:#655474!important}.community-post p,.community-member p,.community-moderation{font-size:12px!important;color:#44384E!important}.community-replies{font-size:11.5px!important}.doctor-desk-top span,.doctor-desk-kpi,.doctor-step b,.doctor-patient-row span,.doctor-patient-row strong{font-size:11.8px!important}.doctor-desk-kpi{color:#536D7F!important}

      .hc-hero h1{font-size:clamp(2.6rem,3.45vw,3.7rem)!important}
      .mh-head h2{font-size:clamp(2.4rem,3.55vw,4.05rem)!important}
      .hc-community-title{font-size:clamp(2.2rem,3vw,3.55rem)!important}
      .doctor-platform-head h2{font-size:clamp(2.35rem,3.2vw,3.7rem)!important}
      .care-head h2{font-size:clamp(2rem,2.85vw,3.05rem)!important}
      .knowledge-title{font-size:clamp(1.95rem,2.7vw,2.85rem)!important}

      .hc-community-popover{width:182px!important;right:-2px!important;left:auto!important;top:31px!important;padding:10px 11px!important;border-radius:11px!important;font-size:10.6px!important;line-height:1.4!important}
      .hc-community-popover b{font-size:11.3px!important;margin-bottom:3px!important}

      @media(min-width:981px){
        .hc-community-photo-wrap{width:60%!important}
        .hc-community-photo{position:absolute!important;right:0!important;top:50%!important;width:auto!important;height:84%!important;max-width:none!important;object-fit:contain!important;object-position:right center!important;transform:translateY(-50%)!important}
        .hc-community-photo-shade{background:linear-gradient(90deg,rgba(244,251,250,.98) 0%,rgba(244,251,250,.72) 15%,rgba(244,251,250,.22) 30%,rgba(244,251,250,0) 50%)!important}

        .hc-community-stats{left:47.5%!important;top:31px!important;width:192px!important;padding:14px 14px 12px!important;border-radius:17px!important}
        .hc-community-stats-head{font-size:11.8px!important}
        .hc-community-info{width:23px!important;height:23px!important}
        .hc-community-count{font-size:37px!important;margin:14px 0 1px!important}
        .hc-community-count-label{font-size:10.8px!important;margin-bottom:9px!important}
        .hc-community-stat-row{grid-template-columns:22px 1fr auto!important;gap:6px!important;padding:7px 0!important}
        .hc-community-stat-icon{width:22px!important;height:22px!important}
        .hc-community-stat-row b{font-size:11.4px!important}
        .hc-community-stat-row small{font-size:9.3px!important;margin-top:1px!important}
        .hc-community-live{font-size:8.8px!important;padding:3px 6px!important}
        .hc-community-explore{font-size:10.7px!important;margin-top:8px!important}

        .hc-community-badge{min-width:150px!important;max-width:190px!important;padding:8px 10px!important;gap:7px!important}
        .hc-community-badge-emoji{width:34px!important;height:34px!important;font-size:17px!important}
        .hc-community-badge:nth-of-type(1){right:24%!important;top:11%!important}
        .hc-community-badge:nth-of-type(2){right:2.2%!important;top:15%!important}
        .hc-community-badge:nth-of-type(3){right:2.2%!important;top:39%!important}
        .hc-community-badge:nth-of-type(4){right:4%!important;top:64%!important}
      }

      .landing-membership .hc-plans{background:linear-gradient(135deg,#EAF7F4 0%,#EEF5FB 54%,#F7F5FC 100%)!important;padding:40px 28px 44px!important;border-top:1px solid #D6E8E4;border-bottom:1px solid #DCE5EC}.landing-membership .hc-plans-wrap{max-width:1160px!important}.landing-membership .hc-plans-head{grid-template-columns:minmax(0,1fr) minmax(300px,.62fr)!important;gap:34px!important;margin-bottom:19px!important}.landing-membership .hc-plans-kicker{margin-bottom:7px!important;font-size:13px!important}.landing-membership .hc-plans h2{font-size:clamp(1.9rem,2.6vw,2.65rem)!important;max-width:620px!important}.landing-membership .hc-plans-head p{font-size:14.5px!important;line-height:1.55!important}.landing-membership .hc-plan-grid{gap:14px!important}.landing-membership .hc-plan-card{border-radius:16px!important;padding:20px 22px!important;box-shadow:0 8px 22px rgba(18,55,68,.06)!important}.landing-membership .hc-plan-role{font-size:12.5px!important;margin-bottom:6px!important}.landing-membership .hc-plan-title{font-size:20px!important}.landing-membership .hc-plan-price{margin:8px 0 3px!important}.landing-membership .hc-plan-price strong{font-size:31px!important}.landing-membership .hc-plan-price span{font-size:13.5px!important}.landing-membership .hc-plan-sub{font-size:13.5px!important;margin-bottom:10px!important;line-height:1.45!important}.landing-membership .hc-plan-list{margin-bottom:13px!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:0 12px!important}.landing-membership .hc-plan-list li{padding:5px 0!important;font-size:13.5px!important;border-bottom:0!important;line-height:1.4!important}.landing-membership .hc-plan-list li:before{width:19px!important;height:19px!important;flex-basis:19px!important;font-size:11px!important}.landing-membership .hc-plan-btn{padding:10px 14px!important;font-size:13.5px!important;border-radius:9px!important}.landing-membership .hc-plan-note{margin-top:12px!important;padding:11px 13px!important;border-radius:11px!important;font-size:13.5px!important;line-height:1.5!important}@media(max-width:850px){.landing-membership .hc-plans-head{grid-template-columns:1fr!important;gap:8px!important}.landing-membership .hc-plan-list{grid-template-columns:1fr!important}}
    `}</style>
    <main>
      <LandingHero/>
      <AudienceJourneys/>
      <HealthCommunitiesShowcase/>
      <CommunityBenefits/>
      <CareDiscoveryStrip/>
      <KnowledgeResources/>
      <PlatformNumbersLegacy stats={stats}/>
      <div className="landing-membership" id="plans"><MembershipPlans/></div>
      <TrustSection/>
      <FinalCTA/>
    </main>
    <Footer/>
    {(authModal==='login'||authModal==='register'||authModal==='forgot')&&<LandingAuthModal mode={authModal} onClose={closeAuthModal} onModeChange={(mode)=>openAuthModal(mode)}/>} 
  </>;
}