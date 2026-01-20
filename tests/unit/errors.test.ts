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
