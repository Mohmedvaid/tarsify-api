/**
 * Developer Repository
 * Database operations for Developer entity
 * Abstracts Prisma queries for better testability
 */
import { prisma } from '@/lib/prisma';
import type { Developer } from '@prisma/client';
import type {
  CreateDeveloperInput,
  UpdateDeveloperInput,
  CompleteDeveloperProfileInput,
  DeveloperWithStats,
} from './types';
import { isProfileComplete } from './types';

/**
 * Developer Repository
 * Encapsulates all database operations for developers
 */
export const developerRepository = {
  /**
   * Find developer by database ID
   */
  async findById(id: string): Promise<Developer | null> {
    return prisma.developer.findUnique({
      where: { id },
    });
  },

  /**
   * Find developer by Firebase UID
   */
  async findByFirebaseUid(firebaseUid: string): Promise<Developer | null> {
    return prisma.developer.findUnique({
      where: { firebaseUid },
    });
  },

  /**
   * Find developer by email
   */
  async findByEmail(email: string): Promise<Developer | null> {
    return prisma.developer.findUnique({
      where: { email },
    });
  },

  /**
   * Check if developer exists by Firebase UID
   */
  async existsByFirebaseUid(firebaseUid: string): Promise<boolean> {
    const developer = await prisma.developer.findUnique({
      where: { firebaseUid },
      select: { id: true },
    });
    return developer !== null;
  },

  /**
   * Check if developer exists by email
   */
  async existsByEmail(email: string): Promise<boolean> {
    const developer = await prisma.developer.findUnique({
      where: { email },
      select: { id: true },
    });
    return developer !== null;
  },

  /**
   * Create a new developer
   */
  async create(data: CreateDeveloperInput): Promise<Developer> {
    return prisma.developer.create({
      data: {
        firebaseUid: data.firebaseUid,
        email: data.email,
        name: data.name || null,
        avatarUrl: data.avatarUrl || null,
      },
    });
  },

  /**
   * Update developer profile
   */
  async update(id: string, data: UpdateDeveloperInput): Promise<Developer> {
    return prisma.developer.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        ...(data.payoutEmail !== undefined && { payoutEmail: data.payoutEmail }),
      },
    });
  },

  /**
   * Update developer by Firebase UID
   */
  async updateByFirebaseUid(
    firebaseUid: string,
    data: UpdateDeveloperInput
  ): Promise<Developer> {
    return prisma.developer.update({
      where: { firebaseUid },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        ...(data.payoutEmail !== undefined && { payoutEmail: data.payoutEmail }),
      },
    });
  },

  /**
   * Complete developer profile
   */
  async completeProfile(
    id: string,
    data: CompleteDeveloperProfileInput
  ): Promise<Developer> {
    return prisma.developer.update({
      where: { id },
      data: {
        name: data.name,
        ...(data.payoutEmail !== undefined && { payoutEmail: data.payoutEmail }),
      },
    });
  },

  /**
   * Get developer with stats (notebook count, earnings)
   */
  async findByIdWithStats(id: string): Promise<DeveloperWithStats | null> {
    const developer = await prisma.developer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { notebooks: true },
        },
      },
    });

    if (!developer) {
      return null;
    }

    return {
      ...developer,
      notebookCount: developer._count.notebooks,
      totalEarnings: developer.earningsBalance,
      pendingPayout: developer.earningsBalance, // For now, pending = total balance
    };
  },

  /**
   * Get developer with stats by Firebase UID
   */
  async findByFirebaseUidWithStats(
    firebaseUid: string
  ): Promise<DeveloperWithStats | null> {
    const developer = await prisma.developer.findUnique({
      where: { firebaseUid },
      include: {
        _count: {
          select: { notebooks: true },
        },
      },
    });

    if (!developer) {
      return null;
    }

    return {
      ...developer,
      notebookCount: developer._count.notebooks,
      totalEarnings: developer.earningsBalance,
      pendingPayout: developer.earningsBalance,
    };
  },

  /**
   * Update Stripe account ID
   */
  async updateStripeAccount(id: string, stripeAccountId: string): Promise<Developer> {
    return prisma.developer.update({
      where: { id },
      data: { stripeAccountId },
    });
  },

  /**
   * Verify developer
   */
  async verify(id: string): Promise<Developer> {
    return prisma.developer.update({
      where: { id },
      data: { verified: true },
    });
  },

  /**
   * Delete developer (for testing)
   */
  async delete(id: string): Promise<void> {
    await prisma.developer.delete({
      where: { id },
    });
  },

  /**
   * Delete developer by Firebase UID (for testing)
   */
  async deleteByFirebaseUid(firebaseUid: string): Promise<void> {
    await prisma.developer.delete({
      where: { firebaseUid },
    });
  },

  /**
   * Check if profile is complete
   */
  isProfileComplete,
};

/**
 * Export type for dependency injection in tests
 */
export type DeveloperRepository = typeof developerRepository;
