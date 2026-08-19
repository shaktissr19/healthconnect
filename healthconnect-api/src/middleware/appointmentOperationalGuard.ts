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

    const originalJson = res.json.bind(res);
    let notified = false;
    res.json = ((body: any) => {
      if (!notified && res.statusCode >= 200 && res.statusCode < 300) {
        notified = true;
        const isBooking = req.method === 'POST';
        void prisma.notification.create({
          data: {
            userId: hospital.userId,
            type: 'APPOINTMENT_REMINDER',
            title: isBooking ? 'New Hospital Appointment' : 'Hospital Appointment Rescheduled',
            body: isBooking
              ? `A new appointment has been requested at ${hospital.name}. Open Hospital Appointments to review it.`
              : `An appointment at ${hospital.name} has been rescheduled. Open Hospital Appointments to review the updated time.`,
            data: { hospitalId: hospital.id },
          },
        }).catch(() => undefined);
      }
      return originalJson(body);
    }) as Response['json'];
    return next();
  } catch (error) { next(error); }
}
