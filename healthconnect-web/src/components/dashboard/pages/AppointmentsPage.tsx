'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import BookAppointmentModal from '@/components/dashboard/BookAppointmentModal';

const C={card:'#FFFFFF',border:'#E2EEF0',teal:'#0D9488',tealLight:'#14B8A6',tealBg:'#F0FDF9',text:'#0F2D2A',text2:'#4B6E6A',text3:'#64748B',red:'#EF4444',amber:'#F59E0B',green:'#22C55E',purple:'#8B5CF6'};
const card:React.CSSProperties={background:C.card,border:`1px solid ${C.border}`,borderRadius:16,boxShadow:'0 2px 8px rgba(27,59,111,.08)'};

type Appointment={
  id:string;doctorName:string;doctorInitials?:string;specialization:string;
  scheduledAt:string;type:'IN_PERSON'|'TELECONSULT'|'HOME_VISIT';
  status:'PENDING'|'CONFIRMED'|'COMPLETED'|'CANCELLED'|'NO_SHOW'|'RESCHEDULED';
  notes?:string;meetingLink?:string;reasonForVisit?:string;
};

const TYPE_LABEL:Record<string,{label:string;color:string;bg:string}>={
  IN_PERSON:{label:'In Person',color:'#3B82F6',bg:'rgba(59,130,246,.1)'},
  TELECONSULT:{label:'Video Call',color:'#8B5CF6',bg:'rgba(139,92,246,.1)'},
  HOME_VISIT:{label:'Home Visit',color:'#0D9488',bg:'rgba(13,148,136,.1)'},
};
const STATUS_STYLE:Record<string,{color:string;bg:string;border:string}>={
  CONFIRMED:{color:'#16A34A',bg:'rgba(22,163,74,.1)',border:'rgba(22,163,74,.25)'},
  PENDING:{color:'#D97706',bg:'rgba(217,119,6,.1)',border:'rgba(217,119,6,.25)'},
  RESCHEDULED:{color:'#D97706',bg:'rgba(217,119,6,.1)',border:'rgba(217,119,6,.25)'},
  COMPLETED:{color:C.text3,bg:'rgba(100,116,139,.1)',border:C.border},
  CANCELLED:{color:C.red,bg:'rgba(239,68,68,.1)',border:'rgba(239,68,68,.25)'},
  NO_SHOW:{color:C.red,bg:'rgba(239,68,68,.1)',border:'rgba(239,68,68,.25)'},
};

const toLocalInput=(value:string)=>{
  const date=new Date(value);
  const local=new Date(date.getTime()-date.getTimezoneOffset()*60000);
  return local.toISOString().slice(0,16);
};

