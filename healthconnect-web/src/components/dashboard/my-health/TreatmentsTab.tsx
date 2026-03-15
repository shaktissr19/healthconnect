'use client';
import { useState, useEffect } from 'react';
import { patientAPI } from '@/lib/api';

const FREQ_LABELS: Record<string, string> = {
  ONCE_DAILY:'Once daily', TWICE_DAILY:'Twice daily', THREE_TIMES_DAILY:'3× daily',
  FOUR_TIMES_DAILY:'4× daily', EVERY_4_HOURS:'Every 4h', EVERY_6_HOURS:'Every 6h',
  EVERY_8_HOURS:'Every 8h', EVERY_12_HOURS:'Every 12h', WEEKLY:'Weekly',
  BIWEEKLY:'Biweekly', MONTHLY:'Monthly', AS_NEEDED:'As needed',
};

const MED_COLORS = ['#14B8A6','#8B5CF6','#F59E0B','#F43F5E','#22C55E','#3B82F6'];

function adherenceColor(pct: number) {
  if (pct >= 85) return '#22C55E';
  if (pct >= 70) return '#F59E0B';
  return '#F43F5E';
}

function nextDoseLabel(timesOfDay: string[] | undefined): string {
  if (!timesOfDay?.length) return '—';
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  // Find next time today
  for (const t of timesOfDay.sort()) {
    const [h, m] = t.split(':').map(Number);
    if (h * 60 + m > cur) return t;
  }
  // All passed → first dose tomorrow
  return `Tomorrow ${timesOfDay[0]}`;
}

