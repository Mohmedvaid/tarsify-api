/**
 * Auth Routes Integration Tests
 * Comprehensive tests for developer authentication endpoints
 * 
 * REQUIRES: Running PostgreSQL database
 * Run `docker compose up -d` before running these tests
 * 
 * To run these tests specifically:
 * npm test -- src/routes/studio/auth/auth.test.ts
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
  console.warn('   Run `docker compose up -d` to start the database\n');
}

describe('Studio Auth Routes', () => {
  let app: FastifyInstance;
  const BASE_URL = '/api/studio/auth';

  // Test data
  const testFirebaseUid = 'test-firebase-uid-123';
  const testEmail = 'testdev@example.com';
  const mockToken = `dev_${testFirebaseUid}`;

  beforeAll(async () => {
    // Force Firebase into mock mode for testing
    firebaseAdmin.resetToMock();

    // Build the app
    app = await buildApp();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    if (!dbAvailable) return;
    
    // Clean up test data before each test
    try {
      await prisma.developer.deleteMany({
        where: {
          OR: [
            { firebaseUid: testFirebaseUid },
            { email: testEmail },
            { email: { startsWith: 'test' } },
          ],
        },
      });
    } catch {
      // Ignore errors if no records to delete
    }
  });

  // ============================================
  // Authentication Tests (no DB required)
  // ============================================
  describe('Authentication', () => {
    it('should fail without authorization header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `${BASE_URL}/register`,
        payload: { email: testEmail },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('ERR_2000');
    });

    it('should fail with invalid token format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `${BASE_URL}/register`,
        headers: { authorization: 'Bearer invalid_token' },
        payload: { email: testEmail },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should fail with Bearer without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/me`,
        headers: { authorization: 'Bearer ' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should fail with malformed authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/me`,
        headers: { authorization: 'Bearertoken' },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  // ============================================
  // Database-dependent Tests
  // ============================================
  describe('POST /auth/register', () => {
    it.skipIf(!dbAvailable)('should register a new developer', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `${BASE_URL}/register`,
        headers: { authorization: `Bearer ${mockToken}` },
        payload: { email: testEmail, displayName: 'Test Developer' },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        firebaseUid: testFirebaseUid,
        email: testEmail,
        displayName: 'Test Developer',
      });
    });

    it.skipIf(!dbAvailable)('should fail if already registered', async () => {
      // First registration
      await app.inject({
        method: 'POST',
        url: `${BASE_URL}/register`,
        headers: { authorization: `Bearer ${mockToken}` },
        payload: { email: testEmail },
      });

      // Second registration
      const response = await app.inject({
        method: 'POST',
        url: `${BASE_URL}/register`,
        headers: { authorization: `Bearer ${mockToken}` },
        payload: { email: 'another@example.com' },
      });

      expect(response.statusCode).toBe(409);
    });

    it.skipIf(!dbAvailable)('should lowercase email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `${BASE_URL}/register`,
        headers: { authorization: `Bearer ${mockToken}` },
        payload: { email: 'TEST@EXAMPLE.COM', displayName: 'Test' },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.data.email).toBe('test@example.com');
    });

    it.skipIf(!dbAvailable)('should accept special characters in displayName', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `${BASE_URL}/register`,
        headers: { authorization: `Bearer ${mockToken}` },
        payload: { email: testEmail, displayName: "John O'Brien-Smith" },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.data.displayName).toBe("John O'Brien-Smith");
    });

    it.skipIf(!dbAvailable)('should reject displayName with invalid characters', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `${BASE_URL}/register`,
        headers: { authorization: `Bearer ${mockToken}` },
        payload: { email: testEmail, displayName: '<script>alert("xss")</script>' },
      });

      expect(response.statusCode).toBe(400);
    });

    it.skipIf(!dbAvailable)('should reject invalid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `${BASE_URL}/register`,
        headers: { authorization: `Bearer ${mockToken}` },
        payload: { email: 'not-an-email' },
      });

      expect(response.statusCode).toBe(400);
    });

    it.skipIf(!dbAvailable)('should reject displayName too short', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `${BASE_URL}/register`,
        headers: { authorization: `Bearer ${mockToken}` },
        payload: { email: testEmail, displayName: 'A' },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /auth/me', () => {
    it.skipIf(!dbAvailable)('should return developer profile', async () => {
      // Create developer first
      await prisma.developer.create({
        data: {
          firebaseUid: testFirebaseUid,
          email: testEmail,
          name: 'Test Developer',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/me`,
        headers: { authorization: `Bearer ${mockToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.displayName).toBe('Test Developer');
      expect(body.data.notebookCount).toBe(0);
      expect(body.data.totalEarnings).toBe(0);
    });

    it.skipIf(!dbAvailable)('should fail if not registered', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/me`,
        headers: { authorization: 'Bearer dev_unregistered-uid' },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('ERR_4000');
    });
  });

  describe('PUT /auth/profile', () => {
    it.skipIf(!dbAvailable)('should update displayName', async () => {
      await prisma.developer.create({
        data: {
          firebaseUid: testFirebaseUid,
          email: testEmail,
          name: 'Test Developer',
        },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `${BASE_URL}/profile`,
        headers: { authorization: `Bearer ${mockToken}` },
        payload: { displayName: 'Updated Name' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.displayName).toBe('Updated Name');
    });

    it.skipIf(!dbAvailable)('should update avatarUrl', async () => {
      await prisma.developer.create({
        data: {
          firebaseUid: testFirebaseUid,
          email: testEmail,
          name: 'Test Developer',
        },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `${BASE_URL}/profile`,
        headers: { authorization: `Bearer ${mockToken}` },
        payload: { avatarUrl: 'https://example.com/avatar.png' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.avatarUrl).toBe('https://example.com/avatar.png');
    });

    it.skipIf(!dbAvailable)('should fail with empty body', async () => {
      await prisma.developer.create({
        data: {
          firebaseUid: testFirebaseUid,
          email: testEmail,
          name: 'Test Developer',
        },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `${BASE_URL}/profile`,
        headers: { authorization: `Bearer ${mockToken}` },
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });

    it.skipIf(!dbAvailable)('should fail if not registered', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `${BASE_URL}/profile`,
        headers: { authorization: 'Bearer dev_unregistered-uid' },
        payload: { displayName: 'New Name' },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /auth/complete-profile', () => {
    it.skipIf(!dbAvailable)('should complete profile', async () => {
      await prisma.developer.create({
        data: {
          firebaseUid: testFirebaseUid,
          email: testEmail,
          name: null, // Incomplete
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: `${BASE_URL}/complete-profile`,
        headers: { authorization: `Bearer ${mockToken}` },
        payload: {
          displayName: 'Complete Developer',
          payoutEmail: 'payout@example.com',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.displayName).toBe('Complete Developer');
      expect(body.data.profileComplete).toBe(true);
    });

    it.skipIf(!dbAvailable)('should require displayName', async () => {
      await prisma.developer.create({
        data: {
          firebaseUid: testFirebaseUid,
          email: testEmail,
          name: null,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: `${BASE_URL}/complete-profile`,
        headers: { authorization: `Bearer ${mockToken}` },
        payload: { payoutEmail: 'payout@example.com' },
      });

      expect(response.statusCode).toBe(400);
    });

    it.skipIf(!dbAvailable)('should validate country code length', async () => {
      await prisma.developer.create({
        data: {
          firebaseUid: testFirebaseUid,
          email: testEmail,
          name: null,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: `${BASE_URL}/complete-profile`,
        headers: { authorization: `Bearer ${mockToken}` },
        payload: { displayName: 'Test', country: 'USA' }, // Should be 2 letters
      });

      expect(response.statusCode).toBe(400);
    });

    it.skipIf(!dbAvailable)('should validate payoutEmail format', async () => {
      await prisma.developer.create({
        data: {
          firebaseUid: testFirebaseUid,
          email: testEmail,
          name: null,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: `${BASE_URL}/complete-profile`,
        headers: { authorization: `Bearer ${mockToken}` },
        payload: { displayName: 'Test', payoutEmail: 'not-an-email' },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
