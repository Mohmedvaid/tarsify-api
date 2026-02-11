/**
 * Base Model Controller
 * Request handlers for admin base model routes
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { createResponse } from '@/core/responses';
import { AppError } from '@/core/errors/AppError';
import { ERROR_CODES } from '@/core/errors/errorCodes';
import {
  createBaseModelSchema,
  updateBaseModelSchema,
  listBaseModelsQuerySchema,
  baseModelParamsSchema,
} from './base-model.schemas';
import * as baseModelService from './base-model.service';

/**
 * POST /admin/base-models
 * Create a new base model
 */
export async function createBaseModelHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parseResult = createBaseModelSchema.safeParse(request.body);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid request body',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const baseModel = await baseModelService.createBaseModel(parseResult.data);
  createResponse(reply).created(baseModel);
}

/**
 * GET /admin/base-models
 * List base models with pagination
 */
export async function listBaseModelsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parseResult = listBaseModelsQuerySchema.safeParse(request.query);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid query parameters',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const result = await baseModelService.listBaseModels(parseResult.data);
  createResponse(reply).paginated(result.data, {
    page: result.meta.page,
    limit: result.meta.limit,
    total: result.meta.total,
  });
}

/**
 * GET /admin/base-models/:id
 * Get base model by ID
 */
export async function getBaseModelHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parseResult = baseModelParamsSchema.safeParse(request.params);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid base model ID',
      400
    );
  }

  const baseModel = await baseModelService.getBaseModel(parseResult.data.id);
  createResponse(reply).success(baseModel);
}

/**
 * PATCH /admin/base-models/:id
 * Update base model
 */
export async function updateBaseModelHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const paramsResult = baseModelParamsSchema.safeParse(request.params);
  if (!paramsResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid base model ID',
      400
    );
  }

  const bodyResult = updateBaseModelSchema.safeParse(request.body);
  if (!bodyResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid request body',
      400,
      { errors: bodyResult.error.flatten().fieldErrors }
    );
  }

  const baseModel = await baseModelService.updateBaseModel(
    paramsResult.data.id,
    bodyResult.data
  );
  createResponse(reply).success(baseModel);
}

/**
 * DELETE /admin/base-models/:id
 * Soft delete base model
 */
export async function deleteBaseModelHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parseResult = baseModelParamsSchema.safeParse(request.params);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid base model ID',
      400
    );
  }

  await baseModelService.deleteBaseModel(parseResult.data.id);
  createResponse(reply).noContent();
}
