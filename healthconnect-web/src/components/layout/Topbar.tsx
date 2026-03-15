'use client';
// src/components/layout/Topbar.tsx
// CRITICAL FIX: useAuthStore() is NEVER called as a reactive hook here.
// All auth reads use getState() + subscribe pattern to prevent redirect loop.

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { api } from '@/lib/api';

const SIDEBAR_W      = 260;
const SIDEBAR_W_MINI = 72;
const TOPBAR_H       = 64;

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Topbar() {
  const router  = useRouter();
  const uiStore = useUIStore() as any;
  const { activePage, setActivePage, toggleSidebar } = uiStore;
  const sidebarOpen = uiStore.sidebarOpen;
  const collapsed   = sidebarOpen === false;
  const sidebarW    = collapsed ? SIDEBAR_W_MINI : SIDEBAR_W;

  // FIXED: Never call useAuthStore() as a reactive hook.
  const [user, setUser] = useState<any>(() => (useAuthStore.getState() as any).user);
  useEffect(() => {
    setUser((useAuthStore.getState() as any).user);
    const unsub = (useAuthStore as any).subscribe((s: any) => setUser(s.user));
    return () => unsub();
  }, []);

  const [notifications,  setNotifications]  = useState<Notification[]>([]);
  const [unreadCount,    setUnreadCount]     = useState(0);
  const [showNotif,      setShowNotif]       = useState(false);
  const [showUserMenu,   setShowUserMenu]    = useState(false);
  const [healthScore,    setHealthScore]     = useState<number | null>(null);
  const [badgePulse,     setBadgePulse]      = useState(false);

  const notifRef   = useRef<HTMLDivElement>(null);
  const userRef    = useRef<HTMLDivElement>(null);
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSeenId = useRef<string>('');

  const firstName = user?.firstName ?? '';
  const lastName  = user?.lastName  ?? '';
  const initials  = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || 'U';

  // ── Fetch notifications ───────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (isPolling = false) => {
    try {
      const r: any = await api.get('/notifications');
      const arr = r?.data?.data ?? r?.data ?? [];
      if (Array.isArray(arr) && arr.length > 0) {
        const fresh = arr.slice(0, 10);
        setNotifications(fresh);
        const unread = fresh.filter((n: any) => !n.isRead).length;
        setUnreadCount(unread);
        if (isPolling && lastSeenId.current) {
          const newestId = fresh[0]?.id;
          if (newestId && newestId !== lastSeenId.current) {
            setBadgePulse(true);
            setTimeout(() => setBadgePulse(false), 2000);
          }
        }
        if (fresh[0]?.id) lastSeenId.current = fresh[0].id;
      }
    } catch {}
  }, []);

  useEffect(() => {
    api.get('/patient/health-score').then((r: any) => {
      const d = r?.data?.data ?? r?.data ?? {};
      const score = d?.score ?? d?.currentScore ?? d?.healthScore ?? null;
      setHealthScore(score);
    }).catch(() => {});

    fetchNotifications(false);
    pollRef.current = setInterval(() => fetchNotifications(true), 60_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchNotifications]);

  // Bridge: listen for health score updates from page.tsx window events
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.healthScore != null) setHealthScore(e.detail.healthScore);
      if (e.detail?.unreadCount  != null) setUnreadCount(e.detail.unreadCount);
    };
    window.addEventListener('hcDashUpdate', handler);
    return () => window.removeEventListener('hcDashUpdate', handler);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = useCallback(() => {
    (useAuthStore.getState() as any).clearAuth?.();
    document.cookie = 'hc_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.replace('/');
  }, [router]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    api.put('/notifications/read-all').catch(() => {});
  };

  const notifIcon = (type: string) =>
    ({ APPOINTMENT: '📅', MEDICATION: '💊', VITAL: '📊', COMMUNITY: '💬', ALERT: '🔔' }[type] ?? '🔔');

  const scoreColor = (s: number | null) =>
    !s ? '#64748B' : s >= 80 ? '#16A34A' : s >= 60 ? '#D97706' : '#DC2626';

  return (
    <>
      <style>{`
        /* ── LIGHT THEME TOPBAR ──────────────────────────────────────── */
        .hc-tb {
          position: fixed; top: 0; left: ${sidebarW}px; right: 0; height: ${TOPBAR_H}px;
          z-index: 100; background: #FFFFFF;
          border-bottom: 1px solid rgba(14,165,151,0.12);
          display: flex; align-items: center; padding: 0 20px; gap: 14px;
          transition: left 0.25s cubic-bezier(.4,0,.2,1);
          box-shadow: 0 1px 8px rgba(0,0,0,0.06);
        }
        .hc-tb-hamburger {
          background: none; border: none; cursor: pointer;
          color: #94A3B8; display: flex; align-items: center;
          padding: 6px; border-radius: 8px; transition: all 0.2s;
        }
        .hc-tb-hamburger:hover { background: #F0F9F8; color: #0D9488; }

        .hc-tb-breadcrumb { display: flex; align-items: center; gap: 8px; flex: 1; }
        .hc-tb-breadcrumb-home { font-size: 12px; color: #94A3B8; cursor: pointer; transition: color 0.15s; }
        .hc-tb-breadcrumb-home:hover { color: #0D9488; }
        .hc-tb-breadcrumb-sep { color: #CBD5E1; font-size: 12px; }
        .hc-tb-breadcrumb-cur { font-size: 13px; font-weight: 700; color: #0F2D2A; }

        .hc-tb-chip {
          display: flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 100px;
          font-size: 12px; font-weight: 700; white-space: nowrap;
          cursor: default;
        }
        .hc-tb-chip-score {
          background: #F0FDF9;
          border: 1px solid rgba(13,148,136,0.2);
          cursor: pointer; transition: background 0.2s;
        }
        .hc-tb-chip-score:hover { background: #CCFBF1; }

        .hc-tb-icon-btn {
          position: relative; background: none; border: none; cursor: pointer;
          color: #94A3B8; padding: 8px; border-radius: 9px;
          display: flex; align-items: center; transition: all 0.2s;
        }
        .hc-tb-icon-btn:hover { background: #F0F9F8; color: #0D9488; }

        .hc-tb-badge {
          position: absolute; top: 3px; right: 3px;
          min-width: 16px; height: 16px; border-radius: 100px;
          background: #F43F5E; color: #fff; font-size: 9px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          padding: 0 3px; border: 2px solid #FFFFFF;
        }
        .hc-tb-badge-pulse { animation: tbBadgePop 0.4s ease forwards, tbBadgeRing 1.5s ease 0.4s; }
        @keyframes tbBadgePop { 0%{transform:scale(1)} 40%{transform:scale(1.6)} 70%{transform:scale(0.9)} 100%{transform:scale(1)} }
        @keyframes tbBadgeRing { 0%,100%{box-shadow:0 0 0 0 rgba(244,63,94,0.5)} 50%{box-shadow:0 0 0 5px rgba(244,63,94,0)} }
        @keyframes tbLivePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }

        .hc-tb-user-btn {
          display: flex; align-items: center; gap: 8px;
          background: none; border: 1px solid #E2EEF0;
          border-radius: 10px; padding: 5px 10px 5px 7px;
          cursor: pointer; transition: all 0.2s;
        }
        .hc-tb-user-btn:hover { background: #F0F9F8; border-color: rgba(13,148,136,0.3); }

        .hc-tb-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg,#0D9488,#14B8A6);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 800; color: #fff; flex-shrink: 0;
          letter-spacing: 0.5px;
        }

        /* Dropdowns — stay dark for contrast/readability */
        .hc-tb-dropdown {
          position: absolute; right: 0; top: 48px;
          background: #FFFFFF; border: 1px solid #E2EEF0;
          border-radius: 14px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          z-index: 9999; overflow: hidden;
        }
        .hc-tb-dropdown-hd {
          padding: 13px 16px; border-bottom: 1px solid #F1F5F9;
          display: flex; align-items: center; justify-content: space-between;
        }
        .hc-tb-notif-item {
          display: flex; gap: 12px; padding: 12px 16px;
          border-bottom: 1px solid #F8FAFC;
          cursor: pointer; transition: background 0.15s;
        }
        .hc-tb-notif-item:hover { background: #F8FFFE; }
        .hc-tb-menu-item {
          width: 100%; padding: 10px 16px; background: none; border: none;
          cursor: pointer; display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: #4B6E6A; text-align: left;
          transition: all 0.15s; font-family: inherit;
        }
        .hc-tb-menu-item:hover { background: #F0F9F8; color: #0D9488; }
      `}</style>

      <header className="hc-tb">
        {/* Hamburger */}
        <button className="hc-tb-hamburger" onClick={toggleSidebar} title="Toggle sidebar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        {/* Breadcrumb */}
        <div className="hc-tb-breadcrumb">
          <span className="hc-tb-breadcrumb-home" onClick={() => setActivePage('home')}>Dashboard</span>
          <span className="hc-tb-breadcrumb-sep">›</span>
          <span className="hc-tb-breadcrumb-cur">
            {activePage === 'home'          ? '🏠 Home'
            : activePage === 'my-health'    ? '❤️ My Health'
            : activePage === 'vitals'       ? '📊 Vitals'
            : activePage === 'medications'  ? '💊 Medications'
            : activePage === 'appointments' ? '📅 Appointments'
            : activePage === 'communities'  ? '💬 Communities'
            : activePage === 'profile'      ? '👤 Profile'
            : activePage === 'settings'     ? '⚙️ Settings'
            : 'Dashboard'}
          </span>
        </div>

        {/* Health score chip */}
        {healthScore !== null && (
          <button
            className="hc-tb-chip hc-tb-chip-score"
            onClick={() => setActivePage('my-health')}
            title="View health score breakdown"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={scoreColor(healthScore)} stroke={scoreColor(healthScore)} strokeWidth="2" strokeLinecap="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span style={{ color: scoreColor(healthScore) }}>{healthScore} Health Score</span>
          </button>
        )}

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button className="hc-tb-icon-btn" onClick={() => { setShowNotif(p => !p); setShowUserMenu(false); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && (
              <span className={`hc-tb-badge${badgePulse ? ' hc-tb-badge-pulse' : ''}`}>{unreadCount}</span>
            )}
          </button>

          {showNotif && (
            <div className="hc-tb-dropdown" style={{ width: 360 }}>
              <div className="hc-tb-dropdown-hd">
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ color:'#0F2D2A', fontWeight:700, fontSize:14 }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{ background:'#F43F5E', color:'#fff', fontSize:10, fontWeight:700, borderRadius:10, padding:'2px 7px' }}>{unreadCount}</span>
                  )}
                  <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'#16A34A', fontWeight:600 }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:'#22C55E', animation:'tbLivePulse 2s ease infinite', display:'inline-block' }}/>
                    Live
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ background:'none', border:'none', cursor:'pointer', color:'#0D9488', fontSize:12 }}>
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding:'32px 16px', textAlign:'center', color:'#94A3B8', fontSize:13 }}>
                    No notifications yet
                  </div>
                ) : notifications.map(n => (
                  <div
                    key={n.id}
                    className="hc-tb-notif-item"
                    style={{
                      background: n.isRead ? 'transparent' : '#F0FDF9',
                      borderLeft: n.isRead ? 'none' : '3px solid #0D9488',
                    }}
                    onClick={() => {
                      if (!n.isRead) {
                        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
                        setUnreadCount(prev => Math.max(0, prev - 1));
                        api.put(`/notifications/${n.id}/read`).catch(() => {});
                      }
                    }}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{notifIcon(n.type)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                        <span style={{ color: n.isRead ? '#94A3B8' : '#0F2D2A', fontSize:13, fontWeight: n.isRead ? 400 : 600 }}>
                          {n.title}
                        </span>
                        {!n.isRead && <span style={{ width:6, height:6, borderRadius:'50%', background:'#14B8A6', flexShrink:0 }}/>}
                      </div>
                      <p style={{ color:'#64748B', fontSize:12, margin:0, lineHeight:1.5 }}>{n.body}</p>
                      <span style={{ color:'#94A3B8', fontSize:11, marginTop:4, display:'block' }}>{timeAgo(n.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={userRef} style={{ position: 'relative' }}>
          <button className="hc-tb-user-btn" onClick={() => { setShowUserMenu(p => !p); setShowNotif(false); }}>
            <div className="hc-tb-avatar">{initials}</div>
            <span style={{ fontSize:12, fontWeight:600, color:'#4B6E6A', maxWidth:90, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {firstName || 'Account'}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"
              style={{ transform: showUserMenu ? 'rotate(180deg)' : 'none', transition:'transform 0.2s', flexShrink:0 }}>
              <polyline points="6,9 12,15 18,9"/>
            </svg>
          </button>

          {showUserMenu && (
            <div className="hc-tb-dropdown" style={{ width: 220, top: 48 }}>
              <div style={{ padding:'16px', borderBottom:'1px solid #F1F5F9', textAlign:'center' }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#0D9488,#14B8A6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:15, fontWeight:800, margin:'0 auto 8px', letterSpacing:'0.5px' }}>{initials}</div>
                <div style={{ color:'#0F2D2A', fontSize:14, fontWeight:700 }}>{firstName} {lastName}</div>
                <div style={{ color:'#94A3B8', fontSize:11, marginTop:2 }}>{user?.email ?? ''}</div>
              </div>
              {[
                { icon:'👤', label:'Profile',  action: () => setActivePage('profile')  },
                { icon:'⚙️', label:'Settings', action: () => setActivePage('settings') },
              ].map(item => (
                <button key={item.label} className="hc-tb-menu-item" onClick={() => { item.action(); setShowUserMenu(false); }}>
                  <span style={{ fontSize:15 }}>{item.icon}</span>{item.label}
                </button>
              ))}
              <div style={{ height:1, background:'#F1F5F9', margin:'4px 0' }}/>
              <button onClick={handleLogout} className="hc-tb-menu-item" style={{ color:'#F43F5E' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
