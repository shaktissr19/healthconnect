// src/controllers/doctor.controller.ts
// HealthConnect — Complete Doctor Controller
// Schema-exact: DoctorProfile, Appointment, PatientProfile,
// Vital, Medication, DoctorAvailability, Notification, DoctorReview

import { Request, Response } from 'express';
import { PrismaClient, AppointmentStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ── Helpers ───────────────────────────────────────────────────────────────────
async function getDoctorId(userId: string): Promise<string | null> {
  const dp = await prisma.doctorProfile.findUnique({ where: { userId }, select: { id: true } });
  return dp?.id ?? null;
}
const ok  = (res: Response, data: any) => res.json({ success: true, data });
const err = (res: Response, msg: string, code = 400) => res.status(code).json({ success: false, message: msg });

// =============================================================================
// GET /doctor/dashboard  — KPI summary
// =============================================================================
export async function getDashboard(req: Request, res: Response) {
  try {
    const userId   = (req as any).user?.id;
    const doctorId = await getDoctorId(userId);
    if (!doctorId) return err(res, 'Doctor profile not found', 404);

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [todayCount, pendingCount, distinctPatients, profile, unread, monthlyDone] =
      await Promise.all([
        prisma.appointment.count({ where: { doctorId, scheduledAt: { gte: todayStart, lte: todayEnd } } }),
        prisma.appointment.count({ where: { doctorId, status: 'PENDING' } }),
        prisma.appointment.findMany({ where: { doctorId }, select: { patientId: true }, distinct: ['patientId'] }),
        prisma.doctorProfile.findUnique({ where: { id: doctorId }, select: { averageRating: true, totalReviews: true, consultationFee: true, teleconsultFee: true } }),
        prisma.notification.count({ where: { userId, isRead: false } }),
        prisma.appointment.findMany({ where: { doctorId, status: 'COMPLETED', scheduledAt: { gte: monthStart } }, select: { type: true } }),
      ]);

    const fee  = profile?.consultationFee  ?? 500;
    const tFee = profile?.teleconsultFee   ?? 400;
    const earnings = monthlyDone.reduce((s, a) => s + (a.type === 'TELECONSULT' ? tFee : fee), 0);

    return ok(res, {
      kpis: {
        todayAppts:          todayCount,
        todayAppointments:   todayCount,
        pendingAppts:        pendingCount,
        totalPatients:       distinctPatients.length,
        thisMonthEarnings:   earnings,
        monthlyEarnings:     earnings,
        avgRating:           profile?.averageRating ?? 0,
        totalReviews:        profile?.totalReviews  ?? 0,
        unreadNotifications: unread,
      },
    });
  } catch (e) { console.error('getDashboard', e); return err(res, 'Server error', 500); }
}

// =============================================================================
// GET /doctor/appointments
// =============================================================================
export async function getAppointments(req: Request, res: Response) {
  try {
    const userId   = (req as any).user?.id;
    const doctorId = await getDoctorId(userId);
    if (!doctorId) return err(res, 'Doctor profile not found', 404);

    const { status, date, limit = '50', offset = '0' } = req.query as any;

    const where: Prisma.AppointmentWhereInput = { doctorId };
    if (status && status !== 'all') where.status = status.toUpperCase() as AppointmentStatus;
    if (date) {
      const s = new Date(date); s.setHours(0, 0, 0, 0);
      const e = new Date(date); e.setHours(23, 59, 59, 999);
      where.scheduledAt = { gte: s, lte: e };
    }

    const [rows, total] = await Promise.all([
      prisma.appointment.findMany({
        where, take: +limit, skip: +offset,
        orderBy: { scheduledAt: 'asc' },
        include: {
          patient: {
            select: {
              firstName: true, lastName: true,
              profilePhotoUrl: true, bloodGroup: true,
              conditions: { select: { name: true }, take: 1 },
              user: { select: { registrationId: true } },
            },
          },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    const appointments = rows.map(a => ({
      id:          a.id,
      patientId:   a.patientId,
      patientName: `${a.patient.firstName} ${a.patient.lastName}`,
      avatar:      (a.patient.firstName[0] + a.patient.lastName[0]).toUpperCase(),
      condition:   a.patient.conditions[0]?.name ?? a.reasonForVisit ?? 'Consultation',
      reason:      a.reasonForVisit,
      type:        a.type,
      status:      a.status,
      scheduledAt: a.scheduledAt,
      date:        a.scheduledAt.toISOString(),
      time:        a.scheduledAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      duration:    `${a.durationMinutes} min`,
      meetingLink: a.meetingLink,
      doctorNotes: a.doctorNotes,
      prescription:a.prescription,
    }));

    return ok(res, { appointments, total });
  } catch (e) { console.error('getAppointments', e); return err(res, 'Server error', 500); }
}

// =============================================================================
// PATCH /doctor/appointments/:id
// =============================================================================
export async function updateAppointment(req: Request, res: Response) {
  try {
    const userId   = (req as any).user?.id;
    const doctorId = await getDoctorId(userId);
    if (!doctorId) return err(res, 'Doctor profile not found', 404);

    const { id } = req.params;
    const { status, doctorNotes, followUpDate, meetingLink, cancellationReason } = req.body;

    const existing = await prisma.appointment.findFirst({ where: { id, doctorId } });
    if (!existing) return err(res, 'Appointment not found', 404);

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(status             ? { status: status.toUpperCase() as AppointmentStatus } : {}),
        ...(doctorNotes        ? { doctorNotes } : {}),
        ...(followUpDate       ? { followUpDate: new Date(followUpDate) } : {}),
        ...(meetingLink        ? { meetingLink } : {}),
        ...(cancellationReason ? { cancellationReason } : {}),
      },
    });

    if (status) {
      const pat = await prisma.patientProfile.findUnique({ where: { id: existing.patientId }, select: { userId: true } });
      if (pat) {
        await prisma.notification.create({
          data: { userId: pat.userId, type: 'APPOINTMENT_REMINDER', title: `Appointment ${status.toLowerCase()}`, body: `Your appointment has been ${status.toLowerCase()}.` },
        }).catch(() => {});
      }
    }

    return ok(res, { appointment: updated });
  } catch (e) { console.error('updateAppointment', e); return err(res, 'Server error', 500); }
}

// =============================================================================
// GET /doctor/patients
// =============================================================================
export async function getMyPatients(req: Request, res: Response) {
  try {
    const userId   = (req as any).user?.id;
    const doctorId = await getDoctorId(userId);
    if (!doctorId) return err(res, 'Doctor profile not found', 404);

    const { q, limit = '30', offset = '0' } = req.query as any;

    const appts = await prisma.appointment.findMany({
      where: { doctorId },
      select: { patientId: true, scheduledAt: true, status: true },
      distinct: ['patientId'],
      orderBy: { scheduledAt: 'desc' },
    });
    const patientIds = appts.map(a => a.patientId);
    if (!patientIds.length) return ok(res, { patients: [], total: 0 });

    const patients = await prisma.patientProfile.findMany({
      where: {
        id: { in: patientIds },
        ...(q ? { OR: [
          { firstName: { contains: q, mode: 'insensitive' as const } },
          { lastName:  { contains: q, mode: 'insensitive' as const } },
        ]} : {}),
      },
      include: {
        user:         { select: { email: true, registrationId: true } },
        conditions:   { select: { name: true, status: true }, take: 2 },
        healthScores: true,
      },
      take: +limit, skip: +offset,
    });

    const enriched = patients.map(p => {
      const appt = appts.find(a => a.patientId === p.id);
      const age  = p.dateOfBirth
        ? Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / (365.25 * 86400000))
        : null;
      return {
        id:          p.id,
        name:        `${p.firstName} ${p.lastName}`,
        firstName:   p.firstName,
        lastName:    p.lastName,
        age,
        gender:      p.gender,
        bloodGroup:  p.bloodGroup,
        avatar:      (p.firstName[0] + p.lastName[0]).toUpperCase(),
        condition:   p.conditions[0]?.name ?? 'General',
        conditions:  p.conditions,
        lastVisit:   appt?.scheduledAt?.toISOString(),
        lastStatus:  appt?.status,
        healthScore: p.healthScores?.score,
        email:       p.user.email,
        regId:       p.user.registrationId,
        status:      'ACTIVE',
      };
    });

    return ok(res, { patients: enriched, total: patientIds.length });
  } catch (e) { console.error('getMyPatients', e); return err(res, 'Server error', 500); }
}

// =============================================================================
// GET /doctor/patients/:id
// =============================================================================
export async function getPatientDetail(req: Request, res: Response) {
  try {
    const userId   = (req as any).user?.id;
    const doctorId = await getDoctorId(userId);
    if (!doctorId) return err(res, 'Doctor profile not found', 404);

    const hasRelation = await prisma.appointment.findFirst({ where: { doctorId, patientId: req.params.id } });
    if (!hasRelation) return err(res, 'No relationship with this patient', 403);

    const p = await prisma.patientProfile.findUnique({
      where: { id: req.params.id },
      include: {
        user:         { select: { email: true, registrationId: true } },
        conditions:   true,
        allergies:    { select: { allergen: true, severity: true } },
        medications:  { where: { status: 'ACTIVE' }, take: 10 },
        vitals:       { orderBy: { measuredAt: 'desc' }, take: 8 },
        healthScores: true,
      },
    });
    if (!p) return err(res, 'Patient not found', 404);
    return ok(res, { patient: p });
  } catch (e) { return err(res, 'Server error', 500); }
}

// =============================================================================
// GET /doctor/prescriptions
// POST /doctor/prescriptions
// =============================================================================
export async function getPrescriptions(req: Request, res: Response) {
  try {
    const userId   = (req as any).user?.id;
    const doctorId = await getDoctorId(userId);
    if (!doctorId) return err(res, 'Doctor profile not found', 404);

    const { patientId, limit = '30', offset = '0' } = req.query as any;

    const appts = await prisma.appointment.findMany({
      where: { doctorId, prescription: { not: null }, ...(patientId ? { patientId } : {}) },
      include: { patient: { select: { firstName: true, lastName: true } } },
      orderBy: { scheduledAt: 'desc' },
      take: +limit, skip: +offset,
    });

    const prescriptions = appts.map(a => {
      let drugs: any[] = [];
      try { if (a.prescription) drugs = JSON.parse(a.prescription); } catch {}
      if (!drugs.length && a.prescription) {
        drugs = [{ name: a.prescription, dosage: '', frequency: 'ONCE_DAILY', duration: '' }];
      }
      return {
        id:            a.id,
        appointmentId: a.id,
        patientName:   `${a.patient.firstName} ${a.patient.lastName}`,
        patientId:     a.patientId,
        date:          a.scheduledAt.toISOString(),
        status:        a.status === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE',
        drugs,
        drug:          drugs[0]?.name ?? '',
        dosage:        drugs[0]?.dosage ?? '',
        frequency:     drugs[0]?.frequency ?? '',
        duration:      drugs[0]?.duration ?? '',
      };
    });

    return ok(res, { prescriptions });
  } catch (e) { console.error('getPrescriptions', e); return err(res, 'Server error', 500); }
}

export async function createPrescription(req: Request, res: Response) {
  try {
    const userId   = (req as any).user?.id;
    const doctorId = await getDoctorId(userId);
    if (!doctorId) return err(res, 'Doctor profile not found', 404);

    const { appointmentId, patientId, drugs, drug, dosage, frequency, duration, notes } = req.body;
    const drugList = drugs ?? [{ name: drug, dosage, frequency, duration, instructions: notes }];
    if (!drugList?.length || !drugList[0]?.name) return err(res, 'At least one drug required');

    let apptId = appointmentId;
    if (!apptId) {
      const latest = await prisma.appointment.findFirst({
        where: { doctorId, ...(patientId ? { patientId } : {}) },
        orderBy: { scheduledAt: 'desc' },
      });
      if (!latest) return err(res, 'No appointment found', 404);
      apptId = latest.id;
    }

    const appt = await prisma.appointment.findFirst({ where: { id: apptId, doctorId } });
    if (!appt) return err(res, 'Appointment not found', 404);

    await prisma.appointment.update({ where: { id: apptId }, data: { prescription: JSON.stringify(drugList) } });

    const doc = await prisma.doctorProfile.findUnique({ where: { id: doctorId }, select: { firstName: true, lastName: true } });
    const freqMap: Record<string, string> = {
      'once_daily':'ONCE_DAILY','twice_daily':'TWICE_DAILY','three_times_daily':'THREE_TIMES_DAILY','as_needed':'AS_NEEDED',
      'once daily':'ONCE_DAILY','twice daily':'TWICE_DAILY','thrice daily':'THREE_TIMES_DAILY',
    };

    await Promise.all(drugList.map((d: any) =>
      prisma.medication.create({
        data: {
          patientId:     appt.patientId,
          name:          d.name ?? '',
          dosage:        d.dosage ?? '',
          frequency:     (freqMap[(d.frequency ?? '').toLowerCase()] as any) ?? 'ONCE_DAILY',
          prescribedBy:  `Dr. ${doc?.firstName} ${doc?.lastName}`,
          prescribedFor: d.instructions ?? '',
          startDate:     new Date(),
          endDate:       d.duration ? new Date(Date.now() + parseInt(d.duration) * 86400000) : undefined,
          instructions:  d.instructions ?? '',
          status:        'ACTIVE',
        },
      }).catch(() => null)
    ));

    const pat = await prisma.patientProfile.findUnique({ where: { id: appt.patientId }, select: { userId: true } });
    if (pat) {
      await prisma.notification.create({
        data: { userId: pat.userId, type: 'MEDICATION_REMINDER', title: 'New Prescription', body: `Dr. ${doc?.firstName} ${doc?.lastName} issued a new prescription for you.` },
      }).catch(() => {});
    }

    return ok(res, { message: 'Prescription saved', appointmentId: apptId });
  } catch (e) { console.error('createPrescription', e); return err(res, 'Server error', 500); }
}

// =============================================================================
// GET /doctor/earnings
// =============================================================================
export async function getEarnings(req: Request, res: Response) {
  try {
    const userId   = (req as any).user?.id;
    const doctorId = await getDoctorId(userId);
    if (!doctorId) return err(res, 'Doctor profile not found', 404);

    const profile = await prisma.doctorProfile.findUnique({
      where: { id: doctorId }, select: { consultationFee: true, teleconsultFee: true },
    });
    const fee  = profile?.consultationFee ?? 500;
    const tFee = profile?.teleconsultFee  ?? 400;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastStart  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastEnd    = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const weekStart  = new Date(now); weekStart.setDate(now.getDate() - 7);

    const [thisMo, lastMo, thisWk] = await Promise.all([
      prisma.appointment.findMany({
        where: { doctorId, status: 'COMPLETED', scheduledAt: { gte: monthStart } },
        include: { patient: { select: { firstName: true, lastName: true } } },
        orderBy: { scheduledAt: 'desc' },
      }),
      prisma.appointment.findMany({ where: { doctorId, status: 'COMPLETED', scheduledAt: { gte: lastStart, lte: lastEnd } }, select: { type: true } }),
      prisma.appointment.findMany({ where: { doctorId, status: 'COMPLETED', scheduledAt: { gte: weekStart } }, select: { type: true } }),
    ]);

    const calc = (rows: { type: string }[]) => rows.reduce((s, a) => s + (a.type === 'TELECONSULT' ? tFee : fee), 0);

    const thisTotal = calc(thisMo);
    const history   = thisMo.map(a => ({
      id:          a.id,
      patientName: `${a.patient.firstName} ${a.patient.lastName}`,
      date:        a.scheduledAt,
      type:        a.type,
      amount:      a.type === 'TELECONSULT' ? tFee : fee,
    }));

    return ok(res, {
      thisMonth:      thisTotal,
      lastMonth:      calc(lastMo),
      thisWeek:       calc(thisWk),
      consultations:  thisMo.length,
      avgPerConsult:  thisMo.length ? Math.round(thisTotal / thisMo.length) : 0,
      history,
    });
  } catch (e) { console.error('getEarnings', e); return err(res, 'Server error', 500); }
}

// =============================================================================
// GET /doctor/profile   PUT /doctor/profile
// =============================================================================
export async function getDoctorProfile(req: Request, res: Response) {
  try {
    const userId  = (req as any).user?.id;
    const profile = await prisma.doctorProfile.findUnique({
      where: { userId },
      include: { reviews: { orderBy: { createdAt: 'desc' }, take: 5 } },
    });
    if (!profile) return err(res, 'Doctor profile not found', 404);
    return ok(res, { profile });
  } catch (e) { return err(res, 'Server error', 500); }
}

export async function updateDoctorProfile(req: Request, res: Response) {
  try {
    const userId  = (req as any).user?.id;
    const allowed = ['firstName','lastName','phone','specialization','subSpecializations','qualification',
      'experienceYears','consultationFee','teleconsultFee','languagesSpoken','clinicName','clinicAddress',
      'city','state','pinCode','bio','isAvailableOnline','medicalLicenseNumber'];
    const data: any = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        if (['experienceYears'].includes(k))                   data[k] = parseInt(req.body[k]);
        else if (['consultationFee','teleconsultFee'].includes(k)) data[k] = parseFloat(req.body[k]);
        else if (k === 'isAvailableOnline')                    data[k] = Boolean(req.body[k]);
        else                                                   data[k] = req.body[k];
      }
    }
    const profile = await prisma.doctorProfile.update({ where: { userId }, data });
    return ok(res, { profile });
  } catch (e) { console.error('updateDoctorProfile', e); return err(res, 'Server error', 500); }
}

