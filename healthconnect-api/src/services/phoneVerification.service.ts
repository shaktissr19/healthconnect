import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/apiError';
import { config } from '../config';
import { logger } from '../utils/logger';

const MSG91_BASE = 'https://control.msg91.com/api/v5/otp';
const SEND_COOLDOWN_MS = 60_000;
const SEND_WINDOW_MS = 60 * 60_000;
const MAX_SENDS_PER_WINDOW = 5;

export type PhoneVerificationState = {
  pendingPhone: string | null;
  verifiedPhone: string | null;
  isVerified: boolean;
  verifiedAt: Date | null;
  lastSendAt: Date | null;
  sendWindowStartedAt: Date | null;
  sendCount: number;
  lastVerifyAt: Date | null;
};

const normalizeIndiaPhone = (value: string): string => {
  const digits = String(value || '').replace(/\D/g, '');
  const national = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
  if (!/^[6-9]\d{9}$/.test(national)) {
    throw ApiError.badRequest('INVALID_PHONE', 'Enter a valid 10-digit Indian mobile number');
  }
  return `91${national}`;
};

const masked = (phone: string | null) => {
  if (!phone) return null;
  const national = phone.slice(-10);
  return `+91 ******${national.slice(-4)}`;
};

const getState = async (userId: string): Promise<PhoneVerificationState | null> => {
  const rows = await prisma.$queryRaw<PhoneVerificationState[]>`
    SELECT
      "pendingPhone",
      "verifiedPhone",
      "isVerified",
      "verifiedAt",
      "lastSendAt",
      "sendWindowStartedAt",
      "sendCount",
      "lastVerifyAt"
    FROM "phone_verification_states"
    WHERE "userId" = ${userId}
    LIMIT 1
  `;
  return rows[0] || null;
};

const requireProvider = () => {
  const authKey = config.sms.authKey?.trim();
  const templateId = config.sms.templateId?.trim();
  if (!authKey || !templateId) {
    throw new ApiError(
      503,
      'OTP_PROVIDER_NOT_CONFIGURED',
      'Phone verification is temporarily unavailable. MSG91 production configuration is missing.',
    );
  }
  return { authKey, templateId };
};

const providerJson = async (url: URL, authKey: string) => {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { authkey: authKey, accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error: any) {
    logger.error(`MSG91 request failed: ${error?.message || 'network error'}`);
    throw new ApiError(502, 'OTP_PROVIDER_UNAVAILABLE', 'Unable to reach the phone verification provider');
  }

  let body: any = {};
  try { body = await response.json(); } catch { /* provider may return an empty/non-JSON error */ }

  if (!response.ok) {
    logger.error(`MSG91 HTTP ${response.status}: ${JSON.stringify(body).slice(0, 500)}`);
    throw new ApiError(502, 'OTP_PROVIDER_ERROR', 'Phone verification provider rejected the request');
  }
  return body;
};

const providerSucceeded = (body: any) => {
  const type = String(body?.type || body?.status || '').toLowerCase();
  return type === 'success' || type === 'true' || body?.success === true;
};

const providerMessage = (body: any) => String(body?.message || body?.msg || 'OTP verification failed');

export const getPhoneVerificationStatus = async (userId: string) => {
  const state = await getState(userId);
  return {
    isVerified: Boolean(state?.isVerified),
    verifiedPhone: masked(state?.verifiedPhone || null),
    pendingPhone: masked(state?.pendingPhone || null),
    verifiedAt: state?.verifiedAt || null,
    canResendAt: state?.lastSendAt
      ? new Date(new Date(state.lastSendAt).getTime() + SEND_COOLDOWN_MS)
      : null,
  };
};

const enforceSendThrottle = (state: PhoneVerificationState | null) => {
  const now = Date.now();
  if (state?.lastSendAt && now - new Date(state.lastSendAt).getTime() < SEND_COOLDOWN_MS) {
    const seconds = Math.ceil((SEND_COOLDOWN_MS - (now - new Date(state.lastSendAt).getTime())) / 1000);
    throw ApiError.tooManyRequests(`Please wait ${seconds} seconds before requesting another OTP.`);
  }

  if (
    state?.sendWindowStartedAt &&
    now - new Date(state.sendWindowStartedAt).getTime() < SEND_WINDOW_MS &&
    state.sendCount >= MAX_SENDS_PER_WINDOW
  ) {
    throw ApiError.tooManyRequests('Too many OTP requests. Please try again after one hour.');
  }
};

