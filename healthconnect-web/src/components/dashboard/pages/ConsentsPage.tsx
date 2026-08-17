'use client';

import { useEffect, useState } from 'react';
import { api, patientAPI } from '@/lib/api';

const C={card:'#FFFFFF',border:'#E2EEF0',teal:'#0D9488',tealLight:'#14B8A6',tealBg:'rgba(13,148,136,0.08)',text:'#0F2D2A',text2:'#4B6E6A',text3:'#64748B',rose:'#F43F5E',green:'#16A34A',amber:'#D97706',indigo:'#6366F1',indigoBg:'rgba(99,102,241,0.08)'};
const DEFAULT_ACCESS_SCOPE=['HEALTH_PROFILE'];
const scopeLabel=(scope:string)=>scope==='HEALTH_PROFILE'?'Health profile':scope.replace(/_/g,' ').toLowerCase().replace(/^./,c=>c.toUpperCase());

export default function ConsentsPage(){
  const [consents,setConsents]=useState<any[]>([]);
  const [pending,setPending]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [acting,setActing]=useState<string|null>(null);
  const [toast,setToast]=useState('');
  const [toastError,setToastError]=useState(false);

  const showToast=(msg:string,error=false)=>{setToast(msg);setToastError(error);window.setTimeout(()=>setToast(''),3500);};

  const load=async()=>{
    setLoading(true);
    try{
      const [consentsRes,notifsRes]=await Promise.allSettled([
        patientAPI.getConsents(),
        api.get('/notifications'),
      ]);

      let active:any[]=[];
      if(consentsRes.status==='fulfilled'){
        const d=(consentsRes.value as any)?.data?.data??(consentsRes.value as any)?.data??[];
        active=Array.isArray(d)?d:d.consents??[];
        setConsents(active);
      }else setConsents([]);

      if(notifsRes.status==='fulfilled'){
        const arr=(notifsRes.value as any)?.data?.data?.notifications??(notifsRes.value as any)?.data?.notifications??(notifsRes.value as any)?.data??[];
        const activeDoctors=new Set(active.map((item:any)=>item.doctorId).filter(Boolean));
        const requests=(Array.isArray(arr)?arr:[]).filter((n:any)=>
          n.type==='SYSTEM'&&
          (n.data as any)?.requestType==='DOCTOR_ACCESS_REQUEST'&&
          !n.isRead&&
          !activeDoctors.has((n.data as any)?.doctorId)
        );
        setPending(requests);
      }else setPending([]);
    }catch{setConsents([]);setPending([]);}
    finally{setLoading(false);}
  };

  useEffect(()=>{load();},[]);

  const markRequestRead=async(notificationId:string)=>{
    await api.put(`/notifications/${notificationId}/read`);
  };

  const handleConsent=async(notif:any,action:'approve'|'reject')=>{
    const key=`${notif.id}_${action}`;setActing(key);
    try{
      const doctorId=(notif.data as any)?.doctorId;
      if(!doctorId)throw new Error('Doctor information is missing from this request');

      if(action==='approve'){
        await patientAPI.grantConsent({
          doctorId,
          accessScope:DEFAULT_ACCESS_SCOPE,
          expiresInDays:90,
          grantReason:'Approved doctor access request',
        });
        await markRequestRead(notif.id);
        showToast('✓ Doctor access granted for 90 days');
      }else{
        await markRequestRead(notif.id);
        showToast('Access request declined');
      }
      await load();
    }catch(e:any){showToast(e?.response?.data?.message??e?.message??'Failed to process request',true);}
    finally{setActing(null);}
  };

  const revoke=async(id:string)=>{
    if(!confirm('Revoke this doctor’s access to your health profile?'))return;
    setActing(`revoke_${id}`);
    try{await patientAPI.revokeConsent(id);showToast('✓ Access revoked');await load();}
    catch(e:any){showToast(e?.response?.data?.message??'Failed to revoke access',true);}
    finally{setActing(null);}
  };

  return <div style={{maxWidth:820}}>
    {toast&&<div style={{position:'fixed',bottom:24,right:24,zIndex:9999,background:toastError?'#7F1D1D':'#0F2D2A',color:'#fff',padding:'12px 20px',borderRadius:12,fontSize:13,fontWeight:600,boxShadow:'0 8px 24px rgba(0,0,0,.3)',border:'1px solid rgba(13,148,136,.3)'}}>{toast}</div>}

    <div style={{marginBottom:24}}><h2 style={{fontSize:22,fontWeight:800,color:C.text,margin:'0 0 4px'}}>🔒 Data Consents</h2><p style={{fontSize:13,color:C.text2,margin:0}}>Review doctor access requests and revoke access whenever you choose.</p></div>
    <div style={{background:'rgba(13,148,136,.06)',border:'1px solid rgba(13,148,136,.15)',borderRadius:12,padding:'14px 18px',marginBottom:24,fontSize:13,color:C.text2,lineHeight:1.55}}>ℹ️ Doctor access is never automatic from this screen. You approve each request explicitly. Approved access is time-limited to 90 days by default and can be revoked earlier.</div>

    {loading?<div style={{padding:40,textAlign:'center',color:C.text3}}>Loading…</div>:<>
      {pending.length>0&&<section style={{marginBottom:28}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}><h3 style={{fontSize:15,fontWeight:700,color:C.text,margin:0}}>⏳ Pending Requests</h3><span style={{background:C.rose,color:'#fff',fontSize:10,fontWeight:700,borderRadius:100,padding:'2px 8px'}}>{pending.length}</span></div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>{pending.map((n:any)=>{const d=n.data??{};return <div key={n.id} style={{background:C.card,border:`1.5px solid ${C.indigo}40`,borderRadius:14,padding:'18px 20px',boxShadow:`0 2px 12px ${C.indigo}12`,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${C.indigo},#818CF8)`}}/>
          <div style={{display:'flex',alignItems:'flex-start',gap:14}}><div style={{width:48,height:48,borderRadius:'50%',background:C.indigoBg,border:`1.5px solid ${C.indigo}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>👨‍⚕️</div><div style={{flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}><div style={{fontSize:15,fontWeight:700,color:C.text}}>{d.doctorName??'Doctor'}</div>{d.isVerified&&<span style={{fontSize:10,padding:'2px 8px',borderRadius:100,background:'rgba(22,163,74,.1)',color:C.green,border:'1px solid rgba(22,163,74,.25)',fontWeight:700}}>✓ HC Verified</span>}{d.hcDoctorId&&<span style={{fontSize:10,color:C.text3,fontFamily:'monospace'}}>{d.hcDoctorId}</span>}</div>
            <div style={{fontSize:13,color:C.text2,marginBottom:10}}>{d.doctorSpec??'General Medicine'}</div>
            <div style={{fontSize:12,color:C.text3,marginBottom:14,background:'#F8FAFC',borderRadius:8,padding:'8px 12px',border:`1px solid ${C.border}`}}>🔐 Requesting time-limited access to your HealthConnect health profile for care-related review.</div>
            <div style={{display:'flex',gap:10}}><button onClick={()=>handleConsent(n,'approve')} disabled={acting!==null} style={{flex:1,padding:'10px 0',borderRadius:10,border:'none',background:`linear-gradient(135deg,${C.teal},${C.tealLight})`,color:'#fff',fontSize:13,fontWeight:700,cursor:acting?'not-allowed':'pointer'}}>{acting===`${n.id}_approve`?'Approving…':'✓ Approve for 90 days'}</button><button onClick={()=>handleConsent(n,'reject')} disabled={acting!==null} style={{flex:1,padding:'10px 0',borderRadius:10,border:'1.5px solid rgba(244,63,94,.3)',background:'rgba(244,63,94,.06)',color:C.rose,fontSize:13,fontWeight:700,cursor:acting?'not-allowed':'pointer'}}>{acting===`${n.id}_reject`?'Declining…':'✕ Decline'}</button></div>
          </div></div>
        </div>;})}</div>
      </section>}

      <section><h3 style={{fontSize:15,fontWeight:700,color:C.text,margin:'0 0 14px'}}>✅ Active Consents {consents.length>0&&<span style={{fontSize:13,color:C.text3,fontWeight:400}}>({consents.length})</span>}</h3>
        {consents.length===0?<div style={{textAlign:'center',padding:'56px 20px',color:C.text3,background:C.card,borderRadius:14,border:`1px solid ${C.border}`}}><div style={{fontSize:40,marginBottom:12}}>🔒</div><div style={{fontWeight:600,marginBottom:6,color:C.text}}>No active consents</div><div style={{fontSize:13}}>Doctor access appears here only after you approve or explicitly grant it.</div></div>:<div style={{display:'flex',flexDirection:'column',gap:10}}>{consents.map((c:any)=><div key={c.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:'18px 20px',display:'flex',alignItems:'center',gap:14,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{width:44,height:44,borderRadius:'50%',background:C.tealBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>👨‍⚕️</div>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:700,color:C.text}}>Dr. {c.doctor?.firstName} {c.doctor?.lastName}</div><div style={{fontSize:12,color:C.text2}}>{c.doctor?.specialization??'General Medicine'}</div><div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:7}}>{(c.accessScope??[]).map((scope:string)=><span key={scope} style={{fontSize:10,fontWeight:700,color:'#0F766E',background:'#F0FDFA',border:'1px solid #99F6E4',padding:'2px 7px',borderRadius:100}}>{scopeLabel(scope)}</span>)}</div><div style={{display:'flex',gap:12,marginTop:6,flexWrap:'wrap'}}><span style={{fontSize:11,color:C.text3}}>Granted: {c.createdAt?new Date(c.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'—'}</span>{c.expiresAt&&<span style={{fontSize:11,color:C.amber,fontWeight:600}}>Expires: {new Date(c.expiresAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>}</div></div>
          <button onClick={()=>revoke(c.id)} disabled={acting!==null} style={{padding:'8px 16px',background:'rgba(244,63,94,.06)',border:'1px solid rgba(244,63,94,.2)',color:C.rose,borderRadius:9,fontSize:12,fontWeight:700,cursor:acting?'not-allowed':'pointer',whiteSpace:'nowrap'}}>{acting===`revoke_${c.id}`?'Revoking…':'Revoke'}</button>
        </div>)}</div>}
      </section>
    </>}
  </div>;
}
