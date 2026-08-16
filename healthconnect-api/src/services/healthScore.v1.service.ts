import { prisma } from '../lib/prisma';

export const HEALTH_SCORE_ALGORITHM_VERSION = 'HC-HSI-1.0';

export type HealthDomainKey =
  | 'blood_pressure' | 'glucose_metabolic' | 'body_composition' | 'lipids'
  | 'medication_adherence' | 'condition_control' | 'symptom_burden'
  | 'physical_activity' | 'sleep_recovery' | 'lifestyle_nutrition_tobacco';
export type HealthDomainStatus = 'STRONG' | 'GOOD' | 'NEEDS_ATTENTION' | 'NEEDS_REVIEW' | 'NO_DATA';
export type HealthScoreStatus = 'STRONG' | 'GOOD' | 'NEEDS_ATTENTION' | 'NEEDS_REVIEW' | 'INSUFFICIENT_DATA';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface HealthDomain {
  key: HealthDomainKey; label: string; weight: number; score: number | null; status: HealthDomainStatus;
  confidence: number; latestValue?: string | null; measuredAt?: Date | null;
  trend?: 'IMPROVING' | 'STABLE' | 'WORSENING' | 'UNKNOWN'; explanation: string; source: string;
}
export interface HealthAlert {
  severity: AlertSeverity; code: string; title: string; message: string; domain: HealthDomainKey; observedAt?: Date | null;
}

type LifestyleRow = {
  patientId: string; heightCm: number | null; waistCm: number | null;
  moderateActivityMinWeek: number | null; vigorousActivityMinWeek: number | null;
  sleepHoursAvg: number | null; tobaccoStatus: string | null; fruitVegServingsDay: number | null; updatedAt: Date;
};

const W: Record<HealthDomainKey, number> = {
  blood_pressure: 15, glucose_metabolic: 12, body_composition: 8, lipids: 10,
  medication_adherence: 10, condition_control: 12, symptom_burden: 10,
  physical_activity: 8, sleep_recovery: 7, lifestyle_nutrition_tobacco: 8,
};
const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);
const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));
const nval = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v !== 'string') return null;
  const m = v.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
};
const status = (s: number | null): HealthDomainStatus => s == null ? 'NO_DATA' : s >= 85 ? 'STRONG' : s >= 70 ? 'GOOD' : s >= 55 ? 'NEEDS_ATTENTION' : 'NEEDS_REVIEW';
const overallStatus = (s: number | null): HealthScoreStatus => s == null ? 'INSUFFICIENT_DATA' : s >= 85 ? 'STRONG' : s >= 70 ? 'GOOD' : s >= 55 ? 'NEEDS_ATTENTION' : 'NEEDS_REVIEW';
const freshness = (d: Date | null | undefined, ideal: number, stale: number) => {
  if (!d) return 0;
  const age = Math.max(0, (Date.now() - d.getTime()) / DAY);
  if (age <= ideal) return 100;
  if (age >= stale) return 30;
  return clamp(100 - ((age - ideal) / (stale - ideal)) * 70);
};
const missing = (key: HealthDomainKey, label: string, source: string, explanation: string): HealthDomain => ({
  key, label, weight: W[key], score: null, status: 'NO_DATA', confidence: 0, latestValue: null,
  measuredAt: null, trend: 'UNKNOWN', explanation, source,
});

async function lifestyle(patientId: string): Promise<LifestyleRow | null> {
  const rows = await prisma.$queryRaw<LifestyleRow[]>`SELECT * FROM "patient_lifestyle_health" WHERE "patientId" = ${patientId} LIMIT 1`;
  return rows[0] ?? null;
}

