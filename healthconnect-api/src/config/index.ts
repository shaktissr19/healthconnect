import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'] as const;
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar] || !process.env[envVar]!.trim()) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiVersion: process.env.API_VERSION || 'v1',

  database: {
    url: process.env.DATABASE_URL!,
  },

  jwt: {
    secret: process.env.JWT_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    // Canonical names are JWT_EXPIRES_IN / JWT_REFRESH_EXPIRES_IN.
    // Legacy aliases are kept temporarily so existing server env files do not break.
    expiresIn: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRY || '15m',
    refreshExpiresIn:
      process.env.JWT_REFRESH_EXPIRES_IN || process.env.REFRESH_TOKEN_EXPIRY || '7d',
  },

  auth: {
    // In production set COOKIE_DOMAIN=.healthconnect.sbs so both
    // healthconnect.sbs and api.healthconnect.sbs can receive the access cookie.
    cookieDomain: process.env.COOKIE_DOMAIN || undefined,
    accessCookieName: process.env.ACCESS_COOKIE_NAME || 'hc_access',
    refreshCookieName: process.env.REFRESH_COOKIE_NAME || 'hc_refresh',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  storage: {
    endpoint: process.env.STORAGE_ENDPOINT || 'localhost',
    port: parseInt(process.env.STORAGE_PORT || '9000', 10),
    accessKey: process.env.STORAGE_ACCESS_KEY!,
    secretKey: process.env.STORAGE_SECRET_KEY!,
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
    keyId: process.env.RAZORPAY_KEY_ID!,
    keySecret: process.env.RAZORPAY_KEY_SECRET!,
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};
