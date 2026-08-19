import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'RESCHEDULED', 'CHECKED_IN', 'IN_PROGRESS'] as const;

async function resolveRequest(req: Request) {
  if (req.method === 'POST') {
    return {
      doctorId: req.body.doctorId as string | undefined,
      hospitalId: req.body.hospitalId as string | undefined,
      scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined,
      durationMinutes: Number(req.body.durationMinutes ?? 30),
      excludeId: undefined as string | undefined,
    };
  }
  if (req.params.id && req.body.scheduledAt) {
    const existing = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      select: { id: true, doctorId: true, hospitalId: true, durationMinutes: true },
    });
    if (!existing) return null;
    return {
      doctorId: existing.doctorId,
      hospitalId: existing.hospitalId ?? undefined,
      scheduledAt: new Date(req.body.scheduledAt),
      durationMinutes: existing.durationMinutes || 30,
      excludeId: existing.id,
    };
  }
  return null;
}

async function resolveExistingAppointment(id: string | undefined) {
  if (!id) return null;
  return prisma.appointment.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      hospitalId: true,
      patient: { select: { userId: true, firstName: true } },
      doctor: { select: { firstName: true, lastName: true } },
      hospital: { select: { id: true, userId: true, name: true } },
    },
  });
}

function appointmentIdFromResponse(body: any, fallback?: string) {
  return body?.data?.id ?? body?.data?.data?.id ?? body?.id ?? fallback;
}

function wrapJsonAfterSuccess(res: Response, effect: (body: any) => void) {
  const originalJson = res.json.bind(res);
  let fired = false;
  res.json = ((body: any) => {
    if (!fired && res.statusCode >= 200 && res.statusCode < 300) {
      fired = true;
      try { effect(body); } catch { /* notification side-effects must never break the response */ }
    }
    return originalJson(body);
  }) as Response['json'];
}

export async function enforceActiveAppointmentConflict(req: Request, res: Response, next: NextFunction) {
  try {
    const target = await resolveRequest(req);
    if (!target) return next();
    if (!target.doctorId || !target.scheduledAt || Number.isNaN(target.scheduledAt.getTime())) return next();

    const requestedEnd = new Date(target.scheduledAt.getTime() + target.durationMinutes * 60_000);
    const candidates = await prisma.appointment.findMany({
      where: {
        doctorId: target.doctorId,
        status: { in: [...ACTIVE_STATUSES] },
        scheduledAt: { gte: new Date(target.scheduledAt.getTime() - 120 * 60_000), lt: requestedEnd },
        ...(target.excludeId ? { id: { not: target.excludeId } } : {}),
      },
      select: { scheduledAt: true, durationMinutes: true },
    });

    const conflict = candidates.some(existing => {
      const existingStart = existing.scheduledAt.getTime();
      const existingEnd = existingStart + (existing.durationMinutes || 30) * 60_000;
      return existingStart < requestedEnd.getTime() && existingEnd > target.scheduledAt!.getTime();
    });
    if (conflict) {
      return res.status(409).json({ success: false, message: 'This time overlaps another active appointment. Please choose a different slot.' });
    }
    return next();
  } catch (error) { next(error); }
}

export async function notifyLinkedHospitalAfterSuccess(req: Request, res: Response, next: NextFunction) {
  try {
    const target = await resolveRequest(req);
    if (!target?.hospitalId) return next();
    const hospital = await prisma.hospitalProfile.findUnique({
      where: { id: target.hospitalId },
      select: { id: true, userId: true, name: true },
    });
    if (!hospital) return next();

    wrapJsonAfterSuccess(res, body => {
      const isBooking = req.method === 'POST';
      const appointmentId = appointmentIdFromResponse(body, target.excludeId);
      void prisma.notification.create({
        data: {
          userId: hospital.userId,
          type: 'APPOINTMENT_REMINDER',
          title: isBooking ? 'New Hospital Appointment' : 'Hospital Appointment Rescheduled',
          body: isBooking
            ? `A new appointment has been requested at ${hospital.name}. Open Hospital Appointments to review it.`
            : `An appointment at ${hospital.name} has been rescheduled. Open Hospital Appointments to review the updated time.`,
          data: { hospitalId: hospital.id, appointmentId },
        },
      }).catch(() => undefined);
    });
    return next();
  } catch (error) { next(error); }
}

/**
 * Keeps the institution synchronized when the Patient or Doctor mutates a
 * hospital-linked appointment through the shared /appointments API.
 */
export async function notifyLinkedHospitalOnMutationAfterSuccess(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await resolveExistingAppointment(req.params.id);
    if (!existing?.hospital) return next();

    wrapJsonAfterSuccess(res, body => {
      const nextStatus = String(req.body?.status ?? (req.path.includes('cancel') ? 'CANCELLED' : existing.status));
      const appointmentId = appointmentIdFromResponse(body, existing.id);
      void prisma.notification.create({
        data: {
          userId: existing.hospital!.userId,
          type: 'APPOINTMENT_REMINDER',
          title: `Hospital appointment ${nextStatus.replace(/_/g, ' ').toLowerCase()}`,
          body: `The appointment for ${existing.patient.firstName} with Dr. ${existing.doctor.firstName} ${existing.doctor.lastName} is now ${nextStatus.replace(/_/g, ' ').toLowerCase()}.`,
          data: { hospitalId: existing.hospital!.id, appointmentId, status: nextStatus },
        },
      }).catch(() => undefined);
    });
    return next();
  } catch (error) { next(error); }
}

/**
 * A completed hospital-linked visit should explicitly close the review loop.
 * This middleware is reusable for either Doctor or Hospital completion paths.
 */
export async function promptHospitalReviewAfterSuccess(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await resolveExistingAppointment(req.params.id);
    if (!existing?.hospital || existing.status === 'COMPLETED' || req.body?.status !== 'COMPLETED') return next();

    wrapJsonAfterSuccess(res, body => {
      const appointmentId = appointmentIdFromResponse(body, existing.id);
      void prisma.notification.create({
        data: {
          userId: existing.patient.userId,
          type: 'SYSTEM',
          title: 'How was your hospital visit?',
          body: `Your visit at ${existing.hospital!.name} is complete. Share a verified review to help other patients.`,
          data: { hospitalId: existing.hospital!.id, appointmentId, href: `/hospitals/${existing.hospital!.id}` },
        },
      }).catch(() => undefined);
    });
    return next();
  } catch (error) { next(error); }
}
