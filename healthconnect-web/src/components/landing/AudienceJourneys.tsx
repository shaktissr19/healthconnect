'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

type JourneyId = 'my-health'|'find-doctors'|'find-hospitals'|'doctor-dashboard'|'my-patients'|'consultations';
type Journey = {
  id: JourneyId;
  label: string;
  kicker: string;
  title: string;
  body: string;
  canDo: string[];
  works: string[];
  helps: string[];
  cta: string;
  href?: string;
  accent: string;
  wash: string;
  visual: 'health'|'doctor-search'|'hospital-search'|'doctor-dashboard'|'patients'|'consultations';
};

const PATIENT_JOURNEYS: Journey[] = [
  {
    id:'my-health', label:'My Health', kicker:'YOUR HEALTH, ORGANISED',
    title:'Carry your health story from one visit to the next.',
    body:'My Health brings your medical history, reports, prescriptions, medicines, symptoms, vitals and appointments into one private patient workspace.',
    canDo:['Store reports, prescriptions and medical history','Track medicines, symptoms and vitals','Manage appointments and follow-ups'],
    works:['Create your secure patient account','Add or update records as your care changes','Return to one timeline before your next visit'],
    helps:['Less searching for old health information','Better prepared conversations with doctors','More continuity between appointments'],
    cta:'Open My Health', accent:'#0D9488', wash:'#ECF9F6', visual:'health',
  },
  {
    id:'find-doctors', label:'Find Doctors', kicker:'CARE DISCOVERY',
    title:'Find the right doctor with more context before you book.',
    body:'Browse HealthConnect doctor profiles by specialty and location, review practice information and availability, then move into the appointment journey.',
    canDo:['Search by specialty and location','Review doctor profiles and consultation options','Move from discovery into booking'],
    works:['Choose the care you are looking for','Compare relevant doctor profiles','Select an available consultation option'],
    helps:['Less calling around to find care','More informed choice before booking','A smoother path from search to appointment'],
    cta:'Find Doctors', href:'/doctors', accent:'#2563EB', wash:'#EDF5FF', visual:'doctor-search',
  },
  {
    id:'find-hospitals', label:'Find Hospitals', kicker:'KNOW BEFORE YOU GO',
    title:'Compare hospitals before deciding where to visit.',
    body:'See hospital profiles, departments, facilities, affiliated doctors and hospital-specific OPD information in one discovery experience.',
    canDo:['Compare departments and facilities','Review affiliated doctors and OPD information','Check available insurance or scheme information where listed'],
    works:['Search the hospital directory','Open a hospital profile for more detail','Move into doctor or OPD discovery from the same journey'],
    helps:['More context before travelling to a facility','Easier comparison across hospitals','Fewer disconnected steps when choosing care'],
    cta:'Find Hospitals', href:'/hospitals', accent:'#EA580C', wash:'#FFF4EA', visual:'hospital-search',
  },
];

const DOCTOR_JOURNEYS: Journey[] = [
  {
    id:'doctor-dashboard', label:'Doctor Dashboard', kicker:'DIGITAL PRACTICE',
    title:'One workspace for your patients, schedule and practice.',
    body:'The Doctor workspace connects your professional profile, availability, appointments, consultations and patient-shared context without mixing them into separate tools.',
    canDo:['Manage availability and appointments','Work with patient-shared health context','Keep profile and practice workflows together'],
    works:['Set up your Doctor profile and availability','Receive and manage appointment activity','Use the workspace through the consultation and follow-up journey'],
    helps:['Less fragmented practice administration','Better continuity with returning patients','A clearer view of daily care activity'],
    cta:'Open Doctor Workspace', accent:'#2563EB', wash:'#EEF5FF', visual:'doctor-dashboard',
  },
  {
    id:'my-patients', label:'My Patients', kicker:'PATIENT CONTEXT',
    title:'See the patient context shared with you for care.',
    body:'My Patients is the Doctor-side view for patient relationships and the health information patients have shared through the platform.',
    canDo:['See patient summaries and relevant history','Move between patient and appointment context','Keep follow-up activity tied to the patient journey'],
    works:['Patient connects through HealthConnect','Relevant information is shared through authorised workflows','Doctor reviews context alongside appointment activity'],
    helps:['Less re-collection of the same information','More organised follow-up','Stronger continuity across repeat consultations'],
    cta:'Open My Patients', accent:'#0E7490', wash:'#ECF8FB', visual:'patients',
  },
  {
    id:'consultations', label:'Consultations', kicker:'FROM SCHEDULE TO FOLLOW-UP',
    title:'Appointments and consultations stay part of the same care workflow.',
    body:'Scheduling is not a separate HealthConnect product. It is built into the Patient and Doctor journeys so discovery, booking, consultation and follow-up stay connected.',
    canDo:['Review upcoming appointments','Move consultation status through the care journey','Keep follow-up linked to the patient and visit'],
    works:['Patient books from Doctor or Hospital discovery','Doctor manages the appointment in the workspace','Both sides return to their own history and follow-up context'],
    helps:['One connected appointment lifecycle','Clearer hand-off from booking to consultation','Less duplication across separate scheduling tools'],
    cta:'Join as a Doctor', accent:'#7C3AED', wash:'#F5F0FF', visual:'consultations',
  },
];

