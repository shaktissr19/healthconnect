'use client';
// src/app/admin-dashboard/subscriptions/page.tsx
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const C = { card:'#FFFFFF', border:'rgba(45,139,122,0.14)', teal:'#2D8B7A', text:'#1C3A35', muted:'#5A7184', green:'#16A34A', amber:'#D97706', red:'#DC2626' };
const STATUS_COLORS: Record<string,string> = { ACTIVE:C.green, EXPIRED:C.muted, CANCELLED:C.red, PENDING:C.amber };

export default function SubscriptionsPage() {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/subscriptions')
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:300 }}>
      <div style={{ width:36, height:36, border:`3px solid ${C.border}`, borderTop:`3px solid ${C.teal}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const plans = data?.plans || [];
  const subs  = data?.subscriptions || [];
  const stats = data?.stats || {};

  return (
    <div style={{ color:C.text, fontFamily:"'Inter',sans-serif" }}>
      <div style={{ marginBottom:22 }}>
        <h1 style={{ margin:0, fontSize:24, fontWeight:700, letterSpacing:'-0.4px' }}>Subscriptions</h1>
        <p style={{ margin:'4px 0 0', color:C.muted, fontSize:13 }}>All subscription plans and active members</p>
      </div>

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          { label:'Total Revenue',   value:`₹${((stats.totalRevenue||0)/100).toLocaleString('en-IN')}`, icon:'💰', color:C.green },
          { label:'Active',          value:stats.active||0,    icon:'✅', color:C.green  },
          { label:'Expired',         value:stats.expired||0,   icon:'⏳', color:C.muted  },
          { label:'Cancelled',       value:stats.cancelled||0, icon:'❌', color:C.red    },
        ].map(s=>(
          <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ color:C.muted, fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>{s.label}</span>
              <span style={{ fontSize:16 }}>{s.icon}</span>
            </div>
            <div style={{ color:s.color, fontSize:24, fontWeight:700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Plans */}
      <div style={{ marginBottom:22 }}>
        <h3 style={{ margin:'0 0 12px', fontSize:15, fontWeight:600, color:C.text }}>Subscription Plans</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
          {plans.map((p:any)=>(
            <div key={p.id} style={{ background:C.card, border:`2px solid ${C.border}`, borderRadius:12, padding:18, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div>
                  <div style={{ fontWeight:700, color:C.text, fontSize:14 }}>{p.displayName}</div>
                  <div style={{ color:C.muted, fontSize:11, marginTop:2 }}>{p.targetRole}</div>
                </div>
                <span style={{ background:`${C.green}18`, color:C.green, padding:'2px 8px', borderRadius:5, fontSize:10, fontWeight:700 }}>
                  {p._count?.subscriptions||0} active
                </span>
              </div>
              <div style={{ display:'flex', gap:16 }}>
                <div>
                  <div style={{ color:C.muted, fontSize:10, textTransform:'uppercase' }}>Monthly</div>
                  <div style={{ color:C.teal, fontWeight:700, fontSize:14 }}>₹{(p.monthlyPrice/100).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ color:C.muted, fontSize:10, textTransform:'uppercase' }}>Annual</div>
                  <div style={{ color:C.teal, fontWeight:700, fontSize:14 }}>₹{(p.annualPrice/100).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscriptions table */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,0.04)' }}>
        <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}` }}>
          <h3 style={{ margin:0, fontSize:14, fontWeight:600 }}>All Subscriptions</h3>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}`, background:'#F8FFFE' }}>
              {['User','Plan','Billing','Status','Start','End'].map(h=>(
                <th key={h} style={{ padding:'10px 14px', textAlign:'left', color:C.muted, fontSize:10, fontWeight:600, textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subs.map((s:any)=>(
              <tr key={s.id} style={{ borderBottom:`1px solid #F8FAFC` }}>
                <td style={{ padding:'11px 14px' }}>
                  <div style={{ fontWeight:500, color:C.text }}>{s.user?.email?.split('@')[0]||'—'}</div>
                  <div style={{ color:C.muted, fontSize:11 }}>{s.user?.email}</div>
                </td>
                <td style={{ padding:'11px 14px', color:C.text, fontWeight:500 }}>{s.plan?.displayName||'—'}</td>
                <td style={{ padding:'11px 14px' }}>
                  <span style={{ background:'#F0F9F8', color:C.teal, padding:'2px 7px', borderRadius:4, fontSize:10, fontWeight:600 }}>
                    {s.billingCycle}
                  </span>
                </td>
                <td style={{ padding:'11px 14px' }}>
                  <span style={{ background:(STATUS_COLORS[s.status]||C.muted)+'18', color:STATUS_COLORS[s.status]||C.muted, padding:'2px 7px', borderRadius:4, fontSize:10, fontWeight:700 }}>
                    {s.status}
                  </span>
                </td>
                <td style={{ padding:'11px 14px', color:C.muted, fontSize:11 }}>{new Date(s.startDate).toLocaleDateString('en-IN')}</td>
                <td style={{ padding:'11px 14px', color:C.muted, fontSize:11 }}>{s.endDate?new Date(s.endDate).toLocaleDateString('en-IN'):'—'}</td>
              </tr>
            ))}
            {subs.length===0&&<tr><td colSpan={6} style={{ padding:40, textAlign:'center', color:C.muted }}>No subscriptions yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
