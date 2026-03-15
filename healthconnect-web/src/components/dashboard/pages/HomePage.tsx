'use client';
import { useState, useEffect, useCallback } from 'react';
import { patientAPI } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

const C = {
  bg:'#F0F9F8', card:'#FFFFFF', border:'#E2EEF0',
  teal:'#0D9488', tealLight:'#14B8A6', tealBg:'rgba(13,148,136,0.08)',
  text:'#0F2D2A', text2:'#4B6E6A', text3:'#4B6E6A',
  green:'#22C55E', amber:'#F59E0B', rose:'#F43F5E', violet:'#8B5CF6',
  sidebar:'#0F2D2A',
};

function scoreColor(s: number) { return s >= 80 ? C.green : s >= 60 ? C.amber : C.rose; }

function KpiCard({ icon, label, value, sub, color, onClick }: any) {
  return (
    <div onClick={onClick} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:'20px 22px', cursor:onClick?'pointer':'default', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', transition:'box-shadow 0.2s' }}
      onMouseEnter={e=>onClick&&((e.currentTarget as HTMLDivElement).style.boxShadow='0 4px 16px rgba(13,148,136,0.12)')}
      onMouseLeave={e=>((e.currentTarget as HTMLDivElement).style.boxShadow='0 1px 4px rgba(0,0,0,0.06)')}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <span style={{ fontSize:22 }}>{icon}</span>
        {sub && <span style={{ fontSize:11, color:C.text3, background:'#F1F5F9', padding:'2px 8px', borderRadius:100 }}>{sub}</span>}
      </div>
      <div style={{ fontSize:28, fontWeight:800, color:color??C.teal, lineHeight:1, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:12, color:C.text2 }}>{label}</div>
    </div>
  );
}

