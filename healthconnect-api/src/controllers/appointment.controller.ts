import { Request, Response, NextFunction } from 'express';
import { AppointmentType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiResponse } from '../utils/apiResponse';
import {
  sendReviewPromptEmail,
  sendAppointmentConfirmationEmail,
} from '../services/email.service';

const TERMINAL_STATUSES = new Set(['COMPLETED', 'CANCELLED', 'NO_SHOW']);

async function resolveProfile(userId: string) {
  const [patient, doctor] = await Promise.all([
    prisma.patientProfile.findUnique({ where: { userId }, select: { id: true } }),
    prisma.doctorProfile.findUnique({ where: { userId }, select: { id: true } }),
  ]);
  return { patientProfileId: patient?.id ?? null, doctorProfileId: doctor?.id ?? null };
}

async function assertOwnership(appointmentId: string, userId: string, res: Response): Promise<any | null> {
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt) { ApiResponse.notFound(res, 'Appointment not found'); return null; }
  const { patientProfileId, doctorProfileId } = await resolveProfile(userId);
  const isPatient = patientProfileId && appt.patientId === patientProfileId;
  const isDoctor = doctorProfileId && appt.doctorId === doctorProfileId;
  if (!isPatient && !isDoctor) {
    ApiResponse.forbidden(res, 'ACCESS_DENIED', 'You do not have access to this appointment');
    return null;
  }
  return appt;
}

async function hasDoctorConflict(
  doctorId: string,
  start: Date,
  durationMinutes: number,
  excludeAppointmentId?: string,
) {
  const requestedEnd = new Date(start.getTime() + durationMinutes * 60_000);
  const earliestPossibleOverlap = new Date(start.getTime() - 120 * 60_000);

  const candidates = await prisma.appointment.findMany({
    where: {
      doctorId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      scheduledAt: { gte: earliestPossibleOverlap, lt: requestedEnd },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
    },
    select: { id: true, scheduledAt: true, durationMinutes: true },
  });

  return candidates.some(existing => {
    const existingStart = existing.scheduledAt.getTime();
    const existingEnd = existingStart + (existing.durationMinutes || 30) * 60_000;
    return existingStart < requestedEnd.getTime() && existingEnd > start.getTime();
  });
}

export const listAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const patient = await prisma.patientProfile.findUnique({ where: { userId } });
    const doctor = await prisma.doctorProfile.findUnique({ where: { userId } });
    const where: any = {};
    if (patient) where.patientId = patient.id;
    else if (doctor) where.doctorId = doctor.id;
    else return ApiResponse.notFound(res, 'Profile not found');

    const { status, limit = '50', page = '1' } = req.query;
    if (status) where.status = status;
    const pageNum = Math.max(1, Number.parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { scheduledAt: 'desc' },
        include: {
          doctor: { select: { id: true, firstName: true, lastName: true, specialization: true, profilePhotoUrl: true, clinicName: true, city: true, consultationFee: true, teleconsultFee: true, isAvailableOnline: true } },
          patient: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
          hospital: { select: { id: true, name: true, city: true } },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return ApiResponse.success(res, { appointments, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (e) { next(e); }
};

export const bookAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const patient = await prisma.patientProfile.findUnique({ where: { userId } });
    if (!patient) return ApiResponse.notFound(res, 'Patient profile not found');

    const { doctorId, hospitalId, scheduledAt, type, reasonForVisit, durationMinutes, symptoms } = req.body;
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      select: { id: true, firstName: true, lastName: true, userId: true },
    });
    if (!doctor) return ApiResponse.notFound(res, 'Doctor not found');

    if (hospitalId) {
      const hospital = await prisma.hospitalProfile.findUnique({ where: { id: hospitalId }, select: { id: true } });
      if (!hospital) return ApiResponse.notFound(res, 'Hospital not found');
    }

    const slotDuration = durationMinutes ?? 30;
    const start = new Date(scheduledAt);
    if (await hasDoctorConflict(doctorId, start, slotDuration)) {
      return res.status(409).json({ success: false, message: 'This time overlaps another appointment. Please choose a different slot.' });
    }

    const appt = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        hospitalId,
        scheduledAt: start,
        durationMinutes: slotDuration,
        type: type as AppointmentType,
        reasonForVisit: reasonForVisit ?? 'General consultation',
        symptoms: Array.isArray(symptoms) ? symptoms : [],
        meetingLink: type === 'TELECONSULT' ? `https://meet.jit.si/hc-${Date.now()}` : undefined,
        status: 'PENDING',
      },
      include: {
        doctor: { select: { id: true, firstName: true, lastName: true, specialization: true, city: true, consultationFee: true } },
        patient: { select: { id: true, firstName: true, lastName: true } },
        hospital: { select: { id: true, name: true, city: true } },
      },
    });

    await prisma.notification.create({
      data: { userId: doctor.userId, type: 'APPOINTMENT_REMINDER', title: 'New Appointment Request', body: `${patient.firstName} ${patient.lastName} has booked an appointment on ${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}.` },
    }).catch(() => {});

    await prisma.notification.create({
      data: { userId, type: 'APPOINTMENT_REMINDER', title: 'Appointment Booked', body: `Your appointment with Dr. ${doctor.firstName} ${doctor.lastName} is pending confirmation.` },
    }).catch(() => {});

    return ApiResponse.created(res, appt, 'Appointment booked successfully');
  } catch (e) { next(e); }
};

