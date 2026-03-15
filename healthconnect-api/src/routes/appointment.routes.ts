import { Router } from 'express';
import * as appointmentController from '../controllers/appointment.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  bookAppointmentSchema,
  rescheduleAppointmentSchema,
  cancelAppointmentSchema,
  updateAppointmentStatusSchema,
} from '../validators/appointment.validator';

const router = Router();

router.use(authenticate);

// ── Patient: list own appointments ─────────────────────────────────────────
router.get('/', appointmentController.listAppointments);

// ── Book ───────────────────────────────────────────────────────────────────
router.post('/', validate(bookAppointmentSchema), appointmentController.bookAppointment);

// ── Single appointment ─────────────────────────────────────────────────────
router.get('/:id', appointmentController.getAppointment);

// ── Reschedule / Cancel / Status ───────────────────────────────────────────
router.put('/:id/reschedule', validate(rescheduleAppointmentSchema), appointmentController.rescheduleAppointment);
router.put('/:id/cancel',    validate(cancelAppointmentSchema),    appointmentController.cancelAppointment);
router.put('/:id/status',    validate(updateAppointmentStatusSchema), appointmentController.updateAppointmentStatus);

// Alias PATCH → PUT for cancel/reschedule (frontend may use either)
router.patch('/:id/cancel',    validate(cancelAppointmentSchema),    appointmentController.cancelAppointment);
router.patch('/:id/reschedule', validate(rescheduleAppointmentSchema), appointmentController.rescheduleAppointment);

export default router;
