/**
 * Marketplace Runs Schema Tests
 * Unit tests for notebook execution schemas
 */
import { describe, it, expect } from 'vitest';
import {
  notebookIdParamsSchema,
  runNotebookSchema,
  listRunsQuerySchema,
  runIdParamsSchema,
} from './runs.schemas';

describe('Marketplace Runs Schema Tests', () => {
  describe('notebookIdParamsSchema', () => {
    it('should accept valid notebook UUID', () => {
      const result = notebookIdParamsSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const result = notebookIdParamsSchema.safeParse({
        id: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('should require id', () => {
      const result = notebookIdParamsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('runNotebookSchema', () => {
    it('should accept valid input data', () => {
      const result = runNotebookSchema.safeParse({
        inputData: { prompt: 'Generate an image of a cat' },
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = runNotebookSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept undefined inputData', () => {
      const result = runNotebookSchema.safeParse({ inputData: undefined });
      expect(result.success).toBe(true);
    });

    it('should accept complex nested input', () => {
      const result = runNotebookSchema.safeParse({
        inputData: {
          prompt: 'test',
          settings: {
            width: 512,
            height: 512,
          },
          tags: ['landscape', 'nature'],
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('listRunsQuerySchema', () => {
    it('should accept valid query params', () => {
      const result = listRunsQuerySchema.safeParse({
        page: 1,
        limit: 20,
        status: 'completed',
      });
      expect(result.success).toBe(true);
    });

    it('should apply defaults', () => {
      const result = listRunsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data?.page).toBe(1);
      expect(result.data?.limit).toBe(20);
    });

    it('should reject invalid page', () => {
      const result = listRunsQuerySchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject invalid limit', () => {
      const result = listRunsQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });

    it('should accept valid status values', () => {
      const statuses = ['pending', 'running', 'completed', 'failed'];
      statuses.forEach(status => {
        const result = listRunsQuerySchema.safeParse({ status });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid status', () => {
      const result = listRunsQuerySchema.safeParse({ status: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('runIdParamsSchema', () => {
    it('should accept valid run UUID', () => {
      const result = runIdParamsSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const result = runIdParamsSchema.safeParse({
        id: 'invalid-id',
      });
      expect(result.success).toBe(false);
    });
  });
});