export default function HomePage() {
  const uiStore   = useUIStore() as any;
  const user      = (useAuthStore.getState() as any).user;
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const firstName = user?.firstName ?? data?.profile?.firstName ?? 'there';
  const hour = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greetEmoji = hour < 12 ? '🌅' : hour < 17 ? '👋' : '🌙';
  const today = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await patientAPI.dashboard();
      const d = (r as any)?.data?.data ?? (r as any)?.data ?? {};
      setData(d);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Exact field mapping from getDashboardOverview ──────────────
  const kpis             = data?.kpis ?? {};
  const healthScore      = data?.healthScore?.score ?? null;
  const upcomingCount    = kpis.upcomingAppointmentsCount ?? 0;
  const activeMedsCount  = kpis.activeMedicationsCount ?? 0;
  const symptomsCount    = kpis.recentSymptomsCount ?? 0;
  const refillCount      = kpis.refillAlertsCount ?? 0;
  const adherencePct     = kpis.medicationAdherencePct ?? 0;
  const aiInsight        = data?.aiInsight ?? null;
  const nextAppt         = data?.upcomingAppointments?.[0] ?? null;
  const activeMeds       = data?.activeMedications ?? [];
  const recentVitals     = data?.recentVitals ?? [];      // uses measuredAt
  const recentSymptoms   = data?.recentSymptoms ?? [];

  const QUICK_ACTIONS = [
    { icon:'📊', label:'Log Vitals',       page:'vitals' },
    { icon:'🤒', label:'Log Symptom',      page:'symptoms' },
    { icon:'📁', label:'Upload Report',    page:'my-health' },
    { icon:'📅', label:'Book Appointment', page:'appointments' },
    { icon:'💊', label:'My Medications',   page:'medications' },
    { icon:'👩‍⚕️', label:'Find Doctors',    page:'find-doctors' },
  ];

  return (
    <>
      <style>{`
        .hp-skel { border-radius:12px; background:linear-gradient(90deg,#E8F4F3 25%,#F0F9F8 50%,#E8F4F3 75%); background-size:200% 100%; animation:hp-sh 1.5s infinite; }
        @keyframes hp-sh { 0%{background-position:200% 0}100%{background-position:-200% 0} }
        .hp-qa { display:flex; flex-direction:column; align-items:center; gap:8px; padding:16px 10px; background:${C.card}; border:1px solid ${C.border}; border-radius:14px; cursor:pointer; transition:all 0.2s; }
        .hp-qa:hover { background:${C.tealBg}; border-color:${C.tealLight}; transform:translateY(-2px); box-shadow:0 4px 14px rgba(13,148,136,0.12); }
      `}</style>

      <div style={{ maxWidth:1100 }}>

        {/* Hero */}
        <div style={{ background:`linear-gradient(135deg,${C.sidebar} 0%,#1A4A45 100%)`, borderRadius:20, padding:'28px 32px', marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
          <div>
            <h1 style={{ color:'#fff', fontSize:24, fontWeight:800, margin:'0 0 6px' }}>
              {greeting}, {firstName} {greetEmoji}
            </h1>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13, margin:'0 0 10px' }}>{today}</p>
            {aiInsight && (
              <p style={{ color:'rgba(255,255,255,0.7)', fontSize:12, margin:0, maxWidth:520, lineHeight:1.6, background:'rgba(255,255,255,0.06)', padding:'8px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)' }}>
                💡 {aiInsight}
              </p>
            )}
          </div>
          {healthScore !== null && (
            <div style={{ textAlign:'center', background:'rgba(255,255,255,0.08)', borderRadius:16, padding:'16px 28px', border:'1px solid rgba(255,255,255,0.12)', flexShrink:0 }}>
              <div style={{ fontSize:42, fontWeight:900, color:scoreColor(healthScore), lineHeight:1 }}>{healthScore}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:4, letterSpacing:'0.06em', textTransform:'uppercase' }}>Health Score</div>
              <div style={{ fontSize:11, color:scoreColor(healthScore), marginTop:4, fontWeight:700 }}>
                {healthScore >= 80 ? '🟢 Excellent' : healthScore >= 60 ? '🟡 Good' : '🔴 Needs Attention'}
              </div>
            </div>
          )}
        </div>

        {/* Refill alert banner */}
        {refillCount > 0 && (
          <div onClick={() => uiStore.setActivePage('medications')} style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:12, padding:'12px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
            <span>⚠️</span>
            <span style={{ color:C.amber, fontWeight:700, fontSize:13 }}>{refillCount} medication{refillCount>1?'s':''} need{refillCount===1?'s':''} refill</span>
            <span style={{ marginLeft:'auto', color:C.amber, fontSize:12 }}>View →</span>
          </div>
        )}

        {/* KPI cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
          {loading ? [1,2,3,4].map(i=><div key={i} className="hp-skel" style={{ height:110 }}/>) : <>
            <KpiCard icon="🎯" label="Health Score"         value={healthScore??'—'} sub="Overall"    color={healthScore?scoreColor(healthScore):C.text3} onClick={()=>uiStore.setActivePage('my-health')} />
            <KpiCard icon="💊" label="Active Medications"   value={activeMedsCount}  sub={refillCount>0?`${refillCount} refill needed`:'All stocked'} color={C.teal}   onClick={()=>uiStore.setActivePage('medications')} />
            <KpiCard icon="📅" label="Upcoming Appointments" value={upcomingCount}   sub="Scheduled"  color={C.violet} onClick={()=>uiStore.setActivePage('appointments')} />
            <KpiCard icon="🤒" label="Symptoms This Week"   value={symptomsCount}    sub="Logged"     color={symptomsCount>3?C.rose:C.green} onClick={()=>uiStore.setActivePage('symptoms')} />
          </>}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>

          {/* Next appointment */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <span style={{ fontSize:13, fontWeight:700, color:C.text, textTransform:'uppercase', letterSpacing:'0.06em' }}>📅 Next Appointment</span>
              <button onClick={()=>uiStore.setActivePage('appointments')} style={{ fontSize:12, color:C.teal, background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>View all →</button>
            </div>
            {loading ? <div className="hp-skel" style={{ height:72 }}/> : nextAppt ? (
              <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                <div style={{ width:52, textAlign:'center', background:C.tealBg, borderRadius:12, padding:'10px 8px', border:`1px solid rgba(13,148,136,0.15)`, flexShrink:0 }}>
                  <div style={{ fontSize:20, fontWeight:900, color:C.teal, lineHeight:1 }}>{new Date(nextAppt.scheduledAt).getDate()}</div>
                  <div style={{ fontSize:10, color:C.text2 }}>{new Date(nextAppt.scheduledAt).toLocaleDateString('en-IN',{month:'short'})}</div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:3 }}>Dr. {nextAppt.doctor?.firstName} {nextAppt.doctor?.lastName}</div>
                  <div style={{ fontSize:12, color:C.text2 }}>{nextAppt.doctor?.specialization??'General Medicine'}</div>
                  <div style={{ fontSize:12, color:C.text3, marginTop:2 }}>
                    {new Date(nextAppt.scheduledAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}
                    {nextAppt.type==='TELECONSULT'?' · 📹 Video':' · 👤 In Person'}
                  </div>
                </div>
                {(nextAppt.type==='TELECONSULT'||nextAppt.type==='VIDEO') && nextAppt.meetingLink && (
                  <button onClick={()=>window.open(nextAppt.meetingLink,'_blank')} style={{ padding:'8px 14px', background:`linear-gradient(135deg,${C.teal},${C.tealLight})`, color:'#fff', border:'none', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer' }}>Join 📹</button>
                )}
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'20px 0', color:C.text3, fontSize:13 }}>
                <div style={{ fontSize:32, marginBottom:8 }}>📅</div>
                No upcoming appointments
                <div style={{ marginTop:10 }}>
                  <button onClick={()=>uiStore.setActivePage('appointments')} style={{ padding:'8px 18px', background:C.tealBg, border:`1px solid rgba(13,148,136,0.2)`, color:C.teal, borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer' }}>Book Now</button>
                </div>
              </div>
            )}
          </div>

          {/* Today's meds */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <span style={{ fontSize:13, fontWeight:700, color:C.text, textTransform:'uppercase', letterSpacing:'0.06em' }}>💊 Meds Today</span>
              <button onClick={()=>uiStore.setActivePage('medications')} style={{ fontSize:12, color:C.teal, background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>View all →</button>
            </div>
            {loading ? <div className="hp-skel" style={{ height:72 }}/> : activeMeds.length===0 ? (
              <div style={{ textAlign:'center', padding:'20px 0', color:C.text3, fontSize:13 }}>
                <div style={{ fontSize:32, marginBottom:8 }}>💊</div>No medications added yet
              </div>
            ) : (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <div style={{ flex:1, height:7, background:'#E2EEF0', borderRadius:100, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${adherencePct}%`, background:`linear-gradient(90deg,${C.teal},${C.tealLight})`, borderRadius:100, transition:'width 0.8s' }}/>
                  </div>
                  <span style={{ fontSize:12, fontWeight:700, color:C.teal, whiteSpace:'nowrap' }}>{adherencePct}% adherence</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {activeMeds.slice(0,4).map((med:any, i:number) => (
                    <div key={med.id??i} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 10px', background:'#F8FCFC', borderRadius:8, border:`1px solid ${C.border}` }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:C.teal, flexShrink:0, display:'inline-block' }}/>
                      <span style={{ flex:1, fontSize:13, color:C.text, fontWeight:500 }}>{med.name}</span>
                      <span style={{ fontSize:11, color:C.text3 }}>{med.dosage}</span>
                    </div>
                  ))}
                  {activeMedsCount > 4 && <div style={{ fontSize:11, color:C.text3, textAlign:'center', marginTop:2 }}>+{activeMedsCount-4} more</div>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:'20px 22px', marginBottom:24, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.text, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:16 }}>⚡ Quick Actions</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
            {QUICK_ACTIONS.map(a => (
              <button key={a.page} className="hp-qa" onClick={()=>uiStore.setActivePage(a.page)}>
                <span style={{ fontSize:24 }}>{a.icon}</span>
                <span style={{ fontSize:11, color:C.text2, fontWeight:600, textAlign:'center', lineHeight:1.3 }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Vitals + Recent Symptoms side by side */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

          {/* Recent vitals — uses measuredAt */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <span style={{ fontSize:13, fontWeight:700, color:C.text, textTransform:'uppercase', letterSpacing:'0.06em' }}>📊 Recent Vitals</span>
              <button onClick={()=>uiStore.setActivePage('vitals')} style={{ fontSize:12, color:C.teal, background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Log →</button>
            </div>
            {loading ? <div className="hp-skel" style={{ height:80 }}/> : recentVitals.length===0 ? (
              <div style={{ textAlign:'center', padding:'16px 0', color:C.text3, fontSize:13 }}>
                <span style={{ fontSize:28, display:'block', marginBottom:6 }}>📊</span>
                No vitals logged yet
                <div style={{ marginTop:8 }}><button onClick={()=>uiStore.setActivePage('vitals')} style={{ padding:'7px 16px', background:C.tealBg, border:`1px solid rgba(13,148,136,0.2)`, color:C.teal, borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer' }}>Log Now</button></div>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {recentVitals.slice(0,6).map((v:any,i:number) => {
                  const val = v.type==='BLOOD_PRESSURE' ? `${v.systolic}/${v.diastolic}` : (v.value??'—');
                  return (
                    <div key={v.id??i} style={{ background:'#F8FCFC', border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 12px' }}>
                      <div style={{ fontSize:10, color:C.text3, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:3 }}>{v.type?.replace(/_/g,' ')}</div>
                      <div style={{ fontSize:18, fontWeight:800, color:C.teal }}>{val}<span style={{ fontSize:10, color:C.text3, fontWeight:400, marginLeft:2 }}>{v.unit}</span></div>
                      <div style={{ fontSize:10, color:C.text3, marginTop:2 }}>{v.measuredAt ? new Date(v.measuredAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : ''}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent symptoms */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <span style={{ fontSize:13, fontWeight:700, color:C.text, textTransform:'uppercase', letterSpacing:'0.06em' }}>🤒 Recent Symptoms</span>
              <button onClick={()=>uiStore.setActivePage('symptoms')} style={{ fontSize:12, color:C.teal, background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Log →</button>
            </div>
            {loading ? <div className="hp-skel" style={{ height:80 }}/> : recentSymptoms.length===0 ? (
              <div style={{ textAlign:'center', padding:'16px 0', color:C.text3, fontSize:13 }}>
                <span style={{ fontSize:28, display:'block', marginBottom:6 }}>🤒</span>
                No symptoms this week
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {recentSymptoms.slice(0,5).map((s:any,i:number) => {
                  const sevColor = s.severity>=4?C.rose:s.severity>=3?C.amber:C.green;
                  return (
                    <div key={s.id??i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', background:'#F8FCFC', borderRadius:8, border:`1px solid ${C.border}` }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:sevColor, flexShrink:0, display:'inline-block' }}/>
                      <span style={{ flex:1, fontSize:13, color:C.text, fontWeight:500 }}>{s.name}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:sevColor }}>{s.severity}/5</span>
                      {s.resolvedAt && <span style={{ fontSize:10, color:C.green, fontWeight:600 }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
