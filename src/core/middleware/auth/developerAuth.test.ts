/**
 * Developer Auth Middleware Unit Tests
 * Tests for authentication middleware with various configurations
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '@/app';
import type { FastifyInstance } from 'fastify';
import { prisma } from '@/lib/prisma';
import { firebaseAdmin } from '@/services/firebase';

/**
 * Check if database is available (at module load time for skipIf)
 */
let dbAvailable = false;
try {
  await prisma.$queryRaw`SELECT 1`;
  dbAvailable = true;
} catch {
  console.warn('\n⚠️  Database not available - some tests will be skipped');
}

describe('Developer Auth Middleware', () => {
  let app: FastifyInstance;
  const BASE_URL = '/api/studio';

  // Test data
  const testFirebaseUid = 'auth-test-uid-456';
  const testEmail = 'authtest@example.com';
  const mockToken = `dev_${testFirebaseUid}`;

  beforeAll(async () => {
    firebaseAdmin.resetToMock();
    app = await buildApp();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    if (!dbAvailable) return;
    try {
      await prisma.developer.deleteMany({
        where: { firebaseUid: testFirebaseUid },
      });
    } catch {
      // Ignore errors
    }
  });

  describe('Token Format Validation', () => {
    it('should reject missing Authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/auth/me`,
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('ERR_2000'); // UNAUTHORIZED
    });

    it('should reject non-Bearer authorization', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/auth/me`,
        headers: { authorization: 'Basic dXNlcjpwYXNz' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject Bearer with empty token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/auth/me`,
        headers: { authorization: 'Bearer ' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject Bearer without space', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/auth/me`,
        headers: { authorization: 'Bearertoken123' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject token with wrong mock prefix', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/auth/me`,
        headers: { authorization: 'Bearer user_12345' },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('ERR_2001'); // INVALID_TOKEN
    });

    it('should reject empty uid in mock token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/auth/me`,
        headers: { authorization: 'Bearer dev_' },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Developer Lookup (requireDeveloper: true)', () => {
    it.skipIf(!dbAvailable)('should pass when developer exists', async () => {
      // Create developer first
      await prisma.developer.create({
        data: {
          firebaseUid: testFirebaseUid,
          email: testEmail,
          name: 'Auth Test Dev',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/auth/me`,
        headers: { authorization: `Bearer ${mockToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.firebaseUid).toBe(testFirebaseUid);
    });

    it.skipIf(!dbAvailable)(
      'should return 404 when developer not found',
      async () => {
        const response = await app.inject({
          method: 'GET',
          url: `${BASE_URL}/auth/me`,
          headers: { authorization: `Bearer dev_nonexistent-user` },
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.body);
        expect(body.error.code).toBe('ERR_4000'); // DEVELOPER_NOT_FOUND
      }
    );
  });

  describe('Registration Flow (allowRegistration: true)', () => {
    it.skipIf(!dbAvailable)('should allow new user to register', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `${BASE_URL}/auth/register`,
        headers: { authorization: `Bearer ${mockToken}` },
        payload: { email: testEmail, displayName: 'New Developer' },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.data.firebaseUid).toBe(testFirebaseUid);
    });

    it.skipIf(!dbAvailable)(
      'should reject registration when already registered',
      async () => {
        // Register first
        await app.inject({
          method: 'POST',
          url: `${BASE_URL}/auth/register`,
          headers: { authorization: `Bearer ${mockToken}` },
          payload: { email: testEmail, displayName: 'First Register' },
        });

        // Try to register again
        const response = await app.inject({
          method: 'POST',
          url: `${BASE_URL}/auth/register`,
          headers: { authorization: `Bearer ${mockToken}` },
          payload: { email: 'other@example.com', displayName: 'Second Try' },
        });

        expect(response.statusCode).toBe(409);
        const body = JSON.parse(response.body);
        expect(body.error.code).toBe('ERR_4001'); // DEVELOPER_ALREADY_EXISTS
      }
    );
  });

  describe('Token Error Handling', () => {
    it('should handle malformed JWT gracefully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/auth/me`,
        headers: { authorization: 'Bearer not.a.valid.jwt.token.at.all' },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('should handle very long token gracefully', async () => {
      const longToken = 'a'.repeat(10000);
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/auth/me`,
        headers: { authorization: `Bearer ${longToken}` },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle special characters in token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/auth/me`,
        headers: { authorization: 'Bearer <script>alert(1)</script>' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle null bytes in token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/auth/me`,
        headers: { authorization: 'Bearer token\x00with\x00nulls' },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Case Sensitivity', () => {
    it('should accept "Bearer" with lowercase "bearer"', async () => {
      // Using a valid mock token format
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/auth/me`,
        headers: { authorization: `bearer ${mockToken}` },
      });

      // Should pass token validation, may fail on developer lookup (404) or DB unavailable (503)
      // The important thing is it doesn't reject the header format (401)
      expect([200, 404, 503]).toContain(response.statusCode);
    });

    it('should accept "BEARER" uppercase', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/auth/me`,
        headers: { authorization: `BEARER ${mockToken}` },
      });

      expect([200, 404, 503]).toContain(response.statusCode);
    });
  });

  describe('Concurrent Authentication', () => {
    it.skipIf(!dbAvailable)(
      'should handle concurrent requests correctly',
      async () => {
        // Create developer
        await prisma.developer.create({
          data: {
            firebaseUid: testFirebaseUid,
            email: testEmail,
            name: 'Concurrent Test Dev',
          },
        });

        // Make multiple concurrent requests
        const requests = Array(10)
          .fill(null)
          .map(() =>
            app.inject({
              method: 'GET',
              url: `${BASE_URL}/auth/me`,
              headers: { authorization: `Bearer ${mockToken}` },
            })
          );

        const responses = await Promise.all(requests);

        // All should succeed
        responses.forEach((response) => {
          expect(response.statusCode).toBe(200);
        });
      }
    );
  });

  describe('Response Headers', () => {
    it('should not leak sensitive info in error responses', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/auth/me`,
        headers: { authorization: 'Bearer invalid_token' },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);

      // Should not contain stack traces in production-like errors
      expect(body.error.stack).toBeUndefined();
      // Should have standard error format
      expect(body.error.code).toBeDefined();
      expect(body.error.message).toBeDefined();
    });
  });
});
