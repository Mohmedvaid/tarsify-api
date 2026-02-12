/**
 * Models Routes
 * Route definitions for public model browsing and execution
 */
import type { FastifyInstance } from 'fastify';
import { requireConsumer } from '@/core/middleware';
import { listModelsHandler, getModelHandler } from './models.controller';
import { runModelHandler } from '../runs/runs.controller';
import { publicModelResponseJsonSchema } from './models.schemas';
import { runStartedResponseJsonSchema } from '../runs/runs.schemas';

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
 * Paginated response wrapper schema
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
        pages: { type: 'integer' },
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
 * Register models routes
 */
export async function modelsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /models
   * List published models (PUBLIC)
   */
  app.get(
    '/',
    {
      schema: {
        summary: 'List models',
        description: 'Get paginated list of published AI models',
        tags: ['Marketplace - Models'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            category: {
              type: 'string',
              enum: ['IMAGE', 'AUDIO', 'TEXT', 'VIDEO', 'DOCUMENT'],
            },
            search: { type: 'string', maxLength: 100 },
          },
        },
        response: {
          200: wrapInPaginated(publicModelResponseJsonSchema),
        },
      },
    },
    listModelsHandler
  );

  /**
   * GET /models/:slug
   * Get a specific model by slug (PUBLIC)
   */
  app.get(
    '/:slug',
    {
      schema: {
        summary: 'Get model',
        description: 'Get details of a specific model',
        tags: ['Marketplace - Models'],
        params: {
          type: 'object',
          required: ['slug'],
          properties: {
            slug: { type: 'string' },
          },
        },
        response: {
          200: wrapInSuccess(publicModelResponseJsonSchema),
          404: errorResponseSchema,
        },
      },
    },
    getModelHandler
  );

  /**
   * POST /models/:slug/run
   * Run a model (AUTH required)
   */
  app.post(
    '/:slug/run',
    {
      preHandler: [requireConsumer],
      schema: {
        summary: 'Run model',
        description: 'Submit a model for execution',
        tags: ['Marketplace - Models'],
        params: {
          type: 'object',
          required: ['slug'],
          properties: {
            slug: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            inputs: {
              type: 'object',
              description: 'Model inputs as key-value pairs',
            },
          },
        },
        response: {
          201: wrapInSuccess(runStartedResponseJsonSchema),
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    runModelHandler
  );
}
