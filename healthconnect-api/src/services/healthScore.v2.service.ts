import { prisma } from '../lib/prisma';

export const HEALTH_SCORE_ALGORITHM_VERSION = 'HC-HSI-2.0';

type DomainKey =
  | 'cardiovascular'
  | 'metabolic_body'
  | 'lifestyle'
  | 'sleep_recovery'
  | 'condition_control'
  | 'treatment_care'
  | 'symptoms_function';

type DomainStatus = 'STRONG' | 'GOOD' | 'NEEDS_ATTENTION' | 'NEEDS_REVIEW' | 'NO_DATA' | 'NOT_APPLICABLE' | 'ESTABLISHING';
type OverallStatus = 'STRONG' | 'GOOD' | 'NEEDS_ATTENTION' | 'NEEDS_REVIEW' | 'INCOMPLETE_ASSESSMENT';
type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

type LifestyleRow = {
  patientId: string;
  heightCm: number | null;
  waistCm: number | null;
  moderateActivityMinWeek: number | null;
  vigorousActivityMinWeek: number | null;
  sleepHoursAvg: number | null;
  tobaccoStatus: string | null;
  fruitVegServingsDay: number | null;
  medicationStatus: string | null;
  conditionStatus: string | null;
  familyHistoryStatus: string | null;
  medicationTrackingStartedAt: Date | null;
  alcoholStatus: string | null;
  updatedAt: Date;
};

type Component = {
  key: string;
  label: string;
  score: number | null;
  confidence: number;
  status: DomainStatus;
  value?: string | null;
  explanation: string;
  source: string;
  measuredAt?: Date | null;
  applicable?: boolean;
};

export type HealthDomain = {
  key: DomainKey;
  label: string;
  weight: number;
  score: number | null;
  status: DomainStatus;
  confidence: number;
  latestValue?: string | null;
  explanation: string;
  source: string;
  components: Component[];
  applicable: boolean;
};

export type HealthAlert = {
  severity: AlertSeverity;
  code: string;
  title: string;
  message: string;
  domain?: DomainKey;
  observedAt?: Date | null;
};

const DOMAIN_WEIGHTS: Record<DomainKey, number> = {
  cardiovascular: 20,
  metabolic_body: 20,
  lifestyle: 20,
  sleep_recovery: 10,
  condition_control: 15,
  treatment_care: 10,
  symptoms_function: 5,
};

