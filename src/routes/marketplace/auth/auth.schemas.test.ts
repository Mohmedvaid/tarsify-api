/**
 * Marketplace Auth Schema Tests
 * Unit tests for consumer authentication schemas
 */
import { describe, it, expect } from 'vitest';
import {
  registerConsumerSchema,
  updateProfileSchema,
} from './auth.schemas';

describe('Marketplace Auth Schema Tests', () => {
  describe('registerConsumerSchema', () => {
    it('should accept valid registration data', () => {
      const result = registerConsumerSchema.safeParse({
        email: 'consumer@example.com',
        name: 'Test Consumer',
      });
      expect(result.success).toBe(true);
    });

    it('should require email', () => {
      const result = registerConsumerSchema.safeParse({
        name: 'Test Consumer',
      });
      expect(result.success).toBe(false);
    });

    it('should validate email format', () => {
      const result = registerConsumerSchema.safeParse({
        email: 'invalid-email',
      });
      expect(result.success).toBe(false);
    });

    it('should accept without name', () => {
      const result = registerConsumerSchema.safeParse({
        email: 'consumer@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should reject name under 2 chars', () => {
      const result = registerConsumerSchema.safeParse({
        email: 'consumer@example.com',
        name: 'A',
      });
      expect(result.success).toBe(false);
    });

    it('should reject name over 100 chars', () => {
      const result = registerConsumerSchema.safeParse({
        email: 'consumer@example.com',
        name: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateProfileSchema', () => {
    it('should accept valid profile update', () => {
      const result = updateProfileSchema.safeParse({
        name: 'Updated Name',
        avatarUrl: 'https://example.com/avatar.jpg',
      });
      expect(result.success).toBe(true);
    });

    it('should accept partial updates', () => {
      const result = updateProfileSchema.safeParse({
        name: 'Updated Name',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = updateProfileSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate avatarUrl format', () => {
      const result = updateProfileSchema.safeParse({
        avatarUrl: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('should accept null avatarUrl', () => {
      const result = updateProfileSchema.safeParse({
        avatarUrl: null,
      });
      expect(result.success).toBe(true);
    });
  });
});
