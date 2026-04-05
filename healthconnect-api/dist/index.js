"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const startServer = async () => {
    try {
        // Test database connection
        await prisma.$connect();
        logger_1.logger.info('Database connected successfully');
        // Start server
        app_1.default.listen(config_1.config.port, () => {
            logger_1.logger.info(`Server running on port ${config_1.config.port} in ${config_1.config.env} mode`);
            logger_1.logger.info(`API base URL: http://localhost:${config_1.config.port}/api/${config_1.config.apiVersion}`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.logger.info('SIGTERM received, shutting down...');
    await prisma.$disconnect();
    process.exit(0);
});
startServer();
//# sourceMappingURL=index.js.map