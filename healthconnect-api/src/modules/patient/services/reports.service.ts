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

const PRIVATE_SCHEME = 'hc-private://';
const ENCRYPTION_MAGIC = Buffer.from('HCENC1', 'ascii');
const GCM_IV_BYTES = 12;
const GCM_TAG_BYTES = 16;

const hasExpectedSignature = (file: Express.Multer.File) => {
  const b = file.buffer;
  if (file.mimetype === 'application/pdf') return b.length >= 5 && b.subarray(0, 5).toString() === '%PDF-';
  if (file.mimetype === 'image/jpeg') return b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (file.mimetype === 'image/png') {
    return b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a;
  }
  return false;
};

const privateStorageBaseDir = () => path.resolve(process.env.PRIVATE_UPLOAD_DIR || '/var/www/healthconnect/private-uploads');
const legacyStorageBaseDir = () => path.resolve(process.env.UPLOAD_DIR || '/var/www/healthconnect/uploads');
const legacyPublicFileBase = () => (process.env.FILE_PUBLIC_URL || 'https://api.healthconnect.sbs/files').replace(/\/$/, '');
const apiPublicBase = () => (process.env.API_PUBLIC_URL || 'https://api.healthconnect.sbs/api/v1').replace(/\/$/, '');

const resolveUnder = (baseDir: string, relative: string) => {
  const resolvedBase = path.resolve(baseDir);
  const resolved = path.resolve(resolvedBase, relative);
  if (resolved !== resolvedBase && !resolved.startsWith(`${resolvedBase}${path.sep}`)) {
    throw ApiError.badRequest('INVALID_REPORT_PATH', 'Invalid report storage path');
  }
  return resolved;
};

const getEncryptionKey = (): Buffer => {
  const raw = process.env.REPORT_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new ApiError(
      503,
      'REPORT_ENCRYPTION_NOT_CONFIGURED',
      'Secure medical-report storage is temporarily unavailable.',
    );
  }

  let key: Buffer;
  if (/^[a-f0-9]{64}$/i.test(raw)) key = Buffer.from(raw, 'hex');
  else {
    try { key = Buffer.from(raw, 'base64'); } catch { key = Buffer.alloc(0); }
  }
  if (key.length !== 32) {
    throw new ApiError(
      503,
      'REPORT_ENCRYPTION_KEY_INVALID',
      'Secure medical-report storage is not configured correctly.',
    );
  }
  return key;
};

const encryptBuffer = (plain: Buffer): Buffer => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(GCM_IV_BYTES);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([ENCRYPTION_MAGIC, iv, tag, ciphertext]);
};

const decryptBuffer = (encrypted: Buffer): Buffer => {
  const minimumLength = ENCRYPTION_MAGIC.length + GCM_IV_BYTES + GCM_TAG_BYTES + 1;
  if (encrypted.length < minimumLength || !encrypted.subarray(0, ENCRYPTION_MAGIC.length).equals(ENCRYPTION_MAGIC)) {
    throw new ApiError(500, 'REPORT_DECRYPTION_FAILED', 'Stored report has an invalid encrypted format.');
  }
  const key = getEncryptionKey();
  const ivStart = ENCRYPTION_MAGIC.length;
  const tagStart = ivStart + GCM_IV_BYTES;
  const dataStart = tagStart + GCM_TAG_BYTES;
  const iv = encrypted.subarray(ivStart, tagStart);
  const tag = encrypted.subarray(tagStart, dataStart);
  const ciphertext = encrypted.subarray(dataStart);
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new ApiError(500, 'REPORT_DECRYPTION_FAILED', 'Stored report could not be decrypted.');
  }
};

