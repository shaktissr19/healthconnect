import { Router } from 'express';
import * as hospitalController from '../controllers/hospital.controller';
import { authenticate } from '../middleware/auth';
import { requireHospital } from '../middleware/roleGuard';
import { validate } from '../middleware/validate';
import {
  hospitalDepartmentCreateSchema,
  hospitalDepartmentUpdateSchema,
  hospitalDoctorInviteSchema,
  hospitalProfileUpdateSchema,
} from '../validators/hospital.validator';

const router = Router();
const hospitalOnly = [authenticate, requireHospital] as const;

// Public hospital discovery. Static paths must precede /:id.
router.get('/', hospitalController.searchHospitals);
router.get('/featured', hospitalController.getFeaturedHospitals);
router.get('/nearest', hospitalController.getNearestHospitals);

// Hospital portal. Keep these before public /:id so /hospitals/doctors is not
// accidentally interpreted as a public hospital id named "doctors".
router.get('/dashboard', ...hospitalOnly, hospitalController.getDashboard);
router.get('/profile/me', ...hospitalOnly, hospitalController.getMyProfile);
router.put('/profile/me', ...hospitalOnly, validate(hospitalProfileUpdateSchema), hospitalController.updateMyProfile);

router.get('/doctors', ...hospitalOnly, hospitalController.getMyDoctors);
router.post('/doctors/invite', ...hospitalOnly, validate(hospitalDoctorInviteSchema), hospitalController.inviteDoctor);
router.delete('/doctors/:doctorId', ...hospitalOnly, hospitalController.removeDoctor);

router.get('/departments', ...hospitalOnly, hospitalController.getMyDepartments);
router.post('/departments', ...hospitalOnly, validate(hospitalDepartmentCreateSchema), hospitalController.createDepartment);
router.put('/departments/:id', ...hospitalOnly, validate(hospitalDepartmentUpdateSchema), hospitalController.updateDepartment);
router.delete('/departments/:id', ...hospitalOnly, hospitalController.deleteDepartment);

router.get('/appointments', ...hospitalOnly, hospitalController.getMyAppointments);

// Public detail paths.
router.get('/:id/doctors', hospitalController.getHospitalDoctors);
router.get('/:id/departments', hospitalController.getHospitalDepartments);
router.get('/:id', hospitalController.getHospitalProfile);

export default router;
