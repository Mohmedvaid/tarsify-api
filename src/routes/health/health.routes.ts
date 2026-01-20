/**
 * Health Routes
 * Route definitions for health check endpoints
 */
import type { FastifyInstance } from 'fastify';
import { HEALTH_ROUTES } from '@/config/routes';
import { healthHandler, readyHandler, liveHandler } from './health.controller';

/**
 * Health check response schema
 */
const healthResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'] },
        timestamp: { type: 'string' },
        service: { type: 'string' },
        version: { type: 'string' },
        environment: { type: 'string' },
        uptime: { type: 'number' },
        checks: {
          type: 'object',
          additionalProperties: true,
        },
      },
    },
  },
};

/**
 * Liveness response schema
 */
const liveResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        timestamp: { type: 'string' },
      },
    },
  },
};

/**
 * Register health routes
 */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  // Basic health check
  app.get(
    HEALTH_ROUTES.BASE,
    {
      schema: {
        description: 'Basic health check',
        tags: ['Health'],
        response: {
          200: healthResponseSchema,
        },
      },
    },
    healthHandler
  );

  // Readiness probe
  app.get(
    HEALTH_ROUTES.READY,
    {
      schema: {
        description: 'Readiness probe - checks all dependencies',
        tags: ['Health'],
        response: {
          200: healthResponseSchema,
          503: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                  details: { type: 'object' },
                },
              },
            },
          },
        },
      },
    },
    readyHandler
  );

  // Liveness probe
  app.get(
    HEALTH_ROUTES.LIVE,
    {
      schema: {
        description: 'Liveness probe - confirms process is running',
        tags: ['Health'],
        response: {
          200: liveResponseSchema,
        },
      },
    },
    liveHandler
  );
}
