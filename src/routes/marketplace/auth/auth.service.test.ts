/**
 * Consumer Auth Service Tests
 * Unit tests for marketplace consumer authentication service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('@/repositories', () => ({
  consumerRepository: {
    findByFirebaseUid: vi.fn(),
    findByIdWithStats: vi.fn(),
    existsByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
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

import { consumerAuthService } from './auth.service';
import { consumerRepository } from '@/repositories';

// ============================================
// Test Fixtures
// ============================================

const mockFirebaseUser = {
  uid: 'firebase-uid-123',
  email: 'consumer@example.com',
  emailVerified: true,
  photoURL: 'https://example.com/avatar.jpg',
};

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

const mockConsumerWithStats = {
  ...mockConsumer,
  runCount: 25,
  purchaseCount: 3,
  totalCreditsSpent: 500,
};

// ============================================
// Tests
// ============================================

describe('Consumer Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // register
  // ============================================
  describe('register', () => {
    it('should register a new consumer successfully', async () => {
      (
        consumerRepository.findByFirebaseUid as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);
      (
        consumerRepository.existsByEmail as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(false);
      (
        consumerRepository.create as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockConsumer);

      const result = await consumerAuthService.register(mockFirebaseUser, {
        email: 'consumer@example.com',
        name: 'Test Consumer',
      });

      expect(result.data.id).toBe(mockConsumer.id);
      expect(result.data.email).toBe('consumer@example.com');
      expect(result.data.name).toBe('Test Consumer');
    });

    it('should throw error if consumer already exists', async () => {
      (
        consumerRepository.findByFirebaseUid as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockConsumer);

      await expect(
        consumerAuthService.register(mockFirebaseUser, {
          email: 'consumer@example.com',
          name: 'Test',
        })
      ).rejects.toThrow('Account already registered');
    });

    it('should throw error if email is already taken', async () => {
      (
        consumerRepository.findByFirebaseUid as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);
      (
        consumerRepository.existsByEmail as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(true);

      await expect(
        consumerAuthService.register(mockFirebaseUser, {
          email: 'taken@example.com',
          name: 'Test',
        })
      ).rejects.toThrow('Email already in use');
    });

    it('should use photoURL from Firebase for avatarUrl', async () => {
      (
        consumerRepository.findByFirebaseUid as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);
      (
        consumerRepository.existsByEmail as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(false);
      (
        consumerRepository.create as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockConsumer);

      await consumerAuthService.register(mockFirebaseUser, {
        email: 'consumer@example.com',
        name: 'Test',
      });

      expect(consumerRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          avatarUrl: 'https://example.com/avatar.jpg',
        })
      );
    });

    it('should handle user without photoURL', async () => {
      const userWithoutPhoto = { ...mockFirebaseUser, photoURL: undefined };

      (
        consumerRepository.findByFirebaseUid as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);
      (
        consumerRepository.existsByEmail as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(false);
      (
        consumerRepository.create as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockConsumer,
        avatarUrl: null,
      });

      await consumerAuthService.register(userWithoutPhoto, {
        email: 'consumer@example.com',
        name: 'Test',
      });

      expect(consumerRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          avatarUrl: undefined,
        })
      );
    });

    it('should return consumer response with correct format', async () => {
      (
        consumerRepository.findByFirebaseUid as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);
      (
        consumerRepository.existsByEmail as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(false);
      (
        consumerRepository.create as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockConsumer);

      const result = await consumerAuthService.register(mockFirebaseUser, {
        email: 'consumer@example.com',
        name: 'Test Consumer',
      });

      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('firebaseUid');
      expect(result.data).toHaveProperty('email');
      expect(result.data).toHaveProperty('name');
      expect(result.data).toHaveProperty('creditsBalance');
      expect(result.data).toHaveProperty('createdAt');
      expect(typeof result.data.createdAt).toBe('string'); // Should be ISO string
    });
  });

  // ============================================
  // getCurrentConsumer
  // ============================================
  describe('getCurrentConsumer', () => {
    it('should return consumer with stats', async () => {
      (
        consumerRepository.findByIdWithStats as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockConsumerWithStats);

      const result = await consumerAuthService.getCurrentConsumer(mockConsumer);

      expect(result.data.id).toBe(mockConsumer.id);
      expect(result.data.runCount).toBe(25);
      expect(result.data.purchaseCount).toBe(3);
      expect(result.data.totalCreditsSpent).toBe(500);
    });

    it('should throw error if consumer not found', async () => {
      (
        consumerRepository.findByIdWithStats as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      await expect(
        consumerAuthService.getCurrentConsumer(mockConsumer)
      ).rejects.toThrow('Consumer not found');
    });

    it('should default stats to 0 if not provided', async () => {
      (
        consumerRepository.findByIdWithStats as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(
        mockConsumer // Consumer without stats
      );

      const result = await consumerAuthService.getCurrentConsumer(mockConsumer);

      expect(result.data.runCount).toBe(0);
      expect(result.data.purchaseCount).toBe(0);
      expect(result.data.totalCreditsSpent).toBe(0);
    });
  });

  // ============================================
  // updateProfile
  // ============================================
  describe('updateProfile', () => {
    it('should update consumer name', async () => {
      const updatedConsumer = { ...mockConsumer, name: 'Updated Name' };
      (
        consumerRepository.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(updatedConsumer);

      const result = await consumerAuthService.updateProfile(mockConsumer, {
        name: 'Updated Name',
      });

      expect(result.data.name).toBe('Updated Name');
      expect(consumerRepository.update).toHaveBeenCalledWith(
        mockConsumer.id,
        expect.objectContaining({ name: 'Updated Name' })
      );
    });

    it('should update consumer avatarUrl', async () => {
      const updatedConsumer = {
        ...mockConsumer,
        avatarUrl: 'https://new-avatar.jpg',
      };
      (
        consumerRepository.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(updatedConsumer);

      const result = await consumerAuthService.updateProfile(mockConsumer, {
        avatarUrl: 'https://new-avatar.jpg',
      });

      expect(result.data.avatarUrl).toBe('https://new-avatar.jpg');
    });

    it('should allow clearing avatarUrl with null', async () => {
      const updatedConsumer = { ...mockConsumer, avatarUrl: null };
      (
        consumerRepository.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(updatedConsumer);

      await consumerAuthService.updateProfile(mockConsumer, {
        avatarUrl: null,
      });

      expect(consumerRepository.update).toHaveBeenCalledWith(
        mockConsumer.id,
        expect.objectContaining({ avatarUrl: undefined })
      );
    });

    it('should update multiple fields at once', async () => {
      const updatedConsumer = {
        ...mockConsumer,
        name: 'New Name',
        avatarUrl: 'https://new.jpg',
      };
      (
        consumerRepository.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(updatedConsumer);

      await consumerAuthService.updateProfile(mockConsumer, {
        name: 'New Name',
        avatarUrl: 'https://new.jpg',
      });

      expect(consumerRepository.update).toHaveBeenCalledWith(mockConsumer.id, {
        name: 'New Name',
        avatarUrl: 'https://new.jpg',
      });
    });

    it('should return profile update response format', async () => {
      (
        consumerRepository.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockConsumer);

      const result = await consumerAuthService.updateProfile(mockConsumer, {
        name: 'Test',
      });

      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('name');
      expect(result.data).toHaveProperty('avatarUrl');
      expect(result.data).toHaveProperty('updatedAt');
      expect(typeof result.data.updatedAt).toBe('string');
    });
  });

  // ============================================
  // getCreditBalance
  // ============================================
  describe('getCreditBalance', () => {
    it('should return consumer credit balance', async () => {
      const result = await consumerAuthService.getCreditBalance(mockConsumer);

      expect(result.data.creditsBalance).toBe(1000);
    });

    it('should return 0 for consumer with no credits', async () => {
      const consumerNoCredits = { ...mockConsumer, creditsBalance: 0 };

      const result =
        await consumerAuthService.getCreditBalance(consumerNoCredits);

      expect(result.data.creditsBalance).toBe(0);
    });
  });
});
