'use client';
import { useUIStore } from '@/store/uiStore';

// ── HEALTH SCORE WEIGHTS (must sum to 100) ────────────────────────────────────
// Clinically meaningful weighting — vitals dominate, lifestyle is a bonus signal
const SCORE_PARAMS = [
  { key:'vitalsScore',           label:'Vitals',               icon:'💓', weight:25, color:'linear-gradient(90deg,#EF4444,#F97316)', desc:'BP, blood sugar, heart rate, SpO2 in normal range' },
  { key:'medicationAdherence',   label:'Medication Adherence', icon:'💊', weight:22, color:'linear-gradient(90deg,#0D9488,#14B8A6)', desc:'Doses taken on time in last 30 days' },
  { key:'symptomBurden',         label:'Symptom Burden',       icon:'🩺', weight:18, color:'linear-gradient(90deg,#B45309,#F59E0B)', desc:'Inverse of symptom frequency × severity' },
  { key:'appointmentRegularity', label:'Appointments',         icon:'📅', weight:15, color:'linear-gradient(90deg,#7C3AED,#8B5CF6)', desc:'Scheduled appointments attended' },
  { key:'conditionControl',      label:'Condition Control',    icon:'📋', weight:10, color:'linear-gradient(90deg,#0F766E,#0D9488)', desc:'Active vs managed vs resolved conditions' },
  { key:'lifestyleFactors',      label:'Lifestyle',            icon:'🌱', weight:7,  color:'linear-gradient(90deg,#16A34A,#22C55E)', desc:'Sleep, exercise & diet tracking' },
  { key:'engagementScore',       label:'Self-monitoring',      icon:'📊', weight:3,  color:'linear-gradient(90deg,#1D4ED8,#3B82F6)', desc:'Frequency of logging vitals & symptoms' },
];

// ── MOCK FALLBACK DATA ────────────────────────────────────────────────────────
const MOCK = {
  healthScore: 72,
  healthScoreTrend: 'stable',
  weekDelta: 0,
  conditions: [] as string[],
  conditionCount: 0,
  medicationAdherence: 0,
  adherenceTrend: '',
  upcomingAppointments: 0,
  nextAppointment: { doctor: '—', spec: '—', date: '—', month: '—', time: '—', type: '—' },
  activeMedications: 0,
  medAlert: 'No active alerts',
  scoreBreakdown: SCORE_PARAMS.map(p => ({ ...p, value: 0 })),
  aiInsight: 'Your health data is being analysed. Check back soon for personalised insights.',
  activeSymptoms: [] as any[],
  riskAlert: null as string | null,
  communitiesJoined: 0,
  scoreHistory: [] as { score: number; date: string }[],
};

