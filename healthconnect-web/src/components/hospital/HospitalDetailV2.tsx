'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PublicNavbar from '@/components/PublicNavbar';
import { api } from '@/lib/api';

const C={page:'#F0F4FF',card:'#fff',navy:'#0C1A3A',text:'#334155',muted:'#64748B',border:'#DFE7F5',teal:'#0D9488',blue:'#2563EB',green:'#15803D',red:'#DC2626',amber:'#B45309'};
const typeLabel:Record<string,string>={GOVERNMENT:'Government',PRIVATE:'Private',TRUST_NGO:'Trust / NGO',TEACHING:'Teaching Hospital',CHARITABLE:'Charitable',OTHER:'Other'};
const list=(v:unknown):string[]=>Array.isArray(v)?v.filter(Boolean).map(String):[];
const extract=(r:any)=>r?.data?.data??r?.data??null;

function nextDays(count=14){
  const shifted=new Date(Date.now()+330*60_000);
  const base=Date.UTC(shifted.getUTCFullYear(),shifted.getUTCMonth(),shifted.getUTCDate());
  return Array.from({length:count},(_,i)=>{
    const d=new Date(base+i*86400000);
    const key=`${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
    const display=new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',weekday:'short',day:'numeric',month:'short'}).format(new Date(`${key}T00:00:00+05:30`));
    return {key,display,dayOfWeek:d.getUTCDay()};
  });
}
const timeMinutes=(t:string)=>{const [h,m]=t.split(':').map(Number);return h*60+m;};
const timeLabel=(t:string)=>new Intl.DateTimeFormat('en-IN',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'Asia/Kolkata'}).format(new Date(`2026-01-01T${t}:00+05:30`));
const slotIso=(key:string,t:string)=>new Date(`${key}T${t}:00+05:30`).toISOString();

function generateSessions(rows:any[], dayOfWeek:number){
  const out:{time:string;duration:number}[]=[];
  rows.filter(r=>r.dayOfWeek===dayOfWeek&&r.isActive!==false).sort((a,b)=>timeMinutes(a.startTime)-timeMinutes(b.startTime)).forEach(row=>{
    const duration=Number(row.slotDuration??30); let cur=timeMinutes(row.startTime); const end=timeMinutes(row.endTime);
    while(cur+duration<=end){ const h=Math.floor(cur/60);const m=cur%60;out.push({time:`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,duration});cur+=duration; }
  });
  return out;
}

function Pill({children,tone='blue'}:{children:React.ReactNode;tone?:'blue'|'green'|'red'|'teal'|'amber'}){
  const map:any={blue:['#EFF6FF','#1D4ED8'],green:['#F0FDF4','#15803D'],red:['#FEF2F2','#DC2626'],teal:['#F0FDFA','#0F766E'],amber:['#FFFBEB','#B45309']};
  return <span style={{background:map[tone][0],color:map[tone][1],borderRadius:999,padding:'4px 9px',fontSize:10.5,fontWeight:800}}>{children}</span>;
}

