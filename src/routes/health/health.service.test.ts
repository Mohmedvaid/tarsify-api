/**
 * Health Service Tests
 * Unit tests for health check service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock env config - must use inline values to avoid hoisting issues
vi.mock('@/config/env', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgres://test',
    FIREBASE_USERS_PROJECT_ID: 'test-users',
    FIREBASE_DEVS_PROJECT_ID: 'test-devs',
  },
}));

// Mock constants
vi.mock('@/config/constants', () => ({
  APP: {
    NAME: 'tarsify-api',
    VERSION: '1.0.0',
  },
}));

import { getBasicHealth, getDetailedHealth } from './health.service';

describe('Health Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // getBasicHealth
  // ============================================
  describe('getBasicHealth', () => {
    it('should return healthy status', () => {
      const result = getBasicHealth();

      expect(result.status).toBe('healthy');
      expect(result.service).toBe('tarsify-api');
      expect(result.version).toBe('1.0.0');
      expect(result.environment).toBe('test');
    });

    it('should include timestamp', () => {
      const result = getBasicHealth();

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).toBeLessThanOrEqual(
        Date.now()
      );
    });

    it('should include uptime in seconds', () => {
      const result = getBasicHealth();

      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================
  // getDetailedHealth
  // ============================================
  describe('getDetailedHealth', () => {
    it('should return detailed health with checks', async () => {
      const result = await getDetailedHealth();

      expect(result.status).toBeDefined();
      expect(result.checks).toBeDefined();
      expect(result.checks?.database).toBeDefined();
      expect(result.checks?.firebase).toBeDefined();
    });

    it('should report database as pass when configured', async () => {
      const result = await getDetailedHealth();

      expect(result.checks?.database?.status).toBe('pass');
      expect(result.checks?.database?.message).toBe(
        'Database connection ready'
      );
    });

    it('should report firebase as pass when configured', async () => {
      const result = await getDetailedHealth();

      expect(result.checks?.firebase?.status).toBe('pass');
      expect(result.checks?.firebase?.message).toBe(
        'Firebase configuration ready'
      );
    });

    it('should include latency in checks', async () => {
      const result = await getDetailedHealth();

      expect(result.checks?.database?.latency).toBeGreaterThanOrEqual(0);
      expect(result.checks?.firebase?.latency).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================
  // Health status determination
  // ============================================
  describe('Health Status Determination', () => {
    it('should be healthy when all checks pass', async () => {
      const result = await getDetailedHealth();

      // With our mock CONFIG, all should pass
      expect(result.status).toBe('healthy');
    });
  });
});
