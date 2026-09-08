import { api } from '@/lib/api';

export type PhoneVerificationStatus = {
  hasPhone: boolean;
  phoneMasked: string | null;
  isPhoneVerified: boolean;
  verifiedAt?: string | null;
};

export type PhoneOtpChallenge = {
  challengeId?: string;
  phoneMasked?: string | null;
  expiresInSeconds?: number;
  resendAfterSeconds?: number;
  alreadyVerified?: boolean;
  isPhoneVerified?: boolean;
};

export const verificationAPI = {
  getPhoneStatus: () => api.get('/auth/phone/status'),
  sendPhoneOtp: () => api.post('/auth/phone/otp/send'),
  resendPhoneOtp: () => api.post('/auth/phone/otp/resend'),
  verifyPhoneOtp: (otp: string) => api.post('/auth/phone/otp/verify', { otp }),
};
