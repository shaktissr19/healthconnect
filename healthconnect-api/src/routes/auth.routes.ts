// src/routes/auth.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authRateLimiter } from '../middleware/rateLimiter';
import { authenticate, optionalAuth } from '../middleware/auth';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  refreshTokenSchema,
  sendPhoneOtpSchema,
  verifyPhoneOtpSchema,
} from '../validators/auth.validator';
import * as AuthService from '../services/auth.service';
import {
  getPhoneVerificationStatus,
  resendPhoneOtp,
  sendPhoneOtp,
  verifyPhoneOtp,
} from '../services/phoneVerification.service';
import { ApiResponse } from '../utils/apiResponse';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/logout', optionalAuth, authController.logout);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post(
  '/forgot-password',
  authRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.post(
  '/change-password',
  authRateLimiter,
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);
router.get('/me', authenticate, authController.getCurrentUser);

router.post(
  '/verify-email',
  authRateLimiter,
  validate(z.object({ token: z.string().min(1).max(512) }).strict()),
  async (req, res, next) => {
    try {
      await AuthService.verifyEmail(req.body.token);
      return ApiResponse.success(res, null, 'Email verified successfully');
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  '/resend-verification',
  authRateLimiter,
  authenticate,
  async (req, res, next) => {
    try {
      await AuthService.resendVerification(req.user!.userId);
      return ApiResponse.success(res, null, 'Verification email sent');
    } catch (e) {
      next(e);
    }
  },
);

// Phone verification uses MSG91's OTP lifecycle. No plaintext OTP is stored by
// HealthConnect. App-side cooldowns and hourly send limits add abuse protection
// on top of the provider's own retry limits.
router.get('/phone/status', authenticate, async (req, res, next) => {
  try {
    return ApiResponse.success(res, await getPhoneVerificationStatus(req.user!.userId));
  } catch (e) { next(e); }
});

router.post(
  '/phone/send-otp',
  authRateLimiter,
  authenticate,
  validate(sendPhoneOtpSchema),
  async (req, res, next) => {
    try {
      return ApiResponse.success(
        res,
        await sendPhoneOtp(req.user!.userId, req.body.phone),
        'OTP sent successfully',
      );
    } catch (e) { next(e); }
  },
);

router.post(
  '/phone/resend-otp',
  authRateLimiter,
  authenticate,
  async (req, res, next) => {
    try {
      return ApiResponse.success(
        res,
        await resendPhoneOtp(req.user!.userId),
        'OTP resent successfully',
      );
    } catch (e) { next(e); }
  },
);

router.post(
  '/phone/verify-otp',
  authRateLimiter,
  authenticate,
  validate(verifyPhoneOtpSchema),
  async (req, res, next) => {
    try {
      return ApiResponse.success(
        res,
        await verifyPhoneOtp(req.user!.userId, req.body.otp),
        'Phone verified successfully',
      );
    } catch (e) { next(e); }
  },
);

export default router;
