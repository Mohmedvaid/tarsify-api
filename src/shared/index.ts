/**
 * Shared Module
 * Central export for all shared utilities
 */

// Types
export type {
  TypedRequest,
  RouteHandler,
  IdParams,
  PaginationQuery,
  SearchQuery,
  ConsumerContext,
  DeveloperContext,
  ConsumerRequest,
  DeveloperRequest,
  ServiceResult,
} from './types/index';

export { ok, fail } from './types/index';

// Utils
export {
  parsePagination,
  sleep,
  retry,
  omit,
  pick,
  isDefined,
  slugify,
  sanitize,
} from './utils/index';

// Schemas
export {
  uuidSchema,
  idParamsSchema,
  paginationSchema,
  searchSchema,
  emailSchema,
  urlSchema,
  optionalUrlSchema,
  gpuTypeSchema,
  notebookStatusSchema,
  notebookCategorySchema,
  priceSchema,
  timestampSchema,
  stringSchema,
  validateBody,
  validateParams,
  validateQuery,
} from './schemas/index';
