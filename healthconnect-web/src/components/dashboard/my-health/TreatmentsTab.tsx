'use client';
import { useState, useEffect } from 'react';
import { patientAPI } from '@/lib/api';

const FREQ_LABELS: Record<string, string> = {
  ONCE_DAILY:'Once daily', TWICE_DAILY:'Twice daily', THREE_TIMES_DAILY:'3× daily',
  FOUR_TIMES_DAILY:'4× daily', WEEKLY:'Weekly', BIWEEKLY:'Biweekly',
  MONTHLY:'Monthly', AS_NEEDED:'As needed', CUSTOM:'Custom schedule',
};

const MED_COLORS = ['#14B8A6','#8B5CF6','#F59E0B','#F43F5E','#22C55E','#3B82F6'];

function adherenceColor(pct: number) {
  if (pct >= 85) return '#22C55E';
  if (pct >= 70) return '#F59E0B';
  return '#F43F5E';
}

function nextDoseLabel(timesOfDay: string[] | undefined): string {
  if (!timesOfDay?.length) return 'As scheduled';
  const sorted = [...timesOfDay].sort();
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  for (const t of sorted) {
    const [h, m] = t.split(':').map(Number);
    if (h * 60 + m > cur) return t;
  }
  return `Tomorrow ${sorted[0]}`;
}

const isTaken = (status: unknown) => String(status ?? '').toLowerCase() === 'taken';

