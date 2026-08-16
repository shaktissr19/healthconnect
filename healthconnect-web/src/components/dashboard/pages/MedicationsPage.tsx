'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, patientAPI } from '@/lib/api';

const C = { card:'#FFFFFF',border:'#E2EEF0',teal:'#0D9488',tealLight:'#14B8A6',tealBg:'#F0FDF9',text:'#0F2D2A',text2:'#4B6E6A',text3:'#64748B',red:'#EF4444',amber:'#F59E0B',green:'#22C55E',purple:'#8B5CF6' };
const card:React.CSSProperties = { background:C.card,border:`1px solid ${C.border}`,borderRadius:16,boxShadow:'0 2px 12px rgba(0,0,0,.06)' };
const FREQ:Record<string,string> = { ONCE_DAILY:'Once daily',TWICE_DAILY:'Twice daily',THREE_TIMES_DAILY:'3× daily',FOUR_TIMES_DAILY:'4× daily',WEEKLY:'Weekly',BIWEEKLY:'Biweekly',MONTHLY:'Monthly',AS_NEEDED:'As needed',CUSTOM:'Custom' };
const isTaken = (status:unknown) => String(status ?? '').toLowerCase()==='taken';

type Med = { id:string;name:string;dosage:string;dosageUnit?:string;frequency:string;customFrequency?:string;timesOfDay?:string[];currentStock?:number;refillThreshold?:number;status:string;prescribedBy?:string;prescribedFor?:string;adherencePct?:number|null;instructions?:string;notes?:string; };
type Log = { id:string;status:string;scheduledTime?:string;takenAt?:string;notes?:string };

function startOfTodayIso() { const d=new Date(); d.setHours(0,0,0,0); return d.toISOString(); }
function endOfTodayIso() { const d=new Date(); d.setHours(23,59,59,999); return d.toISOString(); }

