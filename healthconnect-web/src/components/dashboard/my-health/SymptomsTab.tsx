'use client';

import { useCallback, useEffect, useState } from 'react';
import { patientAPI } from '@/lib/api';

const SEVERITY_COLOR = (s: number) => s >= 7 ? '#F43F5E' : s >= 4 ? '#F59E0B' : '#22C55E';
const TIMEFRAMES = ['7D', '30D', '90D'] as const;
type TF = typeof TIMEFRAMES[number];
const TF_DAYS: Record<TF, number> = { '7D': 7, '30D': 30, '90D': 90 };

const splitTriggers = (value: string) => value
  .split(',')
  .map(item => item.trim())
  .filter(Boolean);

const triggerLabel = (value: unknown) => Array.isArray(value)
  ? value.join(', ')
  : typeof value === 'string' ? value : '';

export default function SymptomsTab() {
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<TF>('7D');
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', severity: 5, triggers: '', notes: '' });

  const load = useCallback((tf: TF) => {
    setLoading(true);
    const from = new Date(Date.now() - TF_DAYS[tf] * 86400000).toISOString();
    patientAPI.getSymptoms({ from, limit: 100 })
      .then(res => {
        const data = res?.data?.data ?? res?.data ?? {};
        setSymptoms(Array.isArray(data) ? data : data.symptoms ?? []);
        setTrend(Array.isArray(data?.trend) ? data.trend : []);
      })
      .catch((e: any) => setMessage(e?.response?.data?.message ?? 'Unable to load symptoms.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(timeframe); }, [timeframe, load]);

  const handleLog = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    setMessage('');
    try {
      await patientAPI.logSymptom({
        name: form.name.trim(),
        severity: form.severity,
        triggers: splitTriggers(form.triggers),
        notes: form.notes.trim() || undefined,
      });
      setForm({ name: '', severity: 5, triggers: '', notes: '' });
      setShowLog(false);
      setMessage('✓ Symptom logged');
      load(timeframe);
    } catch (e: any) {
      setMessage(e?.response?.data?.message ?? 'Unable to save symptom.');
    } finally {
      setSubmitting(false);
    }
  };

  const markResolved = async (id: string) => {
    setActing(id);
    try {
      await patientAPI.updateSymptom(id, { resolvedAt: new Date().toISOString() });
      setMessage('✓ Symptom marked resolved');
      load(timeframe);
    } catch (e: any) {
      setMessage(e?.response?.data?.message ?? 'Unable to update symptom.');
    } finally {
      setActing(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this symptom entry?')) return;
    setActing(id);
    try {
      await patientAPI.deleteSymptom(id);
      setSymptoms(prev => prev.filter(item => item.id !== id));
      setMessage('✓ Symptom entry deleted');
    } catch (e: any) {
      setMessage(e?.response?.data?.message ?? 'Unable to delete symptom.');
    } finally {
      setActing(null);
    }
  };

  const chartData = trend.length
    ? trend.slice(-14).map((item: any) => ({ date: item.date, value: item.avgSeverity ?? 0, label: item.date }))
    : symptoms.slice(0, 14).map((item: any) => ({ date: item.loggedAt, value: item.severity, label: item.name }));

  const activeCount = symptoms.filter(item => !item.resolvedAt).length;

  return (
    <>
      <style>{`
        .sym-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}.sym-primary{padding:8px 18px;background:linear-gradient(135deg,#0D9488,#14B8A6);color:#fff;border:none;border-radius:9px;font-weight:700;cursor:pointer;font-size:13px}.sym-form,.sym-chart{background:#fff;border:1px solid #E2EEF0;border-radius:14px;padding:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,.06)}.sym-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}.sym-label{display:block;font-size:11px;color:#4B6E6A;margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em}.sym-input{width:100%;padding:9px 12px;background:#F8FFFE;border:1px solid #D1FAF0;border-radius:9px;color:#0F2D2A;font-size:13px;outline:none;box-sizing:border-box}.sym-input:focus{border-color:#0D9488}.sym-list{display:flex;flex-direction:column;gap:10px}.sym-item{background:#fff;border:1px solid #E2EEF0;border-radius:14px;padding:16px;display:flex;gap:16px;align-items:center;box-shadow:0 2px 6px rgba(0,0,0,.05)}.sym-badge{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;flex-shrink:0}.sym-actions{display:flex;gap:7px;align-items:center}.sym-action{padding:6px 10px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;background:#fff}.sym-empty{color:#4B6E6A;font-size:13px;padding:40px 0;text-align:center}.sym-bars{display:flex;align-items:flex-end;gap:4px;height:80px}.sym-bar-wrap{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px}.sym-bar{width:100%;border-radius:3px 3px 0 0;min-height:3px}.sym-bar-lbl{font-size:9px;color:#4B6E6A;transform:rotate(-45deg);white-space:nowrap}@media(max-width:760px){.sym-grid{grid-template-columns:1fr}.sym-item{align-items:flex-start}.sym-actions{flex-direction:column}}
      `}</style>

      <div className="sym-hd">
        <div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700, color: '#0F2D2A' }}>Symptom Tracker</div>
          <div style={{ fontSize: 12, color: '#4B6E6A', marginTop: 2 }}>{activeCount} active · {symptoms.length} entries in selected period</div>
        </div>
        <button className="sym-primary" onClick={() => setShowLog(value => !value)}>{showLog ? '✕ Cancel' : '+ Log Symptom'}</button>
      </div>

      {message && (
        <div style={{ marginBottom: 14, padding: '9px 12px', borderRadius: 9, background: message.startsWith('✓') ? '#F0FDF4' : '#FFF7ED', color: message.startsWith('✓') ? '#15803D' : '#B45309', fontSize: 12, fontWeight: 600 }}>{message}</div>
      )}

      {showLog && (
        <div className="sym-form">
          <div className="sym-grid">
            <div><label className="sym-label">Symptom name *</label><input className="sym-input" placeholder="e.g. Headache, fatigue" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="sym-label">Triggers (optional)</label><input className="sym-input" placeholder="Comma-separated: stress, after meals" value={form.triggers} onChange={e => setForm({ ...form, triggers: e.target.value })} /></div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="sym-label">Severity: <strong style={{ color: SEVERITY_COLOR(form.severity) }}>{form.severity}/10</strong></label>
            <input type="range" min={1} max={10} value={form.severity} onChange={e => setForm({ ...form, severity: Number(e.target.value) })} style={{ width: '100%', accentColor: SEVERITY_COLOR(form.severity) }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748B' }}><span>1 — Mild</span><span>5 — Moderate</span><span>10 — Severe</span></div>
          </div>
          <div style={{ marginBottom: 16 }}><label className="sym-label">Notes (optional)</label><textarea className="sym-input" rows={2} placeholder="Duration, pattern or other useful context" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          <button className="sym-primary" onClick={handleLog} disabled={submitting || !form.name.trim()} style={{ opacity: form.name.trim() ? 1 : .5 }}>{submitting ? 'Saving…' : 'Save Symptom'}</button>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="sym-chart">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, color: '#0F2D2A' }}>Severity Trend</div>
            <div style={{ display: 'flex', gap: 6 }}>{TIMEFRAMES.map(tf => <button key={tf} onClick={() => setTimeframe(tf)} style={{ padding: '4px 12px', borderRadius: 100, border: `1px solid ${timeframe === tf ? '#0D9488' : '#E2EEF0'}`, background: timeframe === tf ? '#F0FDF9' : '#fff', color: timeframe === tf ? '#0D9488' : '#4B6E6A', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>{tf}</button>)}</div>
          </div>
          <div className="sym-bars">{chartData.map((item: any, index: number) => { const value = Math.min(Number(item.value) || 0, 10); return <div key={index} className="sym-bar-wrap"><div className="sym-bar" title={`${item.label}: ${value}/10`} style={{ height: `${Math.max(3, value / 10 * 70)}px`, background: SEVERITY_COLOR(value) }} /><span className="sym-bar-lbl">{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></div>; })}</div>
        </div>
      )}

      {loading ? <div className="sym-empty">Loading symptoms…</div> : symptoms.length === 0 ? <div className="sym-empty">No symptoms logged in this period. 🎉</div> : (
        <div className="sym-list">
          {symptoms.map((symptom: any) => {
            const color = SEVERITY_COLOR(symptom.severity);
            const date = new Date(symptom.loggedAt);
            const resolved = Boolean(symptom.resolvedAt);
            return (
              <div key={symptom.id} className="sym-item" style={{ opacity: resolved ? .72 : 1 }}>
                <div className="sym-badge" style={{ background: `${color}18`, border: `2px solid ${color}`, color }}>{symptom.severity}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0F2D2A' }}>{symptom.name} {resolved && <span style={{ color: '#16A34A', fontSize: 11, marginLeft: 6 }}>RESOLVED</span>}</div>
                  <div style={{ fontSize: 12, color: '#4B6E6A', marginTop: 3 }}>{date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                  {triggerLabel(symptom.triggers) && <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Triggers: {triggerLabel(symptom.triggers)}</div>}
                  {symptom.notes && <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>{symptom.notes}</div>}
                </div>
                <div className="sym-actions">
                  {!resolved && <button className="sym-action" onClick={() => markResolved(symptom.id)} disabled={acting === symptom.id} style={{ border: '1px solid #BBF7D0', color: '#15803D' }}>{acting === symptom.id ? '…' : '✓ Resolve'}</button>}
                  <button className="sym-action" onClick={() => handleDelete(symptom.id)} disabled={acting === symptom.id} style={{ border: '1px solid #FECDD3', color: '#E11D48' }}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
