/**
 * Engine Errors
 * Error classes for the RunPod execution engine
 */

import { AppError, ERROR_CODES } from '@/core/errors';
import type { ErrorCode } from '@/core/errors/errorCodes';

// Re-export relevant error codes for convenience
export { ERROR_CODES };

// ============================================
// Error Classes
// ============================================

/**
 * Base engine error
 */
export class EngineError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(code, message, statusCode, details);
    this.name = 'EngineError';
  }
}

/**
 * RunPod API error
 */
export class RunPodError extends EngineError {
  public readonly runpodStatus?: number;
  public readonly runpodError?: string;

  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      statusCode?: number;
      runpodStatus?: number;
      runpodError?: string;
      details?: Record<string, unknown>;
    }
  ) {
    super(code, message, options?.statusCode ?? 502, {
      ...options?.details,
      runpodStatus: options?.runpodStatus,
      runpodError: options?.runpodError,
    });
    this.name = 'RunPodError';
    this.runpodStatus = options?.runpodStatus;
    this.runpodError = options?.runpodError;
  }
}

/**
 * Model not found error
 */
export class ModelNotFoundError extends EngineError {
  constructor(identifier: string) {
    super(
      ERROR_CODES.MODEL_NOT_FOUND,
      `Model not found: ${identifier}`,
      404
    );
    this.name = 'ModelNotFoundError';
  }
}

/**
 * Model not published error
 */
export class ModelNotPublishedError extends EngineError {
  constructor(identifier: string) {
    super(
      ERROR_CODES.MODEL_NOT_PUBLISHED,
      `Model is not published: ${identifier}`,
      400
    );
    this.name = 'ModelNotPublishedError';
  }
}

/**
 * Endpoint not active error
 */
export class EndpointNotActiveError extends EngineError {
  constructor(endpointId: string) {
    super(
      ERROR_CODES.ENDPOINT_NOT_ACTIVE,
      `RunPod endpoint is not active: ${endpointId}`,
      503
    );
    this.name = 'EndpointNotActiveError';
  }
}

/**
 * Execution not found error
 */
export class ExecutionNotFoundError extends EngineError {
  constructor(executionId: string) {
    super(
      ERROR_CODES.EXECUTION_NOT_FOUND,
      `Execution not found: ${executionId}`,
      404
    );
    this.name = 'ExecutionNotFoundError';
  }
}

/**
 * Execution not owned error
 */
export class ExecutionNotOwnedError extends EngineError {
  constructor() {
    super(
      ERROR_CODES.EXECUTION_NOT_OWNED,
      'You do not have access to this execution',
      403
    );
    this.name = 'ExecutionNotOwnedError';
  }
}

/**
 * Execution not cancellable error
 */
export class ExecutionNotCancellableError extends EngineError {
  constructor(status: string) {
    super(
      ERROR_CODES.EXECUTION_NOT_CANCELLABLE,
      `Cannot cancel execution with status: ${status}`,
      400
    );
    this.name = 'ExecutionNotCancellableError';
  }
}
