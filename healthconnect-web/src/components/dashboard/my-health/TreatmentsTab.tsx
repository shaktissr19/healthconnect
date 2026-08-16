'use client';

import { useCallback, useEffect, useState } from 'react';
import { patientAPI } from '@/lib/api';

const FREQ_LABELS: Record<string,string> = {
  ONCE_DAILY:'Once daily', TWICE_DAILY:'Twice daily', THREE_TIMES_DAILY:'3× daily', FOUR_TIMES_DAILY:'4× daily',
  WEEKLY:'Weekly', BIWEEKLY:'Biweekly', MONTHLY:'Monthly', AS_NEEDED:'As needed', CUSTOM:'Custom',
};
const COLORS = ['#14B8A6','#8B5CF6','#F59E0B','#F43F5E','#22C55E','#3B82F6'];
const adherenceColor = (pct:number) => pct >= 85 ? '#22C55E' : pct >= 70 ? '#F59E0B' : '#F43F5E';
const isTaken = (status:unknown) => String(status ?? '').toLowerCase() === 'taken';

function nextDoseLabel(times?:string[]) {
  if (!times?.length) return 'No fixed time';
  const sorted = [...times].sort();
  const now = new Date();
  const current = now.getHours()*60+now.getMinutes();
  const next = sorted.find(value => { const [h,m] = value.split(':').map(Number); return h*60+m > current; });
  return next ?? `Tomorrow ${sorted[0]}`;
}

