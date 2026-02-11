/**
 * Base Model Service
 * Business logic for admin base model operations
 */
import type { BaseModel, RunpodEndpoint } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/core/errors/AppError';
import { ERROR_CODES } from '@/core/errors/errorCodes';
import type { CreateBaseModelInput, UpdateBaseModelInput, ListBaseModelsQuery } from './base-model.schemas';

// ============================================
// Types
// ============================================

export interface BaseModelWithEndpoint extends BaseModel {
  endpoint: Pick<RunpodEndpoint, 'id' | 'name' | 'runpodEndpointId'>;
}

export interface PaginatedBaseModels {
  data: BaseModelWithEndpoint[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Service Functions
// ============================================

/**
 * Create a new base model
 */
export async function createBaseModel(
  input: CreateBaseModelInput
): Promise<BaseModelWithEndpoint> {
  // Verify endpoint exists
  const endpoint = await prisma.runpodEndpoint.findUnique({
    where: { id: input.endpointId },
  });

  if (!endpoint) {
    throw new AppError(
      ERROR_CODES.NOT_FOUND,
      `Endpoint not found: ${input.endpointId}`,
      404
    );
  }

  // Check for duplicate slug
  const existing = await prisma.baseModel.findUnique({
    where: { slug: input.slug },
  });

  if (existing) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      `Base model with slug "${input.slug}" already exists`,
      400
    );
  }

  return prisma.baseModel.create({
    data: {
      endpointId: input.endpointId,
      slug: input.slug,
      name: input.name,
      description: input.description,
      category: input.category,
      inputSchema: input.inputSchema,
      outputType: input.outputType,
      outputFormat: input.outputFormat,
      estimatedSeconds: input.estimatedSeconds,
      isActive: input.isActive,
    },
    include: {
      endpoint: {
        select: { id: true, name: true, runpodEndpointId: true },
      },
    },
  });
}

/**
 * List base models with pagination
 */
export async function listBaseModels(
  query: ListBaseModelsQuery
): Promise<PaginatedBaseModels> {
  const { page, limit, isActive, category, endpointId } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(isActive !== undefined && { isActive }),
    ...(category && { category }),
    ...(endpointId && { endpointId }),
  };

  const [baseModels, total] = await Promise.all([
    prisma.baseModel.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        endpoint: {
          select: { id: true, name: true, runpodEndpointId: true },
        },
      },
    }),
    prisma.baseModel.count({ where }),
  ]);

  return {
    data: baseModels,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get base model by ID
 */
export async function getBaseModel(id: string): Promise<BaseModelWithEndpoint> {
  const baseModel = await prisma.baseModel.findUnique({
    where: { id },
    include: {
      endpoint: {
        select: { id: true, name: true, runpodEndpointId: true },
      },
    },
  });

  if (!baseModel) {
    throw new AppError(
      ERROR_CODES.NOT_FOUND,
      `Base model not found: ${id}`,
      404
    );
  }

  return baseModel;
}

/**
 * Update base model
 */
export async function updateBaseModel(
  id: string,
  input: UpdateBaseModelInput
): Promise<BaseModelWithEndpoint> {
  // Verify exists
  await getBaseModel(id);

  return prisma.baseModel.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.inputSchema !== undefined && { inputSchema: input.inputSchema }),
      ...(input.outputType !== undefined && { outputType: input.outputType }),
      ...(input.outputFormat !== undefined && { outputFormat: input.outputFormat }),
      ...(input.estimatedSeconds !== undefined && { estimatedSeconds: input.estimatedSeconds }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
    include: {
      endpoint: {
        select: { id: true, name: true, runpodEndpointId: true },
      },
    },
  });
}

/**
 * Soft delete base model (set isActive = false)
 */
export async function deleteBaseModel(id: string): Promise<BaseModelWithEndpoint> {
  // Verify exists
  await getBaseModel(id);

  return prisma.baseModel.update({
    where: { id },
    data: { isActive: false },
    include: {
      endpoint: {
        select: { id: true, name: true, runpodEndpointId: true },
      },
    },
  });
}
