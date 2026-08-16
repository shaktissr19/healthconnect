'use client';
import { useState, useEffect, useCallback } from 'react';
import { patientAPI } from '@/lib/api';

const C = { card:'#FFFFFF',border:'#E2EEF0',teal:'#0D9488',tealLight:'#14B8A6',tealBg:'rgba(13,148,136,0.08)',text:'#0F2D2A',text2:'#4B6E6A',text3:'#4B6E6A',green:'#22C55E',amber:'#F59E0B',rose:'#F43F5E',violet:'#8B5CF6' };

// Keys intentionally match the Prisma VitalType enum / Patient API contract.
const VITAL_TYPES = [
  { key:'bp',          label:'Blood Pressure',    unit:'mmHg',  icon:'🫀', normal:'90-120 / 60-80', color:'#F43F5E', isBP:true },
  { key:'heart_rate',  label:'Heart Rate',        unit:'bpm',   icon:'💓', normal:'60-100 bpm',     color:'#F43F5E', isBP:false },
  { key:'blood_sugar', label:'Blood Sugar',       unit:'mg/dL', icon:'🩸', normal:'Context-specific', color:'#F59E0B', isBP:false },
  { key:'weight',      label:'Weight',            unit:'kg',    icon:'⚖️', normal:'Used with height for BMI', color:'#8B5CF6', isBP:false },
  { key:'temperature', label:'Temperature',       unit:'°F',    icon:'🌡️', normal:'97-99°F',        color:'#14B8A6', isBP:false },
  { key:'spo2',        label:'Oxygen Saturation', unit:'%',     icon:'🫁', normal:'95-100%',        color:'#3B82F6', isBP:false },
  { key:'hba1c',       label:'HbA1c',             unit:'%',     icon:'🧪', normal:'Context-specific', color:'#10B981', isBP:false },
  { key:'cholesterol', label:'Cholesterol',       unit:'mg/dL', icon:'🧬', normal:'Specify LDL/HDL/Total in context or notes', color:'#6366F1', isBP:false },
] as const;

const EMPTY = { type:'bp', systolic:'', diastolic:'', value:'', context:'RESTING', notes:'', measuredAt:'' };

