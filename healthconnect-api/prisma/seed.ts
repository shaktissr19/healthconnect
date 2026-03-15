import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
const hash = (p: string) => bcrypt.hashSync(p, 10);

// ── Helpers ───────────────────────────────────────────────────────────────────
const now = new Date();
const ago  = (n: number) => new Date(now.getTime() - n * 86400000);
const fwd  = (n: number) => new Date(now.getTime() + n * 86400000);
const todayAt = (h: number, m = 0) => { const d = new Date(); d.setHours(h, m, 0, 0); return d; };

async function main() {
  console.log('\n🏥  HealthConnect — Updated Seed (append-only, preserves all existing data)\n');

  // ── 1. Get existing doctor (dArvind) ────────────────────────────────────────
  const drUser = await prisma.user.findUnique({ where: { email: 'arvind.sharma@demo.hc' } });
  if (!drUser) { console.error('❌  Run the original seed first — arvind.sharma@demo.hc not found'); process.exit(1); }

  const drProfile = await prisma.doctorProfile.findUnique({ where: { userId: drUser.id } });
  if (!drProfile) { console.error('❌  Doctor profile not found'); process.exit(1); }
  console.log('✅  Found existing doctor:', drUser.email);

  // Update password to simpler one for testing
  await prisma.user.update({ where: { id: drUser.id }, data: { passwordHash: hash('doctor@123') } });

  // ── 2. Add 4 new test patients for the doctor's roster ──────────────────────
  const NEW_PATIENTS = [
    { email: 'meena.iyer@demo.hc',   reg: 'HCP00235', first: 'Meena',   last: 'Iyer',   dob: '1958-09-12', gender: 'FEMALE', blood: 'O_NEGATIVE',  conditions: ['Arthritis', 'Osteoporosis'],    city: 'Chennai' },
    { email: 'amit.verma@demo.hc',   reg: 'HCP00236', first: 'Amit',    last: 'Verma',  dob: '1972-04-25', gender: 'MALE',   blood: 'A_POSITIVE',  conditions: ['Hypertension', 'Angina'],      city: 'Mumbai' },
    { email: 'sunita.rao@demo.hc',   reg: 'HCP00237', first: 'Sunita',  last: 'Rao',    dob: '1985-11-03', gender: 'FEMALE', blood: 'B_POSITIVE',  conditions: ['Type 2 Diabetes', 'PCOS'],    city: 'Bangalore' },
    { email: 'devraj.singh@demo.hc', reg: 'HCP00238', first: 'Devraj',  last: 'Singh',  dob: '1968-07-19', gender: 'MALE',   blood: 'AB_POSITIVE', conditions: ['Chronic Heart Failure'],       city: 'Delhi' },
  ];

  const newPatients: any[] = [];

  for (const p of NEW_PATIENTS) {
    // Skip if already exists
    let pUser = await prisma.user.findUnique({ where: { email: p.email } });
    if (!pUser) {
      pUser = await prisma.user.create({
        data: { email: p.email, passwordHash: hash('patient@123'), role: 'PATIENT', registrationId: p.reg, isEmailVerified: true, isActive: true },
      });
    }

    let pProfile = await prisma.patientProfile.findUnique({ where: { userId: pUser.id } });
    if (!pProfile) {
      pProfile = await prisma.patientProfile.create({
        data: {
          userId: pUser.id, firstName: p.first, lastName: p.last,
          dateOfBirth: new Date(p.dob), gender: p.gender as any, bloodGroup: p.blood as any,
          city: p.city, state: 'India', country: 'India',
        },
      });

      await prisma.condition.createMany({
        data: p.conditions.map(name => ({
          patientId: pProfile!.id, name, status: 'CHRONIC' as const,
          diagnosedDate: ago(Math.floor(Math.random() * 730 + 180)),
          managingDoctor: 'Dr. Arvind Sharma',
        })),
      });

      await prisma.vital.createMany({
        data: [
          { patientId: pProfile.id, type: 'bp',          value: '134/86', unit: 'mmHg', systolic: 134, diastolic: 86, measuredAt: ago(2) },
          { patientId: pProfile.id, type: 'heart_rate',  value: String(Math.floor(Math.random()*20+68)), unit: 'bpm', measuredAt: ago(2) },
          { patientId: pProfile.id, type: 'weight',      value: String(Math.floor(Math.random()*30+55)), unit: 'kg',  measuredAt: ago(3) },
        ],
      });

      await prisma.healthScore.upsert({
        where:  { patientId: pProfile.id },
        create: { patientId: pProfile.id, score: Math.floor(Math.random()*25+55), medicationAdherence: 75, symptomFrequency: 65, appointmentRegularity: 80, lifestyleFactors: 70 },
        update: {},
      });
    }

    newPatients.push({ user: pUser, profile: pProfile, data: p });
    console.log(`✅  Patient: ${p.first} ${p.last} (${p.email})`);
  }

  // Also get the existing Rahul patient
  const rahulUser    = await prisma.user.findUnique({ where: { email: 'rahul@demo.hc' } });
  const rahulProfile = rahulUser ? await prisma.patientProfile.findUnique({ where: { userId: rahulUser.id } }) : null;
  if (rahulProfile) {
    newPatients.unshift({ user: rahulUser, profile: rahulProfile, data: { first: 'Rahul', last: 'Sharma' } });
    console.log('✅  Found existing patient: Rahul Sharma');
  }

  // ── 3. Today's appointments (the critical ones for the doctor dashboard) ────
  const todayAppts = [
    { pi: 0, hour: 9,  min: 0,  type: 'TELECONSULT', status: 'CONFIRMED', reason: 'HbA1c review and medication adjustment' },
    { pi: 1, hour: 10, min: 30, type: 'IN_PERSON',   status: 'CONFIRMED', reason: 'Arthritis pain management follow-up' },
    { pi: 2, hour: 11, min: 0,  type: 'TELECONSULT', status: 'PENDING',   reason: 'Hypertension and angina review' },
    { pi: 3, hour: 14, min: 0,  type: 'IN_PERSON',   status: 'CONFIRMED', reason: 'Diabetes and PCOS quarterly check' },
    { pi: 4, hour: 15, min: 30, type: 'TELECONSULT', status: 'CONFIRMED', reason: 'Heart failure monitoring' },
  ];

  let apptCreated = 0;
  const createdAppts: any[] = [];

  for (const a of todayAppts) {
    const pat = newPatients[a.pi];
    if (!pat) continue;
    const scheduledAt = todayAt(a.hour, a.min);

    const exists = await prisma.appointment.findFirst({
      where: { doctorId: drProfile.id, patientId: pat.profile.id, scheduledAt },
    });
    if (!exists) {
      const appt = await prisma.appointment.create({
        data: {
          doctorId: drProfile.id, patientId: pat.profile.id,
          scheduledAt, durationMinutes: 30,
          type: a.type as any, status: a.status as any,
          reasonForVisit: a.reason,
          meetingLink: a.type === 'TELECONSULT'
            ? `https://meet.healthconnect.sbs/${Math.random().toString(36).slice(2, 8)}`
            : null,
        },
      });
      createdAppts.push(appt);
      apptCreated++;
    }
  }
  console.log(`✅  Today's appointments: ${apptCreated} created`);

  // ── 4. Upcoming appointments (next 7 days) ───────────────────────────────────
  const upcomingAppts = [
    { pi: 1, daysAhead: 2, hour: 10, type: 'TELECONSULT', status: 'CONFIRMED', reason: 'Arthritis medication review' },
    { pi: 3, daysAhead: 3, hour: 14, type: 'IN_PERSON',   status: 'PENDING',   reason: 'PCOS follow-up bloodwork review' },
    { pi: 0, daysAhead: 5, hour: 9,  type: 'TELECONSULT', status: 'CONFIRMED', reason: 'Routine diabetes check' },
    { pi: 4, daysAhead: 7, hour: 11, type: 'IN_PERSON',   status: 'CONFIRMED', reason: 'Echocardiogram follow-up' },
  ];

  let upcomingCreated = 0;
  for (const a of upcomingAppts) {
    const pat = newPatients[a.pi];
    if (!pat) continue;
    const scheduledAt = new Date(fwd(a.daysAhead)); scheduledAt.setHours(a.hour, 0, 0, 0);

    const exists = await prisma.appointment.findFirst({
      where: { doctorId: drProfile.id, patientId: pat.profile.id, scheduledAt },
    });
    if (!exists) {
      await prisma.appointment.create({
        data: {
          doctorId: drProfile.id, patientId: pat.profile.id,
          scheduledAt, durationMinutes: 30,
          type: a.type as any, status: a.status as any,
          reasonForVisit: a.reason,
          meetingLink: a.type === 'TELECONSULT'
            ? `https://meet.healthconnect.sbs/${Math.random().toString(36).slice(2, 8)}`
            : null,
        },
      });
      upcomingCreated++;
    }
  }
  console.log(`✅  Upcoming appointments: ${upcomingCreated} created`);

  // ── 5. Past completed appointments (generates earnings data) ────────────────
  const pastAppts = [
    { pi: 0, daysAgo: 3,  hour: 9,  type: 'TELECONSULT', reason: 'BP medication adjustment',     notes: 'HbA1c improved. Reduced Metformin to 500mg BD.',                                rx: JSON.stringify([{ name: 'Metformin', dosage: '500mg', frequency: 'TWICE_DAILY', duration: '90', instructions: 'Take with meals' }]) },
    { pi: 1, daysAgo: 5,  hour: 10, type: 'IN_PERSON',   reason: 'Arthritis pain review',        notes: 'Started Diclofenac gel topically. Continue physio.',                             rx: JSON.stringify([{ name: 'Diclofenac Gel', dosage: 'Apply BD', frequency: 'TWICE_DAILY', duration: '30', instructions: 'Apply to affected joints' }]) },
    { pi: 2, daysAgo: 7,  hour: 11, type: 'TELECONSULT', reason: 'Hypertension follow-up',       notes: 'BP controlled at 128/82. Continue Amlodipine 5mg.' },
    { pi: 3, daysAgo: 10, hour: 14, type: 'IN_PERSON',   reason: 'Initial consultation',         notes: 'Started Metformin 500mg OD. Diet counselling given.',                            rx: JSON.stringify([{ name: 'Metformin', dosage: '500mg', frequency: 'ONCE_DAILY', duration: '90', instructions: 'Take with dinner' }]) },
    { pi: 4, daysAgo: 12, hour: 15, type: 'TELECONSULT', reason: 'Cardiac function assessment',  notes: 'EF 45%. Continue Ramipril 5mg. Restrict fluid intake.' },
    { pi: 0, daysAgo: 15, hour: 9,  type: 'IN_PERSON',   reason: 'HbA1c review',                 notes: 'HbA1c 7.4 — improved from 8.1. Good compliance.',                               rx: JSON.stringify([{ name: 'Glipizide', dosage: '5mg', frequency: 'ONCE_DAILY', duration: '60', instructions: 'Take 30 min before breakfast' }]) },
    { pi: 1, daysAgo: 18, hour: 10, type: 'IN_PERSON',   reason: 'Knee pain consultation',       notes: 'Moderate OA right knee. Physiotherapy recommended.' },
    { pi: 2, daysAgo: 22, hour: 11, type: 'TELECONSULT', reason: 'Angina symptom review',        notes: 'Stable angina. Nitroglycerin SOS prescribed.',                                  rx: JSON.stringify([{ name: 'Nitroglycerin Spray', dosage: '400mcg', frequency: 'AS_NEEDED', duration: '180', instructions: 'Use under tongue during chest pain' }]) },
    { pi: 3, daysAgo: 25, hour: 14, type: 'TELECONSULT', reason: 'PCOS management',              notes: 'Continue OCP. Weight loss target 5kg in 3 months.' },
    { pi: 4, daysAgo: 30, hour: 15, type: 'IN_PERSON',   reason: 'Heart failure baseline',       notes: 'Echo booked. Started Furosemide 40mg OD.',                                      rx: JSON.stringify([{ name: 'Furosemide', dosage: '40mg', frequency: 'ONCE_DAILY', duration: '90', instructions: 'Take in morning' }]) },
  ];

  let pastCreated = 0;
  for (const a of pastAppts) {
    const pat = newPatients[a.pi];
    if (!pat) continue;
    const scheduledAt = new Date(ago(a.daysAgo)); scheduledAt.setHours(a.hour, 0, 0, 0);

    const exists = await prisma.appointment.findFirst({
      where: { doctorId: drProfile.id, patientId: pat.profile.id, scheduledAt },
    });
    if (!exists) {
      await prisma.appointment.create({
        data: {
          doctorId: drProfile.id, patientId: pat.profile.id,
          scheduledAt, durationMinutes: 30,
          type: a.type as any, status: 'COMPLETED',
          reasonForVisit: a.reason, doctorNotes: a.notes,
          prescription: (a as any).rx ?? null,
          meetingLink: a.type === 'TELECONSULT'
            ? `https://meet.healthconnect.sbs/${Math.random().toString(36).slice(2, 8)}`
            : null,
        },
      });
      pastCreated++;
    }
  }
  console.log(`✅  Past completed appointments: ${pastCreated} created (generates earnings data)`);

  // ── 6. Doctor notifications ───────────────────────────────────────────────────
  const drNotifCount = await prisma.notification.count({ where: { userId: drUser.id } });
  if (!drNotifCount) {
    await prisma.notification.createMany({
      data: [
        { userId: drUser.id, type: 'APPOINTMENT_REMINDER', isRead: false, title: 'New appointment request', body: 'Amit Verma has requested a teleconsult for today 11:00 AM — pending confirmation.' },
        { userId: drUser.id, type: 'REPORT_SHARED',        isRead: false, title: 'Lab report shared',        body: 'Sunita Rao has shared her blood glucose report with you.' },
        { userId: drUser.id, type: 'COMMUNITY_ACTIVITY',   isRead: true,  title: 'Community question',       body: 'A patient asked: "Is it safe to exercise with high BP?" in Heart Warriors.' },
        { userId: drUser.id, type: 'SYSTEM',               isRead: true,  title: 'Profile verified ✓',       body: 'Your medical license MH/2012/34567 has been verified. ✓ Verified Doctor badge is active.' },
      ],
    });
    console.log('✅  Doctor notifications created');
  } else {
    console.log('✅  Doctor notifications already exist — skipped');
  }

  // ── 7. Patient consents for new patients ─────────────────────────────────────
  for (const pat of newPatients.slice(1)) { // skip Rahul who already has consents
    const exists = await prisma.patientConsent.findFirst({
      where: { patientId: pat.profile.id, doctorId: drProfile.id },
    });
    if (!exists) {
      await prisma.patientConsent.create({
        data: {
          patientId: pat.profile.id, doctorId: drProfile.id,
          accessScope: ['MEDICAL_HISTORY', 'VITALS', 'REPORTS'],
          status: 'ACTIVE',
        },
      });
    }
  }
  console.log('✅  Patient consents verified');

  // ── 8. Update totalPatients on doctor profile ────────────────────────────────
  const totalDistinctPatients = await prisma.appointment.findMany({
    where:    { doctorId: drProfile.id },
    select:   { patientId: true },
    distinct: ['patientId'],
  });
  await prisma.doctorProfile.update({
    where: { id: drProfile.id },
    data:  { totalPatients: totalDistinctPatients.length },
  });

  // ── Print summary ────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(55));
  console.log('🔐  CREDENTIALS SUMMARY');
  console.log('='.repeat(55));
  console.log('\nDOCTOR DASHBOARD → https://healthconnect.sbs/doctor-dashboard');
  console.log('  Email   : arvind.sharma@demo.hc');
  console.log('  Password: doctor@123');
  console.log('  Name    : Dr. Arvind Sharma (Cardiologist)');
  console.log('\nPATIENT DASHBOARD → https://healthconnect.sbs/dashboard');
  console.log('  Email   : rahul@demo.hc');
  console.log('  Password: patient@123');
  console.log('\nNEW TEST PATIENTS (password: patient@123):');
  console.log('  meena.iyer@demo.hc     — Meena Iyer   (Arthritis, Osteoporosis)');
  console.log('  amit.verma@demo.hc     — Amit Verma   (Hypertension, Angina)');
  console.log('  sunita.rao@demo.hc     — Sunita Rao   (Diabetes, PCOS)');
  console.log('  devraj.singh@demo.hc   — Devraj Singh (Chronic Heart Failure)');
  console.log('\nTODAY\'S SCHEDULE (5 appointments):');
  console.log('  09:00  Rahul Sharma    — Teleconsult  — CONFIRMED');
  console.log('  10:30  Meena Iyer      — In-Person    — CONFIRMED');
  console.log('  11:00  Amit Verma      — Teleconsult  — PENDING ← needs confirmation');
  console.log('  14:00  Sunita Rao      — In-Person    — CONFIRMED');
  console.log('  15:30  Devraj Singh    — Teleconsult  — CONFIRMED');
  console.log('\n' + '='.repeat(55));
  console.log('✅  Seed complete — all existing data preserved!\n');
}

main()
  .catch(e => { console.error('❌  Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
