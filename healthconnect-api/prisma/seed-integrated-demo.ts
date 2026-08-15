import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const hash = (p: string) => bcrypt.hashSync(p, 12);
const now = new Date();
const ago = (days: number) => new Date(now.getTime() - days * 86400000);
const ahead = (days: number) => new Date(now.getTime() + days * 86400000);
const at = (base: Date, hour: number, minute = 0) => {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d;
};

/**
 * HealthConnect India — Integrated Demo Seed
 *
 * SAFE / APPEND-ONLY:
 * - NO deleteMany()
 * - reuses existing 35 patients / 30 doctors / 12 communities
 * - creates only missing hospitals and test relationships/data
 * - guarded checks make it safe to rerun
 *
 * Purpose:
 * Give Patient, Doctor, Hospital, Community, Appointment, Reports,
 * Subscription and Admin dashboards realistic connected test data.
 */

async function ensureHospital(input: {
  email: string;
  password: string;
  registrationId: string;
  name: string;
  addressLine1: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  totalBeds: number;
  icuBeds: number;
  specialties: string[];
  accreditations: string[];
}) {
  let user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: hash(input.password),
        role: 'HOSPITAL',
        registrationId: input.registrationId,
        isEmailVerified: true,
        isActive: true,
      },
    });
  }

  let profile = await prisma.hospitalProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    profile = await prisma.hospitalProfile.create({
      data: {
        userId: user.id,
        name: input.name,
        addressLine1: input.addressLine1,
        city: input.city,
        state: input.state,
        pinCode: input.pinCode,
        phone: input.phone,
        totalBeds: input.totalBeds,
        icuBeds: input.icuBeds,
        specialties: input.specialties,
        accreditations: input.accreditations,
        emergencyAvailable: true,
        isVerified: true,
        verifiedAt: new Date('2026-08-01T00:00:00+05:30'),
        isPremium: true,
        registrationNumber: input.registrationId,
      },
    });
  }
  return { user, profile };
}

async function patient(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { patientProfile: true },
  });
  if (!user?.patientProfile) throw new Error(`Patient missing: ${email}`);
  return { user, profile: user.patientProfile };
}

async function doctor(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { doctorProfile: true },
  });
  if (!user?.doctorProfile) throw new Error(`Doctor missing: ${email}`);
  return { user, profile: user.doctorProfile };
}

async function ensureCondition(patientId: string, name: string, data: any = {}) {
  const existing = await prisma.condition.findFirst({ where: { patientId, name } });
  if (!existing) await prisma.condition.create({ data: { patientId, name, ...data } });
}

async function ensureAllergy(patientId: string, allergen: string, data: any = {}) {
  const existing = await prisma.allergy.findFirst({ where: { patientId, allergen } });
  if (!existing) await prisma.allergy.create({ data: { patientId, allergen, ...data } });
}

async function ensureMedication(patientId: string, name: string, data: any) {
  let med = await prisma.medication.findFirst({ where: { patientId, name } });
  if (!med) med = await prisma.medication.create({ data: { patientId, name, ...data } });
  return med;
}

async function ensureVital(patientId: string, type: any, measuredAt: Date, data: any) {
  const existing = await prisma.vital.findFirst({ where: { patientId, type, measuredAt } });
  if (!existing) await prisma.vital.create({ data: { patientId, type, measuredAt, ...data } });
}

async function ensureAppointment(data: {
  patientId: string;
  doctorId: string;
  hospitalId?: string;
  scheduledAt: Date;
  type: any;
  status: any;
  reasonForVisit: string;
  doctorNotes?: string;
  prescription?: string;
  meetingLink?: string;
}) {
  const existing = await prisma.appointment.findFirst({
    where: {
      patientId: data.patientId,
      doctorId: data.doctorId,
      scheduledAt: data.scheduledAt,
    },
  });
  if (!existing) return prisma.appointment.create({ data });
  return existing;
}

async function ensureConsent(patientId: string, doctorId: string) {
  const existing = await prisma.patientConsent.findFirst({
    where: { patientId, doctorId, status: 'ACTIVE' },
  });
  if (!existing) {
    await prisma.patientConsent.create({
      data: {
        patientId,
        doctorId,
        accessScope: ['MEDICAL_HISTORY', 'VITALS', 'REPORTS'],
        status: 'ACTIVE',
        grantReason: 'Integrated demo care relationship',
      },
    });
  }
}

