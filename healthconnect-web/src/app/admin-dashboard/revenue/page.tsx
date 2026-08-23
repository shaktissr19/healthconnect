'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

const C={card:'#FFFFFF',border:'rgba(45,139,122,0.16)',teal:'#2D8B7A',text:'#1C3A35',muted:'#64748B',green:'#16A34A',amber:'#D97706',red:'#DC2626',blue:'#2563EB'};
const unwrap=(r:any)=>r?.data?.data??r?.data??null;
const money=(paise:number)=>`₹${(Number(paise||0)/100).toLocaleString('en-IN',{maximumFractionDigits:2})}`;

export default function RevenuePage(){
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState('');
  const [toast,setToast]=useState<{text:string;error?:boolean}|null>(null);
  const notify=(text:string,error=false)=>{setToast({text,error});window.setTimeout(()=>setToast(null),4200);};

  const load=useCallback(async()=>{
    setLoading(true);
    try{const r=await api.get('/admin/billing/summary');setData(unwrap(r));}
    catch(e:any){notify(e?.response?.data?.message||'Unable to load billing data.',true);}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{void load();},[load]);

  const refund=async(payment:any)=>{
    const remaining=Math.max(0,Number(payment.amountPaise||0)-Number(payment.amountRefundedPaise||0));
    if(remaining<=0){notify('This payment has already been fully refunded.',true);return;}
    const raw=window.prompt(`Refund amount in rupees (maximum ${money(remaining)}):`,String(remaining/100));
    if(raw===null)return;
    const rupees=Number(raw);
    if(!Number.isFinite(rupees)||rupees<=0||Math.round(rupees*100)>remaining){notify('Enter a valid refund amount within the remaining paid amount.',true);return;}
    const reason=window.prompt('Refund reason:','Admin-approved refund')||'Admin-approved refund';
    if(!window.confirm(`Submit ${money(Math.round(rupees*100))} refund through Razorpay?`))return;
    setBusy(payment.id);
    try{
      const r=await api.post('/admin/billing/refunds',{sourceKind:payment.sourceKind,sourceId:payment.sourceId,amountPaise:Math.round(rupees*100),reason});
      notify(r?.data?.message||'Refund submitted to Razorpay.');
      await load();
    }catch(e:any){notify(e?.response?.data?.message||'Refund could not be submitted.',true);}
    finally{setBusy('');}
  };

  if(loading)return <div style={{display:'grid',placeItems:'center',minHeight:320}}><div style={{width:38,height:38,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.teal}`,borderRadius:'50%',animation:'spin .8s linear infinite'}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  const totals=data?.totals||{};
  const plans=Array.isArray(data?.plans)?data.plans:[];
  const recent=Array.isArray(data?.recentPayments)?data.recentPayments:[];
  const refunds=Array.isArray(data?.recentRefunds)?data.recentRefunds:[];

  return <div style={{color:C.text,fontFamily:"'Inter',sans-serif"}}>
    {toast&&<div style={{position:'fixed',right:26,bottom:26,zIndex:9999,maxWidth:420,padding:'12px 18px',borderRadius:12,color:'#fff',background:toast.error?'#991B1B':'#166534',boxShadow:'0 12px 30px rgba(0,0,0,.2)',fontSize:13,fontWeight:650}}>{toast.text}</div>}
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16,marginBottom:22,flexWrap:'wrap'}}><div><h1 style={{margin:0,fontSize:24,fontWeight:750,letterSpacing:'-.4px'}}>Revenue & Billing</h1><p style={{margin:'5px 0 0',color:C.muted,fontSize:13}}>Memberships, consultation collections, refunds and payment health.</p></div><button onClick={()=>void load()} style={{border:`1px solid ${C.border}`,background:'#fff',borderRadius:9,padding:'8px 12px',fontSize:11.5,color:C.muted,cursor:'pointer'}}>Refresh</button></div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:22}}>
      <Metric label="Gross collections" value={money(totals.grossRevenuePaise)} color={C.green}/><Metric label="Membership revenue" value={money(totals.membershipRevenuePaise)} color={C.teal}/><Metric label="Consultation collections" value={money(totals.consultationRevenuePaise)} color={C.blue}/><Metric label="Refunds" value={money(totals.refundsPaise)} color={C.red}/><Metric label="Net collections" value={money(totals.netRevenuePaise)} color={C.text}/><Metric label="This month" value={money(totals.monthRevenuePaise)} color={C.amber}/>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12,marginBottom:24}}><SmallMetric label="Active subscribers" value={totals.activeSubscribers||0}/><SmallMetric label="Past due" value={totals.pastDueSubscribers||0}/><SmallMetric label="Cancelled" value={totals.cancelledSubscribers||0}/><SmallMetric label="Failed payments" value={totals.failedPayments||0}/></div>

    <section style={{marginBottom:24}}><h3 style={{margin:'0 0 11px',fontSize:15}}>Commercial plans</h3><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(235px,1fr))',gap:12}}>{plans.map((p:any)=><div key={p.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:17}}><div style={{display:'flex',justifyContent:'space-between',gap:12}}><div><div style={{fontSize:14,fontWeight:750}}>{p.displayName}</div><div style={{fontSize:10.5,color:C.muted,marginTop:2}}>{p.targetRole}</div></div><span style={{color:C.green,fontSize:10.5,fontWeight:750}}>{p.activeCount||0} active</span></div><div style={{fontSize:24,fontWeight:850,color:C.teal,marginTop:12}}>₹{Number(p.monthlyPrice||0).toLocaleString('en-IN')}<span style={{fontSize:11,color:C.muted,fontWeight:500}}>/month</span></div><div style={{display:'flex',gap:14,marginTop:10,fontSize:10.5,color:C.muted}}><span>{p.pastDueCount||0} past due</span><span>{p.cancelledCount||0} cancelled</span></div></div>)}</div></section>

    <section style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:'hidden',marginBottom:22}}><div style={{padding:'14px 17px',borderBottom:`1px solid ${C.border}`}}><h3 style={{margin:0,fontSize:14}}>Recent payments</h3></div>{recent.length===0?<Empty text="No billing transactions yet."/>:<div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><thead><tr style={{background:'#F8FFFE'}}>{['Payer','Description','Type','Amount','Status','Payment','Action'].map(h=><th key={h} style={{padding:'10px 13px',textAlign:'left',color:C.muted,fontSize:10,fontWeight:650,textTransform:'uppercase'}}>{h}</th>)}</tr></thead><tbody>{recent.map((p:any)=>{const remaining=Math.max(0,Number(p.amountPaise||0)-Number(p.amountRefundedPaise||0));const refundable=Boolean(p.providerPaymentId)&&remaining>0&&['CAPTURED','PARTIALLY_REFUNDED'].includes(String(p.status));return <tr key={`${p.sourceKind}-${p.id}`} style={{borderTop:'1px solid #F1F5F9'}}><td style={{padding:'11px 13px'}}>{p.payerEmail||'—'}</td><td style={{padding:'11px 13px',fontWeight:650}}>{p.description||'—'}</td><td style={{padding:'11px 13px'}}><Pill text={p.sourceKind} color={p.sourceKind==='APPOINTMENT'?C.blue:C.teal}/></td><td style={{padding:'11px 13px',fontWeight:750}}>{money(p.amountPaise)}{Number(p.amountRefundedPaise||0)>0&&<div style={{color:C.red,fontSize:10,marginTop:2}}>Refunded {money(p.amountRefundedPaise)}</div>}</td><td style={{padding:'11px 13px'}}><Pill text={p.status} color={p.status==='CAPTURED'?C.green:p.status==='FAILED'?C.red:C.amber}/></td><td style={{padding:'11px 13px',fontFamily:'monospace',fontSize:10,color:C.muted}}>{p.providerPaymentId||'—'}</td><td style={{padding:'11px 13px'}}>{refundable?<button disabled={busy===p.id} onClick={()=>void refund(p)} style={{border:`1px solid ${C.red}30`,background:'#FFF7F7',color:C.red,borderRadius:8,padding:'6px 9px',fontSize:10.5,fontWeight:700,cursor:'pointer'}}>{busy===p.id?'Submitting…':'Refund'}</button>:<span style={{fontSize:10.5,color:C.muted}}>—</span>}</td></tr>})}</tbody></table></div>}</section>

    <section style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:'hidden'}}><div style={{padding:'14px 17px',borderBottom:`1px solid ${C.border}`}}><h3 style={{margin:0,fontSize:14}}>Recent refunds</h3></div>{refunds.length===0?<Empty text="No refunds recorded."/>:<div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><thead><tr style={{background:'#F8FFFE'}}>{['Type','Amount','Status','Provider refund','Reason','Created'].map(h=><th key={h} style={{padding:'10px 13px',textAlign:'left',color:C.muted,fontSize:10,textTransform:'uppercase'}}>{h}</th>)}</tr></thead><tbody>{refunds.map((r:any)=><tr key={r.id} style={{borderTop:'1px solid #F1F5F9'}}><td style={{padding:'11px 13px'}}>{r.sourceKind}</td><td style={{padding:'11px 13px',fontWeight:700,color:C.red}}>{money(r.amountPaise)}</td><td style={{padding:'11px 13px'}}><Pill text={r.status} color={r.status==='PROCESSED'?C.green:C.amber}/></td><td style={{padding:'11px 13px',fontFamily:'monospace',fontSize:10,color:C.muted}}>{r.providerRefundId||'—'}</td><td style={{padding:'11px 13px',color:C.muted}}>{r.reason||'—'}</td><td style={{padding:'11px 13px',color:C.muted}}>{new Date(r.createdAt).toLocaleString('en-IN')}</td></tr>)}</tbody></table></div>}</section>
  </div>;
}

function Metric({label,value,color}:{label:string;value:string;color:string}){return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:13,padding:'16px 17px'}}><div style={{fontSize:9.5,color:C.muted,fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em'}}>{label}</div><div style={{fontSize:23,fontWeight:850,color,marginTop:6}}>{value}</div></div>}
function SmallMetric({label,value}:{label:string;value:number}){return <div style={{padding:'11px 14px',borderRadius:11,background:'#F8FAFC',border:'1px solid #E2E8F0'}}><span style={{fontSize:11,color:C.muted}}>{label}</span><strong style={{float:'right',fontSize:14}}>{value}</strong></div>}
function Pill({text,color}:{text:string;color:string}){return <span style={{padding:'3px 7px',borderRadius:999,background:`${color}12`,border:`1px solid ${color}2A`,color,fontSize:9.5,fontWeight:750}}>{String(text||'—').replaceAll('_',' ')}</span>}
function Empty({text}:{text:string}){return <div style={{padding:34,textAlign:'center',color:C.muted,fontSize:12.5}}>{text}</div>}