export default function TreatmentsTab() {
  const [medications,setMedications] = useState<any[]>([]);
  const [therapies,setTherapies] = useState<any[]>([]);
  const [loading,setLoading] = useState(true);
  const [logging,setLogging] = useState<string|null>(null);
  const [message,setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [medRes,therapyRes] = await Promise.all([
        patientAPI.getMedications(),
        patientAPI.getTherapies(),
      ]);
      const medData:any = medRes?.data?.data ?? medRes?.data ?? [];
      const all = Array.isArray(medData) ? medData : medData.medications ?? [];
      setMedications(all.filter((item:any) => !item.status || item.status === 'ACTIVE'));
      const therapyData:any = therapyRes?.data?.data ?? therapyRes?.data ?? [];
      setTherapies(Array.isArray(therapyData) ? therapyData : therapyData.therapies ?? []);
    } catch (e:any) {
      setMessage(e?.response?.data?.message ?? 'Unable to load treatments.');
    } finally { setLoading(false); }
  },[]);

  useEffect(() => { load(); },[load]);

  const markTaken = async (medication:any) => {
    setLogging(medication.id); setMessage('');
    try {
      const now = new Date().toISOString();
      await patientAPI.logDose(medication.id,{ status:'taken', scheduledTime:now, takenAt:now });
      setMessage('✓ Dose logged');
      await load();
    } catch (e:any) {
      setMessage(e?.response?.data?.message ?? 'Unable to log dose.');
    } finally { setLogging(null); }
  };

  const refillAlerts = medications.filter(item => item.needsRefill);
  if (loading) return <div style={{ padding:40,textAlign:'center',color:'#64748B' }}>Loading treatments…</div>;

  return <div>
    {message && <div style={{ marginBottom:14,padding:'9px 12px',borderRadius:9,background:message.startsWith('✓')?'#F0FDF4':'#FFF7ED',color:message.startsWith('✓')?'#15803D':'#B45309',fontSize:12,fontWeight:600 }}>{message}</div>}

    {refillAlerts.length > 0 && <div style={{ background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.35)',borderRadius:12,padding:'12px 18px',marginBottom:20,fontSize:13,color:'#92400E' }}><strong>⚠ Refill needed:</strong> {refillAlerts.map(item => `${item.name} (${item.currentStock ?? 0} left)`).join(' · ')}</div>}

    <h3 style={{ color:'#0F2D2A',fontWeight:700,fontSize:15,marginBottom:14 }}>💊 Active Medications</h3>
    {medications.length === 0 ? <div style={{ background:'#F0FDF9',border:'1px solid #E2EEF0',borderRadius:14,padding:'36px 0',textAlign:'center',color:'#64748B',marginBottom:28 }}><div style={{ fontSize:34,marginBottom:8 }}>💊</div><strong style={{ color:'#0F2D2A' }}>No active medications</strong><div style={{ fontSize:12,marginTop:4 }}>Use Medications to add and manage prescriptions.</div></div> : <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16,marginBottom:28 }}>{medications.map((med:any,index:number) => {
      const color = COLORS[index%COLORS.length];
      const adherence:number|null = med.adherencePct == null ? null : Number(med.adherencePct);
      const takenToday = Array.isArray(med.logs) && med.logs.some((log:any) => {
        const when = new Date(log.takenAt ?? log.scheduledTime ?? log.createdAt);
        return isTaken(log.status) && when.toDateString() === new Date().toDateString();
      });
      return <div key={med.id} style={{ background:'#fff',border:'1px solid #E2EEF0',borderRadius:14,overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}><div style={{ height:4,background:color }}/><div style={{ padding:18 }}><div style={{ display:'flex',justifyContent:'space-between',gap:10,marginBottom:10 }}><div><div style={{ fontWeight:700,color:'#0F2D2A',fontSize:15 }}>{med.name}</div><div style={{ fontSize:12,color:'#4B6E6A',marginTop:2 }}>{med.dosage} {med.dosageUnit ?? ''} · {FREQ_LABELS[med.frequency] ?? med.customFrequency ?? med.frequency}</div></div><span style={{ color:'#16A34A',fontSize:10,fontWeight:700 }}>ACTIVE</span></div>{med.prescribedFor && <div style={{ fontSize:12,color:'#4B6E6A',marginBottom:10 }}>For: {med.prescribedFor}</div>}<div style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:'#64748B',marginBottom:5 }}><span>30-day adherence</span><span style={{ fontWeight:700,color:adherence == null?'#64748B':adherenceColor(adherence) }}>{adherence == null?'No logs yet':`${adherence}%`}</span></div><div style={{ height:6,background:'#E2EEF0',borderRadius:3,overflow:'hidden',marginBottom:12 }}><div style={{ height:'100%',width:`${adherence ?? 0}%`,background:adherence == null?'#CBD5E1':adherenceColor(adherence),borderRadius:3 }}/></div><div style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:'#64748B',marginBottom:14 }}><span>Next: {nextDoseLabel(med.timesOfDay)}</span><span style={{ color:med.needsRefill?'#D97706':'#64748B',fontWeight:med.needsRefill?700:400 }}>{med.currentStock == null?'Stock not tracked':med.needsRefill?`⚠ ${med.currentStock} left`:`Stock: ${med.currentStock}`}</span></div><button disabled={Boolean(logging)||takenToday} onClick={() => markTaken(med)} style={{ width:'100%',padding:10,borderRadius:9,border:takenToday?'1px solid #BBF7D0':'1px solid #0D9488',background:takenToday?'#F0FDF4':'linear-gradient(135deg,#0D9488,#14B8A6)',color:takenToday?'#15803D':'#fff',fontWeight:700,cursor:takenToday?'default':'pointer' }}>{logging===med.id?'Saving…':takenToday?'✓ Taken today':'✓ Mark dose taken'}</button></div></div>;
    })}</div>}

    <h3 style={{ color:'#0F2D2A',fontWeight:700,fontSize:15,marginBottom:14 }}>🌱 Lifestyle Therapies</h3>
    {therapies.length === 0 ? <div style={{ background:'#F0FDF9',border:'1px solid #E2EEF0',borderRadius:14,padding:'36px 0',textAlign:'center',color:'#64748B' }}><div style={{ fontSize:34,marginBottom:8 }}>🌱</div><strong style={{ color:'#0F2D2A' }}>No lifestyle therapies tracked</strong><div style={{ fontSize:12,marginTop:4 }}>Use Therapies to track diet, exercise, sleep or other care plans.</div></div> : <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14 }}>{therapies.map((therapy:any,index:number) => {
      const current = Number(therapy.currentValue); const target = Number(therapy.targetValue); const hasProgress = Number.isFinite(current)&&Number.isFinite(target)&&target>0; const pct = hasProgress?Math.min(100,Math.round(current/target*100)):null; const color=COLORS[index%COLORS.length];
      return <div key={therapy.id} style={{ background:'#fff',border:'1px solid #E2EEF0',borderRadius:14,padding:18,boxShadow:'0 2px 8px rgba(0,0,0,.05)' }}><div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:12 }}><span style={{ fontSize:24 }}>{therapy.type==='EXERCISE'?'🏃':therapy.type==='DIET'?'🥗':therapy.type==='SLEEP'?'😴':'🌱'}</span><div><div style={{ fontWeight:700,color:'#0F2D2A',fontSize:14 }}>{String(therapy.type ?? 'Therapy').replace(/_/g,' ')}</div><div style={{ fontSize:12,color:'#64748B',marginTop:2 }}>{therapy.plan}</div></div></div>{therapy.targetValue && <div style={{ fontSize:12,color:'#4B6E6A',marginBottom:6 }}>Target: {therapy.targetValue}</div>}{hasProgress && <><div style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:'#4B6E6A',marginBottom:5 }}><span>Current: {therapy.currentValue}</span><strong style={{ color }}>{pct}%</strong></div><div style={{ height:7,background:'#E2EEF0',borderRadius:100,overflow:'hidden' }}><div style={{ width:`${pct}%`,height:'100%',background:color }}/></div></>}</div>;
    })}</div>}
  </div>;
}
