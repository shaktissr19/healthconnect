import { ApiError } from '../../../utils/apiError';
import { getPatient, prisma } from './_shared';

export const getMedicalHistory = async (userId: string) => {
  const patient = await getPatient(userId);
  const patientId = patient.id;

  const [conditions, allergies, surgeries, vaccinations, familyHistory, hospitalizationHistory] = await Promise.all([
    prisma.condition.findMany({
      where: { patientId },
      orderBy: [{ status: 'asc' }, { diagnosedDate: 'desc' }],
    }),
    prisma.allergy.findMany({
      where: { patientId },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.surgery.findMany({ where: { patientId }, orderBy: { surgeryDate: 'desc' } }),
    prisma.vaccination.findMany({ where: { patientId }, orderBy: { dateAdministered: 'desc' } }),
    prisma.familyHistory.findMany({ where: { patientId }, orderBy: { createdAt: 'desc' } }),
    prisma.hospitalizationHistory.findMany({ where: { patientId }, orderBy: { admissionDate: 'desc' } }),
  ]);

  return { conditions, allergies, surgeries, vaccinations, familyHistory, hospitalizationHistory };
};

export const addCondition = async (userId: string, data: {
  name: string;
  icdCode?: string;
  status?: string;
  diagnosedDate?: string;
  diagnosedBy?: string;
  managingDoctor?: string;
  notes?: string;
}) => {
  const patient = await getPatient(userId);
  return prisma.condition.create({
    data: {
      patientId: patient.id,
      name: data.name,
      icdCode: data.icdCode,
      status: (data.status as any) || 'ACTIVE',
      diagnosedDate: data.diagnosedDate ? new Date(data.diagnosedDate) : undefined,
      diagnosedBy: data.diagnosedBy,
      managingDoctor: data.managingDoctor,
      notes: data.notes,
    },
  });
};

export const updateCondition = async (
  userId: string,
  conditionId: string,
  data: Partial<{
    name: string;
    icdCode: string;
    status: string;
    diagnosedDate: string;
    resolvedDate: string;
    diagnosedBy: string;
    managingDoctor: string;
    notes: string;
  }>,
) => {
  const patient = await getPatient(userId);
  const condition = await prisma.condition.findFirst({ where: { id: conditionId, patientId: patient.id } });
  if (!condition) throw ApiError.notFound('Condition not found');

  return prisma.condition.update({
    where: { id: conditionId },
    data: {
      ...data,
      status: data.status as any,
      diagnosedDate: data.diagnosedDate ? new Date(data.diagnosedDate) : undefined,
      resolvedDate: data.resolvedDate ? new Date(data.resolvedDate) : undefined,
    },
  });
};

export const deleteCondition = async (userId: string, conditionId: string) => {
  const patient = await getPatient(userId);
  const condition = await prisma.condition.findFirst({ where: { id: conditionId, patientId: patient.id } });
  if (!condition) throw ApiError.notFound('Condition not found');
  await prisma.condition.delete({ where: { id: conditionId } });
};

export const addAllergy = async (userId: string, data: {
  allergen: string;
  category?: string;
  severity?: string;
  reaction?: string;
  diagnosedDate?: string;
  notes?: string;
}) => {
  const patient = await getPatient(userId);
  return prisma.allergy.create({
    data: {
      patientId: patient.id,
      allergen: data.allergen,
      category: (data.category as any) || 'OTHER',
      severity: (data.severity as any) || 'MILD',
      reaction: data.reaction,
      diagnosedDate: data.diagnosedDate ? new Date(data.diagnosedDate) : undefined,
      notes: data.notes,
    },
  });
};

export const updateAllergy = async (
  userId: string,
  allergyId: string,
  data: Partial<{ allergen: string; category: string; severity: string; reaction: string; notes: string }>,
) => {
  const patient = await getPatient(userId);
  const allergy = await prisma.allergy.findFirst({ where: { id: allergyId, patientId: patient.id } });
  if (!allergy) throw ApiError.notFound('Allergy not found');
  return prisma.allergy.update({
    where: { id: allergyId },
    data: { ...data, category: data.category as any, severity: data.severity as any },
  });
};

export const deleteAllergy = async (userId: string, allergyId: string) => {
  const patient = await getPatient(userId);
  const allergy = await prisma.allergy.findFirst({ where: { id: allergyId, patientId: patient.id } });
  if (!allergy) throw ApiError.notFound('Allergy not found');
  await prisma.allergy.delete({ where: { id: allergyId } });
};

export const addSurgery = async (userId: string, data: {
  procedureName: string;
  surgeryDate: string;
  hospital?: string;
  surgeon?: string;
  outcome?: string;
  complications?: string;
  notes?: string;
}) => {
  const patient = await getPatient(userId);
  return prisma.surgery.create({
    data: { patientId: patient.id, ...data, surgeryDate: new Date(data.surgeryDate) },
  });
};

export const deleteSurgery = async (userId: string, surgeryId: string) => {
  const patient = await getPatient(userId);
  const surgery = await prisma.surgery.findFirst({ where: { id: surgeryId, patientId: patient.id } });
  if (!surgery) throw ApiError.notFound('Surgery record not found');
  await prisma.surgery.delete({ where: { id: surgeryId } });
};

export const addVaccination = async (userId: string, data: {
  vaccineName: string;
  dateAdministered: string;
  doseNumber?: number;
  totalDoses?: number;
  nextDueDate?: string;
  administrator?: string;
  batchNumber?: string;
  sideEffects?: string;
  notes?: string;
}) => {
  const patient = await getPatient(userId);
  return prisma.vaccination.create({
    data: {
      patientId: patient.id,
      ...data,
      dateAdministered: new Date(data.dateAdministered),
      nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : undefined,
    },
  });
};

export const deleteVaccination = async (userId: string, vaccinationId: string) => {
  const patient = await getPatient(userId);
  const vaccination = await prisma.vaccination.findFirst({ where: { id: vaccinationId, patientId: patient.id } });
  if (!vaccination) throw ApiError.notFound('Vaccination record not found');
  await prisma.vaccination.delete({ where: { id: vaccinationId } });
};

export const addFamilyHistory = async (userId: string, data: {
  relation: string;
  conditionName: string;
  ageOfOnset?: number;
  status?: string;
  causeOfDeath?: string;
  notes?: string;
}) => {
  const patient = await getPatient(userId);
  return prisma.familyHistory.create({ data: { patientId: patient.id, ...data } });
};

export const deleteFamilyHistory = async (userId: string, historyId: string) => {
  const patient = await getPatient(userId);
  const entry = await prisma.familyHistory.findFirst({ where: { id: historyId, patientId: patient.id } });
  if (!entry) throw ApiError.notFound('Family history record not found');
  await prisma.familyHistory.delete({ where: { id: historyId } });
};

export const addHospitalizationHistory = async (userId: string, data: {
  hospitalName: string;
  admissionDate: string;
  dischargeDate?: string;
  reason?: string;
  diagnosis?: string;
  treatingDoctor?: string;
  notes?: string;
}) => {
  const patient = await getPatient(userId);
  return prisma.hospitalizationHistory.create({
    data: {
      patientId: patient.id,
      ...data,
      admissionDate: new Date(data.admissionDate),
      dischargeDate: data.dischargeDate ? new Date(data.dischargeDate) : undefined,
    },
  });
};

export const deleteHospitalizationHistory = async (userId: string, historyId: string) => {
  const patient = await getPatient(userId);
  const entry = await prisma.hospitalizationHistory.findFirst({ where: { id: historyId, patientId: patient.id } });
  if (!entry) throw ApiError.notFound('Hospitalization record not found');
  await prisma.hospitalizationHistory.delete({ where: { id: historyId } });
};
