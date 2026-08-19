// src/routes/appointment.routes.ts
import { Router } from 'express';
import * as appointmentController from '../controllers/appointment.controller';
import { authenticate } from '../middleware/auth';
import { requireDoctor } from '../middleware/roleGuard';
import { validate } from '../middleware/validate';
import { enforceDoctorAvailability } from '../middleware/appointmentAvailabilityGuard';
import {
  enforceActiveAppointmentConflict,
  notifyLinkedHospitalAfterSuccess,
  notifyLinkedHospitalOnMutationAfterSuccess,
  promptHospitalReviewAfterSuccess,
} from '../middleware/appointmentOperationalGuard';
import {
  bookAppointmentSchema,
  rescheduleAppointmentSchema,
  cancelAppointmentSchema,
  updateAppointmentStatusSchema,
} from '../validators/appointment.validator';

const router = Router();
router.use(authenticate);

router.get('/', appointmentController.listAppointments);

router.post(
  '/',
  validate(bookAppointmentSchema),
  enforceDoctorAvailability,
  enforceActiveAppointmentConflict,
  notifyLinkedHospitalAfterSuccess,
  appointmentController.bookAppointment,
);

router.get('/:id', appointmentController.getAppointment);

router.put(
  '/:id/reschedule',
  validate(rescheduleAppointmentSchema),
  enforceDoctorAvailability,
  enforceActiveAppointmentConflict,
  notifyLinkedHospitalAfterSuccess,
  appointmentController.rescheduleAppointment,
);
router.put(
  '/:id/cancel',
  validate(cancelAppointmentSchema),
  notifyLinkedHospitalOnMutationAfterSuccess,
  appointmentController.cancelAppointment,
);

router.put(
  '/:id/status',
  requireDoctor,
  validate(updateAppointmentStatusSchema),
  notifyLinkedHospitalOnMutationAfterSuccess,
  promptHospitalReviewAfterSuccess,
  appointmentController.updateAppointmentStatus,
);

router.patch(
  '/:id/cancel',
  validate(cancelAppointmentSchema),
  notifyLinkedHospitalOnMutationAfterSuccess,
  appointmentController.cancelAppointment,
);
router.patch(
  '/:id/reschedule',
  validate(rescheduleAppointmentSchema),
  enforceDoctorAvailability,
  enforceActiveAppointmentConflict,
  notifyLinkedHospitalAfterSuccess,
  appointmentController.rescheduleAppointment,
);

export default router;
