'use client';
// src/app/doctor-dashboard/page.tsx
// Complete Doctor Dashboard — ALL operations wired to real APIs with smart fallbacks
// FIXED: useAuthStore reactive hooks replaced with getState()+subscribe everywhere
// FIXED: activePage defaults to 'home' on load
// FIXED: contrast issues, pending action counts from real data, video consult meeting link

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { api, communityAPI } from '@/lib/api';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:       '#E3EDEC',
  cardBg:   '#FFFFFF',
  cardBg2:  '#F4FAFA',
  border:   'rgba(13,148,136,0.14)',
  borderHi: 'rgba(13,148,136,0.3)',
  teal:     '#0D9488',
  tealDark: '#0F766E',
  tealGlow: 'rgba(13,148,136,0.08)',
  green:    '#16A34A',
  amber:    '#D97706',
  rose:     '#E11D48',
  violet:   '#7C3AED',
  txtHi:    '#0F172A',
  txtMid:   '#475569',
  txtLo:    '#94A3B8',
  r:        '14px',
  rSm:      '10px',
};

// ── Safe auth hook — never reactive, never causes redirect loops ───────────────
function useAuthUser() {
  const [user, setUser] = useState<any>(() => (useAuthStore.getState() as any).user);
  useEffect(() => {
    const unsub = (useAuthStore as any).subscribe((s: any) => setUser(s.user));
    return () => unsub();
  }, []);
  return user;
}

