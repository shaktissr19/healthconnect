'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, authAPI } from '@/lib/api';

type Status='idle'|'verifying'|'success'|'error';

function VerifyEmailContent(){
  const router=useRouter();
  const searchParams=useSearchParams();
  const token=searchParams.get('token')||'';

  const [status,setStatus]=useState<Status>(token?'verifying':'idle');
  const [message,setMessage]=useState(token?'Verifying your email…':'Verify your email with a secure 6-digit code.');
  const [email,setEmail]=useState('');
  const [otp,setOtp]=useState('');
  const [codeSent,setCodeSent]=useState(false);
  const [busy,setBusy]=useState(false);
  const [resendIn,setResendIn]=useState(0);

  useEffect(()=>{
    if(!token)return;
    authAPI.verifyEmail({token})
      .then(()=>{setStatus('success');setMessage('Your email has been successfully verified.');})
      .catch((err:any)=>{
        setStatus('error');
        setMessage(err?.response?.data?.message||'This verification link has expired or is invalid. You can verify with a 6-digit code instead.');
      });
  },[token]);

  useEffect(()=>{
    if(resendIn<=0)return;
    const timer=window.setInterval(()=>setResendIn(value=>Math.max(0,value-1)),1000);
    return()=>window.clearInterval(timer);
  },[resendIn]);

  const requestCode=async()=>{
    const normalized=email.trim().toLowerCase();
    if(!normalized||!normalized.includes('@')){setStatus('error');setMessage('Enter the email address used for your HealthConnect account.');return;}
    setBusy(true);
    try{
      const response:any=await api.post('/auth/email/request-otp',{email:normalized});
      const data=response?.data?.data??response?.data??{};
      setCodeSent(true);
      setOtp('');
      setResendIn(Number(data?.resendAfterSeconds||60));
      setStatus('idle');
      setMessage('If this account can be verified, a 6-digit code has been sent. The code expires in 10 minutes.');
    }catch(err:any){
      setStatus('error');
      setMessage(err?.response?.data?.message||'We could not send a verification code. Please try again shortly.');
    }finally{setBusy(false)}
  };

  const verifyCode=async()=>{
    if(!/^\d{6}$/.test(otp)){setStatus('error');setMessage('Enter the 6-digit verification code from your email.');return;}
    setBusy(true);
    setStatus('verifying');
    setMessage('Checking your verification code…');
    try{
      await api.post('/auth/email/verify-otp',{email:email.trim().toLowerCase(),otp});
      setStatus('success');
      setMessage('Your email has been successfully verified.');
    }catch(err:any){
      setStatus('error');
      setMessage(err?.response?.data?.message||'The code is invalid or expired. Request a new code and try again.');
    }finally{setBusy(false)}
  };

  return <div className="verify-shell">
    <style>{`
      .verify-shell{width:min(520px,94vw);font-family:'DM Sans',Arial,sans-serif}.verify-brand{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:22px;color:#123B56}.verify-mark{width:42px;height:42px;border-radius:12px;background:#123B56;color:#fff;display:grid;place-items:center;font:900 16px 'Sora',sans-serif;box-shadow:inset 0 0 0 2px #64D7CA}.verify-brand b{font-family:'Sora',sans-serif;font-size:17px}.verify-card{background:#fff;border:1px solid #C8D7E1;border-radius:20px;padding:32px;box-shadow:0 22px 50px rgba(22,54,72,.12)}.verify-state{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;margin:0 auto 16px;font-size:26px}.verify-state.idle{background:#E1ECF5;color:#315FEA}.verify-state.verifying{border:4px solid #DFE8EE;border-top-color:#159A8C;animation:verifySpin .8s linear infinite}.verify-state.success{background:#DDF3EA;color:#20785B}.verify-state.error{background:#F6E3DF;color:#B44B32}.verify-card h1{font-family:'Sora',sans-serif;font-size:24px;letter-spacing:-.03em;color:#102F49;text-align:center;margin:0 0 9px}.verify-message{text-align:center;font-size:13.5px;line-height:1.55;color:#496479;margin:0 auto 22px;max-width:410px}.verify-form{display:grid;gap:10px}.verify-label{font-size:10px;font-weight:900;letter-spacing:.08em;color:#526B7C;text-transform:uppercase}.verify-input{width:100%;box-sizing:border-box;border:1px solid #B9CAD6;background:#F6F9FB;color:#102F49;border-radius:10px;padding:12px 13px;font-size:13px;outline:none}.verify-input:focus{border-color:#315FEA;box-shadow:0 0 0 3px rgba(49,95,234,.11)}.verify-otp{font-family:'Sora',sans-serif;font-size:23px;letter-spacing:.28em;text-align:center;padding-left:calc(13px + .28em)}.verify-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:4px}.verify-btn{border-radius:10px;padding:11px 13px;font-size:12px;font-weight:900;cursor:pointer}.verify-btn.primary{background:#315FEA;color:#fff;border:1px solid #315FEA}.verify-btn.secondary{background:#E3EFEC;color:#226A62;border:1px solid #BAD8D2}.verify-btn.ghost{background:#fff;color:#36576B;border:1px solid #C3D2DC}.verify-btn:disabled{opacity:.55;cursor:not-allowed}.verify-note{margin-top:16px;padding:10px 12px;border-radius:10px;background:#F2F6F8;color:#617788;font-size:10.5px;line-height:1.5}.verify-success-actions{display:grid;gap:9px;margin-top:19px}@keyframes verifySpin{to{transform:rotate(360deg)}}@media(max-width:520px){.verify-card{padding:25px 20px}.verify-actions{grid-template-columns:1fr}}
    `}</style>
    <div className="verify-brand"><span className="verify-mark">HC</span><b>HealthConnect India</b></div>
    <section className="verify-card" aria-live="polite">
      <div className={`verify-state ${status}`}>{status==='idle'?'✉':status==='success'?'✓':status==='error'?'!':''}</div>
      <h1>{status==='success'?'Email verified':status==='verifying'?'Verifying email':'Verify your email'}</h1>
      <p className="verify-message">{message}</p>

      {status!=='success'&&status!=='verifying'&&<div className="verify-form">
        <label className="verify-label" htmlFor="verify-email">Account email</label>
        <input id="verify-email" className="verify-input" type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="you@example.com"/>
        {codeSent&&<><label className="verify-label" htmlFor="verify-otp">6-digit code</label><input id="verify-otp" className="verify-input verify-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={event=>setOtp(event.target.value.replace(/\D/g,'').slice(0,6))} placeholder="000000"/></>}
        <div className="verify-actions">
          {codeSent?<button type="button" className="verify-btn primary" disabled={busy} onClick={verifyCode}>{busy?'Checking…':'Verify code'}</button>:<button type="button" className="verify-btn primary" disabled={busy} onClick={requestCode}>{busy?'Sending…':'Send verification code'}</button>}
          {codeSent?<button type="button" className="verify-btn secondary" disabled={busy||resendIn>0} onClick={requestCode}>{resendIn>0?`Resend in ${resendIn}s`:'Send new code'}</button>:<button type="button" className="verify-btn ghost" onClick={()=>router.push('/')}>Back to sign in</button>}
        </div>
        <div className="verify-note">For security, codes expire after 10 minutes and stop working after repeated incorrect attempts. HealthConnect will never ask you to share an OTP, password or UPI PIN.</div>
      </div>}

      {status==='verifying'&&!busy&&<div className="verify-success-actions"><button className="verify-btn ghost" onClick={()=>router.push('/')}>Back to HealthConnect</button></div>}
      {status==='success'&&<div className="verify-success-actions"><button className="verify-btn primary" onClick={()=>router.push('/dashboard')}>Continue to HealthConnect</button><button className="verify-btn ghost" onClick={()=>router.push('/')}>Go to public home</button></div>}
    </section>
  </div>;
}

export default function VerifyEmailPage(){
  return <div style={{minHeight:'100vh',background:'linear-gradient(145deg,#DCE6EC,#EEF2F5)',display:'flex',alignItems:'center',justifyContent:'center',padding:'28px 16px'}}><Suspense fallback={<div style={{fontFamily:'Arial',color:'#31566A'}}>Loading verification…</div>}><VerifyEmailContent/></Suspense></div>;
}
