/**
 * HealthConnect India — Prisma Seed Script
 * Uses hashPassword() from your actual utils/password.ts (bcrypt SALT_ROUNDS=12)
 * so login will work with password: Test@HC2025
 *
 * Run from: /var/www/healthconnect/healthconnect-api
 *   npx ts-node src/seed.ts
 *   OR add to package.json: "seed": "ts-node src/seed.ts"
 *   then: npm run seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12; // Must match src/utils/password.ts

const hashPassword = (p: string) => bcrypt.hash(p, SALT_ROUNDS);

// Password for ALL seeded test accounts
const TEST_PASSWORD = 'Test@HC2025';

// ── Helpers ──────────────────────────────────────────────────────────────────
const uid  = (n: string) => `seed-u-${n}`;
const ppid = (n: string) => `seed-pp-${n}`;
const dpid = (n: string) => `seed-dp-${n}`;
const cmid = (n: string) => `seed-cm-${n}`;
const mbid = (n: string) => `seed-mb-${n}`;
const pid  = (n: string) => `seed-post-${n}`;

async function main() {
  console.log('🌱 Starting HealthConnect seed...');
  console.log(`   Password for all seeded accounts: ${TEST_PASSWORD}`);

  const hash = await hashPassword(TEST_PASSWORD);
  console.log('   ✅ Password hash generated (bcrypt 12 rounds)');

  // ── 1. PATIENT USERS (35) ──────────────────────────────────────────────────
  console.log('\n📋 Seeding 35 patients...');

  const patients = [
    { n:'001', email:'priya.sharma@demo.hc',      first:'Priya',    last:'Sharma',      phone:'9876543201', dob:'1988-03-15', gender:'FEMALE' as const, blood:'B_POSITIVE' as const,  city:'Mumbai',           state:'Maharashtra',  pin:'400001', lang:'hi' },
    { n:'002', email:'rahul.verma@demo.hc',        first:'Rahul',    last:'Verma',       phone:'9876543202', dob:'1990-07-22', gender:'MALE'   as const, blood:'O_POSITIVE' as const,  city:'Delhi',            state:'Delhi',        pin:'110001', lang:'hi' },
    { n:'003', email:'sunita.patel@demo.hc',       first:'Sunita',   last:'Patel',       phone:'9876543203', dob:'1975-11-10', gender:'FEMALE' as const, blood:'A_POSITIVE' as const,  city:'Ahmedabad',        state:'Gujarat',      pin:'380001', lang:'gu' },
    { n:'004', email:'arjun.nair@demo.hc',         first:'Arjun',    last:'Nair',        phone:'9876543204', dob:'1982-05-30', gender:'MALE'   as const, blood:'B_NEGATIVE' as const,  city:'Kochi',            state:'Kerala',       pin:'682001', lang:'ml' },
    { n:'005', email:'meena.iyer@demo.hc',         first:'Meena',    last:'Iyer',        phone:'9876543205', dob:'1979-09-14', gender:'FEMALE' as const, blood:'AB_POSITIVE' as const, city:'Chennai',          state:'Tamil Nadu',   pin:'600001', lang:'ta' },
    { n:'006', email:'vikram.singh@demo.hc',       first:'Vikram',   last:'Singh',       phone:'9876543206', dob:'1985-01-25', gender:'MALE'   as const, blood:'O_NEGATIVE' as const,  city:'Jaipur',           state:'Rajasthan',    pin:'302001', lang:'hi' },
    { n:'007', email:'anjali.desai@demo.hc',       first:'Anjali',   last:'Desai',       phone:'9876543207', dob:'1993-06-18', gender:'FEMALE' as const, blood:'A_NEGATIVE' as const,  city:'Pune',             state:'Maharashtra',  pin:'411001', lang:'mr' },
    { n:'008', email:'suresh.kumar@demo.hc',       first:'Suresh',   last:'Kumar',       phone:'9876543208', dob:'1968-12-05', gender:'MALE'   as const, blood:'B_POSITIVE' as const,  city:'Bengaluru',        state:'Karnataka',    pin:'560001', lang:'kn' },
    { n:'009', email:'kavitha.reddy@demo.hc',      first:'Kavitha',  last:'Reddy',       phone:'9876543209', dob:'1991-08-28', gender:'FEMALE' as const, blood:'O_POSITIVE' as const,  city:'Hyderabad',        state:'Telangana',    pin:'500001', lang:'te' },
    { n:'010', email:'deepak.joshi@demo.hc',       first:'Deepak',   last:'Joshi',       phone:'9876543210', dob:'1977-04-03', gender:'MALE'   as const, blood:'AB_NEGATIVE' as const, city:'Lucknow',          state:'Uttar Pradesh',pin:'226001', lang:'hi' },
    { n:'011', email:'lakshmi.menon@demo.hc',      first:'Lakshmi',  last:'Menon',       phone:'9876543211', dob:'1986-02-20', gender:'FEMALE' as const, blood:'A_POSITIVE' as const,  city:'Thiruvananthapuram',state:'Kerala',       pin:'695001', lang:'ml' },
    { n:'012', email:'ramesh.gupta@demo.hc',       first:'Ramesh',   last:'Gupta',       phone:'9876543212', dob:'1972-10-15', gender:'MALE'   as const, blood:'B_POSITIVE' as const,  city:'Kanpur',           state:'Uttar Pradesh',pin:'208001', lang:'hi' },
    { n:'013', email:'nisha.malhotra@demo.hc',     first:'Nisha',    last:'Malhotra',    phone:'9876543213', dob:'1995-03-08', gender:'FEMALE' as const, blood:'O_POSITIVE' as const,  city:'Chandigarh',       state:'Punjab',       pin:'160001', lang:'pa' },
    { n:'014', email:'arun.pillai@demo.hc',        first:'Arun',     last:'Pillai',      phone:'9876543214', dob:'1980-07-17', gender:'MALE'   as const, blood:'A_NEGATIVE' as const,  city:'Coimbatore',       state:'Tamil Nadu',   pin:'641001', lang:'ta' },
    { n:'015', email:'pooja.saxena@demo.hc',       first:'Pooja',    last:'Saxena',      phone:'9876543215', dob:'1997-11-22', gender:'FEMALE' as const, blood:'B_NEGATIVE' as const,  city:'Bhopal',           state:'Madhya Pradesh',pin:'462001',lang:'hi' },
    { n:'016', email:'manoj.tiwari@demo.hc',       first:'Manoj',    last:'Tiwari',      phone:'9876543216', dob:'1983-06-09', gender:'MALE'   as const, blood:'O_POSITIVE' as const,  city:'Patna',            state:'Bihar',        pin:'800001', lang:'hi' },
    { n:'017', email:'swati.bose@demo.hc',         first:'Swati',    last:'Bose',        phone:'9876543217', dob:'1989-01-14', gender:'FEMALE' as const, blood:'AB_POSITIVE' as const, city:'Kolkata',          state:'West Bengal',  pin:'700001', lang:'bn' },
    { n:'018', email:'harish.rao@demo.hc',         first:'Harish',   last:'Rao',         phone:'9876543218', dob:'1974-09-27', gender:'MALE'   as const, blood:'A_POSITIVE' as const,  city:'Visakhapatnam',    state:'Andhra Pradesh',pin:'530001',lang:'te' },
    { n:'019', email:'geeta.choudhary@demo.hc',    first:'Geeta',    last:'Choudhary',   phone:'9876543219', dob:'1992-04-11', gender:'FEMALE' as const, blood:'B_POSITIVE' as const,  city:'Jaipur',           state:'Rajasthan',    pin:'302002', lang:'hi' },
    { n:'020', email:'rohit.mishra@demo.hc',       first:'Rohit',    last:'Mishra',      phone:'9876543220', dob:'1987-08-06', gender:'MALE'   as const, blood:'O_NEGATIVE' as const,  city:'Indore',           state:'Madhya Pradesh',pin:'452001',lang:'hi' },
    { n:'021', email:'divya.krishnan@demo.hc',     first:'Divya',    last:'Krishnan',    phone:'9876543221', dob:'1994-12-19', gender:'FEMALE' as const, blood:'A_POSITIVE' as const,  city:'Mysuru',           state:'Karnataka',    pin:'570001', lang:'kn' },
    { n:'022', email:'sanjay.pandey@demo.hc',      first:'Sanjay',   last:'Pandey',      phone:'9876543222', dob:'1978-03-24', gender:'MALE'   as const, blood:'B_POSITIVE' as const,  city:'Varanasi',         state:'Uttar Pradesh',pin:'221001', lang:'hi' },
    { n:'023', email:'usha.nambiar@demo.hc',       first:'Usha',     last:'Nambiar',     phone:'9876543223', dob:'1970-07-30', gender:'FEMALE' as const, blood:'O_POSITIVE' as const,  city:'Kozhikode',        state:'Kerala',       pin:'673001', lang:'ml' },
    { n:'024', email:'kiran.hegde@demo.hc',        first:'Kiran',    last:'Hegde',       phone:'9876543224', dob:'1996-02-05', gender:'MALE'   as const, blood:'AB_POSITIVE' as const, city:'Mangaluru',        state:'Karnataka',    pin:'575001', lang:'kn' },
    { n:'025', email:'anita.kapoor@demo.hc',       first:'Anita',    last:'Kapoor',      phone:'9876543225', dob:'1984-10-12', gender:'FEMALE' as const, blood:'B_NEGATIVE' as const,  city:'Amritsar',         state:'Punjab',       pin:'143001', lang:'pa' },
    { n:'026', email:'prakash.yadav@demo.hc',      first:'Prakash',  last:'Yadav',       phone:'9876543226', dob:'1976-05-28', gender:'MALE'   as const, blood:'A_POSITIVE' as const,  city:'Nagpur',           state:'Maharashtra',  pin:'440001', lang:'mr' },
    { n:'027', email:'rekha.srivastava@demo.hc',   first:'Rekha',    last:'Srivastava',  phone:'9876543227', dob:'1991-09-03', gender:'FEMALE' as const, blood:'O_POSITIVE' as const,  city:'Agra',             state:'Uttar Pradesh',pin:'282001', lang:'hi' },
    { n:'028', email:'anil.bansal@demo.hc',        first:'Anil',     last:'Bansal',      phone:'9876543228', dob:'1969-01-16', gender:'MALE'   as const, blood:'B_POSITIVE' as const,  city:'Faridabad',        state:'Haryana',      pin:'121001', lang:'hi' },
    { n:'029', email:'shobha.naik@demo.hc',        first:'Shobha',   last:'Naik',        phone:'9876543229', dob:'1988-06-21', gender:'FEMALE' as const, blood:'A_NEGATIVE' as const,  city:'Goa',              state:'Goa',          pin:'403001', lang:'kn' },
    { n:'030', email:'tarun.ahuja@demo.hc',        first:'Tarun',    last:'Ahuja',       phone:'9876543230', dob:'1993-11-08', gender:'MALE'   as const, blood:'O_POSITIVE' as const,  city:'Noida',            state:'Uttar Pradesh',pin:'201301', lang:'hi' },
    { n:'031', email:'radha.goswami@demo.hc',      first:'Radha',    last:'Goswami',     phone:'9876543231', dob:'1982-04-25', gender:'FEMALE' as const, blood:'AB_NEGATIVE' as const, city:'Surat',            state:'Gujarat',      pin:'395001', lang:'gu' },
    { n:'032', email:'vivek.thakur@demo.hc',       first:'Vivek',    last:'Thakur',      phone:'9876543232', dob:'1998-08-13', gender:'MALE'   as const, blood:'B_POSITIVE' as const,  city:'Dehradun',         state:'Uttarakhand',  pin:'248001', lang:'hi' },
    { n:'033', email:'sneha.jain@demo.hc',         first:'Sneha',    last:'Jain',        phone:'9876543233', dob:'1990-02-18', gender:'FEMALE' as const, blood:'O_NEGATIVE' as const,  city:'Nashik',           state:'Maharashtra',  pin:'422001', lang:'mr' },
    { n:'034', email:'girish.murthy@demo.hc',      first:'Girish',   last:'Murthy',      phone:'9876543234', dob:'1973-07-07', gender:'MALE'   as const, blood:'A_POSITIVE' as const,  city:'Hubli',            state:'Karnataka',    pin:'580020', lang:'kn' },
    { n:'035', email:'padma.venkat@demo.hc',       first:'Padma',    last:'Venkat',      phone:'9876543235', dob:'1985-12-30', gender:'FEMALE' as const, blood:'B_POSITIVE' as const,  city:'Madurai',          state:'Tamil Nadu',   pin:'625001', lang:'ta' },
  ];

  let patientCount = 0;
  for (const p of patients) {
    try {
      const existing = await prisma.user.findUnique({ where: { email: p.email } });
      if (existing) { console.log(`   ⏭  Skipped existing: ${p.email}`); continue; }

      const regId = `HC-P-S${p.n}`;
      await prisma.user.create({
        data: {
          id: uid(p.n), email: p.email, passwordHash: hash,
          role: 'PATIENT', registrationId: regId,
          isEmailVerified: true, isActive: true,
          patientProfile: {
            create: {
              id: ppid(p.n), firstName: p.first, lastName: p.last, phone: p.phone,
              dateOfBirth: new Date(p.dob), gender: p.gender, bloodGroup: p.blood,
              city: p.city, state: p.state, pinCode: p.pin,
              languagePreference: p.lang,
            },
          },
        },
      });
      patientCount++;
    } catch (e: any) {
      console.log(`   ⚠️  ${p.email}: ${e.message}`);
    }
  }
  console.log(`   ✅ ${patientCount} patients created`);

  // ── 2. DOCTOR USERS (30) ───────────────────────────────────────────────────
  console.log('\n👨‍⚕️  Seeding 30 doctors...');

  const doctors = [
    { n:'001', email:'dr.arun.kumar@demo.hc',       first:'Arun',    last:'Kumar',     spec:'Diabetologist',      sub:['Endocrinology','Thyroid'],                  qual:['MBBS','MD Internal Medicine','DM Endocrinology'], exp:18, lic:'MH-ENDO-2006', fee:800,  tele:500,  langs:['Hindi','English','Marathi'],   clinic:'Diabetes Care Centre',       addr:'Near Sakinaka Metro',    city:'Mumbai',           state:'Maharashtra',  pin:'400072', bio:'Senior diabetologist with 18 years managing Type 1, Type 2, and gestational diabetes. Special interest in CGM and insulin pump therapy.', avail:true,  rat:4.8, rev:312, pts:2840 },
    { n:'002', email:'dr.priya.mehta@demo.hc',       first:'Priya',   last:'Mehta',     spec:'Cardiologist',       sub:['Interventional Cardiology','Heart Failure'], qual:['MBBS','MD Cardiology','DM Cardiology'],           exp:14, lic:'DL-CARD-2010', fee:1200, tele:700,  langs:['Hindi','English','Gujarati'],  clinic:'Heart Care Clinic',          addr:'Dwarka Sector 12',       city:'Delhi',            state:'Delhi',        pin:'110075', bio:'Interventional cardiologist specialising in stent procedures, PTCA and heart failure management. Trained at AIIMS Delhi.', avail:true,  rat:4.9, rev:428, pts:3100 },
    { n:'003', email:'dr.rajesh.nair@demo.hc',       first:'Rajesh',  last:'Nair',      spec:'Neurologist',        sub:['Epilepsy','Stroke','Headache'],              qual:['MBBS','MD Neurology','DM Neurology'],             exp:12, lic:'KL-NEURO-2012',fee:1000, tele:600,  langs:['Malayalam','English','Hindi'], clinic:'Neuro Wellness Centre',      addr:'MG Road',                city:'Kochi',            state:'Kerala',       pin:'682015', bio:'Neurologist with expertise in epilepsy, stroke rehabilitation and headache disorders. Runs monthly free epilepsy clinic.', avail:true,  rat:4.7, rev:198, pts:1620 },
    { n:'004', email:'dr.sunita.rao@demo.hc',        first:'Sunita',  last:'Rao',       spec:'Dermatologist',      sub:['Cosmetology','Psoriasis','Acne'],            qual:['MBBS','MD Dermatology'],                         exp:9,  lic:'KA-DERM-2015', fee:700,  tele:450,  langs:['Kannada','English','Hindi'],   clinic:'Glow Skin Clinic',           addr:'Koramangala 5th Block',  city:'Bengaluru',        state:'Karnataka',    pin:'560095', bio:'Dermatologist and cosmetologist with expertise in medical and aesthetic dermatology. Special interest in psoriasis and vitiligo.', avail:true,  rat:4.6, rev:267, pts:2100 },
    { n:'005', email:'dr.vikram.bhat@demo.hc',       first:'Vikram',  last:'Bhat',      spec:'Orthopaedic Surgeon',sub:['Joint Replacement','Sports Medicine'],       qual:['MBBS','MS Orthopaedics','Fellowship Sports Medicine'],exp:16,lic:'KA-ORTHO-2008',fee:1100, tele:0,    langs:['Kannada','English','Hindi'],   clinic:'BoneJoint Clinic',           addr:'Malleshwaram',           city:'Bengaluru',        state:'Karnataka',    pin:'560003', bio:'Orthopaedic surgeon with extensive experience in knee and hip replacement. Sports medicine consultant.', avail:false, rat:4.8, rev:189, pts:1480 },
    { n:'006', email:'dr.kavitha.iyer@demo.hc',      first:'Kavitha', last:'Iyer',      spec:'Gynaecologist',      sub:['Obstetrics','PCOS','Infertility'],           qual:['MBBS','MD Gynaecology','DNB'],                    exp:13, lic:'TN-GYN-2011',  fee:900,  tele:550,  langs:['Tamil','English','Hindi'],     clinic:'Women Wellness Clinic',      addr:'Anna Nagar',             city:'Chennai',          state:'Tamil Nadu',   pin:'600040', bio:'Experienced gynaecologist. Special interest in PCOS management, high-risk pregnancy, and minimally invasive surgery.', avail:true,  rat:4.9, rev:534, pts:4200 },
    { n:'007', email:'dr.suresh.pillai@demo.hc',     first:'Suresh',  last:'Pillai',    spec:'Psychiatrist',       sub:['Depression','Anxiety','Bipolar'],            qual:['MBBS','MD Psychiatry'],                          exp:11, lic:'KL-PSYCH-2013',fee:800,  tele:600,  langs:['Malayalam','English','Hindi'], clinic:'Mind Matters Clinic',        addr:'Trivandrum Medical College Road',city:'Thiruvananthapuram',state:'Kerala',       pin:'695011', bio:'Psychiatrist with special focus on mood disorders, anxiety spectrum, and addiction medicine.', avail:true,  rat:4.7, rev:156, pts:980  },
    { n:'008', email:'dr.meena.sharma@demo.hc',      first:'Meena',   last:'Sharma',    spec:'Paediatrician',      sub:['Neonatology','Paediatric Nutrition'],        qual:['MBBS','MD Paediatrics','Fellowship Neonatology'],  exp:15, lic:'RJ-PAED-2009', fee:600,  tele:400,  langs:['Hindi','English'],             clinic:'Kids Care Clinic',           addr:'Vaishali Nagar',         city:'Jaipur',           state:'Rajasthan',    pin:'302021', bio:'Paediatrician and neonatologist caring for newborns to adolescents. Special interest in childhood nutrition.', avail:true,  rat:4.8, rev:401, pts:3800 },
    { n:'009', email:'dr.harish.menon@demo.hc',      first:'Harish',  last:'Menon',     spec:'Gastroenterologist', sub:['IBD','Liver Disease','Endoscopy'],           qual:['MBBS','MD Gastroenterology','DM'],                exp:10, lic:'KL-GASTRO-2014',fee:950, tele:600,  langs:['Malayalam','English','Hindi'], clinic:'GI Care Centre',             addr:'MG Road Ernakulam',      city:'Kochi',            state:'Kerala',       pin:'682016', bio:'Gastroenterologist and hepatologist with expertise in IBD, liver cirrhosis and advanced endoscopic procedures.', avail:true,  rat:4.6, rev:143, pts:1120 },
    { n:'010', email:'dr.anita.reddy@demo.hc',       first:'Anita',   last:'Reddy',     spec:'Endocrinologist',    sub:['Thyroid','Diabetes','Obesity'],              qual:['MBBS','MD Endocrinology','DM'],                   exp:8,  lic:'TS-ENDO-2016', fee:850,  tele:550,  langs:['Telugu','English','Hindi'],    clinic:'Hormone Health Clinic',      addr:'Banjara Hills',          city:'Hyderabad',        state:'Telangana',    pin:'500034', bio:'Endocrinologist managing thyroid disorders, diabetes, adrenal conditions and metabolic obesity.', avail:true,  rat:4.7, rev:221, pts:1680 },
    { n:'011', email:'dr.deepak.verma@demo.hc',      first:'Deepak',  last:'Verma',     spec:'Pulmonologist',      sub:['Asthma','COPD','Sleep Apnea'],               qual:['MBBS','MD Respiratory Medicine'],                 exp:12, lic:'UP-PULM-2012', fee:700,  tele:450,  langs:['Hindi','English'],             clinic:'Lung Care Centre',           addr:'Gomti Nagar',            city:'Lucknow',          state:'Uttar Pradesh',pin:'226010', bio:'Pulmonologist specialising in asthma, COPD, ILD, and sleep-disordered breathing.', avail:true,  rat:4.5, rev:178, pts:1450 },
    { n:'012', email:'dr.lakshmi.krishnan@demo.hc',  first:'Lakshmi', last:'Krishnan',  spec:'Rheumatologist',     sub:['Rheumatoid Arthritis','Lupus','Gout'],       qual:['MBBS','MD Medicine','DM Rheumatology'],           exp:9,  lic:'TN-RHEUM-2015',fee:900,  tele:600,  langs:['Tamil','English','Hindi'],     clinic:'Arthritis & Rheumatology Clinic',addr:'T Nagar',           city:'Chennai',          state:'Tamil Nadu',   pin:'600017', bio:'Rheumatologist with expertise in inflammatory arthritis, autoimmune diseases, and biologics therapy.', avail:true,  rat:4.8, rev:198, pts:1540 },
    { n:'013', email:'dr.ramesh.patel@demo.hc',      first:'Ramesh',  last:'Patel',     spec:'Ophthalmologist',    sub:['Cataract','Glaucoma','Retina'],              qual:['MBBS','MS Ophthalmology','Fellowship Vitreoretina'],exp:17,lic:'GJ-OPHTHAL-2007',fee:750, tele:0,    langs:['Gujarati','Hindi','English'],  clinic:'Vision Care Eye Hospital',   addr:'CG Road',                city:'Ahmedabad',        state:'Gujarat',      pin:'380006', bio:'Vitreoretinal surgeon with 17 years experience. Specialises in diabetic retinopathy and macular degeneration.', avail:false, rat:4.9, rev:312, pts:2600 },
    { n:'014', email:'dr.nisha.gupta@demo.hc',       first:'Nisha',   last:'Gupta',     spec:'Haematologist',      sub:['Anaemia','Blood Cancers','Thalassaemia'],    qual:['MBBS','MD Haematology','DM'],                     exp:7,  lic:'DL-HAEM-2017', fee:1000, tele:700,  langs:['Hindi','English','Punjabi'],   clinic:'Blood & Cancer Care',        addr:'Rajouri Garden',         city:'Delhi',            state:'Delhi',        pin:'110027', bio:'Haematologist managing anaemia disorders, thalassaemia, leukaemia, and lymphoma.', avail:true,  rat:4.6, rev:89,  pts:720  },
    { n:'015', email:'dr.anil.joshi@demo.hc',        first:'Anil',    last:'Joshi',     spec:'Nephrologist',       sub:['CKD','Dialysis','Transplant'],               qual:['MBBS','MD Nephrology','DM'],                      exp:14, lic:'MH-NEPH-2010', fee:1100, tele:650,  langs:['Marathi','Hindi','English'],   clinic:'Kidney Care Centre',         addr:'Dadar',                  city:'Mumbai',           state:'Maharashtra',  pin:'400014', bio:'Nephrologist with expertise in CKD management, dialysis (HD & PD), and post-transplant care.', avail:true,  rat:4.7, rev:267, pts:2100 },
    { n:'016', email:'dr.pooja.singh@demo.hc',       first:'Pooja',   last:'Singh',     spec:'Oncologist',         sub:['Breast Cancer','Cervical Cancer'],           qual:['MBBS','MD Oncology','DM'],                        exp:11, lic:'MH-ONC-2013',  fee:1500, tele:900,  langs:['Hindi','English','Marathi'],   clinic:'Cancer Care Clinic',         addr:'Parel',                  city:'Mumbai',           state:'Maharashtra',  pin:'400012', bio:'Medical oncologist specialising in breast, gynaecological, and lung cancers. Special interest in targeted therapy.', avail:true,  rat:4.9, rev:145, pts:890  },
    { n:'017', email:'dr.manoj.desai@demo.hc',       first:'Manoj',   last:'Desai',     spec:'Cardiologist',       sub:['Preventive Cardiology','Echocardiography'],  qual:['MBBS','MD Cardiology'],                          exp:8,  lic:'MH-CARD-2016', fee:900,  tele:550,  langs:['Marathi','Hindi','English'],   clinic:'Cardiac Wellness Centre',    addr:'Bandra West',            city:'Mumbai',           state:'Maharashtra',  pin:'400050', bio:'Preventive cardiologist focused on risk factor management, lipid disorders, and cardiac rehabilitation.', avail:true,  rat:4.7, rev:189, pts:1420 },
    { n:'018', email:'dr.swati.nambiar@demo.hc',     first:'Swati',   last:'Nambiar',   spec:'Neurologist',        sub:['Dementia','Parkinson\'s','Migraine'],        qual:['MBBS','MD Neurology'],                           exp:6,  lic:'KL-NEURO-2018',fee:850,  tele:600,  langs:['Malayalam','English','Hindi'], clinic:'Brain & Spine Clinic',       addr:'Calicut Medical College Road',city:'Kozhikode',       state:'Kerala',       pin:'673008', bio:'Neurologist with special interest in movement disorders, dementia, and headache management.', avail:true,  rat:4.6, rev:98,  pts:680  },
    { n:'019', email:'dr.rohit.bose@demo.hc',        first:'Rohit',   last:'Bose',      spec:'Psychiatrist',       sub:['Child Psychiatry','ADHD','Autism'],          qual:['MBBS','MD Psychiatry','Fellowship Child Psychiatry'],exp:10,lic:'WB-PSYCH-2014',fee:900,  tele:650,  langs:['Bengali','Hindi','English'],   clinic:'Child Mind Clinic',          addr:'Salt Lake',              city:'Kolkata',          state:'West Bengal',  pin:'700091', bio:'Child and adolescent psychiatrist with expertise in ADHD, autism spectrum, and learning disabilities.', avail:true,  rat:4.8, rev:167, pts:1240 },
    { n:'020', email:'dr.divya.hegde@demo.hc',       first:'Divya',   last:'Hegde',     spec:'Gynaecologist',      sub:['Endometriosis','Menopause','Fertility'],     qual:['MBBS','MS Gynaecology','Fellowship Reproductive Medicine'],exp:9,lic:'KA-GYN-2015',fee:850,tele:500,  langs:['Kannada','English','Hindi'],   clinic:'Fertility & Women Care',     addr:'Jayanagar',              city:'Bengaluru',        state:'Karnataka',    pin:'560041', bio:'Gynaecologist and reproductive medicine specialist. Special interest in endometriosis and fertility preservation.', avail:true,  rat:4.8, rev:278, pts:2080 },
    { n:'021', email:'dr.sanjay.kapoor@demo.hc',     first:'Sanjay',  last:'Kapoor',    spec:'Urologist',          sub:['Kidney Stones','Prostate','Robotic Surgery'],qual:['MBBS','MS Urology','MCh Urology'],                exp:15, lic:'DL-URO-2009',  fee:1000, tele:0,    langs:['Hindi','English','Punjabi'],   clinic:'Urology & Andrology Centre', addr:'South Extension',        city:'Delhi',            state:'Delhi',        pin:'110049', bio:'Urologist with expertise in robotic-assisted surgery, kidney stone management, and BPH treatment.', avail:false, rat:4.9, rev:234, pts:1870 },
    { n:'022', email:'dr.usha.mishra@demo.hc',       first:'Usha',    last:'Mishra',    spec:'Physiotherapist',    sub:['Sports Injuries','Neuro Rehabilitation'],   qual:['BPT','MPT Sports','PhD'],                         exp:13, lic:'UP-PT-2011',   fee:500,  tele:350,  langs:['Hindi','English'],             clinic:'PhysioPlus Clinic',          addr:'Gomti Nagar Extension',  city:'Lucknow',          state:'Uttar Pradesh',pin:'226012', bio:'Senior physiotherapist with expertise in sports injury rehab, post-stroke rehabilitation.', avail:true,  rat:4.6, rev:312, pts:2680 },
    { n:'023', email:'dr.kiran.yadav@demo.hc',       first:'Kiran',   last:'Yadav',     spec:'Diabetologist',      sub:['Type 2 Diabetes','Gestational Diabetes'],   qual:['MBBS','MD Endocrinology'],                        exp:7,  lic:'RJ-ENDO-2017', fee:650,  tele:400,  langs:['Hindi','English'],             clinic:'Sugar Control Clinic',       addr:'Malviya Nagar',          city:'Jaipur',           state:'Rajasthan',    pin:'302017', bio:'Diabetologist running a dedicated diabetic foot clinic. Special interest in preventing amputations.', avail:true,  rat:4.7, rev:156, pts:1280 },
    { n:'024', email:'dr.geeta.pandey@demo.hc',      first:'Geeta',   last:'Pandey',    spec:'Nutritionist',       sub:['Weight Management','Diabetes Diet'],         qual:['MSc Clinical Nutrition','RD','PhD'],              exp:11, lic:'UP-NUTR-2013', fee:450,  tele:300,  langs:['Hindi','English'],             clinic:'Nourish Diet Clinic',        addr:'Hazratganj',             city:'Lucknow',          state:'Uttar Pradesh',pin:'226001', bio:'Registered dietitian with expertise in therapeutic nutrition for diabetes, PCOS, and thyroid disorders.', avail:true,  rat:4.8, rev:423, pts:3600 },
    { n:'025', email:'dr.prakash.thakur@demo.hc',    first:'Prakash', last:'Thakur',    spec:'Cardiologist',       sub:['Cardiac Electrophysiology','Pacemaker'],    qual:['MBBS','DM Cardiology','Fellowship EP'],           exp:20, lic:'MH-CARD-2004', fee:1400, tele:800,  langs:['Marathi','Hindi','English'],   clinic:'Rhythm Heart Care',          addr:'Churchgate',             city:'Mumbai',           state:'Maharashtra',  pin:'400020', bio:'Senior electrophysiologist with 20 years experience. Expert in catheter ablation and pacemaker implantation.', avail:true,  rat:4.9, rev:456, pts:3600 },
    { n:'026', email:'dr.rekha.bansal@demo.hc',      first:'Rekha',   last:'Bansal',    spec:'Dermatologist',      sub:['Hair Loss','Skin Allergy','Vitiligo'],       qual:['MBBS','MD Dermatology'],                         exp:8,  lic:'DL-DERM-2016', fee:650,  tele:420,  langs:['Hindi','English','Punjabi'],   clinic:'Skin & Hair Clinic',         addr:'Lajpat Nagar',           city:'Delhi',            state:'Delhi',        pin:'110024', bio:'Dermatologist specialising in hair loss disorders, skin allergies, and vitiligo. Offers PRP therapy.', avail:true,  rat:4.5, rev:198, pts:1620 },
    { n:'027', email:'dr.anil.naik@demo.hc',         first:'Anil',    last:'Naik',      spec:'Gastroenterologist', sub:['Colonoscopy','GERD','Fatty Liver'],          qual:['MBBS','MD Gastroenterology','DM'],                exp:10, lic:'GJ-GASTRO-2014',fee:900, tele:580,  langs:['Gujarati','Hindi','English'],  clinic:'Digestive Health Clinic',    addr:'Vastrapur',              city:'Ahmedabad',        state:'Gujarat',      pin:'380054', bio:'Gastroenterologist with expertise in colonoscopy, ERCP, and management of NAFLD and viral hepatitis.', avail:true,  rat:4.7, rev:167, pts:1340 },
    { n:'028', email:'dr.shobha.ahuja@demo.hc',      first:'Shobha',  last:'Ahuja',     spec:'Oncologist',         sub:['Head Neck Cancer','Radiation'],              qual:['MBBS','MD Radiation Oncology'],                   exp:13, lic:'PB-ONC-2011',  fee:1200, tele:0,    langs:['Punjabi','Hindi','English'],   clinic:'Cancer Treatment Centre',    addr:'Sector 32',              city:'Chandigarh',       state:'Punjab',       pin:'160032', bio:'Radiation oncologist with expertise in head and neck cancers and stereotactic radiosurgery.', avail:false, rat:4.8, rev:123, pts:780  },
    { n:'029', email:'dr.tarun.goswami@demo.hc',     first:'Tarun',   last:'Goswami',   spec:'Paediatrician',      sub:['Paediatric Allergy','Asthma'],               qual:['MBBS','MD Paediatrics','Fellowship Allergy'],     exp:9,  lic:'WB-PAED-2015', fee:550,  tele:380,  langs:['Bengali','Hindi','English'],   clinic:'Child Allergy Clinic',       addr:'New Town',               city:'Kolkata',          state:'West Bengal',  pin:'700156', bio:'Paediatric allergist-immunologist managing childhood asthma, food allergies, and primary immunodeficiencies.', avail:true,  rat:4.7, rev:234, pts:2100 },
    { n:'030', email:'dr.radha.tiwari@demo.hc',      first:'Radha',   last:'Tiwari',    spec:'Psychiatrist',       sub:['Women Mental Health','Postpartum','Trauma'],  qual:['MBBS','MD Psychiatry','Fellowship Women Mental Health'],exp:8,lic:'UP-PSYCH-2016',fee:750, tele:550,  langs:['Hindi','English'],             clinic:'Mindful Healing Clinic',     addr:'Indira Nagar',           city:'Lucknow',          state:'Uttar Pradesh',pin:'226016', bio:'Psychiatrist specialising in women\'s mental health, postpartum depression, and trauma-informed care.', avail:true,  rat:4.9, rev:198, pts:1560 },
  ];

  let doctorCount = 0;
  for (const d of doctors) {
    try {
      const existing = await prisma.user.findUnique({ where: { email: d.email } });
      if (existing) { console.log(`   ⏭  Skipped existing: ${d.email}`); continue; }

      const regId = `HC-D-S${d.n}`;
      await prisma.user.create({
        data: {
          id: uid(`d${d.n}`), email: d.email, passwordHash: hash,
          role: 'DOCTOR', registrationId: regId,
          isEmailVerified: true, isActive: true,
          doctorProfile: {
            create: {
              id: dpid(d.n), firstName: d.first, lastName: d.last,
              specialization: d.spec, subSpecializations: d.sub, qualification: d.qual,
              experienceYears: d.exp, medicalLicenseNumber: d.lic,
              consultationFee: d.fee, teleconsultFee: d.tele,
              languagesSpoken: d.langs, clinicName: d.clinic, clinicAddress: d.addr,
              city: d.city, state: d.state, pinCode: d.pin, bio: d.bio,
              isVerified: true, isAvailableOnline: d.avail,
              averageRating: d.rat, totalReviews: d.rev, totalPatients: d.pts,
            },
          },
        },
      });
      doctorCount++;
    } catch (e: any) {
      console.log(`   ⚠️  ${d.email}: ${e.message}`);
    }
  }
  console.log(`   ✅ ${doctorCount} doctors created`);

  // ── 3. COMMUNITIES (12 new, alongside existing 6) ─────────────────────────
  console.log('\n🏘️  Seeding 12 communities...');

  const communities = [
    { n:'01', slug:'diabetes-warriors',        name:'Diabetes Warriors',          desc:'A supportive community for people managing Type 1, Type 2, and gestational diabetes across India. Share tips, ask questions, celebrate wins and support each other through tough days.', emoji:'🩸', cat:'Diabetes',        feat:true,  anon:true,  rules:'Be kind and supportive. Share experiences, not prescriptions. Use anonymous posting for sensitive topics. No self-diagnosis advice. Doctors must identify themselves.' },
    { n:'02', slug:'heart-health-circle',      name:'Heart Health Circle',        desc:'For heart patients, families, and cardiologists. Discuss heart disease, medications, lifestyle changes, surgery experiences, and cardiac rehabilitation journeys.', emoji:'❤️', cat:'Heart Health',    feat:true,  anon:true,  rules:'Medical advice only from verified doctors. Share your journey openly. No fear-mongering. Respect recovery pace. Celebrate small victories.' },
    { n:'03', slug:'mental-wellness-india',    name:'Mental Wellness India',      desc:'A safe, judgment-free space for mental health conversations in India. Anxiety, depression, stress, relationships, work pressure — you are not alone here.', emoji:'🧠', cat:'Mental Wellness', feat:true,  anon:true,  rules:'This is a safe space. No judgment ever. Anonymous posting encouraged. If someone is in crisis, share helpline numbers. Listen first.' },
    { n:'04', slug:'pcos-sisters',             name:'PCOS Sisters',               desc:'India\'s largest PCOS/PCOD support community. Hormonal health, fertility, weight management, skin and hair issues, and the emotional journey of living with PCOS.', emoji:'🌸', cat:'PCOS/PCOD',       feat:true,  anon:true,  rules:'Women-first space. Be gentle. Share what works without prescribing to others. Medical advice from verified gynaecologists only.' },
    { n:'05', slug:'cancer-support-network',   name:'Cancer Support Network',     desc:'For cancer patients, survivors, and their loved ones. A compassionate community for sharing experiences, treatment journeys, emotional support, and practical guidance.', emoji:'🎗️', cat:'Cancer Support',  feat:true,  anon:true,  rules:'Compassion above all. Share your truth. No toxic positivity. Respect treatment choices. Verified oncologists may share information.' },
    { n:'06', slug:'thyroid-talk',             name:'Thyroid Talk',               desc:'For hypothyroid, hyperthyroid, and Hashimoto\'s patients. Discuss medications, diet, fatigue, weight, brain fog, and everything thyroid-related.', emoji:'🦋', cat:'Thyroid',         feat:false, anon:true,  rules:'Share lab reports with caution. No unsolicited dose advice. TSH levels vary per person. Always consult your endocrinologist.' },
    { n:'07', slug:'arthritis-joint-warriors', name:'Arthritis & Joint Warriors', desc:'Community for people living with rheumatoid arthritis, osteoarthritis, ankylosing spondylitis, gout, and other joint conditions.', emoji:'🦴', cat:'Arthritis',        feat:false, anon:false, rules:'Pain is real and invisible. No body shaming. Share mobility tips freely. Discuss biologics carefully — individual responses vary.' },
    { n:'08', slug:'hypertension-heroes',      name:'Hypertension Heroes',        desc:'For people managing high blood pressure, its complications, and medication journeys. Diet tips, stress management, BP monitoring, and lifestyle changes.', emoji:'💊', cat:'Hypertension',    feat:false, anon:true,  rules:'Share BP readings and patterns. Discuss medication side effects openly. No fear-mongering about strokes. Respect individual journeys.' },
    { n:'09', slug:'kidney-care-community',    name:'Kidney Care Community',      desc:'For CKD patients, dialysis patients, transplant recipients and their families. Navigating kidney disease is hard — this community makes it easier.', emoji:'🫘', cat:'Kidney Health',   feat:false, anon:true,  rules:'Discuss diet restrictions with care — CKD stages differ. Transplant experiences welcome. Be extra kind — CKD is exhausting.' },
    { n:'10', slug:'breathe-better-respiratory',name:'Breathe Better',           desc:'For asthma, COPD, bronchitis, ILD, and other respiratory conditions. Inhaler techniques, trigger management, pulmonary rehab, and breathing exercises.', emoji:'🫁', cat:'Respiratory',     feat:false, anon:false, rules:'Inhaler technique tips are welcome. Track your peak flow. Smoking cessation support available. No judgment for smokers seeking help.' },
    { n:'11', slug:'nutrition-wellness-hub',   name:'Nutrition & Wellness Hub',   desc:'Evidence-based nutrition for Indians. Discuss balanced diets, therapeutic nutrition for diabetes/thyroid/PCOS, healthy weight, and debunking nutrition myths.', emoji:'🥗', cat:'Nutrition & Diet',feat:false, anon:false, rules:'Evidence-based advice only. No extreme diets promoted. Respect cultural food preferences — Indian diet diversity is a strength.' },
    { n:'12', slug:'senior-care-india',        name:'Senior Care India',          desc:'For elderly patients, their adult children, and geriatric care professionals. Discuss age-related conditions, fall prevention, medication management, and dignified aging.', emoji:'👴', cat:'Senior Care',     feat:false, anon:true,  rules:'Treat seniors with dignity. Caregiver burnout is real. Discuss polypharmacy concerns openly. No age-shaming. Independence matters.' },
  ];

  let commCount = 0;
  for (const c of communities) {
    try {
      const existing = await prisma.community.findUnique({ where: { slug: c.slug } });
      if (existing) { console.log(`   ⏭  Skipped existing: ${c.slug}`); continue; }

      await prisma.community.create({
        data: {
          id: cmid(c.n), slug: c.slug, name: c.name, description: c.desc,
          emoji: c.emoji, category: c.cat, visibility: 'PUBLIC', language: 'en',
          isFeatured: c.feat, isActive: true, allowAnonymous: c.anon,
          requireApproval: false, rules: c.rules,
        },
      });
      commCount++;
    } catch (e: any) {
      console.log(`   ⚠️  ${c.slug}: ${e.message}`);
    }
  }
  console.log(`   ✅ ${commCount} communities created`);

  // ── 4. COMMUNITY MEMBERS ───────────────────────────────────────────────────
  console.log('\n👥 Seeding community memberships...');

  const memberships = [
    // Diabetes Warriors
    { mid:'m001', cid: cmid('01'), uid: uid('001') },
    { mid:'m002', cid: cmid('01'), uid: uid('002') },
    { mid:'m003', cid: cmid('01'), uid: uid('003') },
    { mid:'m004', cid: cmid('01'), uid: uid('005') },
    { mid:'m005', cid: cmid('01'), uid: uid('010') },
    { mid:'m006', cid: cmid('01'), uid: uid('d001'), role: 'MODERATOR' },
    { mid:'m007', cid: cmid('01'), uid: uid('d010') },
    // Heart Health Circle
    { mid:'m011', cid: cmid('02'), uid: uid('004') },
    { mid:'m012', cid: cmid('02'), uid: uid('006') },
    { mid:'m013', cid: cmid('02'), uid: uid('008') },
    { mid:'m014', cid: cmid('02'), uid: uid('d002'), role: 'MODERATOR' },
    // Mental Wellness
    { mid:'m021', cid: cmid('03'), uid: uid('007') },
    { mid:'m022', cid: cmid('03'), uid: uid('013') },
    { mid:'m023', cid: cmid('03'), uid: uid('017') },
    { mid:'m024', cid: cmid('03'), uid: uid('d007'), role: 'MODERATOR' },
    // PCOS Sisters
    { mid:'m031', cid: cmid('04'), uid: uid('009') },
    { mid:'m032', cid: cmid('04'), uid: uid('011') },
    { mid:'m033', cid: cmid('04'), uid: uid('015') },
    { mid:'m034', cid: cmid('04'), uid: uid('021') },
    { mid:'m035', cid: cmid('04'), uid: uid('d006'), role: 'MODERATOR' },
    // Cancer Support
    { mid:'m041', cid: cmid('05'), uid: uid('016') },
    { mid:'m042', cid: cmid('05'), uid: uid('022') },
    { mid:'m043', cid: cmid('05'), uid: uid('d016'), role: 'MODERATOR' },
  ];

  let mbCount = 0;
  for (const m of memberships) {
    try {
      // Check user exists first
      const userExists = await prisma.user.findUnique({ where: { id: m.uid } });
      if (!userExists) continue;
      const commExists = await prisma.community.findUnique({ where: { id: m.cid } });
      if (!commExists) continue;

      await prisma.communityMember.upsert({
        where: { communityId_userId: { communityId: m.cid, userId: m.uid } },
        create: { id: mbid(m.mid), communityId: m.cid, userId: m.uid, role: (m as any).role || 'MEMBER', isApproved: true },
        update: {},
      });
      mbCount++;
    } catch (e: any) {
      if (!e.message.includes('Unique constraint')) console.log(`   ⚠️  membership: ${e.message}`);
    }
  }
  console.log(`   ✅ ${mbCount} memberships created`);

  // ── 5. SEED POSTS ──────────────────────────────────────────────────────────
  console.log('\n📝 Seeding posts...');

  const posts = [
    {
      n:'001', cid: cmid('01'), aid: uid('001'), pinned: true, anon: false,
      title: 'HbA1c from 9.2 to 6.8 in 3 months — here is what worked',
      body: 'I wanted to share my journey because 6 months ago I was devastated by my HbA1c of 9.2. My endocrinologist put me on metformin 500mg twice daily and asked me to cut refined carbs. I also started 30-min walks after dinner. Yesterday\'s test showed 6.8! Key things that worked: (1) No white rice — switched to small portions of brown rice or millets. (2) Evening walk non-negotiable. (3) Weekly glucose log shared with doctor. AMA if you want details about diet!',
      tags: ['HbA1c','metformin','diet','success'],
    },
    {
      n:'002', cid: cmid('01'), aid: uid('002'), pinned: false, anon: true, alias: 'Curious Diabetic',
      title: 'Anyone tried FreeStyle Libre CGM? Worth the cost?',
      body: 'My diabetologist suggested I try continuous glucose monitoring with FreeStyle Libre 2. The sensor costs around ₹3500 for 2 weeks. Has anyone used it? Is the data actually useful for understanding patterns? I\'m particularly curious whether it catches post-meal spikes that finger-prick misses.',
      tags: ['CGM','FreeStyle Libre','monitoring'],
    },
    {
      n:'003', cid: cmid('01'), aid: uid('d001'), pinned: true, anon: false,
      title: 'Stress and Blood Sugar: The connection most patients don\'t know',
      body: 'As a diabetologist, I see patients frustrated that their sugars are high despite good diet and medication. Often the culprit is cortisol — the stress hormone. When you\'re stressed, your liver releases glucose even without eating. Practical tips: (1) 10-min deep breathing twice daily can reduce cortisol. (2) Track stress events alongside glucose readings. (3) Tell your doctor if stress has increased — dose adjustment may be needed temporarily.',
      tags: ['stress','cortisol','management','doctor-insight'],
    },
    {
      n:'004', cid: cmid('01'), aid: uid('003'), pinned: false, anon: true, alias: 'Struggling Member',
      title: 'Feeling overwhelmed 3 months after diagnosis',
      body: 'I was diagnosed with Type 2 three months ago and I\'m still struggling to accept it. I follow my diet 80% of the time and forget medicines sometimes. My family keeps reminding me which makes me feel worse. Does the guilt go away? Does it get easier to remember the routine?',
      tags: ['newly-diagnosed','emotional','support'],
    },
    {
      n:'005', cid: cmid('02'), aid: uid('004'), pinned: true, anon: false,
      title: 'Post-angioplasty life — 6 months update',
      body: 'Six months since my PTCA (stent in LAD). Sharing updates for anyone newly post-procedure. Month 1-2: Fatigue is real, don\'t push. Month 3-4: Cardiac rehab started — game changer. Month 5-6: Back to 3km walks daily, returned to desk job. Key learning: Take your dual antiplatelet therapy without missing a single dose. My cardiologist says no compromise for 12 months.',
      tags: ['angioplasty','stent','recovery','cardiac-rehab'],
    },
    {
      n:'006', cid: cmid('02'), aid: uid('d002'), pinned: false, anon: false,
      title: 'Heart-healthy Indian diet: Evidence-based guide',
      body: 'Many patients ask what to eat after a cardiac event. Here is what evidence supports for Indian patients: (1) Replace ghee with mustard oil or olive oil — not eliminate fat. (2) Increase omega-3: flaxseeds, walnuts, fatty fish. (3) Reduce sodium — use lemon and herbs instead of extra salt. (4) Eat more legumes: dal, chana, rajma are cardioprotective. (5) No trans fats: avoid vanaspati, most commercial biscuits.',
      tags: ['diet','heart-health','Indian','doctor-insight'],
    },
    {
      n:'007', cid: cmid('03'), aid: uid('007'), pinned: false, anon: true, alias: 'Anxious Professional',
      title: 'Anxiety at work is ruining my career — anyone relate?',
      body: 'I have been dealing with workplace anxiety for 2 years. Presentations make my heart race, I rehearse every conversation, and I catastrophise every email. I finally saw a psychiatrist 3 months ago and started therapy. The diagnosis was GAD. I\'m sharing because I spent 2 years thinking I was just weak. You\'re not weak. It\'s a medical condition and it responds to treatment.',
      tags: ['anxiety','workplace','GAD','therapy'],
    },
    {
      n:'008', cid: cmid('03'), aid: uid('d007'), pinned: true, anon: false,
      title: 'Breaking the silence: Depression in Indian men',
      body: 'In my 11 years of practice, some of the most severe depression I\'ve treated has been in men aged 30-50 who waited 5+ years to seek help. Cultural conditioning tells Indian men that emotional pain is weakness. It is not. Signs to watch for: persistent sadness or irritability, loss of interest, sleep changes, unexplained physical pain, withdrawal. If these signs persist for more than 2 weeks, please reach out.',
      tags: ['depression','men\'s-health','stigma','doctor-insight'],
    },
    {
      n:'009', cid: cmid('04'), aid: uid('009'), pinned: false, anon: false,
      title: 'PCOS diagnosis at 19 — what I wish someone told me',
      body: 'Diagnosed with PCOS at 19. Now 26 and managing well. What I wish someone told me: (1) PCOS is a syndrome, not a disease — it looks different in everyone. (2) Metformin + inositol combo worked better for me than metformin alone. (3) Cutting sugar mattered more than cutting fat. (4) The mental health impact is real — anxiety and PCOS are deeply linked.',
      tags: ['PCOS','newly-diagnosed','advice','inositol'],
    },
    {
      n:'010', cid: cmid('04'), aid: uid('d006'), pinned: true, anon: false,
      title: 'PCOS and fertility: Separating myths from facts',
      body: 'One of the most distressing things I see is young women with PCOS being told they "can\'t have children." This is often false. The facts: (1) ~70-80% of women with PCOS can conceive with appropriate treatment. (2) Ovulation induction with letrozole is first-line and works well. (3) Weight loss of even 5-10% can restore ovulation in overweight PCOS patients. (4) IVF is not the first or only option.',
      tags: ['PCOS','fertility','myths','pregnancy','doctor-insight'],
    },
    {
      n:'011', cid: cmid('05'), aid: uid('016'), pinned: false, anon: true, alias: 'Warrior in Training',
      title: 'Starting chemotherapy next week — scared and need support',
      body: 'Breast cancer Stage 2. Starting 6 cycles of AC-T chemotherapy next Monday. My oncologist has explained everything but I\'m terrified of the side effects. Hair loss, nausea, fatigue — reading about them online is making it worse. Has anyone been through AC-T? What helped you through it? Any practical tips would mean the world right now.',
      tags: ['chemotherapy','breast-cancer','support','scared'],
    },
    {
      n:'012', cid: cmid('06'), aid: uid('011'), pinned: false, anon: true, alias: 'Exhausted Member',
      title: 'TSH normal but still exhausted — is this common?',
      body: 'My TSH is 2.8 (normal range) but I\'m still dealing with brain fog, fatigue, and cold hands. My endocrinologist says my thyroid is fine. But I feel terrible. Has anyone else experienced this? I\'ve read about T3/T4 conversion issues but my doctor dismissed it.',
      tags: ['hypothyroid','TSH','brain-fog','fatigue'],
    },
  ];

  let postCount = 0;
  for (const p of posts) {
    try {
      const existing = await prisma.post.findUnique({ where: { id: pid(p.n) } });
      if (existing) { console.log(`   ⏭  Skipped post: ${p.n}`); continue; }

      const commExists = await prisma.community.findUnique({ where: { id: p.cid } });
      const authorExists = await prisma.user.findUnique({ where: { id: p.aid } });
      if (!commExists || !authorExists) continue;

      await prisma.post.create({
        data: {
          id: pid(p.n), communityId: p.cid, authorId: p.aid,
          title: p.title, body: p.body, tags: p.tags,
          isAnonymous: p.anon, anonymousAlias: (p as any).alias || null,
          status: 'PUBLISHED', isPinned: p.pinned, viewCount: Math.floor(Math.random() * 500) + 50,
        },
      });
      postCount++;
    } catch (e: any) {
      console.log(`   ⚠️  post ${p.n}: ${e.message}`);
    }
  }
  console.log(`   ✅ ${postCount} posts created`);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!');
  console.log('─'.repeat(50));
  console.log(`Login password for ALL seeded accounts: ${TEST_PASSWORD}`);
  console.log('\nSample patient logins:');
  console.log('  priya.sharma@demo.hc    /  Test@HC2025');
  console.log('  arjun.nair@demo.hc      /  Test@HC2025');
  console.log('  kavitha.reddy@demo.hc   /  Test@HC2025');
  console.log('\nSample doctor logins:');
  console.log('  dr.arun.kumar@demo.hc   /  Test@HC2025  (Diabetologist, Mumbai)');
  console.log('  dr.priya.mehta@demo.hc  /  Test@HC2025  (Cardiologist, Delhi)');
  console.log('  dr.kavitha.iyer@demo.hc /  Test@HC2025  (Gynaecologist, Chennai)');
  console.log('─'.repeat(50));
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
