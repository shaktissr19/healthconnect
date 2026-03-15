'use client';
import { useState, useEffect, useCallback } from 'react';
import { patientAPI } from '@/lib/api';

const C = {
  bg: '#F8FFFE', card: '#FFFFFF', border: '#E2EEF0',
  teal: '#0D9488', tealLight: '#14B8A6', tealBg: '#F0FDF9',
  text: '#0F2D2A', text2: '#4B6E6A', text3: '#64748B',
  red: '#DC2626', amber: '#D97706', green: '#16A34A',
  redBg: 'rgba(220,38,38,0.08)', amberBg: 'rgba(217,119,6,0.08)', greenBg: 'rgba(22,163,74,0.08)',
};

const SEV_COLOR  = (s: number) => s >= 7 ? C.red   : s >= 4 ? C.amber  : C.green;
const SEV_BG     = (s: number) => s >= 7 ? C.redBg : s >= 4 ? C.amberBg : C.greenBg;
const SEV_LABEL  = (s: number) => s >= 7 ? 'Severe' : s >= 4 ? 'Moderate' : 'Mild';
const TIMEFRAMES = ['7D', '30D', '90D'] as const;
type TF = typeof TIMEFRAMES[number];
const TF_DAYS: Record<TF, number> = { '7D': 7, '30D': 30, '90D': 90 };

