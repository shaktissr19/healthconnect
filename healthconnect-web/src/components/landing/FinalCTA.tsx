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
      .final-cta-section{background:#fff;padding:72px 28px 78px;font-family:'DM Sans',Arial,sans-serif}.final-cta{max-width:1280px;margin:0 auto;border-radius:24px;position:relative;overflow:hidden;background:linear-gradient(135deg,#082238 0%,#0B3D4A 52%,#0D766C 100%);padding:48px 52px;display:grid;grid-template-columns:1fr auto;gap:32px;align-items:center;box-shadow:0 18px 46px rgba(15,23,42,.14)}.final-cta:after{content:'';position:absolute;width:360px;height:360px;border-radius:50%;right:-130px;top:-170px;background:rgba(94,234,212,.11)}.final-cta-kicker{font-size:10px;font-weight:900;letter-spacing:.16em;color:#99F6E4;margin-bottom:9px}.final-cta h2{font-family:'Sora',sans-serif;font-size:clamp(2rem,3.1vw,3.45rem);line-height:1.06;letter-spacing:-.04em;color:#fff;margin:0 0 10px;max-width:760px}.final-cta p{font-size:14px;line-height:1.65;color:#C0D6E4;margin:0;max-width:720px}.final-actions{display:flex;gap:9px;position:relative;z-index:1;flex-wrap:wrap}.final-primary,.final-secondary{border-radius:10px;padding:12px 17px;font-size:11px;font-weight:900;text-decoration:none;cursor:pointer;white-space:nowrap}.final-primary{border:1px solid #5EEAD4;background:#5EEAD4;color:#073126}.final-secondary{border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.05);color:#fff}.final-primary:hover,.final-secondary:hover{transform:translateY(-1px)}
      @media(max-width:850px){.final-cta{grid-template-columns:1fr}.final-actions{justify-content:flex-start}}
      @media(max-width:600px){.final-cta-section{padding:52px 16px 58px}.final-cta{padding:32px 24px}.final-actions{display:grid;grid-template-columns:1fr 1fr}.final-primary,.final-secondary{text-align:center;padding:11px 10px}}
    `}</style>
    <div className="final-cta"><div><div className="final-cta-kicker">ONE PLATFORM · MULTIPLE WAYS TO START</div><h2>Start with the healthcare need you have today.</h2><p>Find a doctor, find a hospital, browse health communities or create your HealthConnect account so your future care journey has one place to come back to.</p></div><div className="final-actions"><Link href="/doctors" className="final-secondary">Find Doctors</Link><Link href="/hospitals" className="final-secondary">Find Hospitals</Link><button onClick={openAccount} className="final-primary">{isAuthenticated?'Open My Dashboard':'Create Free Account'} →</button></div></div>
  </section>;
}
