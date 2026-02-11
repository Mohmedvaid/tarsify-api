/**
 * Base Model Schemas
 * Zod validation schemas for admin base model routes
 */
import { z } from 'zod';
import { ModelCategory, OutputType } from '@prisma/client';

// ============================================
// Enums as Zod schemas
// ============================================

export const modelCategorySchema = z.nativeEnum(ModelCategory);
export const outputTypeSchema = z.nativeEnum(OutputType);

// ============================================
// Field Schemas
// ============================================

export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(100, 'Slug must be 100 characters or less')
  .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only');

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(200, 'Name must be 200 characters or less')
  .transform((val) => val.trim());

export const descriptionSchema = z
  .string()
  .max(10000, 'Description must be 10,000 characters or less')
  .transform((val) => val.trim())
  .optional()
  .nullable();

export const outputFormatSchema = z
  .string()
  .min(1, 'Output format is required')
  .max(20, 'Output format must be 20 characters or less');

export const estimatedSecondsSchema = z
  .number()
  .int('Estimated seconds must be a whole number')
  .min(1, 'Estimated seconds must be at least 1')
  .max(3600, 'Estimated seconds cannot exceed 1 hour')
  .default(30);

/**
 * JSON Schema validation - must be a valid JSON object
 */
export const inputSchemaSchema = z
  .object({})
  .passthrough()
  .refine(
    (val) => val.type === 'object' || val.properties !== undefined,
    'Input schema must be a valid JSON Schema object'
  );

// ============================================
// Request Schemas
// ============================================

/**
 * Create base model request
 */
export const createBaseModelSchema = z.object({
  endpointId: z.string().uuid('Invalid endpoint ID'),
  slug: slugSchema,
  name: nameSchema,
  description: descriptionSchema,
  category: modelCategorySchema,
  inputSchema: inputSchemaSchema,
  outputType: outputTypeSchema,
  outputFormat: outputFormatSchema,
  estimatedSeconds: estimatedSecondsSchema,
  isActive: z.boolean().default(true),
});

export type CreateBaseModelInput = z.infer<typeof createBaseModelSchema>;

/**
 * Update base model request
 */
export const updateBaseModelSchema = z.object({
  name: nameSchema.optional(),
  description: descriptionSchema,
  category: modelCategorySchema.optional(),
  inputSchema: inputSchemaSchema.optional(),
  outputType: outputTypeSchema.optional(),
  outputFormat: outputFormatSchema.optional(),
  estimatedSeconds: estimatedSecondsSchema.optional(),
  isActive: z.boolean().optional(),
});

export type UpdateBaseModelInput = z.infer<typeof updateBaseModelSchema>;

/**
 * List base models query
 */
export const listBaseModelsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  category: modelCategorySchema.optional(),
  endpointId: z.string().uuid().optional(),
});

export type ListBaseModelsQuery = z.infer<typeof listBaseModelsQuerySchema>;

/**
 * Base model ID param
 */
export const baseModelParamsSchema = z.object({
  id: z.string().uuid('Invalid base model ID'),
});

// ============================================
// Response JSON Schemas (for Fastify/Swagger)
// ============================================

export const baseModelJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    endpointId: { type: 'string', format: 'uuid' },
    slug: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string', nullable: true },
    category: { type: 'string', enum: ['IMAGE', 'AUDIO', 'TEXT', 'VIDEO', 'DOCUMENT'] },
    inputSchema: { type: 'object' },
    outputType: { type: 'string', enum: ['IMAGE', 'AUDIO', 'TEXT', 'FILE', 'JSON'] },
    outputFormat: { type: 'string' },
    estimatedSeconds: { type: 'number' },
    isActive: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    endpoint: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        runpodEndpointId: { type: 'string' },
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
