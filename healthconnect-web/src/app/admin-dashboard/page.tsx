'use client';
// src/app/admin-dashboard/page.tsx
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const C = { card:'#FFFFFF', border:'rgba(45,139,122,0.14)', teal:'#2D8B7A', text:'#1C3A35', muted:'#5A7184', green:'#16A34A', amber:'#D97706', red:'#DC2626' };

function StatCard({ label, value, sub, color, icon }: any) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 22px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ color: C.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ color: color || C.text, fontSize: 30, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export default function AdminOverviewPage() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => setData(r.data.data))
      .catch(() => setError('Failed to load stats — token may have expired. Please sign out and sign back in.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:300 }}>
      <div style={{ width:36, height:36, border:`3px solid ${C.border}`, borderTop:`3px solid ${C.teal}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:12, padding:20, color:C.red, fontSize:14 }}>
      ⚠️ {error}
      <br /><br />
      <a href="/" style={{ color:C.teal, fontWeight:600 }}>← Sign out and sign back in</a>
    </div>
  );

  const t = data?.totals || {};
  const tm = data?.thisMonth || {};
  const pending = data?.pending || {};

  return (
    <div style={{ color: C.text, fontFamily: "'Inter',sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin:0, fontSize:24, fontWeight:700, letterSpacing:'-0.4px', color:C.text }}>Platform Overview</h1>
        <p style={{ margin:'4px 0 0', color:C.muted, fontSize:13 }}>{new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
      </div>

      {pending.doctorVerifications > 0 && (
        <a href="/admin-dashboard/verification" style={{ textDecoration:'none' }}>
          <div style={{ background:'#FFFBEB', border:'1px solid #FCD34D', borderRadius:10, padding:'12px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:16 }}>⚠️</span>
            <span style={{ color:C.amber, fontSize:13, fontWeight:500 }}>
              {pending.doctorVerifications} doctor{pending.doctorVerifications!==1?'s':''} pending verification — <strong>Review now →</strong>
            </span>
          </div>
        </a>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:14, marginBottom:24 }}>
        <StatCard label="Total Users"    value={t.totalUsers?.toLocaleString()}        icon="👥" sub={`+${tm.newUsers||0} this month`} />
        <StatCard label="Doctors"        value={t.totalDoctors?.toLocaleString()}       icon="🩺" sub={`${pending.doctorVerifications||0} pending`} color={pending.doctorVerifications>0?C.amber:undefined} />
        <StatCard label="Patients"       value={t.totalPatients?.toLocaleString()}      icon="🏥" />
        <StatCard label="Hospitals"      value={t.totalHospitals?.toLocaleString()}     icon="🏨" />
        <StatCard label="Appointments"   value={t.totalAppointments?.toLocaleString()}  icon="📅" sub={`+${tm.appointments||0} this month`} />
        <StatCard label="Active Subs"    value={t.activeSubscriptions?.toLocaleString()} icon="💳" color={C.green} />
        <StatCard label="Communities"    value={t.totalCommunities?.toLocaleString()}   icon="🏘️" />
        <StatCard label="Revenue/Month"  value={`₹${((tm.revenue||0)/100).toLocaleString('en-IN')}`} icon="📈" color={C.green} sub={`Last month: ₹${((tm.lastMonthRevenue||0)/100).toLocaleString('en-IN')}`} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:18, marginBottom:20 }}>
        {/* Appt breakdown */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, boxShadow:'0 1px 6px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin:'0 0 16px', fontSize:14, fontWeight:600, color:C.text }}>Appointments by Status</h3>
          {(data?.apptByStatus||[]).map((item: any) => {
            const colors: Record<string,string> = { PENDING:C.amber, CONFIRMED:C.teal, COMPLETED:C.green, CANCELLED:C.red, NO_SHOW:'#94A3B8' };
            const total = (data?.apptByStatus||[]).reduce((a:number,i:any)=>a+i._count,0);
            const pct = total>0?((item._count/total)*100).toFixed(0):0;
            return (
              <div key={item.status} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ color:C.muted, fontSize:12 }}>{item.status}</span>
                  <span style={{ color:C.text, fontSize:12, fontWeight:600 }}>{item._count}</span>
                </div>
                <div style={{ height:5, background:'#F1F5F9', borderRadius:3 }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:colors[item.status]||C.teal, borderRadius:3 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent payments */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, boxShadow:'0 1px 6px rgba(0,0,0,0.04)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h3 style={{ margin:0, fontSize:14, fontWeight:600, color:C.text }}>Recent Payments</h3>
            <a href="/admin-dashboard/revenue" style={{ color:C.teal, fontSize:12, textDecoration:'none', fontWeight:500 }}>View all →</a>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead><tr>{['Email','Plan','Amount','Status','Date'].map(h=>(
              <th key={h} style={{ textAlign:'left', padding:'6px 10px', color:C.muted, fontSize:10, fontWeight:600, textTransform:'uppercase', borderBottom:`1px solid ${C.border}` }}>{h}</th>
            ))}</tr></thead>
            <tbody>
              {(data?.recentPayments||[]).slice(0,8).map((p:any)=>(
                <tr key={p.id} style={{ borderBottom:`1px solid #F8FAFC` }}>
                  <td style={{ padding:'10px 10px', color:C.text }}>{p.subscription?.user?.email?.split('@')[0]||'—'}</td>
                  <td style={{ padding:'10px 10px', color:C.muted }}>{p.subscription?.plan?.displayName||'—'}</td>
                  <td style={{ padding:'10px 10px', color:C.green, fontWeight:600 }}>₹{(p.amount/100).toLocaleString('en-IN')}</td>
                  <td style={{ padding:'10px 10px' }}><span style={{ background:p.status==='CAPTURED'?'#DCFCE7':'#FEF3C7', color:p.status==='CAPTURED'?C.green:C.amber, padding:'2px 7px', borderRadius:4, fontSize:10, fontWeight:600 }}>{p.status}</span></td>
                  <td style={{ padding:'10px 10px', color:C.muted, fontSize:11 }}>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
              {(!data?.recentPayments||data.recentPayments.length===0)&&(
                <tr><td colSpan={5} style={{ padding:24, textAlign:'center', color:C.muted }}>No payments yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, boxShadow:'0 1px 6px rgba(0,0,0,0.04)' }}>
        <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:600, color:C.text }}>Quick Actions</h3>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {[
            { label:'✅ Verify Doctors',   href:'/admin-dashboard/verification' },
            { label:'👥 Manage Users',     href:'/admin-dashboard/users'        },
            { label:'🩺 All Doctors',      href:'/admin-dashboard/doctors'      },
            { label:'🏘️ Communities',      href:'/admin-dashboard/communities'  },
            { label:'📊 Revenue Report',   href:'/admin-dashboard/revenue'      },
          ].map(a=>(
            <a key={a.href} href={a.href} style={{ padding:'9px 16px', borderRadius:8, border:`1px solid ${C.border}`, color:C.teal, textDecoration:'none', fontSize:13, fontWeight:500, background:'#F0F9F8', transition:'all 0.13s' }}>{a.label}</a>
          ))}
        </div>
      </div>
    </div>
  );
}
