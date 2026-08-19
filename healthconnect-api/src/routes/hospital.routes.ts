import { Router } from 'express';
import * as hospitalController from '../controllers/hospital.controller';
import { authenticate } from '../middleware/auth';
import { requireHospital, requireRole } from '../middleware/roleGuard';
import { validate } from '../middleware/validate';
import {
  hospitalAppointmentRescheduleSchema,
  hospitalAppointmentStatusSchema,
  hospitalDepartmentCreateSchema,
  hospitalDepartmentUpdateSchema,
  hospitalDoctorAvailabilitySchema,
  hospitalDoctorInviteSchema,
  hospitalProfileUpdateSchema,
  hospitalReviewSchema,
  hospitalVerificationSubmitSchema,
} from '../validators/hospital.validator';

const router = Router();

// Public discovery — verified, active hospitals only.
router.get('/', hospitalController.searchHospitals);
router.get('/featured', hospitalController.getFeaturedHospitals);
router.get('/nearest', hospitalController.getNearestHospitals);

// Hospital portal routes must remain before /:id.
router.get('/dashboard', authenticate, requireHospital, hospitalController.getDashboard);
router.get('/analytics', authenticate, requireHospital, hospitalController.getAnalytics);
router.get('/profile/me', authenticate, requireHospital, hospitalController.getMyProfile);
router.put('/profile/me', authenticate, requireHospital, validate(hospitalProfileUpdateSchema), hospitalController.updateMyProfile);
router.get('/verification', authenticate, requireHospital, hospitalController.getVerification);
router.post('/verification/submit', authenticate, requireHospital, validate(hospitalVerificationSubmitSchema), hospitalController.submitVerification);

router.get('/doctors', authenticate, requireHospital, hospitalController.getMyDoctors);
router.post('/doctors/invite', authenticate, requireHospital, validate(hospitalDoctorInviteSchema), hospitalController.inviteDoctor);
router.delete('/doctors/:doctorId', authenticate, requireHospital, hospitalController.removeDoctor);
router.get('/doctors/:doctorId/availability', authenticate, requireHospital, hospitalController.getMyDoctorAvailability);
router.put('/doctors/:doctorId/availability', authenticate, requireHospital, validate(hospitalDoctorAvailabilitySchema), hospitalController.updateMyDoctorAvailability);

router.get('/departments', authenticate, requireHospital, hospitalController.getMyDepartments);
router.post('/departments', authenticate, requireHospital, validate(hospitalDepartmentCreateSchema), hospitalController.createDepartment);
router.put('/departments/:id', authenticate, requireHospital, validate(hospitalDepartmentUpdateSchema), hospitalController.updateDepartment);
router.delete('/departments/:id', authenticate, requireHospital, hospitalController.deleteDepartment);

router.get('/appointments', authenticate, requireHospital, hospitalController.getMyAppointments);
router.patch('/appointments/:id/status', authenticate, requireHospital, validate(hospitalAppointmentStatusSchema), hospitalController.updateHospitalAppointmentStatus);
router.put('/appointments/:id/reschedule', authenticate, requireHospital, validate(hospitalAppointmentRescheduleSchema), hospitalController.rescheduleHospitalAppointment);

// Public hospital details and booking support.
router.get('/:id/doctors/:doctorId/availability', hospitalController.getPublicDoctorAvailability);
router.get('/:id/doctors', hospitalController.getHospitalDoctors);
router.get('/:id/departments', hospitalController.getHospitalDepartments);
router.get('/:id/reviews', hospitalController.getHospitalReviews);
router.post('/:id/reviews', authenticate, requireRole('PATIENT'), validate(hospitalReviewSchema), hospitalController.submitHospitalReview);
router.get('/:id', hospitalController.getHospitalProfile);

export default router;