function bpDomain(vitals: any[], alerts: HealthAlert[]): HealthDomain {
  const all = vitals.filter(v => v.type === 'bp' && v.systolic != null && v.diastolic != null).sort((a,b) => b.measuredAt.getTime() - a.measuredAt.getTime());
  if (!all.length) return missing('blood_pressure','Blood Pressure','Vitals','Add recent blood pressure readings to assess cardiovascular status.');
  const basis = all.filter(v => v.measuredAt >= daysAgo(30)).slice(0,7);
  const use = basis.length ? basis : all.slice(0,3);
  const sys = Math.round(use.reduce((s,v)=>s+v.systolic,0)/use.length);
  const dia = Math.round(use.reduce((s,v)=>s+v.diastolic,0)/use.length);
  const latest = all[0];
  let score = 100;
  if (sys >= 180 || dia >= 120) score = 10; else if (sys >= 160 || dia >= 100) score = 30;
  else if (sys >= 140 || dia >= 90) score = 45; else if (sys >= 130 || dia >= 80) score = 65;
  else if (sys >= 120 && dia < 80) score = 85;
  if (latest.systolic >= 180 || latest.diastolic >= 120) alerts.push({ severity:'CRITICAL', code:'VERY_HIGH_BLOOD_PRESSURE', title:'Very high blood pressure recorded', message:'This reading warrants prompt clinical assessment, especially if you have symptoms.', domain:'blood_pressure', observedAt:latest.measuredAt });
  else if (latest.systolic >= 160 || latest.diastolic >= 100) alerts.push({ severity:'WARNING', code:'HIGH_BLOOD_PRESSURE', title:'High blood pressure recorded', message:'Repeat the measurement correctly and discuss persistently high readings with your clinician.', domain:'blood_pressure', observedAt:latest.measuredAt });
  return { key:'blood_pressure', label:'Blood Pressure', weight:W.blood_pressure, score, status:status(score), confidence:clamp(freshness(latest.measuredAt,14,90)*Math.min(1,use.length/3)), latestValue:`${latest.systolic}/${latest.diastolic} mmHg`, measuredAt:latest.measuredAt, trend:'UNKNOWN', source:'Vitals', explanation:`Recent average ${sys}/${dia} mmHg; repeated recent readings carry more confidence than a single old reading.` };
}

function glucoseDomain(vitals: any[], alerts: HealthAlert[]): HealthDomain {
  const a1c = vitals.filter(v=>v.type==='hba1c').sort((a,b)=>b.measuredAt.getTime()-a.measuredAt.getTime())[0];
  const sugar = vitals.filter(v=>v.type==='blood_sugar').sort((a,b)=>b.measuredAt.getTime()-a.measuredAt.getTime())[0];
  const r = a1c ?? sugar;
  if (!r) return missing('glucose_metabolic','Glucose / Metabolic','Vitals','Add HbA1c or blood glucose data to assess metabolic health.');
  const v = nval(r.value); if (v == null) return missing('glucose_metabolic','Glucose / Metabolic','Vitals','The latest glucose value could not be interpreted.');
  let score = 0; let explanation = '';
  if (r.type === 'hba1c') {
    score = v < 5.7 ? 100 : v < 6.5 ? 75 : v < 8 ? 55 : v < 10 ? 30 : 10;
    explanation = `Latest HbA1c is ${v}${r.unit || '%'}. Individual treatment targets may differ.`;
    if (v >= 10) alerts.push({ severity:'WARNING', code:'VERY_HIGH_HBA1C', title:'Very high HbA1c recorded', message:'This suggests sustained high glucose and should be reviewed with your treating clinician.', domain:'glucose_metabolic', observedAt:r.measuredAt });
  } else {
    const ctx = `${r.context ?? ''} ${r.notes ?? ''}`.toLowerCase();
    if (v < 70) { score = 25; alerts.push({ severity:'WARNING', code:'LOW_BLOOD_GLUCOSE', title:'Low blood glucose recorded', message:'Low glucose can require prompt action, particularly with symptoms or glucose-lowering medication.', domain:'glucose_metabolic', observedAt:r.measuredAt }); }
    else if (ctx.includes('fast')) score = v < 100 ? 100 : v < 126 ? 75 : v < 200 ? 45 : 20;
    else if (ctx.includes('post') || ctx.includes('meal')) score = v < 140 ? 100 : v < 200 ? 75 : 40;
    else score = v <= 140 ? 90 : v < 200 ? 70 : 40;
    if (v >= 300) alerts.push({ severity:'WARNING', code:'VERY_HIGH_GLUCOSE', title:'Very high blood glucose recorded', message:'A very high glucose reading should be reviewed promptly, particularly if you feel unwell.', domain:'glucose_metabolic', observedAt:r.measuredAt });
    explanation = `Latest blood glucose is ${v} ${r.unit || 'mg/dL'}${r.context ? ` (${r.context})` : ''}.`;
  }
  return { key:'glucose_metabolic', label:'Glucose / Metabolic', weight:W.glucose_metabolic, score, status:status(score), confidence:freshness(r.measuredAt,r.type==='hba1c'?90:14,r.type==='hba1c'?180:60), latestValue:`${v} ${r.unit || (r.type==='hba1c'?'%':'mg/dL')}`, measuredAt:r.measuredAt, trend:'UNKNOWN', source:'Vitals', explanation };
}

