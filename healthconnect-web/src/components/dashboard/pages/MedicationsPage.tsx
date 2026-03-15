'use client';
import { useEffect, useState, useCallback } from 'react';
import { api, patientAPI } from '@/lib/api';

const C = {
  bg: '#0B1E1C', card: '#FFFFFF', border: '#E2EEF0',
  teal: '#0D9488', tealLight: '#14B8A6', tealBg: '#F0FDF9',
  text: '#0F2D2A', text2: '#4B6E6A', text3: '#64748B',
  red: '#EF4444', amber: '#F59E0B', green: '#22C55E', purple: '#8B5CF6',
};
const card: React.CSSProperties = {
  background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
};

type Med = {
  id: string; name: string; dosage: string; frequency: string;
  timesOfDay: string[]; currentStock: number; refillThreshold: number;
  status: string; prescribedBy?: string; adherence30Day?: number;
  startDate?: string; endDate?: string; notes?: string; instructions?: string;
};
type Log = { id: string; takenAt?: string; scheduledTime?: string; status: 'TAKEN' | 'MISSED' | 'SKIPPED'; };

export default function MedicationsPage() {
  const [meds,        setMeds]        = useState<Med[]>([]);
  const [logs,        setLogs]        = useState<Record<string, Log[]>>({});
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState<'Active' | 'All' | 'Discontinued'>('Active');
  const [showAdd,     setShowAdd]     = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [toastMsg,    setToastMsg]    = useState('');
  const [toastErr,    setToastErr]    = useState(false);
  const [actioning,   setActioning]   = useState<string | null>(null); // medId being actioned
  const [kpis,        setKpis]        = useState({ activeMeds: 0, avgAdherence: 0, refillAlerts: 0, todayDoses: 0, todayTaken: 0 });

  const toast = (msg: string, err = false) => {
    setToastMsg(msg); setToastErr(err);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const r: any = await api.get('/patient/medications');
      const all: Med[] = r?.data?.data ?? r?.data?.medications ?? r?.data ?? [];
      setMeds(all);

      const active = all.filter((m: Med) => m.status === 'ACTIVE');
      const adherences = active.map((m: Med) => m.adherence30Day ?? 0);
      const avgAdh = adherences.length
        ? Math.round(adherences.reduce((a: number, b: number) => a + b, 0) / adherences.length)
        : 0;
      const refills = active.filter((m: Med) => (m.currentStock ?? 0) <= (m.refillThreshold ?? 5)).length;

      const today = new Date().toISOString().split('T')[0];
      const logResults = await Promise.allSettled(
        active.map((m: Med) => api.get(`/patient/medications/${m.id}/logs`, { params: { date: today } }))
      );

      let todayTaken = 0, todayTotal = 0;
      const newLogs: Record<string, Log[]> = {};
      logResults.forEach((res, i) => {
        const dayLogs: Log[] = res.status === 'fulfilled'
          ? (res.value as any)?.data?.data ?? (res.value as any)?.data?.logs ?? (res.value as any)?.data ?? []
          : [];
        newLogs[active[i].id] = dayLogs;
        todayTotal += (active[i].timesOfDay?.length ?? 1);
        todayTaken += dayLogs.filter((l: Log) => l.status === 'TAKEN').length;
      });
      setLogs(newLogs);
      setKpis({ activeMeds: active.length, avgAdherence: avgAdh, refillAlerts: refills, todayDoses: todayTotal, todayTaken });
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.response?.status ?? e?.message ?? 'Unknown error';
      console.error('MedicationsPage loadData error:', e?.response?.status, msg, e);
      toast(`Failed to load medications (${msg})`, true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Log a dose ────────────────────────────────────────────────────────────
  // Uses direct api.post to /patient/medications/:id/log (confirmed backend route)
  const handleDose = async (medId: string, action: 'TAKEN' | 'MISSED' | 'SKIPPED') => {
    setActioning(medId + '_' + action);
    try {
      await api.post(`/patient/medications/${medId}/log`, {
        status: action,
        takenAt: new Date().toISOString(),
        scheduledTime: new Date().toISOString(),
      });
      const label = action === 'TAKEN' ? '✓ Dose marked as taken' : action === 'SKIPPED' ? 'Dose skipped' : 'Dose marked as missed';
      toast(label);
      // Optimistic update for badge
      setLogs(prev => ({
        ...prev,
        [medId]: [...(prev[medId] ?? []), { id: Date.now().toString(), status: action, takenAt: new Date().toISOString() }],
      }));
      // Full reload to sync server state
      setTimeout(() => loadData(), 800);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Failed to log dose. Try again.';
      toast(msg, true);
      console.error('logDose error:', e);
    }
    setActioning(null);
  };

  const handleDiscontinue = async (medId: string) => {
    if (!confirm('Mark this medication as discontinued? This cannot be undone.')) return;
    try {
      await api.put(`/patient/medications/${medId}`, { status: 'DISCONTINUED' });
      toast('Medication discontinued');
      loadData();
    } catch (e: any) {
      toast(e?.response?.data?.message ?? 'Failed to update', true);
    }
  };

  const displayMeds = meds.filter(m =>
    filter === 'All' ? true :
    filter === 'Active' ? m.status === 'ACTIVE' :
    m.status === 'DISCONTINUED'
  );

  const adherenceColor = (pct: number) => pct >= 80 ? C.green : pct >= 50 ? C.amber : C.red;

  const FREQ_DISPLAY: Record<string, string> = {
    DAILY: 'Once daily', TWICE_DAILY: 'Twice daily', THRICE_DAILY: '3x daily',
    WEEKLY: 'Weekly', MONTHLY: 'Monthly', AS_NEEDED: 'As needed', ONCE_DAILY: 'Once daily',
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height: 100, borderRadius: 16, background: 'rgba(255,255,255,0.06)', animation: 'hcPulse 1.5s ease infinite' }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(480px,1fr))', gap: 18 }}>
        {[1,2].map(i => <div key={i} style={{ height: 280, borderRadius: 16, background: 'rgba(255,255,255,0.06)', animation: 'hcPulse 1.5s ease infinite' }} />)}
      </div>
      <style>{`@keyframes hcPulse{0%,100%{opacity:.6}50%{opacity:1}}`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Toast */}
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, background: toastErr ? '#7F1D1D' : '#0F2D2A', color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', border: `1px solid ${toastErr ? 'rgba(239,68,68,0.3)' : 'rgba(20,184,166,0.3)'}`, maxWidth: 320 }}>
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 10 }}>💊 Medications</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>Track prescriptions, log doses and monitor adherence</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={loadData} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>↺ Refresh</button>
          <button onClick={() => setShowAdd(true)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C.teal},${C.tealLight})`, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(13,148,136,0.35)' }}>+ Add Medication</button>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {[
          { label: 'ACTIVE MEDS',   value: kpis.activeMeds,                    color: C.teal,   sub: 'Prescriptions' },
          { label: 'AVG ADHERENCE', value: `${kpis.avgAdherence}%`,            color: adherenceColor(kpis.avgAdherence), sub: 'Last 30 days' },
          { label: 'REFILL ALERTS', value: kpis.refillAlerts,                  color: kpis.refillAlerts > 0 ? C.red : C.green, sub: kpis.refillAlerts > 0 ? 'Need refill' : 'All stocked' },
          { label: "TODAY'S DOSES", value: `${kpis.todayTaken}/${kpis.todayDoses}`, color: C.purple, sub: 'Taken today' },
        ].map(k => (
          <div key={k.label} style={{ ...card, padding: '20px 22px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{k.label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: k.color, lineHeight: 1, marginBottom: 6 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: C.text3 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Today's dose progress */}
      {kpis.todayDoses > 0 && (
        <div style={{ ...card, padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, minWidth: 120 }}>Today's Progress</div>
          <div style={{ flex: 1, height: 10, borderRadius: 100, background: '#E2EEF0', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${kpis.todayDoses > 0 ? (kpis.todayTaken / kpis.todayDoses) * 100 : 0}%`, borderRadius: 100, background: `linear-gradient(90deg,${C.teal},${C.tealLight})`, transition: 'width 0.6s ease' }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.teal, minWidth: 60, textAlign: 'right' }}>
            {kpis.todayDoses > 0 ? Math.round((kpis.todayTaken / kpis.todayDoses) * 100) : 0}%
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['Active', 'All', 'Discontinued'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '8px 18px', borderRadius: 100, border: `1.5px solid ${filter === f ? C.teal : C.border}`, background: filter === f ? C.tealBg : C.card, color: filter === f ? C.teal : C.text3, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>{f}</button>
          ))}
        </div>
        <span style={{ fontSize: 13, color: C.text3 }}>{displayMeds.length} medication{displayMeds.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Empty state */}
      {displayMeds.length === 0 && (
        <div style={{ ...card, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>💊</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>No medications found</div>
          <div style={{ fontSize: 14, color: C.text3, marginBottom: 20 }}>{filter === 'Active' ? 'You have no active medications.' : `No ${filter.toLowerCase()} medications.`}</div>
          <button onClick={() => setShowAdd(true)} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C.teal},${C.tealLight})`, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>+ Add Medication</button>
        </div>
      )}

      {/* Medication cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(480px,1fr))', gap: 18 }}>
        {displayMeds.map(med => {
          const adh     = med.adherence30Day ?? 0;
          const adhCol  = adherenceColor(adh);
          const lowStock = (med.currentStock ?? 0) <= (med.refillThreshold ?? 5);
          const medLogs  = logs[med.id] ?? [];
          const showLogs = expandedLog === med.id;
          const todayTaken = medLogs.filter(l => l.status === 'TAKEN').length;
          const doseTarget = med.timesOfDay?.length ?? 1;
          const allTakenToday = med.status === 'ACTIVE' && todayTaken >= doseTarget;

          return (
            <div key={med.id} style={{ ...card, overflow: 'hidden' }}>
              {/* Status accent bar */}
              <div style={{ height: 3, background: med.status === 'ACTIVE' ? `linear-gradient(90deg,${C.teal},${C.tealLight})` : '#E2EEF0' }} />
              <div style={{ padding: '20px 22px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 3 }}>{med.name}</div>
                    <div style={{ fontSize: 13, color: C.text2, fontWeight: 500 }}>
                      {med.dosage} · {FREQ_DISPLAY[med.frequency] ?? med.frequency}
                    </div>
                    {med.timesOfDay?.length > 0 && (
                      <div style={{ fontSize: 12, color: C.text3, marginTop: 3 }}>
                        {med.timesOfDay.map(t => t.charAt(0) + t.slice(1).toLowerCase()).join(', ')}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {allTakenToday && <span style={{ fontSize: 12, color: C.green, fontWeight: 700 }}>✓ Done</span>}
                    <span style={{ padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: med.status === 'ACTIVE' ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)', color: med.status === 'ACTIVE' ? C.green : C.text3, border: `1px solid ${med.status === 'ACTIVE' ? 'rgba(34,197,94,0.25)' : C.border}` }}>
                      {med.status}
                    </span>
                  </div>
                </div>

                {/* Instructions */}
                {med.instructions && (
                  <div style={{ background: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.15)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#0F766E', marginBottom: 12 }}>
                    📋 {med.instructions}
                  </div>
                )}

                {/* 30-day adherence */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: C.text3, fontWeight: 500 }}>30-day adherence</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: adhCol }}>{adh}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 100, background: '#E2EEF0', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${adh}%`, borderRadius: 100, background: adhCol, transition: 'width 0.6s ease' }} />
                  </div>
                </div>

                {/* Meta row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 12, color: C.text3 }}>
                    Rx by: <span style={{ color: C.text2, fontWeight: 600 }}>{med.prescribedBy ?? 'Self / OTC'}</span>
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: lowStock ? C.red : C.text2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {lowStock && '⚠ '}Stock: {med.currentStock ?? 0} left
                  </span>
                </div>

                {/* Dose action buttons */}
                {med.status === 'ACTIVE' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 10 }}>
                    {(['TAKEN', 'SKIPPED', 'MISSED'] as const).map(action => {
                      const isActioning = actioning === med.id + '_' + action;
                      const styles: Record<string, { bg: string; color: string; border: string; label: string }> = {
                        TAKEN:   { bg: C.tealBg,                        color: C.teal,  border: `1.5px solid rgba(13,148,136,0.25)`, label: '✓ Mark Taken' },
                        SKIPPED: { bg: 'rgba(245,158,11,0.07)',          color: C.amber, border: '1.5px solid rgba(245,158,11,0.25)', label: 'Skip Dose' },
                        MISSED:  { bg: 'rgba(239,68,68,0.07)',           color: C.red,   border: '1.5px solid rgba(239,68,68,0.2)',   label: 'Missed' },
                      };
                      const s = styles[action];
                      return (
                        <button key={action} onClick={() => handleDose(med.id, action)} disabled={!!actioning}
                          style={{ padding: '9px 4px', borderRadius: 9, border: s.border, background: s.bg, color: s.color, fontSize: 12, fontWeight: 700, cursor: actioning ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: actioning ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          {isActioning ? '...' : s.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Secondary actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button onClick={() => setExpandedLog(showLogs ? null : med.id)} style={{ padding: '8px 0', borderRadius: 9, border: `1.5px solid ${C.border}`, background: 'transparent', color: C.text3, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    {showLogs ? '↑ Hide logs' : '↓ View dose logs'}
                  </button>
                  {med.status === 'ACTIVE' && (
                    <button onClick={() => handleDiscontinue(med.id)} style={{ padding: '8px 0', borderRadius: 9, border: '1.5px solid rgba(239,68,68,0.2)', background: 'transparent', color: C.red, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Discontinue
                    </button>
                  )}
                </div>
              </div>

              {/* Logs panel */}
              {showLogs && (
                <div style={{ borderTop: `1px solid ${C.border}`, padding: '16px 22px', background: '#F8FFFE' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text3, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>Recent Dose Logs</div>
                  {medLogs.length === 0 ? (
                    <div style={{ fontSize: 13, color: C.text3, textAlign: 'center', padding: '12px 0' }}>No dose logs recorded today</div>
                  ) : (
                    medLogs.slice(0, 10).map(log => (
                      <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: 13, color: C.text2 }}>
                          {new Date(log.takenAt ?? log.scheduledTime ?? Date.now()).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: log.status === 'TAKEN' ? 'rgba(34,197,94,0.1)' : log.status === 'SKIPPED' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', color: log.status === 'TAKEN' ? C.green : log.status === 'SKIPPED' ? C.amber : C.red }}>
                          {log.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showAdd && <AddMedModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); loadData(); toast('✓ Medication added'); }} />}
    </div>
  );
}

// ── Add Medication Modal ───────────────────────────────────────────────────
function AddMedModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: '', dosage: '', frequency: 'DAILY', timesOfDay: ['MORNING'],
    currentStock: '', refillThreshold: '5', prescribedBy: '',
    instructions: '', notes: '', startDate: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const inp: React.CSSProperties = { display: 'block', width: '100%', padding: '10px 14px', borderRadius: 9, border: '1.5px solid #E2EEF0', fontSize: 14, color: '#0F2D2A', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#F8FFFE', marginBottom: 14 };

  const TIMES = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'BEFORE_BED'];
  const toggleTime = (t: string) => set('timesOfDay', form.timesOfDay.includes(t) ? form.timesOfDay.filter(x => x !== t) : [...form.timesOfDay, t]);

  const save = async () => {
    if (!form.name.trim() || !form.dosage.trim()) { setErr('Medication name and dosage are required'); return; }
    setSaving(true); setErr('');
    try {
      await api.post('/patient/medications', {
        name: form.name.trim(),
        dosage: form.dosage.trim(),
        frequency: form.frequency,
        timesOfDay: form.timesOfDay,
        currentStock: parseInt(form.currentStock) || 0,
        refillThreshold: parseInt(form.refillThreshold) || 5,
        prescribedBy: form.prescribedBy.trim() || undefined,
        instructions: form.instructions.trim() || undefined,
        notes: form.notes.trim() || undefined,
        startDate: form.startDate || undefined,
      });
      onSaved();
    } catch (e: any) { setErr(e?.response?.data?.message ?? 'Failed to save'); }
    setSaving(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 20, padding: '28px', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F2D2A', margin: 0 }}>Add Medication</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#64748B', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>MEDICATION NAME *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Metformin 500mg" style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>DOSAGE *</label>
            <input value={form.dosage} onChange={e => set('dosage', e.target.value)} placeholder="500mg" style={inp} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>FREQUENCY</label>
            <select value={form.frequency} onChange={e => set('frequency', e.target.value)} style={{ ...inp, cursor: 'pointer', marginBottom: 0 }}>
              <option value="DAILY">Once Daily</option>
              <option value="TWICE_DAILY">Twice Daily</option>
              <option value="THRICE_DAILY">3x Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="AS_NEEDED">As Needed</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>START DATE</label>
            <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} style={{ ...inp, marginBottom: 0 }} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>TIMES OF DAY</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TIMES.map(t => (
              <button key={t} onClick={() => toggleTime(t)} type="button" style={{ padding: '6px 14px', borderRadius: 100, border: `1.5px solid ${form.timesOfDay.includes(t) ? '#0D9488' : '#E2EEF0'}`, background: form.timesOfDay.includes(t) ? '#F0FDF9' : 'transparent', color: form.timesOfDay.includes(t) ? '#0D9488' : '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {t.charAt(0) + t.slice(1).replace('_', ' ').toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>CURRENT STOCK</label>
            <input type="number" min="0" value={form.currentStock} onChange={e => set('currentStock', e.target.value)} placeholder="30" style={{ ...inp, marginBottom: 0 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>REFILL ALERT AT</label>
            <input type="number" min="0" value={form.refillThreshold} onChange={e => set('refillThreshold', e.target.value)} placeholder="5" style={{ ...inp, marginBottom: 0 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>PRESCRIBED BY</label>
            <input value={form.prescribedBy} onChange={e => set('prescribedBy', e.target.value)} placeholder="Dr. Name / Self" style={{ ...inp, marginBottom: 0 }} />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>INSTRUCTIONS (e.g. Take with food)</label>
          <input value={form.instructions} onChange={e => set('instructions', e.target.value)} placeholder="e.g. Take with meals, avoid alcohol" style={inp} />
        </div>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>NOTES</label>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes..." rows={2} style={{ ...inp, resize: 'vertical' }} />

        {err && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 9, padding: '10px 14px', color: '#EF4444', fontSize: 13, marginBottom: 14 }}>{err}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '12px 0', borderRadius: 10, border: '1px solid #E2EEF0', background: 'transparent', color: '#64748B', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '12px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#0D9488,#14B8A6)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Adding...' : '+ Add Medication'}
          </button>
        </div>
      </div>
    </div>
  );
}
