import { config } from '../config';
import { logger } from '../utils/logger';

const present = (value?: string | null) => Boolean(value && value.trim());

/**
 * Fail fast when a production process would otherwise boot with customer-facing
 * integrations silently disabled. CI/development are intentionally unaffected.
 */
export const assertProductionRuntimeReadiness = () => {
  if (config.env !== 'production') return;

  const missing: string[] = [];

  if (config.email.strictMode && !present(config.email.sendgridApiKey)) {
    missing.push('SENDGRID_API_KEY');
  }

  if (config.auth.requireVerifiedSensitiveActions) {
    if (!present(config.sms.authKey)) missing.push('MSG91_AUTH_KEY');
    if (!present(config.sms.templateId)) missing.push('MSG91_TEMPLATE_ID');
  }

  if (!present(config.storage.reportEncryptionKey)) {
    missing.push('REPORT_ENCRYPTION_KEY');
  }

  // Payments are part of the customer launch contract. Production should not
  // start in a state where checkout can be displayed but the gateway is absent.
  if (!present(config.razorpay.keyId)) missing.push('RAZORPAY_KEY_ID');
  if (!present(config.razorpay.keySecret)) missing.push('RAZORPAY_KEY_SECRET');
  if (!present(config.razorpay.webhookSecret)) missing.push('RAZORPAY_WEBHOOK_SECRET');

  if (missing.length) {
    const unique = [...new Set(missing)];
    throw new Error(
      `Production readiness check failed. Missing required integration configuration: ${unique.join(', ')}`,
    );
  }

  logger.info('Production runtime integration configuration validated');
};
