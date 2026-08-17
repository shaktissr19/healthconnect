'use client';

import { useEffect, useState } from 'react';
import { patientAPI } from '@/lib/api';

const C={card:'#fff',border:'#E2EEF0',text:'#0F2D2A',text2:'#4B6E6A',muted:'#64748B',teal:'#0D9488',green:'#16A34A',amber:'#D97706',purple:'#7C3AED'};
const TYPES=['EXERCISE','DIET','SLEEP','STRESS','MEDITATION','PHYSIOTHERAPY','OTHER'];
const ICON:Record<string,string>={EXERCISE:'🏃',DIET:'🥗',SLEEP:'😴',STRESS:'🧘',MEDITATION:'🧘',PHYSIOTHERAPY:'💆',OTHER:'🌱'};

export default function TherapiesPage(){
  const [items,setItems]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [showAdd,setShowAdd]=useState(false);
  const [saving,setSaving]=useState(false);
  const [deleting,setDeleting]=useState<string|null>(null);
  const [message,setMessage]=useState('');
  const [form,setForm]=useState({type:'EXERCISE',plan:'',targetValue:'',currentValue:'',startDate:new Date().toISOString().slice(0,10),endDate:'',notes:''});

  const load=async()=>{
    setLoading(true);
    try{
      const r=await patientAPI.getTherapies();
      const d=r?.data?.data??r?.data??[];
      setItems(Array.isArray(d)?d:d.therapies??[]);
    }catch(e:any){setMessage(e?.response?.data?.message??'Unable to load therapies.');}
    finally{setLoading(false);}
  };
  useEffect(()=>{load();},[]);

  const add=async()=>{
    if(!form.plan.trim())return;
    setSaving(true);setMessage('');
    try{
      await patientAPI.addTherapy({
        type:form.type,
        plan:form.plan.trim(),
        targetValue:form.targetValue.trim()||undefined,
        currentValue:form.currentValue.trim()||undefined,
        startDate:new Date(`${form.startDate}T00:00:00`).toISOString(),
        endDate:form.endDate?new Date(`${form.endDate}T00:00:00`).toISOString():undefined,
        notes:form.notes.trim()||undefined,
      });
      setForm({type:'EXERCISE',plan:'',targetValue:'',currentValue:'',startDate:new Date().toISOString().slice(0,10),endDate:'',notes:''});
      setShowAdd(false);setMessage('✓ Therapy added');await load();
    }catch(e:any){setMessage(e?.response?.data?.message??'Unable to add therapy.');}
    finally{setSaving(false);}
  };

  const remove=async(id:string)=>{
    if(!confirm('Remove this therapy plan?'))return;
    setDeleting(id);
    try{await patientAPI.deleteTherapy(id);setItems(v=>v.filter(x=>x.id!==id));}
    catch(e:any){setMessage(e?.response?.data?.message??'Unable to remove therapy.');}
    finally{setDeleting(null);}
  };

  return <div style={{display:'flex',flexDirection:'column',gap:20}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
      <div><h1 style={{margin:0,fontSize:26,fontWeight:800,color:C.text}}>🌱 Therapies</h1><div style={{fontSize:14,color:C.text2,marginTop:5}}>Track lifestyle, rehabilitation and supportive care plans.</div></div>
      <button onClick={()=>setShowAdd(v=>!v)} style={primary}>{showAdd?'✕ Cancel':'+ Add Therapy'}</button>
    </div>

    {message&&<div style={{padding:'11px 14px',borderRadius:10,background:message.startsWith('✓')?'#F0FDF4':'#FFF7ED',color:message.startsWith('✓')?'#15803D':'#B45309',fontSize:13,fontWeight:600}}>{message}</div>}

    <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:14}}>
      <Kpi label="Total plans" value={items.length} color={C.teal}/>
      <Kpi label="With targets" value={items.filter(x=>x.targetValue).length} color={C.green}/>
      <Kpi label="With end date" value={items.filter(x=>x.endDate).length} color={C.purple}/>
    </div>

    {showAdd&&<div style={{...card,padding:22}}>
      <div style={{fontSize:15,fontWeight:800,color:C.text,marginBottom:16}}>Add therapy plan</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:14,marginBottom:14}}>
        <Field label="Type"><select style={input} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{TYPES.map(t=><option key={t} value={t}>{ICON[t]} {t.replace(/_/g,' ')}</option>)}</select></Field>
        <Field label="Plan *"><input style={input} value={form.plan} onChange={e=>setForm({...form,plan:e.target.value})} placeholder="e.g. Brisk walking 30 minutes, 5 days/week"/></Field>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14,marginBottom:14}}>
        <Field label="Target (optional)"><input style={input} value={form.targetValue} onChange={e=>setForm({...form,targetValue:e.target.value})} placeholder="e.g. 150 min/week"/></Field>
        <Field label="Current progress (optional)"><input style={input} value={form.currentValue} onChange={e=>setForm({...form,currentValue:e.target.value})} placeholder="e.g. 90 min/week"/></Field>
        <Field label="Start date *"><input style={input} type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/></Field>
        <Field label="End date (optional)"><input style={input} type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}/></Field>
      </div>
      <Field label="Notes (optional)"><textarea style={{...input,minHeight:76,resize:'vertical'}} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Instructions, goals or care notes"/></Field>
      <button onClick={add} disabled={saving||!form.plan.trim()||!form.startDate} style={{...primary,marginTop:16,opacity:saving||!form.plan.trim()||!form.startDate?.55:1}}>{saving?'Saving…':'Save Therapy'}</button>
    </div>}

    {loading?<div style={{...card,padding:38,textAlign:'center',color:C.muted}}>Loading therapies…</div>:items.length===0?<div style={{...card,padding:44,textAlign:'center',color:C.muted}}>No therapy plans recorded.</div>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(330px,1fr))',gap:14}}>{items.map(t=>{
      const target=String(t.targetValue??'');const current=String(t.currentValue??'');
      const targetNum=Number(target.match(/[\d.]+/)?.[0]);const currentNum=Number(current.match(/[\d.]+/)?.[0]);
      const pct=Number.isFinite(targetNum)&&targetNum>0&&Number.isFinite(currentNum)?Math.min(100,Math.round(currentNum/targetNum*100)):null;
      return <div key={t.id} style={{...card,padding:18,position:'relative'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}><div style={{width:44,height:44,borderRadius:12,background:'#F0FDFA',display:'grid',placeItems:'center',fontSize:22}}>{ICON[t.type]??'🌱'}</div><div><div style={{fontSize:11,fontWeight:800,color:C.teal,textTransform:'uppercase'}}>{String(t.type).replace(/_/g,' ')}</div><div style={{fontSize:15,fontWeight:800,color:C.text,marginTop:2}}>{t.plan}</div></div></div>
        {(target||current)&&<div style={{padding:'10px 12px',borderRadius:10,background:'#F8FAFC',marginBottom:12,fontSize:12,color:C.text2}}><div>Target: <b>{target||'—'}</b></div><div style={{marginTop:3}}>Current: <b>{current||'—'}</b></div>{pct!==null&&<div style={{marginTop:8}}><div style={{height:7,background:'#E2EEF0',borderRadius:100,overflow:'hidden'}}><div style={{height:'100%',width:`${pct}%`,background:C.teal}}/></div><div style={{fontSize:10,color:C.muted,marginTop:3}}>{pct}% of numeric target</div></div>}</div>}
        <div style={{fontSize:11,color:C.muted}}>Started {new Date(t.startDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}{t.endDate?` · Ends ${new Date(t.endDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}`:''}</div>
        {t.notes&&<div style={{fontSize:12,color:C.text2,marginTop:8,lineHeight:1.5}}>{t.notes}</div>}
        <button onClick={()=>remove(t.id)} disabled={deleting===t.id} style={{marginTop:14,padding:'6px 10px',border:'1px solid #FECACA',borderRadius:8,background:'#FFF1F2',color:'#E11D48',fontSize:11,fontWeight:700,cursor:'pointer'}}>{deleting===t.id?'Removing…':'Remove'}</button>
      </div>;
    })}</div>}
  </div>;
}

function Kpi({label,value,color}:{label:string;value:number;color:string}){return <div style={{...card,padding:'18px 20px'}}><div style={{fontSize:11,fontWeight:800,color:C.muted,textTransform:'uppercase',letterSpacing:'.06em'}}>{label}</div><div style={{fontSize:30,fontWeight:900,color,marginTop:8}}>{value}</div></div>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label style={{display:'block',fontSize:11,fontWeight:800,color:C.text2,textTransform:'uppercase',letterSpacing:'.04em'}}>{label}<div style={{marginTop:6}}>{children}</div></label>}
const card:React.CSSProperties={background:C.card,border:`1px solid ${C.border}`,borderRadius:14,boxShadow:'0 2px 8px rgba(0,0,0,.05)'};
const input:React.CSSProperties={width:'100%',boxSizing:'border-box',padding:'10px 12px',border:`1px solid ${C.border}`,borderRadius:9,background:'#F8FFFE',color:C.text,fontSize:13,outline:'none',fontFamily:'inherit'};
const primary:React.CSSProperties={padding:'10px 19px',border:0,borderRadius:9,background:'linear-gradient(135deg,#0D9488,#14B8A6)',color:'#fff',fontWeight:800,cursor:'pointer',fontSize:13};