/**
 * Credits Controller
 * Request handlers for credit management
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { createResponse } from '@/core/responses';
import { AppError } from '@/core/errors';
import { ERROR_CODES } from '@/core/errors/errorCodes';
import type { AuthenticatedConsumerRequest } from '@/core/middleware/auth/consumerAuth';
import { creditsService } from './credits.service';
import {
  purchaseCreditsSchema,
  listPurchasesQuerySchema,
} from './credits.schemas';

/**
 * GET /credits
 * Get credit balance
 */
export async function getBalanceHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { consumer } = request as AuthenticatedConsumerRequest;
  const result = await creditsService.getBalance(consumer);
  createResponse(reply).success(result.data);
}

/**
 * GET /credits/packages
 * Get available credit packages
 */
export async function getPackagesHandler(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const result = await creditsService.getPackages();
  createResponse(reply).success(result.data);
}

/**
 * POST /credits/purchase
 * Purchase credits (mock)
 */
export async function purchaseCreditsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { consumer } = request as AuthenticatedConsumerRequest;

  // Validate request body
  const parseResult = purchaseCreditsSchema.safeParse(request.body);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid purchase data',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const result = await creditsService.purchaseCredits(consumer, parseResult.data);
  createResponse(reply).created(result.data);
}

/**
 * GET /credits/history
 * List purchase history
 */
export async function listPurchasesHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { consumer } = request as AuthenticatedConsumerRequest;

  // Validate query params
  const parseResult = listPurchasesQuerySchema.safeParse(request.query);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid query parameters',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const result = await creditsService.listPurchases(consumer, parseResult.data);

  createResponse(reply).paginated(result.data, {
    page: result.meta.page,
    limit: result.meta.limit,
    total: result.meta.total,
  });
}
