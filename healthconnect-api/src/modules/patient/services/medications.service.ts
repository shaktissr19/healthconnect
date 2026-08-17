import { ApiError } from '../../../utils/apiError';
import { getPatient, prisma } from './_shared';

const normalizeFrequency = (value: string) => {
  const frequency = String(value || 'ONCE_DAILY').toUpperCase();
  if (frequency === 'DAILY') return 'ONCE_DAILY';
  if (frequency === 'THRICE_DAILY') return 'THREE_TIMES_DAILY';
  return frequency;
};

const normalizeTimes = (values?: string[]) => {
  const aliases: Record<string, string> = {
    MORNING: '08:00',
    AFTERNOON: '13:00',
    EVENING: '18:00',
    NIGHT: '21:00',
    BEFORE_BED: '22:00',
  };
  return (values || []).map(value => aliases[value.toUpperCase()] ?? value);
};

export const getMedications = async (userId: string, params: { status?: string }) => {
  const patient = await getPatient(userId);
  const where: any = { patientId: patient.id };
  if (params.status) where.status = params.status.toUpperCase();

  const medications = await prisma.medication.findMany({
    where,
    orderBy: [{ status: 'asc' }, { startDate: 'desc' }],
    include: {
      logs: {
        orderBy: { scheduledTime: 'desc' },
        take: 30,
      },
    },
  });

  const day30 = new Date(Date.now() - 30 * 86400000);
  return Promise.all(
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

      return { ...medication, adherencePct: adherence, adherence30Day: adherence, needsRefill };
    }),
  );
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
  startDate?: string;
  endDate?: string;
  currentStock?: number;
  refillThreshold?: number;
  instructions?: string;
  notes?: string;
  status?: string;
}) => {
  const patient = await getPatient(userId);
  const startDate = data.startDate ? new Date(data.startDate) : new Date();
  const endDate = data.endDate ? new Date(data.endDate) : undefined;
  if (endDate && endDate.getTime() < startDate.getTime()) {
    throw ApiError.badRequest('INVALID_DATE_RANGE', 'Medication end date cannot be before start date');
  }

  return prisma.medication.create({
    data: {
      patientId: patient.id,
      name: data.name.trim(),
      genericName: data.genericName?.trim(),
      dosage: data.dosage.trim(),
      dosageUnit: data.dosageUnit?.trim(),
      frequency: normalizeFrequency(data.frequency) as any,
      customFrequency: data.customFrequency?.trim(),
      timesOfDay: normalizeTimes(data.timesOfDay),
      prescribedBy: data.prescribedBy?.trim(),
      prescribedFor: data.prescribedFor?.trim(),
      startDate,
      endDate,
      status: 'ACTIVE',
      currentStock: data.currentStock,
      refillThreshold: data.refillThreshold ?? 7,
      instructions: data.instructions?.trim(),
      notes: data.notes?.trim(),
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
      name: data.name?.trim(),
      dosage: data.dosage?.trim(),
      frequency: data.frequency ? normalizeFrequency(data.frequency) as any : undefined,
      timesOfDay: data.timesOfDay ? normalizeTimes(data.timesOfDay) : undefined,
      status: data.status ? data.status.toUpperCase() as any : undefined,
      currentStock: data.currentStock,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      notes: data.notes?.trim(),
      instructions: data.instructions?.trim(),
    },
  });
};

export const deleteMedication = async (userId: string, medicationId: string) => {
  const patient = await getPatient(userId);
  const medication = await prisma.medication.findFirst({ where: { id: medicationId, patientId: patient.id } });
  if (!medication) throw ApiError.notFound('Medication not found');

  return prisma.medication.update({
    where: { id: medicationId },
    data: { status: 'DISCONTINUED', endDate: medication.endDate ?? new Date() },
  });
};

