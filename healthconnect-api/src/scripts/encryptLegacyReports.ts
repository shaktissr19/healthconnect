import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MAGIC = Buffer.from('HCENC1');
const PRIVATE_SCHEME = 'hc-private://';
const IV_LENGTH = 12;

const commit = process.argv.includes('--commit');
const uploadDir = path.resolve(process.env.UPLOAD_DIR || '/var/www/healthconnect/uploads');
const publicBase = (process.env.FILE_PUBLIC_URL || 'https://api.healthconnect.sbs/files').replace(/\/$/, '');

const key = () => {
  const raw = process.env.REPORT_ENCRYPTION_KEY?.trim();
  if (!raw) throw new Error('REPORT_ENCRYPTION_KEY is required');
  const decoded = /^[a-fA-F0-9]{64}$/.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (decoded.length !== 32) throw new Error('REPORT_ENCRYPTION_KEY must decode to exactly 32 bytes');
  return decoded;
};

const safePath = (relative: string) => {
  const resolved = path.resolve(uploadDir, relative);
  if (!resolved.startsWith(`${uploadDir}${path.sep}`)) throw new Error(`Unsafe file path: ${relative}`);
  return resolved;
};

const encrypt = (plain: Buffer) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([MAGIC, iv, cipher.getAuthTag(), ciphertext]);
};

async function main() {
  const reports = await prisma.medicalReport.findMany({
    where: { fileUrl: { startsWith: `${publicBase}/` } },
    select: { id: true, patientId: true, fileUrl: true, name: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Legacy plaintext reports found: ${reports.length}`);
  console.log(commit ? 'MODE: COMMIT' : 'MODE: DRY RUN (use --commit to write changes)');

  let migrated = 0;
  let missing = 0;
  let failed = 0;

  for (const report of reports) {
    try {
      const relative = decodeURIComponent(report.fileUrl.slice(publicBase.length + 1));
      const sourcePath = safePath(relative);
      if (!fs.existsSync(sourcePath)) {
        missing += 1;
        console.warn(`[MISSING] ${report.id} ${sourcePath}`);
        continue;
      }

      const source = fs.readFileSync(sourcePath);
      const baseName = path.basename(relative);
      const targetRelative = `reports/${report.patientId}/${baseName}.enc`;
      const targetPath = safePath(targetRelative);
      const storageKey = `${PRIVATE_SCHEME}${targetRelative}`;

      console.log(`[PLAN] ${report.id} ${report.name}: ${relative} -> ${targetRelative}`);
      if (!commit) continue;

      fs.mkdirSync(path.dirname(targetPath), { recursive: true, mode: 0o700 });
      const temporaryPath = `${targetPath}.tmp-${process.pid}`;
      fs.writeFileSync(temporaryPath, encrypt(source), { flag: 'wx', mode: 0o600 });

      try {
        await prisma.medicalReport.update({
          where: { id: report.id },
          data: { fileUrl: storageKey, isEncrypted: true },
        });
        fs.renameSync(temporaryPath, targetPath);
        // Delete the plaintext only after both DB update and encrypted-file move succeed.
        fs.unlinkSync(sourcePath);
        migrated += 1;
        console.log(`[OK] ${report.id}`);
      } catch (error) {
        if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
        // If DB changed but the final file move failed, restore the old DB pointer.
        await prisma.medicalReport.update({
          where: { id: report.id },
          data: { fileUrl: report.fileUrl, isEncrypted: false },
        }).catch(() => undefined);
        throw error;
      }
    } catch (error: any) {
      failed += 1;
      console.error(`[FAILED] ${report.id}: ${error?.message || error}`);
    }
  }

  console.log(`Summary: migrated=${migrated}, missing=${missing}, failed=${failed}, total=${reports.length}`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
