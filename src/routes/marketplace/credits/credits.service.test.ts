/**
 * Credits Service Tests
 * Unit tests for marketplace credits/purchase service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    purchase: {
      create: vi.fn(),
    },
    consumer: {
      update: vi.fn(),
    },
  },
}));

vi.mock('@/repositories', () => ({
  purchaseRepository: {
    listByConsumer: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { creditsService } from './credits.service';
import { prisma } from '@/lib/prisma';
import { purchaseRepository } from '@/repositories';
import { CREDIT_PRICING } from '@/config/consumer';

// ============================================
// Test Fixtures
// ============================================

const mockConsumer = {
  id: 'consumer-uuid-1',
  firebaseUid: 'firebase-uid-123',
  email: 'consumer@example.com',
  name: 'Test Consumer',
  avatarUrl: null,
  creditsBalance: 1000,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-15'),
};

const mockPurchase = {
  id: 'purchase-uuid-1',
  consumerId: 'consumer-uuid-1',
  creditsAmount: 100,
  amountPaid: 1000, // $10.00 in cents
  stripePaymentId: 'mock_123456',
  createdAt: new Date('2026-01-20'),
};

// ============================================
// Tests
// ============================================

describe('Credits Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // getBalance
  // ============================================
  describe('getBalance', () => {
    it('should return consumer credit balance', async () => {
      const result = await creditsService.getBalance(mockConsumer);

      expect(result.data.balance).toBe(1000);
    });

    it('should return formatted display balance', async () => {
      const result = await creditsService.getBalance(mockConsumer);

      expect(result.data.displayBalance).toBeDefined();
      expect(typeof result.data.displayBalance).toBe('string');
    });

    it('should handle 0 balance', async () => {
      const consumerNoCredits = { ...mockConsumer, creditsBalance: 0 };

      const result = await creditsService.getBalance(consumerNoCredits);

      expect(result.data.balance).toBe(0);
    });

    it('should handle large balance', async () => {
      const consumerHighCredits = { ...mockConsumer, creditsBalance: 1000000 };

      const result = await creditsService.getBalance(consumerHighCredits);

      expect(result.data.balance).toBe(1000000);
    });
  });

  // ============================================
  // getPackages
  // ============================================
  describe('getPackages', () => {
    it('should return credit packages', async () => {
      const result = await creditsService.getPackages();

      expect(result.data.packages).toBeDefined();
      expect(Array.isArray(result.data.packages)).toBe(true);
      expect(result.data.packages.length).toBeGreaterThan(0);
    });

    it('should include credits per dollar rate', async () => {
      const result = await creditsService.getPackages();

      expect(result.data.creditsPerDollar).toBe(
        CREDIT_PRICING.CREDITS_PER_DOLLAR
      );
    });

    it('should format price display for each package', async () => {
      const result = await creditsService.getPackages();

      result.data.packages.forEach((pkg) => {
        expect(pkg.priceDisplay).toBeDefined();
        expect(pkg.priceDisplay).toMatch(/^\$\d+\.\d{2}$/); // Format: $X.XX
      });
    });

    it('should include all package properties', async () => {
      const result = await creditsService.getPackages();

      result.data.packages.forEach((pkg) => {
        expect(pkg).toHaveProperty('credits');
        expect(pkg).toHaveProperty('priceCents');
        expect(pkg).toHaveProperty('priceDisplay');
        expect(pkg).toHaveProperty('popular');
      });
    });
  });

  // ============================================
  // purchaseCredits
  // ============================================
  describe('purchaseCredits', () => {
    it('should purchase credits successfully', async () => {
      const transactionMock = prisma.$transaction as ReturnType<typeof vi.fn>;
      const updatedConsumer = { ...mockConsumer, creditsBalance: 1100 };

      transactionMock.mockImplementationOnce(async (callback) => {
        const mockTx = {
          purchase: {
            create: vi.fn().mockResolvedValueOnce(mockPurchase),
          },
          consumer: {
            update: vi.fn().mockResolvedValueOnce(updatedConsumer),
          },
        };
        return callback(mockTx);
      });

      const result = await creditsService.purchaseCredits(mockConsumer, {
        amountCents: 1000, // $10
      });

      expect(result.data.id).toBe(mockPurchase.id);
      expect(result.data.newBalance).toBe(1100);
    });

    it('should calculate credits based on amount', async () => {
      const transactionMock = prisma.$transaction as ReturnType<typeof vi.fn>;

      let capturedData: any;
      transactionMock.mockImplementationOnce(async (callback) => {
        const mockTx = {
          purchase: {
            create: vi.fn().mockImplementation((args) => {
              capturedData = args.data;
              return mockPurchase;
            }),
          },
          consumer: {
            update: vi.fn().mockResolvedValueOnce(mockConsumer),
          },
        };
        return callback(mockTx);
      });

      await creditsService.purchaseCredits(mockConsumer, {
        amountCents: 1000, // $10
      });

      // Credits should be calculated based on CREDITS_PER_DOLLAR
      const expectedCredits = Math.floor(
        (1000 / 100) * CREDIT_PRICING.CREDITS_PER_DOLLAR
      );
      expect(capturedData.creditsAmount).toBe(expectedCredits);
    });

    it('should return success message', async () => {
      const transactionMock = prisma.$transaction as ReturnType<typeof vi.fn>;

      transactionMock.mockImplementationOnce(async (callback) => {
        const mockTx = {
          purchase: {
            create: vi.fn().mockResolvedValueOnce(mockPurchase),
          },
          consumer: {
            update: vi.fn().mockResolvedValueOnce(mockConsumer),
          },
        };
        return callback(mockTx);
      });

      const result = await creditsService.purchaseCredits(mockConsumer, {
        amountCents: 1000,
      });

      expect(result.data.message).toContain('Successfully added');
    });

    it('should generate mock stripe payment ID', async () => {
      const transactionMock = prisma.$transaction as ReturnType<typeof vi.fn>;

      let capturedData: any;
      transactionMock.mockImplementationOnce(async (callback) => {
        const mockTx = {
          purchase: {
            create: vi.fn().mockImplementation((args) => {
              capturedData = args.data;
              return mockPurchase;
            }),
          },
          consumer: {
            update: vi.fn().mockResolvedValueOnce(mockConsumer),
          },
        };
        return callback(mockTx);
      });

      await creditsService.purchaseCredits(mockConsumer, {
        amountCents: 500,
      });

      expect(capturedData.stripePaymentId).toMatch(/^mock_\d+$/);
    });
  });

  // ============================================
  // listPurchases
  // ============================================
  describe('listPurchases', () => {
    it('should list purchase history with pagination', async () => {
      const purchases = [mockPurchase];
      (
        purchaseRepository.listByConsumer as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        data: purchases,
        total: 1,
      });

      const result = await creditsService.listPurchases(mockConsumer, {
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should use default pagination when not provided', async () => {
      (
        purchaseRepository.listByConsumer as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        data: [],
        total: 0,
      });

      await creditsService.listPurchases(mockConsumer, {});

      expect(purchaseRepository.listByConsumer).toHaveBeenCalledWith(
        mockConsumer.id,
        expect.objectContaining({
          page: 1,
          limit: expect.any(Number),
        })
      );
    });

    it('should calculate total pages correctly', async () => {
      (
        purchaseRepository.listByConsumer as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        data: [mockPurchase],
        total: 25,
      });

      const result = await creditsService.listPurchases(mockConsumer, {
        page: 1,
        limit: 10,
      });

      expect(result.meta.totalPages).toBe(3); // 25 / 10 = 2.5 => 3
    });

    it('should format purchase response correctly', async () => {
      (
        purchaseRepository.listByConsumer as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        data: [mockPurchase],
        total: 1,
      });

      const result = await creditsService.listPurchases(mockConsumer, {
        page: 1,
        limit: 10,
      });

      const purchase = result.data[0];
      expect(purchase).toHaveProperty('id');
      expect(purchase).toHaveProperty('creditsAmount');
      expect(purchase).toHaveProperty('amountPaid');
      expect(purchase).toHaveProperty('amountPaidDisplay');
      expect(purchase).toHaveProperty('createdAt');
      expect(purchase.amountPaidDisplay).toMatch(/^\$\d+\.\d{2}$/);
    });

    it('should return empty array when no purchases', async () => {
      (
        purchaseRepository.listByConsumer as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        data: [],
        total: 0,
      });

      const result = await creditsService.listPurchases(mockConsumer, {});

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });
  });
});
