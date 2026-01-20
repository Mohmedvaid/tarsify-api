/**
 * API Response Utilities
 * Standardized response format for all API endpoints
 */
import type { FastifyReply } from 'fastify';
import { HTTP_STATUS } from '@/config/constants';
import type { AppError, ErrorCode } from '@/core/errors/index';

/**
 * Base API Response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiErrorResponse;
  meta?: ResponseMeta;
}

/**
 * Error response structure
 */
export interface ApiErrorResponse {
  code: ErrorCode | string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Response metadata (pagination, etc.)
 */
export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  meta?: ResponseMeta
): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(meta && { meta }),
  };
}

/**
 * Create an error response
 */
export function errorResponse(
  code: ErrorCode | string,
  message: string,
  details?: Record<string, unknown>
): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(params: PaginationParams): ResponseMeta {
  const { page, limit, total } = params;
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Response class for Fastify integration
 */
export class ApiResponseBuilder {
  private reply: FastifyReply;

  constructor(reply: FastifyReply) {
    this.reply = reply;
  }

  /**
   * Send success response
   */
  success<T>(
    data: T,
    statusCode: number = HTTP_STATUS.OK,
    meta?: ResponseMeta
  ): FastifyReply {
    return this.reply.status(statusCode).send(successResponse(data, meta));
  }

  /**
   * Send created response
   */
  created<T>(data: T): FastifyReply {
    return this.reply.status(HTTP_STATUS.CREATED).send(successResponse(data));
  }

  /**
   * Send no content response
   */
  noContent(): FastifyReply {
    return this.reply.status(HTTP_STATUS.NO_CONTENT).send();
  }

  /**
   * Send paginated response
   */
  paginated<T>(
    data: T[],
    pagination: PaginationParams
  ): FastifyReply {
    return this.reply.status(HTTP_STATUS.OK).send(
      successResponse(data, createPaginationMeta(pagination))
    );
  }

  /**
   * Send error response from AppError
   */
  error(error: AppError): FastifyReply {
    return this.reply.status(error.statusCode).send(
      errorResponse(error.code, error.message, error.details)
    );
  }

  /**
   * Send custom error response
   */
  customError(
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, unknown>
  ): FastifyReply {
    return this.reply
      .status(statusCode)
      .send(errorResponse(code, message, details));
  }
}

/**
 * Helper to create response builder
 */
export function createResponse(reply: FastifyReply): ApiResponseBuilder {
  return new ApiResponseBuilder(reply);
}