function Visual({type,accent}:{type:Journey['visual'];accent:string}){
  if(type==='health') return <div className="aj-device-stage">
    <div className="aj-screen desktop"><div className="aj-screen-head"><b>Good morning</b><span>My Health</span></div><div className="aj-kpis"><i>Health Score<strong>82</strong></i><i>Upcoming<strong>2</strong></i><i>Reports<strong>8</strong></i></div><div className="aj-lines"><span/><span/><span/><span/></div></div>
    <div className="aj-phone"><b>Health Timeline</b><span>Blood test report</span><span>Prescription added</span><span>Follow-up visit</span><em>View full timeline</em></div>
  </div>;
  if(type==='doctor-search') return <div className="aj-directory"><div className="aj-search">Search specialty or doctor</div>{['Cardiologist','General Physician','Dermatologist'].map((x,i)=><div className="aj-doctor-row" key={x}><span className="aj-avatar">{i===0?'RK':i===1?'SM':'AK'}</span><div><b>{x}</b><small>{i===0?'15 yrs experience · Video / Clinic':i===1?'Available today · Clinic':'Profile & availability'}</small></div><button>View</button></div>)}</div>;
  if(type==='hospital-search') return <div className="aj-hospital"><div className="aj-hospital-photo">HOSPITAL</div><div className="aj-hospital-body"><b>Compare Hospital Profiles</b><div className="aj-chiprow"><span>Cardiology</span><span>Orthopaedics</span><span>24×7 Emergency</span></div><div className="aj-lines"><span/><span/><span/></div><button>View hospital details</button></div></div>;
  if(type==='doctor-dashboard') return <div className="aj-workspace"><aside><b>HC</b><span>Overview</span><span>My Patients</span><span>Appointments</span><span>Consultations</span><span>Reports</span></aside><main><div className="aj-screen-head"><b>Today&apos;s practice</b><span>Doctor workspace</span></div><div className="aj-kpis"><i>Appointments<strong>12</strong></i><i>Patients<strong>8</strong></i><i>Follow-ups<strong>4</strong></i></div><div className="aj-table"><span>09:30 · Consultation</span><span>10:00 · Follow-up</span><span>10:30 · Consultation</span><span>11:15 · New patient</span></div></main></div>;
  if(type==='patients') return <div className="aj-patient-list"><div className="aj-screen-head"><b>My Patients</b><span>Shared care context</span></div>{['Ramesh Kumar','Sunita Patel','Aisha Shah','Manoj Verma'].map((x,i)=><div className="aj-doctor-row" key={x}><span className="aj-avatar">{x.split(' ').map(v=>v[0]).join('')}</span><div><b>{x}</b><small>{i%2?'Follow-up · Reports shared':'Upcoming visit · History available'}</small></div><button>Open</button></div>)}</div>;
  return <div className="aj-consult"><div className="aj-flow"><span>Discover</span><i>→</i><span>Book</span><i>→</i><span>Consult</span><i>→</i><span>Follow-up</span></div><div className="aj-appointment-card"><small>TODAY</small><b>10:30 AM · Consultation</b><p>Appointment, patient context and follow-up stay connected.</p><button style={{background:accent}}>Open appointment</button></div></div>;
}

