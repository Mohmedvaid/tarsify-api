/**
 * Runs Routes
 * Route definitions for consumer execution endpoints
 */
import type { FastifyInstance } from 'fastify';
import { requireConsumer } from '@/core/middleware';
import {
  listRunsHandler,
  getRunHandler,
  pollRunStatusHandler,
  cancelRunHandler,
} from './runs.controller';
import {
  executionResponseJsonSchema,
  runsListResponseJsonSchema,
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
   * List consumer's executions
   */
  app.get(
    '/',
    {
      preHandler: [requireConsumer],
      schema: {
        summary: 'List runs',
        description: 'Get paginated list of your model executions',
        tags: ['Marketplace - Runs'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            status: {
              type: 'string',
              enum: [
                'PENDING',
                'QUEUED',
                'RUNNING',
                'COMPLETED',
                'FAILED',
                'TIMED_OUT',
                'CANCELLED',
              ],
            },
          },
        },
        response: {
          200: wrapInSuccess(runsListResponseJsonSchema),
          401: errorResponseSchema,
        },
      },
    },
    listRunsHandler
  );

  /**
   * GET /runs/:id
   * Get a specific execution
   */
  app.get(
    '/:id',
    {
      preHandler: [requireConsumer],
      schema: {
        summary: 'Get run',
        description: 'Get details of a specific execution',
        tags: ['Marketplace - Runs'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: wrapInSuccess(executionResponseJsonSchema),
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getRunHandler
  );

  /**
   * GET /runs/:id/status
   * Poll execution status
   */
  app.get(
    '/:id/status',
    {
      preHandler: [requireConsumer],
      schema: {
        summary: 'Poll run status',
        description:
          'Get current status of an execution, optionally syncing with RunPod',
        tags: ['Marketplace - Runs'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            sync: {
              type: 'string',
              enum: ['true', 'false'],
              description: 'Sync with RunPod for fresh status',
            },
          },
        },
        response: {
          200: wrapInSuccess({
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              status: { type: 'string' },
              outputPayload: { type: 'object', nullable: true },
              errorMessage: { type: 'string', nullable: true },
              completedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              executionTimeMs: { type: 'integer', nullable: true },
            },
          }),
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    pollRunStatusHandler
  );

  /**
   * POST /runs/:id/cancel
   * Cancel an execution
   */
  app.post(
    '/:id/cancel',
    {
      preHandler: [requireConsumer],
      schema: {
        summary: 'Cancel run',
        description: 'Cancel a running or pending execution',
        tags: ['Marketplace - Runs'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: wrapInSuccess({
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              status: { type: 'string' },
              message: { type: 'string' },
            },
          }),
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    cancelRunHandler
  );
}
