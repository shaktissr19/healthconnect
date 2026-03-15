'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import DashboardErrorBoundary from '@/components/DashboardErrorBoundary';

const SIDEBAR_W = 260; const SIDEBAR_W_MINI = 72; const TOPBAR_H = 64;


const BG = '#0F2D2A';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const uiStore = useUIStore() as any;
  const collapsed = uiStore.sidebarOpen === false;
  const [authChecked, setAuthChecked] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    const resolve = (s: any) => {
      if (s.isAuthenticated && s.user?.role === 'ADMIN') router.replace('/admin-dashboard');
      else if (s.isAuthenticated && s.user?.role === 'DOCTOR') router.replace('/doctor-dashboard');
      else if (s.isAuthenticated && s.user?.role) setAuthChecked(true);
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
    <div style={{ minHeight:'100vh', background: BG, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
      <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#0D9488,#0F766E)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#fff', fontFamily:'sans-serif', boxShadow:'0 0 20px rgba(0,0,0,0.15)' }}>HC</div>
      <div style={{ width:32, height:32, border:'3px solid rgba(255,255,255,0.5)', borderTop:'3px solid #0F766E', borderRadius:'50%', animation:'hcSpin 0.8s linear infinite' }}/>
      <p style={{ color:'rgba(255,255,255,0.8)', fontSize:13, fontFamily:'sans-serif', margin:0, fontWeight:600 }}>Loading your health dashboard…</p>
      <style>{`@keyframes hcSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const sidebarW = collapsed ? SIDEBAR_W_MINI : SIDEBAR_W;
  return (
    <DashboardErrorBoundary>
      <div style={{ minHeight:'100vh', background: BG }}>
        <Sidebar /><Topbar />
        <div style={{ marginLeft:sidebarW, paddingTop:TOPBAR_H, minHeight:'100vh', background: BG, overflowX:'hidden', transition:'margin-left 0.25s cubic-bezier(.4,0,.2,1)' }}>

          {/* ═══════════════════════════════════════════════════════════════
              GLOBAL PATIENT DASHBOARD TYPOGRAPHY SYSTEM
              Scoped to #hc-main — affects ALL patient pages uniformly.
              
              Rules are layered:
              1. Page-level elements (titles, subtitles, tab bars) — on teal bg
              2. Card internals — dark text on white bg
              3. Specific component patterns used across pages
              ═══════════════════════════════════════════════════════════════ */}
          <style>{`

            /* ── FONTS & BASE ─────────────────────────────────────────── */
            #hc-main * { box-sizing: border-box; }

            /* ── 1. PAGE TITLES (h1, h2 with emoji prefix) ───────────── */
            /* Sits directly on dark bg — white for visibility */
            #hc-main > div > div:first-child h1,
            #hc-main > div > div:first-child h2 {
              color: #FFFFFF !important;
              font-size: 26px !important;
              font-weight: 800 !important;
            }
            /* Subtitle line directly under page title */
            #hc-main > div > div:first-child h1 + p,
            #hc-main > div > div:first-child h2 + p,
            #hc-main > div > div:first-child p {
              color: rgba(255,255,255,0.7) !important;
              font-size: 14px !important;
              font-weight: 500 !important;
            }

            /* ── 2. TAB LABELS (Overview, Medical History, Reports Vault) */
            #hc-main [role="tab"],
            #hc-main button[style*="border-bottom"] {
              color: rgba(255,255,255,0.65) !important;
              font-size: 14px !important;
              font-weight: 600 !important;
            }
            #hc-main [role="tab"][aria-selected="true"],
            #hc-main [role="tab"].active {
              color: #2DD4BF !important;
              opacity: 1 !important;
              font-weight: 700 !important;
            }

            /* ── 3. FILTER PILLS (ALL, BLOOD TEST, XRAY etc.) ─────────── */
            /* White-outlined pills sitting on teal bg */
            #hc-main button[style*="border-radius: 100px"],
            #hc-main button[style*="borderRadius: 100"] {
              font-size: 13px !important;
              font-weight: 600 !important;
            }

            /* ── 4. CARD INTERNALS — enforce consistent text sizes ───── */

            /* Card section header labels (e.g. "NEXT APPOINTMENT", "MEDS TODAY") */
            #hc-main [style*="textTransform: uppercase"][style*="letterSpacing"],
            #hc-main [style*="text-transform: uppercase"][style*="letter-spacing"],
            #hc-main span[style*="textTransform:'uppercase'"],
            #hc-main span[style*="letterSpacing:'0.06em'"] {
              font-size: 13px !important;
              font-weight: 700 !important;
              color: #0F2D2A !important;
            }

            /* Vital type labels inside summary cards (BLOOD PRESSURE etc.) */
            #hc-main span[style*="textTransform"][style*="fontWeight"] {
              font-size: 13px !important;
              font-weight: 700 !important;
              color: #4B6E6A !important;
            }

            /* Card sub-labels: "Overall", "1 refill needed", "Scheduled" */
            #hc-main span[style*="background: #F1F5F9"],
            #hc-main span[style*="background:#F1F5F9"],
            #hc-main span[style*="background: rgb(241"] {
              font-size: 12px !important;
              font-weight: 600 !important;
              color: #4B6E6A !important;
              background: #E2EEF0 !important;
            }

            /* Card main values (numbers like 69, 3, 0) */
            #hc-main div[style*="fontSize: 28"],
            #hc-main div[style*="fontSize:28"] {
              font-size: 30px !important;
              font-weight: 800 !important;
            }

            /* Card bottom label text (Health Score, Active Medications) */
            #hc-main div[style*="fontSize: 12"][style*="color: #4B6E6A"],
            #hc-main div[style*="fontSize:12"][style*="color:#4B6E6A"] {
              font-size: 13px !important;
              font-weight: 600 !important;
              color: #0F2D2A !important;
            }

            /* Unit + normal range text in vital cards */
            #hc-main div[style*="fontSize: 10"],
            #hc-main div[style*="fontSize:10"] {
              font-size: 12px !important;
              font-weight: 500 !important;
              color: #4B6E6A !important;
            }

            /* Report list item titles (HbA1c Blood Test etc.) */
            #hc-main div[style*="fontSize: 14"][style*="fontWeight: 700"],
            #hc-main div[style*="fontSize:14"][style*="fontWeight:700"] {
              font-size: 15px !important;
            }

            /* Report list item subtitles (LAB · 26 Feb 2026) */
            #hc-main div[style*="fontSize: 12"][style*="color: #94"],
            #hc-main div[style*="fontSize:12"][style*="color:#94"],
            #hc-main div[style*="fontSize: 11"][style*="color: #94"],
            #hc-main div[style*="fontSize:11"][style*="color:#94"] {
              font-size: 13px !important;
              color: #4B6E6A !important;
            }

            /* ── 5. SECTION LABELS ON BG (not inside cards) ──────────── */
            #hc-main > div > div[style*="marginBottom"] > span[style*="uppercase"],
            #hc-main > div > div[style*="marginBottom: 24"] span[style*="uppercase"] {
              color: rgba(255,255,255,0.85) !important;
              font-size: 13px !important;
              font-weight: 700 !important;
            }

            /* ── 6. EMPTY STATE TEXT ──────────────────────────────────── */
            #hc-main div[style*="textAlign: center"] div[style*="fontWeight: 600"],
            #hc-main div[style*="text-align: center"] div[style*="font-weight: 600"] {
              color: #FFFFFF !important;
              font-size: 15px !important;
            }
            #hc-main div[style*="textAlign: center"] div[style*="fontSize: 13"],
            #hc-main div[style*="text-align: center"] div[style*="font-size: 13"] {
              color: rgba(255,255,255,0.6) !important;
            }

          `}</style>

          <main id="hc-main" style={{ padding:24 }}>{children}</main>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
}
