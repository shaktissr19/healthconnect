'use client';
// src/components/doctor/layout/DoctorTopbar.tsx

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

const SIDEBAR_W      = 268;
const SIDEBAR_W_MINI = 72;

const PAGE_META: Record<string, { label: string; icon: string }> = {
  'home':           { label: 'My Home',             icon: '🏠' },
  'patients':       { label: 'My Patients',        icon: '👥' },
  'appointments':   { label: 'Appointments',       icon: '📅' },
  'video-consults': { label: 'Video Consults',     icon: '📹' },
  'prescriptions':  { label: 'Prescriptions',      icon: '💊' },
  'records':        { label: 'Medical Records',    icon: '📋' },
  'communities':    { label: 'Community Q&A',      icon: '💬' },
  'earnings':       { label: 'Earnings',           icon: '💰' },
  'profile':        { label: 'My Profile',         icon: '👤' },
  'availability':   { label: 'Availability',       icon: '🕐' },
  'settings':       { label: 'Settings',           icon: '⚙️' },
};

const SEARCH_ROUTES = [
  { keywords: ['patient','patients','roster'],                 page: 'patients' },
  { keywords: ['appointment','schedule','booking','consult'],  page: 'appointments' },
  { keywords: ['video','telehealth','call','online'],          page: 'video-consults' },
  { keywords: ['prescription','rx','drug','medicine'],         page: 'prescriptions' },
  { keywords: ['record','report','lab','history','document'],  page: 'records' },
  { keywords: ['community','question','forum'],                page: 'communities' },
  { keywords: ['earning','payment','revenue','payout'],        page: 'earnings' },
  { keywords: ['profile','bio','qualification'],               page: 'profile' },
  { keywords: ['availability','slot','timing','hours'],        page: 'availability' },
  { keywords: ['setting','password','account'],                page: 'settings' },
];

interface Notification { id:string; title:string; body:string; type:string; isRead:boolean; read?:boolean; createdAt:string; }

