import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

const OTP_TTL_MINUTES = 5;
const SEND_COOLDOWN_SECONDS = 60;
const MAX_SENDS_PER_HOUR = 5;
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_RESENDS_PER_CHALLENGE = 3;

const providerNotConfigured = () =>
  new ApiError(
    503,
    'OTP_PROVIDER_NOT_CONFIGURED',
    'Phone verification is temporarily unavailable because the SMS provider is not configured.',
  );

const providerFailed = (message = 'Unable to send or verify OTP right now. Please try again shortly.') =>
  new ApiError(502, 'OTP_PROVIDER_FAILED', message);

export const normalizeIndianPhone = (raw: string): string => {
  const digits = String(raw || '').replace(/\D/g, '');
  let local = digits;
  if (digits.length === 12 && digits.startsWith('91')) local = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) local = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(local)) {
    throw ApiError.badRequest('INVALID_PHONE', 'Enter a valid 10-digit Indian mobile number');
  }
  return `91${local}`;
};

const maskPhone = (phone: string) => `+91 ••••••${phone.slice(-4)}`;

const getProviderConfig = () => {
  const authKey = config.sms.authKey?.trim();
  const templateId = config.sms.templateId?.trim();
  if (!authKey || !templateId) throw providerNotConfigured();
  return { authKey, templateId };
};

const parseProviderBody = async (response: Response): Promise<any> => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
};

const providerSucceeded = (body: any) => {
  const type = String(body?.type || '').toLowerCase();
  const message = String(body?.message || '').toLowerCase();
  return type === 'success' || message.includes('success') || message.includes('verified');
};

const resolveAccountPhone = async (userId: string): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      patientProfile: { select: { phone: true } },
      doctorProfile: { select: { phone: true } },
      hospitalProfile: { select: { phone: true } },
    },
  });

  if (!user || !user.isActive) throw ApiError.unauthorized('Session is no longer active');
  const rawPhone =
    user.role === 'PATIENT'
      ? user.patientProfile?.phone
      : user.role === 'DOCTOR'
        ? user.doctorProfile?.phone
        : user.role === 'HOSPITAL'
          ? user.hospitalProfile?.phone
          : null;

  if (!rawPhone) {
    throw ApiError.badRequest(
      'PHONE_REQUIRED',
      'Add a mobile number to your profile before requesting an OTP.',
    );
  }
  return normalizeIndianPhone(rawPhone);
};

