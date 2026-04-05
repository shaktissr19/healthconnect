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

  // Global search
  const [showSearch,   setShowSearch]   = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [searchRes,    setSearchRes]    = useState<any[]>([]);
  const [searchLoad,   setSearchLoad]   = useState(false);
  const searchRef  = useRef<HTMLDivElement>(null);
  const searchInp  = useRef<HTMLInputElement>(null);

  const notifRef   = useRef<HTMLDivElement>(null);
  const userRef    = useRef<HTMLDivElement>(null);
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSeenId = useRef<string>('');

  // Global search handler
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchRes([]); return; }
    const t = setTimeout(async () => {
      setSearchLoad(true);
      try {
        const results: any[] = [];
        // Search doctors
        try {
          const r: any = await api.get('/public/doctors', { params: { search: searchQuery, limit: 4 } });
          const docs = r?.data?.data ?? r?.data?.doctors ?? r?.data ?? [];
          (Array.isArray(docs) ? docs : []).slice(0, 4).forEach((d: any) => results.push({ type: 'doctor', id: d.id, label: `Dr. ${d.firstName} ${d.lastName}`, sub: d.specialization, icon: '👨‍⚕️', action: () => { setActivePage('find-doctors'); setShowSearch(false); } }));
        } catch { /**/ }
        // Search communities
        try {
          const r: any = await api.get('/api/communities', { params: { search: searchQuery, limit: 3 } });
          const comms = r?.data?.data?.communities ?? r?.data?.communities ?? r?.data ?? [];
          (Array.isArray(comms) ? comms : []).slice(0, 3).forEach((c: any) => results.push({ type: 'community', id: c.id, label: c.name, sub: c.category, icon: '🏘️', action: () => { setActivePage('communities'); setShowSearch(false); } }));
        } catch { /**/ }
        // Search medications
        try {
          const r: any = await api.get('/patient/medications', { params: { search: searchQuery, limit: 3 } });
          const meds = r?.data?.data?.medications ?? r?.data?.medications ?? r?.data ?? [];
          (Array.isArray(meds) ? meds : []).slice(0, 3).forEach((m: any) => results.push({ type: 'medication', id: m.id, label: m.name, sub: m.dosage, icon: '💊', action: () => { setActivePage('medications'); setShowSearch(false); } }));
        } catch { /**/ }
        setSearchRes(results);
      } catch { /**/ }
      setSearchLoad(false);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery, setActivePage]);

  // Open search with keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true); setTimeout(() => searchInp.current?.focus(), 50); }
      if (e.key === 'Escape') { setShowSearch(false); setSearchQuery(''); setSearchRes([]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const firstName = user?.firstName ?? '';
  const lastName  = user?.lastName  ?? '';
  const initials  = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || 'U';

  // ── Fetch notifications ───────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (isPolling = false) => {
    try {
      const r: any = await api.get('/notifications');
      const arr = r?.data?.data?.notifications ?? r?.data?.notifications ?? r?.data ?? [];
      if (Array.isArray(arr) && arr.length > 0) {
        const fresh = arr.slice(0, 10);
        setNotifications(fresh);
        const unread = fresh.filter((n: any) => !n.isRead && !n.read).length;
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
    pollRef.current = setInterval(() => fetchNotifications(true), 15_000);
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
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) { setShowSearch(false); setSearchQuery(''); setSearchRes([]); }
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
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
    setUnreadCount(0);
    api.put('/notifications/read-all').catch(() => {});
  };

  const notifIcon = (type: string, data?: any) => {
    if (type === 'SYSTEM' && data?.requestType === 'DOCTOR_ACCESS_REQUEST') return '👨‍⚕️';
    return ({ APPOINTMENT: '📅', MEDICATION: '💊', VITAL: '📊', COMMUNITY: '💬', ALERT: '🔔', SYSTEM: '🔔' }[type] ?? '🔔');
  };

  // Approve/Reject doctor access request
  const [consentLoading, setConsentLoading] = useState<string | null>(null);

  const [consentToast, setConsentToast] = useState('');

  const handleConsentAction = async (notifId: string, notifData: any, action: 'approve' | 'reject') => {
    setConsentLoading(notifId + action);
    try {
      // Route is in doctor.routes.ts mounted at /doctor → full path is /doctor/patient/consent/:action
      await api.post(`/doctor/patient/consent/${action}`, { notificationId: notifId, doctorId: notifData.doctorId });
      // Remove from notification list
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      // Show feedback toast
      setConsentToast(action === 'approve'
        ? `✓ Access granted to ${notifData.doctorName ?? 'doctor'}`
        : `Access request from ${notifData.doctorName ?? 'doctor'} declined`
      );
      setTimeout(() => setConsentToast(''), 4000);
      fetchNotifications(false);
    } catch (e: any) {
      setConsentToast('Failed to process request. Please try again.');
      setTimeout(() => setConsentToast(''), 3000);
    }
    setConsentLoading(null);
  };

  const scoreColor = (s: number | null) =>
    !s ? '#64748B' : s >= 80 ? '#16A34A' : s >= 60 ? '#D97706' : '#DC2626';

  return (
    <>
      <header className="hc-tb">
        {/* Hamburger */}
        <button className="hc-tb-hamburger" onClick={toggleSidebar} title="Toggle sidebar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        {/* HealthConnect home link — opens in new tab so dashboard session is preserved */}
        <a href="https://healthconnect.sbs/?home=1" title="Go to HealthConnect home (opens in new tab)" style={{ display:'flex', alignItems:'center', gap:6, textDecoration:'none', padding:'4px 10px', borderRadius:8, border:'1px solid #E2EEF0', background:'#FDFCFB', transition:'all 0.2s', flexShrink:0 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='#2563EB'; (e.currentTarget as HTMLElement).style.background='#EFF4FF'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='#D3D1C7'; (e.currentTarget as HTMLElement).style.background='#FDFCFB'; }}>
          <span style={{ fontSize:14 }}>🏥</span>
          <span style={{ fontSize:11, fontWeight:700, color:'#1A365D' }}>HealthConnect Home</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>

        {/* Breadcrumb */}
        <div className="hc-tb-breadcrumb">
          <span className="hc-tb-breadcrumb-home" onClick={() => setActivePage('home')}>Dashboard</span>
          <span className="hc-tb-breadcrumb-sep">›</span>
          <span className="hc-tb-breadcrumb-cur">
            {activePage === 'home'          ? 'Home'
            : activePage === 'my-health'    ? 'My Health'
            : activePage === 'vitals'       ? 'Vitals'
            : activePage === 'medications'  ? 'Medications'
            : activePage === 'appointments' ? 'Appointments'
            : activePage === 'communities'  ? 'Communities'
            : activePage === 'find-doctors' ? 'Find Doctors'
            : activePage === 'profile'      ? 'Profile'
            : activePage === 'settings'     ? '⚙️ Settings'
            : activePage === 'symptoms'     ? '🤒 Symptoms'
            : activePage === 'therapies'    ? '🧬 Therapies'
            : activePage === 'vitals'       ? 'Vitals'
            : activePage === 'consents'     ? '🔐 Data Consents'
            : activePage === 'subscription' ? '⭐ Subscription'
            : 'Dashboard'}
          </span>
        </div>

        {/* Global Search */}
        <div ref={searchRef} style={{ position:'relative', flexShrink:0 }}>
          <button
            onClick={() => { setShowSearch(p => !p); setTimeout(() => searchInp.current?.focus(), 50); }}
            className="hc-tb-icon-btn"
            style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 12px', borderRadius:9, border:'1px solid #C8DFF0', background:showSearch?'#EBF4FF':'#F8FBFF', color:'#5A7A9B', fontSize:13, cursor:'pointer', minWidth:180, justifyContent:'flex-start' }}
            title="Search (Ctrl+K)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <span style={{ flex:1, textAlign:'left', fontSize:12 }}>Search…</span>
            <span style={{ fontSize:10, padding:'1px 5px', borderRadius:4, background:'#EAE8E2', color:'#64748B', fontFamily:'monospace' }}>⌘K</span>
          </button>

          {showSearch && (
            <div style={{ position:'absolute', top:42, right:0, width:380, background:'#fff', borderRadius:14, boxShadow:'0 8px 32px rgba(27,59,111,0.18)', border:'1px solid #C8DFF0', zIndex:9999, overflow:'hidden' }}>
              <div style={{ padding:'12px 14px', borderBottom:'1px solid #F0F7FD', display:'flex', alignItems:'center', gap:8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input ref={searchInp} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search doctors, communities, medications..." autoFocus
                  style={{ flex:1, border:'none', outline:'none', fontSize:13, color:'#0A1628', background:'transparent', fontFamily:'inherit' }} />
                {searchQuery && <button onClick={() => { setSearchQuery(''); setSearchRes([]); }} style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8', fontSize:16 }}>✕</button>}
              </div>
              <div style={{ maxHeight:320, overflowY:'auto' }}>
                {searchLoad && <div style={{ padding:'20px', textAlign:'center', color:'#94A3B8', fontSize:13 }}>Searching…</div>}
                {!searchLoad && searchQuery && searchRes.length === 0 && <div style={{ padding:'20px', textAlign:'center', color:'#94A3B8', fontSize:13 }}>No results for "{searchQuery}"</div>}
                {!searchLoad && searchRes.length > 0 && (
                  <>
                    {['doctor','community','medication'].map(type => {
                      const items = searchRes.filter(r => r.type === type);
                      if (!items.length) return null;
                      const labels: Record<string,string> = { doctor:'Doctors', community:'Communities', medication:'Medications' };
                      return (
                        <div key={type}>
                          <div style={{ padding:'8px 14px 4px', fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.08em' }}>{labels[type]}</div>
                          {items.map(item => (
                            <button key={item.id} onClick={item.action} style={{ width:'100%', padding:'9px 14px', display:'flex', alignItems:'center', gap:10, background:'none', border:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit', transition:'background 0.1s' }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#EFF4FF'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
                              <span style={{ fontSize:18, flexShrink:0 }}>{item.icon}</span>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:13, fontWeight:600, color:'#0A1628', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.label}</div>
                                {item.sub && <div style={{ fontSize:11, color:'#5A7A9B' }}>{item.sub}</div>}
                              </div>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C8DFF0" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </>
                )}
                {!searchQuery && (
                  <div style={{ padding:'16px 14px' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Quick Navigation</div>
                    {[
                      { icon:'❤️', label:'My Health', action: () => { setActivePage('my-health'); setShowSearch(false); } },
                      { icon:'📅', label:'Appointments', action: () => { setActivePage('appointments'); setShowSearch(false); } },
                      { icon:'💊', label:'Medications', action: () => { setActivePage('medications'); setShowSearch(false); } },
                      { icon:'🏘️', label:'Communities', action: () => { setActivePage('communities'); setShowSearch(false); } },
                      { icon:'🩺', label:'Find Doctors', action: () => { setActivePage('find-doctors'); setShowSearch(false); } },
                    ].map(item => (
                      <button key={item.label} onClick={item.action} style={{ width:'100%', padding:'7px 10px', display:'flex', alignItems:'center', gap:10, background:'none', border:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit', borderRadius:8, transition:'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#EFF4FF'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
                        <span style={{ fontSize:16 }}>{item.icon}</span>
                        <span style={{ fontSize:13, color:'#374151', fontWeight:500 }}>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
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
                  <button onClick={markAllRead} style={{ background:'none', border:'none', cursor:'pointer', color:'#2563EB', fontSize:12 }}>
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding:'32px 16px', textAlign:'center', color:'#94A3B8', fontSize:13 }}>
                    No notifications yet
                  </div>
                ) : notifications.map(n => {
                  const nData = (n as any).data ?? {};
                  const isDoctorRequest = n.type === 'SYSTEM' && nData.requestType === 'DOCTOR_ACCESS_REQUEST';
                  return (
                  <div
                    key={n.id}
                    className="hc-tb-notif-item"
                    style={{
                      background: isDoctorRequest ? 'rgba(99,102,241,0.06)' : n.isRead ? 'transparent' : '#EFF4FF',
                      borderLeft: isDoctorRequest ? '3px solid #6366F1' : n.isRead ? 'none' : '3px solid #2563EB',
                      cursor: isDoctorRequest ? 'default' : 'pointer',
                    }}
                    onClick={() => {
                      if (!isDoctorRequest && !n.isRead) {
                        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
                        setUnreadCount(prev => Math.max(0, prev - 1));
                        api.put(`/notifications/${n.id}/read`).catch(() => {});
                      }
                    }}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{notifIcon(n.type, nData)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                        <span style={{ color: n.isRead && !isDoctorRequest ? '#94A3B8' : '#0F2D2A', fontSize:13, fontWeight: n.isRead && !isDoctorRequest ? 400 : 600 }}>
                          {n.title}
                        </span>
                        {!n.isRead && !isDoctorRequest && <span style={{ width:6, height:6, borderRadius:'50%', background:'#2563EB', flexShrink:0 }}/>}
                        {isDoctorRequest && nData.isVerified && <span style={{ fontSize:9, padding:'1px 6px', borderRadius:100, background:'rgba(22,163,74,0.1)', color:'#16A34A', border:'1px solid rgba(22,163,74,0.25)', fontWeight:700 }}>✓ Verified</span>}
                      </div>
                      <p style={{ color:'#64748B', fontSize:12, margin:'0 0 8px', lineHeight:1.5 }}>{n.body}</p>
                      {isDoctorRequest ? (
                        <div style={{ display:'flex', gap:8, marginTop:4 }}>
                          <button
                            onClick={e => { e.stopPropagation(); handleConsentAction(n.id, nData, 'approve'); }}
                            disabled={consentLoading === n.id + 'approve' || consentLoading === n.id + 'reject'}
                            style={{ flex:1, padding:'7px 0', borderRadius:8, border:'none', background:'linear-gradient(135deg,#0D9488,#14B8A6)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                            {consentLoading === n.id + 'approve' ? '…' : '✓ Approve'}
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleConsentAction(n.id, nData, 'reject'); }}
                            disabled={consentLoading === n.id + 'approve' || consentLoading === n.id + 'reject'}
                            style={{ flex:1, padding:'7px 0', borderRadius:8, border:'1px solid rgba(244,63,94,0.3)', background:'rgba(244,63,94,0.06)', color:'#F43F5E', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                            {consentLoading === n.id + 'reject' ? '…' : '✕ Decline'}
                          </button>
                        </div>
                      ) : (
                        <span style={{ color:'#94A3B8', fontSize:11, marginTop:4, display:'block' }}>{timeAgo(n.createdAt)}</span>
                      )}
                      {isDoctorRequest && <span style={{ color:'#94A3B8', fontSize:10, marginTop:4, display:'block' }}>{timeAgo(n.createdAt)}</span>}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={userRef} style={{ position: 'relative' }}>
          <button className="hc-tb-user-btn" onClick={() => { setShowUserMenu(p => !p); setShowNotif(false); }}>
            <div className="hc-tb-avatar">{initials}</div>
            <span style={{ fontSize:12, fontWeight:600, color:'#374151', maxWidth:90, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
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
                <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#1849A9,#2563EB)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:15, fontWeight:800, margin:'0 auto 8px', letterSpacing:'0.5px' }}>{initials}</div>
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

      {/* Consent action toast */}
      {consentToast && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', zIndex:99999, background: consentToast.startsWith('✓') ? '#0D9488' : '#0F172A', color:'#fff', padding:'12px 24px', borderRadius:12, fontSize:13, fontWeight:600, boxShadow:'0 8px 24px rgba(0,0,0,0.25)', whiteSpace:'nowrap' as const }}>
          {consentToast}
        </div>
      )}
    </>
  );
}
