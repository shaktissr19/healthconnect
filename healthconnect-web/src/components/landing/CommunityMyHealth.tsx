'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import communityApiV2 from '@/lib/communityApiV2';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

type SlideId = 'community' | 'health';

type SlideCopy = {
  id: SlideId;
  tab: string;
  icon: string;
  accent: string;
  eyebrow: string;
  headline: string;
  body: string;
  points: string[];
};

const SLIDES: SlideCopy[] = [
  {
    id: 'community',
    tab: 'Health Communities',
    icon: '🤝',
    accent: '#0F9F84',
    eyebrow: 'HEALTH COMMUNITIES · HEALTHCONNECT USP',
    headline: 'Support that continues between appointments.',
    body: 'Health Communities keeps condition-focused peer support, anonymous posting where allowed, Q&A and moderation beside the same platform where people already find doctors and hospitals.',
    points: [
      'Condition-focused peer support',
      'Anonymous posting where allowed',
      'Moderation, reporting and Q&A',
    ],
  },
  {
    id: 'health',
    tab: 'My Health',
    icon: '♥',
    accent: '#2779D7',
    eyebrow: 'MY HEALTH · YOUR MEDICAL JOURNEY',
    headline: 'Keep your medical history ready for the next visit.',
    body: 'My Health keeps reports, prescriptions, symptoms, vitals, medicines and appointments together so the next consultation starts with more of your own context.',
    points: [
      'Medical history, reports & prescriptions',
      'Vitals, symptoms & medicines',
      'Appointments & follow-up',
    ],
  },
];