const saveEncryptedFile = (file: Express.Multer.File, patientId: string, reportId: string) => {
  const extension = ALLOWED_REPORT_TYPES[file.mimetype];
  if (!extension || !hasExpectedSignature(file)) {
    throw ApiError.badRequest('INVALID_REPORT_FILE', 'Only valid PDF, JPG and PNG medical reports are allowed');
  }

  const relativeDir = path.join('reports', patientId);
  const relativeFile = path.join(relativeDir, `${reportId}.hcenc`);
  const baseDir = privateStorageBaseDir();
  const dir = resolveUnder(baseDir, relativeDir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });

  const filePath = resolveUnder(baseDir, relativeFile);
  const encrypted = encryptBuffer(file.buffer);
  fs.writeFileSync(filePath, encrypted, { flag: 'wx', mode: 0o600 });

  return {
    locator: `${PRIVATE_SCHEME}${relativeFile.split(path.sep).join('/')}`,
    localPath: filePath,
    size: file.size,
    mimeType: file.mimetype,
  };
};

const privatePathFromLocator = (locator: string) => {
  if (!locator.startsWith(PRIVATE_SCHEME)) return null;
  const relative = decodeURIComponent(locator.slice(PRIVATE_SCHEME.length));
  return resolveUnder(privateStorageBaseDir(), relative);
};

const legacyPathFromUrl = (fileUrl: string) => {
  const publicBase = legacyPublicFileBase();
  if (!fileUrl.startsWith(`${publicBase}/`)) return null;
  const relative = decodeURIComponent(fileUrl.slice(publicBase.length + 1));
  return resolveUnder(legacyStorageBaseDir(), relative);
};

const deleteStoredFile = (fileUrl?: string | null) => {
  if (!fileUrl) return;
  const privatePath = privatePathFromLocator(fileUrl);
  const legacyPath = privatePath ? null : legacyPathFromUrl(fileUrl);
  const localPath = privatePath || legacyPath;
  if (localPath && fs.existsSync(localPath)) fs.unlinkSync(localPath);
};

const readStoredFile = (fileUrl: string) => {
  const privatePath = privatePathFromLocator(fileUrl);
  if (privatePath) {
    if (!fs.existsSync(privatePath)) throw ApiError.notFound('Stored report file not found');
    return decryptBuffer(fs.readFileSync(privatePath));
  }

  // Backward-compatible authenticated read for reports uploaded before encrypted
  // private storage was introduced. Production Nginx should no longer expose
  // the legacy /files directory publicly after migration is complete.
  const legacyPath = legacyPathFromUrl(fileUrl);
  if (!legacyPath || !fs.existsSync(legacyPath)) throw ApiError.notFound('Stored report file not found');
  return fs.readFileSync(legacyPath);
};

const sanitizeDownloadName = (name: string, mimeType?: string | null) => {
  const base = (name || 'medical-report').replace(/[\r\n"\\/]/g, '_').slice(0, 140) || 'medical-report';
  const extension = mimeType ? ALLOWED_REPORT_TYPES[mimeType] : undefined;
  if (!extension || base.toLowerCase().endsWith(extension)) return base;
  return `${base}${extension}`;
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
    reports: reports.map(report => ({
      ...report,
      // Expose only an authenticated API endpoint, never the private storage locator.
      fileUrl: `${apiPublicBase()}/patient/reports/${report.id}/file`,
      downloadPath: `/patient/reports/${report.id}/file`,
    })),
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
  const reportId = crypto.randomUUID();
  const uploaded = saveEncryptedFile(file, patient.id, reportId);

  try {
    return await prisma.medicalReport.create({
      data: {
        id: reportId,
        patientId: patient.id,
        name: data.name,
        type: (data.type as any) || 'OTHER',
        fileUrl: uploaded.locator,
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

export const getPatientReportFile = async (userId: string, reportId: string) => {
  const patient = await getPatient(userId);
  const report = await prisma.medicalReport.findFirst({
    where: { id: reportId, patientId: patient.id },
    select: { id: true, name: true, fileUrl: true, mimeType: true, fileSize: true },
  });
  if (!report) throw ApiError.notFound('Report not found');

  const buffer = readStoredFile(report.fileUrl);
  return {
    buffer,
    mimeType: report.mimeType || 'application/octet-stream',
    fileName: sanitizeDownloadName(report.name, report.mimeType),
    fileSize: buffer.length,
  };
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
