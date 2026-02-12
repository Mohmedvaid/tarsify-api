/**
 * Tars Model Schemas Tests
 * Unit tests for schema validation including slug normalization
 */

import { describe, it, expect } from 'vitest';
import {
  slugSchema,
  titleSchema,
  createTarsModelSchema,
  updateTarsModelSchema,
} from './tars-model.schemas';

describe('Tars Model Schemas', () => {
  // ============================================
  // slugSchema
  // ============================================
  describe('slugSchema', () => {
    it('should accept valid lowercase slug', () => {
      const result = slugSchema.parse('my-cool-model');
      expect(result).toBe('my-cool-model');
    });

    it('should normalize uppercase to lowercase', () => {
      const result = slugSchema.parse('My-Cool-Model');
      expect(result).toBe('my-cool-model');
    });

    it('should normalize mixed case to lowercase', () => {
      const result = slugSchema.parse('MY-COOL-MODEL');
      expect(result).toBe('my-cool-model');
    });

    it('should trim whitespace', () => {
      const result = slugSchema.parse('  my-model  ');
      expect(result).toBe('my-model');
    });

    it('should accept slug with numbers', () => {
      const result = slugSchema.parse('model-v2-beta');
      expect(result).toBe('model-v2-beta');
    });

    it('should accept single word slug', () => {
      const result = slugSchema.parse('model');
      expect(result).toBe('model');
    });

    it('should reject slug with spaces', () => {
      expect(() => slugSchema.parse('my cool model')).toThrow();
    });

    it('should reject slug with underscores', () => {
      expect(() => slugSchema.parse('my_cool_model')).toThrow();
    });

    it('should reject slug starting with hyphen', () => {
      expect(() => slugSchema.parse('-my-model')).toThrow();
    });

    it('should reject slug ending with hyphen', () => {
      expect(() => slugSchema.parse('my-model-')).toThrow();
    });

    it('should reject slug with consecutive hyphens', () => {
      expect(() => slugSchema.parse('my--model')).toThrow();
    });

    it('should reject slug with special characters', () => {
      expect(() => slugSchema.parse('my@model')).toThrow();
      expect(() => slugSchema.parse('my.model')).toThrow();
      expect(() => slugSchema.parse('my/model')).toThrow();
    });

    it('should reject empty slug', () => {
      expect(() => slugSchema.parse('')).toThrow();
    });

    it('should reject slug exceeding max length', () => {
      const longSlug = 'a'.repeat(201);
      expect(() => slugSchema.parse(longSlug)).toThrow();
    });

    it('should accept slug at max length', () => {
      const maxSlug = 'a'.repeat(200);
      const result = slugSchema.parse(maxSlug);
      expect(result).toBe(maxSlug);
    });
  });

  // ============================================
  // titleSchema
  // ============================================
  describe('titleSchema', () => {
    it('should accept valid title', () => {
      const result = titleSchema.parse('My Cool AI Model');
      expect(result).toBe('My Cool AI Model');
    });

    it('should trim whitespace', () => {
      const result = titleSchema.parse('  My Model  ');
      expect(result).toBe('My Model');
    });

    it('should reject empty title', () => {
      expect(() => titleSchema.parse('')).toThrow();
    });

    it('should reject title exceeding max length', () => {
      const longTitle = 'a'.repeat(201);
      expect(() => titleSchema.parse(longTitle)).toThrow();
    });
  });

  // ============================================
  // createTarsModelSchema
  // ============================================
  describe('createTarsModelSchema', () => {
    const validInput = {
      baseModelId: '123e4567-e89b-12d3-a456-426614174000',
      title: 'My AI Model',
      slug: 'my-ai-model',
    };

    it('should parse valid input', () => {
      const result = createTarsModelSchema.parse(validInput);
      expect(result.title).toBe('My AI Model');
      expect(result.slug).toBe('my-ai-model');
    });

    it('should normalize slug to lowercase', () => {
      const input = { ...validInput, slug: 'MY-AI-MODEL' };
      const result = createTarsModelSchema.parse(input);
      expect(result.slug).toBe('my-ai-model');
    });

    it('should accept optional description', () => {
      const input = { ...validInput, description: 'A cool model' };
      const result = createTarsModelSchema.parse(input);
      expect(result.description).toBe('A cool model');
    });

    it('should accept optional configOverrides', () => {
      const input = {
        ...validInput,
        configOverrides: { defaultInputs: { style: 'anime' } },
      };
      const result = createTarsModelSchema.parse(input);
      expect(result.configOverrides).toEqual({
        defaultInputs: { style: 'anime' },
      });
    });

    it('should reject invalid baseModelId', () => {
      const input = { ...validInput, baseModelId: 'not-a-uuid' };
      expect(() => createTarsModelSchema.parse(input)).toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => createTarsModelSchema.parse({})).toThrow();
      expect(() => createTarsModelSchema.parse({ title: 'Test' })).toThrow();
      expect(() => createTarsModelSchema.parse({ slug: 'test' })).toThrow();
    });
  });

  // ============================================
  // updateTarsModelSchema
  // ============================================
  describe('updateTarsModelSchema', () => {
    it('should allow partial updates', () => {
      const result = updateTarsModelSchema.parse({ title: 'New Title' });
      expect(result.title).toBe('New Title');
    });

    it('should normalize slug on update', () => {
      const result = updateTarsModelSchema.parse({ slug: 'NEW-SLUG' });
      expect(result.slug).toBe('new-slug');
    });

    it('should allow empty update', () => {
      const result = updateTarsModelSchema.parse({});
      expect(result).toEqual({});
    });

    it('should reject invalid slug on update', () => {
      expect(() =>
        updateTarsModelSchema.parse({ slug: 'invalid slug' })
      ).toThrow();
    });
  });
});
