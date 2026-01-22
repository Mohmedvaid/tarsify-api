/**
 * Consumer Repository Types
 * Type definitions for consumer repository operations
 */
import type { Consumer } from '@prisma/client';

/**
 * Consumer with computed stats
 */
export interface ConsumerWithStats extends Consumer {
  runCount: number;
  purchaseCount: number;
  totalCreditsSpent: number;
  totalCreditsPurchased: number;
}

/**
 * Create consumer input
 */
export interface CreateConsumerInput {
  firebaseUid: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

/**
 * Update consumer input
 */
export interface UpdateConsumerInput {
  name?: string;
  avatarUrl?: string;
}

/**
 * Consumer profile completion check
 */
export function isConsumerProfileComplete(consumer: Consumer): boolean {
  return Boolean(consumer.name && consumer.name.trim().length > 0);
}
