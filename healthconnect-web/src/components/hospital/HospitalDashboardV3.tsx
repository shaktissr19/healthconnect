'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import SessionTimeoutManager from '@/components/SessionTimeoutManager';

const C = {
  page: '#F5F4F0', card: '#FFFFFF', border: '#DDE7E5', teal: '#0D9488', tealDark: '#0F766E',
  navy: '#0F172A', text: '#334155', muted: '#64748B', soft: '#ECF8F6', red: '#BE123C',
  amber: '#B45309', green: '#15803D', blue: '#1D4ED8', violet: '#6D28D9',
};

type Tab = 'overview' | 'profile' | 'facilities' | 'doctors' | 'departments' | 'appointments' | 'verification' | 'analytics';
const extract = (r: any) => r?.data?.data ?? r?.data ?? null;
const csv = (value: string) => value.split(',').map(x => x.trim()).filter(Boolean);
const csvText = (value: any) => Array.isArray(value) ? value.join(', ') : '';
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const typeLabel: Record<string,string> = {GOVERNMENT:'Government',PRIVATE:'Private',TRUST_NGO:'Trust / NGO',TEACHING:'Teaching Hospital',CHARITABLE:'Charitable',OTHER:'Other'};

const FACILITY_CATALOG = [
  { category: 'Emergency & Critical Care', items: ['24×7 Emergency','Trauma Centre','ICU','CCU','NICU','PICU'] },
  { category: 'Diagnostics', items: ['MRI','CT Scan','X-Ray','Ultrasound','Mammography','ECG','Echocardiography'] },
  { category: 'Laboratory', items: ['Pathology Lab','Microbiology Lab','Biochemistry Lab','Sample Collection'] },
  { category: 'Treatment & Procedures', items: ['Dialysis','Chemotherapy','Physiotherapy','Day Care','Endoscopy'] },
  { category: 'Surgery & Admission', items: ['Operation Theatre','General Ward','Private Rooms','Day-care Surgery','Post-operative Care'] },
  { category: 'Pharmacy & Blood', items: ['24×7 Pharmacy','Blood Bank','Blood Component Services'] },
  { category: 'Patient Support', items: ['Ambulance','Parking','Cafeteria','Patient Helpdesk','International Patient Desk'] },
  { category: 'Accessibility', items: ['Wheelchair Access','Accessible Toilets','Lifts','Sign-language Assistance'] },
  { category: 'Digital Care', items: ['Online Appointment Booking','Teleconsultation','Digital Reports','Patient Portal'] },
];

function Button({children,onClick,disabled,danger=false,ghost=false}:{children:React.ReactNode;onClick?:()=>void;disabled?:boolean;danger?:boolean;ghost?:boolean}) {
  return <button onClick={onClick} disabled={disabled} style={{
    border: ghost ? `1px solid ${C.border}` : 'none', borderRadius: 9, padding: '8px 12px',
    fontWeight: 750, fontSize: 12, cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? '#CBD5E1' : ghost ? '#fff' : danger ? C.red : `linear-gradient(135deg,${C.tealDark},${C.teal})`,
    color: ghost ? C.text : '#fff',
  }}>{children}</button>;
}

function Stat({label,value,sub,tone}:{label:string;value:any;sub?:string;tone?:string}) {
  return <div style={{...card,borderTop:`3px solid ${tone || C.teal}`}}>
    <div style={labelStyle}>{label}</div><div style={{fontSize:27,fontWeight:900,marginTop:7,color:C.navy}}>{value ?? 0}</div>
    {sub && <div style={{fontSize:11,color:C.muted,marginTop:5}}>{sub}</div>}
  </div>;
}

