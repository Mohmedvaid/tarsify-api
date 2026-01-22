/**
 * Credits Routes
 * Route definitions for credit management
 */
import type { FastifyInstance } from 'fastify';
import { requireConsumer } from '@/core/middleware/auth';
import {
  getBalanceHandler,
  getPackagesHandler,
  purchaseCreditsHandler,
  listPurchasesHandler,
} from './credits.controller';
import {
  creditBalanceJsonSchema,
  creditPackagesJsonSchema,
  purchaseCreditsResponseJsonSchema,
  purchaseCreditsBodyJsonSchema,
  purchaseResponseJsonSchema,
  listPurchasesQueryJsonSchema,
} from './credits.schemas';

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
 * Paginated response wrapper
 */
const wrapInPaginated = (dataSchema: object): object => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', const: true },
    data: {
      type: 'array',
      items: dataSchema,
    },
    meta: {
      type: 'object',
      properties: {
        page: { type: 'integer' },
        limit: { type: 'integer' },
        total: { type: 'integer' },
        totalPages: { type: 'integer' },
      },
    },
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
 * Register credits routes
 */
export async function creditsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /credits/packages
   * Get available credit packages (PUBLIC)
   */
  app.get('/packages', {
    schema: {
      description: 'Get available credit packages',
      tags: ['Credits'],
      response: {
        200: wrapInSuccess(creditPackagesJsonSchema),
      },
    },
    handler: getPackagesHandler,
  });

  /**
   * GET /credits
   * Get credit balance
   */
  app.get('/', {
    preHandler: requireConsumer,
    schema: {
      description: 'Get your credit balance',
      tags: ['Credits'],
      response: {
        200: wrapInSuccess(creditBalanceJsonSchema),
        401: errorResponseSchema,
      },
    },
    handler: getBalanceHandler,
  });

  /**
   * POST /credits/purchase
   * Purchase credits (mock)
   */
  app.post('/purchase', {
    preHandler: requireConsumer,
    schema: {
      description: 'Purchase credits (mock payment)',
      tags: ['Credits'],
      body: purchaseCreditsBodyJsonSchema,
      response: {
        201: wrapInSuccess(purchaseCreditsResponseJsonSchema),
        400: errorResponseSchema,
        401: errorResponseSchema,
      },
    },
    handler: purchaseCreditsHandler,
  });

  /**
   * GET /credits/history
   * List purchase history
   */
  app.get('/history', {
    preHandler: requireConsumer,
    schema: {
      description: 'Get purchase history',
      tags: ['Credits'],
      querystring: listPurchasesQueryJsonSchema,
      response: {
        200: wrapInPaginated(purchaseResponseJsonSchema),
        401: errorResponseSchema,
      },
    },
    handler: listPurchasesHandler,
  });
}
