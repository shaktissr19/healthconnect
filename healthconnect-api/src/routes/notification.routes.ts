// src/routes/notification.routes.ts
// Wire up notification endpoints — add this to your main app.ts router

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getNotifications,
  markAllRead,
  markOneRead,
  deleteNotification,
} from '../controllers/notification.controller';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

router.get('/',             getNotifications);   // GET  /notifications
router.put('/read-all',     markAllRead);         // PUT  /notifications/read-all
router.put('/:id/read',     markOneRead);         // PUT  /notifications/:id/read
router.delete('/:id',       deleteNotification);  // DELETE /notifications/:id

export default router;


// ─────────────────────────────────────────────────────────────────────────────
// HOW TO REGISTER IN app.ts:
//
//   import notificationRoutes from './routes/notification.routes';
//   app.use('/api/v1/notifications', notificationRoutes);
//
// ─────────────────────────────────────────────────────────────────────────────
