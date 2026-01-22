/**
 * Runs Controller
 * Request handlers for notebook execution
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { createResponse } from '@/core/responses';
import { AppError } from '@/core/errors';
import { ERROR_CODES } from '@/core/errors/errorCodes';
import type { AuthenticatedConsumerRequest } from '@/core/middleware/auth/consumerAuth';
import { runsService } from './runs.service';
import {
  notebookIdParamsSchema,
  runIdParamsSchema,
  listRunsQuerySchema,
} from './runs.schemas';

/**
 * POST /notebooks/:id/run
 * Start a notebook run
 */
export async function runNotebookHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { consumer } = request as AuthenticatedConsumerRequest;

  // Validate path params
  const parseResult = notebookIdParamsSchema.safeParse(request.params);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid notebook ID',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const result = await runsService.runNotebook(consumer, parseResult.data.id);
  createResponse(reply).created(result.data);
}

/**
 * GET /runs
 * List consumer's runs
 */
export async function listRunsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { consumer } = request as AuthenticatedConsumerRequest;

  // Validate query params
  const parseResult = listRunsQuerySchema.safeParse(request.query);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid query parameters',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const result = await runsService.listRuns(consumer, parseResult.data);

  createResponse(reply).paginated(result.data, {
    page: result.meta.page,
    limit: result.meta.limit,
    total: result.meta.total,
  });
}

/**
 * GET /runs/:id
 * Get run details
 */
export async function getRunHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { consumer } = request as AuthenticatedConsumerRequest;

  // Validate path params
  const parseResult = runIdParamsSchema.safeParse(request.params);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid run ID',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const result = await runsService.getRun(consumer, parseResult.data.id);
  createResponse(reply).success(result.data);
}
