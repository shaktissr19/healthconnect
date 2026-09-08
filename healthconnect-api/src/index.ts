import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { assertProductionReadiness } from './utils/productionReadiness';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const startServer = async () => {
  try {
    // Do not allow a production process to silently accept customers while core
    // providers (email, OTP, payment, encrypted report storage) are unconfigured.
    assertProductionReadiness();

    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Start server
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.env} mode`);
      logger.info(`API base URL: http://localhost:${config.port}/api/${config.apiVersion}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
