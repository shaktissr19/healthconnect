import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleGuard';
import { prisma } from '../../lib/prisma';

const router = Router();

/**
 * Compatibility endpoint for the existing Doctor router contract.
 *
 * GET /api/v1/doctor/patient/prescriptions
 *
 * The current Prisma schema has no `Prescription` model. Medication is the
 * canonical persisted patient treatment/prescription source, so expose it in
 * the legacy prescription response shape instead of calling an undefined
 * Prisma delegate.
 */
router.get('/patient/prescriptions', authenticate, requireRole('PATIENT'), async (req: any, res) => {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    const patient = await prisma.patientProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    const medications = await prisma.medication.findMany({
      where: { patientId: patient.id },
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });

    const prescriptions = medications.map((medication) => {
      const drug = {
        id: medication.id,
        name: medication.name,
        genericName: medication.genericName,
        dosage: medication.dosage,
        dosageUnit: medication.dosageUnit,
        frequency: medication.frequency,
        customFrequency: medication.customFrequency,
        timesOfDay: medication.timesOfDay,
        instructions: medication.instructions,
        prescribedFor: medication.prescribedFor,
        startDate: medication.startDate,
        endDate: medication.endDate,
        status: medication.status,
      };

      return {
        id: medication.id,
        date: medication.createdAt?.toISOString?.() ?? medication.startDate.toISOString(),
        status: medication.status,
        notes: medication.notes ?? medication.instructions ?? '',
        doctorName: medication.prescribedBy ?? null,
        doctorSpec: null,
        drugs: [drug],
        // Legacy single-drug fields retained for existing callers.
        drug: medication.name,
        dosage: medication.dosage,
        dosageUnit: medication.dosageUnit,
        frequency: medication.frequency,
        prescribedFor: medication.prescribedFor,
        startDate: medication.startDate,
        endDate: medication.endDate,
      };
    });

    return res.json({
      success: true,
      data: {
        prescriptions,
        total: prescriptions.length,
      },
    });
  } catch (error) {
    console.error('patient-prescriptions', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
