/**
 * Consumer Auth Service
 * Business logic for consumer authentication
 */
import { consumerRepository } from '@/repositories';
import type { Consumer } from '@prisma/client';
import type { FirebaseUser } from '@/services/firebase';
import { AppError } from '@/core/errors';
import { ERROR_CODES } from '@/core/errors/errorCodes';
import { HTTP_STATUS } from '@/config/constants';
import { logger } from '@/lib/logger';
import type {
  RegisterConsumerInput,
  UpdateProfileInput,
  ConsumerResponse,
  ConsumerWithStatsResponse,
  ProfileUpdateResponse,
} from './auth.schemas';

/**
 * Transform Consumer entity to API response
 */
function toConsumerResponse(consumer: Consumer): ConsumerResponse {
  return {
    id: consumer.id,
    firebaseUid: consumer.firebaseUid,
    email: consumer.email,
    name: consumer.name,
    avatarUrl: consumer.avatarUrl,
    creditsBalance: consumer.creditsBalance,
    createdAt: consumer.createdAt.toISOString(),
    updatedAt: consumer.updatedAt.toISOString(),
  };
}

/**
 * Transform Consumer with stats to API response
 */
function toConsumerWithStatsResponse(
  consumer: Consumer & {
    runCount?: number;
    purchaseCount?: number;
    totalCreditsSpent?: number;
  }
): ConsumerWithStatsResponse {
  return {
    ...toConsumerResponse(consumer),
    runCount: consumer.runCount ?? 0,
    purchaseCount: consumer.purchaseCount ?? 0,
    totalCreditsSpent: consumer.totalCreditsSpent ?? 0,
  };
}

/**
 * Transform Consumer to profile update response
 */
function toProfileUpdateResponse(consumer: Consumer): ProfileUpdateResponse {
  return {
    id: consumer.id,
    name: consumer.name,
    avatarUrl: consumer.avatarUrl,
    updatedAt: consumer.updatedAt.toISOString(),
  };
}

/**
 * Consumer Auth Service
 */
export const consumerAuthService = {
  /**
   * Register a new consumer
   * Creates consumer record linked to Firebase UID
   */
  async register(
    firebaseUser: FirebaseUser,
    input: RegisterConsumerInput
  ): Promise<{ data: ConsumerResponse }> {
    const { email, name } = input;

    // Check if consumer already exists
    const existingConsumer = await consumerRepository.findByFirebaseUid(
      firebaseUser.uid
    );

    if (existingConsumer) {
      throw new AppError(
        ERROR_CODES.CONSUMER_ALREADY_EXISTS,
        'Account already registered',
        HTTP_STATUS.CONFLICT
      );
    }

    // Check if email is already taken by another consumer
    const emailExists = await consumerRepository.existsByEmail(email);
    if (emailExists) {
      throw new AppError(
        ERROR_CODES.CONSUMER_ALREADY_EXISTS,
        'Email already in use',
        HTTP_STATUS.CONFLICT
      );
    }

    // Create consumer
    const consumer = await consumerRepository.create({
      firebaseUid: firebaseUser.uid,
      email,
      name,
      avatarUrl: firebaseUser.photoURL || undefined,
    });

    logger.info(
      { consumerId: consumer.id, email: consumer.email },
      'Consumer registered successfully'
    );

    return { data: toConsumerResponse(consumer) };
  },

  /**
   * Get current consumer profile with stats
   */
  async getCurrentConsumer(
    consumer: Consumer
  ): Promise<{ data: ConsumerWithStatsResponse }> {
    // Get consumer with stats
    const consumerWithStats = await consumerRepository.findByIdWithStats(consumer.id);

    if (!consumerWithStats) {
      throw new AppError(
        ERROR_CODES.CONSUMER_NOT_FOUND,
        'Consumer not found',
        HTTP_STATUS.NOT_FOUND
      );
    }

    return { data: toConsumerWithStatsResponse(consumerWithStats) };
  },

  /**
   * Update consumer profile
   */
  async updateProfile(
    consumer: Consumer,
    input: UpdateProfileInput
  ): Promise<{ data: ProfileUpdateResponse }> {
    // Only update fields that are provided
    const updateData: { name?: string; avatarUrl?: string } = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.avatarUrl !== undefined) {
      updateData.avatarUrl = input.avatarUrl ?? undefined;
    }

    // Update consumer
    const updatedConsumer = await consumerRepository.update(consumer.id, updateData);

    logger.info(
      { consumerId: updatedConsumer.id },
      'Consumer profile updated'
    );

    return { data: toProfileUpdateResponse(updatedConsumer) };
  },

  /**
   * Get credit balance
   */
  async getCreditBalance(consumer: Consumer): Promise<{ data: { creditsBalance: number } }> {
    return {
      data: {
        creditsBalance: consumer.creditsBalance,
      },
    };
  },
};
