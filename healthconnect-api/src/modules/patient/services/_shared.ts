import { PrismaClient } from '@prisma/client';
import { ApiError } from '../../../utils/apiError';

// One Prisma client shared by all Patient sub-services.
export const prisma = new PrismaClient();

// Resolve the authenticated user's PatientProfile once at each service boundary.
export const getPatient = async (userId: string) => {
  const patient = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!patient) throw ApiError.notFound('Patient profile not found');
  return patient;
};
