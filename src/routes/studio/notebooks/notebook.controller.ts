/**
 * Notebook Controller
 * Request handlers for notebook endpoints
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
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { DeveloperRequest } from '@/core/middleware/auth/types';
import { createResponse } from '@/core/responses';
import { AppError } from '@/core/errors/AppError';
import { ERROR_CODES } from '@/core/errors/errorCodes';
import {
  createNotebookSchema,
  listNotebooksQuerySchema,
  notebookParamsSchema,
} from './notebook.schemas';
import * as notebookService from './notebook.service';

/**
 * POST /notebooks
 * Create a new notebook (metadata only)
 */
export async function createNotebookHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { developer } = request as DeveloperRequest;

  // Validate request body
  const parseResult = createNotebookSchema.safeParse(request.body);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid request body',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const result = await notebookService.createNotebook(
    developer.id,
    parseResult.data
  );

  createResponse(reply).created(result.data);
}

/**
 * GET /notebooks
 * List notebooks with pagination and filtering
 */
export async function listNotebooksHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { developer } = request as DeveloperRequest;

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

  const result = await notebookService.listNotebooks(
    developer.id,
    parseResult.data
  );

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
  const { developer } = request as DeveloperRequest;

  // Validate path params
  const parseResult = notebookParamsSchema.safeParse(request.params);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid notebook ID',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const result = await notebookService.getNotebook(
    parseResult.data.id,
    developer.id
  );

  createResponse(reply).success(result.data);
}

/**
 * DELETE /notebooks/:id
 * Delete notebook and its file
 */
export async function deleteNotebookHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { developer } = request as DeveloperRequest;

  // Validate path params
  const parseResult = notebookParamsSchema.safeParse(request.params);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid notebook ID',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const result = await notebookService.deleteNotebook(
    parseResult.data.id,
    developer.id
  );

  createResponse(reply).success(result.data);
}

// ============================================
// File Upload/Download Handlers
// ============================================

/**
 * POST /notebooks/:id/file
 * Upload notebook file (.ipynb)
 */
export async function uploadNotebookFileHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { developer } = request as DeveloperRequest;

  // Validate path params
  const parseResult = notebookParamsSchema.safeParse(request.params);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid notebook ID',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  // Get the uploaded file from multipart
  const file = await request.file();
  
  if (!file) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'No file uploaded. Please upload a .ipynb file.',
      400
    );
  }

  // Read file content
  const chunks: Buffer[] = [];
  for await (const chunk of file.file) {
    chunks.push(chunk);
  }
  const fileContent = Buffer.concat(chunks);

  const result = await notebookService.uploadNotebookFile(
    parseResult.data.id,
    developer.id,
    fileContent,
    file.filename
  );

  createResponse(reply).success(result.data);
}

/**
 * GET /notebooks/:id/file
 * Download notebook file
 */
export async function downloadNotebookFileHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { developer } = request as DeveloperRequest;

  // Validate path params
  const parseResult = notebookParamsSchema.safeParse(request.params);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid notebook ID',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const { content, filename } = await notebookService.downloadNotebookFile(
    parseResult.data.id,
    developer.id
  );

  reply
    .header('Content-Type', 'application/x-ipynb+json')
    .header('Content-Disposition', `attachment; filename="${filename}"`)
    .send(content);
}

/**
 * DELETE /notebooks/:id/file
 * Delete notebook file (keeps metadata)
 */
export async function deleteNotebookFileHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { developer } = request as DeveloperRequest;

  // Validate path params
  const parseResult = notebookParamsSchema.safeParse(request.params);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid notebook ID',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const result = await notebookService.deleteNotebookFile(
    parseResult.data.id,
    developer.id
  );

  createResponse(reply).success(result.data);
}

// ============================================
// Publishing Handlers
// ============================================

/**
 * POST /notebooks/:id/publish
 * Publish notebook to marketplace
 */
export async function publishNotebookHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { developer } = request as DeveloperRequest;

  // Validate path params
  const parseResult = notebookParamsSchema.safeParse(request.params);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid notebook ID',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const result = await notebookService.publishNotebook(
    parseResult.data.id,
    developer.id
  );

  createResponse(reply).success(result.data);
}

/**
 * POST /notebooks/:id/unpublish
 * Remove notebook from marketplace
 */
export async function unpublishNotebookHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { developer } = request as DeveloperRequest;

  // Validate path params
  const parseResult = notebookParamsSchema.safeParse(request.params);
  if (!parseResult.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid notebook ID',
      400,
      { errors: parseResult.error.flatten().fieldErrors }
    );
  }

  const result = await notebookService.unpublishNotebook(
    parseResult.data.id,
    developer.id
  );

  createResponse(reply).success(result.data);
}
