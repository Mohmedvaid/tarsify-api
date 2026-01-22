/**
 * Marketplace Notebooks Controller
 * Request handlers for browsing notebooks
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { createResponse } from '@/core/responses';
import { AppError } from '@/core/errors';
import { ERROR_CODES } from '@/core/errors/errorCodes';
import { marketplaceNotebooksService } from './notebooks.service';
import {
  listNotebooksQuerySchema,
  notebookIdParamsSchema,
} from './notebooks.schemas';

/**
 * GET /notebooks
 * List published notebooks
 */
export async function listNotebooksHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Validate query params
  const parseResult = listNotebooksQuerySchema.safeParse(request.query);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid query parameters',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const result = await marketplaceNotebooksService.listNotebooks(parseResult.data);

  createResponse(reply).paginated(result.data, {
    page: result.meta.page,
    limit: result.meta.limit,
    total: result.meta.total,
  });
}

/**
 * GET /notebooks/:id
 * Get notebook details
 */
export async function getNotebookHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Validate path params
  const parseResult = notebookIdParamsSchema.safeParse(request.params);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid notebook ID',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const result = await marketplaceNotebooksService.getNotebook(parseResult.data.id);
  createResponse(reply).success(result.data);
}

/**
 * GET /notebooks/featured
 * Get featured notebooks
 */
export async function getFeaturedNotebooksHandler(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const result = await marketplaceNotebooksService.getFeaturedNotebooks();
  createResponse(reply).success(result.data);
}

/**
 * GET /notebooks/categories
 * Get available categories with counts
 */
export async function getCategoriesHandler(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const result = await marketplaceNotebooksService.getCategories();
  createResponse(reply).success(result.data);
}
