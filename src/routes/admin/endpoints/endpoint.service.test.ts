/**
 * Endpoint Service Tests
 * Unit tests for admin endpoint management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EndpointSource } from '@prisma/client';

// Mock prisma before importing service
vi.mock('@/lib/prisma', () => ({
  prisma: {
    runpodEndpoint: {
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
  createEndpoint,
  listEndpoints,
  getEndpoint,
  updateEndpoint,
  deleteEndpoint,
} from './endpoint.service';
import { AppError } from '@/core/errors';

// ============================================
// Test Fixtures
// ============================================

const TEST_ENDPOINT_ID = 'endpoint-uuid-123';

const mockEndpoint = {
  id: TEST_ENDPOINT_ID,
  runpodEndpointId: 'runpod-endpoint-001',
  name: 'Test Endpoint',
  source: EndpointSource.HUB,
  dockerImage: 'runpod/test:latest',
  gpuType: 'A100',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockEndpointWithCount = {
  ...mockEndpoint,
  _count: { baseModels: 5 },
};

// ============================================
// Tests
// ============================================

describe('Endpoint Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // createEndpoint
  // ============================================
  describe('createEndpoint', () => {
    const validInput = {
      runpodEndpointId: 'new-endpoint-001',
      name: 'New Endpoint',
      source: EndpointSource.HUB,
      dockerImage: 'runpod/new:latest',
      gpuType: 'T4',
      isActive: true,
    };

    it('should create an endpoint successfully', async () => {
      (
        prisma.runpodEndpoint.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);
      (
        prisma.runpodEndpoint.create as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        id: 'new-id',
        ...validInput,
      });

      const result = await createEndpoint(validInput);

      expect(result.runpodEndpointId).toBe(validInput.runpodEndpointId);
      expect(prisma.runpodEndpoint.create).toHaveBeenCalledWith({
        data: validInput,
      });
    });

    it('should throw AppError if runpodEndpointId already exists', async () => {
      (
        prisma.runpodEndpoint.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockEndpoint);

      await expect(createEndpoint(validInput)).rejects.toThrow(AppError);
    });

    it('should create endpoint with CUSTOM source', async () => {
      const customInput = {
        ...validInput,
        source: EndpointSource.CUSTOM,
      };

      (
        prisma.runpodEndpoint.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);
      (
        prisma.runpodEndpoint.create as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        id: 'new-id',
        ...customInput,
      });

      const result = await createEndpoint(customInput);

      expect(result.source).toBe(EndpointSource.CUSTOM);
    });

    it('should create inactive endpoint', async () => {
      const inactiveInput = { ...validInput, isActive: false };

      (
        prisma.runpodEndpoint.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);
      (
        prisma.runpodEndpoint.create as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        id: 'new-id',
        ...inactiveInput,
      });

      const result = await createEndpoint(inactiveInput);

      expect(result.isActive).toBe(false);
    });
  });

  // ============================================
  // listEndpoints
  // ============================================
  describe('listEndpoints', () => {
    it('should list endpoints with pagination', async () => {
      const endpoints = [mockEndpointWithCount];
      (
        prisma.runpodEndpoint.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(endpoints);
      (
        prisma.runpodEndpoint.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(1);

      const result = await listEndpoints({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should filter by isActive', async () => {
      (
        prisma.runpodEndpoint.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (
        prisma.runpodEndpoint.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(0);

      await listEndpoints({ page: 1, limit: 20, isActive: true });

      expect(prisma.runpodEndpoint.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        })
      );
    });

    it('should calculate pagination correctly', async () => {
      (
        prisma.runpodEndpoint.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (
        prisma.runpodEndpoint.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(100);

      const result = await listEndpoints({ page: 3, limit: 10 });

      expect(prisma.runpodEndpoint.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (page - 1) * limit
          take: 10,
        })
      );
      expect(result.meta.totalPages).toBe(10);
    });

    it('should return empty list when no endpoints', async () => {
      (
        prisma.runpodEndpoint.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (
        prisma.runpodEndpoint.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(0);

      const result = await listEndpoints({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  // ============================================
  // getEndpoint
  // ============================================
  describe('getEndpoint', () => {
    it('should return endpoint by ID', async () => {
      (
        prisma.runpodEndpoint.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockEndpointWithCount);

      const result = await getEndpoint(TEST_ENDPOINT_ID);

      expect(result.id).toBe(TEST_ENDPOINT_ID);
      expect(result._count.baseModels).toBe(5);
    });

    it('should throw AppError if endpoint not found', async () => {
      (
        prisma.runpodEndpoint.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      await expect(getEndpoint('unknown')).rejects.toThrow(AppError);
    });
  });

  // ============================================
  // updateEndpoint
  // ============================================
  describe('updateEndpoint', () => {
    it('should update endpoint successfully', async () => {
      (
        prisma.runpodEndpoint.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockEndpointWithCount);
      (
        prisma.runpodEndpoint.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockEndpoint,
        name: 'Updated Name',
      });

      const result = await updateEndpoint(TEST_ENDPOINT_ID, {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('should update multiple fields', async () => {
      (
        prisma.runpodEndpoint.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockEndpointWithCount);
      (
        prisma.runpodEndpoint.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockEndpoint,
        name: 'Updated',
        gpuType: 'H100',
        isActive: false,
      });

      await updateEndpoint(TEST_ENDPOINT_ID, {
        name: 'Updated',
        gpuType: 'H100',
        isActive: false,
      });

      expect(prisma.runpodEndpoint.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            name: 'Updated',
            gpuType: 'H100',
            isActive: false,
          },
        })
      );
    });

    it('should throw AppError if endpoint not found', async () => {
      (
        prisma.runpodEndpoint.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      await expect(updateEndpoint('unknown', { name: 'Test' })).rejects.toThrow(
        AppError
      );
    });

    it('should only update provided fields', async () => {
      (
        prisma.runpodEndpoint.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockEndpointWithCount);
      (
        prisma.runpodEndpoint.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockEndpoint);

      await updateEndpoint(TEST_ENDPOINT_ID, { gpuType: 'L4' });

      expect(prisma.runpodEndpoint.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { gpuType: 'L4' },
        })
      );
    });
  });

  // ============================================
  // deleteEndpoint
  // ============================================
  describe('deleteEndpoint', () => {
    it('should soft delete endpoint by setting isActive to false', async () => {
      (
        prisma.runpodEndpoint.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockEndpointWithCount);
      (
        prisma.runpodEndpoint.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockEndpoint,
        isActive: false,
      });

      const result = await deleteEndpoint(TEST_ENDPOINT_ID);

      expect(result.isActive).toBe(false);
      expect(prisma.runpodEndpoint.update).toHaveBeenCalledWith({
        where: { id: TEST_ENDPOINT_ID },
        data: { isActive: false },
      });
    });

    it('should throw AppError if endpoint not found', async () => {
      (
        prisma.runpodEndpoint.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      await expect(deleteEndpoint('unknown')).rejects.toThrow(AppError);
    });
  });
});
