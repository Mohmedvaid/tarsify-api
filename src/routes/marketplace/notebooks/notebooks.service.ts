/**
 * Marketplace Notebooks Service
 * Business logic for browsing published notebooks
 */
import { prisma } from '@/lib/prisma';
import type { Notebook, Developer } from '@prisma/client';
import { getComputeTierDisplay, getCategoryDisplay } from '@/config/consumer';
import { PAGINATION } from '@/config/constants';
import { AppError } from '@/core/errors';
import { ERROR_CODES } from '@/core/errors/errorCodes';
import { HTTP_STATUS } from '@/config/constants';
import type {
  ListNotebooksQuery,
  NotebookCardResponse,
  NotebookDetailResponse,
  SearchNotebooksQuery,
  SearchResultResponse,
} from './notebooks.schemas';

type NotebookWithDeveloper = Notebook & {
  developer: Pick<Developer, 'id' | 'name' | 'avatarUrl'>;
};

/**
 * Transform notebook to card response with consumer-friendly labels
 */
function toNotebookCardResponse(notebook: NotebookWithDeveloper): NotebookCardResponse {
  return {
    id: notebook.id,
    title: notebook.title,
    shortDescription: notebook.shortDescription,
    thumbnailUrl: notebook.thumbnailUrl,
    category: notebook.category,
    categoryDisplay: getCategoryDisplay(notebook.category),
    priceCredits: notebook.priceCredits,
    computeTier: notebook.gpuType,
    computeTierDisplay: getComputeTierDisplay(notebook.gpuType),
    totalRuns: notebook.totalRuns,
    averageRating: notebook.averageRating ? Number(notebook.averageRating) : null,
    developer: {
      id: notebook.developer.id,
      name: notebook.developer.name,
      avatarUrl: notebook.developer.avatarUrl,
    },
  };
}

/**
 * Transform notebook to detail response
 */
function toNotebookDetailResponse(notebook: NotebookWithDeveloper): NotebookDetailResponse {
  return {
    ...toNotebookCardResponse(notebook),
    description: notebook.description,
    createdAt: notebook.createdAt.toISOString(),
  };
}

/**
 * Marketplace Notebooks Service
 */
export const marketplaceNotebooksService = {
  /**
   * List published notebooks for marketplace
   */
  async listNotebooks(query: ListNotebooksQuery): Promise<{
    data: NotebookCardResponse[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      category,
      search,
      sort = 'popular',
      minPrice,
      maxPrice,
    } = query;

    // Build where clause - only published notebooks
    const where: Record<string, unknown> = {
      status: 'published',
    };

    // Category filter
    if (category) {
      where.category = category;
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.priceCredits = {};
      if (minPrice !== undefined) {
        (where.priceCredits as Record<string, number>).gte = minPrice;
      }
      if (maxPrice !== undefined) {
        (where.priceCredits as Record<string, number>).lte = maxPrice;
      }
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build order by
    let orderBy: Record<string, string>[] = [];
    switch (sort) {
      case 'popular':
        orderBy = [{ totalRuns: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'newest':
        orderBy = [{ createdAt: 'desc' }];
        break;
      case 'price_low':
        orderBy = [{ priceCredits: 'asc' }, { createdAt: 'desc' }];
        break;
      case 'price_high':
        orderBy = [{ priceCredits: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'rating':
        orderBy = [{ averageRating: 'desc' }, { totalRuns: 'desc' }];
        break;
      default:
        orderBy = [{ totalRuns: 'desc' }];
    }

    // Get total count
    const total = await prisma.notebook.count({ where });

    // Get notebooks with developer info
    const notebooks = await prisma.notebook.findMany({
      where,
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: notebooks.map(toNotebookCardResponse),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get notebook details by ID
   */
  async getNotebook(notebookId: string): Promise<{ data: NotebookDetailResponse }> {
    const notebook = await prisma.notebook.findUnique({
      where: { id: notebookId },
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!notebook) {
      throw new AppError(
        ERROR_CODES.NOTEBOOK_NOT_FOUND,
        'Notebook not found',
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Only return published notebooks to consumers
    if (notebook.status !== 'published') {
      throw new AppError(
        ERROR_CODES.NOTEBOOK_NOT_FOUND,
        'Notebook not found',
        HTTP_STATUS.NOT_FOUND
      );
    }

    return { data: toNotebookDetailResponse(notebook) };
  },

  /**
   * Get featured notebooks (top rated + most popular)
   */
  async getFeaturedNotebooks(): Promise<{ data: NotebookCardResponse[] }> {
    const notebooks = await prisma.notebook.findMany({
      where: { status: 'published' },
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [{ totalRuns: 'desc' }, { averageRating: 'desc' }],
      take: 10,
    });

    return { data: notebooks.map(toNotebookCardResponse) };
  },

  /**
   * Get notebooks by category
   */
  async getNotebooksByCategory(category: string): Promise<{ data: NotebookCardResponse[] }> {
    const notebooks = await prisma.notebook.findMany({
      where: {
        status: 'published',
        category: category as 'image' | 'text' | 'video' | 'audio' | 'other',
      },
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [{ totalRuns: 'desc' }],
      take: 20,
    });

    return { data: notebooks.map(toNotebookCardResponse) };
  },

  /**
   * Get available categories with counts
   */
  async getCategories(): Promise<{ data: Array<{ key: string; displayName: string; count: number }> }> {
    const counts = await prisma.notebook.groupBy({
      by: ['category'],
      where: { status: 'published' },
      _count: { id: true },
    });

    const categories = counts.map(c => ({
      key: c.category,
      displayName: getCategoryDisplay(c.category),
      count: c._count.id,
    }));

    return { data: categories };
  },

  /**
   * Search notebooks (MOCK - returns same results for any query)
   * In production, this would use a proper search engine like Elasticsearch
   */
  async searchNotebooks(query: SearchNotebooksQuery): Promise<{
    data: SearchResultResponse[];
    meta: { page: number; limit: number; total: number; totalPages: number; query: string };
  }> {
    const { q, category, tier, page = 1, limit = 10 } = query;

    // Map tier to GPU type for filtering
    const tierToGpuMap: Record<string, string> = {
      standard: 'T4',
      fast: 'L4',
      premium: 'A100',
      ultra: 'H100',
    };

    // Build where clause - only published notebooks
    const where: Record<string, unknown> = {
      status: 'published',
    };

    // Category filter
    if (category) {
      where.category = category;
    }

    // Tier (GPU) filter
    if (tier) {
      where.gpuType = tierToGpuMap[tier];
    }

    // MOCK: For now, we just do a simple contains search
    // In production, use Elasticsearch/Algolia/etc.
    if (q && q.trim().length > 0) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { shortDescription: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.notebook.count({ where });

    // Get notebooks with relevance sorting (mock - just by runs)
    const notebooks = await prisma.notebook.findMany({
      where,
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [{ totalRuns: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform to search results with mock relevance
    const results: SearchResultResponse[] = notebooks.map((notebook, index) => ({
      ...toNotebookCardResponse(notebook),
      relevanceScore: Math.max(0.5, 1 - index * 0.05), // Mock descending relevance
      matchedFields: ['title', 'description'], // Mock matched fields
    }));

    return {
      data: results,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        query: q,
      },
    };
  },
};
