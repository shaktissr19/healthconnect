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
      .continuity-panel{max-width:1280px;min-height:470px;margin:0 auto 28px;border-radius:26px;overflow:hidden;position:relative;border:1px solid #D3E2E8;box-shadow:0 14px 34px rgba(15,23,42,.06);display:grid;grid-template-columns:minmax(0,1.03fr) minmax(380px,.97fr);align-items:center;gap:54px;padding:58px 64px}
      .continuity-panel.community{background:linear-gradient(115deg,#F8FCFB 0%,#EDF8F4 55%,#E7F4F1 100%)}
      .continuity-panel.health{background:linear-gradient(115deg,#F8FBFE 0%,#EDF4FB 54%,#E8F1F8 100%)}
      .continuity-panel:before{content:'';position:absolute;width:430px;height:430px;border-radius:50%;right:-120px;top:-150px;opacity:.68;pointer-events:none}
      .continuity-panel.community:before{background:radial-gradient(circle,#BDEEE0 0%,rgba(189,238,224,.2) 62%,transparent 72%)}
      .continuity-panel.health:before{background:radial-gradient(circle,#C9E2FB 0%,rgba(201,226,251,.2) 62%,transparent 72%)}
      .continuity-copy,.continuity-visual{position:relative;z-index:1}
      .continuity-kicker{font-size:12px;font-weight:900;letter-spacing:.18em;margin-bottom:14px}
      .community .continuity-kicker{color:#0E8D73}.health .continuity-kicker{color:#2563EB}
      .continuity-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.65rem,4vw,4.35rem);line-height:1.01;letter-spacing:-.05em;color:#10233C;margin:0 0 18px;max-width:720px}
      .continuity-body{font-size:18px;line-height:1.62;color:#405A70;max-width:690px;margin:0 0 28px}
      .continuity-actions{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.continuity-primary,.continuity-secondary{border-radius:12px;padding:14px 20px;font-size:15px;font-weight:900;text-decoration:none;font-family:inherit;cursor:pointer}.continuity-primary{color:#fff;border:0}.community .continuity-primary{background:#0F9F84}.health .continuity-primary{background:#2879D7}.continuity-secondary{background:#fff;border:1px solid #BFD0DB;color:#17324A}
      .continuity-note{margin-top:18px;font-size:13.5px;color:#587084;font-weight:700}
      .continuity-visual{min-height:310px;display:flex;flex-direction:column;justify-content:center;padding-left:20px}
      .continuity-visual:before{content:'';position:absolute;inset:8% 3% 8% 8%;border-radius:50%;opacity:.72;z-index:-1}.community .continuity-visual:before{background:radial-gradient(circle,#DDF5EC 0%,rgba(221,245,236,.35) 54%,transparent 72%)}.health .continuity-visual:before{background:radial-gradient(circle,#DFECFA 0%,rgba(223,236,250,.35) 54%,transparent 72%)}
      .visual-eyebrow{font-size:12px;font-weight:900;letter-spacing:.14em;color:#547088;margin-bottom:12px}
      .visual-headline{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,3vw,3.25rem);line-height:1.06;letter-spacing:-.04em;color:#10233C;margin:0 0 22px;max-width:520px}
      .visual-line{height:1px;background:#C7D8E2;margin:3px 0 18px;max-width:520px}
      .visual-steps{display:flex;gap:0;align-items:flex-start;max-width:560px}.visual-step{flex:1;min-width:0;padding-right:18px;position:relative}.visual-step:not(:last-child):after{content:'→';position:absolute;right:4px;top:3px;color:#8298AA;font-weight:800}.visual-step b{display:block;font-family:'Sora',sans-serif;font-size:15px;color:#17324A;margin-bottom:5px}.visual-step span{display:block;font-size:12.5px;line-height:1.45;color:#5C7387}.visual-tags{display:flex;gap:10px;flex-wrap:wrap;margin-top:4px}.visual-tag{font-size:13px;font-weight:850;color:#145D50;padding:9px 0;border-bottom:2px solid #8DD8C7}.health .visual-tag{color:#245F9C;border-bottom-color:#A7CBEF}
      .visual-quote{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.15rem,3.4vw,3.7rem);line-height:1.03;letter-spacing:-.045em;color:#0F3F39;margin:0 0 18px;max-width:530px}.health .visual-quote{color:#153E6B}.visual-sub{font-size:15px;line-height:1.55;color:#567084;max-width:520px;margin:0}
      @media(max-width:960px){.continuity-panel{grid-template-columns:1fr;gap:28px;padding:48px 38px}.continuity-visual{padding-left:0;min-height:0}.continuity-panel{min-height:0}.continuity-title{max-width:820px}}
      @media(max-width:640px){.continuity-wrap{padding:24px 12px 32px}.continuity-panel{padding:34px 22px;border-radius:20px;margin-bottom:18px}.continuity-title{font-size:2.45rem}.continuity-body{font-size:16px}.visual-headline,.visual-quote{font-size:2.1rem}.visual-steps{display:grid;grid-template-columns:1fr 1fr;gap:18px}.visual-step:not(:last-child):after{display:none}.continuity-primary,.continuity-secondary{font-size:14px;padding:12px 16px}}
    `}</style>

    <section className="continuity-panel community" id="health-communities-story">
      <div className="continuity-copy">
        <div className="continuity-kicker">HEALTH COMMUNITIES · HEALTHCONNECT USP</div>
        <h2 className="continuity-title">Support should not stop when the appointment ends.</h2>
        <p className="continuity-body">Join condition-focused communities where people can ask, share and learn between visits — with moderation, reporting and anonymous participation where a community allows it.</p>
        <div className="continuity-actions">
          <Link href="/communities" className="continuity-primary">Explore Health Communities →</Link>
          <button className="continuity-secondary" onClick={()=>openAuthModal('login')}>Sign In</button>
        </div>
        <div className="continuity-note">Built for ongoing peer support, not an open social feed.</div>
      </div>
      <div className="continuity-visual">
        <div className="visual-eyebrow">BETWEEN APPOINTMENTS</div>
        <h3 className="visual-quote">You are not alone in your health journey.</h3>
        <p className="visual-sub">Find people living through similar questions, learn from shared experience and return to your next consultation feeling better prepared.</p>
        <div className="visual-line"/>
        <div className="visual-tags"><span className="visual-tag">Condition-focused</span><span className="visual-tag">Moderated</span><span className="visual-tag">Anonymous where enabled</span></div>
      </div>
    </section>

    <section className="continuity-panel health" id="my-health-story">
      <div className="continuity-copy">
        <div className="continuity-kicker">MY HEALTH · YOUR MEDICAL JOURNEY</div>
        <h2 className="continuity-title">Your health history should travel with you.</h2>
        <p className="continuity-body">Keep reports, prescriptions, symptoms, vitals, medicines and appointments connected to one patient account so you can return to care with more of your own context already organised.</p>
        <div className="continuity-actions">
          <button className="continuity-primary" onClick={openMyHealth}>Open My Health →</button>
          <button className="continuity-secondary" onClick={()=>openAuthModal('login')}>Sign In</button>
        </div>
        <div className="continuity-note">Private health information remains behind authenticated access.</div>
      </div>
      <div className="continuity-visual">
        <div className="visual-eyebrow">ONE CONTINUOUS HEALTH JOURNEY</div>
        <h3 className="visual-headline">Bring the information that matters into the next visit.</h3>
        <div className="visual-line"/>
        <div className="visual-steps">
          <div className="visual-step"><b>Medical history</b><span>Conditions, past care and clinical context</span></div>
          <div className="visual-step"><b>Reports</b><span>Prescriptions, scans and health records</span></div>
          <div className="visual-step"><b>Vitals & medicines</b><span>Track what changes between consultations</span></div>
          <div className="visual-step"><b>Follow-up</b><span>Appointments and ongoing care in one place</span></div>
        </div>
      </div>
    </section>
  </div>;
}
