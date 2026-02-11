/**
 * Engine Types Tests
 * Tests for type utilities and status mapping
 */

import { describe, it, expect } from 'vitest';
import { mapRunPodStatus, isTerminalStatus } from '../types';
import type { RunPodStatus } from '../types';

describe('mapRunPodStatus', () => {
  it('should map IN_QUEUE to QUEUED', () => {
    expect(mapRunPodStatus('IN_QUEUE')).toBe('QUEUED');
  });

  it('should map IN_PROGRESS to RUNNING', () => {
    expect(mapRunPodStatus('IN_PROGRESS')).toBe('RUNNING');
  });

  it('should map COMPLETED to COMPLETED', () => {
    expect(mapRunPodStatus('COMPLETED')).toBe('COMPLETED');
  });

  it('should map FAILED to FAILED', () => {
    expect(mapRunPodStatus('FAILED')).toBe('FAILED');
  });

  it('should map CANCELLED to CANCELLED', () => {
    expect(mapRunPodStatus('CANCELLED')).toBe('CANCELLED');
  });

  it('should map TIMED_OUT to TIMED_OUT', () => {
    expect(mapRunPodStatus('TIMED_OUT')).toBe('TIMED_OUT');
  });

  it('should map unknown status to PENDING', () => {
    expect(mapRunPodStatus('UNKNOWN' as RunPodStatus)).toBe('PENDING');
  });
});

describe('isTerminalStatus', () => {
  it('should return true for COMPLETED', () => {
    expect(isTerminalStatus('COMPLETED')).toBe(true);
  });

  it('should return true for FAILED', () => {
    expect(isTerminalStatus('FAILED')).toBe(true);
  });

  it('should return true for CANCELLED', () => {
    expect(isTerminalStatus('CANCELLED')).toBe(true);
  });

  it('should return true for TIMED_OUT', () => {
    expect(isTerminalStatus('TIMED_OUT')).toBe(true);
  });

  it('should return false for PENDING', () => {
    expect(isTerminalStatus('PENDING')).toBe(false);
  });

  it('should return false for QUEUED', () => {
    expect(isTerminalStatus('QUEUED')).toBe(false);
  });

  it('should return false for RUNNING', () => {
    expect(isTerminalStatus('RUNNING')).toBe(false);
  });
});
