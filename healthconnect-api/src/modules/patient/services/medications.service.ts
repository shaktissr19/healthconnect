import { ApiError } from '../../../utils/apiError';
import { getPatient, prisma } from './_shared';

export const getMedications = async (userId: string, params: { status?: string }) => {
  const patient = await getPatient(userId);
  const where: any = { patientId: patient.id };
  if (params.status) where.status = params.status;

  const medications = await prisma.medication.findMany({
    where,
    orderBy: [{ status: 'asc' }, { startDate: 'desc' }],
    include: {
      logs: {
        orderBy: { scheduledTime: 'desc' },
        take: 7,
      },
    },
  });

  const day30 = new Date(Date.now() - 30 * 86400000);
  const enriched = await Promise.all(
    medications.map(async medication => {
      const [total, taken] = await Promise.all([
        prisma.medicationLog.count({
          where: { medicationId: medication.id, scheduledTime: { gte: day30 } },
        }),
        prisma.medicationLog.count({
          where: { medicationId: medication.id, scheduledTime: { gte: day30 }, status: 'taken' },
        }),
      ]);

      const adherence = total > 0 ? Math.round((taken / total) * 100) : null;
      const needsRefill =
        medication.currentStock != null &&
        medication.refillThreshold != null &&
        medication.currentStock <= medication.refillThreshold;

      return { ...medication, adherencePct: adherence, needsRefill };
    }),
  );

  return enriched;
};

export const addMedication = async (userId: string, data: {
  name: string;
  genericName?: string;
  dosage: string;
  dosageUnit?: string;
  frequency: string;
  customFrequency?: string;
  timesOfDay?: string[];
  prescribedBy?: string;
  prescribedFor?: string;
  startDate: string;
  endDate?: string;
  currentStock?: number;
  refillThreshold?: number;
  instructions?: string;
  notes?: string;
}) => {
  const patient = await getPatient(userId);
  return prisma.medication.create({
    data: {
      patientId: patient.id,
      name: data.name,
      genericName: data.genericName,
      dosage: data.dosage,
      dosageUnit: data.dosageUnit,
      frequency: data.frequency as any,
      customFrequency: data.customFrequency,
      timesOfDay: data.timesOfDay || [],
      prescribedBy: data.prescribedBy,
      prescribedFor: data.prescribedFor,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      status: 'ACTIVE',
      currentStock: data.currentStock,
      refillThreshold: data.refillThreshold ?? 7,
      instructions: data.instructions,
      notes: data.notes,
    },
  });
};

export const updateMedication = async (
  userId: string,
  medicationId: string,
  data: Partial<{
    name: string;
    dosage: string;
    frequency: string;
    timesOfDay: string[];
    status: string;
    currentStock: number;
    endDate: string;
    notes: string;
    instructions: string;
  }>,
) => {
  const patient = await getPatient(userId);
  const medication = await prisma.medication.findFirst({ where: { id: medicationId, patientId: patient.id } });
  if (!medication) throw ApiError.notFound('Medication not found');

  return prisma.medication.update({
    where: { id: medicationId },
    data: {
      ...data,
      frequency: data.frequency as any,
      status: data.status as any,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });
};

export const deleteMedication = async (userId: string, medicationId: string) => {
  const patient = await getPatient(userId);
  const medication = await prisma.medication.findFirst({ where: { id: medicationId, patientId: patient.id } });
  if (!medication) throw ApiError.notFound('Medication not found');

  return prisma.medication.update({
    where: { id: medicationId },
    data: { status: 'DISCONTINUED' },
  });
};

export const logMedicationDose = async (
  userId: string,
  medicationId: string,
  data: {
    status: 'taken' | 'missed' | 'skipped';
    scheduledTime: string;
    takenAt?: string;
    notes?: string;
  },
) => {
  const patient = await getPatient(userId);
  const medication = await prisma.medication.findFirst({ where: { id: medicationId, patientId: patient.id } });
  if (!medication) throw ApiError.notFound('Medication not found');

  const scheduled = new Date(data.scheduledTime);
  const existing = await prisma.medicationLog.findFirst({
    where: {
      medicationId,
      scheduledTime: {
        gte: new Date(scheduled.getTime() - 60000),
        lte: new Date(scheduled.getTime() + 60000),
      },
    },
  });

  if (existing) {
    return prisma.medicationLog.update({
      where: { id: existing.id },
      data: {
        status: data.status,
        takenAt: data.takenAt ? new Date(data.takenAt) : data.status === 'taken' ? new Date() : undefined,
        notes: data.notes,
      },
    });
  }

  const log = await prisma.medicationLog.create({
    data: {
      medicationId,
      scheduledTime: scheduled,
      status: data.status,
      takenAt: data.takenAt ? new Date(data.takenAt) : data.status === 'taken' ? new Date() : undefined,
      notes: data.notes,
    },
  });

  if (data.status === 'taken' && medication.currentStock != null) {
    await prisma.medication.update({
      where: { id: medicationId },
      data: { currentStock: Math.max(0, medication.currentStock - 1) },
    });
  }

  return log;
};

export const getMedicationLogs = async (
  userId: string,
  medicationId: string,
  params: { from?: string; to?: string },
) => {
  const patient = await getPatient(userId);
  const medication = await prisma.medication.findFirst({ where: { id: medicationId, patientId: patient.id } });
  if (!medication) throw ApiError.notFound('Medication not found');

  const where: any = { medicationId };
  if (params.from || params.to) {
    where.scheduledTime = {};
    if (params.from) where.scheduledTime.gte = new Date(params.from);
    if (params.to) where.scheduledTime.lte = new Date(params.to);
  }

  return prisma.medicationLog.findMany({ where, orderBy: { scheduledTime: 'desc' } });
};

export const getTherapies = async (userId: string) => {
  const patient = await getPatient(userId);
  return prisma.therapy.findMany({
    where: { patientId: patient.id },
    orderBy: { startDate: 'desc' },
  });
};

export const addTherapy = async (userId: string, data: {
  type: string;
  plan: string;
  targetValue?: string;
  currentValue?: string;
  startDate: string;
  endDate?: string;
  notes?: string;
}) => {
  const patient = await getPatient(userId);
  return prisma.therapy.create({
    data: {
      patientId: patient.id,
      type: data.type,
      plan: data.plan,
      targetValue: data.targetValue,
      currentValue: data.currentValue,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      notes: data.notes,
    },
  });
};

export const deleteTherapy = async (userId: string, therapyId: string) => {
  const patient = await getPatient(userId);
  const therapy = await prisma.therapy.findFirst({ where: { id: therapyId, patientId: patient.id } });
  if (!therapy) throw ApiError.notFound('Therapy record not found');
  await prisma.therapy.delete({ where: { id: therapyId } });
};
