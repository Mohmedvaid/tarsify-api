/**
 * Models Service
 * Business logic for public model browsing
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { TarsModelStatus } from '@prisma/client';
import type { ListModelsQuery } from './models.schemas';
import { NotFoundError } from '@/core/errors';

// ============================================
// Prisma Include Configuration
// ============================================

const publicModelInclude = {
  developer: {
    select: {
      id: true,
      name: true,
    },
  },
  baseModel: {
    select: {
      name: true,
      category: true,
      outputType: true,
      outputFormat: true,
      inputSchema: true,
      estimatedSeconds: true,
    },
  },
} as const;

type PublicModel = Prisma.TarsModelGetPayload<{
  include: typeof publicModelInclude;
}>;

interface PaginatedResult {
  items: PublicModel[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ============================================
// Service Functions
// ============================================

/**
 * List published models with pagination
 */
export async function listPublishedModels(
  query: ListModelsQuery
): Promise<PaginatedResult> {
  const { page, limit, category, search } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.TarsModelWhereInput = {
    status: TarsModelStatus.PUBLISHED,
    baseModel: {
      isActive: true,
      ...(category && { category }),
    },
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [models, total] = await Promise.all([
    prisma.tarsModel.findMany({
      where,
      skip,
      take: limit,
      orderBy: { publishedAt: 'desc' },
      include: publicModelInclude,
    }),
    prisma.tarsModel.count({ where }),
  ]);

  return {
    items: models,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

/**
 * Get a specific published model by slug
 */
export async function getPublishedModelBySlug(
  slug: string
): Promise<PublicModel> {
  const model = await prisma.tarsModel.findFirst({
    where: {
      slug,
      status: TarsModelStatus.PUBLISHED,
      baseModel: {
        isActive: true,
      },
    },
    include: publicModelInclude,
  });

  if (!model) {
    throw new NotFoundError('Model not found');
  }

  return model;
}
