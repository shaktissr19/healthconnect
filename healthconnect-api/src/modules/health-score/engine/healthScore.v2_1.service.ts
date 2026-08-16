import { prisma } from '../lib/prisma';

export const HEALTH_SCORE_ALGORITHM_VERSION = 'HC-HSI-2.0';

type DomainKey = 'cardiovascular'|'metabolic_body'|'lifestyle'|'sleep_recovery'|'condition_control'|'treatment_care'|'symptoms_function';
type DomainStatus = 'STRONG'|'GOOD'|'NEEDS_ATTENTION'|'NEEDS_REVIEW'|'NO_DATA'|'NOT_APPLICABLE'|'ESTABLISHING';
type OverallStatus = 'STRONG'|'GOOD'|'NEEDS_ATTENTION'|'NEEDS_REVIEW'|'INCOMPLETE_ASSESSMENT';
type AlertSeverity = 'INFO'|'WARNING'|'CRITICAL';

type LifestyleRow = {
  patientId:string; heightCm:number|null; waistCm:number|null;
  moderateActivityMinWeek:number|null; vigorousActivityMinWeek:number|null;
  sleepHoursAvg:number|null; tobaccoStatus:string|null; fruitVegServingsDay:number|null;
  medicationStatus:string|null; conditionStatus:string|null; familyHistoryStatus:string|null;
  medicationTrackingStartedAt:Date|null; alcoholStatus:string|null; updatedAt:Date;
};

type Component = {
  key:string; label:string; score:number|null; confidence:number; status:DomainStatus;
  value?:string|null; explanation:string; source:string; measuredAt?:Date|null; applicable?:boolean;
};

type HealthDomain = {
  key:DomainKey; label:string; weight:number; score:number|null; status:DomainStatus; confidence:number;
  latestValue?:string|null; explanation:string; source:string; components:Component[]; applicable:boolean;
};

type HealthAlert = { severity:AlertSeverity; code:string; title:string; message:string; domain?:DomainKey; observedAt?:Date|null };
type Limitation = { code:string; title:string; message:string; severity:'INFO'|'IMPORTANT' };

const W:Record<DomainKey,number>={cardiovascular:20,metabolic_body:20,lifestyle:20,sleep_recovery:10,condition_control:15,treatment_care:10,symptoms_function:5};
const DAY=86_400_000;
const daysAgo=(n:number)=>new Date(Date.now()-n*DAY);
const clamp=(n:number)=>Math.max(0,Math.min(100,Math.round(n)));
const nval=(v:unknown):number|null=>{if(typeof v==='number'&&Number.isFinite(v))return v;if(typeof v!=='string')return null;const m=v.replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):null;};
const status=(n:number|null):DomainStatus=>n==null?'NO_DATA':n>=85?'STRONG':n>=70?'GOOD':n>=55?'NEEDS_ATTENTION':'NEEDS_REVIEW';
const overall=(n:number|null):OverallStatus=>n==null?'INCOMPLETE_ASSESSMENT':n>=85?'STRONG':n>=70?'GOOD':n>=55?'NEEDS_ATTENTION':'NEEDS_REVIEW';
const fresh=(d:Date|null|undefined,ideal:number,stale:number)=>{if(!d)return 0;const age=Math.max(0,(Date.now()-d.getTime())/DAY);if(age<=ideal)return 100;if(age>=stale)return 25;return clamp(100-((age-ideal)/(stale-ideal))*75);};
const ageYears=(dob:Date|null)=>{if(!dob)return null;const now=new Date();let a=now.getUTCFullYear()-dob.getUTCFullYear();if(now.getUTCMonth()<dob.getUTCMonth()||(now.getUTCMonth()===dob.getUTCMonth()&&now.getUTCDate()<dob.getUTCDate()))a--;return a;};
const interp=(x:number,anchors:Array<[number,number]>)=>{const a=[...anchors].sort((p,q)=>p[0]-q[0]);if(x<=a[0][0])return a[0][1];if(x>=a[a.length-1][0])return a[a.length-1][1];for(let i=0;i<a.length-1;i++){const [x1,y1]=a[i],[x2,y2]=a[i+1];if(x>=x1&&x<=x2)return y1+(y2-y1)*(x-x1)/(x2-x1);}return a[a.length-1][1];};
const weighted=(parts:Array<{score:number|null;weight:number}>)=>{const a=parts.filter((p):p is {score:number;weight:number}=>p.score!=null);const w=a.reduce((s,p)=>s+p.weight,0);return w?clamp(a.reduce((s,p)=>s+p.score*p.weight,0)/w):null;};
const weightedConfidence=(parts:Array<{score:number|null;confidence:number;weight:number}>)=>{const a=parts.filter(p=>p.score!=null);const w=a.reduce((s,p)=>s+p.weight,0);return w?clamp(a.reduce((s,p)=>s+p.confidence*p.weight,0)/w):0;};

async function lifestyle(patientId:string):Promise<LifestyleRow|null>{const rows=await prisma.$queryRaw<LifestyleRow[]>`SELECT * FROM "patient_lifestyle_health" WHERE "patientId"=${patientId} LIMIT 1`;return rows[0]??null;}
const latest=(vitals:any[],type:string)=>vitals.filter(v=>v.type===type).sort((a,b)=>b.measuredAt.getTime()-a.measuredAt.getTime())[0]??null;
const hasCondition=(rows:any[],words:string[])=>rows.some(r=>words.some(w=>`${r.name}`.toLowerCase().includes(w)));

