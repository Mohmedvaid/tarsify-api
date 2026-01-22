/**
 * Notebook Service
 * Business logic for notebook operations
 * 
 * MVP Flow:
 * 1. Developer creates notebook metadata (title, description, price, etc.)
 * 2. Developer uploads .ipynb file to the notebook
 * 3. One .ipynb file per notebook (re-upload replaces existing)
 * 4. Developer can download, delete the file
 * 5. Delete notebook removes everything
 */
import type { Notebook, NotebookStatus } from '@prisma/client';
import { notebookRepository } from '@/repositories';
import type { PaginatedResult, CreateNotebookData } from '@/repositories/notebook.types';
import { AppError } from '@/core/errors/AppError';
import { ERROR_CODES } from '@/core/errors/errorCodes';
import { logger, notebookStorage } from '@/lib';
import type { CreateNotebookInput, ListNotebooksQuery } from './notebook.schemas';

/**
 * Required fields for publishing
 */
const REQUIRED_FOR_PUBLISH = ['title', 'description', 'shortDescription', 'priceCredits', 'gpuType'] as const;

/**
 * Notebook service interface
 */
export interface NotebookServiceResult<T> {
  data: T;
  message?: string;
}

/**
 * Verify notebook ownership
 * @throws AppError if notebook not found or not owned by developer
 */
async function verifyOwnership(
  notebookId: string,
  developerId: string
): Promise<Notebook> {
  const notebook = await notebookRepository.findByIdAndDeveloper(
    notebookId,
    developerId
  );

  if (!notebook) {
    throw new AppError(
      ERROR_CODES.NOTEBOOK_NOT_FOUND,
      'Notebook not found',
      404
    );
  }

  return notebook;
}

/**
 * Validate notebook is ready for publishing
 */
function validateReadyForPublish(notebook: Notebook): void {
  const missing: string[] = [];

  for (const field of REQUIRED_FOR_PUBLISH) {
    const value = notebook[field];
    if (value === null || value === undefined || value === '') {
      missing.push(field);
    }
  }

  // Must have a notebook file uploaded
  if (!notebook.notebookFileUrl) {
    missing.push('notebookFile');
  }

  if (missing.length > 0) {
    throw new AppError(
      ERROR_CODES.NOTEBOOK_INVALID_STATUS,
      `Notebook is not ready for publishing. Missing required fields: ${missing.join(', ')}`,
      400,
      { missingFields: missing }
    );
  }
}

// ============================================
// Notebook CRUD Operations
// ============================================

/**
 * Create a new notebook (metadata only, no file yet)
 */
export async function createNotebook(
  developerId: string,
  input: CreateNotebookInput
): Promise<NotebookServiceResult<Notebook>> {
  logger.debug({ developerId, input }, 'Creating notebook');

  const createData: CreateNotebookData = {
    developerId,
    title: input.title,
    description: input.description,
    shortDescription: input.shortDescription,
    category: input.category,
    gpuType: input.gpuType,
    priceCredits: input.priceCredits,
  };

  const notebook = await notebookRepository.create(createData);

  logger.info(
    { notebookId: notebook.id, developerId },
    'Notebook created successfully'
  );

  return {
    data: notebook,
    message: 'Notebook created successfully. Upload your .ipynb file to complete setup.',
  };
}

/**
 * Get notebook by ID (with ownership check)
 */
export async function getNotebook(
  notebookId: string,
  developerId: string
): Promise<NotebookServiceResult<Notebook>> {
  const notebook = await verifyOwnership(notebookId, developerId);

  return { data: notebook };
}

/**
 * List notebooks with pagination and filtering
 */
export async function listNotebooks(
  developerId: string,
  query: ListNotebooksQuery
): Promise<PaginatedResult<Notebook>> {
  const result = await notebookRepository.findMany(
    {
      developerId,
      status: query.status === 'all' ? undefined : query.status as NotebookStatus,
      search: query.search,
    },
    {
      page: query.page,
      limit: query.limit,
      sort: query.sort,
    }
  );

  return result;
}

/**
 * Delete notebook and its file
 * - Draft notebooks are hard deleted
 * - Published/archived notebooks are archived (file kept for historical runs)
 */
export async function deleteNotebook(
  notebookId: string,
  developerId: string
): Promise<NotebookServiceResult<{ id: string; status: string }>> {
  const notebook = await verifyOwnership(notebookId, developerId);

  if (notebook.status === 'draft') {
    // Delete the file if it exists
    if (notebook.notebookFileUrl) {
      await notebookStorage.deleteNotebook(notebookId);
    }
    
    // Hard delete draft notebooks
    await notebookRepository.delete(notebookId);
    
    logger.info({ notebookId, developerId }, 'Draft notebook deleted');

    return {
      data: { id: notebookId, status: 'deleted' },
      message: 'Notebook deleted successfully',
    };
  }

  // Archive published notebooks (keep file for historical runs)
  const archived = await notebookRepository.updateStatus(notebookId, 'archived');

  logger.info({ notebookId, developerId }, 'Notebook archived');

  return {
    data: { id: archived.id, status: archived.status },
    message: 'Notebook archived successfully',
  };
}

// ============================================
// File Operations
// ============================================

