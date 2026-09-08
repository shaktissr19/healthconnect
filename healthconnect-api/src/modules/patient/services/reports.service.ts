import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Role } from '@prisma/client';
import { ApiError } from '../../../utils/apiError';
import { config } from '../../../config';
import { getPatient, prisma } from './_shared';

const ALLOWED_REPORT_TYPES: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
};

const PRIVATE_SCHEME = 'hc-private://';
const MAGIC = Buffer.from('HCENC1');
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

const hasExpectedSignature = (file: Express.Multer.File) => {
  const b = file.buffer;
  if (file.mimetype === 'application/pdf') return b.length >= 5 && b.subarray(0, 5).toString() === '%PDF-';
  if (file.mimetype === 'image/jpeg') return b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (file.mimetype === 'image/png') {
    return b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a;
  }
  return false;
};

const storageBaseDir = () => path.resolve(config.storage.uploadDir);
const legacyPublicFileBase = () => (process.env.FILE_PUBLIC_URL || 'https://api.healthconnect.sbs/files').replace(/\/$/, '');

const encryptionKey = () => {
  const raw = config.storage.reportEncryptionKey?.trim();
  if (!raw) {
    throw new ApiError(503, 'REPORT_STORAGE_NOT_CONFIGURED', 'Secure medical-report storage is not configured');
  }

  const key = /^[a-fA-F0-9]{64}$/.test(raw)
    ? Buffer.from(raw, 'hex')
    : Buffer.from(raw, 'base64');

  if (key.length !== 32) {
    throw new ApiError(500, 'REPORT_ENCRYPTION_KEY_INVALID', 'Medical-report encryption key must decode to exactly 32 bytes');
  }
  return key;
};

const safeLocalPath = (relative: string) => {
  const baseDir = storageBaseDir();
  const localPath = path.resolve(baseDir, relative);
  if (!localPath.startsWith(`${baseDir}${path.sep}`)) {
    throw ApiError.badRequest('INVALID_REPORT_PATH', 'Invalid stored report path');
  }
  return localPath;
};

const encrypt = (plain: Buffer) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([MAGIC, iv, tag, ciphertext]);
};

const decrypt = (payload: Buffer) => {
  const minimum = MAGIC.length + IV_LENGTH + TAG_LENGTH + 1;
  if (payload.length < minimum || !payload.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new ApiError(500, 'REPORT_FILE_INVALID', 'Encrypted report file is invalid or corrupted');
  }
  const ivStart = MAGIC.length;
  const tagStart = ivStart + IV_LENGTH;
  const dataStart = tagStart + TAG_LENGTH;
  const iv = payload.subarray(ivStart, tagStart);
  const tag = payload.subarray(tagStart, dataStart);
  const ciphertext = payload.subarray(dataStart);
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new ApiError(500, 'REPORT_DECRYPTION_FAILED', 'Unable to decrypt the medical report');
  }
};

const uploadToPrivateStorage = async (file: Express.Multer.File, folder: string) => {
  const extension = ALLOWED_REPORT_TYPES[file.mimetype];
  if (!extension || !hasExpectedSignature(file)) {
    throw ApiError.badRequest('INVALID_REPORT_FILE', 'Only valid PDF, JPG and PNG medical reports are allowed');
  }

  const fileId = crypto.randomUUID();
  const relative = `${folder}/${fileId}${extension}.enc`;
  const localPath = safeLocalPath(relative);
  const dir = path.dirname(localPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });

  const encrypted = encrypt(file.buffer);
  fs.writeFileSync(localPath, encrypted, { flag: 'wx', mode: 0o600 });

  return {
    storageKey: `${PRIVATE_SCHEME}${relative}`,
    localPath,
    size: file.size,
    mimeType: file.mimetype,
  };
};

