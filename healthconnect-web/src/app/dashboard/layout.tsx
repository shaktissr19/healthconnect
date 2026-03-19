'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import DashboardErrorBoundary from '@/components/DashboardErrorBoundary';

const SIDEBAR_W      = 260;
const SIDEBAR_W_MINI = 72;
const TOPBAR_H       = 64;

// ── Blue light theme palette ───────────────────────────────────────────────
const BG_CONTENT = '#C8E0F4';   // main content background — blue, darker for contrast
const BG_LOADING = '#1B3B6F';   // loading screen stays dark (sidebar colour)

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router      = useRouter();
  const uiStore     = useUIStore() as any;
  const collapsed   = uiStore.sidebarOpen === false;
  const [authChecked, setAuthChecked] = useState(false);
  const hasRun      = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    const resolve = (s: any) => {
      if (s.isAuthenticated && s.user?.role === 'ADMIN')   router.replace('/admin-dashboard');
      else if (s.isAuthenticated && s.user?.role === 'DOCTOR') router.replace('/doctor-dashboard');
      else if (s.isAuthenticated && s.user?.role)          setAuthChecked(true);
      else router.replace('/');
    };
    const s = useAuthStore.getState() as any;
    if (s._hasHydrated) { resolve(s); return; }
    let settled = false;
    const unsub = (useAuthStore as any).subscribe((ns: any) => {
      if (settled) return;
      if (ns._hasHydrated) { settled = true; unsub(); clearTimeout(timer); resolve(ns); }
    });
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true; unsub(); resolve(useAuthStore.getState() as any);
    }, 1000);
    return () => { unsub(); clearTimeout(timer); };
  }, []);

  if (!authChecked) return (
    <div style={{ minHeight:'100vh', background: BG_LOADING, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
      <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#2E6BE6,#5B9CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#fff', fontFamily:'sans-serif', boxShadow:'0 0 20px rgba(0,0,0,0.2)' }}>HC</div>
      <div style={{ width:32, height:32, border:'3px solid rgba(255,255,255,0.3)', borderTop:'3px solid #5B9CF6', borderRadius:'50%', animation:'hcSpin 0.8s linear infinite' }}/>
      <p style={{ color:'rgba(255,255,255,0.8)', fontSize:13, fontFamily:'sans-serif', margin:0, fontWeight:600 }}>Loading your health dashboard…</p>
      <style>{`@keyframes hcSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const sidebarW = collapsed ? SIDEBAR_W_MINI : SIDEBAR_W;

  return (
    <DashboardErrorBoundary>
      {/* ── Reset globals.css dark defaults for dashboard only ── */}
      <style>{`
        /* Override globals.css dark body for dashboard */
        body {
          background: ${BG_CONTENT} !important;
          color: #0A1628 !important;
        }

        /* Topbar white background */
        .hc-tb {
          background: #FFFFFF !important;
          border-bottom: 1px solid #C8DFF0 !important;
          box-shadow: 0 1px 8px rgba(27,59,111,0.08) !important;
        }

        /* ── hc-main: all text defaults for light theme ── */
        #hc-main {
          color: #0A1628;
          font-family: 'Poppins', 'Nunito', sans-serif;
        }

        /* Reset ALL forced white text from old layout */
        #hc-main * {
          box-sizing: border-box;
        }

        /* Page titles — only those NOT inside a dark gradient card */
        #hc-main h1:not([style*="color:#fff"]):not([style*="color: #fff"]):not([style*="color:'#fff'"]):not([style*="color: #FFFFFF"]),
        #hc-main h2:not([style*="color:#fff"]):not([style*="color: #fff"]):not([style*="color:'#fff'"]):not([style*="color: #FFFFFF"]),
        #hc-main h3:not([style*="color:#fff"]):not([style*="color: #fff"]):not([style*="color:'#fff'"]):not([style*="color: #FFFFFF"]) {
          color: #0A1628 !important;
          font-family: 'Poppins', sans-serif !important;
        }

        /* Hero cards with dark bg — keep white text */
        #hc-main [style*="0D3349"] h1,
        #hc-main [style*="0D3349"] h2,
        #hc-main [style*="0D3349"] p,
        #hc-main [style*="0F4C6B"] h1,
        #hc-main [style*="0F4C6B"] p,
        #hc-main [style*="1A3A6B"] h1,
        #hc-main [style*="1A3A6B"] p,
        #hc-main [style*="0D2B4E"] h1,
        #hc-main [style*="0D2B4E"] p {
          color: #FFFFFF !important;
        }

        /* Tab bar buttons — blue active, slate inactive */
        #hc-main button[style*="border-bottom"] {
          color: #2C5282 !important;
          font-weight: 600 !important;
        }

        /* Section uppercase labels inside cards */
        #hc-main span[style*="textTransform"],
        #hc-main span[style*="text-transform"] {
          color: #0A1628 !important;
        }

        /* Card sub-labels (Overall, Scheduled etc.) */
        #hc-main span[style*="background: #F1F5F9"],
        #hc-main span[style*="background:#F1F5F9"],
        #hc-main span[style*="EBF4FF"],
        #hc-main span[style*="DBEAFE"] {
          color: #1A4A7A !important;
          background: #DBEAFE !important;
        }

        /* Card numbers */
        #hc-main div[style*="fontSize: 28"],
        #hc-main div[style*="fontSize:28"] {
          font-weight: 800 !important;
        }

        /* Card bottom labels */
        #hc-main div[style*="fontSize: 12"],
        #hc-main div[style*="fontSize:12"] {
          color: #1A365D !important;
        }

        /* Muted small text */
        #hc-main div[style*="fontSize: 10"],
        #hc-main div[style*="fontSize:10"],
        #hc-main span[style*="fontSize: 10"],
        #hc-main span[style*="fontSize:10"] {
          color: #2C5282 !important;
        }

        /* Empty state text */
        #hc-main div[style*="textAlign: center"] div,
        #hc-main div[style*="text-align: center"] div {
          color: #1A365D !important;
        }

        /* Tab icons only — don't force color on emoji */
        #hc-main button[style*="border-bottom"] span {
          font-size: 14px;
        }

        /* Scrollbar — blue tint */
        #hc-main ::-webkit-scrollbar { width: 4px; }
        #hc-main ::-webkit-scrollbar-thumb { background: rgba(27,59,111,0.15); border-radius: 2px; }
        #hc-main ::-webkit-scrollbar-thumb:hover { background: rgba(27,59,111,0.3); }

        /* ── Remove any residual dark green backgrounds ── */
        #hc-main [style*="background: #0F2D2A"],
        #hc-main [style*="background:#0F2D2A"],
        #hc-main [style*="background: #0B1E1C"],
        #hc-main [style*="background:#0B1E1C"] {
          background: ${BG_CONTENT} !important;
        }

        /* ── MyHealth tab bar fix ── */
        #hc-main .mh-tab-bar {
          background: #FFFFFF !important;
          border-bottom: 2px solid #C8DFF0 !important;
        }
      `}</style>

      <div style={{ minHeight:'100vh', background: BG_CONTENT }}>
        <Sidebar />
        <Topbar />
        <div style={{
          marginLeft: sidebarW,
          paddingTop: TOPBAR_H,
          minHeight: '100vh',
          background: BG_CONTENT,
          overflowX: 'hidden',
          border: 'none',
          outline: 'none',
          transition: 'margin-left 0.25s cubic-bezier(.4,0,.2,1)',
        }}>
          <main id="hc-main" style={{
            padding: '12px 24px 48px',
            maxWidth: 1200,
            margin: '0 auto',
            color: '#0A1628',
          }}>
            {children}
          </main>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
}
