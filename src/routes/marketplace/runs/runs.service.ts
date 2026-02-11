/**
 * Runs Service
 * Business logic for notebook execution
 * MVP: Mock execution that simulates notebook runs
 */
import { prisma } from '@/lib/prisma';
import type { Consumer } from '@prisma/client';
import {
  executionRepository,
  type ExecutionWithNotebook,
} from '@/repositories';
import {
  getComputeTierDisplay,
  getCategoryDisplay,
  getExecutionStatusDisplay,
} from '@/config/consumer';
import { PAGINATION } from '@/config/constants';
import { AppError } from '@/core/errors';
import { ERROR_CODES } from '@/core/errors/errorCodes';
import { HTTP_STATUS } from '@/config/constants';
import { logger } from '@/lib/logger';
import type {
  ListRunsQuery,
  RunResponse,
  RunStartedResponse,
} from './runs.schemas';

/**
 * Transform execution to run response
 */
function toRunResponse(execution: ExecutionWithNotebook): RunResponse {
  return {
    id: execution.id,
    status: execution.status,
    statusDisplay: getExecutionStatusDisplay(execution.status),
    creditsCharged: execution.creditsCharged,
    computeTier: execution.gpuUsed,
    computeTierDisplay: execution.gpuUsed ? getComputeTierDisplay(execution.gpuUsed) : 'Unknown',
    startedAt: execution.startedAt?.toISOString() ?? null,
    completedAt: execution.completedAt?.toISOString() ?? null,
    outputUrl: execution.outputUrl,
    errorMessage: execution.errorMessage,
    createdAt: execution.createdAt.toISOString(),
    notebook: {
      id: execution.notebook.id,
      title: execution.notebook.title,
      shortDescription: execution.notebook.shortDescription,
      thumbnailUrl: execution.notebook.thumbnailUrl,
      category: execution.notebook.category,
      categoryDisplay: getCategoryDisplay(execution.notebook.category),
      developer: {
        id: execution.notebook.developer.id,
        name: execution.notebook.developer.name,
      },
    },
  };
}

/**
 * Runs Service
 */
export const runsService = {
  /**
   * Start a notebook run
   * Deducts credits and creates execution record
   * MVP: Simulates execution completion after a delay
   */
  async runNotebook(
    consumer: Consumer,
    notebookId: string
  ): Promise<{ data: RunStartedResponse }> {
    // Get notebook to check it exists and get price
    const notebook = await prisma.notebook.findUnique({
      where: { id: notebookId },
    });

    if (!notebook) {
      throw new AppError(
        ERROR_CODES.NOTEBOOK_NOT_FOUND,
        'Notebook not found',
        HTTP_STATUS.NOT_FOUND
      );
    }

    if (notebook.status !== 'published') {
      throw new AppError(
        ERROR_CODES.NOTEBOOK_NOT_PUBLISHED,
        'This notebook is not available',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Check consumer has enough credits
    if (consumer.creditsBalance < notebook.priceCredits) {
      throw new AppError(
        ERROR_CODES.INSUFFICIENT_CREDITS,
        `Insufficient credits. You need ${notebook.priceCredits} credits but have ${consumer.creditsBalance}`,
        HTTP_STATUS.BAD_REQUEST,
        {
          required: notebook.priceCredits,
          available: consumer.creditsBalance,
        }
      );
    }

    // Deduct credits and create execution in a transaction
    const [execution, updatedConsumer] = await prisma.$transaction(async (tx) => {
      // Deduct credits
      const updated = await tx.consumer.update({
        where: { id: consumer.id },
        data: {
          creditsBalance: {
            decrement: notebook.priceCredits,
          },
        },
      });

      // Create execution
      const exec = await tx.execution.create({
        data: {
          consumerId: consumer.id,
          notebookId: notebook.id,
          creditsCharged: notebook.priceCredits,
          gpuUsed: notebook.gpuType,
          status: 'pending',
        },
      });

      // Increment notebook run count
      await tx.notebook.update({
        where: { id: notebook.id },
        data: {
          totalRuns: {
            increment: 1,
          },
        },
      });

      return [exec, updated];
    });

    logger.info(
      {
        executionId: execution.id,
        consumerId: consumer.id,
        notebookId: notebook.id,
        creditsCharged: notebook.priceCredits,
      },
      'Notebook run started'
    );

    // MVP: Simulate execution in background
    // In production, this would queue a job to RunPod
    simulateExecution(execution.id);

    return {
      data: {
        id: execution.id,
        status: execution.status,
        statusDisplay: getExecutionStatusDisplay(execution.status),
        creditsCharged: execution.creditsCharged,
        message: 'Run started successfully',
        remainingCredits: updatedConsumer.creditsBalance,
      },
    };
  },

  /**
   * Get a specific run
   */
  async getRun(
    consumer: Consumer,
    runId: string
  ): Promise<{ data: RunResponse }> {
    const execution = await executionRepository.findByIdWithNotebook(runId);

    if (!execution) {
      throw new AppError(
        ERROR_CODES.EXECUTION_NOT_FOUND,
        'Run not found',
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Ensure consumer owns this execution
    if (execution.consumerId !== consumer.id) {
      throw new AppError(
        ERROR_CODES.EXECUTION_NOT_FOUND,
        'Run not found',
        HTTP_STATUS.NOT_FOUND
      );
    }

    return { data: toRunResponse(execution) };
  },

  /**
   * List consumer's runs
   */
  async listRuns(
    consumer: Consumer,
    query: ListRunsQuery
  ): Promise<{
    data: RunResponse[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = query.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION.DEFAULT_LIMIT;

    const { data, total } = await executionRepository.listByConsumer(consumer.id, {
      page,
      limit,
      status: query.status,
    });

    return {
      data: data.map(toRunResponse),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};

/**
 * Simulate notebook execution (MVP)
 * In production, this would be replaced with actual RunPod execution
 */
async function simulateExecution(executionId: string): Promise<void> {
  try {
    // Update to running after 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await executionRepository.updateStatus(executionId, 'running', {
      startedAt: new Date(),
    });

    logger.debug({ executionId }, 'Execution started (simulated)');

    // Simulate processing time (3-5 seconds)
    const processingTime = 3000 + Math.random() * 2000;
    await new Promise((resolve) => setTimeout(resolve, processingTime));

    // 90% success rate for demo
    const success = Math.random() > 0.1;

    if (success) {
      await executionRepository.updateStatus(executionId, 'completed', {
        completedAt: new Date(),
        outputUrl: `https://storage.tarsify.com/outputs/${executionId}/result.json`,
      });
      logger.info({ executionId }, 'Execution completed (simulated)');
    } else {
      await executionRepository.updateStatus(executionId, 'failed', {
        completedAt: new Date(),
        errorMessage: 'Simulated execution failure for testing',
      });
      logger.warn({ executionId }, 'Execution failed (simulated)');
    }
  } catch (error) {
    logger.error({ executionId, error }, 'Error in simulated execution');
    await executionRepository.updateStatus(executionId, 'failed', {
      completedAt: new Date(),
      errorMessage: 'Internal execution error',
    });
  }
}
