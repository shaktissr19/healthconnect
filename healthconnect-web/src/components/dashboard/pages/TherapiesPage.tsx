'use client';
import { useState, useEffect } from 'react';
import { patientAPI } from '@/lib/api';

const C = {
  card: '#FFFFFF', border: '#E2EEF0',
  teal: '#0D9488', tealLight: '#14B8A6', tealBg: '#F0FDF9',
  text: '#0F2D2A', text2: '#4B6E6A', text3: '#64748B',
  green: '#16A34A', greenBg: 'rgba(22,163,74,0.08)',
  amber: '#D97706', amberBg: 'rgba(217,119,6,0.08)',
  purple: '#7C3AED', purpleBg: 'rgba(124,58,237,0.08)',
};

const TYPE_ICON: Record<string, string> = {
  EXERCISE: '🏃', DIET: '🥗', SLEEP: '😴', STRESS: '🧘', MEDITATION: '🧘', PHYSIOTHERAPY: '💆', OTHER: '🌱',
};
const TYPE_COLOR: Record<string, string> = {
  EXERCISE: C.teal, DIET: C.green, SLEEP: C.purple, STRESS: C.amber, MEDITATION: C.purple, PHYSIOTHERAPY: '#3B82F6', OTHER: C.teal,
};

function ProgressRing({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) {
  const r = size * 0.4;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2EEF0" strokeWidth={size * 0.1} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size * 0.1}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
    </svg>
  );
}

