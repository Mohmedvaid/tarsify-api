/**
 * Endpoint Routes
 * Fastify route definitions for admin endpoint management
 */
import type { FastifyInstance } from 'fastify';
import { requireAdmin } from '@/core/middleware';
import {
  createEndpointHandler,
  listEndpointsHandler,
  getEndpointHandler,
  updateEndpointHandler,
  deleteEndpointHandler,
} from './endpoint.controller';
import { endpointJsonSchema, paginationMetaJsonSchema } from './endpoint.schemas';

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
    meta: paginationMetaJsonSchema,
  },
});

/**
 * Register endpoint routes
 */
export async function endpointRoutes(fastify: FastifyInstance): Promise<void> {
  // Apply admin auth to all routes
  fastify.addHook('preHandler', requireAdmin);

  // POST /endpoints - Create endpoint
  fastify.post('/', {
    schema: {
      tags: ['Admin - Endpoints'],
      summary: 'Create a new RunPod endpoint',
      body: {
        type: 'object',
        required: ['runpodEndpointId', 'name', 'gpuType'],
        properties: {
          runpodEndpointId: { type: 'string' },
          name: { type: 'string' },
          source: { type: 'string', enum: ['HUB', 'CUSTOM'], default: 'HUB' },
          dockerImage: { type: 'string', nullable: true },
          gpuType: { type: 'string' },
          isActive: { type: 'boolean', default: true },
        },
      },
      response: {
        201: wrapInSuccess(endpointJsonSchema),
      },
    },
    handler: createEndpointHandler,
  });

  // GET /endpoints - List endpoints
  fastify.get('/', {
    schema: {
      tags: ['Admin - Endpoints'],
      summary: 'List RunPod endpoints',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 20 },
          isActive: { type: 'string' },
        },
      },
      response: {
        200: wrapInPaginated(endpointJsonSchema),
      },
    },
    handler: listEndpointsHandler,
  });

  // GET /endpoints/:id - Get endpoint
  fastify.get('/:id', {
    schema: {
      tags: ['Admin - Endpoints'],
      summary: 'Get endpoint by ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: wrapInSuccess(endpointJsonSchema),
      },
    },
    handler: getEndpointHandler,
  });

  // PATCH /endpoints/:id - Update endpoint
  fastify.patch('/:id', {
    schema: {
      tags: ['Admin - Endpoints'],
      summary: 'Update endpoint',
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
          name: { type: 'string' },
          source: { type: 'string', enum: ['HUB', 'CUSTOM'] },
          dockerImage: { type: 'string', nullable: true },
          gpuType: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
      response: {
        200: wrapInSuccess(endpointJsonSchema),
      },
    },
    handler: updateEndpointHandler,
  });

  // DELETE /endpoints/:id - Soft delete endpoint
  fastify.delete('/:id', {
    schema: {
      tags: ['Admin - Endpoints'],
      summary: 'Soft delete endpoint (sets isActive to false)',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        204: {
          type: 'null',
          description: 'Endpoint deleted',
        },
      },
    },
    handler: deleteEndpointHandler,
  });
}
