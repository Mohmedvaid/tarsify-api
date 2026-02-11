/**
 * Consumer Repository
 * Database operations for Consumer entity
 * Abstracts Prisma queries for better testability
 */
import { prisma } from '@/lib/prisma';
import type { Consumer } from '@prisma/client';
import type { CreateConsumerInput, UpdateConsumerInput, ConsumerWithStats } from './consumer.types';

/**
 * Consumer Repository
 * Encapsulates all database operations for consumers
 */
export const consumerRepository = {
  /**
   * Find consumer by database ID
   */
  async findById(id: string): Promise<Consumer | null> {
    return prisma.consumer.findUnique({
      where: { id },
    });
  },

  /**
   * Find consumer by Firebase UID
   */
  async findByFirebaseUid(firebaseUid: string): Promise<Consumer | null> {
    return prisma.consumer.findUnique({
      where: { firebaseUid },
    });
  },

  /**
   * Find consumer by email
   */
  async findByEmail(email: string): Promise<Consumer | null> {
    return prisma.consumer.findUnique({
      where: { email },
    });
  },

  /**
   * Check if consumer exists by Firebase UID
   */
  async existsByFirebaseUid(firebaseUid: string): Promise<boolean> {
    const consumer = await prisma.consumer.findUnique({
      where: { firebaseUid },
      select: { id: true },
    });
    return consumer !== null;
  },

  /**
   * Check if consumer exists by email
   */
  async existsByEmail(email: string): Promise<boolean> {
    const consumer = await prisma.consumer.findUnique({
      where: { email },
      select: { id: true },
    });
    return consumer !== null;
  },

  /**
   * Create a new consumer
   */
  async create(data: CreateConsumerInput): Promise<Consumer> {
    return prisma.consumer.create({
      data: {
        firebaseUid: data.firebaseUid,
        email: data.email,
        name: data.name || null,
        avatarUrl: data.avatarUrl || null,
        creditsBalance: 0,
      },
    });
  },

  /**
   * Update consumer profile
   */
  async update(id: string, data: UpdateConsumerInput): Promise<Consumer> {
    return prisma.consumer.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      },
    });
  },

  /**
   * Update consumer by Firebase UID
   */
  async updateByFirebaseUid(
    firebaseUid: string,
    data: UpdateConsumerInput
  ): Promise<Consumer> {
    return prisma.consumer.update({
      where: { firebaseUid },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      },
    });
  },

  /**
   * Get consumer with stats (run count, total spent)
   */
  async findByIdWithStats(id: string): Promise<ConsumerWithStats | null> {
    const consumer = await prisma.consumer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            executions: true,
            purchases: true,
          },
        },
      },
    });

    if (!consumer) return null;

    // Calculate total credits purchased
    const purchasedResult = await prisma.purchase.aggregate({
      where: { consumerId: id },
      _sum: { creditsAmount: true },
    });

    // TODO: Add credit tracking to Execution model in future iteration
    // For now, return 0 for totalCreditsSpent
    return {
      ...consumer,
      runCount: consumer._count.executions,
      purchaseCount: consumer._count.purchases,
      totalCreditsSpent: 0,
      totalCreditsPurchased: purchasedResult._sum.creditsAmount || 0,
    };
  },

  /**
   * Add credits to consumer balance
   */
  async addCredits(id: string, amount: number): Promise<Consumer> {
    return prisma.consumer.update({
      where: { id },
      data: {
        creditsBalance: {
          increment: amount,
        },
      },
    });
  },

  /**
   * Deduct credits from consumer balance
   * Returns null if insufficient balance
   */
  async deductCredits(id: string, amount: number): Promise<Consumer | null> {
    // First check balance
    const consumer = await prisma.consumer.findUnique({
      where: { id },
      select: { creditsBalance: true },
    });

    if (!consumer || consumer.creditsBalance < amount) {
      return null;
    }

    return prisma.consumer.update({
      where: { id },
      data: {
        creditsBalance: {
          decrement: amount,
        },
      },
    });
  },

  /**
   * Get credit balance
   */
  async getCreditsBalance(id: string): Promise<number | null> {
    const consumer = await prisma.consumer.findUnique({
      where: { id },
      select: { creditsBalance: true },
    });
    return consumer?.creditsBalance ?? null;
  },

  /**
   * Delete consumer (for testing/admin)
   */
  async delete(id: string): Promise<Consumer> {
    return prisma.consumer.delete({
      where: { id },
    });
  },

  /**
   * Delete consumer by Firebase UID (for testing)
   */
  async deleteByFirebaseUid(firebaseUid: string): Promise<Consumer | null> {
    try {
      return await prisma.consumer.delete({
        where: { firebaseUid },
      });
    } catch {
      return null;
    }
  },
};

export type ConsumerRepository = typeof consumerRepository;
