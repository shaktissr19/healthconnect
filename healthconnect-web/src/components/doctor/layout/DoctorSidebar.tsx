'use client';
// src/components/doctor/layout/DoctorSidebar.tsx
// Doctor-specific sidebar — deep navy + electric blue theme
// Reuses useAuthStore + useUIStore (activePage driven), doctor role guard

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { api } from '@/lib/api';

const SIDEBAR_W      = 268;
const SIDEBAR_W_MINI = 72;

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const I = {
  home:          ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  patients:      ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  appointments:  ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  video:         ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  prescriptions: ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>,
  records:       ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  communities:   ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  earnings:      ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  profile:       ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  availability:  ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  settings:      ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2m0 18v-2m7.07-2.93l-1.41-1.41M4.93 19.07l1.41-1.41M22 12h-2M4 12H2"/></svg>,
};

const NAV_SECTIONS = [
  { key:'today',   label:'TODAY',    items:[
    { id:'home',          label:'Today\'s Schedule',  icon:'home' },
  ]},
  { key:'patients', label:'PATIENTS', items:[
    { id:'patients',      label:'My Patients',        icon:'patients',      badgeKey:'patientCount' },
    { id:'appointments',  label:'Appointments',       icon:'appointments',  badgeKey:'pendingAppts',  badgeColor:'#FFFFFF' },
    { id:'video-consults',label:'Video Consults',     icon:'video',         badgeKey:'activeConsults',badgeColor:'#22C55E' },
  ]},
  { key:'clinical', label:'CLINICAL', items:[
    { id:'prescriptions', label:'Prescriptions',      icon:'prescriptions', badgeKey:'pendingRx',     badgeColor:'#F59E0B' },
    { id:'records',       label:'Medical Records',    icon:'records',       badgeKey:'pendingReports',badgeColor:'#F43F5E' },
  ]},
  { key:'community',label:'COMMUNITY',items:[
    { id:'communities',   label:'Community Q&A',      icon:'communities',   badgeKey:'communityQs',   badgeColor:'#8B5CF6' },
  ]},
  { key:'finance',  label:'EARNINGS', items:[
    { id:'earnings',      label:'Earnings & Payouts', icon:'earnings' },
  ]},
  { key:'account',  label:'ACCOUNT',  items:[
    { id:'profile',       label:'My Profile',         icon:'profile' },
    { id:'availability',  label:'Availability',       icon:'availability' },
    { id:'settings',      label:'Settings',           icon:'settings' },
  ]},
];

