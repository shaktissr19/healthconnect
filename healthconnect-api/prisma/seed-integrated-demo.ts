import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const hash = (p: string) => bcrypt.hashSync(p, 12);

/**
 * HealthConnect India — Integrated Demo Seed (canonical)
 *
 * SAFE / APPEND-ONLY / IDEMPOTENT:
 * - NO deleteMany()
 * - preserves existing 35 patients / 30 doctors / 12 communities / admin
 * - creates or enriches only known demo records
 * - uses business timezone Asia/Kolkata (IST, UTC+05:30)
 * - fixes the six integrated appointments to explicit IST instants
 *
 * Storage rule:
 * - Date objects represent absolute instants (UTC internally)
 * - user-facing appointment times are defined in IST
 */

const IST_OFFSET = '+05:30';
const ist = (date: string, time = '00:00') => new Date(`${date}T${time}:00${IST_OFFSET}`);

async function getPatient(email: string) {
  const user = await prisma.user.findUnique({ where: { email }, include: { patientProfile: true } });
  if (!user?.patientProfile) throw new Error(`Patient missing: ${email}`);
  return { user, profile: user.patientProfile };
}

async function getDoctor(email: string) {
  const user = await prisma.user.findUnique({ where: { email }, include: { doctorProfile: true } });
  if (!user?.doctorProfile) throw new Error(`Doctor missing: ${email}`);
  return { user, profile: user.doctorProfile };
}

async function ensureHospital(input: {
  email: string;
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
        passwordHash: hash('hospital@123'),
        role: 'HOSPITAL',
        registrationId: input.registrationId,
        isEmailVerified: true,
        isActive: true,
      },
    });
  }

  const profile = await prisma.hospitalProfile.upsert({
    where: { userId: user.id },
    create: {
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
      verifiedAt: ist('2026-08-01', '09:00'),
      isPremium: true,
      registrationNumber: input.registrationId,
    },
    update: {
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
      isPremium: true,
    },
  });

  return { user, profile };
}

async function ensureDepartment(hospitalId: string, name: string, headName?: string) {
  const existing = await prisma.department.findFirst({ where: { hospitalId, name } });
  if (!existing) await prisma.department.create({ data: { hospitalId, name, headName } });
}

async function ensureDoctorHospital(doctorId: string, hospitalId: string, department: string) {
  await prisma.doctorHospital.upsert({
    where: { doctorId_hospitalId: { doctorId, hospitalId } },
    create: { doctorId, hospitalId, department, isPrimary: true },
    update: { department, isPrimary: true },
  });
}

async function ensureCondition(patientId: string, name: string, data: any) {
  const existing = await prisma.condition.findFirst({ where: { patientId, name } });
  if (!existing) await prisma.condition.create({ data: { patientId, name, ...data } });
}

async function ensureAllergy(patientId: string, allergen: string, data: any) {
  const existing = await prisma.allergy.findFirst({ where: { patientId, allergen } });
  if (!existing) await prisma.allergy.create({ data: { patientId, allergen, ...data } });
}

async function ensureMedication(patientId: string, name: string, data: any) {
  const existing = await prisma.medication.findFirst({ where: { patientId, name } });
  if (existing) return existing;
  return prisma.medication.create({ data: { patientId, name, ...data } });
}

async function ensureVital(patientId: string, type: any, measuredAt: Date, data: any) {
  const existing = await prisma.vital.findFirst({ where: { patientId, type, measuredAt } });
  if (!existing) await prisma.vital.create({ data: { patientId, type, measuredAt, ...data } });
}

async function ensureHealthScore(patientId: string, score: number, medicationAdherence: number, symptomFrequency: number, appointmentRegularity: number, lifestyleFactors: number) {
  await prisma.healthScore.upsert({
    where: { patientId },
    create: { patientId, score, medicationAdherence, symptomFrequency, appointmentRegularity, lifestyleFactors },
    update: { score, medicationAdherence, symptomFrequency, appointmentRegularity, lifestyleFactors },
  });
}

