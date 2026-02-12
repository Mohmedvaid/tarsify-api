/**
 * Runs Service Tests
 * Unit tests for consumer model execution
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  EngineExecutionStatus,
  ModelCategory,
  OutputType,
} from '@prisma/client';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    execution: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('@/engine', () => ({
  createEngine: vi.fn(),
}));

vi.mock('@/config/env', () => ({
  env: {
    RUNPOD_API_KEY: 'test-api-key',
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { createEngine } from '@/engine';
import {
  runModel,
  getExecution,
  listExecutions,
  cancelExecution,
  pollExecution,
} from './runs.service';
import { NotFoundError } from '@/core/errors';

// ============================================
// Test Fixtures
// ============================================

const TEST_CONSUMER_ID = 'consumer-uuid-123';
const TEST_EXECUTION_ID = 'execution-uuid-456';

const mockConsumer = {
  id: TEST_CONSUMER_ID,
  firebaseUid: 'firebase-uid-123',
  email: 'consumer@example.com',
  name: 'John Consumer',
  avatarUrl: null,
  creditsBalance: 1000,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockExecution = {
  id: TEST_EXECUTION_ID,
  consumerId: TEST_CONSUMER_ID,
  tarsModelId: 'tars-model-uuid-789',
  endpointId: 'endpoint-uuid-abc',
  status: EngineExecutionStatus.PENDING,
  runpodJobId: 'runpod-job-123',
  inputPayload: { prompt: 'test prompt' },
  outputPayload: null,
  errorMessage: null,
  errorCode: null,
  createdAt: new Date(),
  completedAt: null,
  executionTimeMs: null,
  tarsModel: {
    id: 'tars-model-uuid-789',
    slug: 'anime-art',
    title: 'Anime Art Generator',
    baseModel: {
      name: 'SDXL Text to Image',
      category: ModelCategory.IMAGE,
      outputType: OutputType.IMAGE,
    },
  },
};

// Mock engine instance
const mockEngine = {
  submitJob: vi.fn(),
  getJobStatus: vi.fn(),
  cancelJob: vi.fn(),
};

// ============================================
// Tests
// ============================================

describe('Runs Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (createEngine as ReturnType<typeof vi.fn>).mockReturnValue(mockEngine);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // runModel
  // ============================================
  describe('runModel', () => {
    it('should submit a job successfully', async () => {
      mockEngine.submitJob.mockResolvedValueOnce({
        executionId: TEST_EXECUTION_ID,
        status: 'PENDING',
      });

      const result = await runModel(mockConsumer, 'anime-art', {
        inputs: { prompt: 'test' },
      });

      expect(result.executionId).toBe(TEST_EXECUTION_ID);
      expect(result.status).toBe('PENDING');
      expect(result.message).toBe('Run started successfully');
    });

    it('should call engine.submitJob with correct params', async () => {
      mockEngine.submitJob.mockResolvedValueOnce({
        executionId: TEST_EXECUTION_ID,
        status: 'PENDING',
      });

      await runModel(mockConsumer, 'anime-art', {
        inputs: { prompt: 'hello world' },
      });

      expect(mockEngine.submitJob).toHaveBeenCalledWith({
        consumerId: TEST_CONSUMER_ID,
        tarsModelSlug: 'anime-art',
        userInputs: { prompt: 'hello world' },
      });
    });

    it('should propagate engine errors', async () => {
      mockEngine.submitJob.mockRejectedValueOnce(new Error('Model not found'));

      await expect(
        runModel(mockConsumer, 'unknown-model', { inputs: {} })
      ).rejects.toThrow('Model not found');
    });

    it('should handle empty inputs', async () => {
      mockEngine.submitJob.mockResolvedValueOnce({
        executionId: TEST_EXECUTION_ID,
        status: 'PENDING',
      });

      const result = await runModel(mockConsumer, 'anime-art', { inputs: {} });

      expect(result.executionId).toBe(TEST_EXECUTION_ID);
    });

    it('should handle complex inputs', async () => {
      mockEngine.submitJob.mockResolvedValueOnce({
        executionId: TEST_EXECUTION_ID,
        status: 'PENDING',
      });

      const complexInputs = {
        prompt: 'anime girl',
        negative_prompt: 'ugly',
        width: 1024,
        height: 1024,
        steps: 30,
      };

      await runModel(mockConsumer, 'anime-art', { inputs: complexInputs });

      expect(mockEngine.submitJob).toHaveBeenCalledWith({
        consumerId: TEST_CONSUMER_ID,
        tarsModelSlug: 'anime-art',
        userInputs: complexInputs,
      });
    });
  });

  // ============================================
  // getExecution
  // ============================================
  describe('getExecution', () => {
    it('should return execution for owner', async () => {
      (
        prisma.execution.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockExecution);

      const result = await getExecution(mockConsumer, TEST_EXECUTION_ID);

      expect(result.id).toBe(TEST_EXECUTION_ID);
      expect(result.tarsModel).toBeDefined();
    });

    it('should throw NotFoundError if execution not found', async () => {
      (
        prisma.execution.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      await expect(getExecution(mockConsumer, 'unknown')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should not return executions from other consumers', async () => {
      (
        prisma.execution.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      const otherConsumer = { ...mockConsumer, id: 'other-consumer' };

      await expect(
        getExecution(otherConsumer, TEST_EXECUTION_ID)
      ).rejects.toThrow(NotFoundError);

      expect(prisma.execution.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: TEST_EXECUTION_ID,
            consumerId: 'other-consumer',
          },
        })
      );
    });

    it('should include tarsModel and baseModel info', async () => {
      (
        prisma.execution.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockExecution);

      const result = await getExecution(mockConsumer, TEST_EXECUTION_ID);

      expect(result.tarsModel.title).toBe('Anime Art Generator');
      expect(result.tarsModel.baseModel.category).toBe(ModelCategory.IMAGE);
    });
  });

  // ============================================
  // listExecutions
  // ============================================
  describe('listExecutions', () => {
    it('should list executions with pagination', async () => {
      const executions = [mockExecution];
      (
        prisma.execution.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(executions);
      (
        prisma.execution.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(1);

      const result = await listExecutions(mockConsumer, { page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should filter by status', async () => {
      (
        prisma.execution.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (
        prisma.execution.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(0);

      await listExecutions(mockConsumer, {
        page: 1,
        limit: 20,
        status: EngineExecutionStatus.COMPLETED,
      });

      expect(prisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: EngineExecutionStatus.COMPLETED,
          }),
        })
      );
    });

    it('should only list consumer own executions', async () => {
      (
        prisma.execution.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (
        prisma.execution.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(0);

      await listExecutions(mockConsumer, { page: 1, limit: 20 });

      expect(prisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            consumerId: TEST_CONSUMER_ID,
          }),
        })
      );
    });

    it('should calculate pagination correctly', async () => {
      (
        prisma.execution.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (
        prisma.execution.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(45);

      const result = await listExecutions(mockConsumer, { page: 3, limit: 10 });

      expect(prisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        })
      );
      expect(result.pages).toBe(5);
    });

    it('should order by createdAt descending', async () => {
      (
        prisma.execution.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (
        prisma.execution.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(0);

      await listExecutions(mockConsumer, { page: 1, limit: 20 });

      expect(prisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should return empty list when no executions', async () => {
      (
        prisma.execution.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);
      (
        prisma.execution.count as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(0);

      const result = await listExecutions(mockConsumer, { page: 1, limit: 20 });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  // ============================================
  // cancelExecution
  // ============================================
  describe('cancelExecution', () => {
    it('should cancel execution successfully', async () => {
      mockEngine.cancelJob.mockResolvedValueOnce(undefined);
      (
        prisma.execution.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockExecution,
        status: EngineExecutionStatus.CANCELLED,
      });

      const result = await cancelExecution(mockConsumer, TEST_EXECUTION_ID);

      expect(result.status).toBe(EngineExecutionStatus.CANCELLED);
      expect(mockEngine.cancelJob).toHaveBeenCalledWith(
        TEST_EXECUTION_ID,
        TEST_CONSUMER_ID
      );
    });

    it('should propagate engine errors', async () => {
      mockEngine.cancelJob.mockRejectedValueOnce(
        new Error('Execution not cancellable')
      );

      await expect(
        cancelExecution(mockConsumer, TEST_EXECUTION_ID)
      ).rejects.toThrow('Execution not cancellable');
    });

    it('should throw NotFoundError if execution not found after cancel', async () => {
      mockEngine.cancelJob.mockResolvedValueOnce(undefined);
      (
        prisma.execution.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      await expect(
        cancelExecution(mockConsumer, TEST_EXECUTION_ID)
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ============================================
  // pollExecution
  // ============================================
  describe('pollExecution', () => {
    it('should return execution status without sync', async () => {
      (
        prisma.execution.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockExecution);

      const result = await pollExecution(
        mockConsumer,
        TEST_EXECUTION_ID,
        false
      );

      expect(result.id).toBe(TEST_EXECUTION_ID);
      expect(mockEngine.getJobStatus).not.toHaveBeenCalled();
    });

    it('should sync with RunPod when sync=true', async () => {
      mockEngine.getJobStatus.mockResolvedValueOnce({
        status: 'COMPLETED',
        output: { image: 'base64...' },
      });
      (
        prisma.execution.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockExecution,
        status: EngineExecutionStatus.COMPLETED,
      });

      const result = await pollExecution(mockConsumer, TEST_EXECUTION_ID, true);

      expect(mockEngine.getJobStatus).toHaveBeenCalledWith(
        TEST_EXECUTION_ID,
        TEST_CONSUMER_ID
      );
      expect(result.status).toBe(EngineExecutionStatus.COMPLETED);
    });

    it('should throw NotFoundError if execution not found', async () => {
      (
        prisma.execution.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      await expect(
        pollExecution(mockConsumer, 'unknown', false)
      ).rejects.toThrow(NotFoundError);
    });

    it('should default sync to false', async () => {
      (
        prisma.execution.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockExecution);

      await pollExecution(mockConsumer, TEST_EXECUTION_ID);

      expect(mockEngine.getJobStatus).not.toHaveBeenCalled();
    });

    it('should not return executions from other consumers', async () => {
      (
        prisma.execution.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      const otherConsumer = { ...mockConsumer, id: 'other-consumer' };

      await expect(
        pollExecution(otherConsumer, TEST_EXECUTION_ID, false)
      ).rejects.toThrow(NotFoundError);
    });

    it('should propagate engine errors on sync', async () => {
      mockEngine.getJobStatus.mockRejectedValueOnce(
        new Error('RunPod API error')
      );

      await expect(
        pollExecution(mockConsumer, TEST_EXECUTION_ID, true)
      ).rejects.toThrow('RunPod API error');
    });
  });
});
