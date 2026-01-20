/**
 * Fastify Application Factory
 * Creates and configures the Fastify application
 */
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { env, isDev } from './config/env';
import { APP } from './config/constants';
import { registerPlugins } from './plugins/index';
import { registerRoutes } from './routes/index';
import {
  registerErrorHandler,
  registerRequestLogger,
  registerRequestId,
} from './core/middleware/index';
import { logger, loggerOptions } from './lib/logger';

/**
 * Build and configure Fastify application
 */
export async function buildApp(): Promise<FastifyInstance> {
  // Create Fastify instance with logger options (Fastify 5 requires config object, not instance)
  const app = Fastify({
    logger: loggerOptions,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    disableRequestLogging: true, // We handle this with our own middleware
    trustProxy: true, // Trust Cloud Run proxy headers
  });

  // Register custom request ID handler
  registerRequestId(app);

  // Register request logging
  registerRequestLogger(app);

  // Register error handlers (must be before routes)
  registerErrorHandler(app);

  // Register security plugins (CORS, Helmet, Rate Limit)
  await registerPlugins(app);

  // Register all routes
  await registerRoutes(app);

  // Log registered routes in development
  if (isDev) {
    app.ready(() => {
      const routes = app.printRoutes();
      logger.debug('Registered routes:\n' + routes);
    });
  }

  return app;
}

/**
 * Application metadata for health checks
 */
export const appInfo = {
  name: APP.NAME,
  version: APP.VERSION,
  environment: env.NODE_ENV,
};
