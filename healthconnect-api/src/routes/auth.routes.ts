import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authRateLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', authenticate, authController.getCurrentUser);

export default router;
