'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { patientAPI } from '@/lib/api';

interface Props { onComplete: () => void; onSkip: () => void; }

// ─── Shared input styles matching the site design ─────────────────────────────
const S = {
  overlay: { position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(8,15,30,0.92)', backdropFilter:'blur(6px)', padding:16 } as React.CSSProperties,
  modal: { width:'100%', maxWidth:660, background:'#0D1424', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, boxShadow:'0 32px 80px rgba(0,0,0,0.7)', overflow:'hidden', display:'flex', flexDirection:'column', maxHeight:'95vh' } as React.CSSProperties,
  header: { background:'linear-gradient(135deg,rgba(13,148,136,0.18),rgba(8,15,30,0.95))', padding:'24px 28px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0 } as React.CSSProperties,
  body: { padding:'24px 28px', overflowY:'auto', flex:1 } as React.CSSProperties,
  footer: { padding:'16px 28px', borderTop:'1px solid rgba(255,255,255,0.07)', background:'rgba(0,0,0,0.25)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 } as React.CSSProperties,
  label: { display:'block', fontSize:11, color:'#64748B', fontFamily:'JetBrains Mono,monospace', textTransform:'uppercase' as const, letterSpacing:'.06em', marginBottom:6 },
  input: { width:'100%', padding:'10px 13px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:9, color:'#E2E8F0', fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:'none', boxSizing:'border-box' as const },
  select: { width:'100%', padding:'10px 13px', background:'#0D1424', border:'1px solid rgba(255,255,255,0.09)', borderRadius:9, color:'#E2E8F0', fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:'none', boxSizing:'border-box' as const },
  sectionTitle: { fontSize:13, fontWeight:700, color:'#94A3B8', fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' },
  addBtn: { background:'none', border:'none', color:'#14B8A6', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif", padding:0 },
  removeBtn: { background:'none', border:'none', color:'#475569', fontSize:18, cursor:'pointer', padding:'0 4px', lineHeight:1, flexShrink:0 } as React.CSSProperties,
  emptyBox: { textAlign:'center' as const, padding:'20px', color:'#334155', fontSize:13, border:'1px dashed rgba(255,255,255,0.07)', borderRadius:10 },
  row: { display:'grid', gap:12, marginBottom:12 } as React.CSSProperties,
  itemRow: { display:'flex', gap:8, alignItems:'center', marginBottom:8 } as React.CSSProperties,
  ctaBtn: { padding:'10px 24px', background:'linear-gradient(135deg,#0D9488,#14B8A6)', border:'none', borderRadius:10, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif", display:'flex', alignItems:'center', gap:8 } as React.CSSProperties,
  backBtn: { padding:'10px 20px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, color:'#64748B', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif" } as React.CSSProperties,
  skipBtn: { background:'none', border:'none', color:'#334155', fontSize:13, cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif", padding:'8px 12px' } as React.CSSProperties,
  errText: { color:'#F43F5E', fontSize:12, marginLeft:8 },
};

// ─── STEP 1: Personal Info ────────────────────────────────────────────────────
interface S1 { dateOfBirth:string; gender:string; bloodGroup:string; height:string; weight:string; ecName:string; ecPhone:string; ecRelation:string; }
function Step1({ d, set }: { d: S1; set:(k:keyof S1, v:string)=>void }) {
  return (
    <div>
      <p style={{ color:'#475569', fontSize:13, marginBottom:20 }}>This personalises your health dashboard and helps doctors in emergencies.</p>

      <div style={{ ...S.row, gridTemplateColumns:'1fr 1fr' }}>
        <div><label style={S.label}>Date of Birth *</label><input type="date" value={d.dateOfBirth} onChange={e=>set('dateOfBirth',e.target.value)} style={S.input}/></div>
        <div><label style={S.label}>Gender *</label>
          <select value={d.gender} onChange={e=>set('gender',e.target.value)} style={S.select}>
            <option value="">Select gender</option>
            <option value="MALE">Male</option><option value="FEMALE">Female</option>
            <option value="OTHER">Other</option><option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
          </select>
        </div>
      </div>

      <div style={{ ...S.row, gridTemplateColumns:'1fr 1fr 1fr' }}>
        <div><label style={S.label}>Blood Group *</label>
          <select value={d.bloodGroup} onChange={e=>set('bloodGroup',e.target.value)} style={S.select}>
            <option value="">Select</option>
            {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g=><option key={g}>{g}</option>)}
          </select>
        </div>
        <div><label style={S.label}>Height (cm)</label><input type="number" placeholder="170" value={d.height} onChange={e=>set('height',e.target.value)} style={S.input}/></div>
        <div><label style={S.label}>Weight (kg)</label><input type="number" placeholder="70" value={d.weight} onChange={e=>set('weight',e.target.value)} style={S.input}/></div>
      </div>

      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:16 }}>
        <div style={{ fontSize:12, color:'#64748B', fontWeight:700, marginBottom:12, fontFamily:'JetBrains Mono,monospace', textTransform:'uppercase', letterSpacing:'.06em' }}>Emergency Contact <span style={{ color:'#334155', fontWeight:400 }}>(optional)</span></div>
        <div style={{ ...S.row, gridTemplateColumns:'1fr 1fr 1fr' }}>
          <input placeholder="Full name" value={d.ecName} onChange={e=>set('ecName',e.target.value)} style={S.input}/>
          <input placeholder="Phone number" value={d.ecPhone} onChange={e=>set('ecPhone',e.target.value)} style={S.input}/>
          <select value={d.ecRelation} onChange={e=>set('ecRelation',e.target.value)} style={S.select}>
            <option value="">Relationship</option>
            {['Spouse','Parent','Child','Sibling','Friend','Other'].map(r=><option key={r}>{r}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── STEP 2: Medical Background ───────────────────────────────────────────────
interface Condition { name:string; diagnosedYear:string; severity:string; }
interface Allergy   { name:string; severity:string; reaction:string; }
interface S2 { conditions:Condition[]; allergies:Allergy[]; }
function Step2({ d, set }: { d: S2; set:(v:S2)=>void }) {
  const addCond = () => set({ ...d, conditions:[...d.conditions,{name:'',diagnosedYear:'',severity:'MILD'}] });
  const updCond = (i:number,k:keyof Condition,v:string) => { const a=[...d.conditions]; a[i]={...a[i],[k]:v}; set({...d,conditions:a}); };
  const delCond = (i:number) => set({ ...d, conditions:d.conditions.filter((_,x)=>x!==i) });
  const addAl   = () => set({ ...d, allergies:[...d.allergies,{name:'',severity:'MILD',reaction:''}] });
  const updAl   = (i:number,k:keyof Allergy,v:string) => { const a=[...d.allergies]; a[i]={...a[i],[k]:v}; set({...d,allergies:a}); };
  const delAl   = (i:number) => set({ ...d, allergies:d.allergies.filter((_,x)=>x!==i) });
  return (
    <div>
      <p style={{ color:'#475569', fontSize:13, marginBottom:20 }}>Add your existing conditions and known allergies. You can always edit these later from My Health → Medical History.</p>

      {/* Conditions */}
      <div style={{ marginBottom:24 }}>
        <div style={S.sectionTitle}>
          <span style={{ color:'#94A3B8' }}>🩺 Medical Conditions</span>
          <button style={S.addBtn} onClick={addCond}>+ Add Condition</button>
        </div>
        {d.conditions.length === 0
          ? <div style={S.emptyBox}>No conditions added — click "+ Add Condition" if applicable</div>
          : d.conditions.map((c,i)=>(
            <div key={i} style={S.itemRow}>
              <input placeholder="Condition name (e.g. Type 2 Diabetes)" value={c.name} onChange={e=>updCond(i,'name',e.target.value)} style={{...S.input,flex:2}}/>
              <input type="number" placeholder="Year" value={c.diagnosedYear} onChange={e=>updCond(i,'diagnosedYear',e.target.value)} style={{...S.input,width:80,flex:'none'}}/>
              <select value={c.severity} onChange={e=>updCond(i,'severity',e.target.value)} style={{...S.select,width:110,flex:'none'}}>
                <option value="MILD">Mild</option><option value="MODERATE">Moderate</option><option value="SEVERE">Severe</option>
              </select>
              <button style={S.removeBtn} onClick={()=>delCond(i)}>×</button>
            </div>
          ))
        }
      </div>

      {/* Allergies */}
      <div>
        <div style={S.sectionTitle}>
          <span style={{ color:'#94A3B8' }}>⚠️ Allergies</span>
          <button style={S.addBtn} onClick={addAl}>+ Add Allergy</button>
        </div>
        {d.allergies.length === 0
          ? <div style={S.emptyBox}>No allergies added — click "+ Add Allergy" if applicable</div>
          : d.allergies.map((a,i)=>(
            <div key={i} style={S.itemRow}>
              <input placeholder="Allergen (e.g. Penicillin)" value={a.name} onChange={e=>updAl(i,'name',e.target.value)} style={{...S.input,flex:2}}/>
              <select value={a.severity} onChange={e=>updAl(i,'severity',e.target.value)} style={{...S.select,width:110,flex:'none'}}>
                <option value="MILD">Mild</option><option value="MODERATE">Moderate</option><option value="SEVERE">Severe</option>
              </select>
              <input placeholder="Reaction (e.g. Hives)" value={a.reaction} onChange={e=>updAl(i,'reaction',e.target.value)} style={{...S.input,flex:2}}/>
              <button style={S.removeBtn} onClick={()=>delAl(i)}>×</button>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─── STEP 3: Current Medications ──────────────────────────────────────────────
interface Med { name:string; dosage:string; frequency:string; startDate:string; }
interface S3 { medications:Med[]; }
function Step3({ d, set }: { d: S3; set:(v:S3)=>void }) {
  const add = () => set({ medications:[...d.medications,{name:'',dosage:'',frequency:'ONCE_DAILY',startDate:''}] });
  const upd = (i:number,k:keyof Med,v:string) => { const a=[...d.medications]; a[i]={...a[i],[k]:v}; set({medications:a}); };
  const del = (i:number) => set({ medications:d.medications.filter((_,x)=>x!==i) });
  return (
    <div>
      <p style={{ color:'#475569', fontSize:13, marginBottom:20 }}>List medications you're currently taking. You can manage all medications from the Medications page anytime.</p>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
        <button style={S.addBtn} onClick={add}>+ Add Medication</button>
      </div>
      {d.medications.length === 0
        ? <div style={{ ...S.emptyBox, padding:'32px 20px' }}>
            <div style={{ fontSize:36, marginBottom:8 }}>💊</div>
            <div style={{ color:'#475569' }}>No medications added</div>
            <div style={{ color:'#334155', fontSize:12, marginTop:4 }}>Click "+ Add Medication" if you're currently taking any</div>
          </div>
        : d.medications.map((m,i)=>(
          <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:14, marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <span style={{ fontSize:11, color:'#475569', textTransform:'uppercase', letterSpacing:'.06em', fontFamily:'JetBrains Mono,monospace' }}>Medication {i+1}</span>
              <button onClick={()=>del(i)} style={{ background:'none', border:'none', color:'#475569', fontSize:12, cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Remove</button>
            </div>
            <div style={{ ...S.row, gridTemplateColumns:'1fr 1fr' }}>
              <input placeholder="Medication name (e.g. Metformin)" value={m.name} onChange={e=>upd(i,'name',e.target.value)} style={S.input}/>
              <input placeholder="Dosage (e.g. 500mg)" value={m.dosage} onChange={e=>upd(i,'dosage',e.target.value)} style={S.input}/>
              <select value={m.frequency} onChange={e=>upd(i,'frequency',e.target.value)} style={S.select}>
                <option value="ONCE_DAILY">Once daily</option>
                <option value="TWICE_DAILY">Twice daily</option>
                <option value="THREE_TIMES_DAILY">Three times daily</option>
                <option value="FOUR_TIMES_DAILY">Four times daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="AS_NEEDED">As needed</option>
              </select>
              <div>
                <label style={S.label}>Start Date (optional)</label>
                <input type="date" value={m.startDate} onChange={e=>upd(i,'startDate',e.target.value)} style={S.input}/>
              </div>
            </div>
          </div>
        ))
      }
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────
const STEPS = [
  { num:1, label:'Personal Info',       icon:'👤' },
  { num:2, label:'Medical Background',  icon:'🩺' },
  { num:3, label:'Current Medications', icon:'💊' },
];

export default function OnboardingWizard({ onComplete, onSkip }: Props) {
  const [user, setUser] = useState<any>(() => (useAuthStore.getState() as any).user);
  useEffect(() => { const u = (useAuthStore as any).subscribe((s:any) => setUser(s.user)); return () => u(); }, []);
  const [step, setStep]     = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const [s1, setS1] = useState<S1>({ dateOfBirth:'', gender:'', bloodGroup:'', height:'', weight:'', ecName:'', ecPhone:'', ecRelation:'' });
  const [s2, setS2] = useState<S2>({ conditions:[], allergies:[] });
  const [s3, setS3] = useState<S3>({ medications:[] });

  const setS1Field = (k: keyof S1, v: string) => setS1(p=>({...p,[k]:v}));

  const validate = () => {
    if (step === 1) {
      if (!s1.dateOfBirth) return 'Date of Birth is required';
      if (!s1.gender)      return 'Gender is required';
      if (!s1.bloodGroup)  return 'Blood Group is required';
    }
    return '';
  };

  const next = () => {
    const e = validate();
    if (e) { setError(e); return; }
    setError('');
    setStep(s => s + 1);
  };

  const back = () => { setError(''); setStep(s => s - 1); };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      // 1. Save profile (DOB, gender, blood group, height, weight, emergency contact)
      await patientAPI.updateProfile({
        dateOfBirth:  s1.dateOfBirth,
        gender:       s1.gender,
        bloodGroup:   s1.bloodGroup,
        height:       s1.height ? Number(s1.height) : undefined,
        weight:       s1.weight ? Number(s1.weight) : undefined,
        emergencyContact: s1.ecName ? {
          name: s1.ecName, phone: s1.ecPhone, relationship: s1.ecRelation,
        } : undefined,
      });

      // 2. Save conditions
      for (const c of s2.conditions) {
        if (c.name.trim()) {
          await patientAPI.createCondition({
            name: c.name.trim(),
            diagnosedYear: c.diagnosedYear ? Number(c.diagnosedYear) : undefined,
            severity: c.severity,
            status: 'ACTIVE',
          }).catch(()=>{});
        }
      }

      // 3. Save allergies
      for (const a of s2.allergies) {
        if (a.name.trim()) {
          await patientAPI.createAllergy({
            allergen: a.name.trim(),
            severity: a.severity,
            reaction: a.reaction,
          }).catch(()=>{});
        }
      }

      // 4. Save medications
      for (const m of s3.medications) {
        if (m.name.trim()) {
          await patientAPI.addMedication({
            name:      m.name.trim(),
            dosage:    m.dosage,
            frequency: m.frequency,
            startDate: m.startDate || undefined,
            status:    'ACTIVE',
          }).catch(()=>{});
        }
      }

      onComplete();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div style={S.overlay}>
      <div style={S.modal}>

        {/* ── Header ── */}
        <div style={S.header}>
          {/* Title row + X button */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:12, background:'linear-gradient(135deg,#0D9488,#14B8A6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, color:'#fff', fontFamily:'sans-serif', flexShrink:0 }}>HC</div>
              <div>
                <h2 style={{ color:'#E2E8F0', fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, margin:0 }}>
                  Welcome{user?.firstName ? `, ${user.firstName}` : ''}! 👋
                </h2>
                <p style={{ color:'#475569', fontSize:12, margin:0 }}>Set up your health profile — takes about 2 minutes</p>
              </div>
            </div>
            {/* X close button */}
            <button
              onClick={onSkip}
              title="Skip setup for now"
              style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#475569', fontSize:18, flexShrink:0, transition:'all 0.15s' }}
            >×</button>
          </div>

          {/* Step indicators */}
          <div style={{ display:'flex', alignItems:'center', gap:0 }}>
            {STEPS.map((s, i) => (
              <div key={s.num} style={{ display:'flex', alignItems:'center', flex: i < STEPS.length-1 ? 1 : 'none' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{
                    width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize: s.num < step ? 14 : 13, fontWeight:700,
                    background: s.num < step ? '#14B8A6' : s.num === step ? 'rgba(20,184,166,0.15)' : 'rgba(255,255,255,0.04)',
                    color: s.num <= step ? '#14B8A6' : '#334155',
                    border: s.num === step ? '2px solid #14B8A6' : s.num < step ? '2px solid #14B8A6' : '2px solid rgba(255,255,255,0.07)',
                    transition:'all 0.3s',
                    flexShrink:0,
                  }}>{s.num < step ? '✓' : s.num}</div>
                  <span style={{ fontSize:10, color: s.num === step ? '#14B8A6' : '#334155', fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight: s.num === step ? 700 : 400, whiteSpace:'nowrap' }}>
                    {s.icon} {s.label}
                  </span>
                </div>
                {i < STEPS.length-1 && (
                  <div style={{ flex:1, height:1, background: step > s.num ? '#14B8A6' : 'rgba(255,255,255,0.06)', margin:'0 8px', marginBottom:18, transition:'background 0.4s' }}/>
                )}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ height:2, background:'rgba(255,255,255,0.05)', borderRadius:4, overflow:'hidden', marginTop:12 }}>
            <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg,#0D9488,#14B8A6)', borderRadius:4, transition:'width 0.4s ease' }}/>
          </div>
        </div>

        {/* ── Step title ── */}
        <div style={{ padding:'16px 28px 0', flexShrink:0 }}>
          <h3 style={{ color:'#E2E8F0', fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:800, margin:0 }}>
            Step {step}: {STEPS[step-1].label}
          </h3>
        </div>

        {/* ── Body ── */}
        <div style={S.body}>
          {step === 1 && <Step1 d={s1} set={setS1Field}/>}
          {step === 2 && <Step2 d={s2} set={setS2}/>}
          {step === 3 && <Step3 d={s3} set={setS3}/>}
        </div>

        {/* ── Footer ── */}
        <div style={S.footer}>
          <div style={{ display:'flex', alignItems:'center', gap:0 }}>
            {step > 1 && <button style={S.backBtn} onClick={back} disabled={saving}>← Back</button>}
            {error && <span style={S.errText}>{error}</span>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button style={S.skipBtn} onClick={onSkip}>Skip setup</button>
            {step < 3
              ? <button style={S.ctaBtn} onClick={next}>Continue →</button>
              : <button style={{ ...S.ctaBtn, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }} onClick={handleSubmit} disabled={saving}>
                  {saving
                    ? <><span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid #fff', borderRadius:'50%', display:'inline-block', animation:'hcSpin 0.7s linear infinite' }}/>Saving...</>
                    : '✓ Complete Setup'
                  }
                </button>
            }
          </div>
        </div>
      </div>
      <style>{`@keyframes hcSpin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
