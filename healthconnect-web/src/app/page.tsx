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

  if(!authChecked){
    return <div style={{minHeight:'100vh',background:'#F8FAFC',display:'grid',placeItems:'center'}}><div style={{width:38,height:38,border:'3px solid #CCFBF1',borderTopColor:'#0D9488',borderRadius:'50%',animation:'landingSpin .8s linear infinite'}}/><style>{`@keyframes landingSpin{to{transform:rotate(360deg)}}`}</style></div>;
  }

  return <>
    <PublicNavbar/>
    <style>{`
      .workspace-topbar span{font-size:12.5px!important;color:#506875!important}.workspace-nav span{font-size:12px!important;color:#405A68!important}.workspace-kpi{font-size:12px!important;color:#526B78!important}.workspace-kpi strong{font-size:22px!important}.workspace-timeline b{font-size:12.5px!important}.workspace-row{font-size:12px!important;color:#455F6D!important}.workspace-row em{color:#748A95!important}.workspace-rail-card b{font-size:12px!important}.workspace-rail-card span{font-size:12px!important;color:#4C6673!important}.continuity-node b{font-size:12px!important}.continuity-callout b{font-size:12.5px!important}.continuity-callout span{font-size:12px!important;color:#405B69!important}.community-phone-top span,.community-post-head span,.community-member span{font-size:11.5px!important;color:#655474!important}.community-post p,.community-member p,.community-moderation{font-size:12px!important;color:#44384E!important}.community-replies{font-size:11.5px!important}.doctor-desk-top span,.doctor-desk-kpi,.doctor-step b,.doctor-patient-row span,.doctor-patient-row strong{font-size:11.8px!important}.doctor-desk-kpi{color:#536D7F!important}
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
