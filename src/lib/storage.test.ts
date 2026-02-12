/**
 * Storage Service Tests
 * Unit tests for notebook storage utility functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the env module to control test/prod behavior
vi.mock('@/config/env', () => ({
  env: {
    GCS_NOTEBOOKS_BUCKET: 'test-bucket',
    GCP_PROJECT_ID: 'test-project',
  },
  isTest: true,
}));

// Mock the logger
vi.mock('./logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { notebookStorage } from './storage';

describe('Notebook Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // getFilePath
  // ============================================
  describe('getFilePath', () => {
    it('should generate correct file path', () => {
      const path = notebookStorage.getFilePath('test-notebook-id');

      expect(path).toBe('notebooks/test-notebook-id.ipynb');
    });
  });

  // ============================================
  // getGcsUri
  // ============================================
  describe('getGcsUri', () => {
    it('should generate correct GCS URI', () => {
      const uri = notebookStorage.getGcsUri('test-notebook-id');

      expect(uri).toBe('gs://test-bucket/notebooks/test-notebook-id.ipynb');
    });
  });

  // ============================================
  // validateNotebookContent
  // ============================================
  describe('validateNotebookContent', () => {
    it('should validate valid notebook content', () => {
      const validNotebook = {
        cells: [{ cell_type: 'code', source: ['print("Hello")'] }],
        metadata: {},
        nbformat: 4,
        nbformat_minor: 4,
      };

      const result = notebookStorage.validateNotebookContent(
        Buffer.from(JSON.stringify(validNotebook))
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid JSON', () => {
      const result = notebookStorage.validateNotebookContent(
        Buffer.from('not valid json')
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Invalid JSON: file is not a valid JSON document'
      );
    });

    it('should reject notebook without cells array', () => {
      const invalidNotebook = {
        metadata: {},
        nbformat: 4,
      };

      const result = notebookStorage.validateNotebookContent(
        Buffer.from(JSON.stringify(invalidNotebook))
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Invalid notebook: missing or invalid "cells" array'
      );
    });

    it('should reject notebook without metadata', () => {
      const invalidNotebook = {
        cells: [{ cell_type: 'code' }],
        nbformat: 4,
      };

      const result = notebookStorage.validateNotebookContent(
        Buffer.from(JSON.stringify(invalidNotebook))
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Invalid notebook: missing or invalid "metadata" object'
      );
    });

    it('should reject notebook without nbformat', () => {
      const invalidNotebook = {
        cells: [{ cell_type: 'code' }],
        metadata: {},
      };

      const result = notebookStorage.validateNotebookContent(
        Buffer.from(JSON.stringify(invalidNotebook))
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Invalid notebook: missing "nbformat" version'
      );
    });

    it('should reject notebook without code cells', () => {
      const noCodeCells = {
        cells: [{ cell_type: 'markdown', source: ['# Header'] }],
        metadata: {},
        nbformat: 4,
      };

      const result = notebookStorage.validateNotebookContent(
        Buffer.from(JSON.stringify(noCodeCells))
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Notebook must contain at least one code cell'
      );
    });
  });

  // ============================================
  // getMaxFileSize
  // ============================================
  describe('getMaxFileSize', () => {
    it('should return 10MB in bytes', () => {
      const maxSize = notebookStorage.getMaxFileSize();

      expect(maxSize).toBe(10 * 1024 * 1024);
    });
  });

  // ============================================
  // Test mode behaviors
  // ============================================
  describe('Test mode behaviors', () => {
    it('should return false for exists in test mode', async () => {
      const exists = await notebookStorage.exists('any-id');

      expect(exists).toBe(false);
    });

    it('should return GCS URI for saveNotebook in test mode', async () => {
      const uri = await notebookStorage.saveNotebook(
        'notebook-id',
        Buffer.from('{}')
      );

      expect(uri).toContain('gs://');
    });

    it('should return mock buffer for readNotebook in test mode', async () => {
      const content = await notebookStorage.readNotebook('notebook-id');

      expect(content).toBeInstanceOf(Buffer);
      const parsed = JSON.parse(content.toString());
      expect(parsed.cells).toBeDefined();
    });

    it('should return mock signed URL in test mode', async () => {
      const url = await notebookStorage.getSignedDownloadUrl('notebook-id');

      expect(url).toContain('storage.googleapis.com');
      expect(url).toContain('mock=true');
    });

    it('should do nothing for deleteNotebook in test mode', async () => {
      // Should not throw
      await notebookStorage.deleteNotebook('notebook-id');
    });
  });
});