function BookingPanel({hospital,doctor,onClose}:{hospital:any;doctor:any;onClose:()=>void}){
  const [data,setData]=useState<any>({availability:[],bookedSlots:[],configured:false});
  const [loading,setLoading]=useState(true); const [error,setError]=useState('');
  const days=useMemo(()=>nextDays(),[]); const [day,setDay]=useState(days[0]); const [slot,setSlot]=useState<any>(null);
  const [type,setType]=useState<'IN_PERSON'|'TELECONSULT'>('IN_PERSON'); const [reason,setReason]=useState(''); const [booking,setBooking]=useState(false); const [done,setDone]=useState<any>(null);
  useEffect(()=>{ api.get(`/hospitals/${hospital.id}/doctors/${doctor.id}/availability`).then(r=>setData(extract(r)||{})).catch((e:any)=>setError(e?.response?.data?.message??'Unable to load OPD schedule.')).finally(()=>setLoading(false)); },[hospital.id,doctor.id]);
  const slots=generateSessions(data.availability??[],day.dayOfWeek).map(s=>{
    const start=new Date(slotIso(day.key,s.time)); const end=new Date(start.getTime()+s.duration*60000);
    const booked=(data.bookedSlots??[]).some((b:any)=>{const bs=new Date(b.scheduledAt);const be=new Date(bs.getTime()+(b.durationMinutes??30)*60000);return start<be&&end>bs;});
    return {...s,booked,past:start.getTime()<=Date.now()};
  });
  const submit=async()=>{
    if(!slot||!reason.trim()){setError('Choose a time slot and enter the reason for visit.');return;}
    setBooking(true);setError('');
    try{const response=await api.post('/appointments',{doctorId:doctor.id,hospitalId:hospital.id,scheduledAt:slotIso(day.key,slot.time),durationMinutes:slot.duration,type,reasonForVisit:reason.trim(),symptoms:[]});setDone(extract(response));}
    catch(e:any){setError(e?.response?.data?.message??'Booking failed. Please sign in as a patient and try again.');}
    finally{setBooking(false);}
  };
  return <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(4,12,28,.72)',display:'grid',placeItems:'center',padding:16}}><div onClick={e=>e.stopPropagation()} style={{width:'min(680px,96vw)',maxHeight:'90vh',overflowY:'auto',background:'#fff',borderRadius:18,padding:24}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:12}}><div><h2 style={{margin:0,color:C.navy}}>Book OPD appointment</h2><div style={{fontSize:12,color:C.muted,marginTop:4}}>{hospital.name} · Dr. {doctor.firstName} {doctor.lastName}</div></div><button onClick={onClose} style={closeBtn}>×</button></div>
    {done?<div style={{padding:'40px 10px',textAlign:'center'}}><div style={{fontSize:42}}>✅</div><h3>Appointment requested</h3><p style={{color:C.muted}}>Your appointment is pending confirmation. It is now linked to {hospital.name}.</p><button onClick={onClose} style={primary}>Done</button></div>:<>
      {loading?<div style={{padding:35,textAlign:'center'}}>Loading OPD schedule…</div>:!data.configured?<div style={warn}>This doctor does not yet have a bookable OPD schedule at this hospital.</div>:<>
        <div style={{marginTop:18,fontSize:12,fontWeight:800,color:C.text}}>Consultation type</div>
        <div style={{display:'flex',gap:8,marginTop:8}}><button onClick={()=>setType('IN_PERSON')} style={choice(type==='IN_PERSON')}>🏥 In person</button>{hospital.teleconsultAvailable&&doctor.offersVideoConsult&&<button onClick={()=>setType('TELECONSULT')} style={choice(type==='TELECONSULT')}>📹 Video</button>}</div>
        <div style={{marginTop:18,fontSize:12,fontWeight:800,color:C.text}}>Date</div><div style={{display:'flex',gap:7,overflowX:'auto',padding:'8px 0'}}>{days.map(d=><button key={d.key} onClick={()=>{setDay(d);setSlot(null)}} style={choice(day.key===d.key)}>{d.display}</button>)}</div>
        <div style={{marginTop:12,fontSize:12,fontWeight:800,color:C.text}}>Available slots</div><div style={{display:'flex',gap:7,flexWrap:'wrap',marginTop:8}}>{slots.filter(s=>!s.booked&&!s.past).map(s=><button key={s.time} onClick={()=>setSlot(s)} style={choice(slot?.time===s.time)}>{timeLabel(s.time)}</button>)}{slots.filter(s=>!s.booked&&!s.past).length===0&&<span style={{fontSize:12,color:C.muted}}>No open slots on this date.</span>}</div>
        <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason for visit" rows={3} style={{width:'100%',boxSizing:'border-box',marginTop:18,border:`1px solid ${C.border}`,borderRadius:10,padding:11,fontFamily:'inherit'}}/>
        {error&&<div style={errorBox}>⚠ {error}</div>}
        <button disabled={booking||!slot} onClick={submit} style={{...primary,width:'100%',marginTop:14,opacity:booking||!slot?.65:1}}>{booking?'Booking…':'Request appointment'}</button>
      </>}
      {error&&!data.configured&&<div style={errorBox}>⚠ {error}</div>}
    </>}
  </div></div>;
}

