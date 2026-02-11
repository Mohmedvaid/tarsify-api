/**
 * Engine Types
 * Type definitions for the RunPod execution engine
 */

import type { EngineExecutionStatus } from '@prisma/client';

// ============================================
// RunPod API Types
// ============================================

/**
 * RunPod job status from API
 */
export type RunPodStatus =
  | 'IN_QUEUE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'TIMED_OUT';

/**
 * RunPod job response from /run endpoint
 */
export interface RunPodRunResponse {
  id: string;
  status: RunPodStatus;
}

/**
 * RunPod job status response
 */
export interface RunPodStatusResponse {
  id: string;
  status: RunPodStatus;
  output?: unknown;
  error?: string;
  executionTime?: number;
}

/**
 * RunPod runsync response (sync execution)
 */
export interface RunPodSyncResponse {
  id: string;
  status: RunPodStatus;
  output?: unknown;
  error?: string;
  executionTime?: number;
}

// ============================================
// Engine Input/Output Types
// ============================================

/**
 * Config overrides from TarsModel
 */
export interface ConfigOverrides {
  defaultInputs?: Record<string, unknown>;
  lockedInputs?: Record<string, unknown>;
  hiddenFields?: string[];
  promptPrefix?: string;
  promptSuffix?: string;
}

/**
 * Input to submit a job
 */
export interface SubmitJobInput {
  /** Consumer ID (from auth) */
  consumerId: string;
  /** TarsModel slug or ID */
  tarsModelSlug: string;
  /** User-provided inputs */
  userInputs: Record<string, unknown>;
}

/**
 * Handle returned after job submission
 */
export interface JobHandle {
  /** Execution ID (database) */
  executionId: string;
  /** RunPod job ID */
  runpodJobId: string;
  /** Initial status */
  status: EngineExecutionStatus;
  /** When the job was created */
  createdAt: Date;
}

/**
 * Result when polling job status
 */
export interface JobResult {
  /** Execution ID */
  executionId: string;
  /** Current status */
  status: EngineExecutionStatus;
  /** Output payload if completed */
  output?: unknown;
  /** Error message if failed */
  error?: string;
  /** Error code if failed */
  errorCode?: string;
  /** Execution time in milliseconds */
  executionTimeMs?: number;
  /** When completed */
  completedAt?: Date;
}

// ============================================
// Engine Interface
// ============================================

/**
 * Engine public interface
 */
export interface Engine {
  /**
   * Submit a job for execution
   */
  submitJob(input: SubmitJobInput): Promise<JobHandle>;

  /**
   * Get job status and result
   * @param executionId - Execution ID
   * @param consumerId - Consumer ID (for ownership verification)
   */
  getJobStatus(executionId: string, consumerId: string): Promise<JobResult>;

  /**
   * Cancel a running job
   * @param executionId - Execution ID
   * @param consumerId - Consumer ID (for ownership verification)
   */
  cancelJob(executionId: string, consumerId: string): Promise<void>;
}

// ============================================
// Status Mapping
// ============================================

/**
 * Map RunPod status to engine execution status
 */
export function mapRunPodStatus(status: RunPodStatus): EngineExecutionStatus {
  switch (status) {
    case 'IN_QUEUE':
      return 'QUEUED';
    case 'IN_PROGRESS':
      return 'RUNNING';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'FAILED':
      return 'FAILED';
    case 'CANCELLED':
      return 'CANCELLED';
    case 'TIMED_OUT':
      return 'TIMED_OUT';
    default:
      return 'PENDING';
  }
}

/**
 * Check if status is terminal (no more updates expected)
 */
export function isTerminalStatus(status: EngineExecutionStatus): boolean {
  return ['COMPLETED', 'FAILED', 'CANCELLED', 'TIMED_OUT'].includes(status);
}
