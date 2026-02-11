/**
 * Endpoint Service
 * Business logic for admin endpoint operations
 */
import type { RunpodEndpoint } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/core/errors/AppError';
import { ERROR_CODES } from '@/core/errors/errorCodes';
import type { CreateEndpointInput, UpdateEndpointInput, ListEndpointsQuery } from './endpoint.schemas';

// ============================================
// Types
// ============================================

export interface EndpointWithCount extends RunpodEndpoint {
  _count: {
    baseModels: number;
  };
}

export interface PaginatedEndpoints {
  data: EndpointWithCount[];
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
 * Create a new RunPod endpoint
 */
export async function createEndpoint(
  input: CreateEndpointInput
): Promise<RunpodEndpoint> {
  // Check for duplicate runpodEndpointId
  const existing = await prisma.runpodEndpoint.findUnique({
    where: { runpodEndpointId: input.runpodEndpointId },
  });

  if (existing) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      `Endpoint with RunPod ID "${input.runpodEndpointId}" already exists`,
      400
    );
  }

  return prisma.runpodEndpoint.create({
    data: {
      runpodEndpointId: input.runpodEndpointId,
      name: input.name,
      source: input.source,
      dockerImage: input.dockerImage,
      gpuType: input.gpuType,
      isActive: input.isActive,
    },
  });
}

/**
 * List endpoints with pagination
 */
export async function listEndpoints(
  query: ListEndpointsQuery
): Promise<PaginatedEndpoints> {
  const { page, limit, isActive } = query;
  const skip = (page - 1) * limit;

  const where = isActive !== undefined ? { isActive } : {};

  const [endpoints, total] = await Promise.all([
    prisma.runpodEndpoint.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { baseModels: true },
        },
      },
    }),
    prisma.runpodEndpoint.count({ where }),
  ]);

  return {
    data: endpoints,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get endpoint by ID
 */
export async function getEndpoint(id: string): Promise<EndpointWithCount> {
  const endpoint = await prisma.runpodEndpoint.findUnique({
    where: { id },
    include: {
      _count: {
        select: { baseModels: true },
      },
    },
  });

  if (!endpoint) {
    throw new AppError(
      ERROR_CODES.NOT_FOUND,
      `Endpoint not found: ${id}`,
      404
    );
  }

  return endpoint;
}

/**
 * Update endpoint
 */
export async function updateEndpoint(
  id: string,
  input: UpdateEndpointInput
): Promise<RunpodEndpoint> {
  // Verify exists
  await getEndpoint(id);

  return prisma.runpodEndpoint.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.source !== undefined && { source: input.source }),
      ...(input.dockerImage !== undefined && { dockerImage: input.dockerImage }),
      ...(input.gpuType !== undefined && { gpuType: input.gpuType }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });
}

/**
 * Soft delete endpoint (set isActive = false)
 */
export async function deleteEndpoint(id: string): Promise<RunpodEndpoint> {
  // Verify exists
  await getEndpoint(id);

  return prisma.runpodEndpoint.update({
    where: { id },
    data: { isActive: false },
  });
}