async function ensureMembership(communitySlug: string, userId: string, role = 'MEMBER') {
  const community = await prisma.community.findUnique({ where: { slug: communitySlug } });
  if (!community) {
    console.log(`  community missing, skipped membership: ${communitySlug}`);
    return;
  }
  await prisma.communityMember.upsert({
    where: { communityId_userId: { communityId: community.id, userId } },
    create: { communityId: community.id, userId, role, isApproved: true },
    update: { role, isApproved: true },
  });
}

async function ensureHospitalDepartment(hospitalId: string, name: string, headName?: string) {
  const existing = await prisma.department.findFirst({ where: { hospitalId, name } });
  if (!existing) await prisma.department.create({ data: { hospitalId, name, headName } });
}

async function ensureDoctorHospital(doctorId: string, hospitalId: string, department: string, isPrimary = false) {
  await prisma.doctorHospital.upsert({
    where: { doctorId_hospitalId: { doctorId, hospitalId } },
    create: { doctorId, hospitalId, department, isPrimary },
    update: { department, isPrimary },
  });
}

async function ensureNotification(userId: string, title: string, type: any, body: string) {
  const existing = await prisma.notification.findFirst({ where: { userId, title } });
  if (!existing) await prisma.notification.create({ data: { userId, title, type, body, isRead: false } });
}

