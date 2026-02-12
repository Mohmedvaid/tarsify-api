/**
 * Runs Controller
 * Request handlers for consumer execution routes
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ConsumerRequest } from '@/core/middleware/auth/consumerAuth';
import { createResponse } from '@/core/responses';
import { AppError } from '@/core/errors/AppError';
import { ERROR_CODES } from '@/core/errors/errorCodes';
import * as runsService from './runs.service';
import { runModelSchema, listRunsQuerySchema } from './runs.schemas';

// ============================================
// Handlers
// ============================================

/**
 * Run a TarsModel
 * POST /marketplace/models/:slug/run
 */
export async function runModelHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { consumer } = request as ConsumerRequest;
  const { slug } = request.params as { slug: string };

  const parseResult = runModelSchema.safeParse(request.body);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid request body',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const result = await runsService.runModel(consumer, slug, parseResult.data);

  createResponse(reply).created(result);
}

/**
 * List consumer's executions
 * GET /marketplace/runs
 */
export async function listRunsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { consumer } = request as ConsumerRequest;

  const parseResult = listRunsQuerySchema.safeParse(request.query);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid query parameters',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const result = await runsService.listExecutions(consumer, parseResult.data);

  createResponse(reply).paginated(result.items, {
    page: result.page,
    limit: result.limit,
    total: result.total,
  });
}

/**
 * Get a specific execution
 * GET /marketplace/runs/:id
 */
export async function getRunHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { consumer } = request as ConsumerRequest;
  const { id } = request.params as { id: string };

  const execution = await runsService.getExecution(consumer, id);

  createResponse(reply).success(execution);
}

/**
 * Poll execution status
 * GET /marketplace/runs/:id/status
 */
export async function pollRunStatusHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { consumer } = request as ConsumerRequest;
  const { id } = request.params as { id: string };
  const { sync } = request.query as { sync?: string };

  const execution = await runsService.pollExecution(
    consumer,
    id,
    sync === 'true'
  );

  createResponse(reply).success({
    id: execution.id,
    status: execution.status,
    outputPayload: execution.outputPayload,
    errorMessage: execution.errorMessage,
    completedAt: execution.completedAt,
    executionTimeMs: execution.executionTimeMs,
  });
}

/**
 * Cancel an execution
 * POST /marketplace/runs/:id/cancel
 */
export async function cancelRunHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { consumer } = request as ConsumerRequest;
  const { id } = request.params as { id: string };

  const execution = await runsService.cancelExecution(consumer, id);

  createResponse(reply).success({
    id: execution.id,
    status: execution.status,
    message: 'Execution cancelled',
  });
}
