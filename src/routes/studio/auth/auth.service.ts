/**
 * Auth Service
 * Business logic for developer authentication
 */
import { developerRepository, isProfileComplete } from '@/repositories';
import type { Developer } from '@prisma/client';
import type { FirebaseUser } from '@/services/firebase';
import { AppError } from '@/core/errors';
import { ERROR_CODES } from '@/core/errors/errorCodes';
import { HTTP_STATUS } from '@/config/constants';
import { logger } from '@/lib/logger';
import type {
  RegisterDeveloperInput,
  UpdateProfileInput,
  CompleteProfileInput,
  DeveloperResponse,
  DeveloperWithStatsResponse,
  ProfileUpdateResponse,
} from './auth.schemas';

/**
 * Transform Developer entity to API response
 */
function toDeveloperResponse(developer: Developer): DeveloperResponse {
  return {
    id: developer.id,
    firebaseUid: developer.firebaseUid,
    email: developer.email,
    displayName: developer.name,
    avatarUrl: developer.avatarUrl,
    bio: null, // Bio not in current schema, placeholder for future
    stripeAccountId: developer.stripeAccountId,
    verified: developer.verified,
    profileComplete: isProfileComplete(developer),
    createdAt: developer.createdAt.toISOString(),
    updatedAt: developer.updatedAt.toISOString(),
  };
}

/**
 * Transform Developer with stats to API response
 */
function toDeveloperWithStatsResponse(
  developer: Developer & {
    notebookCount?: number;
    totalEarnings?: number;
    pendingPayout?: number;
  }
): DeveloperWithStatsResponse {
  return {
    ...toDeveloperResponse(developer),
    totalEarnings: developer.totalEarnings ?? developer.earningsBalance,
    pendingPayout: developer.pendingPayout ?? developer.earningsBalance,
    notebookCount: developer.notebookCount ?? 0,
  };
}

/**
 * Transform Developer to profile update response
 */
function toProfileUpdateResponse(developer: Developer): ProfileUpdateResponse {
  return {
    id: developer.id,
    displayName: developer.name,
    bio: null, // Placeholder
    avatarUrl: developer.avatarUrl,
    profileComplete: isProfileComplete(developer),
    updatedAt: developer.updatedAt.toISOString(),
  };
}

/**
 * Auth Service
 */
export const authService = {
  /**
   * Register a new developer
   * Creates developer record linked to Firebase UID
   */
  async register(
    firebaseUser: FirebaseUser,
    input: RegisterDeveloperInput
  ): Promise<DeveloperResponse> {
    const { email, displayName } = input;

    // Check if developer already exists
    const existingDeveloper = await developerRepository.findByFirebaseUid(
      firebaseUser.uid
    );

    if (existingDeveloper) {
      throw new AppError(
        ERROR_CODES.DEVELOPER_ALREADY_EXISTS,
        'Developer already registered with this account',
        HTTP_STATUS.CONFLICT
      );
    }

    // Check if email is already taken by another developer
    const emailExists = await developerRepository.existsByEmail(email);

    if (emailExists) {
      throw new AppError(
        ERROR_CODES.DEVELOPER_ALREADY_EXISTS,
        'Email is already registered',
        HTTP_STATUS.CONFLICT
      );
    }

    // Create developer
    const developer = await developerRepository.create({
      firebaseUid: firebaseUser.uid,
      email,
      name: displayName || firebaseUser.displayName,
      avatarUrl: firebaseUser.photoURL,
    });

    logger.info(
      { developerId: developer.id, email: developer.email },
      'Developer registered successfully'
    );

    return toDeveloperResponse(developer);
  },

  /**
   * Get current developer profile
   * Returns developer with stats
   */
  async getMe(firebaseUid: string): Promise<DeveloperWithStatsResponse> {
    const developer = await developerRepository.findByFirebaseUidWithStats(firebaseUid);

    if (!developer) {
      throw new AppError(
        ERROR_CODES.DEVELOPER_NOT_FOUND,
        'Developer not found - registration required',
        HTTP_STATUS.NOT_FOUND
      );
    }

    return toDeveloperWithStatsResponse(developer);
  },

  /**
   * Get developer by ID (internal use)
   */
  async getDeveloperById(id: string): Promise<Developer | null> {
    return developerRepository.findById(id);
  },

  /**
   * Update developer profile
   */
  async updateProfile(
    developer: Developer,
    input: UpdateProfileInput
  ): Promise<ProfileUpdateResponse> {
    const { displayName, avatarUrl } = input;

    const updatedDeveloper = await developerRepository.update(developer.id, {
      name: displayName,
      avatarUrl: avatarUrl ?? undefined,
    });

    logger.info(
      { developerId: developer.id },
      'Developer profile updated'
    );

    return toProfileUpdateResponse(updatedDeveloper);
  },

  /**
   * Complete developer profile
   * For first-time setup after registration
   */
  async completeProfile(
    developer: Developer,
    input: CompleteProfileInput
  ): Promise<ProfileUpdateResponse> {
    const { displayName, payoutEmail } = input;

    // Check if profile is already complete
    if (isProfileComplete(developer)) {
      logger.debug(
        { developerId: developer.id },
        'Profile already complete, updating instead'
      );
    }

    const updatedDeveloper = await developerRepository.completeProfile(developer.id, {
      name: displayName,
      payoutEmail,
    });

    logger.info(
      { developerId: developer.id },
      'Developer profile completed'
    );

    return toProfileUpdateResponse(updatedDeveloper);
  },

  /**
   * Check if developer exists by Firebase UID
   */
  async existsByFirebaseUid(firebaseUid: string): Promise<boolean> {
    return developerRepository.existsByFirebaseUid(firebaseUid);
  },
};

/**
 * Export transformers for testing
 */
export const transformers = {
  toDeveloperResponse,
  toDeveloperWithStatsResponse,
  toProfileUpdateResponse,
};

/**
 * Export type for dependency injection
 */
export type AuthService = typeof authService;
