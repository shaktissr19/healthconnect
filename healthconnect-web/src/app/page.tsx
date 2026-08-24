'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PublicNavbar from '@/components/PublicNavbar';
import LandingHero from '@/components/landing/LandingHero';
import PlatformNumbersLegacy, { type PlatformStats } from '@/components/landing/PlatformNumbersLegacy';
import AudienceJourneys from '@/components/landing/AudienceJourneys';
import CommunityBenefits from '@/components/landing/CommunityBenefits';
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
      /* Commercial content should remain present without becoming another hero-sized section. */
      .landing-membership .hc-plans{
        background:linear-gradient(135deg,#EAF7F4 0%,#EEF5FB 54%,#F7F5FC 100%)!important;
        padding:34px 28px 38px!important;
        border-top:1px solid #D6E8E4;
        border-bottom:1px solid #DCE5EC;
      }
      .landing-membership .hc-plans-wrap{max-width:1120px!important}
      .landing-membership .hc-plans-head{
        grid-template-columns:minmax(0,1fr) minmax(290px,.62fr)!important;
        gap:34px!important;
        margin-bottom:16px!important;
      }
      .landing-membership .hc-plans-kicker{margin-bottom:7px!important;font-size:9px!important}
      .landing-membership .hc-plans h2{
        font-size:clamp(1.9rem,2.7vw,2.75rem)!important;
        max-width:620px!important;
      }
      .landing-membership .hc-plans-head p{font-size:12.5px!important;line-height:1.5!important}
      .landing-membership .hc-plan-grid{gap:14px!important}
      .landing-membership .hc-plan-card{
        border-radius:16px!important;
        padding:17px 20px 17px!important;
        box-shadow:0 8px 22px rgba(18,55,68,.06)!important;
      }
      .landing-membership .hc-plan-role{font-size:8px!important;margin-bottom:5px!important}
      .landing-membership .hc-plan-title{font-size:19px!important}
      .landing-membership .hc-plan-price{margin:8px 0 2px!important}
      .landing-membership .hc-plan-price strong{font-size:30px!important}
      .landing-membership .hc-plan-price span{font-size:11px!important}
      .landing-membership .hc-plan-sub{font-size:11px!important;margin-bottom:8px!important}
      .landing-membership .hc-plan-list{margin-bottom:11px!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:0 12px!important}
      .landing-membership .hc-plan-list li{padding:5px 0!important;font-size:10px!important;border-bottom:0!important}
      .landing-membership .hc-plan-list li:before{width:17px!important;height:17px!important;flex-basis:17px!important;font-size:8px!important}
      .landing-membership .hc-plan-btn{padding:9px 13px!important;font-size:10.5px!important;border-radius:9px!important}
      .landing-membership .hc-plan-note{margin-top:11px!important;padding:10px 13px!important;border-radius:11px!important;font-size:10.5px!important}
      @media(max-width:850px){
        .landing-membership .hc-plans-head{grid-template-columns:1fr!important;gap:8px!important}
        .landing-membership .hc-plan-list{grid-template-columns:1fr!important}
      }
    `}</style>
    <main>
      <LandingHero/>
      <AudienceJourneys/>
      <CommunityBenefits/>
      <PlatformNumbersLegacy stats={stats}/>
      <KnowledgeResources/>
      <div className="landing-membership"><MembershipPlans/></div>
      <TrustSection/>
      <FinalCTA/>
    </main>
    <Footer/>
    {(authModal==='login'||authModal==='register'||authModal==='forgot')&&<LandingAuthModal mode={authModal} onClose={closeAuthModal} onModeChange={(mode)=>openAuthModal(mode)}/>} 
  </>;
}