function lipidDomain(vitals: any[], alerts: HealthAlert[]): HealthDomain {
  const r = vitals.filter(v=>v.type==='cholesterol').sort((a,b)=>b.measuredAt.getTime()-a.measuredAt.getTime())[0];
  if (!r) return missing('lipids','Blood Lipids','Vitals / Lab results','Add a structured cholesterol result and identify it as LDL, HDL or total cholesterol.');
  const v = nval(r.value); const ctx = `${r.context ?? ''} ${r.notes ?? ''}`.toLowerCase();
  if (v == null) return missing('lipids','Blood Lipids','Vitals / Lab results','The latest cholesterol value could not be interpreted.');
  let score: number | null = null; let subtype = '';
  if (ctx.includes('ldl')) { subtype='LDL'; score=v<100?100:v<130?85:v<160?65:v<190?40:15; if(v>=190) alerts.push({severity:'WARNING',code:'VERY_HIGH_LDL',title:'Very high LDL cholesterol recorded',message:'This warrants clinician review and cardiovascular risk assessment.',domain:'lipids',observedAt:r.measuredAt}); }
  else if (ctx.includes('hdl')) { subtype='HDL'; score=v>=60?100:v>=40?75:45; }
  else if (ctx.includes('total')) { subtype='Total cholesterol'; score=v<200?100:v<240?70:40; }
  if (score == null) return missing('lipids','Blood Lipids','Vitals / Lab results','Cholesterol exists, but specify LDL, HDL or total cholesterol in the result context for safe scoring.');
  return { key:'lipids', label:'Blood Lipids', weight:W.lipids, score, status:status(score), confidence:freshness(r.measuredAt,180,365), latestValue:`${subtype}: ${v} ${r.unit || 'mg/dL'}`, measuredAt:r.measuredAt, trend:'UNKNOWN', source:'Vitals / Lab results', explanation:`Latest structured ${subtype.toLowerCase()} result is used.` };
}

function bodyDomain(vitals: any[], life: LifestyleRow | null): HealthDomain {
  const wt = vitals.filter(v=>v.type==='weight').sort((a,b)=>b.measuredAt.getTime()-a.measuredAt.getTime())[0];
  if (!life?.heightCm || !wt) return missing('body_composition','Body Composition','Height + weight','Add height and a recent weight reading to calculate BMI. Weight alone is not scored.');
  const kg = nval(wt.value); if (kg == null || kg <= 0) return missing('body_composition','Body Composition','Height + weight','The latest weight could not be interpreted.');
  const m = life.heightCm/100; const bmi = kg/(m*m);
  let score = bmi>=18.5&&bmi<25?100:bmi>=17&&bmi<18.5?70:bmi>=25&&bmi<30?75:bmi>=30&&bmi<35?50:bmi>=35?30:45;
  return { key:'body_composition', label:'Body Composition', weight:W.body_composition, score, status:status(score), confidence:Math.min(freshness(wt.measuredAt,30,180),freshness(life.updatedAt,180,365)), latestValue:`BMI ${bmi.toFixed(1)} · ${kg} kg`, measuredAt:wt.measuredAt, trend:'UNKNOWN', source:'Height + weight', explanation:'BMI is used as a screening measure, not a diagnosis or complete measure of body composition.' };
}

