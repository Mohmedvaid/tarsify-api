/**
 * Firebase Admin SDK Service
 * Handles Firebase authentication for both user types
 * Supports mock mode for development
 */
import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { env } from '@/config/env';
import { logger } from '@/lib/logger';
import type { FirebaseUser, FirebaseProject } from './types';
import { firebaseMock } from './mock';

/**
 * Check if mock mode is enabled
 * Reads directly from process.env to support test env stubbing
 */
function isMockModeEnabled(): boolean {
  // Check process.env first (for test stubs), then fall back to parsed env
  return process.env.FIREBASE_MOCK === 'true' || env.FIREBASE_MOCK;
}

/**
 * Validate mock mode is not enabled in production
 * @throws Error if mock mode is enabled in production
 */
function validateMockModeNotInProduction(): void {
  if (env.NODE_ENV === 'production' && isMockModeEnabled()) {
    const errorMsg =
      'FATAL: Firebase mock mode cannot be enabled in production! ' +
      'Remove FIREBASE_MOCK=true from production environment.';
    logger.fatal(errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Firebase Admin SDK wrapper
 * Manages two Firebase projects:
 * - 'users': Consumer authentication (tarsify-users)
 * - 'devs': Developer authentication (tarsify-devs)
 */
class FirebaseAdminService {
  private usersApp: App | null = null;
  private devsApp: App | null = null;
  private mockMode = false;
  private initialized = false;

  /**
   * Initialize Firebase Admin SDK
   * Call this once at application startup
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.debug('Firebase already initialized');
      return;
    }

    // SECURITY: Fail fast if mock mode is enabled in production
    validateMockModeNotInProduction();

    // Check for mock mode - read directly from process.env to support test stubbing
    this.mockMode = isMockModeEnabled();

    if (this.mockMode) {
      firebaseMock.initialize();
      logger.info('Firebase service initialized in MOCK mode');
      this.initialized = true;
      return;
    }

    // Initialize real Firebase Admin SDK
    try {
      await this.initializeApps();
      logger.info('Firebase Admin SDK initialized successfully');
      this.initialized = true;
    } catch (error) {
      logger.error({ error }, 'Failed to initialize Firebase Admin SDK');
      throw error;
    }
  }

  /**
   * Initialize Firebase apps for both projects
   */
  private async initializeApps(): Promise<void> {
    // Initialize Users app (tarsify-users) - only if credentials provided
    if (
      env.FIREBASE_USERS_PROJECT_ID &&
      env.FIREBASE_USERS_PRIVATE_KEY &&
      env.FIREBASE_USERS_CLIENT_EMAIL
    ) {
      this.usersApp = admin.initializeApp(
        {
          credential: admin.credential.cert({
            projectId: env.FIREBASE_USERS_PROJECT_ID,
            privateKey: env.FIREBASE_USERS_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: env.FIREBASE_USERS_CLIENT_EMAIL,
          }),
        },
        'users'
      );
      logger.debug('Firebase Users app initialized');
    } else {
      logger.warn('Firebase Users credentials not configured');
    }

    // Initialize Devs app (tarsify-devs) - only if credentials provided
    if (
      env.FIREBASE_DEVS_PROJECT_ID &&
      env.FIREBASE_DEVS_PRIVATE_KEY &&
      env.FIREBASE_DEVS_CLIENT_EMAIL
    ) {
      this.devsApp = admin.initializeApp(
        {
          credential: admin.credential.cert({
            projectId: env.FIREBASE_DEVS_PROJECT_ID,
            privateKey: env.FIREBASE_DEVS_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: env.FIREBASE_DEVS_CLIENT_EMAIL,
          }),
        },
        'devs'
      );
      logger.debug('Firebase Devs app initialized');
    } else {
      logger.warn('Firebase Devs credentials not configured');
    }
  }

  /**
   * Verify Firebase ID token
   * @param token - Firebase JWT token
   * @param project - Which Firebase project to verify against
   */
  async verifyToken(token: string, project: FirebaseProject): Promise<FirebaseUser> {
    // Handle mock mode
    if (this.mockMode) {
      return firebaseMock.verifyToken(token, project);
    }

    const app = project === 'users' ? this.usersApp : this.devsApp;

    if (!app) {
      throw new Error(`Firebase ${project} app not initialized`);
    }

    try {
      const auth = admin.auth(app);
      const decodedToken = await auth.verifyIdToken(token);

      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
        phoneNumber: decodedToken.phone_number,
      };
    } catch (error) {
      logger.debug({ error, project }, 'Token verification failed');
      throw error;
    }
  }

  /**
   * Check if running in mock mode
   */
  isMockMode(): boolean {
    return this.mockMode;
  }

  /**
   * Check if a specific project is configured
   */
  isProjectConfigured(project: FirebaseProject): boolean {
    if (this.mockMode) return true;
    return project === 'users' ? this.usersApp !== null : this.devsApp !== null;
  }

  /**
   * Cleanup Firebase apps (for testing)
   */
  async cleanup(): Promise<void> {
    if (this.usersApp) {
      await admin.deleteApp(this.usersApp);
      this.usersApp = null;
    }
    if (this.devsApp) {
      await admin.deleteApp(this.devsApp);
      this.devsApp = null;
    }
    this.mockMode = false;
    this.initialized = false;
  }

  /**
   * Reset to mock mode (for testing)
   */
  resetToMock(): void {
    this.mockMode = true;
    this.initialized = true;
    this.usersApp = null;
    this.devsApp = null;
  }
}

/**
 * Singleton Firebase service instance
 */
export const firebaseAdmin = new FirebaseAdminService();
