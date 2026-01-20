/**
 * Errors Module
 * Central export for all error classes and codes
 */

export { ERROR_CODES, ERROR_MESSAGES } from './errorCodes';
export type { ErrorCode } from './errorCodes';

export {
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
} from './AppError';
