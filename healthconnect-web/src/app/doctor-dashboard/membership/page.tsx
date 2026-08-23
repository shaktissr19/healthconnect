'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { openRazorpayCheckout } from '@/lib/razorpayCheckout';
import { useAuthStore } from '@/store/authStore';

const C = { card:'#FDFCFB', border:'rgba(13,148,136,.18)', text:'#0F172A', muted:'#64748B', teal:'#0D9488', tealDark:'#0F766E', green:'#16A34A', amber:'#D97706', red:'#E11D48' };
const unwrap=(r:any)=>r?.data?.data??r?.data??null;
const money=(paise:number)=>`₹${(Number(paise||0)/100).toLocaleString('en-IN',{maximumFractionDigits:2})}`;

export default function DoctorMembershipPage(){
  const router=useRouter();
  const user=useAuthStore(s=>(s as any).user);
  const [plans,setPlans]=useState<any[]>([]);
  const [current,setCurrent]=useState<any>(null);
  const [history,setHistory]=useState<any>({charges:[],invoices:[]});
  const [earnings,setEarnings]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState('');
  const [toast,setToast]=useState<{text:string;error?:boolean}|null>(null);

  const notify=(text:string,error=false)=>{setToast({text,error});window.setTimeout(()=>setToast(null),4200);};

  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const [plansRes,currentRes,historyRes,earningsRes]=await Promise.all([
        api.get('/subscription/plans'),api.get('/subscription/current'),api.get('/subscription/billing-history'),api.get('/payments/doctor/summary'),
      ]);
      const all=unwrap(plansRes)||[];
      setPlans((Array.isArray(all)?all:[]).filter((p:any)=>p.targetRole==='DOCTOR'));
      setCurrent(unwrap(currentRes));
      setHistory(unwrap(historyRes)||{charges:[],invoices:[]});
      setEarnings(unwrap(earningsRes));
    }catch(e:any){notify(e?.response?.data?.message||'Unable to load Doctor billing information.',true);}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{void load();},[load]);

  const professional=useMemo(()=>plans.find((p:any)=>p.name==='professional')||plans.find((p:any)=>Number(p?.pricing?.monthlyPaise||0)>0),[plans]);
  const active=Boolean(current&&['ACTIVE','TRIALING','PAST_DUE'].includes(current.status)&&Number(current.amountPaise||0)>0);
  const cancelScheduled=Boolean(current?.state?.cancelAtCycleEnd||(current&&current.autoRenew===false&&current.status==='ACTIVE'));

  const subscribe=async()=>{
    if(!professional)return;
    setBusy('subscribe');
    try{
      const response=await api.post('/subscription/checkout',{planId:professional.id,billingCycle:'MONTHLY'});
      const checkout=unwrap(response);
      if(!checkout?.keyId||!checkout?.subscriptionId)throw new Error('Secure membership checkout could not be initialized.');
      const result=await openRazorpayCheckout({
        key:checkout.keyId,
        subscription_id:checkout.subscriptionId,
        name:'HealthConnect India',
        description:'HealthConnect Professional Doctor membership',
        prefill:{email:user?.email||undefined,name:[user?.firstName,user?.lastName].filter(Boolean).join(' ')||undefined},
        notes:{hc_local_subscription_id:checkout.localSubscriptionId||'',hc_role:'DOCTOR'},
      });
      if(!result){notify('Checkout closed. No membership was activated.');return;}
      await api.post('/subscription/verify',result);
      notify('✓ Doctor membership activated successfully.');
      await load();
    }catch(e:any){notify(e?.response?.data?.message||e?.message||'Membership payment could not be completed.',true);}
    finally{setBusy('');}
  };

  const cancel=async()=>{
    if(!confirm('Turn off Doctor membership auto-renewal? Access remains active through the current billing cycle.'))return;
    setBusy('cancel');
    try{const r=await api.post('/subscription/cancel',{atCycleEnd:true});notify(r?.data?.message||'Auto-renewal turned off.');await load();}
    catch(e:any){notify(e?.response?.data?.message||'Unable to update membership.',true);}
    finally{setBusy('');}
  };

  if(loading)return <div style={{minHeight:360,display:'grid',placeItems:'center'}}><div style={{width:38,height:38,border:`3px solid ${C.border}`,borderTopColor:C.teal,borderRadius:'50%',animation:'drBillSpin .8s linear infinite'}}/><style>{`@keyframes drBillSpin{to{transform:rotate(360deg)}}`}</style></div>;

  const charges=Array.isArray(history?.charges)?history.charges:[];
  const invoices=Array.isArray(history?.invoices)?history.invoices:[];
  const totals=earnings?.totals||earnings||{};

  return <div style={{maxWidth:1080,margin:'0 auto',color:C.text}}>
    {toast&&<div style={{position:'fixed',right:26,bottom:26,zIndex:9999,maxWidth:390,padding:'12px 18px',borderRadius:12,color:'#fff',background:toast.error?'#991B1B':C.tealDark,boxShadow:'0 12px 30px rgba(0,0,0,.22)',fontSize:13,fontWeight:650}}>{toast.text}</div>}
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16,flexWrap:'wrap',marginBottom:22}}><div><button onClick={()=>router.push('/doctor-dashboard')} style={{border:0,background:'transparent',padding:0,color:C.teal,fontSize:12,fontWeight:750,cursor:'pointer',marginBottom:8}}>← Doctor workspace</button><h1 style={{margin:0,fontSize:27,fontWeight:850}}>Membership & Billing</h1><p style={{margin:'6px 0 0',fontSize:14,color:C.muted}}>Your HealthConnect platform membership is separate from consultation fees paid by patients.</p></div><button onClick={()=>void load()} style={{border:`1px solid ${C.border}`,background:'#fff',borderRadius:9,padding:'8px 12px',fontSize:11.5,color:C.muted,cursor:'pointer'}}>Refresh</button></div>

    <div style={{display:'grid',gridTemplateColumns:'minmax(320px,1.15fr) minmax(280px,.85fr)',gap:18,marginBottom:22}}>
      <section style={{background:'linear-gradient(135deg,#0C3D38,#155E75)',color:'#fff',borderRadius:18,padding:24,boxShadow:'0 10px 28px rgba(12,61,56,.16)'}}><div style={{fontSize:10,letterSpacing:'.09em',fontWeight:800,opacity:.72}}>HEALTHCONNECT PROFESSIONAL</div><div style={{display:'flex',alignItems:'baseline',gap:6,marginTop:7}}><span style={{fontSize:34,fontWeight:900}}>{money(professional?.pricing?.monthlyPaise||79900)}</span><span style={{fontSize:12,opacity:.72}}>/month</span></div><p style={{fontSize:13,lineHeight:1.6,opacity:.84,maxWidth:620}}>Professional profile, availability, appointment workflows, patient-shared context, hospital affiliations and HealthConnect practice tools.</p>{active?<div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginTop:16}}><span style={{padding:'7px 11px',borderRadius:999,background:'rgba(34,197,94,.18)',color:'#BBF7D0',fontSize:11,fontWeight:800}}>✓ {current?.plan?.displayName||'Professional'} · {current.status}</span>{!cancelScheduled&&<button disabled={busy==='cancel'} onClick={cancel} style={{border:'1px solid rgba(255,255,255,.3)',background:'#fff',color:'#0C3D38',borderRadius:9,padding:'9px 13px',fontSize:11.5,fontWeight:800,cursor:'pointer'}}>{busy==='cancel'?'Updating…':'Turn off auto-renew'}</button>}{cancelScheduled&&<span style={{color:'#FDE68A',fontSize:11.5,fontWeight:750}}>Auto-renewal is off</span>}</div>:<button disabled={!professional||busy==='subscribe'} onClick={subscribe} style={{marginTop:13,border:0,background:'#fff',color:'#0C3D38',borderRadius:10,padding:'11px 17px',fontSize:12.5,fontWeight:850,cursor:'pointer'}}>{busy==='subscribe'?'Opening secure checkout…':'Start Doctor membership →'}</button>}</section>
      <section style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:22}}><div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'.07em',color:C.muted,fontWeight:750}}>Consultation collections</div><div style={{fontSize:30,fontWeight:900,color:C.teal,marginTop:7}}>{money(Number(totals.totalPaise||0))}</div><div style={{marginTop:15,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}><Mini label="This month" value={money(Number(totals.monthPaise||0))}/><Mini label="Paid consultations" value={String(totals.paidConsultations||0)}/></div><p style={{fontSize:11.5,lineHeight:1.5,color:C.muted,margin:'14px 0 0'}}>These are patient consultation payments recorded through HealthConnect. Doctor fees remain doctor-defined.</p></section>
    </div>

    <section style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:'hidden',marginBottom:18}}><div style={{padding:'14px 18px',borderBottom:`1px solid ${C.border}`}}><div style={{fontSize:14,fontWeight:800}}>Membership payment history</div></div>{charges.length===0?<Empty text="No Doctor membership payments recorded yet."/>:<div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><thead><tr style={{background:'#F8FAFC'}}>{['Plan','Amount','Status','Payment ID','Paid'].map(h=><th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:10,color:C.muted,textTransform:'uppercase'}}>{h}</th>)}</tr></thead><tbody>{charges.slice(0,25).map((p:any)=><tr key={p.id} style={{borderTop:'1px solid #F1F5F9'}}><td style={{padding:'11px 14px',fontWeight:700}}>{p.planName||'Membership'}</td><td style={{padding:'11px 14px'}}>{money(p.amountPaise)}</td><td style={{padding:'11px 14px'}}><Status value={p.status}/></td><td style={{padding:'11px 14px',fontFamily:'monospace',fontSize:10,color:C.muted}}>{p.providerPaymentId||'—'}</td><td style={{padding:'11px 14px',color:C.muted}}>{p.paidAt?new Date(p.paidAt).toLocaleString('en-IN'):'—'}</td></tr>)}</tbody></table></div>}</section>

    {invoices.length>0&&<section style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:18}}><div style={{fontSize:14,fontWeight:800,marginBottom:10}}>Invoices</div>{invoices.slice(0,10).map((i:any)=><div key={i.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'10px 0',borderTop:'1px solid #EEF2F7'}}><div><div style={{fontSize:12,fontWeight:700}}>{i.invoiceNumber||i.providerInvoiceId}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{money(i.amountPaise)} · {i.status}</div></div>{i.shortUrl&&<a href={i.shortUrl} target="_blank" rel="noreferrer" style={{fontSize:11.5,fontWeight:750,color:C.teal,textDecoration:'none'}}>Open invoice →</a>}</div>)}</section>}

    <style>{`@media(max-width:800px){div[style*="grid-template-columns: minmax(320px"]{grid-template-columns:1fr!important}}`}</style>
  </div>;
}

function Mini({label,value}:{label:string;value:string}){return <div style={{padding:12,borderRadius:11,background:'#F8FAFC',border:'1px solid #E2E8F0'}}><div style={{fontSize:10,color:C.muted,textTransform:'uppercase',fontWeight:700}}>{label}</div><div style={{fontSize:17,fontWeight:850,marginTop:4}}>{value}</div></div>}
function Status({value}:{value:string}){const v=String(value||'').toUpperCase();const color=v==='CAPTURED'?C.green:v==='FAILED'?C.red:C.amber;return <span style={{padding:'3px 8px',borderRadius:999,background:`${color}12`,border:`1px solid ${color}30`,color,fontSize:10,fontWeight:800}}>{v||'—'}</span>}
function Empty({text}:{text:string}){return <div style={{padding:34,textAlign:'center',color:C.muted,fontSize:12.5}}>{text}</div>}
