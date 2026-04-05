"use strict";
// src/routes/notification.routes.ts
// Wire up notification endpoints — add this to your main app.ts router
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const notification_controller_1 = require("../controllers/notification.controller");
const router = (0, express_1.Router)();
// All notification routes require authentication
router.use(auth_1.authenticate);
router.get('/', notification_controller_1.getNotifications); // GET  /notifications
router.put('/read-all', notification_controller_1.markAllRead); // PUT  /notifications/read-all
router.put('/:id/read', notification_controller_1.markOneRead); // PUT  /notifications/:id/read
router.delete('/:id', notification_controller_1.deleteNotification); // DELETE /notifications/:id
exports.default = router;
// ─────────────────────────────────────────────────────────────────────────────
// HOW TO REGISTER IN app.ts:
//
//   import notificationRoutes from './routes/notification.routes';
//   app.use('/api/v1/notifications', notificationRoutes);
//
// ─────────────────────────────────────────────────────────────────────────────
//# sourceMappingURL=notification.routes.js.map