// HC-HSI BP component: continuous product scoring, not a diagnostic guideline table.
// 115-120/75-80 is the high-scoring reference zone; extreme values floor at 30 and trigger alerts.
function bpComponent(vitals:any[],alerts:HealthAlert[]):Component{
  const all=vitals.filter(v=>v.type==='bp'&&v.systolic!=null&&v.diastolic!=null).sort((a,b)=>b.measuredAt.getTime()-a.measuredAt.getTime());
  if(!all.length)return{key:'blood_pressure',label:'Blood Pressure',score:null,confidence:0,status:'NO_DATA',explanation:'A recent blood-pressure reading is required for the core assessment.',source:'Vitals'};
  const recent=all.filter(v=>v.measuredAt>=daysAgo(30)).slice(0,7);const use=recent.length?recent:all.slice(0,3);
  const sys=Math.round(use.reduce((s,v)=>s+v.systolic,0)/use.length);const dia=Math.round(use.reduce((s,v)=>s+v.diastolic,0)/use.length);const last=all[0];
  const sScore=interp(sys,[[70,30],[80,38],[90,62],[100,80],[110,92],[115,98],[118,100],[120,98],[129,85],[139,70],[159,50],[179,36],[210,30]]);
  const dScore=interp(dia,[[40,30],[50,44],[60,66],[65,80],[70,92],[75,98],[77,100],[80,98],[84,84],[89,70],[99,52],[109,38],[120,30]]);
  let score=clamp(sScore*.55+dScore*.45);
  // The worse number must meaningfully constrain the combined score.
  score=Math.min(score,clamp(Math.min(sScore,dScore)+8));
  if(sys>=180||dia>=120)score=Math.min(score,30);else if(sys>=160||dia>=100)score=Math.min(score,44);else if(sys>=140||dia>=90)score=Math.min(score,59);else if(sys>=130||dia>=85)score=Math.min(score,74);
  score=Math.max(30,score);
  if(last.systolic>=180||last.diastolic>=120)alerts.push({severity:'CRITICAL',code:'SEVERE_BP',title:'Severely high blood pressure recorded',message:'Repeat the reading correctly. If it remains very high, seek prompt clinical assessment; urgent symptoms require emergency evaluation.',domain:'cardiovascular',observedAt:last.measuredAt});
  else if(last.systolic>=160||last.diastolic>=100)alerts.push({severity:'WARNING',code:'VERY_HIGH_BP',title:'Very high blood pressure recorded',message:'Repeat the measurement and arrange clinical review if it remains high.',domain:'cardiovascular',observedAt:last.measuredAt});
  else if(last.systolic<90||last.diastolic<60)alerts.push({severity:'WARNING',code:'LOW_BP',title:'Low blood pressure recorded',message:'Repeat the reading and seek advice if low values persist or you feel dizzy, weak, faint or unwell.',domain:'cardiovascular',observedAt:last.measuredAt});
  const countConf=use.length>=5?100:use.length>=3?90:use.length===2?70:45;const conf=clamp(countConf*fresh(last.measuredAt,14,90)/100);
  return{key:'blood_pressure',label:'Blood Pressure',score,confidence:conf,status:status(score),value:`${last.systolic}/${last.diastolic} mmHg`,measuredAt:last.measuredAt,explanation:use.length===1?`Provisional score from one recent reading (${last.systolic}/${last.diastolic}). Repeated readings on different days improve certainty.`:`Uses the recent average ${sys}/${dia} mmHg from ${use.length} readings, with progressive penalties as either value moves away from the HC-HSI reference zone.`,source:'Vitals'};
}

function bmiComponent(vitals:any[],life:LifestyleRow|null):Component{
  const wt=latest(vitals,'weight');if(!life?.heightCm||!wt)return{key:'bmi',label:'BMI',score:null,confidence:0,status:'NO_DATA',explanation:'Height and a recent weight are required.',source:'Height + weight'};
  const kg=nval(wt.value);if(kg==null||kg<=0)return{key:'bmi',label:'BMI',score:null,confidence:0,status:'NO_DATA',explanation:'Latest weight could not be interpreted.',source:'Height + weight'};
  const bmi=kg/((life.heightCm/100)**2);
  const score=clamp(interp(bmi,[[14,30],[16,45],[18.5,78],[20.5,98],[22,100],[23,94],[25,82],[27.5,65],[30,50],[35,36],[40,30]]));
  return{key:'bmi',label:'BMI',score,confidence:Math.min(fresh(wt.measuredAt,30,180),fresh(life.updatedAt,180,365)),status:status(score),value:`BMI ${bmi.toFixed(1)} · ${kg} kg`,measuredAt:wt.measuredAt,explanation:'Uses BMI as a screening measure with South-Asian metabolic-risk action points; it is not a diagnosis or complete measure of body composition.',source:'Height + weight'};
}

function waistComponent(life:LifestyleRow|null,gender:string|null):Component{
  if(life?.waistCm==null)return{key:'waist',label:'Waist Circumference',score:null,confidence:0,status:'NO_DATA',explanation:'Optional; improves cardiometabolic assessment.',source:'Lifestyle assessment'};
  const g=(gender??'').toUpperCase();let score:number|null=null;
  if(g==='MALE')score=clamp(interp(life.waistCm,[[65,100],[80,98],[90,82],[100,58],[120,30]]));
  if(g==='FEMALE')score=clamp(interp(life.waistCm,[[55,100],[70,98],[80,82],[90,58],[110,30]]));
  if(score==null)return{key:'waist',label:'Waist Circumference',score:null,confidence:0,status:'NO_DATA',value:`${life.waistCm} cm`,explanation:'Sex-specific waist interpretation is unavailable for this profile.',source:'Lifestyle assessment'};
  return{key:'waist',label:'Waist Circumference',score,confidence:fresh(life.updatedAt,90,365),status:status(score),value:`${life.waistCm} cm`,measuredAt:life.updatedAt,explanation:'Central adiposity is used as an additional South-Asian cardiometabolic risk marker.',source:'Lifestyle assessment'};
}

