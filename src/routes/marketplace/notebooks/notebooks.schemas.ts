/**
 * Marketplace Notebooks Schemas
 * Zod schemas for browsing published notebooks
 */
import { z } from 'zod';
import { NOTEBOOK_CATEGORIES } from '@/config/constants';

// ============================================
// Input Schemas
// ============================================

/**
 * List notebooks query params
 */
export const listNotebooksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.enum(NOTEBOOK_CATEGORIES).optional(),
  search: z.string().max(100).optional(),
  sort: z
    .enum(['popular', 'newest', 'price_low', 'price_high', 'rating'])
    .default('popular'),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
});

export type ListNotebooksQuery = z.infer<typeof listNotebooksQuerySchema>;

/**
 * Notebook ID params
 */
export const notebookIdParamsSchema = z.object({
  id: z.string().uuid('Invalid notebook ID'),
});

export type NotebookIdParams = z.infer<typeof notebookIdParamsSchema>;

// ============================================
// Response Types
// ============================================

/**
 * Notebook card response (for lists)
 * Consumer-friendly version with display names
 */
export interface NotebookCardResponse {
  id: string;
  title: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  category: string;
  categoryDisplay: string;
  priceCredits: number;
  computeTier: string;
  computeTierDisplay: string;
  totalRuns: number;
  averageRating: number | null;
  developer: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

/**
 * Notebook detail response
 * Full details for single notebook view
 */
export interface NotebookDetailResponse extends NotebookCardResponse {
  description: string | null;
  createdAt: string;
}

// ============================================
// JSON Schemas (for Fastify serialization)
// ============================================

/**
 * Notebook card JSON schema
 */
export const notebookCardJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string' },
    shortDescription: { type: ['string', 'null'] },
    thumbnailUrl: { type: ['string', 'null'] },
    category: { type: 'string' },
    categoryDisplay: { type: 'string' },
    priceCredits: { type: 'integer' },
    computeTier: { type: 'string' },
    computeTierDisplay: { type: 'string' },
    totalRuns: { type: 'integer' },
    averageRating: { type: ['number', 'null'] },
    developer: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: ['string', 'null'] },
        avatarUrl: { type: ['string', 'null'] },
      },
    },
  },
  required: ['id', 'title', 'priceCredits', 'category', 'categoryDisplay', 'computeTier', 'computeTierDisplay', 'totalRuns', 'developer'],
} as const;

/**
 * Notebook detail JSON schema
 */
export const notebookDetailJsonSchema = {
  type: 'object',
  properties: {
    ...notebookCardJsonSchema.properties,
    description: { type: ['string', 'null'] },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: [...notebookCardJsonSchema.required, 'createdAt'],
} as const;

/**
 * List notebooks query JSON schema
 */
export const listNotebooksQueryJsonSchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    category: { type: 'string', enum: [...NOTEBOOK_CATEGORIES] },
    search: { type: 'string', maxLength: 100 },
    sort: { type: 'string', enum: ['popular', 'newest', 'price_low', 'price_high', 'rating'], default: 'popular' },
    minPrice: { type: 'integer', minimum: 0 },
    maxPrice: { type: 'integer', minimum: 0 },
  },
} as const;
