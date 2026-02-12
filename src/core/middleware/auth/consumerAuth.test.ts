/**
 * Consumer Auth Middleware Tests
 * Unit tests for consumer authentication middleware
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
  consumerRepository: {
    findByFirebaseUid: vi.fn(),
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

import { requireConsumer, createConsumerAuthMiddleware } from './consumerAuth';
import { firebaseAdmin } from '@/services/firebase';
import { consumerRepository } from '@/repositories';
import { UnauthorizedError, AppError } from '@/core/errors';

// ============================================
// Test Fixtures
// ============================================

const mockFirebaseUser = {
  uid: 'consumer-uid-123',
  email: 'consumer@example.com',
  emailVerified: true,
};

const mockConsumer = {
  id: 'consumer-db-uuid',
  firebaseUid: 'consumer-uid-123',
  email: 'consumer@example.com',
  name: 'Test Consumer',
  avatarUrl: null,
  creditsBalance: 1000,
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

describe('Consumer Auth Middleware', () => {
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

      await expect(requireConsumer(req, reply)).rejects.toThrow(
        UnauthorizedError
      );
    });

    it('should throw UnauthorizedError if Authorization header is not Bearer', async () => {
      const req = createMockRequest('Basic dXNlcjpwYXNz');
      const reply = createMockReply();

      await expect(requireConsumer(req, reply)).rejects.toThrow(
        UnauthorizedError
      );
    });

    it('should throw UnauthorizedError if Bearer token is empty', async () => {
      const req = createMockRequest('Bearer ');
      const reply = createMockReply();

      await expect(requireConsumer(req, reply)).rejects.toThrow(
        UnauthorizedError
      );
    });

    it('should handle single word authorization (no space)', async () => {
      const req = createMockRequest('Bearertoken123');
      const reply = createMockReply();

      await expect(requireConsumer(req, reply)).rejects.toThrow(
        UnauthorizedError
      );
    });
  });

  // ============================================
  // requireConsumer Middleware Tests
  // ============================================
  describe('requireConsumer', () => {
    it('should load consumer from database on valid token', async () => {
      const verifyTokenMock = firebaseAdmin.verifyToken as ReturnType<
        typeof vi.fn
      >;
      verifyTokenMock.mockResolvedValueOnce(mockFirebaseUser);

      const findByUidMock = consumerRepository.findByFirebaseUid as ReturnType<
        typeof vi.fn
      >;
      findByUidMock.mockResolvedValueOnce(mockConsumer);

      const req = createMockRequest('Bearer valid-token');
      const reply = createMockReply();

      await requireConsumer(req, reply);

      expect((req as any).consumer).toBeDefined();
      expect((req as any).consumer.id).toBe(mockConsumer.id);
    });

    it('should throw error if consumer not found in database', async () => {
      const verifyTokenMock = firebaseAdmin.verifyToken as ReturnType<
        typeof vi.fn
      >;
      verifyTokenMock.mockResolvedValueOnce(mockFirebaseUser);

      const findByUidMock = consumerRepository.findByFirebaseUid as ReturnType<
        typeof vi.fn
      >;
      findByUidMock.mockResolvedValueOnce(null);

      const req = createMockRequest('Bearer valid-token');
      const reply = createMockReply();

      await expect(requireConsumer(req, reply)).rejects.toThrow(
        'Account not found - registration required'
      );
    });

    it('should attach firebaseUser to request', async () => {
      const verifyTokenMock = firebaseAdmin.verifyToken as ReturnType<
        typeof vi.fn
      >;
      verifyTokenMock.mockResolvedValueOnce(mockFirebaseUser);

      const findByUidMock = consumerRepository.findByFirebaseUid as ReturnType<
        typeof vi.fn
      >;
      findByUidMock.mockResolvedValueOnce(mockConsumer);

      const req = createMockRequest('Bearer valid-token');
      const reply = createMockReply();

      await requireConsumer(req, reply);

      expect((req as any).firebaseUser).toBeDefined();
      expect((req as any).firebaseUser.uid).toBe(mockFirebaseUser.uid);
    });
  });

  // ============================================
  // createConsumerAuthMiddleware Factory Tests
  // ============================================
  describe('createConsumerAuthMiddleware', () => {
    it('should create middleware that does not require consumer when specified', async () => {
      const middleware = createConsumerAuthMiddleware({
        project: 'users',
        requireConsumer: false,
      });

      const verifyTokenMock = firebaseAdmin.verifyToken as ReturnType<
        typeof vi.fn
      >;
      verifyTokenMock.mockResolvedValueOnce(mockFirebaseUser);

      const req = createMockRequest('Bearer valid-token');
      const reply = createMockReply();

      // Should not throw even if consumer doesn't exist
      await middleware(req, reply);

      // Consumer should NOT be attached
      expect((req as any).consumer).toBeUndefined();
      // But firebaseUser should be
      expect((req as any).firebaseUser).toBeDefined();
    });

    it('should allow registration when allowRegistration is true', async () => {
      const middleware = createConsumerAuthMiddleware({
        project: 'users',
        requireConsumer: true,
        allowRegistration: true,
      });

      const verifyTokenMock = firebaseAdmin.verifyToken as ReturnType<
        typeof vi.fn
      >;
      verifyTokenMock.mockResolvedValueOnce(mockFirebaseUser);

      const findByUidMock = consumerRepository.findByFirebaseUid as ReturnType<
        typeof vi.fn
      >;
      findByUidMock.mockResolvedValueOnce(null); // Consumer doesn't exist

      const req = createMockRequest('Bearer valid-token');
      const reply = createMockReply();

      // Should NOT throw even if consumer doesn't exist (registration flow)
      await middleware(req, reply);

      // Consumer should NOT be attached
      expect((req as any).consumer).toBeUndefined();
    });

    it('should load consumer when allowRegistration is true and consumer exists', async () => {
      const middleware = createConsumerAuthMiddleware({
        project: 'users',
        requireConsumer: true,
        allowRegistration: true,
      });

      const verifyTokenMock = firebaseAdmin.verifyToken as ReturnType<
        typeof vi.fn
      >;
      verifyTokenMock.mockResolvedValueOnce(mockFirebaseUser);

      const findByUidMock = consumerRepository.findByFirebaseUid as ReturnType<
        typeof vi.fn
      >;
      findByUidMock.mockResolvedValueOnce(mockConsumer);

      const req = createMockRequest('Bearer valid-token');
      const reply = createMockReply();

      await middleware(req, reply);

      expect((req as any).consumer).toBeDefined();
      expect((req as any).consumer.id).toBe(mockConsumer.id);
    });

    it('should use specified project for token verification', async () => {
      const middleware = createConsumerAuthMiddleware({
        project: 'users',
        requireConsumer: false,
      });

      const verifyTokenMock = firebaseAdmin.verifyToken as ReturnType<
        typeof vi.fn
      >;
      verifyTokenMock.mockResolvedValueOnce(mockFirebaseUser);

      const req = createMockRequest('Bearer valid-token');
      const reply = createMockReply();

      await middleware(req, reply);

      expect(verifyTokenMock).toHaveBeenCalledWith('valid-token', 'users');
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
      verifyTokenMock.mockRejectedValueOnce(new Error('Token has expired'));

      const req = createMockRequest('Bearer expired-token');
      const reply = createMockReply();

      await expect(requireConsumer(req, reply)).rejects.toThrow(
        'Authentication token has expired'
      );
    });

    it('should throw INVALID_TOKEN for invalid tokens', async () => {
      const verifyTokenMock = firebaseAdmin.verifyToken as ReturnType<
        typeof vi.fn
      >;
      verifyTokenMock.mockRejectedValueOnce(new Error('invalid token'));

      const req = createMockRequest('Bearer invalid-token');
      const reply = createMockReply();

      await expect(requireConsumer(req, reply)).rejects.toThrow(
        'Invalid authentication token'
      );
    });

    it('should throw INVALID_TOKEN for malformed tokens', async () => {
      const verifyTokenMock = firebaseAdmin.verifyToken as ReturnType<
        typeof vi.fn
      >;
      verifyTokenMock.mockRejectedValueOnce(new Error('malformed token'));

      const req = createMockRequest('Bearer malformed-token');
      const reply = createMockReply();

      await expect(requireConsumer(req, reply)).rejects.toThrow(
        'Invalid authentication token'
      );
    });

    it('should throw INVALID_TOKEN for Invalid format errors', async () => {
      const verifyTokenMock = firebaseAdmin.verifyToken as ReturnType<
        typeof vi.fn
      >;
      verifyTokenMock.mockRejectedValueOnce(
        new Error('Invalid token structure')
      );

      const req = createMockRequest('Bearer bad-token');
      const reply = createMockReply();

      await expect(requireConsumer(req, reply)).rejects.toThrow(
        'Invalid authentication token'
      );
    });

    it('should throw generic authentication error for unknown errors', async () => {
      const verifyTokenMock = firebaseAdmin.verifyToken as ReturnType<
        typeof vi.fn
      >;
      verifyTokenMock.mockRejectedValueOnce(new Error('Something went wrong'));

      const req = createMockRequest('Bearer some-token');
      const reply = createMockReply();

      await expect(requireConsumer(req, reply)).rejects.toThrow(
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

      await expect(requireConsumer(req, reply)).rejects.toThrow(customError);
    });
  });
});
