/**
 * Consumer Repository Tests
 * Unit tests for consumer database operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    consumer: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    purchase: {
      aggregate: vi.fn(),
    },
  },
}));

import { consumerRepository } from './consumer.repository';
import { prisma } from '@/lib/prisma';

// ============================================
// Test Fixtures
// ============================================

const mockConsumer = {
  id: 'consumer-uuid-1',
  firebaseUid: 'firebase-uid-123',
  email: 'consumer@example.com',
  name: 'Test Consumer',
  avatarUrl: 'https://example.com/avatar.jpg',
  creditsBalance: 1000,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-15'),
};

// ============================================
// Tests
// ============================================

describe('Consumer Repository', () => {
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
    it('should find consumer by ID', async () => {
      (
        prisma.consumer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockConsumer);

      const result = await consumerRepository.findById('consumer-uuid-1');

      expect(result).toEqual(mockConsumer);
      expect(prisma.consumer.findUnique).toHaveBeenCalledWith({
        where: { id: 'consumer-uuid-1' },
      });
    });

    it('should return null when not found', async () => {
      (
        prisma.consumer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      const result = await consumerRepository.findById('unknown-id');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // findByFirebaseUid
  // ============================================
  describe('findByFirebaseUid', () => {
    it('should find consumer by Firebase UID', async () => {
      (
        prisma.consumer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockConsumer);

      const result =
        await consumerRepository.findByFirebaseUid('firebase-uid-123');

      expect(result).toEqual(mockConsumer);
      expect(prisma.consumer.findUnique).toHaveBeenCalledWith({
        where: { firebaseUid: 'firebase-uid-123' },
      });
    });

    it('should return null when not found', async () => {
      (
        prisma.consumer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      const result = await consumerRepository.findByFirebaseUid('unknown-uid');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // findByEmail
  // ============================================
  describe('findByEmail', () => {
    it('should find consumer by email', async () => {
      (
        prisma.consumer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockConsumer);

      const result = await consumerRepository.findByEmail(
        'consumer@example.com'
      );

      expect(result).toEqual(mockConsumer);
      expect(prisma.consumer.findUnique).toHaveBeenCalledWith({
        where: { email: 'consumer@example.com' },
      });
    });

    it('should return null when not found', async () => {
      (
        prisma.consumer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      const result = await consumerRepository.findByEmail(
        'unknown@example.com'
      );

      expect(result).toBeNull();
    });
  });

  // ============================================
  // existsByFirebaseUid
  // ============================================
  describe('existsByFirebaseUid', () => {
    it('should return true when consumer exists', async () => {
      (
        prisma.consumer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        id: 'consumer-uuid-1',
      });

      const result =
        await consumerRepository.existsByFirebaseUid('firebase-uid-123');

      expect(result).toBe(true);
    });

    it('should return false when consumer does not exist', async () => {
      (
        prisma.consumer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      const result =
        await consumerRepository.existsByFirebaseUid('unknown-uid');

      expect(result).toBe(false);
    });
  });

  // ============================================
  // existsByEmail
  // ============================================
  describe('existsByEmail', () => {
    it('should return true when consumer exists', async () => {
      (
        prisma.consumer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        id: 'consumer-uuid-1',
      });

      const result = await consumerRepository.existsByEmail(
        'consumer@example.com'
      );

      expect(result).toBe(true);
    });

    it('should return false when consumer does not exist', async () => {
      (
        prisma.consumer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      const result = await consumerRepository.existsByEmail(
        'unknown@example.com'
      );

      expect(result).toBe(false);
    });
  });

  // ============================================
  // create
  // ============================================
  describe('create', () => {
    it('should create a new consumer', async () => {
      (
        prisma.consumer.create as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockConsumer);

      const result = await consumerRepository.create({
        firebaseUid: 'firebase-uid-123',
        email: 'consumer@example.com',
        name: 'Test Consumer',
        avatarUrl: 'https://example.com/avatar.jpg',
      });

      expect(result).toEqual(mockConsumer);
      expect(prisma.consumer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          firebaseUid: 'firebase-uid-123',
          email: 'consumer@example.com',
          name: 'Test Consumer',
          creditsBalance: 0,
        }),
      });
    });

    it('should create consumer with null name if not provided', async () => {
      (
        prisma.consumer.create as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockConsumer,
        name: null,
      });

      await consumerRepository.create({
        firebaseUid: 'firebase-uid-123',
        email: 'consumer@example.com',
      });

      expect(prisma.consumer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: null,
        }),
      });
    });
  });

  // ============================================
  // update
  // ============================================
  describe('update', () => {
    it('should update consumer name', async () => {
      const updated = { ...mockConsumer, name: 'Updated Name' };
      (
        prisma.consumer.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(updated);

      const result = await consumerRepository.update('consumer-uuid-1', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('should update consumer avatarUrl', async () => {
      const updated = { ...mockConsumer, avatarUrl: 'https://new-avatar.jpg' };
      (
        prisma.consumer.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(updated);

      const result = await consumerRepository.update('consumer-uuid-1', {
        avatarUrl: 'https://new-avatar.jpg',
      });

      expect(result.avatarUrl).toBe('https://new-avatar.jpg');
    });
  });

  // ============================================
  // updateByFirebaseUid
  // ============================================
  describe('updateByFirebaseUid', () => {
    it('should update consumer by Firebase UID', async () => {
      const updated = { ...mockConsumer, name: 'Updated Name' };
      (
        prisma.consumer.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(updated);

      const result = await consumerRepository.updateByFirebaseUid(
        'firebase-uid-123',
        {
          name: 'Updated Name',
        }
      );

      expect(result.name).toBe('Updated Name');
      expect(prisma.consumer.update).toHaveBeenCalledWith({
        where: { firebaseUid: 'firebase-uid-123' },
        data: expect.any(Object),
      });
    });
  });

  // ============================================
  // findByIdWithStats
  // ============================================
  describe('findByIdWithStats', () => {
    it('should find consumer with stats', async () => {
      (
        prisma.consumer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockConsumer,
        _count: {
          executions: 10,
          purchases: 3,
        },
      });
      (
        prisma.purchase.aggregate as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        _sum: { creditsAmount: 500 },
      });

      const result =
        await consumerRepository.findByIdWithStats('consumer-uuid-1');

      expect(result).toBeDefined();
      expect(result?.runCount).toBe(10);
      expect(result?.purchaseCount).toBe(3);
      expect(result?.totalCreditsPurchased).toBe(500);
    });

    it('should return null when consumer not found', async () => {
      (
        prisma.consumer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      const result = await consumerRepository.findByIdWithStats('unknown-id');

      expect(result).toBeNull();
    });

    it('should handle null aggregate result', async () => {
      (
        prisma.consumer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockConsumer,
        _count: {
          executions: 0,
          purchases: 0,
        },
      });
      (
        prisma.purchase.aggregate as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        _sum: { creditsAmount: null },
      });

      const result =
        await consumerRepository.findByIdWithStats('consumer-uuid-1');

      expect(result?.totalCreditsPurchased).toBe(0);
    });
  });

  // ============================================
  // addCredits
  // ============================================
  describe('addCredits', () => {
    it('should add credits to consumer balance', async () => {
      const updated = { ...mockConsumer, creditsBalance: 1100 };
      (
        prisma.consumer.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(updated);

      const result = await consumerRepository.addCredits(
        'consumer-uuid-1',
        100
      );

      expect(result.creditsBalance).toBe(1100);
      expect(prisma.consumer.update).toHaveBeenCalledWith({
        where: { id: 'consumer-uuid-1' },
        data: {
          creditsBalance: {
            increment: 100,
          },
        },
      });
    });
  });

  // ============================================
  // deductCredits
  // ============================================
  describe('deductCredits', () => {
    it('should deduct credits when sufficient balance', async () => {
      (
        prisma.consumer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        creditsBalance: 1000,
      });
      const updated = { ...mockConsumer, creditsBalance: 900 };
      (
        prisma.consumer.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(updated);

      const result = await consumerRepository.deductCredits(
        'consumer-uuid-1',
        100
      );

      expect(result?.creditsBalance).toBe(900);
    });

    it('should return null when insufficient balance', async () => {
      (
        prisma.consumer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        creditsBalance: 50,
      });

      const result = await consumerRepository.deductCredits(
        'consumer-uuid-1',
        100
      );

      expect(result).toBeNull();
    });

    it('should return null when consumer not found', async () => {
      (
        prisma.consumer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      const result = await consumerRepository.deductCredits('unknown-id', 100);

      expect(result).toBeNull();
    });
  });

  // ============================================
  // getCreditsBalance
  // ============================================
  describe('getCreditsBalance', () => {
    it('should return credits balance', async () => {
      (
        prisma.consumer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        creditsBalance: 1000,
      });

      const result =
        await consumerRepository.getCreditsBalance('consumer-uuid-1');

      expect(result).toBe(1000);
    });

    it('should return null when consumer not found', async () => {
      (
        prisma.consumer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      const result = await consumerRepository.getCreditsBalance('unknown-id');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // delete
  // ============================================
  describe('delete', () => {
    it('should delete consumer', async () => {
      (
        prisma.consumer.delete as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockConsumer);

      const result = await consumerRepository.delete('consumer-uuid-1');

      expect(result).toEqual(mockConsumer);
      expect(prisma.consumer.delete).toHaveBeenCalledWith({
        where: { id: 'consumer-uuid-1' },
      });
    });
  });

  // ============================================
  // deleteByFirebaseUid
  // ============================================
  describe('deleteByFirebaseUid', () => {
    it('should delete consumer by Firebase UID', async () => {
      (
        prisma.consumer.delete as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockConsumer);

      const result =
        await consumerRepository.deleteByFirebaseUid('firebase-uid-123');

      expect(result).toEqual(mockConsumer);
    });

    it('should return null when delete fails', async () => {
      (
        prisma.consumer.delete as ReturnType<typeof vi.fn>
      ).mockRejectedValueOnce(new Error('Not found'));

      const result =
        await consumerRepository.deleteByFirebaseUid('unknown-uid');

      expect(result).toBeNull();
    });
  });
});
