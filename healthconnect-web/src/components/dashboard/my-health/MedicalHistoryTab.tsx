'use client';

import { useEffect, useState, useCallback } from 'react';
import { patientAPI } from '@/lib/api';

const C = {
  bg:'#F0F5FB', white:'#FFFFFF', border:'#E2EEF0', borderHover:'#b2ddd8',
  teal:'#0D9488', tealLight:'#14B8A6', tealBg:'#F0FDF9', tealMid:'#c8e8e2',
  text:'#0F2D2A', text2:'#4B6E6A', text3:'#64748B',
  red:'#EF4444', amber:'#F59E0B', green:'#22C55E', purple:'#8B5CF6',
  shadow:'0 2px 8px rgba(0,0,0,0.06)', shadowHover:'0 4px 16px rgba(13,148,136,0.12)',
};

type SectionKey = 'conditions'|'allergies'|'surgeries'|'vaccinations'|'familyHistory'|'hospitalizationHistory';

const SECTIONS: { key:SectionKey; icon:string; label:string }[] = [
  { key:'conditions',             icon:'🩺', label:'Conditions' },
  { key:'allergies',              icon:'⚠️', label:'Allergies' },
  { key:'surgeries',              icon:'🏥', label:'Surgeries' },
  { key:'vaccinations',           icon:'💉', label:'Vaccinations' },
  { key:'familyHistory',          icon:'👨‍👩‍👧', label:'Family History' },
  { key:'hospitalizationHistory', icon:'🛏️', label:'Hospitalizations' },
];

const STATUS_COLORS: Record<string,string> = {
  ACTIVE:'#F43F5E', MANAGED:'#F59E0B', RESOLVED:'#22C55E', CHRONIC:'#8B5CF6',
};
const ALLERGY_SEVERITY: Record<string,{color:string;bg:string}> = {
  MILD:            { color:'#16A34A', bg:'rgba(34,197,94,0.1)' },
  MODERATE:        { color:'#D97706', bg:'rgba(245,158,11,0.1)' },
  SEVERE:          { color:'#DC2626', bg:'rgba(239,68,68,0.1)' },
  LIFE_THREATENING:{ color:'#7C3AED', bg:'rgba(124,58,237,0.1)' },
};

function fmt(d?:string){
  if(!d) return '—';
  return new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
}
function isOverdue(d?:string){ return !!d && new Date(d)<new Date(); }
function daysBetween(a:string,b:string){ return Math.round((new Date(b).getTime()-new Date(a).getTime())/86400000); }

type FormState = Record<string,string>;

function getEmptyForm(s:SectionKey):FormState{
  switch(s){
    case 'conditions':             return {name:'',status:'ACTIVE',diagnosedDate:'',icdCode:'',severity:'',treatingDoctor:'',lastReviewed:'',notes:''};
    case 'allergies':              return {allergen:'',category:'',severity:'MODERATE',reaction:'',crossReactive:'',notes:''};
    case 'surgeries':              return {name:'',surgeryDate:'',hospital:'',surgeon:'',outcome:'',notes:''};
    case 'vaccinations':           return {vaccineName:'',doseNumber:'1',administeredDate:'',administeredBy:'',nextDueDate:'',batchNumber:''};
    case 'familyHistory':          return {condition:'',relation:'',ageOfOnset:'',notes:''};
    case 'hospitalizationHistory': return {reason:'',hospitalName:'',admissionDate:'',dischargeDate:'',treatingDoctor:'',notes:''};
    default: return {};
  }
}
function getSavePayload(s:SectionKey,f:FormState):any{
  switch(s){
    case 'conditions':             return {name:f.name,status:f.status,diagnosedDate:f.diagnosedDate||undefined,icdCode:f.icdCode||undefined,severity:f.severity||undefined,treatingDoctor:f.treatingDoctor||undefined,lastReviewed:f.lastReviewed||undefined,notes:f.notes||undefined};
    case 'allergies':              return {allergen:f.allergen,category:f.category||undefined,severity:f.severity,reaction:f.reaction||undefined,crossReactive:f.crossReactive||undefined,notes:f.notes||undefined};
    case 'surgeries':              return {name:f.name,surgeryDate:f.surgeryDate||undefined,hospital:f.hospital||undefined,surgeon:f.surgeon||undefined,outcome:f.outcome||undefined,notes:f.notes||undefined};
    case 'vaccinations':           return {vaccineName:f.vaccineName,doseNumber:Number(f.doseNumber)||1,administeredDate:f.administeredDate||undefined,administeredBy:f.administeredBy||undefined,nextDueDate:f.nextDueDate||undefined,batchNumber:f.batchNumber||undefined};
    case 'familyHistory':          return {condition:f.condition,relation:f.relation,ageOfOnset:f.ageOfOnset?Number(f.ageOfOnset):undefined,notes:f.notes||undefined};
    case 'hospitalizationHistory': return {reason:f.reason,hospitalName:f.hospitalName||undefined,admissionDate:f.admissionDate||undefined,dischargeDate:f.dischargeDate||undefined,treatingDoctor:f.treatingDoctor||undefined,notes:f.notes||undefined};
    default: return f;
  }
}
function getCreateFn(s:SectionKey){
  switch(s){
    case 'conditions':             return patientAPI.createCondition;
    case 'allergies':              return patientAPI.createAllergy;
    case 'surgeries':              return patientAPI.createSurgery;
    case 'vaccinations':           return patientAPI.createVaccination;
    case 'familyHistory':          return patientAPI.createFamilyHistory;
    case 'hospitalizationHistory': return (patientAPI as any).createHospitalization??null;
    default: return null;
  }
}
function getDeleteFn(s:SectionKey){
  switch(s){
    case 'conditions':             return patientAPI.deleteCondition;
    case 'allergies':              return patientAPI.deleteAllergy;
    case 'surgeries':              return patientAPI.deleteSurgery;
    case 'vaccinations':           return (patientAPI as any).deleteVaccination??null;
    case 'familyHistory':          return (patientAPI as any).deleteFamilyHistory??null;
    case 'hospitalizationHistory': return (patientAPI as any).deleteHospitalization??null;
    default: return null;
  }
}

