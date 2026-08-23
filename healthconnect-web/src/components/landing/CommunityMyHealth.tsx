'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

export default function CommunityMyHealth(){
  const {user,isAuthenticated}=useAuthStore();
  const {openAuthModal}=useUIStore();
  const router=useRouter();

  const openMyHealth=()=>{
    if(!isAuthenticated||!user){
      try{sessionStorage.setItem('hc_post_login_redirect','/dashboard');}catch{}
      openAuthModal('login');
      return;
    }
    const role=String(user.role??'').toUpperCase();
    router.push(role==='PATIENT'?'/dashboard':role==='DOCTOR'?'/doctor-dashboard':role==='HOSPITAL'?'/hospital-dashboard':'/admin-dashboard');
  };

  return <div className="continuity-wrap">
    <style>{`
      .continuity-wrap{font-family:'DM Sans',Arial,sans-serif;background:#F7FAFC;padding:34px 28px 42px}
      .continuity-panel{max-width:1280px;min-height:440px;margin:0 auto 28px;border-radius:26px;overflow:hidden;position:relative;border:1px solid #D3E2E8;box-shadow:0 14px 34px rgba(15,23,42,.06);display:grid;grid-template-columns:minmax(0,1.03fr) minmax(380px,.97fr);align-items:center;gap:62px;padding:54px 64px}
      .continuity-panel.community{background:linear-gradient(115deg,#F8FCFB 0%,#EDF8F4 55%,#E7F4F1 100%)}
      .continuity-panel.health{background:linear-gradient(115deg,#F8FBFE 0%,#EDF4FB 54%,#E8F1F8 100%)}
      .continuity-panel:before{content:'';position:absolute;width:430px;height:430px;border-radius:50%;right:-120px;top:-150px;opacity:.68;pointer-events:none}
      .continuity-panel.community:before{background:radial-gradient(circle,#BDEEE0 0%,rgba(189,238,224,.2) 62%,transparent 72%)}
      .continuity-panel.health:before{background:radial-gradient(circle,#C9E2FB 0%,rgba(201,226,251,.2) 62%,transparent 72%)}
      .continuity-copy,.continuity-visual{position:relative;z-index:1}
      .continuity-kicker{font-size:12px;font-weight:900;letter-spacing:.18em;margin-bottom:14px}
      .community .continuity-kicker{color:#0E8D73}.health .continuity-kicker{color:#2563EB}
      .continuity-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.65rem,4vw,4.2rem);line-height:1.01;letter-spacing:-.05em;color:#10233C;margin:0 0 18px;max-width:720px}
      .continuity-body{font-size:16.5px;line-height:1.58;color:#405A70;max-width:670px;margin:0 0 24px}
      .continuity-actions{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.continuity-primary{border-radius:12px;padding:14px 20px;font-size:15px;font-weight:900;text-decoration:none;font-family:inherit;cursor:pointer;color:#fff;border:0;box-shadow:0 7px 18px rgba(15,23,42,.08)}.community .continuity-primary{background:#0F9F84}.health .continuity-primary{background:#2879D7}
      .continuity-note{margin-top:16px;font-size:12.5px;color:#607487;font-weight:700}
      .continuity-visual{min-height:280px;display:flex;flex-direction:column;justify-content:center;padding-left:20px}
      .continuity-visual:before{content:'';position:absolute;inset:8% 3% 8% 8%;border-radius:50%;opacity:.72;z-index:-1}.community .continuity-visual:before{background:radial-gradient(circle,#DDF5EC 0%,rgba(221,245,236,.35) 54%,transparent 72%)}.health .continuity-visual:before{background:radial-gradient(circle,#DFECFA 0%,rgba(223,236,250,.35) 54%,transparent 72%)}
      .visual-eyebrow{font-size:11.5px;font-weight:900;letter-spacing:.14em;color:#547088;margin-bottom:11px}
      .visual-headline{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.9rem,2.85vw,3rem);line-height:1.06;letter-spacing:-.04em;color:#10233C;margin:0 0 19px;max-width:510px}
      .visual-line{height:1px;background:#C7D8E2;margin:2px 0 16px;max-width:520px}
      .visual-steps{display:flex;gap:0;align-items:flex-start;max-width:560px}.visual-step{flex:1;min-width:0;padding-right:18px;position:relative}.visual-step:not(:last-child):after{content:'→';position:absolute;right:4px;top:3px;color:#8298AA;font-weight:800}.visual-step b{display:block;font-family:'Sora',sans-serif;font-size:14px;color:#17324A;margin-bottom:4px}.visual-step span{display:block;font-size:11.5px;line-height:1.42;color:#5C7387}.visual-tags{display:flex;gap:10px;flex-wrap:wrap;margin-top:3px}.visual-tag{font-size:12px;font-weight:850;color:#145D50;padding:8px 0;border-bottom:2px solid #8DD8C7}.health .visual-tag{color:#245F9C;border-bottom-color:#A7CBEF}
      .visual-quote{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,3.15vw,3.4rem);line-height:1.03;letter-spacing:-.045em;color:#0F3F39;margin:0 0 16px;max-width:530px}.health .visual-quote{color:#153E6B}.visual-sub{font-size:14px;line-height:1.52;color:#567084;max-width:510px;margin:0}
      @media(max-width:960px){.continuity-panel{grid-template-columns:1fr;gap:28px;padding:48px 38px}.continuity-visual{padding-left:0;min-height:0}.continuity-panel{min-height:0}.continuity-title{max-width:820px}}
      @media(max-width:640px){.continuity-wrap{padding:24px 12px 32px}.continuity-panel{padding:34px 22px;border-radius:20px;margin-bottom:18px}.continuity-title{font-size:2.45rem}.continuity-body{font-size:15px}.visual-headline,.visual-quote{font-size:2rem}.visual-steps{display:grid;grid-template-columns:1fr 1fr;gap:18px}.visual-step:not(:last-child):after{display:none}.continuity-primary{font-size:14px;padding:12px 16px}}
    `}</style>

    <section className="continuity-panel community" id="health-communities-story">
      <div className="continuity-copy">
        <div className="continuity-kicker">HEALTH COMMUNITIES · HEALTHCONNECT USP</div>
        <h2 className="continuity-title">Support should not stop when the appointment ends.</h2>
        <p className="continuity-body">Join condition-focused communities to ask, share and learn between visits — with moderation and anonymous participation where enabled.</p>
        <div className="continuity-actions">
          <Link href="/communities" className="continuity-primary">Explore Health Communities →</Link>
        </div>
        <div className="continuity-note">Peer support between appointments — not an open social feed.</div>
      </div>
      <div className="continuity-visual">
        <div className="visual-eyebrow">BETWEEN APPOINTMENTS</div>
        <h3 className="visual-quote">You are not alone in your health journey.</h3>
        <p className="visual-sub">Learn from people facing similar health questions and return to care better prepared.</p>
        <div className="visual-line"/>
        <div className="visual-tags"><span className="visual-tag">Condition-focused</span><span className="visual-tag">Moderated</span><span className="visual-tag">Anonymous where enabled</span></div>
      </div>
    </section>

    <section className="continuity-panel health" id="my-health-story">
      <div className="continuity-copy">
        <div className="continuity-kicker">MY HEALTH · YOUR MEDICAL JOURNEY</div>
        <h2 className="continuity-title">Your health history should travel with you.</h2>
        <p className="continuity-body">Keep reports, prescriptions, vitals, medicines and appointments in one patient account, ready when you return to care.</p>
        <div className="continuity-actions">
          <button className="continuity-primary" onClick={openMyHealth}>Open My Health →</button>
        </div>
        <div className="continuity-note">Private health information stays behind authenticated access.</div>
      </div>
      <div className="continuity-visual">
        <div className="visual-eyebrow">ONE CONTINUOUS HEALTH JOURNEY</div>
        <h3 className="visual-headline">Bring the right information into the next visit.</h3>
        <div className="visual-line"/>
        <div className="visual-steps">
          <div className="visual-step"><b>Medical history</b><span>Conditions and past care</span></div>
          <div className="visual-step"><b>Reports</b><span>Prescriptions, scans and records</span></div>
          <div className="visual-step"><b>Vitals & medicines</b><span>Track changes between visits</span></div>
          <div className="visual-step"><b>Follow-up</b><span>Appointments and ongoing care</span></div>
        </div>
      </div>
    </section>
  </div>;
}