export default function MedicationsPage() {
  const [meds,setMeds] = useState<Med[]>([]);
  const [logs,setLogs] = useState<Record<string,Log[]>>({});
  const [loading,setLoading] = useState(true);
  const [filter,setFilter] = useState<'Active'|'All'|'Discontinued'>('Active');
  const [showAdd,setShowAdd] = useState(false);
  const [expanded,setExpanded] = useState<string|null>(null);
  const [actioning,setActioning] = useState<string|null>(null);
  const [toast,setToast] = useState('');
  const [toastError,setToastError] = useState(false);
  const [doctorPrescriptions,setDoctorPrescriptions] = useState<any[]>([]);

  const notify = (message:string,error=false) => { setToast(message);setToastError(error);window.setTimeout(()=>setToast(''),3500); };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const medRes:any = await patientAPI.getMedications();
      const raw = medRes?.data?.data ?? medRes?.data ?? [];
      const all:Med[] = Array.isArray(raw) ? raw : raw.medications ?? [];
      setMeds(all);

      const active = all.filter(item => item.status==='ACTIVE');
      const results = await Promise.allSettled(active.map(item => patientAPI.getMedicationLogs(item.id,{ from:startOfTodayIso(),to:endOfTodayIso() })));
      const byId:Record<string,Log[]> = {};
      results.forEach((result,index) => {
        const data:any = result.status==='fulfilled' ? result.value?.data?.data ?? result.value?.data ?? [] : [];
        byId[active[index].id] = Array.isArray(data) ? data : data.logs ?? [];
      });
      setLogs(byId);

      // Keep doctor-issued prescriptions visible when that doctor-domain endpoint is available.
      try {
        const rx:any = await api.get('/doctor/patient/prescriptions');
        const data = rx?.data?.data?.prescriptions ?? rx?.data?.prescriptions ?? rx?.data?.data ?? rx?.data ?? [];
        setDoctorPrescriptions(Array.isArray(data)?data:[]);
      } catch { setDoctorPrescriptions([]); }
    } catch (e:any) {
      notify(e?.response?.data?.message ?? 'Unable to load medications.',true);
      setMeds([]);
    } finally { setLoading(false); }
  },[]);

  useEffect(() => { loadData(); },[loadData]);

  const logDose = async (medId:string,status:'taken'|'missed'|'skipped') => {
    const key=`${medId}_${status}`; setActioning(key);
    try {
      const now=new Date().toISOString();
      await patientAPI.logDose(medId,{ status,scheduledTime:now,takenAt:status==='taken'?now:undefined });
      notify(status==='taken'?'✓ Dose marked taken':status==='missed'?'Dose marked missed':'Dose skipped');
      await loadData();
    } catch (e:any) { notify(e?.response?.data?.message ?? 'Unable to log dose.',true); }
    finally { setActioning(null); }
  };

  const discontinue = async (id:string) => {
    if (!confirm('Mark this medication as discontinued?')) return;
    try { await patientAPI.updateMedication(id,{ status:'DISCONTINUED',endDate:new Date().toISOString() });notify('Medication discontinued');await loadData(); }
    catch (e:any) { notify(e?.response?.data?.message ?? 'Unable to update medication.',true); }
  };

  const visible = meds.filter(item => filter==='All' ? true : filter==='Active' ? item.status==='ACTIVE' : item.status==='DISCONTINUED');
  const active = meds.filter(item=>item.status==='ACTIVE');
  const adherenceValues = active.map(item=>item.adherencePct).filter((value):value is number=>typeof value==='number');
  const avgAdherence = adherenceValues.length ? Math.round(adherenceValues.reduce((a,b)=>a+b,0)/adherenceValues.length) : null;
  const refillAlerts = active.filter(item=>item.currentStock!=null&&item.refillThreshold!=null&&item.currentStock<=item.refillThreshold).length;
  const todayTarget = active.reduce((sum,item)=>sum+(item.timesOfDay?.length||1),0);
  const todayTaken = active.reduce((sum,item)=>sum+(logs[item.id]??[]).filter(log=>isTaken(log.status)).length,0);
  const adherenceColor = (value:number) => value>=80?C.green:value>=50?C.amber:C.red;

  if (loading) return <div style={{ padding:40,textAlign:'center',color:C.text3 }}>Loading medications…</div>;

  return <div style={{ display:'flex',flexDirection:'column',gap:24 }}>
    {toast&&<div style={{ position:'fixed',bottom:28,right:28,zIndex:9999,background:toastError?'#7F1D1D':'#0F2D2A',color:'#fff',padding:'12px 20px',borderRadius:12,fontSize:13,fontWeight:600,boxShadow:'0 8px 24px rgba(0,0,0,.25)' }}>{toast}</div>}
    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap' }}><div><h1 style={{ fontSize:26,fontWeight:800,color:C.text,margin:'0 0 6px' }}>💊 Medications</h1><p style={{ color:C.text2,fontSize:14,margin:0 }}>Manage prescriptions, doses, adherence and refills</p></div><div style={{ display:'flex',gap:10 }}><button onClick={loadData} style={{ padding:'10px 18px',borderRadius:10,border:`1px solid ${C.border}`,background:'#fff',color:C.text2,fontWeight:600,cursor:'pointer' }}>↺ Refresh</button><button onClick={()=>setShowAdd(true)} style={{ padding:'10px 20px',borderRadius:10,border:'none',background:`linear-gradient(135deg,${C.teal},${C.tealLight})`,color:'#fff',fontWeight:700,cursor:'pointer' }}>+ Add Medication</button></div></div>

    <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14 }}>{[
      ['ACTIVE MEDS',active.length,C.teal,'Current prescriptions'],['AVG ADHERENCE',avgAdherence==null?'—':`${avgAdherence}%`,avgAdherence==null?C.text3:adherenceColor(avgAdherence),avgAdherence==null?'No dose history':'Last 30 days'],['REFILL ALERTS',refillAlerts,refillAlerts?C.red:C.green,refillAlerts?'Needs attention':'Stock okay'],["TODAY'S DOSES",`${todayTaken}/${todayTarget}`,C.purple,'Logged today']
    ].map(([label,value,color,sub])=><div key={String(label)} style={{...card,padding:'18px 20px'}}><div style={{fontSize:10,fontWeight:700,color:C.text3,letterSpacing:'.07em'}}>{label}</div><div style={{fontSize:29,fontWeight:800,color:String(color),margin:'8px 0 4px'}}>{value}</div><div style={{fontSize:12,color:C.text3}}>{sub}</div></div>)}</div>

    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap' }}><div style={{ display:'flex',gap:8 }}>{(['Active','All','Discontinued'] as const).map(item=><button key={item} onClick={()=>setFilter(item)} style={{ padding:'8px 17px',borderRadius:100,border:`1px solid ${filter===item?C.teal:C.border}`,background:filter===item?C.tealBg:'#fff',color:filter===item?C.teal:C.text3,fontWeight:600,cursor:'pointer' }}>{item}</button>)}</div><span style={{fontSize:13,color:C.text3}}>{visible.length} medication{visible.length===1?'':'s'}</span></div>

    {visible.length===0?<div style={{...card,padding:48,textAlign:'center',color:C.text3}}><div style={{fontSize:38}}>💊</div><div style={{fontWeight:700,color:C.text,margin:'10px 0 5px'}}>No medications found</div><button onClick={()=>setShowAdd(true)} style={{marginTop:10,padding:'9px 20px',border:'none',borderRadius:9,background:C.teal,color:'#fff',fontWeight:700,cursor:'pointer'}}>+ Add Medication</button></div>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(430px,1fr))',gap:16}}>{visible.map(med=>{
      const medLogs=logs[med.id]??[]; const adh=med.adherencePct; const lowStock=med.currentStock!=null&&med.refillThreshold!=null&&med.currentStock<=med.refillThreshold; const open=expanded===med.id;
      return <div key={med.id} style={{...card,overflow:'hidden'}}><div style={{height:3,background:med.status==='ACTIVE'?`linear-gradient(90deg,${C.teal},${C.tealLight})`:'#CBD5E1'}}/><div style={{padding:20}}><div style={{display:'flex',justifyContent:'space-between',gap:10,marginBottom:11}}><div><div style={{fontSize:17,fontWeight:800,color:C.text}}>{med.name}</div><div style={{fontSize:13,color:C.text2,marginTop:3}}>{med.dosage} {med.dosageUnit??''} · {FREQ[med.frequency]??med.customFrequency??med.frequency}</div>{med.timesOfDay?.length?<div style={{fontSize:11,color:C.text3,marginTop:3}}>Times: {med.timesOfDay.join(', ')}</div>:null}</div><span style={{height:'fit-content',padding:'3px 9px',borderRadius:100,fontSize:10,fontWeight:700,background:med.status==='ACTIVE'?'#F0FDF4':'#F1F5F9',color:med.status==='ACTIVE'?C.green:C.text3}}>{med.status}</span></div>
      {med.instructions&&<div style={{padding:'8px 11px',background:C.tealBg,borderRadius:8,color:'#0F766E',fontSize:12,marginBottom:12}}>📋 {med.instructions}</div>}
      <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:C.text3,marginBottom:5}}><span>30-day adherence</span><strong style={{color:adh==null?C.text3:adherenceColor(adh)}}>{adh==null?'No logs yet':`${adh}%`}</strong></div><div style={{height:6,background:'#E2EEF0',borderRadius:100,overflow:'hidden',marginBottom:12}}><div style={{height:'100%',width:`${adh??0}%`,background:adh==null?'#CBD5E1':adherenceColor(adh)}}/></div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:C.text3,marginBottom:14}}><span>Prescribed by: <strong>{med.prescribedBy??'Not recorded'}</strong></span><span style={{color:lowStock?C.red:C.text3,fontWeight:lowStock?700:500}}>{med.currentStock==null?'Stock not tracked':lowStock?`⚠ ${med.currentStock} left`:`Stock: ${med.currentStock}`}</span></div>
      {med.status==='ACTIVE'&&<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7,marginBottom:10}}><button onClick={()=>logDose(med.id,'taken')} disabled={Boolean(actioning)} style={{padding:9,border:'1px solid #A7F3D0',borderRadius:8,background:'#ECFDF5',color:'#047857',fontWeight:700,cursor:'pointer'}}>✓ Taken</button><button onClick={()=>logDose(med.id,'skipped')} disabled={Boolean(actioning)} style={{padding:9,border:'1px solid #FDE68A',borderRadius:8,background:'#FFFBEB',color:'#B45309',fontWeight:700,cursor:'pointer'}}>Skipped</button><button onClick={()=>logDose(med.id,'missed')} disabled={Boolean(actioning)} style={{padding:9,border:'1px solid #FECDD3',borderRadius:8,background:'#FFF1F2',color:'#BE123C',fontWeight:700,cursor:'pointer'}}>Missed</button></div>}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}><button onClick={()=>setExpanded(open?null:med.id)} style={{padding:8,border:`1px solid ${C.border}`,borderRadius:8,background:'#fff',color:C.text2,fontWeight:600,cursor:'pointer'}}>{open?'Hide logs':'View today logs'}</button>{med.status==='ACTIVE'&&<button onClick={()=>discontinue(med.id)} style={{padding:8,border:'1px solid #FECDD3',borderRadius:8,background:'#fff',color:C.red,fontWeight:600,cursor:'pointer'}}>Discontinue</button>}</div>
      {open&&<div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.border}`}}>{medLogs.length===0?<div style={{fontSize:12,color:C.text3}}>No dose entries today.</div>:medLogs.map(log=><div key={log.id} style={{display:'flex',justifyContent:'space-between',fontSize:12,color:C.text2,padding:'5px 0'}}><span>{new Date(log.scheduledTime??log.takenAt??Date.now()).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span><strong style={{textTransform:'capitalize'}}>{log.status}</strong></div>)}</div>}
      </div></div>;
    })}</div>}

    {doctorPrescriptions.length>0&&<div><h3 style={{fontSize:16,fontWeight:700,color:C.text,margin:'6px 0 12px'}}>🩺 Prescribed by Your Doctors</h3><div style={{display:'flex',flexDirection:'column',gap:10}}>{doctorPrescriptions.map((rx:any,index:number)=><div key={rx.id??index} style={{...card,padding:'16px 18px'}}><div style={{display:'flex',justifyContent:'space-between',gap:12}}><div><strong style={{color:C.text}}>{rx.doctorName??(rx.doctor?`Dr. ${rx.doctor.firstName??''} ${rx.doctor.lastName??''}`:'Doctor prescription')}</strong><div style={{fontSize:12,color:C.text3,marginTop:3}}>{rx.notes??'Prescription available from your care team.'}</div></div><span style={{fontSize:10,fontWeight:700,color:C.purple}}>{rx.status??'ACTIVE'}</span></div></div>)}</div></div>}

    {showAdd&&<AddMedicationModal onClose={()=>setShowAdd(false)} onSaved={async()=>{setShowAdd(false);notify('✓ Medication added');await loadData();}}/>}
  </div>;
}

function AddMedicationModal({onClose,onSaved}:{onClose:()=>void;onSaved:()=>void}) {
  const today=new Date().toISOString().slice(0,10);
  const [form,setForm]=useState({name:'',dosage:'',dosageUnit:'',frequency:'ONCE_DAILY',customFrequency:'',timesOfDay:['08:00'],currentStock:'',refillThreshold:'7',prescribedBy:'',prescribedFor:'',instructions:'',notes:'',startDate:today});
  const [saving,setSaving]=useState(false); const [error,setError]=useState('');
  const input:React.CSSProperties={width:'100%',padding:'10px 12px',border:`1px solid ${C.border}`,borderRadius:9,background:'#F8FFFE',boxSizing:'border-box',fontSize:13,color:C.text,outline:'none'};
  const label:React.CSSProperties={display:'block',fontSize:10,fontWeight:700,color:C.text3,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5};
  const set=(key:string,value:any)=>setForm(prev=>({...prev,[key]:value}));
  const save=async()=>{ if(!form.name.trim()||!form.dosage.trim()){setError('Medication name and dosage are required.');return;} setSaving(true);setError('');try{await patientAPI.addMedication({name:form.name.trim(),dosage:form.dosage.trim(),dosageUnit:form.dosageUnit.trim()||undefined,frequency:form.frequency,customFrequency:form.frequency==='CUSTOM'?form.customFrequency.trim():undefined,timesOfDay:form.frequency==='AS_NEEDED'?[]:form.timesOfDay.filter(Boolean),currentStock:form.currentStock===''?undefined:Number(form.currentStock),refillThreshold:form.refillThreshold===''?undefined:Number(form.refillThreshold),prescribedBy:form.prescribedBy.trim()||undefined,prescribedFor:form.prescribedFor.trim()||undefined,instructions:form.instructions.trim()||undefined,notes:form.notes.trim()||undefined,startDate:new Date(`${form.startDate}T00:00:00`).toISOString()});onSaved();}catch(e:any){setError(e?.response?.data?.message??'Unable to save medication.');}finally{setSaving(false);}};
  return <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(15,23,42,.65)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}><div style={{background:'#fff',borderRadius:18,padding:26,width:'100%',maxWidth:600,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 60px rgba(0,0,0,.2)'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}><h2 style={{fontSize:18,color:C.text,margin:0}}>Add Medication</h2><button onClick={onClose} style={{border:'none',background:'none',fontSize:22,cursor:'pointer'}}>×</button></div><div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:12,marginBottom:12}}><div><label style={label}>Medication name *</label><input style={input} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Metformin"/></div><div><label style={label}>Dosage *</label><input style={input} value={form.dosage} onChange={e=>set('dosage',e.target.value)} placeholder="500"/></div><div><label style={label}>Unit</label><input style={input} value={form.dosageUnit} onChange={e=>set('dosageUnit',e.target.value)} placeholder="mg"/></div></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}><div><label style={label}>Frequency</label><select style={input} value={form.frequency} onChange={e=>set('frequency',e.target.value)}>{Object.entries(FREQ).map(([value,text])=><option key={value} value={value}>{text}</option>)}</select></div><div><label style={label}>Start date</label><input type="date" style={input} value={form.startDate} onChange={e=>set('startDate',e.target.value)}/></div></div>{form.frequency==='CUSTOM'&&<div style={{marginBottom:12}}><label style={label}>Custom frequency *</label><input style={input} value={form.customFrequency} onChange={e=>set('customFrequency',e.target.value)} placeholder="Describe the schedule"/></div>}{form.frequency!=='AS_NEEDED'&&<div style={{marginBottom:12}}><label style={label}>Dose times</label><input style={input} value={form.timesOfDay.join(', ')} onChange={e=>set('timesOfDay',e.target.value.split(',').map(value=>value.trim()).filter(Boolean))} placeholder="08:00, 20:00"/><div style={{fontSize:10,color:C.text3,marginTop:4}}>Use 24-hour HH:mm format, comma-separated.</div></div>}<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}><div><label style={label}>Current stock</label><input type="number" min="0" style={input} value={form.currentStock} onChange={e=>set('currentStock',e.target.value)}/></div><div><label style={label}>Refill alert at</label><input type="number" min="0" style={input} value={form.refillThreshold} onChange={e=>set('refillThreshold',e.target.value)}/></div></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}><div><label style={label}>Prescribed by</label><input style={input} value={form.prescribedBy} onChange={e=>set('prescribedBy',e.target.value)}/></div><div><label style={label}>Prescribed for</label><input style={input} value={form.prescribedFor} onChange={e=>set('prescribedFor',e.target.value)}/></div></div><div style={{marginBottom:12}}><label style={label}>Instructions</label><input style={input} value={form.instructions} onChange={e=>set('instructions',e.target.value)} placeholder="e.g. Take with meals"/></div><div style={{marginBottom:12}}><label style={label}>Notes</label><textarea style={{...input,resize:'vertical'}} rows={2} value={form.notes} onChange={e=>set('notes',e.target.value)}/></div>{error&&<div style={{padding:'9px 12px',borderRadius:9,background:'#FFF1F2',color:'#BE123C',fontSize:12,marginBottom:12}}>{error}</div>}<div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:10}}><button onClick={onClose} style={{padding:11,border:`1px solid ${C.border}`,borderRadius:9,background:'#fff',fontWeight:600,cursor:'pointer'}}>Cancel</button><button onClick={save} disabled={saving} style={{padding:11,border:'none',borderRadius:9,background:`linear-gradient(135deg,${C.teal},${C.tealLight})`,color:'#fff',fontWeight:700,cursor:'pointer'}}>{saving?'Saving…':'Add Medication'}</button></div></div></div>;
}