export default function DoctorSidebar() {
  const router  = useRouter();
  const uiStore = useUIStore() as any;
  const { activePage, setActivePage } = uiStore;
  const sidebarOpen = uiStore.sidebarOpen;
  const collapsed   = sidebarOpen === false;
  const W = collapsed ? SIDEBAR_W_MINI : SIDEBAR_W;

  const [user,    setUser]    = useState<any>((useAuthStore.getState() as any).user);
  const [kpis,    setKpis]    = useState<any>({});
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const s = useAuthStore.getState() as any;
    setUser(s.user);
    const unsub = (useAuthStore as any).subscribe((s: any) => setUser(s.user));
    return () => unsub();
  }, []);

  useEffect(() => {
    // Fetch doctor dashboard KPIs for badges
    api.get('/doctor/dashboard').then((r: any) => {
      const d = r?.data?.data ?? r?.data ?? {};
      setKpis(d.kpis ?? d);
    }).catch(() => {});
    api.get('/doctor/profile').then((r: any) => {
      setProfile(r?.data?.data ?? r?.data ?? {});
    }).catch(() => {});
  }, []);

  const handleLogout = useCallback(() => {
    (useAuthStore.getState() as any).clearAuth?.();
    document.cookie = 'hc_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.replace('/');
  }, [router]);

  const firstName   = user?.firstName   ?? profile?.firstName   ?? '';
  const lastName    = user?.lastName    ?? profile?.lastName    ?? '';
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'Doctor';
  const initials    = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || 'DR';
  const regId       = user?.registrationId ?? profile?.registrationId ?? '';
  const speciality  = profile?.specialization ?? profile?.speciality ?? 'Physician';
  const isVerified  = profile?.isVerified ?? true;

  const getBadge = (key?: string) => key ? (kpis[key] ?? null) : null;

  return (
    <>
      <style>{`
        .dr-sb {
          width: ${W}px; height: 100vh;
          background: #0C3D38;
          border-right: 1px solid rgba(255,255,255,0.08);
          display: flex; flex-direction: column;
          position: fixed; top: 0; left: 0; z-index: 200;
          overflow-y: auto; overflow-x: hidden;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
          transition: width 0.25s cubic-bezier(.4,0,.2,1);
        }
        .dr-sb::-webkit-scrollbar { width: 3px; }
        .dr-sb::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 2px; }

        .dr-sb-logo {
          padding: ${collapsed ? '14px 0' : '16px 18px'};
          border-bottom: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; gap: 10px;
          flex-shrink: 0; min-height: 64px;
          justify-content: ${collapsed ? 'center' : 'flex-start'};
        }
        .dr-sb-logo-icon {
          width: 34px; height: 34px; border-radius: 9px;
          background: linear-gradient(135deg, #0D9488, #14B8A6);
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; flex-shrink: 0;
          box-shadow: 0 0 14px rgba(255,255,255,0.2);
        }

        .dr-sb-card {
          margin: ${collapsed ? '10px 8px' : '12px'};
          border-radius: 14px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          padding: ${collapsed ? '12px 0' : '16px'};
          flex-shrink: 0; position: relative; overflow: hidden;
          display: flex; flex-direction: column;
          align-items: ${collapsed ? 'center' : 'flex-start'};
        }
        .dr-sb-card::before {
          content: ''; position: absolute; top: -30px; right: -30px;
          width: 100px; height: 100px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .dr-sb-avatar {
          width: ${collapsed ? '36px' : '46px'};
          height: ${collapsed ? '36px' : '46px'};
          border-radius: 50%;
          background: linear-gradient(135deg, #14B8A6, #0D9488);
          display: flex; align-items: center; justify-content: center;
          font-size: ${collapsed ? '12px' : '15px'};
          font-weight: 800; color: #fff;
          border: 2px solid rgba(255,255,255,0.3);
          flex-shrink: 0; margin-bottom: ${collapsed ? '0' : '10px'};
          letter-spacing: 0.5px;
        }
        .dr-sb-name { font-size: 13px; font-weight: 700; color: #FFFFFF; display: ${collapsed ? 'none' : 'block'}; margin-bottom: 2px; }
        .dr-sb-spec { font-size: 11px; color: rgba(255,255,255,0.7); display: ${collapsed ? 'none' : 'block'}; margin-bottom: 8px; }
        .dr-sb-reg  { font-size: 10px; color: rgba(255,255,255,0.4); font-family: 'JetBrains Mono', monospace; display: ${collapsed ? 'none' : 'block'}; margin-bottom: 8px; }
        .dr-sb-verified { display: ${collapsed ? 'none' : 'inline-flex'}; align-items: center; gap: 4px; padding: 2px 9px; border-radius: 100px; font-size: 9px; font-weight: 700; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); color: #A7F3D0; }

        .dr-sb-sec-lbl {
          padding: ${collapsed ? '10px 0 4px' : '10px 18px 4px'};
          font-size: 9px; color: rgba(255,255,255,0.55); font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; letter-spacing: .12em;
          display: ${collapsed ? 'none' : 'block'}; white-space: nowrap;
        }
        .dr-sb-nav    { list-style: none; padding: 0 8px; margin: 0; }
        .dr-sb-nav li { margin-bottom: 1px; }
        .dr-sb-btn {
          display: flex; align-items: center;
          gap: ${collapsed ? '0' : '10px'};
          padding: ${collapsed ? '10px 0' : '9px 10px'};
          border-radius: 9px; font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,0.55); background: none; border: none;
          width: 100%; text-align: left; cursor: pointer;
          transition: all 0.18s; position: relative;
          justify-content: ${collapsed ? 'center' : 'flex-start'};
          font-family: inherit;
        }
        .dr-sb-btn:hover  { background: rgba(255,255,255,0.08); color: #93C5FD; }
        .dr-sb-btn.active { background: rgba(255,255,255,0.15); color: #FFFFFF; }
        .dr-sb-btn.active svg { stroke: #FFFFFF; }
        .dr-sb-btn.active::before {
          content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
          width: 3px; height: 60%; border-radius: 0 3px 3px 0;
          background: #FFFFFF;
        }
        .dr-sb-icon  { flex-shrink: 0; display: flex; align-items: center; opacity: .65; }
        .dr-sb-btn.active .dr-sb-icon, .dr-sb-btn:hover .dr-sb-icon { opacity: 1; }
        .dr-sb-lbl   { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: ${collapsed ? 'none' : 'block'}; }
        .dr-sb-badge {
          margin-left: auto; padding: 1px 7px; border-radius: 100px;
          font-size: 9px; font-weight: 700; min-width: 18px;
          display: ${collapsed ? 'none' : 'inline-flex'}; align-items: center; justify-content: center;
          color: #0C3D38;
        }
        .dr-sb-dot { position: absolute; top: 7px; right: 7px; width: 7px; height: 7px; border-radius: 50%; display: ${collapsed ? 'block' : 'none'}; }
        .dr-sb-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 4px 0; }
        .dr-sb-bottom {
          margin-top: auto; padding: ${collapsed ? '12px 8px' : '12px'};
          border-top: 1px solid rgba(255,255,255,0.08);
          display: flex; flex-direction: column; gap: 7px;
        }
        .dr-logout-btn {
          width: 100%; padding: ${collapsed ? '8px 0' : '8px 12px'};
          border-radius: 9px; border: 1px solid rgba(255,255,255,0.15);
          background: transparent; color: rgba(255,255,255,0.5); font-size: 12px; font-weight: 500;
          cursor: pointer; transition: all 0.2s; font-family: inherit;
          display: flex; align-items: center; justify-content: center; gap: 7px;
        }
        .dr-logout-btn:hover { border-color: rgba(244,63,94,0.35); color: #F43F5E; }
      `}</style>

      <aside className="dr-sb">
        {/* Logo */}
        <div className="dr-sb-logo">
          <div className="dr-sb-logo-icon">🏥</div>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#FFFFFF', lineHeight: 1.1 }}>HealthConnect</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' }}>India · Doctor Portal</div>
            </div>
          )}
        </div>

        {/* Doctor card */}
        <div className="dr-sb-card">
          <div className="dr-sb-avatar">{initials}</div>
          <div className="dr-sb-name">Dr. {displayName}</div>
          <div className="dr-sb-spec">{speciality}</div>
          <div className="dr-sb-reg">{regId}</div>
          {isVerified && <span className="dr-sb-verified">✓ Verified Doctor</span>}
        </div>

        {/* Nav */}
        {NAV_SECTIONS.map(section => (
          <div key={section.key}>
            <div className="dr-sb-sec-lbl">{section.label}</div>
            <ul className="dr-sb-nav">
              {section.items.map(item => {
                const active  = activePage === item.id;
                const badge   = getBadge((item as any).badgeKey);
                const hasBadge= badge != null && Number(badge) > 0;
                const bColor  = (item as any).badgeColor ?? '#FFFFFF';
                const IconComp= I[item.icon as keyof typeof I] ?? I.home;
                return (
                  <li key={item.id}>
                    <button
                      className={`dr-sb-btn${active ? ' active' : ''}`}
                      onClick={() => setActivePage(item.id)}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="dr-sb-icon"><IconComp /></span>
                      <span className="dr-sb-lbl">{item.label}</span>
                      {hasBadge && (
                        <>
                          <span className="dr-sb-badge" style={{ background: bColor }}>{badge}</span>
                          <span className="dr-sb-dot"   style={{ background: bColor }} />
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="dr-sb-divider" />
          </div>
        ))}

        {/* Bottom */}
        <div className="dr-sb-bottom">
          <button className="dr-logout-btn" onClick={handleLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {!collapsed && 'Sign Out'}
          </button>
        </div>
      </aside>
    </>
  );
}
