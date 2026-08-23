import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';
import * as subscriptionController from './controllers/subscription.controller';
import routes from './routes';

const app: Application = express();

// The API is served behind one Nginx reverse proxy in production. Trusting one
// proxy lets Express resolve req.ip from X-Forwarded-For instead of treating all
// users as the local Nginx address. This is essential for per-client rate limits.
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

// Razorpay requires HMAC verification against the exact raw request bytes.
// This route is public by design and authenticated cryptographically with the
// webhook secret; mount it before express.json() so the body is not mutated.
app.post(
  `/api/${config.apiVersion}/subscription/webhook`,
  express.raw({ type: 'application/json', limit: '1mb' }),
  subscriptionController.handleWebhook,
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (config.env === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Rate limiting
app.use(rateLimiter());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use(`/api/${config.apiVersion}`, routes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error_code: 'NOT_FOUND',
    message: 'Endpoint not found',
  });
});

export default app;
