/**
 * Core Module
 * Central export for all core functionality
 */

// Errors
export {
  ERROR_CODES,
  ERROR_MESSAGES,
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
} from './errors/index';
export type { ErrorCode } from './errors/index';

// Responses
export {
  successResponse,
  errorResponse,
  createPaginationMeta,
  ApiResponseBuilder,
  createResponse,
} from './responses/index';
export type {
  ApiResponse,
  ApiErrorResponse,
  ResponseMeta,
  PaginationParams,
} from './responses/index';

// Middleware
export {
  registerErrorHandler,
  registerRequestLogger,
  registerRequestId,
} from './middleware/index';
