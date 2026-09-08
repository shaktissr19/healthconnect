import { config } from '../config';
import { logger } from './logger';

const requiredProductionEnv = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'FRONTEND_URL',
  'COOKIE_DOMAIN',
  'SENDGRID_API_KEY',
  'FROM_EMAIL',
  'MSG91_AUTH_KEY',
  'MSG91_TEMPLATE_ID',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'REPORT_ENCRYPTION_KEY',
] as const;

const isValidReportKey = (raw?: string) => {
  const value = raw?.trim();
  if (!value) return false;
  if (/^[a-f0-9]{64}$/i.test(value)) return true;
  try { return Buffer.from(value, 'base64').length === 32; } catch { return false; }
};

export const assertProductionReadiness = () => {
  if (config.env !== 'production') return;

  const missing = requiredProductionEnv.filter(name => !process.env[name]?.trim());
  const invalid: string[] = [];

  if (process.env.COOKIE_DOMAIN && !process.env.COOKIE_DOMAIN.includes('healthconnect.sbs')) {
    invalid.push('COOKIE_DOMAIN');
  }
  if (!isValidReportKey(process.env.REPORT_ENCRYPTION_KEY)) {
    invalid.push('REPORT_ENCRYPTION_KEY');
  }
  if (process.env.FRONTEND_URL && !/^https:\/\//i.test(process.env.FRONTEND_URL)) {
    invalid.push('FRONTEND_URL');
  }

  const issues = [
    ...(missing.length ? [`missing: ${missing.join(', ')}`] : []),
    ...(invalid.length ? [`invalid: ${Array.from(new Set(invalid)).join(', ')}`] : []),
  ];

  if (!issues.length) {
    logger.info('Production integration configuration validated');
    return;
  }

  const message = `Production readiness check failed (${issues.join('; ')})`;
  if (process.env.ALLOW_INCOMPLETE_PRODUCTION === 'true') {
    logger.warn(`${message}. ALLOW_INCOMPLETE_PRODUCTION=true is set; do not accept real customers in this state.`);
    return;
  }

  throw new Error(message);
};
