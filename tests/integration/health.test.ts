/**
 * Health Endpoint Tests
 * Integration tests for health check endpoints
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import {
  createTestApp,
  closeTestApp,
  testRequest,
  parseResponse,
  assertSuccessResponse,
} from '../helpers/index';

describe('Health Endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await testRequest(app, { url: '/health' });

      expect(response.statusCode).toBe(200);

      const body = parseResponse(response);
      assertSuccessResponse(body);

      expect(body.data).toMatchObject({
        status: 'healthy',
        service: 'tarsify-api',
        environment: 'test',
      });

      expect(body.data).toHaveProperty('timestamp');
      expect(body.data).toHaveProperty('version');
      expect(body.data).toHaveProperty('uptime');
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness status with checks', async () => {
      const response = await testRequest(app, { url: '/health/ready' });

      // Should be 200 (ready) or 503 (not ready) based on checks
      expect([200, 503]).toContain(response.statusCode);

      const body = parseResponse(response);

      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('data');

      if (response.statusCode === 200) {
        assertSuccessResponse(body);
        expect(body.data).toHaveProperty('checks');
      }
    });
  });

  describe('GET /health/live', () => {
    it('should return alive status', async () => {
      const response = await testRequest(app, { url: '/health/live' });

      expect(response.statusCode).toBe(200);

      const body = parseResponse(response);
      assertSuccessResponse(body);

      expect(body.data).toMatchObject({
        status: 'alive',
      });

      expect(body.data).toHaveProperty('timestamp');
    });
  });
});

describe('404 Not Found', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('should return 404 for unknown routes', async () => {
    const response = await testRequest(app, { url: '/unknown-route' });

    expect(response.statusCode).toBe(404);

    const body = parseResponse<{ success: boolean; error: { code: string } }>(response);

    expect(body.success).toBe(false);
    expect(body.error.code).toBe('ERR_1002');
  });

  it('should return 404 for unknown API routes', async () => {
    const response = await testRequest(app, { url: '/api/unknown' });

    expect(response.statusCode).toBe(404);
  });
});

describe('Response Headers', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('should include x-request-id header', async () => {
    const response = await testRequest(app, { url: '/health' });

    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('should use provided x-request-id', async () => {
    const customRequestId = 'custom-request-123';
    const response = await testRequest(app, {
      url: '/health',
      headers: { 'x-request-id': customRequestId },
    });

    expect(response.headers['x-request-id']).toBe(customRequestId);
  });

  it('should include security headers', async () => {
    const response = await testRequest(app, { url: '/health' });

    // Helmet headers
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBeDefined();
  });
});
