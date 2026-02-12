/**
 * Tars Model Service Tests
 * Unit tests for developer tars model management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TarsModelStatus } from '@prisma/client';

// Mock prisma before importing service
vi.mock('@/lib/prisma', () => ({
  prisma: {
    baseModel: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    tarsModel: {
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

import { prisma } from '@/lib/prisma';
import {
  createTarsModel,
  listTarsModels,
  getTarsModel,
  updateTarsModel,
  deleteTarsModel,
  publishTarsModel,
  listAvailableBaseModels,
} from './tars-model.service';
import { NotFoundError, ConflictError, AppError } from '@/core/errors';

// ============================================
// Test Fixtures
// ============================================

const TEST_DEVELOPER_ID = 'dev-uuid-123';
const TEST_BASE_MODEL_ID = 'base-model-uuid-456';
const TEST_TARS_MODEL_ID = 'tars-model-uuid-789';

const mockBaseModel = {
  id: TEST_BASE_MODEL_ID,
  slug: 'sdxl-text-to-image',
  name: 'SDXL Text to Image',
  category: 'IMAGE',
  outputType: 'IMAGE',
  isActive: true,
};

const mockTarsModel = {
  id: TEST_TARS_MODEL_ID,
  developerId: TEST_DEVELOPER_ID,
  baseModelId: TEST_BASE_MODEL_ID,
  title: 'Anime Art Generator',
  slug: 'anime-art-generator',
  description: 'Generate anime art',
  status: TarsModelStatus.DRAFT,
  configOverrides: { style: 'anime' },
  createdAt: new Date(),
  updatedAt: new Date(),
  publishedAt: null,
  baseModel: mockBaseModel,
};

// ============================================
// Tests
// ============================================

describe('TarsModel Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // createTarsModel
  // ============================================
  describe('createTarsModel', () => {
    const validInput = {
      baseModelId: TEST_BASE_MODEL_ID,
      title: 'My New Model',
      slug: 'my-new-model',
      description: 'A description',
    };

    it('should create a tars model successfully', async () => {
      (
        prisma.baseModel.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockBaseModel);
      (
        prisma.tarsModel.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);
      (
        prisma.tarsModel.create as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockTarsModel,
        title: validInput.title,
        slug: validInput.slug,
      });

      const result = await createTarsModel(TEST_DEVELOPER_ID, validInput);

      expect(result.slug).toBe(validInput.slug);
      expect(prisma.tarsModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            developerId: TEST_DEVELOPER_ID,
            title: validInput.title,
            slug: validInput.slug,
          }),
        })
      );
    });

    it('should throw NotFoundError if base model does not exist', async () => {
      (
        prisma.baseModel.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      await expect(
        createTarsModel(TEST_DEVELOPER_ID, validInput)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AppError if base model is not active', async () => {
      (
        prisma.baseModel.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockBaseModel,
        isActive: false,
      });

      await expect(
        createTarsModel(TEST_DEVELOPER_ID, validInput)
      ).rejects.toThrow(AppError);
    });

    it('should throw ConflictError if slug already exists', async () => {
      (
        prisma.baseModel.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockBaseModel);
      (
        prisma.tarsModel.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({ id: 'existing' });

      await expect(
        createTarsModel(TEST_DEVELOPER_ID, validInput)
      ).rejects.toThrow(ConflictError);
    });

    it('should create with configOverrides', async () => {
      const inputWithConfig = {
        ...validInput,
        configOverrides: { defaultInputs: { style: 'anime' } },
      };

      (
        prisma.baseModel.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockBaseModel);
      (
        prisma.tarsModel.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);
      (
        prisma.tarsModel.create as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockTarsModel,
        configOverrides: inputWithConfig.configOverrides,
      });

      await createTarsModel(TEST_DEVELOPER_ID, inputWithConfig);

      expect(prisma.tarsModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            configOverrides: inputWithConfig.configOverrides,
          }),
        })
      );
    });

    it('should create without optional description', async () => {
      const inputWithoutDesc = {
        baseModelId: TEST_BASE_MODEL_ID,
        title: 'My Model',
        slug: 'my-model',
      };

      (
        prisma.baseModel.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockBaseModel);
      (
        prisma.tarsModel.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);
      (
        prisma.tarsModel.create as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockTarsModel);

      await createTarsModel(TEST_DEVELOPER_ID, inputWithoutDesc);

      expect(prisma.tarsModel.create).toHaveBeenCalled();
    });
  });

  // ============================================
  // listTarsModels
  // ============================================
  describe('listTarsModels', () => {
    it('should list tars models with pagination', async () => {
      const models = [mockTarsModel];
      (
        prisma.tarsModel.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(models);
      (
        prisma.tarsModel.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(1);

      const result = await listTarsModels(TEST_DEVELOPER_ID, {
        page: 1,
        limit: 20,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pages).toBe(1);
    });

    it('should filter by status', async () => {
      (
        prisma.tarsModel.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (
        prisma.tarsModel.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(0);

      await listTarsModels(TEST_DEVELOPER_ID, {
        page: 1,
        limit: 20,
        status: TarsModelStatus.PUBLISHED,
      });

      expect(prisma.tarsModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: TarsModelStatus.PUBLISHED,
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
      ).mockResolvedValueOnce(50);

      const result = await listTarsModels(TEST_DEVELOPER_ID, {
        page: 2,
        limit: 10,
      });

      expect(prisma.tarsModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page - 1) * limit
          take: 10,
        })
      );
      expect(result.pages).toBe(5); // 50 / 10
    });

    it('should return empty list when no models', async () => {
      (
        prisma.tarsModel.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (
        prisma.tarsModel.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(0);

      const result = await listTarsModels(TEST_DEVELOPER_ID, {
        page: 1,
        limit: 20,
      });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  // ============================================
  // getTarsModel
  // ============================================
  describe('getTarsModel', () => {
    it('should return tars model for owner', async () => {
      (
        prisma.tarsModel.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockTarsModel);

      const result = await getTarsModel(TEST_DEVELOPER_ID, TEST_TARS_MODEL_ID);

      expect(result.id).toBe(TEST_TARS_MODEL_ID);
      expect(prisma.tarsModel.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: TEST_TARS_MODEL_ID,
            developerId: TEST_DEVELOPER_ID,
          },
        })
      );
    });

    it('should throw NotFoundError if model not found', async () => {
      (
        prisma.tarsModel.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      await expect(getTarsModel(TEST_DEVELOPER_ID, 'unknown')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw NotFoundError if wrong developer', async () => {
      (
        prisma.tarsModel.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      await expect(
        getTarsModel('wrong-dev', TEST_TARS_MODEL_ID)
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ============================================
  // updateTarsModel
  // ============================================
  describe('updateTarsModel', () => {
    const updateInput = {
      title: 'Updated Title',
      description: 'Updated description',
    };

    it('should update tars model successfully', async () => {
      (
        prisma.tarsModel.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        id: TEST_TARS_MODEL_ID,
        status: TarsModelStatus.DRAFT,
      });
      (
        prisma.tarsModel.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockTarsModel,
        ...updateInput,
      });

      const result = await updateTarsModel(
        TEST_DEVELOPER_ID,
        TEST_TARS_MODEL_ID,
        updateInput
      );

      expect(result.title).toBe(updateInput.title);
    });

    it('should throw NotFoundError if model not found', async () => {
      (
        prisma.tarsModel.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      await expect(
        updateTarsModel(TEST_DEVELOPER_ID, 'unknown', updateInput)
      ).rejects.toThrow(NotFoundError);
    });

    it('should check slug uniqueness when updating slug', async () => {
      (prisma.tarsModel.findFirst as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          id: TEST_TARS_MODEL_ID,
          status: TarsModelStatus.DRAFT,
        })
        .mockResolvedValueOnce({ id: 'other-model' }); // Another model has this slug

      await expect(
        updateTarsModel(TEST_DEVELOPER_ID, TEST_TARS_MODEL_ID, {
          slug: 'existing-slug',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should allow same slug if updating same model', async () => {
      (prisma.tarsModel.findFirst as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          id: TEST_TARS_MODEL_ID,
          status: TarsModelStatus.DRAFT,
        })
        .mockResolvedValueOnce(null); // No conflict
      (
        prisma.tarsModel.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockTarsModel);

      await updateTarsModel(TEST_DEVELOPER_ID, TEST_TARS_MODEL_ID, {
        slug: 'new-slug',
      });

      expect(prisma.tarsModel.update).toHaveBeenCalled();
    });

    it('should update configOverrides to null', async () => {
      (
        prisma.tarsModel.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        id: TEST_TARS_MODEL_ID,
        status: TarsModelStatus.DRAFT,
      });
      (
        prisma.tarsModel.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockTarsModel);

      await updateTarsModel(TEST_DEVELOPER_ID, TEST_TARS_MODEL_ID, {
        configOverrides: null,
      });

      expect(prisma.tarsModel.update).toHaveBeenCalled();
    });
  });

  // ============================================
  // deleteTarsModel
  // ============================================
  describe('deleteTarsModel', () => {
    it('should delete draft tars model', async () => {
      (
        prisma.tarsModel.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        id: TEST_TARS_MODEL_ID,
        status: TarsModelStatus.DRAFT,
      });
      (
        prisma.tarsModel.delete as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({});

      await deleteTarsModel(TEST_DEVELOPER_ID, TEST_TARS_MODEL_ID);

      expect(prisma.tarsModel.delete).toHaveBeenCalledWith({
        where: { id: TEST_TARS_MODEL_ID },
      });
    });

    it('should delete archived tars model', async () => {
      (
        prisma.tarsModel.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        id: TEST_TARS_MODEL_ID,
        status: TarsModelStatus.ARCHIVED,
      });
      (
        prisma.tarsModel.delete as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({});

      await deleteTarsModel(TEST_DEVELOPER_ID, TEST_TARS_MODEL_ID);

      expect(prisma.tarsModel.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundError if model not found', async () => {
      (
        prisma.tarsModel.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      await expect(
        deleteTarsModel(TEST_DEVELOPER_ID, 'unknown')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AppError if model is published', async () => {
      (
        prisma.tarsModel.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        id: TEST_TARS_MODEL_ID,
        status: TarsModelStatus.PUBLISHED,
      });

      await expect(
        deleteTarsModel(TEST_DEVELOPER_ID, TEST_TARS_MODEL_ID)
      ).rejects.toThrow(AppError);
    });
  });

  // ============================================
  // publishTarsModel
  // ============================================
  describe('publishTarsModel', () => {
    describe('publish action', () => {
      it('should publish a draft model', async () => {
        (
          prisma.tarsModel.findFirst as ReturnType<typeof vi.fn>
        ).mockResolvedValueOnce({
          id: TEST_TARS_MODEL_ID,
          status: TarsModelStatus.DRAFT,
        });
        (
          prisma.tarsModel.update as ReturnType<typeof vi.fn>
        ).mockResolvedValueOnce({
          ...mockTarsModel,
          status: TarsModelStatus.PUBLISHED,
          publishedAt: new Date(),
        });

        const result = await publishTarsModel(
          TEST_DEVELOPER_ID,
          TEST_TARS_MODEL_ID,
          'publish'
        );

        expect(result.status).toBe(TarsModelStatus.PUBLISHED);
        expect(prisma.tarsModel.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              status: TarsModelStatus.PUBLISHED,
              publishedAt: expect.any(Date),
            }),
          })
        );
      });

      it('should publish an archived model', async () => {
        (
          prisma.tarsModel.findFirst as ReturnType<typeof vi.fn>
        ).mockResolvedValueOnce({
          id: TEST_TARS_MODEL_ID,
          status: TarsModelStatus.ARCHIVED,
        });
        (
          prisma.tarsModel.update as ReturnType<typeof vi.fn>
        ).mockResolvedValueOnce({
          ...mockTarsModel,
          status: TarsModelStatus.PUBLISHED,
        });

        const result = await publishTarsModel(
          TEST_DEVELOPER_ID,
          TEST_TARS_MODEL_ID,
          'publish'
        );

        expect(result.status).toBe(TarsModelStatus.PUBLISHED);
      });

      it('should throw AppError if already published', async () => {
        (
          prisma.tarsModel.findFirst as ReturnType<typeof vi.fn>
        ).mockResolvedValueOnce({
          id: TEST_TARS_MODEL_ID,
          status: TarsModelStatus.PUBLISHED,
        });

        await expect(
          publishTarsModel(TEST_DEVELOPER_ID, TEST_TARS_MODEL_ID, 'publish')
        ).rejects.toThrow(AppError);
      });
    });

    describe('archive action', () => {
      it('should archive a published model', async () => {
        (
          prisma.tarsModel.findFirst as ReturnType<typeof vi.fn>
        ).mockResolvedValueOnce({
          id: TEST_TARS_MODEL_ID,
          status: TarsModelStatus.PUBLISHED,
        });
        (
          prisma.tarsModel.update as ReturnType<typeof vi.fn>
        ).mockResolvedValueOnce({
          ...mockTarsModel,
          status: TarsModelStatus.ARCHIVED,
        });

        const result = await publishTarsModel(
          TEST_DEVELOPER_ID,
          TEST_TARS_MODEL_ID,
          'archive'
        );

        expect(result.status).toBe(TarsModelStatus.ARCHIVED);
      });

      it('should archive a draft model', async () => {
        (
          prisma.tarsModel.findFirst as ReturnType<typeof vi.fn>
        ).mockResolvedValueOnce({
          id: TEST_TARS_MODEL_ID,
          status: TarsModelStatus.DRAFT,
        });
        (
          prisma.tarsModel.update as ReturnType<typeof vi.fn>
        ).mockResolvedValueOnce({
          ...mockTarsModel,
          status: TarsModelStatus.ARCHIVED,
        });

        const result = await publishTarsModel(
          TEST_DEVELOPER_ID,
          TEST_TARS_MODEL_ID,
          'archive'
        );

        expect(result.status).toBe(TarsModelStatus.ARCHIVED);
      });

      it('should throw AppError if already archived', async () => {
        (
          prisma.tarsModel.findFirst as ReturnType<typeof vi.fn>
        ).mockResolvedValueOnce({
          id: TEST_TARS_MODEL_ID,
          status: TarsModelStatus.ARCHIVED,
        });

        await expect(
          publishTarsModel(TEST_DEVELOPER_ID, TEST_TARS_MODEL_ID, 'archive')
        ).rejects.toThrow(AppError);
      });
    });

    it('should throw NotFoundError if model not found', async () => {
      (
        prisma.tarsModel.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      await expect(
        publishTarsModel(TEST_DEVELOPER_ID, 'unknown', 'publish')
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ============================================
  // listAvailableBaseModels
  // ============================================
  describe('listAvailableBaseModels', () => {
    it('should list active base models', async () => {
      const baseModels = [mockBaseModel];
      (
        prisma.baseModel.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(baseModels);

      const result = await listAvailableBaseModels();

      expect(result).toHaveLength(1);
      expect(prisma.baseModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        })
      );
    });

    it('should order by name ascending', async () => {
      (
        prisma.baseModel.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);

      await listAvailableBaseModels();

      expect(prisma.baseModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
    });

    it('should return empty array when no base models', async () => {
      (
        prisma.baseModel.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);

      const result = await listAvailableBaseModels();

      expect(result).toHaveLength(0);
    });
  });
});
