/**
 * Marketplace Notebooks Routes
 * Route definitions for browsing published notebooks
 * These endpoints are PUBLIC - no auth required
 */
import type { FastifyInstance } from 'fastify';
import {
  listNotebooksHandler,
  getNotebookHandler,
  getFeaturedNotebooksHandler,
  getCategoriesHandler,
} from './notebooks.controller';
import {
  notebookCardJsonSchema,
  notebookDetailJsonSchema,
  listNotebooksQueryJsonSchema,
} from './notebooks.schemas';

/**
 * Success response wrapper schema
 */
const wrapInSuccess = (dataSchema: object): object => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', const: true },
    data: dataSchema,
  },
});

/**
 * Paginated response wrapper
 */
const wrapInPaginated = (dataSchema: object): object => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', const: true },
    data: {
      type: 'array',
      items: dataSchema,
    },
    meta: {
      type: 'object',
      properties: {
        page: { type: 'integer' },
        limit: { type: 'integer' },
        total: { type: 'integer' },
        totalPages: { type: 'integer' },
      },
    },
  },
});

/**
 * Error response schema
 */
const errorResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', const: false },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        details: { type: 'object' },
      },
    },
  },
};

/**
 * Category item schema
 */
const categoryItemSchema = {
  type: 'object',
  properties: {
    key: { type: 'string' },
    displayName: { type: 'string' },
    count: { type: 'integer' },
  },
};

/**
 * Register marketplace notebook routes
 * NOTE: These are PUBLIC endpoints - no authentication required
 */
export async function marketplaceNotebooksRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /notebooks/featured
   * Get featured notebooks (popular + top rated)
   */
  app.get('/featured', {
    schema: {
      description: 'Get featured notebooks',
      tags: ['Marketplace Notebooks'],
      response: {
        200: wrapInSuccess({
          type: 'array',
          items: notebookCardJsonSchema,
        }),
      },
    },
    handler: getFeaturedNotebooksHandler,
  });

  /**
   * GET /notebooks/categories
   * Get available categories with notebook counts
   */
  app.get('/categories', {
    schema: {
      description: 'Get notebook categories with counts',
      tags: ['Marketplace Notebooks'],
      response: {
        200: wrapInSuccess({
          type: 'array',
          items: categoryItemSchema,
        }),
      },
    },
    handler: getCategoriesHandler,
  });

  /**
   * GET /notebooks
   * List published notebooks with filtering and pagination
   */
  app.get('/', {
    schema: {
      description: 'List published notebooks',
      tags: ['Marketplace Notebooks'],
      querystring: listNotebooksQueryJsonSchema,
      response: {
        200: wrapInPaginated(notebookCardJsonSchema),
        400: errorResponseSchema,
      },
    },
    handler: listNotebooksHandler,
  });

  /**
   * GET /notebooks/:id
   * Get notebook details by ID
   */
  app.get('/:id', {
    schema: {
      description: 'Get notebook details',
      tags: ['Marketplace Notebooks'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
        required: ['id'],
      },
      response: {
        200: wrapInSuccess(notebookDetailJsonSchema),
        404: errorResponseSchema,
      },
    },
    handler: getNotebookHandler,
  });
}
