import { ApiError } from '../../../utils/apiError';
import { getPatient, prisma } from './_shared';

const asDate = (value?: string | null) => (value ? new Date(value) : undefined);
const normalizedConditionStatus = (status?: string) => {
  if (!status) return undefined;
  // The current UI historically exposed MANAGED while the persisted enum uses ACTIVE/CHRONIC/RESOLVED/IN_REMISSION.
  // Treat MANAGED as ACTIVE rather than failing the request; the UI will be migrated to the canonical enum separately.
  return status === 'MANAGED' ? 'ACTIVE' : status;
};

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

  // Keep canonical database fields AND provide the legacy UI aliases used by MedicalHistoryTab.
  // This is deliberately additive so doctor/admin consumers of the canonical contract do not break.
  return {
    conditions: conditions.map((item) => ({
      ...item,
      treatingDoctor: item.managingDoctor,
    })),
    allergies,
    surgeries: surgeries.map((item) => ({
      ...item,
      name: item.procedureName,
    })),
    vaccinations: vaccinations.map((item) => ({
      ...item,
      administeredDate: item.dateAdministered,
      administeredBy: item.administrator,
    })),
    familyHistory: familyHistory.map((item) => ({
      ...item,
      condition: item.conditionName,
      livingStatus: item.status,
    })),
    hospitalizationHistory,
  };
};

