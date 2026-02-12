/**
 * Models Controller
 * Request handlers for public model routes
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { createResponse } from '@/core/responses';
import { AppError } from '@/core/errors/AppError';
import { ERROR_CODES } from '@/core/errors/errorCodes';
import * as modelsService from './models.service';
import { listModelsQuerySchema } from './models.schemas';

// ============================================
// Handlers
// ============================================

/**
 * List published models
 * GET /marketplace/models
 */
export async function listModelsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parseResult = listModelsQuerySchema.safeParse(request.query);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid query parameters',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const result = await modelsService.listPublishedModels(parseResult.data);

  createResponse(reply).paginated(result.items, {
    page: result.page,
    limit: result.limit,
    total: result.total,
  });
}

/**
 * Get a specific model by slug
 * GET /marketplace/models/:slug
 */
export async function getModelHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { slug } = request.params as { slug: string };

  const model = await modelsService.getPublishedModelBySlug(slug);

  createResponse(reply).success(model);
}
