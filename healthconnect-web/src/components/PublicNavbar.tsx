'use client';
// src/components/PublicNavbar.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Shared navbar used across ALL public pages:
//   /  (home)  ·  /communities  ·  /doctors  ·  /hospitals  ·  /learn
//
// Features:
//   • HC logo + "HealthConnect / India's Unified Healthcare Platform" branding
//   • Light theme always — white bg, dark text, teal accents
//   • Scroll progress bar
//   • Role-aware "My Health" (patients) and "My Patients" (doctors)
//   • Both visible to everyone — click prompts login if not authenticated
//   • sessionStorage redirect intent so AuthModal sends user to right place
//   • Home uses window.location.href (bypasses Next.js middleware redirect)
//   • UserMenu avatar dropdown when logged in — matches patient dashboard
//   • Mobile hamburger menu
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
function getDashRoute(role?: string) {
  switch ((role ?? '').toUpperCase()) {
    case 'DOCTOR':   return '/doctor-dashboard';
    case 'HOSPITAL': return '/hospital-dashboard';
    case 'ADMIN':    return '/admin-dashboard';
    default:         return '/dashboard';
  }
}

// ── UserMenu dropdown — matches patient dashboard design ─────────────────────
const UserMenu: React.FC<{
  user: { firstName: string; lastName: string; email: string; role: string };
  onSignOut: () => void;
}> = ({ user, onSignOut }) => {
  const router   = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'U';
  const fullName = `${user.firstName} ${user.lastName}`.trim();

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#F0FDFA', border: '1.5px solid #CCFBF1',
          borderRadius: 10, padding: '5px 12px 5px 5px', cursor: 'pointer',
          transition: 'all 0.15s',
        }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'linear-gradient(135deg,#14B8A6,#0D9488)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 12, fontWeight: 800, flexShrink: 0,
        }}>
          {initials}
        </div>
        <span style={{
          fontSize: 13, fontWeight: 600, color: '#0F172A',
          fontFamily: 'DM Sans, sans-serif',
          maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {user.firstName}
        </span>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
          style={{ color: '#94A3B8', flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)',
          background: '#fff', borderRadius: 16,
          boxShadow: '0 8px 40px rgba(15,23,42,0.14)',
          border: '1px solid #E2E8F0', minWidth: 224, zIndex: 300, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #F1F5F9', textAlign: 'center' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'linear-gradient(135deg,#14B8A6,#0D9488)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 18, fontWeight: 800, margin: '0 auto 8px',
            }}>
              {initials}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', fontFamily: 'DM Sans, sans-serif' }}>{fullName}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{user.email}</div>
          </div>

          {/* Links */}
          {[
            { icon: '👤', label: 'Profile',      path: getDashRoute(user.role) + '?tab=profile' },
            { icon: '⚙️', label: 'Settings',     path: getDashRoute(user.role) + '?tab=settings' },
            { icon: '⭐', label: 'Subscription', path: getDashRoute(user.role) + '?tab=subscription' },
          ].map(item => (
            <button key={item.label}
              onClick={() => { window.location.href = item.path; setOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 13.5, color: '#334155',
                fontFamily: 'DM Sans, sans-serif', textAlign: 'left',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}

          {/* Dashboard CTA */}
          <div style={{ padding: '8px 12px', borderTop: '1px solid #F1F5F9' }}>
            <button
              onClick={() => { router.push(getDashRoute(user.role)); setOpen(false); }}
              style={{
                width: '100%', background: 'linear-gradient(135deg,#14B8A6,#0D9488)',
                color: '#fff', border: 'none', borderRadius: 9, padding: '9px',
                fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}>
              Go to My Dashboard →
            </button>
          </div>

          {/* Sign out */}
          <button
            onClick={() => { onSignOut(); setOpen(false); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', background: 'none', border: 'none',
              borderTop: '1px solid #F1F5F9', cursor: 'pointer',
              fontSize: 12.5, color: '#EF4444', fontFamily: 'DM Sans, sans-serif',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            <span>↪</span> Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main Navbar ───────────────────────────────────────────────────────────────
export default function PublicNavbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { openAuthModal, closeAuthModal, authModal } = useUIStore();
  const { user, isAuthenticated, clearAuth, _hasHydrated } = useAuthStore();

  const [scrolled,    setScrolled]    = useState(false);
  const [scrollPct,   setScrollPct]   = useState(0);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [roleTooltip, setRoleTooltip] = useState<string | null>(null);

  // Scroll progress bar
  useEffect(() => {
    const fn = () => {
      setScrolled(window.scrollY > 20);
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(docH > 0 ? (window.scrollY / docH) * 100 : 0);
    };
    fn();
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // ── Nav link handler ───────────────────────────────────────────────────────
  const handleNav = (href: string) => {
    setMobileOpen(false);
    if (href === '/') {
      // Hard navigation — bypasses Next.js middleware that would redirect
      // authenticated users back to /dashboard
      window.location.href = '/?home=1';
      return;
    }
    if (href.includes('#')) {
      const [path, hash] = href.split('#');
      if (!path || path === '/') {
        if (window.location.pathname === '/') {
          document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
          return;
        }
        window.location.href = `/#${hash}`;
        return;
      }
    }
    router.push(href);
  };

  // ── My Health click — patients only ───────────────────────────────────────
  const handleMyHealth = () => {
    setMobileOpen(false);
    if (!isAuthenticated || !user) {
      // Store intended destination for AuthModal to read after login
      sessionStorage.setItem('hc_post_login_redirect', '/dashboard');
      openAuthModal('login');
      return;
    }
    const role = user.role?.toUpperCase();
    if (role === 'PATIENT') {
      router.push('/dashboard');
      return;
    }
    // Doctor or Hospital clicked My Health — show tooltip
    setRoleTooltip('my-health');
    setTimeout(() => setRoleTooltip(null), 3000);
  };

  // ── My Patients click — doctors only ──────────────────────────────────────
  const handleMyPatients = () => {
    setMobileOpen(false);
    if (!isAuthenticated || !user) {
      sessionStorage.setItem('hc_post_login_redirect', '/doctor-dashboard?tab=patients');
      openAuthModal('login');
      return;
    }
    const role = user.role?.toUpperCase();
    if (role === 'DOCTOR') {
      router.push('/doctor-dashboard?tab=patients');
      return;
    }
    setRoleTooltip('my-patients');
    setTimeout(() => setRoleTooltip(null), 3000);
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Standard nav links
  const NAV_LINKS = [
    { label: 'Home',          href: '/' },
    { label: 'Health Communities', href: '/communities' },
    { label: 'Find Doctors',  href: '/doctors' },
    { label: 'Find Hospitals',href: '/hospitals' },
    { label: 'Knowledge Hub', href: '/learn' },
  ];

  const NavLink = ({ label, href, onClick, active }: { label: string; href?: string; onClick?: () => void; active: boolean }) => (
    <button
      onClick={onClick ?? (() => href && handleNav(href))}
      style={{
        display: 'block', padding: '7px 11px', borderRadius: 8,
        fontSize: 13, fontWeight: active ? 700 : 500,
        color: active ? '#0D9488' : '#374151',
        background: active ? '#F0FDFA' : 'transparent',
        border: active ? '1px solid #CCFBF1' : '1px solid transparent',
        cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
        transition: 'all 0.15s', whiteSpace: 'nowrap', position: 'relative' as const,
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color = '#0D9488';
          (e.currentTarget as HTMLElement).style.background = '#F0FDFA';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color = '#374151';
          (e.currentTarget as HTMLElement).style.background = 'transparent';
        }
      }}>
      {label}
    </button>
  );

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: '#ffffff',
        borderBottom: scrolled ? '1px solid #E2EAF0' : '1px solid #EEF2F7',
        boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,0.07)' : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
        height: 64,
      }}>
        {/* Scroll progress bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, height: 2,
          width: `${scrollPct}%`,
          background: 'linear-gradient(90deg,#0D9488,#14B8A6,#5EEAD4)',
          transition: 'width 0.1s linear',
          boxShadow: '0 0 8px rgba(20,184,166,0.5)',
        }}/>

        <div style={{
          maxWidth: 1280, margin: '0 auto', padding: '0 28px',
          height: '100%', display: 'flex', alignItems: 'center',
        }}>

          {/* ── Logo ─────────────────────────────────────────────────────── */}
          <button
            onClick={() => handleNav('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 0, marginRight: 20, flexShrink: 0,
            }}>
            {/* HC badge */}
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: 'linear-gradient(135deg,#0D9488,#14B8A6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, color: '#fff', fontSize: 14,
              boxShadow: '0 2px 12px rgba(20,184,166,0.3)',
              letterSpacing: '-0.5px', flexShrink: 0,
              fontFamily: 'Sora, DM Sans, sans-serif',
            }}>
              HC
            </div>
            {/* Brand text */}
            <div style={{ textAlign: 'left', lineHeight: 1 }}>
              <div style={{
                fontSize: 14.5, fontWeight: 800, color: '#0A1628',
                fontFamily: 'Sora, Poppins, sans-serif',
                letterSpacing: '-0.3px', lineHeight: 1.1,
              }}>
                HealthConnect
              </div>
              <div style={{
                fontSize: 9.5, color: '#0D9488', fontWeight: 600,
                fontFamily: 'DM Sans, sans-serif',
                letterSpacing: '0.02em', marginTop: 2, lineHeight: 1,
                whiteSpace: 'nowrap',
              }}>
                India's Unified Healthcare Platform
              </div>
            </div>
          </button>

          {/* ── Nav links — desktop ───────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }} className="hcnav-links">
            {NAV_LINKS.map(l => (
              <NavLink key={l.href} label={l.label} href={l.href} active={isActive(l.href)}/>
            ))}

            {/* My Health — patients */}
            <div style={{ position: 'relative' }}>
              <NavLink
                label="My Health"
                active={isActive('/dashboard') && user?.role?.toUpperCase() === 'PATIENT'}
                onClick={handleMyHealth}
              />
              {roleTooltip === 'my-health' && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#0F172A', color: '#fff', borderRadius: 8,
                  padding: '6px 12px', fontSize: 11.5, fontWeight: 500,
                  whiteSpace: 'nowrap', zIndex: 50,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  This section is for patients
                  <div style={{
                    position: 'absolute', bottom: '100%', left: '50%',
                    transform: 'translateX(-50%)',
                    borderWidth: 4, borderStyle: 'solid',
                    borderColor: 'transparent transparent #0F172A transparent',
                  }}/>
                </div>
              )}
            </div>

            {/* My Patients — doctors */}
            <div style={{ position: 'relative' }}>
              <NavLink
                label="My Patients"
                active={isActive('/doctor-dashboard') && user?.role?.toUpperCase() === 'DOCTOR'}
                onClick={handleMyPatients}
              />
              {roleTooltip === 'my-patients' && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#0F172A', color: '#fff', borderRadius: 8,
                  padding: '6px 12px', fontSize: 11.5, fontWeight: 500,
                  whiteSpace: 'nowrap', zIndex: 50,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  This section is for doctors
                  <div style={{
                    position: 'absolute', bottom: '100%', left: '50%',
                    transform: 'translateX(-50%)',
                    borderWidth: 4, borderStyle: 'solid',
                    borderColor: 'transparent transparent #0F172A transparent',
                  }}/>
                </div>
              )}
            </div>
          </div>

          {/* ── Auth area ─────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, marginLeft: 12 }} className="hcnav-auth">
            {_hasHydrated && isAuthenticated && user ? (
              <>
                <button
                  onClick={() => router.push(getDashRoute(user.role))}
                  style={{
                    padding: '8px 16px', borderRadius: 9,
                    border: '1.5px solid #E2E8F0',
                    background: '#F8FAFC', color: '#0F172A',
                    fontFamily: 'DM Sans, sans-serif', fontSize: 13,
                    fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>
                  My Dashboard
                </button>
                <UserMenu user={user} onSignOut={clearAuth}/>
              </>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal('login')}
                  style={{
                    padding: '8px 18px', borderRadius: 9,
                    border: '1.5px solid #D1D5DB',
                    background: '#fff', color: '#374151',
                    fontFamily: 'DM Sans, sans-serif', fontSize: 13,
                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#0D9488';
                    (e.currentTarget as HTMLElement).style.color = '#0D9488';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#D1D5DB';
                    (e.currentTarget as HTMLElement).style.color = '#374151';
                  }}>
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  style={{
                    padding: '9px 20px', borderRadius: 9, border: 'none',
                    background: 'linear-gradient(135deg,#0D9488,#14B8A6)',
                    color: '#fff', fontFamily: 'DM Sans, sans-serif',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(20,184,166,0.28)',
                    transition: 'all 0.2s', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(20,184,166,0.4)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = '';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(20,184,166,0.28)';
                  }}>
                  Sign Up Free
                </button>
              </>
            )}
          </div>

          {/* ── Hamburger ────────────────────────────────────────────────── */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="hcnav-hamburger"
            style={{
              display: 'none', flexDirection: 'column', gap: 5,
              cursor: 'pointer', padding: 8,
              background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 8,
              marginLeft: 8,
            }}>
            <span style={{ display: 'block', width: 18, height: 2, background: '#374151', borderRadius: 2, transition: 'all 0.3s', transform: mobileOpen ? 'rotate(45deg) translate(4px,5px)' : '' }}/>
            <span style={{ display: 'block', width: 18, height: 2, background: '#374151', borderRadius: 2, opacity: mobileOpen ? 0 : 1, transition: 'all 0.3s' }}/>
            <span style={{ display: 'block', width: 18, height: 2, background: '#374151', borderRadius: 2, transition: 'all 0.3s', transform: mobileOpen ? 'rotate(-45deg) translate(4px,-5px)' : '' }}/>
          </button>
        </div>
      </nav>

      {/* ── Mobile menu ──────────────────────────────────────────────────── */}
      <div
        className="hcnav-mobile"
        style={{
          position: 'fixed', top: 64, left: 0, right: 0, bottom: 0,
          background: '#fff', zIndex: 999,
          padding: '20px 20px 32px',
          display: 'flex', flexDirection: 'column', gap: 4,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          borderTop: '1px solid #E5EAF0', overflowY: 'auto',
        }}>
        {NAV_LINKS.map(l => (
          <button key={l.label} onClick={() => handleNav(l.href)}
            style={{
              background: isActive(l.href) ? '#F0FDFA' : 'none',
              border: isActive(l.href) ? '1px solid #CCFBF1' : '1px solid transparent',
              borderRadius: 10, fontFamily: 'DM Sans, sans-serif',
              fontSize: 15, fontWeight: 600,
              color: isActive(l.href) ? '#0D9488' : '#374151',
              padding: '12px 16px', textAlign: 'left', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
            {l.label}<span style={{ fontSize: 12, opacity: 0.4 }}>→</span>
          </button>
        ))}
        <button onClick={handleMyHealth}
          style={{ background: 'none', border: '1px solid transparent', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600, color: '#374151', padding: '12px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          My Health<span style={{ fontSize: 12, opacity: 0.4 }}>→</span>
        </button>
        <button onClick={handleMyPatients}
          style={{ background: 'none', border: '1px solid transparent', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600, color: '#374151', padding: '12px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          My Patients<span style={{ fontSize: 12, opacity: 0.4 }}>→</span>
        </button>

        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {isAuthenticated && user ? (
            <>
              <button onClick={() => { router.push(getDashRoute(user.role)); setMobileOpen(false); }}
                style={{ padding: 14, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#0D9488,#14B8A6)', color: '#fff', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Go to My Dashboard →
              </button>
              <button onClick={() => { clearAuth(); setMobileOpen(false); }}
                style={{ padding: 14, borderRadius: 12, border: '1.5px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { openAuthModal('login'); setMobileOpen(false); }}
                style={{ padding: 14, borderRadius: 12, border: '1.5px solid #D1D5DB', background: '#fff', color: '#374151', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Sign In
              </button>
              <button onClick={() => { openAuthModal('register'); setMobileOpen(false); }}
                style={{ padding: 14, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#0D9488,#14B8A6)', color: '#fff', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Sign Up Free
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        .hcnav-links    { display: flex !important; }
        .hcnav-auth     { display: flex !important; }
        .hcnav-hamburger{ display: none !important; }
        .hcnav-mobile   { display: flex !important; }
        @media (max-width: 1100px) {
          .hcnav-links    { display: none !important; }
          .hcnav-auth     { display: none !important; }
          .hcnav-hamburger{ display: flex !important; }
        }
      `}</style>

    </>
  );
}