export const addCondition = async (userId: string, data: {
  name: string;
  icdCode?: string;
  status?: string;
  diagnosedDate?: string;
  resolvedDate?: string;
  diagnosedBy?: string;
  managingDoctor?: string;
  treatingDoctor?: string;
  notes?: string;
}) => {
  const patient = await getPatient(userId);
  return prisma.condition.create({
    data: {
      patientId: patient.id,
      name: data.name,
      icdCode: data.icdCode,
      status: (normalizedConditionStatus(data.status) as any) || 'ACTIVE',
      diagnosedDate: asDate(data.diagnosedDate),
      resolvedDate: asDate(data.resolvedDate),
      diagnosedBy: data.diagnosedBy,
      managingDoctor: data.managingDoctor ?? data.treatingDoctor,
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
    treatingDoctor: string;
    notes: string;
  }>,
) => {
  const patient = await getPatient(userId);
  const condition = await prisma.condition.findFirst({ where: { id: conditionId, patientId: patient.id } });
  if (!condition) throw ApiError.notFound('Condition not found');

  const { treatingDoctor, ...rest } = data;
  return prisma.condition.update({
    where: { id: conditionId },
    data: {
      ...rest,
      status: normalizedConditionStatus(data.status) as any,
      diagnosedDate: data.diagnosedDate ? new Date(data.diagnosedDate) : undefined,
      resolvedDate: data.resolvedDate ? new Date(data.resolvedDate) : undefined,
      managingDoctor: data.managingDoctor ?? treatingDoctor,
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
      diagnosedDate: asDate(data.diagnosedDate),
      notes: data.notes,
    },
  });
};

export const updateAllergy = async (
  userId: string,
  allergyId: string,
  data: Partial<{ allergen: string; category: string; severity: string; reaction: string; diagnosedDate: string; notes: string }>,
) => {
  const patient = await getPatient(userId);
  const allergy = await prisma.allergy.findFirst({ where: { id: allergyId, patientId: patient.id } });
  if (!allergy) throw ApiError.notFound('Allergy not found');
  return prisma.allergy.update({
    where: { id: allergyId },
    data: {
      ...data,
      category: data.category as any,
      severity: data.severity as any,
      diagnosedDate: data.diagnosedDate ? new Date(data.diagnosedDate) : undefined,
    },
  });
};

export const deleteAllergy = async (userId: string, allergyId: string) => {
  const patient = await getPatient(userId);
  const allergy = await prisma.allergy.findFirst({ where: { id: allergyId, patientId: patient.id } });
  if (!allergy) throw ApiError.notFound('Allergy not found');
  await prisma.allergy.delete({ where: { id: allergyId } });
};

export const addSurgery = async (userId: string, data: {
  procedureName?: string;
  name?: string;
  surgeryDate: string;
  hospital?: string;
  surgeon?: string;
  outcome?: string;
  complications?: string;
  notes?: string;
}) => {
  const patient = await getPatient(userId);
  const procedureName = data.procedureName ?? data.name;
  if (!procedureName) throw ApiError.validationError?.('Procedure name is required') ?? new Error('Procedure name is required');
  return prisma.surgery.create({
    data: {
      patientId: patient.id,
      procedureName,
      surgeryDate: new Date(data.surgeryDate),
      hospital: data.hospital,
      surgeon: data.surgeon,
      outcome: data.outcome,
      complications: data.complications,
      notes: data.notes,
    },
  });
};

export const updateSurgery = async (
  userId: string,
  surgeryId: string,
  data: Partial<{
    procedureName: string;
    name: string;
    surgeryDate: string;
    hospital: string;
    surgeon: string;
    outcome: string;
    complications: string;
    notes: string;
  }>,
) => {
  const patient = await getPatient(userId);
  const surgery = await prisma.surgery.findFirst({ where: { id: surgeryId, patientId: patient.id } });
  if (!surgery) throw ApiError.notFound('Surgery record not found');
  const { name, procedureName, surgeryDate, ...rest } = data;
  return prisma.surgery.update({
    where: { id: surgeryId },
    data: {
      ...rest,
      procedureName: procedureName ?? name,
      surgeryDate: surgeryDate ? new Date(surgeryDate) : undefined,
    },
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
  dateAdministered?: string;
  administeredDate?: string;
  doseNumber?: number;
  totalDoses?: number;
  nextDueDate?: string;
  administrator?: string;
  administeredBy?: string;
  batchNumber?: string;
  sideEffects?: string;
  notes?: string;
}) => {
  const patient = await getPatient(userId);
  const administered = data.dateAdministered ?? data.administeredDate;
  if (!administered) throw new Error('Vaccination date is required');
  return prisma.vaccination.create({
    data: {
      patientId: patient.id,
      vaccineName: data.vaccineName,
      dateAdministered: new Date(administered),
      doseNumber: data.doseNumber,
      totalDoses: data.totalDoses,
      nextDueDate: asDate(data.nextDueDate),
      administrator: data.administrator ?? data.administeredBy,
      batchNumber: data.batchNumber,
      sideEffects: data.sideEffects,
      notes: data.notes,
    },
  });
};

export const updateVaccination = async (
  userId: string,
  vaccinationId: string,
  data: Partial<{
    vaccineName: string;
    dateAdministered: string;
    administeredDate: string;
    doseNumber: number;
    totalDoses: number;
    nextDueDate: string;
    administrator: string;
    administeredBy: string;
    batchNumber: string;
    sideEffects: string;
    notes: string;
  }>,
) => {
  const patient = await getPatient(userId);
  const vaccination = await prisma.vaccination.findFirst({ where: { id: vaccinationId, patientId: patient.id } });
  if (!vaccination) throw ApiError.notFound('Vaccination record not found');
  const { administeredDate, administeredBy, dateAdministered, administrator, nextDueDate, ...rest } = data;
  const administered = dateAdministered ?? administeredDate;
  return prisma.vaccination.update({
    where: { id: vaccinationId },
    data: {
      ...rest,
      dateAdministered: administered ? new Date(administered) : undefined,
      nextDueDate: nextDueDate ? new Date(nextDueDate) : undefined,
      administrator: administrator ?? administeredBy,
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
  conditionName?: string;
  condition?: string;
  ageOfOnset?: number;
  status?: string;
  livingStatus?: string;
  causeOfDeath?: string;
  notes?: string;
}) => {
  const patient = await getPatient(userId);
  const conditionName = data.conditionName ?? data.condition;
  if (!conditionName) throw new Error('Condition name is required');
  return prisma.familyHistory.create({
    data: {
      patientId: patient.id,
      relation: data.relation,
      conditionName,
      ageOfOnset: data.ageOfOnset,
      status: data.status ?? data.livingStatus,
      causeOfDeath: data.causeOfDeath,
      notes: data.notes,
    },
  });
};

export const updateFamilyHistory = async (
  userId: string,
  historyId: string,
  data: Partial<{
    relation: string;
    conditionName: string;
    condition: string;
    ageOfOnset: number;
    status: string;
    livingStatus: string;
    causeOfDeath: string;
    notes: string;
  }>,
) => {
  const patient = await getPatient(userId);
  const entry = await prisma.familyHistory.findFirst({ where: { id: historyId, patientId: patient.id } });
  if (!entry) throw ApiError.notFound('Family history record not found');
  const { condition, conditionName, livingStatus, status, ...rest } = data;
  return prisma.familyHistory.update({
    where: { id: historyId },
    data: {
      ...rest,
      conditionName: conditionName ?? condition,
      status: status ?? livingStatus,
    },
  });
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
      hospitalName: data.hospitalName,
      admissionDate: new Date(data.admissionDate),
      dischargeDate: asDate(data.dischargeDate),
      reason: data.reason,
      diagnosis: data.diagnosis,
      treatingDoctor: data.treatingDoctor,
      notes: data.notes,
    },
  });
};

export const updateHospitalizationHistory = async (
  userId: string,
  historyId: string,
  data: Partial<{
    hospitalName: string;
    admissionDate: string;
    dischargeDate: string;
    reason: string;
    diagnosis: string;
    treatingDoctor: string;
    notes: string;
  }>,
) => {
  const patient = await getPatient(userId);
  const entry = await prisma.hospitalizationHistory.findFirst({ where: { id: historyId, patientId: patient.id } });
  if (!entry) throw ApiError.notFound('Hospitalization record not found');
  const { admissionDate, dischargeDate, ...rest } = data;
  return prisma.hospitalizationHistory.update({
    where: { id: historyId },
    data: {
      ...rest,
      admissionDate: admissionDate ? new Date(admissionDate) : undefined,
      dischargeDate: dischargeDate ? new Date(dischargeDate) : undefined,
    },
  });
};

export const deleteHospitalizationHistory = async (userId: string, historyId: string) => {
  const patient = await getPatient(userId);
  const entry = await prisma.hospitalizationHistory.findFirst({ where: { id: historyId, patientId: patient.id } });
  if (!entry) throw ApiError.notFound('Hospitalization record not found');
  await prisma.hospitalizationHistory.delete({ where: { id: historyId } });
};