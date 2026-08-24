'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PublicNavbar from '@/components/PublicNavbar';
import LandingHero from '@/components/landing/LandingHero';
import PlatformNumbers, { type PlatformStats } from '@/components/landing/PlatformNumbers';
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
    <main>
      <LandingHero/>
      <PlatformNumbers stats={stats}/>
      <CommunityMyHealth/>
      <KnowledgeResources/>
      <MembershipPlans/>
      <TrustSection/>
      <FinalCTA/>
    </main>
    <Footer/>
    {(authModal==='login'||authModal==='register'||authModal==='forgot')&&<LandingAuthModal mode={authModal} onClose={closeAuthModal} onModeChange={(mode)=>openAuthModal(mode)}/>} 
  </>;
}
