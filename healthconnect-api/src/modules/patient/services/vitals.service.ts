import { ApiError } from '../../../utils/apiError';
import { getPatient, prisma } from './_shared';

export const getVitals = async (
  userId: string,
  params: { type?: string; from?: string; to?: string; limit?: number },
) => {
  const patient = await getPatient(userId);
  const { type, from, to, limit = 50 } = params;

  const where: any = { patientId: patient.id };
  if (type) where.type = type;
  if (from || to) {
    where.measuredAt = {};
    if (from) where.measuredAt.gte = new Date(from);
    if (to) where.measuredAt.lte = new Date(to);
  }

  const vitals = await prisma.vital.findMany({
    where,
    orderBy: { measuredAt: 'desc' },
    take: limit,
  });

  const latestByType = await prisma.vital.findMany({
    where: { patientId: patient.id },
    orderBy: { measuredAt: 'desc' },
    distinct: ['type'],
  });

  return { vitals, latestByType };
};

export const logVital = async (userId: string, data: {
  type: string;
  value: string;
  unit: string;
  systolic?: number;
  diastolic?: number;
  measuredAt?: string;
  context?: string;
  notes?: string;
  source?: string;
}) => {
  const patient = await getPatient(userId);
  return prisma.vital.create({
    data: {
      patientId: patient.id,
      type: data.type as any,
      value: data.value,
      unit: data.unit,
      systolic: data.systolic,
      diastolic: data.diastolic,
      measuredAt: data.measuredAt ? new Date(data.measuredAt) : new Date(),
      context: data.context,
      notes: data.notes,
      source: data.source,
    },
  });
};

export const deleteVital = async (userId: string, vitalId: string) => {
  const patient = await getPatient(userId);
  const vital = await prisma.vital.findFirst({ where: { id: vitalId, patientId: patient.id } });
  if (!vital) throw ApiError.notFound('Vital record not found');
  await prisma.vital.delete({ where: { id: vitalId } });
};
