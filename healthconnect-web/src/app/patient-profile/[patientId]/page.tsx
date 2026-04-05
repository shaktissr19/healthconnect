'use client';
// src/app/patient-profile/[patientId]/page.tsx
// Read-only patient profile — navigated to via window.location.href from doctor dashboard (same tab)
// Lives OUTSIDE /doctor-dashboard/ so doctor-dashboard/layout.tsx does NOT wrap it
// Theme: Blue/Indigo (distinct from doctor dashboard teal/green)

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

// ── Blue/Indigo theme — visually distinct from doctor dashboard ───────────────
const C = {
  bg:      '#F0F4FF',
  cardBg:  '#FAFBFF',
  border:  'rgba(79,70,229,0.12)',
  accent:  '#4F46E5',
  accentDk:'#3730A3',
  accentLt:'rgba(79,70,229,0.08)',
  green:   '#16A34A',
  amber:   '#D97706',
  rose:    '#E11D48',
  red:     '#DC2626',
  purple:  '#7C3AED',
  blue:    '#1D4ED8',
  txtHi:   '#0F172A',
  txtMid:  '#475569',
  txtLo:   '#94A3B8',
  r:       '14px',
  rSm:     '10px',
};

// 1st-degree relatives — 50% genetic overlap
const FIRST_DEGREE = new Set(['Father','Mother','Brother','Sister','Son','Daughter']);

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: C.r, boxShadow: '0 2px 12px rgba(79,70,229,0.07)', ...style }}>
      {children}
    </div>
  );
}

function SectionLabel({ text, count }: { text: string; count?: number }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:700, color:C.txtLo, textTransform:'uppercase' as const, letterSpacing:'0.07em' }}>{text}</div>
      {count != null && count > 0 && (
        <span style={{ fontSize:10, fontWeight:700, background:C.accentLt, color:C.accent, padding:'1px 7px', borderRadius:100, border:`1px solid ${C.border}` }}>{count}</span>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:`1px solid ${C.border}` }}>
      <span style={{ fontSize:12, color:C.txtLo }}>{label}</span>
      <span style={{ fontSize:12, fontWeight:600, color:C.txtMid }}>{value}</span>
    </div>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ padding:'2px 9px', borderRadius:100, fontSize:10, fontWeight:700, background:`${color}18`, color, border:`1px solid ${color}30`, textTransform:'uppercase' as const, letterSpacing:'0.05em', whiteSpace:'nowrap' as const }}>
      {label}
    </span>
  );
}

function statusColor(s: string) {
  return ({ ACTIVE:C.green, CHRONIC:C.amber, RESOLVED:C.txtLo, COMPLETED:C.txtLo, IN_REMISSION:C.accent }[s] ?? C.txtMid);
}

function bloodGroupLabel(bg: string) {
  return bg?.replace('_POSITIVE','+').replace('_NEGATIVE','-').replace('UNKNOWN','—') ?? '—';
}

function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

function isOverdue(d?: string) { return !!d && new Date(d) < new Date(); }

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function Skel({ w, h }: { w: string | number; h: number }) {
  return <div style={{ width:w, height:h, borderRadius:8, background:'rgba(15,23,42,0.05)', marginBottom:8 }} />;
}

// ── Divider row ───────────────────────────────────────────────────────────────
function Divider() {
  return <div style={{ borderBottom:`1px solid ${C.border}`, margin:'2px 0' }} />;
}

