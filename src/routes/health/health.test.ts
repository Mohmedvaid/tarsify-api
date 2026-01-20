/**
 * Health Service Unit Tests
 */
import { describe, it, expect } from 'vitest';
import { getBasicHealth, getDetailedHealth } from './health.service';

describe('Health Service', () => {
  describe('getBasicHealth', () => {
    it('should return healthy status', () => {
      const health = getBasicHealth();

      expect(health.status).toBe('healthy');
      expect(health.service).toBe('tarsify-api');
      expect(health.environment).toBe('test');
      expect(health.timestamp).toBeDefined();
      expect(health.version).toBeDefined();
      expect(typeof health.uptime).toBe('number');
    });

    it('should have increasing uptime', async () => {
      const health1 = getBasicHealth();
      await new Promise((resolve) => setTimeout(resolve, 100));
      const health2 = getBasicHealth();

      expect(health2.uptime).toBeGreaterThanOrEqual(health1.uptime);
    });
  });

  describe('getDetailedHealth', () => {
    it('should return health with checks', async () => {
      const health = await getDetailedHealth();

      expect(health.status).toBeDefined();
      expect(['healthy', 'unhealthy', 'degraded']).toContain(health.status);
      expect(health.checks).toBeDefined();
    });

    it('should include database check', async () => {
      const health = await getDetailedHealth();

      expect(health.checks?.database).toBeDefined();
      expect(health.checks?.database?.status).toBeDefined();
      expect(['pass', 'fail', 'warn']).toContain(health.checks?.database?.status);
    });

    it('should include firebase check', async () => {
      const health = await getDetailedHealth();

      expect(health.checks?.firebase).toBeDefined();
      expect(health.checks?.firebase?.status).toBeDefined();
    });
  });
});
