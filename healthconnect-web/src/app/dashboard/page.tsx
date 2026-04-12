'use client';
import { useEffect } from 'react';
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

export default function DashboardPage() {
  const { activePage, setActivePage, resetToHome } = useUIStore() as any;
  const user = useAuthStore(s => (s as any).user);
  const currentPage = activePage ?? 'home';

  // Fresh-login guard — reset to Home on first dashboard mount after login.
  // Uses a sessionStorage flag so it only fires once per login session,
  // not on every route change or browser-back navigation.
  useEffect(() => {
    if (!user) return;
    const loginKey = `hc_landed_${user.id ?? user.email}`;
    if (!sessionStorage.getItem(loginKey)) {
      // First time landing after this login — go to Home
      sessionStorage.setItem(loginKey, '1');
      resetToHome();
    }
  }, [user?.id]);

  // Read ?tab= from URL on mount — only for genuine external deep-links.
  // FIXED: Previously this ran on every mount including after login, causing
  // the dashboard to always land on whatever ?tab= was last in the URL (e.g.
  // my-health). Now we:
  //   1. Only honour ?tab= if the URL actually contains it right now.
  //   2. Always strip ?tab= immediately so it cannot persist across refreshes.
  //   3. On a fresh login (no ?tab= in URL), activePage stays at 'home'.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    // Always clean the URL — prevents stale ?tab= surviving a refresh
    if (window.location.search) {
      window.history.replaceState({}, '', '/dashboard');
    }
    const validPages = ['home','my-health','vitals','symptoms','medications',
      'therapies','appointments','find-doctors','communities',
      'profile','settings','consents','subscription'];
    // Only apply the tab if it was explicitly in the URL this load
    // AND we are not coming from a fresh login (fresh login sets activePage
    // to 'home' via uiStore.resetToHome() before redirecting to /dashboard)
    if (tab && validPages.includes(tab)) {
      setActivePage(tab);
    }
    // If no ?tab= → activePage stays at its current value ('home' for fresh login,
    // or whatever the user was on if they manually refreshed mid-session)
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