export default function HospitalDetailV2(){
  const params=useParams();const router=useRouter();const id=String(params?.id??'');
  const [hospital,setHospital]=useState<any>(null);const [doctors,setDoctors]=useState<any[]>([]);const [departments,setDepartments]=useState<any[]>([]);const [reviews,setReviews]=useState<any[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [bookingDoc,setBookingDoc]=useState<any>(null);
  const [reviewOpen,setReviewOpen]=useState(false);const [rating,setRating]=useState(5);const [reviewTitle,setReviewTitle]=useState('');const [comment,setComment]=useState('');const [reviewing,setReviewing]=useState(false);
  const load=useCallback(async()=>{if(!id)return;setLoading(true);setError('');try{const [h,d,dep,r]=await Promise.all([api.get(`/hospitals/${id}`),api.get(`/hospitals/${id}/doctors`),api.get(`/hospitals/${id}/departments`),api.get(`/hospitals/${id}/reviews`)]);setHospital(extract(h));setDoctors(extract(d)??[]);setDepartments(extract(dep)??[]);setReviews(extract(r)??[]);}catch(e:any){setError(e?.response?.data?.message??'Hospital not found.');}finally{setLoading(false);}},[id]);
  useEffect(()=>{void load()},[load]);
  const submitReview=async()=>{setReviewing(true);try{await api.post(`/hospitals/${id}/reviews`,{rating,title:reviewTitle||undefined,comment:comment||undefined,isAnonymous:false});setReviewOpen(false);setReviewTitle('');setComment('');await load();}catch(e:any){setError(e?.response?.data?.message??'Unable to submit review.');}finally{setReviewing(false)}};
  if(loading)return <div style={{minHeight:'100vh',display:'grid',placeItems:'center',background:C.page}}>Loading hospital…</div>;
  if(!hospital)return <div style={{minHeight:'100vh',display:'grid',placeItems:'center',background:C.page}}><div><h2>{error||'Hospital not found'}</h2><button onClick={()=>router.push('/hospitals')} style={primary}>Back to hospitals</button></div></div>;
  const facilities=list(hospital.facilities),specialties=list(hospital.specialties),schemes=list(hospital.governmentSchemes),insurers=list(hospital.insuranceProviders),acc=list(hospital.accreditations);
  return <div style={{minHeight:'100vh',background:C.page,fontFamily:'Nunito,Arial,sans-serif'}}><PublicNavbar/>
    <section style={{padding:'105px 5% 34px',background:'linear-gradient(135deg,#0D1B4B,#0C4680 58%,#0D9488)',color:'#fff'}}><div style={{maxWidth:1050,margin:'0 auto'}}><button onClick={()=>router.push('/hospitals')} style={{...ghost,color:'#fff',borderColor:'rgba(255,255,255,.25)'}}>← All Hospitals</button><div style={{display:'flex',gap:20,alignItems:'center',marginTop:20,flexWrap:'wrap'}}><div style={{width:76,height:76,borderRadius:18,background:'rgba(255,255,255,.14)',display:'grid',placeItems:'center',fontSize:24,fontWeight:900,overflow:'hidden'}}>{hospital.logoUrl?<img src={hospital.logoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:'🏥'}</div><div style={{flex:1}}><div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><h1 style={{margin:0,fontSize:'clamp(25px,4vw,38px)'}}>{hospital.name}</h1><Pill tone="green">✓ HC Verified</Pill></div><div style={{color:'rgba(255,255,255,.7)',marginTop:7}}>{[hospital.addressLine1,hospital.city,hospital.state,hospital.pinCode].filter(Boolean).join(', ')}</div><div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:11}}>{hospital.hospitalType&&<Pill>{typeLabel[hospital.hospitalType]??hospital.hospitalType}</Pill>}{hospital.emergencyAvailable&&<Pill tone="red">Emergency</Pill>}{hospital.teleconsultAvailable&&<Pill tone="teal">Teleconsult</Pill>}{schemes.slice(0,2).map(x=><Pill key={x} tone="green">{x}</Pill>)}</div></div><div style={{textAlign:'right'}}>{hospital.averageRating>0&&<div style={{fontSize:24,fontWeight:900,color:'#FDE68A'}}>★ {Number(hospital.averageRating).toFixed(1)}</div>}<div style={{fontSize:11,color:'rgba(255,255,255,.6)'}}>{hospital.totalReviews||0} verified reviews</div></div></div></div></section>
    <main style={{maxWidth:1050,margin:'0 auto',padding:'28px 5% 64px'}}>{error&&<div style={errorBox}>⚠ {error}</div>}
      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 300px',gap:18,alignItems:'start'}}><div>
        <section style={card}><h2 style={h2}>About & services</h2><p style={{color:C.text,lineHeight:1.75}}>{hospital.about||'This verified hospital has not added an overview yet.'}</p><div style={grid3}>{[['Beds',hospital.totalBeds??'—'],['ICU beds',hospital.icuBeds??'—'],['Affiliated doctors',hospital.doctorCount??doctors.length],['Departments',hospital.departmentCount??departments.length],['OPD',hospital.opdTimings||'Contact hospital'],['Type',typeLabel[hospital.hospitalType]??hospital.hospitalType??'—']].map(([a,b])=><div key={String(a)} style={mini}><div style={{fontSize:10,color:C.muted,textTransform:'uppercase'}}>{a}</div><div style={{fontWeight:850,marginTop:4}}>{b}</div></div>)}</div></section>
        <section style={card}><h2 style={h2}>Specialties & departments</h2><div style={{display:'flex',gap:7,flexWrap:'wrap'}}>{specialties.map(x=><Pill key={x}>{x}</Pill>)}</div>{departments.length>0&&<div style={{marginTop:14,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:8}}>{departments.map(d=><div key={d.id} style={mini}><b>{d.name}</b>{d.headName&&<div style={{fontSize:11,color:C.muted,marginTop:3}}>Head: {d.headName}</div>}</div>)}</div>}</section>
        <section style={card}><h2 style={h2}>Doctors & OPD booking</h2>{doctors.length===0?<div style={{color:C.muted}}>No verified doctor affiliations are currently listed.</div>:<div style={{display:'grid',gap:9}}>{doctors.map(d=><div key={d.id} style={{...mini,display:'flex',alignItems:'center',gap:12}}><div style={{width:42,height:42,borderRadius:12,background:'#ECFDF5',display:'grid',placeItems:'center',fontWeight:850,color:C.teal}}>{d.firstName?.[0]}{d.lastName?.[0]}</div><div style={{flex:1}}><b>Dr. {d.firstName} {d.lastName}</b><div style={{fontSize:11,color:C.muted,marginTop:3}}>{d.specialization||'Doctor'}{d.department?` · ${d.department}`:''}{d.averageRating>0?` · ★ ${Number(d.averageRating).toFixed(1)}`:''}</div></div><button onClick={()=>setBookingDoc(d)} style={primary}>Book OPD</button></div>)}</div>}</section>
        <section style={card}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h2 style={h2}>Patient reviews</h2><button onClick={()=>setReviewOpen(true)} style={ghost}>Write review</button></div>{reviews.length===0?<div style={{color:C.muted,fontSize:12}}>No verified patient reviews yet.</div>:reviews.map(r=><div key={r.id} style={{padding:'12px 0',borderTop:`1px solid ${C.border}`}}><div style={{fontWeight:800,color:C.amber}}>★ {r.rating}/5 <span style={{color:C.navy}}>{r.title||''}</span></div><div style={{fontSize:12,color:C.text,marginTop:5}}>{r.comment}</div><div style={{fontSize:10,color:C.muted,marginTop:5}}>{r.authorName}{r.isVerified?' · Verified visit':''}</div></div>)}</section>
      </div><aside>
        <section style={card}><h2 style={h2}>Facilities</h2>{facilities.length?facilities.map(x=><div key={x} style={{fontSize:12,color:C.text,padding:'5px 0'}}>✓ {x}</div>):<div style={{fontSize:12,color:C.muted}}>Facilities not listed yet.</div>}</section>
        <section style={card}><h2 style={h2}>Accreditations</h2>{acc.length?acc.map(x=><Pill key={x} tone="green">{x}</Pill>):<div style={{fontSize:12,color:C.muted}}>Not listed</div>}</section>
        <section style={card}><h2 style={h2}>Insurance & schemes</h2>{insurers.length>0&&<><div style={{fontSize:10,color:C.muted,marginBottom:6}}>INSURANCE</div>{insurers.map(x=><div key={x} style={{fontSize:12,padding:'3px 0'}}>{x}</div>)}</>}{schemes.length>0&&<><div style={{fontSize:10,color:C.muted,margin:'12px 0 6px'}}>GOVERNMENT SCHEMES</div>{schemes.map(x=><div key={x} style={{fontSize:12,padding:'3px 0'}}>{x}</div>)}</>}{!insurers.length&&!schemes.length&&<div style={{fontSize:12,color:C.muted}}>Coverage not listed. Confirm directly with the hospital.</div>}</section>
        <section style={card}><h2 style={h2}>Contact</h2>{hospital.phone&&<div style={{fontSize:12,marginBottom:7}}>☎ {hospital.phone}</div>}{hospital.email&&<div style={{fontSize:12,wordBreak:'break-all'}}>✉ {hospital.email}</div>}{hospital.website&&<a href={hospital.website} target="_blank" rel="noreferrer" style={{fontSize:12,color:C.blue,display:'block',marginTop:8}}>Hospital website ↗</a>}</section>
      </aside></div>
    </main>
    {bookingDoc&&<BookingPanel hospital={hospital} doctor={bookingDoc} onClose={()=>setBookingDoc(null)}/>} 
    {reviewOpen&&<div onClick={()=>setReviewOpen(false)} style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(4,12,28,.7)',display:'grid',placeItems:'center',padding:16}}><div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:16,padding:22,width:'min(480px,95vw)'}}><div style={{display:'flex',justifyContent:'space-between'}}><h3 style={{margin:0}}>Review {hospital.name}</h3><button onClick={()=>setReviewOpen(false)} style={closeBtn}>×</button></div><div style={{marginTop:15}}>Rating <select value={rating} onChange={e=>setRating(Number(e.target.value))} style={input}>{[5,4,3,2,1].map(v=><option key={v} value={v}>{v} stars</option>)}</select></div><input value={reviewTitle} onChange={e=>setReviewTitle(e.target.value)} placeholder="Review title" style={{...input,marginTop:10}}/><textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Share your hospital experience" rows={4} style={{...input,marginTop:10,resize:'vertical'}}/><div style={{fontSize:11,color:C.muted,marginTop:8}}>Only patients with a completed appointment at this hospital can submit a verified review.</div><button disabled={reviewing} onClick={submitReview} style={{...primary,width:'100%',marginTop:12}}>{reviewing?'Submitting…':'Submit review'}</button></div></div>}
  </div>;
}

const card:React.CSSProperties={background:C.card,border:`1px solid ${C.border}`,borderRadius:15,padding:18,marginBottom:14,boxShadow:'0 2px 10px rgba(12,26,58,.04)'};
const h2:React.CSSProperties={fontSize:16,margin:'0 0 13px',color:C.navy};
const mini:React.CSSProperties={background:'#F8FAFC',border:`1px solid ${C.border}`,borderRadius:11,padding:11};
const grid3:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:8,marginTop:15};
const primary:React.CSSProperties={border:'none',borderRadius:9,padding:'9px 13px',background:'linear-gradient(135deg,#0F766E,#0D9488)',color:'#fff',fontWeight:750,fontSize:12,cursor:'pointer'};
const ghost:React.CSSProperties={border:`1px solid ${C.border}`,borderRadius:9,padding:'8px 12px',background:'#fff',color:C.text,fontWeight:700,fontSize:12,cursor:'pointer'};
const closeBtn:React.CSSProperties={border:'none',background:'#F1F5F9',borderRadius:8,width:32,height:32,fontSize:20,cursor:'pointer'};
const choice=(active:boolean):React.CSSProperties=>({border:`1px solid ${active?C.teal:C.border}`,background:active?'#F0FDFA':'#fff',color:active?C.teal:C.text,borderRadius:9,padding:'8px 11px',fontSize:12,fontWeight:700,cursor:'pointer'});
const input:React.CSSProperties={width:'100%',boxSizing:'border-box',border:`1px solid ${C.border}`,borderRadius:9,padding:10,fontFamily:'inherit'};
const warn:React.CSSProperties={padding:14,marginTop:15,borderRadius:10,background:'#FFFBEB',border:'1px solid #FDE68A',color:C.amber,fontSize:12};
const errorBox:React.CSSProperties={padding:11,marginTop:10,borderRadius:9,background:'#FFF1F2',border:'1px solid #FECDD3',color:C.red,fontSize:12};