async function ensureConsent(patientId: string, doctorId: string) {
  const existing = await prisma.patientConsent.findFirst({ where: { patientId, doctorId, status: 'ACTIVE' } });
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

async function ensureReport(patientId: string, name: string, data: any) {
  let report = await prisma.medicalReport.findFirst({ where: { patientId, name } });
  if (!report) report = await prisma.medicalReport.create({ data: { patientId, name, ...data } });
  return report;
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
  // Reason + patient + doctor identifies the canonical demo appointment.
  // Updating scheduledAt repairs older seed rows that were created with server-local time.
  const existing = await prisma.appointment.findFirst({
    where: { patientId: data.patientId, doctorId: data.doctorId, reasonForVisit: data.reasonForVisit },
  });
  if (existing) {
    return prisma.appointment.update({
      where: { id: existing.id },
      data: {
        hospitalId: data.hospitalId,
        scheduledAt: data.scheduledAt,
        type: data.type,
        status: data.status,
        doctorNotes: data.doctorNotes,
        prescription: data.prescription,
        meetingLink: data.meetingLink,
      },
    });
  }
  return prisma.appointment.create({ data });
}

async function ensureMembership(slug: string, userId: string, role = 'MEMBER') {
  const community = await prisma.community.findUnique({ where: { slug } });
  if (!community) return;
  await prisma.communityMember.upsert({
    where: { communityId_userId: { communityId: community.id, userId } },
    create: { communityId: community.id, userId, role, isApproved: true },
    update: { role, isApproved: true },
  });
}

async function ensureNotification(userId: string, title: string, type: any, body: string) {
  const existing = await prisma.notification.findFirst({ where: { userId, title } });
  if (!existing) await prisma.notification.create({ data: { userId, title, type, body, isRead: false } });
}

async function main() {
  console.log('\nHealthConnect — integrated demo seed (APPEND ONLY, IST SAFE)\n');

  const priya = await getPatient('priya.sharma@demo.hc');
  const rahul = await getPatient('rahul.verma@demo.hc');
  const meena = await getPatient('meena.iyer@demo.hc');
  const kavitha = await getPatient('kavitha.reddy@demo.hc');
  const deepak = await getPatient('deepak.joshi@demo.hc');

  const drDiabetes = await getDoctor('dr.arun.kumar@demo.hc');
  const drCardio = await getDoctor('dr.priya.mehta@demo.hc');
  const drGyn = await getDoctor('dr.kavitha.iyer@demo.hc');
  const drRheum = await getDoctor('dr.lakshmi.krishnan@demo.hc');
  const drPulm = await getDoctor('dr.deepak.verma@demo.hc');

  const aiims = await ensureHospital({
    email: 'aiims.delhi@demo.hc', registrationId: 'HCH-DEMO-0001', name: 'AIIMS New Delhi',
    addressLine1: 'Ansari Nagar East', city: 'New Delhi', state: 'Delhi', pinCode: '110029', phone: '01126588500',
    totalBeds: 1200, icuBeds: 180, specialties: ['Cardiology', 'Endocrinology', 'Neurology', 'Oncology', 'Rheumatology'], accreditations: ['NABH'],
  });
  const fortis = await ensureHospital({
    email: 'fortis.mumbai@demo.hc', registrationId: 'HCH-DEMO-0002', name: 'Fortis Hospital Mumbai',
    addressLine1: 'Mulund Goregaon Link Road', city: 'Mumbai', state: 'Maharashtra', pinCode: '400078', phone: '02267121000',
    totalBeds: 600, icuBeds: 85, specialties: ['Cardiology', 'Endocrinology', 'Pulmonology'], accreditations: ['NABH', 'NABL'],
  });
  await ensureHospital({
    email: 'narayana.blr@demo.hc', registrationId: 'HCH-DEMO-0003', name: 'Narayana Health Bengaluru',
    addressLine1: 'Bommasandra Industrial Area', city: 'Bengaluru', state: 'Karnataka', pinCode: '560099', phone: '08071222000',
    totalBeds: 1000, icuBeds: 140, specialties: ['Cardiology', 'Neurology', 'Orthopaedics'], accreditations: ['NABH'],
  });
  const apollo = await ensureHospital({
    email: 'apollo.chennai@demo.hc', registrationId: 'HCH-DEMO-0004', name: 'Apollo Hospitals Chennai',
    addressLine1: '21 Greams Lane', city: 'Chennai', state: 'Tamil Nadu', pinCode: '600006', phone: '04428290200',
    totalBeds: 700, icuBeds: 120, specialties: ['Cardiology', 'Gynaecology', 'Rheumatology', 'Transplant'], accreditations: ['NABH', 'JCI'],
  });

  await ensureDepartment(aiims.profile.id, 'Cardiology', 'Dr. Priya Mehta');
  await ensureDepartment(aiims.profile.id, 'Endocrinology', 'Dr. Arun Kumar');
  await ensureDepartment(apollo.profile.id, 'Gynaecology', 'Dr. Kavitha Iyer');
  await ensureDepartment(apollo.profile.id, 'Rheumatology', 'Dr. Lakshmi Krishnan');
  await ensureDepartment(fortis.profile.id, 'Pulmonology', 'Dr. Deepak Verma');

  await ensureDoctorHospital(drCardio.profile.id, aiims.profile.id, 'Cardiology');
  await ensureDoctorHospital(drDiabetes.profile.id, aiims.profile.id, 'Endocrinology');
  await ensureDoctorHospital(drGyn.profile.id, apollo.profile.id, 'Gynaecology');
  await ensureDoctorHospital(drRheum.profile.id, apollo.profile.id, 'Rheumatology');
  await ensureDoctorHospital(drPulm.profile.id, fortis.profile.id, 'Pulmonology');

  // Clinical personas
  await ensureCondition(priya.profile.id, 'Type 2 Diabetes Mellitus', { icdCode: 'E11', status: 'CHRONIC', diagnosedDate: ist('2022-01-15'), managingDoctor: 'Dr. Arun Kumar', notes: 'Improving glycaemic control with medication and diet.' });
  await ensureCondition(priya.profile.id, 'Essential Hypertension', { icdCode: 'I10', status: 'CHRONIC', diagnosedDate: ist('2023-03-20'), managingDoctor: 'Dr. Priya Mehta', notes: 'Home BP target below 130/85.' });
  await ensureAllergy(priya.profile.id, 'Penicillin', { category: 'DRUG', severity: 'SEVERE', reaction: 'Generalised urticaria and breathing difficulty', diagnosedDate: ist('2015-03-01') });
  await ensureMedication(priya.profile.id, 'Metformin', { dosage: '500mg', frequency: 'TWICE_DAILY', timesOfDay: ['08:00', '20:00'], status: 'ACTIVE', prescribedBy: 'Dr. Arun Kumar', prescribedFor: 'Type 2 Diabetes', startDate: ist('2022-01-20'), instructions: 'Take with meals', currentStock: 18, refillThreshold: 7 });
  await ensureMedication(priya.profile.id, 'Amlodipine', { dosage: '5mg', frequency: 'ONCE_DAILY', timesOfDay: ['09:00'], status: 'ACTIVE', prescribedBy: 'Dr. Priya Mehta', prescribedFor: 'Hypertension', startDate: ist('2023-03-25'), instructions: 'Take after breakfast', currentStock: 9, refillThreshold: 7 });
  await ensureHealthScore(priya.profile.id, 82, 88, 76, 90, 78);

  await ensureCondition(meena.profile.id, 'Rheumatoid Arthritis', { status: 'CHRONIC', diagnosedDate: ist('2021-06-12'), managingDoctor: 'Dr. Lakshmi Krishnan' });
  await ensureCondition(meena.profile.id, 'Osteoporosis', { status: 'ACTIVE', diagnosedDate: ist('2024-02-01'), managingDoctor: 'Dr. Lakshmi Krishnan' });
  await ensureMedication(meena.profile.id, 'Calcium + Vitamin D3', { dosage: '1 tablet', frequency: 'ONCE_DAILY', timesOfDay: ['09:00'], status: 'ACTIVE', prescribedBy: 'Dr. Lakshmi Krishnan', prescribedFor: 'Osteoporosis', startDate: ist('2024-02-02') });
  await ensureHealthScore(meena.profile.id, 67, 80, 60, 75, 65);

  await ensureCondition(rahul.profile.id, 'Essential Hypertension', { status: 'CHRONIC', diagnosedDate: ist('2024-03-10'), managingDoctor: 'Dr. Priya Mehta' });
  await ensureHealthScore(rahul.profile.id, 74, 86, 72, 78, 70);

  await ensureCondition(kavitha.profile.id, 'PCOS', { status: 'CHRONIC', diagnosedDate: ist('2020-11-03'), managingDoctor: 'Dr. Kavitha Iyer' });
  await ensureMedication(kavitha.profile.id, 'Metformin', { dosage: '500mg', frequency: 'ONCE_DAILY', timesOfDay: ['20:00'], status: 'ACTIVE', prescribedBy: 'Dr. Kavitha Iyer', prescribedFor: 'PCOS / insulin resistance', startDate: ist('2025-01-10') });
  await ensureHealthScore(kavitha.profile.id, 79, 85, 75, 82, 77);

  await ensureCondition(deepak.profile.id, 'Asthma', { status: 'CHRONIC', diagnosedDate: ist('2019-08-14'), managingDoctor: 'Dr. Deepak Verma' });
  await ensureHealthScore(deepak.profile.id, 81, 90, 78, 84, 76);

  await ensureConsent(priya.profile.id, drDiabetes.profile.id);
  await ensureConsent(priya.profile.id, drCardio.profile.id);
  await ensureConsent(meena.profile.id, drRheum.profile.id);
  await ensureConsent(rahul.profile.id, drCardio.profile.id);
  await ensureConsent(kavitha.profile.id, drGyn.profile.id);
  await ensureConsent(deepak.profile.id, drPulm.profile.id);

  await ensureVital(priya.profile.id, 'hba1c', ist('2026-08-10', '08:00'), { value: '6.7', unit: '%', source: 'LAB' });
  await ensureVital(priya.profile.id, 'bp', ist('2026-08-15', '07:30'), { value: '126/82', unit: 'mmHg', systolic: 126, diastolic: 82, source: 'HOME' });
  await ensureVital(rahul.profile.id, 'bp', ist('2026-08-14', '08:00'), { value: '136/88', unit: 'mmHg', systolic: 136, diastolic: 88, source: 'HOME' });
  await ensureVital(deepak.profile.id, 'spo2', ist('2026-08-15', '21:00'), { value: '97', unit: '%', source: 'HOME' });

  const priyaReport = await ensureReport(priya.profile.id, 'HbA1c Trend Report - Aug 2026', { type: 'LAB', fileUrl: 'reports/demo/priya-hba1c-aug-2026.pdf', fileSize: 524288, mimeType: 'application/pdf', description: 'HbA1c improved to 6.7%.', reportDate: ist('2026-08-10'), uploadedBy: priya.user.id });
  await ensureReport(meena.profile.id, 'DEXA Bone Density Report - Jul 2026', { type: 'SCAN', fileUrl: 'reports/demo/meena-dexa-jul-2026.pdf', fileSize: 734003, mimeType: 'application/pdf', description: 'Osteoporosis follow-up bone density scan.', reportDate: ist('2026-07-22'), uploadedBy: meena.user.id });
  await ensureReport(rahul.profile.id, 'Home BP Monitoring Summary - Aug 2026', { type: 'OTHER', fileUrl: 'reports/demo/rahul-bp-aug-2026.pdf', fileSize: 312000, mimeType: 'application/pdf', description: 'Two-week home blood pressure summary.', reportDate: ist('2026-08-14'), uploadedBy: rahul.user.id });
  await ensureReport(kavitha.profile.id, 'Hormonal Profile - Jul 2026', { type: 'LAB', fileUrl: 'reports/demo/kavitha-hormonal-jul-2026.pdf', fileSize: 408000, mimeType: 'application/pdf', description: 'PCOS hormonal profile.', reportDate: ist('2026-07-18'), uploadedBy: kavitha.user.id });
  await ensureReport(deepak.profile.id, 'Spirometry Report - Aug 2026', { type: 'SCAN', fileUrl: 'reports/demo/deepak-spirometry-aug-2026.pdf', fileSize: 652000, mimeType: 'application/pdf', description: 'Asthma control spirometry.', reportDate: ist('2026-08-12'), uploadedBy: deepak.user.id });

  await prisma.reportShare.upsert({
    where: { reportId_doctorId: { reportId: priyaReport.id, doctorId: drDiabetes.profile.id } },
    create: { reportId: priyaReport.id, doctorId: drDiabetes.profile.id, expiresAt: ist('2026-09-15', '23:59'), accessedAt: ist('2026-08-13', '11:15') },
    update: {},
  });

  // Canonical IST appointment schedule. Prisma stores these as absolute UTC instants.
  const apptPriyaDiabetes = await ensureAppointment({ patientId: priya.profile.id, doctorId: drDiabetes.profile.id, hospitalId: aiims.profile.id, scheduledAt: ist('2026-07-25', '10:00'), type: 'IN_PERSON', status: 'COMPLETED', reasonForVisit: 'Diabetes quarterly review', doctorNotes: 'HbA1c improving. Continue current therapy and diet.', prescription: JSON.stringify([{ name: 'Metformin', dosage: '500mg', frequency: 'TWICE_DAILY' }]) });
  await ensureAppointment({ patientId: kavitha.profile.id, doctorId: drGyn.profile.id, hospitalId: apollo.profile.id, scheduledAt: ist('2026-08-03', '15:00'), type: 'IN_PERSON', status: 'COMPLETED', reasonForVisit: 'PCOS review', doctorNotes: 'Continue lifestyle intervention and Metformin.' });
  await ensureAppointment({ patientId: rahul.profile.id, doctorId: drCardio.profile.id, hospitalId: aiims.profile.id, scheduledAt: ist('2026-08-16', '14:00'), type: 'TELECONSULT', status: 'PENDING', reasonForVisit: 'Hypertension medication review', meetingLink: 'https://meet.healthconnect.sbs/demo-rahul-cardio' });
  await ensureAppointment({ patientId: meena.profile.id, doctorId: drRheum.profile.id, hospitalId: apollo.profile.id, scheduledAt: ist('2026-08-17', '14:30'), type: 'TELECONSULT', status: 'CONFIRMED', reasonForVisit: 'Arthritis flare review', meetingLink: 'https://meet.healthconnect.sbs/demo-meena-rheum' });
  await ensureAppointment({ patientId: priya.profile.id, doctorId: drCardio.profile.id, hospitalId: aiims.profile.id, scheduledAt: ist('2026-08-19', '11:00'), type: 'IN_PERSON', status: 'CONFIRMED', reasonForVisit: 'BP follow-up and cardiovascular risk review' });
  await ensureAppointment({ patientId: deepak.profile.id, doctorId: drPulm.profile.id, hospitalId: fortis.profile.id, scheduledAt: ist('2026-08-21', '12:00'), type: 'TELECONSULT', status: 'CONFIRMED', reasonForVisit: 'Asthma control assessment', meetingLink: 'https://meet.healthconnect.sbs/demo-deepak-pulm' });

  const existingReview = await prisma.doctorReview.findFirst({ where: { doctorId: drDiabetes.profile.id, patientId: priya.profile.id, appointmentId: apptPriyaDiabetes.id } });
  if (!existingReview) {
    await prisma.doctorReview.create({ data: { doctorId: drDiabetes.profile.id, patientId: priya.profile.id, userId: priya.user.id, appointmentId: apptPriyaDiabetes.id, rating: 5, title: 'Clear and practical diabetes care', body: 'My reports and medication plan were reviewed carefully.', isVerified: true, status: 'PUBLISHED' } });
  }

  // Communities: condition-based patient membership + doctor moderation
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
    if (!post) post = await prisma.post.create({ data: { communityId: diabetesCommunity.id, authorId: priya.user.id, title: 'Six months of HbA1c improvement — what helped me', body: 'My HbA1c moved from 8.7 to 6.7 with regular medication, post-meal walking and monthly tracking.', tags: ['HbA1c', 'diabetes', 'patient-journey'], status: 'PUBLISHED', viewCount: 184 } });
    const comment = await prisma.comment.findFirst({ where: { postId: post.id, authorId: drDiabetes.user.id } });
    if (!comment) await prisma.comment.create({ data: { postId: post.id, authorId: drDiabetes.user.id, body: 'Excellent progress. Consistency matters more than perfection.' } });
    await prisma.postReaction.upsert({ where: { postId_userId_reactionType: { postId: post.id, userId: meena.user.id, reactionType: 'SUPPORT' } }, create: { postId: post.id, userId: meena.user.id, reactionType: 'SUPPORT' }, update: {} });
  }

  // Plans / subscriptions / payments
  const basic = await prisma.subscriptionPlan.upsert({ where: { name: 'basic' }, create: { name: 'basic', displayName: 'Basic', targetRole: 'PATIENT', monthlyPrice: 0, annualPrice: 0, features: ['Health Profile', 'Medical History', 'Public Communities', 'Doctor Booking'], sortOrder: 1 }, update: {} });
  const premium = await prisma.subscriptionPlan.upsert({ where: { name: 'premium' }, create: { name: 'premium', displayName: 'Premium', targetRole: 'PATIENT', monthlyPrice: 299, annualPrice: 2990, features: ['Everything in Basic', 'Health Score', 'Unlimited Reports', 'Medication Reminders', 'Priority Booking'], sortOrder: 2 }, update: {} });
  await prisma.subscriptionPlan.upsert({ where: { name: 'professional' }, create: { name: 'professional', displayName: 'Professional', targetRole: 'DOCTOR', monthlyPrice: 799, annualPrice: 7990, features: ['Verified Profile', 'Patient History Access', 'Appointments', 'Prescriptions', 'Analytics'], sortOrder: 3 }, update: {} });
  await prisma.subscriptionPlan.upsert({ where: { name: 'enterprise' }, create: { name: 'enterprise', displayName: 'Enterprise', targetRole: 'HOSPITAL', monthlyPrice: 0, annualPrice: 0, features: ['Hospital Profile', 'Doctor Network', 'Departments', 'Enterprise Support'], sortOrder: 4 }, update: {} });

  let priyaSub = await prisma.userSubscription.findFirst({ where: { userId: priya.user.id, status: 'ACTIVE' } });
  if (!priyaSub) priyaSub = await prisma.userSubscription.create({ data: { userId: priya.user.id, planId: premium.id, status: 'ACTIVE', billingCycle: 'MONTHLY', startDate: ist('2026-06-16'), endDate: ist('2026-09-15', '23:59'), autoRenew: true } });
  for (const [orderId, paymentId, paidAt] of [
    ['demo_order_priya_1', 'demo_pay_priya_1', ist('2026-06-22', '10:00')],
    ['demo_order_priya_2', 'demo_pay_priya_2', ist('2026-07-22', '10:00')],
  ] as const) {
    const existing = await prisma.payment.findFirst({ where: { subscriptionId: priyaSub.id, razorpayOrderId: orderId } });
    if (!existing) await prisma.payment.create({ data: { subscriptionId: priyaSub.id, amount: 299, currency: 'INR', status: 'SUCCESS', razorpayOrderId: orderId, razorpayPaymentId: paymentId, paidAt } });
  }

  const meenaSub = await prisma.userSubscription.findFirst({ where: { userId: meena.user.id, status: 'ACTIVE' } });
  if (!meenaSub) await prisma.userSubscription.create({ data: { userId: meena.user.id, planId: basic.id, status: 'ACTIVE', billingCycle: 'MONTHLY', startDate: ist('2026-08-05'), endDate: ist('2027-08-04', '23:59'), autoRenew: false } });

  await ensureNotification(priya.user.id, 'Upcoming cardiology appointment', 'APPOINTMENT_REMINDER', 'Your appointment with Dr. Priya Mehta is scheduled for 19 Aug at 11:00 AM IST.');
  await ensureNotification(meena.user.id, 'Rheumatology teleconsult confirmed', 'APPOINTMENT_REMINDER', 'Your teleconsult with Dr. Lakshmi Krishnan is confirmed for 17 Aug at 2:30 PM IST.');
  await ensureNotification(drCardio.user.id, 'New appointment request', 'APPOINTMENT_REMINDER', 'Rahul Verma requested a hypertension teleconsult for 16 Aug at 2:00 PM IST.');
  await ensureNotification(drDiabetes.user.id, 'Patient report shared', 'REPORT_SHARED', 'Priya Sharma shared an HbA1c trend report with you.');

  await prisma.userSettings.upsert({
    where: { userId: priya.user.id },
    create: { userId: priya.user.id, medicationReminders: true, appointmentReminders: true, communityActivity: true, weeklyHealthSummary: true, emailNotifications: true, smsNotifications: true, timezone: 'Asia/Kolkata' },
    update: { timezone: 'Asia/Kolkata' },
  });

  const auditExists = await prisma.auditLog.findFirst({ where: { userId: priya.user.id, action: 'DEMO_INTEGRATED_DATA_READY_V2' } });
  if (!auditExists) await prisma.auditLog.create({ data: { userId: priya.user.id, action: 'DEMO_INTEGRATED_DATA_READY_V2', entityType: 'TEST_DATA', metadata: { source: 'seed-integrated-demo.ts', appendOnly: true, businessTimezone: 'Asia/Kolkata' } } });

  const counts = {
    users: await prisma.user.count(),
    patients: await prisma.user.count({ where: { role: 'PATIENT' } }),
    doctors: await prisma.user.count({ where: { role: 'DOCTOR' } }),
    hospitals: await prisma.user.count({ where: { role: 'HOSPITAL' } }),
    admins: await prisma.user.count({ where: { role: 'ADMIN' } }),
    appointments: await prisma.appointment.count(),
    reports: await prisma.medicalReport.count(),
    healthScores: await prisma.healthScore.count(),
    communityMembers: await prisma.communityMember.count(),
    communities: await prisma.community.count(),
    activeSubscriptions: await prisma.userSubscription.count({ where: { status: 'ACTIVE' } }),
  };

  console.log('\nIntegrated demo seed completed WITHOUT deletes');
  console.log('Business timezone: Asia/Kolkata (IST)');
  console.log(counts);
  console.log('Hospital demo password: hospital@123');
}

main()
  .catch((e) => {
    console.error('Integrated seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
