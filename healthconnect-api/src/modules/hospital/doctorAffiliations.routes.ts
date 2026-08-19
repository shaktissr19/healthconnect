import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleGuard';
import { ApiResponse } from '../../utils/apiResponse';

const router = Router();

router.use(authenticate, requireRole('DOCTOR'));

router.get('/hospital-affiliations', async (req: any, res, next) => {
  try {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { userId: req.user.userId },
      select: { id: true },
    });
    if (!doctor) return ApiResponse.notFound(res, 'Doctor profile not found');

    const affiliations = await prisma.doctorHospital.findMany({
      where: { doctorId: doctor.id, status: { not: 'REVOKED' } },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            city: true,
            state: true,
            isVerified: true,
            verificationStatus: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { invitedAt: 'desc' }],
    });

    return ApiResponse.success(res, affiliations);
  } catch (error) { next(error); }
});

router.post('/hospital-affiliations/:id/respond', async (req: any, res, next) => {
  try {
    const action = String(req.body?.action ?? '').toLowerCase();
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be accept or reject.' });
    }

    const doctor = await prisma.doctorProfile.findUnique({
      where: { userId: req.user.userId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!doctor) return ApiResponse.notFound(res, 'Doctor profile not found');

    const affiliation = await prisma.doctorHospital.findFirst({
      where: { id: req.params.id, doctorId: doctor.id },
      include: { hospital: { select: { id: true, userId: true, name: true } } },
    });
    if (!affiliation) return ApiResponse.notFound(res, 'Hospital affiliation request not found');
    if (affiliation.status !== 'PENDING') {
      return res.status(409).json({ success: false, message: `This invitation is already ${affiliation.status.toLowerCase()}.` });
    }

    const accepted = action === 'accept';
    const updated = await prisma.$transaction(async tx => {
      if (accepted && affiliation.isPrimary) {
        await tx.doctorHospital.updateMany({
          where: { doctorId: doctor.id, status: 'ACCEPTED', id: { not: affiliation.id } },
          data: { isPrimary: false },
        });
      }
      return tx.doctorHospital.update({
        where: { id: affiliation.id },
        data: {
          status: accepted ? 'ACCEPTED' : 'REJECTED',
          respondedAt: new Date(),
          revokedAt: null,
          ...(accepted ? {} : { isPrimary: false }),
        },
        include: { hospital: { select: { id: true, name: true, city: true, state: true } } },
      });
    });

    await Promise.all([
      prisma.notification.create({
        data: {
          userId: affiliation.hospital.userId,
          type: 'SYSTEM',
          title: accepted ? 'Doctor accepted affiliation' : 'Doctor declined affiliation',
          body: `Dr. ${doctor.firstName} ${doctor.lastName} ${accepted ? 'accepted' : 'declined'} the affiliation with ${affiliation.hospital.name}.`,
          data: { affiliationId: affiliation.id, doctorId: doctor.id },
        },
      }).catch(() => undefined),
      prisma.auditLog.create({
        data: {
          userId: req.user.userId,
          action: accepted ? 'DOCTOR_HOSPITAL_AFFILIATION_ACCEPTED' : 'DOCTOR_HOSPITAL_AFFILIATION_REJECTED',
          entityType: 'DoctorHospital',
          entityId: affiliation.id,
          metadata: { hospitalId: affiliation.hospital.id },
        },
      }).catch(() => undefined),
    ]);

    return ApiResponse.success(res, updated, accepted ? 'Hospital affiliation accepted' : 'Hospital affiliation declined');
  } catch (error) { next(error); }
});

export default router;
