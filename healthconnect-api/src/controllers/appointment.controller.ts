// src/controllers/appointment.controller.ts
// Updated:
//   - status → COMPLETED: sends review prompt email to patient
//   - status → CONFIRMED: sends appointment confirmation email to patient
import { Request, Response, NextFunction } from 'express';
import { AppointmentType }                 from '@prisma/client';
import { prisma }                          from '../lib/prisma';
import { ApiResponse }                     from '../utils/apiResponse';
import {
  sendReviewPromptEmail,
  sendAppointmentConfirmationEmail,
}                                          from '../services/email.service';

async function resolveProfile(userId: string) {
  const [patient, doctor] = await Promise.all([
    prisma.patientProfile.findUnique({ where: { userId }, select: { id: true } }),
    prisma.doctorProfile.findUnique({  where: { userId }, select: { id: true } }),
  ]);
  return { patientProfileId: patient?.id ?? null, doctorProfileId: doctor?.id ?? null };
}

async function assertOwnership(appointmentId: string, userId: string, res: Response): Promise<any | null> {
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt) { ApiResponse.notFound(res, 'Appointment not found'); return null; }
  const { patientProfileId, doctorProfileId } = await resolveProfile(userId);
  const isPatient = patientProfileId && appt.patientId === patientProfileId;
  const isDoctor  = doctorProfileId  && appt.doctorId  === doctorProfileId;
  if (!isPatient && !isDoctor) {
    ApiResponse.forbidden(res, 'ACCESS_DENIED', 'You do not have access to this appointment');
    return null;
  }
  return appt;
}

export const listAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId  = req.user!.userId;
    const patient = await prisma.patientProfile.findUnique({ where: { userId } });
    const doctor  = await prisma.doctorProfile.findUnique({  where: { userId } });
    let where: any = {};
    if (patient)     where.patientId = patient.id;
    else if (doctor) where.doctorId  = doctor.id;
    else return ApiResponse.notFound(res, 'Profile not found');

    const { status, limit = '50', page = '1' } = req.query;
    if (status) where.status = status;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where, skip, take: parseInt(limit as string),
        orderBy: { scheduledAt: 'desc' },
        include: {
          doctor:  { select: { id: true, firstName: true, lastName: true, specialization: true, profilePhotoUrl: true, clinicName: true, city: true, consultationFee: true, teleconsultFee: true, isAvailableOnline: true } },
          patient: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return ApiResponse.success(res, { appointments, total, page: parseInt(page as string), pages: Math.ceil(total / parseInt(limit as string)) });
  } catch (e) { next(e); }
};

export const bookAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId  = req.user!.userId;
    const patient = await prisma.patientProfile.findUnique({ where: { userId } });
    if (!patient) return ApiResponse.notFound(res, 'Patient profile not found');

    const { doctorId, scheduledAt, type, reasonForVisit, durationMinutes, symptoms } = req.body;
    if (!doctorId)    return res.status(400).json({ success: false, message: 'doctorId is required' });
    if (!scheduledAt) return res.status(400).json({ success: false, message: 'scheduledAt is required' });
    if (!type)        return res.status(400).json({ success: false, message: 'type is required' });

    const validTypes: AppointmentType[] = ['IN_PERSON', 'TELECONSULT', 'HOME_VISIT'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: `type must be one of: ${validTypes.join(', ')}` });
    }

    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      select: { id: true, firstName: true, lastName: true, isVerified: true, userId: true },
    });
    if (!doctor) return ApiResponse.notFound(res, 'Doctor not found');

    const slotDuration = durationMinutes ?? 30;
    const start = new Date(scheduledAt);
    const end   = new Date(start.getTime() + slotDuration * 60_000);

    const conflict = await prisma.appointment.findFirst({
      where: { doctorId, status: { in: ['PENDING', 'CONFIRMED'] }, scheduledAt: { gte: start, lt: end } },
    });
    if (conflict) return res.status(409).json({ success: false, message: 'This time slot is already booked.' });

    const appt = await prisma.appointment.create({
      data: {
        patientId: patient.id, doctorId,
        scheduledAt: start, durationMinutes: slotDuration, type,
        reasonForVisit: reasonForVisit ?? 'General consultation',
        symptoms: Array.isArray(symptoms) ? symptoms : [],
        meetingLink: type === 'TELECONSULT' ? `https://meet.jit.si/hc-${Date.now()}` : undefined,
        status: 'PENDING',
      },
      include: {
        doctor:  { select: { id: true, firstName: true, lastName: true, specialization: true, city: true, consultationFee: true } },
        patient: { select: { id: true, firstName: true, lastName: true } },
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
        doctor:  { select: { id: true, firstName: true, lastName: true, specialization: true, city: true, consultationFee: true } },
      },
    });
    return ApiResponse.success(res, full);
  } catch (e) { next(e); }
};