function glucoseComponent(vitals:any[],conditions:any[],alerts:HealthAlert[]):Component{
  const diabetic=hasCondition(conditions,['diabetes','type 2 dm','type 1 dm']);const a1c=latest(vitals,'hba1c');const sugar=latest(vitals,'blood_sugar');const r=a1c??sugar;
  if(!r)return{key:'glucose',label:'Glucose / HbA1c',score:null,confidence:0,status:'NO_DATA',explanation:diabetic?'Known diabetes requires current HbA1c/glucose data to assess control.':'Glucose/HbA1c is required when age or metabolic risk indicates screening.',source:'Vitals / Lab results'};
  const v=nval(r.value);if(v==null)return{key:'glucose',label:'Glucose / HbA1c',score:null,confidence:0,status:'NO_DATA',explanation:'Latest result could not be interpreted.',source:'Vitals / Lab results'};
  let score:number;let explanation:string;
  if(r.type==='hba1c'){
    score=diabetic?clamp(interp(v,[[4.5,92],[5.5,98],[6.5,96],[7,90],[8,72],[9,55],[10,40],[12,30]])):clamp(interp(v,[[4.5,100],[5.6,98],[5.7,92],[6.4,72],[6.5,55],[8,35],[10,30]]));
    explanation=diabetic?`HbA1c ${v}% is interpreted as diabetes-control information; individual clinician targets may differ.`:`HbA1c ${v}% is interpreted as metabolic-screening information.`;
    if(v>=10)alerts.push({severity:'WARNING',code:'VERY_HIGH_HBA1C',title:'Very high HbA1c recorded',message:'This suggests sustained high glucose and should be reviewed with the treating clinician.',domain:'metabolic_body',observedAt:r.measuredAt});
  }else{
    const ctx=`${r.context??''} ${r.notes??''}`.toLowerCase();
    if(v<70){score=40;alerts.push({severity:'WARNING',code:'LOW_GLUCOSE',title:'Low blood glucose recorded',message:'Low glucose may require prompt action, especially with symptoms or glucose-lowering medication.',domain:'metabolic_body',observedAt:r.measuredAt});}
    else if(ctx.includes('fast'))score=clamp(interp(v,[[70,92],[85,100],[99,96],[110,82],[125,65],[126,55],[180,35],[250,30]]));
    else if(ctx.includes('post')||ctx.includes('meal'))score=clamp(interp(v,[[70,88],[110,100],[139,96],[160,84],[199,65],[200,50],[300,30]]));
    else score=clamp(interp(v,[[70,85],[100,98],[139,94],[160,82],[199,68],[200,55],[300,30]]));
    explanation=`Blood glucose ${v} ${r.unit||'mg/dL'}${r.context?` (${r.context})`:''}. Fasting, post-meal and random values are interpreted differently.`;
    if(v>=300)alerts.push({severity:'WARNING',code:'VERY_HIGH_GLUCOSE',title:'Very high blood glucose recorded',message:'A very high glucose reading should be reviewed promptly, particularly if you feel unwell.',domain:'metabolic_body',observedAt:r.measuredAt});
  }
  return{key:'glucose',label:'Glucose / HbA1c',score,confidence:fresh(r.measuredAt,r.type==='hba1c'?90:14,r.type==='hba1c'?180:60),status:status(score),value:`${v} ${r.unit||(r.type==='hba1c'?'%':'mg/dL')}`,measuredAt:r.measuredAt,explanation,source:'Vitals / Lab results'};
}

function lipidComponent(vitals:any[],alerts:HealthAlert[]):Component{
  const r=latest(vitals,'cholesterol');if(!r)return{key:'lipids',label:'Blood Lipids',score:null,confidence:0,status:'NO_DATA',explanation:'Structured LDL, HDL, triglycerides or total cholesterol improve cardiovascular assessment.',source:'Vitals / Lab results'};
  const v=nval(r.value),ctx=`${r.context??''} ${r.notes??''}`.toLowerCase();if(v==null)return{key:'lipids',label:'Blood Lipids',score:null,confidence:0,status:'NO_DATA',explanation:'Latest cholesterol value could not be interpreted.',source:'Vitals / Lab results'};
  let score:number|null=null,label='';
  if(ctx.includes('ldl')){label='LDL';score=clamp(interp(v,[[40,100],[70,98],[99,94],[129,82],[159,65],[189,45],[190,35],[250,30]]));if(v>=190)alerts.push({severity:'WARNING',code:'VERY_HIGH_LDL',title:'Very high LDL recorded',message:'This warrants clinician review and cardiovascular risk assessment.',domain:'cardiovascular',observedAt:r.measuredAt});}
  else if(ctx.includes('hdl')){label='HDL';score=clamp(interp(v,[[20,35],[40,70],[50,88],[60,98],[80,100]]));}
  else if(ctx.includes('trig')){label='Triglycerides';score=clamp(interp(v,[[60,100],[149,94],[199,78],[300,58],[499,40],[500,30]]));}
  else if(ctx.includes('total')){label='Total cholesterol';score=clamp(interp(v,[[120,98],[180,96],[199,90],[239,70],[300,45],[350,30]]));}
  if(score==null)return{key:'lipids',label:'Blood Lipids',score:null,confidence:0,status:'NO_DATA',explanation:'Cholesterol is present, but subtype must be identified as LDL, HDL, triglycerides or total cholesterol.',source:'Vitals / Lab results'};
  return{key:'lipids',label:'Blood Lipids',score,confidence:fresh(r.measuredAt,180,365),status:status(score),value:`${label}: ${v} ${r.unit||'mg/dL'}`,measuredAt:r.measuredAt,explanation:`Latest structured ${label.toLowerCase()} result.`,source:'Vitals / Lab results'};
}

