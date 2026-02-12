/**
 * Error Handler Middleware Tests
 * Unit tests for error formatting functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZodError, ZodIssueCode } from 'zod';

// Since the error handler registers Fastify hooks, we test the formatting functions
// by mocking the Fastify instance

// Create mock Fastify with setErrorHandler and setNotFoundHandler
function createMockFastify() {
  let errorHandler:
    | ((error: Error, request: unknown, reply: unknown) => void)
    | null = null;
  let notFoundHandler: ((request: unknown, reply: unknown) => void) | null =
    null;

  return {
    setErrorHandler: vi.fn((handler: any) => {
      errorHandler = handler;
    }),
    setNotFoundHandler: vi.fn((handler: any) => {
      notFoundHandler = handler;
    }),
    getErrorHandler: () => errorHandler,
    getNotFoundHandler: () => notFoundHandler,
  };
}

function createMockRequest(overrides = {}) {
  return {
    id: 'test-request-id',
    url: '/test',
    method: 'GET',
    log: {
      error: vi.fn(),
      warn: vi.fn(),
    },
    ...overrides,
  };
}

function createMockReply() {
  const reply = {
    status: vi.fn(),
    send: vi.fn(),
  };
  reply.status.mockReturnValue(reply);
  return reply;
}

// Import after mocks
import { registerErrorHandler } from '../../../src/core/middleware/errorHandler';
import { AppError, ERROR_CODES } from '../../../src/core/errors';

describe('Error Handler Middleware', () => {
  describe('registerErrorHandler', () => {
    it('should register error handler on Fastify instance', () => {
      const mockFastify = createMockFastify();

      registerErrorHandler(mockFastify as any);

      expect(mockFastify.setErrorHandler).toHaveBeenCalled();
      expect(mockFastify.setNotFoundHandler).toHaveBeenCalled();
    });
  });

  describe('Error Handler', () => {
    let mockFastify: ReturnType<typeof createMockFastify>;

    beforeEach(() => {
      mockFastify = createMockFastify();

      registerErrorHandler(mockFastify as any);
    });

    it('should handle AppError', () => {
      const errorHandler = mockFastify.getErrorHandler()!;
      const request = createMockRequest();
      const reply = createMockReply();

      const appError = new AppError(
        ERROR_CODES.NOT_FOUND,
        'Resource not found',
        404
      );
      errorHandler(appError, request, reply);

      expect(reply.status).toHaveBeenCalledWith(404);
      expect(reply.send).toHaveBeenCalled();
    });

    it('should handle ZodError', () => {
      const errorHandler = mockFastify.getErrorHandler()!;
      const request = createMockRequest();
      const reply = createMockReply();

      const zodError = new ZodError([
        {
          code: ZodIssueCode.invalid_type,
          expected: 'string',
          received: 'number',
          path: ['email'],
          message: 'Expected string, received number',
        },
      ]);

      errorHandler(zodError, request, reply);

      expect(reply.status).toHaveBeenCalledWith(400);
    });

    it('should handle Fastify validation errors', () => {
      const errorHandler = mockFastify.getErrorHandler()!;
      const request = createMockRequest();
      const reply = createMockReply();

      const validationError = {
        name: 'Error',
        message: 'Validation failed',
        validation: [{ keyword: 'required', dataPath: '.email' }],
      };

      errorHandler(validationError as Error, request, reply);

      expect(reply.status).toHaveBeenCalledWith(400);
    });

    it('should handle 404 errors', () => {
      const errorHandler = mockFastify.getErrorHandler()!;
      const request = createMockRequest();
      const reply = createMockReply();

      const notFoundError = {
        name: 'Error',
        message: 'Not found',
        statusCode: 404,
      };

      errorHandler(notFoundError as Error, request, reply);

      expect(reply.status).toHaveBeenCalledWith(404);
    });

    it('should handle rate limit errors', () => {
      const errorHandler = mockFastify.getErrorHandler()!;
      const request = createMockRequest();
      const reply = createMockReply();

      const rateLimitError = {
        name: 'Error',
        message: 'Too many requests',
        statusCode: 429,
      };

      errorHandler(rateLimitError as Error, request, reply);

      expect(reply.status).toHaveBeenCalledWith(429);
    });

    it('should handle generic errors', () => {
      const errorHandler = mockFastify.getErrorHandler()!;
      const request = createMockRequest();
      const reply = createMockReply();

      const genericError = new Error('Something went wrong');
      errorHandler(genericError, request, reply);

      expect(reply.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Not Found Handler', () => {
    it('should handle unmatched routes', () => {
      const mockFastify = createMockFastify();

      registerErrorHandler(mockFastify as any);

      const notFoundHandler = mockFastify.getNotFoundHandler()!;
      const request = createMockRequest({ url: '/unknown', method: 'POST' });
      const reply = createMockReply();

      notFoundHandler(request, reply);

      expect(reply.status).toHaveBeenCalledWith(404);
      expect(reply.send).toHaveBeenCalled();
    });
  });
});