export const getAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appt = await assertOwnership(req.params.id, req.user!.userId, res);
    if (!appt) return;
    const full = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
        doctor: { select: { id: true, firstName: true, lastName: true, specialization: true, city: true, consultationFee: true } },
        hospital: { select: { id: true, name: true, city: true } },
      },
    });
    return ApiResponse.success(res, full);
  } catch (e) { next(e); }
};

export const rescheduleAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await assertOwnership(req.params.id, req.user!.userId, res);
    if (!existing) return;
    if (TERMINAL_STATUSES.has(existing.status)) {
      return res.status(409).json({ success: false, message: `A ${existing.status.toLowerCase()} appointment cannot be rescheduled.` });
    }

    const start = new Date(req.body.scheduledAt);
    const durationMinutes = existing.durationMinutes ?? 30;
    if (await hasDoctorConflict(existing.doctorId, start, durationMinutes, existing.id)) {
      return res.status(409).json({ success: false, message: 'This time overlaps another appointment. Please choose a different slot.' });
    }

    const appt = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { scheduledAt: start, status: 'PENDING' },
    });

    const [doctor, patient] = await Promise.all([
      prisma.doctorProfile.findUnique({ where: { id: existing.doctorId }, select: { id: true, userId: true } }),
      prisma.patientProfile.findUnique({ where: { id: existing.patientId }, select: { id: true, userId: true } }),
    ]);
    const actor = await resolveProfile(req.user!.userId);
    const recipientUserId = actor.patientProfileId === existing.patientId ? doctor?.userId : patient?.userId;
    if (recipientUserId && recipientUserId !== req.user!.userId) {
      await prisma.notification.create({
        data: { userId: recipientUserId, type: 'APPOINTMENT_REMINDER', title: 'Appointment Rescheduled', body: `The appointment has been rescheduled to ${start.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}. Confirmation is required.` },
      }).catch(() => {});
    }

    return ApiResponse.success(res, appt, 'Appointment rescheduled');
  } catch (e) { next(e); }
};

