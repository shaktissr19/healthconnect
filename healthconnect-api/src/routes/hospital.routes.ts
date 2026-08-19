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

// Public hospital discovery. Static paths must precede /:id.
router.get('/', hospitalController.searchHospitals);
router.get('/featured', hospitalController.getFeaturedHospitals);
router.get('/nearest', hospitalController.getNearestHospitals);

// Hospital portal. Keep these before public /:id so /hospitals/doctors is not
// accidentally interpreted as a public hospital id named "doctors".
router.get('/dashboard', authenticate, requireHospital, hospitalController.getDashboard);
router.get('/profile/me', authenticate, requireHospital, hospitalController.getMyProfile);
router.put('/profile/me', authenticate, requireHospital, validate(hospitalProfileUpdateSchema), hospitalController.updateMyProfile);

router.get('/doctors', authenticate, requireHospital, hospitalController.getMyDoctors);
router.post('/doctors/invite', authenticate, requireHospital, validate(hospitalDoctorInviteSchema), hospitalController.inviteDoctor);
router.delete('/doctors/:doctorId', authenticate, requireHospital, hospitalController.removeDoctor);

router.get('/departments', authenticate, requireHospital, hospitalController.getMyDepartments);
router.post('/departments', authenticate, requireHospital, validate(hospitalDepartmentCreateSchema), hospitalController.createDepartment);
router.put('/departments/:id', authenticate, requireHospital, validate(hospitalDepartmentUpdateSchema), hospitalController.updateDepartment);
router.delete('/departments/:id', authenticate, requireHospital, hospitalController.deleteDepartment);

router.get('/appointments', authenticate, requireHospital, hospitalController.getMyAppointments);

// Public detail paths.
router.get('/:id/doctors', hospitalController.getHospitalDoctors);
router.get('/:id/departments', hospitalController.getHospitalDepartments);
router.get('/:id', hospitalController.getHospitalProfile);

export default router;