const freqPerDay = (f:string):number|null => ({ONCE_DAILY:1,TWICE_DAILY:2,THREE_TIMES_DAILY:3,FOUR_TIMES_DAILY:4,WEEKLY:1/7,BIWEEKLY:1/14,MONTHLY:1/30} as Record<string,number>)[f] ?? null;
async function medicationDomain(patientId:string):Promise<HealthDomain>{
  const start=daysAgo(30), end=new Date();
  const [meds,taken]=await Promise.all([
    prisma.medication.findMany({where:{patientId,status:'ACTIVE'},select:{frequency:true,startDate:true,endDate:true,status:true}}),
    prisma.medicationLog.count({where:{medication:{patientId},scheduledTime:{gte:start,lte:end},status:'taken'}})
  ]);
  let expected=0;
  for(const m of meds){ const per=freqPerDay(m.frequency); if(per==null) continue; const s=Math.max(start.getTime(),m.startDate.getTime()); const e=m.endDate?Math.min(end.getTime(),m.endDate.getTime()):end.getTime(); if(e<s)continue; expected+=Math.max(0,Math.round((((e-s)/DAY)+1)*per)); }
  if(!expected) return missing('medication_adherence','Medication Adherence','Medication schedule','No schedulable active medication regimen is available. PRN/custom medicines are not counted as missed doses.');
  const score=clamp((Math.min(taken,expected)/expected)*100);
  return {key:'medication_adherence',label:'Medication Adherence',weight:W.medication_adherence,score,status:status(score),confidence:90,latestValue:`${taken}/${expected} expected doses logged as taken`,measuredAt:new Date(),trend:'UNKNOWN',source:'Medication schedule + dose logs',explanation:'Uses expected scheduled doses over the last 30 days, not merely the subset of doses that were logged.'};
}

async function conditionDomain(patientId:string):Promise<HealthDomain>{
  const rows=await prisma.condition.findMany({where:{patientId},select:{status:true,updatedAt:true}});
  if(!rows.length) return missing('condition_control','Chronic Condition Control','Medical history','No structured condition history is available; missing diagnoses are not assumed to mean perfect health.');
  const vals=rows.map(c=>c.status==='RESOLVED'?95:c.status==='IN_REMISSION'?90:c.status==='CHRONIC'?70:60);
  const score=clamp(vals.reduce((a,b)=>a+b,0)/vals.length); const latest=[...rows].sort((a,b)=>b.updatedAt.getTime()-a.updatedAt.getTime())[0];
  return {key:'condition_control',label:'Chronic Condition Control',weight:W.condition_control,score,status:status(score),confidence:55,latestValue:`${rows.length} recorded condition${rows.length===1?'':'s'}`,measuredAt:latest.updatedAt,trend:'UNKNOWN',source:'Medical history',explanation:'Reflects recorded condition status with moderate confidence until disease-specific targets and clinician assessments are structured.'};
}

