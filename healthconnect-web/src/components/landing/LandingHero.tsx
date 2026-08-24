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
          min-height:540px;
          overflow:hidden;
          background-color:#F4FAFB;
          background-image:
            linear-gradient(90deg,
              rgba(248,252,253,1) 0%,
              rgba(248,252,253,.995) 24%,
              rgba(248,252,253,.96) 35%,
              rgba(248,252,253,.72) 46%,
              rgba(248,252,253,.23) 61%,
              rgba(248,252,253,0) 76%),
            linear-gradient(180deg,rgba(255,255,255,.02),rgba(8,55,68,.045)),
            url('/images/hero-photo.png');
          background-size:cover;
          background-position:center right;
          border-bottom:1px solid #DDEBED;
        }
        .hc-photo-hero-frame:after{
          content:'';
          position:absolute;
          inset:auto 0 0;
          height:86px;
          background:linear-gradient(180deg,rgba(248,251,252,0),rgba(248,251,252,.18));
          pointer-events:none;
        }
        .hc-photo-hero-inner{
          position:relative;
          z-index:2;
          width:min(1380px,100%);
          min-height:540px;
          margin:0 auto;
          display:flex;
          align-items:center;
          padding:64px 62px 60px;
        }
        .hc-photo-hero-copy{max-width:610px}
        .hc-photo-hero-kicker{
          display:flex;
          align-items:center;
          gap:10px;
          margin-bottom:16px;
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
          margin:0 0 20px;
          max-width:600px;
          font-family:'Sora','DM Sans',sans-serif;
          font-size:clamp(3.2rem,5.15vw,5.45rem);
          line-height:.99;
          letter-spacing:-.058em;
          font-weight:850;
          color:#0A1D35;
        }
        .hc-photo-hero-copy p{
          margin:0;
          max-width:545px;
          color:#36566C;
          font-size:18px;
          line-height:1.62;
          font-weight:500;
        }
        .hc-photo-hero-actions{
          display:flex;
          align-items:center;
          gap:12px;
          flex-wrap:wrap;
          margin-top:28px;
        }
        .hc-photo-hero-btn{
          min-height:50px;
          border-radius:11px;
          padding:0 21px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:9px;
          font-family:inherit;
          font-size:13px;
          font-weight:900;
          cursor:pointer;
          transition:transform .16s ease,box-shadow .16s ease,background .16s ease,border-color .16s ease;
        }
        .hc-photo-hero-btn:hover{transform:translateY(-1px)}
        .hc-photo-hero-btn:focus-visible{outline:3px solid rgba(13,148,136,.24);outline-offset:3px}
        .hc-photo-hero-primary{
          border:1px solid #0D9488;
          color:#fff;
          background:linear-gradient(135deg,#0B7F76,#18B7A6);
          box-shadow:0 10px 22px rgba(13,148,136,.20);
        }
        .hc-photo-hero-primary:hover{box-shadow:0 13px 28px rgba(13,148,136,.25)}
        .hc-photo-hero-secondary{
          border:1px solid #BFCFD6;
          color:#0B2943;
          background:rgba(255,255,255,.88);
          backdrop-filter:blur(8px);
          box-shadow:0 8px 18px rgba(15,49,66,.06);
        }
        .hc-photo-hero-secondary:hover{background:#fff;border-color:#AFC4CC}

        @media(max-width:1000px){
          .hc-photo-hero-frame{
            min-height:510px;
            background-position:60% center;
            background-image:
              linear-gradient(90deg,rgba(248,252,253,1) 0%,rgba(248,252,253,.99) 35%,rgba(248,252,253,.84) 54%,rgba(248,252,253,.34) 76%,rgba(248,252,253,.08) 100%),
              linear-gradient(180deg,rgba(255,255,255,.04),rgba(8,55,68,.04)),
              url('/images/hero-photo.png');
          }
          .hc-photo-hero-inner{min-height:510px;padding:54px 34px}
          .hc-photo-hero-copy{max-width:550px}
        }
        @media(max-width:720px){
          .hc-photo-hero{padding-top:70px}
          .hc-photo-hero-frame{
            min-height:630px;
            background-position:66% center;
            background-image:
              linear-gradient(180deg,rgba(248,252,253,.995) 0%,rgba(248,252,253,.97) 43%,rgba(248,252,253,.64) 69%,rgba(248,252,253,.18) 100%),
              url('/images/hero-photo.png');
          }
          .hc-photo-hero-inner{min-height:630px;align-items:flex-start;padding:48px 20px 220px}
          .hc-photo-hero-copy h1{font-size:clamp(2.8rem,12vw,4rem);max-width:510px}
          .hc-photo-hero-copy p{font-size:16px;max-width:480px}
        }
        @media(max-width:480px){
          .hc-photo-hero-inner{padding-left:16px;padding-right:16px}
          .hc-photo-hero-actions{align-items:stretch;flex-direction:column}
          .hc-photo-hero-btn{width:100%}
        }
      `}</style>

      <div className="hc-photo-hero-frame">
        <div className="hc-photo-hero-inner">
          <div className="hc-photo-hero-copy">
            <div className="hc-photo-hero-kicker">India&apos;s unified healthcare platform</div>
            <h1>Your healthcare. Connected around you.</h1>
            <p>
              Find doctors and hospitals, manage your health records, book appointments and stay supported between visits through one connected HealthConnect experience.
            </p>

            <div className="hc-photo-hero-actions">
              <button className="hc-photo-hero-btn hc-photo-hero-primary" type="button" onClick={explore}>
                Explore HealthConnect <span>→</span>
              </button>
              <button className="hc-photo-hero-btn hc-photo-hero-secondary" type="button" onClick={accountAction}>
                {isAuthenticated ? 'Open Workspace' : 'Sign Up'} <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