export const logMedicationDose = async (
  userId: string,
  medicationId: string,
  data: {
    status: 'taken' | 'missed' | 'skipped' | 'TAKEN' | 'MISSED' | 'SKIPPED';
    scheduledTime?: string;
    takenAt?: string;
    notes?: string;
  },
) => {
  const patient = await getPatient(userId);
  const medication = await prisma.medication.findFirst({ where: { id: medicationId, patientId: patient.id } });
  if (!medication) throw ApiError.notFound('Medication not found');
  if (medication.status !== 'ACTIVE') {
    throw ApiError.badRequest('MEDICATION_NOT_ACTIVE', 'Only active medications can have doses logged');
  }

  const status = data.status.toLowerCase() as 'taken' | 'missed' | 'skipped';
  const scheduled = data.scheduledTime ? new Date(data.scheduledTime) : new Date();
  const existing = await prisma.medicationLog.findFirst({
    where: {
      medicationId,
      scheduledTime: {
        gte: new Date(scheduled.getTime() - 60000),
        lte: new Date(scheduled.getTime() + 60000),
      },
    },
  });

  const takenAt = status === 'taken'
    ? (data.takenAt ? new Date(data.takenAt) : new Date())
    : null;

  return prisma.$transaction(async tx => {
    const log = existing
      ? await tx.medicationLog.update({
          where: { id: existing.id },
          data: { status, takenAt, notes: data.notes?.trim() },
        })
      : await tx.medicationLog.create({
          data: {
            medicationId,
            scheduledTime: scheduled,
            status,
            takenAt,
            notes: data.notes?.trim(),
          },
        });

    if (medication.currentStock != null) {
      const wasTaken = existing?.status === 'taken';
      const isTakenNow = status === 'taken';
      if (!wasTaken && isTakenNow) {
        await tx.medication.update({
          where: { id: medicationId },
          data: { currentStock: Math.max(0, medication.currentStock - 1) },
        });
      } else if (wasTaken && !isTakenNow) {
        await tx.medication.update({
          where: { id: medicationId },
          data: { currentStock: medication.currentStock + 1 },
        });
      }
    }

    return { ...log, status: log.status.toUpperCase() };
  });
};

export const getMedicationLogs = async (
  userId: string,
  medicationId: string,
  params: { from?: string; to?: string; date?: string },
) => {
  const patient = await getPatient(userId);
  const medication = await prisma.medication.findFirst({ where: { id: medicationId, patientId: patient.id } });
  if (!medication) throw ApiError.notFound('Medication not found');

  const where: any = { medicationId };
  if (params.date) {
    const start = new Date(`${params.date}T00:00:00.000Z`);
    const end = new Date(start.getTime() + 86400000);
    if (!Number.isNaN(start.getTime())) where.scheduledTime = { gte: start, lt: end };
  } else if (params.from || params.to) {
    where.scheduledTime = {};
    if (params.from) where.scheduledTime.gte = new Date(params.from);
    if (params.to) where.scheduledTime.lte = new Date(params.to);
  }

  const logs = await prisma.medicationLog.findMany({ where, orderBy: { scheduledTime: 'desc' } });
  return logs.map(log => ({ ...log, status: log.status.toUpperCase() }));
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
  const startDate = new Date(data.startDate);
  const endDate = data.endDate ? new Date(data.endDate) : undefined;
  if (endDate && endDate.getTime() < startDate.getTime()) {
    throw ApiError.badRequest('INVALID_DATE_RANGE', 'Therapy end date cannot be before start date');
  }

  return prisma.therapy.create({
    data: {
      patientId: patient.id,
      type: data.type.trim(),
      plan: data.plan.trim(),
      targetValue: data.targetValue?.trim(),
      currentValue: data.currentValue?.trim(),
      startDate,
      endDate,
      notes: data.notes?.trim(),
    },
  });
};

export const updateTherapy = async (
  userId: string,
  therapyId: string,
  data: Partial<{
    type: string;
    plan: string;
    targetValue: string;
    currentValue: string;
    startDate: string;
    endDate: string | null;
    notes: string;
  }>,
) => {
  const patient = await getPatient(userId);
  const therapy = await prisma.therapy.findFirst({ where: { id: therapyId, patientId: patient.id } });
  if (!therapy) throw ApiError.notFound('Therapy record not found');

  const nextStart = data.startDate ? new Date(data.startDate) : therapy.startDate;
  const nextEnd = data.endDate === null
    ? null
    : data.endDate
      ? new Date(data.endDate)
      : therapy.endDate;

  if (nextEnd && nextEnd.getTime() < nextStart.getTime()) {
    throw ApiError.badRequest('INVALID_THERAPY_DATES', 'End date cannot be before start date');
  }

  const { startDate, endDate, ...rest } = data;
  return prisma.therapy.update({
    where: { id: therapyId },
    data: {
      ...rest,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate === null ? null : endDate ? new Date(endDate) : undefined,
    },
  });
};

export const deleteTherapy = async (userId: string, therapyId: string) => {
  const patient = await getPatient(userId);
  const therapy = await prisma.therapy.findFirst({ where: { id: therapyId, patientId: patient.id } });
  if (!therapy) throw ApiError.notFound('Therapy record not found');
  await prisma.therapy.delete({ where: { id: therapyId } });
};
