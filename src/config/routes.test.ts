/**
 * Routes Config Tests
 * Tests for route path utility and constants
 */
import { describe, it, expect } from 'vitest';
import { buildPath, API_PREFIX, ROUTE_GROUPS, ROUTES } from './routes';

describe('Routes Config', () => {
  describe('API_PREFIX', () => {
    it('should have correct API prefix', () => {
      expect(API_PREFIX).toBe('/api');
    });
  });

  describe('ROUTE_GROUPS', () => {
    it('should have all required route groups', () => {
      expect(ROUTE_GROUPS.HEALTH).toBeDefined();
      expect(ROUTE_GROUPS.STUDIO).toBeDefined();
      expect(ROUTE_GROUPS.MARKETPLACE).toBeDefined();
    });
  });

  describe('buildPath', () => {
    it('should build path with group only', () => {
      const path = buildPath(ROUTE_GROUPS.STUDIO);
      expect(path).toBe('/api/studio');
    });

    it('should build path with group and route', () => {
      const path = buildPath(ROUTE_GROUPS.STUDIO, '/auth');
      expect(path).toBe('/api/studio/auth');
    });

    it('should handle empty route string', () => {
      const path = buildPath(ROUTE_GROUPS.MARKETPLACE, '');
      expect(path).toBe('/api/marketplace');
    });

    it('should build path for health group', () => {
      const path = buildPath(ROUTE_GROUPS.HEALTH);
      expect(path).toBe('/api/health');
    });
  });

  describe('ROUTES', () => {
    it('should export API_PREFIX', () => {
      expect(ROUTES.API_PREFIX).toBe('/api');
    });

    it('should export GROUPS', () => {
      expect(ROUTES.GROUPS).toBeDefined();
      expect(ROUTES.GROUPS.STUDIO).toBe('/studio');
    });

    it('should export buildPath utility', () => {
      expect(typeof ROUTES.buildPath).toBe('function');
    });
  });
});
