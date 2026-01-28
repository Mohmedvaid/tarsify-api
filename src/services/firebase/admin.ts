/**
 * Firebase Admin SDK Service
 * Handles Firebase authentication for both user types
 * Supports mock mode for development
 */
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { deleteApp } from 'firebase-admin/app';
import { env } from '@/config/env';
import { logger } from '@/lib/logger';
import type { FirebaseUser, FirebaseProject } from './types';
import { firebaseMock } from './mock';

/**
 * Load service account from env vars
 */
function loadServiceAccount(
  projectIdEnv: string | undefined,
  privateKeyEnv: string | undefined,
  clientEmailEnv: string | undefined
): admin.ServiceAccount | null {
  if (!projectIdEnv || !privateKeyEnv || !clientEmailEnv) {
    return null;
  }

  // Skip if using placeholder values
  if (privateKeyEnv.includes('...') || privateKeyEnv.length < 500) {
    return null;
  }

  const privateKey = privateKeyEnv;
  
  // Debug: Log key format info (not the actual key!)
  logger.debug({
    hasBeginMarker: privateKey.includes('-----BEGIN PRIVATE KEY-----'),
    hasEndMarker: privateKey.includes('-----END PRIVATE KEY-----'),
    hasNewlines: privateKey.includes('\n'),
    newlineCount: (privateKey.match(/\n/g) || []).length,
    keyLength: privateKey.length,
  }, 'Private key format check');

  return {
    projectId: projectIdEnv,
    privateKey,
    clientEmail: clientEmailEnv,
  };
}

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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error({ errorMessage, errorStack }, 'Failed to initialize Firebase Admin SDK');
      throw error;
    }
  }

  /**
   * Initialize Firebase apps for both projects
   */
  private async initializeApps(): Promise<void> {
    // Initialize Users app (tarsify-users)
    const usersServiceAccount = loadServiceAccount(
      env.FIREBASE_USERS_PROJECT_ID,
      env.FIREBASE_USERS_PRIVATE_KEY,
      env.FIREBASE_USERS_CLIENT_EMAIL
    );

    if (usersServiceAccount) {
      this.usersApp = admin.initializeApp(
        {
          credential: admin.credential.cert(usersServiceAccount),
        },
        'users'
      );
      logger.debug('Firebase Users app initialized');
    } else {
      logger.warn('Firebase Users credentials not configured');
    }

    // Initialize Devs app (tarsify-devs)
    const devsServiceAccount = loadServiceAccount(
      env.FIREBASE_DEVS_PROJECT_ID,
      env.FIREBASE_DEVS_PRIVATE_KEY,
      env.FIREBASE_DEVS_CLIENT_EMAIL
    );

    if (devsServiceAccount) {
      logger.debug({
        projectId: devsServiceAccount.projectId,
        clientEmail: devsServiceAccount.clientEmail,
      }, 'Attempting to initialize Firebase Devs app');

      this.devsApp = admin.initializeApp(
        {
          credential: admin.credential.cert(devsServiceAccount),
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
      await deleteApp(this.usersApp);
      this.usersApp = null;
    }
    if (this.devsApp) {
      await deleteApp(this.devsApp);
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
