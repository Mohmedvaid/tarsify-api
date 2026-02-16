/**
 * Admin Routes
 * Routes for platform administration (endpoints, base models)
 * Requires admin access (developer auth + ADMIN_UIDS check)
 */
import type { FastifyInstance } from 'fastify';
import { endpointRoutes } from './endpoints';
import { baseModelRoutes } from './base-models';
import { initRoutes } from './init';

/**
 * Register all admin routes
 */
export async function adminRoutes(fastify: FastifyInstance): Promise<void> {
  // Register endpoint management routes
  await fastify.register(endpointRoutes, { prefix: '/endpoints' });

  // Register base model management routes
  await fastify.register(baseModelRoutes, { prefix: '/base-models' });

  // TEMP: Register init routes (uses SUPER_ADMIN_TOKEN, remove after seeding)
  await fastify.register(initRoutes, { prefix: '/init' });
}
