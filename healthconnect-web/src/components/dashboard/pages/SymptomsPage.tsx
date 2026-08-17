'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { patientAPI } from '@/lib/api';

const C = { card:'#fff', border:'#E2EEF0', text:'#0F2D2A', text2:'#4B6E6A', muted:'#64748B', teal:'#0D9488', green:'#16A34A', amber:'#D97706', red:'#DC2626' };
const TIMEFRAMES = ['7D','30D','90D'] as const;
type TF = typeof TIMEFRAMES[number];
const DAYS: Record<TF,number> = { '7D':7, '30D':30, '90D':90 };
const severityColor = (s:number) => s >= 7 ? C.red : s >= 4 ? C.amber : C.green;
const severityLabel = (s:number) => s >= 7 ? 'Severe' : s >= 4 ? 'Moderate' : 'Mild';
const triggerText = (v:unknown) => Array.isArray(v) ? v.join(', ') : String(v ?? '');

export default function SymptomsPage() {
  const [symptoms,setSymptoms] = useState<any[]>([]);
  const [timeframe,setTimeframe] = useState<TF>('30D');
  const [loading,setLoading] = useState(true);
  const [showLog,setShowLog] = useState(false);
  const [submitting,setSubmitting] = useState(false);
  const [deleting,setDeleting] = useState<string|null>(null);
  const [search,setSearch] = useState('');
  const [message,setMessage] = useState('');
  const [form,setForm] = useState({name:'',severity:5,bodyPart:'',triggers:'',notes:''});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = new Date(Date.now()-DAYS[timeframe]*86400000).toISOString();
      const res = await patientAPI.getSymptoms({from,limit:200});
      const d = res?.data?.data ?? res?.data ?? {};
      setSymptoms(Array.isArray(d) ? d : d.symptoms ?? []);
    } catch (e:any) {
      setMessage(e?.response?.data?.message ?? 'Unable to load symptoms.');
    } finally { setLoading(false); }
  },[timeframe]);

  useEffect(()=>{ load(); },[load]);

  const handleLog = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true); setMessage('');
    try {
      await patientAPI.logSymptom({
        name:form.name.trim(), severity:form.severity,
        bodyPart:form.bodyPart.trim() || undefined,
        triggers:form.triggers.trim() || undefined,
        notes:form.notes.trim() || undefined,
      });
      setForm({name:'',severity:5,bodyPart:'',triggers:'',notes:''});
      setShowLog(false); setMessage('✓ Symptom logged'); await load();
    } catch(e:any) { setMessage(e?.response?.data?.message ?? 'Unable to save symptom.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id:string) => {
    if (!confirm('Remove this symptom entry?')) return;
    setDeleting(id);
    try { await patientAPI.deleteSymptom(id); setSymptoms(prev=>prev.filter(s=>s.id!==id)); }
    catch(e:any) { setMessage(e?.response?.data?.message ?? 'Unable to remove symptom.'); }
    finally { setDeleting(null); }
  };

  const filtered = useMemo(() => {
    const q=search.trim().toLowerCase();
    if (!q) return symptoms;
    return symptoms.filter(s => `${s.name} ${s.notes ?? ''} ${triggerText(s.triggers)}`.toLowerCase().includes(q));
  },[symptoms,search]);

  const severeCount=symptoms.filter(s=>Number(s.severity)>=7).length;
  const thisWeek=symptoms.filter(s=>Date.now()-new Date(s.loggedAt).getTime()<7*86400000).length;
  const avg=symptoms.length ? (symptoms.reduce((n,s)=>n+Number(s.severity||0),0)/symptoms.length).toFixed(1) : '—';

  return <div style={{display:'flex',flexDirection:'column',gap:20}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}>
      <div><h1 style={{margin:0,color:C.text,fontSize:26,fontWeight:800}}>🤕 Symptoms</h1><div style={{marginTop:5,color:C.text2,fontSize:14}}>Log symptoms and watch how their frequency and severity change over time.</div></div>
      <button onClick={()=>setShowLog(v=>!v)} style={primary}>{showLog?'✕ Cancel':'+ Log Symptom'}</button>
    </div>

    {message && <div style={{padding:'11px 14px',borderRadius:10,background:message.startsWith('✓')?'#F0FDF4':'#FFF7ED',color:message.startsWith('✓')?'#15803D':'#B45309',fontSize:13,fontWeight:600}}>{message}</div>}

    <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:14}}>
      <Kpi label="Entries" value={symptoms.length} sub={`${timeframe} period`} color={C.teal}/>
      <Kpi label="Severe" value={severeCount} sub="Severity 7–10" color={severeCount?C.red:C.green}/>
      <Kpi label="Average severity" value={avg} sub={`${thisWeek} logged this week`} color={C.amber}/>
    </div>

    {showLog && <div style={card}>
      <div style={{fontSize:15,fontWeight:800,color:C.text,marginBottom:16}}>Log new symptom</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        <Field label="Symptom name *"><input style={input} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Headache, cough, fatigue"/></Field>
        <Field label="Body area (optional)"><input style={input} value={form.bodyPart} onChange={e=>setForm({...form,bodyPart:e.target.value})} placeholder="e.g. Head, chest, lower back"/></Field>
      </div>
      <Field label={`Severity ${form.severity}/10 · ${severityLabel(form.severity)}`}><input type="range" min={1} max={10} value={form.severity} onChange={e=>setForm({...form,severity:Number(e.target.value)})} style={{width:'100%',accentColor:severityColor(form.severity)}}/><div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:C.muted}}><span>1 Mild</span><span>4–6 Moderate</span><span>7–10 Severe</span></div></Field>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginTop:14,marginBottom:16}}>
        <Field label="Triggers (optional)"><input style={input} value={form.triggers} onChange={e=>setForm({...form,triggers:e.target.value})} placeholder="Comma-separated, e.g. stress, meals"/></Field>
        <Field label="Notes (optional)"><input style={input} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Duration, pattern or context"/></Field>
      </div>
      <button onClick={handleLog} disabled={submitting||!form.name.trim()} style={{...primary,opacity:submitting||!form.name.trim()?.55:1}}>{submitting?'Saving…':'Save Symptom'}</button>
    </div>}

    <div style={{...card,padding:16,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
      <input style={{...input,maxWidth:420}} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search symptom, trigger or note…"/>
      <div style={{display:'flex',gap:6}}>{TIMEFRAMES.map(tf=><button key={tf} onClick={()=>setTimeframe(tf)} style={{padding:'7px 14px',borderRadius:100,border:`1px solid ${timeframe===tf?C.teal:C.border}`,background:timeframe===tf?'#F0FDFA':'#fff',color:timeframe===tf?C.teal:C.muted,fontWeight:700,cursor:'pointer'}}>{tf}</button>)}</div>
    </div>

    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div style={{fontSize:15,fontWeight:800,color:C.text}}>Symptom entries</div><div style={{fontSize:12,color:C.muted}}>{filtered.length} shown</div></div>
    {loading ? <div style={{...card,padding:36,textAlign:'center',color:C.muted}}>Loading symptoms…</div> : filtered.length===0 ? <div style={{...card,padding:42,textAlign:'center',color:C.muted}}>No symptom entries found.</div> : <div style={{display:'flex',flexDirection:'column',gap:10}}>{filtered.map(s=>{
      const color=severityColor(Number(s.severity)); const d=new Date(s.loggedAt);
      return <div key={s.id} style={{...card,padding:'15px 17px',display:'flex',gap:14,alignItems:'center'}}>
        <div style={{width:46,height:46,borderRadius:'50%',display:'grid',placeItems:'center',background:`${color}12`,border:`2px solid ${color}`,color,fontWeight:900}}>{s.severity}</div>
        <div style={{flex:1,minWidth:0}}><div style={{fontSize:15,fontWeight:800,color:C.text}}>{s.name}</div><div style={{fontSize:11,color:C.muted,marginTop:3}}>{d.toLocaleString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>{triggerText(s.triggers)&&<div style={{fontSize:12,color:C.text2,marginTop:5}}>Triggers: {triggerText(s.triggers)}</div>}{s.notes&&<div style={{fontSize:12,color:C.text2,marginTop:3}}>{s.notes}</div>}</div>
        <span style={{fontSize:10,fontWeight:800,color,background:`${color}12`,padding:'4px 9px',borderRadius:100}}>{severityLabel(Number(s.severity)).toUpperCase()}</span>
        <button onClick={()=>handleDelete(s.id)} disabled={deleting===s.id} title="Delete entry" style={{border:'1px solid #FECACA',background:'#FFF1F2',color:'#E11D48',borderRadius:8,width:32,height:32,cursor:'pointer'}}>{deleting===s.id?'…':'×'}</button>
      </div>;
    })}</div>}
  </div>;
}

function Kpi({label,value,sub,color}:{label:string;value:string|number;sub:string;color:string}) { return <div style={{...card,padding:'18px 20px'}}><div style={{fontSize:11,fontWeight:800,color:C.muted,textTransform:'uppercase',letterSpacing:'.06em'}}>{label}</div><div style={{fontSize:30,fontWeight:900,color,marginTop:8}}>{value}</div><div style={{fontSize:12,color:C.muted,marginTop:4}}>{sub}</div></div>; }
function Field({label,children}:{label:string;children:React.ReactNode}) { return <label style={{display:'block',fontSize:11,fontWeight:800,color:C.text2,textTransform:'uppercase',letterSpacing:'.04em'}}>{label}<div style={{marginTop:6}}>{children}</div></label>; }
const card:React.CSSProperties={background:C.card,border:`1px solid ${C.border}`,borderRadius:14,boxShadow:'0 2px 8px rgba(0,0,0,.05)'};
const input:React.CSSProperties={width:'100%',boxSizing:'border-box',padding:'10px 12px',border:`1px solid ${C.border}`,borderRadius:9,background:'#F8FFFE',color:C.text,fontSize:13,outline:'none',fontFamily:'inherit'};
const primary:React.CSSProperties={padding:'10px 19px',border:0,borderRadius:9,background:'linear-gradient(135deg,#0D9488,#14B8A6)',color:'#fff',fontWeight:800,cursor:'pointer',fontSize:13};