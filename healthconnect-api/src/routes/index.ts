import { Router } from 'express';
import authRoutes         from './auth.routes';
import patientRoutes      from './patient.routes';
import hospitalRoutes     from './hospital.routes';
import appointmentRoutes  from './appointment.routes';
import communityRoutes    from './community.routes';
import articleRoutes      from './article.routes';
import subscriptionRoutes from './subscription.routes';
import publicRoutes       from './public.routes';
import platformRoutes     from './platform.routes';
import adminRoutes        from './admin.routes';
import doctorDashRoutes   from './doctor.routes';
import doctorProfileRoutes from '../modules/doctor/profile.routes';
import doctorAvailabilityRoutes from '../modules/doctor/availability.routes';
import publicDoctorAvailabilityRoutes from '../modules/doctor/availability.public.routes';
import patientPrescriptionRoutes from '../modules/doctor/patient-prescriptions.routes';
import notificationRoutes from './notification.routes';

const router = Router();

router.use('/auth',         authRoutes);
router.use('/',             patientRoutes);
router.use('/hospitals',    hospitalRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/communities',  communityRoutes);
router.use('/articles',     articleRoutes);
router.use('/subscription', subscriptionRoutes);
// Canonical doctor availability must precede the older public router endpoint.
router.use('/public',       publicDoctorAvailabilityRoutes);
router.use('/public',       publicRoutes);
router.use('/platform',     platformRoutes);
router.use('/admin',        adminRoutes);
// Canonical Doctor v2 modules precede the legacy Doctor router.
router.use('/doctor',       doctorProfileRoutes);
router.use('/doctor',       doctorAvailabilityRoutes);
router.use('/doctor',       patientPrescriptionRoutes);
router.use('/doctor',       doctorDashRoutes);
router.use('/notifications', notificationRoutes);

export default router;
