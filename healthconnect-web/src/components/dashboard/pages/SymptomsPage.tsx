'use client';

import { useCallback, useEffect, useState } from 'react';
import { patientAPI } from '@/lib/api';

const C = { card:'#FFFFFF', border:'#E2EEF0', teal:'#0D9488', tealLight:'#14B8A6', tealBg:'#F0FDF9', text:'#0F2D2A', text2:'#4B6E6A', text3:'#64748B', red:'#DC2626', amber:'#D97706', green:'#16A34A' };
const TIMEFRAMES = ['7D','30D','90D'] as const;
type TF = typeof TIMEFRAMES[number];
const DAYS: Record<TF,number> = { '7D':7, '30D':30, '90D':90 };
const severityColor = (value:number) => value >= 7 ? C.red : value >= 4 ? C.amber : C.green;
const severityLabel = (value:number) => value >= 7 ? 'Severe' : value >= 4 ? 'Moderate' : 'Mild';
const splitTriggers = (value:string) => value.split(',').map(item => item.trim()).filter(Boolean);
const triggerText = (value:unknown) => Array.isArray(value) ? value.join(', ') : typeof value === 'string' ? value : '';

function FrequencyChart({ symptoms }:{ symptoms:any[] }) {
  const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const counts = Array(7).fill(0);
  symptoms.forEach(item => { const date = new Date(item.loggedAt); if (!Number.isNaN(date.getTime())) counts[(date.getDay()+6)%7] += 1; });
  const max = Math.max(...counts,1);
  return <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:20,boxShadow:'0 2px 8px rgba(0,0,0,.05)' }}>
    <div style={{ fontWeight:700,fontSize:14,color:C.text,marginBottom:16 }}>📊 Symptom Frequency</div>
    <div style={{ display:'flex',alignItems:'flex-end',gap:8,height:82 }}>{labels.map((label,index) => <div key={label} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6 }}><div title={`${counts[index]} entries`} style={{ width:'100%',height:`${counts[index] ? Math.max(12,counts[index]/max*68) : 4}px`,borderRadius:'4px 4px 0 0',background:counts[index] ? C.teal : '#E2EEF0',opacity:counts[index] ? 1:.35 }} /><span style={{ fontSize:10,color:C.text3 }}>{label}</span></div>)}</div>
  </div>;
}