function activityComponent(l:LifestyleRow|null):Component{
  if(!l||(l.moderateActivityMinWeek==null&&l.vigorousActivityMinWeek==null))return{key:'activity',label:'Physical Activity',score:null,confidence:0,status:'NO_DATA',explanation:'Weekly activity is required; zero is a valid answer.',source:'Lifestyle assessment'};
  const eq=(l.moderateActivityMinWeek??0)+2*(l.vigorousActivityMinWeek??0);const score=clamp(interp(eq,[[0,40],[30,55],[75,72],[150,90],[225,97],[300,100],[450,100]]));
  return{key:'activity',label:'Physical Activity',score,confidence:fresh(l.updatedAt,30,120),status:status(score),value:`${l.moderateActivityMinWeek??0} min moderate + ${l.vigorousActivityMinWeek??0} min vigorous/week`,measuredAt:l.updatedAt,explanation:'Uses weekly moderate-equivalent activity; regular activity below target still receives partial credit rather than an all-or-none grade.',source:'Lifestyle assessment'};
}
function tobaccoComponent(l:LifestyleRow|null):Component{const t=l?.tobaccoStatus;if(!t)return{key:'tobacco',label:'Tobacco Exposure',score:null,confidence:0,status:'NO_DATA',explanation:'Tobacco status is required and includes smoked and smokeless exposure.',source:'Lifestyle assessment'};const score=t==='NEVER'?100:t==='FORMER'?82:t==='SECONDHAND'?65:t==='CURRENT'?35:null;if(score==null)return{key:'tobacco',label:'Tobacco Exposure',score:null,confidence:0,status:'NO_DATA',explanation:'Tobacco status is not interpretable.',source:'Lifestyle assessment'};return{key:'tobacco',label:'Tobacco Exposure',score,confidence:fresh(l!.updatedAt,90,365),status:status(score),value:t,measuredAt:l!.updatedAt,explanation:'Current tobacco use is a major modifiable risk factor. HealthConnect includes smoked and smokeless tobacco in the patient assessment.',source:'Lifestyle assessment'};}
function dietComponent(l:LifestyleRow|null):Component{const v=l?.fruitVegServingsDay;if(v==null)return{key:'diet',label:'Diet Indicator',score:null,confidence:0,status:'NO_DATA',explanation:'Optional limited diet proxy; a fuller India-adapted diet assessment can be added later.',source:'Lifestyle assessment'};const score=clamp(interp(v,[[0,45],[1,55],[2,65],[3,78],[4,90],[5,98],[7,100]]));return{key:'diet',label:'Diet Indicator',score,confidence:fresh(l!.updatedAt,30,120),status:status(score),value:`${v} fruit/vegetable servings/day`,measuredAt:l!.updatedAt,explanation:'A limited nutrition proxy only; it does not claim to represent complete diet quality.',source:'Lifestyle assessment'};}
function sleepComponent(l:LifestyleRow|null):Component{const h=l?.sleepHoursAvg;if(h==null)return{key:'sleep',label:'Sleep Duration',score:null,confidence:0,status:'NO_DATA',explanation:'Average nightly sleep duration is required.',source:'Lifestyle assessment'};const score=clamp(interp(h,[[3,35],[5,55],[6,78],[7,95],[7.5,100],[8.5,100],[9,96],[10,78],[11,55],[13,35]]));return{key:'sleep',label:'Sleep Duration',score,confidence:fresh(l!.updatedAt,30,120),status:status(score),value:`${h.toFixed(1)} hours/night`,measuredAt:l!.updatedAt,explanation:'Scores sleep duration progressively around the commonly recommended adult range while acknowledging individual variation.',source:'Lifestyle assessment'};}

function symptomComponent(rows:any[],alerts:HealthAlert[]):Component{
  if(!rows.length)return{key:'symptoms',label:'Symptoms & Function',score:null,confidence:0,status:'NOT_APPLICABLE',applicable:false,explanation:'No recent symptom-tracking data; absence of logs is not treated as perfect health.',source:'Symptom tracker'};
  const unresolved=rows.filter(s=>!s.resolvedAt),avg=rows.reduce((s,r)=>s+r.severity,0)/rows.length,severe=unresolved.filter(s=>s.severity>=8);const score=clamp(Math.max(30,100-(avg*6+unresolved.length*3+Math.min(20,rows.length*1.5))));
  if(severe.length)alerts.push({severity:'WARNING',code:'SEVERE_UNRESOLVED_SYMPTOMS',title:'Severe unresolved symptoms recorded',message:'One or more recent symptoms are rated 8/10 or higher and remain unresolved.',domain:'symptoms_function',observedAt:severe[0].loggedAt});
  return{key:'symptoms',label:'Symptoms & Function',score,confidence:fresh(rows[0].loggedAt,7,30),status:status(score),value:`${rows.length} logs · ${unresolved.length} unresolved · avg ${avg.toFixed(1)}/10`,measuredAt:rows[0].loggedAt,explanation:'Uses recent severity and unresolved burden; missing symptom tracking never earns healthy points.',source:'Symptom tracker'};
}