async function symptomDomain(patientId:string,alerts:HealthAlert[]):Promise<HealthDomain>{
  const rows=await prisma.symptomLog.findMany({where:{patientId,loggedAt:{gte:daysAgo(30)}},orderBy:{loggedAt:'desc'}});
  if(!rows.length) return missing('symptom_burden','Symptoms & Warning Signals','Symptom tracker','No recent symptom-tracking data is available; absence of logs is not treated as absence of symptoms.');
  const unresolved=rows.filter(s=>!s.resolvedAt); const avg=rows.reduce((s,r)=>s+r.severity,0)/rows.length; const severe=unresolved.filter(s=>s.severity>=8);
  const score=clamp(100-(avg*6+unresolved.length*3+Math.min(20,rows.length*1.5)));
  if(severe.length) alerts.push({severity:'WARNING',code:'SEVERE_UNRESOLVED_SYMPTOMS',title:'Severe unresolved symptoms recorded',message:'One or more recent symptoms are rated 8/10 or higher and remain unresolved.',domain:'symptom_burden',observedAt:severe[0].loggedAt});
  return {key:'symptom_burden',label:'Symptoms & Warning Signals',weight:W.symptom_burden,score,status:status(score),confidence:freshness(rows[0].loggedAt,7,30),latestValue:`${rows.length} logs / ${unresolved.length} unresolved / avg ${avg.toFixed(1)}/10`,measuredAt:rows[0].loggedAt,trend:'UNKNOWN',source:'Symptom tracker',explanation:'Uses recent severity, persistence and unresolved burden rather than a simple symptom count.'};
}

function activityDomain(l: LifestyleRow | null):HealthDomain{
  if(!l || (l.moderateActivityMinWeek==null && l.vigorousActivityMinWeek==null)) return missing('physical_activity','Physical Activity','Lifestyle health profile','Add weekly moderate and/or vigorous activity minutes.');
  const eq=(l.moderateActivityMinWeek??0)+2*(l.vigorousActivityMinWeek??0);
  const score=eq>=300?100:eq>=150?85:eq>=75?60:eq>0?35:15;
  return {key:'physical_activity',label:'Physical Activity',weight:W.physical_activity,score,status:status(score),confidence:freshness(l.updatedAt,30,120),latestValue:`${l.moderateActivityMinWeek??0} min moderate + ${l.vigorousActivityMinWeek??0} min vigorous/week`,measuredAt:l.updatedAt,trend:'UNKNOWN',source:'Lifestyle health profile',explanation:'Scoring follows the principle that about 150 minutes/week of moderate activity or equivalent is a key adult health target.'};
}
function sleepDomain(l:LifestyleRow|null):HealthDomain{
  if(!l || l.sleepHoursAvg==null) return missing('sleep_recovery','Sleep & Recovery','Lifestyle health profile','Add your average nightly sleep duration.');
  const h=l.sleepHoursAvg; const score=h>=7&&h<=9?100:(h>=6&&h<7)||(h>9&&h<=10)?75:(h>=5&&h<6)||(h>10&&h<=11)?50:25;
  return {key:'sleep_recovery',label:'Sleep & Recovery',weight:W.sleep_recovery,score,status:status(score),confidence:freshness(l.updatedAt,30,120),latestValue:`${h.toFixed(1)} hours/night`,measuredAt:l.updatedAt,trend:'UNKNOWN',source:'Lifestyle health profile',explanation:'Adult sleep duration is scored around a 7–9 hour nightly target; individual needs can vary.'};
}
function lifestyleDomain(l:LifestyleRow|null):HealthDomain{
  if(!l || (!l.tobaccoStatus && l.fruitVegServingsDay==null)) return missing('lifestyle_nutrition_tobacco','Nutrition / Tobacco / Lifestyle','Lifestyle health profile','Add tobacco exposure and fruit/vegetable intake to assess this domain.');
  const tobacco=l.tobaccoStatus ? (l.tobaccoStatus==='NEVER'?100:l.tobaccoStatus==='FORMER'?80:l.tobaccoStatus==='SECONDHAND'?60:20) : null;
  const diet=l.fruitVegServingsDay==null?null:l.fruitVegServingsDay>=5?100:l.fruitVegServingsDay>=3?75:l.fruitVegServingsDay>=1?45:20;
  const parts=[tobacco,diet].filter((x):x is number=>x!=null); const score=clamp(parts.reduce((a,b)=>a+b,0)/parts.length);
  return {key:'lifestyle_nutrition_tobacco',label:'Nutrition / Tobacco / Lifestyle',weight:W.lifestyle_nutrition_tobacco,score,status:status(score),confidence:clamp(freshness(l.updatedAt,30,120)*(parts.length/2)),latestValue:`${l.tobaccoStatus??'Tobacco unknown'} · ${l.fruitVegServingsDay??'—'} fruit/veg servings/day`,measuredAt:l.updatedAt,trend:'UNKNOWN',source:'Lifestyle health profile',explanation:'Tobacco exposure and daily fruit/vegetable intake are scored only when provided; missing inputs do not receive healthy points.'};
}

