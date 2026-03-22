// src/controllers/notification.controller.ts
// HealthConnect — Notifications Controller
// Matches existing controller style (ok/err helpers, prisma, req.user?.userId)

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ok  = (res: Response, data: any) => res.json({ success: true, data });
const err = (res: Response, msg: string, code = 400) =>
  res.status(code).json({ success: false, message: msg });

// ── Resolve userId from either JWT shape ──────────────────────────────────
function getUserId(req: Request): string | null {
  return (req as any).user?.userId ?? (req as any).user?.id ?? null;
}

// =============================================================================
// GET /notifications
// Returns latest 50 notifications for the logged-in user (doctor or patient)
// =============================================================================
export async function getNotifications(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) return err(res, 'Unauthorized', 401);

    const { limit = '50', offset = '0', unreadOnly } = req.query as any;

    const where: any = { userId };
    if (unreadOnly === 'true') where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take:    parseInt(limit),
        skip:    parseInt(offset),
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return ok(res, { notifications, total, unreadCount });
  } catch (e) {
    console.error('getNotifications', e);
    return err(res, 'Server error', 500);
  }
}

// =============================================================================
// PUT /notifications/read-all
// Marks all unread notifications as read for the logged-in user
// =============================================================================
export async function markAllRead(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) return err(res, 'Unauthorized', 401);

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data:  { isRead: true },
    });

    return ok(res, { message: 'All notifications marked as read' });
  } catch (e) {
    console.error('markAllRead', e);
    return err(res, 'Server error', 500);
  }
}

// =============================================================================
// PUT /notifications/:id/read
// Marks a single notification as read
// =============================================================================
export async function markOneRead(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) return err(res, 'Unauthorized', 401);

    const notif = await prisma.notification.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!notif) return err(res, 'Notification not found', 404);

    await prisma.notification.update({
      where: { id: req.params.id },
      data:  { isRead: true },
    });

    return ok(res, { message: 'Notification marked as read' });
  } catch (e) {
    console.error('markOneRead', e);
    return err(res, 'Server error', 500);
  }
}

// =============================================================================
// DELETE /notifications/:id
// Deletes a single notification (optional — nice to have)
// =============================================================================
export async function deleteNotification(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) return err(res, 'Unauthorized', 401);

    const notif = await prisma.notification.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!notif) return err(res, 'Notification not found', 404);

    await prisma.notification.delete({ where: { id: req.params.id } });

    return ok(res, { message: 'Notification deleted' });
  } catch (e) {
    console.error('deleteNotification', e);
    return err(res, 'Server error', 500);
  }
}
