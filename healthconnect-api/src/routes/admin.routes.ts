// src/routes/admin.routes.ts
import { Router } from 'express';
import * as Admin from '../controllers/admin.controller';
import * as HospitalAdmin from '../modules/hospital/adminHospital.controller';
import { authenticate } from '../middleware/auth';
import { requireRole }  from '../middleware/roleGuard';

const router = Router();
const admin  = [authenticate, requireRole('ADMIN')];

// Dashboard
router.get('/stats', ...admin, Admin.getDashboardStats);

// User management
router.get('/users',              ...admin, Admin.getAllUsers);
router.get('/users/:id',          ...admin, Admin.getUserById);
router.patch('/users/:id/toggle', ...admin, Admin.toggleUserStatus);
router.delete('/users/:id',       ...admin, Admin.deleteUser);

// Doctor verification
router.get('/doctors/pending',      ...admin, Admin.getPendingDoctors);
router.get('/doctors',              ...admin, Admin.getAllDoctors);
router.get('/doctors/:id',          ...admin, Admin.getUserById);
router.post('/doctors/:id/verify',  ...admin, Admin.verifyDoctor);

// Hospital verification
router.get('/hospitals/pending',     ...admin, HospitalAdmin.getPendingHospitals);
router.get('/hospitals',             ...admin, HospitalAdmin.getAllHospitals);
router.post('/hospitals/:id/verify', ...admin, HospitalAdmin.verifyHospital);

// Subscriptions & revenue
router.get('/subscriptions', ...admin, Admin.getSubscriptionStats);

// Community requests
router.get('/communities/requests',                 ...admin, Admin.getCommunityRequests);
router.post('/communities/requests/:id/approve',    ...admin, Admin.approveCommunityRequest);
router.post('/communities/requests/:id/reject',     ...admin, Admin.rejectCommunityRequest);

router.get('/communities',                          ...admin, Admin.getCommunityStats);
router.post('/communities',                         ...admin, Admin.createCommunity);
router.patch('/communities/:id/toggle',             ...admin, Admin.toggleCommunityStatus);
router.patch('/communities/:id/feature',            ...admin, Admin.toggleCommunityFeatured);
router.put('/communities/:id',                      ...admin, Admin.updateCommunity);
router.delete('/communities/:id',                   ...admin, Admin.deleteCommunity);
router.get('/communities/:id/qa-sessions',          ...admin, Admin.getQASessions);
router.post('/communities/:id/qa-sessions',         ...admin, Admin.createQASession);
router.delete('/communities/qa-sessions/:sessionId',...admin, Admin.deleteQASession);

// Appointments
router.get('/appointments', ...admin, Admin.getAppointmentStats);

export default router;
