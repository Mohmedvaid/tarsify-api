/**
 * Auth Routes
 * Route definitions for developer authentication endpoints
 */
import type { FastifyInstance } from 'fastify';
import { requireDeveloper, requireFirebaseAuth } from '@/core/middleware';
import {
  registerHandler,
  getMeHandler,
  updateProfileHandler,
  completeProfileHandler,
} from './auth.controller';
import {
  developerResponseJsonSchema,
  developerWithStatsJsonSchema,
  profileUpdateJsonSchema,
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
 * Register auth routes
 */
export async function authRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /auth/register
   * Create a new developer account after Firebase signup
   */
  app.post(
    '/register',
    {
      preHandler: [requireFirebaseAuth],
      schema: {
        description: 'Register a new developer account',
        tags: ['Auth'],
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
            displayName: { type: 'string', minLength: 2, maxLength: 100 },
          },
        },
        response: {
          201: wrapInSuccess(developerResponseJsonSchema),
          400: errorResponseSchema,
          401: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    registerHandler
  );

  /**
   * GET /auth/me
   * Get current authenticated developer profile
   */
  app.get(
    '/me',
    {
      preHandler: [requireFirebaseAuth],
      schema: {
        description: 'Get current developer profile with stats',
        tags: ['Auth'],
        response: {
          200: wrapInSuccess(developerWithStatsJsonSchema),
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getMeHandler
  );

  /**
   * PUT /auth/profile
   * Update developer profile
   */
  app.put(
    '/profile',
    {
      preHandler: [requireDeveloper],
      schema: {
        description: 'Update developer profile',
        tags: ['Auth'],
        body: {
          type: 'object',
          properties: {
            displayName: { type: 'string', minLength: 2, maxLength: 100 },
            bio: { type: 'string', maxLength: 500 },
            avatarUrl: { type: ['string', 'null'], format: 'uri' },
          },
        },
        response: {
          200: wrapInSuccess(profileUpdateJsonSchema),
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    updateProfileHandler
  );

  /**
   * POST /auth/complete-profile
   * Complete developer profile (first-time setup)
   */
  app.post(
    '/complete-profile',
    {
      preHandler: [requireDeveloper],
      schema: {
        description: 'Complete developer profile for first-time setup',
        tags: ['Auth'],
        body: {
          type: 'object',
          required: ['displayName'],
          properties: {
            displayName: { type: 'string', minLength: 2, maxLength: 100 },
            bio: { type: 'string', maxLength: 500 },
            payoutEmail: { type: 'string', format: 'email' },
            country: { type: 'string', minLength: 2, maxLength: 2 },
          },
        },
        response: {
          200: wrapInSuccess(profileUpdateJsonSchema),
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    completeProfileHandler
  );
}
