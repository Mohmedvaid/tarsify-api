/**
 * Engine Module
 * RunPod execution engine for Tarsify
 *
 * Public API:
 * - createEngine(prisma, runpodApiKey) - Factory function
 * - Engine interface with submitJob, getJobStatus, cancelJob
 */

import type { PrismaClient, Prisma } from '@prisma/client';
import { RunPodClient } from './runpod-client';
import { mergeInputs } from './input-merger';
import {
  ModelNotFoundError,
  ModelNotPublishedError,
  EndpointNotActiveError,
  ExecutionNotFoundError,
  ExecutionNotOwnedError,
  ExecutionNotCancellableError,
} from './errors';
import {
  mapRunPodStatus,
  isTerminalStatus,
  type Engine,
  type SubmitJobInput,
  type JobHandle,
  type JobResult,
  type ConfigOverrides,
} from './types';
import { logger } from '@/lib/logger';

// ============================================
// Engine Implementation
// ============================================

class EngineImpl implements Engine {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly runpodClient: RunPodClient
  ) {}

  /**
   * Submit a job for execution
   */
  async submitJob(input: SubmitJobInput): Promise<JobHandle> {
    const { consumerId, tarsModelSlug, userInputs } = input;

    // Load the model chain: tarsModel → baseModel → endpoint
    const tarsModel = await this.prisma.tarsModel.findUnique({
      where: { slug: tarsModelSlug },
      include: {
        baseModel: {
          include: {
            endpoint: true,
          },
        },
      },
    });

    if (!tarsModel) {
      throw new ModelNotFoundError(tarsModelSlug);
    }

    if (tarsModel.status !== 'PUBLISHED') {
      throw new ModelNotPublishedError(tarsModelSlug);
    }

    const { baseModel } = tarsModel;
    const { endpoint } = baseModel;

    if (!endpoint.isActive) {
      throw new EndpointNotActiveError(endpoint.runpodEndpointId);
    }

    // Merge user inputs with developer config
    const configOverrides = tarsModel.configOverrides as ConfigOverrides | null;
    const mergedInputs = mergeInputs(userInputs, configOverrides);

    // Create execution record
    const execution = await this.prisma.execution.create({
      data: {
        consumerId,
        tarsModelId: tarsModel.id,
        endpointId: endpoint.id,
        status: 'PENDING',
        inputPayload: mergedInputs as Prisma.InputJsonValue,
      },
    });

    logger.info({
      msg: 'Submitting job to RunPod',
      executionId: execution.id,
      tarsModelSlug,
      endpointId: endpoint.runpodEndpointId,
    });

    try {
      // Submit to RunPod
      const runpodResponse = await this.runpodClient.submitJob(
        endpoint.runpodEndpointId,
        mergedInputs
      );

      // Update execution with RunPod job ID
      const status = mapRunPodStatus(runpodResponse.status);
      await this.prisma.execution.update({
        where: { id: execution.id },
        data: {
          runpodJobId: runpodResponse.id,
          status,
        },
      });

      return {
        executionId: execution.id,
        runpodJobId: runpodResponse.id,
        status,
        createdAt: execution.createdAt,
      };
    } catch (error) {
      // Mark execution as failed
      await this.prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorCode: 'RUNPOD_SUBMIT_FAILED',
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  /**
   * Get job status and result
   */
  async getJobStatus(executionId: string, consumerId: string): Promise<JobResult> {
    // Load execution with model and endpoint info
    const execution = await this.prisma.execution.findUnique({
      where: { id: executionId },
      include: {
        endpoint: true,
      },
    });

    if (!execution) {
      throw new ExecutionNotFoundError(executionId);
    }

    // Verify ownership
    if (execution.consumerId !== consumerId) {
      throw new ExecutionNotOwnedError();
    }

    // If already terminal, return cached result
    if (isTerminalStatus(execution.status)) {
      return {
        executionId: execution.id,
        status: execution.status,
        output: execution.outputPayload ?? undefined,
        error: execution.errorMessage ?? undefined,
        errorCode: execution.errorCode ?? undefined,
        executionTimeMs: execution.executionTimeMs ?? undefined,
        completedAt: execution.completedAt ?? undefined,
      };
    }

    // If no RunPod job ID yet, still pending
    if (!execution.runpodJobId) {
      return {
        executionId: execution.id,
        status: execution.status,
      };
    }

    // Poll RunPod for status
    const runpodStatus = await this.runpodClient.getJobStatus(
      execution.endpoint.runpodEndpointId,
      execution.runpodJobId
    );

    const newStatus = mapRunPodStatus(runpodStatus.status);

    // Update execution if status changed
    if (newStatus !== execution.status || isTerminalStatus(newStatus)) {
      const updateData: Parameters<typeof this.prisma.execution.update>[0]['data'] = {
        status: newStatus,
      };

      if (runpodStatus.output !== undefined) {
        updateData.outputPayload = runpodStatus.output as object;
      }

      if (runpodStatus.error) {
        updateData.errorMessage = runpodStatus.error;
        updateData.errorCode = 'RUNPOD_ERROR';
      }

      if (runpodStatus.executionTime) {
        updateData.executionTimeMs = Math.round(runpodStatus.executionTime * 1000);
      }

      if (isTerminalStatus(newStatus)) {
        updateData.completedAt = new Date();
      }

      await this.prisma.execution.update({
        where: { id: execution.id },
        data: updateData,
      });
    }

    return {
      executionId: execution.id,
      status: newStatus,
      output: runpodStatus.output ?? undefined,
      error: runpodStatus.error ?? undefined,
      executionTimeMs: runpodStatus.executionTime
        ? Math.round(runpodStatus.executionTime * 1000)
        : undefined,
      completedAt: isTerminalStatus(newStatus) ? new Date() : undefined,
    };
  }

  /**
   * Cancel a running job
   */
  async cancelJob(executionId: string, consumerId: string): Promise<void> {
    // Load execution
    const execution = await this.prisma.execution.findUnique({
      where: { id: executionId },
      include: {
        endpoint: true,
      },
    });

    if (!execution) {
      throw new ExecutionNotFoundError(executionId);
    }

    // Verify ownership
    if (execution.consumerId !== consumerId) {
      throw new ExecutionNotOwnedError();
    }

    // Check if cancellable
    if (isTerminalStatus(execution.status)) {
      throw new ExecutionNotCancellableError(execution.status);
    }

    // If we have a RunPod job ID, cancel it
    if (execution.runpodJobId) {
      await this.runpodClient.cancelJob(
        execution.endpoint.runpodEndpointId,
        execution.runpodJobId
      );
    }

    // Update execution
    await this.prisma.execution.update({
      where: { id: execution.id },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    });

    logger.info({
      msg: 'Job cancelled',
      executionId: execution.id,
      runpodJobId: execution.runpodJobId,
    });
  }
}

// ============================================
// Factory Function
// ============================================

/**
 * Create a new engine instance
 *
 * @param prisma - Prisma client
 * @param runpodApiKey - RunPod API key
 * @returns Engine instance
 */
export function createEngine(prisma: PrismaClient, runpodApiKey: string): Engine {
  const runpodClient = new RunPodClient({ apiKey: runpodApiKey });
  return new EngineImpl(prisma, runpodClient);
}

// ============================================
// Re-exports
// ============================================

export type { Engine, SubmitJobInput, JobHandle, JobResult, ConfigOverrides } from './types';
export { mapRunPodStatus, isTerminalStatus } from './types';
export { mergeInputs, processInputSchema } from './input-merger';
export { RunPodClient, createRunPodClient } from './runpod-client';
export * from './errors';
