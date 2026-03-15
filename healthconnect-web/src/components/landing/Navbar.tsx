'use client';
import { useState, useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

const LINKS = [
  { label: 'Home',        href: '/',            isPage: true  },
  { label: 'Features',    href: '/#features',   isPage: false },
  { label: 'Communities', href: '/communities', isPage: true  },
  { label: 'Doctors',     href: '/doctors',     isPage: true  },
  { label: 'Hospitals',   href: '/hospitals',   isPage: true  },
  { label: 'Learn Hub',   href: '/learn',       isPage: true  },
];

function getDashboardRoute(role?: string): string {
  switch ((role ?? '').toUpperCase()) {
    case 'ADMIN':    return '/admin-dashboard';
    case 'DOCTOR':   return '/doctor-dashboard';
    case 'HOSPITAL': return '/hospital-dashboard';
    default:         return '/dashboard';
  }
}

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [open,      setOpen]      = useState(false);
  const [authed,    setAuthed]    = useState(false);
  const [userRole,  setUserRole]  = useState<string>('');
  const { openAuthModal } = useUIStore() as any;
  const router = useRouter();

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

  useEffect(() => {
    const sync = (s: any) => {
      if (!s._hasHydrated) return;
      setAuthed(!!s.isAuthenticated);
      setUserRole(s.user?.role ?? '');
    };
    sync(useAuthStore.getState() as any);
    const unsub = (useAuthStore as any).subscribe(sync);
    return () => unsub();
  }, []);

  const handleNav = (href: string) => {
    setOpen(false);
    if (href.includes('#')) {
      const [path, hash] = href.split('#');
      if (!path || path === '/') {
        if (window.location.pathname === '/') {
          const el = document.getElementById(hash);
          if (el) { el.scrollIntoView({ behavior: 'smooth' }); return; }
        } else { router.push(`/#${hash}`); return; }
      }
    }
    router.push(href);
  };

  const isActive = (href: string) => {
    if (typeof window === 'undefined') return false;
    const p = window.location.pathname;
    if (href === '/') return p === '/';
    if (href.includes('#')) return p === '/';
    return p === href || p.startsWith(href + '/');
  };

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: '0 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '68px',
        // Dark navy — always visible, matches communities page navbar
        background: scrolled ? 'rgba(14,26,44,0.97)' : 'rgba(12,25,41,0.92)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: scrolled ? '1px solid rgba(20,184,166,0.14)' : '1px solid rgba(20,184,166,0.08)',
        boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.4)' : 'none',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Scroll progress bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, height: '2px', width: `${scrollPct}%`, background: 'linear-gradient(90deg,#0D9488,#14B8A6,#5EEAD4)', transition: 'width 0.1s linear', boxShadow: '0 0 8px rgba(20,184,166,0.6)' }} />

        {/* Logo */}
        <button onClick={() => handleNav('/')} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#0D9488,#14B8A6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 900, color: '#fff', boxShadow: '0 0 20px rgba(20,184,166,0.35)' }}>H</div>
          <div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '15px', color: '#fff', lineHeight: 1, letterSpacing: '-0.3px' }}>HealthConnect India</div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#14B8A6', letterSpacing: '0.06em', marginTop: '2px' }}>Unified Healthcare Platform</div>
          </div>
        </button>

        {/* Nav links — desktop */}
        <ul style={{ display: 'flex', alignItems: 'center', gap: '2px', listStyle: 'none', margin: 0, padding: 0 }} className="hc-navlinks">
          {LINKS.map(l => {
            const active = isActive(l.href);
            return (
              <li key={l.label}>
                <button onClick={() => handleNav(l.href)} style={{
                  display: 'block', padding: '6px 11px', borderRadius: '8px',
                  fontSize: '13px', fontWeight: active ? 600 : 500,
                  color: active ? '#14B8A6' : 'rgba(255,255,255,0.7)',
                  background: active ? 'rgba(20,184,166,0.1)' : 'transparent',
                  border: active ? '1px solid rgba(20,184,166,0.2)' : '1px solid transparent',
                  cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
                  transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'transparent'; } }}
                >{l.label}</button>
              </li>
            );
          })}
        </ul>

        {/* Auth buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="hc-navauth">
          {authed ? (
            <button onClick={() => router.push(getDashboardRoute(userRole))} style={{ padding: '9px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#0D9488,#14B8A6)', color: '#fff', fontFamily: 'Poppins, sans-serif', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(20,184,166,0.3)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(20,184,166,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(20,184,166,0.3)'; }}
            >Dashboard →</button>
          ) : (
            <>
              <button onClick={() => openAuthModal('login')} style={{ padding: '8px 18px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.85)', fontFamily: 'Poppins, sans-serif', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(20,184,166,0.4)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
              >Sign In</button>
              <button onClick={() => openAuthModal('register')} style={{ padding: '9px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#0D9488,#14B8A6)', color: '#fff', fontFamily: 'Poppins, sans-serif', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(20,184,166,0.3)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(20,184,166,0.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(20,184,166,0.3)'; }}
              >Sign Up Free</button>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button onClick={() => setOpen(!open)} className="hc-hamburger" style={{ display: 'none', flexDirection: 'column', gap: '5px', cursor: 'pointer', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}>
          <span style={{ display: 'block', width: '18px', height: '2px', background: '#fff', borderRadius: '2px', transition: 'all 0.3s', transform: open ? 'rotate(45deg) translate(4px,5px)' : '' }} />
          <span style={{ display: 'block', width: '18px', height: '2px', background: '#fff', borderRadius: '2px', opacity: open ? 0 : 1, transition: 'all 0.3s' }} />
          <span style={{ display: 'block', width: '18px', height: '2px', background: '#fff', borderRadius: '2px', transition: 'all 0.3s', transform: open ? 'rotate(-45deg) translate(4px,-5px)' : '' }} />
        </button>
      </nav>

      {/* Mobile menu */}
      <div style={{ position: 'fixed', top: '68px', left: 0, right: 0, bottom: 0, background: 'rgba(10,20,36,0.98)', backdropFilter: 'blur(24px)', zIndex: 999, padding: '24px 5%', display: 'flex', flexDirection: 'column', gap: '4px', transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)' }} className="hc-mobilemenu">
        {LINKS.map(l => (
          <button key={l.label} onClick={() => handleNav(l.href)} style={{ background: 'none', border: '1px solid transparent', borderRadius: '10px', fontFamily: 'Poppins, sans-serif', fontSize: '17px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', padding: '13px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {l.label}<span style={{ fontSize: '14px', opacity: 0.4 }}>→</span>
          </button>
        ))}
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {authed ? (
            <button onClick={() => { router.push(getDashboardRoute(userRole)); setOpen(false); }} style={{ padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#0D9488,#14B8A6)', color: '#fff', fontFamily: 'Poppins, sans-serif', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>Go to Dashboard →</button>
          ) : (
            <>
              <button onClick={() => { openAuthModal('login'); setOpen(false); }} style={{ padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', fontFamily: 'Poppins, sans-serif', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>Sign In</button>
              <button onClick={() => { openAuthModal('register'); setOpen(false); }} style={{ padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#0D9488,#14B8A6)', color: '#fff', fontFamily: 'Poppins, sans-serif', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>Sign Up Free</button>
            </>
          )}
        </div>
      </div>

      <style>{`
        .hc-navlinks { display: flex !important; }
        .hc-navauth  { display: flex !important; }
        .hc-hamburger{ display: none !important; }
        .hc-mobilemenu{ display: flex !important; }
        @media (max-width: 900px) {
          .hc-navlinks  { display: none !important; }
          .hc-navauth   { display: none !important; }
          .hc-hamburger { display: flex !important; }
        }
      `}</style>
    </>
  );
}
