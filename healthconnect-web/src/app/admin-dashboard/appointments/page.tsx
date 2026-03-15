'use client';
// src/app/admin-dashboard/appointments/page.tsx
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const C = { card:'#FFFFFF', border:'rgba(45,139,122,0.14)', teal:'#2D8B7A', text:'#1C3A35', muted:'#5A7184', green:'#16A34A', amber:'#D97706', red:'#DC2626' };
const STATUS_COLORS: Record<string,string> = { PENDING:C.amber, CONFIRMED:C.teal, COMPLETED:C.green, CANCELLED:C.red, NO_SHOW:'#94A3B8' };

export default function AppointmentsPage() {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/appointments')
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:300 }}>
      <div style={{ width:36, height:36, border:`3px solid ${C.border}`, borderTop:`3px solid ${C.teal}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const byStatus = data?.byStatus || [];
  const byType   = data?.byType   || [];
  const recent   = data?.recent   || [];
  const total    = byStatus.reduce((a:number,i:any)=>a+i._count,0);

  return (
    <div style={{ color:C.text, fontFamily:"'Inter',sans-serif" }}>
      <div style={{ marginBottom:22 }}>
        <h1 style={{ margin:0, fontSize:24, fontWeight:700, letterSpacing:'-0.4px' }}>Appointments</h1>
        <p style={{ margin:'4px 0 0', color:C.muted, fontSize:13 }}>{total.toLocaleString()} total appointments</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        {/* By Status */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:600 }}>By Status</h3>
          {byStatus.map((item:any)=>{
            const pct = total>0?((item._count/total)*100).toFixed(0):0;
            return (
              <div key={item.status} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background:STATUS_COLORS[item.status]||C.muted, display:'inline-block' }} />
                    <span style={{ color:C.text, fontSize:12, fontWeight:500 }}>{item.status}</span>
                  </span>
                  <span style={{ color:C.muted, fontSize:12 }}>{item._count} ({pct}%)</span>
                </div>
                <div style={{ height:5, background:'#F1F5F9', borderRadius:3 }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:STATUS_COLORS[item.status]||C.teal, borderRadius:3 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* By Type */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:600 }}>By Type</h3>
          {byType.map((item:any)=>(
            <div key={item.type} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid #F1F5F9` }}>
              <span style={{ color:C.text, fontSize:13 }}>{item.type.replace(/_/g,' ')}</span>
              <span style={{ background:'#F0F9F8', color:C.teal, padding:'3px 10px', borderRadius:5, fontSize:12, fontWeight:600 }}>{item._count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent appointments table */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,0.04)' }}>
        <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}` }}>
          <h3 style={{ margin:0, fontSize:14, fontWeight:600 }}>Recent Appointments</h3>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}`, background:'#F8FFFE' }}>
              {['Patient','Doctor','Specialization','Type','Scheduled','Status'].map(h=>(
                <th key={h} style={{ padding:'10px 14px', textAlign:'left', color:C.muted, fontSize:10, fontWeight:600, textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map((a:any)=>(
              <tr key={a.id} style={{ borderBottom:`1px solid #F8FAFC` }}>
                <td style={{ padding:'11px 14px', color:C.text, fontWeight:500 }}>{a.patient?.firstName} {a.patient?.lastName}</td>
                <td style={{ padding:'11px 14px', color:C.text }}>Dr. {a.doctor?.firstName} {a.doctor?.lastName}</td>
                <td style={{ padding:'11px 14px', color:C.muted, fontSize:12 }}>{a.doctor?.specialization||'—'}</td>
                <td style={{ padding:'11px 14px', color:C.muted, fontSize:12 }}>{a.type?.replace(/_/g,' ')}</td>
                <td style={{ padding:'11px 14px', color:C.muted, fontSize:11 }}>{new Date(a.scheduledAt).toLocaleDateString('en-IN')}</td>
                <td style={{ padding:'11px 14px' }}>
                  <span style={{ background:(STATUS_COLORS[a.status]||C.muted)+'18', color:STATUS_COLORS[a.status]||C.muted, padding:'3px 8px', borderRadius:5, fontSize:10, fontWeight:700 }}>{a.status}</span>
                </td>
              </tr>
            ))}
            {recent.length===0&&<tr><td colSpan={6} style={{ padding:40, textAlign:'center', color:C.muted }}>No appointments yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
