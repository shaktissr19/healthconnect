"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/auth.routes.ts
// Added: POST /auth/verify-email, POST /auth/resend-verification
const express_1 = require("express");
const authController = __importStar(require("../controllers/auth.controller"));
const validate_1 = require("../middleware/validate");
const rateLimiter_1 = require("../middleware/rateLimiter");
const auth_1 = require("../middleware/auth");
const auth_validator_1 = require("../validators/auth.validator");
const zod_1 = require("zod");
const AuthService = __importStar(require("../services/auth.service"));
const apiResponse_1 = require("../utils/apiResponse");
const router = (0, express_1.Router)();
router.post('/register', rateLimiter_1.authRateLimiter, (0, validate_1.validate)(auth_validator_1.registerSchema), authController.register);
router.post('/login', rateLimiter_1.authRateLimiter, (0, validate_1.validate)(auth_validator_1.loginSchema), authController.login);
router.post('/logout', auth_1.authenticate, authController.logout);
router.post('/refresh', (0, validate_1.validate)(auth_validator_1.refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', rateLimiter_1.authRateLimiter, (0, validate_1.validate)(auth_validator_1.forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', (0, validate_1.validate)(auth_validator_1.resetPasswordSchema), authController.resetPassword);
router.get('/me', auth_1.authenticate, authController.getCurrentUser);
// ── NEW: Email verification ───────────────────────────────────────────────
router.post('/verify-email', (0, validate_1.validate)(zod_1.z.object({ token: zod_1.z.string().min(1, 'Token required') })), async (req, res, next) => {
    try {
        await AuthService.verifyEmail(req.body.token);
        return apiResponse_1.ApiResponse.success(res, null, 'Email verified successfully');
    }
    catch (e) {
        next(e);
    }
});
// ── NEW: Resend verification email (authenticated) ────────────────────────
router.post('/resend-verification', auth_1.authenticate, async (req, res, next) => {
    try {
        await AuthService.resendVerification(req.user.userId);
        return apiResponse_1.ApiResponse.success(res, null, 'Verification email sent');
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map