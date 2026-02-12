/**
 * Models Schemas
 * Zod validation schemas for public model routes
 */
import { z } from 'zod';
import { ModelCategory } from '@prisma/client';

// ============================================
// Request Schemas
// ============================================

/**
 * List models query
 */
export const listModelsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.nativeEnum(ModelCategory).optional(),
  search: z.string().max(100).optional(),
});

export type ListModelsQuery = z.infer<typeof listModelsQuerySchema>;

// ============================================
// Response Schemas (for OpenAPI docs)
// ============================================

export const publicModelResponseJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    slug: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string', nullable: true },
    developer: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', nullable: true },
      },
    },
    baseModel: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        category: { type: 'string' },
        outputType: { type: 'string' },
        outputFormat: { type: 'string' },
        inputSchema: { type: 'object' },
        estimatedSeconds: { type: 'integer' },
      },
    },
  },
};

export const modelsListResponseJsonSchema = {
  type: 'object',
  properties: {
    models: {
      type: 'array',
      items: publicModelResponseJsonSchema,
    },
    total: { type: 'integer' },
    page: { type: 'integer' },
    limit: { type: 'integer' },
    pages: { type: 'integer' },
  },
};
