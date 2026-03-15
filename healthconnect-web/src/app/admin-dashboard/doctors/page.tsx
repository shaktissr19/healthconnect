'use client';
// src/app/admin-dashboard/doctors/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

const C = { card:'#FFFFFF', border:'rgba(45,139,122,0.14)', teal:'#2D8B7A', text:'#1C3A35', muted:'#5A7184', green:'#16A34A', amber:'#D97706', red:'#DC2626' };

export default function DoctorsPage() {
  const [doctors, setDoctors]   = useState<any[]>([]);
  const [total,   setTotal]     = useState(0);
  const [page,    setPage]      = useState(1);
  const [pages,   setPages]     = useState(1);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState('');
  const [verified, setVerified] = useState('');
  const [selected, setSelected] = useState<any>(null);

  const load = useCallback(async (p=1) => {
    setLoading(true);
    try {
      const params: any = { page:p, limit:20 };
      if (search)   params.search   = search;
      if (verified) params.verified = verified;
      const r = await api.get('/admin/doctors', { params });
      setDoctors(r.data.data.doctors);
      setTotal(r.data.data.total);
      setPages(r.data.data.pages);
      setPage(p);
    } catch { /* */ } finally { setLoading(false); }
  }, [search, verified]);

  useEffect(() => { load(1); }, [search, verified]);

  const toggleVerify = async (d: any) => {
    try {
      await api.post(`/admin/doctors/${d.id}/verify`, {
        action: d.isVerified ? 'reject' : 'approve',
        reason: d.isVerified ? 'Verification revoked by admin' : undefined,
      });
      setDoctors(prev => prev.map(x => x.id===d.id ? {...x, isVerified:!x.isVerified, verifiedAt:!x.isVerified?new Date().toISOString():null} : x));
      setSelected(null);
    } catch { alert('Action failed'); }
  };

  const inp = { padding:'8px 12px', borderRadius:8, border:`1px solid ${C.border}`, background:'#fff', color:C.text, fontSize:13, outline:'none' } as React.CSSProperties;

  return (
    <div style={{ color:C.text, fontFamily:"'Inter',sans-serif" }}>
      <div style={{ marginBottom:22 }}>
        <h1 style={{ margin:0, fontSize:24, fontWeight:700, letterSpacing:'-0.4px' }}>Doctors</h1>
        <p style={{ margin:'4px 0 0', color:C.muted, fontSize:13 }}>{total.toLocaleString()} total doctors</p>
      </div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:14, marginBottom:18, display:'flex', gap:10, flexWrap:'wrap', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, specialization, city…" style={{ ...inp, flex:1, minWidth:220 }} />
        <select value={verified} onChange={e=>setVerified(e.target.value)} style={inp}>
          <option value="">All Doctors</option>
          <option value="true">Verified Only</option>
          <option value="false">Unverified Only</option>
        </select>
      </div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <div style={{ padding:48, textAlign:'center' }}>
            <div style={{ width:36, height:36, border:`3px solid ${C.border}`, borderTop:`3px solid ${C.teal}`, borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${C.border}`, background:'#F8FFFE' }}>
                {['Doctor','Specialization','City','License','Fee','Rating','Status','Actions'].map(h=>(
                  <th key={h} style={{ padding:'11px 14px', textAlign:'left', color:C.muted, fontSize:10, fontWeight:600, textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doctors.map(d=>(
                <tr key={d.id} style={{ borderBottom:`1px solid #F8FAFC` }}>
                  <td style={{ padding:'11px 14px' }}>
                    <div style={{ fontWeight:600, color:C.text }}>Dr. {d.firstName} {d.lastName}</div>
                    <div style={{ color:C.muted, fontSize:11 }}>{d.user?.email}</div>
                  </td>
                  <td style={{ padding:'11px 14px', color:C.muted, fontSize:12 }}>{d.specialization||'—'}</td>
                  <td style={{ padding:'11px 14px', color:C.muted, fontSize:12 }}>{d.city||'—'}</td>
                  <td style={{ padding:'11px 14px', color:C.muted, fontSize:11 }}>{d.medicalLicenseNumber||'—'}</td>
                  <td style={{ padding:'11px 14px', color:C.text, fontSize:12 }}>{d.consultationFee?`₹${d.consultationFee}`:'—'}</td>
                  <td style={{ padding:'11px 14px', color:C.text, fontSize:12 }}>{d.averageRating>0?`⭐ ${d.averageRating.toFixed(1)}`:'—'}</td>
                  <td style={{ padding:'11px 14px' }}>
                    <span style={{ background:d.isVerified?'#DCFCE7':'#FEF3C7', color:d.isVerified?C.green:C.amber, padding:'3px 8px', borderRadius:5, fontSize:10, fontWeight:700 }}>
                      {d.isVerified?'✓ Verified':'Pending'}
                    </span>
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={()=>setSelected(d)} style={{ padding:'5px 10px', borderRadius:6, border:`1px solid ${C.border}`, background:'#F0F9F8', color:C.teal, cursor:'pointer', fontSize:11, fontWeight:500 }}>View</button>
                      <button onClick={()=>toggleVerify(d)} style={{ padding:'5px 10px', borderRadius:6, border:'none', cursor:'pointer', fontSize:11, fontWeight:600, background:d.isVerified?'#FEE2E2':'#DCFCE7', color:d.isVerified?C.red:C.green }}>
                        {d.isVerified?'Revoke':'Verify'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {doctors.length===0&&<tr><td colSpan={8} style={{ padding:48, textAlign:'center', color:C.muted }}>No doctors found</td></tr>}
            </tbody>
          </table>
        )}
        {pages>1&&(
          <div style={{ padding:'12px 14px', borderTop:`1px solid ${C.border}`, display:'flex', gap:6, justifyContent:'center' }}>
            {Array.from({length:pages},(_,i)=>i+1).map(p=>(
              <button key={p} onClick={()=>load(p)} style={{ width:30, height:30, borderRadius:6, border:`1px solid ${C.border}`, background:p===page?C.teal:'transparent', color:p===page?'#fff':C.muted, cursor:'pointer', fontSize:12 }}>{p}</button>
            ))}
          </div>
        )}
      </div>

      {/* Doctor detail modal */}
      {selected&&(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:16, padding:28, width:480, maxHeight:'85vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
              <div>
                <h3 style={{ margin:0, color:C.text, fontSize:16, fontWeight:700 }}>Dr. {selected.firstName} {selected.lastName}</h3>
                <p style={{ margin:'3px 0 0', color:C.muted, fontSize:12 }}>{selected.user?.email}</p>
              </div>
              <button onClick={()=>setSelected(null)} style={{ background:'none', border:'none', color:C.muted, fontSize:18, cursor:'pointer' }}>✕</button>
            </div>
            {[
              ['Specialization', selected.specialization],
              ['License No.', selected.medicalLicenseNumber],
              ['License State', selected.licenseState],
              ['Experience', selected.experienceYears?`${selected.experienceYears} years`:'—'],
              ['Consultation Fee', selected.consultationFee?`₹${selected.consultationFee}`:'—'],
              ['Teleconsult Fee', selected.teleconsultFee?`₹${selected.teleconsultFee}`:'—'],
              ['City / State', `${selected.city||'—'} / ${selected.state||'—'}`],
              ['Clinic', selected.clinicName||'—'],
              ['Languages', selected.languagesSpoken?.join(', ')||'—'],
              ['Patients', selected.totalPatients||0],
              ['Rating', selected.averageRating>0?`${selected.averageRating.toFixed(1)} / 5`:'No ratings yet'],
              ['Registered', new Date(selected.createdAt).toLocaleDateString('en-IN')],
              ['Verified At', selected.verifiedAt?new Date(selected.verifiedAt).toLocaleDateString('en-IN'):'Not verified'],
            ].map(([k,v])=>(
              <div key={k as string} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid #F1F5F9` }}>
                <span style={{ color:C.muted, fontSize:12 }}>{k}</span>
                <span style={{ color:C.text, fontSize:12, fontWeight:500, maxWidth:260, textAlign:'right' }}>{v as string}</span>
              </div>
            ))}
            {selected.bio&&<div style={{ marginTop:12, padding:12, background:'#F8FFFE', borderRadius:8 }}>
              <div style={{ color:C.muted, fontSize:11, marginBottom:4 }}>Bio</div>
              <p style={{ margin:0, color:C.text, fontSize:12, lineHeight:1.6 }}>{selected.bio}</p>
            </div>}
            <div style={{ display:'flex', gap:10, marginTop:18 }}>
              <button onClick={()=>setSelected(null)} style={{ flex:1, padding:'9px', borderRadius:8, border:`1px solid ${C.border}`, background:'transparent', color:C.muted, cursor:'pointer' }}>Close</button>
              <button onClick={()=>toggleVerify(selected)} style={{ flex:1, padding:'9px', borderRadius:8, border:'none', background:selected.isVerified?C.red:C.green, color:'#fff', cursor:'pointer', fontWeight:600 }}>
                {selected.isVerified?'Revoke Verification':'Approve & Verify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
