/**
 * Purchase Repository Tests
 * Unit tests for purchase database operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    purchase: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

import { purchaseRepository } from './purchase.repository';
import { prisma } from '@/lib/prisma';

// ============================================
// Test Fixtures
// ============================================

const mockPurchase = {
  id: 'purchase-uuid-1',
  consumerId: 'consumer-uuid-1',
  creditsAmount: 100,
  amountPaid: 1000, // $10.00 in cents
  stripePaymentId: 'pi_123456',
  createdAt: new Date('2026-01-20'),
};

// ============================================
// Tests
// ============================================

describe('Purchase Repository', () => {
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
    it('should find purchase by ID', async () => {
      (
        prisma.purchase.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockPurchase);

      const result = await purchaseRepository.findById('purchase-uuid-1');

      expect(result).toEqual(mockPurchase);
      expect(prisma.purchase.findUnique).toHaveBeenCalledWith({
        where: { id: 'purchase-uuid-1' },
      });
    });

    it('should return null when not found', async () => {
      (
        prisma.purchase.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      const result = await purchaseRepository.findById('unknown-id');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // create
  // ============================================
  describe('create', () => {
    it('should create a new purchase', async () => {
      (
        prisma.purchase.create as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockPurchase);

      const result = await purchaseRepository.create({
        consumerId: 'consumer-uuid-1',
        creditsAmount: 100,
        amountPaid: 1000,
        stripePaymentId: 'pi_123456',
      });

      expect(result).toEqual(mockPurchase);
      expect(prisma.purchase.create).toHaveBeenCalledWith({
        data: {
          consumerId: 'consumer-uuid-1',
          creditsAmount: 100,
          amountPaid: 1000,
          stripePaymentId: 'pi_123456',
        },
      });
    });

    it('should create purchase without stripePaymentId', async () => {
      (
        prisma.purchase.create as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockPurchase,
        stripePaymentId: undefined,
      });

      await purchaseRepository.create({
        consumerId: 'consumer-uuid-1',
        creditsAmount: 100,
        amountPaid: 1000,
      });

      expect(prisma.purchase.create).toHaveBeenCalledWith({
        data: {
          consumerId: 'consumer-uuid-1',
          creditsAmount: 100,
          amountPaid: 1000,
          stripePaymentId: undefined,
        },
      });
    });
  });

  // ============================================
  // listByConsumer
  // ============================================
  describe('listByConsumer', () => {
    it('should list purchases for consumer', async () => {
      const purchases = [mockPurchase];
      (
        prisma.purchase.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(purchases);
      (prisma.purchase.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        1
      );

      const result = await purchaseRepository.listByConsumer(
        'consumer-uuid-1',
        {
          page: 1,
          limit: 10,
        }
      );

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should use default pagination', async () => {
      (
        prisma.purchase.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (prisma.purchase.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        0
      );

      await purchaseRepository.listByConsumer('consumer-uuid-1', {});

      expect(prisma.purchase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        })
      );
    });

    it('should calculate skip correctly for pagination', async () => {
      (
        prisma.purchase.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (prisma.purchase.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        0
      );

      await purchaseRepository.listByConsumer('consumer-uuid-1', {
        page: 3,
        limit: 10,
      });

      expect(prisma.purchase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        })
      );
    });

    it('should order by createdAt descending', async () => {
      (
        prisma.purchase.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (prisma.purchase.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        0
      );

      await purchaseRepository.listByConsumer('consumer-uuid-1', {});

      expect(prisma.purchase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should return empty list when no purchases', async () => {
      (
        prisma.purchase.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (prisma.purchase.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        0
      );

      const result = await purchaseRepository.listByConsumer(
        'consumer-uuid-1',
        {}
      );

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  // ============================================
  // getTotalCreditsPurchased
  // ============================================
  describe('getTotalCreditsPurchased', () => {
    it('should return total credits purchased', async () => {
      (
        prisma.purchase.aggregate as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        _sum: { creditsAmount: 500 },
      });

      const result =
        await purchaseRepository.getTotalCreditsPurchased('consumer-uuid-1');

      expect(result).toBe(500);
    });

    it('should return 0 when no purchases', async () => {
      (
        prisma.purchase.aggregate as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        _sum: { creditsAmount: null },
      });

      const result =
        await purchaseRepository.getTotalCreditsPurchased('consumer-uuid-1');

      expect(result).toBe(0);
    });
  });
});