function Input({label,value,onChange,type='text',placeholder}:{label:string;value:any;onChange:(v:string)=>void;type?:string;placeholder?:string}) {
  return <label><span style={labelStyle}>{label}</span><input type={type} value={value ?? ''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={input}/></label>;
}

function Textarea({label,value,onChange,rows=3}:{label:string;value:string;onChange:(v:string)=>void;rows?:number}) {
  return <label><span style={labelStyle}>{label}</span><textarea value={value} onChange={e=>onChange(e.target.value)} rows={rows} style={{...input,resize:'vertical'}}/></label>;
}

function Status({value}:{value:string}) {
  const map:any={VERIFIED:[C.green,'#DCFCE7'],SUBMITTED:[C.blue,'#DBEAFE'],UNDER_REVIEW:[C.violet,'#EDE9FE'],REJECTED:[C.red,'#FFE4E6'],SUSPENDED:[C.red,'#FFE4E6'],PENDING:[C.amber,'#FEF3C7'],ACCEPTED:[C.green,'#DCFCE7'],REVOKED:[C.red,'#FFE4E6'],CONFIRMED:[C.blue,'#DBEAFE'],CHECKED_IN:[C.tealDark,'#CCFBF1'],IN_PROGRESS:[C.violet,'#EDE9FE'],COMPLETED:[C.green,'#DCFCE7'],CANCELLED:[C.red,'#FFE4E6'],NO_SHOW:[C.amber,'#FEF3C7'],RESCHEDULED:[C.blue,'#DBEAFE']};
  const [color,bg]=map[value] ?? [C.muted,'#F1F5F9'];
  return <span style={{fontSize:10,fontWeight:800,padding:'4px 8px',borderRadius:999,color,background:bg,whiteSpace:'nowrap'}}>{String(value).replaceAll('_',' ')}</span>;
}

const initialForm:any={name:'',phone:'',email:'',website:'',logoUrl:'',about:'',hospitalType:'',addressLine1:'',city:'',state:'',pinCode:'',latitude:'',longitude:'',totalBeds:'',icuBeds:'',opdTimings:'',specialties:'',accreditations:'',facilities:'',insuranceProviders:'',governmentSchemes:'',registrationNumber:'',registrationAuthority:'',authorizedContactName:'',authorizedContactPhone:'',emergencyAvailable:false,teleconsultAvailable:false};
function hydrate(profile:any){return {...initialForm,name:profile?.name??'',phone:profile?.phone??'',email:profile?.email??'',website:profile?.website??'',logoUrl:profile?.logoUrl??'',about:profile?.about??'',hospitalType:profile?.hospitalType??'',addressLine1:profile?.addressLine1??'',city:profile?.city??'',state:profile?.state??'',pinCode:profile?.pinCode??'',latitude:profile?.latitude?.toString?.()??'',longitude:profile?.longitude?.toString?.()??'',totalBeds:profile?.totalBeds?.toString?.()??'',icuBeds:profile?.icuBeds?.toString?.()??'',opdTimings:profile?.opdTimings??'',specialties:csvText(profile?.specialties),accreditations:csvText(profile?.accreditations),facilities:csvText(profile?.facilities),insuranceProviders:csvText(profile?.insuranceProviders),governmentSchemes:csvText(profile?.governmentSchemes),registrationNumber:profile?.registrationNumber??'',registrationAuthority:profile?.registrationAuthority??'',authorizedContactName:profile?.authorizedContactName??'',authorizedContactPhone:profile?.authorizedContactPhone??'',emergencyAvailable:Boolean(profile?.emergencyAvailable),teleconsultAvailable:Boolean(profile?.teleconsultAvailable)};}

export default function HospitalDashboardV3(){
  const router=useRouter();
  const once=useRef(false);
  const [authReady,setAuthReady]=useState(false);
  const [tab,setTab]=useState<Tab>('overview');
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [toast,setToast]=useState('');
  const [dashboard,setDashboard]=useState<any>(null);
  const [profileUser,setProfileUser]=useState<any>(null);
  const [doctors,setDoctors]=useState<any[]>([]);
  const [departments,setDepartments]=useState<any[]>([]);
  const [appointments,setAppointments]=useState<any[]>([]);
  const [verification,setVerification]=useState<any>(null);
  const [analytics,setAnalytics]=useState<any>(null);
  const [form,setForm]=useState<any>(initialForm);
  const [facilitySearch,setFacilitySearch]=useState('');
  const [customFacility,setCustomFacility]=useState('');
  const [doctorForm,setDoctorForm]=useState({email:'',department:'',isPrimary:false});
  const [depForm,setDepForm]=useState({name:'',headName:'',phone:''});
  const [verificationDocs,setVerificationDocs]=useState('');
  const [scheduleDoctor,setScheduleDoctor]=useState<any>(null);
  const [schedule,setSchedule]=useState<any[]>([]);

  useEffect(()=>{
    if(once.current)return; once.current=true;
    const resolve=(s:any)=>{if(s.isAuthenticated&&s.user?.role==='HOSPITAL')setAuthReady(true);else if(s.isAuthenticated)router.replace('/dashboard');else router.replace('/');};
    const s=useAuthStore.getState() as any;
    if(s._hasHydrated){resolve(s);return;}
    let done=false;
    const unsub=(useAuthStore as any).subscribe((n:any)=>{if(!done&&n._hasHydrated){done=true;unsub();resolve(n)}});
    const timer=setTimeout(()=>{if(!done){done=true;unsub();resolve(useAuthStore.getState() as any)}},1200);
    return()=>{clearTimeout(timer);unsub()};
  },[router]);

  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{
      const [dash,p,d,dep,a,v,an]=await Promise.all([
        api.get('/hospitals/dashboard'),api.get('/hospitals/profile/me'),api.get('/hospitals/doctors'),
        api.get('/hospitals/departments'),api.get('/hospitals/appointments?limit=100'),api.get('/hospitals/verification'),api.get('/hospitals/analytics')
      ]);
      const dv=extract(dash),pv=extract(p),av=extract(a);
      setDashboard(dv);setProfileUser(pv);setDoctors(extract(d)??[]);setDepartments(extract(dep)??[]);
      setAppointments(av?.appointments??[]);setVerification(extract(v));setAnalytics(extract(an));
      setForm(hydrate(pv?.hospitalProfile));setVerificationDocs(csvText(extract(v)?.verificationDocuments));
    }catch(e:any){setError(e?.response?.data?.message??'Unable to load Hospital Portal.');}
    finally{setLoading(false)}
  },[]);

  useEffect(()=>{if(authReady)void load()},[authReady,load]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),3000);return()=>clearTimeout(t)},[toast]);

  const hospital=profileUser?.hospitalProfile??dashboard?.profile??{};
  const stats=dashboard?.stats??{};
  const completion=hospital?.profileCompletion??dashboard?.profile?.profileCompletion??verification?.profileCompletion??{percentage:0,missing:[]};
  const nav=useMemo(()=>[
    ['overview','Overview'],['profile','Hospital Profile'],['facilities','Services & Facilities'],['doctors','Doctors & OPD'],
    ['departments','Departments'],['appointments','Appointments'],['verification','Verification'],['analytics','Analytics']
  ] as [Tab,string][],[]);
  const set=(key:string,value:any)=>setForm((f:any)=>({...f,[key]:value}));
  const selectedFacilities=useMemo(()=>new Set(csv(form.facilities).map((x:string)=>x.toLowerCase())),[form.facilities]);

  const saveProfile=async(nextTab:Tab='profile')=>{
    setSaving(true);setError('');
    try{
      const payload:any={name:form.name,phone:form.phone||undefined,email:form.email||undefined,website:form.website||undefined,logoUrl:form.logoUrl||undefined,about:form.about||undefined,hospitalType:form.hospitalType||undefined,addressLine1:form.addressLine1||undefined,city:form.city||undefined,state:form.state||undefined,pinCode:form.pinCode||undefined,latitude:form.latitude===''?undefined:Number(form.latitude),longitude:form.longitude===''?undefined:Number(form.longitude),totalBeds:form.totalBeds===''?undefined:Number(form.totalBeds),icuBeds:form.icuBeds===''?undefined:Number(form.icuBeds),opdTimings:form.opdTimings||undefined,specialties:csv(form.specialties),accreditations:csv(form.accreditations),facilities:csv(form.facilities),insuranceProviders:csv(form.insuranceProviders),governmentSchemes:csv(form.governmentSchemes),registrationNumber:form.registrationNumber||undefined,registrationAuthority:form.registrationAuthority||undefined,authorizedContactName:form.authorizedContactName||undefined,authorizedContactPhone:form.authorizedContactPhone||undefined,emergencyAvailable:form.emergencyAvailable,teleconsultAvailable:form.teleconsultAvailable};
      await api.put('/hospitals/profile/me',payload);setToast(nextTab==='facilities'?'Services & facilities saved':'Hospital profile saved');await load();setTab(nextTab);
    }catch(e:any){setError(e?.response?.data?.message??e?.response?.data?.errors?.[0]?.message??'Unable to save profile.')}finally{setSaving(false)}
  };

  const toggleFacility=(name:string)=>{
    const current=csv(form.facilities);
    const exists=current.some((x:string)=>x.toLowerCase()===name.toLowerCase());
    set('facilities',(exists?current.filter((x:string)=>x.toLowerCase()!==name.toLowerCase()):[...current,name]).join(', '));
  };
  const addCustomFacility=()=>{const v=customFacility.trim();if(!v)return;const current=csv(form.facilities);if(!current.some((x:string)=>x.toLowerCase()===v.toLowerCase()))set('facilities',[...current,v].join(', '));setCustomFacility('');};

  const inviteDoctor=async()=>{if(!doctorForm.email.trim())return;setSaving(true);try{await api.post('/hospitals/doctors/invite',{email:doctorForm.email.trim(),department:doctorForm.department||undefined,isPrimary:doctorForm.isPrimary});setDoctorForm({email:'',department:'',isPrimary:false});setToast('Doctor invitation sent');await load();}catch(e:any){setError(e?.response?.data?.message??'Unable to invite doctor.')}finally{setSaving(false)}};
  const removeDoctor=async(d:any)=>{if(!confirm(`Remove Dr. ${d.firstName} ${d.lastName} from this hospital?`))return;try{await api.delete(`/hospitals/doctors/${d.id}`);setToast('Doctor affiliation removed');await load()}catch(e:any){setError(e?.response?.data?.message??'Unable to remove doctor.')}};
  const openSchedule=async(d:any)=>{setScheduleDoctor(d);setError('');try{const r=await api.get(`/hospitals/doctors/${d.id}/availability`);setSchedule(extract(r)??[])}catch(e:any){setSchedule([]);setError(e?.response?.data?.message??'Unable to load OPD schedule.')}};
  const addSchedule=()=>setSchedule(s=>[...s,{dayOfWeek:1,startTime:'09:00',endTime:'13:00',slotDuration:30,isActive:true}]);
  const updateSchedule=(idx:number,key:string,value:any)=>setSchedule(s=>s.map((row,i)=>i===idx?{...row,[key]:value}:row));
  const saveSchedule=async()=>{if(!scheduleDoctor)return;setSaving(true);try{await api.put(`/hospitals/doctors/${scheduleDoctor.id}/availability`,{schedule:schedule.map(({dayOfWeek,startTime,endTime,slotDuration,isActive})=>({dayOfWeek:Number(dayOfWeek),startTime,endTime,slotDuration:Number(slotDuration),isActive:Boolean(isActive)}))});setToast('Hospital OPD schedule saved');setScheduleDoctor(null);await load()}catch(e:any){setError(e?.response?.data?.message??'Unable to save OPD schedule.')}finally{setSaving(false)}};

  const addDepartment=async()=>{if(!depForm.name.trim())return;setSaving(true);try{await api.post('/hospitals/departments',{name:depForm.name.trim(),headName:depForm.headName||undefined,phone:depForm.phone||undefined});setDepForm({name:'',headName:'',phone:''});setToast('Department added');await load()}catch(e:any){setError(e?.response?.data?.message??'Unable to create department.')}finally{setSaving(false)}};
  const editDepartment=async(d:any)=>{const name=prompt('Department name',d.name);if(!name)return;const headName=prompt('Head name',d.headName??'')??d.headName;const phone=prompt('Phone',d.phone??'')??d.phone;try{await api.put(`/hospitals/departments/${d.id}`,{name,headName:headName||undefined,phone:phone||undefined});setToast('Department updated');await load()}catch(e:any){setError(e?.response?.data?.message??'Unable to update department.')}};
  const deleteDepartment=async(d:any)=>{if(!confirm(`Delete ${d.name}?`))return;try{await api.delete(`/hospitals/departments/${d.id}`);setToast('Department deleted');await load()}catch(e:any){setError(e?.response?.data?.message??'Unable to delete department.')}};

  const statusAppointment=async(a:any,status:string)=>{let reason:string|undefined;if(status==='CANCELLED'){reason=prompt('Cancellation reason')||undefined;if(!reason)return;}try{await api.patch(`/hospitals/appointments/${a.id}/status`,{status,reason});setToast(`Appointment ${status.replaceAll('_',' ').toLowerCase()}`);await load()}catch(e:any){setError(e?.response?.data?.message??'Unable to update appointment.')}};
  const rescheduleAppointment=async(a:any)=>{const value=prompt('New date/time (example: 2026-08-25T10:30)','');if(!value)return;const date=new Date(value);if(Number.isNaN(date.getTime())){setError('Invalid date/time.');return;}try{await api.put(`/hospitals/appointments/${a.id}/reschedule`,{scheduledAt:date.toISOString()});setToast('Appointment rescheduled');await load()}catch(e:any){setError(e?.response?.data?.message??'Unable to reschedule appointment.')}};
  const submitVerification=async()=>{const docs=csv(verificationDocs);setSaving(true);try{await api.post('/hospitals/verification/submit',{verificationDocuments:docs});setToast('Verification submitted');await load();setTab('verification')}catch(e:any){setError(e?.response?.data?.message??'Unable to submit verification.')}finally{setSaving(false)}};

  if(!authReady||loading)return <div style={{minHeight:'100vh',display:'grid',placeItems:'center',background:C.page,color:C.text}}>Loading Hospital Portal…</div>;

  const facilityCount=csv(form.facilities).length;
  const openAppointments=appointments.filter(a=>['PENDING','CONFIRMED','RESCHEDULED','CHECKED_IN','IN_PROGRESS'].includes(a.status)).length;
  const checkedIn=appointments.filter(a=>a.status==='CHECKED_IN').length;
  const inProgress=appointments.filter(a=>a.status==='IN_PROGRESS').length;

  return <div style={{minHeight:'100vh',background:C.page,color:C.navy,fontFamily:'Arial,sans-serif'}}>
    <SessionTimeoutManager/>
    {toast&&<div style={{position:'fixed',right:20,bottom:20,zIndex:100,background:C.tealDark,color:'#fff',padding:'11px 15px',borderRadius:10,fontSize:12,fontWeight:800}}>✓ {toast}</div>}
    <header style={{height:66,background:'#fff',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 22px',position:'sticky',top:0,zIndex:30}}>
      <div style={{display:'flex',alignItems:'center',gap:11}}><div style={{width:38,height:38,borderRadius:10,background:`linear-gradient(135deg,${C.tealDark},${C.teal})`,color:'#fff',display:'grid',placeItems:'center',fontWeight:900}}>HC</div><div><div style={{fontWeight:850,fontSize:15}}>{hospital.name||'Hospital Portal'}</div><div style={{fontSize:10,color:C.muted}}>HealthConnect India · {profileUser?.registrationId??''}</div></div></div>
      <div style={{display:'flex',gap:9,alignItems:'center'}}><Status value={hospital.verificationStatus??(hospital.isVerified?'VERIFIED':'PENDING')}/><Button ghost onClick={()=>void load()}>Refresh</Button></div>
    </header>
    <div className="hc-hospital-shell" style={{display:'grid',gridTemplateColumns:'236px minmax(0,1fr)',minHeight:'calc(100vh - 66px)'}}>
      <aside style={{background:'#fff',borderRight:`1px solid ${C.border}`,padding:'17px 11px'}}>
        {nav.map(([key,label])=><button key={key} onClick={()=>{setTab(key);setError('')}} style={{width:'100%',textAlign:'left',border:'none',borderRadius:9,padding:'10px 11px',marginBottom:4,cursor:'pointer',fontSize:12.5,fontWeight:750,background:tab===key?C.soft:'transparent',color:tab===key?C.tealDark:C.text}}>{label}</button>)}
        <div style={{marginTop:20,padding:11,borderRadius:10,background:'#F8FAFC',fontSize:10.5,color:C.muted,lineHeight:1.5}}>Profile: <b>{completion.percentage??0}%</b><div style={{height:5,borderRadius:5,background:'#E2E8F0',marginTop:6}}><div style={{height:'100%',width:`${completion.percentage??0}%`,background:C.teal,borderRadius:5}}/></div></div>
      </aside>
      <main style={{padding:22,minWidth:0}}>
        <div style={{marginBottom:18}}><h1 style={{margin:0,fontSize:23}}>Hospital Management</h1><div style={{fontSize:12,color:C.muted,marginTop:4}}>Institution profile, services, OPD operations and cross-role care coordination.</div></div>
        {error&&<div style={{padding:'10px 13px',borderRadius:9,background:'#FFF1F2',border:'1px solid #FECDD3',color:C.red,marginBottom:14,fontSize:12}}>⚠ {error}</div>}

        {tab==='overview'&&<>
          <div className="hc-stat-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:11}}>
            <Stat label="Accepted doctors" value={stats.doctors}/><Stat label="Departments" value={stats.departments}/><Stat label="Services & facilities" value={facilityCount}/><Stat label="Patients" value={stats.patients}/>
            <Stat label="Today's appointments" value={stats.todayAppointments} tone={C.blue}/><Stat label="Open care queue" value={openAppointments} sub={`${checkedIn} checked in · ${inProgress} in progress`} tone={C.violet}/><Stat label="Beds / ICU" value={`${stats.totalBeds??0} / ${stats.icuBeds??0}`}/><Stat label="Rating" value={stats.averageRating?`★ ${Number(stats.averageRating).toFixed(1)}`:'New'} sub={`${stats.totalReviews??0} reviews`} tone={C.amber}/>
          </div>
          <section style={{...card,marginTop:15}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h2 style={h2}>Recent appointments</h2><Button ghost onClick={()=>setTab('appointments')}>Open appointment queue</Button></div>{(dashboard?.recentAppointments??[]).length===0?<div style={empty}>No hospital-linked appointments yet.</div>:(dashboard.recentAppointments??[]).map((a:any)=><div key={a.id} style={row}><span>{a.patient?.firstName} {a.patient?.lastName}</span><span>Dr. {a.doctor?.firstName} {a.doctor?.lastName}</span><Status value={a.status}/><span>{new Date(a.scheduledAt).toLocaleString('en-IN')}</span></div>)}</section>
        </>}

        {tab==='profile'&&<>
          <section style={card}><div style={{display:'flex',justifyContent:'space-between',gap:12}}><div><h2 style={h2}>Hospital identity</h2><div style={sub}>Verified public information is shown directly to patients.</div></div><Button onClick={()=>saveProfile('profile')} disabled={saving}>{saving?'Saving…':'Save profile'}</Button></div><div style={grid}><Input label="Hospital name" value={form.name} onChange={v=>set('name',v)}/><label><span style={labelStyle}>Hospital type</span><select value={form.hospitalType} onChange={e=>set('hospitalType',e.target.value)} style={input}><option value="">Select type</option>{Object.entries(typeLabel).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><Input label="Phone" value={form.phone} onChange={v=>set('phone',v)}/><Input label="Public email" value={form.email} onChange={v=>set('email',v)}/><Input label="Website" value={form.website} onChange={v=>set('website',v)}/><Input label="Logo URL" value={form.logoUrl} onChange={v=>set('logoUrl',v)}/></div><div style={{marginTop:12}}><Textarea label="About hospital" value={form.about} onChange={v=>set('about',v)} rows={4}/></div></section>
          <section style={card}><h2 style={h2}>Location & capacity</h2><div style={grid}><Input label="Address" value={form.addressLine1} onChange={v=>set('addressLine1',v)}/><Input label="City" value={form.city} onChange={v=>set('city',v)}/><Input label="State" value={form.state} onChange={v=>set('state',v)}/><Input label="PIN code" value={form.pinCode} onChange={v=>set('pinCode',v)}/><Input label="Latitude" value={form.latitude} onChange={v=>set('latitude',v)} type="number"/><Input label="Longitude" value={form.longitude} onChange={v=>set('longitude',v)} type="number"/><Input label="Total beds" value={form.totalBeds} onChange={v=>set('totalBeds',v)} type="number"/><Input label="ICU beds" value={form.icuBeds} onChange={v=>set('icuBeds',v)} type="number"/></div><div style={{display:'flex',gap:18,marginTop:14,flexWrap:'wrap'}}><Toggle label="24/7 emergency available" checked={form.emergencyAvailable} onChange={v=>set('emergencyAvailable',v)}/><Toggle label="Hospital teleconsult available" checked={form.teleconsultAvailable} onChange={v=>set('teleconsultAvailable',v)}/></div></section>
          <section style={card}><h2 style={h2}>Coverage & registration</h2><div style={grid}><Input label="OPD timings" value={form.opdTimings} onChange={v=>set('opdTimings',v)}/><Input label="Registration number" value={form.registrationNumber} onChange={v=>set('registrationNumber',v)}/><Input label="Registration authority" value={form.registrationAuthority} onChange={v=>set('registrationAuthority',v)}/><Input label="Authorized contact" value={form.authorizedContactName} onChange={v=>set('authorizedContactName',v)}/><Input label="Authorized contact phone" value={form.authorizedContactPhone} onChange={v=>set('authorizedContactPhone',v)}/></div><div style={{display:'grid',gap:10,marginTop:12}}><Input label="Specialties (comma separated)" value={form.specialties} onChange={v=>set('specialties',v)}/><Input label="Accreditations" value={form.accreditations} onChange={v=>set('accreditations',v)}/><Input label="Insurance providers / TPAs" value={form.insuranceProviders} onChange={v=>set('insuranceProviders',v)}/><Input label="Government schemes (PM-JAY, CGHS…)" value={form.governmentSchemes} onChange={v=>set('governmentSchemes',v)}/></div></section>
        </>}

        {tab==='facilities'&&<>
          <section style={card}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><div><h2 style={h2}>Services & Facilities</h2><div style={sub}>Select verified capabilities patients can use to discover this hospital. These remain backed by the existing Hospital profile contract.</div></div><Button onClick={()=>saveProfile('facilities')} disabled={saving}>{saving?'Saving…':'Save facilities'}</Button></div>
            <div style={{display:'flex',gap:8,marginTop:14,flexWrap:'wrap'}}><input value={facilitySearch} onChange={e=>setFacilitySearch(e.target.value)} placeholder="Search facility…" style={{...input,maxWidth:320}}/><input value={customFacility} onChange={e=>setCustomFacility(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addCustomFacility()}}} placeholder="Add custom facility" style={{...input,maxWidth:320}}/><Button ghost onClick={addCustomFacility}>+ Add</Button></div>
          </section>
          {FACILITY_CATALOG.map(group=>{const items=group.items.filter(x=>!facilitySearch.trim()||x.toLowerCase().includes(facilitySearch.trim().toLowerCase())||group.category.toLowerCase().includes(facilitySearch.trim().toLowerCase()));if(!items.length)return null;return <section key={group.category} style={card}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h2 style={{...h2,marginBottom:0}}>{group.category}</h2><span style={sub}>{items.filter(x=>selectedFacilities.has(x.toLowerCase())).length} enabled</span></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:9,marginTop:14}}>{items.map(name=>{const active=selectedFacilities.has(name.toLowerCase());return <button key={name} onClick={()=>toggleFacility(name)} style={{textAlign:'left',padding:'11px 12px',borderRadius:11,border:`1px solid ${active?'#99F6E4':C.border}`,background:active?'#F0FDFA':'#fff',cursor:'pointer',color:C.navy,fontWeight:750,fontSize:12,display:'flex',justifyContent:'space-between',gap:8}}><span>{name}</span><span style={{color:active?C.green:C.muted}}>{active?'✓ Available':'＋'}</span></button>})}</div></section>})}
          {csv(form.facilities).filter((name:string)=>!FACILITY_CATALOG.some(g=>g.items.some(x=>x.toLowerCase()===name.toLowerCase()))).length>0&&<section style={card}><h2 style={h2}>Custom facilities</h2><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{csv(form.facilities).filter((name:string)=>!FACILITY_CATALOG.some(g=>g.items.some(x=>x.toLowerCase()===name.toLowerCase()))).map((name:string)=><button key={name} onClick={()=>toggleFacility(name)} style={{border:`1px solid ${C.border}`,background:'#fff',borderRadius:999,padding:'7px 10px',cursor:'pointer',fontSize:11,color:C.text}}>{name} ×</button>)}</div></section>}
        </>}

        {tab==='doctors'&&<><section style={card}><h2 style={h2}>Invite HealthConnect doctor</h2><div className="hc-form-4" style={{display:'grid',gridTemplateColumns:'2fr 1fr auto auto',gap:8,alignItems:'end'}}><Input label="Doctor email" value={doctorForm.email} onChange={v=>setDoctorForm(f=>({...f,email:v}))}/><Input label="Department" value={doctorForm.department} onChange={v=>setDoctorForm(f=>({...f,department:v}))}/><Toggle label="Primary" checked={doctorForm.isPrimary} onChange={v=>setDoctorForm(f=>({...f,isPrimary:v}))}/><Button onClick={inviteDoctor} disabled={saving}>Send invite</Button></div><div style={sub}>New affiliations become public only after the doctor accepts the invitation.</div></section><section style={card}><h2 style={h2}>Doctor affiliations</h2>{doctors.length===0?<div style={empty}>No doctor affiliations yet.</div>:doctors.map(d=><div key={d.membershipId??d.id} className="hc-doctor-row" style={{...row,gridTemplateColumns:'1.5fr 1fr .7fr auto'}}><span><b>Dr. {d.firstName} {d.lastName}</b><div style={sub}>{d.email} · {d.specialization||'Doctor'}</div></span><span>{d.department||'Unassigned'}</span><Status value={d.affiliationStatus}/><span style={{display:'flex',gap:6,flexWrap:'wrap'}}>{d.affiliationStatus==='ACCEPTED'&&<Button ghost onClick={()=>openSchedule(d)}>OPD schedule</Button>}<Button danger onClick={()=>removeDoctor(d)}>Remove</Button></span></div>)}</section></>}

        {tab==='departments'&&<><section style={card}><h2 style={h2}>Add department</h2><div className="hc-form-4" style={{display:'grid',gridTemplateColumns:'1.2fr 1fr 1fr auto',gap:8,alignItems:'end'}}><Input label="Department" value={depForm.name} onChange={v=>setDepForm(f=>({...f,name:v}))}/><Input label="Head" value={depForm.headName} onChange={v=>setDepForm(f=>({...f,headName:v}))}/><Input label="Phone" value={depForm.phone} onChange={v=>setDepForm(f=>({...f,phone:v}))}/><Button onClick={addDepartment} disabled={saving}>Add</Button></div></section><section style={card}>{departments.length===0?<div style={empty}>No departments yet.</div>:departments.map(d=><div key={d.id} className="hc-department-row" style={{...row,gridTemplateColumns:'1.4fr 1fr 1fr auto'}}><b>{d.name}</b><span>{d.headName||'—'}</span><span>{d.phone||'—'}</span><span style={{display:'flex',gap:6}}><Button ghost onClick={()=>editDepartment(d)}>Edit</Button><Button danger onClick={()=>deleteDepartment(d)}>Delete</Button></span></div>)}</section></>}

        {tab==='appointments'&&<section style={card}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><h2 style={h2}>Hospital OPD appointment queue</h2><div style={sub}>Same appointment state is shared with Patient and Doctor modules.</div></div><span style={{fontSize:11,color:C.muted}}>{appointments.length} records</span></div>{appointments.length===0?<div style={empty}>No hospital-linked appointments yet.</div>:appointments.map(a=><div key={a.id} className="hc-appointment-row" style={{borderTop:`1px solid ${C.border}`,padding:'12px 0',display:'grid',gridTemplateColumns:'1.25fr 1.25fr 1fr auto',gap:10,alignItems:'center',fontSize:12}}><div><b>{a.patient?.firstName} {a.patient?.lastName}</b><div style={sub}>{a.patient?.phone||''}<br/>ID: {a.id}</div></div><div>Dr. {a.doctor?.firstName} {a.doctor?.lastName}<div style={sub}>{new Date(a.scheduledAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</div></div><Status value={a.status}/><div style={{display:'flex',gap:5,flexWrap:'wrap',justifyContent:'flex-end'}}>{a.status==='PENDING'&&<Button onClick={()=>statusAppointment(a,'CONFIRMED')}>Confirm</Button>}{['CONFIRMED','RESCHEDULED'].includes(a.status)&&<><Button ghost onClick={()=>rescheduleAppointment(a)}>Reschedule</Button><Button onClick={()=>statusAppointment(a,'CHECKED_IN')}>Check-in</Button></>}{a.status==='CHECKED_IN'&&<Button onClick={()=>statusAppointment(a,'IN_PROGRESS')}>Start</Button>}{a.status==='IN_PROGRESS'&&<Button onClick={()=>statusAppointment(a,'COMPLETED')}>Complete</Button>}{['PENDING','CONFIRMED','RESCHEDULED'].includes(a.status)&&<Button ghost onClick={()=>statusAppointment(a,'NO_SHOW')}>No-show</Button>}{!['COMPLETED','CANCELLED','NO_SHOW'].includes(a.status)&&<Button danger onClick={()=>statusAppointment(a,'CANCELLED')}>Cancel</Button>}</div></div>)}</section>}

        {tab==='verification'&&<section style={card}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><div><h2 style={h2}>Hospital verification</h2><Status value={verification?.status??hospital.verificationStatus??'PENDING'}/></div><div style={{textAlign:'right'}}><b>{verification?.profileCompletion?.percentage??completion.percentage??0}% profile complete</b><div style={sub}>{verification?.profileCompletion?.missing?.map((m:any)=>m.label).join(' · ')||'Core profile complete'}</div></div></div>{verification?.verificationNotes&&<div style={{padding:11,borderRadius:9,background:'#FFF1F2',color:C.red,marginTop:14,fontSize:12}}><b>Admin note:</b> {verification.verificationNotes}</div>}<div style={{marginTop:16,display:'grid',gap:11}}><div style={sub}>Add secure URLs for registration/accreditation documents. Verification status is controlled only by HealthConnect Admin.</div><Input label="Verification document URLs (comma separated)" value={verificationDocs} onChange={setVerificationDocs}/><div style={{display:'flex',justifyContent:'flex-end'}}><Button onClick={submitVerification} disabled={saving||verification?.status==='VERIFIED'||verification?.status==='UNDER_REVIEW'||verification?.status==='SUBMITTED'}>{verification?.status==='VERIFIED'?'Verified':verification?.status==='SUBMITTED'||verification?.status==='UNDER_REVIEW'?'Review in progress':'Submit for verification'}</Button></div></div></section>}

        {tab==='analytics'&&<><div className="hc-analytics-grid" style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:12}}><AnalyticsCard title="Appointments by status" rows={(analytics?.byStatus??[]).map((x:any)=>({label:x.status,value:x._count}))}/><AnalyticsCard title="Consultation types" rows={(analytics?.byType??[]).map((x:any)=>({label:x.type,value:x._count}))}/><AnalyticsCard title="Top doctors · 30 days" rows={(analytics?.byDoctor??[]).map((x:any)=>({label:x.name,value:x.count}))}/><AnalyticsCard title="Departments · 30 days" rows={(analytics?.byDepartment??[]).map((x:any)=>({label:x.department,value:x.count}))}/></div><div style={{...sub,marginTop:10}}>Analytics are based only on real hospital-linked appointments from the last {analytics?.periodDays??30} days. No synthetic revenue data is shown.</div></>}
      </main>
    </div>

    {scheduleDoctor&&<div onClick={()=>setScheduleDoctor(null)} style={overlay}><div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:16,padding:20,width:'min(760px,95vw)',maxHeight:'86vh',overflowY:'auto'}}><div style={{display:'flex',justifyContent:'space-between'}}><div><h3 style={{margin:0}}>OPD schedule · Dr. {scheduleDoctor.firstName} {scheduleDoctor.lastName}</h3><div style={sub}>Hospital-specific slots; global Doctor Availability is not changed.</div></div><button onClick={()=>setScheduleDoctor(null)} style={close}>×</button></div><div style={{display:'grid',gap:8,marginTop:15}}>{schedule.map((r,i)=><div key={i} className="hc-opd-row" style={{display:'grid',gridTemplateColumns:'1.1fr 1fr 1fr .8fr auto',gap:7,alignItems:'end'}}><label><span style={labelStyle}>Day</span><select value={r.dayOfWeek} onChange={e=>updateSchedule(i,'dayOfWeek',Number(e.target.value))} style={input}>{DAYS.map((d,idx)=><option key={d} value={idx}>{d}</option>)}</select></label><Input label="Start" value={r.startTime} onChange={v=>updateSchedule(i,'startTime',v)} type="time"/><Input label="End" value={r.endTime} onChange={v=>updateSchedule(i,'endTime',v)} type="time"/><Input label="Minutes" value={r.slotDuration} onChange={v=>updateSchedule(i,'slotDuration',Number(v))} type="number"/><Button danger onClick={()=>setSchedule(s=>s.filter((_,x)=>x!==i))}>Remove</Button></div>)}</div><div style={{display:'flex',justifyContent:'space-between',marginTop:15}}><Button ghost onClick={addSchedule}>+ Add session</Button><Button onClick={saveSchedule} disabled={saving}>{saving?'Saving…':'Save OPD schedule'}</Button></div></div></div>}

    <style>{`@media(max-width:900px){.hc-hospital-shell{grid-template-columns:1fr!important}.hc-hospital-shell>aside{display:flex;overflow-x:auto;border-right:none!important;border-bottom:1px solid ${C.border};position:sticky;top:66px;z-index:20}.hc-hospital-shell>aside>button{min-width:max-content;width:auto!important}.hc-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.hc-form-4,.hc-opd-row,.hc-appointment-row,.hc-doctor-row,.hc-department-row{grid-template-columns:1fr!important}.hc-analytics-grid{grid-template-columns:1fr!important}}@media(max-width:560px){.hc-stat-grid{grid-template-columns:1fr!important}}`}</style>
  </div>;
}

