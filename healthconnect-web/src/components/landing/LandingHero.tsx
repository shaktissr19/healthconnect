'use client';

import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

export default function LandingHero(){
  const {isAuthenticated,user}=useAuthStore();
  const {openAuthModal}=useUIStore();

  const explore=()=>document.getElementById('platform-tour')?.scrollIntoView({behavior:'smooth',block:'start'});
  const go=(href:string)=>{if(typeof window!=='undefined')window.location.href=href};
  const accountAction=()=>{
    if(isAuthenticated&&user){
      const role=String(user.role||'').toUpperCase();
      go(role==='PATIENT'?'/dashboard':role==='DOCTOR'?'/doctor-dashboard':role==='HOSPITAL'?'/hospital-dashboard':'/admin-dashboard');
      return;
    }
    openAuthModal('register');
  };

  return <section className="hc-premium-hero" aria-label="HealthConnect India">
    <style>{`
      .hc-premium-hero{padding-top:74px;background:#F4FAF8;font-family:'DM Sans',Arial,sans-serif;color:#092A32}
      .hc-hero-shell{max-width:1480px;margin:0 auto;min-height:500px;display:grid;grid-template-columns:minmax(430px,.9fr) minmax(560px,1.1fr);background:#F4FAF8;overflow:hidden}
      .hc-hero-copy{padding:72px 54px 64px 66px;display:flex;flex-direction:column;justify-content:center;background:linear-gradient(135deg,#F7FCFA 0%,#EAF7F3 100%)}
      .hc-hero-eyebrow{display:flex;align-items:center;gap:10px;font-size:11px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#087F70;margin-bottom:18px}.hc-hero-eyebrow:before{content:'';width:34px;height:2px;background:#0D9488}
      .hc-hero-copy h1{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(3.15rem,4.8vw,5.15rem);line-height:.98;letter-spacing:-.055em;margin:0 0 20px;color:#0A315B;max-width:650px}
      .hc-hero-copy p{font-size:18px;line-height:1.55;color:#35566B;max-width:575px;margin:0}
      .hc-hero-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}.hc-hero-btn{min-height:48px;border-radius:9px;padding:0 20px;font:850 13px 'DM Sans',Arial,sans-serif;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:12px;transition:.16s}.hc-hero-btn:hover{transform:translateY(-1px)}.hc-hero-primary{border:1px solid #0B7B6E;background:#0B7B6E;color:#fff;box-shadow:0 8px 20px rgba(11,123,110,.18)}.hc-hero-secondary{border:1px solid #B8D0CF;background:#fff;color:#0A315B}
      .hc-hero-trust{display:flex;gap:22px;flex-wrap:wrap;margin-top:28px;color:#476878;font-size:10px;font-weight:750}.hc-hero-trust span{display:flex;gap:7px;align-items:center}.hc-hero-trust i{width:19px;height:19px;border-radius:50%;display:grid;place-items:center;background:#DDF5EE;color:#0B7B6E;font-style:normal;font-size:10px}
      .hc-hero-photo{position:relative;min-height:500px;background:#E6F2F0;overflow:hidden}.hc-hero-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:56% center;display:block}.hc-hero-photo:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(244,250,248,.35),transparent 18%);pointer-events:none}
      .hc-hero-photo-note{position:absolute;left:28px;bottom:26px;z-index:2;background:rgba(255,255,255,.93);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.8);border-radius:12px;padding:10px 13px;color:#184958;box-shadow:0 10px 26px rgba(13,67,72,.12)}.hc-hero-photo-note strong{display:block;font-size:11px}.hc-hero-photo-note span{display:block;font-size:9px;color:#64808B;margin-top:2px}
      @media(max-width:1050px){.hc-hero-shell{grid-template-columns:1fr}.hc-hero-copy{padding:58px 36px 48px}.hc-hero-copy h1{font-size:4.15rem}.hc-hero-photo{min-height:390px}.hc-hero-photo img{object-position:center 42%}}
      @media(max-width:650px){.hc-premium-hero{padding-top:74px}.hc-hero-copy{padding:44px 20px 38px}.hc-hero-copy h1{font-size:3.25rem}.hc-hero-copy p{font-size:15.5px}.hc-hero-actions{display:grid;grid-template-columns:1fr 1fr}.hc-hero-btn{padding:0 13px}.hc-hero-trust{gap:12px}.hc-hero-photo{min-height:320px}.hc-hero-photo-note{left:18px;bottom:18px}}
      @media(max-width:430px){.hc-hero-actions{grid-template-columns:1fr}}
    `}</style>
    <div className="hc-hero-shell">
      <div className="hc-hero-copy">
        <div className="hc-hero-eyebrow">India&apos;s unified healthcare platform</div>
        <h1>Better care.<br/>Connected.</h1>
        <p>Find doctors and hospitals, keep important health information organised, and stay supported between visits through one connected HealthConnect journey.</p>
        <div className="hc-hero-actions">
          <button type="button" className="hc-hero-btn hc-hero-primary" onClick={explore}>Explore HealthConnect <span>→</span></button>
          <button type="button" className="hc-hero-btn hc-hero-secondary" onClick={()=>go('/doctors')}>Find a Doctor <span>→</span></button>
        </div>
        <div className="hc-hero-trust"><span><i>✓</i>Private health workspace</span><span><i>✓</i>Built for Indian care journeys</span><span><i>✓</i>Connected patient & provider flows</span></div>
      </div>
      <div className="hc-hero-photo" aria-label="Indian healthcare professional supporting a patient"><img src="/images/hero-photo.png" alt="Indian healthcare professional supporting a patient"/><div className="hc-hero-photo-note"><strong>Care with context</strong><span>Discovery, health information and follow-up connected.</span></div></div>
    </div>
  </section>;
}
