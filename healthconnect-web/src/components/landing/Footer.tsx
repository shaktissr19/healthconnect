'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

// Only links pointing to routes that actually exist
const FOOTER_LINKS = {
  'For Patients': [
    { label: 'Create Free Profile', href: '/register' },
    { label: 'Find Doctors', href: '/doctors' },
    { label: 'Browse Communities', href: '/communities' },
    { label: 'Book Appointment', href: '/register' },
    { label: 'My Health Dashboard', href: '/dashboard' },
  ],
  'For Providers': [
    { label: 'Doctor Registration', href: '/register?role=doctor' },
    { label: 'Hospital Listing', href: '/register?role=hospital' },
    { label: 'HCD Verification', href: '/register?role=doctor' },
    { label: 'Teleconsultation Setup', href: '/register?role=doctor' },
  ],
  'Platform': [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '/#features' },
    { label: 'Doctors', href: '/doctors' },
    { label: 'Communities', href: '/communities' },
    { label: 'Pricing', href: '/#pricing' },
  ],
  'Support': [
    { label: 'Contact Us', href: 'mailto:support@healthconnect.sbs' },
    { label: 'Sign Up', href: '/register' },
    { label: 'Sign In', href: '/' },
    { label: 'Doctor Sign Up', href: '/register?role=doctor' },
  ],
};

const SOCIAL = [
  { icon: '𝕏', label: 'Twitter/X', href: 'https://twitter.com' },
  { icon: 'in', label: 'LinkedIn', href: 'https://linkedin.com' },
  { icon: 'f', label: 'Facebook', href: 'https://facebook.com' },
  { icon: '▶', label: 'YouTube', href: 'https://youtube.com' },
];

export default function Footer() {
  const router = useRouter();

  const handleNav = (href: string) => {
    if (href.startsWith('mailto:') || href.startsWith('http')) {
      window.open(href, '_blank');
      return;
    }
    if (href.includes('#')) {
      const [path, hash] = href.split('#');
      if (path === '' || path === '/') {
        const el = document.getElementById(hash);
        if (el) { el.scrollIntoView({ behavior: 'smooth' }); return; }
      }
    }
    router.push(href);
  };

  return (
    <footer style={{ background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)', borderTop: '1px solid #E2E8F0', padding: '60px 5% 0' }}>

      {/* ── Newsletter strip ── */}
      <div style={{ background: '#FFFFFF', border: '1.5px solid #BAE6FD', borderRadius: 16, padding: '28px 36px', marginBottom: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, boxShadow: '0 4px 16px rgba(8,145,178,0.07)' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', fontFamily: 'Poppins, sans-serif', marginBottom: 4 }}>Stay Ahead of Your Health</div>
          <div style={{ fontSize: 12, color: '#64748B' }}>Weekly health tips from verified doctors. No spam. Unsubscribe anytime.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="email"
            placeholder="your@email.com"
            style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: 9, padding: '10px 16px', fontSize: 13, color: '#374151', outline: 'none', width: 220 }}
            onFocus={e => (e.target.style.borderColor = '#0891B2')}
            onBlur={e => (e.target.style.borderColor = '#CBD5E1')}
          />
          <button style={{ background: '#0891B2', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 20px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
            Subscribe
          </button>
        </div>
      </div>

      {/* ── Main footer grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }}>

        {/* Brand column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#0891B2,#0369A1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff' }}>H</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.01em' }}>HealthConnect</div>
              <div style={{ fontSize: 10, color: '#64748B', letterSpacing: '0.08em' }}>INDIA</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7, marginBottom: 20, maxWidth: 260 }}>
            India's unified healthcare platform connecting patients, doctors, and hospitals. Free for patients. Always.
          </p>

          {/* Social icons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {SOCIAL.map((s, i) => (
              <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                style={{ width: 34, height: 34, borderRadius: 8, background: '#FFFFFF', border: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#64748B', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#0891B2'; e.currentTarget.style.color = '#0891B2'; e.currentTarget.style.background = '#E0F2FE'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#64748B'; e.currentTarget.style.background = '#FFFFFF'; }}
              >
                {s.icon}
              </a>
            ))}
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['🔐 DPDP Compliant', '🇮🇳 Made in India', '✅ ISO 27001'].map((b, i) => (
              <div key={i} style={{ fontSize: 9, fontWeight: 700, color: '#475569', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20, padding: '3px 8px' }}>{b}</div>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(FOOTER_LINKS).map(([col, links]) => (
          <div key={col}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#0891B2', letterSpacing: '0.1em', marginBottom: 16 }}>{col.toUpperCase()}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {links.map((link, i) => (
                <li key={i}>
                  <button
                    onClick={() => handleNav(link.href)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, color: '#64748B', textAlign: 'left', lineHeight: 1.5, transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#0891B2')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ borderTop: '1px solid #E2E8F0', padding: '20px 0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 12, color: '#94A3B8' }}>
          © {new Date().getFullYear()} HealthConnect India. All rights reserved. CIN: U72200DL2024PTC000001
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { label: 'Terms', href: '/register' },
            { label: 'Privacy', href: '/register' },
            { label: 'Contact', href: 'mailto:support@healthconnect.sbs' },
          ].map((t, i) => (
            <button key={i} onClick={() => handleNav(t.href)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#94A3B8', padding: 0, transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#0891B2')}
              onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 1024px) {
          footer > div:nth-child(2) { grid-template-columns: 1fr 1fr 1fr !important; }
        }
        @media (max-width: 768px) {
          footer > div:nth-child(2) { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          footer > div:nth-child(2) { grid-template-columns: 1fr !important; }
          footer > div:first-child { flex-direction: column !important; }
        }
      `}</style>
    </footer>
  );
}
