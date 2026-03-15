'use client';

import { useState, useEffect } from 'react';
import { patientAPI } from '@/lib/api';

const METRIC_CONFIG = [
  { key:'vitalsScore',           label:'Vitals',              icon:'💓', color:'#EF4444', desc:'BP, sugar, heart rate, SpO2 in normal range (25% weight)' },
  { key:'medicationAdherence',   label:'Medication Adherence',icon:'💊', color:'#14B8A6', desc:'% doses taken on time in last 30 days (22% weight)' },
  { key:'symptomBurden',         label:'Symptom Burden',      icon:'🩺', color:'#F59E0B', desc:'Inverse of symptom frequency × severity (18% weight)' },
  { key:'appointmentRegularity', label:'Appointments',        icon:'📅', color:'#8B5CF6', desc:'% of scheduled appointments attended (15% weight)' },
  { key:'conditionControl',      label:'Condition Control',   icon:'📋', color:'#0D9488', desc:'Active vs managed vs resolved conditions (10% weight)' },
  { key:'lifestyleFactors',      label:'Lifestyle',           icon:'🌱', color:'#22C55E', desc:'Combined sleep, exercise & diet score (7% weight)' },
  { key:'engagementScore',       label:'Self-monitoring',     icon:'📊', color:'#3B82F6', desc:'Frequency of logging vitals & symptoms (3% weight)' },
];

const VITAL_TYPES = [
  { value:'BLOOD_PRESSURE', label:'Blood Pressure', unit:'mmHg', isBP:true },
  { value:'HEART_RATE',     label:'Heart Rate',     unit:'bpm' },
  { value:'BLOOD_SUGAR',    label:'Blood Sugar',    unit:'mg/dL' },
  { value:'WEIGHT',         label:'Weight',         unit:'kg' },
  { value:'SPO2',           label:'SpO2',           unit:'%' },
  { value:'TEMPERATURE',    label:'Temperature',    unit:'°C' },
];

function ScoreRing({ score, color, size=80 }: { score:number; color:string; size?:number }) {
  const r    = size * 0.4;
  const circ = 2 * Math.PI * r;
  const off  = circ * (1 - Math.min(score, 100) / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2EEF0" strokeWidth={size*0.1} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.1}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
        style={{ transition:'stroke-dashoffset 1s ease' }} />
    </svg>
  );
}

