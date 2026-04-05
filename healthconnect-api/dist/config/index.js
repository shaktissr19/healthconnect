"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    apiVersion: process.env.API_VERSION || 'v1',
    database: {
        url: process.env.DATABASE_URL,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    storage: {
        endpoint: process.env.STORAGE_ENDPOINT || 'localhost',
        port: parseInt(process.env.STORAGE_PORT || '9000', 10),
        accessKey: process.env.STORAGE_ACCESS_KEY,
        secretKey: process.env.STORAGE_SECRET_KEY,
        bucket: process.env.STORAGE_BUCKET || 'healthconnect-files',
        useSSL: process.env.STORAGE_USE_SSL === 'true',
    },
    email: {
        sendgridApiKey: process.env.SENDGRID_API_KEY,
        fromEmail: process.env.FROM_EMAIL || 'noreply@healthconnect.in',
        fromName: process.env.FROM_NAME || 'HealthConnect India',
    },
    sms: {
        authKey: process.env.MSG91_AUTH_KEY,
        senderId: process.env.MSG91_SENDER_ID || 'HLTHCN',
        templateId: process.env.MSG91_TEMPLATE_ID,
    },
    razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID,
        keySecret: process.env.RAZORPAY_KEY_SECRET,
    },
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
};
// Validate required config
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}
//# sourceMappingURL=index.js.map