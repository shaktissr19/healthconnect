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

const PEOPLE = {
  woman: 'https://images.unsplash.com/photo-1774437890454-634d48db52c8?auto=format&fit=crop&w=700&q=85',
  man: 'https://images.unsplash.com/photo-1774437678715-fb40846dc252?auto=format&fit=crop&w=700&q=85',
  seniorWoman: 'https://images.unsplash.com/photo-1774437790863-88a80bca5b29?auto=format&fit=crop&w=700&q=85',
  seniorMan: 'https://images.unsplash.com/photo-1779630986800-f0ed643f357b?auto=format&fit=crop&w=700&q=85',
};

const SLIDES: SlideCopy[] = [
  {
    id: 'community',
    tab: 'Health Communities',
    icon: '🤝',
    accent: '#0F9F84',
    eyebrow: 'HEALTH COMMUNITIES · HEALTHCONNECT USP',
    headline: 'You are not alone in your health journey.',
    body: 'Join Health Communities where people share experience, ask questions and support each other between appointments — with moderation and anonymous participation where the community allows it.',
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
    headline: 'Your health history should travel with you.',
    body: 'Keep reports, prescriptions, symptoms, vitals, medicines and appointments together so you can return to care with more of your own health context already organised.',
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
      .continuity-section{background:#F7FBFC;padding:34px 28px 40px;font-family:'DM Sans',Arial,sans-serif}
      .continuity-frame{max-width:1280px;height:500px;margin:0 auto;border-radius:24px;overflow:hidden;position:relative;background:linear-gradient(135deg,#FCFEFF 0%,#F1FAF8 48%,#EEF7FD 100%);border:1px solid #C9DEE8;box-shadow:0 16px 38px rgba(15,23,42,.08)}
      .continuity-frame:before{content:'';position:absolute;width:430px;height:430px;border-radius:50%;right:-150px;top:-190px;background:radial-gradient(circle,rgba(45,212,191,.14),rgba(45,212,191,0));pointer-events:none}
      .continuity-tabs{height:60px;padding:12px 30px 0;display:flex;gap:9px;position:relative;z-index:5}
      .continuity-tab{position:relative;overflow:hidden;border:1px solid #C7DCE6;background:#fff;color:#35546D;border-radius:12px;padding:10px 17px;font-size:12.5px;font-weight:850;cursor:pointer;box-shadow:0 3px 11px rgba(15,23,42,.05)}
      .continuity-tab.active{color:#12314A;border-color:var(--slide-accent);box-shadow:0 8px 20px rgba(15,23,42,.08)}
      .continuity-tab.active:after{content:'';position:absolute;left:0;bottom:0;height:3px;background:var(--slide-accent);animation:continuityProgress 6.8s linear forwards}
      @keyframes continuityProgress{from{width:0}to{width:100%}}
      .continuity-main{height:384px;display:grid;grid-template-columns:minmax(0,.94fr) minmax(500px,1.06fr);gap:38px;align-items:center;padding:16px 50px 22px;position:relative;z-index:2}
      .continuity-eyebrow{font-size:11px;font-weight:900;letter-spacing:.17em;color:var(--slide-accent);margin-bottom:10px}
      .continuity-copy h2{font-family:'Sora','DM Sans',sans-serif;color:#10233C;font-size:clamp(2.25rem,3.15vw,3.35rem);line-height:1.03;letter-spacing:-.045em;margin:0 0 13px;max-width:650px}
      .continuity-copy>p{font-size:14.5px;line-height:1.62;color:#4B647B;max-width:620px;margin:0 0 17px}
      .continuity-points{display:grid;gap:8px;margin-bottom:18px}.continuity-point{display:flex;align-items:center;gap:10px;color:#243E55;font-size:12.5px;font-weight:800}
      .continuity-check{width:25px;height:25px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--slide-accent) 13%,#fff);border:1px solid color-mix(in srgb,var(--slide-accent) 30%,#fff);color:var(--slide-accent);font-size:12px;font-weight:900;flex:0 0 25px}
      .continuity-actions{display:flex;gap:9px;flex-wrap:wrap}.continuity-primary,.continuity-secondary{border-radius:10px;padding:11px 17px;font-size:12px;font-weight:900;cursor:pointer;text-decoration:none;font-family:inherit;box-shadow:0 5px 14px rgba(15,23,42,.07)}
      .continuity-primary{border:1px solid var(--slide-accent);background:var(--slide-accent);color:#fff}.continuity-secondary{border:1px solid #BFD1DD;background:#fff;color:#183850}

      .human-visual{height:310px;border-radius:22px;position:relative;overflow:hidden;border:1px solid #BFDDE2;background:radial-gradient(circle at 55% 45%,#fff 0 30%,transparent 31%),linear-gradient(135deg,#E9FAF5 0%,#F8FCFF 52%,#EAF5FF 100%);box-shadow:0 15px 36px rgba(15,76,129,.09)}
      .human-visual:before,.human-visual:after{content:'';position:absolute;border:2px dashed rgba(15,159,132,.22);border-radius:50%;left:48%;top:51%;transform:translate(-50%,-50%)}
      .human-visual:before{width:340px;height:250px}.human-visual:after{width:455px;height:330px;border-color:rgba(39,121,215,.14)}
      .person{position:absolute;border-radius:50%;background-position:center;background-size:cover;border:5px solid #fff;box-shadow:0 12px 28px rgba(15,23,42,.14);z-index:2}
      .person.main{width:132px;height:132px;left:43%;top:50%;transform:translate(-50%,-50%);border-color:#DDF8EF;box-shadow:0 0 0 2px #31B89A,0 14px 30px rgba(15,23,42,.14)}
      .person.p1{width:70px;height:70px;left:9%;top:14%}.person.p2{width:64px;height:64px;left:16%;bottom:10%}.person.p3{width:72px;height:72px;right:10%;bottom:12%}
      .connect-dot{position:absolute;width:11px;height:11px;border-radius:50%;background:#2DD4BF;box-shadow:0 0 0 6px rgba(45,212,191,.12);z-index:1}.connect-dot.d1{left:30%;top:20%}.connect-dot.d2{left:28%;bottom:18%}.connect-dot.d3{right:28%;bottom:21%}
      .community-quote{position:absolute;right:5%;top:8%;width:230px;background:rgba(255,255,255,.96);border:1px solid #B9E5D9;border-radius:17px;padding:14px 15px;z-index:4;box-shadow:0 13px 28px rgba(15,23,42,.1)}
      .community-quote small{display:block;color:#0F8A6C;font-size:9px;font-weight:900;letter-spacing:.08em;margin-bottom:7px}.community-quote b{display:block;font-family:'Sora',sans-serif;color:#123B45;font-size:14px;line-height:1.35}.community-quote span{display:block;margin-top:7px;color:#60778B;font-size:9.5px;line-height:1.35}
      .community-tags{position:absolute;left:5%;bottom:5%;display:flex;gap:6px;flex-wrap:wrap;max-width:62%;z-index:4}.community-tag{background:rgba(255,255,255,.94);border:1px solid #C6E8DD;color:#176A58;border-radius:999px;padding:5px 8px;font-size:9px;font-weight:850;text-decoration:none}

      .health-human{height:310px;border-radius:22px;position:relative;overflow:hidden;border:1px solid #C6DCEE;background:linear-gradient(135deg,#EFF7FF 0%,#FBFDFF 52%,#EFFAF6 100%);box-shadow:0 15px 36px rgba(15,76,129,.09)}
      .health-human:before{content:'';position:absolute;width:310px;height:310px;border-radius:50%;left:50%;top:50%;transform:translate(-50%,-50%);background:radial-gradient(circle,#fff 0 44%,rgba(219,238,255,.52) 45% 62%,transparent 63%)}
      .health-person{position:absolute;width:126px;height:126px;left:50%;top:49%;transform:translate(-50%,-50%);border-radius:50%;background-position:center;background-size:cover;border:6px solid #fff;box-shadow:0 0 0 2px #6AADE8,0 14px 30px rgba(15,23,42,.14);z-index:3}
      .health-node{position:absolute;width:170px;background:#fff;border:1px solid #C7DDEE;border-radius:14px;padding:11px 12px;box-shadow:0 9px 22px rgba(15,23,42,.08);z-index:4}.health-node strong{display:block;font-size:11px;margin-bottom:3px;color:#13395B}.health-node span{font-size:9.5px;line-height:1.35;color:#60778B}.health-node.n1{left:4%;top:10%;border-left:4px solid #2563EB}.health-node.n2{right:4%;top:9%;border-left:4px solid #7C3AED}.health-node.n3{left:4%;bottom:11%;border-left:4px solid #0D9488}.health-node.n4{right:4%;bottom:10%;border-left:4px solid #0891B2}
      .health-ribbon{position:absolute;left:50%;bottom:5%;transform:translateX(-50%);z-index:5;background:#EAF8F1;border:1px solid #BEE7D4;color:#0F6D59;border-radius:999px;padding:6px 11px;font-size:9.5px;font-weight:850;white-space:nowrap}

      .continuity-footer{height:56px;border-top:1px solid #D2E2EA;background:rgba(255,255,255,.75);display:flex;align-items:center;justify-content:space-between;padding:0 30px;position:relative;z-index:2}.continuity-dots{display:flex;gap:7px}.continuity-dot{width:30px;height:4px;border:0;padding:0;border-radius:999px;background:#C8D8E3;cursor:pointer}.continuity-dot.active{background:var(--slide-accent)}.continuity-auto{display:flex;align-items:center;gap:7px;color:#49647D;font-size:10px;font-weight:850;letter-spacing:.08em}.continuity-auto:before{content:'';width:7px;height:7px;border-radius:50%;background:#22C55E;box-shadow:0 0 0 3px rgba(34,197,94,.13)}
      @media(max-width:1000px){.continuity-frame{height:auto}.continuity-main{height:auto;grid-template-columns:1fr;padding:26px 30px 30px}.human-visual,.health-human{max-width:760px;width:100%}.continuity-footer{height:52px}}
      @media(max-width:650px){.continuity-section{padding:28px 12px 32px}.continuity-tabs{padding:12px 14px 0}.continuity-tab{padding:9px 11px;font-size:11px}.continuity-main{padding:22px 18px 25px;gap:23px}.continuity-copy h2{font-size:2.05rem}.continuity-copy>p{font-size:13.5px}.human-visual,.health-human{height:340px}.person.main{left:43%;top:53%;width:112px;height:112px}.community-quote{right:4%;top:5%;width:195px}.person.p1{left:5%;top:10%}.person.p2{left:7%;bottom:13%}.person.p3{right:7%;bottom:11%}.community-tags{max-width:80%}.health-node{width:145px;padding:9px}.health-person{width:105px;height:105px}.continuity-footer{padding:0 16px}}
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

        {active==='community'?<div className="human-visual" aria-label="People connected through Health Communities">
          <div className="person main" style={{backgroundImage:`url(${PEOPLE.seniorWoman})`}}/>
          <div className="person p1" style={{backgroundImage:`url(${PEOPLE.woman})`}}/>
          <div className="person p2" style={{backgroundImage:`url(${PEOPLE.man})`}}/>
          <div className="person p3" style={{backgroundImage:`url(${PEOPLE.seniorMan})`}}/>
          <span className="connect-dot d1"/><span className="connect-dot d2"/><span className="connect-dot d3"/>
          <div className="community-quote"><small>EXAMPLE COMMUNITY SENTIMENT</small><b>“Talking to others helped me feel more prepared.”</b><span>Shared experience can offer perspective and support; it does not replace medical advice.</span></div>
          <div className="community-tags">{communities.length>0?communities.map(c=><Link className="community-tag" key={c.id} href={`/communities/${c.slug||c.id}`}>{c.name}</Link>):<><span className="community-tag">Diabetes support</span><span className="community-tag">Heart health</span><span className="community-tag">Mental wellbeing</span></>}</div>
        </div>:<div className="health-human" aria-label="A patient with connected health information">
          <div className="health-person" style={{backgroundImage:`url(${PEOPLE.woman})`}}/>
          <div className="health-node n1"><strong>Medical History</strong><span>Conditions, past care and clinical context</span></div>
          <div className="health-node n2"><strong>Reports & Prescriptions</strong><span>Keep documents ready for future visits</span></div>
          <div className="health-node n3"><strong>Vitals & Symptoms</strong><span>Track what changes between consultations</span></div>
          <div className="health-node n4"><strong>Medicines & Appointments</strong><span>Keep treatment and visit history connected</span></div>
          <div className="health-ribbon">Your health context stays connected to your account</div>
        </div>}
      </div>

      <div className="continuity-footer"><div className="continuity-dots">{SLIDES.map(slide=><button key={slide.id} aria-label={`Show ${slide.tab}`} className={`continuity-dot ${active===slide.id?'active':''}`} onClick={()=>setActive(slide.id)}/>)}</div><div className="continuity-auto">AUTO ROTATING · {active==='community'?'1':'2'} / 2</div></div>
    </div>
  </section>;
}
