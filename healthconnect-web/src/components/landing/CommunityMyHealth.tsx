'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import communityApiV2 from '@/lib/communityApiV2';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const HEALTH_ITEMS = [
  ['Medical History','Conditions, past care and longitudinal context'],
  ['Reports & Prescriptions','Keep documents available for future visits'],
  ['Vitals & Symptoms','Track what changes between consultations'],
  ['Medicines & Appointments','Keep treatment and visit history connected'],
] as const;

export default function CommunityMyHealth(){
  const [communities,setCommunities] = useState<any[]>([]);
  const {user,isAuthenticated}=useAuthStore();
  const {openAuthModal}=useUIStore();
  const router=useRouter();

  useEffect(()=>{
    let active=true;
    const load=async()=>{
      try{
        const result:any=await communityApiV2.list({featured:true,limit:3});
        let items=Array.isArray(result?.communities)?result.communities:[];
        if(items.length<2){
          const fallback:any=await communityApiV2.list({limit:3});
          items=Array.isArray(fallback?.communities)?fallback.communities:[];
        }
        if(active)setCommunities(items.slice(0,3));
      }catch{if(active)setCommunities([]);}
    };
    void load();
    return()=>{active=false};
  },[]);

  const openMyHealth=()=>{
    if(!isAuthenticated||!user){
      try{sessionStorage.setItem('hc_post_login_redirect','/dashboard');}catch{}
      openAuthModal('login');
      return;
    }
    const role=String(user.role??'').toUpperCase();
    router.push(role==='PATIENT'?'/dashboard':role==='DOCTOR'?'/doctor-dashboard':role==='HOSPITAL'?'/hospital-dashboard':'/admin-dashboard');
  };

  return <section className="cmh-section">
    <style>{`
      .cmh-section{background:#F7FAFC;padding:44px 28px 48px;font-family:'DM Sans',Arial,sans-serif}.cmh-inner{max-width:1280px;margin:0 auto}.cmh-head{display:flex;align-items:end;justify-content:space-between;gap:34px;margin-bottom:24px}.cmh-kicker{font-size:10px;font-weight:900;letter-spacing:.17em;color:#0D9488;margin-bottom:8px}.cmh-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,3vw,3.25rem);line-height:1.05;letter-spacing:-.04em;color:#0F172A;margin:0;max-width:700px}.cmh-head p{max-width:390px;margin:0;color:#64748B;font-size:13px;line-height:1.65}.cmh-grid{display:grid;grid-template-columns:1.08fr .92fr;gap:16px}.cmh-community{background:radial-gradient(circle at 88% 8%,rgba(52,211,153,.14),transparent 28%),linear-gradient(135deg,#071C22,#0A493E);border-radius:20px;padding:28px 30px;color:#fff;min-height:360px;position:relative;overflow:hidden}.cmh-health{background:#fff;border:1px solid #DDE7EE;border-radius:20px;padding:28px 30px;min-height:360px;box-shadow:0 8px 28px rgba(15,23,42,.045)}.cmh-badge{display:inline-flex;border-radius:999px;padding:5px 8px;font-size:8px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.cmh-community .cmh-badge{color:#A7F3D0;border:1px solid rgba(167,243,208,.22);background:rgba(16,185,129,.08)}.cmh-health .cmh-badge{color:#0F766E;background:#ECFDF5;border:1px solid #D1FAE5}.cmh-card-title{font-family:'Sora',sans-serif;font-size:clamp(1.55rem,2.25vw,2.45rem);line-height:1.08;letter-spacing:-.035em;margin:12px 0 9px}.cmh-community .cmh-card-title{color:#F5FFFC}.cmh-health .cmh-card-title{color:#0F172A}.cmh-copy{font-size:12px;line-height:1.62;margin:0 0 17px}.cmh-community .cmh-copy{color:#B6DAD3}.cmh-health .cmh-copy{color:#64748B}.cmh-points{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:0 0 17px}.cmh-point{font-size:9px;font-weight:800;border-radius:8px;padding:8px 9px}.cmh-community .cmh-point{color:#D8FFF3;background:rgba(255,255,255,.055);border:1px solid rgba(167,243,208,.12)}.cmh-health .cmh-point{color:#24405F;background:#F7FAFC;border:1px solid #E5EDF3}.cmh-live{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:14px}.cmh-community-card{display:block;text-decoration:none;color:#fff;border-radius:10px;padding:10px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.1);min-width:0}.cmh-community-card b{display:block;font-size:9.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px}.cmh-community-card span{font-size:7.5px;color:#9DC9BF}.cmh-actions{display:flex;gap:8px;flex-wrap:wrap}.cmh-btn{display:inline-flex;align-items:center;text-decoration:none;border:0;border-radius:9px;padding:9px 13px;font-size:10px;font-weight:900;cursor:pointer}.cmh-community .cmh-btn{background:#6EE7B7;color:#06261C}.cmh-health .cmh-btn{background:#0D9488;color:#fff}.cmh-secondary{background:transparent!important;border:1px solid rgba(148,163,184,.25)!important}.cmh-community .cmh-secondary{color:#E8FFF8!important;border-color:rgba(167,243,208,.22)!important}.cmh-health .cmh-secondary{color:#0F766E!important;border-color:#BFE8DF!important}.cmh-health-list{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:17px}.cmh-health-item{border:1px solid #E5EDF3;background:#FBFDFF;border-radius:9px;padding:9px}.cmh-health-item b{display:block;color:#0F172A;font-size:9.5px;margin-bottom:2px}.cmh-health-item span{display:block;color:#64748B;font-size:7.8px;line-height:1.35}
      @media(max-width:900px){.cmh-head{align-items:start;flex-direction:column}.cmh-grid{grid-template-columns:1fr}.cmh-community,.cmh-health{min-height:auto}}
      @media(max-width:560px){.cmh-section{padding:36px 14px 40px}.cmh-community,.cmh-health{padding:24px 20px}.cmh-points,.cmh-health-list{grid-template-columns:1fr}.cmh-live{grid-template-columns:1fr}}
    `}</style>
    <div className="cmh-inner">
      <div className="cmh-head"><div><div className="cmh-kicker">BETWEEN APPOINTMENTS</div><h2 className="cmh-title">Two things make HealthConnect more useful after you find a doctor.</h2></div><p>Health Communities help with ongoing peer support. My Health keeps your medical information organised so your next consultation starts with more context.</p></div>
      <div className="cmh-grid">
        <article className="cmh-community">
          <span className="cmh-badge">Health Communities · HealthConnect USP</span>
          <h3 className="cmh-card-title">Ask, share and stay supported between visits.</h3>
          <p className="cmh-copy">Condition-focused communities sit beside doctor and hospital discovery rather than on a separate social platform. Browse conversations, join where relevant, participate in Q&A events and post anonymously where the community permits it.</p>
          <div className="cmh-points"><div className="cmh-point">Anonymous-posting controls</div><div className="cmh-point">Membership rules</div><div className="cmh-point">Reports & moderation</div><div className="cmh-point">Events & Q&A</div></div>
          {communities.length>0&&<div className="cmh-live">{communities.map(c=><Link className="cmh-community-card" key={c.id} href={`/communities/${c.slug||c.id}`}><b>{c.name}</b><span>{Number(c.member_count||c.memberCount||0).toLocaleString('en-IN')} members · {Number(c.post_count||c.postCount||0).toLocaleString('en-IN')} posts</span></Link>)}</div>}
          <div className="cmh-actions" style={{marginTop:14}}><Link className="cmh-btn" href="/communities">Explore Health Communities →</Link><button className="cmh-btn cmh-secondary" onClick={()=>openAuthModal('login')}>Sign In</button></div>
        </article>

        <article className="cmh-health">
          <span className="cmh-badge">My Health · your medical journey</span>
          <h3 className="cmh-card-title">Your medical history should be easier to carry forward.</h3>
          <p className="cmh-copy">My Health gives patients one place for the information that often gets scattered across visits, files and prescriptions. It helps you return to future appointments with more of your own history available.</p>
          <div className="cmh-health-list">{HEALTH_ITEMS.map(([title,copy])=><div className="cmh-health-item" key={title}><b>{title}</b><span>{copy}</span></div>)}</div>
          <div className="cmh-actions"><button className="cmh-btn" onClick={openMyHealth}>Open My Health →</button><Link className="cmh-btn cmh-secondary" href="/doctors">Find Doctors</Link></div>
        </article>
      </div>
    </div>
  </section>;
}
