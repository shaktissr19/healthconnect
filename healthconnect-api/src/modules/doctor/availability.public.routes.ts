import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { publicRateLimiter } from '../../middleware/rateLimiter';
import { BUSINESS_TIME_ZONE, getEffectiveAvailabilityRows } from './availability.service';

const router = Router();
router.use(publicRateLimiter);

router.get('/doctors/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await prisma.doctorProfile.findFirst({
      where: {
        AND: [
          {
            OR: [
              { verificationStatus: 'VERIFIED' },
              { verificationStatus: 'PENDING', isVerified: true },
            ],
          },
          { OR: [{ id }, { hcDoctorId: id }] },
        ],
      },
      select: {
        id: true,
        consultationFee: true,
        teleconsultFee: true,
        videoConsultFee: true,
        audioConsultFee: true,
        offersInPerson: true,
        offersVideoConsult: true,
        offersAudioConsult: true,
        offersChatConsult: true,
        isAvailableOnline: true,
        isAcceptingNewPatients: true,
      },
    });

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const availability = await getEffectiveAvailabilityRows(doctor.id) ?? [];
    const now = new Date();
    const end14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const bookedSlots = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: { in: ['PENDING', 'CONFIRMED'] },
        scheduledAt: { gte: now, lte: end14 },
      },
      select: { scheduledAt: true, durationMinutes: true },
      orderBy: { scheduledAt: 'asc' },
    });

    return res.json({
      success: true,
      data: {
        timezone: BUSINESS_TIME_ZONE,
        configured: availability.length > 0,
        availability: availability.map((row: any) => ({
          id: row.id ?? null,
          dayOfWeek: row.dayOfWeek,
          startTime: row.startTime,
          endTime: row.endTime,
          slotDuration: row.slotDuration || 30,
          isActive: row.isActive !== false,
        })),
        bookedSlots,
        fees: {
          inPerson: doctor.consultationFee,
          video: doctor.videoConsultFee ?? doctor.teleconsultFee,
          phone: doctor.audioConsultFee,
        },
        consultationModes: {
          offersInPerson: doctor.offersInPerson,
          offersVideoConsult: doctor.offersVideoConsult,
          offersAudioConsult: doctor.offersAudioConsult,
          offersChatConsult: doctor.offersChatConsult,
        },
        isAvailableOnline: doctor.isAvailableOnline,
        isAcceptingNewPatients: doctor.isAcceptingNewPatients,
      },
    });
  } catch (error) {
    console.error('[PublicDoctorAvailability]', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch availability' });
  }
});

export default router;