const freqPerDay=(f:string):number|null=>({ONCE_DAILY:1,TWICE_DAILY:2,THREE_TIMES_DAILY:3,FOUR_TIMES_DAILY:4,WEEKLY:1/7,BIWEEKLY:1/14,MONTHLY:1/30} as Record<string,number>)[f]??null;
async function treatmentComponent(patientId:string,l:LifestyleRow|null,meds:any[]):Promise<Component>{
  const declared=l?.medicationStatus,active=meds.filter(m=>m.status==='ACTIVE');
  if(declared==='NONE'&&active.length===0)return{key:'treatment',label:'Treatment & Medication',score:null,confidence:100,status:'NOT_APPLICABLE',applicable:false,value:'No regular medication prescribed',explanation:'No medication is required, so adherence is N/A — neither a penalty nor an artificial perfect score.',source:'Patient declaration + medication list'};
  if(declared==='NONE'&&active.length>0)return{key:'treatment',label:'Treatment & Medication',score:null,confidence:0,status:'NO_DATA',explanation:'Patient reports no regular medication, but active medicines exist. Reconcile the medication list.',source:'Patient declaration + medication list'};
  if(!declared||declared==='UNKNOWN')return{key:'treatment',label:'Treatment & Medication',score:null,confidence:0,status:'NO_DATA',explanation:'Confirm whether regular prescribed medication is currently required.',source:'Patient declaration'};
  if(declared==='TAKING_PRESCRIBED'&&!active.length)return{key:'treatment',label:'Treatment & Medication',score:null,confidence:0,status:'NO_DATA',explanation:'Patient reports regular medication but no active medication is recorded.',source:'Patient declaration + medication list'};
  if(!l?.medicationTrackingStartedAt)return{key:'treatment',label:'Treatment & Medication',score:null,confidence:20,status:'ESTABLISHING',explanation:'Medication tracking has not started; historical absence of logs is never scored as 0% adherence.',source:'Medication tracking'};
  const trackingAge=(Date.now()-l.medicationTrackingStartedAt.getTime())/DAY;if(trackingAge<7)return{key:'treatment',label:'Treatment & Medication',score:null,confidence:clamp(trackingAge/7*50),status:'ESTABLISHING',value:`Tracking for ${Math.max(0,Math.floor(trackingAge))} day(s)`,explanation:'At least 7 days of tracking are required before adherence contributes.',source:'Medication tracking'};
  const start=new Date(Math.max(daysAgo(30).getTime(),l.medicationTrackingStartedAt.getTime())),end=new Date();let expected=0;
  for(const m of active){const per=freqPerDay(m.frequency);if(per==null)continue;const s=Math.max(start.getTime(),m.startDate.getTime()),e=m.endDate?Math.min(end.getTime(),m.endDate.getTime()):end.getTime();if(e>=s)expected+=Math.max(0,Math.round((((e-s)/DAY)+1)*per));}
  if(!expected)return{key:'treatment',label:'Treatment & Medication',score:null,confidence:100,status:'NOT_APPLICABLE',applicable:false,explanation:'No schedulable regular regimen is available; PRN/custom medicines are not converted into missed doses.',source:'Medication schedule'};
  const taken=await prisma.medicationLog.count({where:{medication:{patientId},scheduledTime:{gte:start,lte:end},status:'taken'}});const pct=Math.min(100,taken/expected*100);const score=clamp(interp(pct,[[0,30],[40,45],[60,60],[75,75],[85,88],[95,98],[100,100]]));
  return{key:'treatment',label:'Treatment & Medication',score,confidence:90,status:status(score),value:`${taken}/${expected} expected doses logged as taken`,measuredAt:end,explanation:'Scores adherence only when treatment applies and sufficient tracking has been established.',source:'Medication schedule + dose logs'};
}

function conditionControl(conditions:any[],bp:Component,glucose:Component,bmi:Component):{component:Component;unsupported:string[]}{
  const supported:string[]=[];const parts:Array<{label:string;score:number;confidence:number}>=[];const unsupported:string[]=[];
  for(const c of conditions){const n=`${c.name}`.toLowerCase();if(/hypertension|high blood pressure/.test(n)){supported.push(c.name);if(bp.score!=null)parts.push({label:c.name,score:bp.score,confidence:bp.confidence});}
    else if(/diabetes|type 2 dm|type 1 dm/.test(n)){supported.push(c.name);if(glucose.score!=null)parts.push({label:c.name,score:glucose.score,confidence:glucose.confidence});}
    else if(/obesity/.test(n)){supported.push(c.name);if(bmi.score!=null)parts.push({label:c.name,score:bmi.score,confidence:bmi.confidence});}
    else unsupported.push(c.name);}
  if(!conditions.length)return{component:{key:'condition_control',label:'Known Condition Control',score:null,confidence:100,status:'NOT_APPLICABLE',applicable:false,value:'No recorded chronic condition',explanation:'No known chronic condition is recorded; this domain is N/A rather than receiving bonus points.',source:'Medical history'},unsupported};
  if(!parts.length)return{component:{key:'condition_control',label:'Known Condition Control',score:null,confidence:25,status:'ESTABLISHING',value:`${conditions.length} recorded condition${conditions.length===1?'':'s'}`,explanation:'HealthConnect does not invent a control score for conditions without a disease-specific measurable model. Treatment, symptoms and functional impact remain assessed separately.',source:'Medical history'},unsupported};
  const score=clamp(parts.reduce((s,p)=>s+p.score,0)/parts.length),confidence=clamp(parts.reduce((s,p)=>s+p.confidence,0)/parts.length);
  return{component:{key:'condition_control',label:'Known Condition Control',score,confidence,status:status(score),value:`${parts.length} supported control measure${parts.length===1?'':'s'}`,explanation:`Uses disease-specific measurable control for ${parts.map(p=>p.label).join(', ')}. Unsupported conditions are disclosed separately and never receive an invented score.`,source:'Medical history + disease-specific measurements'},unsupported};
}

