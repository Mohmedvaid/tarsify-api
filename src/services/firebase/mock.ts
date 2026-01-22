/**
 * Firebase Mock Service
 * Development-only mock for Firebase authentication
 * Enables local development without Firebase credentials
 */
import type { FirebaseUser, FirebaseProject } from './types';
import { isMockToken, extractMockUid, MOCK_TOKEN_PREFIX } from './types';
import { logger } from '@/lib/logger';

/**
 * Mock Firebase Admin SDK
 * Parses mock tokens in format: dev_<firebase_uid>
 */
class FirebaseMockService {
  private initialized = false;

  /**
   * Initialize mock service
   */
  initialize(): void {
    if (this.initialized) {
      logger.debug('Firebase mock service already initialized');
      return;
    }

    logger.info('🔧 Firebase MOCK mode enabled - using mock authentication');
    logger.warn('⚠️  Mock auth should ONLY be used in development');
    this.initialized = true;
  }

  /**
   * Verify mock token
   * Format: dev_<uid> or dev_<uid>_<email>
   */
  async verifyToken(
    token: string,
    _project: FirebaseProject
  ): Promise<FirebaseUser> {
    if (!this.initialized) {
      this.initialize();
    }

    if (!isMockToken(token)) {
      throw new Error(
        `Invalid mock token format. Expected: ${MOCK_TOKEN_PREFIX}<uid>`
      );
    }

    const uid = extractMockUid(token);

    if (!uid || uid.length === 0) {
      throw new Error('Mock token UID cannot be empty');
    }

    logger.debug({ uid }, 'Mock token verified');

    // Return mock user - supports optional email in format: dev_uid_email@domain.com
    const parts = uid.split('_');
    const actualUid = parts[0];
    const email = parts.length > 1 ? parts.slice(1).join('_') : `${actualUid}@mock.dev`;

    return {
      uid: actualUid,
      email,
      emailVerified: true,
      displayName: `Mock User ${actualUid}`,
      photoURL: undefined,
    };
  }

  /**
   * Check if mock mode is active
   */
  isMockMode(): boolean {
    return true;
  }
}

/**
 * Singleton mock service instance
 */
export const firebaseMock = new FirebaseMockService();
