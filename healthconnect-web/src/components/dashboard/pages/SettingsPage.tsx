'use client';
import { useState, useEffect } from 'react';
import { patientAPI } from '@/lib/api';
const C={card:'#FFFFFF',border:'#E2EEF0',teal:'#0D9488',tealLight:'#14B8A6',tealBg:'rgba(13,148,136,0.08)',text:'#0F2D2A',text2:'#4B6E6A',text3:'#4B6E6A',green:'#22C55E'};
function Toggle({on,onChange}:{on:boolean;onChange:(v:boolean)=>void}){return(<div onClick={()=>onChange(!on)} style={{ width:44,height:24,borderRadius:12,background:on?C.teal:'#CBD5E1',cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0 }}><div style={{ width:18,height:18,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:on?23:3,transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/></div>);}
export default function SettingsPage(){
  const [s,setS]=useState<any>({});const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const [saved,setSaved]=useState(false);
  useEffect(()=>{patientAPI.getSettings().then(r=>{setS((r as any)?.data?.data??(r as any)?.data??{});}).catch(()=>{}).finally(()=>setLoading(false));},[]);
  const tog=(k:string)=>setS((p:any)=>({...p,[k]:!p[k]}));
  const save=async()=>{setSaving(true);try{await patientAPI.updateSettings(s);setSaved(true);setTimeout(()=>setSaved(false),3000);}catch{}setSaving(false);};
  if(loading)return <div style={{ padding:40,textAlign:'center',color:C.text3 }}>Loading settings…</div>;
  const sections=[
    {title:'🔔 Notifications',rows:[{k:'emailNotifications',l:'Email Notifications',sub:'Receive updates via email'},{k:'smsNotifications',l:'SMS Notifications',sub:'Receive SMS alerts'},{k:'appointmentReminders',l:'Appointment Reminders',sub:'Reminders before appointments'},{k:'medicationReminders',l:'Medication Reminders',sub:'Daily dose reminders'},{k:'healthAlerts',l:'Health Alerts',sub:'Critical health score alerts'},{k:'communityUpdates',l:'Community Updates',sub:'New posts in your communities'}]},
    {title:'🔒 Privacy',rows:[{k:'profileVisible',l:'Profile Visible to Doctors',sub:'Allow verified doctors to view your profile'},{k:'shareAnonymousData',l:'Anonymous Data Sharing',sub:'Help improve HealthConnect (anonymous)'}]},
  ];
  return(
    <div style={{ maxWidth:700 }}>
      <h2 style={{ fontSize:22,fontWeight:800,color:C.text,margin:'0 0 24px' }}>⚙️ Settings</h2>
      {saved&&<div style={{ background:'rgba(34,197,94,0.1)',border:`1px solid ${C.green}`,borderRadius:10,padding:'10px 16px',marginBottom:16,fontSize:13,color:C.green,fontWeight:600 }}>✓ Settings saved!</div>}
      {sections.map(sec=>(
        <div key={sec.title} style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:'20px 22px',marginBottom:16,boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:14,fontWeight:700,color:C.text,marginBottom:4 }}>{sec.title}</div>
          {sec.rows.map(r=>(
            <div key={r.k} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 0',borderBottom:`1px solid ${C.border}` }}>
              <div><div style={{ fontSize:13,fontWeight:600,color:C.text }}>{r.l}</div><div style={{ fontSize:11,color:C.text3,marginTop:2 }}>{r.sub}</div></div>
              <Toggle on={!!s[r.k]} onChange={()=>tog(r.k)}/>
            </div>
          ))}
        </div>
      ))}
      <button onClick={save} disabled={saving} style={{ padding:'11px 28px',background:`linear-gradient(135deg,${C.teal},${C.tealLight})`,color:'#fff',border:'none',borderRadius:10,fontWeight:700,cursor:'pointer',fontSize:14,fontFamily:'inherit' }}>{saving?'Saving…':'Save Settings'}</button>
    </div>
  );
}
