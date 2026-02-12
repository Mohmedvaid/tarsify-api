/**
 * Marketplace Routes (Consumer-facing)
 * API routes for consumers to browse and run notebooks
 * Uses Firebase Project A (tarsify-users) for authentication
 */
import type { FastifyInstance } from 'fastify';
import { consumerAuthRoutes } from './auth';
import { marketplaceNotebooksRoutes } from './notebooks';
import { creditsRoutes } from './credits';
import { runsRoutes } from './runs';
import { modelsRoutes } from './models';

/**
 * Register marketplace routes
 */
export async function marketplaceRoutes(app: FastifyInstance): Promise<void> {
  // Auth routes - /api/marketplace/auth/*
  await app.register(consumerAuthRoutes, { prefix: '/auth' });

  // Notebook routes - /api/marketplace/notebooks/* (mostly PUBLIC)
  await app.register(marketplaceNotebooksRoutes, { prefix: '/notebooks' });

  // Credits routes - /api/marketplace/credits/* (AUTH required for most)
  await app.register(creditsRoutes, { prefix: '/credits' });

  // Runs routes - /api/marketplace/runs/* (AUTH required)
  await app.register(runsRoutes, { prefix: '/runs' });

  // Models routes - /api/marketplace/models/* (PUBLIC browse, AUTH for run)
  await app.register(modelsRoutes, { prefix: '/models' });

  // Root endpoint - API info
  app.get('/', async () => ({
    success: true,
    data: {
      message: 'Tarsify Marketplace API',
      version: 'v1',
      endpoints: {
        auth: '/auth - Authentication (register, login, profile)',
        notebooks: '/notebooks - Browse notebooks (public)',
        models: '/models - Browse and run AI models',
        runs: '/runs - Your execution history',
        credits: '/credits - Credit balance and purchases',
      },
    },
  }));
}
