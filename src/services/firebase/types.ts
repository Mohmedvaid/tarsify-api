/**
 * Firebase Service Types
 * Type definitions for Firebase authentication
 */

/**
 * Decoded Firebase token payload
 */
export interface FirebaseUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
}

/**
 * Firebase project identifiers
 */
export type FirebaseProject = 'users' | 'devs';

/**
 * Firebase service configuration
 */
export interface FirebaseConfig {
  projectId: string;
  privateKey: string;
  clientEmail: string;
}

/**
 * Mock token format for development
 * Usage: Bearer dev_<firebase_uid>
 */
export const MOCK_TOKEN_PREFIX = 'dev_' as const;

/**
 * Check if a token is a mock token
 */
export function isMockToken(token: string): boolean {
  return token.startsWith(MOCK_TOKEN_PREFIX);
}

/**
 * Extract UID from mock token
 */
export function extractMockUid(token: string): string {
  return token.slice(MOCK_TOKEN_PREFIX.length);
}
