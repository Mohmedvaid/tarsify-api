/**
 * Engine Core Tests
 * Unit tests for the engine module (mocking Prisma and RunPod client)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { createEngine, type Engine } from '../index';
import {
  ModelNotFoundError,
  ModelNotPublishedError,
  EndpointNotActiveError,
  ExecutionNotFoundError,
  ExecutionNotOwnedError,
  ExecutionNotCancellableError,
} from '../errors';

// ============================================
// Test Fixtures
// ============================================

const TEST_CONSUMER_ID = 'consumer-uuid-123';
const TEST_EXECUTION_ID = 'execution-uuid-456';
const TEST_RUNPOD_JOB_ID = 'runpod-job-789';
const TEST_ENDPOINT_ID = 'endpoint-uuid-abc';
const TEST_TARS_MODEL_ID = 'tars-model-uuid-def';
const TEST_BASE_MODEL_ID = 'base-model-uuid-ghi';
const TEST_RUNPOD_ENDPOINT_ID = 'runpod-endpoint-id';

const mockEndpoint = {
  id: TEST_ENDPOINT_ID,
  runpodEndpointId: TEST_RUNPOD_ENDPOINT_ID,
  name: 'Test Endpoint',
  source: 'HUB',
  gpuType: 'NVIDIA A40',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockBaseModel = {
  id: TEST_BASE_MODEL_ID,
  endpointId: TEST_ENDPOINT_ID,
  slug: 'chatterbox-tts',
  name: 'Chatterbox TTS',
  category: 'AUDIO',
  inputSchema: { type: 'object', properties: { text: { type: 'string' } } },
  outputType: 'AUDIO',
  outputFormat: 'wav',
  estimatedSeconds: 30,
  isActive: true,
  endpoint: mockEndpoint,
};

const mockTarsModel = {
  id: TEST_TARS_MODEL_ID,
  developerId: 'developer-uuid',
  baseModelId: TEST_BASE_MODEL_ID,
  title: 'My TTS Model',
  slug: 'my-tts-model',
  status: 'PUBLISHED',
  configOverrides: {
    defaultInputs: { voice: 'default' },
    lockedInputs: { quality: 'high' },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  baseModel: mockBaseModel,
};

const mockExecution = {
  id: TEST_EXECUTION_ID,
  consumerId: TEST_CONSUMER_ID,
  tarsModelId: TEST_TARS_MODEL_ID,
  endpointId: TEST_ENDPOINT_ID,
  status: 'PENDING',
  runpodJobId: TEST_RUNPOD_JOB_ID,
  inputPayload: { text: 'Hello world', voice: 'default', quality: 'high' },
  outputPayload: null,
  errorMessage: null,
  errorCode: null,
  createdAt: new Date(),
  completedAt: null,
  executionTimeMs: null,
  endpoint: mockEndpoint,
};

// ============================================
// Mock Setup
// ============================================

// Mock fetch for RunPod client
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Create mock Prisma client
function createMockPrisma() {
  return {
    tarsModel: {
      findUnique: vi.fn(),
    },
    execution: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  } as unknown as PrismaClient;
}

// Helper to create successful fetch response
function mockFetchSuccess(data: object) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  };
}

// ============================================
// Tests
// ============================================

describe('Engine', () => {
  let engine: Engine;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = createMockPrisma();
    engine = createEngine(mockPrisma, 'test-api-key');
  });

  describe('submitJob', () => {
    it('should submit a job successfully', async () => {
      // Mock Prisma calls
      (mockPrisma.tarsModel.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTarsModel);
      (mockPrisma.execution.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: TEST_EXECUTION_ID,
        createdAt: new Date(),
        status: 'PENDING',
      });
      (mockPrisma.execution.update as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      // Mock RunPod response
      mockFetch.mockResolvedValueOnce(
        mockFetchSuccess({
          id: TEST_RUNPOD_JOB_ID,
          status: 'IN_QUEUE',
        })
      );

      const result = await engine.submitJob({
        consumerId: TEST_CONSUMER_ID,
        tarsModelSlug: 'my-tts-model',
        userInputs: { text: 'Hello world' },
      });

      expect(result.executionId).toBe(TEST_EXECUTION_ID);
      expect(result.runpodJobId).toBe(TEST_RUNPOD_JOB_ID);
      expect(result.status).toBe('QUEUED');

      // Verify Prisma calls
      expect(mockPrisma.tarsModel.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: 'my-tts-model' },
        })
      );
      expect(mockPrisma.execution.create).toHaveBeenCalled();
      expect(mockPrisma.execution.update).toHaveBeenCalled();
    });

    it('should throw ModelNotFoundError for unknown model', async () => {
      (mockPrisma.tarsModel.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      await expect(
        engine.submitJob({
          consumerId: TEST_CONSUMER_ID,
          tarsModelSlug: 'unknown-model',
          userInputs: { text: 'Hello' },
        })
      ).rejects.toThrow(ModelNotFoundError);
    });

    it('should throw ModelNotPublishedError for draft model', async () => {
      (mockPrisma.tarsModel.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ...mockTarsModel,
        status: 'DRAFT',
      });

      await expect(
        engine.submitJob({
          consumerId: TEST_CONSUMER_ID,
          tarsModelSlug: 'my-tts-model',
          userInputs: { text: 'Hello' },
        })
      ).rejects.toThrow(ModelNotPublishedError);
    });

    it('should throw EndpointNotActiveError for inactive endpoint', async () => {
      (mockPrisma.tarsModel.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ...mockTarsModel,
        baseModel: {
          ...mockBaseModel,
          endpoint: { ...mockEndpoint, isActive: false },
        },
      });

      await expect(
        engine.submitJob({
          consumerId: TEST_CONSUMER_ID,
          tarsModelSlug: 'my-tts-model',
          userInputs: { text: 'Hello' },
        })
      ).rejects.toThrow(EndpointNotActiveError);
    });

    it('should mark execution as failed on RunPod error', async () => {
      (mockPrisma.tarsModel.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTarsModel);
      (mockPrisma.execution.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: TEST_EXECUTION_ID,
        createdAt: new Date(),
      });
      (mockPrisma.execution.update as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      // Mock RunPod failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server error'),
      });

      await expect(
        engine.submitJob({
          consumerId: TEST_CONSUMER_ID,
          tarsModelSlug: 'my-tts-model',
          userInputs: { text: 'Hello' },
        })
      ).rejects.toThrow();

      // Verify execution was marked as failed
      expect(mockPrisma.execution.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED',
            errorCode: 'RUNPOD_SUBMIT_FAILED',
          }),
        })
      );
    });

    it('should apply config overrides to inputs', async () => {
      (mockPrisma.tarsModel.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTarsModel);
      (mockPrisma.execution.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: TEST_EXECUTION_ID,
        createdAt: new Date(),
      });
      (mockPrisma.execution.update as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      mockFetch.mockResolvedValueOnce(
        mockFetchSuccess({ id: TEST_RUNPOD_JOB_ID, status: 'IN_QUEUE' })
      );

      await engine.submitJob({
        consumerId: TEST_CONSUMER_ID,
        tarsModelSlug: 'my-tts-model',
        userInputs: { text: 'Hello world' },
      });

      // Check that execution was created with merged inputs
      expect(mockPrisma.execution.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            inputPayload: expect.objectContaining({
              text: 'Hello world',
              voice: 'default', // from defaultInputs
              quality: 'high', // from lockedInputs
            }),
          }),
        })
      );
    });
  });

  describe('getJobStatus', () => {
    it('should return cached result for terminal status', async () => {
      const completedExecution = {
        ...mockExecution,
        status: 'COMPLETED',
        outputPayload: { audio: 'base64...' },
        executionTimeMs: 5000,
        completedAt: new Date(),
      };

      (mockPrisma.execution.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        completedExecution
      );

      const result = await engine.getJobStatus(TEST_EXECUTION_ID, TEST_CONSUMER_ID);

      expect(result.status).toBe('COMPLETED');
      expect(result.output).toEqual({ audio: 'base64...' });
      expect(result.executionTimeMs).toBe(5000);

      // Should NOT call RunPod
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should poll RunPod for non-terminal status', async () => {
      (mockPrisma.execution.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockExecution);
      (mockPrisma.execution.update as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      mockFetch.mockResolvedValueOnce(
        mockFetchSuccess({
          id: TEST_RUNPOD_JOB_ID,
          status: 'IN_PROGRESS',
        })
      );

      const result = await engine.getJobStatus(TEST_EXECUTION_ID, TEST_CONSUMER_ID);

      expect(result.status).toBe('RUNNING');
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should update DB when status changes to terminal', async () => {
      (mockPrisma.execution.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockExecution);
      (mockPrisma.execution.update as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      mockFetch.mockResolvedValueOnce(
        mockFetchSuccess({
          id: TEST_RUNPOD_JOB_ID,
          status: 'COMPLETED',
          output: { audio: 'generated-audio' },
          executionTime: 3.5,
        })
      );

      const result = await engine.getJobStatus(TEST_EXECUTION_ID, TEST_CONSUMER_ID);

      expect(result.status).toBe('COMPLETED');
      expect(result.output).toEqual({ audio: 'generated-audio' });

      // Verify DB update
      expect(mockPrisma.execution.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'COMPLETED',
            outputPayload: { audio: 'generated-audio' },
            completedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should throw ExecutionNotFoundError for unknown execution', async () => {
      (mockPrisma.execution.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      await expect(
        engine.getJobStatus('unknown-id', TEST_CONSUMER_ID)
      ).rejects.toThrow(ExecutionNotFoundError);
    });

    it('should throw ExecutionNotOwnedError for wrong consumer', async () => {
      (mockPrisma.execution.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockExecution);

      await expect(
        engine.getJobStatus(TEST_EXECUTION_ID, 'wrong-consumer-id')
      ).rejects.toThrow(ExecutionNotOwnedError);
    });

    it('should return pending status if no RunPod job ID yet', async () => {
      (mockPrisma.execution.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ...mockExecution,
        runpodJobId: null,
      });

      const result = await engine.getJobStatus(TEST_EXECUTION_ID, TEST_CONSUMER_ID);

      expect(result.status).toBe('PENDING');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('cancelJob', () => {
    it('should cancel a running job successfully', async () => {
      (mockPrisma.execution.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ...mockExecution,
        status: 'RUNNING',
      });
      (mockPrisma.execution.update as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      mockFetch.mockResolvedValueOnce(mockFetchSuccess({}));

      await engine.cancelJob(TEST_EXECUTION_ID, TEST_CONSUMER_ID);

      // Verify RunPod cancel was called
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/cancel/'),
        expect.objectContaining({ method: 'POST' })
      );

      // Verify DB update
      expect(mockPrisma.execution.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'CANCELLED',
            completedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should throw ExecutionNotFoundError for unknown execution', async () => {
      (mockPrisma.execution.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      await expect(
        engine.cancelJob('unknown-id', TEST_CONSUMER_ID)
      ).rejects.toThrow(ExecutionNotFoundError);
    });

    it('should throw ExecutionNotOwnedError for wrong consumer', async () => {
      (mockPrisma.execution.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockExecution);

      await expect(
        engine.cancelJob(TEST_EXECUTION_ID, 'wrong-consumer-id')
      ).rejects.toThrow(ExecutionNotOwnedError);
    });

    it('should throw ExecutionNotCancellableError for completed execution', async () => {
      (mockPrisma.execution.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ...mockExecution,
        status: 'COMPLETED',
      });

      await expect(
        engine.cancelJob(TEST_EXECUTION_ID, TEST_CONSUMER_ID)
      ).rejects.toThrow(ExecutionNotCancellableError);
    });

    it('should throw ExecutionNotCancellableError for failed execution', async () => {
      (mockPrisma.execution.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ...mockExecution,
        status: 'FAILED',
      });

      await expect(
        engine.cancelJob(TEST_EXECUTION_ID, TEST_CONSUMER_ID)
      ).rejects.toThrow(ExecutionNotCancellableError);
    });

    it('should cancel without calling RunPod if no job ID', async () => {
      (mockPrisma.execution.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ...mockExecution,
        runpodJobId: null,
        status: 'PENDING',
      });
      (mockPrisma.execution.update as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      await engine.cancelJob(TEST_EXECUTION_ID, TEST_CONSUMER_ID);

      // Should NOT call RunPod
      expect(mockFetch).not.toHaveBeenCalled();

      // But should update DB
      expect(mockPrisma.execution.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'CANCELLED',
          }),
        })
      );
    });
  });
});
