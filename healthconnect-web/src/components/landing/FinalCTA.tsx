'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useRouter } from 'next/navigation';

export default function FinalCTA(){
  const {isAuthenticated,user}=useAuthStore();
  const {openAuthModal}=useUIStore();
  const router=useRouter();

  const openAccount=()=>{
    if(!isAuthenticated||!user){try{sessionStorage.setItem('hc_signup_role','PATIENT')}catch{};openAuthModal('register');return;}
    const role=String(user.role??'').toUpperCase();
    router.push(role==='DOCTOR'?'/doctor-dashboard':role==='HOSPITAL'?'/hospital-dashboard':role==='ADMIN'?'/admin-dashboard':'/dashboard');
  };

  return <section className="final-photo-section">
    <style>{`
      .final-photo-section{background:#E9E5DE;padding:52px 22px 46px;font-family:'DM Sans',Arial,sans-serif;border-top:1px solid #DAD4CA}.final-photo{max-width:1340px;min-height:330px;margin:0 auto;border-radius:24px;position:relative;overflow:hidden;background:#073B43;box-shadow:0 18px 42px rgba(15,48,61,.15)}.final-photo-image{position:absolute;inset:0 0 0 46%;background:url('/images/hero-photo.png') center/cover no-repeat}.final-photo:before{content:'';position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,#073B43 0%,#07505A 42%,rgba(7,80,90,.94) 51%,rgba(7,80,90,.38) 70%,rgba(7,80,90,.02) 100%)}.final-photo-copy{position:relative;z-index:2;width:min(630px,58%);padding:50px 46px}.final-photo-kicker{font-size:12.5px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#99F6E4;margin-bottom:10px}.final-photo h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.2rem,3.05vw,3.3rem);line-height:1.04;letter-spacing:-.045em;color:#fff;margin:0 0 12px}.final-photo p{font-size:15.5px;line-height:1.56;color:#D7E9EB;margin:0;max-width:555px}.final-photo-actions{display:flex;gap:11px;flex-wrap:wrap;margin-top:22px}.final-photo-primary,.final-photo-secondary{border-radius:10px;padding:12px 17px;font-size:13px;font-weight:900;text-decoration:none;cursor:pointer;white-space:nowrap}.final-photo-primary{border:1px solid #5EEAD4;background:#5EEAD4;color:#073126}.final-photo-secondary{border:1px solid rgba(255,255,255,.44);background:rgba(255,255,255,.08);color:#fff;backdrop-filter:blur(6px)}.final-photo-primary:focus-visible,.final-photo-secondary:focus-visible{outline:3px solid rgba(153,246,228,.58);outline-offset:3px}
      @media(max-width:850px){.final-photo-image{inset:0;background-position:67% center}.final-photo:before{background:linear-gradient(90deg,#073B43 0%,rgba(7,59,67,.97) 49%,rgba(7,59,67,.58) 79%,rgba(7,59,67,.18) 100%)}.final-photo-copy{width:min(650px,78%);padding:46px 34px}}
      @media(max-width:600px){.final-photo-section{padding:42px 12px 34px}.final-photo{min-height:470px}.final-photo-image{background-position:60% bottom}.final-photo:before{background:linear-gradient(180deg,#073B43 0%,rgba(7,59,67,.98) 58%,rgba(7,59,67,.58) 82%,rgba(7,59,67,.18) 100%)}.final-photo-copy{width:100%;padding:36px 22px 200px}.final-photo-actions{display:grid;grid-template-columns:1fr 1fr}.final-photo-primary,.final-photo-secondary{text-align:center}}
    `}</style>
    <div className="final-photo"><div className="final-photo-image"/><div className="final-photo-copy"><div className="final-photo-kicker">Better connection. Better continuity.</div><h2>Better care starts with better connection.</h2><p>Start with the health need you have today. Find care, learn, or create your HealthConnect account when you are ready to keep the journey connected.</p><div className="final-photo-actions"><Link href="/doctors" className="final-photo-secondary">Find a Doctor →</Link><button onClick={openAccount} className="final-photo-primary">{isAuthenticated?'Open Dashboard':'Create Account'} →</button></div></div></div>
  </section>;
}
