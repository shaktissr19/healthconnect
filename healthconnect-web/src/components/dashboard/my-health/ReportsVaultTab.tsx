'use client';

import { useEffect, useRef, useState } from 'react';
import { doctorAPI, patientAPI } from '@/lib/api';

const TYPES = ['LAB','SCAN','PRESCRIPTION','DISCHARGE','VACCINATION','INSURANCE','OTHER'] as const;
const ICONS:Record<string,string> = { LAB:'🧪',SCAN:'🩻',PRESCRIPTION:'💊',DISCHARGE:'🏥',VACCINATION:'💉',INSURANCE:'🛡️',OTHER:'📄' };
const LABELS:Record<string,string> = { LAB:'Lab Report',SCAN:'Scan / Imaging',PRESCRIPTION:'Prescription',DISCHARGE:'Discharge Summary',VACCINATION:'Vaccination',INSURANCE:'Insurance',OTHER:'Other' };
const fmtDate = (value?:string) => value ? new Date(value).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—';
const fmtSize = (bytes?:number) => !bytes ? '—' : bytes>=1024*1024 ? `${(bytes/1024/1024).toFixed(1)} MB` : `${Math.round(bytes/1024)} KB`;
const guessType = (name:string) => { const n=name.toLowerCase(); if(/lab|blood|urine/.test(n))return'LAB';if(/scan|mri|ct|xray|x-ray|imaging/.test(n))return'SCAN';if(/prescription|\brx\b/.test(n))return'PRESCRIPTION';if(/discharge/.test(n))return'DISCHARGE';if(/vaccine|vaccination/.test(n))return'VACCINATION';if(/insurance|policy/.test(n))return'INSURANCE';return'OTHER'; };

