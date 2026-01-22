/**
 * Auth Schemas Unit Tests
 * Tests for Zod validation schemas
 */
import { describe, it, expect } from 'vitest';
import {
  registerDeveloperSchema,
  updateProfileSchema,
  completeProfileSchema,
  emailSchema,
  displayNameSchema,
} from './auth.schemas';

describe('Auth Schemas', () => {
  // ============================================
  // Email Schema
  // ============================================
  describe('emailSchema', () => {
    it('should accept valid email', () => {
      const result = emailSchema.safeParse('test@example.com');
      expect(result.success).toBe(true);
      expect(result.data).toBe('test@example.com');
    });

    it('should lowercase email', () => {
      const result = emailSchema.safeParse('TEST@EXAMPLE.COM');
      expect(result.success).toBe(true);
      expect(result.data).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const result = emailSchema.safeParse('  test@example.com  ');
      expect(result.success).toBe(true);
      expect(result.data).toBe('test@example.com');
    });

    it('should reject invalid email', () => {
      const result = emailSchema.safeParse('not-an-email');
      expect(result.success).toBe(false);
    });

    it('should reject empty string', () => {
      const result = emailSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject email too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = emailSchema.safeParse(longEmail);
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // Display Name Schema
  // ============================================
  describe('displayNameSchema', () => {
    it('should accept valid name', () => {
      const result = displayNameSchema.safeParse('John Doe');
      expect(result.success).toBe(true);
      expect(result.data).toBe('John Doe');
    });

    it('should trim whitespace', () => {
      const result = displayNameSchema.safeParse('  John Doe  ');
      expect(result.success).toBe(true);
      expect(result.data).toBe('John Doe');
    });

    it('should accept names with apostrophes', () => {
      const result = displayNameSchema.safeParse("O'Brien");
      expect(result.success).toBe(true);
    });

    it('should accept names with hyphens', () => {
      const result = displayNameSchema.safeParse('Mary-Jane');
      expect(result.success).toBe(true);
    });

    it('should accept names with periods', () => {
      const result = displayNameSchema.safeParse('Dr. Smith');
      expect(result.success).toBe(true);
    });

    it('should reject name too short', () => {
      const result = displayNameSchema.safeParse('A');
      expect(result.success).toBe(false);
    });

    it('should reject name too long', () => {
      const result = displayNameSchema.safeParse('A'.repeat(101));
      expect(result.success).toBe(false);
    });

    it('should reject special characters', () => {
      const result = displayNameSchema.safeParse('<script>');
      expect(result.success).toBe(false);
    });

    it('should reject emoji', () => {
      const result = displayNameSchema.safeParse('John 🚀');
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // Register Developer Schema
  // ============================================
  describe('registerDeveloperSchema', () => {
    it('should accept valid registration', () => {
      const result = registerDeveloperSchema.safeParse({
        email: 'test@example.com',
        displayName: 'John Doe',
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        email: 'test@example.com',
        displayName: 'John Doe',
      });
    });

    it('should accept registration without displayName', () => {
      const result = registerDeveloperSchema.safeParse({
        email: 'test@example.com',
      });
      expect(result.success).toBe(true);
      expect(result.data?.displayName).toBeUndefined();
    });

    it('should reject missing email', () => {
      const result = registerDeveloperSchema.safeParse({
        displayName: 'John Doe',
      });
      expect(result.success).toBe(false);
    });

    it('should reject extra fields', () => {
      const result = registerDeveloperSchema.safeParse({
        email: 'test@example.com',
        displayName: 'John Doe',
        malicious: 'data',
      });
      // Zod strips extra fields by default
      expect(result.success).toBe(true);
      expect(result.data).not.toHaveProperty('malicious');
    });
  });

  // ============================================
  // Update Profile Schema
  // ============================================
  describe('updateProfileSchema', () => {
    it('should accept partial update', () => {
      const result = updateProfileSchema.safeParse({
        displayName: 'New Name',
      });
      expect(result.success).toBe(true);
    });

    it('should accept avatarUrl', () => {
      const result = updateProfileSchema.safeParse({
        avatarUrl: 'https://example.com/avatar.png',
      });
      expect(result.success).toBe(true);
    });

    it('should accept null avatarUrl', () => {
      const result = updateProfileSchema.safeParse({
        avatarUrl: null,
      });
      expect(result.success).toBe(true);
      expect(result.data?.avatarUrl).toBeNull();
    });

    it('should reject invalid avatarUrl', () => {
      const result = updateProfileSchema.safeParse({
        avatarUrl: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('should accept bio', () => {
      const result = updateProfileSchema.safeParse({
        bio: 'I am a developer who loves AI.',
      });
      expect(result.success).toBe(true);
    });

    it('should reject bio too long', () => {
      const result = updateProfileSchema.safeParse({
        bio: 'A'.repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it('should accept empty object', () => {
      const result = updateProfileSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // Complete Profile Schema
  // ============================================
  describe('completeProfileSchema', () => {
    it('should accept valid complete profile', () => {
      const result = completeProfileSchema.safeParse({
        displayName: 'John Doe',
        bio: 'Developer',
        payoutEmail: 'payout@example.com',
        country: 'US',
      });
      expect(result.success).toBe(true);
    });

    it('should require displayName', () => {
      const result = completeProfileSchema.safeParse({
        payoutEmail: 'payout@example.com',
      });
      expect(result.success).toBe(false);
    });

    it('should accept only displayName', () => {
      const result = completeProfileSchema.safeParse({
        displayName: 'John Doe',
      });
      expect(result.success).toBe(true);
    });

    it('should validate country code length', () => {
      const result = completeProfileSchema.safeParse({
        displayName: 'John Doe',
        country: 'USA',
      });
      expect(result.success).toBe(false);
    });

    it('should uppercase country code', () => {
      const result = completeProfileSchema.safeParse({
        displayName: 'John Doe',
        country: 'us',
      });
      expect(result.success).toBe(true);
      expect(result.data?.country).toBe('US');
    });

    it('should validate payoutEmail', () => {
      const result = completeProfileSchema.safeParse({
        displayName: 'John Doe',
        payoutEmail: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });
  });
});
