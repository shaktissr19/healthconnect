'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import DoctorSidebar from '@/components/doctor/layout/DoctorSidebar';
import DoctorTopbar  from '@/components/doctor/layout/DoctorTopbar';

const SIDEBAR_W      = 268;
const SIDEBAR_W_MINI = 72;
const TOPBAR_H       = 64;

export default function DoctorDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const uiStore = useUIStore() as any;
  const collapsed = uiStore.sidebarOpen === false;
  const [authChecked, setAuthChecked] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const resolve = (s: any) => {
      if (s.isAuthenticated && s.user?.role === 'DOCTOR') {
        setAuthChecked(true);
      } else if (s.isAuthenticated && s.user?.role) {
        router.replace('/dashboard');
      } else {
        router.replace('/');
      }
    };

    const s = useAuthStore.getState() as any;

    if (s._hasHydrated) {
      resolve(s);
      return;
    }

    let settled = false;
    const unsub = (useAuthStore as any).subscribe((ns: any) => {
      if (settled) return;
      if (ns._hasHydrated) {
        settled = true;
        unsub();
        clearTimeout(timer);
        resolve(ns);
      }
    });

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      unsub();
      resolve(useAuthStore.getState() as any);
    }, 1000);

    return () => { unsub(); clearTimeout(timer); };
  }, []);

  const sidebarW = collapsed ? SIDEBAR_W_MINI : SIDEBAR_W;

  if (!authChecked) {
    return (
      <div style={{ minHeight:'100vh', background:'#E3EDEC', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
        <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#0D9488,#14B8A6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#fff', boxShadow:'0 0 30px rgba(13,148,136,0.25)', fontFamily:'sans-serif' }}>HC</div>
        <div style={{ width:32, height:32, border:'3px solid rgba(13,148,136,0.08)', borderTop:'3px solid #0D9488', borderRadius:'50%', animation:'drSpin 0.8s linear infinite' }}/>
        <p style={{ color:'#1C3045', fontSize:13, fontFamily:'sans-serif', margin:0 }}>Loading Doctor Portal…</p>
        <style>{`@keyframes drSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:'#E3EDEC' }}>
      <DoctorSidebar />
      <DoctorTopbar />
      <div style={{ marginLeft:sidebarW, paddingTop:TOPBAR_H, minHeight:'100vh', background:'#E3EDEC', overflowX:'hidden', transition:'margin-left 0.25s cubic-bezier(.4,0,.2,1)' }}>
        <main style={{ padding:24 }}>{children}</main>
      </div>
    </div>
  );
}
