'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useRouter } from 'next/navigation';

export default function FinalCTA(){
  const { isAuthenticated, user } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const router = useRouter();

  const openAccount = () => {
    if (!isAuthenticated || !user) {
      try { sessionStorage.setItem('hc_signup_role','PATIENT'); } catch {}
      openAuthModal('register');
      return;
    }
    const role = String(user.role ?? '').toUpperCase();
    router.push(role==='DOCTOR'?'/doctor-dashboard':role==='HOSPITAL'?'/hospital-dashboard':role==='ADMIN'?'/admin-dashboard':'/dashboard');
  };

  return <section className="final-cta-section">
    <style>{`
      .final-cta-section{background:#fff;padding:28px 28px 46px;font-family:'DM Sans',Arial,sans-serif}.final-cta{max-width:1280px;margin:0 auto;border-radius:20px;position:relative;overflow:hidden;background:linear-gradient(120deg,#071A2C 0%,#0B3D4A 56%,#0D766C 100%);padding:27px 34px;display:grid;grid-template-columns:1fr auto;gap:30px;align-items:center;box-shadow:0 13px 34px rgba(15,23,42,.12)}.final-cta:after{content:'';position:absolute;width:230px;height:230px;border-radius:50%;right:-85px;top:-115px;background:rgba(94,234,212,.1)}.final-cta-kicker{font-size:9px;font-weight:900;letter-spacing:.16em;color:#99F6E4;margin-bottom:6px}.final-cta h2{font-family:'Sora',sans-serif;font-size:clamp(1.55rem,2.4vw,2.45rem);line-height:1.08;letter-spacing:-.035em;color:#fff;margin:0 0 5px}.final-cta p{font-size:11px;line-height:1.5;color:#C0D6E4;margin:0;max-width:690px}.final-actions{display:flex;gap:8px;position:relative;z-index:1;flex-wrap:wrap}.final-primary,.final-secondary{border-radius:9px;padding:10px 14px;font-size:10px;font-weight:900;text-decoration:none;cursor:pointer;white-space:nowrap}.final-primary{border:1px solid #5EEAD4;background:#5EEAD4;color:#073126}.final-secondary{border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.045);color:#fff}
      @media(max-width:850px){.final-cta{grid-template-columns:1fr}.final-actions{justify-content:flex-start}}
      @media(max-width:600px){.final-cta-section{padding:24px 14px 38px}.final-cta{padding:26px 22px}.final-actions{display:grid;grid-template-columns:1fr 1fr}.final-primary,.final-secondary{text-align:center;padding:10px}}
    `}</style>

    <div className="final-cta"><div><div className="final-cta-kicker">READY WHEN YOU ARE</div><h2>Start with the health need you have today.</h2><p>Search first, learn first or create an account when you are ready to keep your healthcare journey connected.</p></div><div className="final-actions"><Link href="/doctors" className="final-secondary">Find Doctors</Link><Link href="/hospitals" className="final-secondary">Find Hospitals</Link><button onClick={openAccount} className="final-primary">{isAuthenticated?'Open Dashboard':'Sign Up Free'} →</button></div></div>
  </section>;
}
