'use client';

import type { SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const DOCTOR_FEATURES=[
  {title:'My Patients',copy:'Keep patient relationships, shared context and returning-care history easier to reach.',icon:'patients',wash:'#E8F2FF',accent:'#2563EB'},
  {title:'Schedule & Availability',copy:'Manage availability and booked appointments around the same daily practice flow.',icon:'calendar',wash:'#E9F8F4',accent:'#0B8F7C'},
  {title:'Consultation Context',copy:'Review supported patient-shared health information before the conversation begins.',icon:'context',wash:'#F2EAFE',accent:'#7C3AED'},
  {title:'Follow-up Continuity',copy:'Keep the next care step visible after the consultation instead of losing continuity.',icon:'followup',wash:'#FFF1E8',accent:'#EA580C'},
  {title:'Professional Presence',copy:'Keep doctor profile, consultation modes and practice information connected to discovery.',icon:'profile',wash:'#EAF4FF',accent:'#1D4ED8'},
  {title:'Better Patient Journey',copy:'Patients move from discovery to consultation and follow-up with less disconnected context.',icon:'heart',wash:'#EAF8EE',accent:'#15803D'},
] as const;

const DOCTOR_IMAGE='/images/doctor-platform-main.png?v=20260909-2';
const DOCTOR_IMAGE_FALLBACK='/images/doctors-intro.png?v=20260909-2';

function DoctorIcon({kind,size=22}:{kind:string;size?:number}){
  const common={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.9,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};
  if(kind==='patients') return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>;
  if(kind==='calendar') return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h3M13 14h3"/></svg>;
  if(kind==='context') return <svg {...common}><path d="M7 3h10a2 2 0 0 1 2 2v16H5V5a2 2 0 0 1 2-2Z"/><path d="M9 7h6M9 11h6M9 15h3"/></svg>;
  if(kind==='followup') return <svg {...common}><path d="M20 7v5h-5"/><path d="M18.5 15a7 7 0 1 1 .5-7.7L20 12"/></svg>;
  if(kind==='profile') return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/><path d="M18 4h3M19.5 2.5v3"/></svg>;
  if(kind==='heart') return <svg {...common}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/><path d="M7 12h2l1.3-3 2.2 6 1.4-3H17"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
}

export default function CommunityBenefits(){
  const router=useRouter();
  const {isAuthenticated,user}=useAuthStore();
  const {openAuthModal}=useUIStore();

  const openDoctor=()=>{
    if(isAuthenticated&&user){
      const role=String(user.role||'').toUpperCase();
      router.push(role==='DOCTOR'?'/doctor-dashboard':role==='PATIENT'?'/dashboard':role==='HOSPITAL'?'/hospital-dashboard':'/admin-dashboard');
      return;
    }
    try{sessionStorage.setItem('hc_signup_role','DOCTOR')}catch{}
    openAuthModal('register');
  };

  const useFallback=(event:SyntheticEvent<HTMLImageElement>)=>{
    const image=event.currentTarget;
    if(image.dataset.fallback==='1') return;
    image.dataset.fallback='1';
    image.src=DOCTOR_IMAGE_FALLBACK;
  };

  return <section className="doctor-platform-section" id="doctor-platform-story" aria-labelledby="doctor-platform-title">
    <style>{`
      .doctor-platform-section{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#fff;padding:42px 22px 56px;scroll-margin-top:76px}
      .doctor-platform-shell{width:min(100%,1380px);margin:0 auto}
      .doctor-platform-head{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(330px,.65fr);gap:44px;align-items:end;margin-bottom:18px}
      .doctor-platform-label{font-size:12px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#2563EB;margin-bottom:7px}
      .doctor-platform-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.15rem,2.8vw,3.05rem);line-height:1.03;letter-spacing:-.05em;color:#0B2B45;margin:0}
      .doctor-platform-head p{font-size:15.5px;line-height:1.5;color:#35566A;margin:0 0 2px;max-width:500px}

      .doctor-platform-canvas{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(420px,.92fr);min-height:0;border-radius:24px;border:1px solid #C9DDEC;overflow:hidden;background:linear-gradient(120deg,#EEF6FF 0%,#F8FBFF 100%);box-shadow:0 16px 38px rgba(31,75,112,.08)}
      .doctor-platform-copy{padding:28px 30px 26px 34px;min-width:0;display:flex;flex-direction:column;justify-content:center}
      .doctor-platform-eyebrow{font-size:11.5px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#2563EB;margin-bottom:6px}
      .doctor-platform-copy h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(1.7rem,2.15vw,2.35rem);line-height:1.05;letter-spacing:-.043em;color:#0B2B45;margin:0;max-width:620px}
      .doctor-platform-intro{font-size:13.2px;line-height:1.47;color:#35566A;margin:9px 0 11px;max-width:650px}
      .doctor-platform-rule{width:42px;height:3px;border-radius:999px;background:#2563EB;margin-bottom:11px}

      .doctor-feature-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:1fr;gap:8px}
      .doctor-feature{min-width:0;min-height:92px;padding:10px 10px 9px;border-radius:13px;border:1px solid rgba(192,213,229,.88);box-shadow:0 5px 14px rgba(40,77,112,.045);transition:transform .18s ease,box-shadow .18s ease}
      .doctor-feature:hover{transform:translateY(-2px);box-shadow:0 9px 18px rgba(40,77,112,.08)}
      .doctor-feature-top{display:flex;align-items:center;gap:7px}
      .doctor-feature-icon{width:31px;height:31px;border-radius:9px;display:grid;place-items:center;flex:0 0 auto}
      .doctor-feature b{font-family:'Sora','DM Sans',sans-serif;font-size:11.2px;line-height:1.22;color:#16354A}
      .doctor-feature p{font-size:9.7px;line-height:1.34;color:#526B7B;margin:6px 0 0}

      .doctor-value-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
      .doctor-value{border-radius:12px;padding:8px 10px;background:#fff;border:1px solid #CDDEEA}
      .doctor-value strong{display:block;font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:#2563EB;margin-bottom:2px}
      .doctor-value span{display:block;font-size:9.8px;line-height:1.34;color:#486275}
      .doctor-platform-cta{align-self:flex-start;margin-top:10px;border:0;border-radius:9px;background:#2563EB;color:#fff;padding:9px 14px;font:900 12px 'DM Sans',Arial,sans-serif;cursor:pointer;box-shadow:0 7px 16px rgba(37,99,235,.16)}
      .doctor-platform-cta:hover{background:#1D4ED8;transform:translateY(-1px)}.doctor-platform-cta:focus-visible{outline:3px solid rgba(37,99,235,.25);outline-offset:3px}

      .doctor-visual{position:relative;min-height:510px;overflow:hidden;background:#DDEAF2}
      .doctor-platform-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 42%;display:block}
      .doctor-platform-photo-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,38,58,.02) 45%,rgba(8,38,58,.12) 100%);pointer-events:none}
      .doctor-visual-badge{position:absolute;top:18px;right:18px;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.92);border:1px solid rgba(208,224,233,.92);font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#25527A;box-shadow:0 7px 18px rgba(22,52,65,.08);backdrop-filter:blur(8px)}
      .doctor-flow-card{position:absolute;left:18px;right:18px;bottom:18px;border-radius:15px;padding:11px 12px;background:rgba(255,255,255,.95);border:1px solid rgba(205,222,234,.94);box-shadow:0 11px 25px rgba(25,61,80,.12);backdrop-filter:blur(8px)}
      .doctor-flow-card>strong{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:11.5px;color:#15364D;margin-bottom:7px}
      .doctor-flow{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;align-items:start;gap:7px}
      .doctor-flow-step{min-width:0}.doctor-flow-step b{display:block;font-size:9.8px;color:#2563EB}.doctor-flow-step span{display:block;margin-top:2px;font-size:8.8px;line-height:1.32;color:#5A7180}.doctor-flow-arrow{align-self:center;color:#7A9AB0;font-weight:900;font-size:14px}

      @media(max-height:820px) and (min-width:1101px){
        .doctor-platform-section{padding-top:34px;padding-bottom:44px}.doctor-platform-head{margin-bottom:14px}.doctor-platform-head h2{font-size:clamp(2rem,2.55vw,2.75rem)}.doctor-platform-head p{font-size:14.5px}
        .doctor-platform-copy{padding:23px 25px 22px 29px}.doctor-platform-copy h3{font-size:clamp(1.55rem,1.95vw,2.05rem)}.doctor-platform-intro{font-size:12.5px;margin:7px 0 9px}.doctor-feature{min-height:84px;padding:8px 9px}.doctor-feature p{font-size:9.2px}.doctor-visual{min-height:480px}
      }
      @media(max-width:1100px){
        .doctor-platform-section{padding:38px 18px 52px}.doctor-platform-head{grid-template-columns:1fr;gap:8px}.doctor-platform-head p{max-width:760px}
        .doctor-platform-canvas{grid-template-columns:1fr}.doctor-platform-copy{padding:28px}.doctor-visual{min-height:460px}.doctor-feature-grid{grid-template-columns:repeat(3,1fr)}
      }
      @media(max-width:760px){
        .doctor-platform-section{padding:32px 12px 44px}.doctor-platform-head h2{font-size:2.15rem}.doctor-platform-head p{font-size:15px}.doctor-platform-copy{padding:24px 18px}.doctor-platform-copy h3{font-size:1.9rem}.doctor-platform-intro{font-size:13px}
        .doctor-feature-grid{grid-template-columns:1fr 1fr}.doctor-feature{min-height:0}.doctor-value-row{grid-template-columns:1fr}.doctor-visual{min-height:390px}.doctor-flow{grid-template-columns:1fr}.doctor-flow-arrow{display:none}.doctor-flow-step+.doctor-flow-step{border-top:1px solid #E2EAF0;padding-top:5px;margin-top:3px}
      }
      @media(max-width:480px){.doctor-feature-grid{grid-template-columns:1fr}.doctor-visual{min-height:360px}.doctor-flow-card{left:12px;right:12px;bottom:12px}.doctor-visual-badge{top:12px;right:12px}}
    `}</style>

    <div className="doctor-platform-shell">
      <div className="doctor-platform-head">
        <div><div className="doctor-platform-label">Doctor Platform</div><h2 id="doctor-platform-title">A clearer practice journey for doctors.</h2></div>
        <p>HealthConnect helps doctors manage patients, availability, appointments, consultation context and follow-up without turning each task into a separate tool.</p>
      </div>

      <div className="doctor-platform-canvas">
        <div className="doctor-platform-copy">
          <div className="doctor-platform-eyebrow">Practice & Patients</div>
          <h3>One connected workspace from appointment to follow-up.</h3>
          <p className="doctor-platform-intro">The Doctor Platform keeps the information and actions surrounding a consultation together, helping doctors spend less time moving between disconnected screens while patients experience a clearer care journey.</p>
          <div className="doctor-platform-rule"/>

          <div className="doctor-feature-grid">
            {DOCTOR_FEATURES.map(feature=><article className="doctor-feature" key={feature.title} style={{background:feature.wash}}><div className="doctor-feature-top"><span className="doctor-feature-icon" style={{background:'#fff',color:feature.accent}}><DoctorIcon kind={feature.icon}/></span><b>{feature.title}</b></div><p>{feature.copy}</p></article>)}
          </div>

          <div className="doctor-value-row">
            <div className="doctor-value"><strong>How it helps doctors</strong><span>Less fragmentation across patient context, schedule, consultation preparation and follow-up.</span></div>
            <div className="doctor-value"><strong>How it helps patients</strong><span>A more continuous experience from finding care through the appointment and into the next step.</span></div>
          </div>

          <button type="button" className="doctor-platform-cta" onClick={openDoctor}>Explore Doctor Platform →</button>
        </div>

        <div className="doctor-visual">
          <img className="doctor-platform-photo" src={DOCTOR_IMAGE} alt="Indian doctor in a modern clinic with patient care in progress" loading="lazy" decoding="async" onError={useFallback}/>
          <div className="doctor-platform-photo-shade" aria-hidden="true"/>
          <div className="doctor-visual-badge">Practice · Patients · Follow-up</div>
          <aside className="doctor-flow-card" aria-label="Doctor Platform care flow">
            <strong>Built around the real care flow</strong>
            <div className="doctor-flow">
              <div className="doctor-flow-step"><b>Before consultation</b><span>Schedule, patient relationship and shared context.</span></div><span className="doctor-flow-arrow">→</span>
              <div className="doctor-flow-step"><b>During care</b><span>Keep the consultation focused with context nearby.</span></div><span className="doctor-flow-arrow">→</span>
              <div className="doctor-flow-step"><b>After consultation</b><span>Follow-up and the next care step stay visible.</span></div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  </section>;
}