const INP:React.CSSProperties={width:'100%',padding:'9px 12px',background:'#F8FFFE',border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:'inherit'};
const LBL:React.CSSProperties={display:'block',fontSize:11,color:C.text3,marginBottom:6,textTransform:'uppercase',letterSpacing:'.06em',fontFamily:'JetBrains Mono,monospace'};

// ── Add Form Modal ────────────────────────────────────────────────────────────
function AddForm({section,onClose,onSaved}:{section:SectionKey;onClose:()=>void;onSaved:()=>void}){
  const [form,setForm]=useState<FormState>(getEmptyForm(section));
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const set=(k:string,v:string)=>setForm(p=>({...p,[k]:v}));
  const handleSave=async()=>{
    setError('');
    const fn=getCreateFn(section);
    if(!fn){setError('Not supported yet.');return;}
    setSaving(true);
    try{await fn(getSavePayload(section,form));onSaved();}
    catch(e:any){setError(e?.response?.data?.message??'Failed to save.');}
    setSaving(false);
  };
  const inp=(label:string,key:string,opts?:{type?:string;placeholder?:string;required?:boolean})=>(
    <div key={key}>
      <label style={LBL}>{label}{opts?.required?' *':''}</label>
      <input type={opts?.type??'text'} value={form[key]} placeholder={opts?.placeholder} onChange={e=>set(key,e.target.value)} style={INP}/>
    </div>
  );
  const sel=(label:string,key:string,options:[string,string][])=>(
    <div key={key}>
      <label style={LBL}>{label}</label>
      <select value={form[key]} onChange={e=>set(key,e.target.value)} style={{...INP,cursor:'pointer',appearance:'none' as any}}>
        {options.map(([v,l])=><option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
  const sec=SECTIONS.find(s=>s.key===section)!;
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:20}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:C.white,borderRadius:20,padding:28,width:'100%',maxWidth:540,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 60px rgba(0,0,0,0.2)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22,paddingBottom:16,borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:17,fontWeight:800,color:C.text}}>{sec.icon} Add {sec.label.slice(0,-1)}</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.text3,cursor:'pointer',fontSize:22}}>✕</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
          {section==='conditions'&&<>{inp('Condition Name','name',{required:true,placeholder:'e.g., Type 2 Diabetes'})}{sel('Status','status',[['ACTIVE','Active'],['MANAGED','Managed'],['RESOLVED','Resolved'],['CHRONIC','Chronic']])}{inp('Diagnosed Date','diagnosedDate',{type:'date'})}{inp('ICD Code','icdCode',{placeholder:'e.g., E11.9'})}{sel('Severity','severity',[['','Select…'],['MILD','Mild'],['MODERATE','Moderate'],['SEVERE','Severe']])}{inp('Treating Doctor','treatingDoctor',{placeholder:'e.g., Dr. Mehta'})}{inp('Last Reviewed','lastReviewed',{type:'date'})}</>}
          {section==='allergies'&&<>{inp('Allergen','allergen',{required:true,placeholder:'e.g., Penicillin'})}{inp('Category','category',{placeholder:'e.g., Medication, Food'})}{sel('Severity','severity',[['MILD','Mild'],['MODERATE','Moderate'],['SEVERE','Severe'],['LIFE_THREATENING','⚠️ Life Threatening']])}{inp('Reaction','reaction',{placeholder:'e.g., Hives, anaphylaxis'})}{inp('Cross-reactive substances','crossReactive',{placeholder:'e.g., Cephalosporins'})}</>}
          {section==='surgeries'&&<>{inp('Surgery Name','name',{required:true,placeholder:'e.g., Appendectomy'})}{inp('Date','surgeryDate',{type:'date'})}{inp('Hospital','hospital',{placeholder:'e.g., AIIMS Delhi'})}{inp('Surgeon','surgeon',{placeholder:'e.g., Dr. Mehta'})}{inp('Outcome','outcome',{placeholder:'e.g., Successful'})}</>}
          {section==='vaccinations'&&<>{inp('Vaccine Name','vaccineName',{required:true,placeholder:'e.g., COVID-19 Covishield'})}{inp('Dose Number','doseNumber',{type:'number',placeholder:'1'})}{inp('Date Given','administeredDate',{type:'date'})}{inp('Administered By','administeredBy',{placeholder:'e.g., Dr. Kumar'})}{inp('Next Due Date','nextDueDate',{type:'date'})}{inp('Batch Number','batchNumber',{placeholder:'Optional'})}</>}
          {section==='familyHistory'&&<>{inp('Condition','condition',{required:true,placeholder:'e.g., Type 2 Diabetes'})}{inp('Relation','relation',{required:true,placeholder:'e.g., Father, Mother'})}{inp('Age of Onset','ageOfOnset',{type:'number',placeholder:'e.g., 55'})}</>}
          {section==='hospitalizationHistory'&&<>{inp('Reason / Diagnosis','reason',{required:true,placeholder:'e.g., Chest pain'})}{inp('Hospital Name','hospitalName',{placeholder:'e.g., Apollo Hospital'})}{inp('Admission Date','admissionDate',{type:'date'})}{inp('Discharge Date','dischargeDate',{type:'date'})}{inp('Treating Doctor','treatingDoctor',{placeholder:'e.g., Dr. Sharma'})}</>}
        </div>
        {['conditions','allergies','surgeries','familyHistory','hospitalizationHistory'].includes(section)&&(
          <div style={{marginBottom:16}}>
            <label style={LBL}>Notes</label>
            <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={2} placeholder="Any additional notes…" style={{...INP,resize:'vertical'}}/>
          </div>
        )}
        {error&&<div style={{color:C.red,fontSize:12,marginBottom:12,padding:'8px 12px',background:'rgba(239,68,68,0.08)',borderRadius:8}}>⚠️ {error}</div>}
        <div style={{display:'flex',gap:10}}>
          <button onClick={handleSave} disabled={saving} style={{flex:1,padding:'11px',background:`linear-gradient(135deg,${C.teal},${C.tealLight})`,color:'#fff',border:'none',borderRadius:10,fontWeight:700,cursor:'pointer',fontSize:13,opacity:saving?0.7:1}}>
            {saving?'Saving…':'✓ Save Record'}
          </button>
          <button onClick={onClose} style={{padding:'11px 20px',background:'transparent',border:`1px solid ${C.border}`,borderRadius:10,color:C.text3,cursor:'pointer',fontSize:13}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Share Modal ───────────────────────────────────────────────────────────────
function ShareModal({data,onClose}:{data:any;onClose:()=>void}){
  const [copied,setCopied]=useState(false);
  const gen=()=>{
    const l:string[]=[];
    const push=(s:string)=>l.push(s);
    push('═══════════════════════════════════════════');
    push('         MEDICAL HISTORY SUMMARY');
    push(`   Generated: ${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}`);
    push('═══════════════════════════════════════════');push('');
    const conds=data?.conditions??[];
    if(conds.length){push('ACTIVE CONDITIONS');push('─────────────────');conds.forEach((c:any)=>{push(`• ${c.name} [${c.status}]${c.icdCode?` (${c.icdCode})`:''}${c.diagnosedDate?` — Dx: ${fmt(c.diagnosedDate)}`:''}`);if(c.notes)push(`  Notes: ${c.notes}`);});push('');}
    const algs=data?.allergies??[];
    if(algs.length){push('ALLERGIES');push('─────────');algs.forEach((a:any)=>{push(`• ${a.allergen} [${a.severity}]${a.reaction?` — Reaction: ${a.reaction}`:''}`);if(a.crossReactive)push(`  Cross-reactive: ${a.crossReactive}`);});push('');}
    const surgs=data?.surgeries??[];
    if(surgs.length){push('SURGICAL HISTORY');push('────────────────');surgs.forEach((s:any)=>{push(`• ${s.name}${s.surgeryDate?` — ${fmt(s.surgeryDate)}`:''}`);if(s.hospital)push(`  ${s.hospital}${s.surgeon?`, Dr. ${s.surgeon}`:''}`);});push('');}
    const vacs=data?.vaccinations??[];
    if(vacs.length){push('VACCINATIONS');push('────────────');vacs.forEach((v:any)=>{push(`• ${v.vaccineName} — Dose ${v.doseNumber||1}${v.administeredDate?` (${fmt(v.administeredDate)})`:''}${isOverdue(v.nextDueDate)?` ⚠️ OVERDUE`:(v.nextDueDate?` — Next: ${fmt(v.nextDueDate)}`:'')}`)});push('');}
    const fh=data?.familyHistory??[];
    if(fh.length){push('FAMILY HISTORY');push('──────────────');fh.forEach((f:any)=>{push(`• ${f.condition} — ${f.relation}${f.ageOfOnset?` (onset age ${f.ageOfOnset})`:''}`)});push('');}
    const hosp=data?.hospitalizationHistory??[];
    if(hosp.length){push('HOSPITALIZATIONS');push('────────────────');hosp.forEach((h:any)=>{push(`• ${h.reason||'Hospitalization'}${h.hospitalName?` — ${h.hospitalName}`:''}${h.admissionDate?` (${fmt(h.admissionDate)}${h.dischargeDate?` → ${fmt(h.dischargeDate)}`:''})`:''}`);});push('');}
    push('═══════════════════════════════════════════');
    push('  HealthConnect India — healthconnect.sbs');
    push('═══════════════════════════════════════════');
    return l.join('\n');
  };
  const summary=gen();
  const handleCopy=()=>{navigator.clipboard.writeText(summary).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});};
  const handlePrint=()=>{
    const w=window.open('','_blank');if(!w)return;
    w.document.write(`<html><head><title>Medical History Summary</title><style>body{font-family:'Courier New',monospace;font-size:13px;line-height:1.7;padding:40px;max-width:700px;margin:0 auto;color:#1a1a1a;}pre{white-space:pre-wrap;word-wrap:break-word;}@media print{body{padding:20px;}}</style></head><body><pre>${summary}</pre></body></html>`);
    w.document.close();setTimeout(()=>{w.print();},300);
  };
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:20}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:C.white,borderRadius:20,padding:28,width:'100%',maxWidth:620,maxHeight:'85vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 60px rgba(0,0,0,0.2)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,paddingBottom:16,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          <div>
            <div style={{fontSize:17,fontWeight:800,color:C.text}}>📋 Share Medical History</div>
            <div style={{fontSize:12,color:C.text3,marginTop:3}}>Share a clean summary with your doctor</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.text3,cursor:'pointer',fontSize:22}}>✕</button>
        </div>
        <div style={{flex:1,overflowY:'auto',marginBottom:18}}>
          <div style={{background:'#F8FFFE',border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
            <pre style={{fontSize:11,color:C.text2,lineHeight:1.7,whiteSpace:'pre-wrap',wordBreak:'break-word',margin:0,fontFamily:'JetBrains Mono,monospace'}}>{summary}</pre>
          </div>
        </div>
        <div style={{display:'flex',gap:10,flexShrink:0}}>
          <button onClick={handleCopy} style={{flex:1,padding:'11px',borderRadius:10,border:'none',background:`linear-gradient(135deg,${C.teal},${C.tealLight})`,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer'}}>
            {copied?'✓ Copied!':'📋 Copy to Clipboard'}
          </button>
          <button onClick={handlePrint} style={{flex:1,padding:'11px',borderRadius:10,border:`1.5px solid ${C.teal}`,background:C.white,color:C.teal,fontWeight:700,fontSize:13,cursor:'pointer'}}>
            🖨️ Print / Save PDF
          </button>
          <button onClick={onClose} style={{padding:'11px 18px',borderRadius:10,border:`1px solid ${C.border}`,background:'transparent',color:C.text3,fontSize:13,cursor:'pointer'}}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────────
interface TLEvent { date:string; label:string; sub?:string; type:string; badge?:string; badgeCol?:string; }
const TL_COL:Record<string,string>={condition:'#F43F5E',allergy:'#F59E0B',surgery:'#8B5CF6',vaccination:'#22C55E',hospitalization:'#3B82F6',family:'#14B8A6'};
const TL_ICO:Record<string,string>={condition:'🩺',allergy:'⚠️',surgery:'🏥',vaccination:'💉',hospitalization:'🛏️',family:'👨‍👩‍👧'};

function buildTimeline(data:any):TLEvent[]{
  const ev:TLEvent[]=[];
  (data?.conditions??[]).forEach((c:any)=>{
    if(c.diagnosedDate) ev.push({date:c.diagnosedDate,label:c.name,sub:`Diagnosed — ${c.status}`,type:'condition',badge:c.status,badgeCol:STATUS_COLORS[c.status]});
    if(c.resolvedDate)  ev.push({date:c.resolvedDate, label:`${c.name} resolved`,sub:'Condition resolved',type:'condition',badge:'RESOLVED',badgeCol:'#22C55E'});
  });
  (data?.surgeries??[]).forEach((s:any)=>{if(s.surgeryDate) ev.push({date:s.surgeryDate,label:s.name,sub:[s.hospital,s.surgeon].filter(Boolean).join(' · '),type:'surgery'});});
  (data?.vaccinations??[]).forEach((v:any)=>{if(v.administeredDate) ev.push({date:v.administeredDate,label:v.vaccineName,sub:`Dose ${v.doseNumber||1}${v.administeredBy?' · '+v.administeredBy:''}`,type:'vaccination'});});
  (data?.hospitalizationHistory??[]).forEach((h:any)=>{
    if(h.admissionDate){
      const days=h.dischargeDate?daysBetween(h.admissionDate,h.dischargeDate):null;
      ev.push({date:h.admissionDate,label:h.reason||'Hospitalization',sub:[h.hospitalName,days!==null?`${days} days`:null].filter(Boolean).join(' · '),type:'hospitalization'});
    }
  });
  return ev.filter(e=>e.date).sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime());
}

function TimelineView({data}:{data:any}){
  const events=buildTimeline(data);
  if(events.length===0) return(
    <div style={{textAlign:'center',padding:'60px 20px',color:C.text3}}>
      <div style={{fontSize:42,marginBottom:10}}>📅</div>
      <div style={{fontWeight:700,color:C.text2,marginBottom:6}}>No timeline events yet</div>
      <div style={{fontSize:13}}>Add medical records to see your health timeline</div>
    </div>
  );
  const byYear:Record<string,TLEvent[]>={};
  events.forEach(e=>{const yr=new Date(e.date).getFullYear().toString();if(!byYear[yr])byYear[yr]=[];byYear[yr].push(e);});
  const years=Object.keys(byYear).sort((a,b)=>+b-+a);
  return(
    <div style={{position:'relative',paddingLeft:32}}>
      <div style={{position:'absolute',left:11,top:8,bottom:8,width:2,background:`linear-gradient(180deg,${C.teal},${C.tealMid})`,borderRadius:2}}/>
      {years.map(yr=>(
        <div key={yr}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16,marginTop:20}}>
            <div style={{position:'absolute',left:0,width:24,height:24,borderRadius:'50%',background:C.teal,border:`3px solid ${C.white}`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 0 0 3px ${C.teal}30`}}/>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:15,color:C.teal,marginLeft:20}}>{yr}</div>
          </div>
          {byYear[yr].map((ev,i)=>{
            const col=TL_COL[ev.type]??C.teal;
            return(
              <div key={i} style={{display:'flex',gap:16,marginBottom:14,position:'relative'}}>
                <div style={{position:'absolute',left:-21,top:10,width:10,height:10,borderRadius:'50%',background:col,border:`2px solid ${C.white}`,flexShrink:0}}/>
                <div style={{flex:1,background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:'12px 16px',boxShadow:C.shadow,borderLeft:`3px solid ${col}`}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8}}>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3}}>
                        <span style={{fontSize:14}}>{TL_ICO[ev.type]}</span>
                        <span style={{fontWeight:700,fontSize:13,color:C.text}}>{ev.label}</span>
                        {ev.badge&&<span style={{fontSize:9,fontWeight:800,padding:'1px 7px',borderRadius:100,color:ev.badgeCol??col,background:`${ev.badgeCol??col}18`,border:`1px solid ${ev.badgeCol??col}30`}}>{ev.badge}</span>}
                      </div>
                      {ev.sub&&<div style={{fontSize:11,color:C.text3,marginLeft:21}}>{ev.sub}</div>}
                    </div>
                    <div style={{fontSize:11,color:C.text3,fontFamily:'JetBrains Mono,monospace',whiteSpace:'nowrap',flexShrink:0}}>
                      {new Date(ev.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Hereditary risk ───────────────────────────────────────────────────────────
function detectRisks(data:any){
  const mine=new Set<string>((data?.conditions??[]).map((c:any)=>(c.name?.toLowerCase() as string)).filter(Boolean));
  const seen=new Set<string>();
  const out:{condition:string;relation:string;ageOfOnset?:number;hasIt:boolean}[]=[];
  (data?.familyHistory??[]).forEach((f:any)=>{
    const k=f.condition?.toLowerCase() as string;
    if(!k||seen.has(k))return;
    seen.add(k);
    const hasIt=[...mine].some((p:string)=>p.includes(k)||k.includes(p));
    out.push({condition:f.condition,relation:f.relation,ageOfOnset:f.ageOfOnset,hasIt});
  });
  return out;
}

// ── Medical Card ──────────────────────────────────────────────────────────────
function MedicalCard({section,item,onDelete,deleting}:{section:SectionKey;item:any;onDelete?:()=>void;deleting?:boolean}){
  const Pill=({label,color,bg}:{label:string;color:string;bg:string})=>(
    <span style={{display:'inline-flex',padding:'2px 9px',borderRadius:100,fontSize:10,fontWeight:700,fontFamily:'JetBrains Mono,monospace',color,background:bg,border:`1px solid ${color}30`}}>{label}</span>
  );
  const Meta=({children,style}:{children:React.ReactNode;style?:React.CSSProperties})=>(
    <div style={{fontSize:12,color:C.text2,marginBottom:4,...style}}>{children}</div>
  );

  const renderContent=()=>{
    if(section==='conditions'){
      const col=STATUS_COLORS[item.status]??'#64748B';
      return(<>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
          <div style={{fontWeight:800,fontSize:14,color:C.text,flex:1,paddingRight:8}}>{item.name}</div>
          <Pill label={item.status} color={col} bg={`${col}15`}/>
        </div>
        {item.icdCode&&<Meta>ICD: <strong style={{color:C.text}}>{item.icdCode}</strong></Meta>}
        {item.diagnosedDate&&<Meta>📅 Diagnosed: {fmt(item.diagnosedDate)}</Meta>}
        {item.severity&&<Meta>Severity: {item.severity}</Meta>}
        {item.treatingDoctor&&<Meta>👨‍⚕️ {item.treatingDoctor}</Meta>}
        {item.lastReviewed&&<Meta>Last reviewed: {fmt(item.lastReviewed)}</Meta>}
        {item.resolvedDate&&<Meta style={{color:C.green}}>✓ Resolved: {fmt(item.resolvedDate)}</Meta>}
        {item.notes&&<div style={{fontSize:12,color:C.text3,fontStyle:'italic',marginTop:8,borderTop:`1px solid ${C.border}`,paddingTop:8}}>{item.notes}</div>}
      </>);
    }
    if(section==='allergies'){
      const s=ALLERGY_SEVERITY[item.severity]??ALLERGY_SEVERITY.MODERATE;
      return(<>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
          <div style={{fontWeight:800,fontSize:14,color:C.text}}>{item.allergen}</div>
          <Pill label={(item.severity??'').replace('_',' ')} color={s.color} bg={s.bg}/>
        </div>
        {item.category&&<Meta>Category: {item.category}</Meta>}
        {item.reaction&&<Meta>⚡ Reaction: {item.reaction}</Meta>}
        {item.crossReactive&&<Meta style={{color:C.amber}}>⚠️ Cross-reactive: {item.crossReactive}</Meta>}
        {item.notes&&<div style={{fontSize:12,color:C.text3,fontStyle:'italic',marginTop:8,borderTop:`1px solid ${C.border}`,paddingTop:8}}>{item.notes}</div>}
      </>);
    }
    if(section==='surgeries') return(<>
      <div style={{fontWeight:800,fontSize:14,color:C.text,marginBottom:10}}>{item.name}</div>
      <Meta>📅 {fmt(item.surgeryDate)}</Meta>
      {item.hospital&&<Meta>🏥 {item.hospital}</Meta>}
      {item.surgeon&&<Meta>👨‍⚕️ {item.surgeon}</Meta>}
      {item.outcome&&<Meta style={{color:C.green}}>✓ {item.outcome}</Meta>}
      {item.notes&&<div style={{fontSize:12,color:C.text3,fontStyle:'italic',marginTop:8,borderTop:`1px solid ${C.border}`,paddingTop:8}}>{item.notes}</div>}
    </>);
    if(section==='vaccinations'){
      const od=isOverdue(item.nextDueDate);
      return(<>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
          <div style={{fontWeight:800,fontSize:14,color:C.text,flex:1,paddingRight:8}}>{item.vaccineName}</div>
          {item.nextDueDate&&<Pill label={od?'⚠️ Overdue':`Due ${fmt(item.nextDueDate)}`} color={od?C.red:C.teal} bg={od?'rgba(239,68,68,0.1)':'rgba(13,148,136,0.1)'}/>}
        </div>
        <Meta>Dose {item.doseNumber||1} — {fmt(item.administeredDate)}</Meta>
        {item.administeredBy&&<Meta>By: {item.administeredBy}</Meta>}
        {item.batchNumber&&<Meta>Batch: {item.batchNumber}</Meta>}
        {od&&item.nextDueDate&&<div style={{marginTop:8,padding:'6px 10px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,fontSize:11,color:C.red,fontWeight:600}}>⚠️ Next dose was due {fmt(item.nextDueDate)}. Contact your doctor.</div>}
      </>);
    }
    if(section==='familyHistory') return(<>
      <div style={{fontWeight:800,fontSize:14,color:C.text,marginBottom:10}}>{item.condition}</div>
      <Meta>👤 {item.relation}</Meta>
      {item.ageOfOnset&&<Meta>Age of onset: {item.ageOfOnset}</Meta>}
      {item.notes&&<div style={{fontSize:12,color:C.text3,fontStyle:'italic',marginTop:8,borderTop:`1px solid ${C.border}`,paddingTop:8}}>{item.notes}</div>}
    </>);
    if(section==='hospitalizationHistory'){
      const ongoing=!item.dischargeDate;
      const days=!ongoing&&item.admissionDate&&item.dischargeDate?daysBetween(item.admissionDate,item.dischargeDate):null;
      return(<>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
          <div style={{fontWeight:800,fontSize:14,color:C.text,flex:1,paddingRight:8}}>{item.reason||'Hospitalization'}</div>
          {ongoing&&<Pill label="Ongoing" color="#3B82F6" bg="rgba(59,130,246,0.1)"/>}
        </div>
        {item.hospitalName&&<Meta>🏥 {item.hospitalName}</Meta>}
        <Meta>📅 {fmt(item.admissionDate)} {item.dischargeDate?`→ ${fmt(item.dischargeDate)}`:'→ Present'}</Meta>
        {days!==null&&<Meta>Duration: {days} day{days!==1?'s':''}</Meta>}
        {item.treatingDoctor&&<Meta>👨‍⚕️ {item.treatingDoctor}</Meta>}
        {item.notes&&<div style={{fontSize:12,color:C.text3,fontStyle:'italic',marginTop:8,borderTop:`1px solid ${C.border}`,paddingTop:8}}>{item.notes}</div>}
      </>);
    }
    return null;
  };

  return(
    <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:14,padding:18,transition:'all 0.2s',position:'relative',boxShadow:C.shadow}}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow=C.shadowHover;e.currentTarget.style.borderColor=C.borderHover;}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow=C.shadow;e.currentTarget.style.borderColor=C.border;}}
    >
      {renderContent()}
      {onDelete&&(
        <button onClick={onDelete} disabled={deleting} title="Delete record"
          style={{position:'absolute',top:12,right:12,background:'rgba(244,63,94,0.08)',border:'1px solid rgba(244,63,94,0.2)',color:C.red,width:26,height:26,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:12,opacity:0,transition:'opacity 0.2s'}}
          className="mh-del-btn">
          {deleting?'…':'✕'}
        </button>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MedicalHistoryTab(){
  const [data,setData]=useState<any>(null);
  const [activeSection,setActiveSection]=useState<SectionKey>('conditions');
  const [viewMode,setViewMode]=useState<'sections'|'timeline'>('sections');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [showAdd,setShowAdd]=useState(false);
  const [showShare,setShowShare]=useState(false);
  const [deleting,setDeleting]=useState<string|null>(null);

  const load=useCallback(()=>{
    setLoading(true);
    patientAPI.getMedicalHistory()
      .then(res=>setData(res?.data?.data??res?.data??{}))
      .catch(()=>setError('Failed to load medical history.'))
      .finally(()=>setLoading(false));
  },[]);
  useEffect(()=>{load();},[load]);

  const handleDelete=async(item:any)=>{
    const fn=getDeleteFn(activeSection);if(!fn)return;
    if(!confirm('Delete this record? This cannot be undone.'))return;
    setDeleting(item.id);
    try{await fn(item.id);load();}catch{/**/}
    setDeleting(null);
  };

  const items:any[]=data?.[activeSection]??[];
  const canAdd=getCreateFn(activeSection)!==null;
  const canDelete=getDeleteFn(activeSection)!==null;

  const lifeThreateningAllergies=(data?.allergies??[]).filter((a:any)=>a.severity==='LIFE_THREATENING');
  const overdueVaccinations=(data?.vaccinations??[]).filter((v:any)=>isOverdue(v.nextDueDate));
  const risks=detectRisks(data);
  const confirmedRisks=risks.filter(r=>r.hasIt);

  return(
    <>
      <style>{`
        .mh-del-btn{opacity:0!important;}
        .mh-card-wrap:hover .mh-del-btn{opacity:1!important;}
        .mh-tab-btn{padding:7px 14px;border-radius:100px;border:1px solid #D1FAF0;background:#fff;color:#4B6E6A;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:'Plus Jakarta Sans',sans-serif;display:flex;align-items:center;gap:6px;white-space:nowrap;}
        .mh-tab-btn:hover{border-color:#0D9488;color:#0D9488;}
        .mh-tab-btn.active{background:rgba(13,148,136,0.1);border-color:rgba(13,148,136,0.4);color:#0D9488;}
        .mh-badge{background:#E2EEF0;color:#4B6E6A;font-size:10px;padding:1px 6px;border-radius:100px;}
        .mh-tab-btn.active .mh-badge{background:rgba(13,148,136,0.15);color:#0D9488;}
        .mh-skel{height:120px;border-radius:14px;background:linear-gradient(90deg,#e8f5f2 25%,#f0faf8 50%,#e8f5f2 75%);background-size:200% 100%;animation:mh-sh 1.5s infinite;}
        @keyframes mh-sh{0%{background-position:200% 0}100%{background-position:-200% 0}}
      `}</style>

      {/* ── LIFE-THREATENING ALLERGY BANNER ──────────────────────────────── */}
      {lifeThreateningAllergies.length>0&&(
        <div style={{background:'linear-gradient(135deg,rgba(124,58,237,0.06),rgba(220,38,38,0.05))',border:'2px solid rgba(220,38,38,0.4)',borderRadius:14,padding:'14px 18px',marginBottom:18,display:'flex',alignItems:'flex-start',gap:14}}>
          <div style={{fontSize:26,flexShrink:0}}>🚨</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,fontSize:13,color:'#7C3AED',marginBottom:8,textTransform:'uppercase',letterSpacing:'.04em'}}>Life-Threatening Allergy Alert — Show this to any doctor or pharmacist</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {lifeThreateningAllergies.map((a:any,i:number)=>(
                <div key={i} style={{background:'rgba(220,38,38,0.08)',border:'1px solid rgba(220,38,38,0.3)',borderRadius:9,padding:'6px 12px'}}>
                  <span style={{fontWeight:800,color:'#DC2626',fontSize:13}}>⚠️ {a.allergen}</span>
                  {a.reaction&&<span style={{fontSize:11,color:'#7F1D1D',marginLeft:6}}>→ {a.reaction}</span>}
                  {a.crossReactive&&<div style={{fontSize:11,color:'#92400E',marginTop:2}}>Cross-reactive: {a.crossReactive}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── HEREDITARY RISK BANNER ───────────────────────────────────────── */}
      {confirmedRisks.length>0&&(
        <div style={{background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.35)',borderRadius:14,padding:'12px 18px',marginBottom:18,display:'flex',alignItems:'flex-start',gap:12}}>
          <span style={{fontSize:22,flexShrink:0}}>🧬</span>
          <div>
            <div style={{fontWeight:700,fontSize:13,color:'#B45309',marginBottom:4}}>Hereditary Risk Detected</div>
            <div style={{fontSize:12,color:'#92400E',lineHeight:1.6}}>
              {confirmedRisks.map((r,i)=>(
                <span key={i}>You have <strong>{r.condition}</strong> — same as your {r.relation}{r.ageOfOnset?` (onset age ${r.ageOfOnset})`:''}. </span>
              ))}
              Consider discussing genetic risk with your doctor.
            </div>
          </div>
        </div>
      )}

      {/* ── OVERDUE VACCINATION BANNER ───────────────────────────────────── */}
      {overdueVaccinations.length>0&&(
        <div style={{background:'rgba(239,68,68,0.05)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:14,padding:'12px 18px',marginBottom:18,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
          <span style={{fontSize:20}}>💉</span>
          <div style={{flex:1}}>
            <span style={{fontWeight:700,fontSize:13,color:C.red}}>Overdue vaccinations: </span>
            <span style={{fontSize:12,color:'#7F1D1D'}}>{overdueVaccinations.map((v:any)=>`${v.vaccineName} (due ${fmt(v.nextDueDate)})`).join(' · ')}</span>
          </div>
          <span style={{fontSize:11,color:C.red,fontWeight:600}}>Contact your doctor →</span>
        </div>
      )}

      {/* ── TOOLBAR ─────────────────────────────────────────────────────── */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18,flexWrap:'wrap',gap:10}}>
        <div style={{display:'flex',gap:6,background:C.tealMid,borderRadius:11,padding:3}}>
          {(['sections','timeline'] as const).map(m=>(
            <button key={m} onClick={()=>setViewMode(m)}
              style={{padding:'6px 16px',borderRadius:9,border:'none',cursor:'pointer',fontSize:12,fontWeight:700,
                background:viewMode===m?C.white:'transparent',color:viewMode===m?C.teal:C.text2,
                boxShadow:viewMode===m?'0 1px 6px rgba(77,182,160,0.15)':'none',transition:'all 0.15s'}}>
              {m==='sections'?'📋 Sections':'📅 Timeline'}
            </button>
          ))}
        </div>
        <button onClick={()=>setShowShare(true)}
          style={{padding:'8px 16px',borderRadius:10,border:`1.5px solid ${C.teal}`,background:C.white,color:C.teal,fontWeight:700,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
          📋 Share with Doctor
        </button>
      </div>

      {/* ── TIMELINE VIEW ────────────────────────────────────────────────── */}
      {viewMode==='timeline'&&(
        loading
          ?<div style={{display:'flex',flexDirection:'column',gap:14}}>{[1,2,3].map(i=><div key={i} className="mh-skel"/>)}</div>
          :<TimelineView data={data}/>
      )}

      {/* ── SECTIONS VIEW ────────────────────────────────────────────────── */}
      {viewMode==='sections'&&(<>
        {/* Section tabs */}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}>
          {SECTIONS.map(s=>(
            <button key={s.key} className={`mh-tab-btn${activeSection===s.key?' active':''}`} onClick={()=>setActiveSection(s.key)}>
              {s.icon} {s.label}
              <span className="mh-badge">{data?.[s.key]?.length??0}</span>
              {s.key==='vaccinations'&&overdueVaccinations.length>0&&<span style={{width:7,height:7,borderRadius:'50%',background:C.red,display:'inline-block'}}/>}
              {s.key==='allergies'&&lifeThreateningAllergies.length>0&&<span style={{width:7,height:7,borderRadius:'50%',background:'#7C3AED',display:'inline-block'}}/>}
            </button>
          ))}
        </div>

        {/* Section header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={{fontSize:13,color:C.text2}}>
            {items.length} {SECTIONS.find(s=>s.key===activeSection)?.label.toLowerCase()} record{items.length!==1?'s':''}
            {activeSection==='vaccinations'&&overdueVaccinations.length>0&&(
              <span style={{marginLeft:8,fontSize:11,color:C.red,fontWeight:700}}>· {overdueVaccinations.length} overdue</span>
            )}
          </div>
          {canAdd&&(
            <button onClick={()=>setShowAdd(true)}
              style={{padding:'7px 16px',background:`linear-gradient(135deg,${C.teal},${C.tealLight})`,color:'#fff',border:'none',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer'}}>
              + Add {SECTIONS.find(s=>s.key===activeSection)?.label.slice(0,-1)}
            </button>
          )}
        </div>

        {/* Family history hereditary risk panel */}
        {activeSection==='familyHistory'&&risks.length>0&&(
          <div style={{background:'rgba(20,184,166,0.05)',border:`1px solid ${C.tealMid}`,borderRadius:12,padding:'12px 16px',marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:C.teal,marginBottom:8}}>🧬 Hereditary Risk Analysis</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {risks.map((r,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,fontSize:12,color:C.text2}}>
                  <span style={{width:8,height:8,borderRadius:'50%',background:r.hasIt?C.red:C.green,flexShrink:0}}/>
                  <span><strong>{r.condition}</strong> — {r.relation}{r.ageOfOnset?` (onset age ${r.ageOfOnset})`:''}</span>
                  {r.hasIt
                    ?<span style={{fontSize:10,color:C.red,fontWeight:700,background:'rgba(239,68,68,0.1)',padding:'1px 7px',borderRadius:100}}>⚠️ You have this too</span>
                    :<span style={{fontSize:10,color:C.green,fontWeight:700,background:'rgba(34,197,94,0.1)',padding:'1px 7px',borderRadius:100}}>✓ Not in your conditions</span>
                  }
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        {loading?(
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
            {[1,2,3].map(i=><div key={i} className="mh-skel"/>)}
          </div>
        ):error?(
          <div style={{textAlign:'center',padding:'40px 0',color:C.text3}}>⚠️ {error}</div>
        ):items.length===0?(
          <div style={{textAlign:'center',padding:'60px 20px',background:C.white,borderRadius:16,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:42,marginBottom:10}}>{SECTIONS.find(s=>s.key===activeSection)?.icon}</div>
            <div style={{fontWeight:700,fontSize:15,color:C.text,marginBottom:6}}>No {SECTIONS.find(s=>s.key===activeSection)?.label.toLowerCase()} records</div>
            {canAdd&&<div style={{fontSize:12,color:C.text3}}>Click "+ Add" above to add your first record.</div>}
          </div>
        ):(
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
            {items.map((item:any,i:number)=>(
              <div key={item.id??i} className="mh-card-wrap" style={{position:'relative'}}>
                <MedicalCard section={activeSection} item={item}
                  onDelete={canDelete?()=>handleDelete(item):undefined}
                  deleting={deleting===item.id}/>
              </div>
            ))}
          </div>
        )}
      </>)}

      {showAdd&&<AddForm section={activeSection} onClose={()=>setShowAdd(false)} onSaved={()=>{setShowAdd(false);load();}}/>}
      {showShare&&<ShareModal data={data} onClose={()=>setShowShare(false)}/>}
    </>
  );
}
