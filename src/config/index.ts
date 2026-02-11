/**
 * Configuration Module
 * Central export for all configuration
 */

export { env, isDev, isProd, isTest } from './env';
export type { Env } from './env';

export {
  ROUTES,
  API_PREFIX,
  ROUTE_GROUPS,
  HEALTH_ROUTES,
  PUBLIC_ROUTES,
  MARKETPLACE_ROUTES,
  STUDIO_ROUTES,
  WEBHOOK_ROUTES,
  buildPath,
} from './routes';

export {
  APP,
  HTTP_STATUS,
  PAGINATION,
  TIMEOUTS,
  CACHE_TTL,
  GPU_TYPES,
  NOTEBOOK_STATUS,
  PAYOUT_STATUS,
  NOTEBOOK_CATEGORIES,
} from './constants';

export type {
  GpuType,
  NotebookStatus,
  PayoutStatus,
  NotebookCategory,
} from './constants';

// Consumer display configuration
export {
  COMPUTE_TIERS,
  CATEGORIES,
  CREDIT_PRICING,
  DISPLAY_LABELS,
  getComputeTierDisplay,
  getComputeTierInfo,
  getCategoryDisplay,
  getCategoryInfo,
  formatCredits,
} from './consumer';

export type { ComputeTierKey, CategoryKey } from './consumer';
