// src/controllers/doctor.records.controller.ts
// Uses ONLY confirmed prisma models: appointment, patientProfile,
// doctorProfile, notification, medication
// (MedicalReport / ReportShare do NOT exist in this schema)

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getDoctorId(userId: string): Promise<string | null> {
  const dp = await prisma.doctorProfile.findUnique({ where: { userId }, select: { id: true } });
  return dp?.id ?? null;
}

const ok  = (res: Response, data: any) => res.json({ success: true, data });
const err = (res: Response, msg: string, code = 400) =>
  res.status(code).json({ success: false, message: msg });

// ── GET /doctor/records ────────────────────────────────────────────────────
// Returns completed appointments with notes/prescriptions as "records"
export async function getDoctorRecords(req: Request, res: Response) {
  try {
    const userId   = (req as any).user?.id;
    const doctorId = await getDoctorId(userId);
    if (!doctorId) return err(res, 'Doctor profile not found', 404);

    const { patientId, limit = '50', offset = '0' } = req.query as any;

    const rows = await prisma.appointment.findMany({
      where: {
        doctorId,
        OR: [
          { doctorNotes:  { not: null } },
          { prescription: { not: null } },
          { status: 'COMPLETED' },
        ],
        ...(patientId ? { patientId } : {}),
      },
      orderBy: { scheduledAt: 'desc' },
      take:    parseInt(limit),
      skip:    parseInt(offset),
      include: {
        patient: {
          select: {
            firstName: true,
            lastName:  true,
            user: { select: { registrationId: true } },
          },
        },
      },
    });

    const records = rows.map((a) => {
      let drugs: any[] = [];
      try { if (a.prescription) drugs = JSON.parse(a.prescription); } catch {}
      return {
        id:           a.id,
        name:         a.reasonForVisit ?? 'Consultation Record',
        type:         'CONSULTATION',
        date:         a.scheduledAt,
        patientId:    a.patientId,
        patient:      `${a.patient.firstName} ${a.patient.lastName}`,
        regId:        a.patient.user.registrationId,
        status:       a.doctorNotes ? 'REVIEWED' : 'PENDING',
        notes:        a.doctorNotes ?? '',
        prescription: drugs,
        apptStatus:   a.status,
      };
    });

    return ok(res, { records, total: records.length });
  } catch (e) {
    console.error('getDoctorRecords', e);
    return err(res, 'Server error', 500);
  }
}

// ── PUT /doctor/records/:id ────────────────────────────────────────────────
// id = appointmentId — saves clinical notes
export async function updateRecord(req: Request, res: Response) {
  try {
    const userId   = (req as any).user?.id;
    const doctorId = await getDoctorId(userId);
    if (!doctorId) return err(res, 'Doctor profile not found', 404);

    const appt = await prisma.appointment.findFirst({ where: { id: req.params.id, doctorId } });
    if (!appt) return err(res, 'Record not found', 404);

    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data:  { doctorNotes: req.body.notes },
    });

    return ok(res, { record: { id: updated.id, notes: updated.doctorNotes, status: 'REVIEWED' } });
  } catch (e) {
    console.error('updateRecord', e);
    return err(res, 'Server error', 500);
  }
}

// ── PUT /doctor/records/:id/review ────────────────────────────────────────
export async function reviewRecord(req: Request, res: Response) {
  try {
    const userId   = (req as any).user?.id;
    const doctorId = await getDoctorId(userId);
    if (!doctorId) return err(res, 'Doctor profile not found', 404);

    const appt = await prisma.appointment.findFirst({ where: { id: req.params.id, doctorId } });
    if (!appt) return err(res, 'Record not found', 404);

    if (!appt.doctorNotes) {
      await prisma.appointment.update({
        where: { id: req.params.id },
        data:  { doctorNotes: 'Reviewed' },
      });
    }

    return ok(res, { message: 'Record marked as reviewed', recordId: req.params.id });
  } catch (e) {
    console.error('reviewRecord', e);
    return err(res, 'Server error', 500);
  }
}

// ── POST /doctor/records/upload ────────────────────────────────────────────
export async function uploadRecord(req: Request, res: Response) {
  try {
    const userId   = (req as any).user?.id;
    const doctorId = await getDoctorId(userId);
    if (!doctorId) return err(res, 'Doctor profile not found', 404);

    const { patientId, name, type = 'OTHER' } = req.body;
    const fileName = (req as any).file?.originalname ?? name ?? 'Uploaded Document';

    if (!patientId) return err(res, 'patientId is required');

    const latest = await prisma.appointment.findFirst({
      where:   { doctorId, patientId },
      orderBy: { scheduledAt: 'desc' },
    });
    if (!latest) return err(res, 'No appointment found for this patient', 404);

    const ts = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    await prisma.appointment.update({
      where: { id: latest.id },
      data:  {
        doctorNotes: `${latest.doctorNotes ?? ''}\n[UPLOAD ${ts}] ${fileName} (${type})`.trim(),
      },
    });

    return ok(res, { message: 'Document recorded', appointmentId: latest.id, fileName });
  } catch (e) {
    console.error('uploadRecord', e);
    return err(res, 'Server error', 500);
  }
}

// ── POST /doctor/patients/:id/notes ───────────────────────────────────────
export async function addPatientNote(req: Request, res: Response) {
  try {
    const userId   = (req as any).user?.id;
    const doctorId = await getDoctorId(userId);
    if (!doctorId) return err(res, 'Doctor profile not found', 404);

    const patientId = req.params.id;
    const { note }  = req.body;
    if (!note?.trim()) return err(res, 'note text is required');

    const latest = await prisma.appointment.findFirst({
      where:   { doctorId, patientId },
      orderBy: { scheduledAt: 'desc' },
    });
    if (!latest) return err(res, 'No appointment found for this patient', 404);

    const doc = await prisma.doctorProfile.findUnique({
      where:  { id: doctorId },
      select: { firstName: true, lastName: true },
    });
    const ts       = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const appended = `${latest.doctorNotes ?? ''}\n[${ts} — Dr. ${doc?.firstName} ${doc?.lastName}] ${note.trim()}`.trim();

    await prisma.appointment.update({ where: { id: latest.id }, data: { doctorNotes: appended } });

    const patient = await prisma.patientProfile.findUnique({
      where:  { id: patientId },
      select: { userId: true },
    });
    if (patient) {
      await prisma.notification.create({
        data: {
          userId: patient.userId,
          type:   'APPOINTMENT_REMINDER',
          title:  'Doctor added a clinical note',
          body:   `Dr. ${doc?.firstName} ${doc?.lastName} has added a note to your health record.`,
        },
      }).catch(() => {});
    }

    return ok(res, { message: 'Clinical note saved' });
  } catch (e) {
    console.error('addPatientNote', e);
    return err(res, 'Server error', 500);
  }
}
