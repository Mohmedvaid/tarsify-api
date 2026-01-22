/**
 * Auth Schemas
 * Zod validation schemas for authentication endpoints
 */
import { z } from 'zod';

// ============================================
// Common field schemas
// ============================================

/**
 * Email validation
 */
export const emailSchema = z
  .string()
  .transform((val) => val.toLowerCase().trim())
  .pipe(
    z
      .string()
      .email('Invalid email format')
      .max(255, 'Email must be 255 characters or less')
  );

/**
 * Display name validation
 */
export const displayNameSchema = z
  .string()
  .min(2, 'Display name must be at least 2 characters')
  .max(100, 'Display name must be 100 characters or less')
  .regex(/^[\w\s\-'.]+$/, 'Display name contains invalid characters')
  .transform((val) => val.trim());

/**
 * Bio validation
 */
export const bioSchema = z
  .string()
  .max(500, 'Bio must be 500 characters or less')
  .transform((val) => val.trim())
  .optional();

/**
 * Avatar URL validation
 */
export const avatarUrlSchema = z
  .string()
  .url('Invalid avatar URL')
  .max(2048, 'Avatar URL must be 2048 characters or less')
  .optional()
  .nullable();

/**
 * Payout email validation
 */
export const payoutEmailSchema = z
  .string()
  .email('Invalid payout email format')
  .max(255, 'Payout email must be 255 characters or less')
  .transform((val) => val.toLowerCase().trim())
  .optional();

// ============================================
// Request schemas
// ============================================

/**
 * Register developer request
 */
export const registerDeveloperSchema = z.object({
  email: emailSchema,
  displayName: displayNameSchema.optional(),
});

export type RegisterDeveloperInput = z.infer<typeof registerDeveloperSchema>;

/**
 * Update profile request
 */
export const updateProfileSchema = z.object({
  displayName: displayNameSchema.optional(),
  bio: bioSchema,
  avatarUrl: avatarUrlSchema,
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Complete profile request
 */
export const completeProfileSchema = z.object({
  displayName: displayNameSchema,
  bio: bioSchema,
  payoutEmail: payoutEmailSchema,
  country: z
    .string()
    .length(2, 'Country must be a 2-letter ISO code')
    .toUpperCase()
    .optional(),
});

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;

// ============================================
// Response schemas (for Fastify JSON Schema)
// ============================================

/**
 * Developer response shape
 */
export interface DeveloperResponse {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  stripeAccountId: string | null;
  verified: boolean;
  profileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Developer with stats response shape
 */
export interface DeveloperWithStatsResponse extends DeveloperResponse {
  totalEarnings: number;
  pendingPayout: number;
  notebookCount: number;
}

/**
 * Profile update response shape
 */
export interface ProfileUpdateResponse {
  id: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  profileComplete: boolean;
  updatedAt: string;
}

/**
 * JSON Schema for Fastify response validation
 */
export const developerResponseJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    firebaseUid: { type: 'string' },
    email: { type: 'string' },
    displayName: { type: ['string', 'null'] },
    avatarUrl: { type: ['string', 'null'] },
    bio: { type: ['string', 'null'] },
    stripeAccountId: { type: ['string', 'null'] },
    verified: { type: 'boolean' },
    profileComplete: { type: 'boolean' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

export const developerWithStatsJsonSchema = {
  type: 'object',
  properties: {
    ...developerResponseJsonSchema.properties,
    totalEarnings: { type: 'number' },
    pendingPayout: { type: 'number' },
    notebookCount: { type: 'number' },
  },
};

export const profileUpdateJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    displayName: { type: ['string', 'null'] },
    bio: { type: ['string', 'null'] },
    avatarUrl: { type: ['string', 'null'] },
    profileComplete: { type: 'boolean' },
    updatedAt: { type: 'string' },
  },
};
