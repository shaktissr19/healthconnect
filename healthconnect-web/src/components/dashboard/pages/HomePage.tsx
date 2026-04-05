'use client';
import { useState, useEffect, useCallback } from 'react';
import { patientAPI } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import ProfileOnboardingModal, { isOnboardingDone, isOnboardingSnoozed } from '@/components/onboarding/ProfileOnboardingModal';
import { ProfileCompletenessBanner, useProfileScore } from '@/components/onboarding/ProfileCompleteness';

const C = {
  bg:'#E8F4FD',
  card:'#FFFFFF',
  border:'#C8DFF0',
  cardHover:'#F0F7FD',
  teal:'#1A6BB5',
  tealLight:'#2E86D4',
  tealBg:'rgba(46,134,212,0.08)',
  text:'#0D1F3C',
  text2:'#2C4A6E',
  text3:'#5A7A9B',
  green:'#15803D',
  amber:'#B45309',
  rose:'#BE123C',
  violet:'#5B21B6',
  sidebar:'#1B3B6F',
};

function scoreColor(s: number) { return s >= 80 ? '#15803D' : s >= 60 ? '#B45309' : '#BE123C'; }

function KpiCard({ icon, label, value, sub, color, onClick }: any) {
  return (
    <div onClick={onClick} style={{ background:'#FDFCFB', border:'1px solid #E8E6DF', borderRadius:14, padding:'20px 22px', cursor:onClick?'pointer':'default', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', transition:'all 0.2s' }}
      onMouseEnter={e=>onClick&&((e.currentTarget as HTMLDivElement).style.boxShadow='0 6px 20px rgba(27,59,111,0.15)')}
      onMouseLeave={e=>((e.currentTarget as HTMLDivElement).style.boxShadow='0 2px 8px rgba(27,59,111,0.08)')}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <span style={{ fontSize:22 }}>{icon}</span>
        {sub && <span style={{ fontSize:11, color:'#64748B', background:'#F1F0EB', padding:'2px 8px', borderRadius:100, border:'1px solid #E8E6DF' }}>{sub}</span>}
      </div>
      <div style={{ fontSize:28, fontWeight:800, color:color??'#1A6BB5', lineHeight:1, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:12, color:'#2C4A6E', fontWeight:500 }}>{label}</div>
    </div>
  );
}

export default function HomePage() {
  const uiStore   = useUIStore() as any;
  const user      = (useAuthStore.getState() as any).user;
  const [data,        setData]        = useState<any>(null);
  const [fullProfile, setFullProfile] = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Profile completeness — uses fullProfile (from getProfile) for accurate score, same as Sidebar
  const { score: profileScore, sections: profileSections } = useProfileScore(fullProfile ?? data?.profile ?? {}, 'PATIENT');

  // Show onboarding modal on first login
  useEffect(() => {
    if (user && !isOnboardingDone() && !isOnboardingSnoozed()) {
      setShowOnboarding(true);
    }
  }, [user]);

  const firstName = user?.firstName ?? data?.profile?.firstName ?? 'there';
  const hour = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greetEmoji = hour < 12 ? '🌅' : hour < 17 ? '👋' : '🌙';
  const today = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, profRes] = await Promise.allSettled([
        patientAPI.dashboard(),
        (patientAPI as any).getProfile(),
      ]);
      if (dashRes.status === 'fulfilled') {
        const d = (dashRes.value as any)?.data?.data ?? (dashRes.value as any)?.data ?? {};
        setData(d);
      }
      if (profRes.status === 'fulfilled') {
        const p = (profRes.value as any)?.data?.data ?? (profRes.value as any)?.data ?? {};
        setFullProfile(p);
      }
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
      {/* First-login onboarding modal */}
      {showOnboarding && (
        <ProfileOnboardingModal
          role="PATIENT"
          userName={user?.firstName}
          onClose={() => setShowOnboarding(false)}
        />
      )}

      <style>{`
        .hp-skel { border-radius:12px; background:linear-gradient(90deg,#E8E6DF 25%,#EFEDE6 50%,#E8E6DF 75%); background-size:200% 100%; animation:hp-sh 1.5s infinite; }
        @keyframes hp-sh { 0%{background-position:200% 0}100%{background-position:-200% 0} }
        @keyframes hp-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .hp-qa { display:flex; flex-direction:column; align-items:center; gap:8px; padding:16px 10px; background:#FDFCFB; border:1px solid #E8E6DF; border-radius:14px; cursor:pointer; transition:all 0.2s; box-shadow:0 1px 3px rgba(0,0,0,0.05); }
        .hp-qa:hover { background:#F5F4F0; border-color:#D3D1C7; transform:translateY(-2px); box-shadow:0 4px 12px rgba(0,0,0,0.08); }
      `}</style>

      <div style={{ maxWidth:1100 }}>

        {/* Hero */}
        <div style={{ background:'#FDFCFB', borderRadius:16, padding:'24px 28px', marginBottom:20, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', border:'1px solid #E8E6DF' }}>
          <h1 style={{ color:'#1E293B', fontSize:22, fontWeight:800, margin:'0 0 5px' }}>
            {greeting}, {firstName} {greetEmoji}
          </h1>
          <p style={{ color:'#94A3B8', fontSize:12, margin:'0 0 10px' }}>{today}</p>
          {aiInsight ? (
            <p style={{ color:'#374151', fontSize:13, margin:0, maxWidth:720, lineHeight:1.6, background:'#F5F4F0', padding:'8px 14px', borderRadius:10, border:'1px solid #E8E6DF' }}>
              💡 {aiInsight}
            </p>
          ) : (
            <p style={{ color:'#64748B', fontSize:13, margin:0, maxWidth:720, lineHeight:1.6 }}>
              🩺 <strong style={{ color:'#1E293B' }}>HealthConnect</strong> unifies your health records, appointments, medications, vitals and doctor consultations — all in one secure place. Your doctors always have the right information when they need it.
            </p>
          )}
        </div>

        {/* Refill alert banner */}
        {refillCount > 0 && (
          <div onClick={() => uiStore.setActivePage('medications')} style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:12, padding:'12px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
            <span>⚠️</span>
            <span style={{ color:'#B45309', fontWeight:700, fontSize:13 }}>{refillCount} medication{refillCount>1?'s':''} need{refillCount===1?'s':''} refill</span>
            <span style={{ marginLeft:'auto', color:'#B45309', fontSize:12 }}>View →</span>
          </div>
        )}

        {/* Profile completeness banner — shows when under 80%, dismissible */}
        <ProfileCompletenessBanner
          score={profileScore}
          role="PATIENT"
          sections={profileSections}
          onGoToProfile={() => uiStore.setActivePage('profile')}
        />

        {/* KPI cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
          {loading ? [1,2,3,4].map(i=><div key={i} className="hp-skel" style={{ height:110 }}/>) : <>
            <KpiCard icon="🎯" label="Health Score"          value={healthScore??'—'} sub="Overall"    color={healthScore?scoreColor(healthScore):'#5A7A9B'} onClick={()=>uiStore.setActivePage('my-health')} />
            <KpiCard icon="💊" label="Active Medications"    value={activeMedsCount}  sub={refillCount>0?`${refillCount} refill needed`:'All stocked'} color='#1A6BB5'   onClick={()=>uiStore.setActivePage('medications')} />
            <KpiCard icon="📅" label="Upcoming Appointments" value={upcomingCount}    sub="Scheduled"  color='#5B21B6' onClick={()=>uiStore.setActivePage('appointments')} />
            <KpiCard icon="🤒" label="Symptoms This Week"    value={symptomsCount}    sub="Logged"     color={symptomsCount>3?'#BE123C':'#15803D'} onClick={()=>uiStore.setActivePage('symptoms')} />
          </>}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>

          {/* Next appointment */}
          <div style={{ background:'#FDFCFB', border:'1px solid #E8E6DF', borderRadius:14, padding:'14px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#0A1628', textTransform:'uppercase', letterSpacing:'0.06em' }}>📅 Next Appointment</span>
              <button onClick={()=>uiStore.setActivePage('appointments')} style={{ fontSize:12, color:'#64748B', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>View all →</button>
            </div>
            {loading ? <div className="hp-skel" style={{ height:56 }}/> : nextAppt ? (
              <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                <div style={{ width:52, textAlign:'center', background:'rgba(46,134,212,0.08)', borderRadius:12, padding:'10px 8px', border:`1px solid rgba(13,148,136,0.15)`, flexShrink:0 }}>
                  <div style={{ fontSize:20, fontWeight:900, color:'#1A6BB5', lineHeight:1 }}>{new Date(nextAppt.scheduledAt).getDate()}</div>
                  <div style={{ fontSize:10, color:'#2C4A6E' }}>{new Date(nextAppt.scheduledAt).toLocaleDateString('en-IN',{month:'short'})}</div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#0D1F3C', marginBottom:3 }}>Dr. {nextAppt.doctor?.firstName} {nextAppt.doctor?.lastName}</div>
                  <div style={{ fontSize:12, color:'#2C4A6E' }}>{nextAppt.doctor?.specialization??'General Medicine'}</div>
                  <div style={{ fontSize:12, color:'#5A7A9B', marginTop:2 }}>
                    {new Date(nextAppt.scheduledAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}
                    {nextAppt.type==='TELECONSULT'?' · 📹 Video':' · 👤 In Person'}
                  </div>
                </div>
                {(nextAppt.type==='TELECONSULT'||nextAppt.type==='VIDEO') && nextAppt.meetingLink && (
                  <button onClick={()=>window.open(nextAppt.meetingLink,'_blank')} style={{ padding:'8px 14px', background:`linear-gradient(135deg,1A6BB5,2E86D4)`, color:'#fff', border:'none', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer' }}>Join 📹</button>
                )}
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'20px 0', color:'#5A7A9B', fontSize:13 }}>
                <div style={{ fontSize:32, marginBottom:8 }}>📅</div>
                No upcoming appointments
                <div style={{ marginTop:10 }}>
                  <button onClick={()=>uiStore.setActivePage('appointments')} style={{ padding:'8px 18px', background:'rgba(46,134,212,0.08)', border:`1px solid rgba(13,148,136,0.2)`, color:'#1A6BB5', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer' }}>Book Now</button>
                </div>
              </div>
            )}
          </div>

          {/* Today's medication schedule */}
          <div style={{ background:'#FDFCFB', border:'1px solid #E8E6DF', borderRadius:14, padding:'14px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#0A1628', textTransform:'uppercase', letterSpacing:'0.06em' }}>💊 Today's Schedule</span>
              <button onClick={()=>uiStore.setActivePage('medications')} style={{ fontSize:12, color:'#64748B', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>View all →</button>
            </div>
            {loading ? <div className="hp-skel" style={{ height:56 }}/> : activeMeds.length===0 ? (
              <div style={{ textAlign:'center', padding:'20px 0', color:'#5A7A9B', fontSize:13 }}>
                <div style={{ fontSize:32, marginBottom:8 }}>💊</div>No medications added yet
              </div>
            ) : (
              <div>
                {/* Adherence bar */}
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                  <div style={{ flex:1, height:6, background:'#E2EEF0', borderRadius:100, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${adherencePct}%`, background:`linear-gradient(90deg,1A6BB5,2E86D4)`, borderRadius:100, transition:'width 0.8s' }}/>
                  </div>
                  <span style={{ fontSize:12, fontWeight:700, color:'#1A6BB5', whiteSpace:'nowrap' }}>{adherencePct}% adherence</span>
                </div>
                {/* Time-based schedule */}
                <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                  {activeMeds.slice(0,5).map((med:any, i:number) => {
                    const now = new Date();
                    const curMin = now.getHours()*60 + now.getMinutes();
                    // Derive schedule slots from frequency
                    const freq = med.frequency ?? '';
                    const slots: string[] = med.timesOfDay ?? med.times ?? (
                      freq==='TWICE_DAILY'      ? ['08:00','20:00'] :
                      freq==='THREE_TIMES_DAILY' ? ['08:00','14:00','20:00'] :
                      freq==='ONCE_DAILY'        ? ['08:00'] : ['08:00']
                    );
                    const takenToday = Array.isArray(med.logs) && med.logs.some((l:any) => {
                      const d = new Date(l.takenAt ?? l.createdAt);
                      return d.toDateString()===now.toDateString() && l.status==='TAKEN';
                    });
                    const nextSlot = slots.find(t => { const [h,m]=t.split(':').map(Number); return h*60+m>curMin; });
                    const isDue = !takenToday && slots.some(t => { const [h,m]=t.split(':').map(Number); const slotMin=h*60+m; return slotMin<=curMin && curMin-slotMin<60; });
                    return (
                      <div key={med.id??i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background: isDue?'rgba(13,148,136,0.06)':takenToday?'rgba(34,197,94,0.05)':'#F8FCFC', borderRadius:10, border:`1px solid ${isDue?'rgba(13,148,136,0.2)':takenToday?'rgba(34,197,94,0.2)':C.border}`, transition:'all 0.2s' }}>
                        <span style={{ fontSize:16, flexShrink:0 }}>{takenToday?'✅':isDue?'⏰':'💊'}</span>
                        <div style={{ flex:1 }}>
                          <span style={{ fontSize:13, color:'#0D1F3C', fontWeight:600 }}>{med.name}</span>
                          <span style={{ fontSize:11, color:'#5A7A9B', marginLeft:8 }}>{med.dosage}</span>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          {takenToday
                            ? <span style={{ fontSize:11, color:'#16A34A', fontWeight:700 }}>Taken ✓</span>
                            : isDue
                            ? <span style={{ fontSize:11, color:'#1A6BB5', fontWeight:700, animation:'hp-pulse 1.5s ease infinite' }}>Due now</span>
                            : nextSlot
                            ? <span style={{ fontSize:11, color:'#5A7A9B' }}>Next: {nextSlot}</span>
                            : <span style={{ fontSize:11, color:'#5A7A9B' }}>—</span>
                          }
                        </div>
                      </div>
                    );
                  })}
                  {activeMedsCount > 5 && <div style={{ fontSize:11, color:'#5A7A9B', textAlign:'center', marginTop:2 }}>+{activeMedsCount-5} more medications</div>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ background:'#FDFCFB', border:'1px solid #E8E6DF', borderRadius:14, padding:'20px 22px', marginBottom:24, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#0A1628', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>⚡ Quick Actions</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
            {QUICK_ACTIONS.map(a => (
              <button key={a.page} className="hp-qa" onClick={()=>uiStore.setActivePage(a.page)}>
                <span style={{ fontSize:24 }}>{a.icon}</span>
                <span style={{ fontSize:11, color:'#2C4A6E', fontWeight:600, textAlign:'center', lineHeight:1.3 }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Vitals + Recent Symptoms side by side */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

          {/* Recent vitals — uses measuredAt */}
          <div style={{ background:'#FDFCFB', border:'1px solid #E8E6DF', borderRadius:14, padding:'14px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#0A1628', textTransform:'uppercase', letterSpacing:'0.06em' }}>📊 Recent Vitals</span>
              <button onClick={()=>uiStore.setActivePage('vitals')} style={{ fontSize:12, color:'#64748B', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Log →</button>
            </div>
            {loading ? <div className="hp-skel" style={{ height:60 }}/> : recentVitals.length===0 ? (
              <div style={{ textAlign:'center', padding:'16px 0', color:'#5A7A9B', fontSize:13 }}>
                <span style={{ fontSize:28, display:'block', marginBottom:6 }}>📊</span>
                No vitals logged yet
                <div style={{ marginTop:8 }}><button onClick={()=>uiStore.setActivePage('vitals')} style={{ padding:'7px 16px', background:'rgba(46,134,212,0.08)', border:`1px solid rgba(13,148,136,0.2)`, color:'#1A6BB5', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer' }}>Log Now</button></div>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {recentVitals.slice(0,6).map((v:any,i:number) => {
                  const val = v.type==='BLOOD_PRESSURE' ? `${v.systolic}/${v.diastolic}` : (v.value??'—');
                  return (
                    <div key={v.id??i} style={{ background:'#F5F4F0', border:'1px solid #E8E6DF', borderRadius:10, padding:'10px 12px' }}>
                      <div style={{ fontSize:10, color:'#5A7A9B', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:3 }}>{v.type?.replace(/_/g,' ')}</div>
                      <div style={{ fontSize:18, fontWeight:800, color:'#1A6BB5' }}>{val}<span style={{ fontSize:10, color:'#5A7A9B', fontWeight:400, marginLeft:2 }}>{v.unit}</span></div>
                      <div style={{ fontSize:10, color:'#5A7A9B', marginTop:2 }}>{v.measuredAt ? new Date(v.measuredAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : ''}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent symptoms */}
          <div style={{ background:'#FDFCFB', border:'1px solid #E8E6DF', borderRadius:14, padding:'14px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#0A1628', textTransform:'uppercase', letterSpacing:'0.06em' }}>🤒 Recent Symptoms</span>
              <button onClick={()=>uiStore.setActivePage('symptoms')} style={{ fontSize:12, color:'#64748B', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Log →</button>
            </div>
            {loading ? <div className="hp-skel" style={{ height:60 }}/> : recentSymptoms.length===0 ? (
              <div style={{ textAlign:'center', padding:'16px 0', color:'#5A7A9B', fontSize:13 }}>
                <span style={{ fontSize:28, display:'block', marginBottom:6 }}>🤒</span>
                No symptoms this week
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {recentSymptoms.slice(0,5).map((s:any,i:number) => {
                  const sevColor = s.severity>=4?C.rose:s.severity>=3?C.amber:C.green;
                  return (
                    <div key={s.id??i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', background:'#F5F4F0', borderRadius:8, border:'1px solid #E8E6DF' }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:sevColor, flexShrink:0, display:'inline-block' }}/>
                      <span style={{ flex:1, fontSize:13, color:'#0D1F3C', fontWeight:500 }}>{s.name}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:sevColor }}>{s.severity}/5</span>
                      {s.resolvedAt && <span style={{ fontSize:10, color:'#15803D', fontWeight:600 }}>✓</span>}
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
