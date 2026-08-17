'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, patientAPI } from '@/lib/api';

const C={card:'#FFFFFF',border:'#E2EEF0',teal:'#0D9488',tealLight:'#14B8A6',tealBg:'#F0FDF9',text:'#0F2D2A',text2:'#4B6E6A',text3:'#64748B',green:'#16A34A',purple:'#7C3AED',red:'#DC2626'};
const ICONS:Record<string,string>={EXERCISE:'🏃',DIET:'🥗',SLEEP:'😴',STRESS:'🧘',MEDITATION:'🧘',PHYSIOTHERAPY:'💆',OTHER:'🌱'};
const emptyForm=()=>({type:'EXERCISE',plan:'',targetValue:'',currentValue:'',startDate:new Date().toISOString().slice(0,10),endDate:'',notes:''});
const toDay=(value?:string|null)=>value?new Date(value).toISOString().slice(0,10):'';
const toIsoStart=(day:string)=>new Date(`${day}T00:00:00`).toISOString();
const toIsoEnd=(day:string)=>new Date(`${day}T23:59:59`).toISOString();

export default function TherapiesPage(){
  const [therapies,setTherapies]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [editingId,setEditingId]=useState<string|null>(null);
  const [saving,setSaving]=useState(false);
  const [acting,setActing]=useState<string|null>(null);
  const [message,setMessage]=useState('');
  const [form,setForm]=useState(emptyForm());

  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const res:any=await patientAPI.getTherapies();
      const data=res?.data?.data??res?.data??[];
      setTherapies(Array.isArray(data)?data:data.therapies??[]);
    }catch(e:any){setMessage(e?.response?.data?.message??'Unable to load therapies.');}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);

  const openAdd=()=>{setEditingId(null);setForm(emptyForm());setMessage('');setShowForm(true);};
  const openEdit=(item:any)=>{
    setEditingId(item.id);
    setForm({
      type:item.type??'OTHER',
      plan:item.plan??'',
      targetValue:item.targetValue??'',
      currentValue:item.currentValue??'',
      startDate:toDay(item.startDate)||new Date().toISOString().slice(0,10),
      endDate:toDay(item.endDate),
      notes:item.notes??'',
    });
    setMessage('');setShowForm(true);
  };
  const closeForm=()=>{setShowForm(false);setEditingId(null);setForm(emptyForm());};

  const save=async()=>{
    if(!form.plan.trim()||!form.startDate)return;
    setSaving(true);setMessage('');
    try{
      const payload:any={
        type:form.type,
        plan:form.plan.trim(),
        targetValue:form.targetValue.trim(),
        currentValue:form.currentValue.trim(),
        startDate:toIsoStart(form.startDate),
        notes:form.notes.trim(),
      };
      if(editingId) payload.endDate=form.endDate?toIsoEnd(form.endDate):null;
      else if(form.endDate) payload.endDate=toIsoEnd(form.endDate);

      if(editingId) await api.put(`/patient/therapies/${editingId}`,payload);
      else await patientAPI.addTherapy(payload);
      setMessage(editingId?'✓ Therapy updated':'✓ Therapy added');
      closeForm();await load();
    }catch(e:any){setMessage(e?.response?.data?.message??'Unable to save therapy.');}
    finally{setSaving(false);}
  };

  const remove=async(id:string)=>{
    if(!confirm('Remove this therapy record?'))return;
    setActing(id);
    try{await patientAPI.deleteTherapy(id);setMessage('✓ Therapy removed');await load();}
    catch(e:any){setMessage(e?.response?.data?.message??'Unable to remove therapy.');}
    finally{setActing(null);}
  };

  const now=Date.now();
  const completed=therapies.filter(item=>item.endDate&&new Date(item.endDate).getTime()<now);
  const active=therapies.filter(item=>!item.endDate||new Date(item.endDate).getTime()>=now);
  const input:React.CSSProperties={width:'100%',padding:'10px 12px',border:`1px solid ${C.border}`,borderRadius:9,background:'#F8FFFE',boxSizing:'border-box',fontSize:13,color:C.text,outline:'none'};
  const label:React.CSSProperties={display:'block',fontSize:10,fontWeight:700,color:C.text3,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5};

  return <div style={{padding:'4px 0'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24,gap:12,flexWrap:'wrap'}}>
      <div><h2 style={{fontSize:22,fontWeight:800,color:C.text,margin:0}}>🌱 Therapies & Care Plans</h2><div style={{fontSize:13,color:C.text3,marginTop:4}}>Track non-medication care plans and update progress over time.</div></div>
      <button onClick={showForm?closeForm:openAdd} style={{padding:'10px 20px',border:'none',borderRadius:10,background:showForm?'#F1F5F9':`linear-gradient(135deg,${C.teal},${C.tealLight})`,color:showForm?C.text2:'#fff',fontWeight:700,cursor:'pointer'}}>{showForm?'✕ Cancel':'+ Add Therapy'}</button>
    </div>

    {message&&<div style={{marginBottom:16,padding:'9px 12px',borderRadius:9,background:message.startsWith('✓')?'#F0FDF4':'#FFF7ED',color:message.startsWith('✓')?'#15803D':'#B45309',fontSize:12,fontWeight:600}}>{message}</div>}

    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:24}}>{[['🌱',therapies.length,'Total',C.teal],['✅',active.length,'Active',C.green],['🏁',completed.length,'Completed',C.purple]].map(([icon,value,text,color])=><div key={String(text)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:'18px 20px',boxShadow:'0 2px 8px rgba(0,0,0,.05)'}}><div style={{fontSize:25}}>{icon}</div><div style={{fontSize:32,fontWeight:800,color:String(color),margin:'7px 0 4px'}}>{value}</div><div style={{fontSize:13,color:C.text2,fontWeight:600}}>{text}</div></div>)}</div>

    {showForm&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:22,marginBottom:24,boxShadow:'0 3px 14px rgba(13,148,136,.08)'}}>
      <div style={{fontWeight:700,color:C.text,marginBottom:16}}>{editingId?'Edit Therapy / Care Plan':'Add Therapy / Care Plan'}</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:12,marginBottom:12}}><div><label style={label}>Type</label><select style={input} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{Object.keys(ICONS).map(type=><option key={type} value={type}>{ICONS[type]} {type.replace(/_/g,' ')}</option>)}</select></div><div><label style={label}>Plan *</label><input style={input} placeholder="e.g. Brisk walking 30 minutes, 5 days/week" value={form.plan} onChange={e=>setForm({...form,plan:e.target.value})}/></div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginBottom:12}}><div><label style={label}>Target (optional)</label><input style={input} placeholder="e.g. 150 min/week" value={form.targetValue} onChange={e=>setForm({...form,targetValue:e.target.value})}/></div><div><label style={label}>Current progress (optional)</label><input style={input} placeholder="e.g. 90 min/week" value={form.currentValue} onChange={e=>setForm({...form,currentValue:e.target.value})}/></div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginBottom:12}}><div><label style={label}>Start date *</label><input type="date" style={input} value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/></div><div><label style={label}>End date (optional)</label><input type="date" style={input} value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}/><div style={{fontSize:10,color:C.text3,marginTop:4}}>Leave blank for an ongoing plan.</div></div></div>
      <div style={{marginBottom:12}}><label style={label}>Notes</label><textarea rows={2} style={{...input,resize:'vertical'}} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
      <div style={{display:'flex',gap:9}}><button onClick={save} disabled={saving||!form.plan.trim()||!form.startDate} style={{padding:'10px 26px',border:'none',borderRadius:9,background:`linear-gradient(135deg,${C.teal},${C.tealLight})`,color:'#fff',fontWeight:700,opacity:form.plan.trim()&&form.startDate?1:.5,cursor:'pointer'}}>{saving?'Saving…':editingId?'Save Changes':'Add Therapy'}</button>{editingId&&<button onClick={closeForm} style={{padding:'10px 18px',border:`1px solid ${C.border}`,borderRadius:9,background:'#fff',color:C.text2,fontWeight:600,cursor:'pointer'}}>Cancel</button>}</div>
    </div>}

    {loading?<div style={{padding:40,textAlign:'center',color:C.text3}}>Loading therapies…</div>:therapies.length===0?<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:48,textAlign:'center',color:C.text3}}>No therapies or care plans yet.</div>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))',gap:14}}>{therapies.map(item=>{const done=Boolean(item.endDate&&new Date(item.endDate).getTime()<now);return <div key={item.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:18,boxShadow:'0 2px 8px rgba(0,0,0,.05)'}}>
      <div style={{display:'flex',alignItems:'flex-start',gap:11,marginBottom:12}}><div style={{width:42,height:42,borderRadius:11,background:C.tealBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:21}}>{ICONS[item.type]??'🌱'}</div><div style={{flex:1}}><div style={{fontWeight:700,color:C.text}}>{String(item.type??'Therapy').replace(/_/g,' ')}</div><div style={{fontSize:12,color:C.text2,marginTop:3,lineHeight:1.5}}>{item.plan}</div></div><span style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:100,background:done?'#F5F3FF':'#F0FDF4',color:done?C.purple:C.green}}>{done?'COMPLETED':'ACTIVE'}</span></div>
      {item.targetValue&&<div style={{fontSize:12,color:C.text2,marginBottom:4}}><strong>Target:</strong> {item.targetValue}</div>}{item.currentValue&&<div style={{fontSize:12,color:C.text2,marginBottom:4}}><strong>Current:</strong> {item.currentValue}</div>}
      <div style={{fontSize:11,color:C.text3,marginTop:8}}>{new Date(item.startDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}{item.endDate?` → ${new Date(item.endDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}`:' · ongoing'}</div>{item.notes&&<div style={{fontSize:12,color:C.text2,marginTop:7,lineHeight:1.5}}>{item.notes}</div>}
      <div style={{display:'flex',gap:8,marginTop:12}}><button onClick={()=>openEdit(item)} style={{flex:1,padding:'7px 11px',border:'1px solid #99F6E4',borderRadius:8,background:'#F0FDFA',color:'#0F766E',fontSize:11,fontWeight:700,cursor:'pointer'}}>Edit / Update</button><button onClick={()=>remove(item.id)} disabled={acting===item.id} style={{flex:1,padding:'7px 11px',border:'1px solid #FECDD3',borderRadius:8,background:'#FFF1F2',color:C.red,fontSize:11,fontWeight:700,cursor:'pointer'}}>{acting===item.id?'Removing…':'Remove'}</button></div>
    </div>;})}</div>}
  </div>;
}
