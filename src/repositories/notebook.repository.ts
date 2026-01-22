/**
 * Notebook Repository
 * Database operations for notebook management
 */
import type { Notebook, NotebookStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import type {
  INotebookRepository,
  NotebookFilters,
  PaginationOptions,
  PaginatedResult,
  CreateNotebookData,
  UpdateNotebookData,
} from './notebook.types';

/**
 * Notebook repository implementation
 */
class NotebookRepositoryImpl implements INotebookRepository {
  /**
   * Find notebook by ID
   */
  async findById(id: string): Promise<Notebook | null> {
    try {
      return await prisma.notebook.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error({ error, id }, 'Failed to find notebook by ID');
      throw error;
    }
  }

  /**
   * Find notebook by ID with ownership check
   */
  async findByIdAndDeveloper(
    id: string,
    developerId: string
  ): Promise<Notebook | null> {
    try {
      return await prisma.notebook.findFirst({
        where: {
          id,
          developerId,
        },
      });
    } catch (error) {
      logger.error(
        { error, id, developerId },
        'Failed to find notebook by ID and developer'
      );
      throw error;
    }
  }

  /**
   * List notebooks with pagination and filtering
   */
  async findMany(
    filters: NotebookFilters,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<Notebook>> {
    try {
      const { developerId, status, search } = filters;
      const { page, limit, sort } = pagination;

      // Build where clause
      const where: Prisma.NotebookWhereInput = {
        developerId,
      };

      // Filter by status (unless 'all')
      if (status && status !== 'all') {
        where.status = status as NotebookStatus;
      }

      // Search in title and description
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { shortDescription: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Parse sort field and direction
      const isDesc = sort.startsWith('-');
      const sortField = isDesc ? sort.slice(1) : sort;
      const orderBy: Prisma.NotebookOrderByWithRelationInput = {
        [sortField]: isDesc ? 'desc' : 'asc',
      };

      // Execute queries in parallel
      const [notebooks, total] = await Promise.all([
        prisma.notebook.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.notebook.count({ where }),
      ]);

      return {
        data: notebooks,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error({ error, filters, pagination }, 'Failed to list notebooks');
      throw error;
    }
  }

  /**
   * Create a new notebook
   */
  async create(data: CreateNotebookData): Promise<Notebook> {
    try {
      const notebook = await prisma.notebook.create({
        data: {
          developerId: data.developerId,
          title: data.title,
          description: data.description,
          shortDescription: data.shortDescription,
          // Only include category if explicitly provided (let Prisma use default otherwise)
          ...(data.category !== undefined && { category: data.category }),
          gpuType: data.gpuType,
          priceCredits: data.priceCredits,
          status: 'draft',
        },
      });

      logger.info(
        { notebookId: notebook.id, developerId: data.developerId },
        'Notebook created'
      );

      return notebook;
    } catch (error) {
      logger.error({ error, data }, 'Failed to create notebook');
      throw error;
    }
  }

  /**
   * Update a notebook
   */
  async update(id: string, data: UpdateNotebookData): Promise<Notebook> {
    try {
      const notebook = await prisma.notebook.update({
        where: { id },
        data,
      });

      logger.info({ notebookId: id }, 'Notebook updated');

      return notebook;
    } catch (error) {
      logger.error({ error, id, data }, 'Failed to update notebook');
      throw error;
    }
  }

  /**
   * Delete a notebook (hard delete)
   */
  async delete(id: string): Promise<void> {
    try {
      await prisma.notebook.delete({
        where: { id },
      });

      logger.info({ notebookId: id }, 'Notebook deleted');
    } catch (error) {
      logger.error({ error, id }, 'Failed to delete notebook');
      throw error;
    }
  }

  /**
   * Update notebook status
   */
  async updateStatus(id: string, status: NotebookStatus): Promise<Notebook> {
    try {
      const notebook = await prisma.notebook.update({
        where: { id },
        data: { status },
      });

      logger.info({ notebookId: id, status }, 'Notebook status updated');

      return notebook;
    } catch (error) {
      logger.error({ error, id, status }, 'Failed to update notebook status');
      throw error;
    }
  }

  /**
   * Count notebooks by developer
   */
  async countByDeveloper(developerId: string): Promise<number> {
    try {
      return await prisma.notebook.count({
        where: { developerId },
      });
    } catch (error) {
      logger.error({ error, developerId }, 'Failed to count notebooks');
      throw error;
    }
  }
}

// Export singleton instance
export const notebookRepository = new NotebookRepositoryImpl();
