import { Router } from 'express';
import authRoutes         from './auth.routes';
import patientRoutes      from './patient.routes';
import hospitalRoutes     from './hospital.routes';
import appointmentRoutes  from './appointment.routes';
import communityRoutes    from './community.routes';
import articleRoutes      from './article.routes';
import subscriptionRoutes from './subscription.routes';
import publicRoutes from './public.routes';
import platformRoutes     from './platform.routes';
import adminRoutes        from './admin.routes';
import doctorDashRoutes   from './doctor.routes';

const router = Router();

router.use('/auth',         authRoutes);
router.use('/',             patientRoutes);
router.use('/hospitals',    hospitalRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/communities',  communityRoutes);
router.use('/articles',     articleRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/public',         publicRoutes);
router.use('/platform',     platformRoutes);
router.use('/admin',        adminRoutes);
router.use('/doctor',       doctorDashRoutes);

export default router;