function compose(key:DomainKey,label:string,parts:Array<{component:Component;weight:number}>,explanation:string):HealthDomain{
  const applicable=parts.filter(p=>p.component.applicable!==false);const score=weighted(applicable.map(p=>({score:p.component.score,weight:p.weight})));const confidence=weightedConfidence(applicable.map(p=>({score:p.component.score,confidence:p.component.confidence,weight:p.weight})));const isApplicable=applicable.length>0;
  let st:DomainStatus=status(score);if(!isApplicable)st='NOT_APPLICABLE';else if(score==null&&applicable.some(p=>p.component.status==='ESTABLISHING'))st='ESTABLISHING';
  return{key,label,weight:W[key],score,status:st,confidence,latestValue:applicable.find(p=>p.component.value)?.component.value??null,explanation,source:[...new Set(applicable.map(p=>p.component.source))].join(' + '),components:parts.map(p=>p.component),applicable:isApplicable};
}

function safety(vitals:any[],alerts:HealthAlert[]){const spo2=latest(vitals,'spo2'),sv=spo2?nval(spo2.value):null;if(spo2&&sv!=null&&sv<90)alerts.push({severity:'CRITICAL',code:'LOW_SPO2',title:'Low oxygen saturation recorded',message:'An SpO₂ below 90% can be clinically significant. Seek prompt medical assessment, particularly if symptomatic.',observedAt:spo2.measuredAt});else if(spo2&&sv!=null&&sv<94)alerts.push({severity:'WARNING',code:'LOW_SPO2',title:'Lower-than-expected oxygen saturation recorded',message:'Repeat the reading carefully and discuss persistent low values with a clinician.',observedAt:spo2.measuredAt});const hr=latest(vitals,'heart_rate'),hv=hr?nval(hr.value):null;if(hr&&hv!=null&&(hv<40||hv>140))alerts.push({severity:'WARNING',code:'EXTREME_HEART_RATE',title:'Unusual heart rate recorded',message:'A very low or very high resting heart rate may warrant clinical assessment, especially with symptoms.',observedAt:hr.measuredAt});}
const firstDegree=(r:string)=>/mother|father|parent|brother|sister|sibling|son|daughter|child/i.test(r);
function familyRisk(rows:any[]){const f=rows.filter(r=>firstDegree(r.relation));const has=(w:string[])=>f.some(r=>w.some(x=>`${r.conditionName}`.toLowerCase().includes(x)));const premature=f.some(r=>{const c=`${r.conditionName}`.toLowerCase();if(!/(heart|coronary|mi|myocardial|stroke|cardiovascular)/.test(c)||r.ageOfOnset==null)return false;const female=/mother|sister|daughter/.test(`${r.relation}`.toLowerCase());return r.ageOfOnset<(female?65:55);});return{firstDegreeCount:f.length,diabetes:has(['diabetes']),hypertension:has(['hypertension','high blood pressure']),cardiovascular:has(['heart','coronary','myocardial','cardiovascular']),stroke:has(['stroke']),kidney:has(['kidney','ckd','renal']),prematureCardiovascular:premature};}

function readiness(args:{age:number|null;gender:string|null;bp:Component;bmi:Component;life:LifestyleRow|null;conditions:any[];meds:any[];family:any[]}){const {age,gender,bp,bmi,life,conditions,meds,family}=args,active=meds.filter(m=>m.status==='ACTIVE');const rows=[
  {key:'age',label:'Age / date of birth',complete:age!=null,reason:'Add date of birth in Profile.'},{key:'sex',label:'Sex',complete:!!gender,reason:'Add sex in Profile for contextual interpretation.'},{key:'blood_pressure',label:'Blood pressure',complete:bp.score!=null,reason:'Log a recent blood-pressure reading.'},{key:'body_measurements',label:'Height + weight / BMI',complete:bmi.score!=null,reason:'Add height and log a recent weight.'},{key:'tobacco',label:'Tobacco status',complete:!!life?.tobaccoStatus,reason:'Confirm tobacco exposure.'},{key:'activity',label:'Physical activity',complete:life?.moderateActivityMinWeek!=null||life?.vigorousActivityMinWeek!=null,reason:'Enter weekly activity; zero is valid.'},{key:'sleep',label:'Sleep',complete:life?.sleepHoursAvg!=null,reason:'Enter average nightly sleep.'},{key:'conditions',label:'Known-condition declaration',complete:life?.conditionStatus==='NONE'?conditions.length===0:life?.conditionStatus==='KNOWN'?conditions.length>0:false,reason:'Confirm no known chronic condition or reconcile the recorded conditions.'},{key:'medications',label:'Medication-status declaration',complete:life?.medicationStatus==='NONE'?active.length===0:life?.medicationStatus==='TAKING_PRESCRIBED'?active.length>0:false,reason:'Confirm no regular medication or reconcile the active medication list.'},{key:'family_history',label:'Family-history declaration',complete:life?.familyHistoryStatus==='NONE'?family.length===0:life?.familyHistoryStatus==='RECORDED'?family.length>0:false,reason:'Confirm no known family history or record known family conditions.'},
];return{items:rows,complete:rows.every(r=>r.complete),completed:rows.filter(r=>r.complete).length,total:rows.length,percent:Math.round(rows.filter(r=>r.complete).length/rows.length*100)};}

