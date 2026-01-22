/**
 * Runs Schemas
 * Zod schemas for notebook execution (runs)
 */
import { z } from 'zod';
import { EXECUTION_STATUS } from '@/config/constants';

// ============================================
// Input Schemas
// ============================================

/**
 * Run notebook input (POST body)
 */
export const runNotebookSchema = z.object({
  // Future: input parameters for the notebook
  // For now, just start the run
  inputData: z.record(z.unknown()).optional(),
});

export type RunNotebookInput = z.infer<typeof runNotebookSchema>;

/**
 * List runs query params
 */
export const listRunsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(EXECUTION_STATUS).optional(),
});

export type ListRunsQuery = z.infer<typeof listRunsQuerySchema>;

/**
 * Run ID params
 */
export const runIdParamsSchema = z.object({
  id: z.string().uuid('Invalid run ID'),
});

export type RunIdParams = z.infer<typeof runIdParamsSchema>;

/**
 * Notebook ID params (for running)
 */
export const notebookIdParamsSchema = z.object({
  id: z.string().uuid('Invalid notebook ID'),
});

export type NotebookIdParams = z.infer<typeof notebookIdParamsSchema>;

// ============================================
// Response Types
// ============================================

/**
 * Run response
 */
export interface RunResponse {
  id: string;
  status: string;
  statusDisplay: string;
  creditsCharged: number;
  computeTier: string | null;
  computeTierDisplay: string;
  startedAt: string | null;
  completedAt: string | null;
  outputUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
  notebook: {
    id: string;
    title: string;
    shortDescription: string | null;
    thumbnailUrl: string | null;
    category: string;
    categoryDisplay: string;
    developer: {
      id: string;
      name: string | null;
    };
  };
}

/**
 * Run started response (after POST /notebooks/:id/run)
 */
export interface RunStartedResponse {
  id: string;
  status: string;
  statusDisplay: string;
  creditsCharged: number;
  message: string;
  remainingCredits: number;
}

// ============================================
// JSON Schemas
// ============================================

export const runStartedJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    status: { type: 'string' },
    statusDisplay: { type: 'string' },
    creditsCharged: { type: 'integer' },
    message: { type: 'string' },
    remainingCredits: { type: 'integer' },
  },
  required: ['id', 'status', 'statusDisplay', 'creditsCharged', 'message', 'remainingCredits'],
} as const;

export const runResponseJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    status: { type: 'string' },
    statusDisplay: { type: 'string' },
    creditsCharged: { type: 'integer' },
    computeTier: { type: ['string', 'null'] },
    computeTierDisplay: { type: 'string' },
    startedAt: { type: ['string', 'null'], format: 'date-time' },
    completedAt: { type: ['string', 'null'], format: 'date-time' },
    outputUrl: { type: ['string', 'null'] },
    errorMessage: { type: ['string', 'null'] },
    createdAt: { type: 'string', format: 'date-time' },
    notebook: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        title: { type: 'string' },
        shortDescription: { type: ['string', 'null'] },
        thumbnailUrl: { type: ['string', 'null'] },
        category: { type: 'string' },
        categoryDisplay: { type: 'string' },
        developer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: ['string', 'null'] },
          },
        },
      },
    },
  },
  required: ['id', 'status', 'statusDisplay', 'creditsCharged', 'createdAt', 'notebook'],
} as const;

export const listRunsQueryJsonSchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    status: { type: 'string', enum: [...EXECUTION_STATUS] },
  },
} as const;
