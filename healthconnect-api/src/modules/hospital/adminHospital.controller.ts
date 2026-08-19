import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { ApiResponse } from '../../utils/apiResponse';

export const getPendingHospitals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const where = { verificationStatus: { in: ['SUBMITTED', 'UNDER_REVIEW'] as const } };
    const [hospitals, total] = await Promise.all([
      prisma.hospitalProfile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ verificationSubmittedAt: 'asc' }, { createdAt: 'asc' }],
        include: { user: { select: { id: true, email: true, registrationId: true, isActive: true, createdAt: true } } },
      }),
      prisma.hospitalProfile.count({ where }),
    ]);
    return ApiResponse.success(res, { hospitals, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) { next(error); }
};

export const getAllHospitals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const search = String(req.query.search ?? '').trim();
    const status = String(req.query.status ?? '').trim().toUpperCase();
    const where: any = {};
    if (status) where.verificationStatus = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { registrationNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [hospitals, total] = await Promise.all([
      prisma.hospitalProfile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, email: true, registrationId: true, isActive: true, createdAt: true } } },
      }),
      prisma.hospitalProfile.count({ where }),
    ]);
    return ApiResponse.success(res, { hospitals, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) { next(error); }
};

export const verifyHospital = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const action = String(req.body?.action ?? '').toLowerCase();
    const reason = String(req.body?.reason ?? '').trim() || null;
    if (!['review', 'approve', 'reject', 'suspend', 'restore'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be review, approve, reject, suspend, or restore.' });
    }
    if (['reject', 'suspend'].includes(action) && !reason) {
      return res.status(400).json({ success: false, message: 'A reason is required for rejection or suspension.' });
    }

    const hospital = await prisma.hospitalProfile.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!hospital) return ApiResponse.notFound(res, 'Hospital profile not found');

    let data: any;
    let title: string;
    let body: string;
    if (action === 'review') {
      data = { verificationStatus: 'UNDER_REVIEW', verificationNotes: reason };
      title = 'Hospital verification under review';
      body = 'HealthConnect has started reviewing your hospital verification submission.';
    } else if (action === 'approve' || action === 'restore') {
      data = {
        verificationStatus: 'VERIFIED',
        isVerified: true,
        verifiedAt: new Date(),
        verifiedByAdminId: req.user!.userId,
        verificationNotes: null,
      };
      title = 'Hospital verified';
      body = `${hospital.name} is verified on HealthConnect and can appear in the public hospital directory.`;
    } else if (action === 'reject') {
      data = { verificationStatus: 'REJECTED', isVerified: false, verificationNotes: reason };
      title = 'Hospital verification needs attention';
      body = reason!;
    } else {
      data = { verificationStatus: 'SUSPENDED', isVerified: false, verificationNotes: reason };
      title = 'Hospital verification suspended';
      body = reason!;
    }

    const updated = await prisma.hospitalProfile.update({ where: { id: hospital.id }, data });
    await Promise.all([
      prisma.notification.create({
        data: {
          userId: hospital.userId,
          type: 'SYSTEM',
          title,
          body,
          data: { hospitalId: hospital.id, verificationStatus: updated.verificationStatus },
        },
      }).catch(() => undefined),
      prisma.auditLog.create({
        data: {
          userId: req.user!.userId,
          action: `ADMIN_HOSPITAL_VERIFICATION_${action.toUpperCase()}`,
          entityType: 'HospitalProfile',
          entityId: hospital.id,
          metadata: { reason },
        },
      }).catch(() => undefined),
    ]);

    return ApiResponse.success(res, updated, `Hospital verification ${action} completed`);
  } catch (error) { next(error); }
};