// ── Merge API response shape → display shape ─────────────────────────────────
// Dashboard response: { profile, healthScore:{score,medicationAdherence,...,trend},
//   kpis:{upcomingAppointmentsCount,activeMedicationsCount,activeConditionsCount,
//         medicationAdherencePct,refillAlertsCount,recentSymptomsCount,communitiesJoined,totalReports},
//   upcomingAppointments:[{id,scheduledAt,type,status,doctor:{firstName,lastName,specialization}}],
//   recentSymptoms:[{id,name,severity,loggedAt}] (optional)
// }
function merge(apiData: any) {
  if (!apiData) return MOCK;

  const hs   = apiData.healthScore   ?? {};
  const kpis = apiData.kpis          ?? {};
  const next = apiData.upcomingAppointments?.[0] ?? null;
  const recentSymptoms = apiData.recentSymptoms ?? [];

  const scoreNum = typeof hs === 'number' ? hs : (hs.score ?? MOCK.healthScore);

  // 7-parameter breakdown — map API fields + compute weighted display
  const scoreBreakdown = SCORE_PARAMS.map(p => ({
    ...p,
    value: hs[p.key] ?? (
      // Fallback mappings for older API shapes
      p.key === 'symptomBurden'  ? (hs.symptomFrequency  ?? 0) :
      p.key === 'vitalsScore'    ? (hs.vitals             ?? 0) :
      p.key === 'conditionControl'? (hs.conditionControl  ?? 0) :
      p.key === 'engagementScore' ? (hs.engagement        ?? 0) : 0
    ),
  }));

  // Week-over-week delta from score history
  const history: { score: number; date: string }[] = hs.history ?? apiData.scoreHistory ?? [];
  let weekDelta = 0;
  if (history.length >= 2) {
    const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    weekDelta = (sorted[0]?.score ?? scoreNum) - (sorted[1]?.score ?? scoreNum);
  }

  // Next appointment
  let nextAppt = MOCK.nextAppointment;
  if (next) {
    const dt   = new Date(next.scheduledAt);
    const docF = next.doctor?.firstName ?? '';
    const docL = next.doctor?.lastName  ?? '';
    const spec = next.doctor?.specialization ?? '';
    nextAppt = {
      doctor: `Dr. ${docF} ${docL}`.trim(),
      spec,
      date:   String(dt.getDate()),
      month:  dt.toLocaleDateString('en-IN', { month: 'short' }),
      time:   dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      type:   next.type === 'TELECONSULT' ? 'Teleconsult' : next.type === 'HOME_VISIT' ? 'Home Visit' : 'In-person',
    };
  }

  const refillCount  = kpis.refillAlertsCount     ?? 0;
  const activeCount  = kpis.activeMedicationsCount ?? 0;
  let medAlert = MOCK.medAlert;
  if (refillCount > 0) medAlert = `${refillCount} refill${refillCount > 1 ? 's' : ''} needed`;
  else if (activeCount > 0) medAlert = `${activeCount} active prescription${activeCount > 1 ? 's' : ''}`;

  const activeSymptoms = recentSymptoms.slice(0, 3).map((s: any) => ({
    name:     s.name,
    severity: s.severity ?? 5,
    level:    s.severity >= 7 ? 'severe' : s.severity >= 4 ? 'moderate' : 'mild',
    since:    s.loggedAt
      ? new Date(s.loggedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : 'Recently',
  }));

  const adherencePct = kpis.medicationAdherencePct ?? hs.medicationAdherence ?? 0;
  const adherenceTrend = adherencePct >= 85 ? 'Good adherence' : adherencePct >= 70 ? 'Fair adherence' : 'Needs improvement';
  const conditionCount = kpis.activeConditionsCount ?? 0;
  const conditionLabel = conditionCount === 0 ? 'No active conditions'
    : conditionCount === 1 ? '1 active condition'
    : `${conditionCount} active conditions`;

  return {
    healthScore:          scoreNum,
    healthScoreTrend:     hs.trend ?? 'stable',
    weekDelta,
    conditions:           [conditionLabel],
    conditionCount,
    medicationAdherence:  adherencePct,
    adherenceTrend,
    upcomingAppointments: kpis.upcomingAppointmentsCount ?? 0,
    nextAppointment:      nextAppt,
    activeMedications:    activeCount,
    medAlert,
    scoreBreakdown,
    aiInsight:            apiData.aiInsight ?? MOCK.aiInsight,
    activeSymptoms,
    riskAlert:            apiData.riskAlert ?? null,
    communitiesJoined:    kpis.communitiesJoined ?? 0,
    scoreHistory:         history.slice(-8),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function OverviewTab({ data, loading }: { data: any; loading: boolean }) {
  const { setActiveTab, setActivePage } = useUIStore();
  const d = merge(data);

  // SVG ring: r=38, circumference=2π×38≈238.76
  const circ   = 238.76;
  const scoreNum = typeof d.healthScore === 'number' ? d.healthScore : 0;
  const offset = circ * (1 - scoreNum / 100);

  const scoreLabel = scoreNum >= 80 ? 'Good' : scoreNum >= 60 ? 'Fair' : 'Needs Attention';
  const scoreGradient = scoreNum >= 80 ? '#22C55E' : scoreNum >= 60 ? '#14B8A6' : '#F59E0B';

  return (
    <>
      <style>{`
        .ov-grid2  { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .ov-grid4  { display: grid; grid-template-columns: repeat(5,1fr); gap: 14px; margin-bottom: 20px; }
        @media(max-width:1200px) { .ov-grid4 { grid-template-columns: repeat(3,1fr); } }
        @media(max-width:800px)  { .ov-grid4 { grid-template-columns: 1fr 1fr; } }
        @media(max-width:720px)  { .ov-grid4, .ov-grid2 { grid-template-columns: 1fr; } }
        .ov-hs { background:#FFFFFF; border:1px solid #E2EEF0; border-radius:14px; padding:24px; display:flex; align-items:center; gap:24px; margin-bottom:20px; box-shadow:0 2px 12px rgba(0,0,0,0.06); }
        .ov-hs-ring { position:relative; flex-shrink:0; }
        .ov-hs-ring svg { transform:rotate(-90deg); }
        .ov-hs-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
        .ov-hs-num   { font-family:'Syne',sans-serif; font-size:26px; font-weight:800; line-height:1; }
        .ov-hs-label { font-size:9px; color:#64748B; text-transform:uppercase; }
        .ov-hs-title { font-family:'Syne',sans-serif; font-weight:800; font-size:17px; color:#0F2D2A; margin-bottom:4px; }
        .ov-hs-sub   { font-size:12px; color:#64748B; margin-bottom:16px; }
        .ov-bar-row  { display:flex; flex-direction:column; gap:10px; flex:1; }
        .ov-bar-item { display:flex; align-items:center; gap:10px; }
        .ov-bar-lbl  { font-size:12px; color:#4B6E6A; width:190px; flex-shrink:0; font-weight:500; display:flex; align-items:center; gap:0; }
        .ov-bar-track { flex:1; height:7px; background:#E2EEF0; border-radius:3px; overflow:hidden; }
        .ov-bar-fill  { height:100%; border-radius:3px; transition:width 1s ease; }
        .ov-bar-score { font-size:12px; color:#0F2D2A; width:28px; text-align:right; font-weight:700; }
        .ov-insight { background:#F5F3FF; border:1px solid #DDD6FE; border-radius:12px; padding:14px 16px; display:flex; align-items:flex-start; gap:12px; margin-bottom:20px; }
        .ov-insight-icon { font-size:18px; flex-shrink:0; margin-top:1px; }
        .ov-insight-text { font-size:13px; color:#4B5563; line-height:1.6; }
        .ov-insight-text strong { color:#7C3AED; }
        .ov-qa { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px; }
        .ov-qa-btn { padding:9px 16px; border-radius:9px; border:1.5px solid #E2EEF0; background:#FFFFFF; color:#4B6E6A; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:6px; font-family:'Plus Jakarta Sans',sans-serif; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
        .ov-qa-btn:hover { border-color:#0D9488; color:#0D9488; background:#F0FDF9; }
        .ov-qa-btn.primary { background:linear-gradient(135deg,#0D9488,#14B8A6); border-color:transparent; color:#fff; box-shadow:0 2px 10px rgba(13,148,136,0.3); }
        .ov-qa-btn.primary:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(20,184,166,0.4); }
        .ov-kpi { background:#FFFFFF; border:1px solid #E2EEF0; border-radius:14px; padding:18px; position:relative; overflow:hidden; transition:box-shadow 0.2s; box-shadow:0 1px 6px rgba(0,0,0,0.05); }
        .ov-kpi:hover { box-shadow:0 4px 16px rgba(0,0,0,0.1); }
        .ov-kpi::after { content:''; position:absolute; bottom:0; left:0; right:0; height:3px; }
        .ov-kpi.teal::after  { background:linear-gradient(90deg,#0D9488,#14B8A6); }
        .ov-kpi.green::after { background:#22C55E; }
        .ov-kpi.amber::after { background:#F59E0B; }
        .ov-kpi.rose::after  { background:#F43F5E; }
        .ov-kpi-lbl  { font-size:11px; color:#64748B; text-transform:uppercase; letter-spacing:.07em; margin-bottom:8px; font-weight:600; }
        .ov-kpi-val  { font-family:'Syne',sans-serif; font-size:32px; font-weight:800; color:#0F2D2A; line-height:1; margin-bottom:5px; }
        .ov-kpi-val.teal  { color:#0D9488; }
        .ov-kpi-val.green { color:#16A34A; }
        .ov-kpi-val.amber { color:#D97706; }
        .ov-kpi-trend { font-size:12px; color:#64748B; font-weight:500; }
        .ov-kpi-trend.up   { color:#16A34A; font-weight:600; }
        .ov-kpi-trend.down { color:#DC2626; font-weight:600; }
        .ov-card { background:#FFFFFF; border:1px solid #E2EEF0; border-radius:14px; padding:20px; transition:box-shadow 0.2s; box-shadow:0 1px 6px rgba(0,0,0,0.05); }
        .ov-card:hover { box-shadow:0 4px 16px rgba(0,0,0,0.1); }
        .ov-card-hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
        .ov-card-title { font-family:'Syne',sans-serif; font-size:15px; font-weight:700; color:#0F2D2A; }
        .ov-appt { display:flex; gap:16px; align-items:flex-start; }
        .ov-appt-date { background:#F0FDF9; border:1.5px solid #99F6E4; border-radius:10px; padding:10px 14px; text-align:center; flex-shrink:0; min-width:58px; }
        .ov-appt-day   { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; color:#0D9488; line-height:1; }
        .ov-appt-month { font-size:9px; color:#64748B; text-transform:uppercase; font-weight:600; }
        .ov-appt-doctor { font-family:'Syne',sans-serif; font-weight:700; font-size:14px; color:#0F2D2A; margin-bottom:2px; }
        .ov-appt-spec   { font-size:12px; color:#0D9488; margin-bottom:6px; font-weight:600; }
        .ov-appt-meta   { font-size:12px; color:#64748B; }
        .ov-appt-btns   { display:flex; gap:8px; margin-top:14px; }
        .ov-tbl { width:100%; border-collapse:collapse; }
        .ov-tbl th { font-size:11px; color:#64748B; text-transform:uppercase; letter-spacing:.07em; padding:8px 10px; border-bottom:2px solid #E2EEF0; text-align:left; font-weight:700; }
        .ov-tbl td { padding:10px 10px; font-size:13px; color:#4B6E6A; border-bottom:1px solid #F1F5F9; }
        .ov-tbl tr:last-child td { border-bottom:none; }
        .ov-tbl tr:hover td { background:#F8FFFE; color:#0F2D2A; }
        .ov-pill { display:inline-flex; padding:3px 10px; border-radius:100px; font-size:11px; font-weight:700; border:1px solid; }
        .ov-pill.upcoming  { background:rgba(13,148,136,0.1); color:#0D9488; border-color:rgba(13,148,136,0.3); }
        .ov-pill.mild      { background:rgba(22,163,74,0.1);  color:#16A34A; border-color:rgba(22,163,74,0.3); }
        .ov-pill.moderate  { background:rgba(217,119,6,0.1); color:#D97706; border-color:rgba(217,119,6,0.3); }
        .ov-pill.severe    { background:rgba(220,38,38,0.1);  color:#DC2626; border-color:rgba(220,38,38,0.3); }
        .ov-risk { background:#FFF5F5; border:1px solid #FECACA; border-radius:12px; padding:14px 16px; display:flex; align-items:flex-start; gap:12px; margin-top:20px; }
        .ov-risk-text { font-size:13px; color:#374151; line-height:1.6; }
        .ov-risk-text strong { color:#DC2626; }
        .ov-btn { padding:7px 14px; border-radius:9px; border:1.5px solid #E2EEF0; background:#FFFFFF; color:#4B6E6A; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:'Plus Jakarta Sans',sans-serif; }
        .ov-btn:hover { border-color:#0D9488; color:#0D9488; }
        .ov-btn.teal { background:linear-gradient(135deg,#0D9488,#14B8A6); border-color:transparent; color:#fff; }
        .ov-btn.teal:hover { box-shadow:0 4px 14px rgba(20,184,166,0.35); }
        .ov-loading { display:flex; flex-direction:column; gap:16px; }
        .ov-skel { border-radius:14px; height:160px; background:#F0FDF9; animation:ov-shimmer 1.5s infinite; }
        @keyframes ov-shimmer { 0%,100%{opacity:0.6} 50%{opacity:1} }
      `}</style>

      {loading && (
        <div className="ov-loading">
          <div className="ov-skel" style={{ height: 140 }} />
          <div className="ov-skel" style={{ height: 80 }} />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {[1,2,3,4].map(i => <div key={i} className="ov-skel" style={{ height:100 }} />)}
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Health Score Widget */}
          <div className="ov-hs">
            <div className="ov-hs-ring">
              <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="38" fill="none" stroke="#E2EEF0" strokeWidth="8" />
                <circle cx="45" cy="45" r="38" fill="none" stroke={scoreGradient} strokeWidth="8"
                  strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
              </svg>
              <div className="ov-hs-center">
                <div className="ov-hs-num" style={{ color: scoreGradient }}>{scoreNum}</div>
                <div className="ov-hs-label">/100</div>
              </div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:2 }}>
                <div className="ov-hs-title">Health Score — {scoreLabel}</div>
                {/* Week-over-week delta badge */}
                {d.weekDelta !== 0 && (
                  <span style={{
                    fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:100,
                    background: d.weekDelta > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(220,38,38,0.1)',
                    color:      d.weekDelta > 0 ? '#16A34A' : '#DC2626',
                    border:     `1px solid ${d.weekDelta > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(220,38,38,0.25)'}`,
                  }}>
                    {d.weekDelta > 0 ? `↑ +${d.weekDelta}` : `↓ ${d.weekDelta}`} this week
                  </span>
                )}
              </div>
              <div className="ov-hs-sub">Weighted across 7 health parameters</div>

              {/* Sparkline — last 8 weeks */}
              {d.scoreHistory.length > 1 && (
                <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:28, marginBottom:12 }}>
                  {d.scoreHistory.map((h: any, i: number) => {
                    const val = h.score ?? 0;
                    const isLast = i === d.scoreHistory.length - 1;
                    return (
                      <div key={i} title={`${val} — ${h.date ? new Date(h.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : ''}`}
                        style={{ flex:1, height:`${(val/100)*26}px`, minHeight:3, borderRadius:'2px 2px 0 0',
                          background: isLast ? scoreGradient : 'rgba(20,184,166,0.35)',
                          transition:'height 0.6s ease' }} />
                    );
                  })}
                </div>
              )}

              {/* 7-parameter bars */}
              <div className="ov-bar-row">
                {d.scoreBreakdown.map((b: any) => (
                  <div className="ov-bar-item" key={b.label}>
                    <div className="ov-bar-lbl">
                      <span style={{ marginRight:5 }}>{b.icon}</span>{b.label}
                      <span style={{ marginLeft:'auto', fontSize:10, color:'#94A3B8', fontWeight:400 }}>{b.weight}%</span>
                    </div>
                    <div className="ov-bar-track">
                      <div className="ov-bar-fill" style={{ width:`${b.value}%`, background:b.color }} />
                    </div>
                    <div className="ov-bar-score">{b.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Insight */}
          <div className="ov-insight">
            <div className="ov-insight-icon">🤖</div>
            <div className="ov-insight-text">
              <strong>AI Weekly Insight:</strong> {d.aiInsight}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="ov-qa">
            <button className="ov-qa-btn primary" onClick={() => setActiveTab('symptoms')}>➕ Log Symptom</button>
            <button className="ov-qa-btn" onClick={() => setActivePage('medications')}>💊 Add Medication</button>
            <button className="ov-qa-btn" onClick={() => setActiveTab('vault')}>📤 Upload Report</button>
            <button className="ov-qa-btn" onClick={() => setActivePage('appointments')}>📅 Book Appointment</button>
            <button className="ov-qa-btn" onClick={() => setActivePage('communities')}>🏘️ My Communities</button>
            <button className="ov-qa-btn" onClick={() => setActiveTab('insights')}>📊 View Insights</button>
          </div>

          {/* KPI Row */}
          <div className="ov-grid4">
            <div className="ov-kpi teal">
              <div className="ov-kpi-lbl">Active Conditions</div>
              <div className="ov-kpi-val teal">{d.conditionCount}</div>
              <div className="ov-kpi-trend">{d.conditions[0]}</div>
            </div>
            <div className="ov-kpi green">
              <div className="ov-kpi-lbl">Medication Adherence</div>
              <div className="ov-kpi-val green">{d.medicationAdherence}%</div>
              <div className={`ov-kpi-trend ${d.medicationAdherence >= 80 ? 'up' : ''}`}>{d.adherenceTrend}</div>
            </div>
            <div className="ov-kpi amber">
              <div className="ov-kpi-lbl">Upcoming Appointments</div>
              <div className="ov-kpi-val amber">{d.upcomingAppointments}</div>
              <div className="ov-kpi-trend">
                {d.upcomingAppointments > 0
                  ? `Next: ${d.nextAppointment.month} ${d.nextAppointment.date}`
                  : 'No upcoming'}
              </div>
            </div>
            <div className="ov-kpi rose">
              <div className="ov-kpi-lbl">Active Medications</div>
              <div className="ov-kpi-val">{d.activeMedications}</div>
              <div className="ov-kpi-trend down">{d.medAlert}</div>
            </div>
            {/* ── Communities KPI — navigates to Communities tab ── */}
            <div
              className="ov-kpi"
              onClick={() => setActivePage('communities')}
              style={{ cursor: 'pointer', borderColor: d.communitiesJoined > 0 ? 'rgba(77,182,160,0.3)' : undefined }}
              title="Go to My Communities"
            >
              <style>{`.ov-kpi.community::after { background: linear-gradient(90deg,#4db6a0,#0D9488); }`}</style>
              <div className="ov-kpi-lbl" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>🏘️</span> Communities
              </div>
              <div className="ov-kpi-val" style={{ color: '#0D9488' }}>{d.communitiesJoined}</div>
              <div className="ov-kpi-trend" style={{ color: d.communitiesJoined > 0 ? '#0D9488' : undefined }}>
                {d.communitiesJoined > 0
                  ? `${d.communitiesJoined} joined · View →`
                  : 'Join a community'}
              </div>
            </div>
          </div>

          {/* Next Appt + Active Symptoms */}
          <div className="ov-grid2" style={{ marginBottom:0 }}>
            <div className="ov-card">
              <div className="ov-card-hd">
                <div className="ov-card-title">Next Appointment</div>
                {d.upcomingAppointments > 0
                  ? <span className="ov-pill upcoming">Upcoming</span>
                  : <span className="ov-pill" style={{ color:'#64748B', borderColor:'#E2EEF0' }}>None</span>
                }
              </div>
              {d.upcomingAppointments === 0 ? (
                <div style={{ textAlign:'center', padding:'20px 0', color:'#64748B' }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>📅</div>
                  <div style={{ fontSize:13, color:'#94A3B8', marginBottom:12 }}>No upcoming appointments</div>
                  <button className="ov-btn teal" onClick={() => setActivePage('appointments')}>Book Appointment</button>
                </div>
              ) : (
                <>
                  <div className="ov-appt">
                    <div className="ov-appt-date">
                      <div className="ov-appt-day">{d.nextAppointment.date}</div>
                      <div className="ov-appt-month">{d.nextAppointment.month}</div>
                    </div>
                    <div>
                      <div className="ov-appt-doctor">{d.nextAppointment.doctor}</div>
                      <div className="ov-appt-spec">{d.nextAppointment.spec}</div>
                      <div className="ov-appt-meta">{d.nextAppointment.time} · {d.nextAppointment.type}</div>
                    </div>
                  </div>
                  <div className="ov-appt-btns">
                    <button className="ov-btn" style={{ flex:1 }} onClick={() => setActivePage('appointments')}>Reschedule</button>
                    <button className="ov-btn teal" style={{ flex:1 }} onClick={() => setActivePage('appointments')}>
                      {d.nextAppointment.type === 'Teleconsult' ? '💻 Join Call' : '🗺 Directions'}
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="ov-card">
              <div className="ov-card-hd">
                <div className="ov-card-title">Recent Symptoms</div>
                <button className="ov-btn teal" onClick={() => setActiveTab('symptoms')}>+ Log</button>
              </div>
              {d.activeSymptoms.length === 0 ? (
                <div style={{ textAlign:'center', padding:'20px 0', color:'#64748B' }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>🎉</div>
                  <div style={{ fontSize:13 }}>No recent symptoms logged</div>
                </div>
              ) : (
                <table className="ov-tbl">
                  <thead>
                    <tr><th>Symptom</th><th>Severity</th><th>When</th></tr>
                  </thead>
                  <tbody>
                    {d.activeSymptoms.map((s: any) => (
                      <tr key={s.name}>
                        <td>{s.name}</td>
                        <td><span className={`ov-pill ${s.level}`}>{s.severity}/10</span></td>
                        <td>{s.since}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Risk Alert — only show if API provides it */}
          {d.riskAlert && (
            <div className="ov-risk">
              <div style={{ fontSize:18, flexShrink:0 }}>⚠️</div>
              <div className="ov-risk-text">
                <strong>AI Risk Alert:</strong> {d.riskAlert}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
