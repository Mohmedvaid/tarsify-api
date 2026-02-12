/**
 * Utility Functions Unit Tests
 */
import { describe, it, expect } from 'vitest';
import {
  parsePagination,
  omit,
  pick,
  isDefined,
  slugify,
  sanitize,
  sleep,
  retry,
} from '../../src/shared/utils/index';

describe('Utility Functions', () => {
  describe('parsePagination', () => {
    it('should parse pagination with defaults', () => {
      const result = parsePagination({});

      expect(result).toEqual({
        page: 1,
        limit: 20,
        skip: 0,
      });
    });

    it('should parse valid page and limit', () => {
      const result = parsePagination({ page: '2', limit: '10' });

      expect(result).toEqual({
        page: 2,
        limit: 10,
        skip: 10,
      });
    });

    it('should enforce minimum page of 1', () => {
      const result = parsePagination({ page: '0' });

      expect(result.page).toBe(1);
    });

    it('should enforce maximum limit', () => {
      const result = parsePagination({ limit: '1000' });

      expect(result.limit).toBe(100);
    });

    it('should handle invalid values', () => {
      const result = parsePagination({ page: 'invalid', limit: 'invalid' });

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('omit', () => {
    it('should omit specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = omit(obj, ['b']);

      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('should handle empty keys array', () => {
      const obj = { a: 1, b: 2 };
      const result = omit(obj, []);

      expect(result).toEqual({ a: 1, b: 2 });
    });
  });

  describe('pick', () => {
    it('should pick specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = pick(obj, ['a', 'c']);

      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('should handle missing keys', () => {
      const obj = { a: 1 } as { a: number; b?: number };
      const result = pick(obj, ['a', 'b']);

      expect(result).toEqual({ a: 1 });
    });
  });

  describe('isDefined', () => {
    it('should return true for defined values', () => {
      expect(isDefined(0)).toBe(true);
      expect(isDefined('')).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined({})).toBe(true);
    });

    it('should return false for null and undefined', () => {
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);
    });
  });

  describe('slugify', () => {
    it('should convert text to slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
      expect(slugify('Special @#$ Characters!')).toBe('special-characters');
    });

    it('should handle empty string', () => {
      expect(slugify('')).toBe('');
    });
  });

  describe('sanitize', () => {
    it('should trim whitespace', () => {
      expect(sanitize('  hello  ')).toBe('hello');
    });

    it('should remove angle brackets', () => {
      expect(sanitize('<script>alert(1)</script>')).toBe(
        'scriptalert(1)/script'
      );
    });
  });

  describe('sleep', () => {
    it('should wait for specified milliseconds', async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45); // Allow some tolerance
    });
  });

  describe('retry', () => {
    it('should succeed on first attempt', async () => {
      let attempts = 0;
      const result = await retry(
        async () => {
          attempts++;
          return 'success';
        },
        { maxAttempts: 3, initialDelay: 10 }
      );

      expect(result).toBe('success');
      expect(attempts).toBe(1);
    });

    it('should retry on failure and succeed', async () => {
      let attempts = 0;
      const result = await retry(
        async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Temporary failure');
          }
          return 'success';
        },
        { maxAttempts: 3, initialDelay: 10 }
      );

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw after max attempts', async () => {
      let attempts = 0;
      await expect(
        retry(
          async () => {
            attempts++;
            throw new Error('Permanent failure');
          },
          { maxAttempts: 3, initialDelay: 10 }
        )
      ).rejects.toThrow('Permanent failure');

      expect(attempts).toBe(3);
    });
  });
});
