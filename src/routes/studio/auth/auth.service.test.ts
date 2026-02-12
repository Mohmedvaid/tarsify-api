/**
 * Studio Auth Service Tests
 * Unit tests for developer authentication service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('@/repositories', () => ({
  developerRepository: {
    findByFirebaseUid: vi.fn(),
    findByFirebaseUidWithStats: vi.fn(),
    findById: vi.fn(),
    existsByEmail: vi.fn(),
    existsByFirebaseUid: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    completeProfile: vi.fn(),
  },
  isProfileComplete: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { authService, transformers } from './auth.service';
import { developerRepository, isProfileComplete } from '@/repositories';
import { AppError } from '@/core/errors';
import type { Developer } from '@prisma/client';

// ============================================
// Test Fixtures
// ============================================

const mockDeveloper: Developer = {
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

const mockFirebaseUser = {
  uid: 'firebase-uid-123',
  email: 'dev@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.png',
};

// ============================================
// Tests
// ============================================

describe('Studio Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (isProfileComplete as ReturnType<typeof vi.fn>).mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // register
  // ============================================
  describe('register', () => {
    it('should register a new developer', async () => {
      (
        developerRepository.findByFirebaseUid as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);
      (
        developerRepository.existsByEmail as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(false);
      (
        developerRepository.create as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDeveloper);

      const result = await authService.register(mockFirebaseUser, {
        email: 'dev@example.com',
        displayName: 'Test Developer',
      });

      expect(result.id).toBe('dev-uuid-1');
      expect(result.email).toBe('dev@example.com');
      expect(developerRepository.create).toHaveBeenCalledWith({
        firebaseUid: 'firebase-uid-123',
        email: 'dev@example.com',
        name: 'Test Developer',
        avatarUrl: 'https://example.com/photo.png',
      });
    });

    it('should throw error if developer already exists', async () => {
      (
        developerRepository.findByFirebaseUid as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDeveloper);

      await expect(
        authService.register(mockFirebaseUser, {
          email: 'dev@example.com',
          displayName: 'Test Developer',
        })
      ).rejects.toThrow(AppError);
    });

    it('should throw error if email is already taken', async () => {
      (
        developerRepository.findByFirebaseUid as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);
      (
        developerRepository.existsByEmail as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(true);

      await expect(
        authService.register(mockFirebaseUser, {
          email: 'taken@example.com',
          displayName: 'Test Developer',
        })
      ).rejects.toThrow(AppError);
    });

    it('should use Firebase displayName if not provided', async () => {
      (
        developerRepository.findByFirebaseUid as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);
      (
        developerRepository.existsByEmail as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(false);
      (
        developerRepository.create as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDeveloper);

      await authService.register(mockFirebaseUser, {
        email: 'dev@example.com',
      });

      expect(developerRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test User', // From Firebase
        })
      );
    });
  });

  // ============================================
  // getMe
  // ============================================
  describe('getMe', () => {
    it('should return developer with stats', async () => {
      (
        developerRepository.findByFirebaseUidWithStats as ReturnType<
          typeof vi.fn
        >
      ).mockResolvedValueOnce({
        ...mockDeveloper,
        notebookCount: 5,
        totalEarnings: 1000,
        pendingPayout: 1000,
      });

      const result = await authService.getMe('firebase-uid-123');

      expect(result.id).toBe('dev-uuid-1');
      expect(result.notebookCount).toBe(5);
      expect(result.totalEarnings).toBe(1000);
    });

    it('should throw error if developer not found', async () => {
      (
        developerRepository.findByFirebaseUidWithStats as ReturnType<
          typeof vi.fn
        >
      ).mockResolvedValueOnce(null);

      await expect(authService.getMe('unknown-uid')).rejects.toThrow(AppError);
    });
  });

  // ============================================
  // getDeveloperById
  // ============================================
  describe('getDeveloperById', () => {
    it('should return developer by ID', async () => {
      (
        developerRepository.findById as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDeveloper);

      const result = await authService.getDeveloperById('dev-uuid-1');

      expect(result).toEqual(mockDeveloper);
    });

    it('should return null if not found', async () => {
      (
        developerRepository.findById as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      const result = await authService.getDeveloperById('unknown-id');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // updateProfile
  // ============================================
  describe('updateProfile', () => {
    it('should update developer profile', async () => {
      const updatedDeveloper = { ...mockDeveloper, name: 'Updated Name' };
      (
        developerRepository.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(updatedDeveloper);

      const result = await authService.updateProfile(mockDeveloper, {
        displayName: 'Updated Name',
      });

      expect(result.displayName).toBe('Updated Name');
    });

    it('should update avatar URL', async () => {
      const updatedDeveloper = {
        ...mockDeveloper,
        avatarUrl: 'https://new-avatar.com/img.png',
      };
      (
        developerRepository.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(updatedDeveloper);

      const result = await authService.updateProfile(mockDeveloper, {
        avatarUrl: 'https://new-avatar.com/img.png',
      });

      expect(result.avatarUrl).toBe('https://new-avatar.com/img.png');
    });
  });

  // ============================================
  // completeProfile
  // ============================================
  describe('completeProfile', () => {
    it('should complete developer profile', async () => {
      const completedDeveloper = { ...mockDeveloper, name: 'Complete Name' };
      (
        developerRepository.completeProfile as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(completedDeveloper);
      (isProfileComplete as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const result = await authService.completeProfile(mockDeveloper, {
        displayName: 'Complete Name',
        payoutEmail: 'payout@example.com',
      });

      expect(result.displayName).toBe('Complete Name');
      expect(developerRepository.completeProfile).toHaveBeenCalledWith(
        'dev-uuid-1',
        { name: 'Complete Name', payoutEmail: 'payout@example.com' }
      );
    });

    it('should still update if profile already complete', async () => {
      (
        developerRepository.completeProfile as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDeveloper);
      (isProfileComplete as ReturnType<typeof vi.fn>).mockReturnValue(true);

      await authService.completeProfile(mockDeveloper, {
        displayName: 'Updated Name',
      });

      expect(developerRepository.completeProfile).toHaveBeenCalled();
    });
  });

  // ============================================
  // existsByFirebaseUid
  // ============================================
  describe('existsByFirebaseUid', () => {
    it('should return true if developer exists', async () => {
      (
        developerRepository.existsByFirebaseUid as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(true);

      const result = await authService.existsByFirebaseUid('firebase-uid-123');

      expect(result).toBe(true);
    });

    it('should return false if developer does not exist', async () => {
      (
        developerRepository.existsByFirebaseUid as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(false);

      const result = await authService.existsByFirebaseUid('unknown-uid');

      expect(result).toBe(false);
    });
  });

  // ============================================
  // Transformers
  // ============================================
  describe('transformers', () => {
    describe('toDeveloperResponse', () => {
      it('should transform developer to response', () => {
        const result = transformers.toDeveloperResponse(mockDeveloper);

        expect(result.id).toBe('dev-uuid-1');
        expect(result.email).toBe('dev@example.com');
        expect(result.displayName).toBe('Test Developer');
        expect(result.verified).toBe(false);
        expect(result.profileComplete).toBe(true);
      });
    });

    describe('toDeveloperWithStatsResponse', () => {
      it('should include stats in response', () => {
        const developerWithStats = {
          ...mockDeveloper,
          notebookCount: 10,
          totalEarnings: 5000,
          pendingPayout: 3000,
        };

        const result =
          transformers.toDeveloperWithStatsResponse(developerWithStats);

        expect(result.notebookCount).toBe(10);
        expect(result.totalEarnings).toBe(5000);
        expect(result.pendingPayout).toBe(3000);
      });

      it('should use earningsBalance as fallback', () => {
        const developerWithBalance = {
          ...mockDeveloper,
          earningsBalance: 2000,
        };

        const result =
          transformers.toDeveloperWithStatsResponse(developerWithBalance);

        expect(result.totalEarnings).toBe(2000);
        expect(result.pendingPayout).toBe(2000);
      });
    });

    describe('toProfileUpdateResponse', () => {
      it('should transform to profile update response', () => {
        const result = transformers.toProfileUpdateResponse(mockDeveloper);

        expect(result.id).toBe('dev-uuid-1');
        expect(result.displayName).toBe('Test Developer');
        expect(result.profileComplete).toBe(true);
      });
    });
  });
});
