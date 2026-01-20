/**
 * Public Routes
 * No authentication required
 */
import type { FastifyInstance } from 'fastify';

/**
 * Register public routes
 * TODO: Implement public endpoints
 */
export async function publicRoutes(app: FastifyInstance): Promise<void> {
  // Placeholder - will be implemented with actual routes
  app.get('/', async () => ({
    success: true,
    data: {
      message: 'Public API - Coming soon',
      version: 'v1',
    },
  }));
}
