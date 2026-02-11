/**
 * Admin Routes
 * Routes for platform administration (endpoints, base models)
 * Requires admin access (developer auth + ADMIN_UIDS check)
 */
import type { FastifyInstance } from 'fastify';
import { endpointRoutes } from './endpoints';
import { baseModelRoutes } from './base-models';

/**
 * Register all admin routes
 */
export async function adminRoutes(fastify: FastifyInstance): Promise<void> {
  // Register endpoint management routes
  await fastify.register(endpointRoutes, { prefix: '/endpoints' });

  // Register base model management routes
  await fastify.register(baseModelRoutes, { prefix: '/base-models' });
}
