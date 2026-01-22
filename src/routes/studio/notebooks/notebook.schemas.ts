/**
 * Notebook Schemas
 * Zod validation schemas for notebook endpoints
 */
import { z } from 'zod';
import { GpuType, NotebookCategory, NotebookStatus } from '@prisma/client';

// ============================================
// Enums as Zod schemas
// ============================================

export const gpuTypeSchema = z.nativeEnum(GpuType);
export const notebookCategorySchema = z.nativeEnum(NotebookCategory);
export const notebookStatusSchema = z.nativeEnum(NotebookStatus);

// ============================================
// Common field schemas
// ============================================

/**
 * Notebook title validation
 */
export const titleSchema = z
  .string()
  .min(3, 'Title must be at least 3 characters')
  .max(200, 'Title must be 200 characters or less')
  .transform((val) => val.trim());

/**
 * Notebook description validation
 */
export const descriptionSchema = z
  .string()
  .max(10000, 'Description must be 10,000 characters or less')
  .transform((val) => val.trim())
  .optional()
  .nullable();

/**
 * Short description validation
 */
export const shortDescriptionSchema = z
  .string()
  .max(255, 'Short description must be 255 characters or less')
  .transform((val) => val.trim())
  .optional()
  .nullable();

/**
 * Thumbnail URL validation
 */
export const thumbnailUrlSchema = z
  .string()
  .url('Invalid thumbnail URL')
  .max(2048, 'URL must be 2048 characters or less')
  .optional()
  .nullable();

/**
 * Price in credits validation (minimum 1 credit)
 */
export const priceCreditsSchema = z
  .number()
  .int('Price must be a whole number')
  .min(1, 'Price must be at least 1 credit')
  .max(10000, 'Price cannot exceed 10,000 credits');

/**
 * Estimated runtime in seconds
 */
export const estimatedRuntimeSchema = z
  .number()
  .int('Runtime must be a whole number')
  .min(1, 'Runtime must be at least 1 second')
  .max(3600, 'Runtime cannot exceed 1 hour (3600 seconds)')
  .optional();

/**
 * UUID validation for notebook ID
 */
export const notebookIdSchema = z.string().uuid('Invalid notebook ID');

// ============================================
// Request schemas
// ============================================

/**
 * Create notebook request
 */
export const createNotebookSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  shortDescription: shortDescriptionSchema,
  category: notebookCategorySchema.default('other'),
  gpuType: gpuTypeSchema,
  priceCredits: priceCreditsSchema,
});

export type CreateNotebookInput = z.infer<typeof createNotebookSchema>;

/**
 * List notebooks query params
 */
export const listNotebooksQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
  status: z
    .enum(['draft', 'published', 'archived', 'all'])
    .default('all'),
  sort: z
    .string()
    .regex(
      /^-?(createdAt|updatedAt|title|totalRuns|priceCredits)$/,
      'Invalid sort field'
    )
    .default('-createdAt'),
  search: z
    .string()
    .max(100, 'Search query too long')
    .transform((val) => val.trim())
    .optional(),
});

export type ListNotebooksQuery = z.infer<typeof listNotebooksQuerySchema>;

/**
 * Notebook ID path params
 */
export const notebookParamsSchema = z.object({
  id: notebookIdSchema,
});

export type NotebookParams = z.infer<typeof notebookParamsSchema>;

// ============================================
// Response schemas (for JSON Schema generation)
// ============================================

/**
 * Notebook list item response (subset of full notebook)
 */
export const notebookListItemJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string' },
    shortDescription: { type: ['string', 'null'] },
    thumbnailUrl: { type: ['string', 'null'] },
    category: { type: 'string', enum: Object.values(NotebookCategory) },
    status: { type: 'string', enum: Object.values(NotebookStatus) },
    priceCredits: { type: 'integer' },
    gpuType: { type: 'string', enum: Object.values(GpuType) },
    totalRuns: { type: 'integer' },
    averageRating: { type: ['number', 'null'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

/**
 * Full notebook response
 */
export const notebookDetailJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    developerId: { type: 'string', format: 'uuid' },
    title: { type: 'string' },
    description: { type: ['string', 'null'] },
    shortDescription: { type: ['string', 'null'] },
    thumbnailUrl: { type: ['string', 'null'] },
    category: { type: 'string', enum: Object.values(NotebookCategory) },
    status: { type: 'string', enum: Object.values(NotebookStatus) },
    priceCredits: { type: 'integer' },
    gpuType: { type: 'string', enum: Object.values(GpuType) },
    totalRuns: { type: 'integer' },
    averageRating: { type: ['number', 'null'] },
    notebookFileUrl: { type: ['string', 'null'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

/**
 * Notebook create/update response
 */
export const notebookMutationJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string' },
    description: { type: ['string', 'null'] },
    shortDescription: { type: ['string', 'null'] },
    thumbnailUrl: { type: ['string', 'null'] },
    category: { type: 'string', enum: Object.values(NotebookCategory) },
    status: { type: 'string', enum: Object.values(NotebookStatus) },
    priceCredits: { type: 'integer' },
    gpuType: { type: 'string', enum: Object.values(GpuType) },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

/**
 * Pagination meta schema
 */
export const paginationMetaJsonSchema = {
  type: 'object',
  properties: {
    page: { type: 'integer' },
    limit: { type: 'integer' },
    total: { type: 'integer' },
    totalPages: { type: 'integer' },
  },
};
