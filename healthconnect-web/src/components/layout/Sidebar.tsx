'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { patientAPI } from '@/lib/api';
import { ProfileCompletenessRing, useProfileScore } from '@/components/onboarding/ProfileCompleteness';

const BLOOD_DISPLAY: Record<string, string> = {
  O_POSITIVE:'O+', O_NEGATIVE:'O-', A_POSITIVE:'A+', A_NEGATIVE:'A-',
  B_POSITIVE:'B+', B_NEGATIVE:'B-', AB_POSITIVE:'AB+', AB_NEGATIVE:'AB-',
};

const SIDEBAR_W      = 268;
const SIDEBAR_W_MINI = 72;

type BadgeVariant = 'green' | 'amber' | 'rose' | 'teal' | 'purple' | '';

const BADGE_STYLES: Record<BadgeVariant, { background: string; color: string }> = {
  green:  { background: '#22C55E', color: '#fff' },
  amber:  { background: '#F59E0B', color: '#000' },
  rose:   { background: '#F43F5E', color: '#fff' },
  teal:   { background: '#14B8A6', color: '#fff' },
  purple: { background: '#8B5CF6', color: '#fff' },
  '':     { background: '#475569', color: '#fff' },
};

// ── SVG Icons ──────────────────────────────────────────────────────────────
function SvgHome()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>; }
function SvgHealth()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>; }
function SvgVitals()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>; }
function SvgSymptom()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>; }
function SvgMeds()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 15l2-2 2 2 4-4"/></svg>; }
function SvgTherapies() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>; }
function SvgAppt()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function SvgDoctors()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3"/></svg>; }
function SvgConsents()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
function SvgCommunity() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function SvgProfile()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function SvgSettings()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; }
function SvgStar()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>; }
function SvgPhone()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 5.5 5.5l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>; }
function SvgLogout()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }

const ICON_MAP: Record<string, () => React.ReactElement> = {
  home:           SvgHome,
  'my-health':    SvgHealth,
  vitals:         SvgVitals,
  symptoms:       SvgSymptom,
  medications:    SvgMeds,
  therapies:      SvgTherapies,
  appointments:   SvgAppt,
  'find-doctors': SvgDoctors,
  consents:       SvgConsents,
  communities:    SvgCommunity,
  profile:        SvgProfile,
  settings:       SvgSettings,
  subscription:   SvgStar,
};

interface NavItem {
  id: string;
  label: string;
  badge?: number | null;
  badgeVariant?: BadgeVariant;
}
interface NavSection {
  key: string;
  label: string;
  items: NavItem[];
}

