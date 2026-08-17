import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { ApiError } from '../../../utils/apiError';
import { getPatient, prisma } from './_shared';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const normalizeReportType = (value?: string) => {
  const type = String(value ?? 'OTHER').toUpperCase();
  if (['LAB', 'SCAN', 'PRESCRIPTION', 'DISCHARGE', 'VACCINATION', 'INSURANCE', 'OTHER'].includes(type)) return type;
  if (type === 'IMAGING') return 'SCAN';
  return 'OTHER';
};

const uploadToStorage = async (file: Express.Multer.File, folder: string) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw ApiError.badRequest('UNSUPPORTED_FILE_TYPE', 'Upload a PDF, JPEG, PNG or WebP medical document');
  }

  const safeExtByMime: Record<string, string> = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  };
  const ext = safeExtByMime[file.mimetype] ?? path.extname(file.originalname).toLowerCase();
  const fileId = crypto.randomUUID();
  const baseDir = process.env.UPLOAD_DIR || '/var/www/healthconnect/uploads';
  const dir = `${baseDir}/${folder}`;

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true, mode: 0o750 });

  const filePath = `${dir}/${fileId}${ext}`;
  fs.writeFileSync(filePath, file.buffer, { mode: 0o640 });

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
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: any = { patientId: patient.id };
  if (params.type) where.type = normalizeReportType(params.type);
  if (params.search) where.name = { contains: params.search.trim(), mode: 'insensitive' };

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
  const summary = Object.fromEntries(byType.map(group => [group.type, group._count.type]));

  return {
    reports,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    summary,
  };
};

export const uploadReport = async (
  userId: string,
  file: Express.Multer.File,
  data: { name: string; type?: string; description?: string; reportDate?: string },
) => {
  const patient = await getPatient(userId);
  const name = data.name?.trim() || path.parse(file.originalname).name;
  if (!name) throw ApiError.badRequest('REPORT_NAME_REQUIRED', 'Report name is required');
  if (name.length > 250) throw ApiError.badRequest('REPORT_NAME_TOO_LONG', 'Report name is too long');

  const reportDate = data.reportDate ? new Date(data.reportDate) : new Date();
  if (Number.isNaN(reportDate.getTime())) throw ApiError.badRequest('INVALID_REPORT_DATE', 'Use a valid report date');
  if (reportDate.getTime() > Date.now() + 5 * 60 * 1000) {
    throw ApiError.badRequest('FUTURE_REPORT_DATE', 'Report date cannot be in the future');
  }

  const uploaded = await uploadToStorage(file, `reports/${patient.id}`);

  return prisma.medicalReport.create({
    data: {
      patientId: patient.id,
      name,
      type: normalizeReportType(data.type) as any,
      fileUrl: uploaded.url,
      fileSize: uploaded.size,
      mimeType: uploaded.mimeType,
      uploadedBy: userId,
      description: data.description?.trim(),
      reportDate,
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
  data: { doctorId: string; expiresInDays?: number; expiresAt?: string },
) => {
  const patient = await getPatient(userId);
  const report = await prisma.medicalReport.findFirst({ where: { id: reportId, patientId: patient.id } });
  if (!report) throw ApiError.notFound('Report not found');

  const doctor = await prisma.doctorProfile.findUnique({ where: { id: data.doctorId } });
  if (!doctor) throw ApiError.notFound('Doctor not found');

  let expiresAt: Date;
  if (data.expiresAt) {
    expiresAt = new Date(data.expiresAt);
  } else {
    const days = Math.min(365, Math.max(1, data.expiresInDays ?? 7));
    expiresAt = new Date(Date.now() + days * 86400000);
  }
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    throw ApiError.badRequest('INVALID_SHARE_EXPIRY', 'Share expiry must be in the future');
  }

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
