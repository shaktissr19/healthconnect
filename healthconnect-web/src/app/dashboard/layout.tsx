'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import DashboardErrorBoundary from '@/components/DashboardErrorBoundary';
import SessionTimeoutManager from '@/components/SessionTimeoutManager';
import EmailVerificationBanner from '@/components/dashboard/EmailVerificationBanner';

const SIDEBAR_W      = 268;
const SIDEBAR_W_MINI = 72;
const TOPBAR_H       = 64;

// ══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS — change here, applies everywhere across the patient dashboard
// ══════════════════════════════════════════════════════════════════════════════
const T = {
  // Backgrounds
  sidebarBg:      '#D8D6CF',   // sidebar warm greige — slightly darker for separation
  healthIdBg:     '#F5F4F0',   // health ID card (slightly lighter)
  topbarBg:       '#FDFCFB',   // topbar warm white
  pageBg:         '#F5F4F0',   // all page content background
  cardBg:         '#FDFCFB',   // cards lift off page bg
  loadingBg:      '#1E293B',   // loading screen (dark, neutral)

  // Borders
  border:         '#D3D1C7',   // all dividers and card borders
  borderLight:    '#E8E6DF',   // subtler borders

  // Blue accent (active states, logo, avatar, chips)
  blue:           '#2563EB',   // primary blue
  blueDark:       '#1849A9',   // darker blue for gradients
  blueWash:       'rgba(37,99,235,0.10)',  // active nav wash
  blueHover:      'rgba(37,99,235,0.06)', // hover nav wash
  blueChip:       '#EFF4FF',   // chip / health score chip bg

  // Text
  textPrimary:    '#1E293B',   // headings, names
  textSecondary:  '#374151',   // nav labels, body text — clearly readable
  textMuted:      '#94A3B8',   // captions, labels, reg id
  textSection:    '#4B5563',   // uppercase nav section labels — clearly visible dark

  // Status (semantic — do not change)
  green:          '#16A34A',
  amber:          '#F59E0B',
  red:            '#DC2626',
  redLight:       'rgba(220,38,38,0.20)',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router    = useRouter();
  const uiStore   = useUIStore() as any;
  const collapsed = uiStore.sidebarOpen === false;
  const W         = collapsed ? SIDEBAR_W_MINI : SIDEBAR_W;

  const [authChecked, setAuthChecked] = useState(false);
  const [sessionToast, setSessionToast] = useState(false);
  const hasRun = useRef(false);

  // Show toast if redirected after session timeout
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    if (p.get('session') === 'expired') {
      setSessionToast(true);
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setSessionToast(false), 6000);
    }
  }, []);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    const resolve = (s: any) => {
      if (s.isAuthenticated && s.user?.role === 'ADMIN')        router.replace('/admin-dashboard');
      else if (s.isAuthenticated && s.user?.role === 'DOCTOR')  router.replace('/doctor-dashboard');
      else if (s.isAuthenticated && s.user?.role)               setAuthChecked(true);
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

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (!authChecked) return (
    <div style={{ minHeight:'100vh', background: T.loadingBg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
      <div style={{ width:52, height:52, borderRadius:14, background:`linear-gradient(135deg,${T.blueDark},${T.blue})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#fff', fontFamily:'sans-serif', boxShadow:'0 0 20px rgba(0,0,0,0.2)' }}>HC</div>
      <div style={{ width:32, height:32, border:`3px solid rgba(255,255,255,0.2)`, borderTop:`3px solid ${T.blue}`, borderRadius:'50%', animation:'hcSpin 0.8s linear infinite' }}/>
      <p style={{ color:'rgba(255,255,255,0.7)', fontSize:13, fontFamily:'sans-serif', margin:0, fontWeight:500 }}>Loading your health dashboard…</p>
      <style>{`@keyframes hcSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const sidebarW = collapsed ? SIDEBAR_W_MINI : SIDEBAR_W;

  return (
    <DashboardErrorBoundary>

      {/* ══════════════════════════════════════════════════════════════════════
          MASTER STYLE BLOCK — owns ALL visual CSS for the patient dashboard.
          Sidebar.tsx and Topbar.tsx contain logic + JSX only.
          To change any color, edit the T tokens above — not here.
         ══════════════════════════════════════════════════════════════════════ */}
      <style>{`

        /* ── Global body reset for dashboard route ── */
        body, html {
          background: ${T.pageBg} !important;
          color: ${T.textPrimary} !important;
          font-family: 'Inter', 'Poppins', system-ui, sans-serif;
        }
        /* Force all pages to use warm grey background */
        #hc-main *, div[style*='C8E0F4'], div[style*='C8DFF0'], div[style*='EAF'], div[style*='F0F5FB'] {
          --page-bg: ${T.pageBg};
        }
        /* Kill any remaining blue backgrounds on page content */
        #hc-main > div { background: ${T.pageBg}; }

        /* ── Scrollbars ── */
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: #B0AEA8; }

        /* ══════════════════════════════════════════════
           SIDEBAR
           ══════════════════════════════════════════════ */
        .hc-sb {
          width: ${W}px; height: calc(100vh - ${TOPBAR_H}px);
          background: ${T.sidebarBg};
          border-right: 1px solid ${T.border};
          display: flex; flex-direction: column;
          position: fixed; top: ${TOPBAR_H}px; left: 0; z-index: 100;
          overflow-y: auto; overflow-x: hidden;
          scrollbar-width: thin; scrollbar-color: ${T.border} transparent;
          transition: width 0.25s cubic-bezier(.4,0,.2,1);
          box-shadow: 2px 0 12px rgba(0,0,0,0.05);
        }
        .hc-sb::-webkit-scrollbar { width: 3px; }
        .hc-sb::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }

        /* Logo row — hidden since topbar is full width now */
        .hc-sb-logo {
          display: none;
        }
        .hc-sb-logo-icon {
          width: 34px; height: 34px; border-radius: 9px;
          background: linear-gradient(135deg, ${T.blueDark}, ${T.blue});
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(37,99,235,0.25);
        }
        .hc-sb-logo-name { font-size: 14px; font-weight: 800; color: ${T.textPrimary}; white-space: nowrap; }
        .hc-sb-logo-sub  { font-size: 9px; color: ${T.textMuted}; letter-spacing: .07em; white-space: nowrap; }

        /* Virtual Health ID card */
        .hc-sb-id {
          margin: ${collapsed ? '10px 8px' : '12px'};
          border-radius: 14px;
          background: ${T.healthIdBg};
          border: 1px solid ${T.border};
          padding: ${collapsed ? '12px 0' : '16px'};
          flex-shrink: 0; position: relative; overflow: hidden;
          display: flex; flex-direction: column;
          align-items: ${collapsed ? 'center' : 'flex-start'};
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .hc-sb-id-lbl { font-size: 9px; color: ${T.textMuted}; text-transform: uppercase; letter-spacing: .12em; margin-bottom: 10px; display: ${collapsed ? 'none' : 'block'}; font-weight: 600; }

        /* Avatar */
        .hc-sb-avatar {
          width: ${collapsed ? '36px' : '46px'};
          height: ${collapsed ? '36px' : '46px'};
          border-radius: 50%;
          background: linear-gradient(135deg, ${T.blueDark}, ${T.blue});
          display: flex; align-items: center; justify-content: center;
          font-size: ${collapsed ? '13px' : '17px'};
          font-weight: 700; color: #fff;
          border: 2.5px solid rgba(37,99,235,0.35);
          flex-shrink: 0;
          margin-bottom: ${collapsed ? '0' : '10px'};
          letter-spacing: 0;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.10);
        }

        /* Patient info */
        .hc-sb-id-name { font-size: 14px; font-weight: 700; color: ${T.textPrimary}; margin-bottom: 2px; display: ${collapsed ? 'none' : 'block'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 210px; }
        .hc-sb-id-reg  { font-size: 10px; color: ${T.textMuted}; margin-bottom: 8px; display: ${collapsed ? 'none' : 'block'}; font-family: 'JetBrains Mono', monospace; }
        .hc-sb-chips   { display: ${collapsed ? 'none' : 'flex'}; gap: 5px; flex-wrap: wrap; margin-bottom: 8px; }
        .hc-sb-chip    { padding: 3px 9px; border-radius: 100px; font-size: 10px; background: rgba(0,0,0,0.05); border: 1px solid ${T.border}; color: ${T.textSecondary}; white-space: nowrap; font-weight: 600; }
        .hc-sb-chip.gold { background: rgba(245,158,11,0.15); border-color: rgba(245,158,11,0.35); color: #92400E; }

        /* Skeleton shimmer */
        .hc-sb-skel { border-radius: 4px; background: linear-gradient(90deg, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.09) 50%, rgba(0,0,0,0.05) 75%); background-size: 200% 100%; animation: hcShimmerSb 1.5s infinite; margin-bottom: 6px; }
        @keyframes hcShimmerSb { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* Nav section labels */
        .hc-sb-sec-lbl {
          padding: ${collapsed ? '12px 0 4px' : '12px 18px 4px'};
          font-size: 10.5px; color: ${T.textSection};
          text-transform: uppercase; letter-spacing: .08em;
          display: ${collapsed ? 'none' : 'block'}; white-space: nowrap; font-weight: 700;
        }
        .hc-sb-nav    { list-style: none; padding: 0 8px; margin: 0; }
        .hc-sb-nav li { margin-bottom: 2px; }

        /* Nav buttons — PLM style: plain text, no border, color only on hover/active */
        .hc-sb-btn {
          display: flex; align-items: center;
          gap: ${collapsed ? '0' : '10px'};
          padding: ${collapsed ? '10px 0' : '9px 10px'};
          border-radius: 9px;
          font-size: 13.5px; font-weight: 500;
          color: ${T.textSecondary}; background: none; border: none;
          width: 100%; text-align: left; cursor: pointer;
          transition: all 0.15s ease; position: relative;
          justify-content: ${collapsed ? 'center' : 'flex-start'};
        }
        .hc-sb-btn:hover  { background: ${T.blueHover}; color: #1E40AF; }
        .hc-sb-btn.active {
          background: ${T.blueWash}; color: #1D4ED8;
          border-left: 3px solid ${T.blue};
          padding-left: ${collapsed ? '0' : '7px'};
          font-weight: 600;
        }
        .hc-sb-btn.active svg { stroke: ${T.blue}; }
        .hc-sb-btn-icon  { flex-shrink: 0; display: flex; align-items: center; opacity: .6; transition: opacity 0.15s; }
        .hc-sb-btn.active .hc-sb-btn-icon,
        .hc-sb-btn:hover  .hc-sb-btn-icon { opacity: 1; }
        .hc-sb-btn-lbl   { flex: 1; overflow: hidden; text-overflow: ellipsis; display: ${collapsed ? 'none' : 'block'}; }
        .hc-sb-badge     { margin-left: auto; padding: 1px 7px; border-radius: 100px; font-size: 10px; font-weight: 700; display: ${collapsed ? 'none' : 'inline-flex'}; align-items: center; min-width: 20px; justify-content: center; }
        .hc-sb-dot       { position: absolute; top: 7px; right: 7px; width: 7px; height: 7px; border-radius: 50%; display: ${collapsed ? 'block' : 'none'}; }
        .hc-sb-divider   { height: 1px; background: ${T.borderLight}; margin: 4px 0; }

        /* Bottom: SOS + Logout */
        .hc-sb-bottom {
          margin-top: auto;
          padding: ${collapsed ? '12px 8px' : '12px 10px'};
          border-top: 1px solid ${T.border};
          display: flex; flex-direction: column; gap: 6px;
        }
        .hc-sos-btn {
          width: 100%; padding: ${collapsed ? '10px 0' : '10px 14px'};
          border-radius: 10px; border: none;
          background: ${T.red};
          color: #fff; font-size: 13px; font-weight: 700; cursor: pointer;
          display: flex; align-items: center;
          justify-content: ${collapsed ? 'center' : 'flex-start'};
          gap: 9px;
          box-shadow: 0 2px 8px rgba(220,38,38,0.18);
          transition: all 0.2s; font-family: inherit;
        }
        .hc-sos-btn:hover { background: #B91C1C; box-shadow: 0 4px 16px rgba(220,38,38,0.35); }
        .hc-logout-btn {
          width: 100%; padding: ${collapsed ? '8px 0' : '9px 14px'};
          border-radius: 10px; border: 1px solid ${T.border};
          background: transparent; color: ${T.textMuted};
          font-size: 13px; font-weight: 500; cursor: pointer;
          transition: all 0.2s; font-family: inherit;
          display: flex; align-items: center;
          justify-content: ${collapsed ? 'center' : 'flex-start'};
          gap: 9px;
        }
        .hc-logout-btn:hover { border-color: rgba(244,63,94,0.35); color: #F87171; background: rgba(244,63,94,0.06); }

        /* ══════════════════════════════════════════════
           TOPBAR
           ══════════════════════════════════════════════ */
        .hc-tb {
          position: fixed; top: 0; left: 0; right: 0; height: ${TOPBAR_H}px;
          z-index: 200; background: ${T.topbarBg};
          border-bottom: 1px solid ${T.border};
          display: flex; align-items: center; padding: 0 20px; gap: 14px;
          transition: left 0.25s cubic-bezier(.4,0,.2,1);
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .hc-tb-hamburger {
          background: none; border: none; cursor: pointer;
          color: ${T.textMuted}; display: flex; align-items: center;
          padding: 6px; border-radius: 8px; transition: all 0.2s;
        }
        .hc-tb-hamburger:hover { background: ${T.blueChip}; color: ${T.blue}; }

        .hc-tb-breadcrumb { display: flex; align-items: center; gap: 8px; flex: 1; }
        .hc-tb-breadcrumb-home { font-size: 12px; color: ${T.textMuted}; cursor: pointer; transition: color 0.15s; }
        .hc-tb-breadcrumb-home:hover { color: ${T.blue}; }
        .hc-tb-breadcrumb-sep { color: #CBD5E1; font-size: 12px; }
        .hc-tb-breadcrumb-cur { font-size: 13px; font-weight: 600; color: ${T.textPrimary}; }

        .hc-tb-chip {
          display: flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 100px;
          font-size: 12px; font-weight: 700; white-space: nowrap; cursor: default;
        }
        .hc-tb-chip-score {
          background: ${T.blueChip};
          border: 1px solid rgba(37,99,235,0.2);
          cursor: pointer; transition: background 0.2s;
        }
        .hc-tb-chip-score:hover { background: #DBEAFE; }

        .hc-tb-icon-btn {
          position: relative; background: none; border: none; cursor: pointer;
          color: ${T.textMuted}; padding: 8px; border-radius: 9px;
          display: flex; align-items: center; transition: all 0.2s;
        }
        .hc-tb-icon-btn:hover { background: ${T.blueChip}; color: ${T.blue}; }

        .hc-tb-badge {
          position: absolute; top: 3px; right: 3px;
          min-width: 16px; height: 16px; border-radius: 100px;
          background: #F43F5E; color: #fff; font-size: 9px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          padding: 0 3px; border: 2px solid ${T.topbarBg};
        }
        .hc-tb-badge-pulse { animation: tbBadgePop 0.4s ease forwards, tbBadgeRing 1.5s ease 0.4s; }
        @keyframes tbBadgePop { 0%{transform:scale(1)} 40%{transform:scale(1.6)} 70%{transform:scale(0.9)} 100%{transform:scale(1)} }
        @keyframes tbBadgeRing { 0%,100%{box-shadow:0 0 0 0 rgba(244,63,94,0.5)} 50%{box-shadow:0 0 0 5px rgba(244,63,94,0)} }
        @keyframes tbLivePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }

        .hc-tb-user-btn {
          display: flex; align-items: center; gap: 8px;
          background: none; border: 1px solid ${T.border};
          border-radius: 10px; padding: 5px 10px 5px 7px;
          cursor: pointer; transition: all 0.2s;
        }
        .hc-tb-user-btn:hover { background: ${T.blueChip}; border-color: rgba(37,99,235,0.3); }

        .hc-tb-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, ${T.blueDark}, ${T.blue});
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 800; color: #fff; flex-shrink: 0;
          letter-spacing: 0.5px;
        }

        .hc-tb-dropdown {
          position: absolute; right: 0; top: 48px;
          background: ${T.topbarBg}; border: 1px solid ${T.border};
          border-radius: 14px; box-shadow: 0 8px 30px rgba(0,0,0,0.10);
          z-index: 9999; overflow: hidden;
        }
        .hc-tb-dropdown-hd {
          padding: 13px 16px; border-bottom: 1px solid ${T.borderLight};
          display: flex; align-items: center; justify-content: space-between;
        }
        .hc-tb-notif-item {
          display: flex; gap: 12px; padding: 12px 16px;
          border-bottom: 1px solid ${T.borderLight};
          cursor: pointer; transition: background 0.15s;
        }
        .hc-tb-notif-item:hover { background: ${T.blueChip}; }
        .hc-tb-menu-item {
          width: 100%; padding: 10px 16px; background: none; border: none;
          cursor: pointer; display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: ${T.textSecondary}; text-align: left;
          transition: all 0.15s; font-family: inherit;
        }
        .hc-tb-menu-item:hover { background: ${T.blueChip}; color: ${T.blue}; }

        /* ══════════════════════════════════════════════
           PAGE CONTENT AREA
           ══════════════════════════════════════════════ */
        #hc-main {
          color: ${T.textPrimary};
          font-family: 'Inter', 'Poppins', system-ui, sans-serif;
        }

        /* Headings in content area */
        #hc-main h1, #hc-main h2, #hc-main h3 { color: ${T.textPrimary}; }

        /* Soft card treatment — reduce border visibility, rely on shadow */
        #hc-main [style*='border: 1px solid #C8DFF0'],
        #hc-main [style*='border:1px solid #C8DFF0'] {
          border-color: ${T.borderLight} !important;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06) !important;
        }
        /* Remove blue background from light blue tinted areas */
        #hc-main [style*='background: #EAF'],
        #hc-main [style*='background:#EAF'],
        #hc-main [style*='background: #DBEAFE'],
        #hc-main [style*='background:#DBEAFE'],
        #hc-main [style*='background: rgba(46,134,212,0.08)'],
        #hc-main [style*='background:rgba(46,134,212,0.08)'] {
          background: ${T.pageBg} !important;
          border-color: ${T.border} !important;
        }

        /* Keep white text inside dark hero cards */
        #hc-main [style*="0D3349"] h1, #hc-main [style*="0D3349"] h2, #hc-main [style*="0D3349"] p,
        #hc-main [style*="0F4C6B"] h1, #hc-main [style*="0F4C6B"] p,
        #hc-main [style*="1A3A6B"] h1, #hc-main [style*="1A3A6B"] p,
        #hc-main [style*="0D2B4E"] h1, #hc-main [style*="0D2B4E"] p { color: #FFFFFF !important; }

        /* Tab bars */
        #hc-main .mh-tab-bar {
          background: ${T.cardBg} !important;
          border-bottom: 1px solid ${T.border} !important;
        }

        /* ── COMPREHENSIVE BLUE→WARM override for ALL dashboard pages ── */
        /* Kill ALL blue/teal card backgrounds across every page */
        #hc-main [style*="background: #C8E0F4"],
        #hc-main [style*="background:#C8E0F4"],
        #hc-main [style*="background: #EAF0F8"],
        #hc-main [style*="background:#EAF0F8"],
        #hc-main [style*="background: #EBF4FF"],
        #hc-main [style*="background:#EBF4FF"],
        #hc-main [style*="background: #DBEAFE"],
        #hc-main [style*="background:#DBEAFE"],
        #hc-main [style*="background: #F0F9FF"],
        #hc-main [style*="background:#F0F9FF"],
        #hc-main [style*="background: #E0F2FE"],
        #hc-main [style*="background:#E0F2FE"],
        #hc-main [style*="background: rgba(200,224,244"],
        #hc-main [style*="background:rgba(200,224,244"],
        #hc-main [style*="background: rgba(46,134,212,0.08)"],
        #hc-main [style*="background:rgba(46,134,212,0.08)"],
        #hc-main [style*="background: rgba(27,59,111,0.05)"],
        #hc-main [style*="background:rgba(27,59,111,0.05)"] {
          background: ${T.cardBg} !important;
        }
        /* Kill blue borders across all pages */
        #hc-main [style*="border: 1px solid #C8DFF0"],
        #hc-main [style*="border:1px solid #C8DFF0"],
        #hc-main [style*="borderColor: #C8DFF0"],
        #hc-main [style*="border: 1px solid #BFDBFE"],
        #hc-main [style*="border:1px solid #BFDBFE"],
        #hc-main [style*="border: 2px solid #C8DFF0"],
        #hc-main [style*="border:2px solid #C8DFF0"] {
          border-color: ${T.border} !important;
        }
        /* Fix progress bar tracks — blue track → warm grey */
        #hc-main [style*="background: #E2EEF0"],
        #hc-main [style*="background:#E2EEF0"],
        #hc-main [style*="background: #F8FCFC"],
        #hc-main [style*="background:#F8FCFC"],
        #hc-main [style*="background: #F8FBFF"],
        #hc-main [style*="background:#F8FBFF"] {
          background: ${T.borderLight} !important;
        }
        /* Fix tab bars on all health pages */
        #hc-main [style*="borderBottom: 2px solid #C8DFF0"],
        #hc-main [style*="border-bottom: 2px solid #C8DFF0"],
        #hc-main [style*="borderBottom:2px solid #C8DFF0"] {
          border-bottom-color: ${T.border} !important;
        }

        /* Override any residual dark backgrounds from old theme */
        #hc-main [style*="background: #0F2D2A"],
        #hc-main [style*="background:#0F2D2A"],
        #hc-main [style*="background: #0B1E1C"],
        #hc-main [style*="background:#0B1E1C"] { background: ${T.pageBg} !important; }

        /* Content scrollbar */
        #hc-main ::-webkit-scrollbar { width: 4px; }
        #hc-main ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }

      `}</style>

      {/* ── Session timeout manager — runs silently, shows modal at 10min ── */}
      <SessionTimeoutManager />

      {/* ── Session expired toast — shows when redirected after timeout ── */}
      {sessionToast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1E293B', color: '#fff', borderRadius: 12,
          padding: '12px 20px', fontSize: 13, fontWeight: 600,
          zIndex: 9999, whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span>⏱️</span>
          <span>You were signed out due to inactivity.</span>
          <button onClick={() => setSessionToast(false)}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 16, padding: 0, marginLeft: 4 }}>
            ✕
          </button>
        </div>
      )}

      <SessionTimeoutManager />

      

      {/* ── Layout shell ────────────────────────────────────────────────────── */}
      <div style={{ minHeight: '100vh', background: T.pageBg }}>
        <Sidebar />
        <Topbar />
        <div style={{
          marginLeft: sidebarW,
          paddingTop: TOPBAR_H,
          minHeight: '100vh',
          background: T.pageBg,
          overflowX: 'hidden',
          transition: 'margin-left 0.25s cubic-bezier(.4,0,.2,1)',
          // Full-width topbar: content shifts right by sidebar, down by topbar
        }}>
          {/* Email verification banner — shows when isEmailVerified === false */}
          <EmailVerificationBanner />
          <EmailVerificationBanner />
          <main id="hc-main" style={{
            padding: '20px 28px 56px',
            maxWidth: 1200,
            margin: '0 auto',
            color: T.textPrimary,
          }}>
            {children}
          </main>
        </div>
      </div>

    </DashboardErrorBoundary>
  );
}
