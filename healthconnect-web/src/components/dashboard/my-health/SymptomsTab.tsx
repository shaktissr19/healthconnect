'use client';

import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { patientAPI } from '@/lib/api';

const SEVERITY_COLOR = (s: number) => s >= 7 ? '#F43F5E' : s >= 4 ? '#F59E0B' : '#22C55E';
const SEVERITY_LABEL = (s: number) => s >= 7 ? 'Severe' : s >= 4 ? 'Moderate' : 'Mild';
const TIMEFRAMES = ['7D', '30D', '90D'] as const;
type TF = typeof TIMEFRAMES[number];
const TF_DAYS: Record<TF, number> = { '7D': 7, '30D': 30, '90D': 90 };
const triggerText = (value: unknown) => Array.isArray(value) ? value.join(', ') : String(value ?? '');

export default function SymptomsTab() {
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<TF>('7D');
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name:'', severity:5, bodyPart:'', triggers:'', notes:'' });

  const load = useCallback(async (tf: TF) => {
    setLoading(true);
    try {
      const from = new Date(Date.now() - TF_DAYS[tf] * 86400000).toISOString();
      const res = await patientAPI.getSymptoms({ from, limit:100 });
      const d = res?.data?.data ?? res?.data ?? {};
      setSymptoms(Array.isArray(d) ? d : d.symptoms ?? []);
      setTrend(Array.isArray(d?.trend) ? d.trend : []);
    } catch (e:any) {
      setMessage(e?.response?.data?.message ?? 'Unable to load symptoms.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(timeframe); }, [timeframe, load]);

  const handleLog = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true); setMessage('');
    try {
      await patientAPI.logSymptom({
        name: form.name.trim(),
        severity: form.severity,
        bodyPart: form.bodyPart.trim() || undefined,
        triggers: form.triggers.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      setForm({ name:'', severity:5, bodyPart:'', triggers:'', notes:'' });
      setShowLog(false);
      setMessage('✓ Symptom logged');
      await load(timeframe);
    } catch (e:any) {
      setMessage(e?.response?.data?.message ?? 'Unable to save symptom.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this symptom entry?')) return;
    setDeleting(id);
    try {
      await patientAPI.deleteSymptom(id);
      setSymptoms(prev => prev.filter(s => s.id !== id));
    } catch (e:any) {
      setMessage(e?.response?.data?.message ?? 'Unable to remove symptom.');
    } finally {
      setDeleting(null);
    }
  };

  const chartData = trend.length
    ? trend.slice(-14).map((t:any) => ({ date:t.date, value:t.avgSeverity ?? 0, label:t.date }))
    : [...symptoms].reverse().slice(-14).map((s:any) => ({ date:s.loggedAt, value:s.severity, label:s.name }));

  return <div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
      <div><div style={{fontFamily:'Syne,sans-serif',fontSize:17,fontWeight:800,color:'#0F2D2A'}}>Symptom Tracker</div><div style={{fontSize:12,color:'#64748B',marginTop:3}}>{symptoms.length} entries in the selected period</div></div>
      <button onClick={()=>setShowLog(v=>!v)} style={{...primary,background:showLog?'#F1F5F9':'linear-gradient(135deg,#0D9488,#14B8A6)',color:showLog?'#475569':'#fff'}}>{showLog?'✕ Cancel':'+ Log Symptom'}</button>
    </div>

    {message && <div style={{marginBottom:16,padding:'10px 14px',borderRadius:10,background:message.startsWith('✓')?'#F0FDF4':'#FFF7ED',color:message.startsWith('✓')?'#15803D':'#B45309',fontSize:12,fontWeight:600}}>{message}</div>}

    {showLog && <div style={{...card,padding:20,marginBottom:20}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14,marginBottom:14}}>
        <label style={label}>SYMPTOM NAME *<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Headache, cough, fatigue" style={input}/></label>
        <label style={label}>BODY AREA <span style={{fontWeight:500}}>(optional)</span><input value={form.bodyPart} onChange={e=>setForm({...form,bodyPart:e.target.value})} placeholder="e.g. Head, chest, lower back" style={input}/></label>
      </div>
      <div style={{marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:'#4B6E6A',marginBottom:7}}>SEVERITY: <span style={{color:SEVERITY_COLOR(form.severity)}}>{form.severity}/10 · {SEVERITY_LABEL(form.severity)}</span></div><input type="range" min={1} max={10} value={form.severity} onChange={e=>setForm({...form,severity:Number(e.target.value)})} style={{width:'100%',accentColor:SEVERITY_COLOR(form.severity)}}/><div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#94A3B8'}}><span>1 Mild</span><span>4–6 Moderate</span><span>7–10 Severe</span></div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14,marginBottom:16}}><label style={label}>TRIGGERS <span style={{fontWeight:500}}>(optional)</span><input value={form.triggers} onChange={e=>setForm({...form,triggers:e.target.value})} placeholder="Comma-separated, e.g. stress, meals" style={input}/></label><label style={label}>NOTES <span style={{fontWeight:500}}>(optional)</span><input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Duration, pattern or context" style={input}/></label></div>
      <button onClick={handleLog} disabled={submitting||!form.name.trim()} style={{...primary,opacity:(submitting||!form.name.trim()) ? 0.55 : 1}}>{submitting?'Saving…':'Save Symptom'}</button>
    </div>}

    <div style={{...card,padding:18,marginBottom:18}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}><div style={{fontSize:14,fontWeight:700,color:'#0F2D2A'}}>Severity trend</div><div style={{display:'flex',gap:6}}>{TIMEFRAMES.map(tf=><button key={tf} onClick={()=>setTimeframe(tf)} style={{padding:'5px 11px',borderRadius:100,border:`1px solid ${timeframe===tf?'#0D9488':'#E2EEF0'}`,background:timeframe===tf?'#F0FDFA':'#fff',color:timeframe===tf?'#0D9488':'#64748B',cursor:'pointer',fontSize:11,fontWeight:700}}>{tf}</button>)}</div></div>
      {chartData.length===0?<div style={{color:'#94A3B8',fontSize:12}}>Trend appears after symptoms are logged.</div>:<div style={{display:'flex',alignItems:'flex-end',gap:5,height:82}}>{chartData.map((d:any,i:number)=>{const val=Math.max(1,Math.min(10,Number(d.value)||1));return <div key={`${d.date}-${i}`} title={`${d.label}: ${val}/10`} style={{flex:1,height:`${val*7}px`,minWidth:5,maxWidth:34,background:SEVERITY_COLOR(val),borderRadius:'4px 4px 0 0',opacity:.85}}/>})}</div>}
    </div>

    {loading?<div style={{padding:30,textAlign:'center',color:'#64748B'}}>Loading symptoms…</div>:symptoms.length===0?<div style={{...card,padding:'36px 18px',textAlign:'center',color:'#64748B'}}>No symptoms logged in this period.</div>:<div style={{display:'flex',flexDirection:'column',gap:10}}>{symptoms.map((s:any)=>{const date=new Date(s.loggedAt);const color=SEVERITY_COLOR(Number(s.severity));return <div key={s.id} style={{...card,padding:'14px 16px',display:'flex',alignItems:'center',gap:14}}><div style={{width:42,height:42,borderRadius:'50%',display:'grid',placeItems:'center',background:`${color}14`,border:`2px solid ${color}`,color,fontWeight:800}}>{s.severity}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:800,color:'#0F2D2A',fontSize:14}}>{s.name}</div><div style={{color:'#64748B',fontSize:11,marginTop:2}}>{date.toLocaleString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>{triggerText(s.triggers)&&<div style={{color:'#64748B',fontSize:12,marginTop:5}}>Triggers: {triggerText(s.triggers)}</div>}{s.notes&&<div style={{color:'#475569',fontSize:12,marginTop:3}}>{s.notes}</div>}</div><span style={{fontSize:10,fontWeight:800,color,background:`${color}12`,padding:'4px 8px',borderRadius:100}}>{SEVERITY_LABEL(Number(s.severity)).toUpperCase()}</span><button onClick={()=>handleDelete(s.id)} disabled={deleting===s.id} title="Delete symptom" style={{border:'1px solid #FECACA',background:'#FFF1F2',color:'#E11D48',borderRadius:8,width:30,height:30,cursor:'pointer'}}>{deleting===s.id?'…':'×'}</button></div>})}</div>}
  </div>;
}

const card:CSSProperties={background:'#fff',border:'1px solid #E2EEF0',borderRadius:14,boxShadow:'0 2px 8px rgba(0,0,0,.05)'};
const input:CSSProperties={display:'block',width:'100%',boxSizing:'border-box',marginTop:6,padding:'9px 11px',border:'1px solid #DCE7E8',borderRadius:9,background:'#F8FFFE',color:'#0F2D2A',fontSize:13,outline:'none',fontFamily:'inherit'};
const label:CSSProperties={fontSize:11,fontWeight:700,color:'#4B6E6A'};
const primary:CSSProperties={padding:'9px 18px',border:0,borderRadius:9,background:'linear-gradient(135deg,#0D9488,#14B8A6)',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:13};