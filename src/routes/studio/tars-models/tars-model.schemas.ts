/**
 * Tars Model Schemas
 * Zod validation schemas for developer tars model routes
 */
import { z } from 'zod';
import { TarsModelStatus } from '@prisma/client';

// ============================================
// Enums as Zod schemas
// ============================================

export const tarsModelStatusSchema = z.nativeEnum(TarsModelStatus);

// ============================================
// Field Schemas
// ============================================

export const titleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(200, 'Title must be 200 characters or less')
  .transform((val) => val.trim());

export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(200, 'Slug must be 200 characters or less')
  .transform((val) => val.toLowerCase().trim()) // Normalize to lowercase
  .refine(
    (val) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(val),
    'Slug must be alphanumeric with hyphens (no spaces, no special characters)'
  );

export const descriptionSchema = z
  .string()
  .max(5000, 'Description must be 5000 characters or less')
  .optional()
  .nullable();

export const configOverridesSchema = z
  .record(z.unknown())
  .optional()
  .nullable();

// ============================================
// Request Schemas
// ============================================

/**
 * Create tars model request
 */
export const createTarsModelSchema = z.object({
  baseModelId: z.string().uuid('Invalid base model ID'),
  title: titleSchema,
  slug: slugSchema,
  description: descriptionSchema,
  configOverrides: configOverridesSchema,
});

export type CreateTarsModelInput = z.infer<typeof createTarsModelSchema>;

/**
 * Update tars model request
 */
export const updateTarsModelSchema = z.object({
  title: titleSchema.optional(),
  slug: slugSchema.optional(),
  description: descriptionSchema,
  configOverrides: configOverridesSchema,
});

export type UpdateTarsModelInput = z.infer<typeof updateTarsModelSchema>;

/**
 * List tars models query
 */
export const listTarsModelsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: tarsModelStatusSchema.optional(),
});

export type ListTarsModelsQuery = z.infer<typeof listTarsModelsQuerySchema>;

/**
 * Publish tars model request
 */
export const publishTarsModelSchema = z.object({
  action: z.enum(['publish', 'archive']),
});

export type PublishTarsModelInput = z.infer<typeof publishTarsModelSchema>;

// ============================================
// Response Schemas (for OpenAPI docs)
// ============================================

export const tarsModelResponseJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    developerId: { type: 'string', format: 'uuid' },
    baseModelId: { type: 'string', format: 'uuid' },
    title: { type: 'string' },
    slug: { type: 'string' },
    description: { type: 'string', nullable: true },
    configOverrides: { type: 'object', nullable: true },
    status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    publishedAt: { type: 'string', format: 'date-time', nullable: true },
    baseModel: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        slug: { type: 'string' },
        name: { type: 'string' },
        category: { type: 'string' },
        outputType: { type: 'string' },
      },
    },
  },
};

export const tarsModelsListResponseJsonSchema = {
  type: 'array',
  items: tarsModelResponseJsonSchema,
};
