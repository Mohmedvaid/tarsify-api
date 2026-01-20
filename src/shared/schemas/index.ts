/**
 * Shared Validation Schemas
 * Reusable Zod schemas for request validation
 */
import { z } from 'zod';
import { PAGINATION, GPU_TYPES, NOTEBOOK_STATUS, NOTEBOOK_CATEGORIES } from '@/config/constants';

/**
 * UUID schema
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * ID parameter schema
 */
export const idParamsSchema = z.object({
  id: uuidSchema,
});

/**
 * Pagination query schema
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : PAGINATION.DEFAULT_PAGE))
    .pipe(z.number().min(1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : PAGINATION.DEFAULT_LIMIT))
    .pipe(z.number().min(1).max(PAGINATION.MAX_LIMIT)),
});

/**
 * Search query schema
 */
export const searchSchema = paginationSchema.extend({
  q: z.string().optional(),
});

/**
 * Email schema
 */
export const emailSchema = z.string().email('Invalid email address');

/**
 * URL schema
 */
export const urlSchema = z.string().url('Invalid URL');

/**
 * Optional URL schema
 */
export const optionalUrlSchema = z.string().url('Invalid URL').optional().nullable();

/**
 * GPU type schema
 */
export const gpuTypeSchema = z.enum(GPU_TYPES);

/**
 * Notebook status schema
 */
export const notebookStatusSchema = z.enum(NOTEBOOK_STATUS);

/**
 * Notebook category schema
 */
export const notebookCategorySchema = z.enum(NOTEBOOK_CATEGORIES);

/**
 * Price (credits) schema
 */
export const priceSchema = z.number().int().min(1).max(10000);

/**
 * Timestamp schema
 */
export const timestampSchema = z.string().datetime();

/**
 * Common string validation
 */
export const stringSchema = {
  /**
   * Short text (title, name)
   */
  short: z.string().min(1).max(100).trim(),
  
  /**
   * Medium text (description)
   */
  medium: z.string().min(1).max(500).trim(),
  
  /**
   * Long text (content)
   */
  long: z.string().min(1).max(5000).trim(),
  
  /**
   * Optional short text
   */
  optionalShort: z.string().max(100).trim().optional().nullable(),
  
  /**
   * Optional medium text
   */
  optionalMedium: z.string().max(500).trim().optional().nullable(),
};

/**
 * Validate request body against schema
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (body: unknown): T => schema.parse(body);
}

/**
 * Validate request params against schema
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (params: unknown): T => schema.parse(params);
}

/**
 * Validate request query against schema
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (query: unknown): T => schema.parse(query);
}
