/**
 * Purchase Repository
 * Database operations for Purchase entity (credit purchases)
 */
import { prisma } from '@/lib/prisma';
import type { Purchase } from '@prisma/client';

/**
 * Create purchase input
 */
export interface CreatePurchaseInput {
  consumerId: string;
  creditsAmount: number;
  amountPaid: number; // In cents
  stripePaymentId?: string;
}

/**
 * List purchases query
 */
export interface ListPurchasesQuery {
  page?: number;
  limit?: number;
}

/**
 * Purchase Repository
 */
export const purchaseRepository = {
  /**
   * Find purchase by ID
   */
  async findById(id: string): Promise<Purchase | null> {
    return prisma.purchase.findUnique({
      where: { id },
    });
  },

  /**
   * Create a new purchase
   */
  async create(data: CreatePurchaseInput): Promise<Purchase> {
    return prisma.purchase.create({
      data: {
        consumerId: data.consumerId,
        creditsAmount: data.creditsAmount,
        amountPaid: data.amountPaid,
        stripePaymentId: data.stripePaymentId,
      },
    });
  },

  /**
   * List purchases for a consumer
   */
  async listByConsumer(
    consumerId: string,
    query: ListPurchasesQuery
  ): Promise<{ data: Purchase[]; total: number }> {
    const { page = 1, limit = 20 } = query;

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where: { consumerId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.purchase.count({ where: { consumerId } }),
    ]);

    return { data: purchases, total };
  },

  /**
   * Get total credits purchased by consumer
   */
  async getTotalCreditsPurchased(consumerId: string): Promise<number> {
    const result = await prisma.purchase.aggregate({
      where: { consumerId },
      _sum: { creditsAmount: true },
    });
    return result._sum.creditsAmount || 0;
  },
};

export type PurchaseRepository = typeof purchaseRepository;