// Day-of-week frequency chart (like the mockup)
function FrequencyChart({ symptoms }: { symptoms: any[] }) {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const counts = Array(7).fill(0);
  symptoms.forEach((s: any) => {
    const d = new Date(s.loggedAt ?? s.date ?? Date.now());
    const dow = (d.getDay() + 6) % 7; // Mon=0
    counts[dow]++;
  });
  const maxCount = Math.max(...counts, 1);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>📊 Symptom Frequency</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
        {days.map((day, i) => {
          const h = counts[i] === 0 ? 4 : Math.max(12, (counts[i] / maxCount) * 70);
          const color = counts[i] >= 3 ? C.red : counts[i] >= 2 ? C.amber : counts[i] >= 1 ? C.teal : '#E2EEF0';
          return (
            <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div title={`${counts[i]} symptoms`}
                style={{ width: '100%', height: `${h}px`, background: color, borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease', cursor: 'default', opacity: counts[i] === 0 ? 0.3 : 1 }} />
              <span style={{ fontSize: 10, color: C.text3, fontWeight: 500 }}>{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SymptomsPage() {
  const [symptoms,   setSymptoms]   = useState<any[]>([]);
  const [timeframe,  setTimeframe]  = useState<TF>('30D');
  const [loading,    setLoading]    = useState(true);
  const [showLog,    setShowLog]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting,   setDeleting]   = useState<string | null>(null);
  const [search,     setSearch]     = useState('');
  const [form, setForm] = useState({ name: '', severity: 5, bodyPart: '', triggers: '', notes: '' });

  const load = useCallback((tf: TF) => {
    setLoading(true);
    const days = TF_DAYS[tf];
    const from = new Date(Date.now() - days * 86400000).toISOString();
    patientAPI.getSymptoms({ from, limit: 200 })
      .then(res => {
        const d = res?.data?.data ?? res?.data ?? {};
        setSymptoms(Array.isArray(d) ? d : d.symptoms ?? []);
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
        name: form.name, severity: form.severity,
        bodyPart: form.bodyPart,
        triggers: form.triggers || undefined,
        notes: form.notes || undefined,
      });
      setForm({ name: '', severity: 5, bodyPart: '', triggers: '', notes: '' });
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

  const filtered = search.trim()
    ? symptoms.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.bodyPart?.toLowerCase().includes(search.toLowerCase()))
    : symptoms;

  const activeCount  = symptoms.length;
  const severeCount  = symptoms.filter(s => s.severity >= 7).length;
  const thisWeekCount = symptoms.filter(s => {
    const d = new Date(s.loggedAt ?? s.date ?? 0);
    return (Date.now() - d.getTime()) < 7 * 86400000;
  }).length;

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', background: '#F8FFFE', border: `1.5px solid ${C.border}`, borderRadius: 9, color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, color: C.text2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 };

  return (
    <div style={{ padding: '4px 0' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0, fontFamily: "'Syne',sans-serif" }}>🩺 Symptoms Tracker</h2>
          <div style={{ fontSize: 13, color: C.text3, marginTop: 4 }}>Log and track your symptoms over time</div>
        </div>
        <button
          onClick={() => setShowLog(!showLog)}
          style={{ padding: '10px 20px', background: showLog ? '#F1F5F9' : `linear-gradient(135deg,${C.teal},${C.tealLight})`, color: showLog ? C.text2 : '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: showLog ? 'none' : '0 2px 10px rgba(13,148,136,0.3)' }}>
          {showLog ? '✕ Cancel' : '+ Log Symptom'}
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { icon: '🤕', value: activeCount, label: 'Active Symptoms', color: C.red, bg: C.redBg },
          { icon: '⚠️', value: severeCount, label: `Severe (4+)`, color: C.amber, bg: C.amberBg },
          { icon: '📅', value: thisWeekCount, label: 'This Week', color: C.teal, bg: C.tealBg },
        ].map(k => (
          <div key={k.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>{k.icon}</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: k.color, fontFamily: "'Syne',sans-serif", lineHeight: 1, marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 13, color: C.text2, fontWeight: 600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Log Form */}
      {showLog && (
        <div style={{ background: C.card, border: `1.5px solid ${C.teal}44`, borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: '0 4px 20px rgba(13,148,136,0.1)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 18 }}>Log New Symptom</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={lbl}>SYMPTOM NAME *</label>
              <input style={inp} placeholder="e.g. Headache, Fatigue..." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>BODY PART / AREA *</label>
              <input style={inp} placeholder="e.g. Head, Chest, Back..." value={form.bodyPart} onChange={e => setForm({ ...form, bodyPart: e.target.value })} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ ...lbl }}>
              SEVERITY: <span style={{ color: SEV_COLOR(form.severity), fontWeight: 800 }}>{form.severity}/10 — {SEV_LABEL(form.severity)}</span>
            </label>
            <input type="range" min={1} max={10} value={form.severity} onChange={e => setForm({ ...form, severity: +e.target.value })}
              style={{ width: '100%', accentColor: SEV_COLOR(form.severity) }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.text3, marginTop: 2 }}>
              <span>1 — Mild</span><span>5 — Moderate</span><span>10 — Severe</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={lbl}>TRIGGERS (optional)</label>
              <input style={inp} placeholder="e.g. After meals, stress..." value={form.triggers} onChange={e => setForm({ ...form, triggers: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>NOTES (optional)</label>
              <input style={inp} placeholder="Duration, pattern..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <button onClick={handleLog} disabled={submitting || !form.name || !form.bodyPart}
            style={{ padding: '10px 28px', background: `linear-gradient(135deg,${C.teal},${C.tealLight})`, color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: (!form.name || !form.bodyPart) ? 'not-allowed' : 'pointer', opacity: (!form.name || !form.bodyPart) ? 0.5 : 1 }}>
            {submitting ? 'Saving...' : 'Save Symptom'}
          </button>
        </div>
      )}

      {/* Frequency Chart + Search Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <FrequencyChart symptoms={symptoms} />
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 12 }}>🔍 Search & Filter</div>
          <input style={{ ...inp, marginBottom: 14 }} placeholder="Search symptoms..." value={search} onChange={e => setSearch(e.target.value)} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: C.text2, fontWeight: 600, alignSelf: 'center' }}>Period:</span>
            {TIMEFRAMES.map(tf => (
              <button key={tf} onClick={() => setTimeframe(tf)}
                style={{ padding: '5px 14px', borderRadius: 100, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.2s', background: timeframe === tf ? C.teal : '#F1F5F9', color: timeframe === tf ? '#fff' : C.text2 }}>
                {tf}
              </button>
            ))}
          </div>
          {symptoms.length > 0 && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
              {[
                { label: 'Most frequent', value: (() => { const cnt: Record<string,number> = {}; symptoms.forEach((s:any)=>cnt[s.name]=(cnt[s.name]||0)+1); const top = Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0]; return top ? `${top[0]} (${top[1]}×)` : '—'; })(), color: C.red },
                { label: 'Avg severity', value: (symptoms.reduce((a,s)=>a+s.severity,0)/symptoms.length).toFixed(1)+'/10', color: C.amber },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: C.text3 }}>{s.label}</span>
                  <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Symptom Grid */}
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Symptom Entries</div>
        <div style={{ fontSize: 13, color: C.text3 }}>{filtered.length} entries</div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ height: 110, borderRadius: 14, background: '#F0FDF9', animation: 'pulse 1.5s infinite', opacity: 0.7 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '50px 20px', textAlign: 'center', color: C.text3 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
          <div style={{ fontWeight: 700, color: C.text, fontSize: 15, marginBottom: 6 }}>No symptoms logged</div>
          <div style={{ fontSize: 13 }}>Click "+ Log Symptom" to start tracking</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 12 }}>
          {filtered.map((s: any, i: number) => {
            const color = SEV_COLOR(s.severity);
            const bg    = SEV_BG(s.severity);
            const date  = new Date(s.loggedAt ?? s.date ?? Date.now());
            return (
              <div key={s.id ?? i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', position: 'relative', transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.05)')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: bg, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color, flexShrink: 0 }}>
                      {s.severity}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: C.text3 }}>{s.bodyPart}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: bg, color, border: `1px solid ${color}40` }}>
                    {SEV_LABEL(s.severity)}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: C.text3, marginBottom: s.triggers || s.notes ? 8 : 0 }}>
                  📅 {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
                {s.triggers && <div style={{ fontSize: 12, color: C.text2, fontStyle: 'italic', marginBottom: 2 }}>⚡ {s.triggers}</div>}
                {s.notes    && <div style={{ fontSize: 12, color: C.text2, fontStyle: 'italic' }}>"{s.notes}"</div>}
                {s.id && (
                  <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id}
                    style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', color: C.red, width: 26, height: 26, borderRadius: 7, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                    {deleting === s.id ? '...' : '✕'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
