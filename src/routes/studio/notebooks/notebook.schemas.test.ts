/**
 * Notebook Schemas Unit Tests
 */
import { describe, it, expect } from 'vitest';
import {
  createNotebookSchema,
  listNotebooksQuerySchema,
  notebookParamsSchema,
} from './notebook.schemas';

describe('Notebook Schemas', () => {
  describe('createNotebookSchema', () => {
    it('should validate valid notebook creation', () => {
      const result = createNotebookSchema.safeParse({
        title: 'My AI Notebook',
        gpuType: 'T4',
        priceCredits: 10,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('My AI Notebook');
        expect(result.data.category).toBe('other'); // default
      }
    });

    it('should validate with all fields', () => {
      const result = createNotebookSchema.safeParse({
        title: 'Full Notebook',
        description: 'A complete notebook with all fields',
        shortDescription: 'Complete notebook',
        category: 'image',
        gpuType: 'A100',
        priceCredits: 100,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('image');
        expect(result.data.gpuType).toBe('A100');
      }
    });

    it('should reject title too short', () => {
      const result = createNotebookSchema.safeParse({
        title: 'AB',
        gpuType: 'T4',
        priceCredits: 10,
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const result = createNotebookSchema.safeParse({
        title: 'Valid Title',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid GPU type', () => {
      const result = createNotebookSchema.safeParse({
        title: 'My Notebook',
        gpuType: 'INVALID',
        priceCredits: 10,
      });

      expect(result.success).toBe(false);
    });

    it('should reject price less than 1', () => {
      const result = createNotebookSchema.safeParse({
        title: 'My Notebook',
        gpuType: 'T4',
        priceCredits: 0,
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid category', () => {
      const result = createNotebookSchema.safeParse({
        title: 'My Notebook',
        gpuType: 'T4',
        priceCredits: 10,
        category: 'invalid',
      });

      expect(result.success).toBe(false);
    });

    it('should trim whitespace from strings', () => {
      const result = createNotebookSchema.safeParse({
        title: '  Trimmed Title  ',
        gpuType: 'T4',
        priceCredits: 10,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Trimmed Title');
      }
    });
  });

  describe('listNotebooksQuerySchema', () => {
    it('should provide defaults', () => {
      const result = listNotebooksQuerySchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.status).toBe('all');
        expect(result.data.sort).toBe('-createdAt');
      }
    });

    it('should accept valid params', () => {
      const result = listNotebooksQuerySchema.safeParse({
        page: 2,
        limit: 50,
        status: 'draft',
        sort: 'title',
        search: 'test',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.status).toBe('draft');
      }
    });

    it('should coerce string numbers', () => {
      const result = listNotebooksQuerySchema.safeParse({
        page: '3',
        limit: '10',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(10);
      }
    });

    it('should reject invalid status', () => {
      const result = listNotebooksQuerySchema.safeParse({
        status: 'invalid',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid sort field', () => {
      const result = listNotebooksQuerySchema.safeParse({
        sort: 'invalidField',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('notebookParamsSchema', () => {
    it('should validate valid UUID', () => {
      const result = notebookParamsSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const result = notebookParamsSchema.safeParse({
        id: 'not-a-uuid',
      });

      expect(result.success).toBe(false);
    });
  });
});