export default function ReportsVaultTab() {
  const [reports,setReports] = useState<any[]>([]);
  const [summary,setSummary] = useState<Record<string,number>>({});
  const [view,setView] = useState<'vault'|'access'>('vault');
  const [filter,setFilter] = useState('All');
  const [loading,setLoading] = useState(true);
  const [uploading,setUploading] = useState(false);
  const [dragging,setDragging] = useState(false);
  const [page,setPage] = useState(1);
  const [total,setTotal] = useState(0);
  const [sharing,setSharing] = useState<any|null>(null);
  const [message,setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async (nextPage=1,nextFilter=filter) => {
    if(nextPage===1)setLoading(true);
    try {
      const params:any={page:nextPage,limit:12}; if(nextFilter!=='All')params.type=nextFilter;
      const res:any=await patientAPI.getReports(params);
      const data=res?.data?.data??res?.data??{};
      const items=Array.isArray(data)?data:Array.isArray(data.reports)?data.reports:[];
      setReports(prev=>nextPage===1?items:[...prev,...items]);
      const raw=data.summary;
      if(Array.isArray(raw)) setSummary(Object.fromEntries(raw.map((item:any)=>[item.type,Number(item.count)||0])));
      else if(raw&&typeof raw==='object') setSummary(raw);
      else setSummary({});
      setTotal(Number(data.total??items.length));
    } catch(e:any){setMessage(e?.response?.data?.message??'Unable to load reports.');if(nextPage===1)setReports([]);}finally{setLoading(false);}
  };

  useEffect(()=>{setPage(1);load(1,filter);},[filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const upload = async (file:File) => {
    if(!file)return;
    if(file.size>20*1024*1024){setMessage('File must be 20 MB or smaller.');return;}
    setUploading(true);setMessage('');
    const data=new FormData();data.append('file',file);data.append('name',file.name.replace(/\.[^.]+$/,''));data.append('type',guessType(file.name));data.append('reportDate',new Date().toISOString());
    try{await patientAPI.uploadReport(data);setMessage('✓ Report uploaded');await load(1,filter);}catch(e:any){setMessage(e?.response?.data?.message??'Unable to upload report.');}finally{setUploading(false);if(fileRef.current)fileRef.current.value='';}
  };

  const remove = async (report:any) => {
    if(!confirm(`Delete ${report.name ?? 'this report'}?`))return;
    try{await patientAPI.deleteReport(report.id);setMessage('✓ Report deleted');await load(1,filter);}catch(e:any){setMessage(e?.response?.data?.message??'Unable to delete report.');}
  };

  const accessRows = reports.flatMap(report => Array.isArray(report.shares)?report.shares.map((share:any)=>({report,share})):[]);

  return <>
    <style>{`.rv-card{background:#fff;border:1px solid #E2EEF0;border-radius:14px;padding:18px;box-shadow:0 2px 8px rgba(0,0,0,.05)}.rv-btn{padding:8px 11px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;background:#fff}.rv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}@media(max-width:700px){.rv-grid{grid-template-columns:1fr}}`}</style>
    {message&&<div style={{marginBottom:14,padding:'9px 12px',borderRadius:9,background:message.startsWith('✓')?'#F0FDF4':'#FFF7ED',color:message.startsWith('✓')?'#15803D':'#B45309',fontSize:12,fontWeight:600}}>{message}</div>}
    {Object.keys(summary).length>0&&<div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>{Object.entries(summary).filter(([,count])=>count>0).map(([type,count])=><div key={type} style={{background:'#fff',border:'1px solid #E2EEF0',borderRadius:9,padding:'6px 11px',fontSize:12,color:'#4B6E6A'}}>{ICONS[type]??'📄'} <strong style={{color:'#0F2D2A'}}>{count}</strong> {LABELS[type]??type}</div>)}</div>}

    <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap',marginBottom:18}}><div style={{display:'flex',gap:8}}><button onClick={()=>setView('vault')} className="rv-btn" style={{border:`1px solid ${view==='vault'?'#0D9488':'#E2EEF0'}`,color:view==='vault'?'#0D9488':'#4B6E6A',background:view==='vault'?'#F0FDF9':'#fff'}}>📁 Vault</button><button onClick={()=>setView('access')} className="rv-btn" style={{border:`1px solid ${view==='access'?'#0D9488':'#E2EEF0'}`,color:view==='access'?'#0D9488':'#4B6E6A',background:view==='access'?'#F0FDF9':'#fff'}}>🔒 Shared Access</button></div>{view==='vault'&&<div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{['All',...TYPES].map(type=><button key={type} onClick={()=>setFilter(type)} style={{padding:'5px 10px',borderRadius:100,border:`1px solid ${filter===type?'#0D9488':'#E2EEF0'}`,background:filter===type?'#F0FDF9':'#fff',color:filter===type?'#0D9488':'#4B6E6A',fontSize:11,fontWeight:600,cursor:'pointer'}}>{type==='All'?'All':`${ICONS[type]} ${LABELS[type]}`}</button>)}</div>}</div>

    {view==='vault'?<>
      <div onClick={()=>fileRef.current?.click()} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);const file=e.dataTransfer.files?.[0];if(file)upload(file);}} style={{border:`2px dashed ${dragging?'#0D9488':'#B2DDD8'}`,background:dragging?'#F0FDF9':'#FAFFFE',borderRadius:14,padding:26,textAlign:'center',cursor:'pointer',marginBottom:20}}><input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:'none'}} onChange={e=>{const file=e.target.files?.[0];if(file)upload(file);}}/><div style={{fontSize:30}}>{uploading?'⏳':'📤'}</div><div style={{fontWeight:700,color:'#0F2D2A',fontSize:13,marginTop:5}}>{uploading?'Uploading…':'Drop a report here or click to upload'}</div><div style={{fontSize:11,color:'#64748B',marginTop:3}}>PDF, JPG or PNG · Max 20 MB</div></div>
      {loading?<div style={{padding:40,textAlign:'center',color:'#64748B'}}>Loading reports…</div>:reports.length===0?<div className="rv-card" style={{textAlign:'center',padding:45,color:'#64748B'}}>📂<div style={{marginTop:8}}>No reports found.</div></div>:<><div className="rv-grid">{reports.map(report=><div key={report.id} className="rv-card"><div style={{display:'flex',gap:12,alignItems:'flex-start'}}><div style={{width:44,height:44,borderRadius:11,background:'#F0FDF9',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>{ICONS[report.type]??'📄'}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:'#0F2D2A',fontSize:14,overflow:'hidden',textOverflow:'ellipsis'}}>{report.name??'Report'}</div><div style={{fontSize:11,color:'#64748B',marginTop:3}}>{LABELS[report.type]??report.type} · {fmtSize(report.fileSize)} · {fmtDate(report.reportDate??report.createdAt)}</div></div></div>{report.description&&<div style={{fontSize:12,color:'#4B6E6A',marginTop:10}}>{report.description}</div>}{Array.isArray(report.shares)&&report.shares.length>0&&<div style={{fontSize:11,color:'#7C3AED',marginTop:9}}>Shared with {report.shares.length} doctor{report.shares.length===1?'':'s'}</div>}<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7,marginTop:14}}><button className="rv-btn" onClick={()=>report.fileUrl&&window.open(report.fileUrl,'_blank','noopener,noreferrer')} style={{border:'1px solid #A7F3D0',color:'#047857'}}>Open</button><button className="rv-btn" onClick={()=>setSharing(report)} style={{border:'1px solid #DDD6FE',color:'#7C3AED'}}>Share</button><button className="rv-btn" onClick={()=>remove(report)} style={{border:'1px solid #FECDD3',color:'#BE123C'}}>Delete</button></div></div>)}</div>{reports.length<total&&<div style={{textAlign:'center',marginTop:16}}><button onClick={()=>{const next=page+1;setPage(next);load(next,filter);}} className="rv-btn" style={{border:'1px solid #E2EEF0',color:'#4B6E6A'}}>Load more ({total-reports.length} remaining)</button></div>}</>}
    </>:<div className="rv-card" style={{padding:0,overflow:'hidden'}}><div style={{padding:'14px 18px',borderBottom:'1px solid #E2EEF0',fontWeight:700,color:'#0F2D2A'}}>Shared report access</div>{accessRows.length===0?<div style={{padding:40,textAlign:'center',color:'#64748B'}}>No report sharing activity in the loaded reports.</div>:accessRows.map(({report,share}:any)=><div key={share.id??`${report.id}-${share.doctorId}`} style={{padding:'13px 18px',borderBottom:'1px solid #F1F5F9',display:'flex',alignItems:'center',gap:12}}><span>🔒</span><div style={{flex:1}}><div style={{fontSize:13,color:'#0F2D2A'}}><strong>{share.doctor?.firstName?`Dr. ${share.doctor.firstName} ${share.doctor.lastName??''}`:'Doctor'}</strong> can access <strong>{report.name}</strong></div><div style={{fontSize:11,color:'#64748B',marginTop:2}}>Shared {fmtDate(share.createdAt)} · Expires {fmtDate(share.expiresAt)}</div></div><button onClick={async()=>{if(!confirm('Revoke this doctor’s access to the report?'))return;try{await patientAPI.revokeReportShare(report.id,share.doctorId);setMessage('✓ Report access revoked');await load(1,filter);}catch(e:any){setMessage(e?.response?.data?.message??'Unable to revoke access.');}}} className="rv-btn" style={{border:'1px solid #FECDD3',color:'#BE123C'}}>Revoke</button></div>)}</div>}

    {sharing&&<ShareReportModal report={sharing} onClose={()=>setSharing(null)} onShared={async()=>{setSharing(null);setMessage('✓ Report shared');await load(1,filter);}}/>}
  </>;
}

