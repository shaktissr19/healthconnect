'use client';
// src/app/doctors/page.tsx
// ══════════════════════════════════════════════════════════════════════════
// Doctor Dictionary — Full search, filter, tile/list view, doctor profiles
// Phase 1: All bugs fixed + correct API field mapping
// Phase 2: Light theme redesign, hero with live stats + dynamic testimonials
//          Left sidebar, tile/list toggle, sub-specializations
// Phase 3: Doctor profile modal with teleconsult, booking flow
// API: GET /public/doctors?search=&specialty=&city=&sort=&page=&limit=
//      GET /public/doctors/:id
//      GET /public/stats
// ══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore }   from '@/store/uiStore';
import { authAPI }      from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.healthconnect.sbs/api/v1';

// ── getDashboardRoute (same as landing page) ──────────────────────────────
function getDashboardRoute(role?: string) {
  switch ((role ?? '').toUpperCase()) {
    case 'ADMIN':    return '/admin-dashboard';
    case 'DOCTOR':   return '/doctor-dashboard';
    case 'HOSPITAL': return '/hospital-dashboard';
    default:         return '/dashboard';
  }
}

// ── Design tokens — Deep Blue + Teal (Communities-matched theme) ──────────
// Hero: navy-to-blue-teal like communities hero (#0D1B4B style)
// Cards: white on #F0F4FF page — crisp, high contrast
// All text passes WCAG AA on their respective backgrounds
const C = {
  // Page background — very light blue (same family as communities light sections)
  pageBg:        '#F0F4FF',
  sidebarBg:     '#FFFFFF',
  // Hero — deep navy blue shifting to teal (inspired by reference images 3/4/5)
  heroBg:        'linear-gradient(135deg,#0D1B4B 0%,#0C3460 30%,#0A4080 60%,#0C6B82 85%,#0D9488 100%)',
  // Carousel card — semi-opaque white, readable against hero
  heroCard:      'rgba(255,255,255,0.16)',
  heroCardBorder:'rgba(255,255,255,0.35)',
  // Doctor cards — pure white, strong borders
  cardBg:        '#FFFFFF',
  cardBgHov:     '#F5F8FF',
  cardBorder:    '#C7D7F5',
  cardBorderHov: '#2563EB',
  surfaceBg:     '#F0F4FF',
  // Primary teal
  teal:          '#0D9488',
  tealLight:     '#14B8A6',
  tealBg:        'rgba(13,148,136,0.09)',
  tealBorder:    'rgba(13,148,136,0.30)',
  tealGlow:      'rgba(13,148,136,0.18)',
  tealDark:      '#0F766E',
  // Blue accent
  blue:          '#2563EB',
  blueLight:     '#3B82F6',
  blueBg:        'rgba(37,99,235,0.08)',
  blueBorder:    'rgba(37,99,235,0.25)',
  // Text — all high contrast on white/light backgrounds
  textPrimary:   '#0C1A3A',   // near-black navy: contrast 15:1 on white
  textSecondary: '#1E3A6E',   // dark navy blue: contrast 9:1 on white
  textMuted:     '#4A5E7A',   // medium slate: contrast 5.5:1 on white
  textLight:     '#7A8FA8',   // light slate: for deemphasised text only
  // Status colours
  green:         '#15803D',
  greenBg:       'rgba(21,128,61,0.09)',
  greenBorder:   'rgba(21,128,61,0.28)',
  amber:         '#B45309',
  amberBg:       'rgba(180,83,9,0.08)',
  rose:          '#BE123C',
  violet:        '#6D28D9',
  violetBg:      'rgba(109,40,217,0.09)',
  // Layout
  navBg:         '#0A1628',
  borderLight:   '#C7D7F5',
  inputBg:       '#FFFFFF',
  inputBorder:   '#A8C0E8',
  shadow:        '0 2px 14px rgba(12,26,58,0.08)',
  shadowHov:     '0 8px 32px rgba(12,26,58,0.15)',
  chipBg:        '#EBF0FF',
  chipBorder:    '#A8C0E8',
  pillBg:        'rgba(37,99,235,0.10)',
};

// ── Specialties — covers all seed data spellings (British + American) ──────
const SPECIALTIES = [
  { label:'All',                  value:'',                       emoji:'🏥', group:'All' },
  { label:'General Physician',    value:'General Physician',      emoji:'🩺', group:'Primary' },
  { label:'Cardiologist',         value:'Cardiologist',           emoji:'❤️', group:'Heart & Vascular' },
  { label:'Neurologist',          value:'Neurologist',            emoji:'🧠', group:'Brain & Nerves' },
  { label:'Psychiatrist',         value:'Psychiatrist',           emoji:'🧘', group:'Brain & Nerves' },
  { label:'Dermatologist',        value:'Dermatologist',          emoji:'🧴', group:'Skin' },
  { label:'Gynaecologist',        value:'Gynaecologist',          emoji:'🌸', group:"Women's Health" },
  { label:'Diabetologist',        value:'Diabetologist',          emoji:'🩸', group:'Hormones & Metabolism' },
  { label:'Endocrinologist',      value:'Endocrinologist',        emoji:'🔬', group:'Hormones & Metabolism' },
  { label:'Gastroenterologist',   value:'Gastroenterologist',     emoji:'🫀', group:'Digestive' },
  { label:'Nephrologist',         value:'Nephrologist',           emoji:'🫘', group:'Kidney & Urinary' },
  { label:'Urologist',            value:'Urologist',              emoji:'🏃', group:'Kidney & Urinary' },
  { label:'Pulmonologist',        value:'Pulmonologist',          emoji:'🫁', group:'Respiratory' },
  { label:'Orthopaedic Surgeon',  value:'Orthopaedic',            emoji:'🦴', group:'Bones & Joints' },
  { label:'Rheumatologist',       value:'Rheumatologist',         emoji:'🦾', group:'Bones & Joints' },
  { label:'Ophthalmologist',      value:'Ophthalmologist',        emoji:'👁️', group:'Eye, Ear & Throat' },
  { label:'ENT Specialist',       value:'ENT',                    emoji:'👂', group:'Eye, Ear & Throat' },
  { label:'Paediatrician',        value:'Paediatrician',          emoji:'👶', group:'Children' },
  { label:'Oncologist',           value:'Oncologist',             emoji:'🎗️', group:'Cancer Care' },
  { label:'Haematologist',        value:'Haematologist',          emoji:'🧬', group:'Cancer Care' },
  { label:'Physiotherapist',      value:'Physiotherapist',        emoji:'💪', group:'Rehabilitation' },
  { label:'Nutritionist',         value:'Nutritionist',           emoji:'🥗', group:'Rehabilitation' },
];

// Spec groups for sidebar
const SPEC_GROUPS = [
  { group:'Primary',              specs:['General Physician'] },
  { group:'Heart & Vascular',     specs:['Cardiologist'] },
  { group:'Brain & Nerves',       specs:['Neurologist','Psychiatrist'] },
  { group:'Skin',                 specs:['Dermatologist'] },
  { group:"Women's Health",       specs:['Gynaecologist'] },
  { group:'Hormones & Metabolism',specs:['Diabetologist','Endocrinologist'] },
  { group:'Digestive',            specs:['Gastroenterologist'] },
  { group:'Kidney & Urinary',     specs:['Nephrologist','Urologist'] },
  { group:'Respiratory',          specs:['Pulmonologist'] },
  { group:'Bones & Joints',       specs:['Orthopaedic','Rheumatologist'] },
  { group:'Eye, Ear & Throat',    specs:['Ophthalmologist','ENT'] },
  { group:'Children',             specs:['Paediatrician'] },
  { group:'Cancer Care',          specs:['Oncologist','Haematologist'] },
  { group:'Rehabilitation',       specs:['Physiotherapist','Nutritionist'] },
];

// Normalize spec value for matching — handles British/American spelling
function normalizeSpec(s: string): string {
  return s.toLowerCase()
    .replace('gynaecologist','gynaecologist').replace('gynecologist','gynaecologist')
    .replace('paediatrician','paediatrician').replace('pediatrician','paediatrician')
    .replace('orthopaedic','orthopaedic').replace('orthopedic','orthopaedic')
    .replace('haematologist','haematologist').replace('hematologist','haematologist');
}

const CITIES = [
  'All Cities','Delhi','Mumbai','Bengaluru','Chennai','Hyderabad',
  'Pune','Kolkata','Ahmedabad','Jaipur','Lucknow','Chandigarh',
  'Kochi','Thiruvananthapuram','Kozhikode','Bhopal','Indore',
  'Nagpur','Surat','Noida','Gurugram','Agra','Varanasi','Patna',
];

const FEE_RANGES = [
  { label:'Any Fee',        value:'',            min:0,    max:99999 },
  { label:'Free',           value:'free',        min:0,    max:0     },
  { label:'Under ₹500',     value:'under500',    min:1,    max:499   },
  { label:'₹500 – ₹1,000',  value:'500to1000',   min:500,  max:1000  },
  { label:'₹1,000 – ₹1,500',value:'1000to1500',  min:1001, max:1500  },
  { label:'Above ₹1,500',   value:'above1500',   min:1501, max:99999 },
];

const EXP_RANGES = [
  { label:'Any Experience', value:'' },
  { label:'0–5 years',      value:'0-5',   min:0,  max:5  },
  { label:'5–10 years',     value:'5-10',  min:5,  max:10 },
  { label:'10–15 years',    value:'10-15', min:10, max:15 },
  { label:'15+ years',      value:'15+',   min:15, max:99 },
];

const LANGUAGES = [
  'All Languages','Hindi','English','Tamil','Telugu','Kannada',
  'Malayalam','Bengali','Marathi','Gujarati','Punjabi','Odia',
];

const SORT_OPTIONS = [
  { label:'★ Highest Rated',    value:'rating' },
  { label:'📝 Most Reviewed',   value:'reviews' },
  { label:'🏥 Most Experienced',value:'experience' },
  { label:'₹ Lowest Fee',       value:'fee_asc' },
  { label:'🆕 Newest',          value:'newest' },
];

const GRAD_COLORS = [
  ['#0D9488','#7C3AED'], ['#0D9488','#1D4ED8'], ['#14B8A6','#6D28D9'],
  ['#0F766E','#14B8A6'], ['#0D9488','#DB2777'], ['#7C3AED','#14B8A6'],
  ['#059669','#0D9488'], ['#0369A1','#0D9488'], ['#D97706','#B45309'],
  ['#DC2626','#0D9488'],
];

// ── normalizeDoctor — correct field mapping to match seed/Prisma schema ─────
function normalizeDoctor(d: any, idx: number) {
  const firstName = d.firstName ?? '';
  const lastName  = d.lastName ?? '';
  const fullName  = (d.name ?? `${firstName} ${lastName}`.trim()) || 'Dr. Unknown';
  const name      = fullName.startsWith('Dr.') ? fullName : `Dr. ${fullName}`;

  const parts = name.replace('Dr.','').trim().split(' ');
  const initials = parts.length >= 2
    ? (parts[0][0] ?? '') + (parts[1][0] ?? '')
    : (parts[0]?.slice(0,2) ?? 'DR');

  return {
    id:                    d.id ?? String(idx),
    name,
    initials:              initials.toUpperCase(),
    hcId:                  d.hcDoctorId ?? d.registrationId ?? d.hcdId ?? d.doctorId ?? '',
    specialization:        d.specialization ?? d.specialty ?? 'General Physician',
    subSpecializations:    Array.isArray(d.subSpecializations) ? d.subSpecializations : [],
    qualification:         Array.isArray(d.qualification) ? d.qualification : (d.qualification ? [d.qualification] : (d.education ? [d.education] : [])),
    hospital:              d.clinicName ?? d.hospitalName ?? d.hospital ?? '',
    clinicAddress:         d.clinicAddress ?? d.addr ?? d.address ?? '',
    city:                  d.city ?? '',
    state:                 d.state ?? '',
    pincode:               d.pinCode ?? d.pincode ?? d.zip ?? '',
    experience:            Number(d.experienceYears ?? d.experience ?? 0) || null,
    languages:             Array.isArray(d.languagesSpoken) ? d.languagesSpoken : (Array.isArray(d.languages) ? d.languages : []),
    rating:                parseFloat((d.averageRating ?? d.rating ?? 4.5).toString()),
    reviews:               Number(d.totalReviews ?? d.reviews ?? 0),
    totalPatients:         Number(d.totalPatients ?? d.appointmentCount ?? 0),
    isAvailable:           !!(d.isAvailableOnline ?? d.isAvailable ?? false),
    isAcceptingNew:        d.isAcceptingNewPatients !== false,
    fee:                   Number(d.consultationFee ?? d.fee ?? 0) || null,
    teleconsultFee:        Number(d.teleconsultFee ?? d.teleConsultFee ?? 0) || null,
    videoConsultFee:       Number(d.videoConsultFee ?? 0) || null,
    audioConsultFee:       Number(d.audioConsultFee ?? 0) || null,
    offersVideo:           !!(d.offersVideoConsult ?? false),
    offersAudio:           !!(d.offersAudioConsult ?? false),
    offersChat:            !!(d.offersChatConsult ?? false),
    offersInPerson:        d.offersInPerson !== false,
    videoPlatform:         d.videoPlatform ?? null,
    about:                 d.bio ?? d.about ?? '',
    careerJourney:         d.careerJourney ?? '',
    trainingHospitals:     Array.isArray(d.trainingHospitals) ? d.trainingHospitals : [],
    hospitalAffiliations:  Array.isArray(d.hospitalAffiliations) ? d.hospitalAffiliations : [],
    awards:                Array.isArray(d.awards) ? d.awards : [],
    publications:          Number(d.publications ?? 0) || null,
    medicalCouncil:        d.medicalCouncil ?? '',
    registrationYear:      Number(d.registrationYear ?? 0) || null,
    availabilitySchedule:  d.availabilitySchedule ?? null,
    nextAvailableSlot:     d.nextAvailableSlot ?? null,
    featuredReview:        d.featuredReview ?? '',
    featuredPatientName:   d.featuredPatientName ?? '',
    recentReviews:         Array.isArray(d.recentReviews) ? d.recentReviews : [],
    isVerified:            d.isVerified !== false,
    gender:                d.gender ?? '',
    licenseNumber:         d.medicalLicenseNumber ?? d.licenseNumber ?? '',
    gradIndex:             idx % GRAD_COLORS.length,
  };
}

