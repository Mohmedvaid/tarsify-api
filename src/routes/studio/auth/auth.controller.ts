/**
 * Auth Controller
 * Route handlers for developer authentication endpoints
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { createResponse } from '@/core/responses';
import { ValidationError } from '@/core/errors';
import type { AuthenticatedRequest, DeveloperRequest } from '@/core/middleware/auth';
import { authService } from './auth.service';
import {
  registerDeveloperSchema,
  updateProfileSchema,
  completeProfileSchema,
  type RegisterDeveloperInput,
  type UpdateProfileInput,
  type CompleteProfileInput,
} from './auth.schemas';

/**
 * POST /auth/register
 * Register a new developer account
 */
export async function registerHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authRequest = request as AuthenticatedRequest;
  const { firebaseUser } = authRequest;

  // Validate request body
  const parseResult = registerDeveloperSchema.safeParse(request.body);

  if (!parseResult.success) {
    const errors = parseResult.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    throw new ValidationError('Invalid request body', { errors });
  }

  const input: RegisterDeveloperInput = parseResult.data;

  const developer = await authService.register(firebaseUser, input);

  createResponse(reply).created(developer);
}

/**
 * GET /auth/me
 * Get current developer profile with stats
 */
export async function getMeHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authRequest = request as AuthenticatedRequest;
  const { firebaseUser } = authRequest;

  const developer = await authService.getMe(firebaseUser.uid);

  createResponse(reply).success(developer);
}

/**
 * PUT /auth/profile
 * Update developer profile
 */
export async function updateProfileHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const devRequest = request as DeveloperRequest;
  const { developer } = devRequest;

  // Validate request body
  const parseResult = updateProfileSchema.safeParse(request.body);

  if (!parseResult.success) {
    const errors = parseResult.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    throw new ValidationError('Invalid request body', { errors });
  }

  const input: UpdateProfileInput = parseResult.data;

  // Check if at least one field is provided
  if (
    input.displayName === undefined &&
    input.bio === undefined &&
    input.avatarUrl === undefined
  ) {
    throw new ValidationError('At least one field must be provided', {
      errors: [{ field: 'body', message: 'No fields to update' }],
    });
  }

  const updatedProfile = await authService.updateProfile(developer, input);

  createResponse(reply).success(updatedProfile);
}

/**
 * POST /auth/complete-profile
 * Complete developer profile (first-time setup)
 */
export async function completeProfileHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const devRequest = request as DeveloperRequest;
  const { developer } = devRequest;

  // Validate request body
  const parseResult = completeProfileSchema.safeParse(request.body);

  if (!parseResult.success) {
    const errors = parseResult.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    throw new ValidationError('Invalid request body', { errors });
  }

  const input: CompleteProfileInput = parseResult.data;

  const updatedProfile = await authService.completeProfile(developer, input);

  createResponse(reply).success(updatedProfile);
}
