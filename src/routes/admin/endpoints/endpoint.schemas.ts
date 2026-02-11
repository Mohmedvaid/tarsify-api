/**
 * Endpoint Schemas
 * Zod validation schemas for admin endpoint routes
 */
import { z } from 'zod';
import { EndpointSource } from '@prisma/client';

// ============================================
// Enums as Zod schemas
// ============================================

export const endpointSourceSchema = z.nativeEnum(EndpointSource);

// ============================================
// Field Schemas
// ============================================

export const runpodEndpointIdSchema = z
  .string()
  .min(1, 'RunPod endpoint ID is required')
  .max(100, 'RunPod endpoint ID too long');

export const endpointNameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be 100 characters or less')
  .transform((val) => val.trim());

export const gpuTypeSchema = z
  .string()
  .min(1, 'GPU type is required')
  .max(50, 'GPU type must be 50 characters or less');

export const dockerImageSchema = z
  .string()
  .max(500, 'Docker image must be 500 characters or less')
  .optional()
  .nullable();

// ============================================
// Request Schemas
// ============================================

/**
 * Create endpoint request
 */
export const createEndpointSchema = z.object({
  runpodEndpointId: runpodEndpointIdSchema,
  name: endpointNameSchema,
  source: endpointSourceSchema.default('HUB'),
  dockerImage: dockerImageSchema,
  gpuType: gpuTypeSchema,
  isActive: z.boolean().default(true),
});

export type CreateEndpointInput = z.infer<typeof createEndpointSchema>;

/**
 * Update endpoint request
 */
export const updateEndpointSchema = z.object({
  name: endpointNameSchema.optional(),
  source: endpointSourceSchema.optional(),
  dockerImage: dockerImageSchema,
  gpuType: gpuTypeSchema.optional(),
  isActive: z.boolean().optional(),
});

export type UpdateEndpointInput = z.infer<typeof updateEndpointSchema>;

/**
 * List endpoints query
 */
export const listEndpointsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

export type ListEndpointsQuery = z.infer<typeof listEndpointsQuerySchema>;

/**
 * Endpoint ID param
 */
export const endpointParamsSchema = z.object({
  id: z.string().uuid('Invalid endpoint ID'),
});

// ============================================
// Response JSON Schemas (for Fastify/Swagger)
// ============================================

export const endpointJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    runpodEndpointId: { type: 'string' },
    name: { type: 'string' },
    source: { type: 'string', enum: ['HUB', 'CUSTOM'] },
    dockerImage: { type: 'string', nullable: true },
    gpuType: { type: 'string' },
    isActive: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    _count: {
      type: 'object',
      properties: {
        baseModels: { type: 'number' },
      },
    },
  },
};

export const paginationMetaJsonSchema = {
  type: 'object',
  properties: {
    page: { type: 'number' },
    limit: { type: 'number' },
    total: { type: 'number' },
    totalPages: { type: 'number' },
  },
};
