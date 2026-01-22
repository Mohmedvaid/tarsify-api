/**
 * Consumer Auth Routes
 * Route definitions for consumer authentication
 */
import type { FastifyInstance } from 'fastify';
import {
  requireConsumer,
  requireConsumerFirebaseAuth,
} from '@/core/middleware/auth';
import {
  registerHandler,
  getMeHandler,
  updateProfileHandler,
} from './auth.controller';
import {
  consumerResponseJsonSchema,
  consumerWithStatsResponseJsonSchema,
  profileUpdateResponseJsonSchema,
  registerConsumerBodyJsonSchema,
  updateProfileBodyJsonSchema,
} from './auth.schemas';

/**
 * Success response wrapper schema
 */
const wrapInSuccess = (dataSchema: object): object => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', const: true },
    data: dataSchema,
  },
});

/**
 * Error response schema
 */
const errorResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', const: false },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        details: { type: 'object' },
      },
    },
  },
};

/**
 * Register consumer auth routes
 */
export async function consumerAuthRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /auth/register
   * Register a new consumer account
   */
  app.post('/register', {
    preHandler: requireConsumerFirebaseAuth,
    schema: {
      description: 'Register a new consumer account',
      tags: ['Consumer Auth'],
      body: registerConsumerBodyJsonSchema,
      response: {
        201: wrapInSuccess(consumerResponseJsonSchema),
        400: errorResponseSchema,
        401: errorResponseSchema,
        409: errorResponseSchema,
      },
    },
    handler: registerHandler,
  });

  /**
   * GET /auth/me
   * Get current consumer profile with stats
   */
  app.get('/me', {
    preHandler: requireConsumer,
    schema: {
      description: 'Get current consumer profile',
      tags: ['Consumer Auth'],
      response: {
        200: wrapInSuccess(consumerWithStatsResponseJsonSchema),
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: getMeHandler,
  });

  /**
   * PUT /auth/profile
   * Update consumer profile
   */
  app.put('/profile', {
    preHandler: requireConsumer,
    schema: {
      description: 'Update consumer profile',
      tags: ['Consumer Auth'],
      body: updateProfileBodyJsonSchema,
      response: {
        200: wrapInSuccess(profileUpdateResponseJsonSchema),
        400: errorResponseSchema,
        401: errorResponseSchema,
      },
    },
    handler: updateProfileHandler,
  });
}
