/**
 * Auth Middleware Types
 * Type definitions for authentication middleware
 */
import type { FastifyRequest } from 'fastify';
import type { Developer } from '@prisma/client';
import type { FirebaseUser, FirebaseProject } from '@/services/firebase';

/**
 * Authenticated request with Firebase user
 * Use for routes that only need Firebase authentication
 */
export interface AuthenticatedRequest extends FastifyRequest {
  firebaseUser: FirebaseUser;
}

/**
 * Developer request with full developer profile
 * Use for routes that need developer data from database
 */
export interface DeveloperRequest extends AuthenticatedRequest {
  developer: Developer;
}

/**
 * Auth context attached to request
 */
export interface AuthContext {
  firebaseUser: FirebaseUser;
  developer?: Developer;
  project: FirebaseProject;
}

/**
 * Auth middleware options
 */
export interface AuthMiddlewareOptions {
  /** Firebase project to verify against */
  project: FirebaseProject;
  /** Whether to require developer exists in database */
  requireDeveloper?: boolean;
  /** Whether to allow registration (developer may not exist) */
  allowRegistration?: boolean;
}

/**
 * Type guard for AuthenticatedRequest
 */
export function isAuthenticatedRequest(
  request: FastifyRequest
): request is AuthenticatedRequest {
  return 'firebaseUser' in request && request.firebaseUser !== undefined;
}

/**
 * Type guard for DeveloperRequest
 */
export function isDeveloperRequest(
  request: FastifyRequest
): request is DeveloperRequest {
  return (
    isAuthenticatedRequest(request) &&
    'developer' in request &&
    request.developer !== undefined
  );
}