export default function SymptomsPage() {
  const [symptoms,setSymptoms] = useState<any[]>([]);
  const [timeframe,setTimeframe] = useState<TF>('30D');
  const [loading,setLoading] = useState(true);
  const [showLog,setShowLog] = useState(false);
  const [submitting,setSubmitting] = useState(false);
  const [acting,setActing] = useState<string|null>(null);
  const [search,setSearch] = useState('');
  const [message,setMessage] = useState('');
  const [form,setForm] = useState({ name:'',severity:5,triggers:'',notes:'' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = new Date(Date.now()-DAYS[timeframe]*86400000).toISOString();
      const res:any = await patientAPI.getSymptoms({ from,limit:200 });
      const data = res?.data?.data ?? res?.data ?? {};
      setSymptoms(Array.isArray(data) ? data : data.symptoms ?? []);
    } catch (e:any) { setMessage(e?.response?.data?.message ?? 'Unable to load symptoms.'); }
    finally { setLoading(false); }
  },[timeframe]);

  useEffect(() => { load(); },[load]);

  const save = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true); setMessage('');
    try {
      await patientAPI.logSymptom({ name:form.name.trim(),severity:form.severity,triggers:splitTriggers(form.triggers),notes:form.notes.trim()||undefined });
      setForm({ name:'',severity:5,triggers:'',notes:'' }); setShowLog(false); setMessage('✓ Symptom logged'); await load();
    } catch (e:any) { setMessage(e?.response?.data?.message ?? 'Unable to save symptom.'); }
    finally { setSubmitting(false); }
  };

  const resolve = async (id:string) => {
    setActing(id);
    try { await patientAPI.updateSymptom(id,{ resolvedAt:new Date().toISOString() }); setMessage('✓ Symptom marked resolved'); await load(); }
    catch (e:any) { setMessage(e?.response?.data?.message ?? 'Unable to update symptom.'); }
    finally { setActing(null); }
  };

  const remove = async (id:string) => {
    if (!confirm('Delete this symptom entry?')) return;
    setActing(id);
    try { await patientAPI.deleteSymptom(id); setMessage('✓ Symptom entry deleted'); await load(); }
    catch (e:any) { setMessage(e?.response?.data?.message ?? 'Unable to delete symptom.'); }
    finally { setActing(null); }
  };

  const query = search.trim().toLowerCase();
  const filtered = query ? symptoms.filter(item => `${item.name} ${triggerText(item.triggers)} ${item.notes ?? ''}`.toLowerCase().includes(query)) : symptoms;
  const active = symptoms.filter(item => !item.resolvedAt).length;
  const severe = symptoms.filter(item => !item.resolvedAt && Number(item.severity)>=7).length;
  const thisWeek = symptoms.filter(item => Date.now()-new Date(item.loggedAt).getTime() < 7*86400000).length;
  const input:React.CSSProperties = { width:'100%',padding:'10px 12px',border:`1px solid ${C.border}`,borderRadius:9,background:'#F8FFFE',color:C.text,fontSize:13,boxSizing:'border-box',outline:'none' };
  const label:React.CSSProperties = { display:'block',fontSize:11,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:6 };

  return <div style={{ padding:'4px 0' }}>
    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24 }}><div><h2 style={{ fontSize:22,fontWeight:800,color:C.text,margin:0 }}>🩺 Symptoms Tracker</h2><div style={{ fontSize:13,color:C.text3,marginTop:4 }}>Log symptoms, track severity and close entries when they resolve</div></div><button onClick={() => setShowLog(value => !value)} style={{ padding:'10px 20px',border:'none',borderRadius:10,fontWeight:700,cursor:'pointer',background:showLog?'#F1F5F9':`linear-gradient(135deg,${C.teal},${C.tealLight})`,color:showLog?C.text2:'#fff' }}>{showLog?'✕ Cancel':'+ Log Symptom'}</button></div>

    {message && <div style={{ marginBottom:16,padding:'10px 14px',borderRadius:10,background:message.startsWith('✓')?'#F0FDF4':'#FFF7ED',color:message.startsWith('✓')?'#15803D':'#B45309',fontSize:13,fontWeight:600 }}>{message}</div>}

    <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:24 }}>{[
      ['🤕',active,'Active Symptoms',C.red],['⚠️',severe,'Severe (7–10)',C.amber],['📅',thisWeek,'Logged This Week',C.teal]
    ].map(([icon,value,text,color]) => <div key={String(text)} style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:'18px 20px',boxShadow:'0 2px 8px rgba(0,0,0,.05)' }}><div style={{ fontSize:25 }}>{icon}</div><div style={{ fontSize:32,fontWeight:800,color:String(color),marginTop:7 }}>{value}</div><div style={{ fontSize:13,color:C.text2,fontWeight:600 }}>{text}</div></div>)}</div>

    {showLog && <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:22,marginBottom:24,boxShadow:'0 3px 14px rgba(13,148,136,.08)' }}><div style={{ fontSize:15,fontWeight:700,color:C.text,marginBottom:16 }}>Log New Symptom</div><div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14 }}><div><label style={label}>Symptom name *</label><input style={input} placeholder="e.g. Headache, fatigue" value={form.name} onChange={e => setForm({...form,name:e.target.value})}/></div><div><label style={label}>Triggers (optional)</label><input style={input} placeholder="Comma-separated: stress, after meals" value={form.triggers} onChange={e => setForm({...form,triggers:e.target.value})}/></div></div><div style={{ marginBottom:14 }}><label style={label}>Severity: <strong style={{ color:severityColor(form.severity) }}>{form.severity}/10 — {severityLabel(form.severity)}</strong></label><input type="range" min={1} max={10} value={form.severity} onChange={e => setForm({...form,severity:Number(e.target.value)})} style={{ width:'100%',accentColor:severityColor(form.severity) }}/><div style={{ display:'flex',justifyContent:'space-between',fontSize:11,color:C.text3 }}><span>1 Mild</span><span>5 Moderate</span><span>10 Severe</span></div></div><div style={{ marginBottom:14 }}><label style={label}>Notes (optional)</label><textarea style={{...input,resize:'vertical'}} rows={2} placeholder="Duration, pattern or useful context" value={form.notes} onChange={e => setForm({...form,notes:e.target.value})}/></div><button onClick={save} disabled={submitting||!form.name.trim()} style={{ padding:'10px 26px',border:'none',borderRadius:9,background:`linear-gradient(135deg,${C.teal},${C.tealLight})`,color:'#fff',fontWeight:700,cursor:form.name.trim()?'pointer':'not-allowed',opacity:form.name.trim()?1:.5 }}>{submitting?'Saving…':'Save Symptom'}</button></div>}

    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24 }}><FrequencyChart symptoms={symptoms}/><div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:20,boxShadow:'0 2px 8px rgba(0,0,0,.05)' }}><div style={{ fontWeight:700,fontSize:14,color:C.text,marginBottom:12 }}>🔍 Search & Filter</div><input style={{...input,marginBottom:14}} placeholder="Search symptoms, triggers or notes" value={search} onChange={e => setSearch(e.target.value)}/><div style={{ display:'flex',gap:7,alignItems:'center' }}><span style={{ fontSize:12,color:C.text2,fontWeight:600 }}>Period:</span>{TIMEFRAMES.map(tf => <button key={tf} onClick={() => setTimeframe(tf)} style={{ padding:'6px 13px',borderRadius:100,border:`1px solid ${timeframe===tf?C.teal:C.border}`,background:timeframe===tf?C.tealBg:'#fff',color:timeframe===tf?C.teal:C.text2,fontWeight:700,cursor:'pointer' }}>{tf}</button>)}</div></div></div>

    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}><div style={{ fontSize:15,fontWeight:700,color:C.text }}>Symptom Entries</div><div style={{ fontSize:13,color:C.text3 }}>{filtered.length} entries</div></div>
    {loading ? <div style={{ padding:40,textAlign:'center',color:C.text3 }}>Loading symptoms…</div> : filtered.length===0 ? <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:48,textAlign:'center',color:C.text3 }}>No symptom entries found.</div> : <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))',gap:12 }}>{filtered.map(item => { const color=severityColor(item.severity); const resolved=Boolean(item.resolvedAt); const date=new Date(item.loggedAt); return <div key={item.id} style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:16,boxShadow:'0 1px 6px rgba(0,0,0,.05)',opacity:resolved?.72:1 }}><div style={{ display:'flex',gap:12,alignItems:'center',marginBottom:10 }}><div style={{ width:44,height:44,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color,border:`2px solid ${color}`,background:`${color}14` }}>{item.severity}</div><div style={{ flex:1 }}><div style={{ fontWeight:700,color:C.text }}>{item.name}</div><div style={{ fontSize:11,color:C.text3 }}>{date.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})} · {severityLabel(item.severity)}</div></div>{resolved&&<span style={{ fontSize:10,fontWeight:700,color:C.green,background:'#F0FDF4',padding:'3px 8px',borderRadius:100 }}>RESOLVED</span>}</div>{triggerText(item.triggers)&&<div style={{ fontSize:12,color:C.text2,marginBottom:4 }}>⚡ {triggerText(item.triggers)}</div>}{item.notes&&<div style={{ fontSize:12,color:C.text2,marginBottom:10 }}>{item.notes}</div>}<div style={{ display:'flex',gap:8,marginTop:10 }}>{!resolved&&<button onClick={() => resolve(item.id)} disabled={acting===item.id} style={{ flex:1,padding:'7px 9px',border:'1px solid #BBF7D0',background:'#F0FDF4',color:'#15803D',borderRadius:8,fontWeight:700,cursor:'pointer' }}>✓ Resolve</button>}<button onClick={() => remove(item.id)} disabled={acting===item.id} style={{ flex:1,padding:'7px 9px',border:'1px solid #FECDD3',background:'#FFF1F2',color:'#E11D48',borderRadius:8,fontWeight:700,cursor:'pointer' }}>{acting===item.id?'…':'Delete'}</button></div></div>; })}</div>}
  </div>;
}
