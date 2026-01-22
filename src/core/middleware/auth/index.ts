/**
 * Auth Middleware Module
 * Re-exports all authentication middleware
 */
export {
  createAuthMiddleware,
  requireDeveloper,
  requireFirebaseAuth,
  requireFirebaseToken,
} from './developerAuth';

export type {
  AuthenticatedRequest,
  DeveloperRequest,
  AuthContext,
  AuthMiddlewareOptions,
} from './types';

export { isAuthenticatedRequest, isDeveloperRequest } from './types';
