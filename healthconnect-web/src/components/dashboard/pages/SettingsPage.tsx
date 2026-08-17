'use client';

import { useEffect, useState } from 'react';
import { patientAPI } from '@/lib/api';

const C={card:'#FFFFFF',border:'#E2EEF0',teal:'#0D9488',tealLight:'#14B8A6',text:'#0F2D2A',text2:'#4B6E6A',text3:'#64748B',green:'#16A34A',red:'#DC2626'};

type SettingsState = {
  emailNotifications:boolean;
  smsNotifications:boolean;
  pushNotifications:boolean;
  appointmentReminders:boolean;
  medicationReminders:boolean;
  communityActivity:boolean;
  weeklyHealthSummary:boolean;
  allowDoctorAccess:boolean;
  allowAnonymousPosting:boolean;
  contributeToResearch:boolean;
};

const DEFAULTS:SettingsState={
  emailNotifications:true,
  smsNotifications:true,
  pushNotifications:true,
  appointmentReminders:true,
  medicationReminders:true,
  communityActivity:true,
  weeklyHealthSummary:true,
  allowDoctorAccess:false,
  allowAnonymousPosting:true,
  contributeToResearch:false,
};

function Toggle({on,onChange,disabled=false}:{on:boolean;onChange:(v:boolean)=>void;disabled?:boolean}){
  return <button type="button" aria-pressed={on} disabled={disabled} onClick={()=>onChange(!on)} style={{width:44,height:24,borderRadius:12,border:'none',padding:0,background:on?C.teal:'#CBD5E1',cursor:disabled?'not-allowed':'pointer',position:'relative',transition:'background .2s',flexShrink:0,opacity:disabled?.65:1}}>
    <span style={{width:18,height:18,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:on?23:3,transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.2)'}}/>
  </button>;
}

export default function SettingsPage(){
  const [settings,setSettings]=useState<SettingsState>(DEFAULTS);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState('');
  const [isError,setIsError]=useState(false);

  useEffect(()=>{
    patientAPI.getSettings()
      .then(res=>{
        const data=(res as any)?.data?.data??(res as any)?.data??{};
        setSettings(prev=>({
          ...prev,
          ...Object.fromEntries(Object.keys(prev).map(key=>[key,typeof data[key]==='boolean'?data[key]:(prev as any)[key]])),
        }) as SettingsState);
      })
      .catch(()=>{setMessage('Unable to load settings.');setIsError(true);})
      .finally(()=>setLoading(false));
  },[]);

  const set=(key:keyof SettingsState,value:boolean)=>setSettings(prev=>({...prev,[key]:value}));

  const save=async()=>{
    setSaving(true);setMessage('');setIsError(false);
    try{
      await patientAPI.updateSettings(settings);
      setMessage('✓ Settings saved');
      window.setTimeout(()=>setMessage(''),3000);
    }catch(e:any){
      setMessage(e?.response?.data?.message??'Unable to save settings.');setIsError(true);
    }finally{setSaving(false);}
  };

  if(loading)return <div style={{padding:40,textAlign:'center',color:C.text3}}>Loading settings…</div>;

  const sections:{title:string;description:string;rows:{k:keyof SettingsState;l:string;sub:string}[]}[]=[
    {title:'🔔 Notifications',description:'Choose which HealthConnect updates you want to receive.',rows:[
      {k:'emailNotifications',l:'Email notifications',sub:'Account, care and important service updates by email'},
      {k:'smsNotifications',l:'SMS notifications',sub:'Time-sensitive updates on your registered mobile number'},
      {k:'pushNotifications',l:'Push notifications',sub:'In-app/browser alerts when supported by your device'},
      {k:'appointmentReminders',l:'Appointment reminders',sub:'Reminders for upcoming consultations'},
      {k:'medicationReminders',l:'Medication reminders',sub:'Dose and medication schedule reminders'},
      {k:'communityActivity',l:'Community activity',sub:'Relevant activity from communities you follow'},
      {k:'weeklyHealthSummary',l:'Weekly health summary',sub:'A periodic summary of your recorded health activity'},
    ]},
    {title:'🔒 Privacy & data',description:'These preferences control optional access and participation. Doctor record access is still governed by your individual consent grants.',rows:[
      {k:'allowDoctorAccess',l:'Allow doctor access requests',sub:'Let verified doctors request access to your health records'},
      {k:'allowAnonymousPosting',l:'Allow anonymous community posting',sub:'Permit anonymous posting where a community supports it'},
      {k:'contributeToResearch',l:'Contribute de-identified data to research',sub:'Optional participation in future de-identified research/analytics programs'},
    ]},
  ];

  return <div style={{maxWidth:760}}>
    <div style={{marginBottom:24}}><h2 style={{fontSize:22,fontWeight:800,color:C.text,margin:'0 0 5px'}}>⚙️ Settings</h2><div style={{fontSize:13,color:C.text2}}>Manage notification, privacy and data preferences.</div></div>
    {message&&<div style={{background:isError?'#FFF1F2':'#F0FDF4',border:`1px solid ${isError?'#FECDD3':'#BBF7D0'}`,borderRadius:10,padding:'10px 16px',marginBottom:16,fontSize:13,color:isError?C.red:C.green,fontWeight:600}}>{message}</div>}
    {sections.map(sec=><section key={sec.title} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:'20px 22px',marginBottom:16,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
      <div style={{fontSize:14,fontWeight:800,color:C.text}}>{sec.title}</div>
      <div style={{fontSize:12,color:C.text3,margin:'4px 0 8px',lineHeight:1.5}}>{sec.description}</div>
      {sec.rows.map((row,index)=><div key={row.k} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,padding:'13px 0',borderBottom:index===sec.rows.length-1?'none':`1px solid ${C.border}`}}>
        <div><div style={{fontSize:13,fontWeight:650,color:C.text}}>{row.l}</div><div style={{fontSize:11,color:C.text3,marginTop:2,lineHeight:1.45}}>{row.sub}</div></div>
        <Toggle on={settings[row.k]} onChange={value=>set(row.k,value)} disabled={saving}/>
      </div>)}
    </section>)}
    <button onClick={save} disabled={saving} style={{padding:'11px 28px',background:`linear-gradient(135deg,${C.teal},${C.tealLight})`,color:'#fff',border:'none',borderRadius:10,fontWeight:700,cursor:saving?'wait':'pointer',fontSize:14,opacity:saving?.7:1}}>{saving?'Saving…':'Save Settings'}</button>
  </div>;
}
