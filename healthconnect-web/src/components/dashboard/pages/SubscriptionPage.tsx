'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const PLANS = [
  {
    id: 'free', name: 'Free', price: 0, period: '', color: '#5A7A9B', badge: null,
    features: ['Basic health tracking', '5 reports storage', 'Community access', 'Email support'],
  },
  {
    id: 'premium', name: 'Premium', price: 299, period: '/month', color: '#B45309', badge: 'RECOMMENDED',
    features: ['Unlimited reports storage', 'AI health insights', 'Priority doctor booking', 'Video consultations', 'Advanced analytics', '24/7 support', 'Family health profiles'],
  },
  {
    id: 'annual', name: 'Premium Annual', price: 2499, period: '/year', color: '#1A6BB5', badge: 'BEST VALUE',
    features: ['Everything in Premium', '2 months free', 'Dedicated health advisor', 'Priority emergency support', 'Family health profiles'],
  },
];

export default function SubscriptionPage() {
  const [current,  setCurrent]  = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [upgrading, setUpgrading] = useState('');
  const [toast,    setToast]    = useState('');

  useEffect(() => {
    api.get('/patient/subscription').then((r: any) => {
      setCurrent(r?.data?.data ?? r?.data ?? {});
    }).catch(() => setCurrent({ tier: 'FREE' })).finally(() => setLoading(false));
  }, []);

  const currentTier = (current?.tier ?? current?.plan ?? 'FREE').toLowerCase();
  const isActive = current?.status === 'ACTIVE' || current?.isActive;

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId);
    try {
      await api.post('/patient/subscription/upgrade', { plan: planId.toUpperCase() });
      showToast('✓ Subscription updated successfully');
      const r: any = await api.get('/patient/subscription');
      setCurrent(r?.data?.data ?? r?.data ?? {});
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? 'Could not process upgrade. Please try again.');
    }
    setUpgrading('');
  };

  const C = {
    bg: '#C8E0F4', white: '#FFFFFF', border: '#C8DFF0',
    navy: '#0A1628', blue: '#1A365D', mid: '#2C5282', muted: '#5A7A9B',
    teal: '#1A6BB5',
  };

  return (
    <div style={{ maxWidth: 900 }}>

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, background:'#0A1628', color:'#fff', padding:'11px 18px', borderRadius:10, fontSize:13, fontWeight:600, boxShadow:'0 8px 24px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:C.navy, margin:'0 0 4px' }}>⭐ Subscription</h1>
        <p style={{ fontSize:13, color:C.mid, margin:0 }}>Manage your HealthConnect plan</p>
      </div>

      {/* Current plan banner */}
      {!loading && current && (
        <div style={{ background:'linear-gradient(135deg,#0D3349,#1A3A6B)', borderRadius:16, padding:'16px 22px', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, boxShadow:'0 4px 16px rgba(13,51,73,0.25)' }}>
          <div>
            <div style={{ fontSize:11, color:'rgba(168,200,255,0.6)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Current Plan</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#FCD34D', display:'flex', alignItems:'center', gap:8 }}>
              ⭐ {(current?.tier ?? 'FREE').charAt(0) + (current?.tier ?? 'FREE').slice(1).toLowerCase()}
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 14px', borderRadius:100, background: isActive ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)', border: `1px solid ${isActive ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}` }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background: isActive ? '#4ADE80' : '#F87171' }}/>
            <span style={{ fontSize:12, fontWeight:700, color: isActive ? '#4ADE80' : '#F87171' }}>{isActive ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      )}

      {/* Plans grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        {PLANS.map(plan => {
          const isCurrent = currentTier === plan.id || (currentTier === 'premium' && plan.id === 'premium');
          const isDisabled = isCurrent || !!upgrading;
          return (
            <div key={plan.id} style={{ background:C.white, borderRadius:16, border: isCurrent ? `2px solid ${plan.color}` : `1px solid ${C.border}`, padding:'18px 18px 16px', boxShadow: isCurrent ? `0 4px 20px ${plan.color}22` : '0 2px 8px rgba(27,59,111,0.07)', position:'relative', transition:'all 0.2s' }}>
              {/* Badge */}
              {plan.badge && (
                <div style={{ position:'absolute', top:-1, right:14, padding:'2px 10px', borderRadius:'0 0 8px 8px', background: plan.color, color:'#fff', fontSize:9, fontWeight:800, letterSpacing:'0.06em' }}>
                  {plan.badge}
                </div>
              )}

              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:15, fontWeight:800, color:C.navy, marginBottom:4 }}>{plan.name}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:3 }}>
                  {plan.price === 0 ? (
                    <span style={{ fontSize:22, fontWeight:900, color:C.navy }}>Free</span>
                  ) : (
                    <>
                      <span style={{ fontSize:11, color:C.muted, fontWeight:600 }}>₹</span>
                      <span style={{ fontSize:26, fontWeight:900, color: plan.color }}>{plan.price.toLocaleString()}</span>
                      <span style={{ fontSize:11, color:C.muted }}>{plan.period}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height:1, background:C.border, margin:'0 0 12px' }}/>

              {/* Features */}
              <ul style={{ listStyle:'none', padding:0, margin:'0 0 14px', display:'flex', flexDirection:'column', gap:7 }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, fontSize:12, color:C.blue }}>
                    <span style={{ color:'#16A34A', fontWeight:700, flexShrink:0, marginTop:1 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <div style={{ padding:'9px 0', borderRadius:10, background:'rgba(26,107,181,0.06)', border:`1px solid ${plan.color}30`, textAlign:'center', fontSize:12, fontWeight:700, color: plan.color }}>
                  ✓ Current Plan
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isDisabled}
                  style={{ width:'100%', padding:'9px 0', borderRadius:10, border:'none', background: isDisabled ? '#E2EEF0' : `linear-gradient(135deg,${plan.color},${plan.color}CC)`, color: isDisabled ? '#94A3B8' : '#fff', fontSize:13, fontWeight:700, cursor: isDisabled ? 'not-allowed' : 'pointer', fontFamily:'inherit', transition:'all 0.2s' }}
                >
                  {upgrading === plan.id ? '⏳ Processing…' : plan.price === 0 ? 'Downgrade' : 'Upgrade →'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Info note */}
      <div style={{ marginTop:16, padding:'12px 16px', background:'rgba(26,107,181,0.06)', border:'1px solid #C8DFF0', borderRadius:10, fontSize:12, color:C.mid, lineHeight:1.6 }}>
        💳 Payments are processed securely. Cancel anytime from your account settings. For billing issues contact support@healthconnect.sbs
      </div>
    </div>
  );
}
