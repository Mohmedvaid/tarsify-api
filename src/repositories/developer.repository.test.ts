/**
 * Developer Repository Tests
 * Unit tests for developer database operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    developer: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { developerRepository } from './developer.repository';
import { prisma } from '@/lib/prisma';

// ============================================
// Test Fixtures
// ============================================

const mockDeveloper = {
  id: 'dev-uuid-1',
  firebaseUid: 'firebase-uid-123',
  email: 'dev@example.com',
  name: 'Test Developer',
  avatarUrl: 'https://example.com/avatar.png',
  payoutEmail: null,
  stripeAccountId: null,
  verified: false,
  earningsBalance: 0,
  createdAt: new Date('2026-01-20'),
  updatedAt: new Date('2026-01-20'),
};

// ============================================
// Tests
// ============================================

describe('Developer Repository', () => {
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
    it('should find developer by ID', async () => {
      (
        prisma.developer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDeveloper);

      const result = await developerRepository.findById('dev-uuid-1');

      expect(result).toEqual(mockDeveloper);
      expect(prisma.developer.findUnique).toHaveBeenCalledWith({
        where: { id: 'dev-uuid-1' },
      });
    });

    it('should return null when not found', async () => {
      (
        prisma.developer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      const result = await developerRepository.findById('unknown-id');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // findByFirebaseUid
  // ============================================
  describe('findByFirebaseUid', () => {
    it('should find developer by Firebase UID', async () => {
      (
        prisma.developer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDeveloper);

      const result =
        await developerRepository.findByFirebaseUid('firebase-uid-123');

      expect(result).toEqual(mockDeveloper);
      expect(prisma.developer.findUnique).toHaveBeenCalledWith({
        where: { firebaseUid: 'firebase-uid-123' },
      });
    });

    it('should return null when not found', async () => {
      (
        prisma.developer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      const result = await developerRepository.findByFirebaseUid('unknown-uid');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // findByEmail
  // ============================================
  describe('findByEmail', () => {
    it('should find developer by email', async () => {
      (
        prisma.developer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDeveloper);

      const result = await developerRepository.findByEmail('dev@example.com');

      expect(result).toEqual(mockDeveloper);
      expect(prisma.developer.findUnique).toHaveBeenCalledWith({
        where: { email: 'dev@example.com' },
      });
    });
  });

  // ============================================
  // existsByFirebaseUid
  // ============================================
  describe('existsByFirebaseUid', () => {
    it('should return true when developer exists', async () => {
      (
        prisma.developer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({ id: 'dev-uuid-1' });

      const result =
        await developerRepository.existsByFirebaseUid('firebase-uid-123');

      expect(result).toBe(true);
    });

    it('should return false when developer does not exist', async () => {
      (
        prisma.developer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      const result =
        await developerRepository.existsByFirebaseUid('unknown-uid');

      expect(result).toBe(false);
    });
  });

  // ============================================
  // existsByEmail
  // ============================================
  describe('existsByEmail', () => {
    it('should return true when email exists', async () => {
      (
        prisma.developer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({ id: 'dev-uuid-1' });

      const result = await developerRepository.existsByEmail('dev@example.com');

      expect(result).toBe(true);
    });

    it('should return false when email does not exist', async () => {
      (
        prisma.developer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      const result = await developerRepository.existsByEmail(
        'unknown@example.com'
      );

      expect(result).toBe(false);
    });
  });

  // ============================================
  // create
  // ============================================
  describe('create', () => {
    it('should create a new developer', async () => {
      (
        prisma.developer.create as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDeveloper);

      const result = await developerRepository.create({
        firebaseUid: 'firebase-uid-123',
        email: 'dev@example.com',
        name: 'Test Developer',
        avatarUrl: 'https://example.com/avatar.png',
      });

      expect(result).toEqual(mockDeveloper);
      expect(prisma.developer.create).toHaveBeenCalledWith({
        data: {
          firebaseUid: 'firebase-uid-123',
          email: 'dev@example.com',
          name: 'Test Developer',
          avatarUrl: 'https://example.com/avatar.png',
        },
      });
    });

    it('should create developer with minimal data', async () => {
      (
        prisma.developer.create as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDeveloper);

      await developerRepository.create({
        firebaseUid: 'firebase-uid-123',
        email: 'dev@example.com',
      });

      expect(prisma.developer.create).toHaveBeenCalledWith({
        data: {
          firebaseUid: 'firebase-uid-123',
          email: 'dev@example.com',
          name: null,
          avatarUrl: null,
        },
      });
    });
  });

  // ============================================
  // update
  // ============================================
  describe('update', () => {
    it('should update developer profile', async () => {
      const updatedDeveloper = { ...mockDeveloper, name: 'Updated Name' };
      (
        prisma.developer.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(updatedDeveloper);

      const result = await developerRepository.update('dev-uuid-1', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
      expect(prisma.developer.update).toHaveBeenCalledWith({
        where: { id: 'dev-uuid-1' },
        data: { name: 'Updated Name' },
      });
    });

    it('should update multiple fields', async () => {
      (
        prisma.developer.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDeveloper);

      await developerRepository.update('dev-uuid-1', {
        name: 'Updated Name',
        avatarUrl: 'https://new-avatar.com',
        payoutEmail: 'payout@example.com',
      });

      expect(prisma.developer.update).toHaveBeenCalledWith({
        where: { id: 'dev-uuid-1' },
        data: {
          name: 'Updated Name',
          avatarUrl: 'https://new-avatar.com',
          payoutEmail: 'payout@example.com',
        },
      });
    });
  });

  // ============================================
  // updateByFirebaseUid
  // ============================================
  describe('updateByFirebaseUid', () => {
    it('should update developer by Firebase UID', async () => {
      (
        prisma.developer.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDeveloper);

      await developerRepository.updateByFirebaseUid('firebase-uid-123', {
        name: 'Updated Name',
      });

      expect(prisma.developer.update).toHaveBeenCalledWith({
        where: { firebaseUid: 'firebase-uid-123' },
        data: { name: 'Updated Name' },
      });
    });
  });

  // ============================================
  // completeProfile
  // ============================================
  describe('completeProfile', () => {
    it('should complete developer profile', async () => {
      const completedDeveloper = { ...mockDeveloper, name: 'Completed Name' };
      (
        prisma.developer.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(completedDeveloper);

      const result = await developerRepository.completeProfile('dev-uuid-1', {
        name: 'Completed Name',
        payoutEmail: 'payout@example.com',
      });

      expect(result.name).toBe('Completed Name');
      expect(prisma.developer.update).toHaveBeenCalledWith({
        where: { id: 'dev-uuid-1' },
        data: {
          name: 'Completed Name',
          payoutEmail: 'payout@example.com',
        },
      });
    });
  });

  // ============================================
  // findByIdWithStats
  // ============================================
  describe('findByIdWithStats', () => {
    it('should return developer with stats', async () => {
      (
        prisma.developer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockDeveloper,
        earningsBalance: 1000,
        _count: { notebooks: 5 },
      });

      const result = await developerRepository.findByIdWithStats('dev-uuid-1');

      expect(result).toMatchObject({
        notebookCount: 5,
        totalEarnings: 1000,
        pendingPayout: 1000,
      });
    });

    it('should return null when developer not found', async () => {
      (
        prisma.developer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      const result = await developerRepository.findByIdWithStats('unknown-id');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // findByFirebaseUidWithStats
  // ============================================
  describe('findByFirebaseUidWithStats', () => {
    it('should return developer with stats by Firebase UID', async () => {
      (
        prisma.developer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockDeveloper,
        earningsBalance: 2000,
        _count: { notebooks: 10 },
      });

      const result =
        await developerRepository.findByFirebaseUidWithStats(
          'firebase-uid-123'
        );

      expect(result).toMatchObject({
        notebookCount: 10,
        totalEarnings: 2000,
        pendingPayout: 2000,
      });
    });

    it('should return null when not found', async () => {
      (
        prisma.developer.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      const result =
        await developerRepository.findByFirebaseUidWithStats('unknown-uid');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // updateStripeAccount
  // ============================================
  describe('updateStripeAccount', () => {
    it('should update Stripe account ID', async () => {
      (
        prisma.developer.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockDeveloper,
        stripeAccountId: 'acct_123',
      });

      const result = await developerRepository.updateStripeAccount(
        'dev-uuid-1',
        'acct_123'
      );

      expect(result.stripeAccountId).toBe('acct_123');
      expect(prisma.developer.update).toHaveBeenCalledWith({
        where: { id: 'dev-uuid-1' },
        data: { stripeAccountId: 'acct_123' },
      });
    });
  });

  // ============================================
  // verify
  // ============================================
  describe('verify', () => {
    it('should verify developer', async () => {
      (
        prisma.developer.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockDeveloper,
        verified: true,
      });

      const result = await developerRepository.verify('dev-uuid-1');

      expect(result.verified).toBe(true);
      expect(prisma.developer.update).toHaveBeenCalledWith({
        where: { id: 'dev-uuid-1' },
        data: { verified: true },
      });
    });
  });

  // ============================================
  // delete
  // ============================================
  describe('delete', () => {
    it('should delete developer', async () => {
      (
        prisma.developer.delete as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDeveloper);

      await developerRepository.delete('dev-uuid-1');

      expect(prisma.developer.delete).toHaveBeenCalledWith({
        where: { id: 'dev-uuid-1' },
      });
    });
  });

  // ============================================
  // deleteByFirebaseUid
  // ============================================
  describe('deleteByFirebaseUid', () => {
    it('should delete developer by Firebase UID', async () => {
      (
        prisma.developer.delete as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDeveloper);

      await developerRepository.deleteByFirebaseUid('firebase-uid-123');

      expect(prisma.developer.delete).toHaveBeenCalledWith({
        where: { firebaseUid: 'firebase-uid-123' },
      });
    });
  });

  // ============================================
  // isProfileComplete
  // ============================================
  describe('isProfileComplete', () => {
    it('should return true for complete profile', () => {
      expect(developerRepository.isProfileComplete(mockDeveloper)).toBe(true);
    });

    it('should return false for incomplete profile', () => {
      const incompleteProfile = { ...mockDeveloper, name: null };
      expect(developerRepository.isProfileComplete(incompleteProfile)).toBe(
        false
      );
    });
  });
});
