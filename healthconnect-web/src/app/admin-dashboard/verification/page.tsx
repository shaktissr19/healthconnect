'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const C = { card:'#FFFFFF', border:'rgba(45,139,122,0.14)', teal:'#2D8B7A', text:'#1C3A35', muted:'#5A7184', green:'#16A34A', amber:'#D97706', red:'#DC2626' };

export default function VerificationPage() {
  const [doctors,  setDoctors]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [reason,   setReason]   = useState('');
  const [acting,   setActing]   = useState(false);
  const [done,     setDone]     = useState<string[]>([]);

  useEffect(() => {
    api.get('/admin/doctors/pending')
      .then(r => setDoctors(r.data.data.doctors || r.data.data))
      .finally(() => setLoading(false));
  }, []);

  const act = async (d: any, action: 'approve' | 'reject') => {
    if (action==='reject' && !reason.trim()) { alert('Please provide a rejection reason'); return; }
    setActing(true);
    try {
      await api.post(`/admin/doctors/${d.id}/verify`, { action, reason: action==='reject'?reason:undefined });
      setDone(prev => [...prev, d.id]);
      setSelected(null);
      setReason('');
    } catch { alert('Action failed'); }
    setActing(false);
  };

  const visible = doctors.filter(d => !done.includes(d.id));

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:300 }}>
      <div style={{ width:36, height:36, border:`3px solid ${C.border}`, borderTop:`3px solid ${C.teal}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ color:C.text, fontFamily:"'Inter',sans-serif" }}>
      <div style={{ marginBottom:22 }}>
        <h1 style={{ margin:0, fontSize:24, fontWeight:700, letterSpacing:'-0.4px' }}>Doctor Verification</h1>
        <p style={{ margin:'4px 0 0', color:C.muted, fontSize:13 }}>{visible.length} pending review</p>
      </div>

      {visible.length===0 ? (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:60, textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
          <h3 style={{ margin:'0 0 6px', color:C.text }}>All caught up!</h3>
          <p style={{ color:C.muted, margin:0 }}>No doctors pending verification.</p>
        </div>
      ) : (
        <div style={{ display:'grid', gap:14 }}>
          {visible.map(d=>(
            <div key={d.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:`${C.teal}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🩺</div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:15 }}>Dr. {d.firstName} {d.lastName}</div>
                      <div style={{ color:C.muted, fontSize:12 }}>{d.user?.email} · Registered {new Date(d.createdAt).toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
                    {[['Specialization',d.specialization],['License',d.medicalLicenseNumber],['State',d.licenseState],['City',d.city],['Experience',d.experienceYears?`${d.experienceYears} yrs`:'—'],['Fee',d.consultationFee?`₹${d.consultationFee}`:'—']].map(([k,v])=>(
                      <div key={k as string}>
                        <div style={{ color:C.muted, fontSize:10, textTransform:'uppercase', letterSpacing:'0.5px' }}>{k}</div>
                        <div style={{ color:C.text, fontSize:13, fontWeight:500 }}>{v as string||'—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, flexShrink:0, marginLeft:16 }}>
                  <button onClick={()=>{setSelected({...d,_action:'reject'});setReason('');}} style={{ padding:'8px 16px', borderRadius:8, border:'none', background:'#FEE2E2', color:C.red, cursor:'pointer', fontSize:13, fontWeight:600 }}>Reject</button>
                  <button onClick={()=>act(d,'approve')} style={{ padding:'8px 16px', borderRadius:8, border:'none', background:C.green, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>✓ Approve</button>
                </div>
              </div>
              {d.bio&&<div style={{ marginTop:12, padding:10, background:'#F8FFFE', borderRadius:8, fontSize:12, color:C.muted }}>{d.bio}</div>}
            </div>
          ))}
        </div>
      )}

      {selected&&(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:26, width:400, boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin:'0 0 8px', color:C.text }}>Reject Dr. {selected.firstName} {selected.lastName}?</h3>
            <p style={{ color:C.muted, fontSize:13, margin:'0 0 14px' }}>The doctor will be notified with your reason.</p>
            <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason for rejection (required)…" rows={3} style={{ width:'100%', padding:10, borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, color:C.text, outline:'none', resize:'vertical', boxSizing:'border-box' }} />
            <div style={{ display:'flex', gap:10, marginTop:14 }}>
              <button onClick={()=>setSelected(null)} style={{ flex:1, padding:'9px', borderRadius:8, border:`1px solid ${C.border}`, background:'transparent', color:C.muted, cursor:'pointer' }}>Cancel</button>
              <button disabled={acting} onClick={()=>act(selected,'reject')} style={{ flex:1, padding:'9px', borderRadius:8, border:'none', background:C.red, color:'#fff', cursor:'pointer', fontWeight:600 }}>
                {acting?'Processing…':'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