export default function TreatmentsTab() {
  const [medications, setMedications] = useState<any[]>([]);
  const [therapies,   setTherapies]   = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [logging,     setLogging]     = useState<string | null>(null);
  const [error,       setError]       = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [medRes, thRes] = await Promise.all([
        patientAPI.getMedications(),
        patientAPI.getTherapies(),
      ]);
      const medData = medRes?.data?.data ?? medRes?.data ?? [];
      const allMeds = Array.isArray(medData) ? medData
        : Array.isArray(medData.medications) ? medData.medications : [];
      setMedications(allMeds.filter((m: any) => !m.status || m.status === 'ACTIVE'));

      const thData = thRes?.data?.data ?? thRes?.data ?? [];
      setTherapies(Array.isArray(thData) ? thData
        : Array.isArray(thData.therapies) ? thData.therapies : []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Unable to load treatments right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleMarkTaken = async (med: any) => {
    setLogging(med.id);
    setError('');
    const now = new Date().toISOString();
    try {
      await patientAPI.logDose(med.id, {
        status: 'taken',
        scheduledTime: now,
        takenAt: now,
      });
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not log this dose. Please try again.');
    } finally {
      setLogging(null);
    }
  };

  const refillAlerts = medications.filter(m => m.needsRefill || m.refillAlert);

  if (loading) {
    return (
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ height:200, borderRadius:14, background:'linear-gradient(90deg,#e8f5f2 25%,#f0faf8 50%,#e8f5f2 75%)', backgroundSize:'200% 100%', animation:'ttSkel 1.5s infinite' }} />
        ))}
        <style>{`@keyframes ttSkel{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div style={{ background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.25)', borderRadius:12, padding:'11px 16px', marginBottom:18, color:'#BE123C', fontSize:13 }}>
          {error}
        </div>
      )}

      {refillAlerts.length > 0 && (
        <div style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.35)', borderRadius:12, padding:'12px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18 }}>⚠️</span>
          <div>
            <span style={{ color:'#B45309', fontWeight:700, fontSize:13 }}>Refill needed: </span>
            <span style={{ color:'#4B6E6A', fontSize:13 }}>
              {refillAlerts.map((m:any) => `${m.name} (${m.currentStock ?? 0} left)`).join(' · ')}
            </span>
          </div>
        </div>
      )}

      <h3 style={{ color:'#0F2D2A', fontWeight:700, fontSize:15, marginBottom:14 }}>💊 Active Medications</h3>

      {medications.length === 0 ? (
        <div style={{ background:'#F0FDF9', border:'1px solid #E2EEF0', borderRadius:14, padding:'40px 0', textAlign:'center', color:'#64748B', marginBottom:28 }}>
          <div style={{ fontSize:36, marginBottom:10 }}>💊</div>
          <div style={{ fontWeight:600, color:'#0F2D2A', marginBottom:4 }}>No active medications</div>
          <div style={{ fontSize:12, color:'#64748B' }}>Use Medications in the left menu to add and manage prescriptions.</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16, marginBottom:28 }}>
          {medications.map((m: any, i: number) => {
            const color = MED_COLORS[i % MED_COLORS.length];
            const rawAdh = m.adherencePct ?? m.adherence30Day ?? m.adherence;
            const hasAdherence = typeof rawAdh === 'number';
            const adh = hasAdherence ? rawAdh : 0;
            const adhColor = adherenceColor(adh);
            const takenToday = Array.isArray(m.logs) && m.logs.some((l: any) => {
              const stamp = l.takenAt ?? l.scheduledTime ?? l.createdAt;
              if (!stamp) return false;
              return new Date(stamp).toDateString() === new Date().toDateString() && isTaken(l.status);
            });

            return (
              <div key={m.id ?? i} style={{ background:'#FFFFFF', border:'1px solid #E2EEF0', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ height:4, background:color }} />
                <div style={{ padding:18 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <div>
                      <div style={{ fontWeight:700, color:'#0F2D2A', fontSize:15 }}>{m.name}</div>
                      <div style={{ fontSize:12, color:'#4B6E6A', marginTop:2 }}>
                        {m.dosage} {m.dosageUnit ?? ''} · {FREQ_LABELS[m.frequency] ?? m.customFrequency ?? m.frequency ?? '—'}
                      </div>
                    </div>
                    <span style={{ background:'rgba(34,197,94,0.1)', color:'#16A34A', fontSize:10, padding:'3px 10px', borderRadius:100, fontWeight:700, border:'1px solid rgba(34,197,94,0.3)' }}>
                      {m.status ?? 'ACTIVE'}
                    </span>
                  </div>

                  {(m.prescribedFor ?? m.purpose) && (
                    <div style={{ fontSize:12, color:'#4B6E6A', marginBottom:10 }}>For: {m.prescribedFor ?? m.purpose}</div>
                  )}

                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#64748B', marginBottom:5 }}>
                    <span>30-day adherence</span>
                    <span style={{ color:hasAdherence ? adhColor : '#64748B', fontWeight:700 }}>{hasAdherence ? `${adh}%` : 'No doses logged'}</span>
                  </div>
                  <div style={{ height:6, background:'#E2EEF0', borderRadius:3, overflow:'hidden', marginBottom:12 }}>
                    <div style={{ height:'100%', width:`${hasAdherence ? adh : 0}%`, background:adhColor, borderRadius:3 }} />
                  </div>

                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#64748B', marginBottom:14 }}>
                    <span>Next: {nextDoseLabel(m.timesOfDay ?? m.times)}</span>
                    <span style={{ color:(m.needsRefill || m.refillAlert) ? '#D97706' : '#64748B', fontWeight:(m.needsRefill || m.refillAlert) ? 700 : 400 }}>
                      {(m.needsRefill || m.refillAlert) ? `⚠️ ${m.currentStock ?? 0} left` : `Stock: ${m.currentStock ?? '—'}`}
                    </span>
                  </div>

                  <button
                    disabled={!!logging || takenToday}
                    onClick={() => handleMarkTaken(m)}
                    style={{ width:'100%', padding:'10px', borderRadius:9, border:takenToday ? '1.5px solid rgba(34,197,94,0.4)' : '1.5px solid #0D9488', cursor:takenToday ? 'default' : 'pointer', fontWeight:700, fontSize:13,
                      background:takenToday ? 'rgba(34,197,94,0.08)' : 'linear-gradient(135deg,#0D9488,#14B8A6)', color:takenToday ? '#16A34A' : '#fff' }}>
                    {logging === m.id ? 'Saving...' : takenToday ? '✓ Taken today' : '✓ Mark as taken'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h3 style={{ color:'#0F2D2A', fontWeight:700, fontSize:15, marginBottom:14 }}>🌱 Lifestyle Therapy</h3>

      {therapies.length === 0 ? (
        <div style={{ background:'#F0FDF9', border:'1px solid #E2EEF0', borderRadius:14, padding:'40px 0', textAlign:'center', color:'#64748B' }}>
          <div style={{ fontSize:36, marginBottom:10 }}>🌱</div>
          <div style={{ fontWeight:600, color:'#0F2D2A', marginBottom:4 }}>No lifestyle therapies tracked</div>
          <div style={{ fontSize:12 }}>Use Therapies in the left menu to track care plans and goals.</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
          {therapies.map((t: any, i: number) => {
            const current = Number(t.currentValue);
            const target = Number(t.targetValue);
            const pct = Number.isFinite(current) && Number.isFinite(target) && target > 0
              ? Math.round((current / target) * 100)
              : Number(t.progress ?? 0);
            const col = MED_COLORS[i % MED_COLORS.length];
            return (
              <div key={t.id ?? i} style={{ background:'#FFFFFF', border:'1px solid #E2EEF0', borderRadius:14, padding:18, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                  <span style={{ fontSize:24 }}>{t.type === 'EXERCISE' ? '🏃' : t.type === 'DIET' ? '🥗' : t.type === 'SLEEP' ? '😴' : t.type === 'STRESS' ? '🧘' : '🌱'}</span>
                  <div>
                    <div style={{ fontWeight:700, color:'#0F2D2A', fontSize:14 }}>{t.plan ?? t.name ?? t.type}</div>
                    <div style={{ fontSize:12, color:'#64748B' }}>Target: {t.targetValue ?? '—'} {t.unit ?? ''}</div>
                  </div>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13, color:'#4B6E6A' }}>
                  <span>Current: {t.currentValue ?? '—'} {t.unit ?? ''}</span>
                  <span style={{ fontWeight:800, color:col }}>{Math.max(0, pct)}%</span>
                </div>
                <div style={{ height:8, background:'#E2EEF0', borderRadius:100, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${Math.min(Math.max(pct,0),100)}%`, background:col, borderRadius:100, transition:'width 1s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}