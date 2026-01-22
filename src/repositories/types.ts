/**
 * Repository Types
 * Shared types for repository layer
 */
import type { Developer, Notebook, Consumer, Execution, Payout } from '@prisma/client';

/**
 * Developer with computed fields
 */
export interface DeveloperWithStats extends Developer {
  notebookCount?: number;
  totalEarnings?: number;
  pendingPayout?: number;
}

/**
 * Developer profile completion check
 */
export function isProfileComplete(developer: Developer): boolean {
  return Boolean(
    developer.name &&
    developer.name.trim().length > 0
  );
}

/**
 * Create developer input
 */
export interface CreateDeveloperInput {
  firebaseUid: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

/**
 * Update developer input
 */
export interface UpdateDeveloperInput {
  name?: string;
  avatarUrl?: string;
  payoutEmail?: string;
}

/**
 * Complete developer profile input
 */
export interface CompleteDeveloperProfileInput {
  name: string;
  payoutEmail?: string;
}

/**
 * Re-export Prisma types for convenience
 */
export type { Developer, Notebook, Consumer, Execution, Payout };
