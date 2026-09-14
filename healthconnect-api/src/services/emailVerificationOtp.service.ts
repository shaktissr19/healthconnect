import crypto from 'crypto';
import sgMail from '@sendgrid/mail';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const otpHash = (userId: string, otp: string) =>
  crypto.createHash('sha256').update(`${userId}:${otp}`).digest('hex');

const safeEqual = (a: string, b: string) => {
  try {
    const left = Buffer.from(a, 'utf8');
    const right = Buffer.from(b, 'utf8');
    return left.length === right.length && crypto.timingSafeEqual(left, right);
  } catch {
    return false;
  }
};

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const displayNameForUser = (user: any) =>
  user.patientProfile?.firstName ||
  user.doctorProfile?.firstName ||
  user.hospitalProfile?.name ||
  'there';

const sendOtpEmail = async (email: string, firstName: string, otp: string) => {
  const apiKey = config.email.sendgridApiKey?.trim();
  if (!apiKey) {
    if (config.email.strictMode) {
      throw ApiError.internal('Email delivery is temporarily unavailable');
    }
    logger.warn('Email verification OTP requested while SendGrid is not configured');
    return;
  }

  sgMail.setApiKey(apiKey);
  const subject = 'Your HealthConnect verification code';
  const html = `<!doctype html>
  <html lang="en"><body style="margin:0;background:#EEF3F7;font-family:Arial,sans-serif;color:#10243C">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:30px 12px;background:#EEF3F7"><tr><td align="center">
      <table role="presentation" width="520" cellspacing="0" cellpadding="0" style="max-width:100%;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #D7E1E8">
        <tr><td style="background:#123B56;color:#fff;padding:22px 28px;font-weight:800;font-size:17px">HealthConnect India</td></tr>
        <tr><td style="padding:30px 28px">
          <h2 style="margin:0 0 10px;font-size:23px">Verify your email</h2>
          <p style="margin:0 0 22px;color:#456074;line-height:1.6;font-size:14px">Hi ${firstName}, enter this code in HealthConnect to verify your email address.</p>
          <div style="text-align:center;margin:18px 0 22px"><span style="display:inline-block;letter-spacing:10px;padding:16px 18px 16px 28px;border-radius:12px;background:#E7EEF7;color:#123B56;font-size:30px;font-weight:900">${otp}</span></div>
          <p style="margin:0;color:#456074;line-height:1.6;font-size:13px">The code expires in <strong>10 minutes</strong>. HealthConnect will never ask you to share this code over phone, chat or email.</p>
        </td></tr>
        <tr><td style="padding:16px 28px;background:#F7F9FB;color:#718596;font-size:11px">If you did not request this code, you can ignore this email.</td></tr>
      </table>
    </td></tr></table>
  </body></html>`;

  await sgMail.send({
    to: email,
    from: { email: config.email.fromEmail, name: config.email.fromName },
    subject,
    html,
  });
};

export const requestEmailVerificationOtp = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      patientProfile: { select: { firstName: true } },
      doctorProfile: { select: { firstName: true } },
      hospitalProfile: { select: { name: true } },
    },
  });

  // Deliberately return the same public response for unknown/already-verified users.
  if (!user || !user.isActive || user.isEmailVerified) {
    return { accepted: true, expiresInSeconds: 600, resendAfterSeconds: 60 };
  }

  const existing = await prisma.$queryRaw<Array<{ lastSentAt: Date }>>`
    SELECT last_sent_at AS "lastSentAt"
    FROM public.email_verification_otps
    WHERE user_id = ${user.id}
    LIMIT 1
  `;

  const lastSentAt = existing[0]?.lastSentAt ? new Date(existing[0].lastSentAt).getTime() : 0;
  const elapsed = Date.now() - lastSentAt;
  if (lastSentAt && elapsed < OTP_COOLDOWN_MS) {
    return {
      accepted: true,
      expiresInSeconds: Math.ceil((OTP_TTL_MS - Math.max(0, elapsed)) / 1000),
      resendAfterSeconds: Math.ceil((OTP_COOLDOWN_MS - elapsed) / 1000),
    };
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.$executeRaw`
    INSERT INTO public.email_verification_otps (
      user_id, otp_hash, expires_at, attempts, last_sent_at, created_at, updated_at
    ) VALUES (
      ${user.id}, ${otpHash(user.id, otp)}, ${expiresAt}, 0,
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id) DO UPDATE SET
      otp_hash = EXCLUDED.otp_hash,
      expires_at = EXCLUDED.expires_at,
      attempts = 0,
      last_sent_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `;

  try {
    await sendOtpEmail(user.email, displayNameForUser(user), otp);
  } catch (error) {
    // Never leave a valid OTP in the database if email delivery failed.
    await prisma.$executeRaw`
      DELETE FROM public.email_verification_otps WHERE user_id = ${user.id}
    `;
    throw error;
  }

  return { accepted: true, expiresInSeconds: 600, resendAfterSeconds: 60 };
};

export const verifyEmailVerificationOtp = async (email: string, otp: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedOtp = otp.trim();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.isActive) {
    throw ApiError.badRequest('INVALID_OTP', 'Invalid or expired verification code');
  }
  if (user.isEmailVerified) return { verified: true };

  const rows = await prisma.$queryRaw<Array<{
    otpHash: string;
    expiresAt: Date;
    attempts: number;
  }>>`
    SELECT otp_hash AS "otpHash", expires_at AS "expiresAt", attempts
    FROM public.email_verification_otps
    WHERE user_id = ${user.id}
    LIMIT 1
  `;
  const record = rows[0];

  if (!record || new Date(record.expiresAt).getTime() <= Date.now()) {
    await prisma.$executeRaw`
      DELETE FROM public.email_verification_otps WHERE user_id = ${user.id}
    `;
    throw ApiError.badRequest('INVALID_OTP', 'Invalid or expired verification code');
  }

  if (Number(record.attempts || 0) >= OTP_MAX_ATTEMPTS) {
    await prisma.$executeRaw`
      DELETE FROM public.email_verification_otps WHERE user_id = ${user.id}
    `;
    throw ApiError.tooManyRequests('Too many incorrect verification attempts. Request a new code.');
  }

  const matches = safeEqual(record.otpHash, otpHash(user.id, normalizedOtp));
  if (!matches) {
    await prisma.$executeRaw`
      UPDATE public.email_verification_otps
      SET attempts = attempts + 1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${user.id}
    `;
    throw ApiError.badRequest('INVALID_OTP', 'Invalid or expired verification code');
  }

  await prisma.$transaction(async tx => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
      },
    });
    await tx.$executeRaw`
      DELETE FROM public.email_verification_otps WHERE user_id = ${user.id}
    `;
  });

  return { verified: true };
};
