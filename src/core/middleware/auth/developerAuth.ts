/**
 * Developer Auth Middleware
 * Verifies Firebase JWT and loads developer from database
 * For Studio routes (tarsify-devs Firebase project)
 */
import type {
  FastifyRequest,
  FastifyReply,
  preHandlerHookHandler,
} from 'fastify';
import { firebaseAdmin } from '@/services/firebase';
import { developerRepository } from '@/repositories';
import { UnauthorizedError, AppError } from '@/core/errors';
import { ERROR_CODES } from '@/core/errors/errorCodes';
import { HTTP_STATUS } from '@/config/constants';
import { logger } from '@/lib/logger';
import type {
  DeveloperRequest,
  AuthenticatedRequest,
  AuthMiddlewareOptions,
} from './types';

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
 * Create auth middleware with options
 * Factory function for flexible auth requirements
 */
export function createAuthMiddleware(
  options: AuthMiddlewareOptions
): preHandlerHookHandler {
  const {
    project,
    requireDeveloper = true,
    allowRegistration = false,
  } = options;

  return async function authMiddleware(
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
      const firebaseUser = await firebaseAdmin.verifyToken(token, project);

      // Attach Firebase user to request
      (request as AuthenticatedRequest).firebaseUser = firebaseUser;

      logger.debug(
        { uid: firebaseUser.uid, email: firebaseUser.email },
        'Firebase token verified'
      );

      // If developer is required, load from database
      if (requireDeveloper) {
        const developer = await developerRepository.findByFirebaseUid(
          firebaseUser.uid
        );

        if (!developer && !allowRegistration) {
          // Developer must register first
          throw new AppError(
            ERROR_CODES.DEVELOPER_NOT_FOUND,
            'Developer not found - registration required',
            HTTP_STATUS.NOT_FOUND
          );
        }

        if (developer) {
          (request as DeveloperRequest).developer = developer;
          logger.debug(
            { developerId: developer.id, email: developer.email },
            'Developer loaded'
          );
        }
      }
    } catch (error) {
      // Re-throw AppErrors (our errors)
      if (error instanceof AppError) {
        throw error;
      }

      // Handle Firebase verification errors
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorName = error instanceof Error ? error.name : '';

      // Check for database/infrastructure errors - these should not be 401
      if (
        errorName.includes('Prisma') ||
        errorMessage.includes("Can't reach database") ||
        errorMessage.includes('database server') ||
        errorMessage.includes('Connection refused') ||
        errorMessage.includes('ECONNREFUSED')
      ) {
        logger.error({ error }, 'Database connection error in auth middleware');
        throw new AppError(
          ERROR_CODES.INTERNAL_ERROR,
          'Service temporarily unavailable',
          HTTP_STATUS.SERVICE_UNAVAILABLE
        );
      }

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

      logger.error({ error }, 'Auth middleware error');
      throw new UnauthorizedError('Authentication failed');
    }
  };
}

/**
 * Pre-configured middleware for developer routes
 * Requires valid Firebase token AND developer exists in database
 */
export const requireDeveloper = createAuthMiddleware({
  project: 'devs',
  requireDeveloper: true,
  allowRegistration: false,
});

/**
 * Pre-configured middleware for developer registration
 * Requires valid Firebase token, developer may not exist
 */
export const requireFirebaseAuth = createAuthMiddleware({
  project: 'devs',
  requireDeveloper: true,
  allowRegistration: true,
});

/**
 * Pre-configured middleware for Firebase-only auth
 * Just verifies token, doesn't check database
 */
export const requireFirebaseToken = createAuthMiddleware({
  project: 'devs',
  requireDeveloper: false,
  allowRegistration: false,
});
