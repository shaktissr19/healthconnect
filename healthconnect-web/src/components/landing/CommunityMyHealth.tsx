'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import communityApiV2 from '@/lib/communityApiV2';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const COMMUNITY_POINTS = [
  'Condition-focused peer support',
  'Anonymous posting where allowed',
  'Moderation, reporting and Q&A events',
] as const;

const HEALTH_POINTS = [
  'Medical history, reports and prescriptions',
  'Vitals, symptoms and medicines',
  'Appointments and follow-up in one place',
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
      .cmh-section{background:#F8FAFC;padding:42px 28px 46px;font-family:'DM Sans',Arial,sans-serif}.cmh-inner{max-width:1280px;margin:0 auto}.cmh-head{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(300px,.85fr);gap:42px;align-items:end;margin-bottom:22px}.cmh-kicker{font-size:10px;font-weight:900;letter-spacing:.17em;color:#0D9488;margin-bottom:8px}.cmh-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,3vw,3.15rem);line-height:1.04;letter-spacing:-.04em;color:#0F172A;margin:0;max-width:760px}.cmh-head p{max-width:420px;margin:0;color:#64748B;font-size:13px;line-height:1.62}.cmh-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.cmh-card{position:relative;overflow:hidden;background:#fff;border:1px solid #DDE7EE;border-radius:20px;padding:26px 28px;min-height:330px;box-shadow:0 8px 28px rgba(15,23,42,.045)}.cmh-card:after{content:'';position:absolute;width:210px;height:210px;border-radius:50%;right:-95px;top:-115px;pointer-events:none}.cmh-community:after{background:#D1FAE5}.cmh-health:after{background:#DBEAFE}.cmh-icon{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;font-size:20px;margin-bottom:18px;position:relative;z-index:1}.cmh-community .cmh-icon{background:#D1FAE5;color:#047857}.cmh-health .cmh-icon{background:#DBEAFE;color:#1D4ED8}.cmh-label{font-size:9px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;margin-bottom:7px}.cmh-community .cmh-label{color:#047857}.cmh-health .cmh-label{color:#1D4ED8}.cmh-card h3{font-family:'Sora',sans-serif;font-size:clamp(1.6rem,2.15vw,2.3rem);line-height:1.08;letter-spacing:-.035em;color:#0F172A;margin:0 0 9px;max-width:560px;position:relative;z-index:1}.cmh-card>p{font-size:12.5px;line-height:1.6;color:#64748B;margin:0 0 17px;max-width:560px;position:relative;z-index:1}.cmh-points{display:grid;gap:7px;margin-bottom:18px}.cmh-point{display:flex;align-items:center;gap:9px;color:#334155;font-size:10px;font-weight:750}.cmh-point:before{content:'✓';width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:10px;font-weight:900;flex:0 0 22px}.cmh-community .cmh-point:before{background:#ECFDF5;color:#047857}.cmh-health .cmh-point:before{background:#EFF6FF;color:#1D4ED8}.cmh-live{display:flex;gap:6px;flex-wrap:wrap;margin:1px 0 18px}.cmh-live a{text-decoration:none;font-size:8px;font-weight:800;color:#0F766E;background:#F0FDFA;border:1px solid #CCFBF1;padding:5px 7px;border-radius:999px;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cmh-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.cmh-btn{display:inline-flex;align-items:center;justify-content:center;border-radius:9px;padding:9px 13px;font-size:10px;font-weight:900;text-decoration:none;cursor:pointer;border:1px solid transparent}.cmh-community .cmh-btn.primary{background:#0D9488;color:#fff}.cmh-health .cmh-btn.primary{background:#2563EB;color:#fff}.cmh-btn.secondary{background:#fff;border-color:#D6E0E9;color:#475569}
      @media(max-width:900px){.cmh-head{grid-template-columns:1fr;gap:12px}.cmh-grid{grid-template-columns:1fr}.cmh-card{min-height:0}}
      @media(max-width:560px){.cmh-section{padding:36px 14px 40px}.cmh-card{padding:23px 20px}.cmh-title{font-size:2.1rem}}
    `}</style>

    <div className="cmh-inner">
      <div className="cmh-head">
        <div><div className="cmh-kicker">BEYOND FINDING CARE</div><h2 className="cmh-title">Two reasons to keep HealthConnect with you after the appointment.</h2></div>
        <p>Health Communities gives you support between visits. My Health keeps your own medical information easier to find when the next consultation comes.</p>
      </div>

      <div className="cmh-grid">
        <article className="cmh-card cmh-community">
          <div className="cmh-icon">🤝</div>
          <div className="cmh-label">Health Communities · HealthConnect USP</div>
          <h3>Stay supported between appointments.</h3>
          <p>Condition-focused communities bring peer conversation, Q&A and safer participation into the same healthcare platform you already use.</p>
          <div className="cmh-points">{COMMUNITY_POINTS.map(point=><div className="cmh-point" key={point}>{point}</div>)}</div>
          {communities.length>0&&<div className="cmh-live">{communities.map(c=><Link key={c.id} href={`/communities/${c.slug||c.id}`}>{c.name}</Link>)}</div>}
          <div className="cmh-actions"><Link className="cmh-btn primary" href="/communities">Explore Health Communities →</Link><button className="cmh-btn secondary" onClick={()=>openAuthModal('login')}>Sign In</button></div>
        </article>

        <article className="cmh-card cmh-health">
          <div className="cmh-icon">♥</div>
          <div className="cmh-label">My Health · Your medical journey</div>
          <h3>Keep your medical history ready for the next visit.</h3>
          <p>Bring the information that often gets scattered across prescriptions, reports and visits into one patient workspace you can return to.</p>
          <div className="cmh-points">{HEALTH_POINTS.map(point=><div className="cmh-point" key={point}>{point}</div>)}</div>
          <div className="cmh-actions"><button className="cmh-btn primary" onClick={openMyHealth}>Open My Health →</button><button className="cmh-btn secondary" onClick={()=>openAuthModal('login')}>Sign In</button></div>
        </article>
      </div>
    </div>
  </section>;
}
