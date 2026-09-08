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
  verifyPhoneOtpSchema,
} from '../validators/auth.validator';
import * as AuthService from '../services/auth.service';
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

// Phone verification — account phone is taken from the authenticated role profile.
// Provider/API abuse controls are enforced both here and inside phoneOtp.service.
router.get('/phone/status', authenticate, authController.getPhoneVerificationStatus);
router.post('/phone/otp/send', authRateLimiter, authenticate, authController.sendPhoneOtp);
router.post('/phone/otp/resend', authRateLimiter, authenticate, authController.resendPhoneOtp);
router.post(
  '/phone/otp/verify',
  authRateLimiter,
  authenticate,
  validate(verifyPhoneOtpSchema),
  authController.verifyPhoneOtp,
);

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

export default router;
