/**
 * Fastify Plugins
 * Security and utility plugins configuration
 */
import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import { env } from '@/config/env';

/**
 * Register CORS plugin
 */
async function registerCors(app: FastifyInstance): Promise<void> {
  await app.register(cors, {
    origin: env.CORS_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
    credentials: true,
    maxAge: 86400, // 24 hours
  });
}

/**
 * Register Helmet plugin for security headers
 */
async function registerHelmet(app: FastifyInstance): Promise<void> {
  await app.register(helmet, {
    contentSecurityPolicy: false, // Disable for API
    crossOriginEmbedderPolicy: false, // Not needed for API
  });
}

/**
 * Register rate limiting plugin
 */
async function registerRateLimit(app: FastifyInstance): Promise<void> {
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    errorResponseBuilder: () => ({
      success: false,
      error: {
        code: 'ERR_1004',
        message: 'Too many requests, please try again later',
      },
    }),
  });
}

/**
 * Register sensible plugin for common utilities
 */
async function registerSensible(app: FastifyInstance): Promise<void> {
  await app.register(sensible);
}

/**
 * Register all plugins
 */
export async function registerPlugins(app: FastifyInstance): Promise<void> {
  await registerCors(app);
  await registerHelmet(app);
  await registerRateLimit(app);
  await registerSensible(app);
}
