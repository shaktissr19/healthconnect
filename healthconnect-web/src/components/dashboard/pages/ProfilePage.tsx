'use client';
import { useEffect, useState } from 'react';
import { patientAPI } from '@/lib/api';

const C = {
  bg: '#0B1E1C', card: '#FFFFFF', border: '#E2EEF0',
  teal: '#0D9488', tealLight: '#14B8A6', tealBg: '#F0FDF9',
  text: '#0F2D2A', text2: '#4B6E6A', text3: '#64748B',
  red: '#EF4444', green: '#22C55E',
};
const card: React.CSSProperties = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' };
const inp: React.CSSProperties  = { display:'block', width:'100%', padding:'11px 14px', borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:14, color:C.text, outline:'none', fontFamily:'inherit', boxSizing:'border-box', background:'#F8FFFE', transition:'border-color 0.15s' };
const lbl: React.CSSProperties  = { fontSize:12, fontWeight:700, color:C.text3, letterSpacing:'0.07em', textTransform:'uppercase' as const, display:'block', marginBottom:6 };

const BLOOD_GROUPS = ['', 'O_POSITIVE','O_NEGATIVE','A_POSITIVE','A_NEGATIVE','B_POSITIVE','B_NEGATIVE','AB_POSITIVE','AB_NEGATIVE'];
const BLOOD_DISPLAY: Record<string,string> = { O_POSITIVE:'O+', O_NEGATIVE:'O-', A_POSITIVE:'A+', A_NEGATIVE:'A-', B_POSITIVE:'B+', B_NEGATIVE:'B-', AB_POSITIVE:'AB+', AB_NEGATIVE:'AB-' };
const GENDERS = ['','MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY'];

type EmContact = { id?: string; name: string; phone: string; relationship: string; isPrimary?: boolean; };