function riskContext(age:number|null,bmi:Component,conditions:any[],family:any[],glucose:Component,lipids:Component,life:LifestyleRow|null){const f=familyRisk(family),bmiN=Number(bmi.value?.match(/BMI\s+([0-9.]+)/)?.[1]??NaN),diabetes=hasCondition(conditions,['diabetes','type 2 dm','type 1 dm']),cvd=hasCondition(conditions,['coronary','heart disease','stroke','cardiovascular','ckd','kidney']);const recs:Array<{code:string;priority:'CORE'|'RECOMMENDED';message:string}>=[];if((age??0)>=30&&glucose.score==null)recs.push({code:'INDIA_NCD_GLUCOSE_SCREENING',priority:'CORE',message:'Age 30+ increases the importance of current diabetes screening in the Indian primary-care context.'});if(Number.isFinite(bmiN)&&bmiN>=23&&glucose.score==null)recs.push({code:'SOUTH_ASIAN_BMI_GLUCOSE_SCREENING',priority:'CORE',message:'BMI is at a South-Asian metabolic-risk action point; current glucose/HbA1c screening is important.'});if(f.diabetes&&glucose.score==null)recs.push({code:'FAMILY_DIABETES_SCREENING',priority:'CORE',message:'First-degree family history of diabetes increases the importance of current glucose screening.'});if(diabetes&&glucose.score==null)recs.push({code:'DIABETES_CONTROL_DATA_DUE',priority:'CORE',message:'Known diabetes requires current HbA1c/glucose data to assess control.'});if(((age??0)>=40||cvd||f.prematureCardiovascular||life?.tobaccoStatus==='CURRENT')&&lipids.score==null)recs.push({code:'LIPID_ASSESSMENT_RECOMMENDED',priority:'RECOMMENDED',message:'Cardiovascular risk context supports adding a structured lipid profile.'});return{ageYears:age,ageBand:age==null?'UNKNOWN':age<30?'UNDER_30':age<40?'30_39':age<50?'40_49':age<60?'50_59':'60_PLUS',familyHistory:f,screeningRecommendations:recs};}

export async function getHealthScoreHistory(patientId:string,limit=12){const safe=Math.min(50,Math.max(1,Math.floor(limit)));return prisma.$queryRaw<Array<{score:number|null;status:string;confidence:number;algorithmVersion:string;calculatedAt:Date}>>`SELECT "score","status","confidence","algorithmVersion","calculatedAt" FROM "health_score_snapshots" WHERE "patientId"=${patientId} ORDER BY "calculatedAt" DESC LIMIT ${safe}`;}

