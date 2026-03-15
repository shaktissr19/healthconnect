'use client';
import { useState, useEffect } from 'react';
import { patientAPI } from '@/lib/api';
const C={card:'#FFFFFF',border:'#E2EEF0',teal:'#0D9488',tealLight:'#14B8A6',tealBg:'rgba(13,148,136,0.08)',text:'#0F2D2A',text2:'#4B6E6A',text3:'#4B6E6A',rose:'#F43F5E'};
export default function ConsentsPage(){
  const [consents,setConsents]=useState<any[]>([]);const [loading,setLoading]=useState(true);
  const load=()=>{setLoading(true);patientAPI.getConsents().then(r=>{const d=(r as any)?.data?.data??(r as any)?.data??[];setConsents(Array.isArray(d)?d:d.consents??[]);}).catch(()=>{}).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[]);
  const revoke=async(id:string)=>{if(!confirm('Revoke access?'))return;try{await patientAPI.revokeConsent(id);load();}catch{}};
  return(
    <div style={{ maxWidth:800 }}>
      <div style={{ marginBottom:24 }}><h2 style={{ fontSize:22,fontWeight:800,color:C.text,margin:'0 0 4px' }}>🔒 Data Consents</h2><p style={{ fontSize:13,color:C.text2,margin:0 }}>Manage which doctors can access your health records</p></div>
      <div style={{ background:'rgba(13,148,136,0.06)',border:'1px solid rgba(13,148,136,0.15)',borderRadius:12,padding:'14px 18px',marginBottom:20,fontSize:13,color:C.text2 }}>ℹ️ Consents are automatically granted when you book an appointment. You can revoke access at any time.</div>
      {loading?<div style={{ padding:40,textAlign:'center',color:C.text3 }}>Loading…</div>
      :consents.length===0?<div style={{ textAlign:'center',padding:'60px 20px',color:C.text3 }}><div style={{ fontSize:40,marginBottom:12 }}>🔒</div><div style={{ fontWeight:600,marginBottom:6 }}>No active consents</div><div style={{ fontSize:13 }}>Consents are created when you book appointments</div></div>
      :<div style={{ display:'flex',flexDirection:'column',gap:10 }}>{consents.map((c:any)=>(
        <div key={c.id} style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:'18px 20px',display:'flex',alignItems:'center',gap:14,boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ width:44,height:44,borderRadius:'50%',background:C.tealBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>👨‍⚕️</div>
          <div style={{ flex:1 }}><div style={{ fontSize:14,fontWeight:700,color:C.text }}>Dr. {c.doctor?.firstName} {c.doctor?.lastName}</div><div style={{ fontSize:12,color:C.text2 }}>{c.doctor?.specialization??'General Medicine'}</div><div style={{ fontSize:11,color:C.text3,marginTop:2 }}>Granted: {c.createdAt&&new Date(c.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div></div>
          <button onClick={()=>revoke(c.id)} style={{ padding:'8px 16px',background:'rgba(244,63,94,0.06)',border:'1px solid rgba(244,63,94,0.2)',color:C.rose,borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer' }}>Revoke</button>
        </div>
      ))}</div>}
    </div>
  );
}
