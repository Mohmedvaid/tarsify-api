/**
 * Marketplace Notebooks Service Tests
 * Unit tests for browsing published notebooks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    notebook: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

vi.mock('@/config/consumer', () => ({
  getComputeTierDisplay: vi.fn((tier) => `${tier} Display`),
  getCategoryDisplay: vi.fn((category) => `${category} Display`),
}));

import { marketplaceNotebooksService } from './notebooks.service';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/core/errors';

// ============================================
// Test Fixtures
// ============================================

const mockDeveloper = {
  id: 'dev-uuid-1',
  name: 'Test Developer',
  avatarUrl: 'https://example.com/avatar.png',
};

const mockNotebook = {
  id: 'notebook-uuid-1',
  developerId: 'dev-uuid-1',
  title: 'Test Notebook',
  description: 'Test description',
  shortDescription: 'Short desc',
  category: 'AI',
  gpuType: 'H100',
  priceCredits: 100,
  status: 'published',
  filePath: null,
  notebookFileUrl: 'gs://bucket/notebook.ipynb',
  thumbnailUrl: null,
  slug: 'test-notebook',
  totalRuns: 50,
  totalRevenue: 0,
  averageRating: 4.5,
  reviewCount: 10,
  imageUrl: null,
  tags: [],
  createdAt: new Date('2026-01-20'),
  updatedAt: new Date('2026-01-20'),
  developer: mockDeveloper,
};

const mockDraftNotebook = {
  ...mockNotebook,
  status: 'draft',
};

// ============================================
// Tests
// ============================================

describe('Marketplace Notebooks Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // listNotebooks
  // ============================================
  describe('listNotebooks', () => {
    it('should list published notebooks', async () => {
      (prisma.notebook.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        1
      );
      (
        prisma.notebook.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([mockNotebook]);

      const result = await marketplaceNotebooksService.listNotebooks({
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Test Notebook');
      expect(result.meta.total).toBe(1);
    });

    it('should filter by category', async () => {
      (prisma.notebook.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        1
      );
      (
        prisma.notebook.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([mockNotebook]);

      await marketplaceNotebooksService.listNotebooks({
        category: 'AI' as 'image',
      });

      expect(prisma.notebook.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'published',
            category: 'AI',
          }),
        })
      );
    });

    it('should filter by search term', async () => {
      (prisma.notebook.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        0
      );
      (
        prisma.notebook.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);

      await marketplaceNotebooksService.listNotebooks({
        search: 'test query',
      });

      expect(prisma.notebook.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'test query', mode: 'insensitive' } },
              {
                shortDescription: {
                  contains: 'test query',
                  mode: 'insensitive',
                },
              },
            ],
          }),
        })
      );
    });

    it('should filter by price range', async () => {
      (prisma.notebook.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        0
      );
      (
        prisma.notebook.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);

      await marketplaceNotebooksService.listNotebooks({
        minPrice: 10,
        maxPrice: 100,
      });

      expect(prisma.notebook.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priceCredits: { gte: 10, lte: 100 },
          }),
        })
      );
    });

    it('should sort by popular', async () => {
      (prisma.notebook.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        0
      );
      (
        prisma.notebook.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);

      await marketplaceNotebooksService.listNotebooks({
        sort: 'popular',
      });

      expect(prisma.notebook.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ totalRuns: 'desc' }, { createdAt: 'desc' }],
        })
      );
    });

    it('should sort by newest', async () => {
      (prisma.notebook.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        0
      );
      (
        prisma.notebook.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);

      await marketplaceNotebooksService.listNotebooks({
        sort: 'newest',
      });

      expect(prisma.notebook.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ createdAt: 'desc' }],
        })
      );
    });

    it('should sort by price low to high', async () => {
      (prisma.notebook.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        0
      );
      (
        prisma.notebook.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);

      await marketplaceNotebooksService.listNotebooks({
        sort: 'price_low',
      });

      expect(prisma.notebook.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ priceCredits: 'asc' }, { createdAt: 'desc' }],
        })
      );
    });

    it('should sort by price high to low', async () => {
      (prisma.notebook.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        0
      );
      (
        prisma.notebook.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);

      await marketplaceNotebooksService.listNotebooks({
        sort: 'price_high',
      });

      expect(prisma.notebook.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ priceCredits: 'desc' }, { createdAt: 'desc' }],
        })
      );
    });

    it('should sort by rating', async () => {
      (prisma.notebook.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        0
      );
      (
        prisma.notebook.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);

      await marketplaceNotebooksService.listNotebooks({
        sort: 'rating',
      });

      expect(prisma.notebook.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ averageRating: 'desc' }, { totalRuns: 'desc' }],
        })
      );
    });
  });

  // ============================================
  // getNotebook
  // ============================================
  describe('getNotebook', () => {
    it('should get notebook by ID', async () => {
      (
        prisma.notebook.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockNotebook);

      const result =
        await marketplaceNotebooksService.getNotebook('notebook-uuid-1');

      expect(result.data.id).toBe('notebook-uuid-1');
      expect(result.data.title).toBe('Test Notebook');
    });

    it('should throw error if notebook not found', async () => {
      (
        prisma.notebook.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      await expect(
        marketplaceNotebooksService.getNotebook('unknown-id')
      ).rejects.toThrow(AppError);
    });

    it('should throw error if notebook is not published', async () => {
      (
        prisma.notebook.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDraftNotebook);

      await expect(
        marketplaceNotebooksService.getNotebook('notebook-uuid-1')
      ).rejects.toThrow(AppError);
    });
  });

  // ============================================
  // getFeaturedNotebooks
  // ============================================
  describe('getFeaturedNotebooks', () => {
    it('should get featured notebooks', async () => {
      (
        prisma.notebook.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([mockNotebook]);

      const result = await marketplaceNotebooksService.getFeaturedNotebooks();

      expect(result.data).toHaveLength(1);
      expect(prisma.notebook.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'published' },
          orderBy: [{ totalRuns: 'desc' }, { averageRating: 'desc' }],
          take: 10,
        })
      );
    });
  });

  // ============================================
  // getNotebooksByCategory
  // ============================================
  describe('getNotebooksByCategory', () => {
    it('should get notebooks by category', async () => {
      (
        prisma.notebook.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([mockNotebook]);

      const result =
        await marketplaceNotebooksService.getNotebooksByCategory('image');

      expect(result.data).toHaveLength(1);
      expect(prisma.notebook.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'published',
            category: 'image',
          },
          take: 20,
        })
      );
    });
  });

  // ============================================
  // getCategories
  // ============================================
  describe('getCategories', () => {
    it('should get available categories with counts', async () => {
      (
        prisma.notebook.groupBy as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([
        { category: 'image', _count: { id: 5 } },
        { category: 'text', _count: { id: 3 } },
      ]);

      const result = await marketplaceNotebooksService.getCategories();

      expect(result.data).toHaveLength(2);
      expect(result.data[0].key).toBe('image');
      expect(result.data[0].count).toBe(5);
    });
  });
});
