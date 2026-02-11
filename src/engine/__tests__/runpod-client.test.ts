/**
 * RunPod Client Tests
 * Tests for the RunPod API client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RunPodClient } from '../runpod-client';
import { RunPodError, ERROR_CODES } from '../errors';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('RunPodClient', () => {
  let client: RunPodClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new RunPodClient({
      apiKey: 'test-api-key',
      maxRetries: 2,
      retryDelayMs: 10, // Fast retries for tests
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('submitJob', () => {
    it('should submit a job successfully', async () => {
      const mockResponse = {
        id: 'job-123',
        status: 'IN_QUEUE',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.submitJob('endpoint-id', { prompt: 'hello' });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.runpod.ai/v2/endpoint-id/run',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ input: { prompt: 'hello' } }),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should throw on 400 error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad request'),
      });

      await expect(
        client.submitJob('endpoint-id', { prompt: 'hello' })
      ).rejects.toThrow(RunPodError);
    });

    it('should retry on 500 error', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Server error'),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ id: 'job-123', status: 'IN_QUEUE' }),
        });

      const result = await client.submitJob('endpoint-id', { prompt: 'hello' });

      expect(result.id).toBe('job-123');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server error'),
      });

      await expect(
        client.submitJob('endpoint-id', { prompt: 'hello' })
      ).rejects.toThrow(RunPodError);

      // Initial + 2 retries = 3 calls
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should throw on rate limit without retry', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limited'),
      });

      await expect(
        client.submitJob('endpoint-id', { prompt: 'hello' })
      ).rejects.toThrow(RunPodError);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getJobStatus', () => {
    it('should get job status successfully', async () => {
      const mockResponse = {
        id: 'job-123',
        status: 'COMPLETED',
        output: { image: 'base64...' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.getJobStatus('endpoint-id', 'job-123');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.runpod.ai/v2/endpoint-id/status/job-123',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle failed status', async () => {
      const mockResponse = {
        id: 'job-123',
        status: 'FAILED',
        error: 'Out of memory',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.getJobStatus('endpoint-id', 'job-123');

      expect(result.status).toBe('FAILED');
      expect(result.error).toBe('Out of memory');
    });
  });

  describe('cancelJob', () => {
    it('should cancel a job successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await expect(
        client.cancelJob('endpoint-id', 'job-123')
      ).resolves.toBeUndefined();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.runpod.ai/v2/endpoint-id/cancel/job-123',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('submitJobSync', () => {
    it('should submit sync job successfully', async () => {
      const mockResponse = {
        id: 'job-123',
        status: 'COMPLETED',
        output: { result: 'done' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.submitJobSync('endpoint-id', { data: 'test' });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.runpod.ai/v2/endpoint-id/runsync',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });
});
