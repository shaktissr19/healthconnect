'use client';

import { useEffect, useState } from 'react';
import { api, patientAPI } from '@/lib/api';

const C={card:'#fff',border:'#E2EEF0',text:'#0F2D2A',text2:'#4B6E6A',muted:'#64748B',teal:'#0D9488',green:'#16A34A',amber:'#D97706',blue:'#2563EB'};
const VITAL_LABELS:Record<string,string>={bp:'Blood pressure',heart_rate:'Heart rate',blood_sugar:'Blood sugar',hba1c:'HbA1c',weight:'Weight',temperature:'Temperature',spo2:'Oxygen saturation',cholesterol:'Cholesterol'};

export default function InsightsTab({data:dashData,loading:dashLoading}:{data:any;loading:boolean}){
  const [history,setHistory]=useState<any[]>([]);
  const [latestVitals,setLatestVitals]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  const load=async()=>{
    setLoading(true);setError('');
    try{
      const [histRes,vitalsRes]=await Promise.all([
        api.get('/patient/health-score/history',{params:{limit:12}}),
        patientAPI.getVitals({limit:50}),
      ]);
      const h=histRes?.data?.data??histRes?.data??[];
      setHistory(Array.isArray(h)?h:[]);
      const v=vitalsRes?.data?.data??vitalsRes?.data??{};
      setLatestVitals(Array.isArray(v.latestByType)?v.latestByType:[]);
    }catch(e:any){setError(e?.response?.data?.message??'Unable to load insights.');}
    finally{setLoading(false);}
  };
  useEffect(()=>{load();},[]);

  const hs=dashData?.healthScore??{};
  const score=typeof hs==='number'?hs:hs?.score;
  const kpis=dashData?.kpis??{};
  const insight=dashData?.aiInsight;
  const trend=[...history].reverse().filter(x=>typeof x?.score==='number');

  return <div style={{display:'flex',flexDirection:'column',gap:18}}>
    {error&&<div style={{padding:'10px 14px',borderRadius:10,background:'#FFF7ED',color:'#B45309',fontSize:12,fontWeight:600}}>{error}</div>}

    <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:16}}>
      <div style={{...card,padding:20}}>
        <div style={{fontSize:11,fontWeight:800,color:C.muted,textTransform:'uppercase',letterSpacing:'.07em'}}>HC-HSI 2.0</div>
        <div style={{display:'flex',alignItems:'baseline',gap:10,marginTop:8}}><div style={{fontSize:42,fontWeight:900,color:typeof score==='number'?(score>=80?C.green:score>=60?C.amber:C.blue):C.muted}}>{typeof score==='number'?score:'—'}</div><div style={{fontSize:13,color:C.muted}}>Current Health Score</div></div>
        <div style={{fontSize:12,color:C.text2,lineHeight:1.6,marginTop:8}}>Your Health Score is calculated by the finalized HC-HSI engine from the measurable health information currently available. Missing information is not counted as healthy.</div>
      </div>
      <div style={{...card,padding:20}}>
        <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:12}}>Care activity</div>
        <Stat label="Active medications" value={kpis.activeMedicationsCount??0}/>
        <Stat label="Symptoms this week" value={kpis.recentSymptomsCount??0}/>
        <Stat label="Upcoming appointments" value={kpis.upcomingAppointmentsCount??0}/>
        <Stat label="Reports in vault" value={kpis.totalReports??0}/>
      </div>
    </div>

    {insight&&<div style={{...card,padding:18,background:'#F8FFFE'}}><div style={{fontSize:12,fontWeight:800,color:C.teal,marginBottom:7}}>CURRENT HEALTH CONTEXT</div><div style={{fontSize:13,color:C.text2,lineHeight:1.65}}>{insight}</div></div>}

    <div style={{...card,padding:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}><div><div style={{fontSize:15,fontWeight:800,color:C.text}}>Health Score history</div><div style={{fontSize:11,color:C.muted,marginTop:3}}>Saved HC-HSI snapshots; this is not a diagnosis.</div></div><button onClick={load} style={ghost}>↻ Refresh</button></div>
      {loading||dashLoading?<div style={{height:90,display:'grid',placeItems:'center',color:C.muted}}>Loading…</div>:trend.length===0?<div style={{padding:'24px 0',color:C.muted,fontSize:12}}>History appears after Health Score snapshots are saved.</div>:<div style={{height:110,display:'flex',alignItems:'flex-end',gap:8}}>{trend.map((x:any,i:number)=>{const s=Math.max(0,Math.min(100,Number(x.score)||0));return <div key={`${x.calculatedAt}-${i}`} title={`${s}/100 · ${new Date(x.calculatedAt).toLocaleString('en-IN')}`} style={{flex:1,minWidth:12,maxWidth:46,height:`${Math.max(8,s)}%`,borderRadius:'5px 5px 0 0',background:s>=80?C.green:s>=60?C.amber:C.blue,opacity:.85}}/>})}</div>}
    </div>

    <div>
      <div style={{fontSize:15,fontWeight:800,color:C.text,marginBottom:12}}>Latest measured vitals</div>
      {loading?<div style={{...card,padding:30,textAlign:'center',color:C.muted}}>Loading vitals…</div>:latestVitals.length===0?<div style={{...card,padding:32,textAlign:'center',color:C.muted}}>No vitals have been logged yet. Use Vitals in the left menu to add measurements.</div>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:12}}>{latestVitals.map((v:any)=>{
        const value=v.type==='bp'&&v.systolic!=null&&v.diastolic!=null?`${v.systolic}/${v.diastolic}`:v.value;
        return <div key={v.id} style={{...card,padding:16}}><div style={{fontSize:11,fontWeight:800,color:C.muted,textTransform:'uppercase'}}>{VITAL_LABELS[v.type]??String(v.type).replace(/_/g,' ')}</div><div style={{fontSize:24,fontWeight:900,color:C.text,marginTop:8}}>{value??'—'} <span style={{fontSize:11,fontWeight:600,color:C.muted}}>{v.unit??''}</span></div><div style={{fontSize:10,color:C.muted,marginTop:6}}>{v.measuredAt?new Date(v.measuredAt).toLocaleString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):''}</div></div>;
      })}</div>}
    </div>
  </div>;
}

function Stat({label,value}:{label:string;value:string|number}){return <div style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #F1F5F9',fontSize:12}}><span style={{color:C.text2}}>{label}</span><b style={{color:C.text}}>{value}</b></div>}
const card:React.CSSProperties={background:C.card,border:`1px solid ${C.border}`,borderRadius:14,boxShadow:'0 2px 8px rgba(0,0,0,.05)'};
const ghost:React.CSSProperties={padding:'7px 12px',border:`1px solid ${C.border}`,borderRadius:8,background:'#fff',color:C.text2,fontSize:11,fontWeight:700,cursor:'pointer'};