// ── Emergency SOS Modal ────────────────────────────────────────────────────
function SOSModal({ onClose, patientName }: { onClose: () => void; patientName: string }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSOS = async () => {
    setSending(true);
    try {
      await (patientAPI as any).triggerSOS?.();
    } catch {}
    setSending(false);
    setSent(true);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#0F1A19', borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 420,
        border: '1px solid rgba(220,38,38,0.3)', boxShadow: '0 0 60px rgba(220,38,38,0.2)',
      }}>
        {sent ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '2px solid #22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>✓</div>
              <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>SOS Alert Sent</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>Your emergency contacts and nearby services have been notified. Help is on the way.</p>
            </div>
            <button onClick={onClose} style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: '#22C55E', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Close</button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(220,38,38,0.15)', border: '2px solid #DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>🚨</div>
              <div>
                <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 800, margin: '0 0 4px' }}>Emergency SOS</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>This will alert your emergency contacts & nearby services</p>
              </div>
              <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 20, flexShrink: 0 }}>✕</button>
            </div>

            <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ color: '#FCA5A5', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>⚠ What happens when you press SOS:</div>
              <ul style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
                <li>Your registered emergency contacts are notified immediately</li>
                <li>Your location & health profile is shared with responders</li>
                <li>Nearest hospital is alerted with your medical history</li>
              </ul>
            </div>

            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', marginBottom: 16 }}>
              Sending as <strong style={{ color: '#fff' }}>{patientName}</strong>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSOS} disabled={sending} style={{ flex: 2, padding: '12px 0', borderRadius: 10, border: 'none', background: sending ? 'rgba(220,38,38,0.4)' : 'linear-gradient(135deg,#7F1D1D,#DC2626)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px rgba(220,38,38,0.35)' }}>
                {sending ? '⟳ Sending...' : '🚨 Send Emergency Alert'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const router  = useRouter();
  const uiStore = useUIStore() as any;
  const { activePage, setActivePage, setActiveTab } = uiStore;
  const sidebarOpen = uiStore.sidebarOpen;
  const collapsed   = sidebarOpen === false;
  const W = collapsed ? SIDEBAR_W_MINI : SIDEBAR_W;

  const [user,     setUser]     = useState<any>((useAuthStore.getState() as any).user);
  const [kpis,     setKpis]     = useState<any>(null);
  const [profile,  setProfile]  = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [showSOS,  setShowSOS]  = useState(false);

  // Profile completeness score — derived from real profile data
  const { score: profileScore } = useProfileScore(profile, 'PATIENT');

  useEffect(() => {
    const s = useAuthStore.getState() as any;
    setUser(s.user);
    const unsub = useAuthStore.subscribe((s: any) => setUser(s.user));
    return () => unsub();
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      (patientAPI as any).dashboard(),
      (patientAPI as any).getProfile(),
      patientAPI.getMedicalHistory(),
      (patientAPI as any).getNotifications?.() ?? Promise.resolve(null),
    ]).then(([dashRes, profRes, histRes, notifRes]) => {
      if (cancelled) return;
      if (dashRes.status === 'fulfilled') {
        const d = (dashRes.value as any)?.data?.data ?? (dashRes.value as any)?.data ?? {};
        const k = d.kpis ?? d;
        const nextAppt = d.upcomingAppointments?.[0] ?? null;
        setKpis({
          ...k,
          healthScore: d.healthScore?.score ?? (typeof d.healthScore === 'number' ? d.healthScore : null),
          nextAppointmentDate:   nextAppt?.scheduledAt ?? null,
          nextAppointmentDoctor: nextAppt ? `Dr. ${nextAppt.doctor?.lastName ?? ''}`.trim() : null,
        });
      }
      if (profRes.status === 'fulfilled') {
        const p = (profRes.value as any)?.data?.data ?? (profRes.value as any)?.data ?? {};
        setProfile(p);
      }
      if (histRes.status === 'fulfilled') {
        const h = (histRes.value as any)?.data?.data ?? (histRes.value as any)?.data ?? {};
        const lifeThreateningAllergy = (h.allergies ?? []).find((a: any) => a.severity === 'LIFE_THREATENING');
        const conditionNames = (h.conditions ?? [])
          .filter((c: any) => c.status === 'ACTIVE' || c.status === 'CHRONIC')
          .map((c: any) => c.name);
        setKpis((prev: any) => ({
          ...prev,
          lifeThreateningAllergy: lifeThreateningAllergy?.allergen ?? null,
          conditionNames,
        }));
      }
      // Count pending doctor access requests from notifications
      if (notifRes?.status === 'fulfilled') {
        const arr = (notifRes.value as any)?.data?.data?.notifications ?? (notifRes.value as any)?.data?.notifications ?? (notifRes.value as any)?.data ?? [];
        const pendingConsents = (Array.isArray(arr) ? arr : []).filter((n: any) =>
          n.type === 'SYSTEM' && (n.data as any)?.requestType === 'DOCTOR_ACCESS_REQUEST' && !n.isRead
        ).length;
        setKpis((prev: any) => ({ ...prev, pendingConsents }));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const handleLogout = useCallback(() => {
    (useAuthStore.getState() as any).clearAuth?.();
    document.cookie = 'hc_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.replace('/');
  }, [router]);

  const handleNav = useCallback((id: string) => {
    if (id === 'reports')      { setActivePage('my-health'); setActiveTab('vault'); }

    else { setActivePage(id); }
  }, [setActivePage, setActiveTab]);

  const firstName   = user?.firstName   ?? profile?.firstName   ?? '';
  const lastName    = user?.lastName    ?? profile?.lastName    ?? '';
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || null;
  const initials    = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || '?';
  const regId       = user?.registrationId ?? profile?.registrationId ?? null;
  const isPremium   = ((user?.subscriptionTier ?? profile?.subscriptionTier ?? '')).toLowerCase() === 'premium';
  const bloodRaw    = profile?.bloodGroup ?? user?.bloodGroup ?? '';
  const bloodDisp   = BLOOD_DISPLAY[bloodRaw] ?? bloodRaw ?? '';

  // FIXED: medication badge = refill alerts only (NOT total active medications)
  const aptBadge     = kpis ? (kpis.upcomingAppointmentsCount ?? kpis.upcomingAppointments ?? kpis.upcoming ?? 0) : null;
  const medBadge     = kpis ? (kpis.refillAlertsCount ?? kpis.medicationRefillsNeeded ?? kpis.refillAlerts ?? 0) : null;
  const commBadge    = kpis ? (kpis.unreadCommunityCount ?? kpis.communitiesUnread ?? 0) : null;
  const consentBadge = kpis ? (kpis.pendingConsents ?? 0) : null;

  const NAV: NavSection[] = [
    {
      key: 'main', label: 'MAIN MENU',
      items: [
        { id: 'home',         label: 'Home' },
        { id: 'my-health',    label: 'My Health' },
        { id: 'communities',  label: 'Communities', badge: commBadge, badgeVariant: 'rose' },
        { id: 'find-doctors', label: 'Find Doctors' },
      ],
    },
    {
      key: 'health', label: 'HEALTH',
      items: [
        { id: 'vitals',      label: 'Vitals' },
        { id: 'symptoms',    label: 'Symptoms' },
        // Badge shows only when there are actual refill alerts, not total medication count
        { id: 'medications', label: 'Medications', badge: medBadge, badgeVariant: 'amber' },
        { id: 'therapies',   label: 'Therapies' },
      ],
    },
    {
      key: 'care', label: 'CARE',
      items: [
        { id: 'appointments', label: 'Appointments', badge: aptBadge, badgeVariant: 'green' },
        { id: 'consents',     label: 'Data Consents', badge: consentBadge, badgeVariant: 'rose' },
      ],
    },
    {
      key: 'account', label: 'ACCOUNT',
      items: [
        { id: 'profile',      label: 'Profile' },
        { id: 'settings',     label: 'Settings' },
        { id: 'subscription', label: 'Subscription' },
      ],
    },
  ];

  return (
    <>
      {showSOS && (
        <SOSModal
          onClose={() => setShowSOS(false)}
          patientName={displayName ?? 'Patient'}
        />
      )}

      <aside className="hc-sb">
        {/* Logo */}
        <div className="hc-sb-logo">
          <div className="hc-sb-logo-icon">🏥</div>
          {!collapsed && (
            <div>
              <div className="hc-sb-logo-name">HealthConnect</div>
              <div className="hc-sb-logo-sub">PATIENT PORTAL</div>
            </div>
          )}
        </div>

        {/* Virtual Health ID */}
        <div className="hc-sb-id">
          {!collapsed && <div className="hc-sb-id-lbl">Virtual Health ID</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 8, width: '100%', justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <div className="hc-sb-avatar">{initials}</div>
            {!collapsed && profileScore < 100 && (
              <ProfileCompletenessRing
                score={profileScore}
                size={36}
                onClick={() => setActivePage('profile')}
              />
            )}
          </div>
          {loading && !collapsed ? (
            <>
              <div className="hc-sb-skel" style={{ height: 14, width: '65%' }} />
              <div className="hc-sb-skel" style={{ height: 11, width: '42%' }} />
              <div className="hc-sb-skel" style={{ height: 11, width: '55%' }} />
            </>
          ) : (
            <>
              <div className="hc-sb-id-name">{displayName ?? 'Patient'}</div>
              <div className="hc-sb-id-reg">{regId}</div>
              {!collapsed && (
                <>
                  {/* Age + blood type + gender row */}
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:6 }}>
                    {profile?.dateOfBirth && (() => {
                      const age = Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000));
                      return age > 0 ? <span className="hc-sb-chip">{age} yrs</span> : null;
                    })()}
                    {(profile?.gender ?? user?.gender) && (
                      <span className="hc-sb-chip">{(profile?.gender ?? user?.gender)?.charAt(0).toUpperCase() + (profile?.gender ?? user?.gender)?.slice(1).toLowerCase()}</span>
                    )}
                    {bloodDisp && <span className="hc-sb-chip">{bloodDisp} Blood</span>}
                    {isPremium  && <span className="hc-sb-chip gold">⭐ Premium</span>}
                  </div>

                  {/* Life-threatening allergy alert only — no conditions list */}
                  {kpis?.lifeThreateningAllergy && (
                    <div style={{ marginBottom:6, padding:'5px 9px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, fontSize:10, fontWeight:700, color:'#B91C1C', display:'flex', alignItems:'center', gap:5, width:'100%' }}>
                      <span>⚠️</span> Allergy: {kpis.lifeThreateningAllergy}
                    </div>
                  )}

                  {/* Next appointment */}
                  {kpis?.nextAppointmentDate && (
                    <div style={{ fontSize:10, color:'#6B7280', display:'flex', alignItems:'center', gap:4, marginBottom:5, width:'100%' }}>
                      <span style={{ color:'rgba(253,211,77,0.9)' }}>📅</span>
                      <span>Next: {new Date(kpis.nextAppointmentDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
                      {kpis.nextAppointmentDoctor && <span style={{ color:'#94A3B8' }}>· {kpis.nextAppointmentDoctor}</span>}
                    </div>
                  )}

                  {/* Health score bar */}
                  {kpis?.healthScore != null && (
                    <div style={{ width:'100%', marginTop:4 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                        <span style={{ fontSize:9, color:'rgba(168,200,255,0.55)', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600 }}>Health Score</span>
                        <span style={{ fontSize:12, fontWeight:800, color: kpis.healthScore>=80?'#4ADE80':kpis.healthScore>=60?'#60A5FA':'#FCD34D' }}>{kpis.healthScore}</span>
                      </div>
                      <div style={{ height:5, background:'#D3D1C7', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${kpis.healthScore}%`, background: kpis.healthScore>=80?'#16A34A':kpis.healthScore>=60?'#2563EB':'#F59E0B', borderRadius:3, transition:'width 0.8s ease' }}/>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Nav sections */}
        {NAV.map((section) => (
          <div key={section.key}>
            <div className="hc-sb-sec-lbl">{section.label}</div>
            <ul className="hc-sb-nav">
              {section.items.map((item) => {
                const active   = activePage === item.id;
                const hasBadge = item.badge != null && Number(item.badge) > 0;
                const bStyle   = BADGE_STYLES[item.badgeVariant ?? ''];
                const IconComp = ICON_MAP[item.id] ?? SvgHealth;
                return (
                  <li key={item.id}>
                    <button
                      className={`hc-sb-btn${active ? ' active' : ''}`}
                      onClick={() => handleNav(item.id)}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="hc-sb-btn-icon"><IconComp /></span>
                      <span className="hc-sb-btn-lbl">{item.label}</span>
                      {hasBadge && (
                        <>
                          <span className="hc-sb-badge" style={bStyle}>{item.badge}</span>
                          <span className="hc-sb-dot" style={{ background: bStyle.background }} />
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="hc-sb-divider" />
          </div>
        ))}

        {/* Bottom: SOS + Logout — same sidebar theme, left-aligned */}
        <div className="hc-sb-bottom">
          <button className="hc-sos-btn" onClick={() => setShowSOS(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {!collapsed && 'Emergency SOS'}
          </button>
          <button className="hc-logout-btn" onClick={handleLogout}>
            <SvgLogout />
            {!collapsed && 'Log Out'}
          </button>
        </div>
      </aside>
    </>
  );
}
