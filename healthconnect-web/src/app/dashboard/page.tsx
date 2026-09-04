'use client';
import { useEffect, useState } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import dynamic from 'next/dynamic';

const HomePage             = dynamic(() => import('@/components/dashboard/pages/HomePage'),                 { ssr: false });
const MyHealthPage         = dynamic(() => import('@/components/dashboard/pages/MyHealthPage'),             { ssr: false });
const VitalsPage           = dynamic(() => import('@/components/dashboard/pages/VitalsPage'),               { ssr: false });
const SymptomsPage         = dynamic(() => import('@/components/dashboard/pages/SymptomsPage'),             { ssr: false });
const MedicationsPage      = dynamic(() => import('@/components/dashboard/pages/MedicationsPage'),          { ssr: false });
const TherapiesPage        = dynamic(() => import('@/components/dashboard/pages/TherapiesPage'),            { ssr: false });
const AppointmentsPage     = dynamic(() => import('@/components/dashboard/pages/AppointmentsPage'),         { ssr: false });
const FindDoctorsLandingPage = dynamic(() => import('@/components/dashboard/pages/FindDoctorsLandingPage'), { ssr: false });
const CommunitiesPage      = dynamic(() => import('@/components/dashboard/pages/CommunitiesPage'),          { ssr: false });
const ProfilePage          = dynamic(() => import('@/components/dashboard/pages/ProfilePage'),              { ssr: false });
const SettingsPage         = dynamic(() => import('@/components/dashboard/pages/SettingsPage'),             { ssr: false });
const ConsentsPage         = dynamic(() => import('@/components/dashboard/pages/ConsentsPage'),             { ssr: false });
const SubscriptionPage     = dynamic(() => import('@/components/dashboard/pages/SubscriptionPage'),         { ssr: false });
const ComingSoon           = dynamic(() => import('@/components/dashboard/pages/ComingSoon'),               { ssr: false });

type MembershipReason = 'onboarding'|'required'|'expired'|'';

export default function DashboardPage() {
  const { activePage, setActivePage, resetToHome } = useUIStore() as any;
  const user = useAuthStore(s => (s as any).user);
  const currentPage = activePage ?? 'home';
  const [membershipReason,setMembershipReason] = useState<MembershipReason>('');

  useEffect(() => {
    if (!user) return;
    const loginKey = `hc_landed_${user.id ?? user.email}`;
    if (!sessionStorage.getItem(loginKey)) {
      sessionStorage.setItem(loginKey, '1');
      resetToHome();
    }
  }, [user?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const reason = (params.get('membership') || sessionStorage.getItem('hc_membership_notice') || '') as MembershipReason;
    if (reason) {
      setMembershipReason(reason);
      sessionStorage.removeItem('hc_membership_notice');
    }
    if (window.location.search) {
      window.history.replaceState({}, '', '/dashboard');
    }
    const validPages = ['home','my-health','vitals','symptoms','medications',
      'therapies','appointments','find-doctors','communities',
      'profile','settings','consents','subscription'];
    if (tab && validPages.includes(tab)) {
      setActivePage(tab);
    }
  }, []);

  const pages: Record<string, React.ReactNode> = {
    'home':         <HomePage />,
    'my-health':    <MyHealthPage />,
    'vitals':       <VitalsPage />,
    'symptoms':     <SymptomsPage />,
    'medications':  <MedicationsPage />,
    'therapies':    <TherapiesPage />,
    'appointments': <AppointmentsPage />,
    'find-doctors': <FindDoctorsLandingPage />,
    'communities':  <CommunitiesPage />,
    'profile':      <ProfilePage />,
    'settings':     <SettingsPage />,
    'consents':     <ConsentsPage />,
    'subscription': <SubscriptionPage />,
  };

  const notice = membershipReason === 'onboarding'
    ? 'Your Patient account is ready. Activate the membership you selected to continue into My Health.'
    : membershipReason === 'expired'
      ? 'Your HealthConnect Patient membership is no longer active. Renew a membership to continue using the private Patient workspace.'
      : membershipReason === 'required'
        ? 'You are signed in, but there is no active Patient membership on this account. Choose a membership to continue.'
        : '';

  return <>
    {notice && currentPage === 'subscription' && <div style={{maxWidth:1060,margin:'0 auto 16px',padding:'12px 15px',borderRadius:12,background:'#FFF7ED',border:'1px solid #FED7AA',color:'#9A3412',fontSize:12.5,lineHeight:1.5,fontWeight:650}}>{notice}</div>}
    {pages[currentPage] ?? <ComingSoon title="Coming Soon" />}
  </>;
}
