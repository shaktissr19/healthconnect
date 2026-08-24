'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

const C={card:'#FFFFFF',border:'rgba(45,139,122,0.16)',teal:'#2D8B7A',text:'#1C3A35',muted:'#64748B',green:'#16A34A',amber:'#D97706',red:'#DC2626',blue:'#2563EB'};
const unwrap=(r:any)=>r?.data?.data??r?.data??null;
const money=(paise:number)=>`₹${(Number(paise||0)/100).toLocaleString('en-IN',{maximumFractionDigits:2})}`;
const date=(value:any)=>value?new Date(value).toLocaleDateString('en-IN'):'—';

export default function SubscriptionsPage(){
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{const r=await api.get('/admin/billing/summary');setData(unwrap(r));}
    catch(e:any){setError(e?.response?.data?.message||'Unable to load subscription data.');}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{void load();},[load]);

  const totals=data?.totals||{};
  const plans=Array.isArray(data?.plans)?data.plans:[];
  const subscriptions=Array.isArray(data?.subscriptions)?data.subscriptions:[];

  const metrics=useMemo(()=>{
    const paid=plans.filter((p:any)=>Number(p.monthlyPricePaise||0)>0||Number(p.annualPricePaise||0)>0);
    const activePaid=paid.reduce((n:number,p:any)=>n+Number(p.activeCount||0),0);
    const patientActive=paid.filter((p:any)=>p.targetRole==='PATIENT').reduce((n:number,p:any)=>n+Number(p.activeCount||0),0);
    const doctorActive=paid.filter((p:any)=>p.targetRole==='DOCTOR').reduce((n:number,p:any)=>n+Number(p.activeCount||0),0);
    const started=paid.reduce((n:number,p:any)=>n+Number(p.activeCount||0)+Number(p.pastDueCount||0)+Number(p.cancelledCount||0),0);
    const mrr=paid.reduce((n:number,p:any)=>n+(Number(p.monthlyPricePaise||0)*Number(p.activeCount||0)),0);
    return {activePaid,patientActive,doctorActive,started,mrr};
  },[plans]);

  if(loading)return <div style={{display:'grid',placeItems:'center',minHeight:320}}><div style={{width:38,height:38,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.teal}`,borderRadius:'50%',animation:'spin .8s linear infinite'}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  return <div style={{color:C.text,fontFamily:"'Inter',sans-serif"}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16,marginBottom:22,flexWrap:'wrap'}}>
      <div><h1 style={{margin:0,fontSize:24,fontWeight:760,letterSpacing:'-.4px'}}>Subscriptions</h1><p style={{margin:'5px 0 0',color:C.muted,fontSize:13}}>Patient and Doctor memberships, subscriber status and recurring value.</p></div>
      <button onClick={()=>void load()} style={{border:`1px solid ${C.border}`,background:'#fff',borderRadius:9,padding:'8px 12px',fontSize:11.5,color:C.muted,cursor:'pointer'}}>Refresh</button>
    </div>

    {error&&<div style={{marginBottom:18,padding:'12px 14px',borderRadius:10,background:'#FEF2F2',border:'1px solid #FECACA',color:C.red,fontSize:12}}>{error}</div>}

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:22}}>
      <Metric label="Memberships started" value={metrics.started} color={C.text}/>
      <Metric label="Active paid members" value={metrics.activePaid||Number(totals.activeSubscribers||0)} color={C.green}/>
      <Metric label="Patient members" value={metrics.patientActive} color={C.blue}/>
      <Metric label="Doctor members" value={metrics.doctorActive} color={C.teal}/>
      <Metric label="Monthly recurring value" value={money(metrics.mrr)} color={C.amber}/>
      <Metric label="Membership collected" value={money(totals.membershipRevenuePaise)} color={C.green}/>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(165px,1fr))',gap:11,marginBottom:24}}>
      <Small label="Past due" value={Number(totals.pastDueSubscribers||0)} color={C.amber}/>
      <Small label="Cancelled" value={Number(totals.cancelledSubscribers||0)} color={C.red}/>
      <Small label="Failed payments" value={Number(totals.failedPayments||0)} color={C.red}/>
      <Small label="This month collections" value={money(totals.membershipMonthPaise)} color={C.teal}/>
    </div>

    <section style={{marginBottom:25}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'end',gap:16,marginBottom:11}}><div><h3 style={{margin:0,fontSize:15}}>Published membership plans</h3><div style={{fontSize:11,color:C.muted,marginTop:3}}>Same commercial catalog used by the public landing page and Razorpay checkout.</div></div><a href="/?home=1#plans" target="_blank" rel="noreferrer" style={{fontSize:11,color:C.teal,fontWeight:700,textDecoration:'none'}}>View public plans ↗</a></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:12}}>{plans.filter((p:any)=>Number(p.monthlyPricePaise||0)>0||Number(p.annualPricePaise||0)>0).map((p:any)=><div key={p.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:15,padding:18,boxShadow:'0 2px 7px rgba(15,23,42,.04)'}}><div style={{display:'flex',justifyContent:'space-between',gap:12}}><div><div style={{fontSize:14,fontWeight:780}}>{p.displayName}</div><div style={{fontSize:10.5,color:C.muted,marginTop:3}}>{p.targetRole} · {p.name}</div></div><Pill text={`${p.activeCount||0} active`} color={C.green}/></div><div style={{fontSize:27,fontWeight:850,color:p.targetRole==='PATIENT'?C.blue:C.teal,marginTop:14}}>₹{Number(p.monthlyPrice||0).toLocaleString('en-IN')}<span style={{fontSize:11,color:C.muted,fontWeight:500}}>/month</span></div><div style={{display:'flex',gap:14,marginTop:12,fontSize:10.5,color:C.muted}}><span>{p.pastDueCount||0} past due</span><span>{p.cancelledCount||0} cancelled</span></div></div>)}</div>
    </section>

    <section style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:15,overflow:'hidden',boxShadow:'0 2px 8px rgba(15,23,42,.04)'}}>
      <div style={{padding:'14px 17px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}><div><h3 style={{margin:0,fontSize:14}}>Recent membership records</h3><div style={{fontSize:10.5,color:C.muted,marginTop:2}}>Latest subscription lifecycle records from the production billing system.</div></div><a href="/admin-dashboard/revenue" style={{fontSize:11,color:C.teal,fontWeight:700,textDecoration:'none'}}>Revenue & payments →</a></div>
      {subscriptions.length===0?<Empty/>:<div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><thead><tr style={{background:'#F8FFFE'}}>{['Member','Role','Plan','Billing','Status','Started','Current cycle'].map(h=><th key={h} style={{padding:'10px 13px',textAlign:'left',color:C.muted,fontSize:10,fontWeight:650,textTransform:'uppercase'}}>{h}</th>)}</tr></thead><tbody>{subscriptions.map((s:any)=><tr key={s.id} style={{borderTop:'1px solid #F1F5F9'}}><td style={{padding:'11px 13px'}}><div style={{fontWeight:650}}>{s.user?.email?.split('@')?.[0]||'Member'}</div><div style={{fontSize:10,color:C.muted,marginTop:2}}>{s.user?.email||'—'}</div></td><td style={{padding:'11px 13px'}}>{s.user?.role||s.plan?.targetRole||'—'}</td><td style={{padding:'11px 13px',fontWeight:650}}>{s.plan?.displayName||'—'}</td><td style={{padding:'11px 13px'}}>{String(s.billingCycle||'—').replaceAll('_',' ')}</td><td style={{padding:'11px 13px'}}><Pill text={s.status} color={s.status==='ACTIVE'?C.green:s.status==='PAST_DUE'?C.amber:s.status==='CANCELLED'?C.red:C.muted}/></td><td style={{padding:'11px 13px',color:C.muted}}>{date(s.startDate||s.createdAt)}</td><td style={{padding:'11px 13px',color:C.muted}}>{date(s.endDate)}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}

function Metric({label,value,color}:{label:string;value:string|number;color:string}){return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:13,padding:'16px 17px'}}><div style={{fontSize:9.5,color:C.muted,fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em'}}>{label}</div><div style={{fontSize:23,fontWeight:850,color,marginTop:6}}>{value}</div></div>}
function Small({label,value,color}:{label:string;value:string|number;color:string}){return <div style={{padding:'11px 14px',borderRadius:11,background:'#F8FAFC',border:'1px solid #E2E8F0'}}><span style={{fontSize:11,color:C.muted}}>{label}</span><strong style={{float:'right',fontSize:13.5,color}}>{value}</strong></div>}
function Pill({text,color}:{text:string;color:string}){return <span style={{padding:'3px 7px',borderRadius:999,background:`${color}12`,border:`1px solid ${color}2A`,color,fontSize:9.5,fontWeight:750}}>{String(text||'—').replaceAll('_',' ')}</span>}
function Empty(){return <div style={{padding:36,textAlign:'center',color:C.muted,fontSize:12.5}}>No membership records yet.</div>}
