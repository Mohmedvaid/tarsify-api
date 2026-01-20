/**
 * Application Constants
 * Non-environment configuration values
 */

/**
 * Application metadata
 */
export const APP = {
  NAME: 'tarsify-api',
  DESCRIPTION: 'Tarsify AI Marketplace API',
  VERSION: '1.0.0',
} as const;

/**
 * HTTP Status Codes
 * Use these instead of magic numbers
 */
export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * Request timeout values (ms)
 */
export const TIMEOUTS = {
  DEFAULT: 30000,
  LONG_RUNNING: 120000,
  HEALTH_CHECK: 5000,
} as const;

/**
 * Cache TTL values (seconds)
 */
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const;

/**
 * GPU Types available
 */
export const GPU_TYPES = ['T4', 'L4', 'A100', 'H100'] as const;
export type GpuType = (typeof GPU_TYPES)[number];

/**
 * Notebook statuses
 */
export const NOTEBOOK_STATUS = ['draft', 'published', 'archived'] as const;
export type NotebookStatus = (typeof NOTEBOOK_STATUS)[number];

/**
 * Execution statuses
 */
export const EXECUTION_STATUS = [
  'pending',
  'running',
  'completed',
  'failed',
] as const;
export type ExecutionStatus = (typeof EXECUTION_STATUS)[number];

/**
 * Payout statuses
 */
export const PAYOUT_STATUS = [
  'pending',
  'processing',
  'completed',
  'failed',
] as const;
export type PayoutStatus = (typeof PAYOUT_STATUS)[number];

/**
 * Notebook categories
 */
export const NOTEBOOK_CATEGORIES = [
  'image',
  'text',
  'video',
  'audio',
  'other',
] as const;
export type NotebookCategory = (typeof NOTEBOOK_CATEGORIES)[number];
