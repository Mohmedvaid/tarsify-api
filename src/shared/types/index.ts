/**
 * Shared Types
 * Common types used across the application
 */
import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Base request with typed params
 */
export interface TypedRequest<
  TBody = unknown,
  TParams = unknown,
  TQuery = unknown,
> extends FastifyRequest {
  body: TBody;
  params: TParams;
  query: TQuery;
}

/**
 * Route handler function signature
 */
export type RouteHandler<
  TBody = unknown,
  TParams = unknown,
  TQuery = unknown,
  TResponse = unknown,
> = (
  request: TypedRequest<TBody, TParams, TQuery>,
  reply: FastifyReply
) => Promise<TResponse>;

/**
 * ID parameter type
 */
export interface IdParams {
  id: string;
}

/**
 * Pagination query parameters
 */
export interface PaginationQuery {
  page?: string;
  limit?: string;
}

/**
 * Search query parameters
 */
export interface SearchQuery extends PaginationQuery {
  q?: string;
}

/**
 * Authenticated user context - Consumer
 */
export interface ConsumerContext {
  uid: string;
  email: string;
  consumerId: string;
}

/**
 * Authenticated user context - Developer
 */
export interface DeveloperContext {
  uid: string;
  email: string;
  developerId: string;
}

/**
 * Request with consumer auth
 */
export interface ConsumerRequest extends FastifyRequest {
  consumer: ConsumerContext;
}

/**
 * Request with developer auth
 */
export interface DeveloperRequest extends FastifyRequest {
  developer: DeveloperContext;
}

/**
 * Service result pattern for cleaner error handling
 */
export type ServiceResult<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Create successful service result
 */
export function ok<T>(data: T): ServiceResult<T, never> {
  return { success: true, data };
}

/**
 * Create failed service result
 */
export function fail<E>(error: E): ServiceResult<never, E> {
  return { success: false, error };
}
