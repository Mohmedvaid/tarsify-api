/**
 * Consumer Auth Controller
 * Request handlers for consumer authentication endpoints
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { createResponse } from '@/core/responses';
import { AppError } from '@/core/errors';
import { ERROR_CODES } from '@/core/errors/errorCodes';
import type { AuthenticatedRequest } from '@/core/middleware/auth';
import type { AuthenticatedConsumerRequest } from '@/core/middleware/auth/consumerAuth';
import { consumerAuthService } from './auth.service';
import { registerConsumerSchema, updateProfileSchema } from './auth.schemas';

/**
 * POST /auth/register
 * Register a new consumer account
 */
export async function registerHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { firebaseUser } = request as AuthenticatedRequest;

  // Validate request body
  const parseResult = registerConsumerSchema.safeParse(request.body);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid registration data',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const result = await consumerAuthService.register(firebaseUser, parseResult.data);
  createResponse(reply).created(result.data);
}

/**
 * GET /auth/me
 * Get current consumer profile
 */
export async function getMeHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { consumer } = request as AuthenticatedConsumerRequest;
  const result = await consumerAuthService.getCurrentConsumer(consumer);
  createResponse(reply).success(result.data);
}

/**
 * PUT /auth/profile
 * Update consumer profile
 */
export async function updateProfileHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { consumer } = request as AuthenticatedConsumerRequest;

  // Validate request body
  const parseResult = updateProfileSchema.safeParse(request.body);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid profile data',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const result = await consumerAuthService.updateProfile(consumer, parseResult.data);
  createResponse(reply).success(result.data);
}