export default function VitalsPage() {
  const [vitals,  setVitals]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form,    setForm]    = useState({...EMPTY});
  const [filter,  setFilter]  = useState('ALL');
  const [toast,   setToast]   = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params: any = { limit:100 };
    if (filter !== 'ALL') params.type = filter;
    patientAPI.getVitals(params)
      .then(r => {
        const d = (r as any)?.data?.data ?? (r as any)?.data ?? {};
        setVitals(Array.isArray(d) ? d : d.vitals ?? []);
      })
      .catch((e:any)=>setToast(e?.response?.data?.message ?? 'Unable to load vitals.'))
      .finally(()=>setLoading(false));
  }, [filter]);

  useEffect(()=>{ load(); },[load]);

  const handleSave = async () => {
    const vt = VITAL_TYPES.find(v => v.key === form.type);
    if (!vt) { setToast('Select a valid vital type'); return; }
    if (vt.isBP && (!form.systolic || !form.diastolic)) { setToast('Enter both systolic and diastolic'); return; }
    if (!vt.isBP && !form.value) { setToast('Enter a value'); return; }

    setSaving(true);
    try {
      const payload: any = {
        type: vt.key,
        unit: vt.unit,
        context: form.context || undefined,
        notes: form.notes || undefined,
        // datetime-local represents the patient's local wall-clock time. Browser converts it
        // to an absolute instant before the API/DB stores UTC.
        measuredAt: form.measuredAt ? new Date(form.measuredAt).toISOString() : new Date().toISOString(),
      };

      if (vt.isBP) {
        const systolic = Number(form.systolic);
        const diastolic = Number(form.diastolic);
        if (!Number.isFinite(systolic) || !Number.isFinite(diastolic) || systolic <= 0 || diastolic <= 0) {
          setToast('Enter valid blood pressure values'); setSaving(false); return;
        }
        payload.systolic = systolic;
        payload.diastolic = diastolic;
        // Vital.value is required by Prisma even for BP.
        payload.value = `${systolic}/${diastolic}`;
      } else {
        const value = Number(form.value);
        if (!Number.isFinite(value)) { setToast('Enter a valid value'); setSaving(false); return; }
        // Vital.value is a String in Prisma; keep the API contract type-safe.
        payload.value = String(value);
      }

      await patientAPI.logVital(payload);
      setForm({...EMPTY});
      setShowAdd(false);
      setToast('✓ Vital logged!');
      load();
    } catch (e:any) {
      setToast(e?.response?.data?.message ?? 'Failed to save vital. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id:string) => {
    if (!confirm('Delete this vital reading?')) return;
    try { await (patientAPI as any).deleteVital(id); load(); }
    catch (e:any) { setToast(e?.response?.data?.message ?? 'Unable to delete vital.'); }
  };

  const latestByType: Record<string,any> = {};
  vitals.forEach(v => { if (!latestByType[v.type]) latestByType[v.type] = v; });

  const selectedVT = VITAL_TYPES.find(v => v.key === form.type) ?? VITAL_TYPES[0];
  const displayed  = filter === 'ALL' ? vitals : vitals.filter(v => v.type === filter);

  return (
    <>
      <style>{`
        .vp-skel { border-radius:12px; background:linear-gradient(90deg,#E8F4F3 25%,#F0F9F8 50%,#E8F4F3 75%); background-size:200% 100%; animation:vp-sh 1.5s infinite; }
        @keyframes vp-sh{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .vp-inp { width:100%; padding:9px 12px; background:#F8FCFC; border:1px solid ${C.border}; border-radius:9px; color:${C.text}; font-size:13px; outline:none; box-sizing:border-box; font-family:inherit; transition:border-color 0.2s; }
        .vp-inp:focus { border-color:${C.teal}; }
        .vp-lbl { display:block; font-size:11px; color:${C.text3}; margin-bottom:5px; text-transform:uppercase; letter-spacing:.06em; }
        .vp-btn-p { padding:9px 20px; background:linear-gradient(135deg,${C.teal},${C.tealLight}); color:#fff; border:none; border-radius:9px; font-weight:700; cursor:pointer; font-size:13px; font-family:inherit; }
        .vp-btn-g { padding:9px 18px; background:#F8FCFC; border:1px solid ${C.border}; color:${C.text2}; border-radius:9px; font-weight:600; cursor:pointer; font-size:13px; font-family:inherit; }
      `}</style>

      <div style={{ maxWidth:1100 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
          <div>
            <h2 style={{ fontSize:22, fontWeight:800, color:C.text, margin:'0 0 4px' }}>📊 Vitals</h2>
            <p style={{ fontSize:13, color:C.text2, margin:0 }}>Track your health metrics over time</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="vp-btn-g" onClick={load}>↻ Refresh</button>
            <button className="vp-btn-p" onClick={()=>setShowAdd(!showAdd)}>{showAdd?'✕ Cancel':'+ Log Vital'}</button>
          </div>
        </div>

        {toast && (
          <div style={{ background:toast.startsWith('✓')?'rgba(34,197,94,0.1)':'rgba(244,63,94,0.1)', border:`1px solid ${toast.startsWith('✓')?C.green:C.rose}`, borderRadius:10, padding:'10px 16px', marginBottom:16, fontSize:13, color:toast.startsWith('✓')?C.green:C.rose, fontWeight:600, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            {toast}<button onClick={()=>setToast('')} style={{ background:'none',border:'none',cursor:'pointer',color:'inherit',fontSize:18,lineHeight:1 }}>×</button>
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:12 }}>
          {VITAL_TYPES.slice(0,4).map(vt => {
            const latest = latestByType[vt.key];
            const val = latest ? (vt.isBP ? `${latest.systolic}/${latest.diastolic}` : latest.value??'—') : '—';
            return (
              <div key={vt.key} onClick={()=>setFilter(vt.key)} style={{ background:C.card, border:`1px solid ${filter===vt.key?vt.color:C.border}`, borderRadius:14, padding:'16px 18px', cursor:'pointer', transition:'all 0.2s', boxShadow:filter===vt.key?`0 2px 10px ${vt.color}25`:'0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10 }}><span style={{ fontSize:18 }}>{vt.icon}</span><span style={{ fontSize:13, color:C.text3, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>{vt.label}</span></div>
                <div style={{ fontSize:22, fontWeight:900, color:latest?vt.color:C.text3, lineHeight:1 }}>{loading?'…':val}</div>
                <div style={{ fontSize:10, color:C.text3, marginTop:4 }}>{vt.unit} · {vt.normal}</div>
                {latest?.measuredAt && <div style={{ fontSize:10, color:C.text3, marginTop:2 }}>Last: {new Date(latest.measuredAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>}
              </div>
            );
          })}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
          {VITAL_TYPES.slice(4).map(vt => {
            const latest = latestByType[vt.key];
            const val = latest ? (latest.value??'—') : '—';
            return (
              <div key={vt.key} onClick={()=>setFilter(vt.key)} style={{ background:C.card, border:`1px solid ${filter===vt.key?vt.color:C.border}`, borderRadius:14, padding:'16px 18px', cursor:'pointer', transition:'all 0.2s', boxShadow:filter===vt.key?`0 2px 10px ${vt.color}25`:'0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10 }}><span style={{ fontSize:18 }}>{vt.icon}</span><span style={{ fontSize:13, color:C.text3, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>{vt.label}</span></div>
                <div style={{ fontSize:22, fontWeight:900, color:latest?vt.color:C.text3, lineHeight:1 }}>{loading?'…':val}</div>
                <div style={{ fontSize:10, color:C.text3, marginTop:4 }}>{vt.unit} · {vt.normal}</div>
                {latest?.measuredAt && <div style={{ fontSize:10, color:C.text3, marginTop:2 }}>Last: {new Date(latest.measuredAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>}
              </div>
            );
          })}
        </div>

        {showAdd && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'22px', marginBottom:24, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:18 }}>📝 Log New Vital</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:14 }}>
              <div><label className="vp-lbl">Vital Type</label><select className="vp-inp" value={form.type} onChange={e=>setForm({...EMPTY,type:e.target.value})}>{VITAL_TYPES.map(v=><option key={v.key} value={v.key}>{v.icon} {v.label}</option>)}</select></div>
              {selectedVT.isBP ? <><div><label className="vp-lbl">Systolic (mmHg)</label><input className="vp-inp" type="number" placeholder="e.g. 120" value={form.systolic} onChange={e=>setForm({...form,systolic:e.target.value})}/></div><div><label className="vp-lbl">Diastolic (mmHg)</label><input className="vp-inp" type="number" placeholder="e.g. 80" value={form.diastolic} onChange={e=>setForm({...form,diastolic:e.target.value})}/></div></> : <div><label className="vp-lbl">Value ({selectedVT.unit})</label><input className="vp-inp" type="number" step="any" placeholder="Enter value" value={form.value} onChange={e=>setForm({...form,value:e.target.value})}/></div>}
              <div><label className="vp-lbl">Context</label><select className="vp-inp" value={form.context} onChange={e=>setForm({...form,context:e.target.value})}>{['RESTING','POST_EXERCISE','FASTING','POST_MEAL','MORNING','EVENING','LDL','HDL','TOTAL'].map(c=><option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}</select></div>
              <div><label className="vp-lbl">Date &amp; Time (optional)</label><input className="vp-inp" type="datetime-local" value={form.measuredAt} onChange={e=>setForm({...form,measuredAt:e.target.value})}/></div>
              <div><label className="vp-lbl">Notes (optional)</label><input className="vp-inp" placeholder="Any notes..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
            </div>
            <div style={{ fontSize:11,color:C.text3,marginBottom:12 }}>Height is maintained in My Health → lifestyle inputs; BMI is calculated automatically from height + latest weight.</div>
            <div style={{ display:'flex', gap:10 }}><button className="vp-btn-p" onClick={handleSave} disabled={saving}>{saving?'Saving…':'Save Vital'}</button><button className="vp-btn-g" onClick={()=>{setShowAdd(false);setForm({...EMPTY});}}>Cancel</button></div>
          </div>
        )}

        <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
          <button onClick={()=>setFilter('ALL')} style={{ padding:'6px 14px',borderRadius:100,border:`1px solid ${filter==='ALL'?C.teal:C.border}`,background:filter==='ALL'?C.tealBg:C.card,color:filter==='ALL'?C.teal:C.text2,fontSize:12,fontWeight:600,cursor:'pointer' }}>All</button>
          {VITAL_TYPES.map(vt=><button key={vt.key} onClick={()=>setFilter(vt.key)} style={{ padding:'6px 14px',borderRadius:100,border:`1px solid ${filter===vt.key?vt.color:C.border}`,background:filter===vt.key?vt.color+'15':C.card,color:filter===vt.key?vt.color:C.text2,fontSize:12,fontWeight:600,cursor:'pointer' }}>{vt.icon} {vt.label}</button>)}
        </div>

        {loading ? <div style={{ display:'flex',flexDirection:'column',gap:10 }}>{[1,2,3].map(i=><div key={i} className="vp-skel" style={{ height:64 }}/>)}</div> : displayed.length===0 ? <div style={{ textAlign:'center',padding:'60px 20px',color:C.text3 }}><div style={{ fontSize:40,marginBottom:12 }}>📊</div><div style={{ fontWeight:600,color:C.text2,marginBottom:6 }}>No vitals logged yet</div><div style={{ fontSize:13 }}>Click "+ Log Vital" to start tracking</div></div> : <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
          {displayed.map((v:any) => {
            const vt = VITAL_TYPES.find(x=>x.key===v.type) ?? VITAL_TYPES[0];
            const val = vt.isBP ? `${v.systolic}/${v.diastolic}` : (v.value??'—');
            return <div key={v.id} style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:'14px 18px',display:'flex',alignItems:'center',gap:14,boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ width:40,height:40,borderRadius:12,background:vt.color+'15',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>{vt.icon}</div>
              <div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:600,color:C.text }}>{vt.label}</div><div style={{ fontSize:11,color:C.text3,marginTop:2 }}>{v.context&&<span style={{ marginRight:8 }}>{v.context.replace(/_/g,' ')}</span>}{v.measuredAt && `${new Date(v.measuredAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})} ${new Date(v.measuredAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}`}</div>{v.notes&&<div style={{ fontSize:11,color:C.text3,fontStyle:'italic',marginTop:2 }}>"{v.notes}"</div>}</div>
              <div style={{ textAlign:'right',flexShrink:0 }}><div style={{ fontSize:22,fontWeight:900,color:vt.color,lineHeight:1 }}>{val}</div><div style={{ fontSize:11,color:C.text3 }}>{vt.unit}</div></div>
              <button onClick={()=>handleDelete(v.id)} style={{ background:'none',border:'none',cursor:'pointer',color:C.text3,fontSize:18,padding:'4px',borderRadius:6,lineHeight:1 }} onMouseEnter={e=>(e.currentTarget.style.color=C.rose)} onMouseLeave={e=>(e.currentTarget.style.color=C.text3)}>✕</button>
            </div>;
          })}
        </div>}
      </div>
    </>
  );
}