export async function calculateHealthScore(patientId:string,options:{persistSnapshot?:boolean}={}):Promise<any>{
  const patient=await prisma.patientProfile.findUnique({where:{id:patientId},select:{id:true,dateOfBirth:true,gender:true}});if(!patient)throw new Error('Patient profile not found');
  const [vitals,life,conditions,meds,symptoms,family]=await Promise.all([prisma.vital.findMany({where:{patientId},orderBy:{measuredAt:'desc'},take:300}),lifestyle(patientId).catch(()=>null),prisma.condition.findMany({where:{patientId},select:{name:true,status:true,updatedAt:true}}),prisma.medication.findMany({where:{patientId},select:{id:true,status:true,frequency:true,startDate:true,endDate:true}}),prisma.symptomLog.findMany({where:{patientId,loggedAt:{gte:daysAgo(30)}},orderBy:{loggedAt:'desc'}}),prisma.familyHistory.findMany({where:{patientId},select:{relation:true,conditionName:true,ageOfOnset:true,status:true}})]);
  const alerts:HealthAlert[]=[];safety(vitals,alerts);const bp=bpComponent(vitals,alerts),bmi=bmiComponent(vitals,life),waist=waistComponent(life,patient.gender??null),glucose=glucoseComponent(vitals,conditions,alerts),lipids=lipidComponent(vitals,alerts),activity=activityComponent(life),tobacco=tobaccoComponent(life),diet=dietComponent(life),sleep=sleepComponent(life),treatment=await treatmentComponent(patientId,life,meds),symptomsComp=symptomComponent(symptoms,alerts),conditionResult=conditionControl(conditions,bp,glucose,bmi),condition=conditionResult.component;
  const cardio=compose('cardiovascular','Cardiovascular Health',[{component:bp,weight:75},{component:lipids,weight:25}],'Prioritizes blood-pressure control; lipids improve cardiovascular assessment when structured data are available. Heart rate and SpO₂ remain safety signals rather than arbitrary wellness points.');
  const metabolic=compose('metabolic_body','Metabolic & Body Health',[{component:bmi,weight:50},{component:glucose,weight:35},{component:waist,weight:15}],'Combines BMI, metabolic data and optional waist circumference. Missing optional measures reduce confidence, not health points.');
  const lifeDomain=compose('lifestyle','Lifestyle Health',[{component:tobacco,weight:50},{component:activity,weight:35},{component:diet,weight:15}],'Emphasizes tobacco and physical activity; diet remains a limited proxy until a fuller India-adapted dietary assessment is available.');
  const sleepDomain=compose('sleep_recovery','Sleep & Recovery',[{component:sleep,weight:100}],'Uses average sleep duration as the current measurable recovery input.');
  const conditionDomain=compose('condition_control','Known Condition Control',[{component:condition,weight:100}],'Only disease-specific measurable control is scored. Unsupported diseases remain visible as assessment limitations.');
  const treatmentDomain=compose('treatment_care','Treatment & Care',[{component:treatment,weight:100}],'Medication adherence applies only when regular treatment is actually prescribed and tracking has been established.');
  const symptomDomain=compose('symptoms_function','Symptoms & Function',[{component:symptomsComp,weight:100}],'Recent symptom burden contributes only when symptom-tracking data exist.');const domains=[cardio,metabolic,lifeDomain,sleepDomain,conditionDomain,treatmentDomain,symptomDomain];
  const age=ageYears(patient.dateOfBirth),ready=readiness({age,gender:patient.gender??null,bp,bmi,life,conditions,meds,family}),risk=riskContext(age,bmi,conditions,family,glucose,lipids,life);
  const limitations:Limitation[]=[];if(conditionResult.unsupported.length)limitations.push({code:'UNSUPPORTED_CONDITION_CONTROL',title:'Some conditions are not numerically scored',message:`Disease-specific automated control scoring is not yet available for: ${conditionResult.unsupported.join(', ')}. These conditions remain in medical context; treatment adherence and symptoms are assessed separately.`,severity:'IMPORTANT'});
  const scoreable=domains.filter(d=>d.applicable&&d.score!=null),scoreWeight=scoreable.reduce((s,d)=>s+d.weight,0),raw=scoreWeight?Math.round(scoreable.reduce((s,d)=>s+(d.score as number)*d.weight,0)/scoreWeight):null,score=ready.complete?raw:null;
  let confidence=clamp(domains.reduce((s,d)=>s+d.weight*d.confidence,0)/100*(ready.percent/100));if(risk.screeningRecommendations.some((r:any)=>r.priority==='CORE'))confidence=Math.min(confidence,75);if(conditionResult.unsupported.length)confidence=Math.min(confidence,80);
  const calculatedAt=new Date(),history=await getHealthScoreHistory(patientId,12).catch(()=>[]),prev=history.find(h=>h.score!=null&&h.algorithmVersion===HEALTH_SCORE_ALGORITHM_VERSION),delta=score!=null&&prev?.score!=null?score-prev.score:null,trend=delta==null?'UNKNOWN':delta>=3?'IMPROVING':delta<=-3?'WORSENING':'STABLE';
  const missingData=[...ready.items.filter(r=>!r.complete).map(r=>({key:r.key,label:r.label,reason:r.reason,priority:'MANDATORY'})),...risk.screeningRecommendations.map((r:any)=>({key:r.code,label:r.code.replace(/_/g,' '),reason:r.message,priority:r.priority==='CORE'?'CONDITIONAL':'OPTIONAL'}))];
  const recommendations:string[]=[];if(!ready.complete)recommendations.push(`Complete the core health assessment: ${ready.completed}/${ready.total} required areas are complete.`);if(alerts.some(a=>a.severity==='CRITICAL'))recommendations.push('A critical alert is present. Do not use the overall Health Score to dismiss an urgent finding.');domains.filter(d=>d.score!=null&&d.score<70).sort((a,b)=>(a.score??0)-(b.score??0)).slice(0,3).forEach(d=>recommendations.push(`Focus on ${d.label.toLowerCase()}: ${d.explanation}`));risk.screeningRecommendations.slice(0,3).forEach((r:any)=>recommendations.push(r.message));
  if(score!=null){const legacyLifestyle=weighted([{score:lifeDomain.score,weight:60},{score:sleepDomain.score,weight:40}])??0;await prisma.healthScore.upsert({where:{patientId},create:{patientId,score,medicationAdherence:treatment.score??0,symptomFrequency:symptomsComp.score??0,appointmentRegularity:0,lifestyleFactors:legacyLifestyle},update:{score,medicationAdherence:treatment.score??0,symptomFrequency:symptomsComp.score??0,appointmentRegularity:0,lifestyleFactors:legacyLifestyle,calculatedAt}});}
  const result={score,status:overall(score),confidence,dataCoverage:scoreWeight,algorithmVersion:HEALTH_SCORE_ALGORITHM_VERSION,calculatedAt,trend,delta,assessmentReadiness:ready,assessmentLevel:ready.complete?(risk.screeningRecommendations.some((r:any)=>r.priority==='CORE')?'CORE_COMPLETE_SCREENING_DUE':'COMPREHENSIVE'):'INCOMPLETE',riskContext:risk,hasCriticalAlert:alerts.some(a=>a.severity==='CRITICAL'),domains,alerts,limitations,missingData,recommendations,history:history.map(h=>({score:h.score,status:h.status,confidence:h.confidence,algorithmVersion:h.algorithmVersion,date:h.calculatedAt})),medicationAdherence:treatment.score??0,symptomFrequency:symptomsComp.score??0,appointmentRegularity:0,lifestyleFactors:lifeDomain.score??0};
  if(options.persistSnapshot)await prisma.$executeRaw`INSERT INTO "health_score_snapshots" ("patientId","score","status","confidence","algorithmVersion","domains","alerts","missingData","calculatedAt") VALUES (${patientId},${score},${result.status},${confidence},${HEALTH_SCORE_ALGORITHM_VERSION},CAST(${JSON.stringify(domains)} AS jsonb),CAST(${JSON.stringify(alerts)} AS jsonb),CAST(${JSON.stringify(missingData)} AS jsonb),${calculatedAt})`;
  return result;
}
export const getHealthScore=(patientId:string)=>calculateHealthScore(patientId,{persistSnapshot:false});
export const refreshHealthScore=(patientId:string)=>calculateHealthScore(patientId,{persistSnapshot:true});
