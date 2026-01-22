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
  EXECUTION_STATUS,
  PAYOUT_STATUS,
  NOTEBOOK_CATEGORIES,
} from './constants';

export type {
  GpuType,
  NotebookStatus,
  ExecutionStatus,
  PayoutStatus,
  NotebookCategory,
} from './constants';

// Consumer display configuration
export {
  COMPUTE_TIERS,
  CATEGORIES,
  EXECUTION_DISPLAY,
  CREDIT_PRICING,
  DISPLAY_LABELS,
  getComputeTierDisplay,
  getComputeTierInfo,
  getCategoryDisplay,
  getCategoryInfo,
  getExecutionStatusDisplay,
  formatCredits,
} from './consumer';

export type { ComputeTierKey, CategoryKey, ExecutionStatusKey } from './consumer';
