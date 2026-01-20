/**
 * Test Helpers
 * Utility functions for testing
 */
import { buildApp } from '../../src/app';
import type { FastifyInstance } from 'fastify';

/**
 * Create a test application instance
 */
export async function createTestApp(): Promise<FastifyInstance> {
  const app = await buildApp();
  await app.ready();
  return app;
}

/**
 * Close test application
 */
export async function closeTestApp(app: FastifyInstance): Promise<void> {
  await app.close();
}

/**
 * Make a test request helper
 */
export interface TestRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  payload?: unknown;
  headers?: Record<string, string>;
}

export async function testRequest(
  app: FastifyInstance,
  options: TestRequestOptions
) {
  const { method = 'GET', url, payload, headers = {} } = options;

  return app.inject({
    method,
    url,
    payload,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  });
}

/**
 * Parse JSON response
 */
export function parseResponse<T>(response: { body: string }): T {
  return JSON.parse(response.body) as T;
}

/**
 * Assert successful response structure
 */
export function assertSuccessResponse(body: unknown): asserts body is {
  success: true;
  data: unknown;
} {
  if (typeof body !== 'object' || body === null) {
    throw new Error('Response body is not an object');
  }

  const response = body as Record<string, unknown>;

  if (response.success !== true) {
    throw new Error(`Expected success to be true, got ${response.success}`);
  }
}

/**
 * Assert error response structure
 */
export function assertErrorResponse(body: unknown): asserts body is {
  success: false;
  error: { code: string; message: string };
} {
  if (typeof body !== 'object' || body === null) {
    throw new Error('Response body is not an object');
  }

  const response = body as Record<string, unknown>;

  if (response.success !== false) {
    throw new Error(`Expected success to be false, got ${response.success}`);
  }

  if (typeof response.error !== 'object' || response.error === null) {
    throw new Error('Error object is missing');
  }
}

/**
 * Generate mock consumer auth header
 */
export function mockConsumerAuth(uid: string = 'test-consumer-uid'): Record<string, string> {
  // In real tests, this would be a proper Firebase token
  return {
    'Authorization': `Bearer mock-token-${uid}`,
  };
}

/**
 * Generate mock developer auth header
 */
export function mockDeveloperAuth(uid: string = 'test-developer-uid'): Record<string, string> {
  // In real tests, this would be a proper Firebase token
  return {
    'Authorization': `Bearer mock-token-${uid}`,
  };
}
