import { Router } from 'express';
import * as hospitalController from '../controllers/hospital.controller';
import { authenticate } from '../middleware/auth';
import { requireHospital } from '../middleware/roleGuard';

const router = Router();

// Public routes (hospital discovery)
router.get('/', hospitalController.searchHospitals);
router.get('/featured', hospitalController.getFeaturedHospitals);
router.get('/nearest', hospitalController.getNearestHospitals);
router.get('/:id', hospitalController.getHospitalProfile);
router.get('/:id/doctors', hospitalController.getHospitalDoctors);
router.get('/:id/departments', hospitalController.getHospitalDepartments);

// Protected routes (hospital dashboard)
router.use(authenticate);
router.use(requireHospital);

router.get('/profile/me', hospitalController.getMyProfile);
router.put('/profile/me', hospitalController.updateMyProfile);
router.get('/doctors', hospitalController.getMyDoctors);
router.post('/doctors/invite', hospitalController.inviteDoctor);
router.delete('/doctors/:doctorId', hospitalController.removeDoctor);

export default router;