const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const num = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v !== 'string') return null;
  const m = v.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
};
const scoreStatus = (n: number | null): DomainStatus => n == null ? 'NO_DATA' : n >= 85 ? 'STRONG' : n >= 70 ? 'GOOD' : n >= 55 ? 'NEEDS_ATTENTION' : 'NEEDS_REVIEW';
const overallStatus = (n: number | null): OverallStatus => n == null ? 'INCOMPLETE_ASSESSMENT' : n >= 85 ? 'STRONG' : n >= 70 ? 'GOOD' : n >= 55 ? 'NEEDS_ATTENTION' : 'NEEDS_REVIEW';
const freshness = (d: Date | null | undefined, idealDays: number, staleDays: number) => {
  if (!d) return 0;
  const age = Math.max(0, (Date.now() - d.getTime()) / DAY);
  if (age <= idealDays) return 100;
  if (age >= staleDays) return 25;
  return clamp(100 - ((age - idealDays) / (staleDays - idealDays)) * 75);
};
const ageYears = (dob: Date | null) => {
  if (!dob) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday = now.getUTCMonth() < dob.getUTCMonth() || (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age--;
  return age;
};
const weighted = (parts: Array<{ score: number | null; weight: number }>) => {
  const available = parts.filter((p): p is { score: number; weight: number } => p.score != null);
  const w = available.reduce((s, p) => s + p.weight, 0);
  return w ? clamp(available.reduce((s, p) => s + p.score * p.weight, 0) / w) : null;
};
const weightedConfidence = (parts: Array<{ confidence: number; weight: number; score: number | null }>) => {
  const available = parts.filter(p => p.score != null);
  const w = available.reduce((s, p) => s + p.weight, 0);
  return w ? clamp(available.reduce((s, p) => s + p.confidence * p.weight, 0) / w) : 0;
};

async function getLifestyle(patientId: string): Promise<LifestyleRow | null> {
  const rows = await prisma.$queryRaw<LifestyleRow[]>`SELECT * FROM "patient_lifestyle_health" WHERE "patientId"=${patientId} LIMIT 1`;
  return rows[0] ?? null;
}

function latestVital(vitals: any[], type: string) {
  return vitals.filter(v => v.type === type).sort((a, b) => b.measuredAt.getTime() - a.measuredAt.getTime())[0] ?? null;
}

function bloodPressureComponent(vitals: any[], alerts: HealthAlert[]): Component {
  const all = vitals
    .filter(v => v.type === 'bp' && v.systolic != null && v.diastolic != null)
    .sort((a, b) => b.measuredAt.getTime() - a.measuredAt.getTime());
  if (!all.length) return { key:'blood_pressure', label:'Blood Pressure', score:null, confidence:0, status:'NO_DATA', explanation:'A recent blood pressure reading is required for the core health assessment.', source:'Vitals' };

  const recent = all.filter(v => v.measuredAt >= daysAgo(30)).slice(0, 7);
  const use = recent.length ? recent : all.slice(0, 3);
  const sys = Math.round(use.reduce((s, v) => s + v.systolic, 0) / use.length);
  const dia = Math.round(use.reduce((s, v) => s + v.diastolic, 0) / use.length);
  const last = all[0];

  let score: number;
  if (sys >= 180 || dia >= 110) score = 10;
  else if (sys >= 160 || dia >= 100) score = 35;
  else if (sys >= 140 || dia >= 90) score = 60;
  else if (sys >= 130 || dia >= 85) score = 85;
  else if (sys < 90 || dia < 60) score = 70;
  else score = 100;

  if (last.systolic >= 180 || last.diastolic >= 120) alerts.push({ severity:'CRITICAL', code:'VERY_HIGH_BP', title:'Very high blood pressure recorded', message:'Repeat the reading correctly and seek prompt clinical assessment, especially if symptoms are present.', domain:'cardiovascular', observedAt:last.measuredAt });
  else if (last.systolic >= 160 || last.diastolic >= 100) alerts.push({ severity:'WARNING', code:'HIGH_BP', title:'High blood pressure recorded', message:'Repeat the measurement and arrange clinical review if readings remain high.', domain:'cardiovascular', observedAt:last.measuredAt });
  else if (last.systolic < 80 || last.diastolic < 50) alerts.push({ severity:'WARNING', code:'LOW_BP', title:'Very low blood pressure recorded', message:'Repeat the reading and seek medical advice if low readings persist or you feel dizzy, weak or unwell.', domain:'cardiovascular', observedAt:last.measuredAt });

  const countConfidence = use.length >= 3 ? 90 : use.length === 2 ? 70 : 45;
  const conf = clamp(countConfidence * freshness(last.measuredAt, 14, 90) / 100);
  return {
    key:'blood_pressure', label:'Blood Pressure', score, confidence:conf, status:scoreStatus(score), value:`${last.systolic}/${last.diastolic} mmHg`, measuredAt:last.measuredAt,
    explanation: use.length === 1 ? `Single recent reading ${last.systolic}/${last.diastolic} mmHg. It contributes provisionally; repeated readings on different days improve certainty.` : `Recent average ${sys}/${dia} mmHg from ${use.length} readings.`,
    source:'Vitals',
  };
}

function lipidComponent(vitals: any[], alerts: HealthAlert[]): Component {
  const r = latestVital(vitals, 'cholesterol');
  if (!r) return { key:'lipids', label:'Blood Lipids', score:null, confidence:0, status:'NO_DATA', explanation:'A structured LDL, HDL, triglyceride or total-cholesterol result can improve cardiovascular assessment.', source:'Vitals / Lab results' };
  const v = num(r.value);
  const ctx = `${r.context ?? ''} ${r.notes ?? ''}`.toLowerCase();
  if (v == null) return { key:'lipids', label:'Blood Lipids', score:null, confidence:0, status:'NO_DATA', explanation:'The latest cholesterol value could not be interpreted.', source:'Vitals / Lab results' };
  let score: number | null = null;
  let label = '';
  if (ctx.includes('ldl')) { label='LDL'; score=v<100?100:v<130?85:v<160?65:v<190?40:15; if(v>=190) alerts.push({severity:'WARNING',code:'VERY_HIGH_LDL',title:'Very high LDL cholesterol recorded',message:'This result warrants clinician review and cardiovascular risk assessment.',domain:'cardiovascular',observedAt:r.measuredAt}); }
  else if (ctx.includes('hdl')) { label='HDL'; score=v>=60?100:v>=40?75:45; }
  else if (ctx.includes('trig')) { label='Triglycerides'; score=v<150?100:v<200?80:v<500?50:20; }
  else if (ctx.includes('total')) { label='Total cholesterol'; score=v<200?90:v<240?70:45; }
  if (score == null) return { key:'lipids', label:'Blood Lipids', score:null, confidence:0, status:'NO_DATA', explanation:'Cholesterol is present, but its subtype must be identified as LDL, HDL, triglycerides or total cholesterol.', source:'Vitals / Lab results' };
  return { key:'lipids', label:'Blood Lipids', score, confidence:freshness(r.measuredAt,180,365), status:scoreStatus(score), value:`${label}: ${v} ${r.unit || 'mg/dL'}`, measuredAt:r.measuredAt, explanation:`Latest structured ${label.toLowerCase()} result.`, source:'Vitals / Lab results' };
}

function bmiComponent(vitals:any[], life:LifestyleRow|null): Component {
  const wt = latestVital(vitals, 'weight');
  if (!life?.heightCm || !wt) return { key:'bmi', label:'BMI', score:null, confidence:0, status:'NO_DATA', explanation:'Height and a recent weight are mandatory for the core health assessment.', source:'Height + weight' };
  const kg = num(wt.value);
  if (kg == null || kg <= 0) return { key:'bmi', label:'BMI', score:null, confidence:0, status:'NO_DATA', explanation:'The latest weight could not be interpreted.', source:'Height + weight' };
  const bmi = kg / ((life.heightCm/100) ** 2);
  const score = bmi < 18.5 ? 60 : bmi < 23 ? 100 : bmi < 25 ? 85 : bmi < 27.5 ? 70 : bmi < 30 ? 55 : bmi < 35 ? 40 : 25;
  return { key:'bmi', label:'BMI', score, confidence:Math.min(freshness(wt.measuredAt,30,180), freshness(life.updatedAt,180,365)), status:scoreStatus(score), value:`BMI ${bmi.toFixed(1)} · ${kg} kg`, measuredAt:wt.measuredAt, explanation:'Uses height and weight. South-Asian public-health action points are used to flag metabolic risk at lower BMI levels; BMI remains a screening measure, not a diagnosis.', source:'Height + weight' };
}

function waistComponent(life:LifestyleRow|null, gender:string|null): Component {
  if (life?.waistCm == null) return { key:'waist', label:'Waist Circumference', score:null, confidence:0, status:'NO_DATA', explanation:'Waist circumference is optional but improves cardiometabolic risk assessment.', source:'Lifestyle health profile' };
  const g=(gender??'').toUpperCase();
  let score:number|null=null;
  if(g==='MALE') score=life.waistCm<90?100:life.waistCm<100?70:45;
  else if(g==='FEMALE') score=life.waistCm<80?100:life.waistCm<90?70:45;
  if(score==null) return { key:'waist', label:'Waist Circumference', score:null, confidence:0, status:'NO_DATA', value:`${life.waistCm} cm`, explanation:'A sex-specific waist threshold is not applied when sex is unavailable or not represented by the current threshold set.', source:'Lifestyle health profile' };
  return { key:'waist', label:'Waist Circumference', score, confidence:freshness(life.updatedAt,90,365), status:scoreStatus(score), value:`${life.waistCm} cm`, measuredAt:life.updatedAt, explanation:'Waist circumference is used as an additional central-adiposity risk marker in South-Asian adults.', source:'Lifestyle health profile' };
}

function hasCondition(conditions:any[], words:string[]) {
  return conditions.some(c => words.some(w => `${c.name}`.toLowerCase().includes(w)));
}

function glucoseComponent(vitals:any[], conditions:any[], alerts:HealthAlert[]): Component {
  const diabetic = hasCondition(conditions,['diabetes','type 2 dm','type 1 dm']);
  const a1c = latestVital(vitals,'hba1c');
  const sugar = latestVital(vitals,'blood_sugar');
  const r = a1c ?? sugar;
  if (!r) return { key:'glucose', label:'Glucose / HbA1c', score:null, confidence:0, status:'NO_DATA', explanation: diabetic ? 'Known diabetes requires a recent glucose or HbA1c result to assess control.' : 'Glucose/HbA1c is conditionally required based on age and metabolic risk.', source:'Vitals / Lab results' };
  const v=num(r.value);
  if(v==null) return { key:'glucose', label:'Glucose / HbA1c', score:null, confidence:0, status:'NO_DATA', explanation:'The latest glucose result could not be interpreted.', source:'Vitals / Lab results' };
  let score:number;
  let explanation:string;
  if(r.type==='hba1c'){
    if(diabetic) score=v<7?90:v<8?70:v<10?45:20;
    else score=v<5.7?100:v<6.5?75:40;
    explanation=diabetic?`HbA1c ${v}% is interpreted as diabetes-control data; individual clinician targets may differ.`:`HbA1c ${v}% is interpreted as screening data.`;
    if(v>=10) alerts.push({severity:'WARNING',code:'VERY_HIGH_HBA1C',title:'Very high HbA1c recorded',message:'This suggests sustained high glucose and should be reviewed with the treating clinician.',domain:'metabolic_body',observedAt:r.measuredAt});
  } else {
    const ctx=`${r.context??''} ${r.notes??''}`.toLowerCase();
    if(v<70){score=25;alerts.push({severity:'WARNING',code:'LOW_GLUCOSE',title:'Low blood glucose recorded',message:'Low glucose can require prompt action, especially with symptoms or glucose-lowering medication.',domain:'metabolic_body',observedAt:r.measuredAt});}
    else if(ctx.includes('fast')) score=v<100?100:v<126?75:v<200?45:20;
    else if(ctx.includes('post')||ctx.includes('meal')) score=v<140?100:v<200?75:40;
    else score=v<140?90:v<200?65:40;
    explanation=`Blood glucose ${v} ${r.unit||'mg/dL'}${r.context?` (${r.context})`:''}. Measurement context materially affects interpretation.`;
    if(v>=300) alerts.push({severity:'WARNING',code:'VERY_HIGH_GLUCOSE',title:'Very high blood glucose recorded',message:'A very high glucose reading should be reviewed promptly, particularly if you feel unwell.',domain:'metabolic_body',observedAt:r.measuredAt});
  }
  return { key:'glucose', label:'Glucose / HbA1c', score, confidence:freshness(r.measuredAt,r.type==='hba1c'?90:14,r.type==='hba1c'?180:60), status:scoreStatus(score), value:`${v} ${r.unit||(r.type==='hba1c'?'%':'mg/dL')}`, measuredAt:r.measuredAt, explanation, source:'Vitals / Lab results' };
}

function activityComponent(life:LifestyleRow|null): Component {
  if(!life || (life.moderateActivityMinWeek==null && life.vigorousActivityMinWeek==null)) return { key:'activity', label:'Physical Activity', score:null, confidence:0, status:'NO_DATA', explanation:'Weekly moderate and/or vigorous activity is mandatory for the core assessment. Zero is a valid answer.', source:'Lifestyle health profile' };
  const eq=(life.moderateActivityMinWeek??0)+2*(life.vigorousActivityMinWeek??0);
  const score=eq>=300?100:eq>=150?85:eq>=75?60:eq>0?40:20;
  return {key:'activity',label:'Physical Activity',score,confidence:freshness(life.updatedAt,30,120),status:scoreStatus(score),value:`${life.moderateActivityMinWeek??0} min moderate + ${life.vigorousActivityMinWeek??0} min vigorous/week`,measuredAt:life.updatedAt,explanation:'Uses WHO adult activity targets; vigorous minutes count as approximately double moderate minutes for equivalence.',source:'Lifestyle health profile'};
}

function tobaccoComponent(life:LifestyleRow|null): Component {
  const t=life?.tobaccoStatus;
  if(!t) return { key:'tobacco', label:'Tobacco Exposure', score:null, confidence:0, status:'NO_DATA', explanation:'Tobacco status is mandatory. Indian tobacco assessment must include smoked and smokeless use.', source:'Lifestyle health profile' };
  const score=t==='NEVER'?100:t==='FORMER'?80:t==='SECONDHAND'?65:t==='CURRENT'?20:null;
  if(score==null) return { key:'tobacco', label:'Tobacco Exposure', score:null, confidence:0, status:'NO_DATA', explanation:'Tobacco status is not interpretable.', source:'Lifestyle health profile' };
  return {key:'tobacco',label:'Tobacco Exposure',score,confidence:freshness(life!.updatedAt,90,365),status:scoreStatus(score),value:t,measuredAt:life!.updatedAt,explanation:t==='CURRENT'?'Current tobacco use is a major modifiable risk factor; the later UI should capture cigarette/bidi/hookah and smokeless products such as gutkha, khaini and zarda.':'Tobacco exposure status is included as a major modifiable risk factor.',source:'Lifestyle health profile'};
}

function dietComponent(life:LifestyleRow|null): Component {
  const v=life?.fruitVegServingsDay;
  if(v==null) return { key:'diet', label:'Diet Indicator', score:null, confidence:0, status:'NO_DATA', explanation:'Diet is optional in the core calculator. Fruit/vegetable intake is currently used as a limited proxy until a fuller India-adapted diet module is added.', source:'Lifestyle health profile' };
  const score=v>=5?100:v>=3?75:v>=1?50:30;
  return {key:'diet',label:'Diet Indicator',score,confidence:freshness(life!.updatedAt,30,120),status:scoreStatus(score),value:`${v} fruit/vegetable servings/day`,measuredAt:life!.updatedAt,explanation:'A simple diet proxy only; it does not claim to represent complete nutritional quality.',source:'Lifestyle health profile'};
}

function sleepComponent(life:LifestyleRow|null): Component {
  const h=life?.sleepHoursAvg;
  if(h==null) return { key:'sleep', label:'Sleep Duration', score:null, confidence:0, status:'NO_DATA', explanation:'Average nightly sleep duration is mandatory for the core health assessment.', source:'Lifestyle health profile' };
  const score=h>=7&&h<=9?100:(h>=6&&h<7)||(h>9&&h<=10)?75:(h>=5&&h<6)||(h>10&&h<=11)?50:25;
  return {key:'sleep',label:'Sleep Duration',score,confidence:freshness(life!.updatedAt,30,120),status:scoreStatus(score),value:`${h.toFixed(1)} hours/night`,measuredAt:life!.updatedAt,explanation:'Adult sleep duration is centered on a 7–9 hour nightly range; individual needs and clinical conditions can differ.',source:'Lifestyle health profile'};
}

function symptomComponent(symptoms:any[], alerts:HealthAlert[]): Component {
  const rows=symptoms.filter(s=>s.loggedAt>=daysAgo(30));
  if(!rows.length) return {key:'symptoms',label:'Symptoms & Function',score:null,confidence:0,status:'NOT_APPLICABLE',applicable:false,explanation:'No recent symptom-tracking data. Missing logs are not interpreted as absence of symptoms and do not add healthy points.',source:'Symptom tracker'};
  const unresolved=rows.filter(s=>!s.resolvedAt);
  const avg=rows.reduce((s,r)=>s+r.severity,0)/rows.length;
  const severe=unresolved.filter(s=>s.severity>=8);
  const score=clamp(100-(avg*6+unresolved.length*3+Math.min(20,rows.length*1.5)));
  if(severe.length) alerts.push({severity:'WARNING',code:'SEVERE_UNRESOLVED_SYMPTOMS',title:'Severe unresolved symptoms recorded',message:'One or more recent symptoms are rated 8/10 or higher and remain unresolved.',domain:'symptoms_function',observedAt:severe[0].loggedAt});
  return {key:'symptoms',label:'Symptoms & Function',score,confidence:freshness(rows[0].loggedAt,7,30),status:scoreStatus(score),value:`${rows.length} logs · ${unresolved.length} unresolved · avg ${avg.toFixed(1)}/10`,measuredAt:rows[0].loggedAt,explanation:'Uses recent symptom severity and unresolved burden. It does not assume a symptom-free state when patients do not log symptoms.',source:'Symptom tracker'};
}

const freqPerDay=(f:string):number|null=>({ONCE_DAILY:1,TWICE_DAILY:2,THREE_TIMES_DAILY:3,FOUR_TIMES_DAILY:4,WEEKLY:1/7,BIWEEKLY:1/14,MONTHLY:1/30} as Record<string,number>)[f]??null;

async function treatmentComponent(patientId:string, life:LifestyleRow|null, meds:any[]):Promise<Component>{
  const declared=life?.medicationStatus;
  const active=meds.filter(m=>m.status==='ACTIVE');
  if(declared==='NONE' && active.length===0) return {key:'medication_adherence',label:'Medication / Treatment',score:null,confidence:100,status:'NOT_APPLICABLE',applicable:false,value:'No regular medication declared',explanation:'Medication adherence is not applicable when no regular medicine is prescribed; no penalty and no artificial 100 are assigned.',source:'Patient declaration + medication list'};
  if(declared==='NONE' && active.length>0) return {key:'medication_adherence',label:'Medication / Treatment',score:null,confidence:0,status:'NO_DATA',explanation:'The patient declared no regular medication, but active medicines exist in the record. Reconcile the medication list before scoring.',source:'Patient declaration + medication list'};
  if(!declared || declared==='UNKNOWN') return {key:'medication_adherence',label:'Medication / Treatment',score:null,confidence:0,status:'NO_DATA',explanation:'Medication status must be confirmed as no regular medication or currently taking prescribed medication.',source:'Patient declaration'};
  if(declared==='TAKING_PRESCRIBED' && !active.length) return {key:'medication_adherence',label:'Medication / Treatment',score:null,confidence:0,status:'NO_DATA',explanation:'The patient reports regular prescribed medication, but no active medication is recorded. Update the medication list first.',source:'Patient declaration + medication list'};
  if(!life?.medicationTrackingStartedAt) return {key:'medication_adherence',label:'Medication / Treatment',score:null,confidence:20,status:'ESTABLISHING',explanation:'Medication tracking has not started yet. A new patient is never scored as 0% adherent solely because historical logs are absent.',source:'Medication schedule + dose logs'};
  const trackingAge=(Date.now()-life.medicationTrackingStartedAt.getTime())/DAY;
  if(trackingAge<7) return {key:'medication_adherence',label:'Medication / Treatment',score:null,confidence:clamp(trackingAge/7*50),status:'ESTABLISHING',value:`Tracking for ${Math.max(0,Math.floor(trackingAge))} day(s)`,explanation:'At least 7 days of medication tracking are required before adherence contributes to the Health Score.',source:'Medication schedule + dose logs'};
  const start=new Date(Math.max(daysAgo(30).getTime(),life.medicationTrackingStartedAt.getTime()));
  const end=new Date();
  let expected=0;
  for(const m of active){const per=freqPerDay(m.frequency);if(per==null)continue;const s=Math.max(start.getTime(),m.startDate.getTime());const e=m.endDate?Math.min(end.getTime(),m.endDate.getTime()):end.getTime();if(e<s)continue;expected+=Math.max(0,Math.round((((e-s)/DAY)+1)*per));}
  if(!expected) return {key:'medication_adherence',label:'Medication / Treatment',score:null,confidence:0,status:'NOT_APPLICABLE',applicable:false,explanation:'No schedulable regular medication regimen is available. PRN/custom medicines are not converted into missed doses.',source:'Medication schedule'};
  const taken=await prisma.medicationLog.count({where:{medication:{patientId},scheduledTime:{gte:start,lte:end},status:'taken'}});
  const score=clamp(Math.min(taken,expected)/expected*100);
  return {key:'medication_adherence',label:'Medication / Treatment',score,confidence:90,status:scoreStatus(score),value:`${taken}/${expected} expected doses logged as taken`,measuredAt:end,explanation:'Adherence begins only after an explicit tracking start and a 7-day establishment period; expected scheduled doses form the denominator.',source:'Medication schedule + dose logs'};
}

function conditionControlComponent(conditions:any[], bp:Component, glucose:Component, bmi:Component, life:LifestyleRow|null): Component {
  const declared=life?.conditionStatus;
  if(declared==='NONE' && conditions.length===0) return {key:'condition_control',label:'Known Condition Control',score:null,confidence:100,status:'NOT_APPLICABLE',applicable:false,value:'No known chronic condition declared',explanation:'Having no diagnosed chronic condition is not awarded artificial bonus points. This domain is simply not applicable.',source:'Patient declaration + medical history'};
  if(declared==='NONE' && conditions.length>0) return {key:'condition_control',label:'Known Condition Control',score:null,confidence:0,status:'NO_DATA',explanation:'The patient declared no known chronic condition, but conditions exist in the medical record. Reconcile the history before scoring.',source:'Patient declaration + medical history'};
  if(!declared || declared==='UNKNOWN') return {key:'condition_control',label:'Known Condition Control',score:null,confidence:0,status:'NO_DATA',explanation:'Known-condition status must be explicitly confirmed for the core assessment.',source:'Patient declaration'};
  if(declared==='KNOWN' && !conditions.length) return {key:'condition_control',label:'Known Condition Control',score:null,confidence:0,status:'NO_DATA',explanation:'The patient reports a chronic condition, but none is recorded. Add the condition before scoring control.',source:'Patient declaration + medical history'};

  const parts:Array<{label:string;score:number;confidence:number}>=[];
  if(hasCondition(conditions,['hypertension','high blood pressure'])) if(bp.score!=null) parts.push({label:'hypertension',score:bp.score,confidence:bp.confidence});
  if(hasCondition(conditions,['diabetes','type 2 dm','type 1 dm'])) if(glucose.score!=null) parts.push({label:'diabetes',score:glucose.score,confidence:glucose.confidence});
  if(hasCondition(conditions,['obesity'])) if(bmi.score!=null) parts.push({label:'obesity',score:bmi.score,confidence:bmi.confidence});
  if(!parts.length) return {key:'condition_control',label:'Known Condition Control',score:null,confidence:25,status:'ESTABLISHING',value:`${conditions.length} recorded condition${conditions.length===1?'':'s'}`,explanation:'Conditions are recorded, but HC-HSI 2.0 does not invent a generic control score. Disease-specific structured control data are required.',source:'Medical history + disease-specific measurements'};
  const score=clamp(parts.reduce((s,p)=>s+p.score,0)/parts.length);
  const confidence=clamp(parts.reduce((s,p)=>s+p.confidence,0)/parts.length);
  return {key:'condition_control',label:'Known Condition Control',score,confidence,status:scoreStatus(score),value:`${parts.length} condition-specific control measure${parts.length===1?'':'s'}`,explanation:`Uses disease-specific measurable control for ${parts.map(p=>p.label).join(', ')} rather than assigning a generic score to every chronic diagnosis.`,source:'Medical history + disease-specific measurements'};
}

function composeDomain(key:DomainKey,label:string,components:Array<{component:Component;weight:number}>, explanation:string):HealthDomain{
  const applicableParts=components.filter(x=>x.component.applicable!==false);
  const score=weighted(applicableParts.map(x=>({score:x.component.score,weight:x.weight})));
  const confidence=weightedConfidence(applicableParts.map(x=>({score:x.component.score,confidence:x.component.confidence,weight:x.weight})));
  const applicable=applicableParts.length>0;
  let st:DomainStatus=scoreStatus(score);
  if(!applicable) st='NOT_APPLICABLE';
  else if(score==null && applicableParts.some(x=>x.component.status==='ESTABLISHING')) st='ESTABLISHING';
  return {key,label,weight:DOMAIN_WEIGHTS[key],score,status:st,confidence,latestValue:applicableParts.find(x=>x.component.value)?.component.value??null,explanation,source:[...new Set(applicableParts.map(x=>x.component.source))].join(' + '),components:components.map(x=>x.component),applicable};
}

function addSafetyAlerts(vitals:any[], alerts:HealthAlert[]){
  const spo2=latestVital(vitals,'spo2'); const sv=spo2?num(spo2.value):null;
  if(spo2&&sv!=null&&sv<90) alerts.push({severity:'CRITICAL',code:'LOW_SPO2',title:'Low oxygen saturation recorded',message:'An SpO₂ below 90% can be clinically significant. Seek prompt medical assessment, particularly if symptomatic.',observedAt:spo2.measuredAt});
  else if(spo2&&sv!=null&&sv<94) alerts.push({severity:'WARNING',code:'LOW_SPO2',title:'Lower-than-expected oxygen saturation recorded',message:'Repeat the reading carefully and discuss persistent low values with a clinician.',observedAt:spo2.measuredAt});
  const hr=latestVital(vitals,'heart_rate'); const hv=hr?num(hr.value):null;
  if(hr&&hv!=null&&(hv<40||hv>140)) alerts.push({severity:'WARNING',code:'EXTREME_HEART_RATE',title:'Unusual heart rate recorded',message:'A very low or very high resting heart rate may warrant clinical assessment, especially with symptoms.',observedAt:hr.measuredAt});
}

function firstDegree(relation:string){return /mother|father|parent|brother|sister|sibling|son|daughter|child/i.test(relation);}
function familyRisk(family:any[]){
  const fd=family.filter(f=>firstDegree(f.relation));
  const has=(words:string[])=>fd.some(f=>words.some(w=>`${f.conditionName}`.toLowerCase().includes(w)));
  const prematureCvd=fd.some(f=>{
    const c=`${f.conditionName}`.toLowerCase(); if(!/(heart|coronary|mi|myocardial|stroke|cardiovascular)/.test(c)||f.ageOfOnset==null)return false;
    const r=`${f.relation}`.toLowerCase(); const female=/mother|sister|daughter/.test(r); return f.ageOfOnset<(female?65:55);
  });
  return {firstDegreeCount:fd.length,diabetes:has(['diabetes']),hypertension:has(['hypertension','high blood pressure']),cardiovascular:has(['heart','coronary','myocardial','cardiovascular']),stroke:has(['stroke']),kidney:has(['kidney','ckd','renal']),prematureCardiovascular:prematureCvd};
}

function coreRequirements(args:{age:number|null;gender:string|null;bp:Component;bmi:Component;life:LifestyleRow|null;conditions:any[];meds:any[];family:any[]}){
  const {age,gender,bp,bmi,life,conditions,meds,family}=args;
  const rows=[
    {key:'age',label:'Age / date of birth',complete:age!=null,reason:'Date of birth is required.'},
    {key:'sex',label:'Sex',complete:!!gender,reason:'Sex is required for contextual interpretation.'},
    {key:'blood_pressure',label:'Blood pressure',complete:bp.score!=null,reason:'Add a recent blood pressure reading.'},
    {key:'body_measurements',label:'Height + weight / BMI',complete:bmi.score!=null,reason:'Add height and a recent weight.'},
    {key:'tobacco',label:'Tobacco status',complete:!!life?.tobaccoStatus,reason:'Confirm tobacco exposure, including smokeless tobacco.'},
    {key:'activity',label:'Physical activity',complete:life?.moderateActivityMinWeek!=null||life?.vigorousActivityMinWeek!=null,reason:'Enter weekly activity; zero is a valid answer.'},
    {key:'sleep',label:'Sleep',complete:life?.sleepHoursAvg!=null,reason:'Enter average nightly sleep duration.'},
    {key:'conditions',label:'Known-condition declaration',complete:life?.conditionStatus==='NONE'?conditions.length===0:life?.conditionStatus==='KNOWN'?conditions.length>0:false,reason:'Confirm no known condition or reconcile recorded conditions.'},
    {key:'medications',label:'Medication-status declaration',complete:life?.medicationStatus==='NONE'?meds.filter(m=>m.status==='ACTIVE').length===0:life?.medicationStatus==='TAKING_PRESCRIBED'?meds.filter(m=>m.status==='ACTIVE').length>0:false,reason:'Confirm no regular medication or reconcile the active medication list.'},
    {key:'family_history',label:'Family-history declaration',complete:life?.familyHistoryStatus==='NONE'?family.length===0:life?.familyHistoryStatus==='RECORDED'?family.length>0:false,reason:'Confirm no known family history or record known family conditions.'},
  ];
  return {items:rows,complete:rows.every(r=>r.complete),completed:rows.filter(r=>r.complete).length,total:rows.length,percent:Math.round(rows.filter(r=>r.complete).length/rows.length*100)};
}

function screeningContext(age:number|null,bmi:Component,conditions:any[],family:any[],glucose:Component,lipids:Component,life:LifestyleRow|null){
  const f=familyRisk(family); const bmiValue=bmi.value?.match(/BMI\s+([0-9.]+)/)?.[1]; const bmiN=bmiValue?Number(bmiValue):null;
  const knownDiabetes=hasCondition(conditions,['diabetes','type 2 dm','type 1 dm']);
  const knownCvd=hasCondition(conditions,['coronary','heart disease','stroke','cardiovascular','ckd','kidney']);
  const recs:Array<{code:string;priority:'CORE'|'RECOMMENDED';message:string}>=[];
  if((age??0)>=30 && glucose.score==null) recs.push({code:'INDIA_NCD_GLUCOSE_SCREENING',priority:'CORE',message:'Age 30+ falls within India’s population-based NCD screening focus; add current glucose/HbA1c information.'});
  if((bmiN??0)>=23 && glucose.score==null) recs.push({code:'SOUTH_ASIAN_BMI_GLUCOSE_SCREENING',priority:'CORE',message:'BMI is at or above a South-Asian public-health action point; metabolic screening is important.'});
  if(f.diabetes && glucose.score==null) recs.push({code:'FAMILY_DIABETES_SCREENING',priority:'CORE',message:'First-degree family history of diabetes increases the importance of current glucose screening.'});
  if(knownDiabetes && glucose.score==null) recs.push({code:'DIABETES_CONTROL_DATA_DUE',priority:'CORE',message:'Known diabetes requires current HbA1c/glucose data to assess disease control.'});
  if(((age??0)>=40 || knownCvd || f.prematureCardiovascular || life?.tobaccoStatus==='CURRENT') && lipids.score==null) recs.push({code:'LIPID_ASSESSMENT_RECOMMENDED',priority:'RECOMMENDED',message:'Cardiovascular risk context supports adding a structured lipid profile.'});
  return {ageYears:age,ageBand:age==null?'UNKNOWN':age<30?'UNDER_30':age<40?'30_39':age<50?'40_49':age<60?'50_59':'60_PLUS',familyHistory:f,screeningRecommendations:recs};
}

export async function getHealthScoreHistory(patientId:string,limit=12){
  const safe=Math.min(50,Math.max(1,Math.floor(limit)));
  return prisma.$queryRaw<Array<{score:number|null;status:string;confidence:number;algorithmVersion:string;calculatedAt:Date}>>`
    SELECT "score","status","confidence","algorithmVersion","calculatedAt" FROM "health_score_snapshots"
    WHERE "patientId"=${patientId} ORDER BY "calculatedAt" DESC LIMIT ${safe}`;
}

export async function calculateHealthScore(patientId:string,options:{persistSnapshot?:boolean}={}):Promise<any>{
  const patient=await prisma.patientProfile.findUnique({where:{id:patientId},select:{id:true,dateOfBirth:true,gender:true}});
  if(!patient) throw new Error('Patient profile not found');
  const [vitals,life,conditions,meds,symptoms,family]=await Promise.all([
    prisma.vital.findMany({where:{patientId},orderBy:{measuredAt:'desc'},take:300}),
    getLifestyle(patientId).catch(()=>null),
    prisma.condition.findMany({where:{patientId},select:{name:true,status:true,updatedAt:true}}),
    prisma.medication.findMany({where:{patientId},select:{id:true,status:true,frequency:true,startDate:true,endDate:true}}),
    prisma.symptomLog.findMany({where:{patientId,loggedAt:{gte:daysAgo(30)}},orderBy:{loggedAt:'desc'}}),
    prisma.familyHistory.findMany({where:{patientId},select:{relation:true,conditionName:true,ageOfOnset:true,status:true}}),
  ]);

  const alerts:HealthAlert[]=[];
  addSafetyAlerts(vitals,alerts);
  const bp=bloodPressureComponent(vitals,alerts);
  const lipids=lipidComponent(vitals,alerts);
  const bmi=bmiComponent(vitals,life);
  const waist=waistComponent(life,patient.gender??null);
  const glucose=glucoseComponent(vitals,conditions,alerts);
  const activity=activityComponent(life);
  const tobacco=tobaccoComponent(life);
  const diet=dietComponent(life);
  const sleep=sleepComponent(life);
  const treatment=await treatmentComponent(patientId,life,meds);
  const condition=conditionControlComponent(conditions,bp,glucose,bmi,life);
  const symptomsComp=symptomComponent(symptoms,alerts);

  const cardio=composeDomain('cardiovascular','Cardiovascular Health',[{component:bp,weight:75},{component:lipids,weight:25}],'Prioritizes blood-pressure control; structured lipids improve the domain when available. Heart rate and SpO₂ remain safety signals rather than arbitrary score points.');
  const metabolic=composeDomain('metabolic_body','Metabolic & Body Health',[{component:bmi,weight:50},{component:glucose,weight:35},{component:waist,weight:15}],'Combines BMI with glucose control/screening and optional waist circumference. Missing optional measures lower confidence rather than being assumed healthy.');
  const lifestyleDomain=composeDomain('lifestyle','Lifestyle Health',[{component:tobacco,weight:50},{component:activity,weight:35},{component:diet,weight:15}],'Emphasizes tobacco exposure and physical activity; diet is currently a smaller, limited proxy until a fuller India-adapted diet assessment is implemented.');
  const sleepDomain=composeDomain('sleep_recovery','Sleep & Recovery',[{component:sleep,weight:100}],'Uses average sleep duration as the current measurable recovery input.');
  const conditionDomain=composeDomain('condition_control','Known Condition Control',[{component:condition,weight:100}],'Only disease-specific measurable control is scored. A diagnosis alone never receives an arbitrary generic control score.');
  const treatmentDomain=composeDomain('treatment_care','Treatment & Care',[{component:treatment,weight:100}],'Medication adherence is scored only when regular medication actually applies and tracking has been established. No medication prescribed is N/A, not 0 and not 100.');
  const symptomDomain=composeDomain('symptoms_function','Symptoms & Function',[{component:symptomsComp,weight:100}],'Recent symptom burden contributes when tracking data exists; absence of symptom logs is never treated as perfect health.');
  const domains=[cardio,metabolic,lifestyleDomain,sleepDomain,conditionDomain,treatmentDomain,symptomDomain];

  const age=ageYears(patient.dateOfBirth);
  const readiness=coreRequirements({age,gender:patient.gender??null,bp,bmi,life,conditions,meds,family});
  const riskContext=screeningContext(age,bmi,conditions,family,glucose,lipids,life);

  const scoreable=domains.filter(d=>d.applicable&&d.score!=null);
  const scoreWeight=scoreable.reduce((s,d)=>s+d.weight,0);
  const rawScore=scoreWeight?Math.round(scoreable.reduce((s,d)=>s+(d.score as number)*d.weight,0)/scoreWeight):null;
  const score=readiness.complete?rawScore:null;
  const domainConfidence=domains.reduce((s,d)=>s+d.weight*d.confidence,0)/100;
  let confidence=clamp(domainConfidence*(readiness.percent/100));
  const hasCoreScreeningGap=riskContext.screeningRecommendations.some(x=>x.priority==='CORE');
  if(hasCoreScreeningGap) confidence=Math.min(confidence,75);
  const status=overallStatus(score);
  const calculatedAt=new Date();
  const history=await getHealthScoreHistory(patientId,12).catch(()=>[]);
  const prev=history.find(h=>h.score!=null&&h.algorithmVersion===HEALTH_SCORE_ALGORITHM_VERSION);
  const delta=score!=null&&prev?.score!=null?score-prev.score:null;
  const trend=delta==null?'UNKNOWN':delta>=3?'IMPROVING':delta<=-3?'WORSENING':'STABLE';

  const missingData=[
    ...readiness.items.filter(r=>!r.complete).map(r=>({key:r.key,label:r.label,reason:r.reason,priority:'MANDATORY'})),
    ...riskContext.screeningRecommendations.map(r=>({key:r.code,label:r.code.replace(/_/g,' '),reason:r.message,priority:r.priority==='CORE'?'CONDITIONAL':'OPTIONAL'})),
  ];
  const recommendations:string[]=[];
  if(!readiness.complete) recommendations.push(`Complete the core assessment: ${readiness.completed}/${readiness.total} mandatory areas are complete.`);
  if(alerts.some(a=>a.severity==='CRITICAL')) recommendations.push('A critical alert is present. Do not use the overall Health Score to dismiss urgent clinical findings.');
  domains.filter(d=>d.score!=null&&d.score<70).sort((a,b)=>(a.score??0)-(b.score??0)).slice(0,3).forEach(d=>recommendations.push(`Focus on ${d.label.toLowerCase()}: ${d.explanation}`));
  riskContext.screeningRecommendations.slice(0,3).forEach(r=>recommendations.push(r.message));

  if(score!=null){
    const medicationLegacy=treatment.score??0;
    const symptomLegacy=symptomsComp.score??0;
    const lifestyleLegacy=weighted([{score:lifestyleDomain.score,weight:60},{score:sleepDomain.score,weight:40}])??0;
    await prisma.healthScore.upsert({where:{patientId},create:{patientId,score,medicationAdherence:medicationLegacy,symptomFrequency:symptomLegacy,appointmentRegularity:0,lifestyleFactors:lifestyleLegacy},update:{score,medicationAdherence:medicationLegacy,symptomFrequency:symptomLegacy,appointmentRegularity:0,lifestyleFactors:lifestyleLegacy,calculatedAt}});
  }

  const result={
    score,status,confidence,dataCoverage:scoreWeight,algorithmVersion:HEALTH_SCORE_ALGORITHM_VERSION,calculatedAt,trend,delta,
    assessmentReadiness:readiness,
    assessmentLevel:readiness.complete?(hasCoreScreeningGap?'CORE_COMPLETE_SCREENING_DUE':'COMPREHENSIVE'):'INCOMPLETE',
    riskContext,
    hasCriticalAlert:alerts.some(a=>a.severity==='CRITICAL'),domains,alerts,missingData,recommendations,
    history:history.map(h=>({score:h.score,status:h.status,confidence:h.confidence,algorithmVersion:h.algorithmVersion,date:h.calculatedAt})),
    medicationAdherence:treatment.score??0,symptomFrequency:symptomsComp.score??0,appointmentRegularity:0,lifestyleFactors:lifestyleDomain.score??0,
  };

  if(options.persistSnapshot){
    await prisma.$executeRaw`INSERT INTO "health_score_snapshots" ("patientId","score","status","confidence","algorithmVersion","domains","alerts","missingData","calculatedAt") VALUES (${patientId},${score},${status},${confidence},${HEALTH_SCORE_ALGORITHM_VERSION},CAST(${JSON.stringify(domains)} AS jsonb),CAST(${JSON.stringify(alerts)} AS jsonb),CAST(${JSON.stringify(missingData)} AS jsonb),${calculatedAt})`;
  }
  return result;
}

export const getHealthScore=(patientId:string)=>calculateHealthScore(patientId,{persistSnapshot:false});
export const refreshHealthScore=(patientId:string)=>calculateHealthScore(patientId,{persistSnapshot:true});
