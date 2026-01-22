/**
 * Studio Routes (Developer-facing)
 * API routes for developer portal
 * Uses Firebase Project B (tarsify-devs) for authentication
 */
import type { FastifyInstance } from 'fastify';
import { authRoutes } from './auth/index';
import { notebookRoutes } from './notebooks/index';

/**
 * Register studio routes
 * All routes are prefixed with /api/studio
 */
export async function studioRoutes(app: FastifyInstance): Promise<void> {
  // Auth routes: /api/studio/auth/*
  await app.register(authRoutes, { prefix: '/auth' });

  // Notebook routes: /api/studio/notebooks/*
  await app.register(notebookRoutes, { prefix: '/notebooks' });

  // Root endpoint for API discovery
  app.get('/', async () => ({
    success: true,
    data: {
      message: 'Tarsify Studio API',
      version: 'v1',
      endpoints: {
        auth: '/auth',
        notebooks: '/notebooks',
        analytics: '/analytics',
        earnings: '/earnings',
        payouts: '/payouts',
      },
    },
  }));
}