export const cancelAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await assertOwnership(req.params.id, req.user!.userId, res);
    if (!existing) return;
    if (TERMINAL_STATUSES.has(existing.status)) {
      return res.status(409).json({ success: false, message: `A ${existing.status.toLowerCase()} appointment cannot be cancelled.` });
    }

    const actor = await resolveProfile(req.user!.userId);
    const cancelledBy = actor.patientProfileId === existing.patientId ? 'PATIENT' : 'DOCTOR';
    const appt = await prisma.appointment.update({
      where: { id: req.params.id },
      data: {
        status: 'CANCELLED',
        cancelledBy,
        cancellationReason: req.body.reason ?? req.body.cancellationReason ?? 'Cancelled by user',
      },
    });

    const [doctor, patient] = await Promise.all([
      prisma.doctorProfile.findUnique({ where: { id: existing.doctorId }, select: { userId: true } }),
      prisma.patientProfile.findUnique({ where: { id: existing.patientId }, select: { userId: true } }),
    ]);
    const recipientUserId = cancelledBy === 'PATIENT' ? doctor?.userId : patient?.userId;
    if (recipientUserId) {
      await prisma.notification.create({
        data: { userId: recipientUserId, type: 'APPOINTMENT_REMINDER', title: 'Appointment Cancelled', body: `The appointment on ${new Date(existing.scheduledAt).toLocaleDateString('en-IN')} has been cancelled.` },
      }).catch(() => {});
    }

    return ApiResponse.success(res, appt, 'Appointment cancelled');
  } catch (e) { next(e); }
};

export const updateAppointmentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, doctorNotes, followUpDate } = req.body;
    const existing = await assertOwnership(req.params.id, req.user!.userId, res);
    if (!existing) return;

    const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: req.user!.userId }, select: { id: true } });
    if (!doctorProfile || doctorProfile.id !== existing.doctorId) {
      return ApiResponse.forbidden(res, 'ACCESS_DENIED', 'Only the assigned doctor can update appointment status');
    }

    if (TERMINAL_STATUSES.has(existing.status) && existing.status !== status) {
      return res.status(409).json({ success: false, message: `A ${existing.status.toLowerCase()} appointment cannot change status.` });
    }

    const data: any = { status };
    if (doctorNotes !== undefined) data.doctorNotes = doctorNotes;
    if (followUpDate !== undefined) data.followUpDate = new Date(followUpDate);
    const appt = await prisma.appointment.update({ where: { id: req.params.id }, data });

    const withPatient = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        patient: {
          select: {
            userId: true,
            firstName: true,
            user: { select: { email: true } },
          },
        },
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            id: true,
            clinicName: true,
            city: true,
          },
        },
      },
    });

    if (withPatient?.patient) {
      const msgs: Record<string, string> = {
        CONFIRMED: 'Your appointment has been confirmed by the doctor! ✅',
        COMPLETED: 'Your appointment has been marked as completed.',
        CANCELLED: 'Your appointment has been cancelled by the doctor.',
        NO_SHOW: 'You were marked as no-show for your appointment.',
      };
      if (msgs[status]) {
        await prisma.notification.create({
          data: { userId: withPatient.patient.userId, type: 'APPOINTMENT_REMINDER', title: `Appointment ${status.charAt(0) + status.slice(1).toLowerCase()}`, body: msgs[status] },
        }).catch(() => {});
      }

      if (status === 'CONFIRMED' && withPatient.patient.user?.email && withPatient.doctor) {
        const doctorName = `Dr. ${withPatient.doctor.firstName} ${withPatient.doctor.lastName}`;
        const apptDate = new Date(existing.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        const apptTime = new Date(existing.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

        sendAppointmentConfirmationEmail(
          withPatient.patient.user.email,
          withPatient.patient.firstName,
          doctorName,
          apptDate,
          apptTime,
          existing.type,
          existing.meetingLink ?? undefined,
          withPatient.doctor.clinicName ?? undefined,
          withPatient.doctor.city ?? undefined,
        ).catch(() => {});
      }

      if (status === 'COMPLETED' && withPatient.patient.user?.email && withPatient.doctor) {
        const doctorName = `Dr. ${withPatient.doctor.firstName} ${withPatient.doctor.lastName}`;
        const apptDate = new Date(existing.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

        sendReviewPromptEmail(
          withPatient.patient.user.email,
          withPatient.patient.firstName,
          doctorName,
          withPatient.doctor.id,
          apptDate,
        ).catch(() => {});
      }
    }

    return ApiResponse.success(res, appt);
  } catch (e) { next(e); }
};
