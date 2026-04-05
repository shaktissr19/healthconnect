// src/routes/admin.routes.ts
// Fixed: route ordering — specific paths before parameterised ones.
// Previously /doctors/pending and /communities/requests were shadowed by
// /:id params registered before them.

import { Router } from 'express';
import * as Admin from '../controllers/admin.controller';
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

// ── FIX: /doctors/pending MUST come before /doctors/:id ──────────────────────
// Express matches routes top-to-bottom; if /:id is first, "pending" is treated
// as an ID value and the wrong handler fires.
router.get('/doctors/pending',      ...admin, Admin.getPendingDoctors);
router.get('/doctors',              ...admin, Admin.getAllDoctors);
router.get('/doctors/:id',          ...admin, Admin.getUserById);
router.post('/doctors/:id/verify',  ...admin, Admin.verifyDoctor);

// Subscriptions & revenue
router.get('/subscriptions', ...admin, Admin.getSubscriptionStats);

// ── FIX: community sub-routes before /:id ────────────────────────────────────
// /communities/requests was previously shadowed by /:id/qa-sessions

// Specific named sub-paths first
router.get('/communities/requests',                 ...admin, Admin.getCommunityRequests);
router.post('/communities/requests/:id/approve',    ...admin, Admin.approveCommunityRequest);
router.post('/communities/requests/:id/reject',     ...admin, Admin.rejectCommunityRequest);

// Collection + create
router.get('/communities',                          ...admin, Admin.getCommunityStats);
router.post('/communities',                         ...admin, Admin.createCommunity);

// Parameterised community routes
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
