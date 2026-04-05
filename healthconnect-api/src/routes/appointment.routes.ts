// src/routes/appointment.routes.ts
import { Router } from 'express';
import * as appointmentController from '../controllers/appointment.controller';
import { authenticate }           from '../middleware/auth';
import { requireDoctor }          from '../middleware/roleGuard';
import { validate }               from '../middleware/validate';
import {
  bookAppointmentSchema,
  rescheduleAppointmentSchema,
  cancelAppointmentSchema,
  updateAppointmentStatusSchema,
} from '../validators/appointment.validator';

const router = Router();

router.use(authenticate);

// Patient: list own appointments
router.get('/', appointmentController.listAppointments);

// Book
router.post('/', validate(bookAppointmentSchema), appointmentController.bookAppointment);

// Single appointment — patient or doctor who owns it
router.get('/:id', appointmentController.getAppointment);

// Reschedule / Cancel — patient or doctor who owns it
router.put('/:id/reschedule',  validate(rescheduleAppointmentSchema), appointmentController.rescheduleAppointment);
router.put('/:id/cancel',      validate(cancelAppointmentSchema),     appointmentController.cancelAppointment);

// ── FIX: Status update is doctor-only ─────────────────────────────────────────
// Previously any authenticated user could confirm/complete/no-show any appointment.
router.put('/:id/status', requireDoctor, validate(updateAppointmentStatusSchema), appointmentController.updateAppointmentStatus);

// PATCH aliases — frontend may use either method
router.patch('/:id/cancel',    validate(cancelAppointmentSchema),     appointmentController.cancelAppointment);
router.patch('/:id/reschedule', validate(rescheduleAppointmentSchema), appointmentController.rescheduleAppointment);

export default router;
