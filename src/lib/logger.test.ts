/**
 * Logger Tests
 * Unit tests for logger configuration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Logger Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getLogLevel', () => {
    it('should use LOG_LEVEL env if set', async () => {
      process.env.LOG_LEVEL = 'info';
      process.env.NODE_ENV = 'production';

      // Re-import to get new module with fresh env
      const { loggerOptions } = await import('./logger');

      expect(loggerOptions.level).toBe('info');
    });
  });

  describe('createLogger', () => {
    it('should create child logger with context', async () => {
      const { createLogger } = await import('./logger');

      const childLogger = createLogger({ service: 'test' });

      expect(childLogger).toBeDefined();
      expect(typeof childLogger.info).toBe('function');
    });
  });
});
