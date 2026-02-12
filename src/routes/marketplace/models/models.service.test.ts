/**
 * Models Service Tests
 * Unit tests for public model browsing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TarsModelStatus, ModelCategory, OutputType } from '@prisma/client';

// Mock prisma before importing service
vi.mock('@/lib/prisma', () => ({
  prisma: {
    tarsModel: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { listPublishedModels, getPublishedModelBySlug } from './models.service';
import { NotFoundError } from '@/core/errors';

// ============================================
// Test Fixtures
// ============================================

const mockPublicModel = {
  id: 'tars-model-uuid-123',
  developerId: 'dev-uuid-456',
  baseModelId: 'base-model-uuid-789',
  title: 'Anime Art Generator',
  slug: 'anime-art-generator',
  description: 'Generate anime art from text',
  status: TarsModelStatus.PUBLISHED,
  configOverrides: { style: 'anime' },
  createdAt: new Date(),
  updatedAt: new Date(),
  publishedAt: new Date(),
  developer: {
    id: 'dev-uuid-456',
    name: 'John Doe',
  },
  baseModel: {
    name: 'SDXL Text to Image',
    category: ModelCategory.IMAGE,
    outputType: OutputType.IMAGE,
    outputFormat: 'png',
    inputSchema: {
      type: 'object',
      required: ['prompt'],
      properties: { prompt: { type: 'string' } },
    },
    estimatedSeconds: 15,
  },
};

// ============================================
// Tests
// ============================================

describe('Models Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // listPublishedModels
  // ============================================
  describe('listPublishedModels', () => {
    it('should list published models with pagination', async () => {
      const models = [mockPublicModel];
      (
        prisma.tarsModel.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(models);
      (
        prisma.tarsModel.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(1);

      const result = await listPublishedModels({ page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pages).toBe(1);
    });

    it('should filter by category', async () => {
      (
        prisma.tarsModel.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (
        prisma.tarsModel.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(0);

      await listPublishedModels({
        page: 1,
        limit: 20,
        category: ModelCategory.AUDIO,
      });

      expect(prisma.tarsModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: TarsModelStatus.PUBLISHED,
            baseModel: expect.objectContaining({
              category: ModelCategory.AUDIO,
            }),
          }),
        })
      );
    });

    it('should search by title, description, or slug', async () => {
      (
        prisma.tarsModel.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (
        prisma.tarsModel.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(0);

      await listPublishedModels({ page: 1, limit: 20, search: 'anime' });

      expect(prisma.tarsModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ title: expect.any(Object) }),
              expect.objectContaining({ description: expect.any(Object) }),
              expect.objectContaining({ slug: expect.any(Object) }),
            ]),
          }),
        })
      );
    });

    it('should only include models with active base models', async () => {
      (
        prisma.tarsModel.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (
        prisma.tarsModel.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(0);

      await listPublishedModels({ page: 1, limit: 20 });

      expect(prisma.tarsModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            baseModel: expect.objectContaining({
              isActive: true,
            }),
          }),
        })
      );
    });

    it('should calculate pagination correctly', async () => {
      (
        prisma.tarsModel.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (
        prisma.tarsModel.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(75);

      const result = await listPublishedModels({ page: 4, limit: 20 });

      expect(prisma.tarsModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 60, // (page - 1) * limit
          take: 20,
        })
      );
      expect(result.pages).toBe(4); // Math.ceil(75/20)
    });

    it('should order by publishedAt descending', async () => {
      (
        prisma.tarsModel.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (
        prisma.tarsModel.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(0);

      await listPublishedModels({ page: 1, limit: 20 });

      expect(prisma.tarsModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { publishedAt: 'desc' },
        })
      );
    });

    it('should return empty list when no models', async () => {
      (
        prisma.tarsModel.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (
        prisma.tarsModel.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(0);

      const result = await listPublishedModels({ page: 1, limit: 20 });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should combine category and search filters', async () => {
      (
        prisma.tarsModel.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (
        prisma.tarsModel.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(0);

      await listPublishedModels({
        page: 1,
        limit: 20,
        category: ModelCategory.IMAGE,
        search: 'portrait',
      });

      expect(prisma.tarsModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            baseModel: expect.objectContaining({
              category: ModelCategory.IMAGE,
            }),
            OR: expect.any(Array),
          }),
        })
      );
    });
  });

  // ============================================
  // getPublishedModelBySlug
  // ============================================
  describe('getPublishedModelBySlug', () => {
    it('should return published model by slug', async () => {
      (
        prisma.tarsModel.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockPublicModel);

      const result = await getPublishedModelBySlug('anime-art-generator');

      expect(result.slug).toBe('anime-art-generator');
      expect(result.developer).toBeDefined();
      expect(result.baseModel).toBeDefined();
    });

    it('should throw NotFoundError if model not found', async () => {
      (
        prisma.tarsModel.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      await expect(getPublishedModelBySlug('unknown')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should not return draft models', async () => {
      (
        prisma.tarsModel.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      await expect(getPublishedModelBySlug('draft-model')).rejects.toThrow(
        NotFoundError
      );

      expect(prisma.tarsModel.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: TarsModelStatus.PUBLISHED,
          }),
        })
      );
    });

    it('should not return models with inactive base models', async () => {
      (
        prisma.tarsModel.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      await expect(
        getPublishedModelBySlug('model-inactive-base')
      ).rejects.toThrow(NotFoundError);

      expect(prisma.tarsModel.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            baseModel: expect.objectContaining({
              isActive: true,
            }),
          }),
        })
      );
    });

    it('should include developer and baseModel info', async () => {
      (
        prisma.tarsModel.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockPublicModel);

      const result = await getPublishedModelBySlug('anime-art-generator');

      expect(result.developer.name).toBe('John Doe');
      expect(result.baseModel.name).toBe('SDXL Text to Image');
      expect(result.baseModel.inputSchema).toBeDefined();
    });
  });
});