// ── Log Vital Modal ───────────────────────────────────────────────────────────
function LogVitalModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [type,      setType]      = useState('BLOOD_PRESSURE');
  const [value,     setValue]     = useState('');
  const [systolic,  setSystolic]  = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [recordedAt, setRecordedAt] = useState(new Date().toISOString().slice(0,16));
  const [notes,     setNotes]     = useState('');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const isBP = type === 'BLOOD_PRESSURE';
  const cfg  = VITAL_TYPES.find(v => v.value === type)!;

  const handleSave = async () => {
    setError('');
    if (isBP && (!systolic || !diastolic)) { setError('Please enter both systolic and diastolic values.'); return; }
    if (!isBP && !value) { setError('Please enter a value.'); return; }

    setSaving(true);
    try {
      const payload: any = {
        type,
        recordedAt: new Date(recordedAt).toISOString(),
        notes: notes || undefined,
      };
      if (isBP) {
        payload.systolic  = Number(systolic);
        payload.diastolic = Number(diastolic);
      } else {
        payload.value = Number(value);
      }
      await patientAPI.logVital(payload);
      onSaved();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to save. Please try again.');
    }
    setSaving(false);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'#0C1525', border:'1px solid rgba(20,184,166,0.2)', borderRadius:16, padding:28, width:'100%', maxWidth:440 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:17, fontWeight:700, color:'#E2E8F0' }}>🩺 Log Vital Sign</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748B', cursor:'pointer', fontSize:20 }}>✕</button>
        </div>

        {/* Vital type selector */}
        <div style={{ marginBottom:16 }}>
          <label style={{ display:'block', fontSize:11, color:'#64748B', marginBottom:8, textTransform:'uppercase', letterSpacing:'.06em', fontFamily:'JetBrains Mono,monospace' }}>Vital Type</label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {VITAL_TYPES.map(v => (
              <button key={v.value} onClick={() => setType(v.value)}
                style={{ padding:'8px 10px', borderRadius:9, border:`1px solid ${type===v.value ? 'rgba(20,184,166,0.4)' : 'rgba(255,255,255,0.08)'}`, background: type===v.value ? 'rgba(20,184,166,0.12)' : 'rgba(255,255,255,0.04)', color: type===v.value ? '#14B8A6' : '#64748B', fontSize:12, cursor:'pointer', fontWeight:600, textAlign:'left' }}>
                {v.label}
                <span style={{ display:'block', fontSize:10, opacity:0.7, marginTop:1 }}>{v.unit}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Value input */}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:11, color:'#64748B', marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em', fontFamily:'JetBrains Mono,monospace' }}>
            Value ({cfg.unit})
          </label>
          {isBP ? (
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <input type="number" value={systolic} onChange={e => setSystolic(e.target.value)} placeholder="Systolic"
                style={{ flex:1, padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, color:'#E2E8F0', fontSize:13, outline:'none' }} />
              <span style={{ color:'#64748B', fontSize:18, fontWeight:300 }}>/</span>
              <input type="number" value={diastolic} onChange={e => setDiastolic(e.target.value)} placeholder="Diastolic"
                style={{ flex:1, padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, color:'#E2E8F0', fontSize:13, outline:'none' }} />
            </div>
          ) : (
            <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder={`Enter ${cfg.label.toLowerCase()}...`}
              step="0.1"
              style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, color:'#E2E8F0', fontSize:13, outline:'none', boxSizing:'border-box' }} />
          )}
        </div>

        {/* Date/time */}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:11, color:'#64748B', marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em', fontFamily:'JetBrains Mono,monospace' }}>Date & Time</label>
          <input type="datetime-local" value={recordedAt} onChange={e => setRecordedAt(e.target.value)}
            max={new Date().toISOString().slice(0,16)}
            style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, color:'#E2E8F0', fontSize:13, outline:'none', boxSizing:'border-box' }} />
        </div>

        {/* Notes */}
        <div style={{ marginBottom:16 }}>
          <label style={{ display:'block', fontSize:11, color:'#64748B', marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em', fontFamily:'JetBrains Mono,monospace' }}>Notes (optional)</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., Fasting, post-exercise..."
            style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, color:'#E2E8F0', fontSize:13, outline:'none', boxSizing:'border-box' }} />
        </div>

        {error && <div style={{ color:'#F43F5E', fontSize:12, marginBottom:12 }}>{error}</div>}

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={handleSave} disabled={saving}
            style={{ flex:1, padding:'10px', background:'linear-gradient(135deg,#0D9488,#14B8A6)', color:'#fff', border:'none', borderRadius:9, fontWeight:700, cursor:'pointer', fontSize:13 }}>
            {saving ? 'Saving...' : '✓ Save Vital'}
          </button>
          <button onClick={onClose} style={{ padding:'10px 18px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, color:'#94A3B8', cursor:'pointer', fontSize:13 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function InsightsTab({ data: dashData, loading: dashLoading }: { data: any; loading: boolean }) {
  const [hsHistory,  setHsHistory]  = useState<any[]>([]);
  const [vitals,     setVitals]     = useState<any>({});
  const [loading,    setLoading]    = useState(true);
  const [showLogVital, setShowLogVital] = useState(false);

  const loadVitals = () => {
    Promise.all([
      patientAPI.getHealthScore(),
      patientAPI.getVitals({ limit: 30 }),
    ]).then(([hsRes, vitRes]) => {
      const hs  = hsRes?.data?.data  ?? hsRes?.data  ?? {};
      const vit = vitRes?.data?.data ?? vitRes?.data ?? {};
      setHsHistory(hs.history ?? []);
      setVitals(vit.latestByType ?? {});
    }).catch(() => {})
    .finally(() => setLoading(false));
  };

  useEffect(() => { loadVitals(); }, []);

  const hs    = dashData?.healthScore ?? {};
  const kpis  = dashData?.kpis        ?? {};
  const score = typeof hs === 'number' ? hs : (hs.score ?? 0);

  return (
    <>
      <style>{`
        .ins-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; }
        .ins-grid4 { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
        @media(max-width:1200px) { .ins-grid4 { grid-template-columns:repeat(4,1fr); } }
        @media(max-width:900px)  { .ins-grid4 { grid-template-columns:1fr 1fr 1fr; } }
        @media(max-width:600px)  { .ins-grid4 { grid-template-columns:1fr 1fr; } }
        @media(max-width:720px)  { .ins-grid4,.ins-grid2 { grid-template-columns:1fr; } }
        .ins-card { background:#FFFFFF; border:1px solid #E2EEF0; border-radius:14px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.05); }
        .ins-card-title { font-family:'Syne',sans-serif; font-size:15px; font-weight:700; color:#0F2D2A; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
        .ins-metric-card { background:#FFFFFF; border:1px solid #E2EEF0; border-radius:14px; padding:18px; display:flex; flex-direction:column; align-items:center; gap:10px; text-align:center; box-shadow:0 1px 6px rgba(0,0,0,0.05); }
        .ins-metric-val { font-family:'Syne',sans-serif; font-size:28px; font-weight:800; line-height:1; }
        .ins-metric-label { font-size:13px; color:#0F2D2A; font-weight:700; }
        .ins-metric-desc { font-size:11px; color:#64748B; line-height:1.4; }
        .ins-vital { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #F1F5F9; }
        .ins-vital:last-child { border-bottom:none; }
        .ins-vital-label { font-size:13px; color:#4B6E6A; font-weight:500; }
        .ins-vital-val { font-size:14px; font-weight:700; }
        .ins-ai { background:#F5F3FF; border:1px solid #DDD6FE; border-radius:14px; padding:20px; margin-bottom:20px; }
        .ins-trend-bar { display:flex; align-items:flex-end; gap:4px; height:60px; }
        .ins-trend-col { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; }
        .ins-skel { border-radius:14px; background:#F0FDF9; animation:ins-sh 1.5s infinite; }
        @keyframes ins-sh { 0%,100%{opacity:0.6} 50%{opacity:1} }
        .ins-log-btn { padding:7px 14px; background:linear-gradient(135deg,#0D9488,#14B8A6); color:#fff; border:none; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; }
      `}</style>

      {/* AI Insight */}
      {(dashLoading || dashData?.aiInsight) && (
        <div className="ins-ai">
          <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
            <span style={{ fontSize:22, flexShrink:0 }}>🤖</span>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, color:'#7C3AED', marginBottom:8 }}>AI Health Insight</div>
              {dashLoading
                ? <div className="ins-skel" style={{ height:16, width:'80%' }} />
                : <div style={{ fontSize:13, color:'#374151', lineHeight:1.7 }}>{dashData?.aiInsight ?? 'No insights available yet.'}</div>
              }
            </div>
          </div>
        </div>
      )}

      {/* Health Score Overview */}
      <div className="ins-card" style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:24 }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <ScoreRing score={score} color={score>=80?'#22C55E':score>=60?'#14B8A6':'#F59E0B'} size={100} />
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:800, color: score>=80?'#22C55E':score>=60?'#14B8A6':'#F59E0B' }}>{score}</div>
              <div style={{ fontSize:10, color:'#64748B', fontFamily:'JetBrains Mono,monospace' }}>/100</div>
            </div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:17, fontWeight:800, color:'#0F2D2A', marginBottom:4 }}>
              Overall Health Score — {score>=80?'Good':score>=60?'Fair':'Needs Attention'}
            </div>
            <div style={{ fontSize:12, color:'#64748B', marginBottom:14 }}>
              Trend: <span style={{ color: hs.trend==='up'?'#16A34A':hs.trend==='down'?'#DC2626':'#D97706', fontWeight:700 }}>
                {hs.trend === 'up' ? '↑ Improving' : hs.trend === 'down' ? '↓ Declining' : '→ Stable'}
              </span>
            </div>
            {hsHistory.length > 0 && (
              <div className="ins-trend-bar">
                {hsHistory.slice(-12).map((h: any, i: number) => (
                  <div key={i} className="ins-trend-col">
                    <div style={{ width:'100%', height:`${(h.score/100)*50}px`, background:'rgba(20,184,166,0.5)', borderRadius:'2px 2px 0 0', minHeight:3 }} title={`${h.score}`} />
                    <span style={{ fontSize:8, color:'#475569', fontFamily:'JetBrains Mono,monospace' }}>
                      {new Date(h.calculatedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 Metric Breakdown Cards */}
      <div className="ins-grid4">
        {METRIC_CONFIG.map(m => {
          // Handle new key names + fallback to legacy keys
          const val = hs[m.key] ?? (
            m.key === 'symptomBurden'   ? (hs.symptomFrequency ?? 0) :
            m.key === 'vitalsScore'     ? (hs.vitals           ?? 0) :
            m.key === 'conditionControl'? (hs.conditionControl ?? 0) :
            m.key === 'engagementScore' ? (hs.engagement       ?? 0) : 0
          );
          return (
            <div key={m.key} className="ins-metric-card">
              <div style={{ position:'relative' }}>
                <ScoreRing score={val} color={m.color} size={70} />
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:18 }}>{m.icon}</span>
                </div>
              </div>
              <div className="ins-metric-val" style={{ color:m.color }}>{val}</div>
              <div className="ins-metric-label">{m.label}</div>
              <div className="ins-metric-desc">{m.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Vitals + KPIs */}
      <div className="ins-grid2">
        {/* Latest Vitals */}
        <div className="ins-card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div className="ins-card-title" style={{ marginBottom:0 }}>🩺 Latest Vitals</div>
            <button className="ins-log-btn" onClick={() => setShowLogVital(true)}>+ Log Vital</button>
          </div>
          {loading ? (
            [1,2,3,4].map(i => <div key={i} className="ins-skel" style={{ height:32, marginBottom:8 }} />)
          ) : Object.keys(vitals).length === 0 ? (
            <div style={{ color:'#64748B', fontSize:13, textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>📊</div>
              <div style={{ color:'#4B6E6A' }}>No vitals recorded yet.</div>
              <button className="ins-log-btn" style={{ marginTop:10 }} onClick={() => setShowLogVital(true)}>Log your first vital</button>
            </div>
          ) : (
            <>
              <VitalRow label="Blood Pressure" vital={vitals.BLOOD_PRESSURE} unit="mmHg" renderVal={(v: any) => `${v.systolic}/${v.diastolic}`} />
              <VitalRow label="Heart Rate"     vital={vitals.HEART_RATE}     unit="bpm"  renderVal={(v: any) => v.value} />
              <VitalRow label="Blood Sugar"    vital={vitals.BLOOD_SUGAR}    unit="mg/dL" renderVal={(v: any) => v.value} />
              <VitalRow label="Weight"         vital={vitals.WEIGHT}         unit="kg"   renderVal={(v: any) => v.value} />
              <VitalRow label="SpO2"           vital={vitals.SPO2}           unit="%"    renderVal={(v: any) => v.value} />
              <VitalRow label="Temperature"    vital={vitals.TEMPERATURE}    unit="°C"   renderVal={(v: any) => v.value} />
            </>
          )}
        </div>

        {/* Key Stats */}
        <div className="ins-card">
          <div className="ins-card-title">📊 Key Stats</div>
          {[
            { label:'Active Conditions',     val: kpis.activeConditionsCount  ?? '—', color:'#F43F5E' },
            { label:'Active Medications',    val: kpis.activeMedicationsCount ?? '—', color:'#14B8A6' },
            { label:'Medication Adherence',  val: `${kpis.medicationAdherencePct ?? 0}%`, color:'#22C55E' },
            { label:'Symptoms (7 days)',     val: kpis.recentSymptomsCount    ?? '—', color:'#8B5CF6' },
            { label:'Refill Alerts',         val: kpis.refillAlertsCount      ?? 0,   color:'#F59E0B' },
            { label:'Total Reports',         val: kpis.totalReports           ?? '—', color:'#3B82F6' },
            { label:'Communities Joined',    val: kpis.communitiesJoined      ?? '—', color:'#14B8A6' },
          ].map(s => (
            <div key={s.label} className="ins-vital">
              <div className="ins-vital-label">{s.label}</div>
              <div className="ins-vital-val" style={{ color:s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {showLogVital && (
        <LogVitalModal
          onClose={() => setShowLogVital(false)}
          onSaved={() => { setShowLogVital(false); loadVitals(); }}
        />
      )}
    </>
  );
}

function VitalRow({ label, vital, unit, renderVal }: { label:string; vital:any; unit:string; renderVal:(v:any)=>any }) {
  if (!vital) return null;
  return (
    <div className="ins-vital">
      <div className="ins-vital-label">{label}</div>
      <div style={{ textAlign:'right' }}>
        <div className="ins-vital-val" style={{ color:'#14B8A6' }}>
          {renderVal(vital)} <span style={{ fontSize:10, color:'#64748B', fontWeight:400 }}>{unit}</span>
        </div>
        <div style={{ fontSize:10, color:'#475569', fontFamily:'JetBrains Mono,monospace' }}>
          {vital.recordedAt ? new Date(vital.recordedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : ''}
        </div>
      </div>
    </div>
  );
}
