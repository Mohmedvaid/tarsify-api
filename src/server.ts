/**
 * Server Entry Point
 * Starts the Fastify server with graceful shutdown handling
 */
import { env } from './config/env';
import { APP } from './config/constants';
import { buildApp } from './app';
import { logger } from './lib/logger';

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(
  signal: string,
  app: Awaited<ReturnType<typeof buildApp>>
): Promise<void> {
  logger.info({ signal }, 'Received shutdown signal, starting graceful shutdown...');

  try {
    // Close the server and stop accepting new connections
    await app.close();
    logger.info('Server closed successfully');

    // TODO: Close database connections
    // await prisma.$disconnect();

    // TODO: Close other connections (Redis, etc.)

    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error during graceful shutdown');
    process.exit(1);
  }
}

/**
 * Start the server
 */
async function start(): Promise<void> {
  let app: Awaited<ReturnType<typeof buildApp>> | undefined;

  try {
    // Build the application
    app = await buildApp();

    // Register shutdown handlers
    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    for (const signal of signals) {
      process.on(signal, () => gracefulShutdown(signal, app!));
    }

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.fatal({ error }, 'Uncaught exception');
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.fatal({ reason, promise }, 'Unhandled promise rejection');
      process.exit(1);
    });

    // Start listening
    const address = await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    logger.info(
      {
        service: APP.NAME,
        version: APP.VERSION,
        environment: env.NODE_ENV,
        address,
      },
      `🚀 ${APP.NAME} is running!`
    );

    // Log startup info
    logger.info({
      endpoints: {
        health: `${address}/health`,
        ready: `${address}/health/ready`,
        live: `${address}/health/live`,
        api: `${address}/api`,
      },
    }, 'Available endpoints');

  } catch (error) {
    logger.fatal({ error }, 'Failed to start server');
    
    // Attempt cleanup on startup failure
    if (app) {
      await app.close().catch(() => {});
    }
    
    process.exit(1);
  }
}

// Start the server
start();
