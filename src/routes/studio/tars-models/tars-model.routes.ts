/**
 * Tars Model Routes
 * Route definitions for developer tars model endpoints
 */
import type { FastifyInstance } from 'fastify';
import { requireDeveloper } from '@/core/middleware';
import {
  createHandler,
  listHandler,
  getHandler,
  updateHandler,
  deleteHandler,
  publishHandler,
  listBaseModelsHandler,
  testRunHandler,
} from './tars-model.controller';
import {
  tarsModelResponseJsonSchema,
  testRunResponseJsonSchema,
} from './tars-model.schemas';

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
 * Paginated success response wrapper schema
 */
const wrapInPaginatedSuccess = (itemSchema: object): object => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', const: true },
    data: {
      type: 'array',
      items: itemSchema,
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
 * Register tars model routes
 */
export async function tarsModelRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /tars-models/base-models
   * List available base models for developers to build on
   * Note: This route must be before /:id to avoid conflicts
   */
  app.get(
    '/base-models',
    {
      preHandler: [requireDeveloper],
      schema: {
        summary: 'List available base models',
        description: 'Get all active base models that developers can use',
        tags: ['Studio - Tars Models'],
        response: {
          200: wrapInSuccess({
            type: 'object',
            properties: {
              baseModels: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    slug: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    category: { type: 'string' },
                    inputSchema: { type: 'object' },
                    outputType: { type: 'string' },
                    outputFormat: { type: 'string' },
                    estimatedSeconds: { type: 'integer' },
                  },
                },
              },
            },
          }),
        },
      },
    },
    listBaseModelsHandler
  );

  /**
   * POST /tars-models
   * Create a new tars model
   */
  app.post(
    '/',
    {
      preHandler: [requireDeveloper],
      schema: {
        summary: 'Create tars model',
        description: 'Create a new tars model based on an existing base model',
        tags: ['Studio - Tars Models'],
        body: {
          type: 'object',
          required: ['baseModelId', 'title', 'slug'],
          properties: {
            baseModelId: { type: 'string', format: 'uuid' },
            title: { type: 'string', minLength: 1, maxLength: 200 },
            slug: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
            description: { type: 'string', maxLength: 5000, nullable: true },
            configOverrides: { type: 'object', nullable: true },
          },
        },
        response: {
          201: wrapInSuccess(tarsModelResponseJsonSchema),
          400: errorResponseSchema,
          401: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    createHandler
  );

  /**
   * GET /tars-models
   * List developer's tars models
   */
  app.get(
    '/',
    {
      preHandler: [requireDeveloper],
      schema: {
        summary: 'List tars models',
        description: 'Get paginated list of developer tars models',
        tags: ['Studio - Tars Models'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            status: {
              type: 'string',
              enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
            },
          },
        },
        response: {
          200: wrapInPaginatedSuccess(tarsModelResponseJsonSchema),
          401: errorResponseSchema,
        },
      },
    },
    listHandler
  );

  /**
   * GET /tars-models/:id
   * Get a single tars model
   */
  app.get(
    '/:id',
    {
      preHandler: [requireDeveloper],
      schema: {
        summary: 'Get tars model',
        description: 'Get details of a specific tars model',
        tags: ['Studio - Tars Models'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: wrapInSuccess(tarsModelResponseJsonSchema),
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getHandler
  );

  /**
   * PUT /tars-models/:id
   * Update a tars model
   */
  app.put(
    '/:id',
    {
      preHandler: [requireDeveloper],
      schema: {
        summary: 'Update tars model',
        description: 'Update a tars model configuration',
        tags: ['Studio - Tars Models'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 200 },
            slug: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
            description: { type: 'string', maxLength: 5000, nullable: true },
            configOverrides: { type: 'object', nullable: true },
          },
        },
        response: {
          200: wrapInSuccess(tarsModelResponseJsonSchema),
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    updateHandler
  );

  /**
   * DELETE /tars-models/:id
   * Delete a tars model
   */
  app.delete(
    '/:id',
    {
      preHandler: [requireDeveloper],
      schema: {
        summary: 'Delete tars model',
        description: 'Delete a draft or archived tars model',
        tags: ['Studio - Tars Models'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          204: { type: 'null' },
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    deleteHandler
  );

  /**
   * POST /tars-models/:id/publish
   * Publish or archive a tars model
   */
  app.post(
    '/:id/publish',
    {
      preHandler: [requireDeveloper],
      schema: {
        summary: 'Publish or archive tars model',
        description: 'Change the publication status of a tars model',
        tags: ['Studio - Tars Models'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          required: ['action'],
          properties: {
            action: { type: 'string', enum: ['publish', 'archive'] },
          },
        },
        response: {
          200: wrapInSuccess(tarsModelResponseJsonSchema),
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    publishHandler
  );

  /**
   * POST /tars-models/:id/test-run
   * Execute a test run of a tars model
   * Developer validation run before publishing
   */
  app.post(
    '/:id/test-run',
    {
      preHandler: [requireDeveloper],
      schema: {
        summary: 'Test run a tars model',
        description:
          'Execute a test run of a tars model. Returns immediately with result. Use this to validate your model before publishing.',
        tags: ['Studio - Tars Models'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            inputs: {
              type: 'object',
              description: 'Input parameters for the model run',
              additionalProperties: true,
            },
          },
        },
        response: {
          200: wrapInSuccess(testRunResponseJsonSchema),
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    testRunHandler
  );
}
