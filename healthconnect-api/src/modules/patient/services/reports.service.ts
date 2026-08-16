import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { ApiError } from '../../../utils/apiError';
import { getPatient, prisma } from './_shared';

const uploadToStorage = async (file: Express.Multer.File, folder: string) => {
  const ext = path.extname(file.originalname);
  const fileId = crypto.randomUUID();
  const baseDir = process.env.UPLOAD_DIR || '/var/www/healthconnect/uploads';
  const dir = `${baseDir}/${folder}`;

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filePath = `${dir}/${fileId}${ext}`;
  fs.writeFileSync(filePath, file.buffer);

  const publicBase = process.env.FILE_PUBLIC_URL || 'https://api.healthconnect.sbs/files';
  return {
    url: `${publicBase}/${folder}/${fileId}${ext}`,
    key: `${folder}/${fileId}${ext}`,
    size: file.size,
    mimeType: file.mimetype,
  };
};

export const getReports = async (
  userId: string,
  params: { type?: string; page?: number; limit?: number; search?: string },
) => {
  const patient = await getPatient(userId);
  const { type, page = 1, limit = 20, search } = params;
  const skip = (page - 1) * limit;

  const where: any = { patientId: patient.id };
  if (type) where.type = type;
  if (search) where.name = { contains: search, mode: 'insensitive' };

  const [reports, total] = await Promise.all([
    prisma.medicalReport.findMany({
      where,
      orderBy: { reportDate: 'desc' },
      skip,
      take: limit,
      include: {
        shares: {
          include: { doctor: { select: { firstName: true, lastName: true, specialization: true } } },
        },
      },
    }),
    prisma.medicalReport.count({ where }),
  ]);

  const byType = await prisma.medicalReport.groupBy({
    by: ['type'],
    where: { patientId: patient.id },
    _count: { type: true },
  });

  return {
    reports,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    summary: byType.map(group => ({ type: group.type, count: group._count.type })),
  };
};

export const uploadReport = async (
  userId: string,
  file: Express.Multer.File,
  data: { name: string; type?: string; description?: string; reportDate?: string },
) => {
  const patient = await getPatient(userId);
  const uploaded = await uploadToStorage(file, `reports/${patient.id}`);

  return prisma.medicalReport.create({
    data: {
      patientId: patient.id,
      name: data.name,
      type: (data.type as any) || 'OTHER',
      fileUrl: uploaded.url,
      fileSize: uploaded.size,
      mimeType: uploaded.mimeType,
      uploadedBy: userId,
      description: data.description,
      reportDate: data.reportDate ? new Date(data.reportDate) : undefined,
      isEncrypted: true,
    },
  });
};

export const deleteReport = async (userId: string, reportId: string) => {
  const patient = await getPatient(userId);
  const report = await prisma.medicalReport.findFirst({ where: { id: reportId, patientId: patient.id } });
  if (!report) throw ApiError.notFound('Report not found');
  await prisma.medicalReport.delete({ where: { id: reportId } });
};

export const shareReport = async (
  userId: string,
  reportId: string,
  data: { doctorId: string; expiresInDays?: number },
) => {
  const patient = await getPatient(userId);
  const report = await prisma.medicalReport.findFirst({ where: { id: reportId, patientId: patient.id } });
  if (!report) throw ApiError.notFound('Report not found');

  const doctor = await prisma.doctorProfile.findUnique({ where: { id: data.doctorId } });
  if (!doctor) throw ApiError.notFound('Doctor not found');

  const expiresAt = data.expiresInDays
    ? new Date(Date.now() + data.expiresInDays * 86400000)
    : new Date(Date.now() + 7 * 86400000);

  return prisma.reportShare.upsert({
    where: { reportId_doctorId: { reportId, doctorId: data.doctorId } },
    create: { reportId, doctorId: data.doctorId, expiresAt },
    update: { expiresAt },
    include: { doctor: { select: { firstName: true, lastName: true, specialization: true } } },
  });
};

export const revokeReportShare = async (userId: string, reportId: string, doctorId: string) => {
  const patient = await getPatient(userId);
  const report = await prisma.medicalReport.findFirst({ where: { id: reportId, patientId: patient.id } });
  if (!report) throw ApiError.notFound('Report not found');
  await prisma.reportShare.deleteMany({ where: { reportId, doctorId } });
};
