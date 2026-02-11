/**
 * Admin Auth Middleware
 * Extends developer auth to require ADMIN_UIDS check
 * Only Firebase UIDs in ADMIN_UIDS env var can access admin routes
 */
import type { FastifyRequest, FastifyReply, preHandlerHookHandler } from 'fastify';
import { firebaseAdmin } from '@/services/firebase';
import { developerRepository } from '@/repositories';
import { UnauthorizedError, AppError, ForbiddenError } from '@/core/errors';
import { ERROR_CODES } from '@/core/errors/errorCodes';
import { HTTP_STATUS } from '@/config/constants';
import { env } from '@/config/env';
import { logger } from '@/lib/logger';
import type { DeveloperRequest, AuthenticatedRequest } from './types';

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
 * Admin auth middleware
 * Verifies Firebase token, loads developer, and checks ADMIN_UIDS
 */
export const requireAdmin: preHandlerHookHandler = async function adminAuthMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  const token = extractBearerToken(authHeader);

  if (!token) {
    throw new UnauthorizedError('Authorization header required');
  }

  try {
    // Verify Firebase token (developer project)
    const firebaseUser = await firebaseAdmin.verifyToken(token, 'devs');

    // Attach Firebase user to request
    (request as AuthenticatedRequest).firebaseUser = firebaseUser;

    logger.debug(
      { uid: firebaseUser.uid, email: firebaseUser.email },
      'Firebase token verified for admin'
    );

    // Check if user is in ADMIN_UIDS
    const adminUids = env.ADMIN_UIDS;
    if (!adminUids.includes(firebaseUser.uid)) {
      logger.warn(
        { uid: firebaseUser.uid },
        'Non-admin user attempted to access admin route'
      );
      throw new ForbiddenError('Admin access required');
    }

    // Load developer from database
    const developer = await developerRepository.findByFirebaseUid(firebaseUser.uid);

    if (!developer) {
      throw new AppError(
        ERROR_CODES.DEVELOPER_NOT_FOUND,
        'Developer not found - registration required',
        HTTP_STATUS.NOT_FOUND
      );
    }

    (request as DeveloperRequest).developer = developer;
    logger.debug(
      { developerId: developer.id, email: developer.email },
      'Admin developer loaded'
    );
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
      errorMessage.includes('Decoding')
    ) {
      throw new AppError(
        ERROR_CODES.INVALID_TOKEN,
        'Invalid authentication token',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Unknown error
    logger.error({ error: errorMessage }, 'Admin auth error');
    throw new AppError(
      ERROR_CODES.UNAUTHORIZED,
      'Authentication failed',
      HTTP_STATUS.UNAUTHORIZED
    );
  }
};
