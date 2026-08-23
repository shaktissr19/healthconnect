import { Router } from 'express';
import authRoutes         from './auth.routes';
import patientRoutes      from './patient.routes';
import hospitalRoutes     from './hospital.routes';
import appointmentRoutes  from './appointment.routes';
import paymentRoutes      from './payment.routes';
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
import doctorHospitalAffiliationRoutes from '../modules/hospital/doctorAffiliations.routes';
import notificationRoutes from './notification.routes';
import * as communityController from '../controllers/community.controller';
import { optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { communitySearchSchema } from '../validators/community.validator';

const router = Router();

router.use('/auth',         authRoutes);
router.use('/',             patientRoutes);
router.use('/hospitals',    hospitalRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/payments',     paymentRoutes);
router.use('/communities',  communityRoutes);

// Backward-compatible read-only alias for the Patient dashboard global-search
// client that historically called /api/v1/api/communities. Keep this limited
// to GET discovery only; all canonical Community routes remain /communities/*.
router.get('/api/communities', optionalAuth, validate(communitySearchSchema, 'query'), communityController.getCommunities);

router.use('/articles',     articleRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/public',       publicDoctorAvailabilityRoutes);
router.use('/public',       publicRoutes);
router.use('/platform',     platformRoutes);
router.use('/admin',        adminRoutes);
// Canonical Doctor v2 / Hospital-affiliation modules precede legacy Doctor routes.
router.use('/doctor',       doctorProfileRoutes);
router.use('/doctor',       doctorAvailabilityRoutes);
router.use('/doctor',       doctorHospitalAffiliationRoutes);
router.use('/doctor',       patientPrescriptionRoutes);
router.use('/doctor',       doctorDashRoutes);
router.use('/notifications', notificationRoutes);

export default router;
