/**
 * Tars Model Controller
 * Request handlers for developer tars model routes
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { DeveloperRequest } from '@/core/middleware/auth/types';
import { createResponse } from '@/core/responses';
import { AppError } from '@/core/errors/AppError';
import { ERROR_CODES } from '@/core/errors/errorCodes';
import * as tarsModelService from './tars-model.service';
import {
  createTarsModelSchema,
  updateTarsModelSchema,
  listTarsModelsQuerySchema,
  publishTarsModelSchema,
  testRunTarsModelSchema,
} from './tars-model.schemas';

// ============================================
// Handlers
// ============================================

/**
 * Create a new tars model
 * POST /studio/tars-models
 */
export async function createHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { developer } = request as DeveloperRequest;

  const parseResult = createTarsModelSchema.safeParse(request.body);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid request body',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const tarsModel = await tarsModelService.createTarsModel(
    developer.id,
    parseResult.data
  );

  createResponse(reply).created(tarsModel);
}

/**
 * List developer's tars models
 * GET /studio/tars-models
 */
export async function listHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { developer } = request as DeveloperRequest;

  const parseResult = listTarsModelsQuerySchema.safeParse(request.query);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid query parameters',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const result = await tarsModelService.listTarsModels(
    developer.id,
    parseResult.data
  );

  createResponse(reply).paginated(result.items, {
    page: result.page,
    limit: result.limit,
    total: result.total,
  });
}

/**
 * Get a single tars model
 * GET /studio/tars-models/:id
 */
export async function getHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { developer } = request as DeveloperRequest;
  const { id } = request.params as { id: string };

  const tarsModel = await tarsModelService.getTarsModel(developer.id, id);

  createResponse(reply).success(tarsModel);
}

/**
 * Update a tars model
 * PUT /studio/tars-models/:id
 */
export async function updateHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { developer } = request as DeveloperRequest;
  const { id } = request.params as { id: string };

  const parseResult = updateTarsModelSchema.safeParse(request.body);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid request body',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const tarsModel = await tarsModelService.updateTarsModel(
    developer.id,
    id,
    parseResult.data
  );

  createResponse(reply).success(tarsModel);
}

/**
 * Delete a tars model
 * DELETE /studio/tars-models/:id
 */
export async function deleteHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { developer } = request as DeveloperRequest;
  const { id } = request.params as { id: string };

  await tarsModelService.deleteTarsModel(developer.id, id);

  createResponse(reply).noContent();
}

/**
 * Publish or archive a tars model
 * POST /studio/tars-models/:id/publish
 */
export async function publishHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { developer } = request as DeveloperRequest;
  const { id } = request.params as { id: string };

  const parseResult = publishTarsModelSchema.safeParse(request.body);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid request body',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const tarsModel = await tarsModelService.publishTarsModel(
    developer.id,
    id,
    parseResult.data.action
  );

  createResponse(reply).success(tarsModel);
}

/**
 * List available base models
 * GET /studio/tars-models/base-models
 */
export async function listBaseModelsHandler(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const baseModels = await tarsModelService.listAvailableBaseModels();

  createResponse(reply).success({ baseModels });
}

/**
 * Test run a tars model
 * POST /studio/tars-models/:id/test-run
 * Developer validation run before publishing
 */
export async function testRunHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { developer } = request as DeveloperRequest;
  const { id } = request.params as { id: string };

  const parseResult = testRunTarsModelSchema.safeParse(request.body);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid request body',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const result = await tarsModelService.testRunTarsModel(
    developer.id,
    id,
    parseResult.data
  );

  createResponse(reply).success(result);
}
