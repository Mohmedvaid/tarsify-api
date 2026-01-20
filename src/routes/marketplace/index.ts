/**
 * Marketplace Routes (Consumer-facing)
 * Placeholder for consumer API routes
 * Uses Firebase Project A for authentication
 */
import type { FastifyInstance } from 'fastify';

/**
 * Register marketplace routes
 * TODO: Implement consumer endpoints
 */
export async function marketplaceRoutes(app: FastifyInstance): Promise<void> {
  // Placeholder - will be implemented with actual routes
  app.get('/', async () => ({
    success: true,
    data: {
      message: 'Marketplace API - Coming soon',
      version: 'v1',
    },
  }));
}
