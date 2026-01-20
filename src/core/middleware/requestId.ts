/**
 * Request ID Middleware
 * Ensures every request has a unique ID for tracing
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';

const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return randomUUID();
}

/**
 * Register request ID generation
 */
export function registerRequestId(app: FastifyInstance): void {
  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Use existing request ID from header or generate new one
    const requestId =
      (request.headers[REQUEST_ID_HEADER] as string) || generateRequestId();

    // Set request ID on request object (Fastify uses this for logging)
    request.id = requestId;

    // Add request ID to response headers
    reply.header(REQUEST_ID_HEADER, requestId);
  });
}
