'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PublicNavbar from '@/components/PublicNavbar';
import LandingHero from '@/components/landing/LandingHero';
import PlatformNumbers, { type PlatformStats } from '@/components/landing/PlatformNumbers';
import PlatformNumbersLegacy from '@/components/landing/PlatformNumbersLegacy';
import CommunityMyHealth from '@/components/landing/CommunityMyHealth';
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
      /* Keep the restored Section 2 exactly as the previous pictorial/count section.
         The newer six-module story remains below it, but now has its own visual band. */
      .landing-module-showcase .ps-section{
        background:linear-gradient(180deg,#ECF7F6 0%,#F2F7FC 52%,#EEF5FA 100%)!important;
        border-top:1px solid #D4E8E6;
        border-bottom:1px solid #D7E5EC;
      }
      .landing-module-showcase .ps-module{background:rgba(255,255,255,.82)!important}
      .landing-module-showcase .ps-stage{box-shadow:0 18px 42px rgba(34,77,94,.10)!important}

      /* Membership should read as a compact commercial band, not another oversized hero. */
      .landing-membership .hc-plans{
        background:linear-gradient(135deg,#E8F5F2 0%,#EEF5FB 52%,#F3F8F7 100%)!important;
        padding:48px 28px 52px!important;
        border-top:1px solid #D4E7E3;
        border-bottom:1px solid #D8E5EA;
      }
      .landing-membership .hc-plans-wrap{max-width:1120px!important}
      .landing-membership .hc-plans-head{
        grid-template-columns:minmax(0,1fr) minmax(280px,.65fr)!important;
        gap:44px!important;
        margin-bottom:22px!important;
      }
      .landing-membership .hc-plans h2{
        font-size:clamp(2.15rem,3.3vw,3.45rem)!important;
        max-width:650px!important;
      }
      .landing-membership .hc-plans-head p{font-size:14px!important;line-height:1.55!important}
      .landing-membership .hc-plan-grid{gap:16px!important}
      .landing-membership .hc-plan-card{
        border-radius:18px!important;
        padding:22px 24px 21px!important;
        box-shadow:0 10px 28px rgba(18,55,68,.07)!important;
      }
      .landing-membership .hc-plan-title{font-size:22px!important}
      .landing-membership .hc-plan-price{margin:12px 0 4px!important}
      .landing-membership .hc-plan-price strong{font-size:36px!important}
      .landing-membership .hc-plan-sub{font-size:12.5px!important;margin-bottom:12px!important}
      .landing-membership .hc-plan-list{margin-bottom:17px!important}
      .landing-membership .hc-plan-list li{padding:7px 0!important;font-size:12px!important}
      .landing-membership .hc-plan-btn{padding:11px 15px!important;font-size:12px!important}
      .landing-membership .hc-plan-note{margin-top:16px!important;padding:13px 16px!important}

      @media(max-width:850px){
        .landing-membership .hc-plans-head{grid-template-columns:1fr!important;gap:12px!important}
      }
    `}</style>
    <main>
      <LandingHero/>
      <PlatformNumbersLegacy stats={stats}/>
      <div className="landing-module-showcase"><PlatformNumbers stats={stats}/></div>
      <CommunityMyHealth/>
      <KnowledgeResources/>
      <div className="landing-membership"><MembershipPlans/></div>
      <TrustSection/>
      <FinalCTA/>
    </main>
    <Footer/>
    {(authModal==='login'||authModal==='register'||authModal==='forgot')&&<LandingAuthModal mode={authModal} onClose={closeAuthModal} onModeChange={(mode)=>openAuthModal(mode)}/>} 
  </>;
}