const persistSend = async (userId: string, phone: string, previous: PhoneVerificationState | null) => {
  const now = new Date();
  const inWindow = previous?.sendWindowStartedAt &&
    now.getTime() - new Date(previous.sendWindowStartedAt).getTime() < SEND_WINDOW_MS;
  const sendCount = inWindow ? Number(previous?.sendCount || 0) + 1 : 1;
  const windowStartedAt = inWindow ? new Date(previous!.sendWindowStartedAt!) : now;

  await prisma.$executeRaw`
    INSERT INTO "phone_verification_states" (
      "userId", "pendingPhone", "isVerified", "lastSendAt",
      "sendWindowStartedAt", "sendCount", "updatedAt"
    ) VALUES (
      ${userId}, ${phone}, FALSE, ${now}, ${windowStartedAt}, ${sendCount}, CURRENT_TIMESTAMP
    )
    ON CONFLICT ("userId") DO UPDATE SET
      "pendingPhone" = EXCLUDED."pendingPhone",
      "isVerified" = CASE
        WHEN "phone_verification_states"."verifiedPhone" = EXCLUDED."pendingPhone"
          THEN "phone_verification_states"."isVerified"
        ELSE FALSE
      END,
      "lastSendAt" = EXCLUDED."lastSendAt",
      "sendWindowStartedAt" = EXCLUDED."sendWindowStartedAt",
      "sendCount" = EXCLUDED."sendCount",
      "updatedAt" = CURRENT_TIMESTAMP
  `;
};

export const sendPhoneOtp = async (userId: string, inputPhone: string) => {
  const phone = normalizeIndiaPhone(inputPhone);
  const state = await getState(userId);
  enforceSendThrottle(state);
  const { authKey, templateId } = requireProvider();

  const url = new URL(MSG91_BASE);
  url.searchParams.set('template_id', templateId);
  url.searchParams.set('mobile', phone);

  const body = await providerJson(url, authKey);
  if (!providerSucceeded(body)) {
    logger.warn(`MSG91 send OTP rejected: ${providerMessage(body)}`);
    throw new ApiError(502, 'OTP_SEND_FAILED', 'The OTP could not be sent. Please try again.');
  }

  await persistSend(userId, phone, state);
  return { sent: true, phone: masked(phone), resendAfterSeconds: 60 };
};

export const resendPhoneOtp = async (userId: string) => {
  const state = await getState(userId);
  if (!state?.pendingPhone) {
    throw ApiError.badRequest('OTP_NOT_REQUESTED', 'Request an OTP before trying to resend it');
  }
  enforceSendThrottle(state);
  const { authKey } = requireProvider();

  const url = new URL(`${MSG91_BASE}/retry`);
  url.searchParams.set('authkey', authKey);
  url.searchParams.set('retrytype', 'text');
  url.searchParams.set('mobile', state.pendingPhone);

  const body = await providerJson(url, authKey);
  if (!providerSucceeded(body)) {
    logger.warn(`MSG91 resend OTP rejected: ${providerMessage(body)}`);
    throw new ApiError(502, 'OTP_RESEND_FAILED', 'The OTP could not be resent. Please try again.');
  }

  await persistSend(userId, state.pendingPhone, state);
  return { sent: true, phone: masked(state.pendingPhone), resendAfterSeconds: 60 };
};

export const verifyPhoneOtp = async (userId: string, otp: string) => {
  if (!/^\d{4,8}$/.test(String(otp || ''))) {
    throw ApiError.badRequest('INVALID_OTP', 'Enter a valid OTP');
  }

  const state = await getState(userId);
  if (!state?.pendingPhone) {
    throw ApiError.badRequest('OTP_NOT_REQUESTED', 'Request an OTP before trying to verify it');
  }
  const { authKey } = requireProvider();

  const url = new URL(`${MSG91_BASE}/verify`);
  url.searchParams.set('otp', otp);
  url.searchParams.set('mobile', state.pendingPhone);

  const body = await providerJson(url, authKey);
  if (!providerSucceeded(body)) {
    const message = providerMessage(body).toLowerCase();
    if (message.includes('expired')) {
      throw ApiError.badRequest('OTP_EXPIRED', 'The OTP has expired. Request a new OTP.');
    }
    throw ApiError.badRequest('INVALID_OTP', 'The OTP is incorrect or has expired');
  }

  const now = new Date();
  const phone = state.pendingPhone;
  await prisma.$transaction(async tx => {
    await tx.$executeRaw`
      UPDATE "phone_verification_states"
      SET "verifiedPhone" = ${phone},
          "isVerified" = TRUE,
          "verifiedAt" = ${now},
          "lastVerifyAt" = ${now},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "userId" = ${userId}
    `;

    const user = await tx.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user) throw ApiError.notFound('User not found');
    const national = phone.slice(-10);
    if (user.role === 'PATIENT') {
      await tx.patientProfile.update({ where: { userId }, data: { phone: national } });
    } else if (user.role === 'DOCTOR') {
      await tx.doctorProfile.update({ where: { userId }, data: { phone: national } });
    } else if (user.role === 'HOSPITAL') {
      await tx.hospitalProfile.update({ where: { userId }, data: { phone: national } });
    }
  });

  return { verified: true, phone: masked(phone), verifiedAt: now };
};

export const isPhoneVerified = async (userId: string): Promise<boolean> => {
  const state = await getState(userId);
  return Boolean(state?.isVerified && state?.verifiedPhone);
};
