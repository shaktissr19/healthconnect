'use client';
// src/app/admin-dashboard/layout.tsx
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

const NAV = [
  { href: '/admin-dashboard',               icon: '▦',  label: 'Overview'      },
  { href: '/admin-dashboard/users',         icon: '👥', label: 'Users'         },
  { href: '/admin-dashboard/doctors',       icon: '🩺', label: 'Doctors'       },
  { href: '/admin-dashboard/verification',  icon: '✅', label: 'Verification'  },
  { href: '/admin-dashboard/appointments',  icon: '📅', label: 'Appointments'  },
  { href: '/admin-dashboard/communities',   icon: '🏘️', label: 'Communities'   },
  { href: '/admin-dashboard/subscriptions', icon: '💳', label: 'Subscriptions' },
  { href: '/admin-dashboard/revenue',       icon: '📊', label: 'Revenue'       },
];

const SIDEBAR  = '#2D8B7A';
const SIDEBAR2 = '#1F6B5C';
const BORDER   = 'rgba(255,255,255,0.13)';
const MUTED    = 'rgba(255,255,255,0.62)';
const MAIN_BG  = '#F0F9F8';
const CARD_BDR = 'rgba(45,139,122,0.14)';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);
  const [collapsed, setCollapsed]     = useState(false);
  const [adminEmail, setAdminEmail]   = useState('');
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const resolve = (s: any) => {
      if (s.isAuthenticated && s.user?.role === 'ADMIN') {
        setAdminEmail(s.user.email || 'admin');
        setAuthChecked(true);
      } else if (s.isAuthenticated && s.user?.role) {
        const map: Record<string, string> = { DOCTOR: '/doctor-dashboard', PATIENT: '/dashboard', HOSPITAL: '/hospital-dashboard' };
        router.replace(map[s.user.role] || '/');
      } else {
        router.replace('/');
      }
    };

    const s = useAuthStore.getState() as any;
    if (s._hasHydrated) { resolve(s); return; }

    let done = false;
    const unsub = (useAuthStore as any).subscribe((ns: any) => {
      if (done || !ns._hasHydrated) return;
      done = true; unsub(); clearTimeout(t); resolve(ns);
    });
    const t = setTimeout(() => { if (done) return; done = true; unsub(); resolve(useAuthStore.getState() as any); }, 1000);
    return () => { unsub(); clearTimeout(t); };
  }, []);

  // Auto-logout on 401 (expired token) — add interceptor once
  useEffect(() => {
    const id = api.interceptors.response.use(
      r => r,
      err => {
        if (err.response?.status === 401) doLogout();
        return Promise.reject(err);
      }
    );
    return () => api.interceptors.response.eject(id);
  }, []);

  const doLogout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    (useAuthStore.getState() as any).clearAuth();
    router.replace('/');
  };

  if (!authChecked) return (
    <div style={{ minHeight: '100vh', background: SIDEBAR, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'sans-serif' }}>HC</div>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.2)', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const SW = collapsed ? 64 : 236;

  return (
    <div style={{ minHeight: '100vh', background: MAIN_BG, fontFamily: "'Inter','DM Sans',sans-serif", display: 'flex' }}>

      {/* Sidebar */}
      <div style={{ width: SW, minHeight: '100vh', flexShrink: 0, background: `linear-gradient(175deg,${SIDEBAR} 0%,${SIDEBAR2} 100%)`, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 50, transition: 'width 0.22s ease', boxShadow: '3px 0 20px rgba(0,0,0,0.12)' }}>

        {/* Logo */}
        <div style={{ padding: collapsed ? '18px 0' : '18px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${BORDER}`, justifyContent: collapsed ? 'center' : 'flex-start', flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>HC</div>
          {!collapsed && <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>HealthConnect</div>
            <div style={{ color: MUTED, fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Admin Panel</div>
          </div>}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '10px 7px', overflowY: 'auto' }}>
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== '/admin-dashboard' && pathname.startsWith(item.href));
            return (
              <a key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: collapsed ? '10px 0' : '9px 11px', justifyContent: collapsed ? 'center' : 'flex-start', borderRadius: 7, marginBottom: 2, textDecoration: 'none', background: active ? 'rgba(255,255,255,0.18)' : 'transparent', color: active ? '#fff' : MUTED, fontSize: 13, fontWeight: active ? 600 : 400, transition: 'all 0.13s', borderLeft: active ? '3px solid rgba(255,255,255,0.85)' : '3px solid transparent' }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
              </a>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '10px 7px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
          {!collapsed && <div style={{ padding: '7px 11px', marginBottom: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 7 }}>
            <div style={{ color: MUTED, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Signed in</div>
            <div style={{ color: '#fff', fontSize: 11, fontWeight: 500, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adminEmail}</div>
          </div>}
          <button onClick={() => setCollapsed(c => !c)} style={{ width: '100%', padding: '7px', borderRadius: 7, border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, cursor: 'pointer', fontSize: 11, marginBottom: 5 }}>
            {collapsed ? '→' : '← Collapse'}
          </button>
          <button onClick={doLogout} style={{ width: '100%', padding: '9px', borderRadius: 7, border: 'none', background: 'rgba(239,68,68,0.22)', color: '#FCA5A5', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {collapsed ? '🚪' : <><span>🚪</span><span>Sign Out</span></>}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: SW, flex: 1, minHeight: '100vh', transition: 'margin-left 0.22s ease', display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <div style={{ height: 56, background: '#fff', borderBottom: `1px solid ${CARD_BDR}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
          <span style={{ color: '#5A7184', fontSize: 13, fontWeight: 500 }}>
            {NAV.find(n => pathname === n.href || (n.href !== '/admin-dashboard' && pathname.startsWith(n.href)))?.label || 'Admin'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
            <span style={{ color: '#5A7184', fontSize: 12 }}>{adminEmail}</span>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg,${SIDEBAR},${SIDEBAR2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>{adminEmail[0]?.toUpperCase() || 'A'}</div>
          </div>
        </div>
        <main style={{ padding: 24, flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}