function ShareReportModal({report,onClose,onShared}:{report:any;onClose:()=>void;onShared:()=>void}) {
  const [doctors,setDoctors]=useState<any[]>([]);const [search,setSearch]=useState('');const [doctorId,setDoctorId]=useState('');const [days,setDays]=useState(7);const [saving,setSaving]=useState(false);const [error,setError]=useState('');
  useEffect(()=>{doctorAPI.getFeatured().then((res:any)=>{const data=res?.data?.data??res?.data??{};setDoctors(Array.isArray(data)?data:data.doctors??[]);}).catch(()=>setDoctors([]));},[]);
  const filtered=doctors.filter(doc=>!search||`${doc.firstName} ${doc.lastName} ${doc.specialization}`.toLowerCase().includes(search.toLowerCase()));
  const share=async()=>{if(!doctorId){setError('Select a doctor.');return;}setSaving(true);setError('');try{await patientAPI.shareReport(report.id,{doctorId,expiresInDays:days});onShared();}catch(e:any){setError(e?.response?.data?.message??'Unable to share report.');}finally{setSaving(false);}};
  return <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(15,23,42,.65)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}><div style={{background:'#fff',borderRadius:16,padding:24,width:'100%',maxWidth:470,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 60px rgba(0,0,0,.25)'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h3 style={{margin:0,color:'#0F2D2A'}}>Share Report</h3><button onClick={onClose} style={{border:'none',background:'none',fontSize:20,cursor:'pointer'}}>×</button></div><div style={{fontSize:12,color:'#64748B',margin:'8px 0 14px'}}>{report.name}</div><input placeholder="Search doctors" value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',padding:'9px 12px',boxSizing:'border-box',border:'1px solid #E2EEF0',borderRadius:9,marginBottom:10}}/><div style={{maxHeight:190,overflowY:'auto',border:'1px solid #E2EEF0',borderRadius:10,marginBottom:14}}>{filtered.length===0?<div style={{padding:18,textAlign:'center',color:'#64748B',fontSize:12}}>No doctors found.</div>:filtered.map(doc=><div key={doc.id} onClick={()=>setDoctorId(doc.id)} style={{padding:'9px 12px',borderBottom:'1px solid #F1F5F9',cursor:'pointer',background:doctorId===doc.id?'#F0FDF9':'#fff'}}><div style={{fontSize:13,fontWeight:700,color:doctorId===doc.id?'#0D9488':'#0F2D2A'}}>Dr. {doc.firstName} {doc.lastName} {doctorId===doc.id?'✓':''}</div><div style={{fontSize:11,color:'#64748B'}}>{doc.specialization}</div></div>)}</div><div style={{fontSize:11,fontWeight:700,color:'#64748B',marginBottom:6}}>ACCESS DURATION</div><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:14}}>{[1,7,30,90].map(value=><button key={value} onClick={()=>setDays(value)} style={{padding:7,border:`1px solid ${days===value?'#0D9488':'#E2EEF0'}`,background:days===value?'#F0FDF9':'#fff',color:days===value?'#0D9488':'#64748B',borderRadius:8,fontWeight:600,cursor:'pointer'}}>{value}d</button>)}</div>{error&&<div style={{fontSize:12,color:'#BE123C',marginBottom:10}}>{error}</div>}<div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:8}}><button onClick={onClose} className="rv-btn" style={{border:'1px solid #E2EEF0'}}>Cancel</button><button onClick={share} disabled={saving||!doctorId} className="rv-btn" style={{border:'none',background:'linear-gradient(135deg,#0D9488,#14B8A6)',color:'#fff',opacity:doctorId?1:.5}}>{saving?'Sharing…':'Share with Doctor'}</button></div><div style={{fontSize:10,color:'#64748B',marginTop:10}}>Access expires automatically and can be revoked from Shared Access.</div></div></div>;
}
