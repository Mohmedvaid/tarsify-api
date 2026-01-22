/**
 * Consumer Auth Schemas
 * Zod schemas for consumer authentication endpoints
 */
import { z } from 'zod';

// ============================================
// Input Schemas
// ============================================

/**
 * Register consumer input
 */
export const registerConsumerSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email too long'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .optional(),
});

export type RegisterConsumerInput = z.infer<typeof registerConsumerSchema>;

/**
 * Update consumer profile input
 */
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .optional(),
  avatarUrl: z
    .string()
    .url('Invalid URL format')
    .max(500, 'URL too long')
    .optional()
    .nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ============================================
// Response Types
// ============================================

/**
 * Consumer response (basic)
 */
export interface ConsumerResponse {
  id: string;
  firebaseUid: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  creditsBalance: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Consumer response with stats
 */
export interface ConsumerWithStatsResponse extends ConsumerResponse {
  runCount: number;
  purchaseCount: number;
  totalCreditsSpent: number;
}

/**
 * Profile update response
 */
export interface ProfileUpdateResponse {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  updatedAt: string;
}

// ============================================
// JSON Schemas (for Fastify validation/serialization)
// ============================================

/**
 * Consumer response JSON schema
 */
export const consumerResponseJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    firebaseUid: { type: 'string' },
    email: { type: 'string', format: 'email' },
    name: { type: ['string', 'null'] },
    avatarUrl: { type: ['string', 'null'] },
    creditsBalance: { type: 'integer' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'firebaseUid', 'email', 'creditsBalance', 'createdAt', 'updatedAt'],
} as const;

/**
 * Consumer with stats response JSON schema
 */
export const consumerWithStatsResponseJsonSchema = {
  type: 'object',
  properties: {
    ...consumerResponseJsonSchema.properties,
    runCount: { type: 'integer' },
    purchaseCount: { type: 'integer' },
    totalCreditsSpent: { type: 'integer' },
  },
  required: [...consumerResponseJsonSchema.required, 'runCount', 'purchaseCount', 'totalCreditsSpent'],
} as const;

/**
 * Profile update response JSON schema
 */
export const profileUpdateResponseJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: ['string', 'null'] },
    avatarUrl: { type: ['string', 'null'] },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'updatedAt'],
} as const;

/**
 * Register consumer request JSON schema
 */
export const registerConsumerBodyJsonSchema = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email', maxLength: 255 },
    name: { type: 'string', minLength: 2, maxLength: 100 },
  },
  required: ['email'],
} as const;

/**
 * Update profile request JSON schema
 */
export const updateProfileBodyJsonSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 2, maxLength: 100 },
    avatarUrl: { type: ['string', 'null'], format: 'uri', maxLength: 500 },
  },
} as const;
