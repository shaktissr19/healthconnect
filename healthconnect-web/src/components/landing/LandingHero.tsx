'use client';

import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

export default function LandingHero() {
  const { isAuthenticated, user } = useAuthStore();
  const { openAuthModal } = useUIStore();

  const explore = () => {
    if (typeof window === 'undefined') return;
    document.getElementById('platform-tour')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const accountAction = () => {
    if (isAuthenticated && user) {
      const role = String(user.role || '').toUpperCase();
      window.location.href = role === 'PATIENT'
        ? '/dashboard'
        : role === 'DOCTOR'
          ? '/doctor-dashboard'
          : role === 'HOSPITAL'
            ? '/hospital-dashboard'
            : '/admin-dashboard';
      return;
    }
    openAuthModal('register');
  };

  return (
    <section className="hc-photo-hero" aria-label="HealthConnect India">
      <style>{`
        .hc-photo-hero{
          padding-top:76px;
          background:#F8FBFC;
          font-family:'DM Sans',Arial,sans-serif;
          color:#0A1D35;
        }
        .hc-photo-hero-frame{
          position:relative;
          min-height:430px;
          overflow:hidden;
          border-top:1px solid #DCE9EC;
          border-bottom:1px solid #D7E6EA;
          background-color:#F4FAFB;
          background-image:
            linear-gradient(90deg,
              rgba(248,252,253,1) 0%,
              rgba(248,252,253,.99) 24%,
              rgba(248,252,253,.94) 34%,
              rgba(248,252,253,.68) 45%,
              rgba(248,252,253,.18) 60%,
              rgba(248,252,253,0) 74%),
            linear-gradient(180deg,rgba(255,255,255,.02),rgba(8,55,68,.06)),
            url('/images/hero-photo.png');
          background-size:cover;
          background-position:center right;
          box-shadow:0 16px 38px rgba(15,49,66,.08);
        }
        .hc-photo-hero-frame:after{
          content:'';
          position:absolute;
          inset:auto 0 0;
          height:88px;
          background:linear-gradient(180deg,rgba(248,251,252,0),rgba(248,251,252,.12));
          pointer-events:none;
        }
        .hc-photo-hero-inner{
          position:relative;
          z-index:2;
          width:min(1380px,100%);
          min-height:430px;
          margin:0 auto;
          display:flex;
          align-items:center;
          padding:52px 62px 48px;
        }
        .hc-photo-hero-copy{max-width:590px}
        .hc-photo-hero-kicker{
          display:flex;
          align-items:center;
          gap:10px;
          margin-bottom:14px;
          color:#0B8F7C;
          font-size:11px;
          font-weight:900;
          letter-spacing:.17em;
          text-transform:uppercase;
        }
        .hc-photo-hero-kicker:before{
          content:'';
          width:30px;
          height:2px;
          border-radius:2px;
          background:#19B9A7;
        }
        .hc-photo-hero-copy h1{
          margin:0 0 16px;
          max-width:570px;
          font-family:'Sora','DM Sans',sans-serif;
          font-size:clamp(3.15rem,5.05vw,5.25rem);
          line-height:.98;
          letter-spacing:-.058em;
          font-weight:850;
          color:#0A1D35;
        }
        .hc-photo-hero-copy p{
          margin:0;
          max-width:520px;
          color:#36566C;
          font-size:18px;
          line-height:1.58;
          font-weight:500;
        }
        .hc-photo-hero-actions{
          display:flex;
          align-items:center;
          gap:12px;
          flex-wrap:wrap;
          margin-top:24px;
        }
        .hc-photo-hero-btn{
          min-height:48px;
          border-radius:11px;
          padding:0 20px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:9px;
          font-family:inherit;
          font-size:13px;
          font-weight:900;
          cursor:pointer;
          transition:transform .16s ease,box-shadow .16s ease,background .16s ease;
        }
        .hc-photo-hero-btn:hover{transform:translateY(-1px)}
        .hc-photo-hero-primary{
          border:1px solid #0D9488;
          color:#fff;
          background:linear-gradient(135deg,#0B7F76,#18B7A6);
          box-shadow:0 10px 22px rgba(13,148,136,.22);
        }
        .hc-photo-hero-secondary{
          border:1px solid #BFCFD6;
          color:#0B2943;
          background:rgba(255,255,255,.82);
          backdrop-filter:blur(8px);
          box-shadow:0 8px 18px rgba(15,49,66,.07);
        }
        .hc-photo-hero-links{
          display:flex;
          align-items:center;
          gap:9px 18px;
          flex-wrap:wrap;
          margin-top:19px;
          color:#46667A;
          font-size:11.5px;
          font-weight:800;
        }
        .hc-photo-hero-links span{display:inline-flex;align-items:center;gap:6px}
        .hc-photo-hero-links span:before{
          content:'✓';
          display:grid;
          place-items:center;
          width:17px;
          height:17px;
          border-radius:50%;
          background:#DDF5EF;
          color:#087565;
          font-size:9px;
          font-weight:900;
        }
        .hc-photo-hero-caption{
          position:absolute;
          right:42px;
          bottom:24px;
          z-index:3;
          max-width:300px;
          padding:9px 12px;
          border:1px solid rgba(255,255,255,.58);
          border-radius:10px;
          background:rgba(7,40,56,.55);
          color:#F4FBFC;
          backdrop-filter:blur(8px);
          box-shadow:0 8px 20px rgba(0,0,0,.12);
          font-size:10px;
          line-height:1.45;
          font-weight:750;
        }
        .hc-photo-hero-caption strong{color:#76E5D6}

        @media(max-width:1000px){
          .hc-photo-hero-frame{
            min-height:470px;
            background-position:60% center;
            background-image:
              linear-gradient(90deg,rgba(248,252,253,1) 0%,rgba(248,252,253,.98) 34%,rgba(248,252,253,.82) 53%,rgba(248,252,253,.30) 74%,rgba(248,252,253,.08) 100%),
              linear-gradient(180deg,rgba(255,255,255,.04),rgba(8,55,68,.05)),
              url('/images/hero-photo.png');
          }
          .hc-photo-hero-inner{min-height:470px;padding:48px 34px}
          .hc-photo-hero-copy{max-width:540px}
          .hc-photo-hero-caption{display:none}
        }
        @media(max-width:720px){
          .hc-photo-hero{padding-top:70px}
          .hc-photo-hero-frame{
            min-height:600px;
            background-position:66% center;
            background-image:
              linear-gradient(180deg,rgba(248,252,253,.99) 0%,rgba(248,252,253,.95) 43%,rgba(248,252,253,.60) 68%,rgba(248,252,253,.18) 100%),
              url('/images/hero-photo.png');
          }
          .hc-photo-hero-inner{min-height:600px;align-items:flex-start;padding:46px 20px 210px}
          .hc-photo-hero-copy h1{font-size:clamp(2.75rem,12vw,4rem);max-width:500px}
          .hc-photo-hero-copy p{font-size:16px;max-width:470px}
        }
        @media(max-width:480px){
          .hc-photo-hero-inner{padding-left:16px;padding-right:16px}
          .hc-photo-hero-actions{align-items:stretch;flex-direction:column}
          .hc-photo-hero-btn{width:100%}
          .hc-photo-hero-links{gap:8px 12px}
        }
      `}</style>

      <div className="hc-photo-hero-frame">
        <div className="hc-photo-hero-inner">
          <div className="hc-photo-hero-copy">
            <div className="hc-photo-hero-kicker">India&apos;s connected healthcare platform</div>
            <h1>Healthcare that stays connected.</h1>
            <p>
              Find doctors and hospitals, organise your health journey, and stay supported through Health Communities — all through one HealthConnect experience.
            </p>

            <div className="hc-photo-hero-actions">
              <button className="hc-photo-hero-btn hc-photo-hero-primary" type="button" onClick={explore}>
                Explore Platform <span>→</span>
              </button>
              <button className="hc-photo-hero-btn hc-photo-hero-secondary" type="button" onClick={accountAction}>
                {isAuthenticated ? 'Open My Health' : 'Create Account'} <span>→</span>
              </button>
            </div>

            <div className="hc-photo-hero-links" aria-label="HealthConnect highlights">
              <span>Find care</span>
              <span>My Health</span>
              <span>Health Communities</span>
            </div>
          </div>
        </div>

        <div className="hc-photo-hero-caption">
          <strong>One connected journey:</strong> discovery, appointments, personal health context and support between visits.
        </div>
      </div>
    </section>
  );
}