type Doctor = ReturnType<typeof normalizeDoctor>;

// ── Seed-quality fallback doctors ─────────────────────────────────────────
// Default values for new fields — fallback data predates new schema fields
const FB_DEFAULTS = {
  isAcceptingNew: true, videoConsultFee: null, audioConsultFee: null,
  offersVideo: false, offersAudio: false, offersChat: false, offersInPerson: true,
  videoPlatform: null, careerJourney: '', trainingHospitals: [], hospitalAffiliations: [],
  awards: [], publications: null, medicalCouncil: '', registrationYear: null,
  availabilitySchedule: null, nextAvailableSlot: null, profileViews: 0,
  avgResponseTimeMin: null, featuredReview: '', featuredPatientName: '',
  profileScore: 80, isProfileComplete: true, recentReviews: [],
};
const FALLBACK: Doctor[] = ([
  { id:'f01', name:'Dr. Priya Mehta',      initials:'PM', hcId:'HC-D-S002', specialization:'Cardiologist',       subSpecializations:['Interventional Cardiology','Heart Failure'], qualification:['MBBS','MD Cardiology','DM Cardiology'], hospital:'Heart Care Clinic',            clinicAddress:'Dwarka Sector 12',             city:'Delhi',            state:'Delhi',        pincode:'110075', experience:14, languages:['Hindi','English','Gujarati'], rating:4.9, reviews:428, totalPatients:3100, isAvailable:true,  fee:1200, teleconsultFee:700,  about:'Interventional cardiologist specialising in stent procedures, PTCA and heart failure management. Trained at AIIMS Delhi.', isVerified:true, gender:'Female', licenseNumber:'DL-CARD-2010', gradIndex:0 },
  { id:'f02', name:'Dr. Arun Kumar',       initials:'AK', hcId:'HC-D-S001', specialization:'Diabetologist',      subSpecializations:['Endocrinology','Thyroid'],                  qualification:['MBBS','MD Internal Medicine','DM Endocrinology'], hospital:'Diabetes Care Centre',         clinicAddress:'Near Sakinaka Metro',          city:'Mumbai',           state:'Maharashtra',  pincode:'400072', experience:18, languages:['Hindi','English','Marathi'],  rating:4.8, reviews:312, totalPatients:2840, isAvailable:true,  fee:800,  teleconsultFee:500,  about:'Senior diabetologist with 18 years managing Type 1, Type 2, and gestational diabetes. Special interest in CGM and insulin pump therapy.', isVerified:true, gender:'Male',   licenseNumber:'MH-ENDO-2006', gradIndex:1 },
  { id:'f03', name:'Dr. Kavitha Iyer',     initials:'KI', hcId:'HC-D-S006', specialization:'Gynaecologist',      subSpecializations:['Obstetrics','PCOS','Infertility'],          qualification:['MBBS','MD Gynaecology','DNB'],                 hospital:'Women Wellness Clinic',        clinicAddress:'Anna Nagar',                   city:'Chennai',          state:'Tamil Nadu',   pincode:'600040', experience:13, languages:['Tamil','English','Hindi'],    rating:4.9, reviews:534, totalPatients:4200, isAvailable:true,  fee:900,  teleconsultFee:550,  about:'Experienced gynaecologist. Special interest in PCOS management, high-risk pregnancy, and minimally invasive surgery.', isVerified:true, gender:'Female', licenseNumber:'TN-GYN-2011',  gradIndex:4 },
  { id:'f04', name:'Dr. Rajesh Nair',      initials:'RN', hcId:'HC-D-S003', specialization:'Neurologist',        subSpecializations:['Epilepsy','Stroke','Headache'],             qualification:['MBBS','MD Neurology','DM Neurology'],          hospital:'Neuro Wellness Centre',        clinicAddress:'MG Road',                      city:'Kochi',            state:'Kerala',       pincode:'682015', experience:12, languages:['Malayalam','English','Hindi'],rating:4.7, reviews:198, totalPatients:1620, isAvailable:true,  fee:1000, teleconsultFee:600,  about:'Neurologist with expertise in epilepsy, stroke rehabilitation and headache disorders. Runs monthly free epilepsy clinic.', isVerified:true, gender:'Male',   licenseNumber:'KL-NEURO-2012',gradIndex:2 },
  { id:'f05', name:'Dr. Sunita Rao',       initials:'SR', hcId:'HC-D-S004', specialization:'Dermatologist',      subSpecializations:['Cosmetology','Psoriasis','Acne'],          qualification:['MBBS','MD Dermatology'],                       hospital:'Glow Skin Clinic',             clinicAddress:'Koramangala 5th Block',        city:'Bengaluru',        state:'Karnataka',    pincode:'560095', experience:9,  languages:['Kannada','English','Hindi'],  rating:4.6, reviews:267, totalPatients:2100, isAvailable:true,  fee:700,  teleconsultFee:450,  about:'Dermatologist and cosmetologist with expertise in medical and aesthetic dermatology. Special interest in psoriasis and vitiligo.', isVerified:true, gender:'Female', licenseNumber:'KA-DERM-2015', gradIndex:3 },
  { id:'f06', name:'Dr. Prakash Thakur',   initials:'PT', hcId:'HC-D-S025', specialization:'Cardiologist',       subSpecializations:['Cardiac Electrophysiology','Pacemaker'],   qualification:['MBBS','DM Cardiology','Fellowship EP'],        hospital:'Rhythm Heart Care',            clinicAddress:'Churchgate',                   city:'Mumbai',           state:'Maharashtra',  pincode:'400020', experience:20, languages:['Marathi','Hindi','English'],  rating:4.9, reviews:456, totalPatients:3600, isAvailable:true,  fee:1400, teleconsultFee:800,  about:'Senior electrophysiologist with 20 years experience. Expert in catheter ablation and pacemaker implantation.', isVerified:true, gender:'Male',   licenseNumber:'MH-CARD-2004', gradIndex:5 },
  { id:'f07', name:'Dr. Harish Menon',     initials:'HM', hcId:'HC-D-S009', specialization:'Gastroenterologist', subSpecializations:['IBD','Liver Disease','Endoscopy'],         qualification:['MBBS','MD Gastroenterology','DM'],             hospital:'GI Care Centre',               clinicAddress:'MG Road Ernakulam',            city:'Kochi',            state:'Kerala',       pincode:'682016', experience:10, languages:['Malayalam','English','Hindi'],rating:4.6, reviews:143, totalPatients:1120, isAvailable:true,  fee:950,  teleconsultFee:600,  about:'Gastroenterologist and hepatologist with expertise in IBD, liver cirrhosis and advanced endoscopic procedures.', isVerified:true, gender:'Male',   licenseNumber:'KL-GASTRO-2014',gradIndex:6 },
  { id:'f08', name:'Dr. Meena Sharma',     initials:'MS', hcId:'HC-D-S008', specialization:'Paediatrician',      subSpecializations:['Neonatology','Paediatric Nutrition'],      qualification:['MBBS','MD Paediatrics','Fellowship Neonatology'],hospital:'Kids Care Clinic',             clinicAddress:'Vaishali Nagar',               city:'Jaipur',           state:'Rajasthan',    pincode:'302021', experience:15, languages:['Hindi','English'],            rating:4.8, reviews:401, totalPatients:3800, isAvailable:true,  fee:600,  teleconsultFee:400,  about:'Paediatrician and neonatologist caring for newborns to adolescents. Special interest in childhood nutrition.', isVerified:true, gender:'Female', licenseNumber:'RJ-PAED-2009', gradIndex:7 },
  { id:'f09', name:'Dr. Suresh Pillai',    initials:'SP', hcId:'HC-D-S007', specialization:'Psychiatrist',       subSpecializations:['Depression','Anxiety','Bipolar'],          qualification:['MBBS','MD Psychiatry'],                        hospital:'Mind Matters Clinic',          clinicAddress:'Trivandrum Medical College Road',city:'Thiruvananthapuram',state:'Kerala',      pincode:'695011', experience:11, languages:['Malayalam','English','Hindi'],rating:4.7, reviews:156, totalPatients:980,  isAvailable:true,  fee:800,  teleconsultFee:600,  about:'Psychiatrist with special focus on mood disorders, anxiety spectrum, and addiction medicine.', isVerified:true, gender:'Male',   licenseNumber:'KL-PSYCH-2013',gradIndex:8 },
  { id:'f10', name:'Dr. Anita Reddy',      initials:'AR', hcId:'HC-D-S010', specialization:'Endocrinologist',    subSpecializations:['Thyroid','Diabetes','Obesity'],            qualification:['MBBS','MD Endocrinology','DM'],                hospital:'Hormone Health Clinic',        clinicAddress:'Banjara Hills',                city:'Hyderabad',        state:'Telangana',    pincode:'500034', experience:8,  languages:['Telugu','English','Hindi'],   rating:4.7, reviews:221, totalPatients:1680, isAvailable:true,  fee:850,  teleconsultFee:550,  about:'Endocrinologist managing thyroid disorders, diabetes, adrenal conditions and metabolic obesity.', isVerified:true, gender:'Female', licenseNumber:'TS-ENDO-2016', gradIndex:9 },
  { id:'f11', name:'Dr. Geeta Pandey',     initials:'GP', hcId:'HC-D-S024', specialization:'Nutritionist',       subSpecializations:['Weight Management','Diabetes Diet'],       qualification:['MSc Clinical Nutrition','RD','PhD'],           hospital:'Nourish Diet Clinic',          clinicAddress:'Hazratganj',                   city:'Lucknow',          state:'Uttar Pradesh',pincode:'226001', experience:11, languages:['Hindi','English'],            rating:4.8, reviews:423, totalPatients:3600, isAvailable:true,  fee:450,  teleconsultFee:300,  about:'Registered dietitian with expertise in therapeutic nutrition for diabetes, PCOS, and thyroid disorders.', isVerified:true, gender:'Female', licenseNumber:'UP-NUTR-2013', gradIndex:0 },
  { id:'f12', name:'Dr. Vikram Bhat',      initials:'VB', hcId:'HC-D-S005', specialization:'Orthopaedic Surgeon',subSpecializations:['Joint Replacement','Sports Medicine'],     qualification:['MBBS','MS Orthopaedics','Fellowship Sports Medicine'],hospital:'BoneJoint Clinic',          clinicAddress:'Malleshwaram',                 city:'Bengaluru',        state:'Karnataka',    pincode:'560003', experience:16, languages:['Kannada','English','Hindi'],  rating:4.8, reviews:189, totalPatients:1480, isAvailable:false, fee:1100, teleconsultFee:0,    about:'Orthopaedic surgeon with extensive experience in knee and hip replacement. Sports medicine consultant.', isVerified:true, gender:'Male',   licenseNumber:'KA-ORTHO-2008',gradIndex:1 },
] as any[]).map((d: any) => ({ ...FB_DEFAULTS, ...d })) as Doctor[];