export default function AppointmentsPage(){
  const [appts,setAppts]=useState<Appointment[]>([]);
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState<'Upcoming'|'Awaiting'|'Past'|'All'>('Upcoming');
  const [showBook,setShowBook]=useState(false);
  const [preselect,setPreselect]=useState<{id:string;name:string;spec:string}|null>(null);
  const [rescheduling,setRescheduling]=useState<Appointment|null>(null);
  const [rescheduleAt,setRescheduleAt]=useState('');
  const [actioning,setActioning]=useState(false);
  const [toast,setToast]=useState('');
  const [toastError,setToastError]=useState(false);

  const showToast=(msg:string,error=false)=>{setToast(msg);setToastError(error);window.setTimeout(()=>setToast(''),3200);};

  useEffect(()=>{
    if(typeof window==='undefined')return;
    const params=new URLSearchParams(window.location.search);
    const bookId=params.get('book');
    const bookName=params.get('doctorName');
    const specialty=params.get('specialty');
    if(bookId){setPreselect({id:bookId,name:bookName??'',spec:specialty??''});setShowBook(true);window.history.replaceState({},'',window.location.pathname);}
  },[]);

  const loadData=useCallback(async()=>{
    setLoading(true);
    try{
      const r:any=await api.get('/appointments');
      const raw=r?.data?.data?.appointments??r?.data?.appointments??r?.data?.data??r?.data??[];
      const normalized=(Array.isArray(raw)?raw:[]).map((a:any)=>({
        ...a,
        doctorName:a.doctorName??(a.doctor?`Dr. ${a.doctor.firstName??''} ${a.doctor.lastName??''}`.trim():'Doctor'),
        specialization:a.specialization??a.doctor?.specialization??'General Physician',
        meetingLink:a.meetingLink??undefined,
      }));
      setAppts(normalized);
    }catch(e:any){setAppts([]);showToast(e?.response?.data?.message??'Unable to load appointments.',true);}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{loadData();},[loadData]);
  useEffect(()=>{const handleBooked=()=>loadData();window.addEventListener('hcAppointmentBooked',handleBooked);return()=>window.removeEventListener('hcAppointmentBooked',handleBooked);},[loadData]);

  const handleCancel=async(id:string)=>{
    if(!confirm('Cancel this appointment?'))return;
    try{await api.put(`/appointments/${id}/cancel`,{reason:'Cancelled by patient'});showToast('✓ Appointment cancelled');await loadData();}
    catch(e:any){showToast(e?.response?.data?.message??'Failed to cancel appointment',true);}
  };

  const openReschedule=(appt:Appointment)=>{setRescheduling(appt);setRescheduleAt(toLocalInput(appt.scheduledAt));};
  const saveReschedule=async()=>{
    if(!rescheduling||!rescheduleAt)return;
    const date=new Date(rescheduleAt);
    if(Number.isNaN(date.getTime())||date.getTime()<=Date.now()){showToast('Choose a future date and time.',true);return;}
    setActioning(true);
    try{
      await api.put(`/appointments/${rescheduling.id}/reschedule`,{scheduledAt:date.toISOString(),reason:'Rescheduled by patient'});
      setRescheduling(null);setRescheduleAt('');showToast('✓ Appointment rescheduled and sent for confirmation');await loadData();
    }catch(e:any){showToast(e?.response?.data?.message??'Unable to reschedule appointment',true);}
    finally{setActioning(false);}
  };

  const now=new Date();
  const upcoming=appts.filter(a=>['CONFIRMED','PENDING','RESCHEDULED'].includes(a.status)&&new Date(a.scheduledAt)>=now);
  const awaiting=appts.filter(a=>['PENDING','RESCHEDULED'].includes(a.status));
  const confirmed=appts.filter(a=>a.status==='CONFIRMED');
  const completed=appts.filter(a=>a.status==='COMPLETED');
  const past=appts.filter(a=>['COMPLETED','CANCELLED','NO_SHOW'].includes(a.status));
  const displayed=filter==='Upcoming'?upcoming:filter==='Awaiting'?awaiting:filter==='Past'?past:appts;

  if(loading)return <div style={{display:'flex',flexDirection:'column',gap:20}}><div style={{height:36,width:240,borderRadius:10,background:'#E2EEF0',animation:'hcPulse 1.5s ease infinite'}}/><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>{[1,2,3,4].map(i=><div key={i} style={{height:100,borderRadius:16,background:'#EEF4F7',animation:'hcPulse 1.5s ease infinite'}}/>)}</div><style>{`@keyframes hcPulse{0%,100%{opacity:.6}50%{opacity:1}}`}</style></div>;

  return <div style={{display:'flex',flexDirection:'column',gap:28}}>
    {toast&&<div style={{position:'fixed',bottom:28,right:28,zIndex:9999,background:toastError?'#7F1D1D':'#0F2D2A',color:'#fff',padding:'12px 20px',borderRadius:12,fontSize:14,fontWeight:600,boxShadow:'0 8px 24px rgba(0,0,0,.3)',border:'1px solid rgba(20,184,166,.3)'}}>{toast}</div>}

    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}><div><h1 style={{fontSize:26,fontWeight:800,color:'#0A1628',margin:'0 0 6px'}}>📅 My Appointments</h1><p style={{color:'#5A7A9B',fontSize:14,margin:0}}>{upcoming.length} upcoming</p></div><button onClick={()=>setShowBook(true)} style={{padding:'10px 20px',borderRadius:10,border:'none',background:`linear-gradient(135deg,${C.teal},${C.tealLight})`,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 14px rgba(13,148,136,.35)'}}>+ Book Appointment</button></div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>{[
      {icon:'📅',label:'Upcoming',value:upcoming.length,color:C.teal},
      {icon:'⏳',label:'Pending',value:awaiting.length,color:C.amber},
      {icon:'✅',label:'Confirmed',value:confirmed.length,color:'#16A34A'},
      {icon:'✓',label:'Completed',value:completed.length,color:C.text3},
    ].map(k=><div key={k.label} style={{...card,padding:'20px 22px',display:'flex',flexDirection:'column',gap:8}}><div style={{fontSize:22}}>{k.icon}</div><div style={{fontSize:30,fontWeight:800,color:k.color,lineHeight:1}}>{k.value}</div><div style={{fontSize:13,fontWeight:600,color:C.text2}}>{k.label}</div></div>)}</div>

    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{(['Upcoming','Awaiting','Past','All'] as const).map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:'8px 16px',borderRadius:100,border:`1.5px solid ${filter===f?C.teal:C.border}`,background:filter===f?C.tealBg:C.card,color:filter===f?C.teal:C.text3,fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>{f}{f==='Awaiting'&&awaiting.length>0&&<span style={{background:C.amber,color:'#fff',borderRadius:100,fontSize:10,fontWeight:700,padding:'1px 6px',minWidth:18,textAlign:'center'}}>{awaiting.length}</span>}</button>)}</div><span style={{fontSize:13,color:C.text3}}>{displayed.length} appointment{displayed.length!==1?'s':''}</span></div>

    {displayed.length===0?<div style={{...card,padding:'48px 24px',textAlign:'center'}}><div style={{fontSize:40,marginBottom:16}}>📅</div><div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:8}}>No appointments found</div><div style={{fontSize:14,color:C.text3,marginBottom:20}}>{filter==='Upcoming'?"You don't have any upcoming appointments.":`No ${filter.toLowerCase()} appointments.`}</div><button onClick={()=>setShowBook(true)} style={{padding:'10px 24px',borderRadius:10,border:'none',background:`linear-gradient(135deg,${C.teal},${C.tealLight})`,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer'}}>+ Book Appointment</button></div>:<div style={{display:'flex',flexDirection:'column',gap:14}}>{displayed.map(appt=>{
      const dt=new Date(appt.scheduledAt);const st=STATUS_STYLE[appt.status]??STATUS_STYLE.PENDING;const tt=TYPE_LABEL[appt.type]??TYPE_LABEL.IN_PERSON;const initials=appt.doctorInitials??((appt.doctorName??'').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)||'DR');const isUpcoming=dt>now&&['CONFIRMED','PENDING','RESCHEDULED'].includes(appt.status);const canJoin=appt.type==='TELECONSULT'&&appt.status==='CONFIRMED'&&isUpcoming&&Boolean(appt.meetingLink);
      return <div key={appt.id} style={{...card,overflow:'hidden'}}><div style={{height:3,background:`linear-gradient(90deg,${C.teal},${C.tealLight})`}}/><div style={{padding:'20px 24px',display:'flex',alignItems:'center',gap:20,flexWrap:'wrap'}}>
        <div style={{textAlign:'center',minWidth:52,flexShrink:0}}><div style={{fontSize:26,fontWeight:800,color:C.teal,lineHeight:1}}>{dt.getDate()}</div><div style={{fontSize:12,fontWeight:600,color:C.text3}}>{dt.toLocaleString('en-IN',{month:'short'})}</div><div style={{fontSize:11,color:C.text3}}>{dt.getFullYear()}</div></div>
        <div style={{width:48,height:48,borderRadius:'50%',background:`linear-gradient(135deg,${C.teal},${C.tealLight})`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:15,flexShrink:0}}>{initials}</div>
        <div style={{flex:1,minWidth:180}}><div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:4}}>{appt.doctorName??'Doctor'}</div><div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:6}}><span style={{fontSize:13,color:C.text2}}>🩺 {appt.specialization}</span><span style={{fontSize:13,color:C.text3}}>⏰ {dt.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><span style={{padding:'3px 10px',borderRadius:100,fontSize:11,fontWeight:700,background:tt.bg,color:tt.color}}>{tt.label==='Video Call'?'📹 ':tt.label==='Home Visit'?'🏠 ':'🏥 '}{tt.label}</span><span style={{padding:'3px 10px',borderRadius:100,fontSize:11,fontWeight:700,background:st.bg,color:st.color,border:`1px solid ${st.border}`}}>{appt.status}</span></div>{appt.reasonForVisit&&<div style={{fontSize:12,color:C.text3,marginTop:6,fontStyle:'italic'}}>“{appt.reasonForVisit}”</div>}{appt.type==='TELECONSULT'&&appt.status==='CONFIRMED'&&isUpcoming&&!appt.meetingLink&&<div style={{fontSize:11,color:C.amber,marginTop:6}}>Video link is not available yet. Please contact the care team if the appointment is near.</div>}</div>
        <div style={{display:'flex',gap:8,flexShrink:0,flexWrap:'wrap',justifyContent:'flex-end'}}>{canJoin&&<a href={appt.meetingLink} target="_blank" rel="noreferrer" style={{padding:'9px 18px',borderRadius:9,textDecoration:'none',background:`linear-gradient(135deg,${C.teal},${C.tealLight})`,color:'#fff',fontSize:13,fontWeight:700}}>📹 Join Call</a>}{isUpcoming&&<><button onClick={()=>openReschedule(appt)} style={{padding:'9px 16px',borderRadius:9,border:`1.5px solid ${C.teal}`,background:'#fff',color:C.teal,fontSize:13,fontWeight:650,cursor:'pointer'}}>Reschedule</button><button onClick={()=>handleCancel(appt.id)} style={{padding:'9px 16px',borderRadius:9,border:'1.5px solid rgba(239,68,68,.25)',background:'transparent',color:C.red,fontSize:13,fontWeight:600,cursor:'pointer'}}>Cancel</button></>}</div>
      </div></div>;
    })}</div>}

    {showBook&&<BookAppointmentModal preselectedDoctorId={preselect?.id} onClose={()=>{setShowBook(false);setPreselect(null);}} onSuccess={()=>{setShowBook(false);setPreselect(null);loadData();showToast('✓ Appointment booked successfully');window.dispatchEvent(new CustomEvent('hcAppointmentBooked'));}}/>}

    {rescheduling&&<div onClick={e=>{if(e.target===e.currentTarget&&!actioning)setRescheduling(null);}} style={{position:'fixed',inset:0,zIndex:1100,background:'rgba(15,23,42,.62)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}><div style={{background:'#fff',borderRadius:16,padding:24,width:'100%',maxWidth:440,boxShadow:'0 24px 60px rgba(0,0,0,.25)'}}><div style={{display:'flex',justifyContent:'space-between',gap:12,marginBottom:18}}><div><div style={{fontSize:17,fontWeight:800,color:C.text}}>Reschedule appointment</div><div style={{fontSize:12,color:C.text3,marginTop:3}}>{rescheduling.doctorName} · the new time will require confirmation.</div></div><button onClick={()=>setRescheduling(null)} disabled={actioning} style={{border:'none',background:'none',fontSize:21,cursor:'pointer'}}>×</button></div><label style={{display:'block',fontSize:11,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:6}}>New date & time</label><input type="datetime-local" min={toLocalInput(new Date(Date.now()+60_000).toISOString())} value={rescheduleAt} onChange={e=>setRescheduleAt(e.target.value)} style={{width:'100%',padding:'10px 12px',boxSizing:'border-box',border:`1px solid ${C.border}`,borderRadius:9,fontSize:13,color:C.text,marginBottom:16}}/><div style={{display:'grid',gridTemplateColumns:'1fr 1.5fr',gap:9}}><button onClick={()=>setRescheduling(null)} disabled={actioning} style={{padding:10,border:`1px solid ${C.border}`,borderRadius:9,background:'#fff',color:C.text2,fontWeight:600,cursor:'pointer'}}>Cancel</button><button onClick={saveReschedule} disabled={actioning||!rescheduleAt} style={{padding:10,border:'none',borderRadius:9,background:`linear-gradient(135deg,${C.teal},${C.tealLight})`,color:'#fff',fontWeight:700,cursor:actioning?'wait':'pointer'}}>{actioning?'Saving…':'Save new time'}</button></div></div></div>}
  </div>;
}
