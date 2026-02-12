/**
 * Tars Model Service
 * Business logic for developer tars model management
 */
import { prisma } from '@/lib/prisma';
import { TarsModelStatus, Prisma } from '@prisma/client';
import type {
  CreateTarsModelInput,
  UpdateTarsModelInput,
  ListTarsModelsQuery,
} from './tars-model.schemas';
import {
  NotFoundError,
  ConflictError,
  AppError,
  ERROR_CODES,
} from '@/core/errors';

// ============================================
// Prisma Include Configuration
// ============================================

const baseModelInclude = {
  baseModel: {
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      outputType: true,
    },
  },
} as const;

// Use Prisma's type inference for the return type
type TarsModelWithBaseModel = Prisma.TarsModelGetPayload<{
  include: typeof baseModelInclude;
}>;

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ============================================
// Service Functions
// ============================================

/**
 * Create a new tars model for a developer
 */
export async function createTarsModel(
  developerId: string,
  input: CreateTarsModelInput
): Promise<TarsModelWithBaseModel> {
  // Check if base model exists and is active
  const baseModel = await prisma.baseModel.findUnique({
    where: { id: input.baseModelId },
    select: {
      id: true,
      isActive: true,
      slug: true,
      name: true,
      category: true,
      outputType: true,
    },
  });

  if (!baseModel) {
    throw new NotFoundError('Base model not found');
  }

  if (!baseModel.isActive) {
    throw new AppError(
      ERROR_CODES.BASE_MODEL_NOT_ACTIVE,
      'Base model is not active',
      400
    );
  }

  // Check for slug uniqueness
  const existingSlug = await prisma.tarsModel.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });

  if (existingSlug) {
    throw new ConflictError(
      'Slug already exists',
      ERROR_CODES.TARS_MODEL_SLUG_EXISTS
    );
  }

  const tarsModel = await prisma.tarsModel.create({
    data: {
      developerId,
      baseModelId: input.baseModelId,
      title: input.title,
      slug: input.slug,
      description: input.description ?? null,
      configOverrides: input.configOverrides
        ? (input.configOverrides as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      status: TarsModelStatus.DRAFT,
    },
    include: baseModelInclude,
  });

  return tarsModel;
}

/**
 * List tars models for a developer with pagination
 */
export async function listTarsModels(
  developerId: string,
  query: ListTarsModelsQuery
): Promise<PaginatedResult<TarsModelWithBaseModel>> {
  const { page, limit, status } = query;
  const skip = (page - 1) * limit;

  const where = {
    developerId,
    ...(status && { status }),
  };

  const [tarsModels, total] = await Promise.all([
    prisma.tarsModel.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: baseModelInclude,
    }),
    prisma.tarsModel.count({ where }),
  ]);

  return {
    items: tarsModels,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

/**
 * Get a single tars model by ID (owned by developer)
 */
export async function getTarsModel(
  developerId: string,
  tarsModelId: string
): Promise<TarsModelWithBaseModel> {
  const tarsModel = await prisma.tarsModel.findFirst({
    where: {
      id: tarsModelId,
      developerId,
    },
    include: baseModelInclude,
  });

  if (!tarsModel) {
    throw new NotFoundError('Tars model not found');
  }

  return tarsModel;
}

/**
 * Update a tars model
 */
export async function updateTarsModel(
  developerId: string,
  tarsModelId: string,
  input: UpdateTarsModelInput
): Promise<TarsModelWithBaseModel> {
  // Check ownership
  const existing = await prisma.tarsModel.findFirst({
    where: { id: tarsModelId, developerId },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new NotFoundError('Tars model not found');
  }

  // Check slug uniqueness if changing
  if (input.slug) {
    const existingSlug = await prisma.tarsModel.findFirst({
      where: {
        slug: input.slug,
        id: { not: tarsModelId },
      },
      select: { id: true },
    });

    if (existingSlug) {
      throw new ConflictError(
        'Slug already exists',
        ERROR_CODES.TARS_MODEL_SLUG_EXISTS
      );
    }
  }

  const tarsModel = await prisma.tarsModel.update({
    where: { id: tarsModelId },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.slug && { slug: input.slug }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.configOverrides !== undefined && {
        configOverrides: input.configOverrides
          ? (input.configOverrides as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      }),
    },
    include: baseModelInclude,
  });

  return tarsModel;
}

/**
 * Delete a tars model
 */
export async function deleteTarsModel(
  developerId: string,
  tarsModelId: string
): Promise<void> {
  // Check ownership
  const existing = await prisma.tarsModel.findFirst({
    where: { id: tarsModelId, developerId },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new NotFoundError('Tars model not found');
  }

  // Cannot delete published models
  if (existing.status === TarsModelStatus.PUBLISHED) {
    throw new AppError(
      ERROR_CODES.TARS_MODEL_INVALID_STATUS,
      'Cannot delete a published model. Archive it first.',
      400
    );
  }

  await prisma.tarsModel.delete({
    where: { id: tarsModelId },
  });
}

/**
 * Publish or archive a tars model
 */
export async function publishTarsModel(
  developerId: string,
  tarsModelId: string,
  action: 'publish' | 'archive'
): Promise<TarsModelWithBaseModel> {
  // Check ownership
  const existing = await prisma.tarsModel.findFirst({
    where: { id: tarsModelId, developerId },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new NotFoundError('Tars model not found');
  }

  if (action === 'publish') {
    if (existing.status === TarsModelStatus.PUBLISHED) {
      throw new AppError(
        ERROR_CODES.TARS_MODEL_INVALID_STATUS,
        'Model is already published',
        400
      );
    }

    const tarsModel = await prisma.tarsModel.update({
      where: { id: tarsModelId },
      data: {
        status: TarsModelStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: baseModelInclude,
    });

    return tarsModel;
  } else {
    if (existing.status === TarsModelStatus.ARCHIVED) {
      throw new AppError(
        ERROR_CODES.TARS_MODEL_INVALID_STATUS,
        'Model is already archived',
        400
      );
    }

    const tarsModel = await prisma.tarsModel.update({
      where: { id: tarsModelId },
      data: {
        status: TarsModelStatus.ARCHIVED,
      },
      include: baseModelInclude,
    });

    return tarsModel;
  }
}

/**
 * List available base models for developer to choose from
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export async function listAvailableBaseModels() {
  const baseModels = await prisma.baseModel.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      category: true,
      inputSchema: true,
      outputType: true,
      outputFormat: true,
      estimatedSeconds: true,
    },
  });

  return baseModels;
}
