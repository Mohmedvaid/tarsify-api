/**
 * Routes Module
 * Central route registration
 */
import type { FastifyInstance } from 'fastify';
import { ROUTE_GROUPS, API_PREFIX } from '@/config/routes';
import { healthRoutes } from './health/index';
import { marketplaceRoutes } from './marketplace/index';
import { studioRoutes } from './studio/index';
import { publicRoutes } from './public/index';
import { webhookRoutes } from './webhooks/index';

/**
 * Register all application routes
 */
export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // Health check routes (no prefix for K8s/Cloud Run probes)
  await app.register(healthRoutes, { prefix: ROUTE_GROUPS.HEALTH });

  // API routes with versioned prefix
  await app.register(
    async (api) => {
      // Public routes (no auth)
      await api.register(publicRoutes, { prefix: ROUTE_GROUPS.PUBLIC });

      // Marketplace routes (consumer auth)
      await api.register(marketplaceRoutes, { prefix: ROUTE_GROUPS.MARKETPLACE });

      // Studio routes (developer auth)
      await api.register(studioRoutes, { prefix: ROUTE_GROUPS.STUDIO });

      // Webhook routes
      await api.register(webhookRoutes, { prefix: ROUTE_GROUPS.WEBHOOKS });
    },
    { prefix: API_PREFIX }
  );
}
