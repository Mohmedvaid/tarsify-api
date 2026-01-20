/**
 * Request Logger Middleware
 * Logs incoming requests and responses
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

/**
 * Generate request context for logging
 */
function getRequestContext(request: FastifyRequest): Record<string, unknown> {
  return {
    requestId: request.id,
    method: request.method,
    url: request.url,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
  };
}

/**
 * Register request logging hooks
 */
export function registerRequestLogger(app: FastifyInstance): void {
  // Log incoming requests
  app.addHook('onRequest', async (request: FastifyRequest) => {
    request.log.info(getRequestContext(request), 'Incoming request');
  });

  // Log response completion
  app.addHook(
    'onResponse',
    async (request: FastifyRequest, reply: FastifyReply) => {
      request.log.info(
        {
          ...getRequestContext(request),
          statusCode: reply.statusCode,
          responseTime: reply.elapsedTime,
        },
        'Request completed'
      );
    }
  );

  // Log request timeout
  app.addHook('onTimeout', async (request: FastifyRequest) => {
    request.log.warn(getRequestContext(request), 'Request timeout');
  });

  // Log when request is aborted
  app.addHook('onRequestAbort', async (request: FastifyRequest) => {
    request.log.warn(getRequestContext(request), 'Request aborted');
  });
}