export default function CommunityMyHealth(){
  const [active,setActive] = useState<SlideId>('community');
  const [communities,setCommunities] = useState<any[]>([]);
  const {user,isAuthenticated}=useAuthStore();
  const {openAuthModal}=useUIStore();
  const router=useRouter();
  const current=useMemo(()=>SLIDES.find(slide=>slide.id===active)??SLIDES[0],[active]);

  useEffect(()=>{
    let mounted=true;
    const load=async()=>{
      try{
        const result:any=await communityApiV2.list({featured:true,limit:3});
        let items=Array.isArray(result?.communities)?result.communities:[];
        if(items.length<2){
          const fallback:any=await communityApiV2.list({limit:3});
          items=Array.isArray(fallback?.communities)?fallback.communities:[];
        }
        if(mounted)setCommunities(items.slice(0,3));
      }catch{if(mounted)setCommunities([]);}
    };
    void load();
    return()=>{mounted=false};
  },[]);

  useEffect(()=>{
    if(typeof window!=='undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer=window.setTimeout(()=>setActive(prev=>prev==='community'?'health':'community'),6800);
    return()=>window.clearTimeout(timer);
  },[active]);

  const openMyHealth=()=>{
    if(!isAuthenticated||!user){
      try{sessionStorage.setItem('hc_post_login_redirect','/dashboard');}catch{}
      openAuthModal('login');
      return;
    }
    const role=String(user.role??'').toUpperCase();
    router.push(role==='PATIENT'?'/dashboard':role==='DOCTOR'?'/doctor-dashboard':role==='HOSPITAL'?'/hospital-dashboard':'/admin-dashboard');
  };

  return <section className="continuity-section">
    <style>{`
      .continuity-section{background:#F6FAFC;padding:34px 28px 40px;font-family:'DM Sans',Arial,sans-serif}
      .continuity-frame{max-width:1280px;height:500px;margin:0 auto;border-radius:22px;overflow:hidden;position:relative;background:radial-gradient(circle at 86% 10%,rgba(45,212,191,.18),transparent 28%),radial-gradient(circle at 10% 90%,rgba(96,165,250,.13),transparent 32%),linear-gradient(135deg,#F8FCFF 0%,#EFF8FC 52%,#EEF9F5 100%);border:1px solid #C9DEE8;box-shadow:0 16px 38px rgba(15,23,42,.09)}
      .continuity-frame:before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(15,76,129,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(15,76,129,.035) 1px,transparent 1px);background-size:44px 44px;mask-image:linear-gradient(to left,#000,transparent 78%);pointer-events:none}
      .continuity-tabs{height:60px;padding:12px 30px 0;display:flex;gap:9px;position:relative;z-index:2}
      .continuity-tab{position:relative;overflow:hidden;border:1px solid #CDDEE8;background:rgba(255,255,255,.86);color:#39556D;border-radius:11px;padding:10px 17px;font-size:12.5px;font-weight:850;cursor:pointer;box-shadow:0 2px 9px rgba(15,23,42,.04)}
      .continuity-tab.active{color:#12314A;border-color:var(--slide-accent);background:#fff;box-shadow:0 7px 18px rgba(15,23,42,.08)}
      .continuity-tab.active:after{content:'';position:absolute;left:0;bottom:0;height:3px;background:var(--slide-accent);animation:continuityProgress 6.8s linear forwards}@keyframes continuityProgress{from{width:0}to{width:100%}}
      .continuity-main{height:384px;display:grid;grid-template-columns:minmax(0,1.02fr) minmax(430px,.98fr);gap:46px;align-items:center;padding:20px 56px 26px;position:relative;z-index:2}
      .continuity-eyebrow{font-size:11px;font-weight:900;letter-spacing:.17em;color:var(--slide-accent);margin-bottom:11px}
      .continuity-copy h2{font-family:'Sora','DM Sans',sans-serif;color:#10233C;font-size:clamp(2.35rem,3.35vw,3.55rem);line-height:1.03;letter-spacing:-.045em;margin:0 0 14px;max-width:690px}
      .continuity-copy>p{font-size:14.5px;line-height:1.62;color:#4B647B;max-width:650px;margin:0 0 18px}
      .continuity-points{display:grid;gap:9px;margin-bottom:19px}.continuity-point{display:flex;align-items:center;gap:10px;color:#243E55;font-size:12.5px;font-weight:800}
      .continuity-check{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--slide-accent) 13%,#fff);border:1px solid color-mix(in srgb,var(--slide-accent) 30%,#fff);color:var(--slide-accent);font-size:12px;font-weight:900;flex:0 0 26px}
      .continuity-actions{display:flex;gap:9px;flex-wrap:wrap}.continuity-primary,.continuity-secondary{border-radius:10px;padding:11px 17px;font-size:12px;font-weight:900;cursor:pointer;text-decoration:none;font-family:inherit;box-shadow:0 5px 14px rgba(15,23,42,.07)}
      .continuity-primary{border:1px solid var(--slide-accent);background:var(--slide-accent);color:#fff}.continuity-secondary{border:1px solid #BFD1DD;background:#fff;color:#183850}
      .continuity-preview{background:rgba(255,255,255,.9);border:1px solid #C8DCE7;border-radius:18px;padding:17px;box-shadow:0 16px 36px rgba(15,23,42,.09)}
      .continuity-preview-head{display:flex;justify-content:space-between;align-items:center;color:#496781;font-size:11px;font-weight:900;letter-spacing:.1em;margin-bottom:12px}.continuity-live{display:flex;align-items:center;gap:6px;color:#0F8A6C}.continuity-live:before{content:'';width:7px;height:7px;border-radius:50%;background:#22C55E;box-shadow:0 0 0 4px rgba(34,197,94,.12)}
      .community-post{background:linear-gradient(135deg,#F7FCFF 0%,#F1FBF7 100%);border:1px solid #BADCE3;border-left:4px solid #24A98C;border-radius:13px;padding:16px;color:#10233C}.community-post small,.health-preview small{display:block;font-size:10.5px;font-weight:900;letter-spacing:.09em;color:#3D6D89;margin-bottom:8px}.community-post b{font-family:'Sora',sans-serif;display:block;font-size:15.5px;line-height:1.38;margin-bottom:8px;color:#123456}.community-post p{font-size:12px;line-height:1.5;color:#526C84;margin:0}.community-meta{margin-top:10px;font-size:10.5px;font-weight:800;color:#0F766E}
      .community-list{display:grid;gap:7px;margin-top:9px}.community-row{display:flex;justify-content:space-between;gap:12px;align-items:center;text-decoration:none;border:1px solid #C8E3E2;background:linear-gradient(90deg,#F2FAFF,#EEF9F4);border-radius:9px;padding:10px 12px;color:#16364D}.community-row b{font-size:11.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#173C55}.community-row span{font-size:10.5px;font-weight:800;color:#0F8A6C;white-space:nowrap}.community-safety{margin-top:9px;border-radius:9px;padding:10px 11px;background:#EAF8F1;border:1px solid #BDE8D4;color:#12674F;font-size:10.5px;line-height:1.38;font-weight:850}
      .health-preview{background:linear-gradient(135deg,#FBFDFF 0%,#F6FAFF 100%);border:1px solid #C7DCE8;border-radius:13px;padding:17px;color:#10233C}.health-score-row{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:10px}.health-summary{border-radius:11px;padding:12px;border:1px solid transparent}.health-summary:first-child{background:#E5F1FF;border-color:#C7DFFA}.health-summary:last-child{background:#E8F8F1;border-color:#C6EAD8}.health-summary b{display:block;font-family:'Sora',sans-serif;font-size:18px;margin-bottom:5px}.health-summary:first-child b{color:#0F4C81}.health-summary:last-child b{color:#0F766E}.health-summary span{font-size:10.5px;line-height:1.42;color:#47647E}
      .health-path{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:13px 0}.health-step{position:relative;border-radius:10px;padding:11px 8px;text-align:center;min-height:72px;border:1px solid transparent}.health-step:nth-child(1){background:#E6F1FF;border-color:#CBDFFA}.health-step:nth-child(2){background:#EFEAFF;border-color:#DDD2FC}.health-step:nth-child(3){background:#E7F8F0;border-color:#CDEBD9}.health-step:nth-child(4){background:#E5F5F8;border-color:#CBE7EC}.health-step:after{content:'→';position:absolute;right:-8px;top:27px;color:#7891A7;font-size:11px}.health-step:last-child:after{display:none}.health-step strong{display:block;font-size:11px;margin-bottom:5px}.health-step:nth-child(1) strong{color:#2563EB}.health-step:nth-child(2) strong{color:#7C3AED}.health-step:nth-child(3) strong{color:#0D9488}.health-step:nth-child(4) strong{color:#0891B2}.health-step span{font-size:10px;line-height:1.35;color:#334F67;font-weight:750}.health-ready{border-radius:9px;padding:10px 11px;background:linear-gradient(90deg,#E9F9F1,#E8F4FF);border:1px solid #C6E8D7;color:#0F6D59;font-size:10.5px;line-height:1.38;font-weight:850}
      .continuity-footer{height:56px;border-top:1px solid #D2E2EA;background:rgba(255,255,255,.67);display:flex;align-items:center;justify-content:space-between;padding:0 30px;position:relative;z-index:2}.continuity-dots{display:flex;gap:7px}.continuity-dot{width:30px;height:4px;border:0;padding:0;border-radius:999px;background:#C8D8E3;cursor:pointer}.continuity-dot.active{background:var(--slide-accent)}.continuity-auto{display:flex;align-items:center;gap:7px;color:#49647D;font-size:10px;font-weight:850;letter-spacing:.08em}.continuity-auto:before{content:'';width:7px;height:7px;border-radius:50%;background:#22C55E;box-shadow:0 0 0 3px rgba(34,197,94,.13)}
      @media(max-width:930px){.continuity-frame{height:auto}.continuity-main{height:auto;grid-template-columns:1fr;padding:26px 30px 30px}.continuity-preview{max-width:720px}.continuity-footer{height:52px}}
      @media(max-width:620px){.continuity-section{padding:28px 12px 32px}.continuity-tabs{padding:12px 14px 0}.continuity-tab{padding:9px 11px;font-size:11px}.continuity-main{padding:22px 18px 25px;gap:23px}.continuity-copy h2{font-size:2.15rem}.continuity-copy>p{font-size:13.5px}.health-score-row{grid-template-columns:1fr}.health-path{grid-template-columns:1fr 1fr}.health-step:after{display:none}.continuity-footer{padding:0 16px}}
    `}</style>

    <div className="continuity-frame" style={{'--slide-accent':current.accent} as React.CSSProperties}>
      <div className="continuity-tabs" role="tablist" aria-label="HealthConnect between appointments">
        {SLIDES.map(slide=><button key={slide.id} role="tab" aria-selected={active===slide.id} className={`continuity-tab ${active===slide.id?'active':''}`} style={{'--slide-accent':slide.accent} as React.CSSProperties} onClick={()=>setActive(slide.id)}>{slide.icon} &nbsp; {slide.tab}</button>)}
      </div>

      <div className="continuity-main">
        <div className="continuity-copy">
          <div className="continuity-eyebrow">{current.eyebrow}</div>
          <h2>{current.headline}</h2>
          <p>{current.body}</p>
          <div className="continuity-points">{current.points.map(point=><div className="continuity-point" key={point}><span className="continuity-check">✓</span>{point}</div>)}</div>
          <div className="continuity-actions">
            {active==='community'?<Link href="/communities" className="continuity-primary">Explore Health Communities →</Link>:<button className="continuity-primary" onClick={openMyHealth}>Open My Health →</button>}
            <button className="continuity-secondary" onClick={()=>openAuthModal('login')}>Sign In</button>
          </div>
        </div>

        <div className="continuity-preview">
          <div className="continuity-preview-head"><span>{active==='community'?'COMMUNITY PREVIEW':'MY HEALTH PREVIEW'}</span><span className="continuity-live">LIVE PLATFORM</span></div>
          {active==='community'?<>
            <div className="community-post"><small>ANONYMOUS POST · CONDITION COMMUNITY</small><b>“How are others managing daily routines between follow-up visits?”</b><p>Members can ask, share experience and participate without turning HealthConnect into an open social network.</p><div className="community-meta">♡ Reactions · Replies · Report</div></div>
            <div className="community-list">{communities.length>0?communities.map(c=><Link className="community-row" key={c.id} href={`/communities/${c.slug||c.id}`}><b>{c.name}</b><span>{Number(c.member_count||c.memberCount||0).toLocaleString('en-IN')} members</span></Link>):<><div className="community-row"><b>Condition-focused communities</b><span>Browse & join</span></div><div className="community-row"><b>Community Q&A</b><span>Learn together</span></div></>}</div>
            <div className="community-safety">Anonymous where enabled · moderated · reportable · membership controls</div>
          </>:<div className="health-preview">
            <small>YOUR CONTINUOUS HEALTH JOURNEY</small>
            <div className="health-score-row"><div className="health-summary"><b>Medical history</b><span>Conditions, past care and clinical context</span></div><div className="health-summary"><b>Health records</b><span>Reports, prescriptions, vitals and symptoms</span></div></div>
            <div className="health-path"><div className="health-step"><strong>01</strong><span>Medical history</span></div><div className="health-step"><strong>02</strong><span>Reports & prescriptions</span></div><div className="health-step"><strong>03</strong><span>Vitals & medicines</span></div><div className="health-step"><strong>04</strong><span>Appointments & follow-up</span></div></div>
            <div className="health-ready">Ready for the next consultation — more of your own health context in one place.</div>
          </div>}
        </div>
      </div>

      <div className="continuity-footer"><div className="continuity-dots">{SLIDES.map(slide=><button key={slide.id} aria-label={`Show ${slide.tab}`} className={`continuity-dot ${active===slide.id?'active':''}`} onClick={()=>setActive(slide.id)}/>)}</div><div className="continuity-auto">AUTO ROTATING · {active==='community'?'1':'2'} / 2</div></div>
    </div>
  </section>;
}