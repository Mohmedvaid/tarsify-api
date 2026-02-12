import { describe, it, expect } from 'vitest';
import { FastifyRequest } from 'fastify';
import { isAuthenticatedRequest, isDeveloperRequest } from './types';

describe('Auth Type Guards', () => {
  describe('isAuthenticatedRequest', () => {
    it('should return true when request has firebaseUser', () => {
      const request = {
        firebaseUser: { uid: 'test-uid', email: 'test@example.com' },
      } as unknown as FastifyRequest;

      expect(isAuthenticatedRequest(request)).toBe(true);
    });

    it('should return false when request has no firebaseUser', () => {
      const request = {} as FastifyRequest;

      expect(isAuthenticatedRequest(request)).toBe(false);
    });

    it('should return false when firebaseUser is undefined', () => {
      const request = {
        firebaseUser: undefined,
      } as unknown as FastifyRequest;

      expect(isAuthenticatedRequest(request)).toBe(false);
    });

    it('should return true when firebaseUser is null (null !== undefined)', () => {
      const request = {
        firebaseUser: null,
      } as unknown as FastifyRequest;

      // Note: The function checks !== undefined, not truthiness
      // null !== undefined is true, so this returns true
      expect(isAuthenticatedRequest(request)).toBe(true);
    });
  });

  describe('isDeveloperRequest', () => {
    it('should return true when request has both firebaseUser and developer', () => {
      const request = {
        firebaseUser: { uid: 'test-uid', email: 'test@example.com' },
        developer: { id: 'dev-123', firebaseUid: 'test-uid' },
      } as unknown as FastifyRequest;

      expect(isDeveloperRequest(request)).toBe(true);
    });

    it('should return false when request has no firebaseUser', () => {
      const request = {
        developer: { id: 'dev-123' },
      } as unknown as FastifyRequest;

      expect(isDeveloperRequest(request)).toBe(false);
    });

    it('should return false when request has firebaseUser but no developer', () => {
      const request = {
        firebaseUser: { uid: 'test-uid', email: 'test@example.com' },
      } as unknown as FastifyRequest;

      expect(isDeveloperRequest(request)).toBe(false);
    });

    it('should return false when developer is undefined', () => {
      const request = {
        firebaseUser: { uid: 'test-uid', email: 'test@example.com' },
        developer: undefined,
      } as unknown as FastifyRequest;

      expect(isDeveloperRequest(request)).toBe(false);
    });

    it('should return false when both firebaseUser and developer are missing', () => {
      const request = {} as unknown as FastifyRequest;

      expect(isDeveloperRequest(request)).toBe(false);
    });
  });
});