function extraAlerts(vitals:any[],alerts:HealthAlert[]){
  const spo2=vitals.filter(v=>v.type==='spo2').sort((a,b)=>b.measuredAt.getTime()-a.measuredAt.getTime())[0]; const sv=spo2?nval(spo2.value):null;
  if(spo2&&sv!=null&&sv<90) alerts.push({severity:'CRITICAL',code:'LOW_SPO2',title:'Low oxygen saturation recorded',message:'An SpO₂ below 90% can be clinically significant. Seek prompt medical assessment, particularly if symptomatic.',domain:'blood_pressure',observedAt:spo2.measuredAt});
  else if(spo2&&sv!=null&&sv<94) alerts.push({severity:'WARNING',code:'LOW_SPO2',title:'Lower-than-expected oxygen saturation recorded',message:'Repeat the reading carefully and discuss persistent low values with a clinician.',domain:'blood_pressure',observedAt:spo2.measuredAt});
  const hr=vitals.filter(v=>v.type==='heart_rate').sort((a,b)=>b.measuredAt.getTime()-a.measuredAt.getTime())[0]; const hv=hr?nval(hr.value):null;
  if(hr&&hv!=null&&(hv<40||hv>140)) alerts.push({severity:'WARNING',code:'EXTREME_HEART_RATE',title:'Unusual heart rate recorded',message:'A very low or very high resting heart rate may warrant clinical assessment, especially with symptoms.',domain:'blood_pressure',observedAt:hr.measuredAt});
}

function recommendations(domains:HealthDomain[],alerts:HealthAlert[]){
  const out:string[]=[]; if(alerts.some(a=>a.severity==='CRITICAL')) out.push('Review the critical health alert above and seek appropriate medical assessment rather than relying on the overall score.');
  domains.filter(d=>d.score!=null&&d.score<70).sort((a,b)=>(a.score??0)-(b.score??0)).slice(0,3).forEach(d=>out.push(`Focus on ${d.label.toLowerCase()}: ${d.explanation}`));
  const m=domains.filter(d=>d.score==null).slice(0,3); if(m.length) out.push(`Improve score reliability by adding data for: ${m.map(d=>d.label).join(', ')}.`); return out;
}

export async function getHealthScoreHistory(patientId:string,limit=12){
  const safe=Math.min(50,Math.max(1,Math.floor(limit)));
  return prisma.$queryRaw<Array<{score:number|null;status:string;confidence:number;algorithmVersion:string;calculatedAt:Date}>>`
    SELECT "score","status","confidence","algorithmVersion","calculatedAt" FROM "health_score_snapshots"
    WHERE "patientId"=${patientId} ORDER BY "calculatedAt" DESC LIMIT ${safe}`;
}

