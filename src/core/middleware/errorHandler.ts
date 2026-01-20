/**
 * Global Error Handler Middleware
 * Catches all errors and formats them consistently
 */
import type {
  FastifyInstance,
  FastifyError,
  FastifyRequest,
  FastifyReply,
} from 'fastify';
import { ZodError } from 'zod';
import { AppError, ERROR_CODES } from '@/core/errors/index';
import { errorResponse } from '@/core/responses/index';
import { HTTP_STATUS } from '@/config/constants';
import { isDev } from '@/config/env';

/**
 * Format Zod validation errors
 */
function formatZodError(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'value';
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return formatted;
}

/**
 * Register global error handler
 */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler(
    (
      error: FastifyError | AppError | ZodError | Error,
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      // Log error
      request.log.error(
        {
          err: error,
          requestId: request.id,
          url: request.url,
          method: request.method,
        },
        'Request error'
      );

      // Handle AppError (our custom errors)
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(
          errorResponse(error.code, error.message, error.details)
        );
      }

      // Handle Zod validation errors
      if (error instanceof ZodError) {
        return reply.status(HTTP_STATUS.BAD_REQUEST).send(
          errorResponse(
            ERROR_CODES.VALIDATION_ERROR,
            'Validation failed',
            { fields: formatZodError(error) }
          )
        );
      }

      // Handle Fastify validation errors
      if ('validation' in error && error.validation) {
        return reply.status(HTTP_STATUS.BAD_REQUEST).send(
          errorResponse(
            ERROR_CODES.VALIDATION_ERROR,
            error.message,
            { validation: error.validation }
          )
        );
      }

      // Handle 404 errors
      if ('statusCode' in error && error.statusCode === 404) {
        return reply.status(HTTP_STATUS.NOT_FOUND).send(
          errorResponse(ERROR_CODES.NOT_FOUND, 'Route not found')
        );
      }

      // Handle rate limit errors
      if ('statusCode' in error && error.statusCode === 429) {
        return reply.status(HTTP_STATUS.TOO_MANY_REQUESTS).send(
          errorResponse(
            ERROR_CODES.RATE_LIMITED,
            'Too many requests, please try again later'
          )
        );
      }

      // Default: Internal server error
      // In production, don't leak error details
      const message = isDev
        ? error.message
        : 'An internal server error occurred';

      const details = isDev
        ? { stack: error.stack }
        : undefined;

      return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(
        errorResponse(ERROR_CODES.INTERNAL_ERROR, message, details)
      );
    }
  );

  // Handle 404 for unmatched routes
  app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    request.log.warn(
      { url: request.url, method: request.method },
      'Route not found'
    );

    return reply.status(HTTP_STATUS.NOT_FOUND).send(
      errorResponse(
        ERROR_CODES.NOT_FOUND,
        `Route ${request.method} ${request.url} not found`
      )
    );
  });
}
