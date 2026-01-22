/**
 * Notebook Repository Types
 * Type definitions for notebook database operations
 */
import type { Notebook, NotebookStatus, GpuType, NotebookCategory, Prisma } from '@prisma/client';

/**
 * Notebook list filters
 */
export interface NotebookFilters {
  developerId: string;
  status?: NotebookStatus | 'all';
  search?: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  sort: string;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Create notebook data
 */
export interface CreateNotebookData {
  developerId: string;
  title: string;
  description?: string | null;
  shortDescription?: string | null;
  category: NotebookCategory;
  gpuType: GpuType;
  priceCredits: number;
}

/**
 * Update notebook data
 */
export interface UpdateNotebookData {
  title?: string;
  description?: string | null;
  shortDescription?: string | null;
  thumbnailUrl?: string | null;
  category?: NotebookCategory;
  gpuType?: GpuType;
  priceCredits?: number;
  status?: NotebookStatus;
  notebookFileUrl?: string | null;
}

/**
 * Notebook with computed fields
 */
export interface NotebookWithStats extends Notebook {
  totalEarnings?: number;
}

/**
 * Notebook repository interface
 */
export interface INotebookRepository {
  /**
   * Find notebook by ID
   */
  findById(id: string): Promise<Notebook | null>;

  /**
   * Find notebook by ID with ownership check
   */
  findByIdAndDeveloper(id: string, developerId: string): Promise<Notebook | null>;

  /**
   * List notebooks with pagination and filtering
   */
  findMany(
    filters: NotebookFilters,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<Notebook>>;

  /**
   * Create a new notebook
   */
  create(data: CreateNotebookData): Promise<Notebook>;

  /**
   * Update a notebook
   */
  update(id: string, data: UpdateNotebookData): Promise<Notebook>;

  /**
   * Delete a notebook (hard delete - only for drafts)
   */
  delete(id: string): Promise<void>;

  /**
   * Update notebook status
   */
  updateStatus(id: string, status: NotebookStatus): Promise<Notebook>;

  /**
   * Count notebooks by developer
   */
  countByDeveloper(developerId: string): Promise<number>;
}
