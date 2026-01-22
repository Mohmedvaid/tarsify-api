/**
 * Execution Repository
 * Database operations for Execution entity
 */
import { prisma } from '@/lib/prisma';
import type { Execution, ExecutionStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';

/**
 * Create execution input
 */
export interface CreateExecutionInput {
  consumerId: string;
  notebookId: string;
  creditsCharged: number;
  gpuUsed?: string;
}

/**
 * Execution with notebook info
 */
export interface ExecutionWithNotebook extends Execution {
  notebook: {
    id: string;
    title: string;
    shortDescription: string | null;
    thumbnailUrl: string | null;
    gpuType: string;
    category: string;
    developer: {
      id: string;
      name: string | null;
    };
  };
}

/**
 * List executions query
 */
export interface ListExecutionsQuery {
  page?: number;
  limit?: number;
  status?: ExecutionStatus;
}

/**
 * Execution Repository
 */
export const executionRepository = {
  /**
   * Find execution by ID
   */
  async findById(id: string): Promise<Execution | null> {
    return prisma.execution.findUnique({
      where: { id },
    });
  },

  /**
   * Find execution by ID with notebook info
   */
  async findByIdWithNotebook(id: string): Promise<ExecutionWithNotebook | null> {
    return prisma.execution.findUnique({
      where: { id },
      include: {
        notebook: {
          select: {
            id: true,
            title: true,
            shortDescription: true,
            thumbnailUrl: true,
            gpuType: true,
            category: true,
            developer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  },

  /**
   * Create a new execution
   */
  async create(data: CreateExecutionInput): Promise<Execution> {
    return prisma.execution.create({
      data: {
        consumerId: data.consumerId,
        notebookId: data.notebookId,
        creditsCharged: data.creditsCharged,
        gpuUsed: data.gpuUsed,
        status: 'pending',
      },
    });
  },

  /**
   * Update execution status
   */
  async updateStatus(
    id: string,
    status: ExecutionStatus,
    additionalData?: {
      startedAt?: Date;
      completedAt?: Date;
      outputUrl?: string;
      errorMessage?: string;
    }
  ): Promise<Execution> {
    return prisma.execution.update({
      where: { id },
      data: {
        status,
        ...additionalData,
      },
    });
  },

  /**
   * List executions for a consumer
   */
  async listByConsumer(
    consumerId: string,
    query: ListExecutionsQuery
  ): Promise<{ data: ExecutionWithNotebook[]; total: number }> {
    const { page = 1, limit = 20, status } = query;

    const where: Prisma.ExecutionWhereInput = { consumerId };
    if (status) {
      where.status = status;
    }

    const [executions, total] = await Promise.all([
      prisma.execution.findMany({
        where,
        include: {
          notebook: {
            select: {
              id: true,
              title: true,
              shortDescription: true,
              thumbnailUrl: true,
              gpuType: true,
              category: true,
              developer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.execution.count({ where }),
    ]);

    return { data: executions, total };
  },

  /**
   * Get execution count for consumer
   */
  async countByConsumer(consumerId: string): Promise<number> {
    return prisma.execution.count({
      where: { consumerId },
    });
  },
};

export type ExecutionRepository = typeof executionRepository;
