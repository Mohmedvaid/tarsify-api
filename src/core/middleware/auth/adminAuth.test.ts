/**
 * Admin Auth Middleware Tests
 * Unit tests for admin authentication middleware
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { FastifyRequest, FastifyReply } from 'fastify';

// Mock dependencies before importing
vi.mock('@/services/firebase', () => ({
  firebaseAdmin: {
    verifyToken: vi.fn(),
  },
}));

vi.mock('@/repositories', () => ({
  developerRepository: {
    findByFirebaseUid: vi.fn(),
  },
}));

vi.mock('@/config/env', () => ({
  env: {
    ADMIN_UIDS: ['admin-uid-1', 'admin-uid-2'],
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

import { requireAdmin } from './adminAuth';
import { firebaseAdmin } from '@/services/firebase';
import { developerRepository } from '@/repositories';
import { UnauthorizedError, ForbiddenError, AppError } from '@/core/errors';

// ============================================
// Test Fixtures
// ============================================

const mockFirebaseUser = {
  uid: 'admin-uid-1',
  email: 'admin@example.com',
  emailVerified: true,
};

const mockDeveloper = {
  id: 'dev-uuid-1',
  firebaseUid: 'admin-uid-1',
  email: 'admin@example.com',
  displayName: 'Admin User',
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createMockRequest(authHeader?: string): FastifyRequest {
  return {
    headers: {
      authorization: authHeader,
    },
  } as unknown as FastifyRequest;
}

function createMockReply(): FastifyReply {
  return {} as FastifyReply;
}

// ============================================
// Tests
// ============================================

describe('Admin Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // Token Extraction Tests
  // ============================================
  describe('Token Extraction', () => {
    it('should throw UnauthorizedError if Authorization header is missing', async () => {
      const req = createMockRequest();
      const reply = createMockReply();

      await expect(requireAdmin(req, reply)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError if Authorization header is not Bearer', async () => {
      const req = createMockRequest('Basic dXNlcjpwYXNz');
      const reply = createMockReply();

      await expect(requireAdmin(req, reply)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError if Bearer token is empty', async () => {
      const req = createMockRequest('Bearer ');
      const reply = createMockReply();

      await expect(requireAdmin(req, reply)).rejects.toThrow(UnauthorizedError);
    });

    it('should handle single word authorization (no space)', async () => {
      const req = createMockRequest('Bearertoken123');
      const reply = createMockReply();

      await expect(requireAdmin(req, reply)).rejects.toThrow(UnauthorizedError);
    });
  });

  // ============================================
  // Admin UID Check Tests
  // ============================================
  describe('Admin UID Validation', () => {
    it('should allow user in ADMIN_UIDS', async () => {
      const verifyTokenMock = firebaseAdmin.verifyToken as ReturnType<
        typeof vi.fn
      >;
      verifyTokenMock.mockResolvedValueOnce(mockFirebaseUser);

      const findByUidMock = developerRepository.findByFirebaseUid as ReturnType<
        typeof vi.fn
      >;
      findByUidMock.mockResolvedValueOnce(mockDeveloper);

      const req = createMockRequest('Bearer valid-token');
      const reply = createMockReply();

      await requireAdmin(req, reply);

      expect((req as any).developer).toBeDefined();
      expect((req as any).developer.id).toBe(mockDeveloper.id);
    });

    it('should reject user not in ADMIN_UIDS with ForbiddenError', async () => {
      const verifyTokenMock = firebaseAdmin.verifyToken as ReturnType<
        typeof vi.fn
      >;
      verifyTokenMock.mockResolvedValueOnce({
        uid: 'non-admin-uid',
        email: 'user@example.com',
        emailVerified: true,
      });

      const req = createMockRequest('Bearer valid-token');
      const reply = createMockReply();

      await expect(requireAdmin(req, reply)).rejects.toThrow(ForbiddenError);
    });

    it('should reject non-admin even with valid Firebase token', async () => {
      const verifyTokenMock = firebaseAdmin.verifyToken as ReturnType<
        typeof vi.fn
      >;
      verifyTokenMock.mockResolvedValueOnce({
        uid: 'regular-user-uid',
        email: 'regular@example.com',
        emailVerified: true,
      });

      const req = createMockRequest('Bearer regular-user-token');
      const reply = createMockReply();

      await expect(requireAdmin(req, reply)).rejects.toThrow(
        'Admin access required'
      );
    });
  });

  // ============================================
  // Developer Loading Tests
  // ============================================
  describe('Developer Loading', () => {
    it('should throw AppError if developer not found in database', async () => {
      const verifyTokenMock = firebaseAdmin.verifyToken as ReturnType<
        typeof vi.fn
      >;
      verifyTokenMock.mockResolvedValueOnce(mockFirebaseUser);

      const findByUidMock = developerRepository.findByFirebaseUid as ReturnType<
        typeof vi.fn
      >;
      findByUidMock.mockResolvedValueOnce(null);

      const req = createMockRequest('Bearer valid-token');
      const reply = createMockReply();

      await expect(requireAdmin(req, reply)).rejects.toThrow(AppError);
    });

    it('should attach developer to request on success', async () => {
      const verifyTokenMock = firebaseAdmin.verifyToken as ReturnType<
        typeof vi.fn
      >;
      verifyTokenMock.mockResolvedValueOnce(mockFirebaseUser);

      const findByUidMock = developerRepository.findByFirebaseUid as ReturnType<
        typeof vi.fn
      >;
      findByUidMock.mockResolvedValueOnce(mockDeveloper);

      const req = createMockRequest('Bearer valid-token');
      const reply = createMockReply();

      await requireAdmin(req, reply);

      expect((req as any).developer.email).toBe('admin@example.com');
    });
  });

  // ============================================
  // Firebase Error Handling Tests
  // ============================================
  describe('Firebase Error Handling', () => {
    it('should throw TOKEN_EXPIRED for expired tokens', async () => {
      const verifyTokenMock = firebaseAdmin.verifyToken as ReturnType<
        typeof vi.fn
      >;
      verifyTokenMock.mockRejectedValueOnce(
        new Error('Firebase token has expired')
      );

      const req = createMockRequest('Bearer expired-token');
      const reply = createMockReply();

      await expect(requireAdmin(req, reply)).rejects.toThrow(
        'Authentication token has expired'
      );
    });

    it('should throw INVALID_TOKEN for invalid tokens', async () => {
      const verifyTokenMock = firebaseAdmin.verifyToken as ReturnType<
        typeof vi.fn
      >;
      verifyTokenMock.mockRejectedValueOnce(new Error('invalid token format'));

      const req = createMockRequest('Bearer invalid-token');
      const reply = createMockReply();

      await expect(requireAdmin(req, reply)).rejects.toThrow(
        'Invalid authentication token'
      );
    });

    it('should throw INVALID_TOKEN for malformed tokens', async () => {
      const verifyTokenMock = firebaseAdmin.verifyToken as ReturnType<
        typeof vi.fn
      >;
      verifyTokenMock.mockRejectedValueOnce(new Error('token is malformed'));

      const req = createMockRequest('Bearer malformed-token');
      const reply = createMockReply();

      await expect(requireAdmin(req, reply)).rejects.toThrow(
        'Invalid authentication token'
      );
    });

    it('should throw INVALID_TOKEN for Decoding errors', async () => {
      const verifyTokenMock = firebaseAdmin.verifyToken as ReturnType<
        typeof vi.fn
      >;
      verifyTokenMock.mockRejectedValueOnce(
        new Error('Decoding Firebase ID token failed')
      );

      const req = createMockRequest('Bearer bad-token');
      const reply = createMockReply();

      await expect(requireAdmin(req, reply)).rejects.toThrow(
        'Invalid authentication token'
      );
    });

    it('should throw generic authentication error for unknown errors', async () => {
      const verifyTokenMock = firebaseAdmin.verifyToken as ReturnType<
        typeof vi.fn
      >;
      verifyTokenMock.mockRejectedValueOnce(
        new Error('Unknown Firebase error')
      );

      const req = createMockRequest('Bearer some-token');
      const reply = createMockReply();

      await expect(requireAdmin(req, reply)).rejects.toThrow(
        'Authentication failed'
      );
    });

    it('should re-throw AppErrors without modification', async () => {
      const customError = new AppError('TEST', 'Custom error message', 500);
      const verifyTokenMock = firebaseAdmin.verifyToken as ReturnType<
        typeof vi.fn
      >;
      verifyTokenMock.mockRejectedValueOnce(customError);

      const req = createMockRequest('Bearer some-token');
      const reply = createMockReply();

      await expect(requireAdmin(req, reply)).rejects.toThrow(customError);
    });
  });
});
