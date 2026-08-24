'use client';

import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

export default function LandingHero(){
  const {isAuthenticated,user}=useAuthStore();
  const {openAuthModal}=useUIStore();

  const go=(href:string)=>{ if(typeof window!=='undefined') window.location.href=href; };
  const explore=()=>document.getElementById('platform-tour')?.scrollIntoView({behavior:'smooth',block:'start'});
  const accountAction=()=>{
    if(isAuthenticated&&user){
      const role=String(user.role||'').toUpperCase();
      go(role==='PATIENT'?'/dashboard':role==='DOCTOR'?'/doctor-dashboard':role==='HOSPITAL'?'/hospital-dashboard':'/admin-dashboard');
      return;
    }
    openAuthModal('register');
  };

  return <section className="hc-editorial-hero" aria-label="HealthConnect India">
    <style>{`
      .hc-editorial-hero{padding-top:74px;background:#fff;color:#0B2540;font-family:'DM Sans',Arial,sans-serif}
      .hc-editorial-frame{position:relative;min-height:510px;overflow:hidden;background:#EEF8F8 url('/images/hero-photo.png') center right/cover no-repeat}
      .hc-editorial-frame:before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,#FAFDFC 0%,rgba(250,253,252,.99) 27%,rgba(250,253,252,.93) 39%,rgba(250,253,252,.60) 52%,rgba(250,253,252,.14) 69%,rgba(250,253,252,0) 82%)}
      .hc-editorial-frame:after{content:'';position:absolute;inset:auto 0 0;height:80px;background:linear-gradient(180deg,rgba(255,255,255,0),rgba(9,69,77,.05));pointer-events:none}
      .hc-editorial-inner{position:relative;z-index:2;max-width:1480px;min-height:510px;margin:0 auto;padding:64px 66px 58px;display:flex;align-items:center}
      .hc-editorial-copy{width:min(600px,49vw)}
      .hc-editorial-kicker{display:inline-flex;align-items:center;gap:9px;margin-bottom:16px;color:#0D8D80;font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}
      .hc-editorial-kicker:before{content:'';width:28px;height:2px;background:#14B8A6;border-radius:2px}
      .hc-editorial-copy h1{margin:0 0 18px;font-family:'Sora','DM Sans',sans-serif;font-size:clamp(3.65rem,5.5vw,5.8rem);line-height:.98;letter-spacing:-.058em;font-weight:880;color:#0A2B58;max-width:660px}
      .hc-editorial-copy p{margin:0;max-width:535px;font-size:18px;line-height:1.6;color:#284A63;font-weight:520}
      .hc-editorial-actions{display:flex;gap:13px;flex-wrap:wrap;margin-top:28px}
      .hc-editorial-btn{min-height:49px;padding:0 21px;border-radius:10px;font:850 13px 'DM Sans',Arial,sans-serif;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:11px;transition:transform .16s,box-shadow .16s,background .16s}
      .hc-editorial-btn:hover{transform:translateY(-1px)}
      .hc-editorial-primary{border:1px solid #0D9488;background:linear-gradient(135deg,#0F766E,#14B8A6);color:#fff;box-shadow:0 9px 22px rgba(13,148,136,.21)}
      .hc-editorial-secondary{border:1px solid #BFD5D8;background:rgba(255,255,255,.94);color:#123250;box-shadow:0 5px 16px rgba(15,49,66,.05)}
      .hc-editorial-secondary:hover{background:#fff;border-color:#93C8C0}
      .hc-editorial-cues{display:flex;gap:28px;flex-wrap:wrap;margin-top:28px}
      .hc-editorial-cue{display:flex;gap:9px;align-items:center;color:#36566C;font-size:10.5px;font-weight:750}
      .hc-editorial-cue span{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:rgba(232,248,245,.94);border:1px solid #CBEAE4;color:#0D9488;font-size:14px;font-weight:900}
      @media(max-width:1100px){.hc-editorial-frame{min-height:500px;background-position:62% center}.hc-editorial-frame:before{background:linear-gradient(90deg,#FAFDFC 0%,rgba(250,253,252,.98) 38%,rgba(250,253,252,.72) 62%,rgba(250,253,252,.15) 100%)}.hc-editorial-inner{min-height:500px;padding:56px 34px}.hc-editorial-copy{width:min(570px,62vw)}}
      @media(max-width:720px){.hc-editorial-frame{min-height:660px;background-position:64% bottom}.hc-editorial-frame:before{background:linear-gradient(180deg,#FAFDFC 0%,rgba(250,253,252,.985) 46%,rgba(250,253,252,.74) 68%,rgba(250,253,252,.16) 100%)}.hc-editorial-inner{min-height:660px;align-items:flex-start;padding:48px 20px 235px}.hc-editorial-copy{width:100%;max-width:560px}.hc-editorial-copy h1{font-size:clamp(3rem,13vw,4.5rem)}.hc-editorial-copy p{font-size:16px}.hc-editorial-cues{gap:16px;margin-top:21px}}
      @media(max-width:480px){.hc-editorial-actions{flex-direction:column}.hc-editorial-btn{width:100%}}
    `}</style>
    <div className="hc-editorial-frame">
      <div className="hc-editorial-inner">
        <div className="hc-editorial-copy">
          <div className="hc-editorial-kicker">India&apos;s unified healthcare platform</div>
          <h1>Your healthcare. Connected around you.</h1>
          <p>Find doctors and hospitals, keep important health information organised, and stay connected between visits through one HealthConnect journey.</p>
          <div className="hc-editorial-actions">
            <button type="button" className="hc-editorial-btn hc-editorial-primary" onClick={explore}>Explore HealthConnect <span>→</span></button>
            <button type="button" className="hc-editorial-btn hc-editorial-secondary" onClick={()=>go('/doctors')}>Find a Doctor <span>→</span></button>
          </div>
          <div className="hc-editorial-cues" aria-label="HealthConnect platform principles">
            <div className="hc-editorial-cue"><span>✓</span>Private authenticated health workspace</div>
            <div className="hc-editorial-cue"><span>⌂</span>Built around Indian care journeys</div>
          </div>
        </div>
      </div>
    </div>
  </section>;
}
