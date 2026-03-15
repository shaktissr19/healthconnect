'use client';

import { useState, useEffect, useCallback } from 'react';
import { patientAPI } from '@/lib/api';

const SEVERITY_COLOR = (s: number) => s >= 7 ? '#F43F5E' : s >= 4 ? '#F59E0B' : '#22C55E';
const TIMEFRAMES = ['7D', '30D', '90D'] as const;
type TF = typeof TIMEFRAMES[number];
const TF_DAYS: Record<TF, number> = { '7D': 7, '30D': 30, '90D': 90 };

export default function SymptomsTab() {
  const [symptoms,   setSymptoms]   = useState<any[]>([]);
  const [trend,      setTrend]      = useState<any[]>([]);
  const [timeframe,  setTimeframe]  = useState<TF>('7D');
  const [loading,    setLoading]    = useState(true);
  const [showLog,    setShowLog]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting,   setDeleting]   = useState<string|null>(null);
  const [form,       setForm]       = useState({ name:'', severity:5, bodyPart:'', triggers:'', notes:'' });

  const load = useCallback((tf: TF) => {
    setLoading(true);
    const days = TF_DAYS[tf];
    const from = new Date(Date.now() - days * 86400000).toISOString();
    patientAPI.getSymptoms({ from, limit: 100 })
      .then(res => {
        const d = res?.data?.data ?? res?.data ?? {};
        setSymptoms(d.symptoms ?? []);
        setTrend(d.trend ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(timeframe); }, [timeframe, load]);

  const handleLog = async () => {
    if (!form.name || !form.bodyPart) return;
    setSubmitting(true);
    try {
      await patientAPI.logSymptom({
        name:     form.name,
        severity: form.severity,
        bodyPart: form.bodyPart,
        triggers: form.triggers || undefined,
        notes:    form.notes    || undefined,
      });
      setForm({ name:'', severity:5, bodyPart:'', triggers:'', notes:'' });
      setShowLog(false);
      load(timeframe);
    } catch {}
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this symptom entry?')) return;
    setDeleting(id);
    try {
      await patientAPI.deleteSymptom(id);
      setSymptoms(prev => prev.filter(s => s.id !== id));
    } catch {}
    setDeleting(null);
  };

  const chartData = trend.length > 0
    ? trend.slice(-14).map((t: any) => ({ date: t.date, value: t.avgSeverity ?? t.count ?? 0, label: t.date }))
    : symptoms.slice(0, 14).map((s: any) => ({ date: s.loggedAt, value: s.severity, label: s.name }));

  return (
    <>
      <style>{`
        .sym-hd { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
        .sym-btn-primary { padding:8px 18px; background:linear-gradient(135deg,#0D9488,#14B8A6); color:#fff; border:none; border-radius:9px; font-weight:700; cursor:pointer; font-size:13px; font-family:'Plus Jakarta Sans',sans-serif; }
        .sym-btn-ghost { padding:7px 14px; background:#fff; border:1px solid #E2EEF0; color:#4B6E6A; border-radius:9px; font-weight:600; cursor:pointer; font-size:12px; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.2s; }
        .sym-btn-ghost:hover { border-color:#0D9488; color:#0D9488; }
        .sym-form { background:#FFFFFF; border:1px solid #E2EEF0; border-radius:14px; padding:20px; margin-bottom:20px; box-shadow:0 2px 8px rgba(0,0,0,0.06); }
        .sym-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px; }
        .sym-label { display:block; font-size:11px; color:#4B6E6A; margin-bottom:6px; text-transform:uppercase; letter-spacing:.06em; font-family:'JetBrains Mono',monospace; }
        .sym-input { width:100%; padding:9px 12px; background:#F8FFFE; border:1px solid #D1FAF0; border-radius:9px; color:#0F2D2A; font-size:13px; font-family:'Plus Jakarta Sans',sans-serif; outline:none; box-sizing:border-box; }
        .sym-input:focus { border-color:#0D9488; }
        .sym-chart { background:#FFFFFF; border:1px solid #E2EEF0; border-radius:14px; padding:20px; margin-bottom:20px; box-shadow:0 2px 8px rgba(0,0,0,0.06); }
        .sym-chart-hd { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
        .sym-chart-title { font-family:'Syne',sans-serif; font-size:14px; font-weight:700; color:#0F2D2A; }
        .sym-tf-btns { display:flex; gap:6px; }
        .sym-tf-btn { padding:4px 12px; border-radius:100px; border:none; cursor:pointer; font-size:11px; font-weight:600; transition:all 0.2s; font-family:'JetBrains Mono',monospace; }
        .sym-bars { display:flex; align-items:flex-end; gap:4px; height:80px; }
        .sym-bar-wrap { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; }
        .sym-bar { width:100%; border-radius:3px 3px 0 0; min-height:3px; opacity:0.85; cursor:pointer; transition:opacity 0.2s; }
        .sym-bar:hover { opacity:1; }
        .sym-bar-lbl { font-size:9px; color:#4B6E6A; transform:rotate(-45deg); white-space:nowrap; font-family:'JetBrains Mono',monospace; }
        .sym-list { display:flex; flex-direction:column; gap:10px; }
        .sym-item { background:#FFFFFF; border:1px solid #E2EEF0; border-radius:14px; padding:16px; display:flex; gap:16px; align-items:center; transition:box-shadow 0.2s; position:relative; box-shadow:0 2px 6px rgba(0,0,0,0.05); }
        .sym-item:hover { box-shadow:0 4px 14px rgba(13,148,136,0.1); border-color:#b2ddd8; }
        .sym-sev-badge { width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; font-family:'Syne',sans-serif; flex-shrink:0; }
        .sym-name { font-family:'Syne',sans-serif; font-weight:700; font-size:14px; color:#0F2D2A; margin-bottom:3px; }
        .sym-meta { font-size:12px; color:#4B6E6A; font-family:'JetBrains Mono',monospace; }
        .sym-notes { font-size:12px; color:#64748B; font-style:italic; margin-top:4px; }
        .sym-del-btn { position:absolute; top:12px; right:12px; background:rgba(244,63,94,0.08); border:1px solid rgba(244,63,94,0.2); color:#F43F5E; width:26px; height:26px; border-radius:6px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px; opacity:0; transition:opacity 0.2s; }
        .sym-item:hover .sym-del-btn { opacity:1; }
        .sym-empty { color:#4B6E6A; font-size:13px; padding:40px 0; text-align:center; }
        .sym-skel { height:70px; border-radius:14px; background:linear-gradient(90deg,#e8f5f2 25%,#f0faf8 50%,#e8f5f2 75%); background-size:200% 100%; animation:sym-sh 1.5s infinite; margin-bottom:10px; }
        @keyframes sym-sh { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      <div className="sym-hd">
        <div>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, color:'#0F2D2A' }}>Symptom Tracker</div>
          <div style={{ fontSize:12, color:'#4B6E6A', marginTop:2 }}>{symptoms.length} entries in selected period</div>
        </div>
        <button className="sym-btn-primary" onClick={() => setShowLog(!showLog)}>
          {showLog ? '✕ Cancel' : '+ Log Symptom'}
        </button>
      </div>

      {/* Log Form */}
      {showLog && (
        <div className="sym-form">
          <div className="sym-form-grid">
            <div>
              <label className="sym-label">Symptom Name *</label>
              <input className="sym-input" placeholder="e.g., Headache" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <label className="sym-label">Body Part / Area *</label>
              <input className="sym-input" placeholder="e.g., Head, Chest" value={form.bodyPart} onChange={e => setForm({...form, bodyPart: e.target.value})} />
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <label className="sym-label">
              Severity: <span style={{ color: SEVERITY_COLOR(form.severity), fontWeight:700 }}>{form.severity}/10</span>
            </label>
            <input type="range" min={1} max={10} value={form.severity} onChange={e => setForm({...form, severity:+e.target.value})} style={{ width:'100%', accentColor: SEVERITY_COLOR(form.severity) }} />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#64748B', marginTop:4 }}>
              <span>1 — Mild</span><span>5 — Moderate</span><span>10 — Severe</span>
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <label className="sym-label">Triggers (optional)</label>
            <input className="sym-input" placeholder="e.g., After meals, stress, exercise" value={form.triggers} onChange={e => setForm({...form, triggers: e.target.value})} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label className="sym-label">Notes (optional)</label>
            <textarea className="sym-input" rows={2} placeholder="Duration, pattern, anything else..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={{ resize:'vertical' }} />
          </div>
          <button className="sym-btn-primary" onClick={handleLog} disabled={submitting || !form.name || !form.bodyPart} style={{ opacity: (!form.name || !form.bodyPart) ? 0.5 : 1 }}>
            {submitting ? 'Saving...' : 'Save Symptom'}
          </button>
        </div>
      )}

      {/* Severity Chart */}
      {chartData.length > 0 && (
        <div className="sym-chart">
          <div className="sym-chart-hd">
            <div className="sym-chart-title">Severity Trend</div>
            <div className="sym-tf-btns">
              {TIMEFRAMES.map(tf => (
                <button key={tf} className="sym-tf-btn"
                  style={{ background: timeframe===tf ? 'rgba(13,148,136,0.12)' : '#F8FFFE', color: timeframe===tf ? '#0D9488' : '#4B6E6A', border: timeframe===tf ? '1px solid rgba(13,148,136,0.3)' : '1px solid #E2EEF0' }}
                  onClick={() => setTimeframe(tf)}>{tf}</button>
              ))}
            </div>
          </div>
          <div className="sym-bars">
            {chartData.map((d: any, i: number) => {
              const val   = Math.min(d.value, 10);
              const color = SEVERITY_COLOR(val);
              return (
                <div key={i} className="sym-bar-wrap">
                  <div className="sym-bar" title={`${d.label}: ${val}`}
                    style={{ height:`${(val/10)*70}px`, background:color }} />
                  <span className="sym-bar-lbl">
                    {new Date(d.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Symptom List */}
      {loading ? (
        <div>{[1,2,3].map(i => <div key={i} className="sym-skel" />)}</div>
      ) : symptoms.length === 0 ? (
        <div className="sym-empty">No symptoms logged in this period. 🎉</div>
      ) : (
        <div className="sym-list">
          {symptoms.map((s: any, i: number) => {
            const color = SEVERITY_COLOR(s.severity);
            const date  = new Date(s.loggedAt ?? s.date);
            return (
              <div key={s.id ?? i} className="sym-item">
                <div className="sym-sev-badge" style={{ background:`${color}18`, border:`2px solid ${color}`, color }}>
                  {s.severity}
                </div>
                <div style={{ flex:1 }}>
                  <div className="sym-name">{s.name}</div>
                  <div className="sym-meta">
                    {s.bodyPart} · {date.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })} · {date.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                  </div>
                  {s.triggers && <div className="sym-notes">Triggers: {s.triggers}</div>}
                  {s.notes    && <div className="sym-notes">{s.notes}</div>}
                </div>
                <span style={{ fontSize:11, color:'#475569', fontFamily:'JetBrains Mono,monospace',
                  background: s.severity>=7 ? 'rgba(244,63,94,0.1)' : s.severity>=4 ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
                  padding:'2px 8px', borderRadius:100, border:`1px solid ${color}40` }}>
                  {s.severity >= 7 ? 'SEVERE' : s.severity >= 4 ? 'MODERATE' : 'MILD'}
                </span>
                {s.id && (
                  <button className="sym-del-btn"
                    onClick={() => handleDelete(s.id)}
                    disabled={deleting === s.id}
                    title="Delete entry">
                    {deleting === s.id ? '...' : '✕'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