// ── Doctor Spotlight cards — rotating in carousel ──────────────────────────
// 6 cards: healthcare facts, doctor insights, patient success stories,
// platform differentiators — rich, engaging, informative
const DOCTOR_SPOTLIGHT = [
  {
    type: 'fact',
    tag: '📊 India Health Fact',
    tagColor: '#60A5FA',
    headline: '1 Doctor per 834 Indians',
    subheadline: 'vs WHO recommended 1 per 1,000',
    body: 'India faces a severe doctor shortage — concentrated in cities. HealthConnect bridges this gap by connecting patients in smaller cities with verified specialists, and making teleconsultation from ₹300 accessible to all.',
    cta: 'Find a Specialist →',
    ctaColor: '#14B8A6',
    icon: '🩺',
  },
  {
    type: 'insight',
    tag: '👨‍⚕️ Doctor Insight',
    tagColor: '#34D399',
    headline: '"80% of PCOS cases can be managed without medication initially"',
    subheadline: 'Dr. Kavitha Iyer, Gynaecologist · Chennai · 4.9★',
    body: 'Most women are prescribed Metformin before lifestyle and dietary changes are even attempted. A structured 3-month diet and exercise protocol works for the majority of newly diagnosed PCOS patients. Always ask your doctor about this first.',
    cta: 'Book a Gynaecologist →',
    ctaColor: '#EC4899',
    icon: '🌸',
  },
  {
    type: 'success',
    tag: '⭐ Patient Success',
    tagColor: '#FBBF24',
    headline: 'HbA1c from 9.8 to 6.4 in 4 months',
    subheadline: 'Vikram S., 52 · Mumbai · Type 2 Diabetes',
    body: '"I had been managing diabetes poorly for 6 years. Dr. Arun Kumar put me on a CGM and restructured my insulin regime. For the first time in years, I woke up without brain fog. The teleconsult option meant I could check in weekly without leaving work."',
    cta: 'Book a Diabetologist →',
    ctaColor: '#F59E0B',
    icon: '🩸',
  },
  {
    type: 'fact',
    tag: '💊 Health Intelligence',
    tagColor: '#A78BFA',
    headline: 'Misdiagnosis affects 12 million Indians annually',
    subheadline: 'Source: ICMR 2024 Primary Care Report',
    body: `Over 70% of misdiagnoses happen because patients see the wrong specialist first. HealthConnect's specialty-based search and sub-specialization filters help you find the right doctor — not just any doctor. Every HCD-verified doctor's expertise is independently checked.`,
    cta: 'Search by Specialty →',
    ctaColor: '#14B8A6',
    icon: '🔬',
  },
  {
    type: 'insight',
    tag: '🧠 Doctor Insight',
    tagColor: '#34D399',
    headline: '"Depression in Indian men often presents as irritability, not sadness"',
    subheadline: 'Dr. Suresh Pillai, Psychiatrist · Thiruvananthapuram · 4.7★',
    body: `Cultural conditioning makes it hard for Indian men to recognise depression. If you've had persistent irritability, loss of motivation, unexplained physical pain, or withdrawal from family for over 2 weeks — that may be depression, not stress. It's treatable.`,
    cta: 'Find a Psychiatrist →',
    ctaColor: '#8B5CF6',
    icon: '🧘',
  },
  {
    type: 'platform',
    tag: '🇮🇳 Built for Bharat',
    tagColor: '#F97316',
    headline: 'Search in your language. Consult in your language.',
    subheadline: 'Hindi · Tamil · Telugu · Malayalam · Kannada · Bengali · Gujarati · Marathi',
    body: `HealthConnect is India's only doctor directory where you can filter doctors by language spoken. A Gujarati-speaking nephrologist in Ahmedabad. A Tamil-speaking cardiologist in Chennai. We believe language shouldn't be a barrier to good healthcare.`,
    cta: 'Filter by Language →',
    ctaColor: '#14B8A6',
    icon: '🌐',
  },
];

// Dynamic testimonials pulled from community posts API
const FALLBACK_TESTIMONIALS = [
  { name:'Priya S.', city:'Mumbai', text:'Dr. Iyer diagnosed my PCOS within the first consultation. Finally someone who listened.', spec:'Gynaecologist', rating:5 },
  { name:'Arjun N.', city:'Kochi', text:'Mental wellness support from Dr. Pillai changed my life. The anonymous posting helped me open up.', spec:'Psychiatrist', rating:5 },
  { name:'Kavitha R.', city:'Chennai', text:'Found my cardiologist through HealthConnect. The verified badge gave me confidence.', spec:'Cardiologist', rating:5 },
  { name:'Rahul V.', city:'Delhi', text:'Dr. Kumar manages my Type 2 diabetes with such expertise. My HbA1c dropped from 9.2 to 6.8.', spec:'Diabetologist', rating:5 },
  { name:'Sunita P.', city:'Ahmedabad', text:'Booked online consultation with Dr. Nair. Got an epilepsy diagnosis I had been searching for years.', spec:'Neurologist', rating:5 },
];

// Platform facts — shown in hero rotating banner
const PLATFORM_FACTS = [
  '🩺 30 verified specialists across 12 cities — growing every week',
  '📱 Teleconsultation available from ₹300 — consult from home',
  '🌐 Doctors who speak Hindi, Tamil, Telugu, Malayalam, Kannada & more',
  '🔒 DPDP 2023 compliant — your health data stays private',
  '⭐ Average doctor rating 4.7/5 across 3,800+ reviews',
  '👶 From paediatrics to geriatrics — every stage of life covered',
];

// ── Skeleton card ─────────────────────────────────────────────────────────
function SkeletonCard({ view }: { view: 'tile' | 'list' }) {
  const pulse = { animation: 'hcPulse 1.6s ease infinite' };
  if (view === 'list') return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#E8F5F3', flexShrink: 0, ...pulse }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 16, background: '#E8F5F3', borderRadius: 4, marginBottom: 8, width: '40%', ...pulse }} />
        <div style={{ height: 12, background: '#E8F5F3', borderRadius: 4, width: '60%', ...pulse }} />
      </div>
      <div style={{ width: 100, height: 36, background: '#E8F5F3', borderRadius: 8, ...pulse }} />
    </div>
  );
  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 24 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#E8F5F3', flexShrink: 0, ...pulse }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 15, background: '#E8F5F3', borderRadius: 4, marginBottom: 8, width: '70%', ...pulse }} />
          <div style={{ height: 12, background: '#E8F5F3', borderRadius: 4, width: '50%', ...pulse }} />
        </div>
      </div>
      <div style={{ height: 12, background: '#E8F5F3', borderRadius: 4, marginBottom: 6, ...pulse }} />
      <div style={{ height: 12, background: '#E8F5F3', borderRadius: 4, width: '80%', marginBottom: 16, ...pulse }} />
      <div style={{ height: 38, background: '#E8F5F3', borderRadius: 8, ...pulse }} />
    </div>
  );
}

// ── Doctor card — tile view ────────────────────────────────────────────────
function DoctorTile({ d, onProfile, onBook }: { d: Doctor; onProfile: (d: Doctor) => void; onBook: (d: Doctor) => void }) {
  const [hov, setHov] = useState(false);
  const [g1, g2] = GRAD_COLORS[d.gradIndex];
  const stars = Math.round(d.rating);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={() => onProfile(d)}
      style={{
        background: hov ? C.cardBgHov : C.cardBg,
        border: `1px solid ${hov ? C.cardBorderHov : C.cardBorder}`,
        borderRadius: 16, padding: '20px', cursor: 'pointer',
        transition: 'all 0.22s', position: 'relative',
        boxShadow: hov ? C.shadowHov : C.shadow,
        transform: hov ? 'translateY(-2px)' : '',
        display: 'flex', flexDirection: 'column' as const,
      }}
    >
      {/* Online badge */}
      {d.isAvailable && (
        <div style={{ position: 'absolute', top: 14, right: 14, background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 100, padding: '2px 9px', fontSize: 10, color: C.green, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, display: 'inline-block', animation: 'hcPulseGreen 1.5s infinite' }} />
          Now
        </div>
      )}

      {/* Avatar */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 58, height: 58, borderRadius: '50%', background: `linear-gradient(135deg,${g1},${g2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, color: '#fff', boxShadow: `0 4px 14px ${g1}40` }}>
            {d.initials}
          </div>
          {d.isVerified && (
            <div style={{ position: 'absolute', bottom: -1, right: -1, width: 18, height: 18, borderRadius: '50%', background: C.teal, border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 800 }}>✓</div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: C.textPrimary, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
          <div style={{ fontSize: 12, color: C.teal, fontWeight: 700, marginBottom: 2 }}>{d.specialization}</div>
          {d.hcId && <div style={{ fontSize: 10, color: '#4A5E7A', fontFamily: 'var(--font-mono)' }}>✓ {d.hcId}</div>}
        </div>
      </div>

      {/* Hospital + location */}
      <div style={{ fontSize: 12, color: '#1E3A6E', fontWeight: 500, marginBottom: 6, lineHeight: 1.5 }}>
        🏥 {d.hospital}
        {d.city && <span style={{ color: C.textMuted }}> · {d.city}</span>}
      </div>

      {/* Sub-specs */}
      {d.subSpecializations.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
          {d.subSpecializations.slice(0, 2).map((s: string) => (
            <span key={s} style={{ padding: '2px 7px', borderRadius: 100, background: '#EBF3FF', border: '1px solid #93C5FD', fontSize: 10, color: '#1D4ED8', fontWeight: 600 }}>{s}</span>
          ))}
          {d.subSpecializations.length > 2 && <span style={{ padding: '2px 7px', borderRadius: 100, background: '#EBF3FF', border: '1px solid #93C5FD', fontSize: 10, color: '#4A5E7A' }}>+{d.subSpecializations.length-2}</span>}
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        {d.experience && <span style={{ fontSize: 11, color: '#334E7A', fontWeight: 500, background: '#EBF0FF', border: '1px solid #A8C0E8', borderRadius: 6, padding: '2px 7px' }}>🏥 {d.experience}yr</span>}
        {d.totalPatients > 0 && <span style={{ fontSize: 11, color: '#334E7A', fontWeight: 500, background: '#EBF0FF', border: '1px solid #A8C0E8', borderRadius: 6, padding: '2px 7px' }}>👥 {d.totalPatients >= 1000 ? (d.totalPatients/1000).toFixed(1)+'k' : d.totalPatients}</span>}
        {d.languages.length > 0 && <span style={{ fontSize: 11, color: '#334E7A', fontWeight: 500, background: '#EBF0FF', border: '1px solid #A8C0E8', borderRadius: 6, padding: '2px 7px' }}>🗣 {d.languages[0]}{d.languages.length > 1 ? ` +${d.languages.length-1}` : ''}</span>}
      </div>

      {/* Rating + fee — flex-grow pushes button down */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[1,2,3,4,5].map((i: number) => <span key={i} style={{ color: i <= stars ? '#F59E0B' : '#D1EAE6', fontSize: 12 }}>★</span>)}
          <span style={{ fontSize: 12, fontWeight: 700, color: '#D97706' }}>{d.rating.toFixed(1)}</span>
          <span style={{ fontSize: 11, color: C.textMuted }}>({d.reviews})</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          {d.fee && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 800, color: C.teal }}>₹{d.fee}</div>}
          {d.teleconsultFee && d.teleconsultFee > 0 && <div style={{ fontSize: 10, color: C.green, fontWeight: 600 }}>📱 ₹{d.teleconsultFee} online</div>}
        </div>
      </div>

      {/* CTA — always at bottom via marginTop auto on wrapper */}
      <div style={{ marginTop: 'auto', paddingTop: 14 }}>
        <button
          onClick={e => { e.stopPropagation(); onBook(d); }}
          style={{
            width: '100%', padding: '10px', borderRadius: 9, border: 'none',
            background: `linear-gradient(135deg,${C.tealDark},${C.tealLight})`,
            color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font-heading)', transition: 'all 0.22s',
            boxShadow: hov ? `0 4px 14px ${C.tealGlow}` : 'none',
            letterSpacing: '0.02em',
          }}
        >
          View & Book →
        </button>
      </div>
    </div>
  );
}

// ── Doctor card — list view ────────────────────────────────────────────────
function DoctorRow({ d, onProfile, onBook }: { d: Doctor; onProfile: (d: Doctor) => void; onBook: (d: Doctor) => void }) {
  const [hov, setHov] = useState(false);
  const [g1, g2] = GRAD_COLORS[d.gradIndex];
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={() => onProfile(d)}
      style={{
        background: hov ? C.cardBgHov : C.cardBg,
        border: `1px solid ${hov ? '#1D6FA4' : '#DBEAFE'}`,
        borderRadius: 14, padding: '16px 20px', cursor: 'pointer',
        transition: 'all 0.2s', boxShadow: hov ? C.shadowHov : C.shadow,
        display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
      }}
    >
      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ width: 54, height: 54, borderRadius: '50%', background: `linear-gradient(135deg,${g1},${g2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 16, color: '#fff' }}>
          {d.initials}
        </div>
        {d.isVerified && <div style={{ position: 'absolute', bottom: -1, right: -1, width: 16, height: 16, borderRadius: '50%', background: C.teal, border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff' }}>✓</div>}
      </div>

      {/* Main info */}
      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, color: C.textPrimary }}>{d.name}</span>
          {d.isAvailable && <span style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 100, padding: '1px 7px', fontSize: 10, color: C.green, fontWeight: 600 }}>● Now</span>}
        </div>
        <div style={{ fontSize: 13, color: C.teal, fontWeight: 600, marginBottom: 3 }}>{d.specialization} {d.subSpecializations.length > 0 && <span style={{ color: C.textMuted, fontWeight: 400 }}>· {d.subSpecializations.slice(0,2).join(', ')}</span>}</div>
        <div style={{ fontSize: 12, color: C.textMuted }}>🏥 {d.hospital}{d.city ? ` · ${d.city}` : ''}{d.experience ? ` · ${d.experience}yr exp` : ''}</div>
      </div>

      {/* Rating */}
      <div style={{ flexShrink: 0, textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          {[1,2,3,4,5].map((i: number) => <span key={i} style={{ color: i <= Math.round(d.rating) ? '#F59E0B' : '#D1EAE6', fontSize: 11 }}>★</span>)}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#D97706' }}>{d.rating.toFixed(1)}</div>
        <div style={{ fontSize: 10, color: C.textMuted }}>{d.reviews} reviews</div>
      </div>

      {/* Fee */}
      <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 80 }}>
        {d.fee && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 800, color: C.teal }}>₹{d.fee}</div>}
        {d.teleconsultFee && d.teleconsultFee > 0 && <div style={{ fontSize: 10, color: C.green, fontWeight: 600 }}>📱 ₹{d.teleconsultFee}</div>}
        {!d.fee && <div style={{ fontSize: 13, color: C.textMuted }}>—</div>}
      </div>

      {/* CTA */}
      <button
        onClick={e => { e.stopPropagation(); onBook(d); }}
        style={{ flexShrink: 0, padding: '9px 20px', borderRadius: 9, border: 'none', background: `linear-gradient(135deg,${C.tealDark},${C.tealLight})`, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-heading)', whiteSpace: 'nowrap', boxShadow: `0 3px 10px ${C.teal}30` }}
      >
        Book →
      </button>
    </div>
  );
}

