/**
 * Response Utilities Unit Tests
 */
import { describe, it, expect, vi } from 'vitest';
import {
  successResponse,
  errorResponse,
  createPaginationMeta,
  ApiResponseBuilder,
} from '../../src/core/responses/index';
import { AppError } from '../../src/core/errors';
import type { FastifyReply } from 'fastify';

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

  describe('ApiResponseBuilder', () => {
    const createMockReply = () => {
      const reply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
      } as unknown as FastifyReply;
      return reply;
    };

    describe('error', () => {
      it('should send error response from AppError', () => {
        const reply = createMockReply();
        const builder = new ApiResponseBuilder(reply);
        const error = new AppError('ERR_1000', 'Test error', 400);

        builder.error(error);

        expect(reply.status).toHaveBeenCalledWith(400);
        expect(reply.send).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'ERR_1000',
            message: 'Test error',
          },
        });
      });

      it('should include error details when provided', () => {
        const reply = createMockReply();
        const builder = new ApiResponseBuilder(reply);
        const error = new AppError('ERR_1001', 'Validation error', 400, {
          field: 'email',
        });

        builder.error(error);

        expect(reply.status).toHaveBeenCalledWith(400);
        expect(reply.send).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'ERR_1001',
            message: 'Validation error',
            details: { field: 'email' },
          },
        });
      });

      it('should handle 500 status code errors', () => {
        const reply = createMockReply();
        const builder = new ApiResponseBuilder(reply);
        const error = new AppError('ERR_2000', 'Server error', 500);

        builder.error(error);

        expect(reply.status).toHaveBeenCalledWith(500);
      });
    });

    describe('customError', () => {
      it('should send custom error response', () => {
        const reply = createMockReply();
        const builder = new ApiResponseBuilder(reply);

        builder.customError(422, 'CUSTOM_ERROR', 'Custom error message');

        expect(reply.status).toHaveBeenCalledWith(422);
        expect(reply.send).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'CUSTOM_ERROR',
            message: 'Custom error message',
          },
        });
      });

      it('should include details when provided', () => {
        const reply = createMockReply();
        const builder = new ApiResponseBuilder(reply);

        builder.customError(400, 'VALIDATION_ERROR', 'Invalid input', {
          fields: ['name', 'email'],
        });

        expect(reply.status).toHaveBeenCalledWith(400);
        expect(reply.send).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: { fields: ['name', 'email'] },
          },
        });
      });
    });

    describe('noContent', () => {
      it('should send 204 no content response', () => {
        const reply = createMockReply();
        const builder = new ApiResponseBuilder(reply);

        builder.noContent();

        expect(reply.status).toHaveBeenCalledWith(204);
        expect(reply.send).toHaveBeenCalled();
      });
    });

    describe('created', () => {
      it('should send 201 created response', () => {
        const reply = createMockReply();
        const builder = new ApiResponseBuilder(reply);
        const data = { id: 'new-123', name: 'New Item' };

        builder.created(data);

        expect(reply.status).toHaveBeenCalledWith(201);
        expect(reply.send).toHaveBeenCalledWith({
          success: true,
          data,
        });
      });
    });

    describe('paginated', () => {
      it('should send paginated response with metadata', () => {
        const reply = createMockReply();
        const builder = new ApiResponseBuilder(reply);
        const data = [{ id: 1 }, { id: 2 }];
        const pagination = { page: 1, limit: 10, total: 100 };

        builder.paginated(data, pagination);

        expect(reply.status).toHaveBeenCalledWith(200);
        expect(reply.send).toHaveBeenCalledWith({
          success: true,
          data,
          meta: {
            page: 1,
            limit: 10,
            total: 100,
            totalPages: 10,
          },
        });
      });
    });
  });
});