export default function DoctorPatientProfilePage() {
  const params    = useParams();
  const patientId = params?.patientId as string;

  const [profile,     setProfile]     = useState<any>(null);
  const [consentType, setConsentType] = useState<'CONSENT'|'APPOINTMENT'|null>(null);
  const [expiry,      setExpiry]      = useState<string|null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  useEffect(() => {
    if (!patientId) return;
    api.get(`/doctor/patient-profile/${patientId}`)
      .then((r: any) => {
        const d = r?.data?.data ?? r?.data ?? {};
        setProfile(d.patient ?? d);
        setConsentType(d.accessType ?? null);
        setExpiry(d.expiresAt ?? null);
      })
      .catch((e: any) => {
        const msg = e?.response?.data?.message ?? 'Could not load patient profile.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [patientId]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', gap:14, flexDirection:'column' }}>
      <div style={{ width:36, height:36, border:`3px solid ${C.border}`, borderTop:`3px solid ${C.accent}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <span style={{ color:C.txtMid, fontSize:14 }}>Loading patient profile…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Access denied ─────────────────────────────────────────────────────────
  if (error) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:C.r, padding:48, textAlign:'center', maxWidth:440 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
        <div style={{ fontSize:20, fontWeight:800, color:C.txtHi, marginBottom:8 }}>Access Denied</div>
        <div style={{ fontSize:14, color:C.txtMid, lineHeight:1.6 }}>{error}</div>
        <div style={{ marginTop:20, fontSize:12, color:C.txtLo }}>You can request access from the doctor dashboard.</div>
      </div>
    </div>
  );

  if (!profile) return null;

  const age = profile.dateOfBirth
    ? Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 86400000))
    : null;
  const displayName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || 'Patient';
  const initials    = `${(profile.firstName?.[0]??'').toUpperCase()}${(profile.lastName?.[0]??'').toUpperCase()}` || 'PT';
  const score       = profile.healthScores?.score;

  // ── Derived safety data ───────────────────────────────────────────────────
  const lifeThreateningAllergies = (profile.allergies ?? []).filter((a: any) => a.severity === 'LIFE_THREATENING');
  const overdueVaccinations      = (profile.vaccinations ?? []).filter((v: any) => isOverdue(v.nextDueDate));

  // ── Hereditary risk detection (same logic as patient MedicalHistoryTab) ──
  const myConditions = new Set<string>(
    (profile.conditions ?? []).map((c: any) => c.name?.toLowerCase()).filter(Boolean)
  );
  const hereditaryRisks: { condition: string; relation: string; ageOfOnset?: number; livingStatus?: string; causeOfDeath?: string; hasIt: boolean; isFirstDegree: boolean }[] = [];
  const seenConditions = new Set<string>();
  (profile.familyHistory ?? []).forEach((f: any) => {
    const k = f.condition?.toLowerCase();
    if (!k || seenConditions.has(k)) return;
    seenConditions.add(k);
    const hasIt = [...myConditions].some(p => p.includes(k) || k.includes(p));
    hereditaryRisks.push({
      condition:    f.condition,
      relation:     f.relation,
      ageOfOnset:   f.ageOfOnset,
      livingStatus: f.livingStatus,
      causeOfDeath: f.causeOfDeath,
      hasIt,
      isFirstDegree: FIRST_DEGREE.has(f.relation),
    });
  });
  const confirmedRisks = hereditaryRisks.filter(r => r.hasIt);
  const elevatedRisks  = hereditaryRisks.filter(r => !r.hasIt && r.isFirstDegree);

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'Inter',sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <div style={{ position:'sticky', top:0, zIndex:100, background:'rgba(248,249,255,0.97)', backdropFilter:'blur(12px)', borderBottom:`1px solid ${C.border}`, padding:'0 32px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:28, height:28, borderRadius:7, background:`linear-gradient(135deg,${C.accent},${C.accentDk})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff' }}>HC</div>
          <span style={{ fontSize:13, color:C.txtMid }}>HealthConnect</span>
          <span style={{ color:'#CBD5E1' }}>›</span>
          <span style={{ fontSize:13, fontWeight:600, color:C.accent }}>Patient Profile</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, fontWeight:600, padding:'4px 12px', borderRadius:100, background:'#FFFBEB', border:'1px solid #FCD34D', color:'#92400E' }}>
            👁 Read Only — Shared by Patient
          </span>
          {expiry && <span style={{ fontSize:11, color:C.amber, fontWeight:600 }}>Expires: {fmtDate(expiry)}</span>}
          <button onClick={() => window.history.back()}
            style={{ padding:'6px 14px', borderRadius:C.rSm, border:`1px solid ${C.border}`, background:C.accentLt, color:C.accent, fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
            ← Back
          </button>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div style={{ maxWidth:1040, margin:'0 auto', padding:'28px 24px' }}>

        {/* ── SAFETY BANNERS — shown at the very top, before any clinical data ── */}

        {/* Life-threatening allergy alert */}
        {lifeThreateningAllergies.length > 0 && (
          <div style={{ background:'linear-gradient(135deg,rgba(124,58,237,0.06),rgba(220,38,38,0.05))', border:'2px solid rgba(220,38,38,0.5)', borderRadius:14, padding:'14px 20px', marginBottom:20, display:'flex', alignItems:'flex-start', gap:14 }}>
            <div style={{ fontSize:28, flexShrink:0 }}>🚨</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, fontSize:13, color:C.purple, marginBottom:8, textTransform:'uppercase' as const, letterSpacing:'.04em' }}>
                Life-Threatening Allergy Alert — Do not prescribe these
              </div>
              <div style={{ display:'flex', flexWrap:'wrap' as const, gap:8 }}>
                {lifeThreateningAllergies.map((a: any, i: number) => (
                  <div key={i} style={{ background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.3)', borderRadius:9, padding:'6px 12px' }}>
                    <span style={{ fontWeight:800, color:C.red, fontSize:13 }}>⚠️ {a.allergen}</span>
                    {a.reaction && <span style={{ fontSize:11, color:'#7F1D1D', marginLeft:6 }}>→ {a.reaction}</span>}
                    {a.crossReactive && <div style={{ fontSize:11, color:'#92400E', marginTop:2 }}>Cross-reactive: {a.crossReactive}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hereditary risk — patient already has the same condition */}
        {confirmedRisks.length > 0 && (
          <div style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.35)', borderRadius:14, padding:'12px 20px', marginBottom:16, display:'flex', alignItems:'flex-start', gap:12 }}>
            <span style={{ fontSize:20, flexShrink:0 }}>🧬</span>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:'#B45309', marginBottom:4 }}>Hereditary Risk Confirmed</div>
              <div style={{ fontSize:12, color:'#92400E', lineHeight:1.7 }}>
                {confirmedRisks.map((r, i) => (
                  <span key={i}>
                    Patient has <strong>{r.condition}</strong> — same as their {r.relation}
                    {r.isFirstDegree && <span style={{ fontSize:10, marginLeft:4, background:'rgba(220,38,38,0.1)', color:C.red, padding:'1px 6px', borderRadius:100, fontWeight:700 }}>1st degree</span>}
                    {r.ageOfOnset && ` (family onset age ${r.ageOfOnset})`}
                    {r.livingStatus==='deceased' && r.causeOfDeath && ` — ${r.relation} deceased (${r.causeOfDeath})`}.{' '}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Elevated hereditary risk — 1st-degree relative had it, patient doesn't yet */}
        {elevatedRisks.length > 0 && (
          <div style={{ background:'rgba(29,78,216,0.04)', border:'1px solid rgba(29,78,216,0.2)', borderRadius:14, padding:'12px 20px', marginBottom:20, display:'flex', alignItems:'flex-start', gap:12 }}>
            <span style={{ fontSize:20, flexShrink:0 }}>⚡</span>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:C.blue, marginBottom:4 }}>Elevated Hereditary Risk — Consider Screening</div>
              <div style={{ fontSize:12, color:'#1E3A8A', lineHeight:1.7 }}>
                {elevatedRisks.map((r, i) => (
                  <span key={i}>
                    {r.relation}{r.livingStatus==='deceased' && r.causeOfDeath ? ` (deceased — ${r.causeOfDeath})` : r.livingStatus==='deceased' ? ' (deceased)' : ''} had <strong>{r.condition}</strong>{r.ageOfOnset ? ` at age ${r.ageOfOnset}` : ''}.{' '}
                  </span>
                ))}
                Preventive screening may be indicated.
              </div>
            </div>
          </div>
        )}

        {/* Overdue vaccinations */}
        {overdueVaccinations.length > 0 && (
          <div style={{ background:'rgba(239,68,68,0.04)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:14, padding:'10px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:18 }}>💉</span>
            <div style={{ fontSize:12, color:'#7F1D1D' }}>
              <span style={{ fontWeight:700, color:C.red }}>Overdue vaccinations: </span>
              {overdueVaccinations.map((v: any) => `${v.vaccineName} (due ${fmtDate(v.nextDueDate)})`).join(' · ')}
            </div>
          </div>
        )}

        {/* ── Hero card ───────────────────────────────────────────────────── */}
        <Card style={{ padding:0, marginBottom:24, overflow:'hidden' }}>
          <div style={{ background:`linear-gradient(135deg,${C.accentDk},${C.accent})`, padding:'28px 32px', display:'flex', alignItems:'center', gap:22 }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, color:'#fff', border:'2px solid rgba(255,255,255,0.3)', flexShrink:0 }}>
              {initials}
            </div>
            <div style={{ flex:1 }}>
              <h1 style={{ fontSize:24, fontWeight:800, color:'#fff', margin:'0 0 8px' }}>{displayName}</h1>
              <div style={{ display:'flex', gap:20, flexWrap:'wrap' as const }}>
                {age    && <span style={{ fontSize:13, color:'rgba(255,255,255,0.8)' }}>Age {age}</span>}
                {profile.gender && <span style={{ fontSize:13, color:'rgba(255,255,255,0.8)' }}>{profile.gender}</span>}
                {profile.bloodGroup && <span style={{ fontSize:13, color:'rgba(255,255,255,0.8)' }}>🩸 {bloodGroupLabel(profile.bloodGroup)}</span>}
                {profile.user?.registrationId && <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)', fontFamily:'monospace', background:'rgba(255,255,255,0.12)', padding:'2px 8px', borderRadius:6 }}>{profile.user.registrationId}</span>}
                {profile.city && <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>📍 {profile.city}</span>}
              </div>
              {(profile.phone || profile.user?.email) && (
                <div style={{ display:'flex', gap:16, marginTop:10 }}>
                  {profile.phone && <span style={{ fontSize:12, color:'rgba(255,255,255,0.65)' }}>📞 {profile.phone}</span>}
                  {profile.user?.email && <span style={{ fontSize:12, color:'rgba(255,255,255,0.65)' }}>✉️ {profile.user.email}</span>}
                </div>
              )}
            </div>
            {score != null && (
              <div style={{ textAlign:'center', background:'rgba(255,255,255,0.12)', borderRadius:16, padding:'16px 24px', flexShrink:0 }}>
                <div style={{ fontSize:36, fontWeight:800, color:'#fff', lineHeight:1 }}>{score}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' as const, marginTop:4 }}>Health Score</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:2 }}>out of 100</div>
              </div>
            )}
          </div>

          {/* Health score breakdown */}
          {profile.healthScores && (
            <div style={{ padding:'18px 32px', borderTop:`1px solid ${C.border}`, display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:16 }}>
              {[
                { label:'Medication Adherence', val:profile.healthScores.medicationAdherence },
                { label:'Symptom Frequency',    val:profile.healthScores.symptomFrequency },
                { label:'Appt Regularity',      val:profile.healthScores.appointmentRegularity },
                { label:'Lifestyle Factors',    val:profile.healthScores.lifestyleFactors },
              ].filter(x => x.val != null).map(item => (
                <div key={item.label}>
                  <div style={{ fontSize:11, color:C.txtLo, marginBottom:6 }}>{item.label}</div>
                  <div style={{ height:5, background:'#E0E7FF', borderRadius:3 }}>
                    <div style={{ height:'100%', width:`${item.val}%`, background:item.val>=70?C.accent:item.val>=40?C.amber:C.rose, borderRadius:3, transition:'width 0.5s' }}/>
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:C.txtHi, marginTop:4 }}>{item.val}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── 2-col grid — clinical data ──────────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>

          {/* Conditions */}
          <Card style={{ padding:'20px 24px' }}>
            <SectionLabel text="Conditions" count={profile.conditions?.length} />
            {!(profile.conditions?.length) ? (
              <div style={{ fontSize:13, color:C.txtLo, padding:'8px 0' }}>No conditions recorded</div>
            ) : profile.conditions.map((c: any, i: number) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'9px 0', borderBottom:`1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.txtHi }}>{c.name}</div>
                  {c.icdCode && <div style={{ fontSize:10, color:C.txtLo, fontFamily:'monospace', marginTop:2 }}>ICD: {c.icdCode}</div>}
                  {c.diagnosedDate && <div style={{ fontSize:11, color:C.txtLo, marginTop:2 }}>Since {fmtDate(c.diagnosedDate)}</div>}
                  {c.treatingDoctor && <div style={{ fontSize:11, color:C.txtLo }}>👨‍⚕️ {c.treatingDoctor}</div>}
                  {c.notes && <div style={{ fontSize:11, color:C.txtLo, fontStyle:'italic', marginTop:2 }}>{c.notes}</div>}
                </div>
                <Pill label={c.status ?? 'ACTIVE'} color={statusColor(c.status ?? 'ACTIVE')} />
              </div>
            ))}
          </Card>

          {/* Allergies */}
          <Card style={{ padding:'20px 24px' }}>
            <SectionLabel text="Allergies" count={profile.allergies?.length} />
            {!(profile.allergies?.length) ? (
              <div style={{ fontSize:13, color:C.txtLo, padding:'8px 0' }}>No allergies recorded</div>
            ) : profile.allergies.map((a: any, i: number) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'9px 0', borderBottom:`1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.txtHi }}>{a.allergen}</div>
                  {a.category && <div style={{ fontSize:11, color:C.txtLo, textTransform:'capitalize' as const }}>{a.category.toLowerCase()}</div>}
                  {a.reaction  && <div style={{ fontSize:11, color:C.txtMid }}>→ {a.reaction}</div>}
                  {a.crossReactive && <div style={{ fontSize:11, color:C.amber }}>Cross-reactive: {a.crossReactive}</div>}
                </div>
                <Pill
                  label={(a.severity ?? 'MILD').replace('_',' ')}
                  color={(a.severity==='SEVERE'||a.severity==='LIFE_THREATENING') ? C.rose : a.severity==='MODERATE' ? C.amber : C.txtMid}
                />
              </div>
            ))}
          </Card>

          {/* Active Medications */}
          <Card style={{ padding:'20px 24px' }}>
            <SectionLabel text="Active Medications" count={profile.medications?.length} />
            {!(profile.medications?.length) ? (
              <div style={{ fontSize:13, color:C.txtLo, padding:'8px 0' }}>No active medications</div>
            ) : profile.medications.map((m: any, i: number) => (
              <div key={i} style={{ padding:'9px 0', borderBottom:`1px solid ${C.border}` }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.txtHi }}>{m.name}</div>
                <div style={{ fontSize:11, color:C.txtMid, marginTop:3 }}>
                  {m.dosage}{m.dosageUnit ? ` ${m.dosageUnit}` : ''} · {m.frequency?.replace(/_/g,' ') ?? '—'}
                  {m.instructions && <span style={{ color:C.txtLo }}> · {m.instructions}</span>}
                </div>
                {m.prescribedBy && <div style={{ fontSize:11, color:C.txtLo, marginTop:2 }}>Prescribed by {m.prescribedBy}</div>}
              </div>
            ))}
          </Card>

          {/* Recent Vitals */}
          <Card style={{ padding:'20px 24px' }}>
            <SectionLabel text="Recent Vitals" count={profile.vitals?.length} />
            {!(profile.vitals?.length) ? (
              <div style={{ fontSize:13, color:C.txtLo, padding:'8px 0' }}>No vitals recorded</div>
            ) : profile.vitals.map((v: any, i: number) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:`1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize:12, color:C.txtMid, textTransform:'capitalize' as const }}>{v.type?.replace(/_/g,' ')}</div>
                  {v.context && <div style={{ fontSize:11, color:C.txtLo }}>{v.context}</div>}
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.txtHi }}>
                    {v.systolic && v.diastolic ? `${v.systolic}/${v.diastolic}` : v.value}
                    <span style={{ fontSize:11, color:C.txtLo, fontWeight:400 }}> {v.unit}</span>
                  </div>
                  <div style={{ fontSize:10, color:C.txtLo }}>{v.measuredAt ? fmtDate(v.measuredAt) : ''}</div>
                </div>
              </div>
            ))}
          </Card>

          {/* Surgical History — NEW */}
          {(profile.surgeries?.length > 0) && (
            <Card style={{ padding:'20px 24px' }}>
              <SectionLabel text="Surgical History" count={profile.surgeries.length} />
              {profile.surgeries.map((s: any, i: number) => (
                <div key={i} style={{ padding:'9px 0', borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:13, fontWeight:600, color:C.txtHi }}>{s.name}</div>
                  {s.surgeryDate && <div style={{ fontSize:11, color:C.txtLo, marginTop:2 }}>📅 {fmtDate(s.surgeryDate)}</div>}
                  {s.hospital    && <div style={{ fontSize:11, color:C.txtLo }}>🏥 {s.hospital}</div>}
                  {s.surgeon     && <div style={{ fontSize:11, color:C.txtLo }}>👨‍⚕️ {s.surgeon}</div>}
                  {s.outcome     && <div style={{ fontSize:11, color:C.green, marginTop:2 }}>✓ {s.outcome}</div>}
                  {s.notes       && <div style={{ fontSize:11, color:C.txtLo, fontStyle:'italic', marginTop:2 }}>{s.notes}</div>}
                </div>
              ))}
            </Card>
          )}

          {/* Vaccinations — NEW */}
          {(profile.vaccinations?.length > 0) && (
            <Card style={{ padding:'20px 24px' }}>
              <SectionLabel text="Vaccinations" count={profile.vaccinations.length} />
              {profile.vaccinations.map((v: any, i: number) => {
                const od = isOverdue(v.nextDueDate);
                return (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'9px 0', borderBottom:`1px solid ${C.border}` }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:C.txtHi }}>{v.vaccineName}</div>
                      <div style={{ fontSize:11, color:C.txtLo, marginTop:2 }}>
                        Dose {v.doseNumber ?? 1}{v.administeredDate ? ` · ${fmtDate(v.administeredDate)}` : ''}
                      </div>
                      {v.nextDueDate && (
                        <div style={{ fontSize:11, color:od ? C.rose : C.txtLo, marginTop:2, fontWeight:od?700:400 }}>
                          {od ? '⚠️ Overdue since ' : 'Next due: '}{fmtDate(v.nextDueDate)}
                        </div>
                      )}
                    </div>
                    {od && <Pill label="Overdue" color={C.rose} />}
                  </div>
                );
              })}
            </Card>
          )}

        </div>{/* end 2-col grid */}

        {/* ── Hospitalization History — full width — NEW ──────────────────── */}
        {(profile.hospitalizationHistory?.length > 0) && (
          <Card style={{ padding:'20px 24px', marginBottom:20 }}>
            <SectionLabel text="Hospitalization History" count={profile.hospitalizationHistory.length} />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
              {profile.hospitalizationHistory.map((h: any, i: number) => {
                const ongoing = !h.dischargeDate;
                const days    = !ongoing && h.admissionDate && h.dischargeDate
                  ? daysBetween(h.admissionDate, h.dischargeDate) : null;
                return (
                  <div key={i} style={{ background:C.bg, borderRadius:10, padding:'12px 16px', border:`1px solid ${C.border}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:C.txtHi }}>{h.reason || 'Hospitalization'}</div>
                      {ongoing && <Pill label="Ongoing" color={C.accent} />}
                    </div>
                    {h.hospitalName    && <div style={{ fontSize:11, color:C.txtLo }}>🏥 {h.hospitalName}</div>}
                    {h.admissionDate   && (
                      <div style={{ fontSize:11, color:C.txtLo, marginTop:2 }}>
                        📅 {fmtDate(h.admissionDate)}{h.dischargeDate ? ` → ${fmtDate(h.dischargeDate)}` : ' → Present'}
                        {days !== null && ` · ${days} day${days!==1?'s':''}`}
                      </div>
                    )}
                    {h.treatingDoctor  && <div style={{ fontSize:11, color:C.txtLo, marginTop:2 }}>👨‍⚕️ {h.treatingDoctor}</div>}
                    {h.notes           && <div style={{ fontSize:11, color:C.txtLo, fontStyle:'italic', marginTop:4 }}>{h.notes}</div>}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ── Family History — full width — NEW ──────────────────────────── */}
        {(profile.familyHistory?.length > 0) && (
          <Card style={{ padding:'20px 24px', marginBottom:20 }}>
            <SectionLabel text="Family History" count={profile.familyHistory.length} />

            {/* Hereditary risk summary inside the family history card */}
            {hereditaryRisks.length > 0 && (
              <div style={{ background:'rgba(20,184,166,0.04)', border:'1px solid rgba(20,184,166,0.2)', borderRadius:10, padding:'10px 14px', marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#0D9488', marginBottom:6 }}>🧬 Risk Analysis</div>
                {hereditaryRisks.map((r, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:C.txtMid, marginBottom:4 }}>
                    <span style={{ width:7, height:7, borderRadius:'50%', background:r.hasIt?C.rose:r.isFirstDegree?C.amber:C.green, flexShrink:0 }}/>
                    <span><strong>{r.condition}</strong> — {r.relation}{r.ageOfOnset ? ` (onset age ${r.ageOfOnset})` : ''}</span>
                    {r.isFirstDegree && <span style={{ fontSize:9, fontWeight:700, color:C.rose, background:'rgba(220,38,38,0.08)', padding:'1px 6px', borderRadius:100 }}>1st degree</span>}
                    {r.hasIt
                      ? <span style={{ fontSize:9, fontWeight:700, color:C.rose, background:'rgba(220,38,38,0.1)', padding:'1px 6px', borderRadius:100 }}>⚠️ Patient has this</span>
                      : r.isFirstDegree
                        ? <span style={{ fontSize:9, fontWeight:700, color:C.amber, background:'rgba(217,119,6,0.1)', padding:'1px 6px', borderRadius:100 }}>⚡ Elevated risk</span>
                        : null
                    }
                  </div>
                ))}
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:10 }}>
              {profile.familyHistory.map((f: any, i: number) => {
                const isFirstDeg = FIRST_DEGREE.has(f.relation);
                const isDeceased = f.livingStatus === 'deceased';
                return (
                  <div key={i} style={{ background:C.bg, borderRadius:10, padding:'12px 14px', border:`1px solid ${C.border}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:C.txtHi }}>{f.condition}</div>
                      {isFirstDeg && (
                        <span style={{ fontSize:9, fontWeight:700, color:C.rose, background:'rgba(220,38,38,0.08)', padding:'1px 6px', borderRadius:100, border:`1px solid rgba(220,38,38,0.15)`, flexShrink:0 }}>1st degree</span>
                      )}
                    </div>
                    <div style={{ fontSize:11, color:C.txtLo }}>👤 {f.relation}</div>
                    {f.ageOfOnset && <div style={{ fontSize:11, color:C.txtLo }}>Onset age: {f.ageOfOnset}</div>}
                    <div style={{ fontSize:11, color:isDeceased?C.txtLo:C.green, marginTop:2 }}>
                      {isDeceased ? '🕊️ Deceased' : '💚 Living'}
                      {isDeceased && f.causeOfDeath && <span style={{ color:C.txtLo }}> — {f.causeOfDeath}</span>}
                    </div>
                    {f.notes && <div style={{ fontSize:11, color:C.txtLo, fontStyle:'italic', marginTop:4 }}>{f.notes}</div>}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ── Consent info footer ─────────────────────────────────────────── */}
        <div style={{ padding:'14px 20px', background:C.accentLt, border:`1px solid ${C.border}`, borderRadius:C.rSm, display:'flex', alignItems:'center', gap:12, fontSize:12, color:C.txtMid }}>
          <span style={{ fontSize:16 }}>🔒</span>
          <span>
            {consentType === 'CONSENT'
              ? 'Patient explicitly approved access to this profile.'
              : 'Access granted through existing appointment relationship.'}
            {expiry && ` · Access expires ${fmtDate(expiry)}.`}
            {' '}This is a read-only view. No data can be modified from here.
          </span>
        </div>

      </div>
    </div>
  );
}
