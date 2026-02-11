/**
 * Base Model Routes
 * Fastify route definitions for admin base model management
 */
import type { FastifyInstance } from 'fastify';
import { requireAdmin } from '@/core/middleware';
import {
  createBaseModelHandler,
  listBaseModelsHandler,
  getBaseModelHandler,
  updateBaseModelHandler,
  deleteBaseModelHandler,
} from './base-model.controller';
import { baseModelJsonSchema, paginationMetaJsonSchema } from './base-model.schemas';

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
 * Register base model routes
 */
export async function baseModelRoutes(fastify: FastifyInstance): Promise<void> {
  // Apply admin auth to all routes
  fastify.addHook('preHandler', requireAdmin);

  // POST /base-models - Create base model
  fastify.post('/', {
    schema: {
      tags: ['Admin - Base Models'],
      summary: 'Create a new base model',
      body: {
        type: 'object',
        required: ['endpointId', 'slug', 'name', 'category', 'inputSchema', 'outputType', 'outputFormat'],
        properties: {
          endpointId: { type: 'string', format: 'uuid' },
          slug: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          category: { type: 'string', enum: ['IMAGE', 'AUDIO', 'TEXT', 'VIDEO', 'DOCUMENT'] },
          inputSchema: { type: 'object' },
          outputType: { type: 'string', enum: ['IMAGE', 'AUDIO', 'TEXT', 'FILE', 'JSON'] },
          outputFormat: { type: 'string' },
          estimatedSeconds: { type: 'number', default: 30 },
          isActive: { type: 'boolean', default: true },
        },
      },
      response: {
        201: wrapInSuccess(baseModelJsonSchema),
      },
    },
    handler: createBaseModelHandler,
  });

  // GET /base-models - List base models
  fastify.get('/', {
    schema: {
      tags: ['Admin - Base Models'],
      summary: 'List base models',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 20 },
          isActive: { type: 'string' },
          category: { type: 'string', enum: ['IMAGE', 'AUDIO', 'TEXT', 'VIDEO', 'DOCUMENT'] },
          endpointId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: wrapInPaginated(baseModelJsonSchema),
      },
    },
    handler: listBaseModelsHandler,
  });

  // GET /base-models/:id - Get base model
  fastify.get('/:id', {
    schema: {
      tags: ['Admin - Base Models'],
      summary: 'Get base model by ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: wrapInSuccess(baseModelJsonSchema),
      },
    },
    handler: getBaseModelHandler,
  });

  // PATCH /base-models/:id - Update base model
  fastify.patch('/:id', {
    schema: {
      tags: ['Admin - Base Models'],
      summary: 'Update base model',
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
          description: { type: 'string', nullable: true },
          category: { type: 'string', enum: ['IMAGE', 'AUDIO', 'TEXT', 'VIDEO', 'DOCUMENT'] },
          inputSchema: { type: 'object' },
          outputType: { type: 'string', enum: ['IMAGE', 'AUDIO', 'TEXT', 'FILE', 'JSON'] },
          outputFormat: { type: 'string' },
          estimatedSeconds: { type: 'number' },
          isActive: { type: 'boolean' },
        },
      },
      response: {
        200: wrapInSuccess(baseModelJsonSchema),
      },
    },
    handler: updateBaseModelHandler,
  });

  // DELETE /base-models/:id - Soft delete base model
  fastify.delete('/:id', {
    schema: {
      tags: ['Admin - Base Models'],
      summary: 'Soft delete base model (sets isActive to false)',
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
          description: 'Base model deleted',
        },
      },
    },
    handler: deleteBaseModelHandler,
  });
}
