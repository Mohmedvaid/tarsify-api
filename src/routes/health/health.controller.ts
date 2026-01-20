/**
 * Health Controller
 * Request handlers for health endpoints
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { createResponse } from '@/core/responses/index';
import { getBasicHealth, getDetailedHealth } from './health.service';

/**
 * Basic health check handler (liveness probe)
 * Used by Kubernetes/Cloud Run to check if the service is alive
 */
export async function healthHandler(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const health = getBasicHealth();
  return createResponse(reply).success(health);
}

/**
 * Readiness check handler (readiness probe)
 * Used by Kubernetes/Cloud Run to check if the service is ready to accept traffic
 */
export async function readyHandler(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const health = await getDetailedHealth();

  // Return 503 if unhealthy
  if (health.status === 'unhealthy') {
    return createResponse(reply).customError(
      503,
      'SERVICE_UNAVAILABLE',
      'Service is not ready',
      { health }
    );
  }

  return createResponse(reply).success(health);
}

/**
 * Liveness check handler (liveness probe)
 * Minimal check - just confirms the process is running
 */
export async function liveHandler(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  return createResponse(reply).success({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
}
