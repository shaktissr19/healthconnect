import { ApiError } from '../../../utils/apiError';
import { getPatient, prisma } from './_shared';

export const getSymptoms = async (
  userId: string,
  params: { page?: number; limit?: number; from?: string; to?: string; search?: string },
) => {
  const patient = await getPatient(userId);
  const { page = 1, limit = 20, from, to, search } = params;
  const skip = (page - 1) * limit;

  const where: any = { patientId: patient.id };
  if (from || to) {
    where.loggedAt = {};
    if (from) where.loggedAt.gte = new Date(from);
    if (to) where.loggedAt.lte = new Date(to);
  }
  if (search) where.name = { contains: search, mode: 'insensitive' };

  const [symptoms, total] = await Promise.all([
    prisma.symptomLog.findMany({ where, orderBy: { loggedAt: 'desc' }, skip, take: limit }),
    prisma.symptomLog.count({ where }),
  ]);

  const day30 = new Date(Date.now() - 30 * 86400000);
  const trendData = await prisma.symptomLog.findMany({
    where: { patientId: patient.id, loggedAt: { gte: day30 } },
    select: { loggedAt: true, severity: true, name: true },
    orderBy: { loggedAt: 'asc' },
  });

  const trendByDate: Record<string, { severities: number[]; symptoms: string[] }> = {};
  trendData.forEach(symptom => {
    const dateKey = symptom.loggedAt.toISOString().split('T')[0];
    if (!trendByDate[dateKey]) trendByDate[dateKey] = { severities: [], symptoms: [] };
    trendByDate[dateKey].severities.push(symptom.severity);
    trendByDate[dateKey].symptoms.push(symptom.name);
  });

  const trend = Object.entries(trendByDate).map(([date, data]) => ({
    date,
    avgSeverity: Math.round((data.severities.reduce((a, b) => a + b, 0) / data.severities.length) * 10) / 10,
    count: data.severities.length,
    symptoms: [...new Set(data.symptoms)],
  }));

  return { symptoms, total, page, totalPages: Math.ceil(total / limit), trend };
};

export const logSymptom = async (userId: string, data: {
  name: string;
  severity: number;
  loggedAt?: string;
  triggers?: string[];
  notes?: string;
}) => {
  const patient = await getPatient(userId);

  if (data.severity < 1 || data.severity > 10) {
    throw ApiError.badRequest('INVALID_SEVERITY', 'Severity must be between 1 and 10');
  }

  return prisma.symptomLog.create({
    data: {
      patientId: patient.id,
      name: data.name,
      severity: data.severity,
      loggedAt: data.loggedAt ? new Date(data.loggedAt) : new Date(),
      triggers: data.triggers || [],
      notes: data.notes,
    },
  });
};

export const updateSymptom = async (
  userId: string,
  symptomId: string,
  data: Partial<{ name: string; severity: number; resolvedAt: string; triggers: string[]; notes: string }>,
) => {
  const patient = await getPatient(userId);
  const symptom = await prisma.symptomLog.findFirst({ where: { id: symptomId, patientId: patient.id } });
  if (!symptom) throw ApiError.notFound('Symptom log not found');

  return prisma.symptomLog.update({
    where: { id: symptomId },
    data: { ...data, resolvedAt: data.resolvedAt ? new Date(data.resolvedAt) : undefined },
  });
};

export const deleteSymptom = async (userId: string, symptomId: string) => {
  const patient = await getPatient(userId);
  const symptom = await prisma.symptomLog.findFirst({ where: { id: symptomId, patientId: patient.id } });
  if (!symptom) throw ApiError.notFound('Symptom log not found');
  await prisma.symptomLog.delete({ where: { id: symptomId } });
};
