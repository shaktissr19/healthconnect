'use client';

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

  return <section className="doctor-platform-section" id="doctor-platform-story" aria-labelledby="doctor-platform-title">
    <style>{`
      .doctor-platform-section{font-family:'DM Sans',Arial,sans-serif;color:#10243C;background:#fff;padding:0 28px 88px;scroll-margin-top:92px}
      .doctor-platform-shell{max-width:1664px;margin:0 auto}
      .doctor-platform-head{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(390px,.72fr);gap:58px;align-items:end;margin-bottom:28px}
      .doctor-platform-label{font-size:13px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#2563EB;margin-bottom:10px}
      .doctor-platform-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.65rem,3.65vw,4.15rem);line-height:1.02;letter-spacing:-.052em;color:#0B2B45;margin:0}
      .doctor-platform-head p{font-size:18px;line-height:1.58;color:#35566A;margin:0 0 4px}

      .doctor-platform-canvas{position:relative;min-height:650px;overflow:hidden;border-radius:30px;border:1px solid #C9DDEC;background:linear-gradient(120deg,#EEF6FF 0%,#F7FBFF 42%,#E7F2FA 100%);box-shadow:0 20px 48px rgba(31,75,112,.09)}
      .doctor-platform-photo{position:absolute;right:0;top:0;width:55%;height:100%;object-fit:cover;object-position:center center;display:block}
      .doctor-platform-photo-shade{position:absolute;z-index:1;inset:0;background:linear-gradient(90deg,#EEF6FF 0%,#EEF6FF 40%,rgba(238,246,255,.91) 47%,rgba(238,246,255,.34) 58%,rgba(238,246,255,.05) 70%,rgba(238,246,255,0) 83%);pointer-events:none}
      .doctor-platform-copy{position:relative;z-index:3;width:48%;padding:48px 0 42px 52px;box-sizing:border-box}
      .doctor-platform-eyebrow{font-size:13px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#2563EB;margin-bottom:10px}
      .doctor-platform-copy h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,2.65vw,3.15rem);line-height:1.05;letter-spacing:-.045em;color:#0B2B45;margin:0;max-width:660px}
      .doctor-platform-intro{font-size:15.5px;line-height:1.58;color:#35566A;margin:14px 0 19px;max-width:650px}
      .doctor-platform-rule{width:48px;height:4px;border-radius:999px;background:#2563EB;margin-bottom:18px}

      .doctor-feature-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px;max-width:690px}
      .doctor-feature{min-height:130px;padding:15px 15px 14px;border-radius:17px;border:1px solid rgba(192,213,229,.88);box-shadow:0 8px 21px rgba(40,77,112,.055);background:#fff}
      .doctor-feature-top{display:flex;align-items:center;gap:10px}
      .doctor-feature-icon{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;flex:0 0 auto}
      .doctor-feature b{font-family:'Sora','DM Sans',sans-serif;font-size:13.3px;line-height:1.25;color:#16354A}
      .doctor-feature p{font-size:11.8px;line-height:1.45;color:#526B7B;margin:8px 0 0}

      .doctor-value-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;max-width:690px}
      .doctor-value{border-radius:15px;padding:12px 14px;background:rgba(255,255,255,.92);border:1px solid #CDDEEA}
      .doctor-value strong{display:block;font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:#2563EB;margin-bottom:4px}
      .doctor-value span{display:block;font-size:11.5px;line-height:1.42;color:#486275}
      .doctor-platform-cta{margin-top:15px;border:0;border-radius:10px;background:#2563EB;color:#fff;padding:12px 18px;font:900 13.5px 'DM Sans',Arial,sans-serif;cursor:pointer;box-shadow:0 8px 18px rgba(37,99,235,.18)}
      .doctor-platform-cta:hover{background:#1D4ED8;transform:translateY(-1px)}

      .doctor-flow-card{position:absolute;z-index:4;right:2.8%;bottom:4.8%;width:43%;border-radius:19px;padding:15px 16px;background:rgba(255,255,255,.94);border:1px solid rgba(205,222,234,.9);box-shadow:0 13px 30px rgba(25,61,80,.12);backdrop-filter:blur(7px)}
      .doctor-flow-card>strong{display:block;font-family:'Sora','DM Sans',sans-serif;font-size:13px;color:#15364D;margin-bottom:10px}
      .doctor-flow{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;align-items:center;gap:8px}
      .doctor-flow-step{min-width:0}
      .doctor-flow-step b{display:block;font-size:11.5px;color:#2563EB}
      .doctor-flow-step span{display:block;margin-top:3px;font-size:10.3px;line-height:1.35;color:#5A7180}
      .doctor-flow-arrow{color:#7A9AB0;font-weight:900;font-size:17px}

      @media(max-width:1180px){
        .doctor-platform-head{grid-template-columns:1fr;gap:12px}.doctor-platform-head p{max-width:820px}
        .doctor-platform-canvas{min-height:780px}.doctor-platform-photo{width:100%;height:48%;top:auto;bottom:0;object-position:center 42%}
        .doctor-platform-photo-shade{background:linear-gradient(180deg,#EEF6FF 0%,#EEF6FF 49%,rgba(238,246,255,.6) 58%,rgba(238,246,255,.08) 72%,transparent 100%)}
        .doctor-platform-copy{width:100%;padding:42px 48px 0}.doctor-feature-grid,.doctor-value-row{max-width:780px}
        .doctor-flow-card{right:4%;bottom:3.5%;width:55%}
      }
      @media(max-width:760px){
        .doctor-platform-section{padding:0 14px 70px}.doctor-platform-head h2{font-size:2.55rem}.doctor-platform-head p{font-size:16px}
        .doctor-platform-canvas{min-height:1080px;border-radius:24px}.doctor-platform-copy{padding:30px 22px 0}.doctor-platform-copy h3{font-size:2.2rem}.doctor-platform-intro{font-size:14px}
        .doctor-feature-grid,.doctor-value-row{grid-template-columns:1fr}.doctor-feature{min-height:0}.doctor-platform-photo{height:34%;object-position:center}
        .doctor-platform-photo-shade{background:linear-gradient(180deg,#EEF6FF 0%,#EEF6FF 62%,rgba(238,246,255,.52) 72%,transparent 100%)}
        .doctor-flow-card{left:18px;right:18px;width:auto;bottom:18px}.doctor-flow{grid-template-columns:1fr}.doctor-flow-arrow{display:none}.doctor-flow-step{padding:5px 0;border-top:1px solid #E2EAF0}.doctor-flow-step:first-of-type{border-top:0}
      }
      @media(max-width:460px){.doctor-platform-head h2{font-size:2.2rem}.doctor-platform-canvas{min-height:1190px}.doctor-platform-copy h3{font-size:1.95rem}.doctor-platform-photo{height:31%}}
    `}</style>

    <div className="doctor-platform-shell">
      <div className="doctor-platform-head">
        <div><div className="doctor-platform-label">Doctor Platform</div><h2 id="doctor-platform-title">A clearer practice journey for doctors.</h2></div>
        <p>HealthConnect helps doctors manage patients, availability, appointments, consultation context and follow-up without turning each task into a separate tool.</p>
      </div>

      <div className="doctor-platform-canvas">
        <img className="doctor-platform-photo" src="/images/doctors-intro.png" alt="Indian doctor in a modern clinic with a patient consultation in progress"/>
        <div className="doctor-platform-photo-shade" aria-hidden="true"/>

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
  </section>;
}
