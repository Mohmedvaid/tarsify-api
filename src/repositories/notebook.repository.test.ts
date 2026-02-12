/**
 * Notebook Repository Tests
 * Unit tests for notebook database operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    notebook: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

import { notebookRepository } from './notebook.repository';
import { prisma } from '@/lib/prisma';
import type { Notebook } from '@prisma/client';

// ============================================
// Test Fixtures
// ============================================

const mockNotebook: Notebook = {
  id: 'notebook-uuid-1',
  developerId: 'dev-uuid-1',
  title: 'Test Notebook',
  description: 'Test description',
  shortDescription: 'Short desc',
  category: 'AI',
  gpuType: 'H100',
  priceCredits: 100,
  status: 'draft',
  filePath: 'uploads/notebook.ipynb',
  slug: 'test-notebook',
  totalRuns: 0,
  totalRevenue: 0,
  averageRating: null,
  reviewCount: 0,
  imageUrl: null,
  tags: [],
  createdAt: new Date('2026-01-20'),
  updatedAt: new Date('2026-01-20'),
};

// ============================================
// Tests
// ============================================

describe('Notebook Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // findById
  // ============================================
  describe('findById', () => {
    it('should find notebook by ID', async () => {
      (
        prisma.notebook.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockNotebook);

      const result = await notebookRepository.findById('notebook-uuid-1');

      expect(result).toEqual(mockNotebook);
      expect(prisma.notebook.findUnique).toHaveBeenCalledWith({
        where: { id: 'notebook-uuid-1' },
      });
    });

    it('should return null when not found', async () => {
      (
        prisma.notebook.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      const result = await notebookRepository.findById('unknown-id');

      expect(result).toBeNull();
    });

    it('should throw error on database failure', async () => {
      (
        prisma.notebook.findUnique as ReturnType<typeof vi.fn>
      ).mockRejectedValueOnce(new Error('DB Error'));

      await expect(
        notebookRepository.findById('notebook-uuid-1')
      ).rejects.toThrow('DB Error');
    });
  });

  // ============================================
  // findByIdAndDeveloper
  // ============================================
  describe('findByIdAndDeveloper', () => {
    it('should find notebook by ID and developer', async () => {
      (
        prisma.notebook.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockNotebook);

      const result = await notebookRepository.findByIdAndDeveloper(
        'notebook-uuid-1',
        'dev-uuid-1'
      );

      expect(result).toEqual(mockNotebook);
      expect(prisma.notebook.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'notebook-uuid-1',
          developerId: 'dev-uuid-1',
        },
      });
    });

    it('should return null if notebook belongs to different developer', async () => {
      (
        prisma.notebook.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      const result = await notebookRepository.findByIdAndDeveloper(
        'notebook-uuid-1',
        'different-dev-id'
      );

      expect(result).toBeNull();
    });
  });

  // ============================================
  // findMany
  // ============================================
  describe('findMany', () => {
    it('should list notebooks with pagination', async () => {
      const notebooks = [mockNotebook];
      (
        prisma.notebook.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(notebooks);
      (prisma.notebook.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        1
      );

      const result = await notebookRepository.findMany(
        { developerId: 'dev-uuid-1' },
        { page: 1, limit: 10, sort: '-createdAt' }
      );

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should filter by status', async () => {
      (
        prisma.notebook.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (prisma.notebook.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        0
      );

      await notebookRepository.findMany(
        { developerId: 'dev-uuid-1', status: 'published' },
        { page: 1, limit: 10, sort: '-createdAt' }
      );

      expect(prisma.notebook.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            developerId: 'dev-uuid-1',
            status: 'published',
          }),
        })
      );
    });

    it('should skip status filter when set to "all"', async () => {
      (
        prisma.notebook.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (prisma.notebook.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        0
      );

      await notebookRepository.findMany(
        { developerId: 'dev-uuid-1', status: 'all' },
        { page: 1, limit: 10, sort: '-createdAt' }
      );

      expect(prisma.notebook.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            status: 'all',
          }),
        })
      );
    });

    it('should support search', async () => {
      (
        prisma.notebook.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (prisma.notebook.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        0
      );

      await notebookRepository.findMany(
        { developerId: 'dev-uuid-1', search: 'test query' },
        { page: 1, limit: 10, sort: '-createdAt' }
      );

      expect(prisma.notebook.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'test query', mode: 'insensitive' } },
              { description: { contains: 'test query', mode: 'insensitive' } },
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

    it('should handle ascending sort', async () => {
      (
        prisma.notebook.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (prisma.notebook.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        0
      );

      await notebookRepository.findMany(
        { developerId: 'dev-uuid-1' },
        { page: 1, limit: 10, sort: 'title' }
      );

      expect(prisma.notebook.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { title: 'asc' },
        })
      );
    });

    it('should handle descending sort', async () => {
      (
        prisma.notebook.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (prisma.notebook.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        0
      );

      await notebookRepository.findMany(
        { developerId: 'dev-uuid-1' },
        { page: 1, limit: 10, sort: '-createdAt' }
      );

      expect(prisma.notebook.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should calculate totalPages correctly', async () => {
      (
        prisma.notebook.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (prisma.notebook.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        25
      );

      const result = await notebookRepository.findMany(
        { developerId: 'dev-uuid-1' },
        { page: 1, limit: 10, sort: '-createdAt' }
      );

      expect(result.meta.totalPages).toBe(3);
    });
  });

  // ============================================
  // create
  // ============================================
  describe('create', () => {
    it('should create a new notebook', async () => {
      (
        prisma.notebook.create as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockNotebook);

      const result = await notebookRepository.create({
        developerId: 'dev-uuid-1',
        title: 'Test Notebook',
        description: 'Test description',
        shortDescription: 'Short desc',
        gpuType: 'H100',
        priceCredits: 100,
      });

      expect(result).toEqual(mockNotebook);
      expect(prisma.notebook.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          developerId: 'dev-uuid-1',
          title: 'Test Notebook',
          status: 'draft',
        }),
      });
    });

    it('should create notebook with category', async () => {
      (
        prisma.notebook.create as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockNotebook);

      await notebookRepository.create({
        developerId: 'dev-uuid-1',
        title: 'Test Notebook',
        description: 'Test description',
        shortDescription: 'Short desc',
        category: 'AI',
        gpuType: 'H100',
        priceCredits: 100,
      });

      expect(prisma.notebook.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          category: 'AI',
        }),
      });
    });
  });

  // ============================================
  // update
  // ============================================
  describe('update', () => {
    it('should update notebook', async () => {
      const updatedNotebook = { ...mockNotebook, title: 'Updated Title' };
      (
        prisma.notebook.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(updatedNotebook);

      const result = await notebookRepository.update('notebook-uuid-1', {
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
      expect(prisma.notebook.update).toHaveBeenCalledWith({
        where: { id: 'notebook-uuid-1' },
        data: { title: 'Updated Title' },
      });
    });
  });

  // ============================================
  // delete
  // ============================================
  describe('delete', () => {
    it('should delete notebook', async () => {
      (
        prisma.notebook.delete as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockNotebook);

      await notebookRepository.delete('notebook-uuid-1');

      expect(prisma.notebook.delete).toHaveBeenCalledWith({
        where: { id: 'notebook-uuid-1' },
      });
    });

    it('should throw error on database failure', async () => {
      (
        prisma.notebook.delete as ReturnType<typeof vi.fn>
      ).mockRejectedValueOnce(new Error('Delete failed'));

      await expect(
        notebookRepository.delete('notebook-uuid-1')
      ).rejects.toThrow('Delete failed');
    });
  });

  // ============================================
  // updateStatus
  // ============================================
  describe('updateStatus', () => {
    it('should update notebook status', async () => {
      const publishedNotebook = { ...mockNotebook, status: 'published' };
      (
        prisma.notebook.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(publishedNotebook);

      const result = await notebookRepository.updateStatus(
        'notebook-uuid-1',
        'published'
      );

      expect(result.status).toBe('published');
      expect(prisma.notebook.update).toHaveBeenCalledWith({
        where: { id: 'notebook-uuid-1' },
        data: { status: 'published' },
      });
    });
  });

  // ============================================
  // countByDeveloper
  // ============================================
  describe('countByDeveloper', () => {
    it('should count notebooks by developer', async () => {
      (prisma.notebook.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        5
      );

      const result = await notebookRepository.countByDeveloper('dev-uuid-1');

      expect(result).toBe(5);
      expect(prisma.notebook.count).toHaveBeenCalledWith({
        where: { developerId: 'dev-uuid-1' },
      });
    });

    it('should return 0 when no notebooks', async () => {
      (prisma.notebook.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        0
      );

      const result = await notebookRepository.countByDeveloper('new-dev');

      expect(result).toBe(0);
    });
  });
});