function Toggle({label,checked,onChange}:{label:string;checked:boolean;onChange:(v:boolean)=>void}){return <button type="button" onClick={()=>onChange(!checked)} style={{border:`1px solid ${checked?'#99F6E4':C.border}`,background:checked?'#F0FDFA':'#fff',borderRadius:10,padding:'9px 11px',display:'flex',alignItems:'center',gap:8,cursor:'pointer',color:C.text,fontSize:11,fontWeight:700}}><span style={{width:34,height:19,borderRadius:20,background:checked?C.teal:'#CBD5E1',position:'relative'}}><span style={{position:'absolute',width:15,height:15,borderRadius:'50%',background:'#fff',top:2,left:checked?17:2}}/></span>{label}</button>}
function AnalyticsCard({title,rows}:{title:string;rows:{label:string;value:number}[]}){const max=Math.max(1,...rows.map(r=>r.value));return <section style={card}><h2 style={h2}>{title}</h2>{rows.length===0?<div style={empty}>No data in this period.</div>:rows.map(r=><div key={r.label} style={{margin:'10px 0'}}><div style={{display:'flex',justifyContent:'space-between',fontSize:11}}><span>{r.label.replaceAll('_',' ')}</span><b>{r.value}</b></div><div style={{height:6,background:'#E2E8F0',borderRadius:6,marginTop:4}}><div style={{height:'100%',width:`${Math.max(3,(r.value/max)*100)}%`,background:C.teal,borderRadius:6}}/></div></div>)}</section>}

