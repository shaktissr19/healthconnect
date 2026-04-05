// src/routes/auth.routes.ts
// Added: POST /auth/verify-email, POST /auth/resend-verification
import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate }         from '../middleware/validate';
import { authRateLimiter }  from '../middleware/rateLimiter';
import { authenticate }     from '../middleware/auth';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from '../validators/auth.validator';
import { z }      from 'zod';
import * as AuthService from '../services/auth.service';
import { ApiResponse } from '../utils/apiResponse';

const router = Router();

router.post('/register',      authRateLimiter, validate(registerSchema),      authController.register);
router.post('/login',         authRateLimiter, validate(loginSchema),          authController.login);
router.post('/logout',        authenticate,                                    authController.logout);
router.post('/refresh',       validate(refreshTokenSchema),                   authController.refreshToken);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password',  validate(resetPasswordSchema),                authController.resetPassword);
router.get('/me',             authenticate,                                    authController.getCurrentUser);

// ── NEW: Email verification ───────────────────────────────────────────────
router.post('/verify-email',
  validate(z.object({ token: z.string().min(1, 'Token required') })),
  async (req, res, next) => {
    try {
      await AuthService.verifyEmail(req.body.token);
      return ApiResponse.success(res, null, 'Email verified successfully');
    } catch (e) { next(e); }
  },
);

// ── NEW: Resend verification email (authenticated) ────────────────────────
router.post('/resend-verification',
  authenticate,
  async (req, res, next) => {
    try {
      await AuthService.resendVerification(req.user!.userId);
      return ApiResponse.success(res, null, 'Verification email sent');
    } catch (e) { next(e); }
  },
);

export default router;