async function main() {
  console.log('\nHealthConnect — integrated demo seed (APPEND ONLY)\n');

  // ---------------------------------------------------------------------------
  // 1. Reuse existing reference patients and doctors
  // ---------------------------------------------------------------------------
  const priya = await patient('priya.sharma@demo.hc');
  const rahul = await patient('rahul.verma@demo.hc');
  const meena = await patient('meena.iyer@demo.hc');
  const kavitha = await patient('kavitha.reddy@demo.hc');
  const deepak = await patient('deepak.joshi@demo.hc');

  const drDiabetes = await doctor('dr.arun.kumar@demo.hc');
  const drCardio = await doctor('dr.priya.mehta@demo.hc');
  const drGyn = await doctor('dr.kavitha.iyer@demo.hc');
  const drRheum = await doctor('dr.lakshmi.krishnan@demo.hc');
  const drPulm = await doctor('dr.deepak.verma@demo.hc');

  console.log('Reference patients/doctors found');

  // ---------------------------------------------------------------------------
  // 2. Hospitals — missing in the current DB, safely append four test hospitals
  // ---------------------------------------------------------------------------
  const aiims = await ensureHospital({
    email: 'aiims.delhi@demo.hc', password: 'hospital@123', registrationId: 'HCH-DEMO-0001',
    name: 'AIIMS New Delhi', addressLine1: 'Ansari Nagar East', city: 'New Delhi', state: 'Delhi', pinCode: '110029',
    phone: '01126588500', totalBeds: 1200, icuBeds: 180,
    specialties: ['Cardiology', 'Endocrinology', 'Neurology', 'Oncology', 'Rheumatology'],
    accreditations: ['NABH'],
  });
  const fortis = await ensureHospital({
    email: 'fortis.mumbai@demo.hc', password: 'hospital@123', registrationId: 'HCH-DEMO-0002',
    name: 'Fortis Hospital Mumbai', addressLine1: 'Mulund Goregaon Link Road', city: 'Mumbai', state: 'Maharashtra', pinCode: '400078',
    phone: '02267121000', totalBeds: 600, icuBeds: 85,
    specialties: ['Cardiology', 'Endocrinology', 'Pulmonology'], accreditations: ['NABH', 'NABL'],
  });
  const narayana = await ensureHospital({
    email: 'narayana.blr@demo.hc', password: 'hospital@123', registrationId: 'HCH-DEMO-0003',
    name: 'Narayana Health Bengaluru', addressLine1: 'Bommasandra Industrial Area', city: 'Bengaluru', state: 'Karnataka', pinCode: '560099',
    phone: '08071222000', totalBeds: 1000, icuBeds: 140,
    specialties: ['Cardiology', 'Neurology', 'Orthopaedics'], accreditations: ['NABH'],
  });
  const apollo = await ensureHospital({
    email: 'apollo.chennai@demo.hc', password: 'hospital@123', registrationId: 'HCH-DEMO-0004',
    name: 'Apollo Hospitals Chennai', addressLine1: '21 Greams Lane', city: 'Chennai', state: 'Tamil Nadu', pinCode: '600006',
    phone: '04428290200', totalBeds: 700, icuBeds: 120,
    specialties: ['Cardiology', 'Gynaecology', 'Rheumatology', 'Transplant'], accreditations: ['NABH', 'JCI'],
  });

  await ensureHospitalDepartment(aiims.profile.id, 'Cardiology', 'Dr. Priya Mehta');
  await ensureHospitalDepartment(aiims.profile.id, 'Endocrinology', 'Dr. Arun Kumar');
  await ensureHospitalDepartment(apollo.profile.id, 'Gynaecology', 'Dr. Kavitha Iyer');
  await ensureHospitalDepartment(apollo.profile.id, 'Rheumatology', 'Dr. Lakshmi Krishnan');
  await ensureHospitalDepartment(fortis.profile.id, 'Pulmonology', 'Dr. Deepak Verma');

  await ensureDoctorHospital(drCardio.profile.id, aiims.profile.id, 'Cardiology', true);
  await ensureDoctorHospital(drDiabetes.profile.id, aiims.profile.id, 'Endocrinology', true);
  await ensureDoctorHospital(drGyn.profile.id, apollo.profile.id, 'Gynaecology', true);
  await ensureDoctorHospital(drRheum.profile.id, apollo.profile.id, 'Rheumatology', true);
  await ensureDoctorHospital(drPulm.profile.id, fortis.profile.id, 'Pulmonology', true);

  console.log('Hospitals/departments/doctor links ready');

  // ---------------------------------------------------------------------------
  // 3. Priya Sharma — main longitudinal patient persona
  // ---------------------------------------------------------------------------
  await ensureCondition(priya.profile.id, 'Type 2 Diabetes Mellitus', {
    icdCode: 'E11', status: 'CHRONIC', diagnosedDate: new Date('2022-01-15'),
    managingDoctor: 'Dr. Arun Kumar', notes: 'Improving glycaemic control with medication and diet.',
  });
  await ensureCondition(priya.profile.id, 'Essential Hypertension', {
    icdCode: 'I10', status: 'CHRONIC', diagnosedDate: new Date('2023-03-20'),
    managingDoctor: 'Dr. Priya Mehta', notes: 'Home BP target below 130/85.',
  });
  await ensureAllergy(priya.profile.id, 'Penicillin', {
    category: 'DRUG', severity: 'SEVERE', reaction: 'Generalised urticaria and breathing difficulty',
    diagnosedDate: new Date('2015-03-01'),
  });

  const metformin = await ensureMedication(priya.profile.id, 'Metformin', {
    dosage: '500mg', frequency: 'TWICE_DAILY', timesOfDay: ['08:00', '20:00'], status: 'ACTIVE',
    prescribedBy: 'Dr. Arun Kumar', prescribedFor: 'Type 2 Diabetes', startDate: new Date('2022-01-20'),
    instructions: 'Take with meals', currentStock: 18, refillThreshold: 7,
  });
  await ensureMedication(priya.profile.id, 'Amlodipine', {
    dosage: '5mg', frequency: 'ONCE_DAILY', timesOfDay: ['09:00'], status: 'ACTIVE',
    prescribedBy: 'Dr. Priya Mehta', prescribedFor: 'Hypertension', startDate: new Date('2023-03-25'),
    instructions: 'Take after breakfast', currentStock: 9, refillThreshold: 7,
  });

  for (let i = 0; i < 7; i++) {
    const scheduled = at(ago(i), 8);
    const exists = await prisma.medicationLog.findFirst({ where: { medicationId: metformin.id, scheduledTime: scheduled } });
    if (!exists) await prisma.medicationLog.create({
      data: { medicationId: metformin.id, scheduledTime: scheduled, takenAt: i === 3 ? null : at(ago(i), 8, 8), status: i === 3 ? 'missed' : 'taken' },
    });
  }

  const a1c = [8.7, 8.2, 7.8, 7.4, 7.0, 6.7];
  const bp = [[146, 92], [142, 90], [138, 88], [134, 86], [130, 84], [126, 82]];
  for (let i = 0; i < 6; i++) {
    const measuredAt = new Date(now.getFullYear(), now.getMonth() - (5 - i), 10, 8, 0, 0);
    await ensureVital(priya.profile.id, 'hba1c', measuredAt, { value: String(a1c[i]), unit: '%', source: 'LAB' });
    await ensureVital(priya.profile.id, 'bp', measuredAt, {
      value: `${bp[i][0]}/${bp[i][1]}`, unit: 'mmHg', systolic: bp[i][0], diastolic: bp[i][1], source: 'HOME',
    });
  }
  await prisma.healthScore.upsert({
    where: { patientId: priya.profile.id },
    create: { patientId: priya.profile.id, score: 82, medicationAdherence: 88, symptomFrequency: 76, appointmentRegularity: 90, lifestyleFactors: 78 },
    update: { score: 82, medicationAdherence: 88, symptomFrequency: 76, appointmentRegularity: 90, lifestyleFactors: 78 },
  });

  // Reports + sharing
  let a1cReport = await prisma.medicalReport.findFirst({ where: { patientId: priya.profile.id, name: 'HbA1c Trend Report - Aug 2026' } });
  if (!a1cReport) a1cReport = await prisma.medicalReport.create({ data: {
    patientId: priya.profile.id, name: 'HbA1c Trend Report - Aug 2026', type: 'LAB',
    fileUrl: 'reports/demo/priya-hba1c-aug-2026.pdf', fileSize: 524288, mimeType: 'application/pdf',
    description: 'HbA1c improved to 6.7%.', reportDate: ago(5), uploadedBy: priya.user.id,
  }});
  await prisma.reportShare.upsert({
    where: { reportId_doctorId: { reportId: a1cReport.id, doctorId: drDiabetes.profile.id } },
    create: { reportId: a1cReport.id, doctorId: drDiabetes.profile.id, expiresAt: ahead(30), accessedAt: ago(2) },
    update: {},
  });

  await ensureConsent(priya.profile.id, drDiabetes.profile.id);
  await ensureConsent(priya.profile.id, drCardio.profile.id);

  // ---------------------------------------------------------------------------
  // 4. Additional patient personas — enough data for cross-module testing
  // ---------------------------------------------------------------------------
  await ensureCondition(meena.profile.id, 'Rheumatoid Arthritis', { status: 'CHRONIC', diagnosedDate: new Date('2021-06-12'), managingDoctor: 'Dr. Lakshmi Krishnan' });
  await ensureCondition(meena.profile.id, 'Osteoporosis', { status: 'ACTIVE', diagnosedDate: new Date('2024-02-01'), managingDoctor: 'Dr. Lakshmi Krishnan' });
  await ensureMedication(meena.profile.id, 'Calcium + Vitamin D3', { dosage: '1 tablet', frequency: 'ONCE_DAILY', timesOfDay: ['09:00'], status: 'ACTIVE', prescribedBy: 'Dr. Lakshmi Krishnan', prescribedFor: 'Osteoporosis', startDate: new Date('2024-02-02') });
  await ensureConsent(meena.profile.id, drRheum.profile.id);
  await prisma.healthScore.upsert({ where: { patientId: meena.profile.id }, create: { patientId: meena.profile.id, score: 67, medicationAdherence: 80, symptomFrequency: 60, appointmentRegularity: 75, lifestyleFactors: 65 }, update: { score: 67 } });

  await ensureCondition(rahul.profile.id, 'Essential Hypertension', { status: 'CHRONIC', diagnosedDate: new Date('2024-03-10'), managingDoctor: 'Dr. Priya Mehta' });
  await ensureConsent(rahul.profile.id, drCardio.profile.id);
  await ensureVital(rahul.profile.id, 'bp', ago(2), { value: '136/88', unit: 'mmHg', systolic: 136, diastolic: 88, source: 'HOME' });

  await ensureCondition(kavitha.profile.id, 'PCOS', { status: 'CHRONIC', diagnosedDate: new Date('2020-11-03'), managingDoctor: 'Dr. Kavitha Iyer' });
  await ensureConsent(kavitha.profile.id, drGyn.profile.id);
  await ensureMedication(kavitha.profile.id, 'Metformin', { dosage: '500mg', frequency: 'ONCE_DAILY', timesOfDay: ['20:00'], status: 'ACTIVE', prescribedBy: 'Dr. Kavitha Iyer', prescribedFor: 'PCOS / insulin resistance', startDate: new Date('2025-01-10') });

  await ensureCondition(deepak.profile.id, 'Asthma', { status: 'CHRONIC', diagnosedDate: new Date('2019-08-14'), managingDoctor: 'Dr. Deepak Verma' });
  await ensureConsent(deepak.profile.id, drPulm.profile.id);
  await ensureVital(deepak.profile.id, 'spo2', ago(1), { value: '97', unit: '%', source: 'HOME' });

  console.log('Clinical histories ready');

  // ---------------------------------------------------------------------------
  // 5. Integrated appointments — past, upcoming, pending, teleconsult + in-person
  // ---------------------------------------------------------------------------
  const appt1 = await ensureAppointment({ patientId: priya.profile.id, doctorId: drDiabetes.profile.id, hospitalId: aiims.profile.id, scheduledAt: at(ago(21), 10), type: 'IN_PERSON', status: 'COMPLETED', reasonForVisit: 'Diabetes quarterly review', doctorNotes: 'HbA1c improving. Continue current therapy and diet.', prescription: JSON.stringify([{ name: 'Metformin', dosage: '500mg', frequency: 'TWICE_DAILY' }]) });
  await ensureAppointment({ patientId: priya.profile.id, doctorId: drCardio.profile.id, hospitalId: aiims.profile.id, scheduledAt: at(ahead(4), 11), type: 'IN_PERSON', status: 'CONFIRMED', reasonForVisit: 'BP follow-up and cardiovascular risk review' });
  await ensureAppointment({ patientId: meena.profile.id, doctorId: drRheum.profile.id, hospitalId: apollo.profile.id, scheduledAt: at(ahead(2), 10, 30), type: 'TELECONSULT', status: 'CONFIRMED', reasonForVisit: 'Arthritis flare review', meetingLink: 'https://meet.healthconnect.sbs/demo-meena-rheum' });
  await ensureAppointment({ patientId: rahul.profile.id, doctorId: drCardio.profile.id, hospitalId: aiims.profile.id, scheduledAt: at(ahead(1), 14), type: 'TELECONSULT', status: 'PENDING', reasonForVisit: 'Hypertension medication review', meetingLink: 'https://meet.healthconnect.sbs/demo-rahul-cardio' });
  await ensureAppointment({ patientId: kavitha.profile.id, doctorId: drGyn.profile.id, hospitalId: apollo.profile.id, scheduledAt: at(ago(12), 15), type: 'IN_PERSON', status: 'COMPLETED', reasonForVisit: 'PCOS review', doctorNotes: 'Continue lifestyle intervention and Metformin.' });
  await ensureAppointment({ patientId: deepak.profile.id, doctorId: drPulm.profile.id, hospitalId: fortis.profile.id, scheduledAt: at(ahead(6), 12), type: 'TELECONSULT', status: 'CONFIRMED', reasonForVisit: 'Asthma control assessment', meetingLink: 'https://meet.healthconnect.sbs/demo-deepak-pulm' });

  // verified doctor review from completed appointment
  const existingReview = await prisma.doctorReview.findFirst({ where: { doctorId: drDiabetes.profile.id, patientId: priya.profile.id, appointmentId: appt1.id } });
  if (!existingReview) await prisma.doctorReview.create({ data: {
    doctorId: drDiabetes.profile.id, patientId: priya.profile.id, userId: priya.user.id, appointmentId: appt1.id,
    rating: 5, title: 'Clear and practical diabetes care', body: 'My reports and medication plan were reviewed carefully. The trend view made the discussion very useful.', isVerified: true, status: 'PUBLISHED',
  }});

  console.log('Appointments/reviews ready');

  // ---------------------------------------------------------------------------
  // 6. Communities — patients join condition-relevant groups; doctors moderate
  // ---------------------------------------------------------------------------
  await ensureMembership('diabetes-warriors', priya.user.id);
  await ensureMembership('heart-health-circle', priya.user.id);
  await ensureMembership('nutrition-wellness-hub', priya.user.id);
  await ensureMembership('diabetes-warriors', drDiabetes.user.id, 'MODERATOR');
  await ensureMembership('heart-health-circle', drCardio.user.id, 'MODERATOR');

  await ensureMembership('arthritis-joint-warriors', meena.user.id);
  await ensureMembership('senior-care-india', meena.user.id);
  await ensureMembership('arthritis-joint-warriors', drRheum.user.id, 'MODERATOR');

  await ensureMembership('heart-health-circle', rahul.user.id);
  await ensureMembership('hypertension-heroes', rahul.user.id);

  await ensureMembership('pcos-sisters', kavitha.user.id);
  await ensureMembership('nutrition-wellness-hub', kavitha.user.id);
  await ensureMembership('pcos-sisters', drGyn.user.id, 'MODERATOR');

  await ensureMembership('breathe-better-respiratory', deepak.user.id);
  await ensureMembership('breathe-better-respiratory', drPulm.user.id, 'MODERATOR');

  const diabetesCommunity = await prisma.community.findUnique({ where: { slug: 'diabetes-warriors' } });
  if (diabetesCommunity) {
    let post = await prisma.post.findFirst({ where: { communityId: diabetesCommunity.id, authorId: priya.user.id, title: 'Six months of HbA1c improvement — what helped me' } });
    if (!post) post = await prisma.post.create({ data: {
      communityId: diabetesCommunity.id, authorId: priya.user.id,
      title: 'Six months of HbA1c improvement — what helped me',
      body: 'My HbA1c moved from 8.7 to 6.7 with regular medication, post-meal walking and monthly tracking. Sharing this to encourage anyone who feels progress is too slow.',
      tags: ['HbA1c', 'diabetes', 'patient-journey'], status: 'PUBLISHED', viewCount: 184,
    }});
    const comment = await prisma.comment.findFirst({ where: { postId: post.id, authorId: drDiabetes.user.id } });
    if (!comment) await prisma.comment.create({ data: { postId: post.id, authorId: drDiabetes.user.id, body: 'Excellent progress. Consistency matters more than perfection — keep monitoring and follow your personalised treatment plan.' } });
    await prisma.postReaction.upsert({
      where: { postId_userId_reactionType: { postId: post.id, userId: meena.user.id, reactionType: 'SUPPORT' } },
      create: { postId: post.id, userId: meena.user.id, reactionType: 'SUPPORT' }, update: {},
    });
  }

  console.log('Community relationships/content ready');

  // ---------------------------------------------------------------------------
  // 7. Plans / subscription / payments — realistic Admin + Patient dashboard data
  // ---------------------------------------------------------------------------
  const basic = await prisma.subscriptionPlan.upsert({
    where: { name: 'basic' },
    create: { name: 'basic', displayName: 'Basic', targetRole: 'PATIENT', monthlyPrice: 0, annualPrice: 0, features: ['Health Profile', 'Medical History', 'Public Communities', 'Doctor Booking'], sortOrder: 1 },
    update: {},
  });
  const premium = await prisma.subscriptionPlan.upsert({
    where: { name: 'premium' },
    create: { name: 'premium', displayName: 'Premium', targetRole: 'PATIENT', monthlyPrice: 299, annualPrice: 2990, features: ['Everything in Basic', 'Health Score', 'Unlimited Reports', 'Medication Reminders', 'Priority Booking'], sortOrder: 2 },
    update: {},
  });
  await prisma.subscriptionPlan.upsert({
    where: { name: 'professional' },
    create: { name: 'professional', displayName: 'Professional', targetRole: 'DOCTOR', monthlyPrice: 799, annualPrice: 7990, features: ['Verified Profile', 'Patient History Access', 'Appointments', 'Prescriptions', 'Analytics'], sortOrder: 3 },
    update: {},
  });
  await prisma.subscriptionPlan.upsert({
    where: { name: 'enterprise' },
    create: { name: 'enterprise', displayName: 'Enterprise', targetRole: 'HOSPITAL', monthlyPrice: 0, annualPrice: 0, features: ['Hospital Profile', 'Doctor Network', 'Departments', 'Enterprise Support'], sortOrder: 4 },
    update: {},
  });

  let subscription = await prisma.userSubscription.findFirst({ where: { userId: priya.user.id, status: 'ACTIVE' } });
  if (!subscription) subscription = await prisma.userSubscription.create({ data: {
    userId: priya.user.id, planId: premium.id, status: 'ACTIVE', billingCycle: 'MONTHLY', startDate: ago(60), endDate: ahead(30), autoRenew: true,
  }});
  for (const [idx, days] of [55, 25].entries()) {
    const orderId = `demo_order_priya_${idx + 1}`;
    const exists = await prisma.payment.findFirst({ where: { subscriptionId: subscription.id, razorpayOrderId: orderId } });
    if (!exists) await prisma.payment.create({ data: { subscriptionId: subscription.id, amount: 299, currency: 'INR', status: 'SUCCESS', razorpayOrderId: orderId, razorpayPaymentId: `demo_pay_priya_${idx + 1}`, paidAt: ago(days) } });
  }

  // Basic plan for Meena if she has none
  const meenaSub = await prisma.userSubscription.findFirst({ where: { userId: meena.user.id, status: 'ACTIVE' } });
  if (!meenaSub) await prisma.userSubscription.create({ data: { userId: meena.user.id, planId: basic.id, status: 'ACTIVE', billingCycle: 'MONTHLY', startDate: ago(10), endDate: ahead(355), autoRenew: false } });

  console.log('Subscriptions/payments ready');

  // ---------------------------------------------------------------------------
  // 8. Notifications / settings / audit — visible cross-module activity
  // ---------------------------------------------------------------------------
  await ensureNotification(priya.user.id, 'Upcoming cardiology appointment', 'APPOINTMENT_REMINDER', 'Your appointment with Dr. Priya Mehta is scheduled in 4 days.');
  await ensureNotification(priya.user.id, 'Excellent HbA1c progress', 'HEALTH_ALERT', 'Your six-month HbA1c trend has improved from 8.7% to 6.7%.');
  await ensureNotification(meena.user.id, 'Rheumatology teleconsult confirmed', 'APPOINTMENT_REMINDER', 'Your upcoming teleconsult with Dr. Lakshmi Krishnan is confirmed.');
  await ensureNotification(drCardio.user.id, 'New appointment request', 'APPOINTMENT_REMINDER', 'Rahul Verma requested a hypertension teleconsult and is awaiting confirmation.');
  await ensureNotification(drDiabetes.user.id, 'Patient report shared', 'REPORT_SHARED', 'Priya Sharma shared an HbA1c trend report with you.');

  await prisma.userSettings.upsert({
    where: { userId: priya.user.id },
    create: { userId: priya.user.id, medicationReminders: true, appointmentReminders: true, communityActivity: true, weeklyHealthSummary: true, emailNotifications: true, smsNotifications: true },
    update: {},
  });

  const auditExists = await prisma.auditLog.findFirst({ where: { userId: priya.user.id, action: 'DEMO_INTEGRATED_DATA_READY' } });
  if (!auditExists) await prisma.auditLog.create({ data: { userId: priya.user.id, action: 'DEMO_INTEGRATED_DATA_READY', entityType: 'TEST_DATA', metadata: { source: 'seed-integrated-demo.ts', appendOnly: true } } });

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  const counts = {
    users: await prisma.user.count(),
    patients: await prisma.user.count({ where: { role: 'PATIENT' } }),
    doctors: await prisma.user.count({ where: { role: 'DOCTOR' } }),
    hospitals: await prisma.user.count({ where: { role: 'HOSPITAL' } }),
    admins: await prisma.user.count({ where: { role: 'ADMIN' } }),
    appointments: await prisma.appointment.count(),
    communities: await prisma.community.count(),
    activeSubscriptions: await prisma.userSubscription.count({ where: { status: 'ACTIVE' } }),
  };

  console.log('\n-----------------------------------------------');
  console.log('Integrated demo seed completed WITHOUT deletes');
  console.log(counts);
  console.log('\nHospital demo login password: hospital@123');
  console.log('Examples: aiims.delhi@demo.hc / fortis.mumbai@demo.hc');
  console.log('-----------------------------------------------\n');
}

main()
  .catch((e) => {
    console.error('Integrated seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
