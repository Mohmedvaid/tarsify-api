/**
 * Auth Middleware Module
 * Re-exports all authentication middleware
 */

// Developer auth (Studio routes)
export {
  createAuthMiddleware,
  requireDeveloper,
  requireFirebaseAuth,
  requireFirebaseToken,
} from './developerAuth';

// Consumer auth (Marketplace routes)
export {
  createConsumerAuthMiddleware,
  requireConsumer,
  requireConsumerFirebaseAuth,
  requireConsumerFirebaseToken,
} from './consumerAuth';

export type { ConsumerRequest, AuthenticatedConsumerRequest } from './consumerAuth';

export type {
  AuthenticatedRequest,
  DeveloperRequest,
  AuthContext,
  AuthMiddlewareOptions,
} from './types';

export { isAuthenticatedRequest, isDeveloperRequest } from './types';
