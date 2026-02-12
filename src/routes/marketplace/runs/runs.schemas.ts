/**
 * Runs Schemas
 * Zod validation schemas for consumer execution routes
 */
import { z } from 'zod';
import { EngineExecutionStatus } from '@prisma/client';

// ============================================
// Enums as Zod schemas
// ============================================

export const executionStatusSchema = z.nativeEnum(EngineExecutionStatus);

// ============================================
// Request Schemas
// ============================================

/**
 * Run a model request
 */
export const runModelSchema = z.object({
  inputs: z.record(z.unknown()).default({}),
});

export type RunModelInput = z.infer<typeof runModelSchema>;

/**
 * List runs query
 */
export const listRunsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: executionStatusSchema.optional(),
});

export type ListRunsQuery = z.infer<typeof listRunsQuerySchema>;

// ============================================
// Response Schemas (for OpenAPI docs)
// ============================================

export const executionResponseJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    status: {
      type: 'string',
      enum: [
        'PENDING',
        'QUEUED',
        'RUNNING',
        'COMPLETED',
        'FAILED',
        'TIMED_OUT',
        'CANCELLED',
      ],
    },
    runpodJobId: { type: 'string', nullable: true },
    inputPayload: { type: 'object' },
    outputPayload: { type: 'object', nullable: true },
    errorMessage: { type: 'string', nullable: true },
    startedAt: { type: 'string', format: 'date-time', nullable: true },
    completedAt: { type: 'string', format: 'date-time', nullable: true },
    executionTimeMs: { type: 'integer', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    tarsModel: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        slug: { type: 'string' },
        title: { type: 'string' },
        baseModel: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            category: { type: 'string' },
            outputType: { type: 'string' },
          },
        },
      },
    },
  },
};

export const runStartedResponseJsonSchema = {
  type: 'object',
  properties: {
    executionId: { type: 'string', format: 'uuid' },
    status: { type: 'string' },
    message: { type: 'string' },
  },
};

export const runsListResponseJsonSchema = {
  type: 'object',
  properties: {
    runs: {
      type: 'array',
      items: executionResponseJsonSchema,
    },
    total: { type: 'integer' },
    page: { type: 'integer' },
    limit: { type: 'integer' },
    pages: { type: 'integer' },
  },
};
