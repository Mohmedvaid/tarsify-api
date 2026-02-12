/**
 * Studio Notebook Service Tests
 * Unit tests for notebook CRUD and file operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Notebook } from '@prisma/client';

// Mock dependencies
vi.mock('@/repositories', () => ({
  notebookRepository: {
    findByIdAndDeveloper: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock('@/lib', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
  notebookStorage: {
    saveNotebook: vi.fn(),
    deleteNotebook: vi.fn(),
    readNotebook: vi.fn(),
    getMaxFileSize: vi.fn(() => 10 * 1024 * 1024), // 10MB
    validateNotebookContent: vi.fn(() => ({ valid: true, errors: [] })),
  },
}));

import {
  createNotebook,
  getNotebook,
  listNotebooks,
  deleteNotebook,
  uploadNotebookFile,
  downloadNotebookFile,
  deleteNotebookFile,
  publishNotebook,
  unpublishNotebook,
} from './notebook.service';
import { notebookRepository } from '@/repositories';
import { notebookStorage } from '@/lib';
import { AppError } from '@/core/errors';

// ============================================
// Test Fixtures
// ============================================

const mockDraftNotebook: Notebook = {
  id: 'notebook-uuid-1',
  developerId: 'dev-uuid-1',
  title: 'Test Notebook',
  description: 'Test description',
  shortDescription: 'Short desc',
  category: 'AI',
  gpuType: 'H100',
  priceCredits: 100,
  status: 'draft',
  filePath: null,
  notebookFileUrl: null,
  slug: 'test-notebook',
  totalRuns: 0,
  totalRevenue: 0,
  averageRating: null,
  reviewCount: 0,
  imageUrl: null,
  tags: [],
  createdAt: new Date('2026-01-20'),
  updatedAt: new Date('2026-01-20'),
};

const mockPublishedNotebook: Notebook = {
  ...mockDraftNotebook,
  status: 'published',
  notebookFileUrl: 'gs://bucket/notebooks/notebook-uuid-1.ipynb',
};

const mockNotebookWithFile: Notebook = {
  ...mockDraftNotebook,
  notebookFileUrl: 'gs://bucket/notebooks/notebook-uuid-1.ipynb',
};

// ============================================
// Tests
// ============================================

describe('Studio Notebook Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // createNotebook
  // ============================================
  describe('createNotebook', () => {
    it('should create a new notebook', async () => {
      (
        notebookRepository.create as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDraftNotebook);

      const result = await createNotebook('dev-uuid-1', {
        title: 'Test Notebook',
        description: 'Test description',
        shortDescription: 'Short desc',
        gpuType: 'H100',
        priceCredits: 100,
      });

      expect(result.data).toEqual(mockDraftNotebook);
      expect(result.message).toContain('created successfully');
    });
  });

  // ============================================
  // getNotebook
  // ============================================
  describe('getNotebook', () => {
    it('should get notebook with ownership check', async () => {
      (
        notebookRepository.findByIdAndDeveloper as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDraftNotebook);

      const result = await getNotebook('notebook-uuid-1', 'dev-uuid-1');

      expect(result.data).toEqual(mockDraftNotebook);
    });

    it('should throw error if notebook not found', async () => {
      (
        notebookRepository.findByIdAndDeveloper as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      await expect(getNotebook('unknown-id', 'dev-uuid-1')).rejects.toThrow(
        AppError
      );
    });
  });

  // ============================================
  // listNotebooks
  // ============================================
  describe('listNotebooks', () => {
    it('should list notebooks with pagination', async () => {
      (
        notebookRepository.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        data: [mockDraftNotebook],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const result = await listNotebooks('dev-uuid-1', {
        page: 1,
        limit: 10,
        sort: '-createdAt',
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  // ============================================
  // deleteNotebook
  // ============================================
  describe('deleteNotebook', () => {
    it('should hard delete draft notebook', async () => {
      (
        notebookRepository.findByIdAndDeveloper as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDraftNotebook);

      const result = await deleteNotebook('notebook-uuid-1', 'dev-uuid-1');

      expect(result.data.status).toBe('deleted');
      expect(notebookRepository.delete).toHaveBeenCalledWith('notebook-uuid-1');
    });

    it('should delete file when deleting draft with file', async () => {
      (
        notebookRepository.findByIdAndDeveloper as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockNotebookWithFile);

      await deleteNotebook('notebook-uuid-1', 'dev-uuid-1');

      expect(notebookStorage.deleteNotebook).toHaveBeenCalledWith(
        'notebook-uuid-1'
      );
    });

    it('should archive published notebook instead of delete', async () => {
      (
        notebookRepository.findByIdAndDeveloper as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockPublishedNotebook);
      (
        notebookRepository.updateStatus as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockPublishedNotebook,
        status: 'archived',
      });

      const result = await deleteNotebook('notebook-uuid-1', 'dev-uuid-1');

      expect(result.data.status).toBe('archived');
      expect(notebookRepository.delete).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // uploadNotebookFile
  // ============================================
  describe('uploadNotebookFile', () => {
    it('should upload notebook file', async () => {
      (
        notebookRepository.findByIdAndDeveloper as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDraftNotebook);
      (
        notebookStorage.saveNotebook as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce('gs://bucket/notebooks/notebook-uuid-1.ipynb');
      (
        notebookRepository.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockDraftNotebook,
        notebookFileUrl: 'gs://bucket/notebooks/notebook-uuid-1.ipynb',
      });

      const result = await uploadNotebookFile(
        'notebook-uuid-1',
        'dev-uuid-1',
        Buffer.from('{}'),
        'notebook.ipynb'
      );

      expect(result.data.notebookFileUrl).toBeDefined();
      expect(result.message).toContain('uploaded successfully');
    });

    it('should reject non-ipynb files', async () => {
      (
        notebookRepository.findByIdAndDeveloper as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDraftNotebook);

      await expect(
        uploadNotebookFile(
          'notebook-uuid-1',
          'dev-uuid-1',
          Buffer.from('{}'),
          'file.txt'
        )
      ).rejects.toThrow(AppError);
    });

    it('should reject files too large', async () => {
      (
        notebookRepository.findByIdAndDeveloper as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDraftNotebook);
      (
        notebookStorage.getMaxFileSize as ReturnType<typeof vi.fn>
      ).mockReturnValue(100); // 100 bytes

      await expect(
        uploadNotebookFile(
          'notebook-uuid-1',
          'dev-uuid-1',
          Buffer.alloc(200),
          'notebook.ipynb'
        )
      ).rejects.toThrow(AppError);
    });

    it('should reject invalid notebook content', async () => {
      (
        notebookRepository.findByIdAndDeveloper as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDraftNotebook);
      (
        notebookStorage.validateNotebookContent as ReturnType<typeof vi.fn>
      ).mockReturnValue({
        valid: false,
        errors: ['Invalid JSON'],
      });

      await expect(
        uploadNotebookFile(
          'notebook-uuid-1',
          'dev-uuid-1',
          Buffer.from('{}'),
          'notebook.ipynb'
        )
      ).rejects.toThrow(AppError);
    });

    it('should reject upload to published notebook', async () => {
      (
        notebookRepository.findByIdAndDeveloper as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockPublishedNotebook);

      await expect(
        uploadNotebookFile(
          'notebook-uuid-1',
          'dev-uuid-1',
          Buffer.from('{}'),
          'notebook.ipynb'
        )
      ).rejects.toThrow(AppError);
    });

    it('should delete existing file on re-upload', async () => {
      (
        notebookRepository.findByIdAndDeveloper as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockNotebookWithFile);
      (
        notebookStorage.saveNotebook as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce('gs://bucket/notebooks/notebook-uuid-1.ipynb');
      (
        notebookRepository.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockNotebookWithFile);

      await uploadNotebookFile(
        'notebook-uuid-1',
        'dev-uuid-1',
        Buffer.from('{}'),
        'notebook.ipynb'
      );

      expect(notebookStorage.deleteNotebook).toHaveBeenCalledWith(
        'notebook-uuid-1'
      );
    });
  });

  // ============================================
  // downloadNotebookFile
  // ============================================
  describe('downloadNotebookFile', () => {
    it('should download notebook file', async () => {
      (
        notebookRepository.findByIdAndDeveloper as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockNotebookWithFile);
      (
        notebookStorage.readNotebook as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(Buffer.from('{"cells": []}'));

      const result = await downloadNotebookFile(
        'notebook-uuid-1',
        'dev-uuid-1'
      );

      expect(result.content).toBeInstanceOf(Buffer);
      expect(result.filename).toContain('.ipynb');
    });

    it('should throw error if no file uploaded', async () => {
      (
        notebookRepository.findByIdAndDeveloper as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDraftNotebook);

      await expect(
        downloadNotebookFile('notebook-uuid-1', 'dev-uuid-1')
      ).rejects.toThrow(AppError);
    });
  });

  // ============================================
  // deleteNotebookFile
  // ============================================
  describe('deleteNotebookFile', () => {
    it('should delete notebook file', async () => {
      (
        notebookRepository.findByIdAndDeveloper as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockNotebookWithFile);
      (
        notebookRepository.update as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockDraftNotebook,
        notebookFileUrl: null,
      });

      const result = await deleteNotebookFile('notebook-uuid-1', 'dev-uuid-1');

      expect(notebookStorage.deleteNotebook).toHaveBeenCalledWith(
        'notebook-uuid-1'
      );
      expect(result.data.notebookFileUrl).toBeNull();
    });

    it('should reject if notebook is published', async () => {
      (
        notebookRepository.findByIdAndDeveloper as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockPublishedNotebook);

      await expect(
        deleteNotebookFile('notebook-uuid-1', 'dev-uuid-1')
      ).rejects.toThrow(AppError);
    });

    it('should reject if no file exists', async () => {
      (
        notebookRepository.findByIdAndDeveloper as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDraftNotebook);

      await expect(
        deleteNotebookFile('notebook-uuid-1', 'dev-uuid-1')
      ).rejects.toThrow(AppError);
    });
  });

  // ============================================
  // publishNotebook
  // ============================================
  describe('publishNotebook', () => {
    it('should publish draft notebook with file', async () => {
      const publishableNotebook = {
        ...mockNotebookWithFile,
        status: 'draft' as const,
      };
      (
        notebookRepository.findByIdAndDeveloper as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(publishableNotebook);
      (
        notebookRepository.updateStatus as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...publishableNotebook,
        status: 'published',
      });

      const result = await publishNotebook('notebook-uuid-1', 'dev-uuid-1');

      expect(result.data.status).toBe('published');
    });

    it('should reject publishing already published notebook', async () => {
      (
        notebookRepository.findByIdAndDeveloper as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockPublishedNotebook);

      await expect(
        publishNotebook('notebook-uuid-1', 'dev-uuid-1')
      ).rejects.toThrow(AppError);
    });

    it('should reject publishing notebook without file', async () => {
      (
        notebookRepository.findByIdAndDeveloper as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDraftNotebook);

      await expect(
        publishNotebook('notebook-uuid-1', 'dev-uuid-1')
      ).rejects.toThrow(AppError);
    });
  });

  // ============================================
  // unpublishNotebook
  // ============================================
  describe('unpublishNotebook', () => {
    it('should unpublish published notebook', async () => {
      (
        notebookRepository.findByIdAndDeveloper as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockPublishedNotebook);
      (
        notebookRepository.updateStatus as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ...mockPublishedNotebook,
        status: 'draft',
      });

      const result = await unpublishNotebook('notebook-uuid-1', 'dev-uuid-1');

      expect(result.data.status).toBe('draft');
    });

    it('should reject unpublishing draft notebook', async () => {
      (
        notebookRepository.findByIdAndDeveloper as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockDraftNotebook);

      await expect(
        unpublishNotebook('notebook-uuid-1', 'dev-uuid-1')
      ).rejects.toThrow(AppError);
    });
  });
});
