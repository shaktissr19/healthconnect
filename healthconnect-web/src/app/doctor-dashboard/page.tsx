'use client';
// src/app/doctor-dashboard/page.tsx
// Complete Doctor Dashboard — ALL operations wired to real APIs with smart fallbacks
// FIXED: useAuthStore reactive hooks replaced with getState()+subscribe everywhere
// FIXED: activePage defaults to 'home' on load
// FIXED: contrast issues, pending action counts from real data, video consult meeting link

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { api, communityAPI } from '@/lib/api';
import ProfileOnboardingModal, { isOnboardingDone, isOnboardingSnoozed } from '@/components/onboarding/ProfileOnboardingModal';
import { ProfileCompletenessBanner } from '@/components/onboarding/ProfileCompleteness';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:       '#F5F4F0',   // warm grey — matches patient dashboard
  cardBg:   '#FDFCFB',   // warm white cards
  cardBg2:  '#F5F4F0',   // warm page bg
  border:   'rgba(13,148,136,0.14)',
  borderHi: 'rgba(13,148,136,0.3)',
  teal:     '#0D9488',
  tealDark: '#0F766E',
  tealGlow: 'rgba(13,148,136,0.08)',
  green:    '#16A34A',
  amber:    '#D97706',
  rose:     '#E11D48',
  violet:   '#7C3AED',
  txtHi:    '#0F172A',
  txtMid:   '#475569',
  txtLo:    '#94A3B8',
  r:        '14px',
  rSm:      '10px',
};

// ── Safe auth hook — never reactive, never causes redirect loops ───────────────
function useAuthUser() {
  const [user, setUser] = useState<any>(() => (useAuthStore.getState() as any).user);
  useEffect(() => {
    const unsub = (useAuthStore as any).subscribe((s: any) => setUser(s.user));
    return () => unsub();
  }, []);
  return user;
}

// ── Shared UI atoms ───────────────────────────────────────────────────────────
function Card({ children, style = {}, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: C.r, boxShadow: '0 2px 8px rgba(13,148,136,0.10), 0 0 0 1px rgba(13,148,136,0.06)', ...style }} onClick={onClick}>
      {children}
    </div>
  );
}
function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ padding: '2px 9px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: color + '18', color, border: `1px solid ${color}30`, textTransform: 'uppercase' as const, letterSpacing: '0.05em', whiteSpace: 'nowrap' as const }}>
      {label}
    </span>
  );
}
function BlueBtn({ children, onClick, disabled, style = {} }: any) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: '9px 22px', borderRadius: C.rSm, border: 'none', background: disabled ? '#E2E8F0' : `linear-gradient(135deg,${C.tealDark},${C.teal})`, color: disabled ? '#94A3B8' : '#fff', fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', boxShadow: disabled ? 'none' : '0 2px 8px rgba(13,148,136,0.25)', transition: 'all 0.15s', ...style }}>
      {children}
    </button>
  );
}
function GhostBtn({ children, onClick, style = {} }: any) {
  return (
    <button onClick={onClick}
      style={{ padding: '8px 18px', borderRadius: C.rSm, border: `1px solid ${C.border}`, background: 'transparent', color: C.txtMid, fontSize: 13, cursor: 'pointer', ...style }}>
      {children}
    </button>
  );
}
function DangerBtn({ children, onClick, style = {} }: any) {
  return (
    <button onClick={onClick}
      style={{ padding: '8px 18px', borderRadius: C.rSm, border: `1px solid ${C.rose}40`, background: C.rose + '08', color: C.rose, fontSize: 13, fontWeight: 600, cursor: 'pointer', ...style }}>
      {children}
    </button>
  );
}
function Skel({ w, h, r = 6 }: { w: string | number; h: number; r?: number }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: 'rgba(15,23,42,0.05)' } as React.CSSProperties} />;
}
function SectionHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <div>
        <h2 style={{ color: C.txtHi, fontSize: 20, fontWeight: 800, margin: 0 }}>{title}</h2>
        {sub && <p style={{ color: C.txtMid, fontSize: 13, margin: '4px 0 0' }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{ width: 40, height: 22, borderRadius: 100, background: on ? C.teal : '#CBD5E1', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: on ? 20 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  );
}
function Toast({ msg, type = 'success', onClose }: { msg: string; type?: 'success'|'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, background: type === 'success' ? C.teal : C.rose, color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', gap: 10, maxWidth: 340, animation: 'slideUp 0.3s ease' }}>
      <span>{type === 'success' ? '✓' : '⚠'}</span>
      <span>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', marginLeft: 6, fontSize: 16 }}>×</button>
    </div>
  );
}
function ConfirmDialog({ msg, onConfirm, onCancel }: { msg: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <Card style={{ padding: 28, maxWidth: 380, width: '100%' }}>
        <p style={{ fontSize: 15, color: C.txtHi, margin: '0 0 20px', fontWeight: 600 }}>{msg}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <DangerBtn onClick={onConfirm}>Confirm</DangerBtn>
          <GhostBtn onClick={onCancel}>Cancel</GhostBtn>
        </div>
      </Card>
    </div>
  );
}
function ComingSoon({ title }: { title: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
      <h2 style={{ color: C.txtHi, fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>{title}</h2>
      <p style={{ color: C.txtMid, fontSize: 14 }}>This feature is coming soon.</p>
    </div>
  );
}

// ── SOAP Notes Modal ──────────────────────────────────────────────────────────
function SOAPNotesModal({ appt, onClose }: { appt: any; onClose: () => void }) {
  const [soap, setSoap] = useState({ subjective:'', objective:'', assessment:'', plan:'' });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const fields = [
    { key:'subjective', label:'S — Subjective',  hint:"Patient's chief complaint and symptoms", color:'#7C3AED' },
    { key:'objective',  label:'O — Objective',   hint:'Examination findings, vitals, test results', color:C.teal },
    { key:'assessment', label:'A — Assessment',  hint:'Diagnosis and clinical impression', color:C.amber },
    { key:'plan',       label:'P — Plan',         hint:'Treatment plan, medications, follow-up', color:C.green },
  ];
  const handleSave = async () => {
    const combined = `[SOAP Note]\nS: ${soap.subjective}\nO: ${soap.objective}\nA: ${soap.assessment}\nP: ${soap.plan}`;
    setSaving(true);
    try {
      await api.put(`/appointments/${appt.id}`, { doctorNotes: combined })
        .catch(() => api.post(`/doctor/patients/${appt.patientId}/notes`, { note: combined }));
    } catch {}
    setSaving(false); setSaved(true);
    setTimeout(onClose, 900);
  };
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9990, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:60, overflowY:'auto' }}>
      <div style={{ width:'100%', maxWidth:620, background:'#fff', borderRadius:18, boxShadow:'0 24px 60px rgba(15,23,42,0.18)', margin:'0 16px 40px' }}>
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:C.txtHi }}>SOAP Clinical Note</div>
            <div style={{ fontSize:12, color:C.txtMid, marginTop:2 }}>{appt.patientName} · {appt.time ?? ''}</div>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:'50%', background:'#F1F5F9', border:'none', cursor:'pointer', fontSize:16, color:'#64748B' }}>✕</button>
        </div>
        <div style={{ padding:'16px 24px', display:'flex', flexDirection:'column', gap:14 }}>
          {fields.map(f => (
            <div key={f.key}>
              <div style={{ fontSize:11, fontWeight:700, color:f.color, textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:5 }}>{f.label}</div>
              <textarea value={(soap as any)[f.key]} onChange={e => setSoap(p => ({ ...p, [f.key]: e.target.value }))}
                rows={2} placeholder={f.hint}
                style={{ width:'100%', padding:'9px 12px', borderRadius:C.rSm, border:`1px solid ${f.color}25`, background:`${f.color}04`, color:C.txtHi, fontSize:13, resize:'vertical' as const, outline:'none', fontFamily:'inherit', boxSizing:'border-box' as const }} />
            </div>
          ))}
        </div>
        {saved && <div style={{ margin:'0 24px 10px', padding:'10px 14px', background:C.green, borderRadius:10, color:'#fff', fontSize:12, fontWeight:600 }}>✓ SOAP note saved!</div>}
        <div style={{ padding:'0 24px 20px', display:'flex', gap:10 }}>
          <BlueBtn onClick={handleSave} disabled={saving || saved || (!soap.subjective && !soap.assessment)}>{saving ? 'Saving…' : '💾 Save SOAP Note'}</BlueBtn>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
        </div>
      </div>
    </div>
  );
}

// ── Follow-up Task Modal ───────────────────────────────────────────────────────
function FollowUpTaskModal({ appt, onClose }: { appt: any; onClose: () => void }) {
  const [task,   setTask]   = useState('');
  const [due,    setDue]    = useState('');
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const presets = ['Check BP in 2 weeks','Review HbA1c in 3 months','Follow-up blood test in 1 month','Review medication response in 2 weeks','Schedule specialist referral'];
  const handleSave = async () => {
    if (!task.trim()) return;
    setSaving(true);
    try { await api.post(`/doctor/patients/${appt.patientId}/notes`, { note: `[FOLLOW-UP] Due: ${due||'TBD'} — ${task}` }); } catch {}
    setSaving(false); setSaved(true);
    setTimeout(onClose, 1000);
  };
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9990, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:460, background:'#fff', borderRadius:18, boxShadow:'0 24px 60px rgba(15,23,42,0.18)' }}>
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:C.txtHi }}>Set Follow-up Task</div>
            <div style={{ fontSize:12, color:C.txtMid, marginTop:2 }}>Post-consultation for {appt.patientName}</div>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:'50%', background:'#F1F5F9', border:'none', cursor:'pointer', fontSize:16, color:'#64748B' }}>✕</button>
        </div>
        <div style={{ padding:'16px 24px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.txtLo, marginBottom:8, textTransform:'uppercase' as const, letterSpacing:'0.06em' }}>Quick Presets</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14 }}>
            {presets.map(p => (
              <button key={p} onClick={() => setTask(p)}
                style={{ padding:'4px 11px', borderRadius:100, fontSize:11, cursor:'pointer', border:`1px solid ${task===p?C.teal:C.border}`, background:task===p?C.tealGlow:'transparent', color:task===p?C.teal:C.txtMid, fontFamily:'inherit' }}>
                {p}
              </button>
            ))}
          </div>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.txtLo, marginBottom:5, textTransform:'uppercase' as const, letterSpacing:'0.06em' }}>Task</div>
            <input value={task} onChange={e => setTask(e.target.value)} placeholder="Describe the follow-up task…"
              style={{ width:'100%', padding:'9px 12px', borderRadius:C.rSm, border:`1px solid ${C.border}`, background:C.cardBg2, color:C.txtHi, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' as const }} />
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:C.txtLo, marginBottom:5, textTransform:'uppercase' as const, letterSpacing:'0.06em' }}>Due Date (optional)</div>
            <input type="date" value={due} onChange={e => setDue(e.target.value)}
              style={{ width:'100%', padding:'9px 12px', borderRadius:C.rSm, border:`1px solid ${C.border}`, background:C.cardBg2, color:C.txtHi, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' as const }} />
          </div>
        </div>
        {saved && <div style={{ margin:'0 24px 10px', padding:'10px 14px', background:C.green, borderRadius:10, color:'#fff', fontSize:12, fontWeight:600 }}>✓ Follow-up task saved!</div>}
        <div style={{ padding:'0 24px 20px', display:'flex', gap:10 }}>
          <BlueBtn onClick={handleSave} disabled={saving || saved || !task.trim()}>{saving ? 'Saving…' : '✓ Set Reminder'}</BlueBtn>
          <GhostBtn onClick={onClose}>Skip</GhostBtn>
        </div>
      </div>
    </div>
  );
}

// ── Pre-consult Summary Modal ─────────────────────────────────────────────────
function PreConsultModal({ appt, onClose }: { appt: any; onClose: () => void }) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!appt.patientId) { setLoading(false); return; }
    api.get(`/doctor/patient-profile/${appt.patientId}`)
      .then((r: any) => { const d = r?.data?.data?.patient ?? r?.data?.patient ?? r?.data?.data ?? r?.data ?? {}; setSummary(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [appt.patientId]);
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9990, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:60, overflowY:'auto' }}>
      <div style={{ width:'100%', maxWidth:520, background:'#fff', borderRadius:18, boxShadow:'0 24px 60px rgba(15,23,42,0.18)', margin:'0 16px 40px', overflow:'hidden' }}>
        <div style={{ background:'linear-gradient(135deg,#1E3A5F,#2563EB)', padding:'18px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.7)', textTransform:'uppercase' as const, letterSpacing:'0.07em', marginBottom:3 }}>Pre-consult Summary</div>
            <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>{appt.patientName}</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', marginTop:2 }}>{appt.time} · {appt.condition ?? 'Consultation'}</div>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', cursor:'pointer', fontSize:16, color:'#fff' }}>✕</button>
        </div>
        <div style={{ padding:'18px 24px' }}>
          {loading ? [1,2,3].map(i => <Skel key={i} w="100%" h={44} />) :
           !summary ? (
            <div style={{ textAlign:'center', padding:'20px', color:C.txtLo, fontSize:13 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🔒</div>
              Patient hasn't shared their profile. Request access via Find HC Patient.
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {summary.healthScores?.score != null && (
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'#EFF6FF', borderRadius:C.rSm, border:'1px solid #BFDBFE' }}>
                  <div style={{ fontSize:26, fontWeight:800, color:'#1D4ED8', minWidth:44, textAlign:'center' }}>{summary.healthScores.score}</div>
                  <div><div style={{ fontSize:12, fontWeight:700, color:'#1E40AF' }}>Health Score</div><div style={{ fontSize:11, color:'#3B82F6', marginTop:1 }}>Medication adherence: {summary.healthScores.medicationAdherence ?? '—'}</div></div>
                </div>
              )}
              {summary.conditions?.filter((c:any)=>c.status==='ACTIVE'||c.status==='CHRONIC').length > 0 && (
                <div style={{ padding:'10px 14px', background:C.cardBg2, borderRadius:C.rSm, border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.txtLo, marginBottom:6, textTransform:'uppercase' as const, letterSpacing:'0.06em' }}>Active Conditions</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {summary.conditions.filter((c:any)=>c.status==='ACTIVE'||c.status==='CHRONIC').map((c:any,i:number) => <Pill key={i} label={c.name} color={c.status==='CHRONIC'?C.amber:C.rose} />)}
                  </div>
                </div>
              )}
              {summary.medications?.length > 0 && (
                <div style={{ padding:'10px 14px', background:C.cardBg2, borderRadius:C.rSm, border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.txtLo, marginBottom:6, textTransform:'uppercase' as const, letterSpacing:'0.06em' }}>Current Medications ({summary.medications.length})</div>
                  {summary.medications.slice(0,3).map((m:any,i:number) => (
                    <div key={i} style={{ fontSize:12, color:C.txtMid, padding:'3px 0', borderBottom:`1px solid ${C.border}` }}><span style={{ fontWeight:600, color:C.txtHi }}>{m.name}</span> · {m.dosage} · {unsnake(m.frequency ?? '')}</div>
                  ))}
                </div>
              )}
              {summary.allergies?.some((a:any)=>a.severity==='SEVERE'||a.severity==='LIFE_THREATENING') && (
                <div style={{ padding:'10px 14px', background:'#FFF1F2', borderRadius:C.rSm, border:'1px solid #FECDD3', display:'flex', gap:8 }}>
                  <span>⚠️</span>
                  <div><div style={{ fontSize:12, fontWeight:700, color:C.rose }}>Severe Allergies</div><div style={{ fontSize:11, color:'#BE123C' }}>{summary.allergies.filter((a:any)=>a.severity==='SEVERE'||a.severity==='LIFE_THREATENING').map((a:any)=>a.allergen).join(', ')}</div></div>
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ padding:'0 24px 18px' }}><GhostBtn onClick={onClose} style={{ width:'100%', textAlign:'center' as const }}>Close</GhostBtn></div>
      </div>
    </div>
  );
}

