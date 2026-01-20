/**
 * Route Path Constants
 * Single source of truth for all API route paths
 * Change paths here to update everywhere
 */

/**
 * API version prefix
 */
export const API_PREFIX = '/api' as const;

/**
 * Route group prefixes
 * Update these to rename route groups across the app
 */
export const ROUTE_GROUPS = {
  HEALTH: '/health',
  PUBLIC: '/public',
  MARKETPLACE: '/marketplace', // Consumer-facing routes
  STUDIO: '/studio', // Developer-facing routes
  WEBHOOKS: '/webhooks',
} as const;

/**
 * Health check routes
 */
export const HEALTH_ROUTES = {
  BASE: '/',
  READY: '/ready',
  LIVE: '/live',
} as const;

/**
 * Public routes (no auth required)
 */
export const PUBLIC_ROUTES = {
  NOTEBOOKS: '/notebooks',
  NOTEBOOK_BY_ID: '/notebooks/:id',
  SEARCH: '/search',
  CATEGORIES: '/categories',
} as const;

/**
 * Marketplace routes (Consumer auth - Firebase Project A)
 */
export const MARKETPLACE_ROUTES = {
  // Auth
  AUTH_ME: '/auth/me',
  AUTH_REGISTER: '/auth/register',
  AUTH_PROFILE: '/auth/profile',

  // Credits
  CREDITS: '/credits',
  CREDITS_PURCHASE: '/credits/purchase',

  // Notebooks
  NOTEBOOK_RUN: '/notebooks/:id/run',

  // Executions
  EXECUTIONS: '/executions',
  EXECUTION_BY_ID: '/executions/:id',

  // Purchases
  PURCHASES: '/purchases',
} as const;

/**
 * Studio routes (Developer auth - Firebase Project B)
 */
export const STUDIO_ROUTES = {
  // Auth
  AUTH_ME: '/auth/me',
  AUTH_REGISTER: '/auth/register',
  AUTH_PROFILE: '/auth/profile',
  AUTH_VERIFY: '/auth/verify',

  // Notebooks
  NOTEBOOKS: '/notebooks',
  NOTEBOOK_BY_ID: '/notebooks/:id',
  NOTEBOOK_PUBLISH: '/notebooks/:id/publish',

  // Analytics
  ANALYTICS: '/analytics',
  ANALYTICS_BY_ID: '/analytics/:id',

  // Earnings
  EARNINGS: '/earnings',
  EARNINGS_HISTORY: '/earnings/history',

  // Payouts
  PAYOUTS: '/payouts',
  PAYOUTS_REQUEST: '/payouts/request',
} as const;

/**
 * Webhook routes
 */
export const WEBHOOK_ROUTES = {
  STRIPE: '/stripe',
  RUNPOD: '/runpod',
} as const;

/**
 * Build full path with API prefix
 */
export function buildPath(group: string, route: string = ''): string {
  return `${API_PREFIX}${group}${route}`;
}

/**
 * All route constants exported for easy access
 */
export const ROUTES = {
  API_PREFIX,
  GROUPS: ROUTE_GROUPS,
  HEALTH: HEALTH_ROUTES,
  PUBLIC: PUBLIC_ROUTES,
  MARKETPLACE: MARKETPLACE_ROUTES,
  STUDIO: STUDIO_ROUTES,
  WEBHOOKS: WEBHOOK_ROUTES,
  buildPath,
} as const;