function AudienceSection({kind,items}:{kind:'patient'|'doctor';items:Journey[]}){
  const [activeId,setActiveId]=useState(items[0].id);
  const active=items.find(x=>x.id===activeId) || items[0];
  const router=useRouter();
  const {user,isAuthenticated}=useAuthStore();
  const {openAuthModal}=useUIStore();

  const act=()=>{
    if(active.href){router.push(active.href);return;}
    if(kind==='patient'){
      if(!isAuthenticated||!user){try{sessionStorage.setItem('hc_post_login_redirect','/dashboard')}catch{};openAuthModal('login');return;}
      const role=String(user.role||'').toUpperCase();
      router.push(role==='PATIENT'?'/dashboard':role==='DOCTOR'?'/doctor-dashboard':role==='HOSPITAL'?'/hospital-dashboard':'/admin-dashboard');
      return;
    }
    if(isAuthenticated&&user){const role=String(user.role||'').toUpperCase();router.push(role==='DOCTOR'?'/doctor-dashboard':role==='PATIENT'?'/dashboard':role==='HOSPITAL'?'/hospital-dashboard':'/admin-dashboard');return;}
    try{sessionStorage.setItem('hc_signup_role','DOCTOR')}catch{}
    openAuthModal('register');
  };

  return <section className={`aj-audience ${kind}`}>
    <div className="aj-audience-label">{kind==='patient'?'For Patients & Families':'For Doctors'}</div>
    <div className="aj-tabs" role="tablist">
      {items.map(item=><button key={item.id} role="tab" aria-selected={active.id===item.id} className={active.id===item.id?'active':''} onClick={()=>setActiveId(item.id)} style={active.id===item.id?{borderColor:item.accent,color:item.accent,boxShadow:`inset 0 -3px ${item.accent}`}:{}}>{item.label}</button>)}
    </div>
    <div className="aj-panel" style={{background:`linear-gradient(120deg,${active.wash} 0%,#FFFFFF 72%)`,borderColor:`${active.accent}24`}}>
      <div className="aj-visual"><Visual type={active.visual} accent={active.accent}/></div>
      <div className="aj-copy">
        <div className="aj-kicker" style={{color:active.accent}}>{active.kicker}</div>
        <h3>{active.title}</h3><p className="aj-body">{active.body}</p>
        <div className="aj-detail-grid">
          <div><b>What you can do</b>{active.canDo.map(x=><span key={x}>✓ {x}</span>)}</div>
          <div><b>How it works</b>{active.works.map((x,i)=><span key={x}><em>{i+1}</em>{x}</span>)}</div>
          <div><b>Why it helps</b>{active.helps.map(x=><span key={x}>○ {x}</span>)}</div>
        </div>
        <button className="aj-cta" onClick={act} style={{background:active.accent}}>{active.cta} →</button>
      </div>
    </div>
  </section>;
}

