/**
 * Consumer Auth Middleware
 * Verifies Firebase JWT and loads consumer from database
 * For Marketplace routes (tarsify-users Firebase project)
 */
import type { FastifyRequest, FastifyReply, preHandlerHookHandler } from 'fastify';
import type { Consumer } from '@prisma/client';
import { firebaseAdmin } from '@/services/firebase';
import { consumerRepository } from '@/repositories';
import { UnauthorizedError, AppError } from '@/core/errors';
import { ERROR_CODES } from '@/core/errors/errorCodes';
import { HTTP_STATUS } from '@/config/constants';
import { logger } from '@/lib/logger';
import type { AuthenticatedRequest, AuthMiddlewareOptions } from './types';
import type { FirebaseUser } from '@/services/firebase';

/**
 * Consumer request with full consumer profile
 * Use for routes that need consumer data from database
 */
export interface ConsumerRequest extends AuthenticatedRequest {
  consumer: Consumer;
}

/**
 * Authenticated consumer request (for type assertions)
 */
export type AuthenticatedConsumerRequest = ConsumerRequest;

/**
 * Extract bearer token from Authorization header
 */
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Consumer auth middleware options
 */
export interface ConsumerAuthMiddlewareOptions extends AuthMiddlewareOptions {
  /** Whether to require consumer exists in database */
  requireConsumer?: boolean;
  /** Whether to allow registration (consumer may not exist) */
  allowRegistration?: boolean;
}

/**
 * Create consumer auth middleware with options
 * Factory function for flexible auth requirements
 */
export function createConsumerAuthMiddleware(
  options: ConsumerAuthMiddlewareOptions
): preHandlerHookHandler {
  const { project, requireConsumer = true, allowRegistration = false } = options;

  return async function consumerAuthMiddleware(
    request: FastifyRequest,
    _reply: FastifyReply
  ): Promise<void> {
    const authHeader = request.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      throw new UnauthorizedError('Authorization header required');
    }

    try {
      // Verify Firebase token
      const firebaseUser: FirebaseUser = await firebaseAdmin.verifyToken(token, project);

      // Attach Firebase user to request
      (request as AuthenticatedRequest).firebaseUser = firebaseUser;

      logger.debug(
        { uid: firebaseUser.uid, email: firebaseUser.email },
        'Firebase token verified (consumer)'
      );

      // If consumer is required, load from database
      if (requireConsumer) {
        const consumer = await consumerRepository.findByFirebaseUid(firebaseUser.uid);

        if (!consumer && !allowRegistration) {
          // Consumer must register first
          throw new AppError(
            ERROR_CODES.CONSUMER_NOT_FOUND,
            'Account not found - registration required',
            HTTP_STATUS.NOT_FOUND
          );
        }

        if (consumer) {
          (request as ConsumerRequest).consumer = consumer;
          logger.debug(
            { consumerId: consumer.id, email: consumer.email },
            'Consumer loaded'
          );
        }
      }
    } catch (error) {
      // Re-throw AppErrors (our errors)
      if (error instanceof AppError) {
        throw error;
      }

      // Handle Firebase verification errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('expired')) {
        throw new AppError(
          ERROR_CODES.TOKEN_EXPIRED,
          'Authentication token has expired',
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      if (
        errorMessage.includes('invalid') ||
        errorMessage.includes('malformed') ||
        errorMessage.includes('Invalid')
      ) {
        throw new AppError(
          ERROR_CODES.INVALID_TOKEN,
          'Invalid authentication token',
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      logger.error({ error }, 'Consumer auth middleware error');
      throw new UnauthorizedError('Authentication failed');
    }
  };
}

/**
 * Pre-configured middleware for consumer routes
 * Requires valid Firebase token AND consumer exists in database
 */
export const requireConsumer = createConsumerAuthMiddleware({
  project: 'users',
  requireConsumer: true,
  allowRegistration: false,
});

/**
 * Pre-configured middleware for consumer registration
 * Requires valid Firebase token, consumer may not exist
 */
export const requireConsumerFirebaseAuth = createConsumerAuthMiddleware({
  project: 'users',
  requireConsumer: true,
  allowRegistration: true,
});

/**
 * Pre-configured middleware for Firebase-only auth (consumers)
 * Just verifies token, doesn't check database
 */
export const requireConsumerFirebaseToken = createConsumerAuthMiddleware({
  project: 'users',
  requireConsumer: false,
  allowRegistration: false,
});
