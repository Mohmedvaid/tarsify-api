/**
 * Response Utilities Unit Tests
 */
import { describe, it, expect } from 'vitest';
import {
  successResponse,
  errorResponse,
  createPaginationMeta,
} from '../../src/core/responses/index';

describe('Response Utilities', () => {
  describe('successResponse', () => {
    it('should create success response with data', () => {
      const data = { id: 1, name: 'Test' };
      const response = successResponse(data);

      expect(response).toEqual({
        success: true,
        data,
      });
    });

    it('should include meta when provided', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const meta = { page: 1, limit: 10, total: 100 };
      const response = successResponse(data, meta);

      expect(response).toEqual({
        success: true,
        data,
        meta,
      });
    });

    it('should handle null data', () => {
      const response = successResponse(null);

      expect(response).toEqual({
        success: true,
        data: null,
      });
    });
  });

  describe('errorResponse', () => {
    it('should create error response', () => {
      const response = errorResponse('ERR_1000', 'Something went wrong');

      expect(response).toEqual({
        success: false,
        error: {
          code: 'ERR_1000',
          message: 'Something went wrong',
        },
      });
    });

    it('should include details when provided', () => {
      const response = errorResponse('ERR_1001', 'Validation failed', {
        field: 'email',
      });

      expect(response).toEqual({
        success: false,
        error: {
          code: 'ERR_1001',
          message: 'Validation failed',
          details: { field: 'email' },
        },
      });
    });
  });

  describe('createPaginationMeta', () => {
    it('should create pagination meta', () => {
      const meta = createPaginationMeta({
        page: 1,
        limit: 10,
        total: 100,
      });

      expect(meta).toEqual({
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
      });
    });

    it('should calculate correct total pages', () => {
      const meta = createPaginationMeta({
        page: 1,
        limit: 10,
        total: 25,
      });

      expect(meta.totalPages).toBe(3);
    });

    it('should handle zero total', () => {
      const meta = createPaginationMeta({
        page: 1,
        limit: 10,
        total: 0,
      });

      expect(meta.totalPages).toBe(0);
    });
  });
});