export const getPhoneVerificationStatus = async (userId: string) => {
  const phone = await resolveAccountPhone(userId).catch((error: any) => {
    if (error?.errorCode === 'PHONE_REQUIRED') return null;
    throw error;
  });

  const rows = await prisma.$queryRaw<
    Array<{ isPhoneVerified: boolean; verifiedPhone: string | null; phoneVerifiedAt: Date | null }>
  >`
    SELECT
      is_phone_verified AS "isPhoneVerified",
      verified_phone AS "verifiedPhone",
      phone_verified_at AS "phoneVerifiedAt"
    FROM public.users
    WHERE id = ${userId}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) throw ApiError.notFound('User not found');
  const currentPhoneMatches = Boolean(phone && row.verifiedPhone === phone);

  return {
    hasPhone: Boolean(phone),
    phoneMasked: phone ? maskPhone(phone) : null,
    isPhoneVerified: Boolean(row.isPhoneVerified && currentPhoneMatches),
    verifiedAt: row.phoneVerifiedAt,
  };
};

export const sendPhoneOtp = async (userId: string) => {
  const phone = await resolveAccountPhone(userId);
  const { authKey, templateId } = getProviderConfig();

  const already = await getPhoneVerificationStatus(userId);
  if (already.isPhoneVerified) {
    return { ...already, alreadyVerified: true, resendAfterSeconds: 0 };
  }

  const latestRows = await prisma.$queryRaw<
    Array<{ id: string; sentAt: Date; status: string }>
  >`
    SELECT id, sent_at AS "sentAt", status
    FROM public.phone_otp_challenges
    WHERE user_id = ${userId}
      AND phone = ${phone}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const latest = latestRows[0];
  if (latest && latest.status === 'PENDING') {
    const elapsedSeconds = Math.floor((Date.now() - new Date(latest.sentAt).getTime()) / 1000);
    if (elapsedSeconds < SEND_COOLDOWN_SECONDS) {
      throw new ApiError(
        429,
        'OTP_RESEND_COOLDOWN',
        `Please wait ${SEND_COOLDOWN_SECONDS - elapsedSeconds} seconds before requesting another OTP.`,
      );
    }
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const countRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM public.phone_otp_challenges
    WHERE (user_id = ${userId} OR phone = ${phone})
      AND created_at >= ${oneHourAgo}
  `;
  if (Number(countRows[0]?.count || 0) >= MAX_SENDS_PER_HOUR) {
    throw new ApiError(
      429,
      'OTP_HOURLY_LIMIT',
      'Too many OTP requests. Please wait before trying again.',
    );
  }

  const url = new URL('https://control.msg91.com/api/v5/otp');
  url.searchParams.set('template_id', templateId);
  url.searchParams.set('mobile', phone);
  url.searchParams.set('authkey', authKey);
  url.searchParams.set('otp_expiry', String(OTP_TTL_MINUTES));

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error: any) {
    logger.error(`MSG91 SendOTP network failure: ${error?.message || error}`);
    throw providerFailed();
  }

  const body = await parseProviderBody(response);
  if (!response.ok || !providerSucceeded(body)) {
    logger.error(`MSG91 SendOTP failed (${response.status}): ${JSON.stringify(body)}`);
    throw providerFailed();
  }

  const challengeId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  const providerRequestId = String(body?.request_id || body?.requestId || body?.message || '').slice(0, 500) || null;

  await prisma.$executeRaw`
    UPDATE public.phone_otp_challenges
    SET status = 'EXPIRED', updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ${userId}
      AND status = 'PENDING'
  `;

  await prisma.$executeRaw`
    INSERT INTO public.phone_otp_challenges (
      id, user_id, phone, status, attempts, resend_count,
      provider_request_id, sent_at, expires_at, created_at, updated_at
    ) VALUES (
      ${challengeId}, ${userId}, ${phone}, 'PENDING', 0, 0,
      ${providerRequestId}, CURRENT_TIMESTAMP, ${expiresAt}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
  `;

  return {
    challengeId,
    phoneMasked: maskPhone(phone),
    expiresInSeconds: OTP_TTL_MINUTES * 60,
    resendAfterSeconds: SEND_COOLDOWN_SECONDS,
  };
};

export const resendPhoneOtp = async (userId: string) => {
  const phone = await resolveAccountPhone(userId);
  const { authKey } = getProviderConfig();
  const rows = await prisma.$queryRaw<
    Array<{ id: string; status: string; sentAt: Date; expiresAt: Date; resendCount: number }>
  >`
    SELECT
      id,
      status,
      sent_at AS "sentAt",
      expires_at AS "expiresAt",
      resend_count AS "resendCount"
    FROM public.phone_otp_challenges
    WHERE user_id = ${userId}
      AND phone = ${phone}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const challenge = rows[0];
  if (!challenge || challenge.status !== 'PENDING') {
    return sendPhoneOtp(userId);
  }

  const elapsedSeconds = Math.floor((Date.now() - new Date(challenge.sentAt).getTime()) / 1000);
  if (elapsedSeconds < SEND_COOLDOWN_SECONDS) {
    throw new ApiError(
      429,
      'OTP_RESEND_COOLDOWN',
      `Please wait ${SEND_COOLDOWN_SECONDS - elapsedSeconds} seconds before resending the OTP.`,
    );
  }
  if (challenge.resendCount >= MAX_RESENDS_PER_CHALLENGE) {
    throw new ApiError(429, 'OTP_RESEND_LIMIT', 'Maximum OTP resend attempts reached. Request a new OTP later.');
  }
  if (new Date(challenge.expiresAt).getTime() <= Date.now()) {
    await prisma.$executeRaw`
      UPDATE public.phone_otp_challenges
      SET status = 'EXPIRED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${challenge.id}
    `;
    return sendPhoneOtp(userId);
  }

  const url = new URL('https://control.msg91.com/api/v5/otp/retry');
  url.searchParams.set('authkey', authKey);
  url.searchParams.set('retrytype', 'text');
  url.searchParams.set('mobile', phone);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error: any) {
    logger.error(`MSG91 ResendOTP network failure: ${error?.message || error}`);
    throw providerFailed();
  }
  const body = await parseProviderBody(response);
  if (!response.ok || !providerSucceeded(body)) {
    logger.error(`MSG91 ResendOTP failed (${response.status}): ${JSON.stringify(body)}`);
    throw providerFailed('Unable to resend OTP right now. Please request a new OTP later.');
  }

  const newExpiry = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await prisma.$executeRaw`
    UPDATE public.phone_otp_challenges
    SET
      resend_count = resend_count + 1,
      sent_at = CURRENT_TIMESTAMP,
      expires_at = ${newExpiry},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${challenge.id}
  `;

  return {
    challengeId: challenge.id,
    phoneMasked: maskPhone(phone),
    expiresInSeconds: OTP_TTL_MINUTES * 60,
    resendAfterSeconds: SEND_COOLDOWN_SECONDS,
  };
};

export const verifyPhoneOtp = async (userId: string, otp: string) => {
  const phone = await resolveAccountPhone(userId);
  const { authKey } = getProviderConfig();
  const rows = await prisma.$queryRaw<
    Array<{ id: string; status: string; attempts: number; expiresAt: Date }>
  >`
    SELECT id, status, attempts, expires_at AS "expiresAt"
    FROM public.phone_otp_challenges
    WHERE user_id = ${userId}
      AND phone = ${phone}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const challenge = rows[0];
  if (!challenge || challenge.status !== 'PENDING') {
    throw ApiError.badRequest('OTP_NOT_REQUESTED', 'Request an OTP before attempting verification.');
  }
  if (new Date(challenge.expiresAt).getTime() <= Date.now()) {
    await prisma.$executeRaw`
      UPDATE public.phone_otp_challenges
      SET status = 'EXPIRED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${challenge.id}
    `;
    throw ApiError.badRequest('OTP_EXPIRED', 'The OTP has expired. Request a new OTP.');
  }
  if (challenge.attempts >= MAX_VERIFY_ATTEMPTS) {
    await prisma.$executeRaw`
      UPDATE public.phone_otp_challenges
      SET status = 'LOCKED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${challenge.id}
    `;
    throw new ApiError(429, 'OTP_ATTEMPTS_EXCEEDED', 'Too many incorrect OTP attempts. Request a new OTP later.');
  }

  const url = new URL('https://control.msg91.com/api/v5/otp/verify');
  url.searchParams.set('otp', otp);
  url.searchParams.set('mobile', phone);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json', authkey: authKey },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error: any) {
    logger.error(`MSG91 VerifyOTP network failure: ${error?.message || error}`);
    throw providerFailed();
  }
  const body = await parseProviderBody(response);
  if (!response.ok || !providerSucceeded(body)) {
    const nextAttempts = challenge.attempts + 1;
    await prisma.$executeRaw`
      UPDATE public.phone_otp_challenges
      SET
        attempts = attempts + 1,
        status = CASE WHEN attempts + 1 >= ${MAX_VERIFY_ATTEMPTS} THEN 'LOCKED' ELSE status END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${challenge.id}
    `;
    if (nextAttempts >= MAX_VERIFY_ATTEMPTS) {
      throw new ApiError(429, 'OTP_ATTEMPTS_EXCEEDED', 'Too many incorrect OTP attempts. Request a new OTP later.');
    }
    throw ApiError.badRequest('INVALID_OTP', 'The OTP is incorrect or expired.');
  }

  await prisma.$transaction(async tx => {
    await tx.$executeRaw`
      UPDATE public.users
      SET
        is_phone_verified = TRUE,
        verified_phone = ${phone},
        phone_verified_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `;
    await tx.$executeRaw`
      UPDATE public.phone_otp_challenges
      SET status = 'VERIFIED', verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${challenge.id}
    `;
  });

  return {
    isPhoneVerified: true,
    phoneMasked: maskPhone(phone),
    verifiedAt: new Date(),
  };
};