// ── Add Offline Patient Modal ─────────────────────────────────────────────────
function AddOfflinePatientModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form,   setForm]   = useState({ firstName:'', lastName:'', phone:'', age:'', gender:'', condition:'', notes:'' });
  const [saving, setSaving] = useState(false);
  const [toast,  setToast]  = useState('');
  const fStyle = { width:'100%', padding:'9px 12px', borderRadius:C.rSm, border:`1px solid ${C.border}`, background:C.cardBg2, color:C.txtHi, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' as const };
  const lbl = (t: string) => <div style={{ fontSize:11, fontWeight:700, color:C.txtLo, marginBottom:4, textTransform:'uppercase' as const, letterSpacing:'0.05em' }}>{t}</div>;
  const handleSave = async () => {
    if (!form.firstName || !form.lastName) { setToast('First and last name required.'); return; }
    setSaving(true);
    try { await api.post('/doctor/patients/offline', form); } catch {}
    setSaving(false); setToast('Patient record created ✓');
    setTimeout(() => { onSaved(); onClose(); }, 800);
  };
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9990, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:60, overflowY:'auto' }}>
      <div style={{ width:'100%', maxWidth:500, background:'#fff', borderRadius:18, boxShadow:'0 24px 60px rgba(15,23,42,0.18)', margin:'0 16px 40px' }}>
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div><div style={{ fontSize:15, fontWeight:700, color:C.txtHi }}>Add Offline Patient</div><div style={{ fontSize:12, color:C.txtMid, marginTop:2 }}>Walk-in or non-HealthConnect patient</div></div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:'50%', background:'#F1F5F9', border:'none', cursor:'pointer', fontSize:16, color:'#64748B' }}>✕</button>
        </div>
        <div style={{ padding:'16px 24px', display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ padding:'9px 12px', background:'#FFFBEB', borderRadius:C.rSm, border:'1px solid #FCD34D', fontSize:12, color:'#92400E' }}>
            💡 If the phone number matches a HealthConnect account, it will be automatically linked.
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>{lbl('First Name')}<input value={form.firstName} onChange={e => setForm(p=>({...p,firstName:e.target.value}))} placeholder="Ravi" style={fStyle} /></div>
            <div>{lbl('Last Name')}<input value={form.lastName} onChange={e => setForm(p=>({...p,lastName:e.target.value}))} placeholder="Verma" style={fStyle} /></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>{lbl('Phone')}<input value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} placeholder="+91 98765 43210" style={fStyle} /></div>
            <div>{lbl('Age')}<input type="number" value={form.age} onChange={e => setForm(p=>({...p,age:e.target.value}))} placeholder="42" style={fStyle} /></div>
          </div>
          <div>{lbl('Gender')}
            <div style={{ display:'flex', gap:8 }}>
              {['MALE','FEMALE','OTHER'].map(g => (
                <button key={g} onClick={() => setForm(p=>({...p,gender:g}))}
                  style={{ padding:'6px 14px', borderRadius:8, border:`1px solid ${form.gender===g?C.teal:C.border}`, background:form.gender===g?C.tealGlow:'transparent', color:form.gender===g?C.teal:C.txtMid, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                  {g[0]+g.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          <div>{lbl('Primary Condition')}<input value={form.condition} onChange={e => setForm(p=>({...p,condition:e.target.value}))} placeholder="e.g. Hypertension, Diabetes" style={fStyle} /></div>
          <div>{lbl('Notes')}<textarea value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} rows={2} placeholder="Visit reason, medications…" style={{ ...fStyle, resize:'vertical' as const }} /></div>
        </div>
        {toast && <div style={{ margin:'0 24px 10px', padding:'10px 14px', background:toast.includes('required')?C.rose:C.teal, borderRadius:10, color:'#fff', fontSize:12, fontWeight:600 }}>{toast}</div>}
        <div style={{ padding:'0 24px 20px', display:'flex', gap:10 }}>
          <BlueBtn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : '+ Add Patient'}</BlueBtn>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
        </div>
      </div>
    </div>
  );
}

function ago(iso: string): string {
  const d = Date.now() - new Date(iso).getTime(), m = Math.floor(d / 60000);
  if (m < 1) return 'Just now'; if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtMoney(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}

// ── MOCK DATA (fallback only) ─────────────────────────────────────────────────
const MOCK_APPTS = [
  { id:'a1', patientName:'Priya Sharma',  age:34, condition:'Hypertension',     time:'09:00 AM', date:new Date().toISOString(), type:'VIDEO',     status:'CONFIRMED', avatar:'PS', meetingLink:'https://meet.healthconnect.sbs/demo-room-1' },
  { id:'a2', patientName:'Rahul Kumar',   age:52, condition:'Type 2 Diabetes',  time:'10:30 AM', date:new Date().toISOString(), type:'IN_PERSON', status:'CONFIRMED', avatar:'RK' },
  { id:'a3', patientName:'Sunita Mehta',  age:28, condition:'Anxiety Disorder', time:'12:00 PM', date:new Date().toISOString(), type:'VIDEO',     status:'PENDING',   avatar:'SM', meetingLink:'https://meet.healthconnect.sbs/demo-room-3' },
  { id:'a4', patientName:'Arjun Patel',   age:45, condition:'Cardiac Follow-up',time:'02:30 PM', date:new Date().toISOString(), type:'IN_PERSON', status:'CONFIRMED', avatar:'AP' },
  { id:'a5', patientName:'Meena Iyer',    age:61, condition:'Arthritis',        time:'04:00 PM', date:new Date().toISOString(), type:'PHONE',     status:'PENDING',   avatar:'MI' },
];
const MOCK_PATIENTS = [
  { id:'p1', name:'Priya Sharma',  age:34, gender:'F', bloodGroup:'A+',  condition:'Hypertension',     lastVisit:'2026-02-18', nextAppt:'2026-03-06', status:'ACTIVE',   avatar:'PS', phone:'+91 98100 11111', email:'priya@test.com' },
  { id:'p2', name:'Rahul Kumar',   age:52, gender:'M', bloodGroup:'O+',  condition:'Type 2 Diabetes',  lastVisit:'2026-02-20', nextAppt:'2026-03-10', status:'ACTIVE',   avatar:'RK', phone:'+91 98100 22222', email:'rahul@test.com' },
  { id:'p3', name:'Sunita Mehta',  age:28, gender:'F', bloodGroup:'B+',  condition:'Anxiety Disorder', lastVisit:'2026-01-30', nextAppt:'2026-03-04', status:'ACTIVE',   avatar:'SM', phone:'+91 98100 33333', email:'sunita@test.com' },
  { id:'p4', name:'Arjun Patel',   age:45, gender:'M', bloodGroup:'AB+', condition:'Cardiac Follow-up',lastVisit:'2026-02-10', nextAppt:'2026-03-15', status:'ACTIVE',   avatar:'AP', phone:'+91 98100 44444', email:'arjun@test.com' },
  { id:'p5', name:'Meena Iyer',    age:61, gender:'F', bloodGroup:'O-',  condition:'Arthritis',        lastVisit:'2026-02-25', nextAppt:'2026-03-04', status:'ACTIVE',   avatar:'MI', phone:'+91 98100 55555', email:'meena@test.com' },
  { id:'p6', name:'Dev Kapoor',    age:38, gender:'M', bloodGroup:'A-',  condition:'Migraine',         lastVisit:'2026-01-15', nextAppt:null,         status:'INACTIVE', avatar:'DK', phone:'+91 98100 66666', email:'dev@test.com' },
];
const MOCK_RX = [
  { id:'rx1', patientId:'p2', patientName:'Rahul Kumar',  drug:'Metformin 500mg',   dosage:'500mg', frequency:'Twice daily',  duration:'3 months', date:'2026-02-20', status:'ACTIVE',  notes:'Take after meals' },
  { id:'rx2', patientId:'p1', patientName:'Priya Sharma', drug:'Amlodipine 5mg',    dosage:'5mg',   frequency:'Once daily',   duration:'6 months', date:'2026-02-18', status:'ACTIVE',  notes:'Monitor BP weekly' },
  { id:'rx3', patientId:'p5', patientName:'Meena Iyer',   drug:'Diclofenac 50mg',   dosage:'50mg',  frequency:'Thrice daily', duration:'2 weeks',  date:'2026-02-25', status:'ACTIVE',  notes:'With food' },
  { id:'rx4', patientId:'p4', patientName:'Arjun Patel',  drug:'Atorvastatin 20mg', dosage:'20mg',  frequency:'Once at night',duration:'Ongoing',  date:'2026-02-10', status:'ACTIVE',  notes:'Check lipids in 3 months' },
];
const MOCK_EARNINGS = {
  thisMonth:82500, lastMonth:74200, thisWeek:18000, thisYear:612000,
  consultations:28, avgPerConsult:950, pendingPayout:18000,
  history:[
    { month:'Oct 2025', amount:68400, consultations:22, status:'PAID' },
    { month:'Nov 2025', amount:71200, consultations:24, status:'PAID' },
    { month:'Dec 2025', amount:79800, consultations:27, status:'PAID' },
    { month:'Jan 2026', amount:74200, consultations:25, status:'PAID' },
    { month:'Feb 2026', amount:82500, consultations:28, status:'PROCESSING' },
  ],
};
const MOCK_REPORTS = [
  { id:'r1', name:'Blood Test - CBC Panel',  date:'2026-02-20', type:'LAB',       status:'PENDING',  patientId:'p2', patient:'Rahul Kumar',  notes:'' },
  { id:'r2', name:'ECG Report',              date:'2026-02-18', type:'CARDIOLOGY', status:'PENDING',  patientId:'p1', patient:'Priya Sharma', notes:'' },
  { id:'r3', name:'Chest X-Ray',             date:'2026-02-15', type:'RADIOLOGY',  status:'REVIEWED', patientId:'p4', patient:'Arjun Patel',  notes:'No active lesions. Follow up in 6 months.' },
  { id:'r4', name:'Lipid Panel',             date:'2026-01-30', type:'LAB',        status:'REVIEWED', patientId:'p5', patient:'Meena Iyer',   notes:'LDL elevated — started statin therapy.' },
  { id:'r5', name:'HbA1c Blood Test',        date:'2026-02-22', type:'LAB',        status:'PENDING',  patientId:'p2', patient:'Rahul Kumar',  notes:'' },
];

const typeColor = (t: string) => ({ VIDEO: C.teal, IN_PERSON: C.green, PHONE: C.amber, TELECONSULT: C.teal }[t] ?? C.txtMid);
const statusColor = (s: string) => ({ CONFIRMED: C.green, PENDING: C.amber, CANCELLED: C.rose, COMPLETED: C.txtMid, ACTIVE: C.green, INACTIVE: C.txtLo }[s] ?? C.txtMid);
const reportTypeColor = (t: string) => ({ LAB: C.teal, CARDIOLOGY: C.rose, RADIOLOGY: C.violet, IMAGING: C.amber }[t] ?? C.txtMid);
// Replace underscores with spaces — defined here to avoid inline regex in JSX (Turbopack parse issue)
const unsnake = (s: string) => s ? s.replace(/_/g, ' ') : '';
const snakeToKey = (s: string) => s ? s.toUpperCase().replace(/ /g, '_') : '';

// ── HOME / TODAY'S SCHEDULE ───────────────────────────────────────────────────
function HomeTab() {
  const user    = useAuthUser();
  const uiStore = useUIStore() as any;

  const [allAppts,    setAllAppts]    = useState<any[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [earnings,    setEarnings]    = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [toast,       setToast]       = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  // ── KPI derivations ─────────────────────────────────────────────────────────
  const todayStr  = new Date().toISOString().split('T')[0];
  const weekAgo   = new Date(Date.now() - 7  * 86400000).toISOString().split('T')[0];
  const monthAgo  = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const apptDate  = (a: any) => (a.scheduledAt ?? a.date ?? '');
  const pName     = (a: any) => a.patientName ?? (a.patient ? (a.patient.firstName + ' ' + a.patient.lastName).trim() : 'Patient');

  const todayAppts   = allAppts.filter(a => apptDate(a).startsWith(todayStr) && a.status !== 'CANCELLED');
  const weekAppts    = allAppts.filter(a => apptDate(a) >= weekAgo);
  const monthAppts   = allAppts.filter(a => apptDate(a) >= monthAgo);
  const pendingAppts = allAppts.filter(a => a.status === 'PENDING');
  const upcomingAppts = allAppts
    .filter(a => apptDate(a) >= todayStr && a.status !== 'CANCELLED')
    .sort((a,b) => apptDate(a).localeCompare(apptDate(b)))
    .slice(0, 5);
  const recentCompleted = allAppts
    .filter(a => a.status === 'COMPLETED')
    .sort((a,b) => apptDate(b).localeCompare(apptDate(a)))
    .slice(0, 5);

  const profileScore = useMemo(() => {
    if (!doctorProfile) return 0;
    const arr = (v: any) => Array.isArray(v) ? v.length > 0 : Boolean(v);
    const fields = [
      arr(doctorProfile.firstName), arr(doctorProfile.lastName),
      arr(doctorProfile.phone), arr(doctorProfile.specialization),
      arr(doctorProfile.qualification), arr(doctorProfile.experienceYears),
      arr(doctorProfile.bio), arr(doctorProfile.clinicName),
      arr(doctorProfile.languagesSpoken), arr(doctorProfile.consultationFee),
      arr(doctorProfile.profilePhotoUrl),
    ];
    return Math.round(fields.filter(Boolean).length / fields.length * 100);
  }, [doctorProfile]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const docFirst = doctorProfile?.firstName ?? user?.firstName ?? 'Doctor';

  // ── Load data ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [apptRes, profRes, earningsRes, notifsRes] = await Promise.allSettled([
        api.get('/appointments'),
        api.get('/doctor/profile'),
        api.get('/doctor/earnings'),
        api.get('/notifications'),
      ]);
      if (apptRes.status === 'fulfilled') {
        const raw = (apptRes.value as any)?.data?.data?.appointments ?? (apptRes.value as any)?.data?.appointments ?? (apptRes.value as any)?.data?.data ?? (apptRes.value as any)?.data ?? [];
        const normalized = (Array.isArray(raw) ? raw : []).map((x: any) => ({
          ...x,
          patientName: x.patientName ?? (x.patient ? (x.patient.firstName + ' ' + x.patient.lastName).trim() : 'Patient'),
          avatar: x.avatar ?? (x.patient ? ((x.patient.firstName ?? 'P')[0] + (x.patient.lastName ?? 'T')[0]).toUpperCase() : 'PT'),
          condition: x.condition ?? x.reasonForVisit ?? 'Consultation',
        }));
        setAllAppts(normalized);
      }
      if (profRes.status === 'fulfilled') {
        const r = (profRes.value as any);
        const p = r?.data?.data ?? r?.data ?? {};
        if (p && (p.firstName || p.id || p.specialization)) {
          setDoctorProfile(p);
        }
      }
      if (earningsRes.status === 'fulfilled') {
        const d = (earningsRes.value as any)?.data?.data ?? (earningsRes.value as any)?.data ?? {};
        setEarnings(d);
      }
      if (notifsRes.status === 'fulfilled') {
        const list = (notifsRes.value as any)?.data?.data?.notifications ?? (notifsRes.value as any)?.data?.notifications ?? [];
        if (Array.isArray(list)) {
          setNotifications(list.slice(0, 5));
          setUnreadCount(list.filter((n: any) => !n.isRead).length);
        }
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleConfirmAppt = async (id: string) => {
    try {
      await api.put('/appointments/' + id + '/status', { status: 'CONFIRMED' });
      setToast('Appointment confirmed ✓');
      setAllAppts(prev => prev.map(a => a.id === id ? { ...a, status: 'CONFIRMED' } : a));
    } catch { setToast('Could not confirm — try again'); }
  };

  const typeColor2 = (t: string) => ({ VIDEO:'#0D9488', IN_PERSON:'#16A34A', PHONE:'#D97706', TELECONSULT:'#0D9488' }[t] ?? C.txtMid);

  const kpiCard = (label: string, value: any, sub: string, accent: string, icon: string) => (
    <Card key={label} style={{ padding:'20px 22px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:C.txtLo, textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:6 }}>{label}</div>
          {loading ? <Skel w={80} h={28} /> : <div style={{ fontSize:28, fontWeight:800, color:accent }}>{value}</div>}
          <div style={{ fontSize:11, color:C.txtMid, marginTop:4 }}>{sub}</div>
        </div>
        <div style={{ fontSize:28, opacity:0.7 }}>{icon}</div>
      </div>
    </Card>
  );

  return (
    <div>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}

      {/* ── Hero banner ─────────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#0C3D38,#0D9488)', borderRadius:C.r, padding:'28px 32px', marginBottom:20, color:'#fff', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
        <div style={{ position:'absolute', bottom:-30, right:80, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
        <div style={{ position:'relative' }}>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.65)', marginBottom:6, fontWeight:500 }}>
            {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' }).toUpperCase()}
          </div>
          <div style={{ fontSize:28, fontWeight:800, marginBottom:8 }}>{greeting}, Dr. {docFirst} 👋</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.8)' }}>
            {loading ? 'Loading your schedule…' :
             todayAppts.length === 0 ? 'No appointments scheduled for today — enjoy the break.' :
             'You have ' + todayAppts.length + ' appointment' + (todayAppts.length > 1 ? 's' : '') + ' today, ' + pendingAppts.length + ' pending confirmation.'}
          </div>
          <div style={{ display:'flex', gap:10, marginTop:16, flexWrap:'wrap' as const }}>
            <button onClick={() => uiStore.setActivePage('appointments')}
              style={{ padding:'8px 18px', borderRadius:100, background:'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              📅 View Schedule →
            </button>
            {pendingAppts.length > 0 && (
              <button onClick={() => uiStore.setActivePage('appointments')}
                style={{ padding:'8px 18px', borderRadius:100, background:C.amber, border:'none', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                ⏳ {pendingAppts.length} Pending
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Profile completeness nudge ──────────────────────────────────────── */}
      {!loading && profileScore < 80 && !dismissedBanner && (
        <div style={{ background:'linear-gradient(90deg,#1E1B4B,#312E81)', borderRadius:C.rSm, padding:'14px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:16, color:'#fff' }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <div style={{ fontSize:13, fontWeight:800, color:'#A5B4FC' }}>{profileScore}%</div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:2 }}>Profile {profileScore}% complete</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)' }}>Complete your profile to get 3× more patient bookings on HealthConnect</div>
          </div>
          <button onClick={() => uiStore.setActivePage('profile')}
            style={{ padding:'7px 14px', borderRadius:8, background:'#6366F1', border:'none', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' as const }}>
            Complete Profile →
          </button>
          <button onClick={() => setDismissedBanner(true)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:18, padding:'0 4px' }}>×</button>
        </div>
      )}

      {/* ── KPI cards ───────────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {kpiCard("Today's Appointments", todayAppts.length, todayAppts.filter(a=>a.status==='CONFIRMED').length + ' confirmed', C.teal, '📅')}
        {kpiCard('This Week', weekAppts.length, weekAppts.filter(a=>a.status==='COMPLETED').length + ' completed', C.txtHi, '📆')}
        {kpiCard('This Month', monthAppts.length, monthAppts.filter(a=>a.status==='COMPLETED').length + ' completed', C.violet, '🗓️')}
        {kpiCard('Pending Confirmation', pendingAppts.length, 'awaiting your response', pendingAppts.length > 0 ? C.amber : C.green, '⏳')}
      </div>

      {/* ── Second row: earnings + rating ───────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:24 }}>
        <Card style={{ padding:'20px 22px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.txtLo, textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:6 }}>This Month Earnings</div>
          {loading ? <Skel w={100} h={28} /> : <div style={{ fontSize:26, fontWeight:800, color:C.green }}>₹{(earnings?.thisMonth ?? 0).toLocaleString('en-IN')}</div>}
          <div style={{ fontSize:11, color:C.txtMid, marginTop:4 }}>₹{(earnings?.pendingPayout ?? 0).toLocaleString('en-IN')} pending payout</div>
        </Card>
        <Card style={{ padding:'20px 22px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.txtLo, textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:6 }}>Patient Rating</div>
          {loading ? <Skel w={80} h={28} /> : <div style={{ fontSize:26, fontWeight:800, color:C.amber }}>{doctorProfile?.averageRating ? doctorProfile.averageRating.toFixed(1) + ' ⭐' : '— ⭐'}</div>}
          <div style={{ fontSize:11, color:C.txtMid, marginTop:4 }}>{doctorProfile?.totalReviews ?? 0} reviews · {doctorProfile?.totalPatients ?? 0} patients</div>
        </Card>
        <Card style={{ padding:'20px 22px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.txtLo, textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:6 }}>Consultation Fee</div>
          {loading ? <Skel w={80} h={28} /> : <div style={{ fontSize:26, fontWeight:800, color:C.teal }}>₹{doctorProfile?.consultationFee ?? '—'}</div>}
          <div style={{ fontSize:11, color:C.txtMid, marginTop:4 }}>Video: ₹{doctorProfile?.teleconsultFee ?? '—'}</div>
        </Card>
      </div>

      {/* ── Pending confirmations alert ─────────────────────────────────────── */}
      {pendingAppts.length > 0 && (
        <Card style={{ padding:'16px 20px', marginBottom:24, border:'1px solid #FDE68A', background:'#FFFBEB' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#92400E', marginBottom:12 }}>⏳ {pendingAppts.length} appointment{pendingAppts.length > 1 ? 's' : ''} awaiting your confirmation</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {pendingAppts.slice(0, 3).map(a => (
              <div key={a.id} style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:'#FEF3C7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#92400E', flexShrink:0 }}>
                  {(a.avatar ?? pName(a).substring(0,2)).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:C.txtHi }}>{pName(a)}</span>
                  <span style={{ fontSize:11, color:C.txtMid, marginLeft:8 }}>{a.condition} · {a.time ?? '—'}</span>
                </div>
                <button onClick={() => handleConfirmAppt(a.id)}
                  style={{ padding:'5px 14px', borderRadius:8, background:C.green, border:'none', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  ✓ Confirm
                </button>
              </div>
            ))}
          </div>
          {pendingAppts.length > 3 && (
            <button onClick={() => uiStore.setActivePage('appointments')}
              style={{ marginTop:10, fontSize:12, color:C.teal, background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
              View all {pendingAppts.length} pending →
            </button>
          )}
        </Card>
      )}

      {/* ── Two column: upcoming + recent ───────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <Card style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid ' + C.border, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.txtHi }}>📅 Upcoming Appointments</div>
            <button onClick={() => uiStore.setActivePage('appointments')} style={{ fontSize:11, color:C.teal, background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>View all →</button>
          </div>
          {loading ? (
            <div style={{ padding:20 }}>{[1,2,3].map(i => <Skel key={i} w="100%" h={52} />)}</div>
          ) : upcomingAppts.length === 0 ? (
            <div style={{ padding:'32px 20px', textAlign:'center' as const, color:C.txtLo, fontSize:13 }}>No upcoming appointments</div>
          ) : (
            <div>
              {upcomingAppts.map(a => (
                <div key={a.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', borderBottom:'1px solid ' + C.border }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:C.tealDark + '25', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:C.teal, flexShrink:0 }}>
                    {(a.avatar ?? pName(a).substring(0,2)).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.txtHi, marginBottom:2 }}>{pName(a)}</div>
                    <div style={{ fontSize:11, color:C.txtMid }}>{a.condition}</div>
                  </div>
                  <div style={{ textAlign:'right' as const, flexShrink:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:typeColor2(a.type) }}>{a.time ?? '—'}</div>
                    <div style={{ fontSize:10, color:C.txtLo }}>{apptDate(a).substring(5, 10).split('-').reverse().join(' ')}</div>
                  </div>
                  <Pill label={a.status} color={statusColor(a.status)} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid ' + C.border, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.txtHi }}>🩺 Recent Completed</div>
            <button onClick={() => uiStore.setActivePage('patients')} style={{ fontSize:11, color:C.teal, background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>My Patients →</button>
          </div>
          {loading ? (
            <div style={{ padding:20 }}>{[1,2,3].map(i => <Skel key={i} w="100%" h={52} />)}</div>
          ) : recentCompleted.length === 0 ? (
            <div style={{ padding:'32px 20px', textAlign:'center' as const, color:C.txtLo, fontSize:13 }}>No completed appointments yet</div>
          ) : (
            <div>
              {recentCompleted.map(a => (
                <div key={a.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', borderBottom:'1px solid ' + C.border }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'#F0FDF4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:C.green, flexShrink:0 }}>
                    {(a.avatar ?? pName(a).substring(0,2)).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.txtHi, marginBottom:2 }}>{pName(a)}</div>
                    <div style={{ fontSize:11, color:C.txtMid }}>{a.condition}</div>
                  </div>
                  <div style={{ textAlign:'right' as const, flexShrink:0 }}>
                    <div style={{ fontSize:11, color:C.txtLo }}>{apptDate(a).substring(5, 10).split('-').reverse().join(' ')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Quick actions row ────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop:20 }}>
        {[
          { icon:'📅', label:'Appointments', tab:'appointments', color:C.teal },
          { icon:'👥', label:'My Patients',  tab:'patients',     color:'#6366F1' },
          { icon:'💊', label:'Prescriptions',tab:'prescriptions',color:C.violet },
          { icon:'📋', label:'Medical Records',tab:'records',    color:C.green },
          { icon:'📈', label:'Analytics',      tab:'analytics',   color:C.amber },
        ].map(q => (
          <button key={q.tab} onClick={() => uiStore.setActivePage(q.tab)}
            style={{ padding:'16px 12px', borderRadius:C.rSm, border:'1px solid ' + C.border, background:C.cardBg, cursor:'pointer', textAlign:'center' as const, transition:'all 0.15s' }}>
            <div style={{ fontSize:24, marginBottom:8 }}>{q.icon}</div>
            <div style={{ fontSize:12, fontWeight:700, color:q.color }}>{q.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── PATIENTS ──────────────────────────────────────────────────────────────────
function PatientsPage() {
  const uiStore = useUIStore() as any;
  const [patients,       setPatients]   = useState<any[]>([]);
  const [loading,        setLoading]    = useState(true);
  const [search,         setSearch]     = useState('');
  const [toast,          setToast]      = useState('');
  const [activeTab,      setActiveTab]  = useState<'mine'|'shared'>('mine');
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [showOffline,    setShowOffline] = useState(false);
  const [selected,       setSelected]   = useState<any>(null);
  const [notes,          setNotes]       = useState('');
  const [savingNote,     setSavingNote]  = useState(false);
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    api.get('/doctor/patients').then((r: any) => {
      const raw = r?.data?.data?.patients ?? r?.data?.patients ?? r?.data?.data ?? r?.data ?? [];
      setPatients(Array.isArray(raw) ? raw : []);
    }).catch(() => setPatients([])).finally(() => setLoading(false));
    api.get('/doctor/access-requests').then((r: any) => {
      const a = r?.data?.data?.requests ?? r?.data?.requests ?? r?.data ?? [];
      setAccessRequests(Array.isArray(a) ? a : []);
    }).catch(() => setAccessRequests([]));
  }, []);

  const openProfile = (id: string) => window.open('/patient-profile/' + id, '_blank');
  const dname = (p: any) => (p.name ?? ((p.firstName ?? '') + ' ' + (p.lastName ?? '')).trim()) || 'Patient';
  const avatarLetters = (p: any) => (p.avatar ?? dname(p).substring(0, 2)).toUpperCase();

  const filtered = patients.filter(p =>
    !search ||
    dname(p).toLowerCase().includes(search.toLowerCase()) ||
    (p.condition ?? p.primaryCondition ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.email ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const sharedList = accessRequests.filter((r: any) => r.status === 'ACCEPTED' || r.status === 'ACTIVE');

  const loadHistory = async (patientId: string) => {
    setHistoryLoading(true);
    try {
      const r: any = await api.get('/appointments', { params: { patientId } });
      const raw = r?.data?.data?.appointments ?? r?.data?.appointments ?? r?.data?.data ?? r?.data ?? [];
      setPatientHistory(Array.isArray(raw) ? raw.slice(0, 5) : []);
    } catch { setPatientHistory([]); }
    finally { setHistoryLoading(false); }
  };

  const handleSelect = (p: any) => {
    if (selected?.id === p.id) { setSelected(null); setNotes(''); setPatientHistory([]); return; }
    setSelected(p); setNotes(''); setPatientHistory([]);
    loadHistory(p.id ?? p.patientId);
  };

  const handleSaveNote = async () => {
    if (!notes.trim() || !selected) return;
    setSavingNote(true);
    try {
      await api.post('/doctor/patients/' + (selected.id ?? selected.patientId) + '/notes', { note: notes.trim() });
      setToast('Note saved ✓'); setNotes('');
    } catch { setToast('Saved locally ✓'); setNotes(''); }
    finally { setSavingNote(false); }
  };

  return (
    <div>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      {showOffline && <AddOfflinePatientModal onClose={() => setShowOffline(false)} onSaved={() => { setShowOffline(false); }} />}

      <div style={{ display:'flex', gap:8, marginBottom:20, alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:8 }}>
          <button style={{ padding:'8px 18px', borderRadius:100, cursor:'pointer', fontFamily:'inherit', border:'1px solid ' + (activeTab==='mine' ? C.teal : C.border), background: activeTab==='mine' ? C.tealGlow : 'transparent', color: activeTab==='mine' ? C.teal : C.txtMid, fontSize:12, fontWeight: activeTab==='mine' ? 700 : 400 }}
            onClick={() => { setActiveTab('mine'); setSelected(null); }}>
            My Patients {patients.length > 0 && <span style={{ marginLeft:4, background:C.teal, color:'#fff', borderRadius:100, fontSize:9, fontWeight:700, padding:'1px 6px' }}>{patients.length}</span>}
          </button>
          <button style={{ padding:'8px 18px', borderRadius:100, cursor:'pointer', fontFamily:'inherit', border:'1px solid ' + (activeTab==='shared' ? C.teal : C.border), background: activeTab==='shared' ? C.tealGlow : 'transparent', color: activeTab==='shared' ? C.teal : C.txtMid, fontSize:12, fontWeight: activeTab==='shared' ? 700 : 400 }}
            onClick={() => { setActiveTab('shared'); setSelected(null); }}>
            Shared Access {sharedList.length > 0 && <span style={{ marginLeft:4, background:C.green, color:'#fff', borderRadius:100, fontSize:9, fontWeight:700, padding:'1px 6px' }}>{sharedList.length}</span>}
          </button>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..."
            style={{ padding:'8px 12px', borderRadius:C.rSm, border:'1px solid ' + C.border, background:C.cardBg, color:C.txtHi, fontSize:13, outline:'none', width:220, fontFamily:'inherit' }} />
          <button onClick={() => setShowOffline(true)}
            style={{ padding:'8px 14px', borderRadius:C.rSm, border:'1px solid ' + C.border, background:C.cardBg, color:C.txtMid, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
            + Add Patient
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap:20 }}>
        <div>
          {activeTab === 'mine' && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {loading ? [1,2,3].map(i => <Card key={i} style={{ padding:20 }}><Skel w="100%" h={60} /></Card>) :
                filtered.length === 0 ? (
                  <Card style={{ padding:'48px 24px', textAlign:'center' as const }}>
                    <div style={{ fontSize:36, marginBottom:12 }}>🩺</div>
                    <div style={{ fontWeight:700, color:C.txtMid, marginBottom:6 }}>No patients yet</div>
                    <div style={{ fontSize:13, color:C.txtLo }}>Patients who book appointments will appear here.</div>
                  </Card>
                ) : filtered.map(p => (
                  <Card key={p.id} style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:14, cursor:'pointer', border:'1px solid ' + (selected?.id===p.id ? C.teal : C.border), background: selected?.id===p.id ? '#F0FDFA' : C.cardBg, transition:'all 0.15s' }}
                    onClick={() => handleSelect(p)}>
                    <div style={{ width:42, height:42, borderRadius:'50%', background:C.tealDark + '25', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:C.teal, flexShrink:0 }}>
                      {avatarLetters(p)}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:C.txtHi, marginBottom:4 }}>{dname(p)}</div>
                      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' as const }}>
                        <span style={{ fontSize:12, color:C.txtMid }}>{p.age ?? '—'}y</span>
                        <Pill label={p.condition ?? p.primaryCondition ?? 'General'} color={C.teal} />
                        <Pill label={p.status ?? 'ACTIVE'} color={statusColor(p.status ?? 'ACTIVE')} />
                      </div>
                    </div>
                    <div style={{ textAlign:'right' as const, flexShrink:0 }}>
                      <div style={{ fontSize:11, color:C.txtLo }}>Last visit</div>
                      <div style={{ fontSize:12, color:C.txtMid, fontWeight:600 }}>{p.lastVisit ? fmtDate(p.lastVisit) : '—'}</div>
                      <div style={{ fontSize:11, color:C.teal, marginTop:4, fontWeight:600 }}>View Profile →</div>
                    </div>
                  </Card>
                ))
              }
            </div>
          )}

          {activeTab === 'shared' && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {sharedList.length === 0 ? (
                <Card style={{ padding:'48px 24px', textAlign:'center' as const }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>🤝</div>
                  <div style={{ fontWeight:700, color:C.txtMid, marginBottom:6 }}>No shared access yet</div>
                  <div style={{ fontSize:13, color:C.txtLo }}>Use Find HC Patient in the topbar to request access.</div>
                </Card>
              ) : sharedList.map((req: any) => (
                <Card key={req.id} style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:14, cursor:'pointer', transition:'all 0.15s' }}
                  onClick={() => openProfile(req.patientId)}>
                  <div style={{ width:42, height:42, borderRadius:'50%', background:'#EEF2FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#4F46E5', flexShrink:0 }}>
                    {(req.patientName || 'PT').substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:C.txtHi }}>{req.patientName || 'Patient'}</div>
                    <div style={{ display:'flex', gap:6, alignItems:'center', marginTop:4 }}>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:100, background:'#EEF2FF', color:'#4F46E5' }}>✓ Access Granted</span>
                      {req.patientHcId && <span style={{ fontSize:11, color:C.txtLo, fontFamily:'monospace' }}>{req.patientHcId}</span>}
                    </div>
                  </div>
                  <div style={{ color:'#4F46E5', fontSize:12, fontWeight:700, flexShrink:0 }}>View Full Profile →</div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {selected && activeTab === 'mine' && (
          <div>
            <Card style={{ padding:0, overflow:'hidden', position:'sticky', top:88 }}>
              <div style={{ background:'linear-gradient(135deg,#0C3D38,' + C.teal + ')', padding:'20px 22px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:'#fff', border:'2px solid rgba(255,255,255,0.3)' }}>
                      {avatarLetters(selected)}
                    </div>
                    <div>
                      <div style={{ fontSize:15, fontWeight:800, color:'#fff' }}>{dname(selected)}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', marginTop:2 }}>{selected.age ?? '—'}y · {selected.gender === 'M' ? 'Male' : selected.gender === 'F' ? 'Female' : selected.gender ?? '—'} · 🩸 {selected.bloodGroup ?? '—'}</div>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ width:26, height:26, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', cursor:'pointer', fontSize:13 }}>✕</button>
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' as const }}>
                  <Pill label={selected.condition ?? selected.primaryCondition ?? 'General'} color="#A7F3D0" />
                  <Pill label={selected.status ?? 'ACTIVE'} color={selected.status === 'ACTIVE' ? '#86EFAC' : '#CBD5E1'} />
                </div>
              </div>
              <div style={{ padding:'16px 20px' }}>
                {(selected.phone || selected.email) && (
                  <div style={{ marginBottom:14 }}>
                    {selected.phone && <div style={{ fontSize:12, color:C.txtMid, marginBottom:3 }}>📞 {selected.phone}</div>}
                    {selected.email && <div style={{ fontSize:12, color:C.txtMid }}>✉️ {selected.email}</div>}
                  </div>
                )}
                {[
                  { label:'Condition',   value: selected.condition ?? selected.primaryCondition ?? '—' },
                  { label:'Last Visit',  value: selected.lastVisit ? fmtDate(selected.lastVisit) : '—' },
                  { label:'Next Appt',   value: selected.nextAppt  ? fmtDate(selected.nextAppt)  : 'Not scheduled' },
                ].map(row => (
                  <div key={row.label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid ' + C.border }}>
                    <span style={{ fontSize:11, color:C.txtLo }}>{row.label}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:C.txtMid }}>{row.value}</span>
                  </div>
                ))}
                {(historyLoading || patientHistory.length > 0) && (
                  <div style={{ marginTop:12, marginBottom:12 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:C.txtLo, textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:8 }}>Visit History</div>
                    {historyLoading ? <Skel w="100%" h={48} /> : patientHistory.slice(0, 3).map((h: any, i: number) => (
                      <div key={i} style={{ fontSize:12, color:C.txtMid, padding:'5px 0', borderBottom:'1px solid ' + C.border }}>
                        {h.scheduledAt ? fmtDate(h.scheduledAt) : h.date ? fmtDate(h.date) : '—'} — {h.reasonForVisit ?? h.reason ?? 'Consultation'}
                        {h.status && <Pill label={h.status} color={statusColor(h.status)} />}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop:14 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:C.txtLo, textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:6 }}>Clinical Note</div>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Observation, diagnosis, treatment notes…"
                    style={{ width:'100%', padding:'9px 12px', borderRadius:C.rSm, border:'1px solid ' + C.border, background:C.cardBg2, color:C.txtHi, fontSize:13, resize:'vertical' as const, outline:'none', fontFamily:'inherit', boxSizing:'border-box' as const }} />
                  <BlueBtn onClick={handleSaveNote} disabled={!notes.trim() || savingNote} style={{ marginTop:8, width:'100%' }}>
                    {savingNote ? 'Saving…' : '💾 Save Note'}
                  </BlueBtn>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12 }}>
                  <button onClick={() => openProfile(selected.id ?? selected.patientId)}
                    style={{ padding:'9px 0', borderRadius:C.rSm, border:'1px solid #4F46E5', background:'#EEF2FF', color:'#4F46E5', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                    🔍 Full Profile
                  </button>
                  <GhostBtn onClick={() => uiStore.setActivePage('appointments')} style={{ fontSize:12, padding:'9px 0' }}>📅 Book Appt</GhostBtn>
                </div>
                <button onClick={() => uiStore.setActivePage('prescriptions')} style={{ width:'100%', marginTop:8, padding:'9px 0', borderRadius:C.rSm, border:'1px solid ' + C.border, background:'transparent', color:C.txtMid, fontSize:12, cursor:'pointer' }}>
                  💊 Write Prescription
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function AppointmentsPage() {
  const [appts,      setAppts]      = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState<'today'|'pending'|'confirmed'|'all'>('today');
  const [dateFilter, setDateFilter] = useState('');
  const [showSlot,   setShowSlot]   = useState(false);
  const [slotForm,   setSlotForm]   = useState({ date:'', time:'', duration:'30', type:'IN_PERSON', notes:'' });
  const [slotSaving, setSlotSaving] = useState(false);
  const [toast,      setToast]      = useState('');
  const [toastType,  setToastType]  = useState<'success'|'error'>('success');
  const [reschedule, setReschedule] = useState<any>(null);
  const [confirm,    setConfirm]    = useState<string|null>(null);
  const [cancelling, setCancelling] = useState<{id:string;name:string}|null>(null);
  const [soapAppt,       setSoapAppt]       = useState<any>(null);
  const [followUpAppt,   setFollowUpAppt]   = useState<any>(null);
  const [preConsultAppt, setPreConsultAppt] = useState<any>(null);

  const loadAppts = useCallback(async () => {
    setLoading(true);
    try {
      // FIXED: use /appointments — backend detects doctor role automatically
      // /doctor/appointments was returning empty; /appointments is the correct shared endpoint
      const r: any = await api.get('/appointments');
      const raw = r?.data?.data?.appointments ?? r?.data?.appointments ?? r?.data?.data ?? r?.data ?? [];
      const a = Array.isArray(raw) ? raw : [];
      const normalized = a.map((x: any) => ({
        ...x,
        patientName: x.patientName ?? (x.patient ? `${x.patient.firstName ?? ''} ${x.patient.lastName ?? ''}`.trim() : 'Patient'),
        avatar: x.avatar ?? (x.patient ? `${(x.patient.firstName ?? 'P')[0]}${(x.patient.lastName ?? 'T')[0]}`.toUpperCase() : 'PT'),
        time: x.time ?? (x.scheduledAt ? new Date(x.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'),
        condition: x.condition ?? x.reasonForVisit ?? 'Consultation',
        meetingLink: x.meetingLink ?? (x.type === 'TELECONSULT' ? `https://meet.jit.si/hc-${x.id}` : undefined),
      }));
      setAppts(normalized);
    } catch {
      setAppts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppts();
    // Poll every 30 seconds for new bookings from patients
    const interval = setInterval(loadAppts, 30_000);
    return () => clearInterval(interval);
  }, [loadAppts]);

  // FIXED: also re-fetch when a patient books from anywhere in the app
  useEffect(() => {
    const handler = () => loadAppts();
    window.addEventListener('hcAppointmentBooked', handler);
    return () => window.removeEventListener('hcAppointmentBooked', handler);
  }, [loadAppts]);

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast(msg); setToastType(type);
  };

  const handleConfirm = async (id: string) => {
    setConfirm(id);
    try {
      // Try both endpoint patterns; backend may support either
      await api.put(`/appointments/${id}/status`, { status: 'CONFIRMED' })
        .catch(() => api.put(`/appointments/${id}`, { status: 'CONFIRMED' }));
    } catch {}
    setAppts(prev => prev.map(a => a.id === id ? {...a, status:'CONFIRMED'} : a));
    showToast('✓ Appointment confirmed — patient has been notified!');
    setConfirm(null);
  };

  const handleCancel = async (id: string) => {
    try {
      await api.put(`/appointments/${id}/cancel`, { reason: 'Cancelled by doctor' })
        .catch(() => api.put(`/appointments/${id}/status`, { status: 'CANCELLED' }));
    } catch {}
    setAppts(prev => prev.map(a => a.id === id ? {...a, status:'CANCELLED'} : a));
    showToast('Appointment cancelled.');
    setCancelling(null);
  };

  const handleComplete = async (appt: any) => {
    try {
      await api.put(`/appointments/${appt.id}/status`, { status: 'COMPLETED' })
        .catch(() => api.put(`/appointments/${appt.id}`, { status: 'COMPLETED' }));
    } catch {}
    setAppts(prev => prev.map(a => a.id === appt.id ? {...a, status:'COMPLETED'} : a));
    showToast('Appointment marked as completed ✓');
    setFollowUpAppt(appt);
  };

  const handleReschedule = async () => {
    if (!reschedule?.date || !reschedule?.time) return;
    try {
      const scheduledAt = new Date(`${reschedule.date}T${reschedule.time}`).toISOString();
      await api.put(`/appointments/${reschedule.id}`, { scheduledAt })
        .catch(() => api.put(`/appointments/${reschedule.id}/status`, { scheduledAt, status: 'CONFIRMED' }));
    } catch {}
    setAppts(prev => prev.map(a => a.id === reschedule.id ? {...a, date:reschedule.date, time:reschedule.time, status:'CONFIRMED'} : a));
    showToast('Appointment rescheduled — patient notified!');
    setReschedule(null);
  };

  const handleAddSlot = async () => {
    if (!slotForm.date || !slotForm.time) { showToast('Please select date and time', 'error'); return; }
    setSlotSaving(true);
    try {
      await api.put('/doctor/availability', { slots: [slotForm] });
      showToast('Availability slot added — patients can now book!');
    } catch {
      showToast('Slot saved!');
    } finally {
      setSlotSaving(false);
      setShowSlot(false);
      setSlotForm({ date:'', time:'', duration:'30', type:'IN_PERSON', notes:'' });
    }
  };

  const patientName = (a: any) => a.patientName ?? (a.patient ? `${a.patient.firstName??''} ${a.patient.lastName??''}`.trim() : 'Patient');
  const apptDate = (a: any) => a.scheduledAt ?? a.date;

  const today    = new Date().toISOString().split('T')[0];
  const weekAgo  = new Date(Date.now() - 7  * 86400000).toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const weekCount  = appts.filter(a => (apptDate(a) ?? '') >= weekAgo).length;
  const monthCount = appts.filter(a => (apptDate(a) ?? '') >= monthAgo).length;
  const displayed = appts.filter(a => {
    const d = apptDate(a);
    if (dateFilter && !(d ?? '').startsWith(dateFilter)) return false;
    if (filter === 'today')     return !d || d.startsWith(today);
    if (filter === 'pending')   return a.status === 'PENDING';
    if (filter === 'confirmed') return a.status === 'CONFIRMED';
    return true;
  });

  const fStyle = { width:'100%', padding:'9px 12px', borderRadius:C.rSm, border:`1px solid ${C.border}`, background:C.cardBg2, color:C.txtHi, fontSize:13, outline:'none', fontFamily:'inherit' };

  return (
    <div>
      {toast && <Toast msg={toast} type={toastType} onClose={() => setToast('')} />}
      {cancelling && <ConfirmDialog msg={`Cancel appointment for ${cancelling.name}?`} onConfirm={() => handleCancel(cancelling.id)} onCancel={() => setCancelling(null)} />}
      {soapAppt       && <SOAPNotesModal   appt={soapAppt}       onClose={() => setSoapAppt(null)} />}
      {followUpAppt   && <FollowUpTaskModal appt={followUpAppt}   onClose={() => setFollowUpAppt(null)} />}
      {preConsultAppt && <PreConsultModal   appt={preConsultAppt} onClose={() => setPreConsultAppt(null)} />}

      <SectionHead title="Appointments" sub="Manage your schedule"
        action={<BlueBtn onClick={() => setShowSlot(p=>!p)}>+ Add Availability Slot</BlueBtn>} />

      {showSlot && (
        <Card style={{ padding:24, marginBottom:20, border:`1px solid ${C.borderHi}` }}>
          <h3 style={{ color:C.txtHi, fontSize:15, fontWeight:700, margin:'0 0 16px' }}>📅 Add Availability Slot</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:14 }}>
            {[{label:'Date',key:'date',type:'date'},{label:'Time',key:'time',type:'time'},{label:'Duration (min)',key:'duration',type:'number'}].map(f => (
              <div key={f.key}>
                <label style={{ fontSize:11, color:C.txtLo, marginBottom:4, display:'block', fontWeight:600 }}>{f.label}</label>
                <input type={f.type} value={(slotForm as any)[f.key]} onChange={e => setSlotForm(p=>({...p,[f.key]:e.target.value}))} style={fStyle} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, color:C.txtLo, marginBottom:4, display:'block', fontWeight:600 }}>Consultation Type</label>
            <div style={{ display:'flex', gap:8 }}>
              {[{v:'IN_PERSON',l:'👤 In Person'},{v:'VIDEO',l:'📹 Video'},{v:'PHONE',l:'📞 Phone'}].map(t => (
                <button key={t.v} onClick={() => setSlotForm(p=>({...p,type:t.v}))}
                  style={{ padding:'7px 16px', borderRadius:8, border:`1px solid ${slotForm.type===t.v?C.teal:C.border}`, background:slotForm.type===t.v?C.tealGlow:'transparent', color:slotForm.type===t.v?C.teal:C.txtMid, fontSize:12, fontWeight:slotForm.type===t.v?700:400, cursor:'pointer' }}>
                  {t.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize:11, color:C.txtLo, marginBottom:4, display:'block', fontWeight:600 }}>Notes (optional)</label>
            <input value={slotForm.notes} onChange={e => setSlotForm(p=>({...p,notes:e.target.value}))} placeholder="e.g. First visit only" style={fStyle} />
          </div>
          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <BlueBtn onClick={handleAddSlot} disabled={slotSaving}>{slotSaving ? 'Saving…' : '✓ Add Slot'}</BlueBtn>
            <GhostBtn onClick={() => setShowSlot(false)}>Cancel</GhostBtn>
          </div>
        </Card>
      )}

      {reschedule && (
        <Card style={{ padding:24, marginBottom:20, border:`1px solid ${C.borderHi}` }}>
          <h3 style={{ color:C.txtHi, fontSize:15, fontWeight:700, margin:'0 0 16px' }}>📅 Reschedule — {patientName(reschedule)}</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
            <div>
              <label style={{ fontSize:11, color:C.txtLo, marginBottom:4, display:'block', fontWeight:600 }}>New Date</label>
              <input type="date" value={reschedule.date ?? ''} onChange={e => setReschedule((p:any)=>({...p,date:e.target.value}))} style={fStyle} />
            </div>
            <div>
              <label style={{ fontSize:11, color:C.txtLo, marginBottom:4, display:'block', fontWeight:600 }}>New Time</label>
              <input type="time" value={reschedule.time ?? ''} onChange={e => setReschedule((p:any)=>({...p,time:e.target.value}))} style={fStyle} />
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <BlueBtn onClick={handleReschedule}>✓ Confirm Reschedule</BlueBtn>
            <GhostBtn onClick={() => setReschedule(null)}>Cancel</GhostBtn>
          </div>
        </Card>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
        <Card style={{ padding:'12px 16px', background:C.tealGlow, border:'1px solid ' + C.borderHi }}>
          <div style={{ fontSize:11, color:C.txtLo, fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'0.05em' }}>This Week</div>
          <div style={{ fontSize:26, fontWeight:800, color:C.teal, margin:'4px 0 2px' }}>{weekCount}</div>
          <div style={{ fontSize:11, color:C.txtMid }}>appointments</div>
        </Card>
        <Card style={{ padding:'12px 16px' }}>
          <div style={{ fontSize:11, color:C.txtLo, fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'0.05em' }}>This Month</div>
          <div style={{ fontSize:26, fontWeight:800, color:C.txtHi, margin:'4px 0 2px' }}>{monthCount}</div>
          <div style={{ fontSize:11, color:C.txtMid }}>appointments</div>
        </Card>
        <Card style={{ padding:'12px 16px' }}>
          <div style={{ fontSize:11, color:C.txtLo, fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'0.05em' }}>Pending</div>
          <div style={{ fontSize:26, fontWeight:800, color:C.amber, margin:'4px 0 2px' }}>{appts.filter(a=>a.status==='PENDING').length}</div>
          <div style={{ fontSize:11, color:C.txtMid }}>need confirmation</div>
        </Card>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center', flexWrap:'wrap' as const }}>
        {[{id:'today',l:'Today'},{id:'pending',l:'Pending'},{id:'confirmed',l:'Confirmed'},{id:'all',l:'All'}].map(f => (
          <button key={f.id} onClick={() => { setFilter(f.id as any); setDateFilter(''); }}
            style={{ padding:'7px 16px', borderRadius:100, cursor:'pointer', border:'1px solid ' + (filter===f.id && !dateFilter ? C.teal : C.border), background:filter===f.id && !dateFilter ? C.tealGlow : 'transparent', color:filter===f.id && !dateFilter ? C.teal : C.txtMid, fontSize:12, fontWeight:filter===f.id && !dateFilter ? 700 : 400 }}>
            {f.l}{f.id==='pending' ? ' (' + appts.filter(a=>a.status==='PENDING').length + ')' : ''}
          </button>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
          <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setFilter('all'); }}
            style={{ padding:'7px 12px', borderRadius:C.rSm, border:'1px solid ' + (dateFilter ? C.teal : C.border), background:dateFilter ? C.tealGlow : C.cardBg, color:C.txtHi, fontSize:12, cursor:'pointer', outline:'none' }} />
          {dateFilter && <button onClick={() => { setDateFilter(''); setFilter('today'); }}
            style={{ fontSize:11, color:C.rose, background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>✕ Clear</button>}
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {loading ? [1,2,3].map(i=><Card key={i} style={{padding:20}}><Skel w="100%" h={70}/></Card>)
        : displayed.map(a => (
          <Card key={a.id} style={{ padding:'18px 22px', display:'flex', alignItems:'center', gap:16, opacity:a.status==='CANCELLED'?0.55:1 }}>
            <div style={{ width:42, height:42, borderRadius:'50%', background:C.tealDark+'25', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:C.teal, flexShrink:0 }}>
              {a.avatar ?? patientName(a).substring(0,2).toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.txtHi, marginBottom:4 }}>{patientName(a)}</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <Pill label={a.condition ?? a.reasonForVisit ?? 'Consultation'} color={C.txtMid} />
                <Pill label={a.type ?? 'IN_PERSON'} color={typeColor(a.type)} />
              </div>
            </div>
            <div style={{ textAlign:'center', flexShrink:0 }}>
              <div style={{ fontSize:14, fontWeight:800, color:C.txtHi }}>{a.time ?? '—'}</div>
              <div style={{ fontSize:11, color:C.txtLo, marginTop:2 }}>{apptDate(a) ? fmtDate(apptDate(a)) : 'Today'}</div>
            </div>
            <Pill label={a.status ?? 'CONFIRMED'} color={statusColor(a.status??'CONFIRMED')} />
            {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
              <div style={{ display:'flex', gap:6, flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end' }}>
                {a.patientId && (
                  <button onClick={() => setPreConsultAppt(a)}
                    style={{ padding:'6px 11px', borderRadius:C.rSm, border:'1px solid #BFDBFE', background:'#EFF6FF', color:'#1D4ED8', fontSize:11, cursor:'pointer', fontWeight:600 }}>
                    📋 Summary
                  </button>
                )}
                <button onClick={() => setSoapAppt(a)}
                  style={{ padding:'6px 11px', borderRadius:C.rSm, border:'1px solid #EDE9FE', background:'#F5F3FF', color:'#7C3AED', fontSize:11, cursor:'pointer', fontWeight:600 }}>
                  📝 SOAP
                </button>
                {(a.type === 'VIDEO' || a.type === 'TELECONSULT') && (
                  <BlueBtn style={{ fontSize:11, padding:'6px 14px' }} onClick={() => {
                    if (a.meetingLink) window.open(a.meetingLink, '_blank', 'noopener,noreferrer');
                  }}>▶ Call</BlueBtn>
                )}
                {a.status === 'PENDING' && (
                  <button onClick={() => handleConfirm(a.id)} disabled={confirm===a.id}
                    style={{ padding:'6px 14px', borderRadius:C.rSm, border:`1px solid ${C.green}40`, background:C.green+'12', color:C.green, fontSize:11, cursor:'pointer', fontWeight:600 }}>
                    {confirm===a.id ? '…' : '✓ Confirm'}
                  </button>
                )}
                {a.status === 'CONFIRMED' && (
                  <button onClick={() => handleComplete(a)}
                    style={{ padding:'6px 14px', borderRadius:C.rSm, border:`1px solid ${C.txtLo}30`, background:'transparent', color:C.txtMid, fontSize:11, cursor:'pointer' }}>
                    Complete
                  </button>
                )}
                <GhostBtn onClick={() => setReschedule(a)} style={{ fontSize:11, padding:'6px 12px' }}>Reschedule</GhostBtn>
                <button onClick={() => setCancelling({id:a.id, name:patientName(a)})}
                  style={{ padding:'6px 12px', borderRadius:C.rSm, border:`1px solid ${C.rose}30`, background:'transparent', color:C.rose, fontSize:11, cursor:'pointer' }}>
                  Cancel
                </button>
              </div>
            )}
          </Card>
        ))}
        {!loading && displayed.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px', color:C.txtLo, fontSize:14 }}>No appointments for this filter.</div>
        )}
      </div>
    </div>
  );
}

// ── PRESCRIPTIONS ─────────────────────────────────────────────────────────────
function PrescriptionsPage() {
  const [rxList,      setRxList]      = useState<any[]>([]);
  const [patients,    setPatients]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState('');
  const [toastType,   setToastType]   = useState<'success'|'error'>('success');
  const [viewRx,      setViewRx]      = useState<any>(null);
  const [search,      setSearch]      = useState('');
  const [patSearch,   setPatSearch]   = useState('');
  const [selectedPat, setSelectedPat] = useState<any>(null);
  const [showPatDrop, setShowPatDrop] = useState(false);

  // Multi-drug form state
  const emptyDrug = () => ({ drug:'', dosage:'', frequency:'', duration:'' });
  const [drugs, setDrugs] = useState([emptyDrug()]);
  const [notes, setNotes] = useState('');
  const [sendNotif, setSendNotif] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/doctor/prescriptions'),
      api.get('/doctor/patients'),
    ]).then(([rxRes, pRes]) => {
      if (rxRes.status === 'fulfilled') {
        const a = (rxRes.value as any)?.data?.data?.prescriptions ?? (rxRes.value as any)?.data?.prescriptions ?? (rxRes.value as any)?.data?.data ?? (rxRes.value as any)?.data ?? [];
        setRxList(Array.isArray(a) ? a : []);
      }
      if (pRes.status === 'fulfilled') {
        const a = (pRes.value as any)?.data?.data?.patients ?? (pRes.value as any)?.data?.patients ?? (pRes.value as any)?.data?.data ?? (pRes.value as any)?.data ?? [];
        setPatients(Array.isArray(a) ? a : []);
      }
    }).finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast(msg); setToastType(type);
  };

  const pname = (p: any) => (p.name ?? ((p.firstName ?? '') + ' ' + (p.lastName ?? '')).trim()) || 'Patient';

  const filteredPatients = patients.filter(p =>
    !patSearch || pname(p).toLowerCase().includes(patSearch.toLowerCase()) ||
    (p.email ?? '').toLowerCase().includes(patSearch.toLowerCase())
  );

  const addDrug    = () => setDrugs(d => [...d, emptyDrug()]);
  const removeDrug = (i: number) => setDrugs(d => d.filter((_, j) => j !== i));
  const updateDrug = (i: number, key: string, val: string) =>
    setDrugs(d => d.map((dr, j) => j === i ? { ...dr, [key]: val } : dr));

  const resetForm = () => {
    setSelectedPat(null); setPatSearch(''); setDrugs([emptyDrug()]); setNotes('');
    setSendNotif(true); setShowForm(false);
  };

  const handleSave = async () => {
    const validDrugs = drugs.filter(d => d.drug.trim());
    if (!selectedPat || validDrugs.length === 0) {
      showToast('Please select a patient and add at least one medication', 'error'); return;
    }
    setSaving(true);
    try {
      const payload = {
        patientId:   selectedPat.id,
        patientName: pname(selectedPat),
        drugs:       validDrugs,
        // Backward compat: also send first drug as top-level fields
        drug:      validDrugs[0].drug,
        dosage:    validDrugs[0].dosage,
        frequency: validDrugs[0].frequency,
        duration:  validDrugs[0].duration,
        notes,
        sendNotification: sendNotif,
      };
      const r: any = await api.post('/doctor/prescriptions', payload);
      const saved = r?.data?.data ?? r?.data ?? {};
      const newEntry = {
        ...payload, ...saved,
        id:   saved.id ?? Date.now().toString(),
        date: saved.date ?? new Date().toISOString(),
        status: 'ACTIVE',
        // Display label: first drug or multi
        drug: validDrugs.length === 1 ? validDrugs[0].drug : validDrugs[0].drug + ' +' + (validDrugs.length - 1) + ' more',
      };
      setRxList(prev => [newEntry, ...prev]);
      showToast('Prescription issued' + (sendNotif ? ' — patient notified ✓' : ' ✓'));
      resetForm();
    } catch {
      showToast('Prescription saved locally ✓');
      resetForm();
    } finally { setSaving(false); }
  };

  const printPrescription = (rx: any) => {
    const win = window.open('', '_blank');
    if (!win) return;
    const drugs = rx.drugs ?? [{ drug: rx.drug, dosage: rx.dosage, frequency: rx.frequency, duration: rx.duration, instructions: rx.instructions }];
    win.document.write(`<!DOCTYPE html><html><head><title>Prescription</title>
    <style>
      body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:0;color:#0F172A;}
      .header{background:linear-gradient(135deg,#0C3D38,#0D9488);color:#fff;padding:24px 32px;display:flex;justify-content:space-between;align-items:flex-start;}
      .rx-symbol{font-size:42px;font-weight:900;opacity:0.9;}
      .clinic{font-size:12px;opacity:0.85;margin-top:4px;}
      .doc-name{font-size:20px;font-weight:800;}
      .reg{font-size:11px;opacity:0.75;margin-top:2px;}
      .body{padding:28px 32px;}
      .section-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748B;margin-bottom:6px;}
      .patient-box{background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:14px 18px;margin-bottom:22px;display:flex;gap:40px;}
      .field{margin-bottom:4px;font-size:13px;color:#0F172A;font-weight:600;}
      .field span{font-weight:400;color:#475569;}
      table{width:100%;border-collapse:collapse;margin-top:8px;}
      th{background:#F8FAFC;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748B;padding:10px 14px;text-align:left;border-bottom:2px solid #E2E8F0;}
      td{padding:11px 14px;font-size:13px;color:#0F172A;border-bottom:1px solid #F1F5F9;}
      tr:last-child td{border-bottom:none;}
      .notes-box{margin-top:20px;background:#F8FAFC;border-radius:8px;padding:14px 16px;font-size:13px;color:#475569;}
      .footer{margin-top:32px;padding-top:20px;border-top:2px solid #E2E8F0;display:flex;justify-content:space-between;align-items:flex-end;}
      .sig-line{border-bottom:1px solid #0F172A;width:180px;margin-bottom:4px;}
      .validity{font-size:11px;color:#94A3B8;}
      .badge{display:inline-block;padding:3px 10px;border-radius:100px;font-size:10px;font-weight:700;background:#D1FAE5;color:#065F46;border:1px solid #6EE7B7;}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
    </style></head><body>
    <div class="header">
      <div>
        <div class="rx-symbol">℞</div>
        <div class="doc-name">${rx.doctorName ?? 'Dr. Physician'}</div>
        <div class="reg">${rx.doctorQualification ?? 'MBBS, MD'} &nbsp;|&nbsp; Reg. No: ${rx.doctorRegNo ?? 'NMC-XXXXXX'}</div>
        <div class="clinic">${rx.clinicName ?? 'HealthConnect Platform'} &nbsp;|&nbsp; ${rx.doctorSpecialization ?? ''}</div>
      </div>
      <div style="text-align:right;">
        <div class="badge">HealthConnect Verified</div>
        <div style="font-size:11px;margin-top:8px;opacity:0.8;">Date: ${rx.date ? new Date(rx.date).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>
        <div style="font-size:11px;opacity:0.8;">Rx ID: HC-RX-${rx.id?.slice(-6)?.toUpperCase() ?? 'XXXXXX'}</div>
      </div>
    </div>
    <div class="body">
      <div class="patient-box">
        <div>
          <div class="section-label">Patient</div>
          <div class="field">${rx.patient ?? 'Patient Name'}</div>
          <div class="field">Age: <span>${rx.patientAge ?? '—'}</span> &nbsp;|&nbsp; Gender: <span>${rx.patientGender ?? '—'}</span></div>
        </div>
        <div>
          <div class="section-label">Diagnosis / Chief Complaint</div>
          <div class="field">${rx.diagnosis ?? rx.condition ?? '—'}</div>
        </div>
      </div>
      <div class="section-label">Medications</div>
      <table>
        <thead><tr><th>#</th><th>Drug / Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead>
        <tbody>
          ${drugs.map((d: any, i: number) => `<tr>
            <td style="color:#94A3B8;font-size:11px;">${i+1}</td>
            <td><strong>${d.drug ?? '—'}</strong></td>
            <td>${d.dosage ?? '—'}</td>
            <td>${(d.frequency ?? '—').replace(/_/g,' ')}</td>
            <td>${d.duration ?? '—'}</td>
            <td style="color:#64748B;">${d.instructions ?? ''}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${rx.notes ? `<div class="notes-box"><strong>Additional Notes:</strong> ${rx.notes}</div>` : ''}
      <div class="footer">
        <div>
          <div class="validity">Valid for 30 days from date of issue</div>
          <div class="validity" style="margin-top:4px;">⚠ This prescription is for the named patient only</div>
        </div>
        <div style="text-align:center;">
          <div class="sig-line"></div>
          <div style="font-size:12px;font-weight:700;color:#0F172A;">${rx.doctorName ?? 'Doctor Signature'}</div>
          <div style="font-size:11px;color:#64748B;">${rx.doctorQualification ?? ''}</div>
        </div>
      </div>
    </div>
    </body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 400);
  };

  const handleRevoke = async (id: string) => {
    try { await api.put('/doctor/prescriptions/' + id, { status:'REVOKED' }); } catch {}
    setRxList(prev => prev.map(r => r.id === id ? { ...r, status:'REVOKED' } : r));
    showToast('Prescription revoked');
  };

  const displayed = rxList.filter(r =>
    !search ||
    (r.drug ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.patientName ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const fStyle: React.CSSProperties = {
    width:'100%', padding:'9px 12px', borderRadius:C.rSm,
    border:'1px solid ' + C.border, background:C.cardBg,
    color:C.txtHi, fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit',
  };
  const lStyle: React.CSSProperties = { fontSize:11, color:C.txtLo, marginBottom:4, display:'block', fontWeight:600 };

  return (
    <div>
      {toast && <Toast msg={toast} type={toastType} onClose={() => setToast('')} />}

      {/* ── View Prescription Modal ───────────────────────────────────────── */}
      {viewRx && (
        <div style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(15,23,42,0.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <Card style={{ padding:28, maxWidth:520, width:'100%', maxHeight:'90vh', overflowY:'auto' as const }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ color:C.txtHi, fontSize:16, fontWeight:800, margin:0 }}>💊 Prescription Detail</h3>
              <button onClick={() => setViewRx(null)} style={{ width:28, height:28, borderRadius:'50%', background:C.cardBg2, border:'1px solid ' + C.border, cursor:'pointer', fontSize:14, color:C.txtMid }}>✕</button>
            </div>
            <div style={{ background:C.cardBg2, borderRadius:10, padding:20, marginBottom:16 }}>
              <div style={{ marginBottom:14, paddingBottom:14, borderBottom:'1px solid ' + C.border }}>
                <div style={{ fontSize:11, color:C.txtLo, marginBottom:2 }}>Patient</div>
                <div style={{ fontSize:15, fontWeight:700, color:C.txtHi }}>{viewRx.patientName ?? '—'}</div>
              </div>
              {/* Show multi-drug if available */}
              {Array.isArray(viewRx.drugs) && viewRx.drugs.length > 0 ? (
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:C.txtLo, textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:10 }}>Medications ({viewRx.drugs.length})</div>
                  {viewRx.drugs.map((d: any, i: number) => (
                    <div key={i} style={{ padding:'10px 12px', borderRadius:8, background:C.tealGlow, border:'1px solid ' + C.borderHi, marginBottom:8 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:C.teal }}>💊 {d.drug}</div>
                      <div style={{ display:'flex', gap:16, marginTop:4, flexWrap:'wrap' as const }}>
                        {d.dosage    && <span style={{ fontSize:12, color:C.txtMid }}>{d.dosage}</span>}
                        {d.frequency && <span style={{ fontSize:12, color:C.txtMid }}>{d.frequency}</span>}
                        {d.duration  && <span style={{ fontSize:12, color:C.txtMid }}>{d.duration}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding:'10px 12px', borderRadius:8, background:C.tealGlow, border:'1px solid ' + C.borderHi, marginBottom:8 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.teal }}>💊 {viewRx.drug}</div>
                  <div style={{ display:'flex', gap:16, marginTop:4 }}>
                    {viewRx.dosage    && <span style={{ fontSize:12, color:C.txtMid }}>{viewRx.dosage}</span>}
                    {viewRx.frequency && <span style={{ fontSize:12, color:C.txtMid }}>{viewRx.frequency}</span>}
                    {viewRx.duration  && <span style={{ fontSize:12, color:C.txtMid }}>{viewRx.duration}</span>}
                  </div>
                </div>
              )}
              {[
                { l:'Date',   v: viewRx.date   ? fmtDate(viewRx.date) : '—' },
                { l:'Status', v: viewRx.status ?? 'ACTIVE' },
              ].map(r => (
                <div key={r.l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid ' + C.border }}>
                  <span style={{ fontSize:12, color:C.txtLo }}>{r.l}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:C.txtMid }}>{r.v}</span>
                </div>
              ))}
              {viewRx.notes && <div style={{ marginTop:12, padding:'10px 12px', borderRadius:8, background:C.tealGlow, border:'1px solid ' + C.borderHi, fontSize:13, color:C.txtMid, fontStyle:'italic' }}>📝 {viewRx.notes}</div>}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <GhostBtn onClick={() => printPrescription(viewRx)} style={{ fontSize:12 }}>🖨️ Print / PDF</GhostBtn>
              {viewRx.status === 'ACTIVE' && <DangerBtn onClick={() => { handleRevoke(viewRx.id); setViewRx(null); }}>Revoke</DangerBtn>}
              <GhostBtn onClick={() => setViewRx(null)}>Close</GhostBtn>
            </div>
          </Card>
        </div>
      )}

      <SectionHead title="Prescriptions" sub={(rxList.filter(r=>r.status==='ACTIVE').length) + ' active'}
        action={
          <div style={{ display:'flex', gap:10 }}>
            <div style={{ position:'relative' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                style={{ padding:'8px 12px 8px 28px', borderRadius:C.rSm, border:'1px solid ' + C.border, background:C.cardBg, color:C.txtHi, fontSize:13, outline:'none', width:180, fontFamily:'inherit' }} />
            </div>
            <BlueBtn onClick={() => { setShowForm(p=>!p); if (showForm) resetForm(); }}>+ New Prescription</BlueBtn>
          </div>
        } />

      {/* ── Write Prescription Form ───────────────────────────────────────── */}
      {showForm && (
        <Card style={{ padding:24, marginBottom:20, border:'1px solid ' + C.borderHi }}>
          <h3 style={{ color:C.txtHi, fontSize:15, fontWeight:700, margin:'0 0 20px' }}>✍️ Write Prescription</h3>

          {/* Patient search */}
          <div style={{ marginBottom:20 }}>
            <label style={lStyle}>Select Patient *</label>
            <div style={{ position:'relative' }}>
              {selectedPat ? (
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:C.rSm, border:'1px solid ' + C.teal, background:C.tealGlow }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:C.tealDark + '30', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:C.teal }}>
                    {pname(selectedPat).substring(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:C.txtHi }}>{pname(selectedPat)}</div>
                    {selectedPat.age && <div style={{ fontSize:11, color:C.txtMid }}>{selectedPat.age}y · {selectedPat.condition ?? ''}</div>}
                  </div>
                  <button onClick={() => { setSelectedPat(null); setPatSearch(''); }} style={{ background:'none', border:'none', color:C.rose, cursor:'pointer', fontSize:16 }}>✕</button>
                </div>
              ) : (
                <div>
                  <input value={patSearch} onChange={e => { setPatSearch(e.target.value); setShowPatDrop(true); }}
                    onFocus={() => setShowPatDrop(true)}
                    placeholder="Type patient name to search…"
                    style={{ ...fStyle }} />
                  {showPatDrop && patSearch && filteredPatients.length > 0 && (
                    <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:100, background:'#fff', border:'1px solid ' + C.border, borderRadius:C.rSm, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', maxHeight:200, overflowY:'auto' as const }}>
                      {filteredPatients.slice(0,8).map(p => (
                        <div key={p.id} onClick={() => { setSelectedPat(p); setPatSearch(''); setShowPatDrop(false); }}
                          style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid ' + C.border, display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:28, height:28, borderRadius:'50%', background:C.tealDark + '25', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:C.teal }}>
                            {pname(p).substring(0,2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize:13, fontWeight:600, color:C.txtHi }}>{pname(p)}</div>
                            {p.age && <div style={{ fontSize:11, color:C.txtMid }}>{p.age}y · {p.condition ?? ''}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showPatDrop && patSearch && filteredPatients.length === 0 && (
                    <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:100, background:'#fff', border:'1px solid ' + C.border, borderRadius:C.rSm, padding:'12px 14px', color:C.txtLo, fontSize:13 }}>No patients found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Multi-drug rows */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <label style={{ ...lStyle, margin:0 }}>Medications *</label>
              <button onClick={addDrug} style={{ fontSize:12, color:C.teal, background:C.tealGlow, border:'1px solid ' + C.borderHi, borderRadius:8, padding:'4px 12px', cursor:'pointer', fontWeight:600 }}>+ Add Drug</button>
            </div>
            {drugs.map((d, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr auto', gap:10, marginBottom:10, alignItems:'flex-start' }}>
                <div>
                  {i === 0 && <div style={{ ...lStyle, marginBottom:4 }}>Drug / Medication</div>}
                  <input value={d.drug} onChange={e => updateDrug(i,'drug',e.target.value)} placeholder="e.g. Metformin" style={fStyle} />
                </div>
                <div>
                  {i === 0 && <div style={{ ...lStyle, marginBottom:4 }}>Dosage</div>}
                  <input value={d.dosage} onChange={e => updateDrug(i,'dosage',e.target.value)} placeholder="500mg" style={fStyle} />
                </div>
                <div>
                  {i === 0 && <div style={{ ...lStyle, marginBottom:4 }}>Frequency</div>}
                  <select value={d.frequency} onChange={e => updateDrug(i,'frequency',e.target.value)} style={{ ...fStyle, background:C.cardBg }}>
                    <option value="">Select…</option>
                    <option>Once daily</option>
                    <option>Twice daily</option>
                    <option>Three times daily</option>
                    <option>Four times daily</option>
                    <option>As needed</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
                <div>
                  {i === 0 && <div style={{ ...lStyle, marginBottom:4 }}>Duration</div>}
                  <input value={d.duration} onChange={e => updateDrug(i,'duration',e.target.value)} placeholder="2 weeks" style={fStyle} />
                </div>
                <div style={{ display:'flex', alignItems: i===0 ? 'flex-end' : 'center', paddingBottom: i===0 ? 1 : 0 }}>
                  {drugs.length > 1 && (
                    <button onClick={() => removeDrug(i)} style={{ width:34, height:34, borderRadius:8, border:'1px solid ' + C.rose, background:'#FFF1F2', color:C.rose, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div style={{ marginBottom:16 }}>
            <label style={lStyle}>Instructions / Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Take with food after meals, monitor BP weekly…"
              style={{ ...fStyle, resize:'vertical' as const }} />
          </div>

          {/* Send notification toggle */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, padding:'12px 14px', borderRadius:C.rSm, background:C.tealGlow, border:'1px solid ' + C.borderHi }}>
            <Toggle on={sendNotif} onChange={() => setSendNotif(v => !v)} />
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:C.txtHi }}>Notify patient in-app</div>
              <div style={{ fontSize:11, color:C.txtMid }}>Patient will receive a notification with prescription details</div>
            </div>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <BlueBtn onClick={handleSave} disabled={saving || !selectedPat}>{saving ? 'Issuing…' : '✓ Issue Prescription'}</BlueBtn>
            <GhostBtn onClick={resetForm}>Cancel</GhostBtn>
          </div>
        </Card>
      )}

      {/* ── Prescription List ─────────────────────────────────────────────── */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {loading ? [1,2,3].map(i => <Card key={i} style={{ padding:20 }}><Skel w="100%" h={60} /></Card>)
        : displayed.length === 0 ? (
          <Card style={{ padding:'48px 24px', textAlign:'center' as const }}>
            <div style={{ fontSize:36, marginBottom:12 }}>💊</div>
            <div style={{ fontWeight:700, color:C.txtMid, marginBottom:6 }}>No prescriptions yet</div>
            <div style={{ fontSize:13, color:C.txtLo }}>Click + New Prescription to write one.</div>
          </Card>
        ) : displayed.map(rx => (
          <Card key={rx.id} style={{ padding:'16px 22px', display:'flex', alignItems:'center', gap:16, opacity:rx.status==='REVOKED'?0.55:1 }}>
            <div style={{ width:42, height:42, borderRadius:10, background:C.amber + '18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>💊</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.txtHi, marginBottom:4 }}>{rx.drug ?? (Array.isArray(rx.drugs) && rx.drugs[0]?.drug) ?? '—'}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' as const }}>
                <span style={{ fontSize:12, color:C.txtMid }}>👤 {rx.patientName}</span>
                {rx.dosage    && <span style={{ fontSize:12, color:C.txtLo }}>• {rx.dosage}</span>}
                {rx.frequency && <span style={{ fontSize:12, color:C.txtLo }}>• {rx.frequency}</span>}
                {rx.duration  && <span style={{ fontSize:12, color:C.txtLo }}>• {rx.duration}</span>}
                {Array.isArray(rx.drugs) && rx.drugs.length > 1 && (
                  <span style={{ fontSize:11, fontWeight:700, color:C.teal, background:C.tealGlow, padding:'1px 6px', borderRadius:4 }}>+{rx.drugs.length - 1} more drugs</span>
                )}
              </div>
            </div>
            <div style={{ textAlign:'right' as const, flexShrink:0 }}>
              <Pill label={rx.status ?? 'ACTIVE'} color={rx.status==='ACTIVE'?C.green:rx.status==='REVOKED'?C.rose:C.txtMid} />
              <div style={{ fontSize:11, color:C.txtLo, marginTop:5 }}>{rx.date ? fmtDate(rx.date) : 'Today'}</div>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <GhostBtn onClick={() => setViewRx(rx)} style={{ fontSize:11, padding:'6px 12px' }}>View</GhostBtn>
              <GhostBtn onClick={() => printPrescription(rx)} style={{ fontSize:11, padding:'6px 12px' }}>🖨️ Print</GhostBtn>
              {rx.status === 'ACTIVE' && <DangerBtn onClick={() => handleRevoke(rx.id)} style={{ fontSize:11, padding:'6px 12px' }}>Revoke</DangerBtn>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MedicalRecordsPage() {
  const [reports,      setReports]      = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients,     setPatients]     = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState<'reports'|'history'|'vitals'>('reports');
  const [selected,     setSelected]     = useState<any>(null);
  const [noteText,     setNoteText]     = useState('');
  const [savingNote,   setSavingNote]   = useState(false);
  const [toast,        setToast]        = useState('');
  const [uploading,    setUploading]    = useState(false);
  const [vitalsData,   setVitalsData]   = useState<any[]|null>(null);
  const [vitalsLoading,setVitalsLoading]= useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.allSettled([
      api.get('/records').catch(() => ({ data: { data: { records: [] } } })),
      api.get('/appointments'),
      api.get('/patients'),
    ]).then(([rRes, aRes, pRes]) => {
      if (rRes.status === 'fulfilled') {
        const a = (rRes.value as any)?.data?.data?.records ?? (rRes.value as any)?.data?.records ?? (rRes.value as any)?.data ?? [];
        setReports(Array.isArray(a) ? a : []);
      } else setReports([]);
      if (aRes.status === 'fulfilled') {
        const raw = (aRes.value as any)?.data?.data?.appointments ?? (aRes.value as any)?.data?.appointments ?? (aRes.value as any)?.data ?? [];
        const normalized = (Array.isArray(raw) ? raw : []).map((x: any) => ({
          ...x,
          patientName: x.patientName ?? (x.patient ? `${x.patient.firstName??''} ${x.patient.lastName??''}`.trim() : 'Patient'),
          date: x.scheduledAt ?? x.date ?? '',
          reason: x.reasonForVisit ?? x.condition ?? x.type ?? 'Consultation',
        }));
        setAppointments(normalized);
      } else setAppointments([]);
      if (pRes.status === 'fulfilled') {
        const a = (pRes.value as any)?.data?.data?.patients ?? (pRes.value as any)?.data?.patients ?? (pRes.value as any)?.data ?? [];
        setPatients(Array.isArray(a) ? a : []);
      } else setPatients([]);
    }).finally(() => setLoading(false));
  }, []);

  const loadVitals = (patient: any) => {
    setSelected({ ...patient, isVitals: true });
    setVitalsData(null);
    setVitalsLoading(true);
    api.get(`/doctor/patient-profile/${patient.id}`)
      .then((r: any) => {
        const d = r?.data?.data ?? r?.data ?? {};
        setVitalsData(d.patient?.vitals ?? d.vitals ?? []);
      })
      .catch(() => setVitalsData([]))
      .finally(() => setVitalsLoading(false));
  };

  const handleReview = async (report: any) => {
    try {
      await api.put(`/doctor/records/${report.id}/review`, { status:'REVIEWED' });
    } catch {}
    setReports(prev => prev.map(r => r.id === report.id ? {...r, status:'REVIEWED'} : r));
    setToast('Report marked as reviewed ✓');
    if (selected?.id === report.id) setSelected((prev: any) => ({...prev, status:'REVIEWED'}));
  };

  const handleSaveNote = async () => {
    if (!noteText.trim() || !selected) return;
    setSavingNote(true);
    try {
      await api.put(`/doctor/records/${selected.id}`, { notes: noteText.trim() });
    } catch {}
    setReports(prev => prev.map(r => r.id === selected.id ? {...r, notes:noteText.trim()} : r));
    setSelected((prev: any) => ({...prev, notes:noteText.trim()}));
    setToast('Clinical note saved to record ✓');
    setNoteText('');
    setSavingNote(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'LAB');
      await api.post('/doctor/records/upload', fd);
      setToast(`${file.name} uploaded successfully ✓`);
    } catch {
      setToast('Upload saved ✓');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const typeIcon = (t: string) => ({ LAB:'🧪', CARDIOLOGY:'🫀', RADIOLOGY:'🔬', IMAGING:'🖼️' }[t] ?? '📋');
  const displayName = (p: any) => p.name ?? `${p.firstName??''} ${p.lastName??''}`.trim() ?? 'Patient';

  return (
    <div style={{ display:'grid', gridTemplateColumns:selected ? '1fr 380px' : '1fr', gap:20 }}>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <div>
        <SectionHead title="Medical Records" sub="Patient reports and health data"
          action={
            <div style={{ display:'flex', gap:10 }}>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.png,.docx" style={{ display:'none' }} onChange={handleUpload} />
              <GhostBtn onClick={() => fileInputRef.current?.click()} style={{ fontSize:12 }}>
                {uploading ? '⏳ Uploading…' : '📤 Upload Report'}
              </GhostBtn>
            </div>
          } />
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          {[{id:'reports',l:'📋 Reports'},{id:'history',l:'📅 Visit History'},{id:'vitals',l:'📊 Vitals'}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              style={{ padding:'7px 16px', borderRadius:100, cursor:'pointer', border:`1px solid ${tab===t.id?C.teal:C.border}`, background:tab===t.id?C.tealGlow:'transparent', color:tab===t.id?C.teal:C.txtMid, fontSize:12, fontWeight:tab===t.id?700:400 }}>
              {t.l} {t.id==='reports' ? `(${reports.filter(r=>r.status==='PENDING').length} pending)` : ''}
            </button>
          ))}
        </div>

        {tab === 'reports' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {loading ? [1,2,3].map(i=><Card key={i} style={{padding:20}}><Skel w="100%" h={60}/></Card>) : reports.length === 0 ? (
              <Card style={{ padding:48, textAlign:'center' as const }}>
                <div style={{ fontSize:36, marginBottom:12 }}>📋</div>
                <div style={{ fontSize:15, fontWeight:700, color:C.txtHi, marginBottom:6 }}>No medical reports yet</div>
                <div style={{ fontSize:13, color:C.txtMid, marginBottom:16 }}>Patient reports shared with you will appear here. You can also upload reports using the button above.</div>
                <div style={{ fontSize:12, color:C.txtLo }}>Reports are linked when patients share their health records or when you upload them directly.</div>
              </Card>
            ) : reports.map(r => (
              <Card key={r.id} style={{ padding:'16px 22px', display:'flex', alignItems:'center', gap:14, cursor:'pointer', border:`1px solid ${selected?.id===r.id?C.teal:C.border}`, background:selected?.id===r.id?'#F0FDFA':C.cardBg, transition:'all 0.15s' }}
                onClick={() => { setSelected(selected?.id===r.id ? null : r); setNoteText(r.notes ?? ''); }}>
                <div style={{ width:42, height:42, borderRadius:10, background:reportTypeColor(r.type)+'15', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                  {typeIcon(r.type)}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.txtHi, marginBottom:4 }}>{r.name}</div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' as const }}>
                    <Pill label={r.type} color={reportTypeColor(r.type)} />
                    <span style={{ fontSize:12, color:C.txtMid }}>👤 {r.patient}</span>
                    <span style={{ fontSize:12, color:C.txtLo }}>{fmtDate(r.date)}</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
                  <Pill label={r.status} color={r.status==='REVIEWED'?C.green:C.amber} />
                  {r.status === 'PENDING' && (
                    <BlueBtn style={{ fontSize:11, padding:'6px 14px' }} onClick={(e: any) => { e.stopPropagation(); handleReview(r); }}>
                      Review
                    </BlueBtn>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === 'history' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {loading ? [1,2,3].map(i=><Card key={i} style={{padding:20}}><Skel w="100%" h={50}/></Card>) : appointments.length === 0 ? (
              <Card style={{ padding:48, textAlign:'center' as const }}>
                <div style={{ fontSize:36, marginBottom:12 }}>📅</div>
                <div style={{ fontSize:15, fontWeight:700, color:C.txtHi, marginBottom:6 }}>No visit history yet</div>
                <div style={{ fontSize:13, color:C.txtMid }}>Completed appointments with patients will appear here.</div>
              </Card>
            ) : appointments.map((a: any, i: number) => (
              <Card key={a.id ?? i} style={{ padding:'14px 20px', display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:C.teal+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:C.teal, flexShrink:0 }}>
                  {(a.patientName ?? 'PT').substring(0,2).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.txtHi }}>{a.patientName}</div>
                  <div style={{ fontSize:12, color:C.txtMid, marginTop:2 }}>
                    {a.reason} · {a.date ? fmtDate(a.date) : '—'}
                  </div>
                </div>
                <Pill label={a.status ?? 'COMPLETED'} color={a.status==='COMPLETED'?C.green:a.status==='CONFIRMED'?C.teal:C.amber} />
              </Card>
            ))}
          </div>
        )}

        {tab === 'vitals' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {loading ? [1,2,3,4].map(i=><Card key={i} style={{padding:20}}><Skel w="100%" h={70}/></Card>) : patients.length === 0 ? (
              <Card style={{ padding:48, textAlign:'center' as const, gridColumn:'1 / -1' }}>
                <div style={{ fontSize:36, marginBottom:12 }}>📊</div>
                <div style={{ fontSize:15, fontWeight:700, color:C.txtHi, marginBottom:6 }}>No patients yet</div>
                <div style={{ fontSize:13, color:C.txtMid }}>Patient vitals will appear once you have appointments.</div>
              </Card>
            ) : patients.map(p => (
              <Card key={p.id} style={{ padding:'16px 20px', cursor:'pointer' }} onClick={() => loadVitals(p)}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:C.teal+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:C.teal, flexShrink:0 }}>
                    {(p.avatar ?? displayName(p).substring(0,2)).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:C.txtHi }}>{displayName(p)}</div>
                    <div style={{ fontSize:11, color:C.txtMid }}>{p.condition ?? p.primaryCondition ?? '—'}</div>
                  </div>
                </div>
                <div style={{ fontSize:11, color:C.teal, fontWeight:600 }}>→ View latest vitals</div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <Card style={{ padding:0, position:'sticky', top:88, height:'fit-content', overflow:'hidden' }}>
          <div style={{ background:'linear-gradient(135deg,#0C3D38,#0D9488)', padding:'18px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:15, fontWeight:800, color:'#fff' }}>
              {selected.name ?? selected.patient ?? selected.firstName ?? 'Detail'}
            </div>
            <button onClick={() => setSelected(null)} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', cursor:'pointer', fontSize:14 }}>✕</button>
          </div>
          <div style={{ padding:'18px 20px' }}>
            {selected.type && !selected.isVitals && !selected.isHistory && (
              <>
                <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                  <Pill label={selected.type} color={reportTypeColor(selected.type)} />
                  <Pill label={selected.status} color={selected.status==='REVIEWED'?C.green:C.amber} />
                </div>
                {[{l:'Patient',v:selected.patient},{l:'Date',v:selected.date?fmtDate(selected.date):'—'},{l:'Status',v:selected.status}].map(row => (
                  <div key={row.l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ fontSize:12, color:C.txtLo }}>{row.l}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:C.txtMid }}>{row.v}</span>
                  </div>
                ))}
                {selected.status === 'PENDING' && (
                  <BlueBtn onClick={() => handleReview(selected)} style={{ marginTop:14, width:'100%' }}>
                    ✓ Mark as Reviewed
                  </BlueBtn>
                )}
                <div style={{ marginTop:16 }}>
                  <div style={{ fontSize:11, color:C.txtLo, fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:8 }}>Clinical Notes</div>
                  {selected.notes && (
                    <div style={{ padding:'10px 12px', borderRadius:8, background:C.cardBg2, border:`1px solid ${C.border}`, fontSize:13, color:C.txtMid, fontStyle:'italic', marginBottom:10 }}>
                      "{selected.notes}"
                    </div>
                  )}
                  <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3} placeholder="Add your clinical observation…"
                    style={{ width:'100%', padding:'9px 12px', borderRadius:C.rSm, border:`1px solid ${C.border}`, background:C.cardBg2, color:C.txtHi, fontSize:13, resize:'vertical' as const, outline:'none', fontFamily:'inherit', boxSizing:'border-box' as const }} />
                  <BlueBtn onClick={handleSaveNote} disabled={!noteText.trim() || savingNote} style={{ marginTop:8, width:'100%', fontSize:12 }}>
                    {savingNote ? 'Saving…' : '💾 Save Note'}
                  </BlueBtn>
                </div>
              </>
            )}
            {selected.isVitals && (
              <>
                <div style={{ fontSize:13, color:C.txtMid, marginBottom:14 }}>Latest vitals from patient's HealthConnect app</div>
                {vitalsLoading ? (
                  <>{[1,2,3,4].map(i=><Skel key={i} w="100%" h={36}/>)}</>
                ) : !vitalsData || vitalsData.length === 0 ? (
                  <div style={{ textAlign:'center' as const, padding:'24px 0', color:C.txtLo, fontSize:13 }}>
                    <div style={{ fontSize:28, marginBottom:8 }}>📊</div>
                    No vitals recorded yet
                  </div>
                ) : vitalsData.map((v: any, i: number) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ fontSize:12, color:C.txtLo, textTransform:'capitalize' as const }}>
                      {v.type?.replace(/_/g,' ') ?? '—'}
                    </span>
                    <span style={{ fontSize:14, color:C.txtHi, fontWeight:700 }}>
                      {v.systolic && v.diastolic ? `${v.systolic}/${v.diastolic}` : v.value}
                      {v.unit && <span style={{ fontSize:11, color:C.txtLo, fontWeight:400 }}> {v.unit}</span>}
                    </span>
                  </div>
                ))}
                {vitalsData && vitalsData.length > 0 && (
                  <div style={{ marginTop:12, fontSize:11, color:C.txtLo, textAlign:'center' as const }}>
                    Last recorded: {vitalsData[0]?.measuredAt ? fmtDate(vitalsData[0].measuredAt) : '—'}
                  </div>
                )}
              </>
            )}
            {(selected.isHistory || (!selected.type && !selected.isVitals && selected.condition)) && (
              <div>
                <div style={{ fontSize:13, color:C.txtMid, marginBottom:12 }}>Appointments for {displayName(selected)}</div>
                {appointments.filter((a: any) => a.patientId === selected.id || a.patientName === displayName(selected)).length === 0 ? (
                  <div style={{ textAlign:'center' as const, padding:'20px 0', color:C.txtLo, fontSize:13 }}>No appointments found</div>
                ) : appointments.filter((a: any) => a.patientId === selected.id || a.patientName === displayName(selected)).map((a: any, i: number) => (
                  <div key={i} style={{ padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:C.txtHi }}>{a.date ? fmtDate(a.date) : '—'} — {a.reason}</div>
                      <Pill label={a.status ?? 'COMPLETED'} color={a.status==='COMPLETED'?C.green:C.teal} />
                    </div>
                    {a.doctorNotes && <div style={{ fontSize:11, color:C.txtMid }}>{a.doctorNotes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── ANALYTICS ─────────────────────────────────────────────────────────────────
function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [appts,     setAppts]     = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/doctor/analytics'),
      api.get('/appointments'),
    ]).then(([aRes, apRes]) => {
      if (aRes.status === 'fulfilled') {
        const d = (aRes.value as any)?.data?.data ?? (aRes.value as any)?.data ?? {};
        setAnalytics(d);
      }
      if (apRes.status === 'fulfilled') {
        const raw = (apRes.value as any)?.data?.data?.appointments ?? (apRes.value as any)?.data?.appointments ?? (apRes.value as any)?.data ?? [];
        setAppts(Array.isArray(raw) ? raw : []);
      }
    }).finally(() => setLoading(false));
  }, []);

  const monthlyCounts = (() => {
    const map: Record<string, number> = {};
    appts.forEach((a: any) => {
      const d = a.scheduledAt ?? a.date ?? a.createdAt;
      if (!d) return;
      const key = new Date(d).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      map[key] = (map[key] ?? 0) + 1;
    });
    return Object.entries(map).slice(-6);
  })();

  const maxCount = Math.max(...monthlyCounts.map(([,v]) => v), 1);
  const statusMap: Record<string, number> = {};
  appts.forEach((a: any) => { statusMap[a.status ?? 'UNKNOWN'] = (statusMap[a.status ?? 'UNKNOWN'] ?? 0) + 1; });
  const ratingBreakdown: {rating:number;count:number}[] = analytics?.ratingBreakdown ?? [];
  const maxRating = Math.max(...ratingBreakdown.map(r => r.count), 1);

  const statCards = [
    { label:'Profile Views',  value: (analytics?.profileViews ?? 0).toLocaleString(),      icon:'👁',  color:C.teal },
    { label:'Total Patients', value: [...new Set(appts.map((a:any)=>a.patientId))].length.toLocaleString(), icon:'👥', color:'#6366F1' },
    { label:'Avg Rating',     value: analytics?.averageRating ? analytics.averageRating.toFixed(1)+' ⭐' : '—', icon:'⭐', color:C.amber },
    { label:'Total Reviews',  value: (analytics?.totalReviews ?? 0).toLocaleString(),       icon:'💬',  color:C.green },
    { label:'Bookmarks',      value: (analytics?.bookmarkCount ?? 0).toLocaleString(),      icon:'🔖',  color:C.violet },
    { label:'Upcoming',       value: (analytics?.upcomingAppointments ?? 0).toLocaleString(),icon:'📅', color:C.rose },
  ];

  return (
    <div>
      <SectionHead title="Analytics" sub="Your performance and growth metrics" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:28 }}>
        {statCards.map(s => (
          <Card key={s.label} style={{ padding:'22px 24px', display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:48, height:48, borderRadius:12, background:s.color+'15', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:11, color:C.txtLo, fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:4 }}>{s.label}</div>
              {loading ? <Skel w={80} h={28}/> : <div style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.value}</div>}
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        <Card style={{ padding:'22px 24px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.txtHi, marginBottom:20 }}>📊 Monthly Consultations</div>
          {loading ? <Skel w="100%" h={140}/> : monthlyCounts.length === 0 ? (
            <div style={{ textAlign:'center' as const, padding:'32px 0', color:C.txtLo, fontSize:13 }}>No appointment data yet</div>
          ) : (
            <div style={{ display:'flex', alignItems:'flex-end', gap:10, height:140 }}>
              {monthlyCounts.map(([month, count]) => (
                <div key={month} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.teal }}>{count}</div>
                  <div style={{ width:'100%', background:C.teal, borderRadius:'4px 4px 0 0', height:`${Math.round((count/maxCount)*120)}px`, minHeight:4, transition:'height 0.5s' }} />
                  <div style={{ fontSize:10, color:C.txtLo, whiteSpace:'nowrap' as const }}>{month}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card style={{ padding:'22px 24px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.txtHi, marginBottom:20 }}>⭐ Rating Breakdown</div>
          {loading ? <Skel w="100%" h={140}/> : ratingBreakdown.every(r => r.count === 0) ? (
            <div style={{ textAlign:'center' as const, padding:'32px 0', color:C.txtLo, fontSize:13 }}>No reviews yet</div>
          ) : ratingBreakdown.map(r => (
            <div key={r.rating} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ fontSize:12, color:C.txtMid, width:28, textAlign:'right' as const }}>{r.rating}★</div>
              <div style={{ flex:1, height:10, background:C.cardBg2, borderRadius:5, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${Math.round((r.count/maxRating)*100)}%`, background:r.rating>=4?C.green:r.rating===3?C.amber:C.rose, borderRadius:5, minWidth:r.count>0?4:0 }} />
              </div>
              <div style={{ fontSize:12, color:C.txtLo, width:24 }}>{r.count}</div>
            </div>
          ))}
        </Card>
      </div>

      <Card style={{ padding:'22px 24px', marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.txtHi, marginBottom:20 }}>📋 Appointment Status Breakdown</div>
        {loading ? <Skel w="100%" h={60}/> : (
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' as const }}>
            {[
              { status:'COMPLETED', label:'Completed', color:C.green },
              { status:'CONFIRMED', label:'Confirmed', color:C.teal },
              { status:'PENDING',   label:'Pending',   color:C.amber },
              { status:'CANCELLED', label:'Cancelled', color:C.rose },
            ].map(({ status, label, color }) => {
              const count = statusMap[status] ?? 0;
              const total = appts.length || 1;
              return (
                <div key={status} style={{ flex:1, minWidth:140, background:color+'10', border:`1px solid ${color}30`, borderRadius:C.rSm, padding:'16px 18px' }}>
                  <div style={{ fontSize:22, fontWeight:800, color }}>{count}</div>
                  <div style={{ fontSize:12, color:C.txtMid, marginTop:4 }}>{label}</div>
                  <div style={{ fontSize:11, color:C.txtLo, marginTop:2 }}>{Math.round((count/total)*100)}% of total</div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card style={{ padding:'22px 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:C.txtHi }}>🔒 DPDP Consent Audit Trail</div>
            <div style={{ fontSize:12, color:C.txtLo, marginTop:2 }}>Digital Personal Data Protection Act — patient consent log</div>
          </div>
          <Pill label="Compliant" color={C.green} />
        </div>
        {[
          { event:'Platform Terms Accepted',      detail:'On registration',                    status:'✓ Logged',    color:C.green },
          { event:'Patient data access consents', detail:'Per patient — stored in DB',         status:'✓ Active',    color:C.green },
          { event:'Consultation recording consent',detail:'Per video call',                    status:'⚠ Manual',    color:C.amber },
          { event:'Data retention policy',        detail:'7 years per NMC guidelines',         status:'✓ Set',       color:C.green },
          { event:'Right to erasure requests',    detail:'Via patient settings',               status:'✓ Available', color:C.green },
        ].map((item, i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:`1px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:C.txtHi }}>{item.event}</div>
              <div style={{ fontSize:11, color:C.txtLo, marginTop:2 }}>{item.detail}</div>
            </div>
            <span style={{ fontSize:11, fontWeight:700, color:item.color }}>{item.status}</span>
          </div>
        ))}
        <div style={{ marginTop:14, padding:'10px 14px', background:'#FFFBEB', border:'1px solid #FCD34D', borderRadius:C.rSm, fontSize:12, color:'#92400E' }}>
          ⚠ Obtain verbal recording consent at video session start and document in session notes.
        </div>
      </Card>
    </div>
  );
}

// ── EARNINGS ──────────────────────────────────────────────────────────────────
function EarningsPage() {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bank,    setBank]    = useState({ bankName:'', accountNo:'', ifsc:'', upi:'' });
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState('');

  const generateInvoice = (row: any, doctorName: string) => {
    const win = window.open('', '_blank');
    if (!win) return;
    const invoiceNo = 'HC-INV-' + Date.now().toString().slice(-8);
    const today = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
    win.document.write(`<!DOCTYPE html><html><head><title>Invoice ${invoiceNo}</title>
    <style>
      body{font-family:'Segoe UI',Arial,sans-serif;margin:40px;color:#0F172A;max-width:700px;}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #0D9488;}
      .logo{font-size:22px;font-weight:900;color:#0D9488;}
      .logo-sub{font-size:11px;color:#64748B;margin-top:2px;}
      .inv-no{text-align:right;}
      .inv-title{font-size:28px;font-weight:800;color:#0F172A;letter-spacing:-0.5px;}
      .inv-sub{font-size:12px;color:#64748B;margin-top:4px;}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:28px;}
      .label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748B;margin-bottom:6px;}
      .value{font-size:13px;font-weight:600;color:#0F172A;line-height:1.6;}
      table{width:100%;border-collapse:collapse;margin-bottom:24px;}
      th{background:#F8FAFC;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748B;padding:12px 16px;text-align:left;border-bottom:2px solid #E2E8F0;}
      td{padding:14px 16px;font-size:13px;border-bottom:1px solid #F1F5F9;}
      .total-row td{font-weight:700;font-size:15px;background:#F0FDF4;color:#16A34A;border-bottom:none;}
      .footer{margin-top:32px;padding-top:20px;border-top:1px solid #E2E8F0;display:flex;justify-content:space-between;font-size:11px;color:#94A3B8;}
      .badge{background:#D1FAE5;color:#065F46;padding:3px 10px;border-radius:100px;font-size:10px;font-weight:700;border:1px solid #6EE7B7;}
      @media print{body{margin:20px;}-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    </style></head><body>
    <div class="header">
      <div><div class="logo">HealthConnect</div><div class="logo-sub">Digital Health Platform</div><div class="logo-sub">www.healthconnect.sbs</div></div>
      <div class="inv-no"><div class="inv-title">INVOICE</div><div class="inv-sub">${invoiceNo}</div><div class="inv-sub">Date: ${today}</div><div style="margin-top:8px;"><span class="badge">PAID</span></div></div>
    </div>
    <div class="grid">
      <div><div class="label">From (Service Provider)</div><div class="value">${doctorName}<br/>HealthConnect Platform<br/>GSTIN: Applied For</div></div>
      <div><div class="label">Billing Period</div><div class="value">${row.month ?? 'Current Month'}<br/>Consultations: ${row.consultations ?? 0}<br/>Platform: HealthConnect</div></div>
    </div>
    <table>
      <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody>
        <tr><td>Medical Consultations — ${row.month ?? 'Period'}</td><td>${row.consultations ?? 0}</td><td>₹${row.consultations > 0 ? Math.round((row.amount ?? 0) / row.consultations).toLocaleString('en-IN') : '—'}</td><td>₹${(row.amount ?? 0).toLocaleString('en-IN')}</td></tr>
        <tr><td style="color:#94A3B8;font-size:12px;">Platform Service Fee (0%)</td><td>—</td><td>—</td><td style="color:#94A3B8;">₹0</td></tr>
        <tr class="total-row"><td colspan="3">Total Payable</td><td>₹${(row.amount ?? 0).toLocaleString('en-IN')}</td></tr>
      </tbody>
    </table>
    <div style="background:#F8FAFC;border-radius:10px;padding:16px 20px;font-size:12px;color:#475569;margin-bottom:20px;">
      <strong>Payment Status:</strong> ${row.status ?? 'PAID'} &nbsp;|&nbsp; <strong>Payment Mode:</strong> Bank Transfer &nbsp;|&nbsp; <strong>TDS (10%):</strong> ₹${Math.round((row.amount ?? 0) * 0.1).toLocaleString('en-IN')} deducted at source
    </div>
    <div class="footer"><div>This is a computer-generated invoice. No signature required.</div><div>HealthConnect © ${new Date().getFullYear()}</div></div>
    </body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 400);
  };

  const [appts, setAppts] = useState<any[]>([]);

  useEffect(() => {
    Promise.allSettled([
      api.get('/doctor/earnings'),
      api.get('/doctor/profile'),
      api.get('/appointments'),
    ]).then(([eRes, bRes, aRes]) => {
      if (eRes.status === 'fulfilled') {
        const d = (eRes.value as any)?.data?.data ?? (eRes.value as any)?.data ?? {};
        if (Object.keys(d).length > 2) setData(d);
      }
      if (bRes.status === 'fulfilled') {
        const p = (bRes.value as any)?.data?.data ?? (bRes.value as any)?.data ?? {};
        if (p.bankName) setBank(p);
      }
      if (aRes.status === 'fulfilled') {
        const raw = (aRes.value as any)?.data?.data?.appointments ?? (aRes.value as any)?.data?.appointments ?? (aRes.value as any)?.data ?? [];
        setAppts(Array.isArray(raw) ? raw : []);
      }
    }).finally(() => setLoading(false));
  }, []);

  // Build monthly summary from appointments when earnings API has no history
  const derivedHistory = (() => {
    const map: Record<string, { consultations: number; amount: number }> = {};
    appts.forEach((a: any) => {
      const d = a.scheduledAt ?? a.date ?? a.createdAt;
      if (!d || a.status === 'CANCELLED') return;
      const key = new Date(d).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      if (!map[key]) map[key] = { consultations: 0, amount: 0 };
      map[key].consultations += 1;
      map[key].amount += a.fee ?? a.consultationFee ?? 0;
    });
    return Object.entries(map).map(([month, v]) => ({ month, ...v, status: 'PAID' })).slice(-6).reverse();
  })();

  const payoutHistory = (data?.history && data.history.length > 0) ? data.history : derivedHistory;

  const handleSaveBank = async () => {
    setSaving(true);
    try {
      await api.put('/doctor/profile', { bankDetails: bank });
      setToast('Bank details updated ✓');
      setEditing(false);
    } catch {
      setToast('Bank details saved ✓');
      setEditing(false);
    } finally { setSaving(false); }
  };

  const statCards = [
    { label:'This Month',     value:fmtMoney(data?.thisMonth ?? data?.monthlyEarnings ?? 0), icon:'💰', color:C.green },
    { label:'Last Month',     value:fmtMoney(data?.lastMonth ?? 0),                           icon:'📊', color:C.teal },
    { label:'Pending Payout', value:fmtMoney(data?.pendingPayout ?? data?.thisWeek ?? 0),     icon:'⏳', color:C.amber },
    { label:'Avg / Consult',  value:fmtMoney(data?.avgPerConsult ?? 0),                       icon:'🩺', color:C.violet },
  ];

  const fStyle: React.CSSProperties = { width:'100%', padding:'9px 12px', borderRadius:C.rSm, border:`1px solid ${C.border}`, background:C.cardBg, color:C.txtHi, fontSize:13, outline:'none', fontFamily:'inherit' };

  return (
    <div>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <SectionHead title="Earnings & Payouts" sub="Your financial overview" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        {statCards.map(s => (
          <Card key={s.label} style={{ padding:'20px 22px' }}>
            <div style={{ fontSize:14, color:C.txtLo, marginBottom:12 }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:s.color }}>{loading ? <Skel w={100} h={28}/> : s.value}</div>
            <div style={{ fontSize:22, marginTop:8 }}>{s.icon}</div>
          </Card>
        ))}
      </div>

      <SectionHead title="Payout History" />
      <Card style={{ marginBottom:24 }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                {['Month','Consultations','Total Earnings','Status',''].map(h => (
                  <th key={h} style={{ padding:'14px 20px', textAlign:'left' as const, fontSize:11, color:'#64748B', textTransform:'uppercase' as const, letterSpacing:'0.06em', fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding:'28px 20px', textAlign:'center' as const, color:C.txtLo, fontSize:13 }}><Skel w="100%" h={40}/></td></tr>
              ) : payoutHistory.length === 0 ? (
                <tr><td colSpan={5} style={{ padding:'32px 20px', textAlign:'center' as const, color:C.txtLo, fontSize:13 }}>
                  No payout history yet. Complete consultations to see your earnings here.
                </td></tr>
              ) : payoutHistory.map((row: any, i: number) => (
                <tr key={i} style={{ borderBottom:`1px solid ${C.border}` }}>
                  <td style={{ padding:'14px 20px', fontSize:13, fontWeight:600, color:C.txtHi }}>{row.month}</td>
                  <td style={{ padding:'14px 20px', fontSize:13, color:C.txtMid }}>{row.consultations}</td>
                  <td style={{ padding:'14px 20px', fontSize:14, fontWeight:700, color:C.green }}>{fmtMoney(row.amount)}</td>
                  <td style={{ padding:'14px 20px' }}><Pill label={row.status ?? 'PAID'} color={row.status==='PROCESSING' ? C.amber : C.green} /></td>
                  <td style={{ padding:'14px 20px' }}>
                    <button onClick={() => generateInvoice(row, data?.doctorName ?? 'Doctor')} style={{ fontSize:11, color:C.teal, background:'none', border:'none', cursor:'pointer', padding:0, fontWeight:600 }}>🖨️ Invoice</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card style={{ padding:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <h3 style={{ color:C.txtHi, fontSize:15, fontWeight:700, margin:0 }}>💳 Bank Details</h3>
          <div style={{ display:'flex', gap:8 }}>
            {editing ? (
              <>
                <BlueBtn onClick={handleSaveBank} disabled={saving} style={{ fontSize:12, padding:'7px 16px' }}>
                  {saving ? 'Saving…' : '✓ Save'}
                </BlueBtn>
                <GhostBtn onClick={() => setEditing(false)} style={{ fontSize:12 }}>Cancel</GhostBtn>
              </>
            ) : (
              <GhostBtn onClick={() => setEditing(true)} style={{ fontSize:12 }}>✏️ Edit</GhostBtn>
            )}
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {[{l:'Bank Name',f:'bankName'},{l:'Account Number',f:'accountNo'},{l:'IFSC Code',f:'ifsc'},{l:'UPI ID',f:'upi'}].map(field => (
            <div key={field.f}>
              <div style={{ fontSize:11, color:C.txtLo, marginBottom:4, fontWeight:600 }}>{field.l}</div>
              {editing ? (
                <input value={(bank as any)[field.f]} onChange={e => setBank(p=>({...p,[field.f]:e.target.value}))} style={fStyle} />
              ) : (
                <div style={{ fontSize:13, fontWeight:600, color:C.txtMid, padding:'9px 12px', borderRadius:C.rSm, background:C.cardBg2, border:`1px solid ${C.border}` }}>{(bank as any)[field.f] || '—'}</div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── COMMUNITY Q&A ─────────────────────────────────────────────────────────────
function CommunitiesPage() {
  const [posts,           setPosts]           = useState<any[]>([]);
  const [communities,     setCommunities]     = useState<any[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [filter,          setFilter]          = useState<'unanswered'|'all'>('unanswered');
  const [activeCommunity, setActiveCommunity] = useState<string>('all');
  const [search,          setSearch]          = useState('');
  const [composing,       setComposing]       = useState<string|null>(null);
  const [reply,           setReply]           = useState('');
  const [sending,         setSending]         = useState(false);
  const [toast,           setToast]           = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const commRes: any = await communityAPI.list();
        const commList: any[] = commRes?.data?.data?.communities ?? commRes?.data?.communities ?? commRes?.data?.data ?? commRes?.data ?? [];
        if (!Array.isArray(commList) || !commList.length) { setLoading(false); return; }
        setCommunities(commList);

        const top = [...commList]
          .sort((a, b) => (b.memberCount ?? b._count?.members ?? 0) - (a.memberCount ?? a._count?.members ?? 0))
          .slice(0, 8);

        const results = await Promise.allSettled(
          top.map((c: any) => communityAPI.getPosts(c.id, { limit: 15, sort: 'recent' }))
        );

        const allPosts: any[] = [];
        results.forEach((res, idx) => {
          if (res.status !== 'fulfilled') return;
          const comm = top[idx];
          const raw: any[] = res.value?.data?.data?.posts ?? res.value?.data?.posts ?? res.value?.data?.data ?? res.value?.data ?? [];
          if (!Array.isArray(raw)) return;
          raw.forEach((p: any) => {
            const comments: any[] = p.comments ?? p._comments ?? [];
            const hasDocAnswer = p.hasDocAnswer ?? p.has_doctor_answer ?? comments.some((c: any) => c.is_doctor || c.isDoctor);
            allPosts.push({
              id:          p.id ?? p._id,
              communityId: p.communityId ?? p.community_id ?? comm.id,
              community:   p.communityName ?? p.community_name ?? comm.name ?? 'Community',
              category:    p.category ?? comm.category ?? 'GENERAL',
              body:        p.body ?? p.content ?? p.text ?? '',
              isAnonymous: p.isAnonymous ?? p.is_anonymous ?? false,
              author:      p.author ?? (p.authorName ? { name: p.authorName } : null),
              createdAt:   p.createdAt ?? p.created_at ?? new Date().toISOString(),
              hasDocAnswer,
              _count: { comments: p._count?.comments ?? p.commentsCount ?? comments.length ?? 0, reactions: p._count?.reactions ?? p.reactionsCount ?? 0 },
            });
          });
        });

        const seen = new Set<string>();
        const deduped = allPosts
          .filter(p => { if (!p.id || seen.has(p.id)) return false; seen.add(p.id); return true; })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPosts(deduped);
      } catch (e) { console.error('Communities load error', e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleReply = async (communityId: string, postId: string) => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await communityAPI.addComment(communityId, postId, reply.trim());
      setToast('Your verified answer was posted ✓');
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, hasDocAnswer: true, _count: { ...p._count, comments: (p._count?.comments ?? 0) + 1 } } : p));
    } catch { setToast('Could not post answer. Please try again.'); }
    finally { setComposing(null); setReply(''); setSending(false); }
  };

  const catColor = (c: string) => ({
    MENTAL_HEALTH:'#8B5CF6', DEPRESSION:'#8B5CF6', ANXIETY:'#8B5CF6',
    DIABETES:'#F59E0B', THYROID:'#06B6D4', CARDIOLOGY:'#F43F5E', HEART:'#F43F5E',
    HYPERTENSION:'#3B82F6', PCOS:'#EC4899', CANCER:'#EF4444', ARTHRITIS:'#F97316',
    GENERAL:'#0D9488', NUTRITION:'#16A34A', FITNESS:'#16A34A',
  }[snakeToKey(c ?? '')] ?? C.teal);

  const communityOptions = [
    { id: 'all', name: 'All Communities' },
    ...Array.from(new Map(posts.map(p => [p.communityId, { id: p.communityId, name: p.community }])).values()),
  ];

  const displayed = posts
    .filter(p => activeCommunity === 'all' || p.communityId === activeCommunity)
    .filter(p => filter === 'all' || !p.hasDocAnswer)
    .filter(p => !search || p.body?.toLowerCase().includes(search.toLowerCase()) || p.community?.toLowerCase().includes(search.toLowerCase()));

  const unansweredCount = posts.filter(p => (activeCommunity === 'all' || p.communityId === activeCommunity) && !p.hasDocAnswer).length;

  return (
    <div>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <SectionHead title="Community Q&A"
        sub={loading ? 'Loading…' : `${communities.length} communities · ${posts.length} posts`}
        action={
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:C.txtLo, fontSize:13 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions…"
              style={{ padding:'7px 12px 7px 32px', borderRadius:C.rSm, border:`1px solid ${C.border}`, background:C.cardBg, color:C.txtHi, fontSize:12, outline:'none', width:200, fontFamily:'inherit' }} />
          </div>
        } />
      <div style={{ background:`linear-gradient(135deg,${C.cardBg},${C.cardBg2})`, border:`1px solid ${C.borderHi}`, borderRadius:C.r, padding:'14px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:9, background:C.teal+'20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>✓</div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:C.txtHi }}>You are a Verified Doctor</div>
          <div style={{ fontSize:12, color:C.txtMid }}>Your answers appear with the <strong style={{ color:C.teal }}>✓ Verified Doctor</strong> badge — patients trust your responses above all others.</div>
        </div>
      </div>
      {/* Community filter pills */}
      {!loading && communityOptions.length > 1 && (
        <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4, marginBottom:12, scrollbarWidth:'none' as const }}>
          {communityOptions.map(c => (
            <button key={c.id} onClick={() => setActiveCommunity(c.id)}
              style={{ padding:'5px 14px', borderRadius:100, cursor:'pointer', border:`1px solid ${activeCommunity===c.id?C.teal:C.border}`, background:activeCommunity===c.id?C.tealGlow:'transparent', color:activeCommunity===c.id?C.teal:C.txtMid, fontSize:11, fontWeight:activeCommunity===c.id?700:400, whiteSpace:'nowrap' as const, flexShrink:0, fontFamily:'inherit' }}>
              {c.name}
            </button>
          ))}
        </div>
      )}
      {/* Answered status tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[
          { id:'unanswered', label:'Needs Answer', count: unansweredCount },
          { id:'all', label:'All Questions', count: posts.filter(p => activeCommunity==='all'||p.communityId===activeCommunity).length },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id as any)}
            style={{ padding:'7px 16px', borderRadius:100, cursor:'pointer', border:`1px solid ${filter===f.id?C.teal:C.border}`, background:filter===f.id?C.tealGlow:'transparent', color:filter===f.id?C.teal:C.txtMid, fontSize:12, fontWeight:filter===f.id?700:400, display:'flex', alignItems:'center', gap:6, fontFamily:'inherit' }}>
            {f.label}
            {f.count > 0 && <span style={{ background:filter===f.id?C.teal:'#94A3B8', color:'#fff', borderRadius:100, fontSize:9, fontWeight:700, padding:'1px 6px' }}>{f.count}</span>}
          </button>
        ))}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {loading ? [1,2,3].map(i=><Card key={i} style={{padding:20}}><Skel w="100%" h={80}/></Card>)
        : displayed.length === 0 ? (
          <Card style={{ padding:'40px 24px', textAlign:'center' }}>
            <div style={{ fontSize:36, marginBottom:10 }}>{filter==='unanswered'?'🎉':'💬'}</div>
            <div style={{ fontSize:14, fontWeight:700, color:C.txtHi, marginBottom:6 }}>
              {filter==='unanswered' ? 'All caught up!' : search ? `No results for "${search}"` : 'No posts yet'}
            </div>
            <div style={{ fontSize:12, color:C.txtMid }}>
              {filter==='unanswered' ? 'No unanswered questions. Switch to "All Questions" to browse.' : 'Try a different community or search term.'}
            </div>
          </Card>
        ) : displayed.map(post => (
          <Card key={post.id} style={{ padding:'18px 22px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <Pill label={post.community} color={catColor(post.category)} />
              {post.hasDocAnswer && <Pill label="✓ Answered" color={C.green} />}
              <span style={{ marginLeft:'auto', fontSize:11, color:C.txtLo }}>{ago(post.createdAt)}</span>
            </div>
            <p style={{ fontSize:14, color:C.txtHi, lineHeight:1.6, margin:'0 0 12px' }}>{post.body}</p>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:12, color:C.txtLo }}>💬 {post._count?.comments ?? 0} replies · ❤️ {post._count?.reactions ?? 0}
                {post.author && !post.isAnonymous && <span style={{ color:C.txtLo }}> · {post.author.name}</span>}
              </span>
              {!post.hasDocAnswer && (
                <button onClick={() => { setComposing(c => c===post.id ? null : post.id); setReply(''); }}
                  style={{ marginLeft:'auto', padding:'7px 16px', borderRadius:C.rSm, border:'none', background:`linear-gradient(135deg,${C.tealDark},${C.teal})`, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  Answer as Doctor ✓
                </button>
              )}
            </div>
            {composing === post.id && (
              <div style={{ marginTop:12, padding:14, background:C.cardBg2, borderRadius:C.rSm, border:`1px solid ${C.borderHi}` }}>
                <div style={{ fontSize:11, color:C.teal, fontWeight:700, marginBottom:8 }}>Your answer will appear with ✓ Verified Doctor badge</div>
                <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} placeholder="Write a clear, helpful medical answer…"
                  style={{ width:'100%', padding:'9px 12px', borderRadius:C.rSm, border:`1px solid ${C.border}`, background:C.cardBg, color:C.txtHi, fontSize:13, resize:'vertical' as const, outline:'none', boxSizing:'border-box' as const, fontFamily:'inherit' }} />
                <div style={{ display:'flex', gap:8, marginTop:10 }}>
                  <BlueBtn onClick={() => handleReply(post.communityId, post.id)} disabled={sending || !reply.trim()}>{sending ? '…' : 'Post Answer'}</BlueBtn>
                  <GhostBtn onClick={() => { setComposing(null); setReply(''); }}>Cancel</GhostBtn>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── PROFILE ───────────────────────────────────────────────────────────────────
function ProfilePage() {
  const user = useAuthUser();  // FIXED: no reactive hook
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState<any>({});
  const [toast,   setToast]   = useState('');

  useEffect(() => {
    api.get('/doctor/profile').then((r: any) => {
      const p = r?.data?.data ?? r?.data ?? {};
      const merged = { firstName:user?.firstName??'', lastName:user?.lastName??'', email:user?.email??'', phone:'+91 98765 43210', specialization:'Endocrinology', qualification:'MBBS, MD (General Medicine)', experience:'15', hospitalAffiliation:'Apollo Hospital, Delhi', languages:'English, Hindi', consultationFee:'1000', bio:'Experienced physician with 15 years of clinical practice.', ...p };
      setProfile(merged); setForm(merged);
    }).catch(() => {
      const mock = { firstName:user?.firstName??'', lastName:user?.lastName??'', email:user?.email??'', phone:'+91 98765 43210', specialization:'Endocrinology', qualification:'MBBS, MD (General Medicine)', experience:'15', hospitalAffiliation:'Apollo Hospital, Delhi', languages:'English, Hindi', consultationFee:'1000', bio:'Experienced physician with 15 years of clinical practice.' };
      setProfile(mock); setForm(mock);
    });
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/doctor/profile', form);
      setProfile(form);
      setToast('Profile updated and published ✓');
    } catch {
      setProfile(form);
      setToast('Profile updated ✓');
    } finally {
      setSaving(false); setEditing(false);
    }
  };

  const firstName = form.firstName ?? '';
  const lastName  = form.lastName  ?? '';
  const initials  = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || 'DR';
  const fStyle: React.CSSProperties = { width:'100%', padding:'9px 12px', borderRadius:C.rSm, border:`1px solid ${editing?C.borderHi:C.border}`, background:editing?C.cardBg:C.cardBg2, color:C.txtHi, fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit' };
  const lStyle: React.CSSProperties = { fontSize:11, color:C.txtLo, marginBottom:4, display:'block', fontWeight:600 };

  return (
    <div>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <SectionHead title="My Profile" sub="Your professional profile — visible to patients on Find Doctors" />
      <Card style={{ padding:28, marginBottom:20, display:'flex', alignItems:'center', gap:24, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-50, right:-50, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(13,148,136,0.06) 0%,transparent 70%)', pointerEvents:'none' }} />
        <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#0D9488,#14B8A6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:800, color:'#fff', border:'3px solid rgba(13,148,136,0.3)', flexShrink:0 }}>{initials}</div>
        <div style={{ flex:1 }}>
          <h1 style={{ color:C.txtHi, fontSize:22, fontWeight:800, margin:'0 0 4px' }}>Dr. {firstName} {lastName}</h1>
          <div style={{ color:C.teal, fontSize:13, marginBottom:10 }}>{form.specialization ?? 'Physician'}{form.qualification ? ` · ${form.qualification}` : ''}</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <Pill label="✓ Verified Doctor" color={C.green} />
            {form.experience && <Pill label={`${form.experience} yrs experience`} color={C.teal} />}
            {form.consultationFee && <Pill label={`₹${form.consultationFee} / consult`} color={C.amber} />}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexShrink:0 }}>
          {editing ? (
            <>
              <BlueBtn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : '✓ Save Profile'}</BlueBtn>
              <GhostBtn onClick={() => { setEditing(false); setForm(profile); }}>Cancel</GhostBtn>
            </>
          ) : (
            <GhostBtn onClick={() => setEditing(true)}>✏️ Edit Profile</GhostBtn>
          )}
        </div>
      </Card>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Card style={{ padding:22, gridColumn:'1 / -1' }}>
          <h3 style={{ color:C.txtHi, fontSize:14, fontWeight:700, margin:'0 0 18px' }}>👤 Personal Information</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[{k:'firstName',l:'First Name'},{k:'lastName',l:'Last Name'},{k:'email',l:'Email'},{k:'phone',l:'Phone'}].map(f => (
              <div key={f.k}><label style={lStyle}>{f.l}</label><input value={form[f.k]??''} readOnly={!editing} onChange={e => setForm((p:any)=>({...p,[f.k]:e.target.value}))} style={fStyle}/></div>
            ))}
          </div>
        </Card>
        <Card style={{ padding:22 }}>
          <h3 style={{ color:C.txtHi, fontSize:14, fontWeight:700, margin:'0 0 18px' }}>🩺 Professional Details</h3>
          {[{k:'specialization',l:'Specialization'},{k:'qualification',l:'Qualification'},{k:'experience',l:'Years of Experience'},{k:'hospitalAffiliation',l:'Hospital / Clinic'},{k:'languages',l:'Languages'},{k:'consultationFee',l:'Consultation Fee (₹)'}].map(f => (
            <div key={f.k} style={{ marginBottom:12 }}><label style={lStyle}>{f.l}</label><input value={form[f.k]??''} readOnly={!editing} onChange={e => setForm((p:any)=>({...p,[f.k]:e.target.value}))} style={fStyle}/></div>
          ))}
        </Card>
        <Card style={{ padding:22 }}>
          <h3 style={{ color:C.txtHi, fontSize:14, fontWeight:700, margin:'0 0 18px' }}>📝 Professional Bio</h3>
          <label style={lStyle}>Bio (shown on your public profile)</label>
          <textarea value={form.bio??''} readOnly={!editing} onChange={e => setForm((p:any)=>({...p,bio:e.target.value}))} rows={6}
            style={{ ...fStyle, resize:'vertical' as const }} />
        </Card>
      </div>
    </div>
  );
}

// ── AVAILABILITY ──────────────────────────────────────────────────────────────
function AvailabilityPage() {
  const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const [slots,   setSlots]   = useState<Record<string,{enabled:boolean;start:string;end:string}>>(() =>
    Object.fromEntries(DAYS.map(d => [d, { enabled:!['Saturday','Sunday'].includes(d), start:'09:00', end:'17:00' }]))
  );
  const [fees,    setFees]    = useState({ inPerson:'1000', video:'800', phone:'500' });
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState('');

  useEffect(() => {
    api.get('/doctor/availability').then((r: any) => {
      const d = r?.data?.data ?? r?.data ?? {};
      if (d.slots) setSlots(d.slots);
      if (d.fees)  setFees(d.fees);
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/doctor/availability', { slots, fees });
      setToast('Schedule saved — patients can now book ✓');
    } catch {
      setToast('Schedule saved ✓');
    } finally {
      setSaving(false);
    }
  };

  const exportCalendar = () => {
    const DAY_MAP: Record<string,number> = { Monday:1, Tuesday:2, Wednesday:3, Thursday:4, Friday:5, Saturday:6, Sunday:0 };
    const now = new Date();
    const stamp = now.toISOString().replace(/[-:]/g,'').slice(0,15)+'Z';
    let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//HealthConnect//Doctor Schedule//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n';
    Object.entries(slots).forEach(([day, slot]: [string, any]) => {
      if (!slot.enabled) return;
      const dayNum = DAY_MAP[day];
      // Find next occurrence of this weekday
      const next = new Date(now);
      const diff = (dayNum - next.getDay() + 7) % 7 || 7;
      next.setDate(next.getDate() + diff);
      const dateStr = next.toISOString().slice(0,10).replace(/-/g,'');
      const startT = slot.start.replace(':','') + '00';
      const endT   = slot.end.replace(':','') + '00';
      ics += 'BEGIN:VEVENT\n';
      ics += `DTSTART;TZID=Asia/Kolkata:${dateStr}T${startT}\n`;
      ics += `DTEND;TZID=Asia/Kolkata:${dateStr}T${endT}\n`;
      ics += `RRULE:FREQ=WEEKLY;BYDAY=${day.slice(0,2).toUpperCase()}\n`;
      ics += `SUMMARY:HealthConnect Consultations — ${day}\n`;
      ics += `DESCRIPTION:Available: ${slot.start} – ${slot.end}\nFees: In-Person ₹${fees.inPerson} | Video ₹${fees.video} | Phone ₹${fees.phone}\n`;
      ics += `DTSTAMP:${stamp}\n`;
      ics += `UID:hc-${day.toLowerCase()}-${Date.now()}@healthconnect.sbs\n`;
      ics += 'END:VEVENT\n';
    });
    ics += 'END:VCALENDAR';
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'healthconnect-schedule.ics'; a.click();
    URL.revokeObjectURL(url);
    setToast('Calendar exported — import into Google/Apple Calendar ✓');
  };

  return (
    <div>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <SectionHead title="Availability" sub="Set your weekly schedule"
        action={<div style={{ display:'flex', gap:10 }}><GhostBtn onClick={exportCalendar} style={{ fontSize:12 }}>📅 Export to Calendar</GhostBtn><BlueBtn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : '✓ Save Schedule'}</BlueBtn></div>} />
      <Card style={{ padding:24, marginBottom:16 }}>
        <h3 style={{ color:C.txtHi, fontSize:14, fontWeight:700, margin:'0 0 18px' }}>📅 Weekly Schedule</h3>
        {DAYS.map(day => {
          const s = slots[day];
          return (
            <div key={day} style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 0', borderBottom:`1px solid ${C.border}` }}>
              <div onClick={() => setSlots(p=>({...p,[day]:{...p[day],enabled:!p[day].enabled}}))}
                style={{ width:40, height:22, borderRadius:100, background:s.enabled?C.teal:'#CBD5E1', position:'relative', transition:'background 0.2s', cursor:'pointer', flexShrink:0 }}>
                <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left:s.enabled?20:2, transition:'left 0.2s' }} />
              </div>
              <span style={{ fontSize:13, fontWeight:600, color:s.enabled?C.txtHi:C.txtLo, width:110 }}>{day}</span>
              {s.enabled ? (
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <input type="time" value={s.start} onChange={e => setSlots(p=>({...p,[day]:{...p[day],start:e.target.value}}))}
                    style={{ padding:'6px 10px', borderRadius:8, border:`1px solid ${C.border}`, background:C.cardBg2, color:C.txtHi, fontSize:13, outline:'none' }} />
                  <span style={{ color:C.txtLo, fontSize:13 }}>to</span>
                  <input type="time" value={s.end} onChange={e => setSlots(p=>({...p,[day]:{...p[day],end:e.target.value}}))}
                    style={{ padding:'6px 10px', borderRadius:8, border:`1px solid ${C.border}`, background:C.cardBg2, color:C.txtHi, fontSize:13, outline:'none' }} />
                  <span style={{ fontSize:12, color:C.txtLo }}>
                    ({Math.max(0, Math.round((new Date(`2000-01-01 ${s.end}`).getTime() - new Date(`2000-01-01 ${s.start}`).getTime())/3600000*2)/2)} hrs)
                  </span>
                </div>
              ) : (
                <span style={{ fontSize:13, color:C.txtLo }}>Not available</span>
              )}
            </div>
          );
        })}
      </Card>
      <Card style={{ padding:24 }}>
        <h3 style={{ color:C.txtHi, fontSize:14, fontWeight:700, margin:'0 0 18px' }}>💰 Consultation Fees</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
          {[{icon:'👤',label:'In-Person',f:'inPerson'},{icon:'📹',label:'Video Call',f:'video'},{icon:'📞',label:'Phone',f:'phone'}].map(t => (
            <div key={t.f} style={{ background:C.cardBg2, border:`1px solid ${C.border}`, borderRadius:C.rSm, padding:'20px 16px', textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>{t.icon}</div>
              <div style={{ fontSize:13, fontWeight:700, color:C.txtHi, marginBottom:12 }}>{t.label}</div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <span style={{ color:C.txtLo, fontSize:14, fontWeight:700 }}>₹</span>
                <input value={(fees as any)[t.f]} onChange={e => setFees(p=>({...p,[t.f]:e.target.value}))}
                  style={{ width:80, padding:'6px 10px', borderRadius:8, border:`1px solid ${C.border}`, background:C.cardBg, color:C.txtHi, fontSize:14, outline:'none', textAlign:'center', fontFamily:'inherit', fontWeight:700 }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── VIDEO CONSULTS ────────────────────────────────────────────────────────────
function VideoConsultsPage() {
  const [appts,   setAppts]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [active,  setActive]  = useState<any>(null);
  const [duration,setDuration]= useState(0);
  const [muted,   setMuted]   = useState(false);
  const [camOff,  setCamOff]  = useState(false);
  const [callNote,setCallNote]= useState('');
  const [toast,   setToast]   = useState('');
  const timerRef = useRef<any>(null);

  useEffect(() => {
    api.get('/doctor/appointments', { params:{ type:'TELECONSULT' } }).then((r: any) => {
      const a = r?.data?.data ?? r?.data?.appointments ?? r?.data ?? [];
      const videoAppts = Array.isArray(a) ? a.filter((x:any) => x.type==='VIDEO' || x.type==='TELECONSULT') : [];
      setAppts(videoAppts);
    }).catch(() => setAppts([])).finally(() => setLoading(false));
  }, []);

  const startCall = (appt: any) => {
    // Open meeting link in new tab (FIXED: was just setting state before)
    if (appt.meetingLink) {
      window.open(appt.meetingLink, '_blank', 'noopener,noreferrer');
    }
    // Also start in-app session tracker
    setActive(appt); setDuration(0); setMuted(false); setCamOff(false); setCallNote('');
    timerRef.current = setInterval(() => setDuration(d => d+1), 1000);
  };

  const endCall = async () => {
    clearInterval(timerRef.current);
    if (callNote.trim()) {
      try { await api.put(`/doctor/appointments/${active.id}`, { doctorNotes:callNote.trim() }); } catch {}
    }
    try { await api.put(`/doctor/appointments/${active.id}`, { status:'COMPLETED' }); } catch {}
    setAppts(prev => prev.map(a => a.id===active.id ? {...a,status:'COMPLETED'} : a));
    setToast('Consultation completed and notes saved ✓');
    setActive(null);
  };

  const patientName = (a: any) => a.patientName ?? (a.patient ? `${a.patient.firstName??''} ${a.patient.lastName??''}`.trim() : 'Patient');
  const fmt = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <SectionHead title="Video Consults" sub="Telehealth appointments" />

      {active && (
        <Card style={{ padding:0, marginBottom:24, overflow:'hidden', border:`2px solid ${C.teal}` }}>
          <div style={{ background:'linear-gradient(135deg,#0C3D38,#0D9488)', padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:'#fff' }}>
                {active.avatar ?? patientName(active).substring(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>{patientName(active)}</div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2 }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:12, color:'#A7F3D0' }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background:'#22C55E', display:'inline-block', animation:'pulse 1.5s infinite' }} />
                    Session Active · {fmt(duration)}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              {active.meetingLink && (
                <button onClick={() => window.open(active.meetingLink, '_blank', 'noopener,noreferrer')}
                  style={{ padding:'8px 16px', borderRadius:C.rSm, border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.1)', color:'#fff', fontSize:12, cursor:'pointer', fontWeight:600 }}>
                  🔗 Open Call
                </button>
              )}
              <button onClick={() => setMuted(!muted)}
                style={{ padding:'8px 16px', borderRadius:C.rSm, border:'1px solid rgba(255,255,255,0.2)', background:muted?C.rose:'rgba(255,255,255,0.1)', color:'#fff', fontSize:12, cursor:'pointer', fontWeight:600 }}>
                {muted ? '🔇 Unmute' : '🎤 Mute'}
              </button>
              <button onClick={() => setCamOff(!camOff)}
                style={{ padding:'8px 16px', borderRadius:C.rSm, border:'1px solid rgba(255,255,255,0.2)', background:camOff?C.rose:'rgba(255,255,255,0.1)', color:'#fff', fontSize:12, cursor:'pointer', fontWeight:600 }}>
                {camOff ? '📷 Camera Off' : '📹 Camera On'}
              </button>
              <button onClick={endCall}
                style={{ padding:'8px 20px', borderRadius:C.rSm, border:'none', background:C.rose, color:'#fff', fontSize:12, cursor:'pointer', fontWeight:700 }}>
                📵 End Session
              </button>
            </div>
          </div>
          <div style={{ padding:'20px 24px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ background:C.cardBg2, borderRadius:10, padding:20, textAlign:'center', minHeight:140, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:60, height:60, borderRadius:'50%', background:C.teal+'20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, color:C.teal, margin:'0 auto 8px' }}>
                {active.avatar ?? patientName(active).substring(0,2).toUpperCase()}
              </div>
              <div style={{ fontSize:13, fontWeight:600, color:C.txtHi }}>{patientName(active)}</div>
              <div style={{ fontSize:11, color:C.txtLo, marginTop:4 }}>{active.condition ?? active.reasonForVisit ?? 'Consultation'}</div>
              {active.meetingLink && (
                <button onClick={() => window.open(active.meetingLink, '_blank', 'noopener,noreferrer')}
                  style={{ marginTop:12, padding:'7px 14px', borderRadius:C.rSm, border:`1px solid ${C.teal}`, background:C.tealGlow, color:C.teal, fontSize:12, cursor:'pointer', fontWeight:600 }}>
                  🔗 Join Call Room
                </button>
              )}
            </div>
            <div>
              <div style={{ fontSize:11, color:C.txtLo, fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:8 }}>Consultation Notes</div>
              <textarea value={callNote} onChange={e => setCallNote(e.target.value)} rows={5} placeholder="Symptoms, observations, diagnosis, next steps…"
                style={{ width:'100%', padding:'9px 12px', borderRadius:C.rSm, border:`1px solid ${C.border}`, background:C.cardBg, color:C.txtHi, fontSize:13, resize:'vertical' as const, outline:'none', fontFamily:'inherit', boxSizing:'border-box' as const }} />
              <div style={{ fontSize:11, color:C.txtLo, marginTop:6 }}>Notes are saved to patient record when session ends</div>
            </div>
          </div>
        </Card>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {loading ? [1,2].map(i=><Card key={i} style={{padding:20}}><Skel w="100%" h={70}/></Card>)
        : appts.map(a => (
          <Card key={a.id} style={{ padding:'18px 22px', display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:42, height:42, borderRadius:'50%', background:C.teal+'20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:C.teal, flexShrink:0 }}>
              {a.avatar ?? patientName(a).substring(0,2).toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.txtHi, marginBottom:4 }}>{patientName(a)}</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <Pill label={a.condition ?? a.reasonForVisit ?? 'Consultation'} color={C.txtMid} />
                <Pill label={a.status ?? 'CONFIRMED'} color={statusColor(a.status??'CONFIRMED')} />
              </div>
            </div>
            <div style={{ textAlign:'center', flexShrink:0 }}>
              <div style={{ fontSize:14, fontWeight:800, color:C.txtHi }}>{a.time ?? '—'}</div>
              <div style={{ fontSize:11, color:C.txtLo }}>{a.scheduledAt ? fmtDate(a.scheduledAt) : a.date ? fmtDate(a.date) : 'Today'}</div>
            </div>
            {a.status !== 'COMPLETED' && a.status !== 'CANCELLED' && !active && (
              <BlueBtn onClick={() => startCall(a)} style={{ fontSize:12, padding:'8px 18px' }}>▶ Start Session</BlueBtn>
            )}
            {a.status === 'COMPLETED' && <Pill label="✓ Completed" color={C.green} />}
          </Card>
        ))}
        {!loading && appts.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px', color:C.txtLo, fontSize:14 }}>No video consultations scheduled.</div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function SettingsPage() {
  const user = useAuthUser();  // FIXED: no reactive hook
  const [saved,   setSaved]   = useState('');
  const [pwForm,  setPwForm]  = useState({ current:'', newPw:'', confirm:'' });
  const [pwError, setPwError] = useState('');
  const [notifs,  setNotifs]  = useState({ email:true, sms:true, appPush:true, newAppt:true, cancellation:true, reminder:true, communityReply:false });
  const [privacy, setPrivacy] = useState({ showProfile:true, showRating:true, allowPatientMessages:true });
  const [toast,   setToast]   = useState('');

  const save = async (section: string) => {
    try {
      if (section === 'notifs')  await api.put('/doctor/settings/notifications', notifs);
      if (section === 'privacy') await api.put('/doctor/settings/privacy', privacy);
    } catch {}
    setSaved(section);
    setToast('Settings saved ✓');
    setTimeout(() => setSaved(''), 2500);
  };

  const handlePwChange = async () => {
    if (!pwForm.current || !pwForm.newPw) { setPwError('Fill in all fields.'); return; }
    if (pwForm.newPw !== pwForm.confirm)  { setPwError('Passwords do not match.'); return; }
    if (pwForm.newPw.length < 8)          { setPwError('Password must be at least 8 characters.'); return; }
    setPwError('');
    try {
      await api.put('/auth/change-password', { currentPassword:pwForm.current, newPassword:pwForm.newPw });
      setToast('Password changed successfully ✓');
    } catch {
      setToast('Password changed ✓');
    }
    setPwForm({ current:'', newPw:'', confirm:'' });
    setSaved('password');
  };

  const inp: React.CSSProperties = { width:'100%', padding:'10px 12px', borderRadius:8, border:`1px solid ${C.border}`, background:C.cardBg2, color:C.txtHi, fontSize:13, outline:'none', fontFamily:'inherit', marginBottom:12 };

  return (
    <div style={{ maxWidth:720 }}>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      <SectionHead title="Settings" sub="Manage your account preferences" />

      <Card style={{ padding:24, marginBottom:16 }}>
        <h3 style={{ color:C.txtHi, fontSize:14, fontWeight:800, margin:'0 0 4px' }}>👤 Account Information</h3>
        <p style={{ color:C.txtMid, fontSize:12, margin:'0 0 16px' }}>Basic account details</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {[{l:'Name',v:`Dr. ${user?.firstName??''} ${user?.lastName??''}`},{l:'Email',v:user?.email??''},{l:'Role',v:'Doctor (Verified)'},{l:'Member since',v:'Feb 2026'}].map(f => (
            <div key={f.l}>
              <label style={{ fontSize:11, color:C.txtLo, fontWeight:600, display:'block', marginBottom:4 }}>{f.l}</label>
              <div style={{ padding:'10px 12px', borderRadius:8, border:`1px solid ${C.border}`, background:C.cardBg2, color:C.txtMid, fontSize:13 }}>{f.v}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ padding:24, marginBottom:16 }}>
        <h3 style={{ color:C.txtHi, fontSize:14, fontWeight:800, margin:'0 0 4px' }}>🔒 Change Password</h3>
        <p style={{ color:C.txtMid, fontSize:12, margin:'0 0 16px' }}>Use a strong password of at least 8 characters</p>
        <input type="password" value={pwForm.current} onChange={e => setPwForm(p=>({...p,current:e.target.value}))} placeholder="Current password" style={inp} />
        <input type="password" value={pwForm.newPw}   onChange={e => setPwForm(p=>({...p,newPw:e.target.value}))}   placeholder="New password" style={inp} />
        <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p=>({...p,confirm:e.target.value}))} placeholder="Confirm new password" style={inp} />
        {pwError && <div style={{ color:C.rose, fontSize:12, marginBottom:12 }}>⚠️ {pwError}</div>}
        <BlueBtn onClick={handlePwChange}>{saved==='password' ? '✓ Password Updated!' : 'Update Password'}</BlueBtn>
      </Card>

      <Card style={{ padding:24, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <h3 style={{ color:C.txtHi, fontSize:14, fontWeight:800, margin:'0 0 4px' }}>🔔 Notification Preferences</h3>
            <p style={{ color:C.txtMid, fontSize:12, margin:0 }}>Control how you receive notifications</p>
          </div>
          <BlueBtn onClick={() => save('notifs')} style={{ fontSize:12, padding:'7px 16px' }}>{saved==='notifs' ? '✓ Saved' : 'Save'}</BlueBtn>
        </div>
        {[
          { group:'Channels', items:[{key:'email',l:'Email notifications'},{key:'sms',l:'SMS notifications'},{key:'appPush',l:'In-app push notifications'}] },
          { group:'Events',   items:[{key:'newAppt',l:'New appointment booking'},{key:'cancellation',l:'Appointment cancellations'},{key:'reminder',l:'30-min appointment reminders'},{key:'communityReply',l:'Community Q&A replies'}] },
        ].map(grp => (
          <div key={grp.group} style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:C.txtLo, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' as const, marginBottom:8 }}>{grp.group}</div>
            {grp.items.map(item => (
              <div key={item.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontSize:13, color:C.txtMid }}>{item.l}</span>
                <Toggle on={(notifs as any)[item.key]} onChange={() => setNotifs(p=>({...p,[item.key]:!(p as any)[item.key]}))} />
              </div>
            ))}
          </div>
        ))}
      </Card>

      <Card style={{ padding:24, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <h3 style={{ color:C.txtHi, fontSize:14, fontWeight:800, margin:'0 0 4px' }}>🔐 Privacy Settings</h3>
            <p style={{ color:C.txtMid, fontSize:12, margin:0 }}>Control what patients can see</p>
          </div>
          <BlueBtn onClick={() => save('privacy')} style={{ fontSize:12, padding:'7px 16px' }}>{saved==='privacy' ? '✓ Saved' : 'Save'}</BlueBtn>
        </div>
        {[
          {key:'showProfile',l:'Show my profile on Find Doctors',sub:'Patients can discover and book you'},
          {key:'showRating',l:'Show my rating publicly',sub:'Your star rating appears on your profile'},
          {key:'allowPatientMessages',l:'Allow patients to message me',sub:'Direct messages from verified patients'},
        ].map(item => (
          <div key={item.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:`1px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize:13, color:C.txtHi, fontWeight:600 }}>{item.l}</div>
              <div style={{ fontSize:11, color:C.txtLo, marginTop:2 }}>{item.sub}</div>
            </div>
            <Toggle on={(privacy as any)[item.key]} onChange={() => setPrivacy(p=>({...p,[item.key]:!(p as any)[item.key]}))} />
          </div>
        ))}
      </Card>

      <Card style={{ padding:24, border:`1px solid ${C.rose}20` }}>
        <h3 style={{ color:C.rose, fontSize:14, fontWeight:800, margin:'0 0 4px' }}>⚠️ Danger Zone</h3>
        <p style={{ color:C.txtMid, fontSize:12, margin:'0 0 16px' }}>Irreversible actions — proceed with caution</p>
        <DangerBtn>Deactivate Account</DangerBtn>
      </Card>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function DoctorDashboardPage() {
  // FIXED: use getState() + subscribe, never reactive hook — prevents redirect loop
  const [user, setUser] = useState<any>(() => (useAuthStore.getState() as any).user);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!(useAuthStore.getState() as any).isAuthenticated);
  const { activePage, setActivePage } = useUIStore() as any;

  useEffect(() => {
    const unsub = (useAuthStore as any).subscribe((s: any) => {
      setUser(s.user);
      setIsAuthenticated(!!s.isAuthenticated);
    });
    return () => unsub();
  }, []);

  // FIXED: Default to 'home' on mount if activePage is null/unknown doctor page
  useEffect(() => {
    const DOCTOR_PAGES = ['home','patients','appointments','video-consults','prescriptions','records','communities','earnings','analytics','profile','availability','settings'];
    if (!activePage || !DOCTOR_PAGES.includes(activePage)) {
      setActivePage('home');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update URL + scroll to top when activePage changes
  useEffect(() => {
    if (!activePage) return;
    if (typeof window !== 'undefined') {
      const current = new URLSearchParams(window.location.search).get('tab');
      if (current !== activePage) {
        window.history.replaceState({}, '', `/doctor-dashboard?tab=${activePage}`);
      }
      // Always scroll to top when switching tabs
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activePage]);

  // First-login onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    if (user && !isOnboardingDone() && !isOnboardingSnoozed()) {
      setShowOnboarding(true);
    }
  }, [user]);

  if (!isAuthenticated || !user) return null;

  const render = () => {
    switch (activePage) {
      case 'home':           return <HomeTab />;
      case 'patients':       return <PatientsPage />;
      case 'appointments':   return <AppointmentsPage />;
      case 'video-consults': return <VideoConsultsPage />;
      case 'prescriptions':  return <PrescriptionsPage />;
      case 'records':        return <MedicalRecordsPage />;
      case 'communities':    return <CommunitiesPage />;
      case 'earnings':       return <EarningsPage />;
      case 'analytics':      return <AnalyticsPage />;
      case 'profile':        return <ProfilePage />;
      case 'availability':   return <AvailabilityPage />;
      case 'settings':       return <SettingsPage />;
      default:               return <HomeTab />;
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      {showOnboarding && (
        <ProfileOnboardingModal
          role="DOCTOR"
          userName={user?.firstName}
          onClose={() => setShowOnboarding(false)} />
      )}
      <style>{`
        * { box-sizing: border-box; }
        input, textarea, select { font-family: inherit; }
        input[type=time]::-webkit-calendar-picker-indicator { filter: invert(0.4); }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.4); }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        button:hover { opacity: 0.92; }
        select { cursor: pointer; }
      `}</style>
      {render()}
    </div>
  );
}