export const rescheduleAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scheduledAt } = req.body;
    if (!scheduledAt) return res.status(400).json({ success: false, message: 'scheduledAt is required' });
    const existing = await assertOwnership(req.params.id, req.user!.userId, res);
    if (!existing) return;
    const appt = await prisma.appointment.update({ where: { id: req.params.id }, data: { scheduledAt: new Date(scheduledAt), status: 'PENDING' } });
    const doc = await prisma.doctorProfile.findUnique({ where: { id: existing.doctorId }, select: { userId: true } });
    if (doc) {
      await prisma.notification.create({ data: { userId: doc.userId, type: 'APPOINTMENT_REMINDER', title: 'Appointment Rescheduled', body: `An appointment has been rescheduled to ${new Date(scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}.` } }).catch(() => {});
    }
    return ApiResponse.success(res, appt, 'Appointment rescheduled');
  } catch (e) { next(e); }
};

export const cancelAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await assertOwnership(req.params.id, req.user!.userId, res);
    if (!existing) return;
    const appt = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED', cancellationReason: req.body.reason ?? req.body.cancellationReason ?? 'Cancelled by user' },
    });
    const doctor  = await prisma.doctorProfile.findUnique({ where: { id: existing.doctorId  }, select: { userId: true } });
    const patient = await prisma.patientProfile.findUnique({ where: { id: existing.patientId }, select: { userId: true } });
    if (doctor)  await prisma.notification.create({ data: { userId: doctor.userId,  type: 'APPOINTMENT_REMINDER', title: 'Appointment Cancelled', body: `An appointment on ${new Date(existing.scheduledAt).toLocaleDateString('en-IN')} has been cancelled.` } }).catch(() => {});
    if (patient) await prisma.notification.create({ data: { userId: patient.userId, type: 'APPOINTMENT_REMINDER', title: 'Appointment Cancelled', body: 'Your appointment has been cancelled.' } }).catch(() => {});
    return ApiResponse.success(res, appt, 'Appointment cancelled');
  } catch (e) { next(e); }
};

export const updateAppointmentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, doctorNotes } = req.body;
    const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const existing = await assertOwnership(req.params.id, req.user!.userId, res);
    if (!existing) return;

    const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: req.user!.userId }, select: { id: true } });
    if (!doctorProfile || doctorProfile.id !== existing.doctorId) {
      return ApiResponse.forbidden(res, 'ACCESS_DENIED', 'Only the assigned doctor can update appointment status');
    }

    const data: any = { status };
    if (doctorNotes) data.doctorNotes = doctorNotes;
    const appt = await prisma.appointment.update({ where: { id: req.params.id }, data });

    // Notify patient
    const withPatient = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        patient: {
          select: {
            userId: true, firstName: true,
            user: { select: { email: true } },
          },
        },
        doctor: {
          select: {
            firstName: true, lastName: true, id: true,
            clinicName: true, city: true,
          },
        },
      },
    });

    if (withPatient?.patient) {
      const msgs: Record<string, string> = {
        CONFIRMED: 'Your appointment has been confirmed by the doctor! ✅',
        COMPLETED: 'Your appointment has been marked as completed.',
        CANCELLED: 'Your appointment has been cancelled by the doctor.',
        NO_SHOW:   'You were marked as no-show for your appointment.',
      };
      if (msgs[status]) {
        await prisma.notification.create({
          data: { userId: withPatient.patient.userId, type: 'APPOINTMENT_REMINDER', title: `Appointment ${status.charAt(0) + status.slice(1).toLowerCase()}`, body: msgs[status] },
        }).catch(() => {});
      }

      // ── Send confirmation email when appointment is CONFIRMED ────────────
      if (status === 'CONFIRMED' && withPatient.patient.user?.email && withPatient.doctor) {
        const doctorName = `Dr. ${withPatient.doctor.firstName} ${withPatient.doctor.lastName}`;
        const apptDate   = new Date(existing.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        const apptTime   = new Date(existing.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

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
        ).catch(() => {}); // fire-and-forget
      }

      // ── Send review prompt email when appointment is COMPLETED ────────
      if (status === 'COMPLETED' && withPatient.patient.user?.email && withPatient.doctor) {
        const doctorName  = `Dr. ${withPatient.doctor.firstName} ${withPatient.doctor.lastName}`;
        const apptDate    = new Date(existing.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

        sendReviewPromptEmail(
          withPatient.patient.user.email,
          withPatient.patient.firstName,
          doctorName,
          withPatient.doctor.id,
          apptDate,
        ).catch(() => {}); // fire-and-forget
      }
    }

    return ApiResponse.success(res, appt);
  } catch (e) { next(e); }
};
