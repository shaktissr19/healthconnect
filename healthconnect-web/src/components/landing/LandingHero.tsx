'use client';

import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

type IconType = 'health'|'doctor'|'hospital'|'appointment'|'community'|'knowledge';

function ModuleIcon({type}:{type:IconType}){
  const common={width:34,height:34,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round' as const,strokeLinejoin:'round' as const};
  if(type==='health') return <svg {...common}><path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.3A4 4 0 0 1 19 11c0 5.65-7 10-7 10Z"/><path d="M9 12h6M12 9v6"/></svg>;
  if(type==='doctor') return <svg {...common}><circle cx="9" cy="7" r="3"/><path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M17 8v7a3 3 0 0 0 6 0v-2M21 10v3"/></svg>;
  if(type==='hospital') return <svg {...common}><path d="M4 21V5h11v16M15 9h5v12M8 9h3M9.5 7.5v3M7 14h2M11 14h2M7 18h2M11 18h2M17 13h1M17 17h1"/></svg>;
  if(type==='appointment') return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 14h3M8 17h6"/></svg>;
  if(type==='community') return <svg {...common}><circle cx="8" cy="9" r="3"/><circle cx="17" cy="8" r="2.5"/><path d="M2.5 20a5.5 5.5 0 0 1 11 0M14 14a4.5 4.5 0 0 1 7.5 3.4"/></svg>;
  return <svg {...common}><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v18H7.5A3.5 3.5 0 0 0 4 23V5.5ZM20 5.5A3.5 3.5 0 0 0 16.5 2H12v18h4.5A3.5 3.5 0 0 1 20 23V5.5Z"/></svg>;
}

const modules=[
  {type:'health' as IconType,label:'My Health',desc:'Keep reports, medicines, symptoms and your health journey together.',cta:'Open',color:'#2563EB',bg:'#EAF2FF'},
  {type:'doctor' as IconType,label:'Find Doctors',desc:'Discover doctors by specialty and move into appointment booking.',cta:'Explore',color:'#0F9F6E',bg:'#EAF8F1'},
  {type:'hospital' as IconType,label:'Find Hospitals',desc:'Compare hospital profiles, departments, facilities and OPD access.',cta:'Explore',color:'#F97316',bg:'#FFF1E7'},
  {type:'appointment' as IconType,label:'Appointments',desc:'Move from care discovery into booking, tracking and follow-up.',cta:'Book care',color:'#7C3AED',bg:'#F2EAFF'},
  {type:'community' as IconType,label:'Communities',desc:'Connect in condition-focused spaces for support between visits.',cta:'Explore',color:'#E11D48',bg:'#FDECEF'},
  {type:'knowledge' as IconType,label:'Knowledge Hub',desc:'Use India-focused explainers to prepare for better health conversations.',cta:'Learn',color:'#0891B2',bg:'#E8F8FC'},
];

const why=[
  {icon:'⌁',title:'Connected Care',text:'Doctors, hospitals, appointments, personal health context and communities in one platform.'},
  {icon:'♡',title:'One Health Journey',text:'Keep important health information organised so it is easier to carry from one visit to the next.'},
  {icon:'⌕',title:'Care Discovery',text:'Find doctors and hospitals before moving into booking and care workflows.'},
  {icon:'◇',title:'Private by Design',text:'Authenticated workspaces and permission-aware sharing support more controlled access to health information.'},
  {icon:'⌂',title:'Built for India',text:'Indian healthcare context, local pricing and journeys designed around patients, doctors and hospitals.'},
];

export default function LandingHero(){
  const {isAuthenticated,user}=useAuthStore();
  const {openAuthModal}=useUIStore();

  const explore=()=>document.getElementById('healthconnect-journeys')?.scrollIntoView({behavior:'smooth',block:'start'});
  const go=(href:string)=>{if(typeof window!=='undefined')window.location.href=href};
  const accountAction=()=>{
    if(isAuthenticated&&user){
      const role=String(user.role||'').toUpperCase();
      go(role==='PATIENT'?'/dashboard':role==='DOCTOR'?'/doctor-dashboard':role==='HOSPITAL'?'/hospital-dashboard':'/admin-dashboard');
      return;
    }
    openAuthModal('register');
  };
  const moduleAction=(type:IconType)=>{
    if(type==='health'){accountAction();return;}
    if(type==='doctor'||type==='appointment'){go('/doctors');return;}
    if(type==='hospital'){go('/hospitals');return;}
    if(type==='community'){go('/communities');return;}
    go('/learn');
  };

  return <section className="hc-vs-landing" aria-label="HealthConnect India">
    <style>{`
      .hc-vs-landing{padding-top:74px;background:#fff;color:#0B2540;font-family:'DM Sans',Arial,sans-serif}
      .hc-vs-hero{position:relative;min-height:446px;overflow:hidden;background:#EEF8F8 url('/images/hero-photo.png') center right/cover no-repeat}
      .hc-vs-hero:before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,#F8FCFC 0%,rgba(248,252,252,.99) 28%,rgba(248,252,252,.90) 39%,rgba(248,252,252,.50) 52%,rgba(248,252,252,.10) 68%,rgba(248,252,252,0) 82%)}
      .hc-vs-hero:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,0) 72%,rgba(11,73,84,.06) 100%);pointer-events:none}
      .hc-vs-hero-inner{position:relative;z-index:2;max-width:1480px;min-height:446px;margin:0 auto;padding:56px 66px;display:flex;align-items:center}
      .hc-vs-copy{width:min(590px,48vw)}
      .hc-vs-copy h1{margin:0 0 14px;font-family:'Sora','DM Sans',sans-serif;font-size:clamp(3.4rem,5.4vw,5.65rem);line-height:.98;letter-spacing:-.055em;font-weight:880;color:#0B2B57;text-wrap:balance}
      .hc-vs-copy p{margin:0;max-width:525px;font-size:20px;line-height:1.5;font-weight:520;color:#234866}
      .hc-vs-actions{display:flex;gap:13px;flex-wrap:wrap;margin-top:25px}
      .hc-vs-btn{min-height:48px;padding:0 20px;border-radius:9px;font:800 13px 'DM Sans',Arial,sans-serif;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:12px;transition:.16s}
      .hc-vs-btn:hover{transform:translateY(-1px)}
      .hc-vs-primary{border:1px solid #0D9488;background:linear-gradient(135deg,#0F766E,#14B8A6);color:#fff;box-shadow:0 8px 20px rgba(13,148,136,.22)}
      .hc-vs-secondary{border:1px solid #C8D9DE;background:rgba(255,255,255,.92);color:#123250;box-shadow:0 5px 16px rgba(15,49,66,.05)}
      .hc-vs-secondary:hover{border-color:#96C8C1;background:#fff}

      .hc-vs-journey-wrap{background:#fff;padding:14px 30px 0}
      .hc-vs-journeys{max-width:1480px;margin:0 auto;border:1px solid #E2EAEE;border-radius:17px;box-shadow:0 5px 20px rgba(15,49,66,.035);display:grid;grid-template-columns:repeat(6,1fr);overflow:hidden}
      .hc-vs-module{position:relative;min-height:214px;padding:18px 23px 17px;text-align:center;border:0;border-right:1px solid #E7EEF1;background:#fff;cursor:pointer;font-family:inherit;color:#0B2540;transition:background .16s,transform .16s}
      .hc-vs-module:last-child{border-right:0}.hc-vs-module:hover{background:#FBFDFE}.hc-vs-icon{width:68px;height:68px;border-radius:50%;display:grid;place-items:center;margin:0 auto 10px}
      .hc-vs-module h3{margin:0 0 7px;font-family:'Sora','DM Sans',sans-serif;font-size:16px;line-height:1.2;font-weight:820;color:#0B2540}
      .hc-vs-module p{margin:0 auto;max-width:190px;min-height:51px;font-size:11.5px;line-height:1.48;color:#526B7E}
      .hc-vs-module strong{display:inline-flex;align-items:center;gap:8px;margin-top:11px;font-size:11.5px;font-weight:850}

      .hc-vs-why{max-width:1480px;margin:0 auto;padding:22px 30px 34px}.hc-vs-why h2{margin:0 0 17px;text-align:center;font-family:'Sora','DM Sans',sans-serif;font-size:27px;letter-spacing:-.035em;color:#0B2B57}.hc-vs-why h2:after{content:'';display:block;width:54px;height:2px;border-radius:4px;background:#0D9488;margin:10px auto 0}
      .hc-vs-why-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:22px}.hc-vs-why-card{min-height:104px;border:1px solid #E4ECF0;border-radius:12px;background:linear-gradient(135deg,#FCFEFF,#F7FBFC);padding:16px 18px;display:flex;gap:13px;align-items:flex-start}.hc-vs-why-icon{width:42px;height:42px;border-radius:11px;display:grid;place-items:center;flex:0 0 auto;background:#E9F8F5;color:#0D9488;font-size:25px;font-weight:500}.hc-vs-why-card h3{margin:0 0 4px;font-size:13px;color:#0B2540}.hc-vs-why-card p{margin:0;font-size:10.5px;line-height:1.48;color:#607789}

      @media(max-width:1100px){.hc-vs-hero{min-height:470px;background-position:62% center}.hc-vs-hero:before{background:linear-gradient(90deg,#F8FCFC 0%,rgba(248,252,252,.98) 38%,rgba(248,252,252,.72) 62%,rgba(248,252,252,.16) 100%)}.hc-vs-hero-inner{min-height:470px;padding:52px 34px}.hc-vs-copy{width:min(570px,62vw)}.hc-vs-journeys{grid-template-columns:repeat(3,1fr)}.hc-vs-module{border-bottom:1px solid #E7EEF1}.hc-vs-module:nth-child(3){border-right:0}.hc-vs-module:nth-child(n+4){border-bottom:0}.hc-vs-why-grid{grid-template-columns:repeat(3,1fr)}}
      @media(max-width:720px){.hc-vs-landing{padding-top:74px}.hc-vs-hero{min-height:650px;background-position:64% bottom}.hc-vs-hero:before{background:linear-gradient(180deg,#F8FCFC 0%,rgba(248,252,252,.98) 45%,rgba(248,252,252,.72) 67%,rgba(248,252,252,.16) 100%)}.hc-vs-hero-inner{min-height:650px;align-items:flex-start;padding:45px 20px 235px}.hc-vs-copy{width:100%;max-width:560px}.hc-vs-copy h1{font-size:clamp(3rem,13vw,4.4rem)}.hc-vs-copy p{font-size:16px}.hc-vs-journey-wrap{padding:12px 14px 0}.hc-vs-journeys{grid-template-columns:repeat(2,1fr)}.hc-vs-module{min-height:200px;border-right:1px solid #E7EEF1!important;border-bottom:1px solid #E7EEF1!important}.hc-vs-module:nth-child(even){border-right:0!important}.hc-vs-module:nth-child(n+5){border-bottom:0!important}.hc-vs-why{padding:22px 14px 30px}.hc-vs-why-grid{grid-template-columns:1fr 1fr;gap:10px}.hc-vs-why-card{min-height:122px}}
      @media(max-width:480px){.hc-vs-actions{flex-direction:column;align-items:stretch}.hc-vs-btn{width:100%}.hc-vs-journeys{grid-template-columns:1fr}.hc-vs-module{border-right:0!important;border-bottom:1px solid #E7EEF1!important}.hc-vs-module:last-child{border-bottom:0!important}.hc-vs-why-grid{grid-template-columns:1fr}.hc-vs-why-card{min-height:0}}
    `}</style>

    <div className="hc-vs-hero">
      <div className="hc-vs-hero-inner">
        <div className="hc-vs-copy">
          <h1>Welcome to HealthConnect</h1>
          <p>India&apos;s unified healthcare platform for finding care, managing your health journey and staying connected between visits.</p>
          <div className="hc-vs-actions">
            <button type="button" className="hc-vs-btn hc-vs-primary" onClick={explore}>Explore Platform <span>→</span></button>
            <button type="button" className="hc-vs-btn hc-vs-secondary" onClick={()=>go('/doctors')}>Find a Doctor <span>→</span></button>
          </div>
        </div>
      </div>
    </div>

    <div className="hc-vs-journey-wrap" id="healthconnect-journeys">
      <div className="hc-vs-journeys">
        {modules.map(item=><button type="button" key={item.label} className="hc-vs-module" onClick={()=>moduleAction(item.type)}>
          <span className="hc-vs-icon" style={{background:item.bg,color:item.color}}><ModuleIcon type={item.type}/></span>
          <h3>{item.label}</h3><p>{item.desc}</p><strong style={{color:item.color}}>{item.cta} <span>→</span></strong>
        </button>)}
      </div>
    </div>

    <div className="hc-vs-why">
      <h2>Why HealthConnect?</h2>
      <div className="hc-vs-why-grid">{why.map(item=><article className="hc-vs-why-card" key={item.title}><span className="hc-vs-why-icon">{item.icon}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></article>)}</div>
    </div>
  </section>;
}
