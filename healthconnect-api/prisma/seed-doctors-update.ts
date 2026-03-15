/**
 * HealthConnect India — Doctor Profile Seed Update
 * Adds new fields to the 30 existing seeded doctors:
 *   careerJourney, trainingHospitals, hospitalAffiliations, awards,
 *   offersVideoConsult, offersAudioConsult, videoConsultFee, audioConsultFee,
 *   availabilitySchedule, featuredReview, featuredPatientName,
 *   verificationStatus (set to VERIFIED), hcDoctorId
 *
 * Run from: /var/www/healthconnect/healthconnect-api
 *   npx ts-node src/seed-doctors-update.ts
 *
 * SAFE: Uses updateMany/update — will not delete existing data
 * IDEMPOTENT: Checks if hcDoctorId already set before assigning
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Standard weekly schedule templates
const FULL_SCHEDULE = {
  Mon: ['09:00-13:00', '15:00-18:00'],
  Tue: ['09:00-13:00', '15:00-18:00'],
  Wed: ['09:00-13:00', '15:00-18:00'],
  Thu: ['09:00-13:00', '15:00-18:00'],
  Fri: ['09:00-13:00', '15:00-18:00'],
  Sat: ['09:00-13:00'],
};

const ALT_SCHEDULE = {
  Mon: ['10:00-14:00', '17:00-20:00'],
  Tue: ['10:00-14:00'],
  Wed: ['10:00-14:00', '17:00-20:00'],
  Thu: ['10:00-14:00'],
  Fri: ['10:00-14:00', '17:00-20:00'],
  Sat: ['10:00-13:00'],
};

const EVENING_SCHEDULE = {
  Mon: ['16:00-20:00'],
  Tue: ['16:00-20:00'],
  Wed: ['10:00-14:00'],
  Thu: ['16:00-20:00'],
  Fri: ['16:00-20:00'],
  Sat: ['10:00-14:00'],
};

// Doctor update data keyed by seed email
const DOCTOR_UPDATES: Record<string, {
  hcDoctorId: string;
  careerJourney: string;
  trainingHospitals: string[];
  hospitalAffiliations: string[];
  awards: string[];
  publications: number;
  medicalCouncil: string;
  registrationYear: number;
  offersVideoConsult: boolean;
  offersAudioConsult: boolean;
  videoConsultFee: number | null;
  audioConsultFee: number | null;
  availabilitySchedule: any;
  featuredReview: string;
  featuredPatientName: string;
}> = {
  'dr.arun.kumar@demo.hc': {
    hcDoctorId: 'HCD-2025-DIAB-0001',
    careerJourney: 'Dr. Arun Kumar completed his MBBS from Grant Medical College, Mumbai, followed by MD Internal Medicine at KEM Hospital. He pursued DM Endocrinology from AIIMS Delhi, training under some of India\'s leading diabetes specialists. After a fellowship at the International Diabetes Center, Minneapolis, he returned to Mumbai to establish the Diabetes Care Centre. Over 18 years, he has built one of Mumbai\'s most trusted diabetes clinics, pioneering CGM therapy adoption in India. He is a founding member of the Diabetes India Network and has trained over 200 general practitioners in insulin management.',
    trainingHospitals: ['KEM Hospital Mumbai', 'AIIMS Delhi', 'International Diabetes Center Minneapolis'],
    hospitalAffiliations: ['Diabetes Care Centre Mumbai', 'Kokilaben Dhirubhai Ambani Hospital'],
    awards: ['Best Diabetologist Mumbai 2023 - IDA', 'Excellence in Patient Care 2021'],
    publications: 14,
    medicalCouncil: 'Maharashtra Medical Council',
    registrationYear: 2006,
    offersVideoConsult: true,
    offersAudioConsult: true,
    videoConsultFee: 500,
    audioConsultFee: 400,
    availabilitySchedule: FULL_SCHEDULE,
    featuredReview: 'Dr. Kumar reduced my HbA1c from 9.8 to 6.4 in just 4 months. He explained every step clearly and adjusted my CGM settings with precision.',
    featuredPatientName: 'Vikram S., Mumbai',
  },

  'dr.priya.mehta@demo.hc': {
    hcDoctorId: 'HCD-2025-CARD-0001',
    careerJourney: 'Dr. Priya Mehta completed her MBBS and MD Cardiology from AIIMS Delhi, where she graduated with distinction. She did her DM Cardiology from Escorts Heart Institute, Delhi, and trained in interventional cardiology at Cleveland Clinic, USA. She returned to India to bring advanced cardiac care closer to patients. At Heart Care Clinic, Dwarka, she has performed over 1,200 stent procedures and is recognised for her work in heart failure management. She is an active member of the Cardiological Society of India and regularly speaks at national cardiology conferences.',
    trainingHospitals: ['AIIMS Delhi', 'Escorts Heart Institute Delhi', 'Cleveland Clinic USA'],
    hospitalAffiliations: ['Heart Care Clinic Dwarka', 'Apollo Hospital Delhi'],
    awards: ['Young Cardiologist Award 2020 - CSI', 'Best Women Physician Delhi 2022'],
    publications: 22,
    medicalCouncil: 'Delhi Medical Council',
    registrationYear: 2010,
    offersVideoConsult: true,
    offersAudioConsult: true,
    videoConsultFee: 700,
    audioConsultFee: 500,
    availabilitySchedule: FULL_SCHEDULE,
    featuredReview: 'After my angioplasty, Dr. Mehta\'s follow-up care was exceptional. She explained every medication and what to watch for. Truly world-class.',
    featuredPatientName: 'Ramesh P., Delhi',
  },

  'dr.rajesh.nair@demo.hc': {
    hcDoctorId: 'HCD-2025-NEUR-0001',
    careerJourney: 'Dr. Rajesh Nair completed MD and DM Neurology from NIMHANS Bengaluru — India\'s premier neurological institute. He underwent subspecialty training in epilepsy management at the Epilepsy Foundation of America. Back in Kerala, he established the Neuro Wellness Centre in Kochi, which has become the region\'s leading neurology practice. He runs a monthly free epilepsy clinic where he sees over 60 patients each session. His research on juvenile myoclonic epilepsy has been published in international journals, and he is a council member of the Indian Epilepsy Association.',
    trainingHospitals: ['NIMHANS Bengaluru', 'Epilepsy Foundation Training Center USA'],
    hospitalAffiliations: ['Neuro Wellness Centre Kochi', 'Amrita Institute of Medical Sciences'],
    awards: ['Kerala State Medical Award 2022', 'Indian Epilepsy Association Excellence Award 2019'],
    publications: 18,
    medicalCouncil: 'Kerala Medical Council',
    registrationYear: 2012,
    offersVideoConsult: true,
    offersAudioConsult: false,
    videoConsultFee: 600,
    audioConsultFee: null,
    availabilitySchedule: ALT_SCHEDULE,
    featuredReview: 'I had undiagnosed seizures for 3 years. Dr. Nair diagnosed JME within the first visit and has kept me seizure-free for 18 months.',
    featuredPatientName: 'Ananya M., Kochi',
  },

  'dr.sunita.rao@demo.hc': {
    hcDoctorId: 'HCD-2025-DERM-0001',
    careerJourney: 'Dr. Sunita Rao pursued MD Dermatology from Mysore Medical College and trained in advanced cosmetology at Manipal Hospital. She completed a fellowship in laser dermatology in Singapore. She founded Glow Skin Clinic in Koramangala, which today serves over 200 patients weekly. Her special interest in psoriasis and vitiligo management has led her to develop a holistic protocol combining biologics and lifestyle intervention that has shown remarkable results. She regularly contributes to the Indian Journal of Dermatology.',
    trainingHospitals: ['Mysore Medical College', 'Manipal Hospital Bengaluru', 'National Skin Centre Singapore'],
    hospitalAffiliations: ['Glow Skin Clinic Koramangala', 'Fortis Hospital Bengaluru'],
    awards: ['Best Dermatologist Bengaluru 2023 - IDA', 'Psoriasis Research Award 2021'],
    publications: 9,
    medicalCouncil: 'Karnataka Medical Council',
    registrationYear: 2015,
    offersVideoConsult: true,
    offersAudioConsult: true,
    videoConsultFee: 450,
    audioConsultFee: 350,
    availabilitySchedule: FULL_SCHEDULE,
    featuredReview: 'My psoriasis had been uncontrolled for 7 years. Dr. Rao put me on a new protocol and within 3 months my plaques had cleared by 80%.',
    featuredPatientName: 'Deepak R., Bengaluru',
  },

  'dr.vikram.bhat@demo.hc': {
    hcDoctorId: 'HCD-2025-ORTH-0001',
    careerJourney: 'Dr. Vikram Bhat completed MS Orthopaedics from MS Ramaiah Medical College and pursued a Fellowship in Sports Medicine at the Steadman Philippon Research Institute, USA. He has been at the forefront of minimally invasive joint replacement in Bengaluru. His signature "rapid recovery protocol" enables patients to walk within 24 hours of knee replacement. He is the team orthopaedic surgeon for a Bengaluru IPL franchise and has treated numerous national-level athletes. He performs in-person consultations only, with a focus on thorough pre-surgical evaluation.',
    trainingHospitals: ['MS Ramaiah Medical College', 'Steadman Philippon Research Institute USA'],
    hospitalAffiliations: ['BoneJoint Clinic Malleshwaram', 'Columbia Asia Hospital Bengaluru'],
    awards: ['Best Orthopaedic Surgeon Karnataka 2022', 'Sports Medicine Excellence Award 2020'],
    publications: 11,
    medicalCouncil: 'Karnataka Medical Council',
    registrationYear: 2008,
    offersVideoConsult: false,
    offersAudioConsult: false,
    videoConsultFee: null,
    audioConsultFee: null,
    availabilitySchedule: { Mon: ['09:00-14:00'], Wed: ['09:00-14:00'], Fri: ['09:00-14:00'], Sat: ['09:00-12:00'] },
    featuredReview: 'Dr. Bhat performed my bilateral knee replacement. I was walking with a cane by day 2 and running on a treadmill in 6 weeks. Absolutely life-changing.',
    featuredPatientName: 'Shyamala B., Bengaluru',
  },

  'dr.kavitha.iyer@demo.hc': {
    hcDoctorId: 'HCD-2025-GYNO-0001',
    careerJourney: 'Dr. Kavitha Iyer completed her MBBS and MD Gynaecology from Madras Medical College, followed by DNB from National Board of Examinations. She trained in laparoscopic surgery at the All India Institute of Medical Sciences. With 13 years of practice at Women Wellness Clinic in Anna Nagar, she has delivered over 2,000 babies and managed hundreds of complex PCOS and infertility cases. She established Chennai\'s first dedicated PCOS management clinic in 2018. She is a frequent speaker at FOGSI conferences and an advocate for evidence-based PCOS management without over-medication.',
    trainingHospitals: ['Madras Medical College', 'AIIMS Delhi', 'Seth GS Medical College Mumbai'],
    hospitalAffiliations: ['Women Wellness Clinic Anna Nagar', 'Apollo Hospitals Chennai'],
    awards: ['FOGSI Young Achiever Award 2019', 'Best Gynaecologist Tamil Nadu 2022'],
    publications: 16,
    medicalCouncil: 'Tamil Nadu Medical Council',
    registrationYear: 2011,
    offersVideoConsult: true,
    offersAudioConsult: true,
    videoConsultFee: 550,
    audioConsultFee: 400,
    availabilitySchedule: FULL_SCHEDULE,
    featuredReview: 'After 4 years of failed PCOS management, Dr. Iyer changed my protocol completely. I ovulated naturally for the first time in 3 years within 2 months.',
    featuredPatientName: 'Preethi K., Chennai',
  },

  'dr.suresh.pillai@demo.hc': {
    hcDoctorId: 'HCD-2025-PSYC-0001',
    careerJourney: 'Dr. Suresh Pillai completed MBBS and MD Psychiatry from Trivandrum Medical College. He trained in addiction medicine at NIMHANS and completed a fellowship in community psychiatry at the London School of Psychiatry. He founded Mind Matters Clinic with a mission to make mental health care accessible and destigmatised in Kerala. He was among the first psychiatrists in Kerala to offer online consultations, which he started in 2018 well before the pandemic. His work in addiction recovery has helped over 500 patients, and he speaks at schools and corporates on mental health awareness.',
    trainingHospitals: ['Government Medical College Thiruvananthapuram', 'NIMHANS Bengaluru', 'London School of Psychiatry UK'],
    hospitalAffiliations: ['Mind Matters Clinic Trivandrum', 'Government Medical College Trivandrum'],
    awards: ['Kerala Mental Health Award 2021', 'Best Psychiatrist South India 2022 - IPS'],
    publications: 8,
    medicalCouncil: 'Kerala Medical Council',
    registrationYear: 2013,
    offersVideoConsult: true,
    offersAudioConsult: true,
    videoConsultFee: 600,
    audioConsultFee: 500,
    availabilitySchedule: ALT_SCHEDULE,
    featuredReview: 'I was in a very dark place when I first met Dr. Pillai. Two years later, I am medication-free and running a business. He saved my life.',
    featuredPatientName: 'Arjun N., Kochi',
  },

  'dr.meena.sharma@demo.hc': {
    hcDoctorId: 'HCD-2025-PAED-0001',
    careerJourney: 'Dr. Meena Sharma completed MBBS and MD Paediatrics from SMS Medical College Jaipur, followed by a Fellowship in Neonatology from Fernandez Hospital Hyderabad. She has cared for over 3,800 children in 15 years of practice at Kids Care Clinic, Vaishali Nagar. Her neonatal ICU expertise means parents of premature babies trust her deeply. She established a free vaccination camp that runs every Sunday, serving families from low-income communities. Her research on childhood malnutrition interventions was cited in UNICEF India publications.',
    trainingHospitals: ['SMS Medical College Jaipur', 'Fernandez Hospital Hyderabad'],
    hospitalAffiliations: ['Kids Care Clinic Vaishali Nagar', 'Fortis Escorts Hospital Jaipur'],
    awards: ['Best Paediatrician Rajasthan 2023', 'UNICEF Child Health Champion 2020'],
    publications: 7,
    medicalCouncil: 'Rajasthan Medical Council',
    registrationYear: 2009,
    offersVideoConsult: true,
    offersAudioConsult: true,
    videoConsultFee: 400,
    audioConsultFee: 300,
    availabilitySchedule: FULL_SCHEDULE,
    featuredReview: 'My premature daughter spent 3 weeks in the NICU under Dr. Sharma\'s care. She is now 2 years old and perfectly healthy. We owe her everything.',
    featuredPatientName: 'Rekha G., Jaipur',
  },

  'dr.harish.menon@demo.hc': {
    hcDoctorId: 'HCD-2025-GAST-0001',
    careerJourney: 'Dr. Harish Menon completed his DM Gastroenterology from the prestigious PGI Chandigarh. He trained in advanced endoscopy techniques at the Tokyo Medical University, Japan. Back in Kochi, he established the GI Care Centre with state-of-the-art endoscopy equipment. He is one of the few gastroenterologists in Kerala trained in EUS (endoscopic ultrasound) and ERCP for biliary interventions. His work on NAFLD management in the Indian context has been published in internationally reputed journals.',
    trainingHospitals: ['PGI Chandigarh', 'Tokyo Medical University Japan'],
    hospitalAffiliations: ['GI Care Centre Ernakulam', 'Lakeshore Hospital Kochi'],
    awards: ['SGEI Young Gastroenterologist Award 2021'],
    publications: 12,
    medicalCouncil: 'Kerala Medical Council',
    registrationYear: 2014,
    offersVideoConsult: true,
    offersAudioConsult: false,
    videoConsultFee: 600,
    audioConsultFee: null,
    availabilitySchedule: ALT_SCHEDULE,
    featuredReview: 'Dr. Menon diagnosed my biliary stricture when 3 other doctors missed it. His ERCP procedure gave me immediate relief after 8 months of suffering.',
    featuredPatientName: 'Mathew J., Kochi',
  },

  'dr.anita.reddy@demo.hc': {
    hcDoctorId: 'HCD-2025-ENDO-0001',
    careerJourney: 'Dr. Anita Reddy completed her DM Endocrinology from Nizam\'s Institute of Medical Sciences, Hyderabad. She completed a research fellowship at the Joslin Diabetes Center, Boston. She founded Hormone Health Clinic in Banjara Hills with a focus on integrative management of thyroid, diabetes, and metabolic conditions. Her patient-first approach — spending 45 minutes with each new patient — has built tremendous trust in Hyderabad\'s medical community. She is an active member of the Endocrine Society of India.',
    trainingHospitals: ['NIMS Hyderabad', 'Joslin Diabetes Center Boston USA'],
    hospitalAffiliations: ['Hormone Health Clinic Banjara Hills', 'Care Hospitals Hyderabad'],
    awards: ['Best Endocrinologist Hyderabad 2023'],
    publications: 10,
    medicalCouncil: 'Telangana Medical Council',
    registrationYear: 2016,
    offersVideoConsult: true,
    offersAudioConsult: true,
    videoConsultFee: 550,
    audioConsultFee: 400,
    availabilitySchedule: FULL_SCHEDULE,
    featuredReview: 'My Hashimoto\'s thyroiditis was mismanaged for 5 years. Dr. Reddy\'s complete hormonal evaluation changed everything. I feel like myself again.',
    featuredPatientName: 'Usha V., Hyderabad',
  },

  // Remaining doctors get standard update data
  'dr.deepak.verma@demo.hc': {
    hcDoctorId: 'HCD-2025-PULM-0001',
    careerJourney: 'Dr. Deepak Verma trained in respiratory medicine at SGPGI Lucknow and completed a fellowship in Sleep Medicine at AIIMS Delhi. He has built Lung Care Centre into Lucknow\'s leading pulmonology practice, with special expertise in sleep-disordered breathing and ILD. He was among the first in Uttar Pradesh to set up a dedicated pulmonary rehabilitation programme for post-COVID lung recovery.',
    trainingHospitals: ['SGPGI Lucknow', 'AIIMS Delhi'],
    hospitalAffiliations: ['Lung Care Centre Gomti Nagar'],
    awards: ['UP Pulmonologist of the Year 2022'],
    publications: 8,
    medicalCouncil: 'Uttar Pradesh Medical Council',
    registrationYear: 2012,
    offersVideoConsult: true,
    offersAudioConsult: true,
    videoConsultFee: 450,
    audioConsultFee: 350,
    availabilitySchedule: FULL_SCHEDULE,
    featuredReview: 'Dr. Verma diagnosed my ILD within 2 consultations. His pulmonary rehab programme helped me get back to 70% lung function after COVID.',
    featuredPatientName: 'Sanjay M., Lucknow',
  },

  'dr.lakshmi.krishnan@demo.hc': {
    hcDoctorId: 'HCD-2025-RHEU-0001',
    careerJourney: 'Dr. Lakshmi Krishnan completed DM Rheumatology from Madras Medical College and trained in biologics therapy at King\'s College Hospital, London. She established Chennai\'s first dedicated rheumatology clinic with access to the full spectrum of biologic agents. Her work on lupus nephritis outcomes in South Indian patients has contributed to modified treatment protocols.',
    trainingHospitals: ['Madras Medical College', 'King\'s College Hospital London'],
    hospitalAffiliations: ['Arthritis & Rheumatology Clinic T Nagar', 'Apollo Hospitals Chennai'],
    awards: ['IRA Young Rheumatologist Award 2022'],
    publications: 13,
    medicalCouncil: 'Tamil Nadu Medical Council',
    registrationYear: 2015,
    offersVideoConsult: true,
    offersAudioConsult: true,
    videoConsultFee: 600,
    audioConsultFee: 450,
    availabilitySchedule: ALT_SCHEDULE,
    featuredReview: 'After 6 years of crippling RA, Dr. Krishnan put me on a biologic that gave me my life back. I can button my shirt again.',
    featuredPatientName: 'Jayalakshmi N., Chennai',
  },

  'dr.ramesh.patel@demo.hc': {
    hcDoctorId: 'HCD-2025-OPHT-0001',
    careerJourney: 'Dr. Ramesh Patel completed MS Ophthalmology from MS University Baroda and a Fellowship in Vitreoretinal Surgery at Aravind Eye Hospital Madurai — the world\'s largest eye care institution. He established Vision Care Eye Hospital in Ahmedabad focusing on diabetic retinopathy and macular degeneration. He has performed over 4,000 vitreoretinal surgeries. He offers in-clinic consultations only — video consultations are not available for surgical cases.',
    trainingHospitals: ['MS University Baroda', 'Aravind Eye Hospital Madurai'],
    hospitalAffiliations: ['Vision Care Eye Hospital CG Road', 'HCG Hospital Ahmedabad'],
    awards: ['Best Vitreoretinal Surgeon Gujarat 2023', 'Aravind Alumni Excellence Award'],
    publications: 19,
    medicalCouncil: 'Gujarat Medical Council',
    registrationYear: 2007,
    offersVideoConsult: false,
    offersAudioConsult: false,
    videoConsultFee: null,
    audioConsultFee: null,
    availabilitySchedule: { Mon: ['09:00-14:00'], Tue: ['09:00-14:00'], Thu: ['09:00-14:00'], Fri: ['09:00-14:00'], Sat: ['09:00-12:00'] },
    featuredReview: 'Dr. Patel caught my diabetic macular edema before I lost vision in my left eye. His injection therapy has stabilised my vision completely.',
    featuredPatientName: 'Hasmukh S., Ahmedabad',
  },

  'dr.nisha.gupta@demo.hc': {
    hcDoctorId: 'HCD-2025-HAEM-0001',
    careerJourney: 'Dr. Nisha Gupta completed DM Haematology from AIIMS Delhi and trained in bone marrow transplantation at Tata Memorial Hospital Mumbai. She established Delhi\'s dedicated thalassaemia management centre at Blood & Cancer Care in Rajouri Garden, offering comprehensive care from diagnosis through chelation therapy and transplant referral.',
    trainingHospitals: ['AIIMS Delhi', 'Tata Memorial Hospital Mumbai'],
    hospitalAffiliations: ['Blood & Cancer Care Rajouri Garden', 'Fortis Hospital Delhi'],
    awards: ['Delhi Haematology Society Young Achiever 2022'],
    publications: 6,
    medicalCouncil: 'Delhi Medical Council',
    registrationYear: 2017,
    offersVideoConsult: true,
    offersAudioConsult: true,
    videoConsultFee: 700,
    audioConsultFee: 500,
    availabilitySchedule: ALT_SCHEDULE,
    featuredReview: 'My thalassaemia major was mismanaged for years. Dr. Gupta restructured my entire chelation protocol and my ferritin has come down from 3200 to 800.',
    featuredPatientName: 'Harpreet K., Delhi',
  },

  'dr.anil.joshi@demo.hc': {
    hcDoctorId: 'HCD-2025-NEPH-0001',
    careerJourney: 'Dr. Anil Joshi completed DM Nephrology from KEM Hospital Mumbai and trained in peritoneal dialysis at the University of Toronto, Canada. At Kidney Care Centre, Dadar, he manages one of Mumbai\'s busiest CKD clinics. He has trained 15 nephrologists who now practice across Maharashtra and is known for his work on CKD nutrition protocols.',
    trainingHospitals: ['KEM Hospital Mumbai', 'University of Toronto Canada'],
    hospitalAffiliations: ['Kidney Care Centre Dadar', 'Hinduja Hospital Mumbai'],
    awards: ['Maharashtra Nephrology Excellence Award 2021'],
    publications: 11,
    medicalCouncil: 'Maharashtra Medical Council',
    registrationYear: 2010,
    offersVideoConsult: true,
    offersAudioConsult: true,
    videoConsultFee: 650,
    audioConsultFee: 500,
    availabilitySchedule: FULL_SCHEDULE,
    featuredReview: 'Dr. Joshi managed my transition from HD to peritoneal dialysis seamlessly. My quality of life has improved dramatically.',
    featuredPatientName: 'Pradeep T., Mumbai',
  },

  'dr.pooja.singh@demo.hc': {
    hcDoctorId: 'HCD-2025-ONCO-0001',
    careerJourney: 'Dr. Pooja Singh completed DM Medical Oncology from Tata Memorial Hospital Mumbai — India\'s premier cancer centre. She trained in targeted therapy protocols at MD Anderson Cancer Center, USA. She established Cancer Care Clinic in Parel, Mumbai, with a focus on personalised medicine and minimising treatment side effects. She runs patient support groups for breast cancer survivors.',
    trainingHospitals: ['Tata Memorial Hospital Mumbai', 'MD Anderson Cancer Center USA'],
    hospitalAffiliations: ['Cancer Care Clinic Parel', 'Tata Memorial Hospital Mumbai'],
    awards: ['ISMPO Young Oncologist Award 2021', 'Breast Cancer Foundation Award 2023'],
    publications: 17,
    medicalCouncil: 'Maharashtra Medical Council',
    registrationYear: 2013,
    offersVideoConsult: true,
    offersAudioConsult: true,
    videoConsultFee: 900,
    audioConsultFee: 700,
    availabilitySchedule: ALT_SCHEDULE,
    featuredReview: 'Dr. Singh chose a targeted therapy for my HER2+ breast cancer that had minimal side effects. I finished treatment and never lost my hair.',
    featuredPatientName: 'Kavitha R., Mumbai',
  },

  'dr.manoj.desai@demo.hc': {
    hcDoctorId: 'HCD-2025-CARD-0002',
    careerJourney: 'Dr. Manoj Desai trained at Seth GS Medical College Mumbai and completed his MD Cardiology from Grant Medical College. He established Cardiac Wellness Centre in Bandra with a preventive cardiology focus, targeting risk factors before they become diseases. He conducts corporate health camps across Mumbai and is a passionate advocate for lifestyle medicine.',
    trainingHospitals: ['Seth GS Medical College Mumbai', 'Grant Medical College Mumbai'],
    hospitalAffiliations: ['Cardiac Wellness Centre Bandra'],
    awards: ['Preventive Cardiology Excellence Award Mumbai 2022'],
    publications: 6,
    medicalCouncil: 'Maharashtra Medical Council',
    registrationYear: 2016,
    offersVideoConsult: true,
    offersAudioConsult: true,
    videoConsultFee: 550,
    audioConsultFee: 400,
    availabilitySchedule: EVENING_SCHEDULE,
    featuredReview: 'Dr. Desai caught my pre-diabetes and borderline hypertension at my annual check. His diet-first approach has kept me off medications for 2 years.',
    featuredPatientName: 'Rahul B., Mumbai',
  },

  'dr.swati.nambiar@demo.hc': {
    hcDoctorId: 'HCD-2025-NEUR-0002',
    careerJourney: 'Dr. Swati Nambiar completed MD Neurology from Calicut Medical College and trained in movement disorders at National Hospital for Neurology, London. She established Brain & Spine Clinic in Kozhikode and has become Kerala\'s leading neurologist for Parkinson\'s disease management, offering DBS (deep brain stimulation) referral pathways.',
    trainingHospitals: ['Calicut Medical College', 'National Hospital for Neurology London'],
    hospitalAffiliations: ['Brain & Spine Clinic Kozhikode', 'Baby Memorial Hospital Calicut'],
    awards: ['MDS-India Young Investigator Award 2022'],
    publications: 5,
    medicalCouncil: 'Kerala Medical Council',
    registrationYear: 2018,
    offersVideoConsult: true,
    offersAudioConsult: true,
    videoConsultFee: 600,
    audioConsultFee: 450,
    availabilitySchedule: ALT_SCHEDULE,
    featuredReview: 'My father\'s Parkinson\'s tremors were so severe he couldn\'t feed himself. On Dr. Nambiar\'s medication adjustment, he is back to near-normal function.',
    featuredPatientName: 'Aswin K., Kozhikode',
  },

  'dr.rohit.bose@demo.hc': {
    hcDoctorId: 'HCD-2025-PSYC-0002',
    careerJourney: 'Dr. Rohit Bose completed MD Psychiatry from Calcutta Medical College and a fellowship in Child & Adolescent Psychiatry from NIMHANS. He is one of West Bengal\'s few psychiatrists dedicated exclusively to children\'s mental health. His clinic, Child Mind Clinic in Salt Lake, has a 6-month waiting list, reflecting the enormous unmet need in paediatric mental health.',
    trainingHospitals: ['Calcutta Medical College', 'NIMHANS Bengaluru'],
    hospitalAffiliations: ['Child Mind Clinic Salt Lake', 'AMRI Hospital Kolkata'],
    awards: ['WB Child Mental Health Advocate Award 2023'],
    publications: 9,
    medicalCouncil: 'West Bengal Medical Council',
    registrationYear: 2014,
    offersVideoConsult: true,
    offersAudioConsult: true,
    videoConsultFee: 650,
    audioConsultFee: 500,
    availabilitySchedule: FULL_SCHEDULE,
    featuredReview: 'Dr. Bose diagnosed my son\'s ADHD and autism combination accurately where 3 previous assessments had missed it. The therapy plan has transformed school life.',
    featuredPatientName: 'Rina C., Kolkata',
  },

  'dr.divya.hegde@demo.hc': {
    hcDoctorId: 'HCD-2025-GYNO-0002',
    careerJourney: 'Dr. Divya Hegde completed MS Gynaecology from St John\'s Medical College Bengaluru and a fellowship in Reproductive Medicine from Bharat Hospital. She specialises in endometriosis laparoscopy and fertility preservation. She co-founded the Endometriosis India Foundation and runs free awareness camps quarterly.',
    trainingHospitals: ['St John\'s Medical College Bengaluru', 'Bharat Hospital Bengaluru'],
    hospitalAffiliations: ['Fertility & Women Care Jayanagar', 'Manipal Hospital Bengaluru'],
    awards: ['Endometriosis Foundation India Champion 2023'],
    publications: 8,
    medicalCouncil: 'Karnataka Medical Council',
    registrationYear: 2015,
    offersVideoConsult: true,
    offersAudioConsult: true,
    videoConsultFee: 500,
    audioConsultFee: 380,
    availabilitySchedule: ALT_SCHEDULE,
    featuredReview: 'After 8 years of endometriosis pain, Dr. Hegde\'s laparoscopy found and removed three deep lesions. I am finally pain-free for the first time.',
    featuredPatientName: 'Nandini S., Bengaluru',
  },

  'dr.sanjay.kapoor@demo.hc': {
    hcDoctorId: 'HCD-2025-UROL-0001',
    careerJourney: 'Dr. Sanjay Kapoor completed MCh Urology from AIIMS Delhi and trained in robotic surgery at the Vattikuti Urology Institute, Henry Ford Hospital, USA. He established Delhi\'s premier robotic urology centre at Urology & Andrology Centre, South Extension. He has performed over 800 robotic prostatectomies with continence outcomes matching international standards. He offers in-person consultations only for surgical evaluation.',
    trainingHospitals: ['AIIMS Delhi', 'Vattikuti Urology Institute USA'],
    hospitalAffiliations: ['Urology & Andrology Centre South Extension', 'Primus Super Speciality Hospital Delhi'],
    awards: ['USI Young Urologist Excellence Award 2020', 'Best Robotic Surgeon Delhi 2023'],
    publications: 21,
    medicalCouncil: 'Delhi Medical Council',
    registrationYear: 2009,
    offersVideoConsult: false,
    offersAudioConsult: false,
    videoConsultFee: null,
    audioConsultFee: null,
    availabilitySchedule: { Tue: ['10:00-14:00'], Thu: ['10:00-14:00'], Sat: ['09:00-13:00'] },
    featuredReview: 'Dr. Kapoor\'s robotic prostatectomy was nerve-sparing and I was continent within 6 weeks. His outcomes are truly world-class.',
    featuredPatientName: 'Subhash M., Delhi',
  },

  'dr.usha.mishra@demo.hc': {
    hcDoctorId: 'HCD-2025-PHYS-0001',
    careerJourney: 'Dr. Usha Mishra holds MPT Sports from SGPGI Lucknow and a PhD in rehabilitation sciences. She established PhysioPlus Clinic with expertise in post-surgical rehabilitation and neurological recovery. She designed the post-COVID rehabilitation protocol used by 12 hospitals in Uttar Pradesh.',
    trainingHospitals: ['SGPGI Lucknow'],
    hospitalAffiliations: ['PhysioPlus Clinic Gomti Nagar'],
    awards: ['UP Physiotherapy Excellence Award 2022'],
    publications: 7,
    medicalCouncil: 'UP Paramedical Council',
    registrationYear: 2011,
    offersVideoConsult: true,
    offersAudioConsult: true,
    videoConsultFee: 350,
    audioConsultFee: 250,
    availabilitySchedule: FULL_SCHEDULE,
    featuredReview: 'After my stroke, Dr. Mishra\'s neuro-rehab programme helped me recover 80% of my hand function. Her patience and expertise are extraordinary.',
    featuredPatientName: 'Ramesh S., Lucknow',
  },

  'dr.kiran.yadav@demo.hc': {
    hcDoctorId: 'HCD-2025-DIAB-0002',
    careerJourney: 'Dr. Kiran Yadav completed MD Endocrinology from SMS Medical College Jaipur. He established Sugar Control Clinic in Malviya Nagar with India\'s first dedicated diabetic foot clinic in a tier-2 city. His protocol for preventing diabetes-related amputations has been adopted by the Rajasthan government.',
    trainingHospitals: ['SMS Medical College Jaipur'],
    hospitalAffiliations: ['Sugar Control Clinic Malviya Nagar'],
    awards: ['Rajasthan Diabetes Prevention Award 2023'],
    publications: 5,
    medicalCouncil: 'Rajasthan Medical Council',
    registrationYear: 2017,
    offersVideoConsult: true,
    offersAudioConsult: true,
    videoConsultFee: 400,
    audioConsultFee: 300,
    availabilitySchedule: FULL_SCHEDULE,
    featuredReview: 'Dr. Yadav caught my peripheral neuropathy early and started me on a foot care regimen. Two years later, no ulcers, no amputation. I owe him my foot.',
    featuredPatientName: 'Mohan L., Jaipur',
  },

  'dr.geeta.pandey@demo.hc': {
    hcDoctorId: 'HCD-2025-NUTR-0001',
    careerJourney: 'Dr. Geeta Pandey holds a PhD in Clinical Nutrition and is a Registered Dietitian. She established Nourish Diet Clinic in Hazratganj with a focus on therapeutic nutrition for metabolic diseases. Her PCOS nutrition protocol has been featured in multiple national media outlets. She conducts free nutrition workshops at government hospitals monthly.',
    trainingHospitals: ['Lucknow University', 'SGPGI Lucknow'],
    hospitalAffiliations: ['Nourish Diet Clinic Hazratganj', 'Medanta Lucknow'],
    awards: ['IDA Nutritionist of the Year 2023'],
    publications: 15,
    medicalCouncil: 'Indian Dietetic Association',
    registrationYear: 2013,
    offersVideoConsult: true,
    offersAudioConsult: true,
    videoConsultFee: 300,
    audioConsultFee: 200,
    availabilitySchedule: FULL_SCHEDULE,
    featuredReview: 'Dr. Pandey\'s PCOS nutrition plan regulated my cycle in 3 months without medication. Her approach is scientific, practical and deeply compassionate.',
    featuredPatientName: 'Sunita A., Lucknow',
  },

  'dr.prakash.thakur@demo.hc': {
    hcDoctorId: 'HCD-2025-CARD-0003',
    careerJourney: 'Dr. Prakash Thakur is among India\'s most experienced cardiac electrophysiologists. He trained at AIIMS Delhi and the Texas Heart Institute, USA. With 20 years of experience and 3,600 patients, he is the go-to specialist for complex arrhythmias, atrial fibrillation ablation, and pacemaker implantation in Mumbai. He has performed over 2,000 catheter ablations.',
    trainingHospitals: ['AIIMS Delhi', 'Texas Heart Institute Houston USA'],
    hospitalAffiliations: ['Rhythm Heart Care Churchgate', 'Breach Candy Hospital Mumbai'],
    awards: ['CSI Lifetime Achievement Award 2023', 'HRS Fellow 2018'],
    publications: 38,
    medicalCouncil: 'Maharashtra Medical Council',
    registrationYear: 2004,
    offersVideoConsult: true,
    offersAudioConsult: true,
    videoConsultFee: 800,
    audioConsultFee: 600,
    availabilitySchedule: ALT_SCHEDULE,
    featuredReview: 'I had AF for 10 years and tried 4 medications. Dr. Thakur\'s ablation procedure ended my AF permanently. Best medical decision of my life.',
    featuredPatientName: 'Vijay K., Mumbai',
  },

  'dr.rekha.bansal@demo.hc': {
    hcDoctorId: 'HCD-2025-DERM-0002',
    careerJourney: 'Dr. Rekha Bansal completed MD Dermatology from MAMC Delhi and trained in trichology at the International Society of Hair Restoration Surgery. She specialises in alopecia and vitiligo at Skin & Hair Clinic, Lajpat Nagar, and offers PRP and microneedling therapies. She is frequently invited to speak at dermatology conferences on hair loss in Indian women.',
    trainingHospitals: ['Maulana Azad Medical College Delhi'],
    hospitalAffiliations: ['Skin & Hair Clinic Lajpat Nagar'],
    awards: ['IADVL Delhi Branch Excellence Award 2022'],
    publications: 6,
    medicalCouncil: 'Delhi Medical Council',
    registrationYear: 2016,
    offersVideoConsult: true,
    offersAudioConsult: true,
    videoConsultFee: 420,
    audioConsultFee: 320,
    availabilitySchedule: FULL_SCHEDULE,
    featuredReview: 'My alopecia areata was spreading rapidly. Dr. Bansal\'s combination of PRP and immunotherapy has regrown 70% of my hair in 6 months.',
    featuredPatientName: 'Meena D., Delhi',
  },

  'dr.anil.naik@demo.hc': {
    hcDoctorId: 'HCD-2025-GAST-0002',
    careerJourney: 'Dr. Anil Naik completed DM Gastroenterology from BJ Medical College Ahmedabad and trained in advanced endoscopy at the Asian Endoscopy Academy, Singapore. He established Digestive Health Clinic in Vastrapur and is known for his expertise in ERCP and management of fatty liver disease in the Gujarati population.',
    trainingHospitals: ['BJ Medical College Ahmedabad', 'Asian Endoscopy Academy Singapore'],
    hospitalAffiliations: ['Digestive Health Clinic Vastrapur', 'Apollo Hospital Ahmedabad'],
    awards: ['SGEI West Zone Gastroenterologist Award 2022'],
    publications: 9,
    medicalCouncil: 'Gujarat Medical Council',
    registrationYear: 2014,
    offersVideoConsult: true,
    offersAudioConsult: true,
    videoConsultFee: 580,
    audioConsultFee: 420,
    availabilitySchedule: FULL_SCHEDULE,
    featuredReview: 'NAFLD detected 5 years ago, now at stage 2 fibrosis. Dr. Naik\'s aggressive lifestyle + pharmacotherapy protocol has reversed it to stage 1.',
    featuredPatientName: 'Hardik P., Ahmedabad',
  },

  'dr.shobha.ahuja@demo.hc': {
    hcDoctorId: 'HCD-2025-ONCO-0002',
    careerJourney: 'Dr. Shobha Ahuja completed MD Radiation Oncology from PGI Chandigarh and trained in stereotactic radiosurgery at Memorial Sloan Kettering, USA. She is a pioneer of stereotactic body radiotherapy (SBRT) in Punjab. She offers in-clinic consultation only — follow-up calls available by audio.',
    trainingHospitals: ['PGI Chandigarh', 'Memorial Sloan Kettering New York USA'],
    hospitalAffiliations: ['Cancer Treatment Centre Sector 32', 'Max Super Speciality Hospital Mohali'],
    awards: ['AROI Punjab Chapter Excellence Award 2022'],
    publications: 15,
    medicalCouncil: 'Punjab Medical Council',
    registrationYear: 2011,
    offersVideoConsult: false,
    offersAudioConsult: true,
    videoConsultFee: null,
    audioConsultFee: 600,
    availabilitySchedule: { Mon: ['10:00-15:00'], Wed: ['10:00-15:00'], Fri: ['10:00-14:00'] },
    featuredReview: 'Dr. Ahuja\'s SBRT for my head and neck cancer had minimal side effects compared to conventional radiation. Her expertise and empathy are remarkable.',
    featuredPatientName: 'Gurpreet S., Chandigarh',
  },

  'dr.tarun.goswami@demo.hc': {
    hcDoctorId: 'HCD-2025-PAED-0002',
    careerJourney: 'Dr. Tarun Goswami completed MD Paediatrics from Calcutta Medical College and a fellowship in Paediatric Allergy & Immunology from PGIMER Chandigarh. He established Child Allergy Clinic in New Town, Kolkata — the only dedicated paediatric allergy practice in the area, serving children from across eastern India.',
    trainingHospitals: ['Calcutta Medical College', 'PGIMER Chandigarh'],
    hospitalAffiliations: ['Child Allergy Clinic New Town', 'Medica Superspecialty Hospital Kolkata'],
    awards: ['IACAI Young Allergist Award 2023'],
    publications: 8,
    medicalCouncil: 'West Bengal Medical Council',
    registrationYear: 2015,
    offersVideoConsult: true,
    offersAudioConsult: true,
    videoConsultFee: 380,
    audioConsultFee: 280,
    availabilitySchedule: FULL_SCHEDULE,
    featuredReview: 'My son had anaphylactic food allergies that terrified us. Dr. Goswami\'s oral immunotherapy programme has reduced his peanut sensitivity by 80%.',
    featuredPatientName: 'Priyanka D., Kolkata',
  },

  'dr.radha.tiwari@demo.hc': {
    hcDoctorId: 'HCD-2025-PSYC-0003',
    careerJourney: 'Dr. Radha Tiwari completed MD Psychiatry from KGMU Lucknow and a fellowship in Women\'s Mental Health from the Royal College of Psychiatrists, UK. She is Lucknow\'s leading specialist in postpartum depression and perinatal mental health. She runs a "Mothers Matter" support group with over 200 active members and is a vocal mental health advocate on social media.',
    trainingHospitals: ['KGMU Lucknow', 'Royal College of Psychiatrists London UK'],
    hospitalAffiliations: ['Mindful Healing Clinic Indira Nagar', 'Medanta Lucknow'],
    awards: ['WPA Women\'s Mental Health Award 2023', 'UP Mental Health Champion 2022'],
    publications: 10,
    medicalCouncil: 'Uttar Pradesh Medical Council',
    registrationYear: 2016,
    offersVideoConsult: true,
    offersAudioConsult: true,
    videoConsultFee: 550,
    audioConsultFee: 420,
    availabilitySchedule: FULL_SCHEDULE,
    featuredReview: 'I had severe postpartum depression and couldn\'t bond with my baby. Dr. Tiwari\'s trauma-informed care helped me recover and become the mother I wanted to be.',
    featuredPatientName: 'Archana V., Lucknow',
  },
};

async function main() {
  console.log('🔄 Starting doctor profile update seed...\n');

  let updated = 0;
  let skipped = 0;
  let errors  = 0;

  for (const [email, data] of Object.entries(DOCTOR_UPDATES)) {
    try {
      // Find doctor by email via User
      const user = await prisma.user.findUnique({
        where: { email },
        include: { doctorProfile: { select: { id: true, hcDoctorId: true } } },
      });

      if (!user || !user.doctorProfile) {
        console.log(`  ⏭  Not found: ${email}`);
        skipped++;
        continue;
      }

      const profile = user.doctorProfile;

      // Build update payload
      const updateData: any = {
        careerJourney:       data.careerJourney,
        trainingHospitals:   data.trainingHospitals,
        hospitalAffiliations: data.hospitalAffiliations,
        awards:              data.awards,
        publications:        data.publications,
        medicalCouncil:      data.medicalCouncil,
        registrationYear:    data.registrationYear,
        offersVideoConsult:  data.offersVideoConsult,
        offersAudioConsult:  data.offersAudioConsult,
        offersChatConsult:   false,
        offersInPerson:      true,
        videoConsultFee:     data.videoConsultFee,
        audioConsultFee:     data.audioConsultFee,
        availabilitySchedule: data.availabilitySchedule,
        featuredReview:      data.featuredReview,
        featuredPatientName: data.featuredPatientName,
        verificationStatus:  'VERIFIED',
        verifiedAt:          new Date('2025-01-01'),
        isAcceptingNewPatients: true,
      };

      // Only set hcDoctorId if not already set (avoid overwriting real IDs)
      if (!profile.hcDoctorId) {
        updateData.hcDoctorId = data.hcDoctorId;
      }

      // Compute profile score
      const merged = { ...profile, ...updateData };
      updateData.profileScore    = Math.min(100, 40 + Object.keys(updateData).filter(k => updateData[k] != null && updateData[k] !== false).length * 4);
      updateData.isProfileComplete = updateData.profileScore >= 70;

      await prisma.doctorProfile.update({
        where: { id: profile.id },
        data:  updateData,
      });

      // Update User.registrationId if not set
      if (!user.registrationId) {
        await prisma.user.update({
          where: { id: user.id },
          data:  { registrationId: data.hcDoctorId },
        });
      }

      console.log(`  ✅ Updated: ${email} → ${data.hcDoctorId}`);
      updated++;
    } catch (e: any) {
      console.log(`  ❌ Error for ${email}: ${e.message}`);
      errors++;
    }
  }

  console.log('\n──────────────────────────────────────');
  console.log(`✅ Updated:  ${updated}`);
  console.log(`⏭  Skipped:  ${skipped}`);
  console.log(`❌ Errors:   ${errors}`);
  console.log('──────────────────────────────────────');
  console.log('Doctor profile update seed complete.');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