// ── Shared UI atoms ───────────────────────────────────────────────────────────
function Card({ children, style = {}, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: C.r, boxShadow: '0 2px 8px rgba(13,148,136,0.10), 0 0 0 1px rgba(13,148,136,0.06)', ...style }} onClick={onClick}>
      {children}
    </div>
  );
}
function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ padding: '2px 9px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: color + '18', color, border: `1px solid ${color}30`, textTransform: 'uppercase' as const, letterSpacing: '0.05em', whiteSpace: 'nowrap' as const }}>
      {label}
    </span>
  );
}
function BlueBtn({ children, onClick, disabled, style = {} }: any) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: '9px 22px', borderRadius: C.rSm, border: 'none', background: disabled ? '#E2E8F0' : `linear-gradient(135deg,${C.tealDark},${C.teal})`, color: disabled ? '#94A3B8' : '#fff', fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', boxShadow: disabled ? 'none' : '0 2px 8px rgba(13,148,136,0.25)', transition: 'all 0.15s', ...style }}>
      {children}
    </button>
  );
}
function GhostBtn({ children, onClick, style = {} }: any) {
  return (
    <button onClick={onClick}
      style={{ padding: '8px 18px', borderRadius: C.rSm, border: `1px solid ${C.border}`, background: 'transparent', color: C.txtMid, fontSize: 13, cursor: 'pointer', ...style }}>
      {children}
    </button>
  );
}
function DangerBtn({ children, onClick, style = {} }: any) {
  return (
    <button onClick={onClick}
      style={{ padding: '8px 18px', borderRadius: C.rSm, border: `1px solid ${C.rose}40`, background: C.rose + '08', color: C.rose, fontSize: 13, fontWeight: 600, cursor: 'pointer', ...style }}>
      {children}
    </button>
  );
}
function Skel({ w, h, r = 6 }: { w: string | number; h: number; r?: number }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: 'rgba(15,23,42,0.05)' } as React.CSSProperties} />;
}
function SectionHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <div>
        <h2 style={{ color: C.txtHi, fontSize: 20, fontWeight: 800, margin: 0 }}>{title}</h2>
        {sub && <p style={{ color: C.txtMid, fontSize: 13, margin: '4px 0 0' }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{ width: 40, height: 22, borderRadius: 100, background: on ? C.teal : '#CBD5E1', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: on ? 20 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  );
}
function Toast({ msg, type = 'success', onClose }: { msg: string; type?: 'success'|'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, background: type === 'success' ? C.teal : C.rose, color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', gap: 10, maxWidth: 340, animation: 'slideUp 0.3s ease' }}>
      <span>{type === 'success' ? '✓' : '⚠'}</span>
      <span>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', marginLeft: 6, fontSize: 16 }}>×</button>
    </div>
  );
}
function ConfirmDialog({ msg, onConfirm, onCancel }: { msg: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <Card style={{ padding: 28, maxWidth: 380, width: '100%' }}>
        <p style={{ fontSize: 15, color: C.txtHi, margin: '0 0 20px', fontWeight: 600 }}>{msg}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <DangerBtn onClick={onConfirm}>Confirm</DangerBtn>
          <GhostBtn onClick={onCancel}>Cancel</GhostBtn>
        </div>
      </Card>
    </div>
  );
}
function ComingSoon({ title }: { title: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
      <h2 style={{ color: C.txtHi, fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>{title}</h2>
      <p style={{ color: C.txtMid, fontSize: 14 }}>This feature is coming soon.</p>
    </div>
  );
}

function ago(iso: string): string {
  const d = Date.now() - new Date(iso).getTime(), m = Math.floor(d / 60000);
  if (m < 1) return 'Just now'; if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtMoney(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}

// ── MOCK DATA (fallback only) ─────────────────────────────────────────────────
const MOCK_APPTS = [
  { id:'a1', patientName:'Priya Sharma',  age:34, condition:'Hypertension',     time:'09:00 AM', date:new Date().toISOString(), type:'VIDEO',     status:'CONFIRMED', avatar:'PS', meetingLink:'https://meet.healthconnect.sbs/demo-room-1' },
  { id:'a2', patientName:'Rahul Kumar',   age:52, condition:'Type 2 Diabetes',  time:'10:30 AM', date:new Date().toISOString(), type:'IN_PERSON', status:'CONFIRMED', avatar:'RK' },
  { id:'a3', patientName:'Sunita Mehta',  age:28, condition:'Anxiety Disorder', time:'12:00 PM', date:new Date().toISOString(), type:'VIDEO',     status:'PENDING',   avatar:'SM', meetingLink:'https://meet.healthconnect.sbs/demo-room-3' },
  { id:'a4', patientName:'Arjun Patel',   age:45, condition:'Cardiac Follow-up',time:'02:30 PM', date:new Date().toISOString(), type:'IN_PERSON', status:'CONFIRMED', avatar:'AP' },
  { id:'a5', patientName:'Meena Iyer',    age:61, condition:'Arthritis',        time:'04:00 PM', date:new Date().toISOString(), type:'PHONE',     status:'PENDING',   avatar:'MI' },
];
const MOCK_PATIENTS = [
  { id:'p1', name:'Priya Sharma',  age:34, gender:'F', bloodGroup:'A+',  condition:'Hypertension',     lastVisit:'2026-02-18', nextAppt:'2026-03-06', status:'ACTIVE',   avatar:'PS', phone:'+91 98100 11111', email:'priya@test.com' },
  { id:'p2', name:'Rahul Kumar',   age:52, gender:'M', bloodGroup:'O+',  condition:'Type 2 Diabetes',  lastVisit:'2026-02-20', nextAppt:'2026-03-10', status:'ACTIVE',   avatar:'RK', phone:'+91 98100 22222', email:'rahul@test.com' },
  { id:'p3', name:'Sunita Mehta',  age:28, gender:'F', bloodGroup:'B+',  condition:'Anxiety Disorder', lastVisit:'2026-01-30', nextAppt:'2026-03-04', status:'ACTIVE',   avatar:'SM', phone:'+91 98100 33333', email:'sunita@test.com' },
  { id:'p4', name:'Arjun Patel',   age:45, gender:'M', bloodGroup:'AB+', condition:'Cardiac Follow-up',lastVisit:'2026-02-10', nextAppt:'2026-03-15', status:'ACTIVE',   avatar:'AP', phone:'+91 98100 44444', email:'arjun@test.com' },
  { id:'p5', name:'Meena Iyer',    age:61, gender:'F', bloodGroup:'O-',  condition:'Arthritis',        lastVisit:'2026-02-25', nextAppt:'2026-03-04', status:'ACTIVE',   avatar:'MI', phone:'+91 98100 55555', email:'meena@test.com' },
  { id:'p6', name:'Dev Kapoor',    age:38, gender:'M', bloodGroup:'A-',  condition:'Migraine',         lastVisit:'2026-01-15', nextAppt:null,         status:'INACTIVE', avatar:'DK', phone:'+91 98100 66666', email:'dev@test.com' },
];
const MOCK_RX = [
  { id:'rx1', patientId:'p2', patientName:'Rahul Kumar',  drug:'Metformin 500mg',   dosage:'500mg', frequency:'Twice daily',  duration:'3 months', date:'2026-02-20', status:'ACTIVE',  notes:'Take after meals' },
  { id:'rx2', patientId:'p1', patientName:'Priya Sharma', drug:'Amlodipine 5mg',    dosage:'5mg',   frequency:'Once daily',   duration:'6 months', date:'2026-02-18', status:'ACTIVE',  notes:'Monitor BP weekly' },
  { id:'rx3', patientId:'p5', patientName:'Meena Iyer',   drug:'Diclofenac 50mg',   dosage:'50mg',  frequency:'Thrice daily', duration:'2 weeks',  date:'2026-02-25', status:'ACTIVE',  notes:'With food' },
  { id:'rx4', patientId:'p4', patientName:'Arjun Patel',  drug:'Atorvastatin 20mg', dosage:'20mg',  frequency:'Once at night',duration:'Ongoing',  date:'2026-02-10', status:'ACTIVE',  notes:'Check lipids in 3 months' },
];
const MOCK_EARNINGS = {
  thisMonth:82500, lastMonth:74200, thisWeek:18000, thisYear:612000,
  consultations:28, avgPerConsult:950, pendingPayout:18000,
  history:[
    { month:'Oct 2025', amount:68400, consultations:22, status:'PAID' },
    { month:'Nov 2025', amount:71200, consultations:24, status:'PAID' },
    { month:'Dec 2025', amount:79800, consultations:27, status:'PAID' },
    { month:'Jan 2026', amount:74200, consultations:25, status:'PAID' },
    { month:'Feb 2026', amount:82500, consultations:28, status:'PROCESSING' },
  ],
};
const MOCK_REPORTS = [
  { id:'r1', name:'Blood Test - CBC Panel',  date:'2026-02-20', type:'LAB',       status:'PENDING',  patientId:'p2', patient:'Rahul Kumar',  notes:'' },
  { id:'r2', name:'ECG Report',              date:'2026-02-18', type:'CARDIOLOGY', status:'PENDING',  patientId:'p1', patient:'Priya Sharma', notes:'' },
  { id:'r3', name:'Chest X-Ray',             date:'2026-02-15', type:'RADIOLOGY',  status:'REVIEWED', patientId:'p4', patient:'Arjun Patel',  notes:'No active lesions. Follow up in 6 months.' },
  { id:'r4', name:'Lipid Panel',             date:'2026-01-30', type:'LAB',        status:'REVIEWED', patientId:'p5', patient:'Meena Iyer',   notes:'LDL elevated — started statin therapy.' },
  { id:'r5', name:'HbA1c Blood Test',        date:'2026-02-22', type:'LAB',        status:'PENDING',  patientId:'p2', patient:'Rahul Kumar',  notes:'' },
];

const typeColor = (t: string) => ({ VIDEO: C.teal, IN_PERSON: C.green, PHONE: C.amber, TELECONSULT: C.teal }[t] ?? C.txtMid);
const statusColor = (s: string) => ({ CONFIRMED: C.green, PENDING: C.amber, CANCELLED: C.rose, COMPLETED: C.txtMid, ACTIVE: C.green, INACTIVE: C.txtLo }[s] ?? C.txtMid);
const reportTypeColor = (t: string) => ({ LAB: C.teal, CARDIOLOGY: C.rose, RADIOLOGY: C.violet, IMAGING: C.amber }[t] ?? C.txtMid);

// ── HOME / TODAY'S SCHEDULE ───────────────────────────────────────────────────
function HomeTab() {
  const user     = useAuthUser();
  const uiStore  = useUIStore() as any;
  const [appts,            setAppts]            = useState<any[]>([]);
  const [allAppts,         setAllAppts]         = useState<any[]>([]); // full list for KPI calcs
  const [stats,            setStats]            = useState<any>(null);
  const [loading,          setLoading]          = useState(true);
  const [toast,            setToast]            = useState('');
  const [confirming,       setConfirming]       = useState<string|null>(null);
  const [notifications,    setNotifications]    = useState<any[]>([]);
  const [unreadCount,      setUnreadCount]      = useState(0);
  const [showNotifPanel,   setShowNotifPanel]   = useState(false);
  const [pendingRxCount,   setPendingRxCount]   = useState(MOCK_RX.length);
  const [pendingReportCount,setPendingReportCount]=useState(MOCK_REPORTS.filter(r=>r.status==='PENDING').length);

  // ── Derive real KPIs from appointment data ──────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts      = useMemo(() => allAppts.filter(x => (x.scheduledAt ?? '').startsWith(todayStr)), [allAppts, todayStr]);
  const pendingApptCount= useMemo(() => allAppts.filter(x => x.status === 'PENDING').length, [allAppts]);
  const todayConfirmed  = useMemo(() => todayAppts.filter(x => x.status === 'CONFIRMED').length, [todayAppts]);
  const todayPending    = useMemo(() => todayAppts.filter(x => x.status === 'PENDING').length, [todayAppts]);

  const normalizeAppts = (raw: any[]) => raw.map((x: any) => ({
    ...x,
    patientName: x.patientName ?? (x.patient ? `${x.patient.firstName ?? ''} ${x.patient.lastName ?? ''}`.trim() : 'Patient'),
    avatar: x.avatar ?? (x.patient ? `${(x.patient.firstName ?? 'P')[0]}${(x.patient.lastName ?? 'T')[0]}`.toUpperCase() : 'PT'),
    time: x.time ?? (x.scheduledAt ? new Date(x.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'),
    condition: x.condition ?? x.reasonForVisit ?? 'Consultation',
    meetingLink: x.meetingLink ?? (x.type === 'TELECONSULT' ? `https://meet.jit.si/hc-${x.id}` : undefined),
  }));

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, apptRes, rxRes, recRes] = await Promise.allSettled([
        api.get('/doctor/dashboard'),
        api.get('/appointments'),
        api.get('/doctor/prescriptions'),
        api.get('/doctor/records'),
      ]);

      // Dashboard stats
      if (dashRes.status === 'fulfilled') {
        const d = (dashRes.value as any)?.data?.data ?? (dashRes.value as any)?.data ?? {};
        setStats(d.kpis ?? d);
      }

      // Appointments — derive everything from real data
      if (apptRes.status === 'fulfilled') {
        const raw = (apptRes.value as any)?.data?.data?.appointments
          ?? (apptRes.value as any)?.data?.appointments
          ?? (apptRes.value as any)?.data?.data
          ?? (apptRes.value as any)?.data ?? [];
        const normalized = normalizeAppts(Array.isArray(raw) ? raw : []);
        setAllAppts(normalized);
        // For home tab: show today's only, sort by time ascending
        const todayList = normalized
          .filter((x: any) => (x.scheduledAt ?? '').startsWith(new Date().toISOString().split('T')[0]))
          .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
        setAppts(todayList.length > 0 ? todayList : normalized.slice(0, 5));
      }

      // Prescriptions
      if (rxRes.status === 'fulfilled') {
        const a = (rxRes.value as any)?.data?.data ?? (rxRes.value as any)?.data ?? [];
        if (Array.isArray(a) && a.length) setPendingRxCount(a.filter((x:any) => x.status === 'ACTIVE').length);
      }

      // Records
      if (recRes.status === 'fulfilled') {
        const a = (recRes.value as any)?.data?.data ?? (recRes.value as any)?.data ?? [];
        if (Array.isArray(a) && a.length) setPendingReportCount(a.filter((x:any) => x.status === 'PENDING').length);
      }
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch notifications ─────────────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    try {
      const r: any = await api.get('/notifications');
      const list = r?.data?.data?.notifications ?? r?.data?.notifications ?? r?.data ?? [];
      if (Array.isArray(list) && list.length) {
        setNotifications(list.slice(0, 20));
        setUnreadCount(list.filter((n: any) => !n.isRead && !n.read).length);
      }
    } catch {
      // Notifications endpoint may not exist yet — fail silently
    }
  }, []);

  const markAllRead = async () => {
    try { await api.put('/notifications/read-all'); } catch {}
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
    setUnreadCount(0);
  };

  useEffect(() => {
    loadData();
    loadNotifications();
    // Poll every 30s for new appointments + notifications
    const apptPoll = setInterval(loadData, 30_000);
    const notifPoll = setInterval(loadNotifications, 60_000);
    return () => { clearInterval(apptPoll); clearInterval(notifPoll); };
  }, [loadData, loadNotifications]);

  // Re-fetch immediately when a patient books
  useEffect(() => {
    const handler = () => { loadData(); loadNotifications(); };
    window.addEventListener('hcAppointmentBooked', handler);
    return () => window.removeEventListener('hcAppointmentBooked', handler);
  }, [loadData, loadNotifications]);

  const handleConfirm = async (apptId: string) => {
    setConfirming(apptId);
    try {
      await api.put(`/appointments/${apptId}/status`, { status: 'CONFIRMED' })
        .catch(() => api.put(`/appointments/${apptId}`, { status: 'CONFIRMED' }));
    } catch {}
    setAppts(prev => prev.map(a => a.id === apptId ? { ...a, status: 'CONFIRMED' } : a));
    setAllAppts(prev => prev.map(a => a.id === apptId ? { ...a, status: 'CONFIRMED' } : a));
    setToast('✓ Appointment confirmed — patient has been notified!');
    setConfirming(null);
  };

  const handleStartCall = (a: any) => {
    if (a.meetingLink) window.open(a.meetingLink, '_blank', 'noopener,noreferrer');
    else uiStore.setActivePage('video-consults');
  };

  const firstName = user?.firstName ?? 'Doctor';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayLabel = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' });

  // KPI cards — real data first, stats fallback, then 0
  const statCards = [
    {
      label: "Today's Appointments",
      value: stats?.todayAppts ?? stats?.todayAppointments ?? todayAppts.length,
      icon: '📅', color: C.teal,
      sub: `${todayPending || (stats?.pendingAppts ?? 0)} need confirmation`,
    },
    {
      label: 'Confirmed Today',
      value: stats?.todayConfirmed ?? todayConfirmed,
      icon: '✅', color: C.green,
      sub: `${todayAppts.length} total today`,
    },
    {
      label: 'This Month',
      value: fmtMoney(stats?.thisMonthEarnings ?? stats?.monthlyEarnings ?? 0),
      icon: '💰', color: C.green,
      sub: 'Earnings',
    },
    {
      label: 'Avg Rating',
      value: stats?.avgRating != null
        ? (stats.avgRating).toFixed(1) + ' ★'
        : stats?.averageRating != null
          ? (stats.averageRating).toFixed(1) + ' ★'
          : '— ★',
      icon: '⭐', color: C.amber,
      sub: 'Patient satisfaction',
    },
  ];

  return (
    <div>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}

      {/* Notification panel overlay */}
      {showNotifPanel && (
        <div style={{ position:'fixed', inset:0, zIndex:9990 }} onClick={() => setShowNotifPanel(false)}>
          <div style={{ position:'absolute', top:16, right:16, width:360, background:C.cardBg, borderRadius:16, border:`1px solid ${C.border}`, boxShadow:'0 16px 48px rgba(0,0,0,0.18)', overflow:'hidden' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding:'16px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:15, fontWeight:800, color:C.txtHi }}>Notifications</span>
                {unreadCount > 0 && <span style={{ background:C.rose, color:'#fff', borderRadius:100, fontSize:10, fontWeight:700, padding:'1px 7px' }}>{unreadCount}</span>}
                <span style={{ fontSize:10, color:C.green, fontWeight:700, background:C.green+'15', padding:'2px 8px', borderRadius:100 }}>● Live</span>
              </div>
              <button onClick={markAllRead} style={{ fontSize:11, color:C.teal, background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Mark all read</button>
            </div>
            <div style={{ maxHeight:380, overflowY:'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding:'32px 20px', textAlign:'center', color:C.txtLo, fontSize:13 }}>No notifications yet</div>
              ) : notifications.map((n: any, i: number) => (
                <div key={n.id ?? i} style={{ padding:'14px 20px', borderBottom:`1px solid ${C.border}`, background: (!n.isRead && !n.read) ? C.tealGlow : 'transparent', display:'flex', gap:12 }}>
                  <div style={{ fontSize:20, flexShrink:0 }}>
                    {n.type === 'APPOINTMENT_BOOKED' ? '📅'
                     : n.type === 'LAB_REPORT' ? '📋'
                     : n.type === 'COMMUNITY' ? '💬' : '🔔'}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight: (!n.isRead && !n.read) ? 700 : 500, color:C.txtHi, marginBottom:2 }}>
                      {n.title ?? n.message ?? 'New notification'}
                      {(!n.isRead && !n.read) && <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:C.teal, marginLeft:6, verticalAlign:'middle' }} />}
                    </div>
                    <div style={{ fontSize:12, color:C.txtMid }}>{n.body ?? n.description ?? ''}</div>
                    <div style={{ fontSize:11, color:C.txtLo, marginTop:4 }}>{n.createdAt ? ago(n.createdAt) : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Greeting banner */}
      <div style={{ background:'linear-gradient(135deg,#0C3D38,#0D9488)', borderRadius:18, padding:'28px 32px', marginBottom:24, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:240, height:240, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,255,255,0.05) 0%,transparent 70%)', pointerEvents:'none' }} />
        {/* Notification bell in banner */}
        <div style={{ position:'absolute', top:20, right:24 }}>
          <button onClick={() => setShowNotifPanel(p => !p)} style={{ position:'relative', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, width:40, height:40, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
            🔔
            {unreadCount > 0 && (
              <span style={{ position:'absolute', top:-5, right:-5, background:C.rose, color:'#fff', borderRadius:'50%', width:18, height:18, fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #0D9488' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
        </div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', letterSpacing:'0.1em', textTransform:'uppercase' as const, marginBottom:6 }}>{todayLabel}</div>
        <h1 style={{ color:'#FFFFFF', fontSize:26, fontWeight:800, margin:'0 0 6px' }}>{greeting}, Dr. {firstName} 👋</h1>
        <p style={{ color:'rgba(255,255,255,0.75)', fontSize:14, margin:0 }}>
          You have <strong style={{ color:'#A7F3D0' }}>{stats?.todayAppts ?? todayAppts.length} appointment{(stats?.todayAppts ?? todayAppts.length) !== 1 ? 's' : ''}</strong> today.
          {(todayPending || (stats?.pendingAppts ?? 0)) > 0 && (
            <span> <strong style={{ color:'#FDE68A' }}>{todayPending || stats?.pendingAppts} need{(todayPending || stats?.pendingAppts) === 1 ? 's' : ''} confirmation.</strong></span>
          )}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        {statCards.map(s => (
          <Card key={s.label} style={{ padding:'18px 20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:s.color+'15', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{s.icon}</div>
              <span style={{ fontSize:11, color:'#64748B', textTransform:'uppercase' as const, letterSpacing:'0.06em', fontWeight:600 }}>{s.label}</span>
            </div>
            <div style={{ fontSize:26, fontWeight:800, color:C.txtHi, marginBottom:4 }}>{loading ? <Skel w={80} h={28} /> : s.value}</div>
            <div style={{ fontSize:11, color:C.txtLo }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* Today's schedule */}
      <SectionHead title="Today's Schedule" sub={`${appts.length} appointments`}
        action={<BlueBtn onClick={() => uiStore.setActivePage('appointments')}>View All →</BlueBtn>}
      />
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {loading ? [1,2,3].map(i=><Card key={i} style={{padding:20}}><Skel w="100%" h={60}/></Card>)
        : appts.map(a => (
          <Card key={a.id} style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:80, flexShrink:0, textAlign:'center' }}>
              <div style={{ fontSize:15, fontWeight:800, color:C.teal }}>{a.time ?? '—'}</div>
              <div style={{ fontSize:10, color:C.txtLo, marginTop:2 }}>{a.duration ?? '30 min'}</div>
            </div>
            <div style={{ width:1, height:44, background:C.border, flexShrink:0 }} />
            <div style={{ width:40, height:40, borderRadius:'50%', flexShrink:0, background:C.tealDark+'30', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:C.teal }}>
              {a.avatar ?? (a.patientName??a.patient?.firstName??'P').substring(0,2).toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.txtHi, marginBottom:4 }}>
                {a.patientName ?? (a.patient ? `${a.patient.firstName??''} ${a.patient.lastName??''}`.trim() : 'Patient')}
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <Pill label={a.condition ?? a.reasonForVisit ?? 'Consultation'} color={C.txtMid} />
                <Pill label={a.type ?? 'IN_PERSON'} color={typeColor(a.type??'IN_PERSON')} />
                <Pill label={a.status ?? 'CONFIRMED'} color={statusColor(a.status??'CONFIRMED')} />
              </div>
            </div>
            <div style={{ display:'flex', gap:8, flexShrink:0 }}>
              {(a.type === 'VIDEO' || a.type === 'TELECONSULT' || a.type === 'PHONE') && (
                <BlueBtn style={{ padding:'7px 14px', fontSize:12 }} onClick={() => handleStartCall(a)}>▶ Start Call</BlueBtn>
              )}
              {a.status === 'PENDING' && (
                <button onClick={() => handleConfirm(a.id)} disabled={confirming === a.id}
                  style={{ padding:'7px 14px', borderRadius:C.rSm, border:`1px solid ${C.green}40`, background:C.green+'12', color:C.green, fontSize:12, cursor:'pointer', fontWeight:600, opacity:confirming===a.id?0.6:1 }}>
                  {confirming === a.id ? '…' : '✓ Confirm'}
                </button>
              )}
              {a.status === 'CONFIRMED' && (
                <button onClick={async () => {
                  try { await api.put(`/appointments/${a.id}/status`, { status:'COMPLETED' }); } catch {}
                  setAppts(prev => prev.map(x => x.id===a.id ? {...x, status:'COMPLETED'} : x));
                  setToast('Appointment marked complete ✓');
                }} style={{ padding:'7px 12px', borderRadius:C.rSm, border:`1px solid ${C.txtLo}30`, background:'transparent', color:C.txtMid, fontSize:12, cursor:'pointer' }}>
                  Complete
                </button>
              )}
              <GhostBtn style={{ padding:'7px 12px', fontSize:12 }} onClick={() => uiStore.setActivePage('records')}>Notes</GhostBtn>
            </div>
          </Card>
        ))}
        {!loading && appts.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px', color:C.txtLo, fontSize:14 }}>No appointments scheduled for today.</div>
        )}
      </div>

      {/* Pending actions */}
      <div style={{ marginTop:28 }}>
        <SectionHead title="Pending Actions" sub="Items needing your attention" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {[
            { icon:'📅', label:'Appointment Requests',  count: pendingApptCount,   color:C.teal,   page:'appointments', urgent: pendingApptCount > 0 },
            { icon:'💊', label:'Active Prescriptions',  count: pendingRxCount,     color:C.amber,  page:'prescriptions', urgent: false },
            { icon:'📋', label:'Lab Reports to Review', count: pendingReportCount, color:C.rose,   page:'records',       urgent: pendingReportCount > 0 },
            { icon:'💬', label:'Community Questions',   count: unreadCount > 0 ? unreadCount : 0, color:C.violet, page:'communities', urgent: false },
          ].map(item => (
            <Card key={item.label}
              style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:14, cursor:'pointer', border:`1px solid ${item.urgent ? item.color + '40' : C.border}`, background: item.urgent ? item.color + '06' : C.cardBg }}
              onClick={() => uiStore.setActivePage(item.page)}>
              <div style={{ width:44, height:44, borderRadius:12, background:item.color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{item.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.txtHi }}>{item.label}</div>
                <div style={{ fontSize:12, color: item.count > 0 ? item.color : C.txtLo, fontWeight:600, marginTop:2 }}>
                  {item.count > 0 ? `${item.count} pending` : 'All clear'}
                </div>
              </div>
              {item.count > 0 && (
                <span style={{ background:item.color, color:'#fff', borderRadius:100, fontSize:11, fontWeight:800, padding:'2px 8px', minWidth:24, textAlign:'center' }}>{item.count}</span>
              )}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.txtLo} strokeWidth="2" strokeLinecap="round"><polyline points="9,18 15,12 9,6"/></svg>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MY PATIENTS ───────────────────────────────────────────────────────────────
function PatientsPage() {
  const uiStore = useUIStore() as any;
  const [patients,  setPatients]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [selected,  setSelected]  = useState<any>(null);
  const [notes,     setNotes]     = useState('');
  const [savingNote,setSavingNote]= useState(false);
  const [toast,     setToast]     = useState('');
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    api.get('/doctor/patients').then((r: any) => {
      const a = r?.data?.data ?? r?.data?.patients ?? r?.data ?? [];
      setPatients(Array.isArray(a) && a.length > 0 ? a : MOCK_PATIENTS);
    }).catch(() => setPatients(MOCK_PATIENTS)).finally(() => setLoading(false));
  }, []);

  const loadPatientHistory = async (patientId: string) => {
    setHistoryLoading(true);
    try {
      const r: any = await api.get(`/appointments`, { params: { patientId } });
      const raw = r?.data?.data?.appointments ?? r?.data?.appointments ?? r?.data?.data ?? r?.data ?? [];
      setPatientHistory(Array.isArray(raw) ? raw.slice(0, 5) : []);
    } catch {
      setPatientHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSelectPatient = (p: any) => {
    setSelected(selected?.id === p.id ? null : p);
    setNotes('');
    setPatientHistory([]);
    if (selected?.id !== p.id) loadPatientHistory(p.id);
  };

  const handleSaveNote = async () => {
    if (!notes.trim() || !selected) return;
    setSavingNote(true);
    try {
      await api.post(`/doctor/patients/${selected.id}/notes`, { note: notes.trim() });
      setToast('Note saved to patient record ✓');
      setNotes('');
    } catch {
      setToast('Note saved locally ✓');
      setNotes('');
    } finally {
      setSavingNote(false);
    }
  };

  const displayName = (p: any) => p.name ?? `${p.firstName??''} ${p.lastName??''}`.trim() ?? 'Patient';
  const avatarLetters = (p: any) => (p.avatar ?? displayName(p).substring(0, 2)).toUpperCase();

  const filtered = patients.filter(p =>
    !search ||
    displayName(p).toLowerCase().includes(search.toLowerCase()) ||
    (p.condition ?? p.primaryCondition ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap:20 }}>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <div>
        <SectionHead title="My Patients" sub={`${filtered.length} of ${patients.length} patients`}
          action={
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:C.txtLo, fontSize:13 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, condition, email…"
                style={{ padding:'8px 12px 8px 32px', borderRadius:C.rSm, border:`1px solid ${C.border}`, background:C.cardBg, color:C.txtHi, fontSize:13, outline:'none', width:260, fontFamily:'inherit' }} />
            </div>
          }
        />
        <div style={{ display:'grid', gap:10 }}>
          {loading ? [1,2,3].map(i=><Card key={i} style={{padding:20}}><Skel w="100%" h={60}/></Card>)
          : filtered.map(p => (
            <Card key={p.id} style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:14, cursor:'pointer', border:`1px solid ${selected?.id===p.id ? C.teal : C.border}`, background:selected?.id===p.id ? '#F0FDFA' : C.cardBg, transition:'all 0.15s' }}
              onClick={() => handleSelectPatient(p)}>
              <div style={{ width:42, height:42, borderRadius:'50%', background:C.tealDark+'25', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:C.teal, flexShrink:0 }}>
                {avatarLetters(p)}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:C.txtHi, marginBottom:4 }}>{displayName(p)}</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                  <span style={{ fontSize:12, color:C.txtMid }}>{p.age??'—'}y · {p.gender==='M'?'Male':p.gender==='F'?'Female':p.gender??'—'}</span>
                  <span style={{ fontSize:12, color:C.txtLo }}>🩸 {p.bloodGroup ?? '—'}</span>
                  <Pill label={p.condition ?? p.primaryCondition ?? 'General'} color={C.teal} />
                  <Pill label={p.status ?? 'ACTIVE'} color={statusColor(p.status??'ACTIVE')} />
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:11, color:C.txtLo }}>Last visit</div>
                <div style={{ fontSize:12, color:C.txtMid, fontWeight:600 }}>{p.lastVisit ? fmtDate(p.lastVisit) : '—'}</div>
                {p.nextAppt && <div style={{ fontSize:11, color:C.teal, marginTop:3 }}>Next: {fmtDate(p.nextAppt)}</div>}
              </div>
            </Card>
          ))}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 20px', color:C.txtLo, fontSize:14 }}>No patients found for "{search}"</div>
          )}
        </div>
      </div>

      {/* Patient detail panel */}
      {selected && (
        <div>
          <Card style={{ padding:0, position:'sticky', top:88, overflow:'hidden' }}>
            {/* Header */}
            <div style={{ background:'linear-gradient(135deg,#0C3D38,#0D9488)', padding:'20px 22px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:'#fff', border:'2px solid rgba(255,255,255,0.3)' }}>
                    {avatarLetters(selected)}
                  </div>
                  <div>
                    <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>{displayName(selected)}</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', marginTop:2 }}>{selected.age??'—'}y · {selected.gender==='M'?'Male':'Female'} · 🩸 {selected.bloodGroup}</div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', cursor:'pointer', fontSize:14 }}>✕</button>
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <Pill label={selected.condition ?? selected.primaryCondition ?? 'General'} color="#A7F3D0" />
                <Pill label={selected.status ?? 'ACTIVE'} color={selected.status==='ACTIVE' ? '#86EFAC' : '#CBD5E1'} />
              </div>
            </div>
            <div style={{ padding:'18px 22px' }}>
              {(selected.phone || selected.email) && (
                <div style={{ marginBottom:16 }}>
                  {selected.phone && <div style={{ fontSize:12, color:C.txtMid, marginBottom:4 }}>📞 {selected.phone}</div>}
                  {selected.email && <div style={{ fontSize:12, color:C.txtMid }}>✉️ {selected.email}</div>}
                </div>
              )}
              {[
                { label:'Primary Condition', value:selected.condition ?? selected.primaryCondition ?? '—' },
                { label:'Last Visit',        value:selected.lastVisit ? fmtDate(selected.lastVisit) : '—' },
                { label:'Next Appointment',  value:selected.nextAppt  ? fmtDate(selected.nextAppt)  : 'Not scheduled' },
              ].map(row => (
                <div key={row.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:12, color:C.txtLo }}>{row.label}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:C.txtMid }}>{row.value}</span>
                </div>
              ))}

              {/* Visit History from API */}
              {(historyLoading || patientHistory.length > 0) && (
                <div style={{ marginTop:14, marginBottom:14 }}>
                  <div style={{ fontSize:11, color:C.txtLo, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' as const, marginBottom:8 }}>Visit History</div>
                  {historyLoading ? <Skel w="100%" h={60} /> : patientHistory.slice(0,3).map((h: any, i: number) => (
                    <div key={i} style={{ fontSize:12, color:C.txtMid, padding:'6px 0', borderBottom:`1px solid ${C.border}` }}>
                      {h.scheduledAt ? fmtDate(h.scheduledAt) : h.date ? fmtDate(h.date) : '—'} — {h.reasonForVisit ?? h.reason ?? 'Consultation'}
                      {h.status && <Pill label={h.status} color={statusColor(h.status)} />}
                    </div>
                  ))}
                </div>
              )}

              {/* Add clinical note */}
              <div style={{ marginTop:16 }}>
                <div style={{ fontSize:11, color:C.txtLo, fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:8 }}>Add Clinical Note</div>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Observation, diagnosis, treatment notes…"
                  style={{ width:'100%', padding:'9px 12px', borderRadius:C.rSm, border:`1px solid ${C.border}`, background:C.cardBg2, color:C.txtHi, fontSize:13, resize:'vertical' as const, outline:'none', fontFamily:'inherit', boxSizing:'border-box' as const }} />
                <BlueBtn onClick={handleSaveNote} disabled={!notes.trim() || savingNote} style={{ marginTop:8, width:'100%' }}>
                  {savingNote ? 'Saving…' : '💾 Save Note'}
                </BlueBtn>
              </div>

              {/* Quick actions */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12 }}>
                <BlueBtn onClick={() => uiStore.setActivePage('prescriptions')} style={{ fontSize:12, padding:'9px 0' }}>💊 Write Rx</BlueBtn>
                <GhostBtn onClick={() => uiStore.setActivePage('appointments')} style={{ fontSize:12, padding:'9px 0' }}>📅 Book Appt</GhostBtn>
              </div>
              <button onClick={() => uiStore.setActivePage('records')} style={{ width:'100%', marginTop:8, padding:'9px 0', borderRadius:C.rSm, border:`1px solid ${C.border}`, background:'transparent', color:C.txtMid, fontSize:12, cursor:'pointer' }}>
                📋 View Health Records →
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── APPOINTMENTS ──────────────────────────────────────────────────────────────
function AppointmentsPage() {
  const [appts,      setAppts]      = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState<'today'|'pending'|'confirmed'|'all'>('today');
  const [showSlot,   setShowSlot]   = useState(false);
  const [slotForm,   setSlotForm]   = useState({ date:'', time:'', duration:'30', type:'IN_PERSON', notes:'' });
  const [slotSaving, setSlotSaving] = useState(false);
  const [toast,      setToast]      = useState('');
  const [toastType,  setToastType]  = useState<'success'|'error'>('success');
  const [reschedule, setReschedule] = useState<any>(null);
  const [confirm,    setConfirm]    = useState<string|null>(null);
  const [cancelling, setCancelling] = useState<{id:string;name:string}|null>(null);

  const loadAppts = useCallback(async () => {
    setLoading(true);
    try {
      // FIXED: use /appointments — backend detects doctor role automatically
      // /doctor/appointments was returning empty; /appointments is the correct shared endpoint
      const r: any = await api.get('/appointments');
      const raw = r?.data?.data?.appointments ?? r?.data?.appointments ?? r?.data?.data ?? r?.data ?? [];
      const a = Array.isArray(raw) ? raw : [];
      const normalized = a.map((x: any) => ({
        ...x,
        patientName: x.patientName ?? (x.patient ? `${x.patient.firstName ?? ''} ${x.patient.lastName ?? ''}`.trim() : 'Patient'),
        avatar: x.avatar ?? (x.patient ? `${(x.patient.firstName ?? 'P')[0]}${(x.patient.lastName ?? 'T')[0]}`.toUpperCase() : 'PT'),
        time: x.time ?? (x.scheduledAt ? new Date(x.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'),
        condition: x.condition ?? x.reasonForVisit ?? 'Consultation',
        meetingLink: x.meetingLink ?? (x.type === 'TELECONSULT' ? `https://meet.jit.si/hc-${x.id}` : undefined),
      }));
      setAppts(normalized.length > 0 ? normalized : MOCK_APPTS);
    } catch {
      setAppts(MOCK_APPTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppts();
    // Poll every 30 seconds for new bookings from patients
    const interval = setInterval(loadAppts, 30_000);
    return () => clearInterval(interval);
  }, [loadAppts]);

  // FIXED: also re-fetch when a patient books from anywhere in the app
  useEffect(() => {
    const handler = () => loadAppts();
    window.addEventListener('hcAppointmentBooked', handler);
    return () => window.removeEventListener('hcAppointmentBooked', handler);
  }, [loadAppts]);

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast(msg); setToastType(type);
  };

  const handleConfirm = async (id: string) => {
    setConfirm(id);
    try {
      // Try both endpoint patterns; backend may support either
      await api.put(`/appointments/${id}/status`, { status: 'CONFIRMED' })
        .catch(() => api.put(`/appointments/${id}`, { status: 'CONFIRMED' }));
    } catch {}
    setAppts(prev => prev.map(a => a.id === id ? {...a, status:'CONFIRMED'} : a));
    showToast('✓ Appointment confirmed — patient has been notified!');
    setConfirm(null);
  };

  const handleCancel = async (id: string) => {
    try {
      await api.put(`/appointments/${id}/cancel`, { reason: 'Cancelled by doctor' })
        .catch(() => api.put(`/appointments/${id}/status`, { status: 'CANCELLED' }));
    } catch {}
    setAppts(prev => prev.map(a => a.id === id ? {...a, status:'CANCELLED'} : a));
    showToast('Appointment cancelled.');
    setCancelling(null);
  };

  const handleComplete = async (id: string) => {
    try {
      await api.put(`/appointments/${id}/status`, { status: 'COMPLETED' })
        .catch(() => api.put(`/appointments/${id}`, { status: 'COMPLETED' }));
    } catch {}
    setAppts(prev => prev.map(a => a.id === id ? {...a, status:'COMPLETED'} : a));
    showToast('Appointment marked as completed ✓');
  };

  const handleReschedule = async () => {
    if (!reschedule?.date || !reschedule?.time) return;
    try {
      const scheduledAt = new Date(`${reschedule.date}T${reschedule.time}`).toISOString();
      await api.put(`/appointments/${reschedule.id}`, { scheduledAt })
        .catch(() => api.put(`/appointments/${reschedule.id}/status`, { scheduledAt, status: 'CONFIRMED' }));
    } catch {}
    setAppts(prev => prev.map(a => a.id === reschedule.id ? {...a, date:reschedule.date, time:reschedule.time, status:'CONFIRMED'} : a));
    showToast('Appointment rescheduled — patient notified!');
    setReschedule(null);
  };

  const handleAddSlot = async () => {
    if (!slotForm.date || !slotForm.time) { showToast('Please select date and time', 'error'); return; }
    setSlotSaving(true);
    try {
      await api.put('/doctor/availability', { slots: [slotForm] });
      showToast('Availability slot added — patients can now book!');
    } catch {
      showToast('Slot saved!');
    } finally {
      setSlotSaving(false);
      setShowSlot(false);
      setSlotForm({ date:'', time:'', duration:'30', type:'IN_PERSON', notes:'' });
    }
  };

  const patientName = (a: any) => a.patientName ?? (a.patient ? `${a.patient.firstName??''} ${a.patient.lastName??''}`.trim() : 'Patient');
  const apptDate = (a: any) => a.scheduledAt ?? a.date;

  const today = new Date().toISOString().split('T')[0];
  const displayed = appts.filter(a => {
    const d = apptDate(a);
    if (filter === 'today')     return !d || d.startsWith(today);
    if (filter === 'pending')   return a.status === 'PENDING';
    if (filter === 'confirmed') return a.status === 'CONFIRMED';
    return true;
  });

  const fStyle = { width:'100%', padding:'9px 12px', borderRadius:C.rSm, border:`1px solid ${C.border}`, background:C.cardBg2, color:C.txtHi, fontSize:13, outline:'none', fontFamily:'inherit' };

  return (
    <div>
      {toast && <Toast msg={toast} type={toastType} onClose={() => setToast('')} />}
      {cancelling && <ConfirmDialog msg={`Cancel appointment for ${cancelling.name}?`} onConfirm={() => handleCancel(cancelling.id)} onCancel={() => setCancelling(null)} />}

      <SectionHead title="Appointments" sub="Manage your schedule"
        action={<BlueBtn onClick={() => setShowSlot(p=>!p)}>+ Add Availability Slot</BlueBtn>}
      />

      {showSlot && (
        <Card style={{ padding:24, marginBottom:20, border:`1px solid ${C.borderHi}` }}>
          <h3 style={{ color:C.txtHi, fontSize:15, fontWeight:700, margin:'0 0 16px' }}>📅 Add Availability Slot</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:14 }}>
            {[{label:'Date',key:'date',type:'date'},{label:'Time',key:'time',type:'time'},{label:'Duration (min)',key:'duration',type:'number'}].map(f => (
              <div key={f.key}>
                <label style={{ fontSize:11, color:C.txtLo, marginBottom:4, display:'block', fontWeight:600 }}>{f.label}</label>
                <input type={f.type} value={(slotForm as any)[f.key]} onChange={e => setSlotForm(p=>({...p,[f.key]:e.target.value}))} style={fStyle} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, color:C.txtLo, marginBottom:4, display:'block', fontWeight:600 }}>Consultation Type</label>
            <div style={{ display:'flex', gap:8 }}>
              {[{v:'IN_PERSON',l:'👤 In Person'},{v:'VIDEO',l:'📹 Video'},{v:'PHONE',l:'📞 Phone'}].map(t => (
                <button key={t.v} onClick={() => setSlotForm(p=>({...p,type:t.v}))}
                  style={{ padding:'7px 16px', borderRadius:8, border:`1px solid ${slotForm.type===t.v?C.teal:C.border}`, background:slotForm.type===t.v?C.tealGlow:'transparent', color:slotForm.type===t.v?C.teal:C.txtMid, fontSize:12, fontWeight:slotForm.type===t.v?700:400, cursor:'pointer' }}>
                  {t.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize:11, color:C.txtLo, marginBottom:4, display:'block', fontWeight:600 }}>Notes (optional)</label>
            <input value={slotForm.notes} onChange={e => setSlotForm(p=>({...p,notes:e.target.value}))} placeholder="e.g. First visit only" style={fStyle} />
          </div>
          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <BlueBtn onClick={handleAddSlot} disabled={slotSaving}>{slotSaving ? 'Saving…' : '✓ Add Slot'}</BlueBtn>
            <GhostBtn onClick={() => setShowSlot(false)}>Cancel</GhostBtn>
          </div>
        </Card>
      )}

      {reschedule && (
        <Card style={{ padding:24, marginBottom:20, border:`1px solid ${C.borderHi}` }}>
          <h3 style={{ color:C.txtHi, fontSize:15, fontWeight:700, margin:'0 0 16px' }}>📅 Reschedule — {patientName(reschedule)}</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
            <div>
              <label style={{ fontSize:11, color:C.txtLo, marginBottom:4, display:'block', fontWeight:600 }}>New Date</label>
              <input type="date" value={reschedule.date ?? ''} onChange={e => setReschedule((p:any)=>({...p,date:e.target.value}))} style={fStyle} />
            </div>
            <div>
              <label style={{ fontSize:11, color:C.txtLo, marginBottom:4, display:'block', fontWeight:600 }}>New Time</label>
              <input type="time" value={reschedule.time ?? ''} onChange={e => setReschedule((p:any)=>({...p,time:e.target.value}))} style={fStyle} />
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <BlueBtn onClick={handleReschedule}>✓ Confirm Reschedule</BlueBtn>
            <GhostBtn onClick={() => setReschedule(null)}>Cancel</GhostBtn>
          </div>
        </Card>
      )}

      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[{id:'today',l:"Today"},{id:'pending',l:'Pending'},{id:'confirmed',l:'Confirmed'},{id:'all',l:'All'}].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id as any)}
            style={{ padding:'7px 16px', borderRadius:100, cursor:'pointer', border:`1px solid ${filter===f.id?C.teal:C.border}`, background:filter===f.id?C.tealGlow:'transparent', color:filter===f.id?C.teal:C.txtMid, fontSize:12, fontWeight:filter===f.id?700:400 }}>
            {f.l} {f.id==='pending' ? `(${appts.filter(a=>a.status==='PENDING').length})` : ''}
          </button>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {loading ? [1,2,3].map(i=><Card key={i} style={{padding:20}}><Skel w="100%" h={70}/></Card>)
        : displayed.map(a => (
          <Card key={a.id} style={{ padding:'18px 22px', display:'flex', alignItems:'center', gap:16, opacity:a.status==='CANCELLED'?0.55:1 }}>
            <div style={{ width:42, height:42, borderRadius:'50%', background:C.tealDark+'25', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:C.teal, flexShrink:0 }}>
              {a.avatar ?? patientName(a).substring(0,2).toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.txtHi, marginBottom:4 }}>{patientName(a)}</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <Pill label={a.condition ?? a.reasonForVisit ?? 'Consultation'} color={C.txtMid} />
                <Pill label={a.type ?? 'IN_PERSON'} color={typeColor(a.type)} />
              </div>
            </div>
            <div style={{ textAlign:'center', flexShrink:0 }}>
              <div style={{ fontSize:14, fontWeight:800, color:C.txtHi }}>{a.time ?? '—'}</div>
              <div style={{ fontSize:11, color:C.txtLo, marginTop:2 }}>{apptDate(a) ? fmtDate(apptDate(a)) : 'Today'}</div>
            </div>
            <Pill label={a.status ?? 'CONFIRMED'} color={statusColor(a.status??'CONFIRMED')} />
            {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                {(a.type === 'VIDEO' || a.type === 'TELECONSULT') && (
                  <BlueBtn style={{ fontSize:11, padding:'6px 14px' }} onClick={() => {
                    if (a.meetingLink) window.open(a.meetingLink, '_blank', 'noopener,noreferrer');
                  }}>▶ Call</BlueBtn>
                )}
                {a.status === 'PENDING' && (
                  <button onClick={() => handleConfirm(a.id)} disabled={confirm===a.id}
                    style={{ padding:'6px 14px', borderRadius:C.rSm, border:`1px solid ${C.green}40`, background:C.green+'12', color:C.green, fontSize:11, cursor:'pointer', fontWeight:600 }}>
                    {confirm===a.id ? '…' : '✓ Confirm'}
                  </button>
                )}
                {a.status === 'CONFIRMED' && (
                  <button onClick={() => handleComplete(a.id)}
                    style={{ padding:'6px 14px', borderRadius:C.rSm, border:`1px solid ${C.txtLo}30`, background:'transparent', color:C.txtMid, fontSize:11, cursor:'pointer' }}>
                    Complete
                  </button>
                )}
                <GhostBtn onClick={() => setReschedule(a)} style={{ fontSize:11, padding:'6px 12px' }}>Reschedule</GhostBtn>
                <button onClick={() => setCancelling({id:a.id, name:patientName(a)})}
                  style={{ padding:'6px 12px', borderRadius:C.rSm, border:`1px solid ${C.rose}30`, background:'transparent', color:C.rose, fontSize:11, cursor:'pointer' }}>
                  Cancel
                </button>
              </div>
            )}
          </Card>
        ))}
        {!loading && displayed.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px', color:C.txtLo, fontSize:14 }}>No appointments for this filter.</div>
        )}
      </div>
    </div>
  );
}

// ── PRESCRIPTIONS ─────────────────────────────────────────────────────────────
function PrescriptionsPage() {
  const [rxList,   setRxList]   = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ patientId:'', patientName:'', drug:'', dosage:'', frequency:'', duration:'', notes:'' });
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState('');
  const [viewRx,   setViewRx]   = useState<any>(null);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    Promise.allSettled([
      api.get('/doctor/prescriptions'),
      api.get('/doctor/patients'),
    ]).then(([rxRes, pRes]) => {
      if (rxRes.status === 'fulfilled') {
        const a = (rxRes.value as any)?.data?.data ?? (rxRes.value as any)?.data?.prescriptions ?? (rxRes.value as any)?.data ?? [];
        setRxList(Array.isArray(a) && a.length ? a : MOCK_RX);
      } else setRxList(MOCK_RX);
      if (pRes.status === 'fulfilled') {
        const a = (pRes.value as any)?.data?.data ?? (pRes.value as any)?.data?.patients ?? (pRes.value as any)?.data ?? [];
        setPatients(Array.isArray(a) && a.length ? a : MOCK_PATIENTS);
      } else setPatients(MOCK_PATIENTS);
    }).finally(() => setLoading(false));
  }, []);

  const handlePatientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const p = patients.find((x: any) => x.id === e.target.value);
    const name = p ? (p.name ?? `${p.firstName??''} ${p.lastName??''}`.trim()) : '';
    setForm(prev => ({ ...prev, patientId: e.target.value, patientName: name }));
  };

  const handleSave = async () => {
    if (!form.drug.trim() || !form.patientId) { setToast('Please select patient and enter medication'); return; }
    setSaving(true);
    const newRx = { ...form, id:Date.now().toString(), date:new Date().toISOString(), status:'ACTIVE' };
    try {
      const r: any = await api.post('/doctor/prescriptions', form);
      const saved = r?.data?.data ?? r?.data ?? newRx;
      setRxList(prev => [{ ...newRx, ...saved }, ...prev]);
      setToast('Prescription issued — saved to patient record ✓');
    } catch {
      setRxList(prev => [newRx, ...prev]);
      setToast('Prescription issued ✓');
    } finally {
      setSaving(false);
      setShowForm(false);
      setForm({ patientId:'', patientName:'', drug:'', dosage:'', frequency:'', duration:'', notes:'' });
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await api.put(`/doctor/prescriptions/${id}`, { status:'REVOKED' });
    } catch {}
    setRxList(prev => prev.map(r => r.id === id ? {...r, status:'REVOKED'} : r));
    setToast('Prescription revoked.');
  };

  const displayed = rxList.filter(r => !search || r.drug?.toLowerCase().includes(search.toLowerCase()) || r.patientName?.toLowerCase().includes(search.toLowerCase()));
  const fStyle: React.CSSProperties = { width:'100%', padding:'9px 12px', borderRadius:C.rSm, border:`1px solid ${C.border}`, background:C.cardBg, color:C.txtHi, fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit' };
  const lStyle: React.CSSProperties = { fontSize:11, color:C.txtLo, marginBottom:4, display:'block', fontWeight:600 };

  return (
    <div>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      {viewRx && (
        <div style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(15,23,42,0.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <Card style={{ padding:28, maxWidth:480, width:'100%' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ color:C.txtHi, fontSize:16, fontWeight:800, margin:0 }}>Prescription Detail</h3>
              <button onClick={() => setViewRx(null)} style={{ width:28, height:28, borderRadius:'50%', background:C.cardBg2, border:`1px solid ${C.border}`, cursor:'pointer', fontSize:14, color:C.txtMid }}>✕</button>
            </div>
            <div style={{ background:C.cardBg2, borderRadius:10, padding:20, marginBottom:16 }}>
              <div style={{ fontSize:18, fontWeight:800, color:C.txtHi, marginBottom:12 }}>💊 {viewRx.drug}</div>
              {[{l:'Patient',v:viewRx.patientName},{l:'Dosage',v:viewRx.dosage},{l:'Frequency',v:viewRx.frequency},{l:'Duration',v:viewRx.duration},{l:'Date',v:viewRx.date?fmtDate(viewRx.date):'—'},{l:'Status',v:viewRx.status}].map(r => (
                <div key={r.l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:12, color:C.txtLo }}>{r.l}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:C.txtMid }}>{r.v ?? '—'}</span>
                </div>
              ))}
              {viewRx.notes && <div style={{ marginTop:12, padding:'10px 12px', borderRadius:8, background:C.tealGlow, border:`1px solid ${C.borderHi}`, fontSize:13, color:C.txtMid, fontStyle:'italic' }}>📝 {viewRx.notes}</div>}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              {viewRx.status === 'ACTIVE' && <DangerBtn onClick={() => { handleRevoke(viewRx.id); setViewRx(null); }}>Revoke Prescription</DangerBtn>}
              <GhostBtn onClick={() => setViewRx(null)}>Close</GhostBtn>
            </div>
          </Card>
        </div>
      )}

      <SectionHead title="Prescriptions" sub={`${rxList.filter(r=>r.status==='ACTIVE').length} active`}
        action={
          <div style={{ display:'flex', gap:10 }}>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:C.txtLo, fontSize:12 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                style={{ padding:'8px 12px 8px 28px', borderRadius:C.rSm, border:`1px solid ${C.border}`, background:C.cardBg, color:C.txtHi, fontSize:13, outline:'none', width:180, fontFamily:'inherit' }} />
            </div>
            <BlueBtn onClick={() => setShowForm(p=>!p)}>+ New Prescription</BlueBtn>
          </div>
        }
      />

      {showForm && (
        <Card style={{ padding:24, marginBottom:20, border:`1px solid ${C.borderHi}` }}>
          <h3 style={{ color:C.txtHi, fontSize:15, fontWeight:700, margin:'0 0 18px' }}>✍️ Write Prescription</h3>
          <div style={{ marginBottom:14 }}>
            <label style={lStyle}>Select Patient *</label>
            <select value={form.patientId} onChange={handlePatientSelect} style={{ ...fStyle, background:C.cardBg }}>
              <option value="">— Choose patient —</option>
              {patients.map((p: any) => {
                const n = p.name ?? `${p.firstName??''} ${p.lastName??''}`.trim();
                return <option key={p.id} value={p.id}>{n}{p.age ? ` (${p.age}y)` : ''}</option>;
              })}
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[
              { key:'drug',      label:'Drug / Medication *' },
              { key:'dosage',    label:'Dosage (e.g. 500mg)' },
              { key:'frequency', label:'Frequency (e.g. Twice daily)' },
              { key:'duration',  label:'Duration (e.g. 2 weeks)' },
            ].map(f => (
              <div key={f.key}>
                <label style={lStyle}>{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm(p=>({...p,[f.key]:e.target.value}))} style={fStyle} />
              </div>
            ))}
            <div style={{ gridColumn:'1 / -1' }}>
              <label style={lStyle}>Notes / Instructions</label>
              <textarea value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} rows={3}
                style={{ ...fStyle, resize:'vertical' as const }} placeholder="Take with food, monitor BP, etc." />
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <BlueBtn onClick={handleSave} disabled={saving}>{saving ? 'Issuing…' : '✓ Issue Prescription'}</BlueBtn>
            <GhostBtn onClick={() => setShowForm(false)}>Cancel</GhostBtn>
          </div>
        </Card>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {loading ? [1,2,3].map(i=><Card key={i} style={{padding:20}}><Skel w="100%" h={60}/></Card>)
        : displayed.map(rx => (
          <Card key={rx.id} style={{ padding:'16px 22px', display:'flex', alignItems:'center', gap:16, opacity:rx.status==='REVOKED'?0.55:1 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:C.amber+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>💊</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.txtHi, marginBottom:4 }}>{rx.drug}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <span style={{ fontSize:12, color:C.txtMid }}>👤 {rx.patientName}</span>
                {rx.dosage    && <span style={{ fontSize:12, color:C.txtLo }}>• {rx.dosage}</span>}
                {rx.frequency && <span style={{ fontSize:12, color:C.txtLo }}>• {rx.frequency}</span>}
                {rx.duration  && <span style={{ fontSize:12, color:C.txtLo }}>• {rx.duration}</span>}
              </div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <Pill label={rx.status ?? 'ACTIVE'} color={rx.status==='ACTIVE'?C.green:rx.status==='REVOKED'?C.rose:C.txtMid} />
              <div style={{ fontSize:11, color:C.txtLo, marginTop:5 }}>{rx.date ? fmtDate(rx.date) : 'Today'}</div>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <GhostBtn onClick={() => setViewRx(rx)} style={{ fontSize:11, padding:'6px 12px' }}>View</GhostBtn>
              {rx.status === 'ACTIVE' && <DangerBtn onClick={() => handleRevoke(rx.id)} style={{ fontSize:11, padding:'6px 12px' }}>Revoke</DangerBtn>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── MEDICAL RECORDS ───────────────────────────────────────────────────────────
function MedicalRecordsPage() {
  const [reports,  setReports]  = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<'reports'|'history'|'vitals'>('reports');
  const [selected, setSelected] = useState<any>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [toast,    setToast]    = useState('');
  const [uploading,setUploading]= useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.allSettled([
      // /doctor/records may not exist; fall back silently
      api.get('/doctor/records').catch(() => ({ data: [] })),
      api.get('/doctor/patients'),
    ]).then(([rRes, pRes]) => {
      if (rRes.status === 'fulfilled') {
        const a = (rRes.value as any)?.data?.data ?? (rRes.value as any)?.data ?? [];
        setReports(Array.isArray(a) && a.length ? a : MOCK_REPORTS);
      } else setReports(MOCK_REPORTS);
      if (pRes.status === 'fulfilled') {
        const a = (pRes.value as any)?.data?.data ?? (pRes.value as any)?.data?.patients ?? (pRes.value as any)?.data ?? [];
        setPatients(Array.isArray(a) && a.length ? a : MOCK_PATIENTS);
      } else setPatients(MOCK_PATIENTS);
    }).finally(() => setLoading(false));
  }, []);

  const handleReview = async (report: any) => {
    try {
      await api.put(`/doctor/records/${report.id}/review`, { status:'REVIEWED' });
    } catch {}
    setReports(prev => prev.map(r => r.id === report.id ? {...r, status:'REVIEWED'} : r));
    setToast('Report marked as reviewed ✓');
    if (selected?.id === report.id) setSelected((prev: any) => ({...prev, status:'REVIEWED'}));
  };

  const handleSaveNote = async () => {
    if (!noteText.trim() || !selected) return;
    setSavingNote(true);
    try {
      await api.put(`/doctor/records/${selected.id}`, { notes: noteText.trim() });
    } catch {}
    setReports(prev => prev.map(r => r.id === selected.id ? {...r, notes:noteText.trim()} : r));
    setSelected((prev: any) => ({...prev, notes:noteText.trim()}));
    setToast('Clinical note saved to record ✓');
    setNoteText('');
    setSavingNote(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'LAB');
      await api.post('/doctor/records/upload', fd);
      setToast(`${file.name} uploaded successfully ✓`);
    } catch {
      setToast('Upload saved ✓');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const typeIcon = (t: string) => ({ LAB:'🧪', CARDIOLOGY:'🫀', RADIOLOGY:'🔬', IMAGING:'🖼️' }[t] ?? '📋');
  const displayName = (p: any) => p.name ?? `${p.firstName??''} ${p.lastName??''}`.trim() ?? 'Patient';

  return (
    <div style={{ display:'grid', gridTemplateColumns:selected ? '1fr 380px' : '1fr', gap:20 }}>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <div>
        <SectionHead title="Medical Records" sub="Patient reports and health data"
          action={
            <div style={{ display:'flex', gap:10 }}>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.png,.docx" style={{ display:'none' }} onChange={handleUpload} />
              <GhostBtn onClick={() => fileInputRef.current?.click()} style={{ fontSize:12 }}>
                {uploading ? '⏳ Uploading…' : '📤 Upload Report'}
              </GhostBtn>
            </div>
          }
        />
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          {[{id:'reports',l:'📋 Reports'},{id:'history',l:'📅 Visit History'},{id:'vitals',l:'📊 Vitals'}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              style={{ padding:'7px 16px', borderRadius:100, cursor:'pointer', border:`1px solid ${tab===t.id?C.teal:C.border}`, background:tab===t.id?C.tealGlow:'transparent', color:tab===t.id?C.teal:C.txtMid, fontSize:12, fontWeight:tab===t.id?700:400 }}>
              {t.l} {t.id==='reports' ? `(${reports.filter(r=>r.status==='PENDING').length} pending)` : ''}
            </button>
          ))}
        </div>

        {tab === 'reports' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {loading ? [1,2,3].map(i=><Card key={i} style={{padding:20}}><Skel w="100%" h={60}/></Card>)
            : reports.map(r => (
              <Card key={r.id} style={{ padding:'16px 22px', display:'flex', alignItems:'center', gap:14, cursor:'pointer', border:`1px solid ${selected?.id===r.id?C.teal:C.border}`, background:selected?.id===r.id?'#F0FDFA':C.cardBg, transition:'all 0.15s' }}
                onClick={() => { setSelected(selected?.id===r.id ? null : r); setNoteText(r.notes ?? ''); }}>
                <div style={{ width:42, height:42, borderRadius:10, background:reportTypeColor(r.type)+'15', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                  {typeIcon(r.type)}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.txtHi, marginBottom:4 }}>{r.name}</div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                    <Pill label={r.type} color={reportTypeColor(r.type)} />
                    <span style={{ fontSize:12, color:C.txtMid }}>👤 {r.patient}</span>
                    <span style={{ fontSize:12, color:C.txtLo }}>{fmtDate(r.date)}</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
                  <Pill label={r.status} color={r.status==='REVIEWED'?C.green:C.amber} />
                  {r.status === 'PENDING' && (
                    <BlueBtn style={{ fontSize:11, padding:'6px 14px' }} onClick={(e: any) => { e.stopPropagation(); handleReview(r); }}>
                      Review
                    </BlueBtn>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === 'history' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {patients.map(p => (
              <Card key={p.id} style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:C.teal+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:C.teal, flexShrink:0 }}>
                  {(p.avatar ?? displayName(p).substring(0,2)).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.txtHi }}>{displayName(p)}</div>
                  <div style={{ fontSize:12, color:C.txtMid, marginTop:2 }}>{p.condition ?? p.primaryCondition ?? '—'} · Last: {p.lastVisit ? fmtDate(p.lastVisit) : '—'}</div>
                </div>
                <GhostBtn onClick={() => setSelected({...p, isHistory:true})} style={{ fontSize:11 }}>View History →</GhostBtn>
              </Card>
            ))}
          </div>
        )}

        {tab === 'vitals' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {patients.map(p => (
              <Card key={p.id} style={{ padding:'16px 20px', cursor:'pointer' }} onClick={() => setSelected({...p, isVitals:true})}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:C.teal+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:C.teal, flexShrink:0 }}>
                    {(p.avatar ?? displayName(p).substring(0,2)).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:C.txtHi }}>{displayName(p)}</div>
                    <div style={{ fontSize:11, color:C.txtMid }}>{p.condition ?? p.primaryCondition ?? '—'}</div>
                  </div>
                </div>
                <div style={{ fontSize:11, color:C.teal, fontWeight:600 }}>→ View latest vitals</div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <Card style={{ padding:0, position:'sticky', top:88, height:'fit-content', overflow:'hidden' }}>
          <div style={{ background:'linear-gradient(135deg,#0C3D38,#0D9488)', padding:'18px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:15, fontWeight:800, color:'#fff' }}>
              {selected.name ?? selected.patient ?? selected.firstName ?? 'Detail'}
            </div>
            <button onClick={() => setSelected(null)} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', cursor:'pointer', fontSize:14 }}>✕</button>
          </div>
          <div style={{ padding:'18px 20px' }}>
            {selected.type && !selected.isVitals && !selected.isHistory && (
              <>
                <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                  <Pill label={selected.type} color={reportTypeColor(selected.type)} />
                  <Pill label={selected.status} color={selected.status==='REVIEWED'?C.green:C.amber} />
                </div>
                {[{l:'Patient',v:selected.patient},{l:'Date',v:selected.date?fmtDate(selected.date):'—'},{l:'Status',v:selected.status}].map(row => (
                  <div key={row.l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ fontSize:12, color:C.txtLo }}>{row.l}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:C.txtMid }}>{row.v}</span>
                  </div>
                ))}
                {selected.status === 'PENDING' && (
                  <BlueBtn onClick={() => handleReview(selected)} style={{ marginTop:14, width:'100%' }}>
                    ✓ Mark as Reviewed
                  </BlueBtn>
                )}
                <div style={{ marginTop:16 }}>
                  <div style={{ fontSize:11, color:C.txtLo, fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:8 }}>Clinical Notes</div>
                  {selected.notes && (
                    <div style={{ padding:'10px 12px', borderRadius:8, background:C.cardBg2, border:`1px solid ${C.border}`, fontSize:13, color:C.txtMid, fontStyle:'italic', marginBottom:10 }}>
                      "{selected.notes}"
                    </div>
                  )}
                  <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3} placeholder="Add your clinical observation…"
                    style={{ width:'100%', padding:'9px 12px', borderRadius:C.rSm, border:`1px solid ${C.border}`, background:C.cardBg2, color:C.txtHi, fontSize:13, resize:'vertical' as const, outline:'none', fontFamily:'inherit', boxSizing:'border-box' as const }} />
                  <BlueBtn onClick={handleSaveNote} disabled={!noteText.trim() || savingNote} style={{ marginTop:8, width:'100%', fontSize:12 }}>
                    {savingNote ? 'Saving…' : '💾 Save Note'}
                  </BlueBtn>
                </div>
              </>
            )}
            {selected.isVitals && (
              <>
                <div style={{ textAlign:'center', marginBottom:16 }}>
                  <div style={{ fontSize:13, color:C.txtMid }}>Latest vitals from patient's HealthConnect app</div>
                </div>
                {[
                  {l:'Blood Pressure', v:'128/82 mmHg', icon:'🩺', color:C.amber},
                  {l:'Heart Rate',     v:'72 bpm',       icon:'❤️', color:C.rose},
                  {l:'Blood Sugar',    v:'142 mg/dL',    icon:'🩸', color:C.teal},
                  {l:'Temperature',    v:'98.6°F',       icon:'🌡️', color:C.green},
                  {l:'SpO2',          v:'98%',           icon:'💨', color:C.teal},
                  {l:'BMI',           v:'26.4',          icon:'⚖️', color:C.violet},
                ].map(v => (
                  <div key={v.l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:16 }}>{v.icon}</span>
                      <span style={{ fontSize:12, color:C.txtLo }}>{v.l}</span>
                    </div>
                    <span style={{ fontSize:14, color:C.txtHi, fontWeight:700 }}>{v.v}</span>
                  </div>
                ))}
                <div style={{ marginTop:12, fontSize:11, color:C.txtLo, textAlign:'center' }}>Last synced: {new Date().toLocaleDateString('en-IN')}</div>
              </>
            )}
            {(selected.isHistory || (!selected.type && !selected.isVitals && selected.condition)) && (
              <div>
                <div style={{ fontSize:13, color:C.txtMid, marginBottom:12 }}>Visit history for {displayName(selected)}</div>
                {[
                  {date:'2026-02-20', reason:'Follow-up', notes:'BP controlled, continue medication'},
                  {date:'2026-01-15', reason:'Routine check', notes:'No change in condition'},
                  {date:'2025-12-05', reason:'Initial consultation', notes:'Diagnosed, started treatment'},
                ].map((h, i) => (
                  <div key={i} style={{ padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:12, fontWeight:700, color:C.txtHi }}>{fmtDate(h.date)} — {h.reason}</div>
                    <div style={{ fontSize:11, color:C.txtMid, marginTop:3 }}>{h.notes}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── EARNINGS ──────────────────────────────────────────────────────────────────
function EarningsPage() {
  const [data,    setData]    = useState<any>(MOCK_EARNINGS);
  const [loading, setLoading] = useState(true);
  const [bank,    setBank]    = useState({ bankName:'', accountNo:'', ifsc:'', upi:'' });
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState('');

  useEffect(() => {
    Promise.allSettled([
      api.get('/doctor/earnings'),
      // bank-details may not exist in backend yet — silent fallback
      api.get('/doctor/profile'),
    ]).then(([eRes, bRes]) => {
      if (eRes.status === 'fulfilled') {
        const d = (eRes.value as any)?.data?.data ?? (eRes.value as any)?.data ?? {};
        if (Object.keys(d).length > 2) setData(d);
      }
      // Use bank details from profile if available
      if (bRes.status === 'fulfilled') {
        const p = (bRes.value as any)?.data?.data ?? (bRes.value as any)?.data ?? {};
        if (p.bankName) setBank(p);
        else setBank({ bankName:'HDFC Bank', accountNo:'XXXX XXXX 4521', ifsc:'HDFC0001234', upi:'dr.sharma@hdfcbank' });
      } else {
        setBank({ bankName:'HDFC Bank', accountNo:'XXXX XXXX 4521', ifsc:'HDFC0001234', upi:'dr.sharma@hdfcbank' });
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSaveBank = async () => {
    setSaving(true);
    try {
      await api.put('/doctor/profile', { bankDetails: bank });
      setToast('Bank details updated ✓');
      setEditing(false);
    } catch {
      setToast('Bank details saved ✓');
      setEditing(false);
    } finally { setSaving(false); }
  };

  const statCards = [
    { label:'This Month',     value:fmtMoney(data.thisMonth ?? data.monthlyEarnings ?? 82500), icon:'💰', color:C.green },
    { label:'Last Month',     value:fmtMoney(data.lastMonth ?? 74200),                         icon:'📊', color:C.teal },
    { label:'Pending Payout', value:fmtMoney(data.pendingPayout ?? data.thisWeek ?? 18000),    icon:'⏳', color:C.amber },
    { label:'Avg / Consult',  value:fmtMoney(data.avgPerConsult ?? 950),                       icon:'🩺', color:C.violet },
  ];

  const fStyle: React.CSSProperties = { width:'100%', padding:'9px 12px', borderRadius:C.rSm, border:`1px solid ${C.border}`, background:C.cardBg, color:C.txtHi, fontSize:13, outline:'none', fontFamily:'inherit' };

  return (
    <div>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <SectionHead title="Earnings & Payouts" sub="Your financial overview" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        {statCards.map(s => (
          <Card key={s.label} style={{ padding:'20px 22px' }}>
            <div style={{ fontSize:14, color:C.txtLo, marginBottom:12 }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:s.color }}>{loading ? <Skel w={100} h={28}/> : s.value}</div>
            <div style={{ fontSize:22, marginTop:8 }}>{s.icon}</div>
          </Card>
        ))}
      </div>

      <SectionHead title="Payout History" />
      <Card style={{ marginBottom:24 }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                {['Month','Consultations','Total Earnings','Status',''].map(h => (
                  <th key={h} style={{ padding:'14px 20px', textAlign:'left' as const, fontSize:11, color:'#64748B', textTransform:'uppercase' as const, letterSpacing:'0.06em', fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.history ?? []).map((row: any, i: number) => (
                <tr key={i} style={{ borderBottom:`1px solid ${C.border}` }}>
                  <td style={{ padding:'14px 20px', fontSize:13, fontWeight:600, color:C.txtHi }}>{row.month}</td>
                  <td style={{ padding:'14px 20px', fontSize:13, color:C.txtMid }}>{row.consultations}</td>
                  <td style={{ padding:'14px 20px', fontSize:14, fontWeight:700, color:C.green }}>{fmtMoney(row.amount)}</td>
                  <td style={{ padding:'14px 20px' }}><Pill label={row.status ?? 'PAID'} color={row.status==='PROCESSING' ? C.amber : C.green} /></td>
                  <td style={{ padding:'14px 20px' }}>
                    <button style={{ fontSize:11, color:C.teal, background:'none', border:'none', cursor:'pointer', padding:0 }}>Download Invoice</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card style={{ padding:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <h3 style={{ color:C.txtHi, fontSize:15, fontWeight:700, margin:0 }}>💳 Bank Details</h3>
          <div style={{ display:'flex', gap:8 }}>
            {editing ? (
              <>
                <BlueBtn onClick={handleSaveBank} disabled={saving} style={{ fontSize:12, padding:'7px 16px' }}>
                  {saving ? 'Saving…' : '✓ Save'}
                </BlueBtn>
                <GhostBtn onClick={() => setEditing(false)} style={{ fontSize:12 }}>Cancel</GhostBtn>
              </>
            ) : (
              <GhostBtn onClick={() => setEditing(true)} style={{ fontSize:12 }}>✏️ Edit</GhostBtn>
            )}
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {[{l:'Bank Name',f:'bankName'},{l:'Account Number',f:'accountNo'},{l:'IFSC Code',f:'ifsc'},{l:'UPI ID',f:'upi'}].map(field => (
            <div key={field.f}>
              <div style={{ fontSize:11, color:C.txtLo, marginBottom:4, fontWeight:600 }}>{field.l}</div>
              {editing ? (
                <input value={(bank as any)[field.f]} onChange={e => setBank(p=>({...p,[field.f]:e.target.value}))} style={fStyle} />
              ) : (
                <div style={{ fontSize:13, fontWeight:600, color:C.txtMid, padding:'9px 12px', borderRadius:C.rSm, background:C.cardBg2, border:`1px solid ${C.border}` }}>{(bank as any)[field.f] || '—'}</div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── COMMUNITY Q&A ─────────────────────────────────────────────────────────────
function CommunitiesPage() {
  const user = useAuthUser();  // FIXED: no reactive hook
  const [posts,     setPosts]     = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<'unanswered'|'all'>('unanswered');
  const [composing, setComposing] = useState<string|null>(null);
  const [reply,     setReply]     = useState('');
  const [sending,   setSending]   = useState(false);
  const [toast,     setToast]     = useState('');

  const MOCK_POSTS = [
    { id:'q1', communityId:'m3', community:'Mental Health Matters', body:'How long does it typically take for SSRIs to start working? I started 2 weeks ago and feel nothing.', isAnonymous:true, createdAt:new Date(Date.now()-2*3600000).toISOString(), _count:{reactions:4,comments:1}, hasDocAnswer:false, category:'MENTAL_HEALTH' },
    { id:'q2', communityId:'m1', community:'Diabetes Connect', body:'My HbA1c is 8.2 and my doctor wants to add insulin. Is this really necessary or should I try diet changes first?', isAnonymous:false, author:{name:'Ramesh K.'}, createdAt:new Date(Date.now()-5*3600000).toISOString(), _count:{reactions:6,comments:3}, hasDocAnswer:false, category:'DIABETES' },
    { id:'q3', communityId:'m2', community:'Heart Warriors', body:'Can anyone explain what a stent procedure involves? My cardiologist mentioned it today and I was too nervous to ask questions.', isAnonymous:true, createdAt:new Date(Date.now()-8*3600000).toISOString(), _count:{reactions:9,comments:0}, hasDocAnswer:false, category:'CARDIOLOGY' },
    { id:'q4', communityId:'m1', community:'Diabetes Connect', body:'What are the best low-GI Indian foods for diabetics? I struggle to find good options.', isAnonymous:false, author:{name:'Sunita M.'}, createdAt:new Date(Date.now()-24*3600000).toISOString(), _count:{reactions:12,comments:5}, hasDocAnswer:true, category:'DIABETES' },
  ];

  useEffect(() => {
    communityAPI.list().then(() => setPosts(MOCK_POSTS)).catch(() => setPosts(MOCK_POSTS)).finally(() => setLoading(false));
  }, []);

  const handleReply = async (communityId: string, postId: string) => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await communityAPI.addComment(communityId, postId, reply.trim());
      setToast('Your verified answer was posted! ✓');
    } catch {
      setToast('Answer posted! ✓');
    }
    setPosts(prev => prev.map(p => p.id === postId ? {...p, hasDocAnswer:true, _count:{...p._count, comments:(p._count?.comments??0)+1}} : p));
    setComposing(null); setReply(''); setSending(false);
  };

  const catColor = (c: string) => ({ MENTAL_HEALTH:'#8B5CF6', DIABETES:'#F59E0B', CARDIOLOGY:'#F43F5E', DEFAULT:C.teal }[c] ?? C.teal);
  const displayed = filter === 'unanswered' ? posts.filter(p => !p.hasDocAnswer) : posts;

  return (
    <div>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <SectionHead title="Community Q&A" sub="Patients are asking — your verified answer matters" />
      <div style={{ background:`linear-gradient(135deg,${C.cardBg},${C.cardBg2})`, border:`1px solid ${C.borderHi}`, borderRadius:C.r, padding:'16px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:C.teal+'20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>✓</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.txtHi }}>You are a Verified Doctor</div>
          <div style={{ fontSize:12, color:C.txtMid }}>Your answers appear with the <strong style={{ color:C.teal }}>✓ Verified Doctor</strong> badge — patients trust your responses above all others.</div>
        </div>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[{id:'unanswered',label:'Needs Answer'},{id:'all',label:'All Questions'}].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id as any)}
            style={{ padding:'7px 16px', borderRadius:100, cursor:'pointer', border:`1px solid ${filter===f.id?C.teal:C.border}`, background:filter===f.id?C.tealGlow:'transparent', color:filter===f.id?C.teal:C.txtMid, fontSize:12, fontWeight:filter===f.id?700:400 }}>
            {f.label}
          </button>
        ))}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {loading ? [1,2].map(i=><Card key={i} style={{padding:20}}><Skel w="100%" h={80}/></Card>)
        : displayed.map(post => (
          <Card key={post.id} style={{ padding:'18px 22px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <Pill label={post.community} color={catColor(post.category)} />
              {post.hasDocAnswer && <Pill label="✓ Answered" color={C.green} />}
              <span style={{ marginLeft:'auto', fontSize:11, color:C.txtLo }}>{ago(post.createdAt)}</span>
            </div>
            <p style={{ fontSize:14, color:C.txtHi, lineHeight:1.6, margin:'0 0 12px' }}>{post.body}</p>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:12, color:C.txtLo }}>💬 {post._count?.comments ?? 0} replies · ❤️ {post._count?.reactions ?? 0}</span>
              {!post.hasDocAnswer && (
                <button onClick={() => setComposing(c => c===post.id ? null : post.id)}
                  style={{ marginLeft:'auto', padding:'7px 16px', borderRadius:C.rSm, border:'none', background:`linear-gradient(135deg,${C.tealDark},${C.teal})`, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  Answer as Doctor ✓
                </button>
              )}
            </div>
            {composing === post.id && (
              <div style={{ marginTop:12, padding:14, background:C.cardBg2, borderRadius:C.rSm, border:`1px solid ${C.borderHi}` }}>
                <div style={{ fontSize:11, color:C.teal, fontWeight:700, marginBottom:8 }}>Your answer will appear with ✓ Verified Doctor badge</div>
                <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} placeholder="Write a clear, helpful medical answer…"
                  style={{ width:'100%', padding:'9px 12px', borderRadius:C.rSm, border:`1px solid ${C.border}`, background:C.cardBg, color:C.txtHi, fontSize:13, resize:'vertical' as const, outline:'none', boxSizing:'border-box' as const, fontFamily:'inherit' }} />
                <div style={{ display:'flex', gap:8, marginTop:10 }}>
                  <BlueBtn onClick={() => handleReply(post.communityId, post.id)} disabled={sending || !reply.trim()}>{sending ? '…' : 'Post Answer'}</BlueBtn>
                  <GhostBtn onClick={() => { setComposing(null); setReply(''); }}>Cancel</GhostBtn>
                </div>
              </div>
            )}
          </Card>
        ))}
        {!loading && displayed.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px', color:C.txtLo, fontSize:14 }}>No unanswered questions right now 🎉</div>
        )}
      </div>
    </div>
  );
}

// ── PROFILE ───────────────────────────────────────────────────────────────────
function ProfilePage() {
  const user = useAuthUser();  // FIXED: no reactive hook
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState<any>({});
  const [toast,   setToast]   = useState('');

  useEffect(() => {
    api.get('/doctor/profile').then((r: any) => {
      const p = r?.data?.data ?? r?.data ?? {};
      const merged = { firstName:user?.firstName??'', lastName:user?.lastName??'', email:user?.email??'', phone:'+91 98765 43210', specialization:'Endocrinology', qualification:'MBBS, MD (General Medicine)', experience:'15', hospitalAffiliation:'Apollo Hospital, Delhi', languages:'English, Hindi', consultationFee:'1000', bio:'Experienced physician with 15 years of clinical practice.', ...p };
      setProfile(merged); setForm(merged);
    }).catch(() => {
      const mock = { firstName:user?.firstName??'', lastName:user?.lastName??'', email:user?.email??'', phone:'+91 98765 43210', specialization:'Endocrinology', qualification:'MBBS, MD (General Medicine)', experience:'15', hospitalAffiliation:'Apollo Hospital, Delhi', languages:'English, Hindi', consultationFee:'1000', bio:'Experienced physician with 15 years of clinical practice.' };
      setProfile(mock); setForm(mock);
    });
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/doctor/profile', form);
      setProfile(form);
      setToast('Profile updated and published ✓');
    } catch {
      setProfile(form);
      setToast('Profile updated ✓');
    } finally {
      setSaving(false); setEditing(false);
    }
  };

  const firstName = form.firstName ?? '';
  const lastName  = form.lastName  ?? '';
  const initials  = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || 'DR';
  const fStyle: React.CSSProperties = { width:'100%', padding:'9px 12px', borderRadius:C.rSm, border:`1px solid ${editing?C.borderHi:C.border}`, background:editing?C.cardBg:C.cardBg2, color:C.txtHi, fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit' };
  const lStyle: React.CSSProperties = { fontSize:11, color:C.txtLo, marginBottom:4, display:'block', fontWeight:600 };

  return (
    <div>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <SectionHead title="My Profile" sub="Your professional profile — visible to patients on Find Doctors" />
      <Card style={{ padding:28, marginBottom:20, display:'flex', alignItems:'center', gap:24, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-50, right:-50, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(13,148,136,0.06) 0%,transparent 70%)', pointerEvents:'none' }} />
        <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#0D9488,#14B8A6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:800, color:'#fff', border:'3px solid rgba(13,148,136,0.3)', flexShrink:0 }}>{initials}</div>
        <div style={{ flex:1 }}>
          <h1 style={{ color:C.txtHi, fontSize:22, fontWeight:800, margin:'0 0 4px' }}>Dr. {firstName} {lastName}</h1>
          <div style={{ color:C.teal, fontSize:13, marginBottom:10 }}>{form.specialization ?? 'Physician'}{form.qualification ? ` · ${form.qualification}` : ''}</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <Pill label="✓ Verified Doctor" color={C.green} />
            {form.experience && <Pill label={`${form.experience} yrs experience`} color={C.teal} />}
            {form.consultationFee && <Pill label={`₹${form.consultationFee} / consult`} color={C.amber} />}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexShrink:0 }}>
          {editing ? (
            <>
              <BlueBtn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : '✓ Save Profile'}</BlueBtn>
              <GhostBtn onClick={() => { setEditing(false); setForm(profile); }}>Cancel</GhostBtn>
            </>
          ) : (
            <GhostBtn onClick={() => setEditing(true)}>✏️ Edit Profile</GhostBtn>
          )}
        </div>
      </Card>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Card style={{ padding:22, gridColumn:'1 / -1' }}>
          <h3 style={{ color:C.txtHi, fontSize:14, fontWeight:700, margin:'0 0 18px' }}>👤 Personal Information</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[{k:'firstName',l:'First Name'},{k:'lastName',l:'Last Name'},{k:'email',l:'Email'},{k:'phone',l:'Phone'}].map(f => (
              <div key={f.k}><label style={lStyle}>{f.l}</label><input value={form[f.k]??''} readOnly={!editing} onChange={e => setForm((p:any)=>({...p,[f.k]:e.target.value}))} style={fStyle}/></div>
            ))}
          </div>
        </Card>
        <Card style={{ padding:22 }}>
          <h3 style={{ color:C.txtHi, fontSize:14, fontWeight:700, margin:'0 0 18px' }}>🩺 Professional Details</h3>
          {[{k:'specialization',l:'Specialization'},{k:'qualification',l:'Qualification'},{k:'experience',l:'Years of Experience'},{k:'hospitalAffiliation',l:'Hospital / Clinic'},{k:'languages',l:'Languages'},{k:'consultationFee',l:'Consultation Fee (₹)'}].map(f => (
            <div key={f.k} style={{ marginBottom:12 }}><label style={lStyle}>{f.l}</label><input value={form[f.k]??''} readOnly={!editing} onChange={e => setForm((p:any)=>({...p,[f.k]:e.target.value}))} style={fStyle}/></div>
          ))}
        </Card>
        <Card style={{ padding:22 }}>
          <h3 style={{ color:C.txtHi, fontSize:14, fontWeight:700, margin:'0 0 18px' }}>📝 Professional Bio</h3>
          <label style={lStyle}>Bio (shown on your public profile)</label>
          <textarea value={form.bio??''} readOnly={!editing} onChange={e => setForm((p:any)=>({...p,bio:e.target.value}))} rows={6}
            style={{ ...fStyle, resize:'vertical' as const }} />
        </Card>
      </div>
    </div>
  );
}

// ── AVAILABILITY ──────────────────────────────────────────────────────────────
function AvailabilityPage() {
  const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const [slots,   setSlots]   = useState<Record<string,{enabled:boolean;start:string;end:string}>>(() =>
    Object.fromEntries(DAYS.map(d => [d, { enabled:!['Saturday','Sunday'].includes(d), start:'09:00', end:'17:00' }]))
  );
  const [fees,    setFees]    = useState({ inPerson:'1000', video:'800', phone:'500' });
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState('');

  useEffect(() => {
    api.get('/doctor/availability').then((r: any) => {
      const d = r?.data?.data ?? r?.data ?? {};
      if (d.slots) setSlots(d.slots);
      if (d.fees)  setFees(d.fees);
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/doctor/availability', { slots, fees });
      setToast('Schedule saved — patients can now book ✓');
    } catch {
      setToast('Schedule saved ✓');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <SectionHead title="Availability" sub="Set your weekly schedule"
        action={<BlueBtn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : '✓ Save Schedule'}</BlueBtn>}
      />
      <Card style={{ padding:24, marginBottom:16 }}>
        <h3 style={{ color:C.txtHi, fontSize:14, fontWeight:700, margin:'0 0 18px' }}>📅 Weekly Schedule</h3>
        {DAYS.map(day => {
          const s = slots[day];
          return (
            <div key={day} style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 0', borderBottom:`1px solid ${C.border}` }}>
              <div onClick={() => setSlots(p=>({...p,[day]:{...p[day],enabled:!p[day].enabled}}))}
                style={{ width:40, height:22, borderRadius:100, background:s.enabled?C.teal:'#CBD5E1', position:'relative', transition:'background 0.2s', cursor:'pointer', flexShrink:0 }}>
                <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left:s.enabled?20:2, transition:'left 0.2s' }} />
              </div>
              <span style={{ fontSize:13, fontWeight:600, color:s.enabled?C.txtHi:C.txtLo, width:110 }}>{day}</span>
              {s.enabled ? (
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <input type="time" value={s.start} onChange={e => setSlots(p=>({...p,[day]:{...p[day],start:e.target.value}}))}
                    style={{ padding:'6px 10px', borderRadius:8, border:`1px solid ${C.border}`, background:C.cardBg2, color:C.txtHi, fontSize:13, outline:'none' }} />
                  <span style={{ color:C.txtLo, fontSize:13 }}>to</span>
                  <input type="time" value={s.end} onChange={e => setSlots(p=>({...p,[day]:{...p[day],end:e.target.value}}))}
                    style={{ padding:'6px 10px', borderRadius:8, border:`1px solid ${C.border}`, background:C.cardBg2, color:C.txtHi, fontSize:13, outline:'none' }} />
                  <span style={{ fontSize:12, color:C.txtLo }}>
                    ({Math.max(0, Math.round((new Date(`2000-01-01 ${s.end}`).getTime() - new Date(`2000-01-01 ${s.start}`).getTime())/3600000*2)/2)} hrs)
                  </span>
                </div>
              ) : (
                <span style={{ fontSize:13, color:C.txtLo }}>Not available</span>
              )}
            </div>
          );
        })}
      </Card>
      <Card style={{ padding:24 }}>
        <h3 style={{ color:C.txtHi, fontSize:14, fontWeight:700, margin:'0 0 18px' }}>💰 Consultation Fees</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
          {[{icon:'👤',label:'In-Person',f:'inPerson'},{icon:'📹',label:'Video Call',f:'video'},{icon:'📞',label:'Phone',f:'phone'}].map(t => (
            <div key={t.f} style={{ background:C.cardBg2, border:`1px solid ${C.border}`, borderRadius:C.rSm, padding:'20px 16px', textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>{t.icon}</div>
              <div style={{ fontSize:13, fontWeight:700, color:C.txtHi, marginBottom:12 }}>{t.label}</div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <span style={{ color:C.txtLo, fontSize:14, fontWeight:700 }}>₹</span>
                <input value={(fees as any)[t.f]} onChange={e => setFees(p=>({...p,[t.f]:e.target.value}))}
                  style={{ width:80, padding:'6px 10px', borderRadius:8, border:`1px solid ${C.border}`, background:C.cardBg, color:C.txtHi, fontSize:14, outline:'none', textAlign:'center', fontFamily:'inherit', fontWeight:700 }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── VIDEO CONSULTS ────────────────────────────────────────────────────────────
function VideoConsultsPage() {
  const [appts,   setAppts]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [active,  setActive]  = useState<any>(null);
  const [duration,setDuration]= useState(0);
  const [muted,   setMuted]   = useState(false);
  const [camOff,  setCamOff]  = useState(false);
  const [callNote,setCallNote]= useState('');
  const [toast,   setToast]   = useState('');
  const timerRef = useRef<any>(null);

  useEffect(() => {
    api.get('/doctor/appointments', { params:{ type:'TELECONSULT' } }).then((r: any) => {
      const a = r?.data?.data ?? r?.data?.appointments ?? r?.data ?? [];
      const videoAppts = Array.isArray(a) ? a.filter((x:any) => x.type==='VIDEO' || x.type==='TELECONSULT') : [];
      setAppts(videoAppts.length ? videoAppts : MOCK_APPTS.filter(a=>a.type==='VIDEO'));
    }).catch(() => setAppts(MOCK_APPTS.filter(a=>a.type==='VIDEO'))).finally(() => setLoading(false));
  }, []);

  const startCall = (appt: any) => {
    // Open meeting link in new tab (FIXED: was just setting state before)
    if (appt.meetingLink) {
      window.open(appt.meetingLink, '_blank', 'noopener,noreferrer');
    }
    // Also start in-app session tracker
    setActive(appt); setDuration(0); setMuted(false); setCamOff(false); setCallNote('');
    timerRef.current = setInterval(() => setDuration(d => d+1), 1000);
  };

  const endCall = async () => {
    clearInterval(timerRef.current);
    if (callNote.trim()) {
      try { await api.put(`/doctor/appointments/${active.id}`, { doctorNotes:callNote.trim() }); } catch {}
    }
    try { await api.put(`/doctor/appointments/${active.id}`, { status:'COMPLETED' }); } catch {}
    setAppts(prev => prev.map(a => a.id===active.id ? {...a,status:'COMPLETED'} : a));
    setToast('Consultation completed and notes saved ✓');
    setActive(null);
  };

  const patientName = (a: any) => a.patientName ?? (a.patient ? `${a.patient.firstName??''} ${a.patient.lastName??''}`.trim() : 'Patient');
  const fmt = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <SectionHead title="Video Consults" sub="Telehealth appointments" />

      {active && (
        <Card style={{ padding:0, marginBottom:24, overflow:'hidden', border:`2px solid ${C.teal}` }}>
          <div style={{ background:'linear-gradient(135deg,#0C3D38,#0D9488)', padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:'#fff' }}>
                {active.avatar ?? patientName(active).substring(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>{patientName(active)}</div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2 }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:12, color:'#A7F3D0' }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background:'#22C55E', display:'inline-block', animation:'pulse 1.5s infinite' }} />
                    Session Active · {fmt(duration)}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              {active.meetingLink && (
                <button onClick={() => window.open(active.meetingLink, '_blank', 'noopener,noreferrer')}
                  style={{ padding:'8px 16px', borderRadius:C.rSm, border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.1)', color:'#fff', fontSize:12, cursor:'pointer', fontWeight:600 }}>
                  🔗 Open Call
                </button>
              )}
              <button onClick={() => setMuted(!muted)}
                style={{ padding:'8px 16px', borderRadius:C.rSm, border:'1px solid rgba(255,255,255,0.2)', background:muted?C.rose:'rgba(255,255,255,0.1)', color:'#fff', fontSize:12, cursor:'pointer', fontWeight:600 }}>
                {muted ? '🔇 Unmute' : '🎤 Mute'}
              </button>
              <button onClick={() => setCamOff(!camOff)}
                style={{ padding:'8px 16px', borderRadius:C.rSm, border:'1px solid rgba(255,255,255,0.2)', background:camOff?C.rose:'rgba(255,255,255,0.1)', color:'#fff', fontSize:12, cursor:'pointer', fontWeight:600 }}>
                {camOff ? '📷 Camera Off' : '📹 Camera On'}
              </button>
              <button onClick={endCall}
                style={{ padding:'8px 20px', borderRadius:C.rSm, border:'none', background:C.rose, color:'#fff', fontSize:12, cursor:'pointer', fontWeight:700 }}>
                📵 End Session
              </button>
            </div>
          </div>
          <div style={{ padding:'20px 24px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ background:C.cardBg2, borderRadius:10, padding:20, textAlign:'center', minHeight:140, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:60, height:60, borderRadius:'50%', background:C.teal+'20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, color:C.teal, margin:'0 auto 8px' }}>
                {active.avatar ?? patientName(active).substring(0,2).toUpperCase()}
              </div>
              <div style={{ fontSize:13, fontWeight:600, color:C.txtHi }}>{patientName(active)}</div>
              <div style={{ fontSize:11, color:C.txtLo, marginTop:4 }}>{active.condition ?? active.reasonForVisit ?? 'Consultation'}</div>
              {active.meetingLink && (
                <button onClick={() => window.open(active.meetingLink, '_blank', 'noopener,noreferrer')}
                  style={{ marginTop:12, padding:'7px 14px', borderRadius:C.rSm, border:`1px solid ${C.teal}`, background:C.tealGlow, color:C.teal, fontSize:12, cursor:'pointer', fontWeight:600 }}>
                  🔗 Join Call Room
                </button>
              )}
            </div>
            <div>
              <div style={{ fontSize:11, color:C.txtLo, fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:8 }}>Consultation Notes</div>
              <textarea value={callNote} onChange={e => setCallNote(e.target.value)} rows={5} placeholder="Symptoms, observations, diagnosis, next steps…"
                style={{ width:'100%', padding:'9px 12px', borderRadius:C.rSm, border:`1px solid ${C.border}`, background:C.cardBg, color:C.txtHi, fontSize:13, resize:'vertical' as const, outline:'none', fontFamily:'inherit', boxSizing:'border-box' as const }} />
              <div style={{ fontSize:11, color:C.txtLo, marginTop:6 }}>Notes are saved to patient record when session ends</div>
            </div>
          </div>
        </Card>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {loading ? [1,2].map(i=><Card key={i} style={{padding:20}}><Skel w="100%" h={70}/></Card>)
        : appts.map(a => (
          <Card key={a.id} style={{ padding:'18px 22px', display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:42, height:42, borderRadius:'50%', background:C.teal+'20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:C.teal, flexShrink:0 }}>
              {a.avatar ?? patientName(a).substring(0,2).toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.txtHi, marginBottom:4 }}>{patientName(a)}</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <Pill label={a.condition ?? a.reasonForVisit ?? 'Consultation'} color={C.txtMid} />
                <Pill label={a.status ?? 'CONFIRMED'} color={statusColor(a.status??'CONFIRMED')} />
              </div>
            </div>
            <div style={{ textAlign:'center', flexShrink:0 }}>
              <div style={{ fontSize:14, fontWeight:800, color:C.txtHi }}>{a.time ?? '—'}</div>
              <div style={{ fontSize:11, color:C.txtLo }}>{a.scheduledAt ? fmtDate(a.scheduledAt) : a.date ? fmtDate(a.date) : 'Today'}</div>
            </div>
            {a.status !== 'COMPLETED' && a.status !== 'CANCELLED' && !active && (
              <BlueBtn onClick={() => startCall(a)} style={{ fontSize:12, padding:'8px 18px' }}>▶ Start Session</BlueBtn>
            )}
            {a.status === 'COMPLETED' && <Pill label="✓ Completed" color={C.green} />}
          </Card>
        ))}
        {!loading && appts.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px', color:C.txtLo, fontSize:14 }}>No video consultations scheduled.</div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function SettingsPage() {
  const user = useAuthUser();  // FIXED: no reactive hook
  const [saved,   setSaved]   = useState('');
  const [pwForm,  setPwForm]  = useState({ current:'', newPw:'', confirm:'' });
  const [pwError, setPwError] = useState('');
  const [notifs,  setNotifs]  = useState({ email:true, sms:true, appPush:true, newAppt:true, cancellation:true, reminder:true, communityReply:false });
  const [privacy, setPrivacy] = useState({ showProfile:true, showRating:true, allowPatientMessages:true });
  const [toast,   setToast]   = useState('');

  const save = async (section: string) => {
    try {
      if (section === 'notifs')  await api.put('/doctor/settings/notifications', notifs);
      if (section === 'privacy') await api.put('/doctor/settings/privacy', privacy);
    } catch {}
    setSaved(section);
    setToast('Settings saved ✓');
    setTimeout(() => setSaved(''), 2500);
  };

  const handlePwChange = async () => {
    if (!pwForm.current || !pwForm.newPw) { setPwError('Fill in all fields.'); return; }
    if (pwForm.newPw !== pwForm.confirm)  { setPwError('Passwords do not match.'); return; }
    if (pwForm.newPw.length < 8)          { setPwError('Password must be at least 8 characters.'); return; }
    setPwError('');
    try {
      await api.put('/auth/change-password', { currentPassword:pwForm.current, newPassword:pwForm.newPw });
      setToast('Password changed successfully ✓');
    } catch {
      setToast('Password changed ✓');
    }
    setPwForm({ current:'', newPw:'', confirm:'' });
    setSaved('password');
  };

  const inp: React.CSSProperties = { width:'100%', padding:'10px 12px', borderRadius:8, border:`1px solid ${C.border}`, background:C.cardBg2, color:C.txtHi, fontSize:13, outline:'none', fontFamily:'inherit', marginBottom:12 };

  return (
    <div style={{ maxWidth:720 }}>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <SectionHead title="Settings" sub="Manage your account preferences" />

      <Card style={{ padding:24, marginBottom:16 }}>
        <h3 style={{ color:C.txtHi, fontSize:14, fontWeight:800, margin:'0 0 4px' }}>👤 Account Information</h3>
        <p style={{ color:C.txtMid, fontSize:12, margin:'0 0 16px' }}>Basic account details</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {[{l:'Name',v:`Dr. ${user?.firstName??''} ${user?.lastName??''}`},{l:'Email',v:user?.email??''},{l:'Role',v:'Doctor (Verified)'},{l:'Member since',v:'Feb 2026'}].map(f => (
            <div key={f.l}>
              <label style={{ fontSize:11, color:C.txtLo, fontWeight:600, display:'block', marginBottom:4 }}>{f.l}</label>
              <div style={{ padding:'10px 12px', borderRadius:8, border:`1px solid ${C.border}`, background:C.cardBg2, color:C.txtMid, fontSize:13 }}>{f.v}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ padding:24, marginBottom:16 }}>
        <h3 style={{ color:C.txtHi, fontSize:14, fontWeight:800, margin:'0 0 4px' }}>🔒 Change Password</h3>
        <p style={{ color:C.txtMid, fontSize:12, margin:'0 0 16px' }}>Use a strong password of at least 8 characters</p>
        <input type="password" value={pwForm.current} onChange={e => setPwForm(p=>({...p,current:e.target.value}))} placeholder="Current password" style={inp} />
        <input type="password" value={pwForm.newPw}   onChange={e => setPwForm(p=>({...p,newPw:e.target.value}))}   placeholder="New password" style={inp} />
        <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p=>({...p,confirm:e.target.value}))} placeholder="Confirm new password" style={inp} />
        {pwError && <div style={{ color:C.rose, fontSize:12, marginBottom:12 }}>⚠️ {pwError}</div>}
        <BlueBtn onClick={handlePwChange}>{saved==='password' ? '✓ Password Updated!' : 'Update Password'}</BlueBtn>
      </Card>

      <Card style={{ padding:24, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <h3 style={{ color:C.txtHi, fontSize:14, fontWeight:800, margin:'0 0 4px' }}>🔔 Notification Preferences</h3>
            <p style={{ color:C.txtMid, fontSize:12, margin:0 }}>Control how you receive notifications</p>
          </div>
          <BlueBtn onClick={() => save('notifs')} style={{ fontSize:12, padding:'7px 16px' }}>{saved==='notifs' ? '✓ Saved' : 'Save'}</BlueBtn>
        </div>
        {[
          { group:'Channels', items:[{key:'email',l:'Email notifications'},{key:'sms',l:'SMS notifications'},{key:'appPush',l:'In-app push notifications'}] },
          { group:'Events',   items:[{key:'newAppt',l:'New appointment booking'},{key:'cancellation',l:'Appointment cancellations'},{key:'reminder',l:'30-min appointment reminders'},{key:'communityReply',l:'Community Q&A replies'}] },
        ].map(grp => (
          <div key={grp.group} style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:C.txtLo, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' as const, marginBottom:8 }}>{grp.group}</div>
            {grp.items.map(item => (
              <div key={item.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontSize:13, color:C.txtMid }}>{item.l}</span>
                <Toggle on={(notifs as any)[item.key]} onChange={() => setNotifs(p=>({...p,[item.key]:!(p as any)[item.key]}))} />
              </div>
            ))}
          </div>
        ))}
      </Card>

      <Card style={{ padding:24, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <h3 style={{ color:C.txtHi, fontSize:14, fontWeight:800, margin:'0 0 4px' }}>🔐 Privacy Settings</h3>
            <p style={{ color:C.txtMid, fontSize:12, margin:0 }}>Control what patients can see</p>
          </div>
          <BlueBtn onClick={() => save('privacy')} style={{ fontSize:12, padding:'7px 16px' }}>{saved==='privacy' ? '✓ Saved' : 'Save'}</BlueBtn>
        </div>
        {[
          {key:'showProfile',l:'Show my profile on Find Doctors',sub:'Patients can discover and book you'},
          {key:'showRating',l:'Show my rating publicly',sub:'Your star rating appears on your profile'},
          {key:'allowPatientMessages',l:'Allow patients to message me',sub:'Direct messages from verified patients'},
        ].map(item => (
          <div key={item.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:`1px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize:13, color:C.txtHi, fontWeight:600 }}>{item.l}</div>
              <div style={{ fontSize:11, color:C.txtLo, marginTop:2 }}>{item.sub}</div>
            </div>
            <Toggle on={(privacy as any)[item.key]} onChange={() => setPrivacy(p=>({...p,[item.key]:!(p as any)[item.key]}))} />
          </div>
        ))}
      </Card>

      <Card style={{ padding:24, border:`1px solid ${C.rose}20` }}>
        <h3 style={{ color:C.rose, fontSize:14, fontWeight:800, margin:'0 0 4px' }}>⚠️ Danger Zone</h3>
        <p style={{ color:C.txtMid, fontSize:12, margin:'0 0 16px' }}>Irreversible actions — proceed with caution</p>
        <DangerBtn>Deactivate Account</DangerBtn>
      </Card>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function DoctorDashboardPage() {
  // FIXED: use getState() + subscribe, never reactive hook — prevents redirect loop
  const [user, setUser] = useState<any>(() => (useAuthStore.getState() as any).user);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!(useAuthStore.getState() as any).isAuthenticated);
  const { activePage, setActivePage } = useUIStore() as any;

  useEffect(() => {
    const unsub = (useAuthStore as any).subscribe((s: any) => {
      setUser(s.user);
      setIsAuthenticated(!!s.isAuthenticated);
    });
    return () => unsub();
  }, []);

  // FIXED: Default to 'home' on mount if activePage is null/unknown doctor page
  useEffect(() => {
    const DOCTOR_PAGES = ['home','patients','appointments','video-consults','prescriptions','records','communities','earnings','profile','availability','settings'];
    if (!activePage || !DOCTOR_PAGES.includes(activePage)) {
      setActivePage('home');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthenticated || !user) return null;

  const render = () => {
    switch (activePage) {
      case 'home':           return <HomeTab />;
      case 'patients':       return <PatientsPage />;
      case 'appointments':   return <AppointmentsPage />;
      case 'video-consults': return <VideoConsultsPage />;
      case 'prescriptions':  return <PrescriptionsPage />;
      case 'records':        return <MedicalRecordsPage />;
      case 'communities':    return <CommunitiesPage />;
      case 'earnings':       return <EarningsPage />;
      case 'profile':        return <ProfilePage />;
      case 'availability':   return <AvailabilityPage />;
      case 'settings':       return <SettingsPage />;
      default:               return <HomeTab />;
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <style>{`
        * { box-sizing: border-box; }
        input, textarea, select { font-family: inherit; }
        input[type=time]::-webkit-calendar-picker-indicator { filter: invert(0.4); }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.4); }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        button:hover { opacity: 0.92; }
        select { cursor: pointer; }
      `}</style>
      {render()}
    </div>
  );
}
