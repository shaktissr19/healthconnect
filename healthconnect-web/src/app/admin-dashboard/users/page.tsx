'use client';
// src/app/admin-dashboard/users/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

const C = { card:'#FFFFFF', border:'rgba(45,139,122,0.14)', teal:'#2D8B7A', text:'#1C3A35', muted:'#5A7184', green:'#16A34A', amber:'#D97706', red:'#DC2626' };
const ROLE_COLORS: Record<string,string> = { PATIENT:'#0D9488', DOCTOR:'#2563EB', HOSPITAL:'#D97706', ADMIN:'#DC2626' };

export default function UsersPage() {
  const [users,    setUsers]   = useState<any[]>([]);
  const [total,    setTotal]   = useState(0);
  const [page,     setPage]    = useState(1);
  const [pages,    setPages]   = useState(1);
  const [loading,  setLoading] = useState(true);
  const [search,   setSearch]  = useState('');
  const [role,     setRole]    = useState('');
  const [status,   setStatus]  = useState('');
  const [confirm,  setConfirm] = useState<any>(null);

  const load = useCallback(async (p=1) => {
    setLoading(true);
    try {
      const params: any = { page:p, limit:20 };
      if (search) params.search = search;
      if (role)   params.role   = role;
      if (status) params.status = status;
      const r = await api.get('/admin/users', { params });
      setUsers(r.data.data.users);
      setTotal(r.data.data.total);
      setPages(r.data.data.pages);
      setPage(p);
    } catch { /* handled */ } finally { setLoading(false); }
  }, [search, role, status]);

  useEffect(() => { load(1); }, [search, role, status]);

  const toggleStatus = async (user: any) => {
    try {
      await api.patch(`/admin/users/${user.id}/toggle`);
      setUsers(prev => prev.map(u => u.id===user.id ? {...u, isActive:!u.isActive} : u));
    } catch { alert('Failed to update'); }
    setConfirm(null);
  };

  const getName = (u: any) => {
    if (u.doctorProfile)   return `Dr. ${u.doctorProfile.firstName} ${u.doctorProfile.lastName}`;
    if (u.patientProfile)  return `${u.patientProfile.firstName} ${u.patientProfile.lastName}`;
    if (u.hospitalProfile) return u.hospitalProfile.name;
    return u.email.split('@')[0];
  };

  const inp = { padding:'8px 12px', borderRadius:8, border:`1px solid ${C.border}`, background:'#fff', color:C.text, fontSize:13, outline:'none' } as React.CSSProperties;

  return (
    <div style={{ color:C.text, fontFamily:"'Inter',sans-serif" }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
        <div>
          <h1 style={{ margin:0, fontSize:24, fontWeight:700, letterSpacing:'-0.4px' }}>User Management</h1>
          <p style={{ margin:'4px 0 0', color:C.muted, fontSize:13 }}>{total.toLocaleString()} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:14, marginBottom:18, display:'flex', gap:10, flexWrap:'wrap', alignItems:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by email or ID…" style={{ ...inp, flex:1, minWidth:200 }} />
        <select value={role} onChange={e=>setRole(e.target.value)} style={inp}>
          <option value="">All Roles</option>
          <option value="PATIENT">Patient</option>
          <option value="DOCTOR">Doctor</option>
          <option value="HOSPITAL">Hospital</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select value={status} onChange={e=>setStatus(e.target.value)} style={inp}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
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
                {['Name','Email','Role','Status','Email Verified','Joined','Last Login','Actions'].map(h=>(
                  <th key={h} style={{ padding:'11px 14px', textAlign:'left', color:C.muted, fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u=>(
                <tr key={u.id} style={{ borderBottom:`1px solid #F8FAFC` }}>
                  <td style={{ padding:'11px 14px', color:C.text, fontWeight:500 }}>{getName(u)}</td>
                  <td style={{ padding:'11px 14px', color:C.muted, fontSize:12 }}>{u.email}</td>
                  <td style={{ padding:'11px 14px' }}>
                    <span style={{ background:(ROLE_COLORS[u.role]||C.teal)+'18', color:ROLE_COLORS[u.role]||C.teal, padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:700 }}>{u.role}</span>
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background:u.isActive?C.green:C.red, display:'inline-block' }} />
                      <span style={{ color:u.isActive?C.green:C.red, fontSize:11, fontWeight:500 }}>{u.isActive?'Active':'Inactive'}</span>
                    </span>
                  </td>
                  <td style={{ padding:'11px 14px', fontSize:11 }}>
                    <span style={{ color:u.isEmailVerified?C.green:C.amber }}>{u.isEmailVerified?'✅ Yes':'⏳ No'}</span>
                  </td>
                  <td style={{ padding:'11px 14px', color:C.muted, fontSize:11 }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding:'11px 14px', color:C.muted, fontSize:11 }}>{u.lastLoginAt?new Date(u.lastLoginAt).toLocaleDateString('en-IN'):'—'}</td>
                  <td style={{ padding:'11px 14px' }}>
                    <button onClick={()=>setConfirm({user:u,action:u.isActive?'deactivate':'activate'})}
                      style={{ padding:'5px 11px', borderRadius:6, border:'none', cursor:'pointer', fontSize:11, fontWeight:600,
                        background:u.isActive?'#FEE2E2':'#DCFCE7', color:u.isActive?C.red:C.green }}>
                      {u.isActive?'Deactivate':'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length===0&&<tr><td colSpan={8} style={{ padding:48, textAlign:'center', color:C.muted }}>No users found</td></tr>}
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

      {/* Confirm modal */}
      {confirm&&(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:26, width:360, boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin:'0 0 8px', color:C.text, fontSize:15, fontWeight:600 }}>Confirm {confirm.action}</h3>
            <p style={{ color:C.muted, fontSize:13, margin:'0 0 20px' }}>
              {confirm.action==='deactivate'?`This will block ${confirm.user.email} from logging in.`:`This will restore access for ${confirm.user.email}.`}
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setConfirm(null)} style={{ flex:1, padding:'9px', borderRadius:8, border:`1px solid ${C.border}`, background:'transparent', color:C.muted, cursor:'pointer', fontSize:13 }}>Cancel</button>
              <button onClick={()=>toggleStatus(confirm.user)} style={{ flex:1, padding:'9px', borderRadius:8, border:'none', background:confirm.action==='deactivate'?C.red:C.green, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
