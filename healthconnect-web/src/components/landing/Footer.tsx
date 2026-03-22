'use client';
import { theme as t } from '@/theme';

const COLS = [
  {
    title: 'Platform',
    links: [
      { label: 'Find Doctors',    href: '/doctors'     },
      { label: 'Hospitals',       href: '/hospitals'   },
      { label: 'Communities',     href: '/communities' },
      { label: 'Knowledge Hub',   href: '/learn'       },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us',  href: '#' },
      { label: 'Careers',   href: '#' },
      { label: 'Contact',   href: '#' },
      { label: 'Blog',      href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy',   href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'DPDP Notice',      href: '#' },
      { label: 'Data Deletion',    href: '#' },
    ],
  },
];

const SOCIALS = [
  {
    name: 'X (Twitter)', href: '#',
    svg: <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.258 5.626zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  },
  {
    name: 'LinkedIn', href: '#',
    svg: <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
  },
  {
    name: 'Instagram', href: '#',
    svg: <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
  },
  {
    name: 'YouTube', href: '#',
    svg: <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  },
];

export default function Footer() {
  return (
    <footer id="footer" style={{ background: t.footer.bg, borderTop: t.footer.borderTop, padding: t.footer.pad }}>
      {/* Main grid — simplified: brand + 3 cols */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr repeat(3,1fr)', gap:'48px', marginBottom:'44px' }}>

        {/* Brand */}
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'linear-gradient(135deg,#0D9488,#14B8A6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:900, color:'#fff', boxShadow:'0 0 16px rgba(20,184,166,0.25)' }}>H</div>
            <div>
              <div style={{ fontFamily:'var(--font-heading)', fontWeight:800, fontSize:'15px', color:'#fff', letterSpacing:'-0.3px' }}>HealthConnect India</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--teal)', letterSpacing:'0.04em', marginTop:'1px' }}>healthconnect.sbs</div>
            </div>
          </div>

          <p style={{ fontSize:'13px', color:'var(--text-low)', lineHeight:1.7, marginBottom:'20px', maxWidth:'260px' }}>
            India's unified healthcare platform — connecting patients, doctors, and hospitals with privacy-first design.
          </p>

          {/* Compliance badges — kept minimal */}
          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'20px' }}>
            {['DPDP 2023', 'ABDM', 'E2E Encrypted'].map(b => (
              <span key={b} style={{ padding:'3px 9px', borderRadius:'6px', background:'rgba(20,184,166,0.06)', border:'1px solid rgba(13,148,136,0.2)', fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--teal)', fontWeight:600, letterSpacing:'0.04em' }}>{b}</span>
            ))}
          </div>

          {/* Social icons */}
          <div style={{ display:'flex', gap:'8px' }}>
            {SOCIALS.map(s => (
              <a key={s.name} href={s.href} aria-label={s.name} style={{ width:'32px', height:'32px', borderRadius:'8px', background:'var(--card)', border:'1px solid var(--card-border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', textDecoration:'none', color:'var(--text-low)', transition:'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(20,184,166,0.35)'; e.currentTarget.style.color='#14B8A6'; e.currentTarget.style.background='rgba(20,184,166,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#64748B'; e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}
              >{s.svg}</a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {COLS.map(c => (
          <div key={c.title}>
            <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:'11px', color:'#F0F6FF', marginBottom:'16px', textTransform:'uppercase', letterSpacing:'0.08em' }}>{c.title}</div>
            <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:'10px' }}>
              {c.links.map(l => (
                <li key={l.label}>
                  <a href={l.href} style={{ fontSize:'13px', color:'var(--text-low)', textDecoration:'none', transition:'color 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.color='#14B8A6'; }}
                    onMouseLeave={e => { e.currentTarget.style.color='#64748B'; }}
                  >{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:'22px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
        <div style={{ fontSize:'12px', color:'#4B5563', fontFamily:'var(--font-mono)' }}>
          © 2026 HealthConnect India Pvt. Ltd. · Made with 💙 for India
        </div>
        <div style={{ display:'flex', gap:'20px' }}>
          {['Privacy Policy', 'Terms of Service', 'DPDP Notice'].map(l => (
            <a key={l} href="#" style={{ fontSize:'11px', color:'#4B5563', textDecoration:'none', fontFamily:'var(--font-mono)', transition:'color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color='#14B8A6'; }}
              onMouseLeave={e => { e.currentTarget.style.color='#4B5563'; }}
            >{l}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}
