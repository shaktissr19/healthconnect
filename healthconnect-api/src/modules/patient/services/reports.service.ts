import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { ApiError } from '../../../utils/apiError';
import { getPatient, prisma } from './_shared';

const ALLOWED_REPORT_TYPES: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
};

const hasExpectedSignature = (file: Express.Multer.File) => {
  const b = file.buffer;
  if (file.mimetype === 'application/pdf') return b.length >= 5 && b.subarray(0, 5).toString() === '%PDF-';
  if (file.mimetype === 'image/jpeg') return b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (file.mimetype === 'image/png') {
    return b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a;
  }
  return false;
};

const storageBaseDir = () => path.resolve(process.env.UPLOAD_DIR || '/var/www/healthconnect/uploads');
const publicFileBase = () => (process.env.FILE_PUBLIC_URL || 'https://api.healthconnect.sbs/files').replace(/\/$/, '');

const uploadToStorage = async (file: Express.Multer.File, folder: string) => {
  const extension = ALLOWED_REPORT_TYPES[file.mimetype];
  if (!extension || !hasExpectedSignature(file)) {
    throw ApiError.badRequest('INVALID_REPORT_FILE', 'Only valid PDF, JPG and PNG medical reports are allowed');
  }

  const fileId = crypto.randomUUID();
  const baseDir = storageBaseDir();
  const dir = path.resolve(baseDir, folder);
  if (!dir.startsWith(`${baseDir}${path.sep}`) && dir !== baseDir) {
    throw ApiError.badRequest('INVALID_REPORT_PATH', 'Invalid report storage path');
  }

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, `${fileId}${extension}`);
  fs.writeFileSync(filePath, file.buffer, { flag: 'wx' });

  return {
    url: `${publicFileBase()}/${folder}/${fileId}${extension}`,
    localPath: filePath,
    size: file.size,
    mimeType: file.mimetype,
  };
};

const deleteStoredFile = (fileUrl?: string | null) => {
  if (!fileUrl) return;
  const publicBase = publicFileBase();
  if (!fileUrl.startsWith(`${publicBase}/`)) return;

  const relative = decodeURIComponent(fileUrl.slice(publicBase.length + 1));
  const baseDir = storageBaseDir();
  const localPath = path.resolve(baseDir, relative);
  if (!localPath.startsWith(`${baseDir}${path.sep}`)) {
    throw ApiError.badRequest('INVALID_REPORT_PATH', 'Invalid stored report path');
  }

  if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
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

  try {
    return await prisma.medicalReport.create({
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
  } catch (error) {
    if (fs.existsSync(uploaded.localPath)) fs.unlinkSync(uploaded.localPath);
    throw error;
  }
};

export const deleteReport = async (userId: string, reportId: string) => {
  const patient = await getPatient(userId);
  const report = await prisma.medicalReport.findFirst({ where: { id: reportId, patientId: patient.id } });
  if (!report) throw ApiError.notFound('Report not found');

  deleteStoredFile(report.fileUrl);
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