const privateRelativeFromUrl = (fileUrl: string) => {
  if (!fileUrl.startsWith(PRIVATE_SCHEME)) return null;
  const relative = fileUrl.slice(PRIVATE_SCHEME.length);
  if (!relative || relative.includes('..')) {
    throw ApiError.badRequest('INVALID_REPORT_PATH', 'Invalid private report storage key');
  }
  return relative;
};

const deleteStoredFile = (fileUrl?: string | null) => {
  if (!fileUrl) return;

  const privateRelative = privateRelativeFromUrl(fileUrl);
  if (privateRelative) {
    const localPath = safeLocalPath(privateRelative);
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    return;
  }

  // Backward compatibility for pre-encryption records. New reports never receive
  // a publicly-addressable file URL.
  const publicBase = legacyPublicFileBase();
  if (!fileUrl.startsWith(`${publicBase}/`)) return;
  const relative = decodeURIComponent(fileUrl.slice(publicBase.length + 1));
  const localPath = safeLocalPath(relative);
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
    // Never expose the private storage key to clients. A report file is accessed
    // only through the authenticated /patient/reports/:id/file endpoint.
    reports: reports.map(report => ({ ...report, fileUrl: `/patient/reports/${report.id}/file` })),
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
  const uploaded = await uploadToPrivateStorage(file, `reports/${patient.id}`);

  try {
    const report = await prisma.medicalReport.create({
      data: {
        patientId: patient.id,
        name: data.name,
        type: (data.type as any) || 'OTHER',
        fileUrl: uploaded.storageKey,
        fileSize: uploaded.size,
        mimeType: uploaded.mimeType,
        uploadedBy: userId,
        description: data.description,
        reportDate: data.reportDate ? new Date(data.reportDate) : undefined,
        isEncrypted: true,
      },
    });
    return { ...report, fileUrl: `/patient/reports/${report.id}/file` };
  } catch (error) {
    if (fs.existsSync(uploaded.localPath)) fs.unlinkSync(uploaded.localPath);
    throw error;
  }
};

export const getReportFile = async (userId: string, role: Role, reportId: string) => {
  const report = await prisma.medicalReport.findUnique({
    where: { id: reportId },
    include: {
      patient: { select: { userId: true } },
      shares: { select: { doctorId: true, expiresAt: true } },
    },
  });
  if (!report) throw ApiError.notFound('Report not found');

  let allowed = role === 'PATIENT' && report.patient.userId === userId;
  if (!allowed && role === 'DOCTOR') {
    const doctor = await prisma.doctorProfile.findUnique({ where: { userId }, select: { id: true } });
    if (doctor) {
      allowed = report.shares.some(
        share => share.doctorId === doctor.id && (!share.expiresAt || new Date(share.expiresAt) > new Date()),
      );
    }
  }
  if (!allowed) {
    throw ApiError.forbidden('REPORT_ACCESS_DENIED', 'You do not have access to this medical report');
  }

  const privateRelative = privateRelativeFromUrl(report.fileUrl);
  if (privateRelative) {
    const localPath = safeLocalPath(privateRelative);
    if (!fs.existsSync(localPath)) throw ApiError.notFound('Stored report file not found');
    const buffer = decrypt(fs.readFileSync(localPath));
    return { buffer, mimeType: report.mimeType || 'application/octet-stream', name: report.name };
  }

  // Legacy plaintext file support is read-only. This lets existing patient data
  // remain accessible while all new uploads are encrypted at rest.
  const publicBase = legacyPublicFileBase();
  if (report.fileUrl.startsWith(`${publicBase}/`)) {
    const relative = decodeURIComponent(report.fileUrl.slice(publicBase.length + 1));
    const localPath = safeLocalPath(relative);
    if (!fs.existsSync(localPath)) throw ApiError.notFound('Stored report file not found');
    return {
      buffer: fs.readFileSync(localPath),
      mimeType: report.mimeType || 'application/octet-stream',
      name: report.name,
    };
  }

  throw new ApiError(500, 'REPORT_STORAGE_INVALID', 'Report storage location is invalid');
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