export default function TreatmentsTab() {
  const [medications, setMedications] = useState<any[]>([]);
  const [therapies,   setTherapies]   = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [logging,     setLogging]     = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      patientAPI.getMedications().catch(() => null),
      patientAPI.getTherapies ? patientAPI.getTherapies().catch(() => null) : Promise.resolve(null),
    ]).then(([medRes, thRes]) => {
      // Backend returns: { success:true, data: [ ...medications ] }  (direct array)
      // OR:              { success:true, data: { medications: [...] } }
      const medData = medRes?.data?.data ?? medRes?.data ?? [];
      const allMeds = Array.isArray(medData) ? medData
        : Array.isArray(medData.medications) ? medData.medications : [];
      // Treatments tab shows ACTIVE medications only
      const meds = allMeds.filter((m: any) => !m.status || m.status === 'ACTIVE');
      setMedications(meds);

      const thData = thRes?.data?.data ?? thRes?.data ?? [];
      const ths = Array.isArray(thData) ? thData
        : Array.isArray(thData.therapies) ? thData.therapies : [];
      setTherapies(ths);
    }).finally(() => setLoading(false));
  }, []);

  const handleMarkTaken = async (med: any) => {
    setLogging(med.id);
    try {
      await patientAPI.logDose(med.id, { status: 'TAKEN', takenAt: new Date().toISOString() });
      // Refresh
      const res = await patientAPI.getMedications();
      const d = res?.data?.data ?? res?.data ?? [];
      setMedications(Array.isArray(d) ? d : d.medications ?? []);
    } catch { /* silent */ }
    setLogging(null);
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
      {/* Refill Alert */}
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

      {/* Medications */}
      <h3 style={{ color:'#0F2D2A', fontWeight:700, fontSize:15, marginBottom:14 }}>
        💊 Active Medications
      </h3>

      {medications.length === 0 ? (
        <div style={{ background:'#F0FDF9', border:'1px solid #E2EEF0', borderRadius:14, padding:'40px 0', textAlign:'center', color:'#64748B', marginBottom:28 }}>
          <div style={{ fontSize:36, marginBottom:10 }}>💊</div>
          <div style={{ fontWeight:600, color:'#0F2D2A', marginBottom:4 }}>No active medications</div>
          <div style={{ fontSize:12, color:'#64748B' }}>Go to Medications page to add prescriptions</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16, marginBottom:28 }}>
          {medications.map((m: any, i: number) => {
            const color   = MED_COLORS[i % MED_COLORS.length];
            const adh     = m.adherencePct ?? m.adherence ?? 0;
            const adhColor = adherenceColor(adh);
            const takenToday = Array.isArray(m.logs) && m.logs.some((l: any) => {
              const d = new Date(l.takenAt ?? l.createdAt);
              return d.toDateString() === new Date().toDateString() && l.status === 'TAKEN';
            });

            return (
              <div key={m.id ?? i} style={{ background:'#FFFFFF', border:'1px solid #E2EEF0', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', transition:'box-shadow 0.2s' }}>
                <div style={{ height:4, background:color }} />
                <div style={{ padding:18 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <div>
                      <div style={{ fontWeight:700, color:'#0F2D2A', fontSize:15 }}>{m.name}</div>
                      <div style={{ fontSize:12, color:'#4B6E6A', marginTop:2 }}>
                        {m.dosage} · {FREQ_LABELS[m.frequency] ?? m.frequency ?? '—'}
                      </div>
                    </div>
                    <span style={{ background:'rgba(34,197,94,0.1)', color:'#16A34A', fontSize:10, padding:'3px 10px', borderRadius:100, fontWeight:700, border:'1px solid rgba(34,197,94,0.3)' }}>
                      {m.status ?? 'ACTIVE'}
                    </span>
                  </div>

                  {(m.prescribedFor ?? m.purpose) && (
                    <div style={{ fontSize:12, color:'#4B6E6A', marginBottom:10 }}>For: {m.prescribedFor ?? m.purpose}</div>
                  )}

                  {/* Adherence bar */}
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#64748B', marginBottom:5 }}>
                    <span>30-day adherence</span>
                    <span style={{ color:adhColor, fontWeight:700 }}>{adh}%</span>
                  </div>
                  <div style={{ height:6, background:'#E2EEF0', borderRadius:3, overflow:'hidden', marginBottom:12 }}>
                    <div style={{ height:'100%', width:`${adh}%`, background:adhColor, borderRadius:3 }} />
                  </div>

                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#64748B', marginBottom:14 }}>
                    <span>Next: {nextDoseLabel(m.timesOfDay ?? m.times)}</span>
                    <span style={{ color: (m.needsRefill || m.refillAlert) ? '#D97706' : '#64748B', fontWeight: (m.needsRefill || m.refillAlert) ? 700 : 400 }}>
                      {(m.needsRefill || m.refillAlert) ? `⚠️ ${m.currentStock ?? 0} left` : `Stock: ${m.currentStock ?? '—'}`}
                    </span>
                  </div>

                  {/* Mark taken button */}
                  <button
                    disabled={!!logging || takenToday}
                    onClick={() => handleMarkTaken(m)}
                    style={{ width:'100%', padding:'10px', borderRadius:9, border: takenToday ? '1.5px solid rgba(34,197,94,0.4)' : '1.5px solid #0D9488', cursor: takenToday ? 'default' : 'pointer', fontWeight:700, fontSize:13, transition:'all 0.2s',
                      background: takenToday ? 'rgba(34,197,94,0.08)' : 'linear-gradient(135deg,#0D9488,#14B8A6)',
                      color:      takenToday ? '#16A34A' : '#fff',
                    }}>
                    {logging === m.id ? 'Saving...' : takenToday ? '✓ Taken today' : '✓ Mark as taken'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lifestyle Therapies */}
      <h3 style={{ color:'#0F2D2A', fontWeight:700, fontSize:15, marginBottom:14 }}>
        🌱 Lifestyle Therapy
      </h3>

      {therapies.length === 0 ? (
        <div style={{ background:'#F0FDF9', border:'1px solid #E2EEF0', borderRadius:14, padding:'40px 0', textAlign:'center', color:'#64748B' }}>
          <div style={{ fontSize:36, marginBottom:10 }}>🌱</div>
          <div style={{ fontWeight:600, color:'#0F2D2A', marginBottom:4 }}>No lifestyle therapies tracked</div>
          <div style={{ fontSize:12 }}>Add diet, exercise, and sleep goals to track your progress</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
          {therapies.map((t: any, i: number) => {
            const pct = t.currentValue && t.targetValue ? Math.round((t.currentValue / t.targetValue) * 100) : t.progress ?? 0;
            const col = MED_COLORS[i % MED_COLORS.length];
            return (
              <div key={t.id ?? i} style={{ background:'#FFFFFF', border:'1px solid #E2EEF0', borderRadius:14, padding:18, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                  <span style={{ fontSize:24 }}>
                    {t.type === 'EXERCISE' ? '🏃' : t.type === 'DIET' ? '🥗' : t.type === 'SLEEP' ? '😴' : t.type === 'STRESS' ? '🧘' : '🌱'}
                  </span>
                  <div>
                    <div style={{ fontWeight:700, color:'#0F2D2A', fontSize:14 }}>{t.name}</div>
                    <div style={{ fontSize:12, color:'#64748B' }}>Target: {t.targetValue} {t.unit ?? ''}</div>
                  </div>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13, color:'#4B6E6A' }}>
                  <span>Current: {t.currentValue ?? '—'} {t.unit ?? ''}</span>
                  <span style={{ fontWeight:800, color:col }}>{pct}%</span>
                </div>
                <div style={{ height:8, background:'#E2EEF0', borderRadius:100, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${Math.min(pct,100)}%`, background:col, borderRadius:100, transition:'width 1s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