// =============================================================================
// GET /doctor/availability   PUT /doctor/availability
// =============================================================================
export async function getAvailability(req: Request, res: Response) {
  try {
    const userId   = (req as any).user?.id;
    const doctorId = await getDoctorId(userId);
    if (!doctorId) return err(res, 'Doctor profile not found', 404);
    const slots = await prisma.doctorAvailability.findMany({ where: { doctorId }, orderBy: { dayOfWeek: 'asc' } });
    return ok(res, { availability: slots });
  } catch (e) { return err(res, 'Server error', 500); }
}

export async function updateAvailability(req: Request, res: Response) {
  try {
    const userId   = (req as any).user?.id;
    const doctorId = await getDoctorId(userId);
    if (!doctorId) return err(res, 'Doctor profile not found', 404);

    let { slots } = req.body;

    // Accept day-name object: { Monday: { enabled, start, end }, ... }
    if (!Array.isArray(slots) && typeof slots === 'object') {
      const dayMap: Record<string, number> = { Sunday:0, Monday:1, Tuesday:2, Wednesday:3, Thursday:4, Friday:5, Saturday:6 };
      slots = Object.entries(slots).map(([day, v]: [string, any]) => ({
        dayOfWeek:    dayMap[day] ?? 1,
        startTime:    v.start   ?? '09:00',
        endTime:      v.end     ?? '17:00',
        slotDuration: 30,
        isActive:     v.enabled !== false,
      }));
    }

    if (!Array.isArray(slots)) return err(res, 'slots array required');

    await prisma.doctorAvailability.deleteMany({ where: { doctorId } });
    if (slots.length) {
      await prisma.doctorAvailability.createMany({
        data: slots.map((s: any) => ({
          doctorId,
          dayOfWeek:    parseInt(s.dayOfWeek ?? 1),
          startTime:    s.startTime ?? s.start ?? '09:00',
          endTime:      s.endTime   ?? s.end   ?? '17:00',
          slotDuration: parseInt(s.slotDuration ?? 30),
          isActive:     s.isActive !== false,
        })),
      });
    }
    const updated = await prisma.doctorAvailability.findMany({ where: { doctorId }, orderBy: { dayOfWeek: 'asc' } });
    return ok(res, { availability: updated });
  } catch (e) { console.error('updateAvailability', e); return err(res, 'Server error', 500); }
}
