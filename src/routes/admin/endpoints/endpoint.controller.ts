/**
 * Endpoint Controller
 * Request handlers for admin endpoint routes
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { createResponse } from '@/core/responses';
import { AppError } from '@/core/errors/AppError';
import { ERROR_CODES } from '@/core/errors/errorCodes';
import {
  createEndpointSchema,
  updateEndpointSchema,
  listEndpointsQuerySchema,
  endpointParamsSchema,
} from './endpoint.schemas';
import * as endpointService from './endpoint.service';

/**
 * POST /admin/endpoints
 * Create a new RunPod endpoint
 */
export async function createEndpointHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parseResult = createEndpointSchema.safeParse(request.body);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid request body',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const endpoint = await endpointService.createEndpoint(parseResult.data);
  createResponse(reply).created(endpoint);
}

/**
 * GET /admin/endpoints
 * List endpoints with pagination
 */
export async function listEndpointsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parseResult = listEndpointsQuerySchema.safeParse(request.query);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid query parameters',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const result = await endpointService.listEndpoints(parseResult.data);
  createResponse(reply).paginated(result.data, {
    page: result.meta.page,
    limit: result.meta.limit,
    total: result.meta.total,
  });
}

/**
 * GET /admin/endpoints/:id
 * Get endpoint by ID
 */
export async function getEndpointHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parseResult = endpointParamsSchema.safeParse(request.params);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid endpoint ID',
      400
    );
  }

  const endpoint = await endpointService.getEndpoint(parseResult.data.id);
  createResponse(reply).success(endpoint);
}

/**
 * PATCH /admin/endpoints/:id
 * Update endpoint
 */
export async function updateEndpointHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const paramsResult = endpointParamsSchema.safeParse(request.params);
  if (!paramsResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid endpoint ID',
      400
    );
  }

  const bodyResult = updateEndpointSchema.safeParse(request.body);
  if (!bodyResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid request body',
      400,
      { errors: bodyResult.error.flatten().fieldErrors }
    );
  }

  const endpoint = await endpointService.updateEndpoint(
    paramsResult.data.id,
    bodyResult.data
  );
  createResponse(reply).success(endpoint);
}

/**
 * DELETE /admin/endpoints/:id
 * Soft delete endpoint
 */
export async function deleteEndpointHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parseResult = endpointParamsSchema.safeParse(request.params);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid endpoint ID',
      400
    );
  }

  await endpointService.deleteEndpoint(parseResult.data.id);
  createResponse(reply).noContent();
}
