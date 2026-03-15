'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const C = { card:'#FFFFFF', border:'rgba(45,139,122,0.14)', teal:'#2D8B7A', text:'#1C3A35', muted:'#5A7184', green:'#16A34A', amber:'#D97706', red:'#DC2626' };

export default function RevenuePage() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/revenue').then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:300 }}>
      <div style={{ width:36, height:36, border:`3px solid ${C.border}`, borderTop:`3px solid ${C.teal}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const totals = data?.totals||{};
  const plans  = data?.plans||[];
  const recent = data?.recentSubscriptions||[];
  const fmt = (paise:number) => `₹${(paise/100).toLocaleString('en-IN')}`;

  return (
    <div style={{ color:C.text, fontFamily:"'Inter',sans-serif" }}>
      <div style={{ marginBottom:22 }}>
        <h1 style={{ margin:0, fontSize:24, fontWeight:700, letterSpacing:'-0.4px' }}>Revenue & Subscriptions</h1>
        <p style={{ margin:'4px 0 0', color:C.muted, fontSize:13 }}>Financial overview and subscription analytics</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[{label:'Total Revenue',value:fmt(totals.totalRevenue||0),icon:'💰',color:C.green},{label:'This Month',value:fmt(totals.monthRevenue||0),icon:'📅',color:C.teal},{label:'Active Plans',value:totals.activePlans||0,icon:'📋',color:C.text},{label:'Subscribers',value:totals.totalSubscribers||0,icon:'👥',color:C.amber}].map(s=>(
          <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'18px 20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ color:C.muted, fontSize:10, fontWeight:600, textTransform:'uppercase' }}>{s.label}</span>
              <span style={{ fontSize:18 }}>{s.icon}</span>
            </div>
            <div style={{ color:s.color, fontSize:26, fontWeight:700 }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom:22 }}>
        <h3 style={{ margin:'0 0 12px', fontSize:15, fontWeight:600 }}>Subscription Plans</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
          {plans.map((p:any)=>(
            <div key={p.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:18 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <div><div style={{ fontWeight:700, fontSize:14 }}>{p.displayName}</div><div style={{ color:C.muted, fontSize:11 }}>{p.targetRole}</div></div>
                <span style={{ background:`${C.green}18`, color:C.green, padding:'2px 8px', borderRadius:5, fontSize:10, fontWeight:700 }}>{p.activeCount||0} active</span>
              </div>
              <div style={{ display:'flex', gap:16, marginBottom:8 }}>
                <div><div style={{ color:C.muted, fontSize:10, textTransform:'uppercase' }}>Monthly</div><div style={{ color:C.teal, fontWeight:700 }}>{fmt(p.monthlyPrice)}</div></div>
                <div><div style={{ color:C.muted, fontSize:10, textTransform:'uppercase' }}>Annual</div><div style={{ color:C.teal, fontWeight:700 }}>{fmt(p.annualPrice)}</div></div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', paddingTop:8, borderTop:`1px solid ${C.border}` }}>
                <span style={{ color:C.muted, fontSize:11 }}>Cancelled</span>
                <span style={{ color:C.red, fontSize:11, fontWeight:600 }}>{p.cancelledCount||0}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}` }}><h3 style={{ margin:0, fontSize:14, fontWeight:600 }}>Recent Subscriptions</h3></div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead><tr style={{ borderBottom:`1px solid ${C.border}`, background:'#F8FFFE' }}>
            {['User','Plan','Billing','Amount','Status','Date'].map(h=>(
              <th key={h} style={{ padding:'10px 14px', textAlign:'left', color:C.muted, fontSize:10, fontWeight:600, textTransform:'uppercase' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {recent.map((s:any)=>(
              <tr key={s.id} style={{ borderBottom:'1px solid #F8FAFC' }}>
                <td style={{ padding:'11px 14px' }}><div style={{ fontWeight:500 }}>{s.user?.email?.split('@')[0]||'—'}</div><div style={{ color:C.muted, fontSize:11 }}>{s.user?.email}</div></td>
                <td style={{ padding:'11px 14px', fontWeight:500 }}>{s.plan?.displayName||'—'}</td>
                <td style={{ padding:'11px 14px' }}><span style={{ background:'#F0F9F8', color:C.teal, padding:'2px 7px', borderRadius:4, fontSize:10, fontWeight:600 }}>{s.billingCycle}</span></td>
                <td style={{ padding:'11px 14px', color:C.green, fontWeight:600 }}>{s.billingCycle==='MONTHLY'?fmt(s.plan?.monthlyPrice||0):fmt(s.plan?.annualPrice||0)}</td>
                <td style={{ padding:'11px 14px' }}><span style={{ background:s.status==='ACTIVE'?`${C.green}18`:'#FEF3C7', color:s.status==='ACTIVE'?C.green:C.amber, padding:'2px 7px', borderRadius:4, fontSize:10, fontWeight:700 }}>{s.status}</span></td>
                <td style={{ padding:'11px 14px', color:C.muted, fontSize:11 }}>{new Date(s.startDate).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
            {recent.length===0&&<tr><td colSpan={6} style={{ padding:40, textAlign:'center', color:C.muted }}>No subscriptions yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