// ── Doctor Profile Modal — Full redesign ─────────────────────────────────────
// Sections: Header | Career Journey | Expertise | Qualifications | Training |
//           Consultation Modes | Availability | Awards | Reviews | Fee | Book
function DoctorProfileModal({ d, onClose, onBook }: { d: Doctor; onClose: () => void; onBook: (d: Doctor) => void }) {
  const [g1, g2] = GRAD_COLORS[d.gradIndex];
  const [activeTab, setActiveTab] = useState<'profile'|'reviews'>('profile');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Section heading component
  const SH = ({ label }: { label: string }) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#334E7A', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 10, marginTop: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 1, background: '#E2EEF0' }} />
      <span>{label}</span>
      <div style={{ flex: 1, height: 1, background: '#E2EEF0' }} />
    </div>
  );

  // Day schedule display
  const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const schedule = d.availabilitySchedule as Record<string, string[]> | null;

  // Jitsi video URL generator
  const getVideoUrl = (doctorId: string): string => {
    if (d.videoPlatform === 'jitsi' || !d.videoPlatform) {
      return `https://meet.jit.si/hc-${doctorId}-${Date.now()}`;
    }
    if (d.videoPlatform === 'daily') {
      return `https://healthconnect.daily.co/${doctorId}`;
    }
    return d.videoPlatform; // custom URL
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(8,20,34,0.80)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 740, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 40px 100px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column' as const }}>

        {/* ── Hero header ── */}
        <div style={{ background: `linear-gradient(135deg,#0D1B4B 0%,#0C3460 40%,#0D9488 100%)`, padding: '24px 24px 0', position: 'relative', flexShrink: 0 }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.18)', color: '#fff', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

          {/* Doctor identity */}
          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', marginBottom: 18 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 76, height: 76, borderRadius: '50%', background: `linear-gradient(135deg,${g1}cc,${g2}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 24, color: '#fff', border: '3px solid rgba(255,255,255,0.35)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                {d.initials}
              </div>
              {d.isVerified && (
                <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#14B8A6', borderRadius: 100, padding: '2px 7px', fontSize: 9, color: '#fff', fontWeight: 800, border: '2px solid #fff' }}>✓ HCD</div>
              )}
            </div>

            <div style={{ flex: 1, paddingTop: 4 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 20, color: '#fff', marginBottom: 3 }}>{d.name}</div>
              <div style={{ fontSize: 14, color: 'rgba(94,234,212,1)', fontWeight: 600, marginBottom: 3 }}>{d.specialization}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>
                {d.hospital}{d.city ? ` · ${d.city}` : ''}
                {d.registrationYear && <span style={{ color: 'rgba(255,255,255,0.50)', marginLeft: 8 }}>Reg. {d.registrationYear}</span>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                {d.hcId && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-mono)' }}>{d.hcId}</span>}
                {d.medicalCouncil && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-mono)' }}>· {d.medicalCouncil}</span>}
              </div>
            </div>

            {/* Availability badge */}
            <div style={{ flexShrink: 0, paddingTop: 4 }}>
              {d.isAvailable ? (
                <div style={{ background: 'rgba(22,163,74,0.2)', border: '1px solid rgba(22,163,74,0.5)', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'hcPulseGreen 1.5s infinite' }} />
                    <span style={{ fontSize: 11, color: '#4ADE80', fontWeight: 700 }}>Online Now</span>
                  </div>
                  {d.isAcceptingNew && <div style={{ fontSize: 9, color: 'rgba(74,222,128,0.7)', marginTop: 2 }}>Accepting patients</div>}
                </div>
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>By appointment</div>
                </div>
              )}
            </div>
          </div>

          {/* Quick stats row */}
          <div style={{ display: 'flex', gap: 0, borderTop: '1px solid rgba(255,255,255,0.10)' }}>
            {([
              ['⭐', d.rating.toFixed(1), 'Rating'],
              ['💬', d.reviews.toLocaleString(), 'Reviews'],
              ...(d.experience ? [['🏥', `${d.experience}yr`, 'Exp']] as [string,string,string][] : []),
              ...(d.totalPatients > 0 ? [['👥', d.totalPatients >= 1000 ? (d.totalPatients/1000).toFixed(1)+'k' : String(d.totalPatients), 'Patients']] as [string,string,string][] : []),
              ...(d.publications ? [['📄', String(d.publications), 'Papers']] as [string,string,string][] : []),
            ] as [string, string, string][]).map(([icon, val, label]) => (
              <div key={label} style={{ flex: 1, textAlign: 'center', padding: '12px 6px', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 14, marginBottom: 2 }}>{icon}</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 14, color: '#fff', lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 0, marginTop: 0 }}>
            {(['profile','reviews'] as const).map((tab: 'profile'|'reviews') => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '11px', border: 'none', background: activeTab === tab ? '#fff' : 'transparent', color: activeTab === tab ? '#0C3460' : 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700, cursor: 'pointer', borderRadius: activeTab === tab ? '8px 8px 0 0' : 0, transition: 'all 0.2s', textTransform: 'capitalize' as const }}>
                {tab === 'reviews' ? `Reviews (${d.reviews})` : 'Full Profile'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '4px 24px 24px', flex: 1 }}>

          {activeTab === 'profile' && (
            <>
              {/* About / Bio */}
              {d.about && (
                <>
                  <SH label="About" />
                  <p style={{ fontSize: 13.5, color: '#1E3A6E', lineHeight: 1.75, margin: 0 }}>{d.about}</p>
                </>
              )}

              {/* Career Journey — rich narrative */}
              {d.careerJourney && (
                <>
                  <SH label="Career Journey" />
                  <p style={{ fontSize: 13, color: '#334E7A', lineHeight: 1.80, margin: 0 }}>{d.careerJourney}</p>
                </>
              )}

              {/* Areas of Expertise */}
              {d.subSpecializations.length > 0 && (
                <>
                  <SH label="Areas of Expertise" />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                    {d.subSpecializations.map((s: string) => (
                      <span key={s} style={{ padding: '5px 13px', borderRadius: 100, background: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: 12, color: '#1D4ED8', fontWeight: 600 }}>{s}</span>
                    ))}
                  </div>
                </>
              )}

              {/* Qualifications */}
              {d.qualification.length > 0 && (
                <>
                  <SH label="Qualifications" />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                    {d.qualification.map((q: string) => (
                      <span key={q} style={{ padding: '5px 12px', borderRadius: 8, background: '#F0F4FF', border: '1px solid #C7D7F5', fontSize: 12, color: '#1E3A6E', fontWeight: 600 }}>{q}</span>
                    ))}
                  </div>
                </>
              )}

              {/* Training Hospitals */}
              {d.trainingHospitals.length > 0 && (
                <>
                  <SH label="Trained At" />
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                    {d.trainingHospitals.map((h: string, i: number) => (
                      <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#1D4ED8', flexShrink: 0 }}>{i + 1}</div>
                        <span style={{ fontSize: 13, color: '#1E3A6E', fontWeight: 500 }}>{h}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Awards */}
              {d.awards.length > 0 && (
                <>
                  <SH label="Awards & Recognition" />
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                    {d.awards.map((a: string) => (
                      <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14 }}>🏆</span>
                        <span style={{ fontSize: 12.5, color: '#334E7A' }}>{a}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Languages */}
              {d.languages.length > 0 && (
                <>
                  <SH label="Languages" />
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' as const }}>
                    {d.languages.map((l: string) => (
                      <span key={l} style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.22)', fontSize: 12, color: '#0D9488', fontWeight: 600 }}>🗣 {l}</span>
                    ))}
                  </div>
                </>
              )}

              {/* Consultation Modes */}
              <SH label="Consultation Modes" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
                {d.offersInPerson && (
                  <div style={{ background: '#F0F4FF', border: '1px solid #C7D7F5', borderRadius: 12, padding: '14px 16px', textAlign: 'center' as const }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>🏥</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0C1A3A', marginBottom: 3 }}>In-Person</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 800, color: '#0D9488' }}>{d.fee ? `₹${d.fee}` : '—'}</div>
                    <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>per visit</div>
                  </div>
                )}
                {d.offersVideo && (
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '14px 16px', textAlign: 'center' as const }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>📹</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0C1A3A', marginBottom: 3 }}>Video Call</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 800, color: '#16A34A' }}>{d.videoConsultFee ? `₹${d.videoConsultFee}` : d.teleconsultFee ? `₹${d.teleconsultFee}` : 'Free'}</div>
                    <button
                      onClick={e => { e.stopPropagation(); window.open(getVideoUrl(d.id), '_blank'); }}
                      style={{ marginTop: 8, width: '100%', padding: '5px', borderRadius: 6, border: 'none', background: '#16A34A', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Join Video →
                    </button>
                  </div>
                )}
                {d.offersAudio && (
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 16px', textAlign: 'center' as const }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>📞</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0C1A3A', marginBottom: 3 }}>Audio Call</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 800, color: '#D97706' }}>{d.audioConsultFee ? `₹${d.audioConsultFee}` : d.teleconsultFee ? `₹${d.teleconsultFee}` : '—'}</div>
                    <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>per call</div>
                  </div>
                )}
                {d.offersChat && (
                  <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 12, padding: '14px 16px', textAlign: 'center' as const }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>💬</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0C1A3A', marginBottom: 3 }}>Chat / Text</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 800, color: '#7C3AED' }}>Available</div>
                    <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>async</div>
                  </div>
                )}
              </div>

              {/* Availability Schedule */}
              {schedule && Object.keys(schedule).length > 0 && (
                <>
                  <SH label="Availability Schedule" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                    {DAYS.map((day: string) => {
                      const slots = schedule[day] ?? [];
                      const hasSlots = slots.length > 0;
                      return (
                        <div key={day} style={{ background: hasSlots ? '#EFF6FF' : '#F8FAFC', border: `1px solid ${hasSlots ? '#BFDBFE' : '#E2EEF0'}`, borderRadius: 8, padding: '8px 4px', textAlign: 'center' as const }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: hasSlots ? '#1D4ED8' : '#94A3B8', marginBottom: 4 }}>{day}</div>
                          {hasSlots ? slots.map((s: string) => (
                            <div key={s} style={{ fontSize: 9, color: '#1E3A6E', lineHeight: 1.4, fontFamily: 'var(--font-mono)' }}>{s}</div>
                          )) : <div style={{ fontSize: 9, color: '#CBD5E1' }}>Off</div>}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Clinic & Location */}
              <SH label="Clinic & Location" />
              <div style={{ background: '#F0F4FF', border: '1px solid #C7D7F5', borderRadius: 12, padding: '14px 16px' }}>
                {d.hospital && <div style={{ fontSize: 14, fontWeight: 700, color: '#0C1A3A', marginBottom: 4 }}>🏥 {d.hospital}</div>}
                {d.hospitalAffiliations.length > 0 && d.hospitalAffiliations.map((h: string) => (
                  <div key={h} style={{ fontSize: 12, color: '#334E7A', marginBottom: 2 }}>📍 {h}</div>
                ))}
                {(d.clinicAddress || d.city) && (
                  <div style={{ fontSize: 12, color: '#4A5E7A', marginTop: 4 }}>
                    📌 {[d.clinicAddress, d.city, d.state].filter(Boolean).join(', ')}
                    {d.pincode && <span style={{ color: '#64748B', fontFamily: 'var(--font-mono)' }}> — PIN {d.pincode}</span>}
                  </div>
                )}
              </div>

              {/* Featured Review Callout */}
              {d.featuredReview && (
                <>
                  <SH label="Patient Review Highlight" />
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 1, marginBottom: 6 }}>
                      {[1,2,3,4,5].map((i: number) => <span key={i} style={{ color: '#F59E0B', fontSize: 13 }}>★</span>)}
                    </div>
                    <p style={{ fontSize: 13, color: '#92400E', lineHeight: 1.7, fontStyle: 'italic', margin: '0 0 6px' }}>&ldquo;{d.featuredReview}&rdquo;</p>
                    {d.featuredPatientName && <div style={{ fontSize: 11, color: '#B45309', fontWeight: 600 }}>— {d.featuredPatientName}</div>}
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'reviews' && (
            <>
              {d.recentReviews.length > 0 ? (
                <>
                  <SH label={`Recent Reviews (${d.reviews} total)`} />
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                    {d.recentReviews.map((r: any) => (
                      <div key={r.id} style={{ background: '#F8FAFC', border: '1px solid #E2EEF0', borderRadius: 12, padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ display: 'flex', gap: 1 }}>
                            {[1,2,3,4,5].map((i: number) => <span key={i} style={{ color: i <= r.rating ? '#F59E0B' : '#E2EEF0', fontSize: 12 }}>★</span>)}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {r.isVerified && <span style={{ fontSize: 9, background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0', borderRadius: 100, padding: '1px 6px', fontWeight: 700 }}>✓ Verified Visit</span>}
                            <span style={{ fontSize: 10, color: '#94A3B8' }}>{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        </div>
                        {r.title && <div style={{ fontSize: 13, fontWeight: 700, color: '#0C1A3A', marginBottom: 4 }}>{r.title}</div>}
                        <p style={{ fontSize: 13, color: '#334E7A', lineHeight: 1.65, margin: '0 0 6px' }}>{r.body}</p>
                        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>— {r.authorName}</div>
                      </div>
                    ))}
                  </div>
                  {d.reviews > d.recentReviews.length && (
                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                      <span style={{ fontSize: 12, color: '#4A5E7A' }}>Showing {d.recentReviews.length} of {d.reviews} reviews</span>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#64748B' }}>No reviews yet</div>
                  <p style={{ fontSize: 12, marginTop: 6 }}>Be the first to review after your appointment.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Sticky booking footer ── */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E2EEF0', background: '#FAFBFF', flexShrink: 0, borderRadius: '0 0 22px 22px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Fee summary compact */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>Consultation from</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, color: '#0D9488' }}>
                ₹{Math.min(...[d.fee, d.videoConsultFee, d.audioConsultFee, d.teleconsultFee].filter((x): x is number => !!x && x > 0))}
              </div>
            </div>
            {/* Book buttons */}
            {d.offersVideo && (
              <button
                onClick={() => { onClose(); window.open(getVideoUrl(d.id), '_blank'); }}
                style={{ padding: '11px 18px', borderRadius: 10, border: '1.5px solid #16A34A', background: '#F0FDF4', color: '#15803D', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-heading)', whiteSpace: 'nowrap' as const }}
              >
                📹 Video Call
              </button>
            )}
            <button
              onClick={() => { onClose(); onBook(d); }}
              style={{ padding: '11px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#0C3460,#0D9488)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-heading)', whiteSpace: 'nowrap' as const, boxShadow: '0 4px 16px rgba(13,148,136,0.35)' }}
            >
              🏥 Book In-Person →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Auth Modal (self-contained, same as landing page) ─────────────────────
const inp: React.CSSProperties = { display:'block', width:'100%', padding:'11px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', marginBottom:14, background:'rgba(255,255,255,0.04)', color:'#E8F0FE', fontSize:14, outline:'none', fontFamily:'inherit', boxSizing:'border-box' };
const ROLES_AUTH = [
  { key:'PATIENT',  label:'Patient',  icon:'🧑‍⚕️', desc:'Manage your health, records & appointments' },
  { key:'DOCTOR',   label:'Doctor',   icon:'👨‍⚕️', desc:'Manage patients, schedule & consultations' },
  { key:'HOSPITAL', label:'Hospital', icon:'🏥',   desc:'Manage departments, staff & facilities' },
];
function LocalAuthModal({ initialRole, onClose, onSuccess }: { initialRole?: string; onClose: () => void; onSuccess: (user: any) => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [step, setStep] = useState<'role'|'form'|'login'>(initialRole ? 'form' : 'login');
  const [role, setRole] = useState(initialRole ?? 'PATIENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirst] = useState('');
  const [lastName, setLast] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isLogin = mode === 'login';

  useEffect(() => { setStep(isLogin ? 'form' : (initialRole ? 'form' : 'role')); setError(''); }, [isLogin]);

  const submit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields.'); return; }
    if (!isLogin && (!firstName.trim() || !lastName.trim())) { setError('Please enter your full name.'); return; }
    setLoading(true);
    try {
      const res: any = isLogin
        ? await authAPI.login({ email: email.trim(), password })
        : await authAPI.register({ email: email.trim(), password, firstName: firstName.trim(), lastName: lastName.trim(), role });
      const payload = res?.data?.data ?? res?.data;
      const { user, token } = payload;
      (useAuthStore.getState() as any).setAuth(user, token);
      onSuccess(user);
      onClose();
      router.replace(getDashboardRoute(user.role));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.response?.data?.error ?? (isLogin ? 'Invalid email or password.' : 'Registration failed. Please try again.'));
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(2,8,20,0.85)', backdropFilter:'blur(14px)', padding:'0 16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background:'#0C1628', borderRadius:20, padding:'36px 32px', width:'100%', maxWidth: step==='role' ? 520 : 440, border:'1px solid rgba(20,184,166,0.2)', boxShadow:'0 32px 80px rgba(0,0,0,0.6)' }}
        onKeyDown={e => { if (e.key==='Enter' && step==='form') submit(); }}
      >
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div>
            {!isLogin && step==='role' && <p style={{ color:'#14B8A6', fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', margin:'0 0 4px' }}>Step 1 of 2</p>}
            {!isLogin && step==='form' && <p style={{ color:'#14B8A6', fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', margin:'0 0 4px' }}>Step 2 of 2 · {ROLES_AUTH.find((r: typeof ROLES_AUTH[0]) => r.key===role)?.label}</p>}
            <h2 style={{ color:'#E8F0FE', fontSize:22, fontWeight:800, margin:'0 0 4px' }}>{isLogin ? 'Welcome back' : step==='role' ? 'Who are you?' : 'Create your account'}</h2>
            <p style={{ color:'#7A8FAF', fontSize:13, margin:0 }}>{isLogin ? 'Sign in to HealthConnect' : step==='role' ? 'Choose your role to get started' : `Signing up as a ${ROLES_AUTH.find((r: typeof ROLES_AUTH[0]) => r.key===role)?.label}`}</p>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', cursor:'pointer', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', color:'#7A8FAF', fontSize:16, flexShrink:0 }}>✕</button>
        </div>

        {!isLogin && step==='role' && (
          <>
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:24 }}>
              {ROLES_AUTH.map((r: typeof ROLES_AUTH[0]) => (
                <button key={r.key} onClick={() => setRole(r.key)} style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 18px', borderRadius:12, border:`2px solid ${role===r.key ? '#14B8A6' : 'rgba(255,255,255,0.06)'}`, background:role===r.key ? 'rgba(20,184,166,0.08)' : 'rgba(255,255,255,0.02)', cursor:'pointer', textAlign:'left', width:'100%' }}>
                  <span style={{ fontSize:28 }}>{r.icon}</span>
                  <div>
                    <div style={{ color:role===r.key ? '#14B8A6' : '#E8F0FE', fontWeight:700, fontSize:15, marginBottom:2 }}>{r.label}</div>
                    <div style={{ color:'#7A8FAF', fontSize:12 }}>{r.desc}</div>
                  </div>
                  <div style={{ marginLeft:'auto', width:18, height:18, borderRadius:'50%', border:role===r.key ? '6px solid #14B8A6' : '2px solid rgba(255,255,255,0.15)' }} />
                </button>
              ))}
            </div>
            <button onClick={() => setStep('form')} style={{ width:'100%', padding:'13px 0', borderRadius:10, border:'none', marginBottom:16, background:'linear-gradient(135deg,#0D9488,#14B8A6)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              Continue as {ROLES_AUTH.find((r: typeof ROLES_AUTH[0]) => r.key===role)?.label} →
            </button>
          </>
        )}

        {(isLogin || step==='form') && (
          <>
            {!isLogin && <button onClick={() => { setStep('role'); setError(''); }} style={{ background:'none', border:'none', color:'#7A8FAF', cursor:'pointer', fontSize:13, padding:'0 0 16px', display:'flex', alignItems:'center', gap:6 }}>← Change role</button>}
            {!isLogin && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <input value={firstName} onChange={e => setFirst(e.target.value)} placeholder="First name" style={inp} />
                <input value={lastName}  onChange={e => setLast(e.target.value)}  placeholder="Last name"  style={inp} />
              </div>
            )}
            <input type="email"    value={email}    onChange={e => setEmail(e.target.value)}    placeholder="Email address" style={inp} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"      style={inp} />
            {error && <div style={{ padding:'10px 14px', borderRadius:9, marginBottom:16, background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.2)', color:'#F43F5E', fontSize:13 }}>⚠️ {error}</div>}
            <button onClick={submit} disabled={loading} style={{ width:'100%', padding:'13px 0', borderRadius:10, border:'none', marginBottom:16, background:loading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#0D9488,#14B8A6)', color:loading ? '#7A8FAF' : '#fff', fontSize:15, fontWeight:700, cursor:loading ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
              {loading ? '⟳ Please wait…' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
            <p style={{ textAlign:'center', color:'#7A8FAF', fontSize:13, margin:0 }}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => setMode(m => m==='login' ? 'register' : 'login')} style={{ background:'none', border:'none', color:'#14B8A6', cursor:'pointer', fontSize:13, fontWeight:700 }}>
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Sidebar filter component ──────────────────────────────────────────────
interface SidebarProps {
  specialty: string; setSpecialty: (v: string) => void;
  city: string;      setCity: (v: string) => void;
  feeRange: string;  setFeeRange: (v: string) => void;
  expRange: string;  setExpRange: (v: string) => void;
  language: string;  setLanguage: (v: string) => void;
  available: boolean; setAvailable: (fn: (v: boolean) => boolean) => void;
  verified: boolean;  setVerified:  (fn: (v: boolean) => boolean) => void;
  gender: string;    setGender: (v: string) => void;
  onClear: () => void; hasFilters: boolean;
}
function Sidebar({
  specialty, setSpecialty, city, setCity, feeRange, setFeeRange,
  expRange, setExpRange, language, setLanguage, available, setAvailable,
  verified, setVerified, gender, setGender, onClear, hasFilters,
}: SidebarProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const toggle = (g: string) => setOpenGroups(prev => ({ ...prev, [g]: !prev[g] }));

  return (
    <div style={{ width: 240, flexShrink: 0, background: C.sidebarBg, border: `1px solid ${C.borderLight}`, borderRadius: 16, padding: '20px 16px', height: 'fit-content', position: 'sticky', top: 84, boxShadow: C.shadow }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, color: '#0C1A3A' }}>Filters</span>
        {hasFilters && <button onClick={onClear} style={{ fontSize: 11, color: C.rose, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Clear all</button>}
      </div>

      {/* Specialty tree */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#334E7A', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 10 }}>Specialty</div>
        {/* All button */}
        <button onClick={() => setSpecialty('')} style={{ width: '100%', textAlign: 'left', padding: '6px 10px', borderRadius: 8, border: `1px solid ${!specialty ? C.tealBorder : 'transparent'}`, background: !specialty ? C.tealBg : 'transparent', color: !specialty ? C.teal : '#2A4070', fontSize: 12, fontWeight: !specialty ? 700 : 500, cursor: 'pointer', marginBottom: 4 }}>
          🏥 All Specialties
        </button>
        {SPEC_GROUPS.map(({ group, specs }) => {
          const isOpen = openGroups[group];
          const hasActive = specs.some((s: string) => normalizeSpec(specialty) === normalizeSpec(s));
          return (
            <div key={group} style={{ marginBottom: 2 }}>
              <button onClick={() => toggle(group)} style={{ width: '100%', textAlign: 'left', padding: '6px 10px', borderRadius: 8, border: 'none', background: hasActive ? C.tealBg : 'transparent', color: hasActive ? C.teal : C.textSecondary, fontSize: 12, fontWeight: hasActive ? 700 : 500, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{group}</span>
                <span style={{ fontSize: 10, opacity: 0.5 }}>{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && specs.map((s: string) => {
                const sp = SPECIALTIES.find((x: typeof SPECIALTIES[0]) => x.value === s || normalizeSpec(x.value) === normalizeSpec(s));
                const active = normalizeSpec(specialty) === normalizeSpec(s);
                return (
                  <button key={s} onClick={() => setSpecialty(active ? '' : s)} style={{ width: '100%', textAlign: 'left', padding: '5px 10px 5px 22px', borderRadius: 8, border: `1px solid ${active ? C.tealBorder : 'transparent'}`, background: active ? C.tealBg : 'transparent', color: active ? C.teal : C.textSecondary, fontSize: 12, fontWeight: active ? 700 : 400, cursor: 'pointer', display: 'block', marginBottom: 1 }}>
                    {sp?.emoji ?? '🩺'} {sp?.label ?? s}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <div style={{ height: 1, background: C.borderLight, margin: '12px 0' }} />

      {/* City */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#334E7A', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 8 }}>City</div>
        <select value={city} onChange={e => setCity(e.target.value)} style={{ width: '100%', padding: '8px 10px', background: C.inputBg, border: `1px solid ${city ? C.tealBorder : C.inputBorder}`, borderRadius: 8, color: city ? C.teal : C.textSecondary, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
          {CITIES.map((c: string) => <option key={c} value={c === 'All Cities' ? '' : c}>{c}</option>)}
        </select>
      </div>

      {/* Fee range */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#334E7A', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 8 }}>Consultation Fee</div>
        {FEE_RANGES.map((f: typeof FEE_RANGES[0]) => (
          <button key={f.value} onClick={() => setFeeRange(feeRange === f.value ? '' : f.value)} style={{ width: '100%', textAlign: 'left', padding: '6px 10px', borderRadius: 8, border: `1px solid ${feeRange === f.value ? C.tealBorder : 'transparent'}`, background: feeRange === f.value ? C.tealBg : 'transparent', color: feeRange === f.value ? C.teal : C.textSecondary, fontSize: 12, fontWeight: feeRange === f.value ? 700 : 400, cursor: 'pointer', marginBottom: 2, display: 'block' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Experience */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#334E7A', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 8 }}>Experience</div>
        <select value={expRange} onChange={e => setExpRange(e.target.value)} style={{ width: '100%', padding: '8px 10px', background: C.inputBg, border: `1px solid ${expRange ? C.tealBorder : C.inputBorder}`, borderRadius: 8, color: expRange ? C.teal : C.textSecondary, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
          {EXP_RANGES.map((e: typeof EXP_RANGES[0]) => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
      </div>

      {/* Language */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#334E7A', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 8 }}>Language</div>
        <select value={language} onChange={e => setLanguage(e.target.value)} style={{ width: '100%', padding: '8px 10px', background: C.inputBg, border: `1px solid ${language ? C.tealBorder : C.inputBorder}`, borderRadius: 8, color: language ? C.teal : C.textSecondary, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
          {LANGUAGES.map((l: string) => <option key={l} value={l === 'All Languages' ? '' : l}>{l}</option>)}
        </select>
      </div>

      {/* Gender */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#334E7A', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 8 }}>Gender Preference</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['Any', 'Male', 'Female'] as string[]).map((g: string) => (
            <button key={g} onClick={() => setGender(gender === g.toUpperCase() ? '' : g === 'Any' ? '' : g.toUpperCase())} style={{ flex: 1, padding: '6px', borderRadius: 8, border: `1px solid ${(g === 'Any' && !gender) || gender === g.toUpperCase() ? C.tealBorder : C.borderLight}`, background: (g === 'Any' && !gender) || gender === g.toUpperCase() ? C.tealBg : 'transparent', color: (g === 'Any' && !gender) || gender === g.toUpperCase() ? C.teal : C.textSecondary, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              {g}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: C.borderLight, margin: '12px 0' }} />

      {/* Toggles */}
      {[
        { label: '● Available Now', key: 'available', val: available, set: setAvailable, color: C.green },
        { label: '✓ HCD Verified', key: 'verified',  val: verified,  set: setVerified,  color: C.teal },
      ].map(({ label, val, set, color }) => (
        <button key={label} onClick={() => set((v: boolean) => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, border: `1px solid ${val ? color + '40' : C.borderLight}`, background: val ? color + '10' : 'transparent', color: val ? color : C.textSecondary, fontSize: 12, fontWeight: val ? 700 : 500, cursor: 'pointer', marginBottom: 6 }}>
          <span>{label}</span>
          <div style={{ width: 36, height: 20, borderRadius: 100, background: val ? color : C.borderLight, position: 'relative', transition: 'background 0.2s' }}>
            <div style={{ position: 'absolute', top: 2, left: val ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </div>
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ── MAIN PAGE COMPONENT ───────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
export default function DoctorsPage() {
  const router = useRouter();

  // ── Auth state ─────────────────────────────────────────────────────────
  const [isAuth,    setIsAuth]    = useState(false);
  const [authUser,  setAuthUser]  = useState<any>(null);
  const [showAuth,  setShowAuth]  = useState(false);
  const [authPendingDoctor, setAuthPendingDoctor] = useState<Doctor | null>(null);

  // ── Search / filter state ─────────────────────────────────────────────
  const [search,    setSearch]    = useState('');
  const [specialty, setSpecialty] = useState('');
  const [city,      setCity]      = useState('');
  const [pincode,   setPincode]   = useState('');
  const [feeRange,  setFeeRange]  = useState('');
  const [expRange,  setExpRange]  = useState('');
  const [language,  setLanguage]  = useState('');
  const [gender,    setGender]    = useState('');
  const [sort,      setSort]      = useState('rating');
  const [available, setAvailable] = useState(false);
  const [verified,  setVerified]  = useState(false);

  // ── View state ────────────────────────────────────────────────────────
  const [view,      setView]      = useState<'tile'|'list'>('tile');
  const [profileDoc,setProfileDoc]= useState<Doctor | null>(null);

  // ── Data state ────────────────────────────────────────────────────────
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);  // full unfiltered set
  const [doctors,   setDoctors]   = useState<Doctor[]>([]);    // current page slice
  const [loading,   setLoading]   = useState(true);
  const [total,     setTotal]     = useState(0);        // filtered total
  const [page,      setPage]      = useState(1);
  const [hasMore,   setHasMore]   = useState(false);
  const [isFallback,setIsFallback]= useState(false);

  // ── Platform stats ────────────────────────────────────────────────────
  const [stats, setStats] = useState<any>(null);

  // ── Testimonials (from API) ───────────────────────────────────────────
  const [testimonials,    setTestimonials]    = useState(FALLBACK_TESTIMONIALS);
  const [testimonialIdx,  setTestimonialIdx]  = useState(0);
  const [spotlightIdx,    setSpotlightIdx]    = useState(0);

  // ── Fact ticker ───────────────────────────────────────────────────────
  const [factIdx, setFactIdx] = useState(0);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const LIMIT = 12;          // cards shown per page
  const FETCH_LIMIT = 500;   // fetch all from API at once

  // ── Auth sync ─────────────────────────────────────────────────────────
  useEffect(() => {
    const sync = (s: any) => {
      if (!s._hasHydrated) return;
      setIsAuth(!!s.isAuthenticated);
      setAuthUser(s.user ?? null);
    };
    sync(useAuthStore.getState() as any);
    const unsub = (useAuthStore as any).subscribe(sync);
    return () => unsub();
  }, []);

  // ── Load platform stats ───────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/public/stats`).then(r => r.json()).then(j => {
      setStats(j?.data || j);
    }).catch(() => {});
  }, []);

  // ── Load dynamic testimonials from community posts ────────────────────
  useEffect(() => {
    fetch(`${API}/public/communities?limit=1`).then(r => r.json()).then(async j => {
      const communities = j?.data?.data?.communities ?? j?.data?.communities ?? j?.data ?? [];
      if (Array.isArray(communities) && communities.length > 0) {
        const cid = communities[0].id;
        const postsRes = await fetch(`${API}/public/communities/${cid}/posts?limit=5`);
        const postsJson = await postsRes.json();
        const posts = postsJson?.data?.posts ?? postsJson?.data ?? [];
        if (Array.isArray(posts) && posts.length > 0) {
          const mapped = posts.slice(0, 5).map((p: any): typeof FALLBACK_TESTIMONIALS[0] => ({
            name: p.isAnonymous ? (p.anonymousAlias ?? 'Anonymous Member') : `${p.author?.firstName ?? ''} ${p.author?.lastName ?? ''}`.trim() || 'Community Member',
            city: p.author?.patientProfile?.city ?? 'India',
            text: p.body?.slice(0, 140) + (p.body?.length > 140 ? '...' : '') || p.title,
            spec: p.community?.category ?? 'General',
            rating: 5,
          }));
          setTestimonials(mapped);
        }
      }
    }).catch(() => {});
  }, []);

  // ── Fact ticker rotation ──────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setFactIdx((i: number) => (i + 1) % PLATFORM_FACTS.length), 4000);
    return () => clearInterval(t);
  }, []);

  // ── Testimonial rotation ──────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx((i: number) => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, [testimonials.length]);

  // ── Spotlight card rotation (6s per card) ────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setSpotlightIdx((i: number) => (i + 1) % DOCTOR_SPOTLIGHT.length), 6000);
    return () => clearInterval(t);
  }, []);

  // ── applyFilters — run all filters+sort+page on full dataset ─────────────
  // Called whenever filters change OR page changes — no new API call needed
  const applyFilters = useCallback((all: Doctor[], pg: number) => {
    const fr = FEE_RANGES.find((f: typeof FEE_RANGES[0]) => f.value === feeRange);
    const er = EXP_RANGES.find((e: typeof EXP_RANGES[0]) => e.value === expRange);
    const q  = search.toLowerCase().trim();

    let fb = [...all];

    // Search — across all meaningful fields
    if (q) fb = fb.filter((d: Doctor) =>
      d.name.toLowerCase().includes(q) ||
      normalizeSpec(d.specialization).includes(normalizeSpec(q)) ||
      d.hospital.toLowerCase().includes(q) ||
      d.city.toLowerCase().includes(q) ||
      d.clinicAddress.toLowerCase().includes(q) ||
      d.pincode.includes(q) ||
      d.about.toLowerCase().includes(q) ||
      d.subSpecializations.some((s: string) => s.toLowerCase().includes(q)) ||
      d.qualification.some((ql: string) => ql.toLowerCase().includes(q)) ||
      d.languages.some((l: string) => l.toLowerCase().includes(q))
    );

    // Specialty — normalised to handle British/American spellings
    if (specialty) fb = fb.filter((d: Doctor) => normalizeSpec(d.specialization).includes(normalizeSpec(specialty)));
    // City
    if (city) fb = fb.filter((d: Doctor) => d.city.toLowerCase() === city.toLowerCase());
    // Pincode prefix
    if (pincode.trim()) fb = fb.filter((d: Doctor) => d.pincode.startsWith(pincode.trim()));
    // Language
    if (language) fb = fb.filter((d: Doctor) => d.languages.some((l: string) => l.toLowerCase() === language.toLowerCase()));
    // Gender
    if (gender) fb = fb.filter((d: Doctor) => d.gender.toUpperCase() === gender.toUpperCase());
    // Available
    if (available) fb = fb.filter((d: Doctor) => d.isAvailable);
    // Verified
    if (verified) fb = fb.filter((d: Doctor) => d.isVerified);
    // Fee range
    if (fr && feeRange) fb = fb.filter((d: Doctor) => (d.fee ?? 0) >= fr.min && (d.fee ?? 99999) <= fr.max);
    // Experience range
    if (er && expRange) fb = fb.filter((d: Doctor) => (d.experience ?? 0) >= (er as any).min && (d.experience ?? 0) <= (er as any).max);

    // Sort
    if (sort === 'rating')     fb.sort((a: Doctor, b: Doctor) => b.rating - a.rating);
    if (sort === 'reviews')    fb.sort((a: Doctor, b: Doctor) => b.reviews - a.reviews);
    if (sort === 'experience') fb.sort((a: Doctor, b: Doctor) => (b.experience??0) - (a.experience??0));
    if (sort === 'fee_asc')    fb.sort((a: Doctor, b: Doctor) => (a.fee??0) - (b.fee??0));
    if (sort === 'newest')     fb.sort((a: Doctor, b: Doctor) => a.id.localeCompare(b.id));

    const filteredTotal = fb.length;
    const slice = fb.slice(0, pg * LIMIT);   // show first pg*12 cards

    setDoctors(slice);
    setTotal(filteredTotal);
    setHasMore(pg * LIMIT < filteredTotal);
  }, [search, specialty, city, pincode, feeRange, expRange, language, gender, sort, available, verified]);

  // ── fetchDoctors — hits API once with high limit, stores full set ──────
  const fetchDoctors = useCallback(async (pg: number, reset: boolean) => {
    if (reset) setLoading(true);
    try {
      // Fetch all doctors in one go — filters applied client-side for accuracy
      const params = new URLSearchParams({ limit: String(FETCH_LIMIT), page: '1', sort: 'rating' });
      const res  = await fetch(`${API}/public/doctors?${params}`);
      const json = await res.json();
      const raw: any[] = json?.data?.doctors ?? json?.data?.data?.doctors ?? json?.data?.data ?? json?.data ?? json?.doctors ?? [];

      if (Array.isArray(raw) && raw.length > 0) {
        const normalized = raw.map((d: any, i: number) => normalizeDoctor(d, i));
        setAllDoctors(normalized);
        setIsFallback(false);
        applyFilters(normalized, pg);
      } else {
        // Use fallback dataset
        setAllDoctors(FALLBACK);
        setIsFallback(true);
        applyFilters(FALLBACK, pg);
      }
    } catch {
      setAllDoctors(FALLBACK);
      setIsFallback(true);
      applyFilters(FALLBACK, pg);
    } finally { setLoading(false); }
  }, [applyFilters]);

  // ── Initial fetch — only once on mount ──────────────────────────────────
  useEffect(() => {
    fetchDoctors(1, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // intentionally runs once — fetchDoctors itself doesn't depend on filters

  // ── Re-apply filters when anything changes — instant, no new API call ──
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      if (allDoctors.length > 0) {
        applyFilters(allDoctors, 1);
      }
    }, 280);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [search, specialty, city, pincode, feeRange, expRange, language, gender, sort, available, verified, allDoctors, applyFilters]);

  // ── Load more — just expand the slice ────────────────────────────────
  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    applyFilters(allDoctors, next);
  };

  const clearFilters = () => {
    setSearch(''); setSpecialty(''); setCity(''); setPincode('');
    setFeeRange(''); setExpRange(''); setLanguage(''); setGender('');
    setSort('rating'); setAvailable(false); setVerified(false);
  };

  const hasFilters = !!(search || specialty || city || pincode || feeRange || expRange || language || gender || available || verified);

  // ── Book appointment handler ──────────────────────────────────────────
  const handleBook = (d: Doctor) => {
    if (isAuth) {
      router.push(`/dashboard?book=${d.id}&doctorName=${encodeURIComponent(d.name)}&specialty=${encodeURIComponent(d.specialization)}`);
    } else {
      setAuthPendingDoctor(d);
      setShowAuth(true);
    }
  };

  // ── After auth success, attempt booking ──────────────────────────────
  const handleAuthSuccess = (user: any) => {
    setIsAuth(true); setAuthUser(user);
    if (authPendingDoctor) {
      const d = authPendingDoctor;
      setAuthPendingDoctor(null);
      router.push(`/dashboard?book=${d.id}&doctorName=${encodeURIComponent(d.name)}&specialty=${encodeURIComponent(d.specialization)}`);
    }
  };

  const tmt = testimonials[testimonialIdx % testimonials.length];
  const onlineCount = allDoctors.filter((d: Doctor) => d.isAvailable).length;

  return (
    <div style={{ background: '#F0F4FF', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,22,40,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(20,184,166,0.12)', padding: '0 5%', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#0D9488,#14B8A6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: '0 0 16px rgba(20,184,166,0.30)' }}>🏥</div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 14, color: '#fff', lineHeight: 1 }}>HealthConnect India</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#14B8A6', letterSpacing: '0.06em' }}>Unified Healthcare Platform</div>
          </div>
        </a>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[['Home','/'],['Doctors','/doctors'],['Communities','/communities'],['Hospitals','#'],['Learn','#']].map(([label, href]) => (
            <a key={label} href={href} style={{ padding: '6px 11px', borderRadius: 8, fontSize: 13, fontWeight: href === '/doctors' ? 700 : 500, color: href === '/doctors' ? '#2DD4BF' : 'rgba(255,255,255,0.85)', textDecoration: 'none', background: href === '/doctors' ? 'rgba(20,184,166,0.12)' : 'transparent', border: href === '/doctors' ? '1px solid rgba(20,184,166,0.25)' : '1px solid transparent', transition: 'all 0.2s', whiteSpace: 'nowrap' as const }}>{label}</a>
          ))}
        </div>

        {/* Auth buttons — correct: Sign In / Sign Up Free, no Dashboard */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isAuth ? (
            <button onClick={() => router.push(getDashboardRoute(authUser?.role))} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#0D9488,#14B8A6)', color: '#fff', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              My Dashboard →
            </button>
          ) : (
            <>
              <button onClick={() => { setAuthPendingDoctor(null); setShowAuth(true); }} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Sign In
              </button>
              <button onClick={() => { setAuthPendingDoctor(null); setShowAuth(true); }} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#0D9488,#14B8A6)', color: '#fff', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(13,148,136,0.35)' }}>
                Sign Up Free
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero section ──────────────────────────────────────────────────── */}
      <div style={{ background: C.heroBg, padding: '20px 5% 18px', position: 'relative', overflow: 'hidden' }}>
        {/* Hexagon grid overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(20,184,166,0.08) 1px,transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        {/* Bottom fade to page */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to bottom,transparent,rgba(0,0,0,0.15))', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr minmax(420px,45%)', gap: 28, maxWidth: 1300, margin: '0 auto', alignItems: 'start' }}>

          {/* ── Left: heading + description + search ── */}
          <div>
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(20,184,166,0.14)', border: '1px solid rgba(20,184,166,0.30)', borderRadius: 100, padding: '3px 13px', fontSize: 10, color: '#67E8F9', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: 10, fontWeight: 700 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', animation: 'hcPulseGreen 1.5s infinite', display: 'inline-block' }} />
              Doctor Dictionary · {isFallback ? FALLBACK.length : (total > 0 ? allDoctors.length : '30+')} Doctors
            </div>

            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 'clamp(24px,3.5vw,40px)', color: '#FFFFFF', margin: '0 0 8px', lineHeight: 1.08, letterSpacing: '-0.5px' }}>
              Find Your Perfect<br />
              <span style={{ background: 'linear-gradient(135deg,#14B8A6,#5EEAD4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Doctor</span>
            </h1>

            {/* Description — what the dictionary does */}
            <p style={{ fontSize: 13, color: 'rgba(220,235,255,0.95)', marginBottom: 14, lineHeight: 1.65, maxWidth: 520 }}>
              India&apos;s most complete doctor directory — search by name, specialty, city, language, fee or availability.
              Every doctor is <b style={{ color: '#14B8A6' }}>HCD-verified</b>. View full profiles, sub-specializations,
              clinic details and book in-person or online consultations — free to browse, always.
            </p>

            {/* Live stats row */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' as const }}>
              {[
                { v: isFallback ? FALLBACK.length : (allDoctors.length || (stats?.doctors ?? '37')), l: 'Verified Doctors', c: '#14B8A6' },
                { v: onlineCount > 0 ? onlineCount : (stats?.onlineDoctors ?? 10),                  l: 'Available Now',   c: '#22C55E' },
                { v: stats?.users ? Math.floor(stats.users/1000)+'k+' : '22k+',                     l: 'Patients',        c: '#A78BFA' },
              ].map(({ v, l, c }) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 8, padding: '5px 12px' }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15, color: c, textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>{v}</span>
                  <span style={{ fontSize: 11, color: 'rgba(210,230,255,0.90)' }}>{l}</span>
                </div>
              ))}
            </div>

            {/* Search bar — shorter, focused */}
            <div style={{ position: 'relative', marginBottom: 10, maxWidth: 560 }}>
              <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none' }}>🔍</span>
              <input
                id="hc-doctor-search" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Name, specialty, hospital, city, language..."
                style={{ width: '100%', boxSizing: 'border-box' as const, padding: '11px 40px 11px 40px', background: 'rgba(255,255,255,0.10)', border: '1.5px solid rgba(255,255,255,0.18)', borderRadius: 10, color: '#F0F6FF', fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)', transition: 'border-color 0.2s' }}
                onFocus={e => (e.target.style.borderColor = '#14B8A6')}
                onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.18)')}
              />
              {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 10 }}>✕</button>}
            </div>

            {/* Quick filter row — removed PIN, kept City + Sort + toggles */}
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' as const, alignItems: 'center', marginBottom: 12 }}>
              <select value={city} onChange={e => setCity(e.target.value)} style={{ padding: '7px 10px', background: 'rgba(255,255,255,0.08)', border: `1px solid ${city ? 'rgba(20,184,166,0.4)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 7, color: city ? '#14B8A6' : 'rgba(148,163,184,0.8)', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                {CITIES.map((c: string) => <option key={c} value={c === 'All Cities' ? '' : c} style={{ background: '#0D1B2E', color: '#E2E8F0' }}>{c}</option>)}
              </select>
              <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '7px 10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'rgba(148,163,184,0.8)', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                {SORT_OPTIONS.map((s: typeof SORT_OPTIONS[0]) => <option key={s.value} value={s.value} style={{ background: '#0D1B2E', color: '#E2E8F0' }}>{s.label}</option>)}
              </select>
              <button onClick={() => setAvailable((a: boolean) => !a)} style={{ padding: '7px 12px', borderRadius: 7, border: `1px solid ${available ? 'rgba(22,163,74,0.4)' : 'rgba(255,255,255,0.12)'}`, background: available ? 'rgba(22,163,74,0.14)' : 'rgba(255,255,255,0.06)', color: available ? '#22C55E' : 'rgba(148,163,184,0.7)', fontSize: 11, fontWeight: available ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                {available && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />}
                ● Available Now
              </button>
              <button onClick={() => setVerified((v: boolean) => !v)} style={{ padding: '7px 12px', borderRadius: 7, border: `1px solid ${verified ? 'rgba(20,184,166,0.4)' : 'rgba(255,255,255,0.12)'}`, background: verified ? 'rgba(20,184,166,0.14)' : 'rgba(255,255,255,0.06)', color: verified ? '#14B8A6' : 'rgba(148,163,184,0.7)', fontSize: 11, fontWeight: verified ? 700 : 500, cursor: 'pointer' }}>
                ✓ HCD Verified
              </button>
              {hasFilters && <button onClick={clearFilters} style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid rgba(225,29,72,0.3)', background: 'rgba(225,29,72,0.08)', color: '#E11D48', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>✕ Clear</button>}
            </div>

            {/* Rotating fact ticker */}
            <div style={{ padding: '8px 12px', background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.28)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 7, maxWidth: 520 }}>
              <span style={{ fontSize: 12, flexShrink: 0 }}>💡</span>
              <span style={{ fontSize: 11, color: 'rgba(210,230,255,0.95)', lineHeight: 1.45 }}>{PLATFORM_FACTS[factIdx]}</span>
            </div>
          </div>

          {/* ── Right: Doctor Spotlight carousel (48% of hero) ── */}
          {(() => {
            const spot = DOCTOR_SPOTLIGHT[spotlightIdx];
            return (
              <div style={{ background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 20, padding: '18px 20px', backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.28)', display: 'flex', flexDirection: 'column' as const, minHeight: 420 }}>

                {/* Card header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: spot.tagColor, animation: 'hcPulseGreen 1.5s infinite' }} />
                    <span style={{ fontSize: 10, color: spot.tagColor, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' as const, letterSpacing: '0.10em', fontWeight: 700 }}>{spot.tag}</span>
                  </div>
                  <span style={{ fontSize: 10, color: 'rgba(210,230,255,0.6)', fontFamily: 'var(--font-mono)' }}>{spotlightIdx + 1}/{DOCTOR_SPOTLIGHT.length}</span>
                </div>

                {/* Icon */}
                <div style={{ fontSize: 32, marginBottom: 10 }}>{spot.icon}</div>

                {/* Headline */}
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 17, color: '#FFFFFF', lineHeight: 1.25, marginBottom: 5 }}>
                  {spot.headline}
                </div>
                <div style={{ fontSize: 11, color: spot.tagColor, fontWeight: 600, marginBottom: 12, lineHeight: 1.4 }}>
                  {spot.subheadline}
                </div>

                {/* Body */}
                <div style={{ fontSize: 12.5, color: 'rgba(220,238,255,0.93)', lineHeight: 1.72, marginBottom: 16, flex: 1, borderLeft: '3px solid rgba(255,255,255,0.15)', paddingLeft: 12 }}>
                  {spot.body}
                </div>

                {/* Dots */}
                <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 14 }}>
                  {DOCTOR_SPOTLIGHT.map((_: typeof DOCTOR_SPOTLIGHT[0], i: number) => (
                    <div key={i} onClick={() => setSpotlightIdx(i)} style={{ width: i === spotlightIdx ? 18 : 5, height: 5, borderRadius: 3, background: i === spotlightIdx ? spot.tagColor : 'rgba(255,255,255,0.18)', cursor: 'pointer', transition: 'all 0.3s' }} />
                  ))}
                </div>

                <div style={{ height: 1, background: 'rgba(255,255,255,0.12)', marginBottom: 14 }} />

                {/* Stats row — compact, 3 key numbers only */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  {([
                    [isFallback ? FALLBACK.length : (allDoctors.length || (stats?.doctors ?? '37')), 'Verified Doctors', '#14B8A6'],
                    [onlineCount > 0 ? onlineCount : (stats?.onlineDoctors ?? 10), 'Available Now', '#22C55E'],
                    [stats?.users ? Math.floor(stats.users/1000)+'k+' : '22k+', 'Patients', '#A78BFA'],
                  ] as [string|number, string, string][]).map(([val, label, col]) => (
                    <div key={label} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', background: 'rgba(255,255,255,0.08)', borderRadius: 9, border: '1px solid rgba(255,255,255,0.14)' }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 17, color: col, lineHeight: 1 }}>{val}</div>
                      <div style={{ fontSize: 9, color: 'rgba(210,230,255,0.70)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginTop: 3 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* CTA + Join as Doctor */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => document.getElementById('hc-doctor-search')?.focus()}
                    style={{ flex: 1, padding: '9px', borderRadius: 9, border: 'none', background: `linear-gradient(135deg,${spot.ctaColor}cc,${spot.ctaColor})`, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-heading)' }}
                  >
                    {spot.cta}
                  </button>
                  <button onClick={() => setShowAuth(true)} style={{ padding: '9px 14px', borderRadius: 9, border: '1px solid rgba(196,181,253,0.45)', background: 'rgba(109,40,217,0.18)', color: '#DDD6FE', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-heading)', whiteSpace: 'nowrap' as const }}>
                    🩺 Join
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Specialty chip bar ────────────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #C7D7F5', padding: '12px 5%', boxShadow: '0 2px 8px rgba(12,26,58,0.05)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 7, minWidth: 'max-content' }}>
          {SPECIALTIES.map((s: typeof SPECIALTIES[0]) => {
            const isActive = specialty === s.value || (s.value !== '' && normalizeSpec(specialty) === normalizeSpec(s.value));
            return (
              <button key={s.value} onClick={() => setSpecialty(isActive ? '' : s.value)} style={{ padding: '6px 14px', borderRadius: 100, cursor: 'pointer', transition: 'all 0.18s', border: `1px solid ${isActive ? 'rgba(13,148,136,0.35)' : '#C7D7F5'}`, background: isActive ? C.tealBg : '#fff', color: isActive ? C.teal : '#2A4070', fontSize: 12, fontWeight: isActive ? 700 : 500, fontFamily: 'var(--font-heading)', whiteSpace: 'nowrap' as const }}>
                {s.emoji} {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content area: sidebar + results ──────────────────────────────── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 5% 60px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* Left sidebar */}
        <Sidebar
          specialty={specialty} setSpecialty={setSpecialty}
          city={city}           setCity={setCity}
          feeRange={feeRange}   setFeeRange={setFeeRange}
          expRange={expRange}   setExpRange={setExpRange}
          language={language}   setLanguage={setLanguage}
          available={available} setAvailable={setAvailable}
          verified={verified}   setVerified={setVerified}
          gender={gender}       setGender={setGender}
          onClear={clearFilters} hasFilters={hasFilters}
        />

        {/* Results column */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Result count + view toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 14, color: '#1E3A6E', fontWeight: 500 }}>
              {loading && doctors.length === 0 ? (
                <span style={{ color: C.textMuted }}>Searching across {allDoctors.length || (isFallback ? FALLBACK.length : '37')} doctors...</span>
              ) : (
                <span>
                  Showing <b style={{ color: C.textPrimary }}>{doctors.length}</b>
                  {total > doctors.length && <> of <b style={{ color: C.textPrimary }}>{total.toLocaleString('en-IN')}</b> filtered</>} doctors
                  {!hasFilters && <span style={{ color: C.textMuted }}> (total: {allDoctors.length || total})</span>}
                  {specialty && <span style={{ color: C.teal }}> · {specialty}</span>}
                  {city && <span style={{ color: C.teal }}> · {city}</span>}
                  {isFallback && <span style={{ fontSize: 11, color: C.textMuted }}> · demo data</span>}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#4A5E7A', fontFamily: 'var(--font-mono)' }}>Sort:</span>
              <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '6px 10px', background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: 8, color: C.textSecondary, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                {SORT_OPTIONS.map((s: typeof SORT_OPTIONS[0]) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {/* View toggle */}
              <div style={{ display: 'flex', background: C.surfaceBg, border: `1px solid ${C.borderLight}`, borderRadius: 9, padding: 3, gap: 2 }}>
                {(['tile','list'] as const).map((v: 'tile'|'list') => (
                  <button key={v} onClick={() => setView(v)} style={{ width: 32, height: 28, borderRadius: 7, border: 'none', background: view === v ? C.tealBg : 'transparent', color: view === v ? C.teal : C.textMuted, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                    {v === 'tile' ? '⊞' : '☰'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid / List */}
          {loading && doctors.length === 0 ? (
            <div style={{ display: view === 'tile' ? 'grid' : 'flex', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', flexDirection: 'column' as const, gap: 14, alignItems: view === 'tile' ? 'stretch' : 'flex-start' }}>
              {[...Array(9)].map((_: unknown, i: number) => <SkeletonCard key={i} view={view} />)}
            </div>
          ) : doctors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 16 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, color: '#0C1A3A', marginBottom: 8 }}>No doctors found</div>
              <p style={{ fontSize: 14, color: '#1E3A6E', fontWeight: 500, maxWidth: 380, margin: '0 auto 24px' }}>Try broadening your search — different spelling, nearby city, or fewer filters.</p>
              <button onClick={clearFilters} style={{ padding: '10px 28px', borderRadius: 9, border: 'none', background: `linear-gradient(135deg,${C.tealDark},${C.tealLight})`, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-heading)' }}>Clear All Filters</button>
            </div>
          ) : (
            <>
              {view === 'tile' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16, alignItems: 'stretch' }}>
                  {doctors.map((d: Doctor) => <DoctorTile key={d.id} d={d} onProfile={setProfileDoc} onBook={handleBook} />)}
                  {loading && [...Array(3)].map((_: unknown, i: number) => <SkeletonCard key={`sk-${i}`} view="tile" />)}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {doctors.map((d: Doctor) => <DoctorRow key={d.id} d={d} onProfile={setProfileDoc} onBook={handleBook} />)}
                  {loading && [...Array(3)].map((_: unknown, i: number) => <SkeletonCard key={`sk-${i}`} view="list" />)}
                </div>
              )}

              {/* Load more */}
              {hasMore && !loading && (
                <div style={{ textAlign: 'center', marginTop: 28, padding: '20px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 14 }}>
                  <p style={{ fontSize: 13, color: '#334E7A', fontWeight: 500, marginBottom: 12 }}>
                    Showing <b style={{ color: C.textPrimary }}>{doctors.length}</b> of <b style={{ color: C.textPrimary }}>{total}</b> doctors matching your filters
                  </p>
                  <button
                    onClick={loadMore}
                    style={{ padding: '11px 36px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C.tealDark},${C.tealLight})`, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-heading)', boxShadow: `0 4px 16px ${C.tealGlow}`, transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform=''; }}
                  >
                    Load {Math.min(LIMIT, total - doctors.length)} More Doctors ↓
                  </button>
                </div>
              )}
              {!hasMore && !loading && total > LIMIT && (
                <div style={{ textAlign: 'center', marginTop: 20, padding: '12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10 }}>
                  <span style={{ fontSize: 13, color: '#15803D', fontWeight: 700 }}>✓ All {total} matching doctors shown</span>
                </div>
              )}
            </>
          )}

          {/* Join as Doctor CTA strip */}
          <div style={{ marginTop: 44, padding: '24px 28px', borderRadius: 16, border: `1.5px dashed rgba(124,58,237,0.30)`, background: C.violetBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: '#0C1A3A', marginBottom: 4 }}>🩺 Are you a Doctor?</div>
              <div style={{ fontSize: 13, color: '#1E3A6E', maxWidth: 480 }}>Join HealthConnect and get your verified HCD ID. Reach patients across India who are looking for specialists like you.</div>
            </div>
            <button onClick={() => setShowAuth(true)} style={{ padding: '11px 28px', borderRadius: 10, border: '1px solid rgba(124,58,237,0.35)', background: 'rgba(124,58,237,0.12)', color: C.violet, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-heading)', whiteSpace: 'nowrap' as const, transition: 'all 0.2s' }}>
              Register as Doctor →
            </button>
          </div>
        </div>
      </div>

      {/* ── Doctor profile modal ──────────────────────────────────────────── */}
      {profileDoc && (
        <DoctorProfileModal d={profileDoc} onClose={() => setProfileDoc(null)} onBook={(d: Doctor) => { setProfileDoc(null); handleBook(d); }} />
      )}

      {/* ── Auth modal ────────────────────────────────────────────────────── */}
      {showAuth && (
        <LocalAuthModal
          initialRole={authPendingDoctor ? 'PATIENT' : undefined}
          onClose={() => { setShowAuth(false); setAuthPendingDoctor(null); }}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* ── Animations ───────────────────────────────────────────────────── */}
      <style>{`
        @keyframes hcPulse      { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes hcPulseGreen { 0%,100%{box-shadow:0 0 0 0 rgba(22,163,74,0.5)} 50%{box-shadow:0 0 0 5px rgba(22,163,74,0)} }
        select option { background:#0F2035; color:#E2E8F0; }
        input::placeholder { color:rgba(148,163,184,0.55); }
        * { box-sizing: border-box; }
        @media (max-width: 900px) {
          .hc-hero-grid { grid-template-columns: 1fr !important; }
          .hc-hero-right { display: none !important; }
          .hc-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
}
