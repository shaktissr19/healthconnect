'use client';
import { useState, useEffect } from 'react';
import { patientAPI } from '@/lib/api';
const C={card:'#FFFFFF',border:'#E2EEF0',teal:'#0D9488',tealLight:'#14B8A6',tealBg:'rgba(13,148,136,0.08)',text:'#0F2D2A',text2:'#4B6E6A',text3:'#4B6E6A',green:'#22C55E',amber:'#F59E0B',violet:'#8B5CF6',sidebar:'#0F2D2A'};
export default function SubscriptionPage(){
  const [sub,setSub]=useState<any>(null);const [loading,setLoading]=useState(true);
  useEffect(()=>{patientAPI.getCurrentSub().then(r=>{setSub((r as any)?.data?.data??(r as any)?.data??null);}).catch(()=>{}).finally(()=>setLoading(false));},[]);
  const isPremium=sub?.tier?.toLowerCase()==='premium'||sub?.plan?.name?.toLowerCase()?.includes('premium');
  const PLANS=[
    {name:'Free',price:0,color:C.text3,features:['Basic health tracking','5 reports storage','Community access','Email support']},
    {name:'Premium',price:299,color:C.amber,features:['Unlimited reports storage','AI health insights','Priority doctor booking','Video consultations','Advanced analytics','24/7 support','Family health profiles']},
  ];
  return(
    <div style={{ maxWidth:900 }}>
      <h2 style={{ fontSize:22,fontWeight:800,color:C.text,margin:'0 0 4px' }}>⭐ Subscription</h2>
      <p style={{ fontSize:13,color:C.text2,margin:'0 0 28px' }}>Manage your HealthConnect plan</p>
      {!loading&&sub&&(
        <div style={{ background:`linear-gradient(135deg,${C.sidebar},#1A4A45)`,borderRadius:16,padding:'24px',marginBottom:28,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16 }}>
          <div><div style={{ fontSize:11,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6 }}>Current Plan</div><div style={{ fontSize:28,fontWeight:900,color:isPremium?C.amber:'#fff',marginBottom:4 }}>{isPremium?'⭐ Premium':'Free'}</div>{sub.expiresAt&&<div style={{ fontSize:12,color:'rgba(255,255,255,0.5)' }}>Renews: {new Date(sub.expiresAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>}</div>
          {isPremium&&<div style={{ background:'rgba(245,158,11,0.15)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:12,padding:'12px 20px' }}><div style={{ fontSize:12,color:'rgba(255,255,255,0.6)',marginBottom:4 }}>Status</div><div style={{ fontSize:16,fontWeight:700,color:C.amber }}>✓ Active</div></div>}
        </div>
      )}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20 }}>
        {PLANS.map(plan=>(
          <div key={plan.name} style={{ background:C.card,border:`2px solid ${(plan.name==='Premium'&&isPremium)||(plan.name==='Free'&&!isPremium)?plan.color:C.border}`,borderRadius:16,padding:'28px',boxShadow:'0 2px 8px rgba(0,0,0,0.06)',position:'relative' }}>
            {plan.name==='Premium'&&<div style={{ position:'absolute',top:-1,right:20,background:C.amber,color:'#fff',fontSize:10,fontWeight:800,padding:'3px 12px',borderRadius:'0 0 8px 8px',letterSpacing:'0.06em' }}>RECOMMENDED</div>}
            <div style={{ fontSize:22,fontWeight:900,color:plan.color,marginBottom:6 }}>{plan.name==='Premium'?'⭐ ':''}{plan.name}</div>
            <div style={{ fontSize:32,fontWeight:900,color:C.text,marginBottom:4 }}>{plan.price===0?'Free':`₹${plan.price}`}{plan.price>0&&<span style={{ fontSize:13,fontWeight:400,color:C.text3 }}>/month</span>}</div>
            <div style={{ height:1,background:C.border,margin:'16px 0' }}/>
            <div style={{ display:'flex',flexDirection:'column',gap:8,marginBottom:20 }}>{plan.features.map(f=><div key={f} style={{ display:'flex',alignItems:'center',gap:8,fontSize:13,color:C.text2 }}><span style={{ color:plan.color,fontWeight:800,flexShrink:0 }}>✓</span>{f}</div>)}</div>
            {plan.name==='Premium'&&!isPremium&&<button style={{ width:'100%',padding:'12px',background:`linear-gradient(135deg,${C.amber},#D97706)`,color:'#fff',border:'none',borderRadius:10,fontWeight:800,cursor:'pointer',fontSize:14,fontFamily:'inherit' }}>Upgrade to Premium</button>}
            {((plan.name==='Premium'&&isPremium)||(plan.name==='Free'&&!isPremium))&&<div style={{ textAlign:'center',padding:'10px',background:plan.color+'15',border:`1px solid ${plan.color}30`,borderRadius:10,color:plan.color,fontWeight:700,fontSize:13 }}>✓ Current Plan</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