export default function TherapiesPage() {
  const [therapies, setTherapies] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showAdd,   setShowAdd]   = useState(false);
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [form, setForm] = useState({ name: '', type: 'EXERCISE', targetValue: '', currentValue: '', unit: '', notes: '' });

  const load = () => {
    setLoading(true);
    patientAPI.getTherapies?.()
      .then((res: any) => {
        const d = res?.data?.data ?? res?.data ?? [];
        setTherapies(Array.isArray(d) ? d : d.therapies ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      await (patientAPI as any).addTherapy({
        name: form.name, type: form.type,
        targetValue: form.targetValue ? Number(form.targetValue) : undefined,
        currentValue: form.currentValue ? Number(form.currentValue) : undefined,
        unit: form.unit || undefined,
        notes: form.notes || undefined,
      });
      setForm({ name: '', type: 'EXERCISE', targetValue: '', currentValue: '', unit: '', notes: '' });
      setShowAdd(false);
      load();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this therapy?')) return;
    setDeleting(id);
    try {
      await (patientAPI as any).deleteTherapy(id);
      setTherapies(prev => prev.filter((t: any) => t.id !== id));
    } catch {}
    setDeleting(null);
  };

  const active    = therapies.filter((t: any) => !t.status || t.status === 'ACTIVE');
  const completed = therapies.filter((t: any) => t.status === 'COMPLETED');

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', background: '#F8FFFE', border: `1.5px solid ${C.border}`, borderRadius: 9, color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, color: C.text2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 };

  return (
    <div style={{ padding: '4px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0, fontFamily: "'Syne',sans-serif" }}>🏥 Therapies</h2>
          <div style={{ fontSize: 13, color: C.text3, marginTop: 4 }}>Manage your therapy sessions and progress</div>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          style={{ padding: '10px 20px', background: showAdd ? '#F1F5F9' : `linear-gradient(135deg,${C.teal},${C.tealLight})`, color: showAdd ? C.text2 : '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: showAdd ? 'none' : '0 2px 10px rgba(13,148,136,0.3)' }}>
          {showAdd ? '✕ Cancel' : '+ Add Therapy'}
        </button>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { icon: '💊', value: therapies.length, label: 'Total', color: C.teal },
          { icon: '✅', value: active.length,    label: 'Active',    color: C.green },
          { icon: '🏁', value: completed.length, label: 'Completed', color: C.purple },
        ].map(k => (
          <div key={k.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>{k.icon}</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: k.color, fontFamily: "'Syne',sans-serif", lineHeight: 1, marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 13, color: C.text2, fontWeight: 600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Add Form */}
      {showAdd && (
        <div style={{ background: C.card, border: `1.5px solid ${C.teal}44`, borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: '0 4px 20px rgba(13,148,136,0.1)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 18 }}>Add New Therapy</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={lbl}>THERAPY NAME *</label>
              <input style={inp} placeholder="e.g. Morning Walk" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>TYPE</label>
              <select style={{ ...inp }} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {Object.keys(TYPE_ICON).map(t => <option key={t} value={t}>{TYPE_ICON[t]} {t}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>TARGET VALUE</label>
              <input style={inp} type="number" placeholder="e.g. 30" value={form.targetValue} onChange={e => setForm({ ...form, targetValue: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>UNIT</label>
              <input style={inp} placeholder="e.g. minutes, steps..." value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>NOTES (optional)</label>
            <input style={inp} placeholder="Additional details..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button onClick={handleAdd} disabled={saving || !form.name}
            style={{ padding: '10px 28px', background: `linear-gradient(135deg,${C.teal},${C.tealLight})`, color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: !form.name ? 'not-allowed' : 'pointer', opacity: !form.name ? 0.5 : 1 }}>
            {saving ? 'Saving...' : 'Add Therapy'}
          </button>
        </div>
      )}

      {/* Active Therapies */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 160, borderRadius: 14, background: C.tealBg, opacity: 0.6 }} />)}
        </div>
      ) : therapies.length === 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '50px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🏥</div>
          <div style={{ fontWeight: 700, color: C.text, fontSize: 15, marginBottom: 6 }}>No therapies yet</div>
          <div style={{ fontSize: 13, color: C.text3 }}>Add lifestyle therapies to track your progress</div>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 14 }}>🟢 Active Therapies</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14, marginBottom: 28 }}>
                {active.map((t: any, i: number) => {
                  const color = TYPE_COLOR[t.type] ?? C.teal;
                  const icon  = TYPE_ICON[t.type]  ?? '🌱';
                  const pct   = t.currentValue && t.targetValue
                    ? Math.min(100, Math.round((t.currentValue / t.targetValue) * 100))
                    : t.progress ?? 0;
                  const started = t.startDate ? new Date(t.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
                  return (
                    <div key={t.id ?? i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, border: `1.5px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{icon}</div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{t.name}</div>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: C.greenBg, color: C.green, border: `1px solid ${C.green}40` }}>
                              {t.status ?? 'ACTIVE'}
                            </span>
                          </div>
                        </div>
                        <div style={{ position: 'relative' }}>
                          <ProgressRing pct={pct} color={color} size={52} />
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color }}>
                            {pct}%
                          </div>
                        </div>
                      </div>
                      {t.targetValue && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.text3, marginBottom: 5 }}>
                            <span>Progress</span>
                            <span style={{ color: C.text2, fontWeight: 600 }}>{t.currentValue ?? 0} / {t.targetValue} {t.unit ?? ''}</span>
                          </div>
                          <div style={{ height: 7, background: '#E2EEF0', borderRadius: 100, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 100, transition: 'width 1s ease' }} />
                          </div>
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: C.text3 }}>Started: {started}</div>
                      {t.notes && <div style={{ fontSize: 12, color: C.text2, fontStyle: 'italic', marginTop: 6 }}>"{t.notes}"</div>}
                      {t.id && (
                        <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id}
                          style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', color: '#DC2626', padding: '3px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                          {deleting === t.id ? '...' : 'Remove'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {completed.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 14 }}>✅ Completed</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
                {completed.map((t: any, i: number) => (
                  <div key={t.id ?? i} style={{ background: '#F8FAFC', border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, opacity: 0.8 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 24 }}>{TYPE_ICON[t.type] ?? '🌱'}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{t.name}</div>
                        <div style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>✓ Completed</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
