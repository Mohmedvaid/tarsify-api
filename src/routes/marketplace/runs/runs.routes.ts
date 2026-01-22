/**
 * Runs Routes
 * Route definitions for notebook execution
 */
import type { FastifyInstance } from 'fastify';
import { requireConsumer } from '@/core/middleware/auth';
import {
  runNotebookHandler,
  listRunsHandler,
  getRunHandler,
} from './runs.controller';
import {
  runStartedJsonSchema,
  runResponseJsonSchema,
  listRunsQueryJsonSchema,
} from './runs.schemas';

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
 * Register runs routes
 */
export async function runsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /runs
   * List consumer's runs
   */
  app.get('/', {
    preHandler: requireConsumer,
    schema: {
      description: 'List your notebook runs',
      tags: ['Runs'],
      querystring: listRunsQueryJsonSchema,
      response: {
        200: wrapInPaginated(runResponseJsonSchema),
        401: errorResponseSchema,
      },
    },
    handler: listRunsHandler,
  });

  /**
   * GET /runs/:id
   * Get run details
   */
  app.get('/:id', {
    preHandler: requireConsumer,
    schema: {
      description: 'Get run details',
      tags: ['Runs'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
        required: ['id'],
      },
      response: {
        200: wrapInSuccess(runResponseJsonSchema),
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: getRunHandler,
  });
}

/**
 * Register notebook run endpoint
 * This is registered under /notebooks to allow POST /notebooks/:id/run
 */
export async function notebookRunRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /notebooks/:id/run
   * Start a notebook run
   */
  app.post('/:id/run', {
    preHandler: requireConsumer,
    schema: {
      description: 'Run a notebook',
      tags: ['Runs'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
        required: ['id'],
      },
      response: {
        201: wrapInSuccess(runStartedJsonSchema),
        400: errorResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: runNotebookHandler,
  });
}
