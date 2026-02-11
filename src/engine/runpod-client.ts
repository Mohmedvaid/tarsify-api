/**
 * RunPod Client
 * HTTP wrapper for RunPod Serverless API
 */

import { logger } from '@/lib/logger';
import { RunPodError, ERROR_CODES } from './errors';
import type {
  RunPodRunResponse,
  RunPodStatusResponse,
  RunPodSyncResponse,
} from './types';

// ============================================
// Configuration
// ============================================

const RUNPOD_BASE_URL = 'https://api.runpod.ai/v2';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// ============================================
// Types
// ============================================

export interface RunPodClientOptions {
  apiKey: string;
  baseUrl?: string;
  maxRetries?: number;
  retryDelayMs?: number;
}

// ============================================
// RunPod Client Class
// ============================================

/**
 * RunPod Serverless API client
 */
export class RunPodClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(options: RunPodClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? RUNPOD_BASE_URL;
    this.maxRetries = options.maxRetries ?? MAX_RETRIES;
    this.retryDelayMs = options.retryDelayMs ?? RETRY_DELAY_MS;
  }

  /**
   * Submit an async job
   * POST /{endpointId}/run
   */
  async submitJob(
    endpointId: string,
    input: Record<string, unknown>
  ): Promise<RunPodRunResponse> {
    const url = `${this.baseUrl}/${endpointId}/run`;
    const startTime = Date.now();

    try {
      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        body: JSON.stringify({ input }),
      });

      const data = (await response.json()) as RunPodRunResponse;

      logger.info({
        msg: 'RunPod job submitted',
        endpointId,
        jobId: data.id,
        status: data.status,
        durationMs: Date.now() - startTime,
      });

      return data;
    } catch (error) {
      logger.error({
        msg: 'RunPod submitJob failed',
        endpointId,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Submit a sync job (blocks until complete, 30s timeout)
   * POST /{endpointId}/runsync
   */
  async submitJobSync(
    endpointId: string,
    input: Record<string, unknown>
  ): Promise<RunPodSyncResponse> {
    const url = `${this.baseUrl}/${endpointId}/runsync`;
    const startTime = Date.now();

    try {
      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        body: JSON.stringify({ input }),
      });

      const data = (await response.json()) as RunPodSyncResponse;

      logger.info({
        msg: 'RunPod sync job completed',
        endpointId,
        jobId: data.id,
        status: data.status,
        durationMs: Date.now() - startTime,
      });

      return data;
    } catch (error) {
      logger.error({
        msg: 'RunPod submitJobSync failed',
        endpointId,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Get job status
   * GET /{endpointId}/status/{jobId}
   */
  async getJobStatus(
    endpointId: string,
    jobId: string
  ): Promise<RunPodStatusResponse> {
    const url = `${this.baseUrl}/${endpointId}/status/${jobId}`;
    const startTime = Date.now();

    try {
      const response = await this.fetchWithRetry(url, {
        method: 'GET',
      });

      const data = (await response.json()) as RunPodStatusResponse;

      logger.debug({
        msg: 'RunPod job status',
        endpointId,
        jobId,
        status: data.status,
        durationMs: Date.now() - startTime,
      });

      return data;
    } catch (error) {
      logger.error({
        msg: 'RunPod getJobStatus failed',
        endpointId,
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Cancel a job
   * POST /{endpointId}/cancel/{jobId}
   */
  async cancelJob(endpointId: string, jobId: string): Promise<void> {
    const url = `${this.baseUrl}/${endpointId}/cancel/${jobId}`;
    const startTime = Date.now();

    try {
      await this.fetchWithRetry(url, {
        method: 'POST',
      });

      logger.info({
        msg: 'RunPod job cancelled',
        endpointId,
        jobId,
        durationMs: Date.now() - startTime,
      });
    } catch (error) {
      logger.error({
        msg: 'RunPod cancelJob failed',
        endpointId,
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      });
      throw error;
    }
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Fetch with retry logic for 5xx errors
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: { ...headers, ...(options.headers ?? {}) },
        });

        // Rate limited
        if (response.status === 429) {
          throw new RunPodError(
            ERROR_CODES.RUNPOD_RATE_LIMITED,
            'RunPod rate limit exceeded',
            { statusCode: 429, runpodStatus: 429 }
          );
        }

        // Server error - retry
        if (response.status >= 500) {
          const errorText = await response.text();
          lastError = new RunPodError(
            ERROR_CODES.RUNPOD_REQUEST_FAILED,
            `RunPod server error: ${response.status}`,
            {
              statusCode: 502,
              runpodStatus: response.status,
              runpodError: errorText,
            }
          );

          if (attempt < this.maxRetries) {
            logger.warn({
              msg: 'RunPod request failed, retrying',
              url,
              status: response.status,
              attempt: attempt + 1,
              maxRetries: this.maxRetries,
            });
            await this.delay(this.retryDelayMs);
            continue;
          }

          throw lastError;
        }

        // Client error - don't retry
        if (response.status >= 400) {
          const errorText = await response.text();
          throw new RunPodError(
            ERROR_CODES.RUNPOD_REQUEST_FAILED,
            `RunPod request failed: ${response.status}`,
            {
              statusCode: response.status >= 404 ? 404 : 400,
              runpodStatus: response.status,
              runpodError: errorText,
            }
          );
        }

        return response;
      } catch (error) {
        if (error instanceof RunPodError) {
          throw error;
        }

        // Network error - retry
        lastError = error as Error;
        if (attempt < this.maxRetries) {
          logger.warn({
            msg: 'RunPod request error, retrying',
            url,
            error: lastError.message,
            attempt: attempt + 1,
            maxRetries: this.maxRetries,
          });
          await this.delay(this.retryDelayMs);
          continue;
        }
      }
    }

    throw new RunPodError(
      ERROR_CODES.RUNPOD_REQUEST_FAILED,
      `RunPod request failed after ${this.maxRetries + 1} attempts: ${lastError?.message}`,
      { statusCode: 502 }
    );
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================
// Factory Function
// ============================================

/**
 * Create a new RunPod client
 */
export function createRunPodClient(apiKey: string): RunPodClient {
  return new RunPodClient({ apiKey });
}