export async function calculateHealthScore(patientId:string,options:{persistSnapshot?:boolean}={}):Promise<any>{
  const patient=await prisma.patientProfile.findUnique({where:{id:patientId},select:{id:true}}); if(!patient) throw new Error('Patient profile not found');
  const [vitals,life]=await Promise.all([prisma.vital.findMany({where:{patientId},orderBy:{measuredAt:'desc'},take:200}),lifestyle(patientId).catch(()=>null)]);
  const alerts:HealthAlert[]=[]; extraAlerts(vitals,alerts);
  const [med,cond,sym]=await Promise.all([medicationDomain(patientId),conditionDomain(patientId),symptomDomain(patientId,alerts)]);
  const domains:HealthDomain[]=[bpDomain(vitals,alerts),glucoseDomain(vitals,alerts),bodyDomain(vitals,life),lipidDomain(vitals,alerts),med,cond,sym,activityDomain(life),sleepDomain(life),lifestyleDomain(life)];
  const available=domains.filter(d=>d.score!=null); const coverage=available.reduce((s,d)=>s+d.weight,0);
  const weighted=coverage?Math.round(available.reduce((s,d)=>s+(d.score as number)*d.weight,0)/coverage):null;
  const score=coverage>=25?weighted:null; const confidence=clamp(domains.reduce((s,d)=>s+d.weight*d.confidence,0)/100);
  const stat=overallStatus(score); const missingData=domains.filter(d=>d.score==null).map(d=>({key:d.key,label:d.label,reason:d.explanation}));
  const history=await getHealthScoreHistory(patientId,12).catch(()=>[]); const prev=history.find(h=>h.score!=null&&h.algorithmVersion===HEALTH_SCORE_ALGORITHM_VERSION);
  const delta=score!=null&&prev?.score!=null?score-prev.score:null; const trend=delta==null?'UNKNOWN':delta>=3?'IMPROVING':delta<=-3?'WORSENING':'STABLE'; const calculatedAt=new Date();
  const lifestyleScores=domains.filter(d=>['blood_pressure','glucose_metabolic','body_composition','physical_activity','sleep_recovery','lifestyle_nutrition_tobacco'].includes(d.key)&&d.score!=null).map(d=>d.score as number);
  const legacyLifestyle=lifestyleScores.length?clamp(lifestyleScores.reduce((a,b)=>a+b,0)/lifestyleScores.length):0;
  if(score!=null) await prisma.healthScore.upsert({where:{patientId},create:{patientId,score,medicationAdherence:med.score??0,symptomFrequency:sym.score??0,appointmentRegularity:0,lifestyleFactors:legacyLifestyle},update:{score,medicationAdherence:med.score??0,symptomFrequency:sym.score??0,appointmentRegularity:0,lifestyleFactors:legacyLifestyle,calculatedAt}});
  const result={score,status:stat,confidence,dataCoverage:coverage,algorithmVersion:HEALTH_SCORE_ALGORITHM_VERSION,calculatedAt,trend,delta,hasCriticalAlert:alerts.some(a=>a.severity==='CRITICAL'),domains,alerts,missingData,recommendations:recommendations(domains,alerts),history:history.map(h=>({score:h.score,status:h.status,confidence:h.confidence,algorithmVersion:h.algorithmVersion,date:h.calculatedAt})),medicationAdherence:med.score??0,symptomFrequency:sym.score??0,appointmentRegularity:0,lifestyleFactors:legacyLifestyle};
  if(options.persistSnapshot) await prisma.$executeRaw`INSERT INTO "health_score_snapshots" ("patientId","score","status","confidence","algorithmVersion","domains","alerts","missingData","calculatedAt") VALUES (${patientId},${score},${stat},${confidence},${HEALTH_SCORE_ALGORITHM_VERSION},CAST(${JSON.stringify(domains)} AS jsonb),CAST(${JSON.stringify(alerts)} AS jsonb),CAST(${JSON.stringify(missingData)} AS jsonb),${calculatedAt})`;
  return result;
}
export const getHealthScore=(patientId:string)=>calculateHealthScore(patientId,{persistSnapshot:false});
export const refreshHealthScore=(patientId:string)=>calculateHealthScore(patientId,{persistSnapshot:true});
