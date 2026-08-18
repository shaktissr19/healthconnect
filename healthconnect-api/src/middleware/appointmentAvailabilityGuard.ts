import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { checkDoctorAvailability } from '../modules/doctor/availability.service';

export async function enforceDoctorAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    let doctorId: string | undefined;
    let scheduledAt: Date | undefined;
    let durationMinutes = 30;
    let appointmentType: string | undefined;

    // This middleware is mounted only on appointment booking and rescheduling
    // routes. POST is a new booking; PUT/PATCH are an existing appointment.
    if (req.method === 'POST') {
      doctorId = req.body.doctorId;
      scheduledAt = req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined;
      durationMinutes = req.body.durationMinutes ?? 30;
      appointmentType = req.body.type;
    } else if (req.params.id && req.body.scheduledAt) {
      const existing = await prisma.appointment.findUnique({
        where: { id: req.params.id },
        select: { doctorId: true, durationMinutes: true, type: true },
      });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }
      doctorId = existing.doctorId;
      scheduledAt = new Date(req.body.scheduledAt);
      durationMinutes = existing.durationMinutes || 30;
      appointmentType = existing.type;
    }

    if (!doctorId || !scheduledAt || Number.isNaN(scheduledAt.getTime())) {
      return res.status(400).json({ success: false, message: 'Doctor and appointment time are required.' });
    }

    const availability = await checkDoctorAvailability({
      doctorId,
      scheduledAt,
      durationMinutes,
      appointmentType,
    });

    if (!availability.exists) {
      return res.status(404).json({ success: false, message: availability.reason ?? 'Doctor not found.' });
    }
    if (!availability.available) {
      return res.status(409).json({
        success: false,
        code: 'DOCTOR_NOT_AVAILABLE',
        message: availability.reason ?? 'Doctor is not available at the selected time.',
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
}
