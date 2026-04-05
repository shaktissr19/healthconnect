"use strict";
// src/controllers/notification.controller.ts
// HealthConnect — Notifications Controller
// Matches existing controller style (ok/err helpers, prisma, req.user?.userId)
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = getNotifications;
exports.markAllRead = markAllRead;
exports.markOneRead = markOneRead;
exports.deleteNotification = deleteNotification;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const ok = (res, data) => res.json({ success: true, data });
const err = (res, msg, code = 400) => res.status(code).json({ success: false, message: msg });
// ── Resolve userId from either JWT shape ──────────────────────────────────
function getUserId(req) {
    return req.user?.userId ?? req.user?.id ?? null;
}
// =============================================================================
// GET /notifications
// Returns latest 50 notifications for the logged-in user (doctor or patient)
// =============================================================================
async function getNotifications(req, res) {
    try {
        const userId = getUserId(req);
        if (!userId)
            return err(res, 'Unauthorized', 401);
        const { limit = '50', offset = '0', unreadOnly } = req.query;
        const where = { userId };
        if (unreadOnly === 'true')
            where.isRead = false;
        const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: parseInt(limit),
                skip: parseInt(offset),
            }),
            prisma.notification.count({ where }),
            prisma.notification.count({ where: { userId, isRead: false } }),
        ]);
        return ok(res, { notifications, total, unreadCount });
    }
    catch (e) {
        console.error('getNotifications', e);
        return err(res, 'Server error', 500);
    }
}
// =============================================================================
// PUT /notifications/read-all
// Marks all unread notifications as read for the logged-in user
// =============================================================================
async function markAllRead(req, res) {
    try {
        const userId = getUserId(req);
        if (!userId)
            return err(res, 'Unauthorized', 401);
        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        return ok(res, { message: 'All notifications marked as read' });
    }
    catch (e) {
        console.error('markAllRead', e);
        return err(res, 'Server error', 500);
    }
}
// =============================================================================
// PUT /notifications/:id/read
// Marks a single notification as read
// =============================================================================
async function markOneRead(req, res) {
    try {
        const userId = getUserId(req);
        if (!userId)
            return err(res, 'Unauthorized', 401);
        const notif = await prisma.notification.findFirst({
            where: { id: req.params.id, userId },
        });
        if (!notif)
            return err(res, 'Notification not found', 404);
        await prisma.notification.update({
            where: { id: req.params.id },
            data: { isRead: true },
        });
        return ok(res, { message: 'Notification marked as read' });
    }
    catch (e) {
        console.error('markOneRead', e);
        return err(res, 'Server error', 500);
    }
}
// =============================================================================
// DELETE /notifications/:id
// Deletes a single notification (optional — nice to have)
// =============================================================================
async function deleteNotification(req, res) {
    try {
        const userId = getUserId(req);
        if (!userId)
            return err(res, 'Unauthorized', 401);
        const notif = await prisma.notification.findFirst({
            where: { id: req.params.id, userId },
        });
        if (!notif)
            return err(res, 'Notification not found', 404);
        await prisma.notification.delete({ where: { id: req.params.id } });
        return ok(res, { message: 'Notification deleted' });
    }
    catch (e) {
        console.error('deleteNotification', e);
        return err(res, 'Server error', 500);
    }
}
//# sourceMappingURL=notification.controller.js.map