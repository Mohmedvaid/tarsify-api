/**
 * Firebase Service Module
 * Re-exports Firebase authentication services
 */
export { firebaseAdmin } from './admin';
export { firebaseMock } from './mock';
export type { FirebaseUser, FirebaseProject, FirebaseConfig } from './types';
export { isMockToken, extractMockUid, MOCK_TOKEN_PREFIX } from './types';
