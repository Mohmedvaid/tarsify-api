/**
 * Base Model Service Tests
 * Unit tests for admin base model management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModelCategory, OutputType } from '@prisma/client';

// Mock prisma before importing service
vi.mock('@/lib/prisma', () => ({
  prisma: {
    runpodEndpoint: {
      findUnique: vi.fn(),
    },
    baseModel: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import {
  createBaseModel,
  listBaseModels,
  getBaseModel,
  updateBaseModel,
  deleteBaseModel,
} from './base-model.service';
import { AppError } from '@/core/errors';

// ============================================
// Test Fixtures
// ============================================

const TEST_ENDPOINT_ID = 'endpoint-uuid-123';
const TEST_BASE_MODEL_ID = 'base-model-uuid-456';

const mockEndpoint = {
  id: TEST_ENDPOINT_ID,
  name: 'Test Endpoint',
  runpodEndpointId: 'runpod-001',
};

const mockBaseModel = {
  id: TEST_BASE_MODEL_ID,
  endpointId: TEST_ENDPOINT_ID,
  slug: 'sdxl-text-to-image',
  name: 'SDXL Text to Image',
  description: 'Generate images from text',
  category: ModelCategory.IMAGE,
  inputSchema: { type: 'object', properties: { prompt: { type: 'string' } } },
  outputType: OutputType.IMAGE,
  outputFormat: 'png',
  estimatedSeconds: 15,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  endpoint: mockEndpoint,
};

// ============================================
// Tests
// ============================================

describe('Base Model Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // createBaseModel
  // ============================================
  describe('createBaseModel', () => {
    const validInput = {
      endpointId: TEST_ENDPOINT_ID,
      slug: 'new-model',
      name: 'New Model',
      description: 'A new model',
      category: ModelCategory.IMAGE,
      inputSchema: { type: 'object', properties: {} },
      outputType: OutputType.IMAGE,
      outputFormat: 'png',
      estimatedSeconds: 20,
      isActive: true,
    };

    it('should create a base model successfully', async () => {
      (
        prisma.runpodEndpoint.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockEndpoint);
      (
        prisma.baseModel.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);
      (
        prisma.baseModel.create as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        id: 'new-id',
        ...validInput,
        endpoint: mockEndpoint,
      });

      const result = await createBaseModel(validInput);

      expect(result.slug).toBe(validInput.slug);
      expect(prisma.baseModel.create).toHaveBeenCalled();
    });

    it('should throw AppError if endpoint not found', async () => {
      (
        prisma.runpodEndpoint.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      await expect(createBaseModel(validInput)).rejects.toThrow(AppError);
    });

    it('should throw AppError if slug already exists', async () => {
      (
        prisma.runpodEndpoint.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockEndpoint);
      (
        prisma.baseModel.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockBaseModel);

      await expect(createBaseModel(validInput)).rejects.toThrow(AppError);
    });

    it('should create model with different categories', async () => {
      const audioInput = {
        ...validInput,
        category: ModelCategory.AUDIO,
        outputType: OutputType.AUDIO,
      };

      (
        prisma.runpodEndpoint.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockEndpoint);
      (
        prisma.baseModel.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);
      (
        prisma.baseModel.create as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...audioInput,
        id: 'new-id',
        endpoint: mockEndpoint,
      });

      const result = await createBaseModel(audioInput);

      expect(result.category).toBe(ModelCategory.AUDIO);
    });

    it('should create inactive model', async () => {
      const inactiveInput = { ...validInput, isActive: false };

      (
        prisma.runpodEndpoint.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockEndpoint);
      (
        prisma.baseModel.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);
      (
        prisma.baseModel.create as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...inactiveInput,
        id: 'new-id',
        endpoint: mockEndpoint,
      });

      const result = await createBaseModel(inactiveInput);

      expect(result.isActive).toBe(false);
    });
  });

  // ============================================
  // listBaseModels
  // ============================================
  describe('listBaseModels', () => {
    it('should list base models with pagination', async () => {
      const models = [mockBaseModel];
      (
        prisma.baseModel.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(models);
      (
        prisma.baseModel.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(1);

      const result = await listBaseModels({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by isActive', async () => {
      (
        prisma.baseModel.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (
        prisma.baseModel.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(0);

      await listBaseModels({ page: 1, limit: 20, isActive: true });

      expect(prisma.baseModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        })
      );
    });

    it('should filter by category', async () => {
      (
        prisma.baseModel.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (
        prisma.baseModel.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(0);

      await listBaseModels({
        page: 1,
        limit: 20,
        category: ModelCategory.AUDIO,
      });

      expect(prisma.baseModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: ModelCategory.AUDIO }),
        })
      );
    });

    it('should filter by endpointId', async () => {
      (
        prisma.baseModel.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (
        prisma.baseModel.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(0);

      await listBaseModels({
        page: 1,
        limit: 20,
        endpointId: TEST_ENDPOINT_ID,
      });

      expect(prisma.baseModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ endpointId: TEST_ENDPOINT_ID }),
        })
      );
    });

    it('should calculate pagination correctly', async () => {
      (
        prisma.baseModel.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (
        prisma.baseModel.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(55);

      const result = await listBaseModels({ page: 2, limit: 10 });

      expect(prisma.baseModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
      expect(result.meta.totalPages).toBe(6); // Math.ceil(55/10)
    });

    it('should return empty list when no models', async () => {
      (
        prisma.baseModel.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (
        prisma.baseModel.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(0);

      const result = await listBaseModels({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(0);
    });
  });

  // ============================================
  // getBaseModel
  // ============================================
  describe('getBaseModel', () => {
    it('should return base model by ID', async () => {
      (
        prisma.baseModel.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockBaseModel);

      const result = await getBaseModel(TEST_BASE_MODEL_ID);

      expect(result.id).toBe(TEST_BASE_MODEL_ID);
      expect(result.endpoint).toBeDefined();
    });

    it('should throw AppError if base model not found', async () => {
      (
        prisma.baseModel.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      await expect(getBaseModel('unknown')).rejects.toThrow(AppError);
    });
  });

  // ============================================
  // updateBaseModel
  // ============================================
  describe('updateBaseModel', () => {
    it('should update base model successfully', async () => {
      (
        prisma.baseModel.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockBaseModel);
      (
        prisma.baseModel.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockBaseModel,
        name: 'Updated Name',
      });

      const result = await updateBaseModel(TEST_BASE_MODEL_ID, {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('should update multiple fields', async () => {
      (
        prisma.baseModel.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockBaseModel);
      (
        prisma.baseModel.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockBaseModel,
        name: 'Updated',
        description: 'New desc',
        estimatedSeconds: 30,
      });

      await updateBaseModel(TEST_BASE_MODEL_ID, {
        name: 'Updated',
        description: 'New desc',
        estimatedSeconds: 30,
      });

      expect(prisma.baseModel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            name: 'Updated',
            description: 'New desc',
            estimatedSeconds: 30,
          },
        })
      );
    });

    it('should throw AppError if base model not found', async () => {
      (
        prisma.baseModel.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      await expect(
        updateBaseModel('unknown', { name: 'Test' })
      ).rejects.toThrow(AppError);
    });

    it('should update inputSchema', async () => {
      const newSchema = {
        type: 'object',
        properties: { text: { type: 'string' } },
      };

      (
        prisma.baseModel.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockBaseModel);
      (
        prisma.baseModel.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockBaseModel,
        inputSchema: newSchema,
      });

      await updateBaseModel(TEST_BASE_MODEL_ID, { inputSchema: newSchema });

      expect(prisma.baseModel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { inputSchema: newSchema },
        })
      );
    });

    it('should deactivate model', async () => {
      (
        prisma.baseModel.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockBaseModel);
      (
        prisma.baseModel.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockBaseModel,
        isActive: false,
      });

      const result = await updateBaseModel(TEST_BASE_MODEL_ID, {
        isActive: false,
      });

      expect(result.isActive).toBe(false);
    });
  });

  // ============================================
  // deleteBaseModel
  // ============================================
  describe('deleteBaseModel', () => {
    it('should soft delete base model', async () => {
      (
        prisma.baseModel.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockBaseModel);
      (
        prisma.baseModel.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockBaseModel,
        isActive: false,
      });

      const result = await deleteBaseModel(TEST_BASE_MODEL_ID);

      expect(result.isActive).toBe(false);
      expect(prisma.baseModel.update).toHaveBeenCalledWith({
        where: { id: TEST_BASE_MODEL_ID },
        data: { isActive: false },
        include: expect.any(Object),
      });
    });

    it('should throw AppError if base model not found', async () => {
      (
        prisma.baseModel.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      await expect(deleteBaseModel('unknown')).rejects.toThrow(AppError);
    });
  });
});
