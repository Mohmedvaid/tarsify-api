/**
 * Notebook Integration Tests
 * Tests for notebook API endpoints with file upload/download
 * 
 * Note: These tests require a database connection and will be skipped
 * if DATABASE_URL is not set or if running in CI without a database.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import * as fs from 'fs/promises';
import * as path from 'path';
import { buildApp } from '@/app';
import { firebaseAdmin } from '@/services/firebase';
import { prisma } from '@/lib/prisma';
import { notebookStorage } from '@/lib';

// Test constants
const MOCK_TOKEN = 'dev_test-notebook-developer';
const TEST_DEVELOPER_UID = 'test-notebook-developer';

// Sample .ipynb content for testing
const VALID_NOTEBOOK_CONTENT = JSON.stringify({
  cells: [
    {
      cell_type: 'markdown',
      metadata: {},
      source: ['# Test Notebook'],
    },
    {
      cell_type: 'code',
      execution_count: null,
      metadata: {},
      outputs: [],
      source: ['print("Hello World")'],
    },
  ],
  metadata: {
    kernelspec: {
      display_name: 'Python 3',
      language: 'python',
      name: 'python3',
    },
  },
  nbformat: 4,
  nbformat_minor: 5,
});

const INVALID_NOTEBOOK_CONTENT = JSON.stringify({
  // Missing cells array
  metadata: {},
  nbformat: 4,
});

// Skip all integration tests if no database - they require real DB
const skipDbTests = !process.env.DATABASE_URL || process.env.SKIP_DB_TESTS === 'true';

describe.skipIf(skipDbTests)('Notebook Routes (Integration)', () => {
  let app: FastifyInstance;
  let testDeveloperId: string;

  beforeAll(async () => {
    // Initialize Firebase mock
    process.env.FIREBASE_MOCK = 'true';
    firebaseAdmin.resetToMock();
    await firebaseAdmin.initialize();

    // Create Fastify app with full middleware stack
    app = await buildApp();
    await app.ready();

    // Create test developer in database
    const developer = await prisma.developer.create({
      data: {
        firebaseUid: TEST_DEVELOPER_UID,
        email: 'notebook-test@example.com',
        name: 'Notebook Test Developer',
      },
    });
    testDeveloperId = developer.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.notebook.deleteMany({
      where: { developerId: testDeveloperId },
    });
    await prisma.developer.delete({
      where: { id: testDeveloperId },
    });

    await app.close();
    await prisma.$disconnect();
  });

  // Auth header without content-type (for GET, DELETE, POST without body)
  const authHeaders = {
    Authorization: `Bearer ${MOCK_TOKEN}`,
  };

  // Auth headers with JSON content-type (for POST/PUT with body)
  const jsonHeaders = {
    Authorization: `Bearer ${MOCK_TOKEN}`,
    'Content-Type': 'application/json',
  };

  // ============================================
  // Authentication Tests
  // ============================================
  describe('Authentication', () => {
    it('should reject unauthenticated request', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/studio/notebooks',
      });

      expect(response.statusCode).toBe(401);
      const body = response.json();
      expect(body.success).toBe(false);
    });

    it('should reject invalid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/studio/notebooks',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  // ============================================
  // Create Notebook Tests
  // ============================================
  describe('POST /notebooks', () => {
    it('should create a new notebook (metadata only)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/studio/notebooks',
        headers: jsonHeaders,
        payload: {
          title: 'Test AI Notebook',
          description: 'A test notebook',
          shortDescription: 'Test notebook',
          category: 'image',
          gpuType: 'T4',
          priceCredits: 10,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.title).toBe('Test AI Notebook');
      expect(body.data.status).toBe('draft');
      // notebookFileUrl may not be in response schema, just verify notebook created

      // Clean up
      await prisma.notebook.delete({ where: { id: body.data.id } });
    });

    it('should create notebook with minimal fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/studio/notebooks',
        headers: jsonHeaders,
        payload: {
          title: 'Minimal Notebook',
          gpuType: 'T4',
          priceCredits: 5,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.data.category).toBe('other'); // default

      // Clean up
      await prisma.notebook.delete({ where: { id: body.data.id } });
    });

    it('should reject invalid input', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/studio/notebooks',
        headers: jsonHeaders,
        payload: {
          title: 'AB', // too short
          gpuType: 'INVALID',
          priceCredits: 0,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.success).toBe(false);
    });
  });

  // ============================================
  // List Notebooks Tests
  // ============================================
  describe('GET /notebooks', () => {
    let createdNotebookIds: string[] = [];

    beforeEach(async () => {
      // Create test notebooks
      const notebooks = await Promise.all([
        prisma.notebook.create({
          data: {
            developerId: testDeveloperId,
            title: 'Notebook A',
            gpuType: 'T4',
            priceCredits: 10,
            status: 'draft',
          },
        }),
        prisma.notebook.create({
          data: {
            developerId: testDeveloperId,
            title: 'Notebook B',
            gpuType: 'A100',
            priceCredits: 50,
            status: 'published',
            description: 'Published notebook',
            shortDescription: 'Short desc',
            notebookFileUrl: '/uploads/notebooks/test.ipynb',
          },
        }),
      ]);
      createdNotebookIds = notebooks.map((n) => n.id);
    });

    afterEach(async () => {
      await prisma.notebook.deleteMany({
        where: { id: { in: createdNotebookIds } },
      });
      createdNotebookIds = [];
    });

    it('should list notebooks with pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/studio/notebooks',
        headers: authHeaders,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta).toBeDefined();
      expect(body.meta.page).toBe(1);
    });

    it('should filter by status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/studio/notebooks?status=draft',
        headers: authHeaders,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      body.data.forEach((notebook: { status: string }) => {
        expect(notebook.status).toBe('draft');
      });
    });
  });

  // ============================================
  // File Upload/Download Tests
  // ============================================
  describe('File Operations', () => {
    let testNotebookId: string;

    beforeEach(async () => {
      const notebook = await prisma.notebook.create({
        data: {
          developerId: testDeveloperId,
          title: 'File Test Notebook',
          description: 'For testing file operations',
          shortDescription: 'File test',
          gpuType: 'T4',
          priceCredits: 10,
        },
      });
      testNotebookId = notebook.id;
    });

    afterEach(async () => {
      // Clean up file if exists
      await notebookStorage.deleteNotebook(testNotebookId).catch(() => {});
      await prisma.notebook.delete({ where: { id: testNotebookId } }).catch(() => {});
    });

    describe('POST /notebooks/:id/file', () => {
      it('should upload valid .ipynb file', async () => {
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        const payload = 
          `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="file"; filename="test.ipynb"\r\n` +
          `Content-Type: application/json\r\n\r\n` +
          `${VALID_NOTEBOOK_CONTENT}\r\n` +
          `--${boundary}--\r\n`;

        const response = await app.inject({
          method: 'POST',
          url: `/api/studio/notebooks/${testNotebookId}/file`,
          headers: {
            ...authHeaders,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
          },
          payload,
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body.success).toBe(true);
        expect(body.data.notebookFileUrl).toBeTruthy();
      });

      it('should reject non-.ipynb file', async () => {
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        const payload = 
          `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="file"; filename="test.txt"\r\n` +
          `Content-Type: text/plain\r\n\r\n` +
          `Hello World\r\n` +
          `--${boundary}--\r\n`;

        const response = await app.inject({
          method: 'POST',
          url: `/api/studio/notebooks/${testNotebookId}/file`,
          headers: {
            ...authHeaders,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
          },
          payload,
        });

        expect(response.statusCode).toBe(400);
        const body = response.json();
        expect(body.error.message).toContain('.ipynb');
      });

      it('should reject invalid notebook structure', async () => {
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        const payload = 
          `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="file"; filename="invalid.ipynb"\r\n` +
          `Content-Type: application/json\r\n\r\n` +
          `${INVALID_NOTEBOOK_CONTENT}\r\n` +
          `--${boundary}--\r\n`;

        const response = await app.inject({
          method: 'POST',
          url: `/api/studio/notebooks/${testNotebookId}/file`,
          headers: {
            ...authHeaders,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
          },
          payload,
        });

        expect(response.statusCode).toBe(400);
        const body = response.json();
        expect(body.error.message).toContain('Invalid notebook');
      });
    });

    describe('GET /notebooks/:id/file', () => {
      it('should download uploaded file', async () => {
        // First upload a file
        await notebookStorage.saveNotebook(testNotebookId, Buffer.from(VALID_NOTEBOOK_CONTENT));
        await prisma.notebook.update({
          where: { id: testNotebookId },
          data: { notebookFileUrl: `/uploads/notebooks/${testNotebookId}.ipynb` },
        });

        const response = await app.inject({
          method: 'GET',
          url: `/api/studio/notebooks/${testNotebookId}/file`,
          headers: authHeaders,
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toBe('application/x-ipynb+json');
        expect(response.headers['content-disposition']).toContain('attachment');
      });

      it('should return 404 when no file uploaded', async () => {
        const response = await app.inject({
          method: 'GET',
          url: `/api/studio/notebooks/${testNotebookId}/file`,
          headers: authHeaders,
        });

        expect(response.statusCode).toBe(404);
      });
    });

    describe('DELETE /notebooks/:id/file', () => {
      it('should delete uploaded file', async () => {
        // First upload a file
        await notebookStorage.saveNotebook(testNotebookId, Buffer.from(VALID_NOTEBOOK_CONTENT));
        await prisma.notebook.update({
          where: { id: testNotebookId },
          data: { notebookFileUrl: `/uploads/notebooks/${testNotebookId}.ipynb` },
        });

        const response = await app.inject({
          method: 'DELETE',
          url: `/api/studio/notebooks/${testNotebookId}/file`,
          headers: authHeaders,
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body.data.notebookFileUrl).toBeNull();
      });

      it('should return 404 when no file to delete', async () => {
        const response = await app.inject({
          method: 'DELETE',
          url: `/api/studio/notebooks/${testNotebookId}/file`,
          headers: authHeaders,
        });

        expect(response.statusCode).toBe(404);
      });
    });
  });

  // ============================================
  // Delete Notebook Tests
  // ============================================
  describe('DELETE /notebooks/:id', () => {
    it('should delete draft notebook', async () => {
      const notebook = await prisma.notebook.create({
        data: {
          developerId: testDeveloperId,
          title: 'To Be Deleted',
          gpuType: 'T4',
          priceCredits: 10,
          status: 'draft',
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/studio/notebooks/${notebook.id}`,
        headers: authHeaders,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.status).toBe('deleted');

      // Verify deletion
      const deleted = await prisma.notebook.findUnique({
        where: { id: notebook.id },
      });
      expect(deleted).toBeNull();
    });

    it('should archive published notebook instead of deleting', async () => {
      const notebook = await prisma.notebook.create({
        data: {
          developerId: testDeveloperId,
          title: 'To Be Archived',
          description: 'Has description',
          shortDescription: 'Has short',
          gpuType: 'T4',
          priceCredits: 10,
          status: 'published',
          notebookFileUrl: '/uploads/notebooks/test.ipynb',
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/studio/notebooks/${notebook.id}`,
        headers: authHeaders,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.status).toBe('archived');

      // Verify still exists but archived
      const archived = await prisma.notebook.findUnique({
        where: { id: notebook.id },
      });
      expect(archived).not.toBeNull();
      expect(archived?.status).toBe('archived');

      // Clean up
      await prisma.notebook.delete({ where: { id: notebook.id } });
    });
  });

  // ============================================
  // Publish/Unpublish Tests
  // ============================================
  describe('Publishing', () => {
    describe('POST /notebooks/:id/publish', () => {
      it('should publish a ready notebook with file', async () => {
        const notebook = await prisma.notebook.create({
          data: {
            developerId: testDeveloperId,
            title: 'Ready to Publish',
            description: 'Full description here',
            shortDescription: 'Short description',
            gpuType: 'T4',
            priceCredits: 10,
            status: 'draft',
            notebookFileUrl: '/uploads/notebooks/test.ipynb',
          },
        });

        const response = await app.inject({
          method: 'POST',
          url: `/api/studio/notebooks/${notebook.id}/publish`,
          headers: authHeaders,
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body.data.status).toBe('published');

        // Clean up
        await prisma.notebook.delete({ where: { id: notebook.id } });
      });

      it('should reject publishing notebook without file', async () => {
        const notebook = await prisma.notebook.create({
          data: {
            developerId: testDeveloperId,
            title: 'No File',
            description: 'Has description',
            shortDescription: 'Has short',
            gpuType: 'T4',
            priceCredits: 10,
            status: 'draft',
            // No notebookFileUrl
          },
        });

        const response = await app.inject({
          method: 'POST',
          url: `/api/studio/notebooks/${notebook.id}/publish`,
          headers: authHeaders,
        });

        expect(response.statusCode).toBe(400);
        const body = response.json();
        expect(body.error.message).toContain('notebookFile');

        // Clean up
        await prisma.notebook.delete({ where: { id: notebook.id } });
      });

      it('should reject publishing incomplete notebook', async () => {
        const notebook = await prisma.notebook.create({
          data: {
            developerId: testDeveloperId,
            title: 'Incomplete',
            gpuType: 'T4',
            priceCredits: 10,
            status: 'draft',
            // Missing description, shortDescription, and file
          },
        });

        const response = await app.inject({
          method: 'POST',
          url: `/api/studio/notebooks/${notebook.id}/publish`,
          headers: authHeaders,
        });

        expect(response.statusCode).toBe(400);
        const body = response.json();
        expect(body.error.message).toContain('not ready');

        // Clean up
        await prisma.notebook.delete({ where: { id: notebook.id } });
      });
    });

    describe('POST /notebooks/:id/unpublish', () => {
      it('should unpublish a published notebook', async () => {
        const notebook = await prisma.notebook.create({
          data: {
            developerId: testDeveloperId,
            title: 'To Unpublish',
            description: 'Desc',
            shortDescription: 'Short',
            gpuType: 'T4',
            priceCredits: 10,
            status: 'published',
            notebookFileUrl: '/uploads/notebooks/test.ipynb',
          },
        });

        const response = await app.inject({
          method: 'POST',
          url: `/api/studio/notebooks/${notebook.id}/unpublish`,
          headers: authHeaders,
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body.data.status).toBe('draft');

        // Clean up
        await prisma.notebook.delete({ where: { id: notebook.id } });
      });

      it('should reject unpublishing draft notebook', async () => {
        const notebook = await prisma.notebook.create({
          data: {
            developerId: testDeveloperId,
            title: 'Draft Notebook',
            gpuType: 'T4',
            priceCredits: 10,
            status: 'draft',
          },
        });

        const response = await app.inject({
          method: 'POST',
          url: `/api/studio/notebooks/${notebook.id}/unpublish`,
          headers: authHeaders,
        });

        expect(response.statusCode).toBe(400);

        // Clean up
        await prisma.notebook.delete({ where: { id: notebook.id } });
      });
    });
  });
});
