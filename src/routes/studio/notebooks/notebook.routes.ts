/**
 * Notebook Routes
 * Fastify route definitions for notebook endpoints
 * 
 * MVP Endpoints:
 * - POST /notebooks - Create notebook metadata
 * - GET /notebooks - List notebooks
 * - GET /notebooks/:id - Get notebook details
 * - DELETE /notebooks/:id - Delete notebook (and file)
 * - POST /notebooks/:id/file - Upload .ipynb file
 * - GET /notebooks/:id/file - Download .ipynb file
 * - DELETE /notebooks/:id/file - Delete just the file
 * - POST /notebooks/:id/publish - Publish notebook
 * - POST /notebooks/:id/unpublish - Unpublish notebook
 */
import type { FastifyInstance } from 'fastify';
import { requireDeveloper } from '@/core/middleware';
import {
  createNotebookHandler,
  listNotebooksHandler,
  getNotebookHandler,
  deleteNotebookHandler,
  uploadNotebookFileHandler,
  downloadNotebookFileHandler,
  deleteNotebookFileHandler,
  publishNotebookHandler,
  unpublishNotebookHandler,
} from './notebook.controller';
import {
  notebookListItemJsonSchema,
  notebookDetailJsonSchema,
  notebookMutationJsonSchema,
  paginationMetaJsonSchema,
} from './notebook.schemas';
import { GpuType, NotebookCategory } from '@prisma/client';

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
 * Paginated response wrapper schema
 */
const wrapInPaginated = (dataSchema: object): object => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', const: true },
    data: {
      type: 'array',
      items: dataSchema,
    },
    meta: paginationMetaJsonSchema,
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
 * Common path params schema
 */
const notebookIdParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', format: 'uuid' },
  },
};

/**
 * Register notebook routes
 */
export async function notebookRoutes(app: FastifyInstance): Promise<void> {
  // ============================================
  // Notebook CRUD
  // ============================================

  /**
   * POST /notebooks
   * Create a new notebook (metadata only)
   */
  app.post(
    '/',
    {
      preHandler: [requireDeveloper],
      schema: {
        description: 'Create a new notebook (metadata only). Upload .ipynb file separately.',
        tags: ['Notebooks'],
        body: {
          type: 'object',
          required: ['title', 'gpuType', 'priceCredits'],
          properties: {
            title: { type: 'string', minLength: 3, maxLength: 200 },
            description: { type: ['string', 'null'], maxLength: 10000 },
            shortDescription: { type: ['string', 'null'], maxLength: 255 },
            category: { type: 'string', enum: Object.values(NotebookCategory) },
            gpuType: { type: 'string', enum: Object.values(GpuType) },
            priceCredits: { type: 'integer', minimum: 1, maximum: 10000 },
          },
        },
        response: {
          201: wrapInSuccess(notebookMutationJsonSchema),
          400: errorResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    createNotebookHandler
  );

  /**
   * GET /notebooks
   * List notebooks with pagination and filtering
   */
  app.get(
    '/',
    {
      preHandler: [requireDeveloper],
      schema: {
        description: 'List notebooks with pagination and filtering',
        tags: ['Notebooks'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'archived', 'all'],
              default: 'all',
            },
            sort: {
              type: 'string',
              pattern: '^-?(createdAt|updatedAt|title|totalRuns|priceCredits)$',
              default: '-createdAt',
            },
            search: { type: 'string', maxLength: 100 },
          },
        },
        response: {
          200: wrapInPaginated(notebookListItemJsonSchema),
          400: errorResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    listNotebooksHandler
  );

  /**
   * GET /notebooks/:id
   * Get notebook details
   */
  app.get(
    '/:id',
    {
      preHandler: [requireDeveloper],
      schema: {
        description: 'Get notebook details',
        tags: ['Notebooks'],
        params: notebookIdParamsSchema,
        response: {
          200: wrapInSuccess(notebookDetailJsonSchema),
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getNotebookHandler
  );

  /**
   * DELETE /notebooks/:id
   * Delete notebook and its file
   */
  app.delete(
    '/:id',
    {
      preHandler: [requireDeveloper],
      schema: {
        description: 'Delete notebook and its file (draft notebooks are fully deleted, published ones are archived)',
        tags: ['Notebooks'],
        params: notebookIdParamsSchema,
        response: {
          200: wrapInSuccess({
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              status: { type: 'string' },
            },
          }),
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    deleteNotebookHandler
  );

  // ============================================
  // File Upload/Download
  // ============================================

  /**
   * POST /notebooks/:id/file
   * Upload .ipynb file (replaces existing if any)
   */
  app.post(
    '/:id/file',
    {
      preHandler: [requireDeveloper],
      schema: {
        description: 'Upload .ipynb notebook file. Replaces existing file if one exists. Only allowed on draft notebooks.',
        tags: ['Notebooks'],
        params: notebookIdParamsSchema,
        consumes: ['multipart/form-data'],
        response: {
          200: wrapInSuccess(notebookDetailJsonSchema),
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    uploadNotebookFileHandler
  );

  /**
   * GET /notebooks/:id/file
   * Download .ipynb file
   */
  app.get(
    '/:id/file',
    {
      preHandler: [requireDeveloper],
      schema: {
        description: 'Download the .ipynb notebook file',
        tags: ['Notebooks'],
        params: notebookIdParamsSchema,
        produces: ['application/x-ipynb+json'],
        response: {
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    downloadNotebookFileHandler
  );

  /**
   * DELETE /notebooks/:id/file
   * Delete just the file (keeps notebook metadata)
   */
  app.delete(
    '/:id/file',
    {
      preHandler: [requireDeveloper],
      schema: {
        description: 'Delete notebook file but keep metadata. Only allowed on draft notebooks.',
        tags: ['Notebooks'],
        params: notebookIdParamsSchema,
        response: {
          200: wrapInSuccess(notebookDetailJsonSchema),
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    deleteNotebookFileHandler
  );

  // ============================================
  // Publishing
  // ============================================

  /**
   * POST /notebooks/:id/publish
   * Publish notebook to marketplace
   */
  app.post(
    '/:id/publish',
    {
      preHandler: [requireDeveloper],
      schema: {
        description: 'Publish notebook to marketplace. Requires all metadata and an uploaded .ipynb file.',
        tags: ['Notebooks'],
        params: notebookIdParamsSchema,
        response: {
          200: wrapInSuccess(notebookDetailJsonSchema),
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    publishNotebookHandler
  );

  /**
   * POST /notebooks/:id/unpublish
   * Remove notebook from marketplace
   */
  app.post(
    '/:id/unpublish',
    {
      preHandler: [requireDeveloper],
      schema: {
        description: 'Remove notebook from marketplace. Returns to draft status.',
        tags: ['Notebooks'],
        params: notebookIdParamsSchema,
        response: {
          200: wrapInSuccess(notebookDetailJsonSchema),
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    unpublishNotebookHandler
  );
}