export default function AudienceJourneys(){
  return <section className="aj-wrap" id="platform-tour">
    <style>{`
      .aj-wrap{font-family:'DM Sans',Arial,sans-serif;background:linear-gradient(180deg,#F7FBFA 0%,#F2F8FC 45%,#F8FAFD 100%);padding:58px 28px 68px;color:#10233C;border-top:1px solid #DCEBE8;border-bottom:1px solid #DCE7EE}.aj-head{max-width:1280px;margin:0 auto 32px;display:flex;justify-content:space-between;align-items:end;gap:36px}.aj-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.4rem,3.8vw,4.15rem);letter-spacing:-.05em;line-height:1.01;margin:0;max-width:760px}.aj-head p{max-width:410px;margin:0;color:#587087;font-size:14px;line-height:1.6}.aj-audience{max-width:1280px;margin:0 auto 30px}.aj-audience-label{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.15em;margin:0 0 10px}.aj-audience.patient .aj-audience-label{color:#0D9488}.aj-audience.doctor .aj-audience-label{color:#2563EB}.aj-tabs{display:flex;gap:8px;margin-bottom:10px}.aj-tabs button{flex:1;min-height:54px;border:1px solid #D9E6E9;background:rgba(255,255,255,.86);border-radius:12px;padding:10px 14px;color:#36556D;font-size:12px;font-weight:850;cursor:pointer;transition:.16s}.aj-tabs button:hover{background:#fff;transform:translateY(-1px)}.aj-tabs button.active{background:#fff}.aj-panel{display:grid;grid-template-columns:minmax(360px,.92fr) minmax(0,1.08fr);gap:38px;border:1px solid;border-radius:22px;padding:32px;box-shadow:0 14px 34px rgba(25,61,79,.07);min-height:430px}.aj-visual{display:flex;align-items:center;justify-content:center;min-height:360px}.aj-copy{display:flex;flex-direction:column;justify-content:center}.aj-kicker{font-size:10px;font-weight:900;letter-spacing:.15em;text-transform:uppercase;margin-bottom:8px}.aj-copy h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,2.8vw,3rem);line-height:1.04;letter-spacing:-.04em;margin:0 0 12px;color:#0B1D32}.aj-body{font-size:14px;line-height:1.6;color:#567086;margin:0 0 20px;max-width:660px}.aj-detail-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-bottom:22px}.aj-detail-grid>div{border-left:1px solid #D7E6EA;padding-left:15px}.aj-detail-grid b{display:block;color:#173B52;font-size:11px;margin-bottom:9px}.aj-detail-grid span{display:flex;gap:7px;color:#537086;font-size:10.5px;line-height:1.45;margin:0 0 8px}.aj-detail-grid em{font-style:normal;width:18px;height:18px;flex:0 0 18px;border-radius:50%;display:grid;place-items:center;background:#E6F1F4;color:#28536B;font-size:9px;font-weight:900}.aj-cta{align-self:flex-start;border:0;border-radius:10px;color:#fff;padding:11px 16px;font-size:11px;font-weight:900;cursor:pointer;box-shadow:0 7px 16px rgba(26,66,88,.12)}
      .aj-device-stage{position:relative;width:100%;max-width:470px;height:315px}.aj-screen{background:#fff;border:1px solid #CFE0E5;border-radius:14px;box-shadow:0 15px 35px rgba(36,68,84,.12)}.aj-screen.desktop{position:absolute;left:0;top:20px;width:78%;height:260px;padding:18px}.aj-screen-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid #EAF0F2;color:#17384E;font-size:11px}.aj-screen-head span{font-size:9px;color:#7890A0}.aj-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:15px 0}.aj-kpis i{font-style:normal;font-size:8px;color:#708799;background:#F7FAFB;border:1px solid #E7EEF1;border-radius:8px;padding:9px}.aj-kpis strong{display:block;font-size:20px;color:#0D9488;margin-top:4px}.doctor .aj-kpis strong{color:#2563EB}.aj-lines{display:grid;gap:9px}.aj-lines span{height:11px;border-radius:5px;background:linear-gradient(90deg,#E8F2F3 0 70%,transparent 70%)}.aj-phone{position:absolute;right:0;bottom:0;width:36%;height:245px;background:#fff;border:5px solid #182A38;border-radius:25px;padding:22px 10px 12px;box-shadow:0 15px 30px rgba(26,55,70,.16);display:flex;flex-direction:column;gap:11px}.aj-phone b{font-size:10px;color:#13364C}.aj-phone span{font-size:8px;padding:7px;border-radius:7px;background:#F4F8FA;color:#5D7486}.aj-phone em{font-style:normal;font-size:8px;font-weight:800;color:#0D9488;margin-top:auto}.aj-directory,.aj-patient-list{width:100%;max-width:470px;background:#fff;border:1px solid #D8E5E9;border-radius:16px;padding:18px;box-shadow:0 15px 34px rgba(25,61,79,.10)}.aj-search{border:1px solid #DCE7EA;border-radius:9px;padding:10px 12px;color:#8AA0AE;font-size:9px;margin-bottom:10px}.aj-doctor-row{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:11px 0;border-bottom:1px solid #EEF3F5}.aj-avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#E9F6F2;color:#0D9488;font-size:10px;font-weight:900}.doctor .aj-avatar{background:#EAF2FF;color:#2563EB}.aj-doctor-row b{display:block;font-size:10px;color:#17384E}.aj-doctor-row small{display:block;margin-top:3px;font-size:8px;color:#7B909F}.aj-doctor-row button,.aj-hospital button{border:1px solid #C9DFDB;background:#fff;border-radius:7px;padding:6px 9px;color:#0D9488;font-size:8px;font-weight:850}.aj-hospital{width:100%;max-width:470px;border-radius:17px;overflow:hidden;background:#fff;border:1px solid #E4DFDA;box-shadow:0 15px 35px rgba(72,57,41,.10)}.aj-hospital-photo{height:145px;background:linear-gradient(145deg,#DDEAF0,#AFC7D4);display:grid;place-items:center;color:#52748A;letter-spacing:.18em;font-size:12px;font-weight:900}.aj-hospital-body{padding:18px}.aj-hospital-body>b{font-family:'Sora',sans-serif;font-size:16px;color:#17384E}.aj-chiprow{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}.aj-chiprow span{font-size:8px;padding:5px 7px;border-radius:999px;background:#FFF4EA;color:#B45309}.aj-workspace{width:100%;max-width:490px;min-height:300px;display:grid;grid-template-columns:105px 1fr;background:#fff;border:1px solid #D7E3EA;border-radius:16px;overflow:hidden;box-shadow:0 16px 36px rgba(35,68,91,.12)}.aj-workspace aside{background:#EFF5FB;padding:16px 12px;display:flex;flex-direction:column;gap:13px;color:#537087;font-size:8px}.aj-workspace aside b{font-size:14px;color:#2563EB}.aj-workspace main{padding:18px}.aj-table{display:grid;gap:8px}.aj-table span{background:#F7FAFD;border:1px solid #E7EEF4;border-radius:7px;padding:8px;color:#506D84;font-size:8px}.aj-consult{width:100%;max-width:470px}.aj-flow{display:flex;align-items:center;justify-content:center;gap:7px;flex-wrap:wrap;margin-bottom:25px}.aj-flow span{background:#fff;border:1px solid #DDD7EB;border-radius:999px;padding:9px 12px;color:#5B4E79;font-size:9px;font-weight:850}.aj-flow i{font-style:normal;color:#9A8DB8}.aj-appointment-card{max-width:330px;margin:auto;background:#fff;border:1px solid #DFD8ED;border-radius:16px;padding:22px;box-shadow:0 15px 34px rgba(75,55,106,.10)}.aj-appointment-card small{color:#7C3AED;font-weight:900}.aj-appointment-card b{display:block;margin:8px 0;color:#1D2940}.aj-appointment-card p{font-size:10px;line-height:1.5;color:#667A8C}.aj-appointment-card button{border:0;color:#fff;border-radius:8px;padding:9px 11px;font-size:9px;font-weight:850}
      @media(max-width:980px){.aj-head{align-items:start;flex-direction:column;gap:10px}.aj-panel{grid-template-columns:1fr}.aj-visual{min-height:300px}.aj-detail-grid{grid-template-columns:1fr 1fr 1fr}}
      @media(max-width:680px){.aj-wrap{padding:42px 12px 50px}.aj-head h2{font-size:2.55rem}.aj-tabs{overflow-x:auto}.aj-tabs button{min-width:145px}.aj-panel{padding:22px;border-radius:17px}.aj-detail-grid{grid-template-columns:1fr}.aj-detail-grid>div{border-left:0;border-top:1px solid #D7E6EA;padding:12px 0 0}.aj-visual{min-height:260px}.aj-device-stage{transform:scale(.86);transform-origin:center}.aj-copy h3{font-size:2.1rem}}
    `}</style>
    <div className="aj-head"><div><h2>See how HealthConnect helps in real healthcare journeys.</h2></div><p>Instead of repeating feature lists, each section shows the job HealthConnect does for the person using it — and where appointments fit into that journey.</p></div>
    <AudienceSection kind="patient" items={PATIENT_JOURNEYS}/>
    <AudienceSection kind="doctor" items={DOCTOR_JOURNEYS}/>
  </section>;
}
