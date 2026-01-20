/**
 * Application Error Classes
 * Custom error classes for standardized error handling
 */
import { HTTP_STATUS } from '@/config/constants';
import { ERROR_CODES, ERROR_MESSAGES } from './errorCodes';
import type { ErrorCode } from './errorCodes';

/**
 * Base Application Error
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(
    code: ErrorCode,
    message?: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details?: Record<string, unknown>,
    isOperational: boolean = true
  ) {
    super(message || ERROR_MESSAGES[code] || 'Unknown error');

    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);

    // Set the prototype explicitly for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Convert to JSON for API response
   */
  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}

/**
 * Validation Error
 * Use for request validation failures
 */
export class ValidationError extends AppError {
  constructor(message?: string, details?: Record<string, unknown>) {
    super(
      ERROR_CODES.VALIDATION_ERROR,
      message || 'Validation failed',
      HTTP_STATUS.BAD_REQUEST,
      details
    );
  }
}

/**
 * Not Found Error
 * Use when a resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(ERROR_CODES.NOT_FOUND, message, HTTP_STATUS.NOT_FOUND);
  }
}

/**
 * Unauthorized Error
 * Use when authentication is missing or invalid
 */
export class UnauthorizedError extends AppError {
  constructor(message?: string) {
    super(
      ERROR_CODES.UNAUTHORIZED,
      message || 'Authentication required',
      HTTP_STATUS.UNAUTHORIZED
    );
  }
}

/**
 * Forbidden Error
 * Use when user doesn't have permission
 */
export class ForbiddenError extends AppError {
  constructor(message?: string) {
    super(
      ERROR_CODES.FORBIDDEN,
      message || 'Access denied',
      HTTP_STATUS.FORBIDDEN
    );
  }
}

/**
 * Conflict Error
 * Use when there's a resource conflict
 */
export class ConflictError extends AppError {
  constructor(message: string, code: ErrorCode = ERROR_CODES.INTERNAL_ERROR) {
    super(code, message, HTTP_STATUS.CONFLICT);
  }
}

/**
 * Rate Limit Error
 * Use when rate limit is exceeded
 */
export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(
      ERROR_CODES.RATE_LIMITED,
      'Too many requests, please try again later',
      HTTP_STATUS.TOO_MANY_REQUESTS,
      retryAfter ? { retryAfter } : undefined
    );
  }
}

/**
 * Service Unavailable Error
 * Use when an external service is down
 */
export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(
      ERROR_CODES.SERVICE_UNAVAILABLE,
      `${service} is temporarily unavailable`,
      HTTP_STATUS.SERVICE_UNAVAILABLE
    );
  }
}

/**
 * Database Error
 * Use for database-related failures
 */
export class DatabaseError extends AppError {
  constructor(message?: string, details?: Record<string, unknown>) {
    super(
      ERROR_CODES.DATABASE_ERROR,
      message || 'Database operation failed',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      details,
      false // Not operational - indicates system issue
    );
  }
}

/**
 * External Service Error
 * Use for third-party service failures
 */
export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    code: ErrorCode,
    message?: string,
    details?: Record<string, unknown>
  ) {
    super(
      code,
      message || `${service} service error`,
      HTTP_STATUS.BAD_GATEWAY,
      details,
      false
    );
  }
}

/**
 * Business Logic Error
 * Use for domain-specific errors
 */
export class BusinessError extends AppError {
  constructor(
    code: ErrorCode,
    message?: string,
    details?: Record<string, unknown>
  ) {
    super(code, message, HTTP_STATUS.UNPROCESSABLE_ENTITY, details);
  }
}
