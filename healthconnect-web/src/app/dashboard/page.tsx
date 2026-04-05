'use client';
import { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
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

export default function DashboardPage() {
  const { activePage, setActivePage } = useUIStore() as any;
  const currentPage = activePage ?? 'home';

  // Read ?tab= from URL on mount — allows direct linking to pages
  // e.g. /dashboard?tab=profile from navbar Profile click
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tab = new URLSearchParams(window.location.search).get('tab');
    const validPages = ['home','my-health','vitals','symptoms','medications',
      'therapies','appointments','find-doctors','communities',
      'profile','settings','consents','subscription'];
    if (tab && validPages.includes(tab)) {
      setActivePage(tab);
      // Clean the URL without triggering a navigation
      window.history.replaceState({}, '', '/dashboard');
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

  return <>{pages[currentPage] ?? <ComingSoon title="Coming Soon" />}</>;
}
