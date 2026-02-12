/**
 * Shared Schemas Tests
 * Tests for reusable validation schemas
 */
import { describe, it, expect } from 'vitest';
import {
  uuidSchema,
  idParamsSchema,
  paginationSchema,
  searchSchema,
  emailSchema,
  urlSchema,
  optionalUrlSchema,
  gpuTypeSchema,
  notebookStatusSchema,
  notebookCategorySchema,
  priceSchema,
  stringSchema,
  validateBody,
  validateParams,
  validateQuery,
} from './index';
import { z } from 'zod';

describe('Shared Schemas', () => {
  describe('uuidSchema', () => {
    it('should validate valid UUID', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(uuidSchema.parse(validUuid)).toBe(validUuid);
    });

    it('should reject invalid UUID', () => {
      expect(() => uuidSchema.parse('not-a-uuid')).toThrow();
    });
  });

  describe('idParamsSchema', () => {
    it('should validate params with id', () => {
      const params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      expect(idParamsSchema.parse(params)).toEqual(params);
    });

    it('should reject missing id', () => {
      expect(() => idParamsSchema.parse({})).toThrow();
    });
  });

  describe('paginationSchema', () => {
    it('should parse pagination with defaults', () => {
      const result = paginationSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should parse valid page and limit', () => {
      const result = paginationSchema.parse({ page: '2', limit: '50' });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
    });

    it('should reject limit above maximum', () => {
      expect(() => paginationSchema.parse({ limit: '500' })).toThrow();
    });
  });

  describe('searchSchema', () => {
    it('should extend pagination with search query', () => {
      const result = searchSchema.parse({ q: 'test', page: '1' });
      expect(result.q).toBe('test');
      expect(result.page).toBe(1);
    });

    it('should allow optional search query', () => {
      const result = searchSchema.parse({});
      expect(result.q).toBeUndefined();
    });
  });

  describe('emailSchema', () => {
    it('should validate valid email', () => {
      expect(emailSchema.parse('test@example.com')).toBe('test@example.com');
    });

    it('should reject invalid email', () => {
      expect(() => emailSchema.parse('invalid-email')).toThrow();
    });
  });

  describe('urlSchema', () => {
    it('should validate valid URL', () => {
      const url = 'https://example.com';
      expect(urlSchema.parse(url)).toBe(url);
    });

    it('should reject invalid URL', () => {
      expect(() => urlSchema.parse('not-a-url')).toThrow();
    });
  });

  describe('optionalUrlSchema', () => {
    it('should validate valid URL', () => {
      expect(optionalUrlSchema.parse('https://example.com')).toBe(
        'https://example.com'
      );
    });

    it('should allow undefined', () => {
      expect(optionalUrlSchema.parse(undefined)).toBeUndefined();
    });

    it('should allow null', () => {
      expect(optionalUrlSchema.parse(null)).toBeNull();
    });
  });

  describe('gpuTypeSchema', () => {
    it('should validate valid GPU types', () => {
      expect(gpuTypeSchema.parse('T4')).toBe('T4');
      expect(gpuTypeSchema.parse('L4')).toBe('L4');
      expect(gpuTypeSchema.parse('A100')).toBe('A100');
      expect(gpuTypeSchema.parse('H100')).toBe('H100');
    });

    it('should reject invalid GPU type', () => {
      expect(() => gpuTypeSchema.parse('INVALID')).toThrow();
    });
  });

  describe('notebookStatusSchema', () => {
    it('should validate valid status values', () => {
      expect(notebookStatusSchema.parse('draft')).toBe('draft');
      expect(notebookStatusSchema.parse('published')).toBe('published');
      expect(notebookStatusSchema.parse('archived')).toBe('archived');
    });

    it('should reject invalid status', () => {
      expect(() => notebookStatusSchema.parse('invalid')).toThrow();
    });
  });

  describe('notebookCategorySchema', () => {
    it('should validate valid categories', () => {
      expect(notebookCategorySchema.parse('image')).toBe('image');
      expect(notebookCategorySchema.parse('video')).toBe('video');
      expect(notebookCategorySchema.parse('text')).toBe('text');
    });

    it('should reject invalid category', () => {
      expect(() => notebookCategorySchema.parse('invalid')).toThrow();
    });
  });

  describe('priceSchema', () => {
    it('should validate valid price', () => {
      expect(priceSchema.parse(100)).toBe(100);
      expect(priceSchema.parse(1)).toBe(1);
      expect(priceSchema.parse(10000)).toBe(10000);
    });

    it('should reject negative price', () => {
      expect(() => priceSchema.parse(-1)).toThrow();
    });

    it('should reject zero', () => {
      expect(() => priceSchema.parse(0)).toThrow();
    });

    it('should reject price above max', () => {
      expect(() => priceSchema.parse(10001)).toThrow();
    });
  });

  describe('stringSchema', () => {
    it('should validate short strings', () => {
      expect(stringSchema.short.parse('Hello')).toBe('Hello');
    });

    it('should trim whitespace', () => {
      expect(stringSchema.short.parse('  Hello  ')).toBe('Hello');
    });

    it('should reject empty short string', () => {
      expect(() => stringSchema.short.parse('')).toThrow();
    });

    it('should validate medium strings', () => {
      expect(stringSchema.medium.parse('Description text')).toBe(
        'Description text'
      );
    });

    it('should validate optional short', () => {
      expect(stringSchema.optionalShort.parse(undefined)).toBeUndefined();
      expect(stringSchema.optionalShort.parse(null)).toBeNull();
    });
  });

  describe('validateBody', () => {
    it('should validate body against schema', () => {
      const schema = z.object({ name: z.string() });
      const validator = validateBody(schema);
      expect(validator({ name: 'Test' })).toEqual({ name: 'Test' });
    });

    it('should throw on invalid body', () => {
      const schema = z.object({ name: z.string() });
      const validator = validateBody(schema);
      expect(() => validator({})).toThrow();
    });
  });

  describe('validateParams', () => {
    it('should validate params against schema', () => {
      const validator = validateParams(idParamsSchema);
      const params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      expect(validator(params)).toEqual(params);
    });
  });

  describe('validateQuery', () => {
    it('should validate query against schema', () => {
      const validator = validateQuery(paginationSchema);
      const result = validator({ page: '2', limit: '10' });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });
  });
});
