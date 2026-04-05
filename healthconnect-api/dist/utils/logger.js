"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logDebug = exports.logWarn = exports.logError = exports.logInfo = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const { combine, timestamp, printf, colorize, errors } = winston_1.default.format;
const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `[${timestamp}] ${level}: ${stack || message}`;
});
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), logFormat),
    transports: [
        // Console — colorized in development
        new winston_1.default.transports.Console({
            format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), logFormat),
            silent: process.env.NODE_ENV === 'test',
        }),
        // File — errors only
        new winston_1.default.transports.File({
            filename: path_1.default.join('logs', 'error.log'),
            level: 'error',
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5,
        }),
        // File — all logs
        new winston_1.default.transports.File({
            filename: path_1.default.join('logs', 'combined.log'),
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 10,
        }),
    ],
});
// Shorthand helpers
const logInfo = (msg, meta) => exports.logger.info(msg, meta);
exports.logInfo = logInfo;
const logError = (msg, meta) => exports.logger.error(msg, meta);
exports.logError = logError;
const logWarn = (msg, meta) => exports.logger.warn(msg, meta);
exports.logWarn = logWarn;
const logDebug = (msg, meta) => exports.logger.debug(msg, meta);
exports.logDebug = logDebug;
//# sourceMappingURL=logger.js.map