import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `[${timestamp}] ${level}: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat,
  ),
  transports: [
    // Console — colorized in development
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        errors({ stack: true }),
        logFormat,
      ),
      silent: process.env.NODE_ENV === 'test',
    }),
    // File — errors only
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level:    'error',
      maxsize:  5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),
    // File — all logs
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize:  10 * 1024 * 1024, // 10MB
      maxFiles: 10,
    }),
  ],
});

// Shorthand helpers
export const logInfo  = (msg: string, meta?: any) => logger.info(msg,  meta);
export const logError = (msg: string, meta?: any) => logger.error(msg, meta);
export const logWarn  = (msg: string, meta?: any) => logger.warn(msg,  meta);
export const logDebug = (msg: string, meta?: any) => logger.debug(msg, meta);