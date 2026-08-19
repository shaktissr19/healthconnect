'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

const C={card:'#fff',border:'#DDE8E7',text:'#0F172A',muted:'#64748B',teal:'#0D9488',green:'#15803D',red:'#BE123C',amber:'#B45309',blue:'#1D4ED8'};
const statusTone:Record<string,[string,string]>={PENDING:[C.amber,'#FFFBEB'],ACCEPTED:[C.green,'#ECFDF5'],REJECTED:[C.red,'#FFF1F2'],REVOKED:[C.red,'#FFF1F2']};

export default function DoctorHospitalAffiliations(){
  const [rows,setRows]=useState<any[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [acting,setActing]=useState('');
  const load=useCallback(async()=>{setLoading(true);setError('');try{const r=await api.get('/doctor/hospital-affiliations');const data=r?.data?.data??r?.data??[];setRows(Array.isArray(data)?data:[])}catch(e:any){setError(e?.response?.data?.message??'Unable to load hospital affiliations.')}finally{setLoading(false)}},[]);
  useEffect(()=>{void load()},[load]);
  const respond=async(id:string,action:'accept'|'reject')=>{setActing(id);setError('');try{await api.post(`/doctor/hospital-affiliations/${id}/respond`,{action});await load()}catch(e:any){setError(e?.response?.data?.message??'Unable to respond to affiliation.')}finally{setActing('')}};
  return <section style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:18,boxShadow:'0 2px 10px rgba(15,23,42,.035)'}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'start'}}><div><div style={{fontSize:15,fontWeight:800,color:C.text}}>Hospital affiliations</div><div style={{fontSize:11,color:C.muted,marginTop:3}}>Only accepted affiliations are shown in public Hospital directories. Hospital invitations require your consent.</div></div><button onClick={()=>void load()} style={ghost}>Refresh</button></div>
    {error&&<div style={{marginTop:12,padding:10,borderRadius:9,background:'#FFF1F2',color:C.red,fontSize:11}}>⚠ {error}</div>}
    {loading?<div style={empty}>Loading affiliations…</div>:rows.length===0?<div style={empty}>No hospital affiliations or invitations yet.</div>:<div style={{marginTop:12}}>{rows.map(row=>{const tone=statusTone[row.status]??[C.muted,'#F8FAFC'];return <div key={row.id} style={{display:'grid',gridTemplateColumns:'minmax(0,1.5fr) 1fr .7fr auto',gap:10,alignItems:'center',padding:'11px 0',borderTop:`1px solid ${C.border}`,fontSize:12}}><div><b style={{color:C.text}}>{row.hospital?.name}</b><div style={{fontSize:10.5,color:C.muted,marginTop:3}}>{[row.hospital?.city,row.hospital?.state].filter(Boolean).join(', ')}{row.hospital?.isVerified?' · HC Verified':''}</div></div><span>{row.department||'Department not assigned'}{row.isPrimary?' · Primary':''}</span><span style={{justifySelf:'start',fontSize:10,fontWeight:800,color:tone[0],background:tone[1],padding:'4px 8px',borderRadius:999}}>{row.status}</span><div style={{display:'flex',gap:6}}>{row.status==='PENDING'&&<><button disabled={acting===row.id} onClick={()=>respond(row.id,'accept')} style={primary}>Accept</button><button disabled={acting===row.id} onClick={()=>respond(row.id,'reject')} style={danger}>Reject</button></>}{row.status==='ACCEPTED'&&<span style={{fontSize:10.5,color:C.green}}>Active</span>}{row.status==='REJECTED'&&<span style={{fontSize:10.5,color:C.muted}}>Declined</span>}</div></div>})}</div>}
  </section>;
}

const empty:React.CSSProperties={fontSize:11.5,color:C.muted,padding:'18px 0 4px'};
const primary:React.CSSProperties={border:'none',borderRadius:8,padding:'7px 10px',background:C.teal,color:'#fff',fontSize:10.5,fontWeight:800,cursor:'pointer'};
const danger:React.CSSProperties={...primary,background:C.red};
const ghost:React.CSSProperties={border:`1px solid ${C.border}`,borderRadius:8,padding:'7px 10px',background:'#fff',color:C.muted,fontSize:10.5,fontWeight:700,cursor:'pointer'};
