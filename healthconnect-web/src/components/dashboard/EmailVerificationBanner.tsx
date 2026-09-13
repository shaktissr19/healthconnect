'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/lib/api';

type State='idle'|'sending'|'sent'|'error';

export default function EmailVerificationBanner(){
  const router=useRouter();
  const user=useAuthStore(s=>(s as any).user);
  const store=useAuthStore.getState() as any;
  const [state,setState]=useState<State>('idle');
  const [dismissed,setDismissed]=useState(false);
  const [errMsg,setErrMsg]=useState('');
  const autoFired=useRef(false);

  useEffect(()=>{
    if(!user||user.isEmailVerified||dismissed||autoFired.current)return;
    const key=`hc_vsent_${user.id??user.email}`;
    if(sessionStorage.getItem(key))return;
    autoFired.current=true;
    sessionStorage.setItem(key,'1');
    authAPI.resendVerification().catch(()=>{});
  },[user,dismissed]);

  if(!user||user.isEmailVerified||dismissed)return null;

  const handleResend=async()=>{
    if(state==='sending'||state==='sent')return;
    setState('sending');setErrMsg('');
    try{
      await authAPI.resendVerification();
      setState('sent');
    }catch(err:any){
      const msg=err?.response?.data?.message??'';
      if(msg.includes('ALREADY_VERIFIED')||msg.includes('already verified')){
        if(store.setAuth&&store.token)store.setAuth({...user,isEmailVerified:true},store.token);
        setDismissed(true);return;
      }
      setErrMsg('Could not send the verification email. Please try again.');
      setState('error');
    }
  };

  return <div style={{background:'#E7EEF5',borderBottom:'1px solid #BDD0DD',padding:'10px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',fontSize:12.5}}>
    <div style={{display:'flex',alignItems:'center',gap:9,flexWrap:'wrap'}}>
      <span style={{fontSize:15}}>✉</span>
      <strong style={{color:'#173A51'}}>Verify your email to use protected HealthConnect actions.</strong>
      <span style={{color:'#506B7E'}}>{user.email}</span>
    </div>
    <div style={{display:'flex',gap:7,alignItems:'center',flexWrap:'wrap'}}>
      {state==='sent'&&<span style={{fontSize:11.5,color:'#20785B',fontWeight:750}}>✓ Verification link sent</span>}
      {state==='error'&&<span style={{fontSize:11.5,color:'#B23A32',fontWeight:700}}>{errMsg}</span>}
      {(state==='idle'||state==='error')&&<button type="button" onClick={handleResend} style={{padding:'6px 11px',borderRadius:8,fontSize:11.5,fontWeight:850,background:'#173F5B',color:'#fff',border:'1px solid #173F5B',cursor:'pointer'}}>{state==='error'?'Try link again':'Resend verification link'}</button>}
      {state==='sending'&&<span style={{fontSize:11.5,color:'#506B7E',fontWeight:700}}>Sending…</span>}
      <button type="button" onClick={()=>router.push('/verify-email')} style={{padding:'6px 11px',borderRadius:8,fontSize:11.5,fontWeight:850,background:'#278C7F',color:'#fff',border:'1px solid #278C7F',cursor:'pointer'}}>Use 6-digit code</button>
      <button type="button" onClick={()=>setDismissed(true)} aria-label="Dismiss email verification reminder" style={{background:'none',border:'none',color:'#567184',cursor:'pointer',fontSize:17,lineHeight:1,padding:'2px 5px'}}>×</button>
    </div>
  </div>;
}