// ── Find HC Patient modal ──────────────────────────────────────────────────────
interface HCPatientResult {
  id: string; hcId: string; firstName: string; lastName: string;
  age: number | null; city: string;
  requestStatus?: 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

function FindPatientModal({ onClose }: { onClose: () => void }) {
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState<HCPatientResult[]>([]);
  const [searched,  setSearched]  = useState(false);
  const [searching, setSearching] = useState(false);
  const [browseMode,setBrowseMode]= useState(false);
  const [requested, setRequested] = useState<Record<string,'sending'|'sent'|'error'>>({});
  const [toast,     setToast]     = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(''), 4000); return () => clearTimeout(t); }
  }, [toast]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const doSearch = async () => {
    const q = query.trim();
    if (q.length === 1) { setToast('Type at least 2 characters to search.'); return; }
    setSearching(true); setSearched(true); setResults([]);
    try {
      // Route: /doctor/search-patients (no /doctor/ prefix in routes file — mounted at /doctor in index.ts)
      const r: any = await api.get('/doctor/search-patients', q.length >= 2 ? { params: { q } } : {});
      const raw = r?.data?.data?.patients ?? r?.data?.patients ?? r?.data ?? [];
      setBrowseMode(!q || !!r?.data?.data?.browseMode);
      setResults((Array.isArray(raw) ? raw : []).map((p: any) => ({
        id:            p.id ?? p._id,
        hcId:          p.hcId ?? p.registrationId ?? p.regId ?? '—',
        firstName:     p.firstName ?? '',
        lastName:      p.lastName  ?? '',
        age:           p.age ?? (p.dateOfBirth ? Math.floor((Date.now()-new Date(p.dateOfBirth).getTime())/(365.25*24*3600*1000)) : null),
        city:          p.city ?? '—',
        requestStatus: p.accessRequestStatus ?? 'NONE',
      })));
    } catch {
      setToast('Search failed. Please try again.');
    } finally { setSearching(false); }
  };

  const handleRequest = async (patient: HCPatientResult) => {
    setRequested(prev => ({ ...prev, [patient.id]: 'sending' }));
    try {
      await api.post('/doctor/access-request', { patientId: patient.id });
      setRequested(prev => ({ ...prev, [patient.id]: 'sent' }));
      setResults(prev => prev.map(p => p.id === patient.id ? { ...p, requestStatus: 'PENDING' } : p));
      setToast(`Request sent to ${patient.firstName}. They will be notified in-app and by email.`);
    } catch {
      setRequested(prev => ({ ...prev, [patient.id]: 'error' }));
      setToast('Could not send request. Please try again.');
    }
  };

  const dName    = (p: HCPatientResult) => `${p.firstName} ${p.lastName}`.trim() || 'Unknown';
  const initials = (p: HCPatientResult) => `${(p.firstName[0]??'').toUpperCase()}${(p.lastName[0]??'').toUpperCase()}` || 'PT';
  const pill = (color: string, bg: string): React.CSSProperties => ({ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:100, background:bg, color, border:`1px solid ${color}30`, whiteSpace:'nowrap' });
  const statusPill = (s: HCPatientResult['requestStatus']) => {
    if (s==='PENDING')  return <span style={pill('#D97706','#FFFBEB')}>⏳ Pending</span>;
    if (s==='ACCEPTED') return <span style={pill('#16A34A','#F0FDF4')}>✓ Access Granted</span>;
    if (s==='REJECTED') return <span style={pill('#E11D48','#FFF1F2')}>✕ Declined</span>;
    return null;
  };

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(15,23,42,0.45)', display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:80 }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:580, background:'#FFFFFF', borderRadius:18, boxShadow:'0 24px 60px rgba(15,23,42,0.18)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(13,148,136,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'#1E293B' }}>Find HealthConnect Patient</div>
            <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>Search by name or HC ID — or click Search to browse all patients.</div>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:'50%', background:'#F1F5F9', border:'none', cursor:'pointer', fontSize:16, color:'#64748B', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>

        {/* Privacy notice */}
        <div style={{ margin:'14px 24px 0', padding:'10px 14px', background:'rgba(13,148,136,0.05)', borderRadius:10, border:'1px solid rgba(13,148,136,0.15)', display:'flex', gap:10, alignItems:'flex-start' }}>
          <span style={{ fontSize:14, flexShrink:0 }}>🔒</span>
          <p style={{ fontSize:12, color:'#0F766E', margin:0, lineHeight:1.6 }}>
            Patient health data is protected. Only name, HC ID, age and city are shown here. Full access requires the patient's explicit approval.
          </p>
        </div>

        {/* Search row */}
        <div style={{ padding:'16px 24px 12px', display:'flex', gap:10 }}>
          <div style={{ flex:1, position:'relative' }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94A3B8', pointerEvents:'none' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') doSearch(); }}
              placeholder="Name or HC ID (leave blank to browse all)…"
              style={{ width:'100%', padding:'10px 12px 10px 36px', borderRadius:10, border:'1px solid #E2E8F0', background:'#F8FAFC', color:'#1E293B', fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' as const }} />
          </div>
          <button onClick={doSearch} disabled={searching || query.trim().length === 1}
            style={{ padding:'10px 22px', borderRadius:10, border:'none', background:(searching||query.trim().length===1)?'#E2E8F0':'linear-gradient(135deg,#0F766E,#0D9488)', color:(searching||query.trim().length===1)?'#94A3B8':'#fff', fontSize:13, fontWeight:700, cursor:(searching||query.trim().length===1)?'not-allowed':'pointer', whiteSpace:'nowrap' as const, transition:'all 0.15s', flexShrink:0, display:'flex', alignItems:'center', gap:7 }}>
            {searching
              ? <><span style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'drSpin 0.7s linear infinite', display:'inline-block' }}/> Searching…</>
              : 'Search'
            }
          </button>
        </div>

        {/* Results area */}
        <div style={{ maxHeight:360, overflowY:'auto', padding:'0 24px 20px' }}>

          {/* Pre-search state */}
          {!searched && !searching && (
            <div style={{ padding:'28px 0', textAlign:'center', color:'#94A3B8', fontSize:13 }}>
              <div style={{ fontSize:36, marginBottom:10 }}>🔍</div>
              <div style={{ fontWeight:600, color:'#64748B', marginBottom:4 }}>Search for a patient</div>
              <div>Type a name or HC ID and click Search, or click Search with no text to browse all.</div>
            </div>
          )}

          {/* Results label */}
          {!searching && searched && results.length > 0 && (
            <div style={{ fontSize:11, color:'#94A3B8', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' as const, marginBottom:10 }}>
              {browseMode
                ? `Browsing all patients — ${results.length} shown${results.length===50?' · type a name to narrow down':''}`
                : `${results.length} result${results.length!==1?'s':''} for "${query}"`}
            </div>
          )}

          {/* No results */}
          {!searching && searched && results.length === 0 && (
            <div style={{ padding:'28px 0', textAlign:'center', color:'#94A3B8', fontSize:13 }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🤷</div>
              No patients found{query.trim() ? ` for "${query}"` : ''}. Try a different name or HC ID.
            </div>
          )}

          {/* Patient cards */}
          {!searching && results.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {results.map(p => {
                const reqState = requested[p.id];
                const status   = reqState === 'sent' ? 'PENDING' : p.requestStatus;
                return (
                  <div key={p.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px', borderRadius:12, border:'1px solid #F1F5F9', background:'#FAFAFA' }}>
                    <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#0D9488,#0F766E)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff', flexShrink:0 }}>
                      {initials(p)}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' as const }}>
                        <span style={{ fontSize:13, fontWeight:700, color:'#1E293B' }}>{dName(p)}</span>
                        {statusPill(status)}
                      </div>
                      <div style={{ display:'flex', gap:10, marginTop:3, flexWrap:'wrap' as const }}>
                        <span style={{ fontSize:11, color:'#64748B', fontFamily:'monospace', background:'#F1F5F9', padding:'1px 6px', borderRadius:4 }}>{p.hcId}</span>
                        {p.age && <span style={{ fontSize:11, color:'#64748B' }}>Age {p.age}</span>}
                        {p.city !== '—' && <span style={{ fontSize:11, color:'#64748B' }}>📍 {p.city}</span>}
                      </div>
                    </div>
                    <div style={{ flexShrink:0 }}>
                      {status === 'NONE' && <button onClick={() => handleRequest(p)} disabled={reqState==='sending'} style={{ padding:'7px 14px', borderRadius:9, border:'none', background:reqState==='sending'?'#E2E8F0':'linear-gradient(135deg,#0F766E,#0D9488)', color:reqState==='sending'?'#94A3B8':'#fff', fontSize:12, fontWeight:700, cursor:reqState==='sending'?'not-allowed':'pointer', whiteSpace:'nowrap' as const }}>{reqState==='sending'?'…':'Request Access'}</button>}
                      {status === 'PENDING'  && <span style={{ fontSize:11, color:'#D97706', fontWeight:600 }}>Awaiting response</span>}
                      {status === 'ACCEPTED' && (
                        <button onClick={() => { window.location.href = '/patient-profile/' + p.id; onClose(); }}
                          style={{ padding:'7px 14px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#4F46E5,#6366F1)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' as const }}>
                          View Profile →
                        </button>
                      )}
                      {status === 'REJECTED' && (
                        <button onClick={() => handleRequest(p)} disabled={reqState==='sending'}
                          style={{ padding:'7px 14px', borderRadius:9, border:'1px solid #E2E8F0', background:'#F8FAFC', color:'#64748B', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' as const }}>
                          Request Again
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ margin:'0 24px 20px', padding:'12px 16px', background:'#1E293B', borderRadius:10, color:'#fff', fontSize:12, fontWeight:600, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>{toast}</span>
            <button onClick={() => setToast('')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:15, padding:0, marginLeft:12 }}>✕</button>
          </div>
        )}
      </div>
    </div>
  );
}

function timeAgo(d:string):string { const diff=Date.now()-new Date(d).getTime(),m=Math.floor(diff/60000),h=Math.floor(diff/3600000); if(m<1)return'Just now'; if(m<60)return`${m}m ago`; if(h<24)return`${h}h ago`; return`${Math.floor(h/24)}d ago`; }

const MOCK_NOTIFS: Notification[] = [
  { id:'n1', title:'New appointment request', body:'Priya Sharma wants to book a consultation for Thursday 3pm', type:'APPOINTMENT', isRead:false, createdAt:new Date(Date.now()-8*60000).toISOString() },
  { id:'n2', title:'Patient uploaded lab report', body:'Rahul Kumar has shared his blood test results with you', type:'REPORT', isRead:false, createdAt:new Date(Date.now()-35*60000).toISOString() },
  { id:'n3', title:'Community question', body:'A patient asked about Type 2 Diabetes management in the community', type:'COMMUNITY', isRead:true, createdAt:new Date(Date.now()-2*3600000).toISOString() },
];

export default function DoctorTopbar() {
  const router  = useRouter();
  const uiStore = useUIStore() as any;
  const { activePage, setActivePage, toggleSidebar } = uiStore;
  const sidebarOpen = uiStore.sidebarOpen;
  // CRITICAL: Do NOT use useAuthStore() as a reactive hook here.
  // It causes re-renders every time the store changes (during Zustand rehydration),
  // which briefly exposes user=undefined and triggers the dashboard switching loop.
  const [user, setUser] = useState<any>(() => (useAuthStore.getState() as any).user);
  useEffect(() => {
    const unsub = (useAuthStore as any).subscribe((s: any) => setUser(s.user));
    return () => unsub();
  }, []);
  const clearAuth = (useAuthStore.getState() as any).clearAuth;

  const [searchQ,         setSearchQ]         = useState('');
  const [showSearch,      setShowSearch]       = useState(false);
  const [showFindPatient, setShowFindPatient]  = useState(false);
  const [showNotif,       setShowNotif]        = useState(false);
  const [showUserMenu,    setShowUserMenu]      = useState(false);
  const [notifications,   setNotifications]    = useState<Notification[]>(MOCK_NOTIFS);
  const [unreadCount,     setUnreadCount]      = useState(2);
  const [badgePulse,      setBadgePulse]       = useState(false);
  const [rating,          setRating]           = useState<number|null>(null);
  const [todayAppts,      setTodayAppts]       = useState<number|null>(null);

  const notifRef   = useRef<HTMLDivElement>(null);
  const userRef    = useRef<HTMLDivElement>(null);
  const searchRef  = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSeenId = useRef<string>('');  // track newest notification id seen

  const firstName = user?.firstName ?? '';
  const lastName  = user?.lastName  ?? '';
  const fullName  = [firstName, lastName].filter(Boolean).join(' ') || 'Doctor';
  const initials  = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || 'DR';
  const pageMeta  = PAGE_META[activePage] ?? { label: 'Dashboard', icon: '🏠' };
  const collapsed = sidebarOpen === false;
  const sidebarW  = collapsed ? SIDEBAR_W_MINI : SIDEBAR_W;

  // ── Fetch notifications and check for new ones ──────────────────────────────
  const fetchNotifications = useCallback(async (isPolling = false) => {
    try {
      const r: any = await api.get('/notifications');
      const arr = r?.data?.data?.notifications ?? r?.data?.notifications ?? r?.data ?? [];
      if (Array.isArray(arr) && arr.length > 0) {
        const fresh = arr.slice(0, 10);
        setNotifications(fresh);
        const unread = fresh.filter((n: any) => !n.isRead && !n.read);
        setUnreadCount(unread.length);

        // If polling: check if there's a newer notification than we last saw
        if (isPolling && lastSeenId.current) {
          const newestId = fresh[0]?.id;
          if (newestId && newestId !== lastSeenId.current) {
            // New notification arrived — animate the badge
            setBadgePulse(true);
            setTimeout(() => setBadgePulse(false), 2000);
          }
        }
        if (fresh[0]?.id) lastSeenId.current = fresh[0].id;
      }
    } catch {}
  }, []);

  useEffect(() => {
    // Initial load
    api.get('/doctor/dashboard').then((r: any) => {
      const d = r?.data?.data ?? r?.data ?? {};
      setRating(d.rating ?? d.averageRating ?? null);
      setTodayAppts(d.todayAppointments ?? d.kpis?.todayAppts ?? null);
    }).catch(() => {});

    fetchNotifications(false);

    // Poll every 30 seconds
    pollRef.current = setInterval(() => fetchNotifications(true), 15_000);

    // Refetch when tab becomes visible (user switches back)
    const onVisible = () => { if (document.visibilityState === 'visible') fetchNotifications(true); };
    document.addEventListener('visibilitychange', onVisible);

    // Refetch immediately when appointment is booked (same tab only)
    const onBooked = () => fetchNotifications(true);
    window.addEventListener('hcAppointmentBooked', onBooked);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('hcAppointmentBooked', onBooked);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setShowUserMenu(false);
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setShowSearch(false);
        setSearchQ('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { if (showSearch) searchRef.current?.focus(); }, [showSearch]);

  const handleSearch = useCallback((q: string) => {
    const lower = q.toLowerCase();
    const match = SEARCH_ROUTES.find(r => r.keywords.some(k => lower.includes(k)));
    if (match) { setActivePage(match.page); setShowSearch(false); setSearchQ(''); }
  }, [setActivePage]);

  const handleLogout = useCallback(() => {
    clearAuth?.();
    document.cookie = 'hc_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.replace('/');
  }, [clearAuth, router]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
    setUnreadCount(0);
    api.put('/notifications/read-all').catch(() => {});
  };

  const notifIcon = (type: string) => ({ APPOINTMENT:'📅', REPORT:'📋', COMMUNITY:'💬', ALERT:'🔔' }[type] ?? '🔔');
  const ratingColor = (r: number|null) => !r ? '#94A3B8' : r >= 4.5 ? '#22C55E' : r >= 3.5 ? '#F59E0B' : '#F43F5E';

  return (
    <>
      <style>{`
        .dr-tb {
          position: fixed; top: 0; left: 0; right: 0; height: 64px; z-index: 200;
          background: rgba(255,255,255,0.98); backdrop-filter: blur(16px);
          border-bottom: 1px solid #E2E8F0;
          display: flex; align-items: center; padding: 0 24px; gap: 16px;
          transition: left 0.25s cubic-bezier(.4,0,.2,1);
        }
        .dr-tb-hamburger { background: none; border: none; cursor: pointer; color: #64748B; display: flex; align-items: center; padding: 6px; border-radius: 8px; transition: all 0.2s; }
        .dr-tb-hamburger:hover { background: #F1F5F9; color: #0D9488; }
        .dr-tb-breadcrumb { display: flex; align-items: center; gap: 8px; flex: 1; }
        .dr-tb-breadcrumb-home { font-size: 12px; color: #94A3B8; cursor: pointer; transition: color 0.15s; }
        .dr-tb-breadcrumb-home:hover { color: #0D9488; }
        .dr-tb-breadcrumb-sep { color: #CBD5E1; font-size: 12px; }
        .dr-tb-breadcrumb-cur { font-size: 13px; font-weight: 700; color: #1E293B; }

        .dr-tb-search-wrap { position: relative; display: flex; align-items: center; }
        .dr-tb-search-btn { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 9px; padding: 8px 12px; cursor: pointer; color: #64748B; display: flex; align-items: center; gap: 8px; transition: all 0.2s; white-space: nowrap; }
        .dr-tb-search-btn:hover { background: #F1F5F9; color: #0D9488; }
        .dr-tb-search-expanded { display: flex; align-items: center; gap: 0; background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 9px; overflow: hidden; width: 260px; height: 38px; box-shadow: 0 0 0 3px rgba(13,148,136,0.08); }
        .dr-tb-search-icon { display: flex; align-items: center; padding: 0 10px; color: #94A3B8; flex-shrink: 0; }
        .dr-tb-search-input { flex: 1; border: none; outline: none; background: transparent; color: #1E293B; font-size: 13px; font-family: inherit; padding: 0 10px 0 0; height: 100%; }
        .dr-tb-search-close { background: none; border: none; cursor: pointer; color: #94A3B8; padding: 0 10px; display: flex; align-items: center; flex-shrink: 0; font-size: 16px; line-height: 1; }
        .dr-tb-search-close:hover { color: #475569; }

        .dr-tb-rating { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 100px; background: rgba(13,148,136,0.07); border: 1px solid rgba(13,148,136,0.15); cursor: default; white-space: nowrap; }
        .dr-tb-appts  { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 100px; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.15); cursor: pointer; white-space: nowrap; transition: all 0.2s; }
        .dr-tb-appts:hover { background: rgba(34,197,94,0.12); }

        .dr-tb-icon-btn { position: relative; background: none; border: none; cursor: pointer; color: #3A5068; padding: 8px; border-radius: 9px; display: flex; align-items: center; transition: all 0.2s; }
        .dr-tb-icon-btn:hover { background: #F1F5F9; color: #0D9488; }
        .dr-tb-badge { position: absolute; top: 3px; right: 3px; min-width: 16px; height: 16px; border-radius: 100px; background: #F43F5E; color: #fff; font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center; padding: 0 3px; border: 2px solid #FFFFFF; transition: transform 0.2s; }
        .dr-tb-badge-pulse { animation: badgePop 0.4s ease forwards, badgeRing 1.5s ease 0.4s; }
        @keyframes badgePop { 0%{transform:scale(1)} 40%{transform:scale(1.6)} 70%{transform:scale(0.9)} 100%{transform:scale(1)} }
        @keyframes badgeRing { 0%,100%{box-shadow:0 0 0 0 rgba(244,63,94,0.5)} 50%{box-shadow:0 0 0 5px rgba(244,63,94,0)} }
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }

        .dr-tb-user-btn { display: flex; align-items: center; gap: 8px; background: none; border: 1px solid #E2E8F0; border-radius: 10px; padding: 6px 12px 6px 8px; cursor: pointer; transition: all 0.2s; }
        .dr-tb-user-btn:hover { background: #F8FAFC; border-color: #CBD5E1; }
        .dr-tb-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg,#0D9488,#0F766E); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: #fff; flex-shrink: 0; letter-spacing: 0.5px; }

        .dr-tb-dropdown { position: absolute; right: 0; top: 48px; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; box-shadow: 0 8px 30px rgba(15,23,42,0.12); z-index: 9999; overflow: hidden; }
        .dr-tb-dropdown-hd { padding: 14px 16px; border-bottom: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: space-between; }
        .dr-tb-notif-item { display: flex; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #F1F5F9; cursor: pointer; transition: background 0.15s; }
        .dr-tb-notif-item:hover { background: rgba(59,130,246,0.04); }
        .dr-tb-menu-item { width: 100%; padding: 10px 16px; background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 13px; color: #7A8FA8; text-align: left; transition: all 0.15s; font-family: inherit; }
        .dr-tb-menu-item:hover { background: #F8FAFC; color: #0D9488; }
        .dr-tb-find-btn { display:flex; align-items:center; gap:7px; padding:7px 14px; border-radius:9px; border:1px solid rgba(13,148,136,0.3); background:rgba(13,148,136,0.06); color:#0D9488; font-size:12px; font-weight:700; cursor:pointer; white-space:nowrap; transition:all 0.2s; font-family:inherit; flex-shrink:0; }
        .dr-tb-find-btn:hover { background:rgba(13,148,136,0.14); border-color:rgba(13,148,136,0.5); }
        @keyframes drSpin { to { transform: rotate(360deg); } }
      `}</style>

      <header className="dr-tb">
        {/* Hamburger */}
        <button className="dr-tb-hamburger" onClick={toggleSidebar} title="Toggle sidebar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        {/* HealthConnect Home */}
        <button onClick={() => window.location.href='/?home=1'}
          style={{ display:'flex',alignItems:'center',gap:6,padding:'5px 12px',borderRadius:9,border:'1px solid rgba(13,148,136,0.2)',background:'rgba(13,148,136,0.06)',cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,fontSize:11,fontWeight:700,color:'#0D9488' }}>
          🏠 HealthConnect Home ↗
        </button>

        {/* Breadcrumb */}
        <div className="dr-tb-breadcrumb">
          <span className="dr-tb-breadcrumb-home" onClick={() => setActivePage('home')}>Dashboard</span>
          <span className="dr-tb-breadcrumb-sep">›</span>
          <span className="dr-tb-breadcrumb-cur">{pageMeta.icon} {pageMeta.label}</span>
        </div>

        {/* Search */}
        <div ref={searchWrapRef} className="dr-tb-search-wrap">
          {showSearch ? (
            <div className="dr-tb-search-expanded">
              <span className="dr-tb-search-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input
                ref={searchRef} className="dr-tb-search-input"
                value={searchQ} placeholder="Search patients, records…"
                onChange={e => setSearchQ(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSearch(searchQ);
                  if (e.key === 'Escape') { setShowSearch(false); setSearchQ(''); }
                }}
              />
              <button className="dr-tb-search-close" onClick={() => { setShowSearch(false); setSearchQ(''); }}>✕</button>
            </div>
          ) : (
            <button className="dr-tb-search-btn" onClick={() => setShowSearch(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span style={{ fontSize: 12 }}>Search…</span>
            </button>
          )}
        </div>

        {/* Find HC Patient */}
        <button className="dr-tb-find-btn" onClick={() => { setShowFindPatient(true); setShowNotif(false); setShowUserMenu(false); }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Find HC Patient
        </button>

        {/* Today's appointments chip */}
        {todayAppts !== null && (
          <button className="dr-tb-appts" onClick={() => setActivePage('appointments')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#22C55E' }}>{todayAppts} Today</span>
          </button>
        )}

        {/* Doctor rating chip */}
        <div className="dr-tb-rating">
          <svg width="13" height="13" viewBox="0 0 24 24" fill={rating ? ratingColor(rating) : 'none'} stroke={ratingColor(rating)} strokeWidth="2" strokeLinecap="round">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
          </svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: ratingColor(rating) }}>
            {rating ? rating.toFixed(1) : '—'} Rating
          </span>
        </div>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button className="dr-tb-icon-btn" onClick={() => { setShowNotif(p => !p); setShowUserMenu(false); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && <span className={`dr-tb-badge${badgePulse ? ' dr-tb-badge-pulse' : ''}`}>{unreadCount}</span>}
          </button>

          {showNotif && (
            <div className="dr-tb-dropdown" style={{ width: 360 }}>
              <div className="dr-tb-dropdown-hd">
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ color: '#1E293B', fontWeight: 700, fontSize: 14 }}>Notifications</span>
                  {unreadCount > 0 && <span style={{ background: '#F43F5E', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '2px 7px' }}>{unreadCount}</span>}
                  <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'#22C55E', fontWeight:600 }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:'#22C55E', animation:'livePulse 2s ease infinite', display:'inline-block' }}/>
                    Live
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0D9488', fontSize: 12 }}>Mark all read</button>
                )}
              </div>
              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                {notifications.map(n => (
                  <div key={n.id} className="dr-tb-notif-item" style={{ background: n.isRead ? 'transparent' : 'rgba(13,148,136,0.05)', borderLeft: n.isRead ? 'none' : '3px solid #0D9488' }}
                      onClick={() => {
                        if (!n.isRead || !n.read) {
                          setNotifications(prev => prev.map(x => x.id===n.id ? {...x,isRead:true} : x));
                          setUnreadCount(prev => Math.max(0, prev-1));
                          api.put(`/notifications/${n.id}/read`).catch(()=>{});
                        }
                      }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{notifIcon(n.type)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ color: n.isRead ? '#4A6080' : '#C8D8F0', fontSize: 13, fontWeight: n.isRead ? 400 : 600 }}>{n.title}</span>
                        {!n.isRead && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2DD4BF', flexShrink: 0 }} />}
                      </div>
                      <p style={{ color: '#3A5068', fontSize: 12, margin: 0, lineHeight: 1.5 }}>{n.body}</p>
                      <span style={{ color: '#1C3045', fontSize: 11, marginTop: 4, display: 'block' }}>{timeAgo(n.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={userRef} style={{ position: 'relative' }}>
          <button className="dr-tb-user-btn" onClick={() => { setShowUserMenu(p => !p); setShowNotif(false); }}>
            <div className="dr-tb-avatar">{initials}</div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#7A8FA8', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Dr. {firstName}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3A5068" strokeWidth="2" strokeLinecap="round"
              style={{ transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
              <polyline points="6,9 12,15 18,9"/>
            </svg>
          </button>

          {showUserMenu && (
            <div className="dr-tb-dropdown" style={{ width: 220, top: 50 }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #F1F5F9', textAlign: 'center' }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#0D9488,#0F766E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 800, margin: '0 auto 9px', letterSpacing: '0.5px' }}>{initials}</div>
                <div style={{ color: '#C8D8F0', fontSize: 14, fontWeight: 700 }}>Dr. {fullName}</div>
                <div style={{ color: '#1C3045', fontSize: 11, marginTop: 2 }}>{(useAuthStore.getState() as any).user?.registrationId ?? ''}</div>
              </div>
              {[
                { icon: '👤', label: 'My Profile',   action: () => setActivePage('profile') },
                { icon: '🕐', label: 'Availability',  action: () => setActivePage('availability') },
                { icon: '⚙️', label: 'Settings',     action: () => setActivePage('settings') },
              ].map(item => (
                <button key={item.label} className="dr-tb-menu-item" onClick={() => { item.action(); setShowUserMenu(false); }}>
                  <span style={{ fontSize: 15 }}>{item.icon}</span>{item.label}
                </button>
              ))}
              <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />
              <button onClick={handleLogout} className="dr-tb-menu-item" style={{ color: '#F43F5E' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>
      {showFindPatient && <FindPatientModal onClose={() => setShowFindPatient(false)} />}
    </>
  );
}