const card:React.CSSProperties={background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:16,boxShadow:'0 2px 9px rgba(15,23,42,.035)',marginBottom:14};
const labelStyle:React.CSSProperties={display:'block',fontSize:10.5,fontWeight:800,color:C.muted,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:5};
const input:React.CSSProperties={width:'100%',boxSizing:'border-box',border:`1px solid ${C.border}`,borderRadius:9,padding:'9px 10px',fontSize:12,color:C.navy,background:'#fff',outline:'none'};
const grid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10,marginTop:14};
const h2:React.CSSProperties={margin:'0 0 10px',fontSize:16,color:C.navy};
const sub:React.CSSProperties={fontSize:10.5,color:C.muted,marginTop:3,lineHeight:1.45};
const empty:React.CSSProperties={fontSize:12,color:C.muted,padding:'14px 0'};
const row:React.CSSProperties={display:'grid',gridTemplateColumns:'1.15fr 1.15fr .7fr 1fr',gap:9,alignItems:'center',padding:'10px 0',borderTop:`1px solid ${C.border}`,fontSize:11.5};
const overlay:React.CSSProperties={position:'fixed',inset:0,zIndex:9999,background:'rgba(4,12,28,.7)',display:'grid',placeItems:'center',padding:16};
const close:React.CSSProperties={border:'none',background:'#F1F5F9',borderRadius:8,width:31,height:31,fontSize:20,cursor:'pointer'};