export default function ProfilePage() {
  const [profile,    setProfile]    = useState<any>(null);
  const [contacts,   setContacts]   = useState<EmContact[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [tab,        setTab]        = useState<'personal'|'emergency'|'medical'>('personal');
  const [toast,      setToast]      = useState('');
  const [err,        setErr]        = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    (async () => {
      try {
        const [profRes, contRes] = await Promise.allSettled([
          (patientAPI as any).getProfile(),
          (patientAPI as any).getEmergencyContacts(),
        ]);
        if (profRes.status === 'fulfilled') setProfile(profRes.value?.data?.data ?? profRes.value?.data ?? {});
        if (contRes.status === 'fulfilled') setContacts(contRes.value?.data?.data ?? contRes.value?.data ?? []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const set = (k: string, v: any) => setProfile((p: any) => ({ ...p, [k]: v }));

  const saveProfile = async () => {
    setSaving(true); setErr('');
    try {
      await (patientAPI as any).updateProfile(profile);
      showToast('✓ Profile saved successfully');
    } catch (e: any) { setErr(e?.response?.data?.message ?? 'Failed to save'); }
    setSaving(false);
  };

  const addContact = async () => {
    const blank: EmContact = { name:'', phone:'', relationship:'', isPrimary: contacts.length === 0 };
    setContacts(prev => [...prev, blank]);
  };

  const saveContact = async (idx: number) => {
    const c = contacts[idx];
    if (!c.name || !c.phone) return;
    try {
      if (c.id) {
        await (patientAPI as any).updateEmergencyContact(c.id, c);
      } else {
        const r: any = await (patientAPI as any).addEmergencyContact(c);
        const saved = r?.data?.data ?? r?.data;
        setContacts(prev => prev.map((x, i) => i === idx ? { ...x, id: saved?.id } : x));
      }
      showToast('✓ Contact saved');
    } catch { showToast('Failed to save contact'); }
  };

  const deleteContact = async (idx: number) => {
    const c = contacts[idx];
    if (c.id) {
      try { await (patientAPI as any).deleteEmergencyContact(c.id); } catch {}
    }
    setContacts(prev => prev.filter((_, i) => i !== idx));
    showToast('Contact removed');
  };

  const updateContact = (idx: number, k: string, v: string) => {
    setContacts(prev => prev.map((c, i) => i === idx ? { ...c, [k]: v } : c));
  };

  const dob = profile?.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '';

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ height:36, width:200, borderRadius:10, background:'rgba(255,255,255,0.08)', animation:'hcPulse 1.5s ease infinite' }} />
      <div style={{ height:200, borderRadius:16, background:'rgba(255,255,255,0.06)', animation:'hcPulse 1.5s ease infinite' }} />
      <style>{`@keyframes hcPulse{0%,100%{opacity:.6}50%{opacity:1}}`}</style>
    </div>
  );

  const initials = `${profile?.firstName?.[0]??''}${profile?.lastName?.[0]??''}`.toUpperCase() || '?';

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
      {toast && (
        <div style={{ position:'fixed', bottom:28, right:28, zIndex:9999, background:'#0F2D2A', color:'#fff', padding:'12px 20px', borderRadius:12, fontSize:14, fontWeight:600, boxShadow:'0 8px 24px rgba(0,0,0,0.3)', border:'1px solid rgba(20,184,166,0.3)' }}>{toast}</div>
      )}

      {/* Header */}
      <div>
        <h1 style={{ fontSize:26, fontWeight:800, color:'#fff', margin:'0 0 6px', display:'flex', alignItems:'center', gap:10 }}>👤 Profile</h1>
        <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14, margin:0 }}>Manage your personal information and emergency contacts</p>
      </div>

      {/* Profile summary card */}
      <div style={{ ...card, padding:'24px 28px', display:'flex', alignItems:'center', gap:22, flexWrap:'wrap' }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:`linear-gradient(135deg,${C.teal},${C.tealLight})`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:26, flexShrink:0 }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:4 }}>{[profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Patient'}</div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
            {profile?.registrationId && <span style={{ fontSize:13, color:C.text3, fontFamily:'monospace' }}>{profile.registrationId}</span>}
            {profile?.bloodGroup && (
              <span style={{ padding:'3px 12px', borderRadius:100, background:C.tealBg, border:`1px solid rgba(13,148,136,0.25)`, color:C.teal, fontSize:12, fontWeight:700 }}>
                {BLOOD_DISPLAY[profile.bloodGroup] ?? profile.bloodGroup} Blood
              </span>
            )}
            {profile?.subscriptionTier?.toLowerCase() === 'premium' && (
              <span style={{ padding:'3px 12px', borderRadius:100, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)', color:'#D97706', fontSize:12, fontWeight:700 }}>⭐ Premium</span>
            )}
          </div>
        </div>
        <div style={{ marginLeft:'auto' }}>
          <button onClick={saveProfile} disabled={saving} style={{ padding:'10px 24px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${C.teal},${C.tealLight})`, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', opacity:saving?0.7:1, boxShadow:'0 4px 14px rgba(13,148,136,0.3)' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:`1px solid rgba(255,255,255,0.1)` }}>
        {([['personal','Personal Info'],['emergency','Emergency Contacts'],['medical','Medical Info']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding:'12px 24px', background:'none', border:'none', cursor:'pointer',
            fontSize:14, fontWeight:600,
            color: tab===id ? C.tealLight : 'rgba(255,255,255,0.45)',
            borderBottom: tab===id ? `2px solid ${C.tealLight}` : '2px solid transparent',
            transition:'all 0.15s', marginBottom:-1,
          }}>{label}</button>
        ))}
      </div>

      {/* ── PERSONAL INFO ── */}
      {tab === 'personal' && (
        <div style={{ ...card, padding:'28px' }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:24 }}>Personal Information</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div>
              <label style={lbl}>First Name</label>
              <input value={profile?.firstName ?? ''} onChange={e => set('firstName', e.target.value)} placeholder="First name" style={inp} />
            </div>
            <div>
              <label style={lbl}>Last Name</label>
              <input value={profile?.lastName ?? ''} onChange={e => set('lastName', e.target.value)} placeholder="Last name" style={inp} />
            </div>
            <div>
              <label style={lbl}>Phone Number</label>
              <input value={profile?.phone ?? ''} onChange={e => set('phone', e.target.value)} placeholder="+91 9876543210" style={inp} />
            </div>
            <div>
              <label style={lbl}>Date of Birth</label>
              <input type="date" value={dob} onChange={e => set('dateOfBirth', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Gender</label>
              <select value={profile?.gender ?? ''} onChange={e => set('gender', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
                {GENDERS.map(g => <option key={g} value={g}>{g || 'Select gender'}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Blood Group</label>
              <select value={profile?.bloodGroup ?? ''} onChange={e => set('bloodGroup', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
                {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b ? (BLOOD_DISPLAY[b] ?? b) : 'Select blood group'}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginTop:20 }}>
            <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:16 }}>Address</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
              <div>
                <label style={lbl}>City</label>
                <input value={profile?.city ?? ''} onChange={e => set('city', e.target.value)} placeholder="Mumbai" style={inp} />
              </div>
              <div>
                <label style={lbl}>State</label>
                <input value={profile?.state ?? ''} onChange={e => set('state', e.target.value)} placeholder="Maharashtra" style={inp} />
              </div>
              <div>
                <label style={lbl}>PIN Code</label>
                <input value={profile?.pinCode ?? ''} onChange={e => set('pinCode', e.target.value)} placeholder="400001" style={inp} />
              </div>
            </div>
          </div>

          {err && <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:9, padding:'12px 16px', color:C.red, fontSize:13, marginTop:16 }}>{err}</div>}

          <div style={{ marginTop:24, display:'flex', justifyContent:'flex-end' }}>
            <button onClick={saveProfile} disabled={saving} style={{ padding:'12px 32px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${C.teal},${C.tealLight})`, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', opacity:saving?0.7:1, boxShadow:'0 4px 14px rgba(13,148,136,0.3)' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* ── EMERGENCY CONTACTS ── */}
      {tab === 'emergency' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ ...card, padding:'18px 24px', background:'rgba(239,68,68,0.04)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:14, display:'flex', gap:12, alignItems:'flex-start' }}>
            <span style={{ fontSize:20 }}>🚨</span>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:3 }}>Emergency Contacts</div>
              <div style={{ fontSize:13, color:C.text3 }}>These contacts will be notified if you trigger Emergency SOS. Add at least one primary contact.</div>
            </div>
          </div>

          {contacts.map((c, idx) => (
            <div key={idx} style={{ ...card, padding:'22px 24px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:C.tealBg, border:`1.5px solid rgba(13,148,136,0.3)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>👤</div>
                  <span style={{ fontSize:15, fontWeight:700, color:C.text }}>{c.name || `Contact ${idx+1}`}</span>
                  {c.isPrimary && <span style={{ padding:'2px 10px', borderRadius:100, background:'rgba(13,148,136,0.1)', color:C.teal, fontSize:11, fontWeight:700, border:`1px solid rgba(13,148,136,0.25)` }}>PRIMARY</span>}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => saveContact(idx)} style={{ padding:'7px 16px', borderRadius:8, border:`1.5px solid rgba(13,148,136,0.25)`, background:C.tealBg, color:C.teal, fontSize:12, fontWeight:700, cursor:'pointer' }}>Save</button>
                  <button onClick={() => deleteContact(idx)} style={{ padding:'7px 14px', borderRadius:8, border:'1.5px solid rgba(239,68,68,0.25)', background:'transparent', color:C.red, fontSize:12, fontWeight:600, cursor:'pointer' }}>Remove</button>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
                <div>
                  <label style={lbl}>Full Name</label>
                  <input value={c.name} onChange={e => updateContact(idx, 'name', e.target.value)} placeholder="Contact name" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Phone Number</label>
                  <input value={c.phone} onChange={e => updateContact(idx, 'phone', e.target.value)} placeholder="+91 9876543210" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Relationship</label>
                  <select value={c.relationship} onChange={e => updateContact(idx, 'relationship', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
                    <option value="">Select</option>
                    {['Spouse','Parent','Child','Sibling','Friend','Other'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}

          <button onClick={addContact} style={{ padding:'14px', borderRadius:14, border:`2px dashed rgba(255,255,255,0.15)`, background:'transparent', color:'rgba(255,255,255,0.5)', fontSize:14, fontWeight:600, cursor:'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.tealLight; (e.currentTarget as HTMLElement).style.color = C.tealLight; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; }}
          >
            + Add Emergency Contact
          </button>
        </div>
      )}

      {/* ── MEDICAL INFO ── */}
      {tab === 'medical' && (
        <div style={{ ...card, padding:'28px' }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:24 }}>Medical Information</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div>
              <label style={lbl}>Height (cm)</label>
              <input type="number" value={profile?.height ?? ''} onChange={e => set('height', e.target.value)} placeholder="175" style={inp} />
            </div>
            <div>
              <label style={lbl}>Weight (kg)</label>
              <input type="number" value={profile?.weight ?? ''} onChange={e => set('weight', e.target.value)} placeholder="70" style={inp} />
            </div>
          </div>
          <div style={{ marginTop:20 }}>
            <label style={lbl}>Known Allergies</label>
            <textarea value={profile?.allergiesSummary ?? ''} onChange={e => set('allergiesSummary', e.target.value)} placeholder="e.g. Penicillin, Peanuts, Latex..." rows={3} style={{ ...inp, resize:'vertical' }} />
          </div>
          <div style={{ marginTop:16 }}>
            <label style={lbl}>Current Medical Conditions</label>
            <textarea value={profile?.conditionsSummary ?? ''} onChange={e => set('conditionsSummary', e.target.value)} placeholder="e.g. Type 2 Diabetes, Hypertension..." rows={3} style={{ ...inp, resize:'vertical' }} />
          </div>
          <div style={{ marginTop:16 }}>
            <label style={lbl}>Additional Notes for Doctors</label>
            <textarea value={profile?.medicalNotes ?? ''} onChange={e => set('medicalNotes', e.target.value)} placeholder="Any relevant medical history doctors should know..." rows={3} style={{ ...inp, resize:'vertical' }} />
          </div>
          <div style={{ marginTop:24, display:'flex', justifyContent:'flex-end' }}>
            <button onClick={saveProfile} disabled={saving} style={{ padding:'12px 32px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${C.teal},${C.tealLight})`, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', opacity:saving?0.7:1, boxShadow:'0 4px 14px rgba(13,148,136,0.3)' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
