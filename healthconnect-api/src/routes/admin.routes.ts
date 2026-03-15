// ── ADD THESE ROUTES to src/routes/admin.routes.ts ──────────────────────────
// Insert after the existing community routes section:
//
//   router.get('/communities',              ...admin, Admin.getCommunityStats);
//   router.patch('/communities/:id/toggle', ...admin, Admin.toggleCommunityStatus);
//
// Add below those lines:

// Community CRUD
// router.post('/communities',                        ...admin, Admin.createCommunity);
// router.put('/communities/:id',                     ...admin, Admin.updateCommunity);
// router.delete('/communities/:id',                  ...admin, Admin.deleteCommunity);
// router.patch('/communities/:id/feature',           ...admin, Admin.toggleCommunityFeatured);

// Community requests (patient → admin approval)
// router.get('/communities/requests',                ...admin, Admin.getCommunityRequests);
// router.post('/communities/requests/:id/approve',   ...admin, Admin.approveCommunityRequest);
// router.post('/communities/requests/:id/reject',    ...admin, Admin.rejectCommunityRequest);

// Weekly Q&A management
// router.get('/communities/:id/qa-sessions',         ...admin, Admin.getQASessions);
// router.post('/communities/:id/qa-sessions',        ...admin, Admin.createQASession);
// router.delete('/communities/qa-sessions/:id',      ...admin, Admin.deleteQASession);

// ── FULL UPDATED admin.routes.ts ─────────────────────────────────────────────
import { Router } from 'express';
import * as Admin from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

const router = Router();
const admin  = [authenticate, requireRole('ADMIN')];

// Dashboard
router.get('/stats',                                  ...admin, Admin.getDashboardStats);

// User management
router.get('/users',                                  ...admin, Admin.getAllUsers);
router.get('/users/:id',                              ...admin, Admin.getUserById);
router.patch('/users/:id/toggle',                     ...admin, Admin.toggleUserStatus);
router.delete('/users/:id',                           ...admin, Admin.deleteUser);

// Doctor verification
router.get('/doctors',                                ...admin, Admin.getAllDoctors);
router.get('/doctors/pending',                        ...admin, Admin.getPendingDoctors);
router.post('/doctors/:id/verify',                    ...admin, Admin.verifyDoctor);

// Subscriptions & revenue
router.get('/subscriptions',                          ...admin, Admin.getSubscriptionStats);

// Communities — stats + toggle (existing)
router.get('/communities',                            ...admin, Admin.getCommunityStats);
router.patch('/communities/:id/toggle',               ...admin, Admin.toggleCommunityStatus);

// Communities — CRUD (new)
router.post('/communities',                           ...admin, Admin.createCommunity);
router.put('/communities/:id',                        ...admin, Admin.updateCommunity);
router.delete('/communities/:id',                     ...admin, Admin.deleteCommunity);
router.patch('/communities/:id/feature',              ...admin, Admin.toggleCommunityFeatured);

// Community requests
router.get('/communities/requests',                   ...admin, Admin.getCommunityRequests);
router.post('/communities/requests/:id/approve',      ...admin, Admin.approveCommunityRequest);
router.post('/communities/requests/:id/reject',       ...admin, Admin.rejectCommunityRequest);

// Weekly Q&A
router.get('/communities/:id/qa-sessions',            ...admin, Admin.getQASessions);
router.post('/communities/:id/qa-sessions',           ...admin, Admin.createQASession);
router.delete('/communities/qa-sessions/:sessionId',  ...admin, Admin.deleteQASession);

// Appointments
router.get('/appointments',                           ...admin, Admin.getAppointmentStats);

export default router;
