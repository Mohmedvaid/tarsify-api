/**
 * Error Handling Unit Tests
 */
import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  ServiceUnavailableError,
  DatabaseError,
  ExternalServiceError,
  BusinessError,
  ERROR_CODES,
} from '../../src/core/errors/index';
import { HTTP_STATUS } from '../../src/config/constants';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with code and message', () => {
      const error = new AppError(ERROR_CODES.INTERNAL_ERROR, 'Test error');

      expect(error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(error.isOperational).toBe(true);
    });

    it('should use default message from error codes', () => {
      const error = new AppError(ERROR_CODES.UNAUTHORIZED);

      expect(error.message).toBe('Authentication required');
    });

    it('should include details', () => {
      const details = { field: 'email', value: 'invalid' };
      const error = new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Validation failed',
        HTTP_STATUS.BAD_REQUEST,
        details
      );

      expect(error.details).toEqual(details);
    });

    it('should serialize to JSON', () => {
      const error = new AppError(
        ERROR_CODES.NOT_FOUND,
        'User not found',
        HTTP_STATUS.NOT_FOUND
      );

      const json = error.toJSON();

      expect(json).toEqual({
        code: ERROR_CODES.NOT_FOUND,
        message: 'User not found',
      });
    });

    it('should include details in JSON', () => {
      const error = new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Validation failed',
        HTTP_STATUS.BAD_REQUEST,
        { field: 'name' }
      );

      const json = error.toJSON();

      expect(json.details).toEqual({ field: 'name' });
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with defaults', () => {
      const error = new ValidationError();

      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(error.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(error.message).toBe('Validation failed');
    });

    it('should accept custom message and details', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });

      expect(error.message).toBe('Invalid input');
      expect(error.details).toEqual({ field: 'email' });
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error', () => {
      const error = new NotFoundError('User');

      expect(error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(error.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(error.message).toBe('User not found');
    });

    it('should include id in message', () => {
      const error = new NotFoundError('User', '123');

      expect(error.message).toBe("User with id '123' not found");
    });
  });

  describe('UnauthorizedError', () => {
    it('should create unauthorized error', () => {
      const error = new UnauthorizedError();

      expect(error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  describe('ForbiddenError', () => {
    it('should create forbidden error', () => {
      const error = new ForbiddenError('Not allowed');

      expect(error.code).toBe(ERROR_CODES.FORBIDDEN);
      expect(error.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
      expect(error.message).toBe('Not allowed');
    });

    it('should use default message', () => {
      const error = new ForbiddenError();

      expect(error.message).toBe('Access denied');
    });
  });

  describe('ConflictError', () => {
    it('should create conflict error', () => {
      const error = new ConflictError('Resource already exists');

      expect(error.statusCode).toBe(HTTP_STATUS.CONFLICT);
      expect(error.message).toBe('Resource already exists');
    });

    it('should accept custom error code', () => {
      const error = new ConflictError(
        'Duplicate entry',
        ERROR_CODES.DEVELOPER_ALREADY_EXISTS
      );

      expect(error.code).toBe(ERROR_CODES.DEVELOPER_ALREADY_EXISTS);
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error', () => {
      const error = new RateLimitError();

      expect(error.code).toBe(ERROR_CODES.RATE_LIMITED);
      expect(error.statusCode).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    });

    it('should include retry after', () => {
      const error = new RateLimitError(60);

      expect(error.details).toEqual({ retryAfter: 60 });
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should create service unavailable error', () => {
      const error = new ServiceUnavailableError('Database');

      expect(error.code).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);
      expect(error.statusCode).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
      expect(error.message).toBe('Database is temporarily unavailable');
    });
  });

  describe('DatabaseError', () => {
    it('should create database error', () => {
      const error = new DatabaseError();

      expect(error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(error.isOperational).toBe(false);
    });

    it('should accept custom message and details', () => {
      const error = new DatabaseError('Connection failed', {
        host: 'localhost',
      });

      expect(error.message).toBe('Connection failed');
      expect(error.details).toEqual({ host: 'localhost' });
    });
  });

  describe('ExternalServiceError', () => {
    it('should create external service error', () => {
      const error = new ExternalServiceError(
        'RunPod',
        ERROR_CODES.RUNPOD_ERROR
      );

      expect(error.code).toBe(ERROR_CODES.RUNPOD_ERROR);
      expect(error.statusCode).toBe(HTTP_STATUS.BAD_GATEWAY);
      expect(error.isOperational).toBe(false);
    });

    it('should accept custom message and details', () => {
      const error = new ExternalServiceError(
        'RunPod',
        ERROR_CODES.RUNPOD_ERROR,
        'API timeout',
        { endpoint: 'submit' }
      );

      expect(error.message).toBe('API timeout');
      expect(error.details).toEqual({ endpoint: 'submit' });
    });
  });

  describe('BusinessError', () => {
    it('should create business logic error', () => {
      const error = new BusinessError(ERROR_CODES.INSUFFICIENT_CREDITS);

      expect(error.code).toBe(ERROR_CODES.INSUFFICIENT_CREDITS);
      expect(error.statusCode).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    it('should accept message and details', () => {
      const error = new BusinessError(
        ERROR_CODES.INSUFFICIENT_CREDITS,
        'Not enough credits',
        { required: 100, available: 50 }
      );

      expect(error.message).toBe('Not enough credits');
      expect(error.details).toEqual({ required: 100, available: 50 });
    });
  });
});

describe('Error Codes', () => {
  it('should have unique error codes', () => {
    const codes = Object.values(ERROR_CODES);
    const uniqueCodes = new Set(codes);

    expect(uniqueCodes.size).toBe(codes.length);
  });

  it('should follow ERR_XXXX format', () => {
    const codes = Object.values(ERROR_CODES);

    for (const code of codes) {
      expect(code).toMatch(/^ERR_\d{4}$/);
    }
  });
});
