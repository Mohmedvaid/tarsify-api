/**
 * Runs Service
 * Business logic for consumer model execution
 * Uses the Engine module to submit and manage jobs
 */
import { prisma } from '@/lib/prisma';
import { createEngine, type Engine } from '@/engine';
import { env } from '@/config/env';
import type { Prisma } from '@prisma/client';
import type { Consumer } from '@prisma/client';
import type { ListRunsQuery, RunModelInput } from './runs.schemas';
import { NotFoundError } from '@/core/errors';
import { logger } from '@/lib/logger';

// ============================================
// Prisma Include Configuration
// ============================================

const executionInclude = {
  tarsModel: {
    select: {
      id: true,
      slug: true,
      title: true,
      baseModel: {
        select: {
          name: true,
          category: true,
          outputType: true,
        },
      },
    },
  },
} as const;

type ExecutionWithModel = Prisma.ExecutionGetPayload<{
  include: typeof executionInclude;
}>;

interface PaginatedResult {
  items: ExecutionWithModel[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ============================================
// Create Engine Instance
// ============================================

function getEngine(): Engine {
  if (!env.RUNPOD_API_KEY) {
    throw new Error('RUNPOD_API_KEY is not configured');
  }
  return createEngine(prisma, env.RUNPOD_API_KEY);
}

// ============================================
// Service Functions
// ============================================

/**
 * Run a TarsModel
 * Creates an execution and submits to RunPod
 */
export async function runModel(
  consumer: Consumer,
  modelSlug: string,
  input: RunModelInput
): Promise<{ executionId: string; status: string; message: string }> {
  const engine = getEngine();

  // Engine handles validation, credit checks (future), and job submission
  const jobHandle = await engine.submitJob({
    consumerId: consumer.id,
    tarsModelSlug: modelSlug,
    userInputs: input.inputs,
  });

  logger.info(
    {
      executionId: jobHandle.executionId,
      consumerId: consumer.id,
      modelSlug,
    },
    'Model run started'
  );

  return {
    executionId: jobHandle.executionId,
    status: jobHandle.status,
    message: 'Run started successfully',
  };
}

/**
 * Get a specific execution
 */
export async function getExecution(
  consumer: Consumer,
  executionId: string
): Promise<ExecutionWithModel> {
  const execution = await prisma.execution.findFirst({
    where: {
      id: executionId,
      consumerId: consumer.id,
    },
    include: executionInclude,
  });

  if (!execution) {
    throw new NotFoundError('Execution not found');
  }

  return execution;
}

/**
 * List consumer's executions with pagination
 */
export async function listExecutions(
  consumer: Consumer,
  query: ListRunsQuery
): Promise<PaginatedResult> {
  const { page, limit, status } = query;
  const skip = (page - 1) * limit;

  const where = {
    consumerId: consumer.id,
    ...(status && { status }),
  };

  const [executions, total] = await Promise.all([
    prisma.execution.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: executionInclude,
    }),
    prisma.execution.count({ where }),
  ]);

  return {
    items: executions,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

/**
 * Cancel an execution
 */
export async function cancelExecution(
  consumer: Consumer,
  executionId: string
): Promise<ExecutionWithModel> {
  const engine = getEngine();

  // Engine handles ownership check and cancellation
  await engine.cancelJob(executionId, consumer.id);

  // Fetch the updated execution
  const execution = await prisma.execution.findUnique({
    where: { id: executionId },
    include: executionInclude,
  });

  if (!execution) {
    throw new NotFoundError('Execution not found');
  }

  logger.info(
    {
      executionId,
      consumerId: consumer.id,
    },
    'Execution cancelled'
  );

  return execution;
}

/**
 * Poll execution status (useful for polling endpoint)
 * Optionally syncs with RunPod for fresh status
 */
export async function pollExecution(
  consumer: Consumer,
  executionId: string,
  sync: boolean = false
): Promise<ExecutionWithModel> {
  if (sync) {
    const engine = getEngine();
    await engine.getJobStatus(executionId, consumer.id);
  }

  const execution = await prisma.execution.findFirst({
    where: {
      id: executionId,
      consumerId: consumer.id,
    },
    include: executionInclude,
  });

  if (!execution) {
    throw new NotFoundError('Execution not found');
  }

  return execution;
}