/**
 * Upload notebook file (.ipynb)
 * Replaces existing file if one exists
 */
export async function uploadNotebookFile(
  notebookId: string,
  developerId: string,
  fileContent: Buffer,
  filename: string
): Promise<NotebookServiceResult<Notebook>> {
  // Verify ownership
  const notebook = await verifyOwnership(notebookId, developerId);

  // Can only upload to draft notebooks
  if (notebook.status === 'published') {
    throw new AppError(
      ERROR_CODES.NOTEBOOK_INVALID_STATUS,
      'Cannot modify notebook file while published. Unpublish first to make changes.',
      400
    );
  }

  // Validate file extension
  if (!filename.endsWith('.ipynb')) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid file type. Only .ipynb files are allowed.',
      400
    );
  }

  // Validate file size
  const maxSize = notebookStorage.getMaxFileSize();
  if (fileContent.length > maxSize) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      `File too large. Maximum size is ${maxSize / 1024 / 1024}MB.`,
      400
    );
  }

  // Validate notebook content structure
  const validation = notebookStorage.validateNotebookContent(fileContent);
  if (!validation.valid) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid notebook file',
      400,
      { errors: validation.errors }
    );
  }

  // Delete existing file if present
  if (notebook.notebookFileUrl) {
    await notebookStorage.deleteNotebook(notebookId);
  }

  // Save the new file
  const fileUrl = await notebookStorage.saveNotebook(notebookId, fileContent);

  // Update notebook record with file URL
  const updated = await notebookRepository.update(notebookId, {
    notebookFileUrl: fileUrl,
  });

  logger.info({ notebookId, developerId, filename }, 'Notebook file uploaded');

  return {
    data: updated,
    message: 'Notebook file uploaded successfully',
  };
}

/**
 * Download notebook file
 */
export async function downloadNotebookFile(
  notebookId: string,
  developerId: string
): Promise<{ content: Buffer; filename: string }> {
  const notebook = await verifyOwnership(notebookId, developerId);

  if (!notebook.notebookFileUrl) {
    throw new AppError(
      ERROR_CODES.NOTEBOOK_NOT_FOUND,
      'No notebook file has been uploaded yet',
      404
    );
  }

  const content = await notebookStorage.readNotebook(notebookId);
  const filename = `${notebook.title.replace(/[^a-zA-Z0-9-_]/g, '_')}.ipynb`;

  return { content, filename };
}

/**
 * Delete notebook file (keeps metadata)
 */
export async function deleteNotebookFile(
  notebookId: string,
  developerId: string
): Promise<NotebookServiceResult<Notebook>> {
  const notebook = await verifyOwnership(notebookId, developerId);

  // Can only delete file from draft notebooks
  if (notebook.status === 'published') {
    throw new AppError(
      ERROR_CODES.NOTEBOOK_INVALID_STATUS,
      'Cannot delete notebook file while published. Unpublish first.',
      400
    );
  }

  if (!notebook.notebookFileUrl) {
    throw new AppError(
      ERROR_CODES.NOTEBOOK_NOT_FOUND,
      'No notebook file to delete',
      404
    );
  }

  // Delete the file
  await notebookStorage.deleteNotebook(notebookId);

  // Update notebook record
  const updated = await notebookRepository.update(notebookId, {
    notebookFileUrl: null,
  });

  logger.info({ notebookId, developerId }, 'Notebook file deleted');

  return {
    data: updated,
    message: 'Notebook file deleted successfully',
  };
}

// ============================================
// Publishing Operations
// ============================================

/**
 * Publish notebook to marketplace
 * Requires all metadata AND a notebook file
 */
export async function publishNotebook(
  notebookId: string,
  developerId: string
): Promise<NotebookServiceResult<Notebook>> {
  const notebook = await verifyOwnership(notebookId, developerId);

  // Can only publish draft notebooks
  if (notebook.status !== 'draft') {
    throw new AppError(
      ERROR_CODES.NOTEBOOK_INVALID_STATUS,
      `Cannot publish notebook with status '${notebook.status}'. Only draft notebooks can be published.`,
      400
    );
  }

  // Validate all required fields are present (including file)
  validateReadyForPublish(notebook);

  // Update status to published
  const published = await notebookRepository.updateStatus(notebookId, 'published');

  logger.info({ notebookId, developerId }, 'Notebook published successfully');

  return {
    data: published,
    message: 'Notebook published successfully',
  };
}

/**
 * Unpublish notebook (remove from marketplace)
 */
export async function unpublishNotebook(
  notebookId: string,
  developerId: string
): Promise<NotebookServiceResult<Notebook>> {
  const notebook = await verifyOwnership(notebookId, developerId);

  // Can only unpublish published notebooks
  if (notebook.status !== 'published') {
    throw new AppError(
      ERROR_CODES.NOTEBOOK_INVALID_STATUS,
      `Cannot unpublish notebook with status '${notebook.status}'. Only published notebooks can be unpublished.`,
      400
    );
  }

  // Update status back to draft
  const unpublished = await notebookRepository.updateStatus(notebookId, 'draft');

  logger.info({ notebookId, developerId }, 'Notebook unpublished');

  return {
    data: unpublished,
    message: 'Notebook unpublished successfully',
  };
}
