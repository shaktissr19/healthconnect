import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { ApiError } from '../utils/apiError';

const PRIVATE_SCHEME = 'hc-private://';
const MAGIC = Buffer.from('HCENC1', 'ascii');
const IV_BYTES = 12;
const TAG_BYTES = 16;

const privateStorageBaseDir = () => path.resolve(process.env.PRIVATE_UPLOAD_DIR || '/var/www/healthconnect/private-uploads');
const legacyStorageBaseDir = () => path.resolve(process.env.UPLOAD_DIR || '/var/www/healthconnect/uploads');
const legacyPublicBase = () => (process.env.FILE_PUBLIC_URL || 'https://api.healthconnect.sbs/files').replace(/\/$/, '');

const resolveUnder = (baseDir: string, relative: string) => {
  const base = path.resolve(baseDir);
  const resolved = path.resolve(base, relative);
  if (resolved !== base && !resolved.startsWith(`${base}${path.sep}`)) {
    throw ApiError.badRequest('INVALID_REPORT_PATH', 'Invalid report storage path');
  }
  return resolved;
};

const encryptionKey = () => {
  const raw = process.env.REPORT_ENCRYPTION_KEY?.trim();
  if (!raw) throw new ApiError(503, 'REPORT_ENCRYPTION_NOT_CONFIGURED', 'Secure medical-report storage is temporarily unavailable.');
  const key = /^[a-f0-9]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new ApiError(503, 'REPORT_ENCRYPTION_KEY_INVALID', 'Secure medical-report storage is not configured correctly.');
  return key;
};

const decrypt = (encrypted: Buffer) => {
  const minimum = MAGIC.length + IV_BYTES + TAG_BYTES + 1;
  if (encrypted.length < minimum || !encrypted.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new ApiError(500, 'REPORT_DECRYPTION_FAILED', 'Stored report has an invalid encrypted format.');
  }
  const ivStart = MAGIC.length;
  const tagStart = ivStart + IV_BYTES;
  const dataStart = tagStart + TAG_BYTES;
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), encrypted.subarray(ivStart, tagStart));
    decipher.setAuthTag(encrypted.subarray(tagStart, dataStart));
    return Buffer.concat([decipher.update(encrypted.subarray(dataStart)), decipher.final()]);
  } catch {
    throw new ApiError(500, 'REPORT_DECRYPTION_FAILED', 'Stored report could not be decrypted.');
  }
};

export const readReportBuffer = (locator: string) => {
  if (locator.startsWith(PRIVATE_SCHEME)) {
    const relative = decodeURIComponent(locator.slice(PRIVATE_SCHEME.length));
    const filePath = resolveUnder(privateStorageBaseDir(), relative);
    if (!fs.existsSync(filePath)) throw ApiError.notFound('Stored report file not found');
    return decrypt(fs.readFileSync(filePath));
  }

  // Transitional read for reports uploaded before private encrypted storage.
  const publicBase = legacyPublicBase();
  if (locator.startsWith(`${publicBase}/`)) {
    const relative = decodeURIComponent(locator.slice(publicBase.length + 1));
    const filePath = resolveUnder(legacyStorageBaseDir(), relative);
    if (!fs.existsSync(filePath)) throw ApiError.notFound('Stored report file not found');
    return fs.readFileSync(filePath);
  }

  throw ApiError.notFound('Stored report file not found');
};

export const safeReportFileName = (name: string, mimeType?: string | null) => {
  const extensions: Record<string, string> = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
  };
  const clean = (name || 'medical-report').replace(/[\r\n"\\/]/g, '_').slice(0, 140) || 'medical-report';
  const extension = mimeType ? extensions[mimeType] : undefined;
  return extension && !clean.toLowerCase().endsWith(extension) ? `${clean}${extension}` : clean;
};
