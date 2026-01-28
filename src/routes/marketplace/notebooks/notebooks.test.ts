/**
 * Marketplace Notebooks Integration Tests
 * Tests for public notebook browsing and search endpoints
 * 
 * These are PUBLIC endpoints - no auth required
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '@/app';
import { prisma } from '@/lib/prisma';
import { firebaseAdmin } from '@/services/firebase';

// Skip tests if no database
const skipDbTests = !process.env.DATABASE_URL || process.env.SKIP_DB_TESTS === 'true';

describe.skipIf(skipDbTests)('Marketplace Notebooks Routes (Integration)', () => {
  let app: FastifyInstance;
  let testDeveloperId: string;
  let publishedNotebookId: string;
  let draftNotebookId: string;

  const BASE_URL = '/api/marketplace/notebooks';

  beforeAll(async () => {
    // Initialize Firebase mock
    process.env.FIREBASE_MOCK = 'true';
    firebaseAdmin.resetToMock();
    await firebaseAdmin.initialize();

    // Build the app
    app = await buildApp();
    await app.ready();

    // Create test developer
    const developer = await prisma.developer.create({
      data: {
        firebaseUid: 'marketplace-test-dev',
        email: 'marketplace-dev@example.com',
        name: 'Marketplace Test Developer',
      },
    });
    testDeveloperId = developer.id;

    // Create published notebook
    const published = await prisma.notebook.create({
      data: {
        developerId: testDeveloperId,
        title: 'Published Test Notebook',
        description: 'A published notebook for testing',
        shortDescription: 'Test published notebook',
        category: 'image',
        gpuType: 'T4',
        priceCredits: 100,
        status: 'published',
        totalRuns: 50,
        averageRating: 4.5,
      },
    });
    publishedNotebookId = published.id;

    // Create draft notebook (should not be visible)
    const draft = await prisma.notebook.create({
      data: {
        developerId: testDeveloperId,
        title: 'Draft Test Notebook',
        description: 'A draft notebook',
        shortDescription: 'Test draft notebook',
        category: 'text',
        gpuType: 'A100',
        priceCredits: 200,
        status: 'draft',
      },
    });
    draftNotebookId = draft.id;
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

  // ============================================
  // List Notebooks Tests
  // ============================================
  describe('GET /notebooks', () => {
    it('should list published notebooks without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: BASE_URL,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta).toBeDefined();
      expect(body.meta.page).toBe(1);
    });

    it('should only return published notebooks', async () => {
      const response = await app.inject({
        method: 'GET',
        url: BASE_URL,
      });

      const body = response.json();
      const notebookIds = body.data.map((n: { id: string }) => n.id);
      
      // Published should be in results
      expect(notebookIds).toContain(publishedNotebookId);
      // Draft should NOT be in results
      expect(notebookIds).not.toContain(draftNotebookId);
    });

    it('should include consumer-friendly display names', async () => {
      const response = await app.inject({
        method: 'GET',
        url: BASE_URL,
      });

      const body = response.json();
      const notebook = body.data.find((n: { id: string }) => n.id === publishedNotebookId);
      
      expect(notebook).toBeDefined();
      expect(notebook.categoryDisplay).toBe('Image & Photos');
      expect(notebook.computeTierDisplay).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}?page=1&limit=5`,
      });

      const body = response.json();
      expect(body.meta.page).toBe(1);
      expect(body.meta.limit).toBe(5);
    });

    it('should filter by category', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}?category=image`,
      });

      const body = response.json();
      body.data.forEach((notebook: { category: string }) => {
        expect(notebook.category).toBe('image');
      });
    });

    it('should support sorting', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}?sort=newest`,
      });

      expect(response.statusCode).toBe(200);
    });

    it('should reject invalid pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}?page=0`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject invalid category', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}?category=invalid`,
      });

      expect(response.statusCode).toBe(400);
    });
  });

  // ============================================
  // Get Notebook Details Tests
  // ============================================
  describe('GET /notebooks/:id', () => {
    it('should get published notebook details', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/${publishedNotebookId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(publishedNotebookId);
      expect(body.data.title).toBe('Published Test Notebook');
      expect(body.data.categoryDisplay).toBeDefined();
      expect(body.data.computeTierDisplay).toBeDefined();
    });

    it('should return 404 for draft notebooks', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/${draftNotebookId}`,
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.success).toBe(false);
    });

    it('should return 404 for non-existent notebook', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/00000000-0000-0000-0000-000000000000`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/not-a-uuid`,
      });

      expect(response.statusCode).toBe(400);
    });
  });

  // ============================================
  // Featured Notebooks Tests
  // ============================================
  describe('GET /notebooks/featured', () => {
    it('should return featured notebooks', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/featured`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('should only return published notebooks', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/featured`,
      });

      const body = response.json();
      const notebookIds = body.data.map((n: { id: string }) => n.id);
      expect(notebookIds).not.toContain(draftNotebookId);
    });
  });

  // ============================================
  // Categories Tests
  // ============================================
  describe('GET /notebooks/categories', () => {
    it('should return categories with counts', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/categories`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      
      // Each category should have key, displayName, count
      body.data.forEach((cat: { key: string; displayName: string; count: number }) => {
        expect(cat.key).toBeDefined();
        expect(cat.displayName).toBeDefined();
        expect(typeof cat.count).toBe('number');
      });
    });
  });

  // ============================================
  // Search Tests
  // ============================================
  describe('GET /notebooks/search', () => {
    it('should search notebooks by query', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/search?q=test`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta.query).toBe('test');
    });

    it('should include relevance scores', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/search?q=notebook`,
      });

      const body = response.json();
      body.data.forEach((result: { relevanceScore: number; matchedFields: string[] }) => {
        expect(typeof result.relevanceScore).toBe('number');
        expect(Array.isArray(result.matchedFields)).toBe(true);
      });
    });

    it('should filter by category', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/search?q=test&category=image`,
      });

      const body = response.json();
      body.data.forEach((result: { category: string }) => {
        expect(result.category).toBe('image');
      });
    });

    it('should filter by tier', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/search?q=test&tier=standard`,
      });

      expect(response.statusCode).toBe(200);
    });

    it('should support pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/search?q=test&page=1&limit=5`,
      });

      const body = response.json();
      expect(body.meta.page).toBe(1);
      expect(body.meta.limit).toBe(5);
    });

    it('should return 400 when query is missing', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/search`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for empty query', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/search?q=`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid tier', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/search?q=test&tier=invalid`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should only search published notebooks', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${BASE_URL}/search?q=Draft`,
      });

      const body = response.json();
      const notebookIds = body.data.map((n: { id: string }) => n.id);
      expect(notebookIds).not.toContain(draftNotebookId);
    });
  });
});

// ============================================
// Schema Validation Tests (no DB required)
// ============================================
import {
  listNotebooksQuerySchema,
  notebookIdParamsSchema,
  searchNotebooksQuerySchema,
} from './notebooks.schemas';

describe('Marketplace Notebooks Schema Tests', () => {

  describe('listNotebooksQuerySchema', () => {
    it('should accept valid query params', () => {
      const result = listNotebooksQuerySchema.safeParse({
        page: 1,
        limit: 20,
        category: 'image',
        sort: 'popular',
      });
      expect(result.success).toBe(true);
    });

    it('should apply defaults', () => {
      const result = listNotebooksQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data?.page).toBe(1);
      expect(result.data?.limit).toBe(20);
      expect(result.data?.sort).toBe('popular');
    });

    it('should reject invalid page', () => {
      const result = listNotebooksQuerySchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject invalid category', () => {
      const result = listNotebooksQuerySchema.safeParse({ category: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should reject limit over 100', () => {
      const result = listNotebooksQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });
  });

  describe('searchNotebooksQuerySchema', () => {
    it('should accept valid search query', () => {
      const result = searchNotebooksQuerySchema.safeParse({
        q: 'image processing',
        category: 'image',
        tier: 'standard',
        page: 1,
        limit: 10,
      });
      expect(result.success).toBe(true);
    });

    it('should require q parameter', () => {
      const result = searchNotebooksQuerySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject empty query', () => {
      const result = searchNotebooksQuerySchema.safeParse({ q: '' });
      expect(result.success).toBe(false);
    });

    it('should reject query over 100 chars', () => {
      const result = searchNotebooksQuerySchema.safeParse({ q: 'a'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('should reject invalid tier', () => {
      const result = searchNotebooksQuerySchema.safeParse({ q: 'test', tier: 'mega' });
      expect(result.success).toBe(false);
    });

    it('should accept valid tiers', () => {
      ['standard', 'fast', 'premium', 'ultra'].forEach(tier => {
        const result = searchNotebooksQuerySchema.safeParse({ q: 'test', tier });
        expect(result.success).toBe(true);
      });
    });

    it('should limit search results to 50', () => {
      const result = searchNotebooksQuerySchema.safeParse({ q: 'test', limit: 51 });
      expect(result.success).toBe(false);
    });
  });

  describe('notebookIdParamsSchema', () => {
    it('should accept valid UUID', () => {
      const result = notebookIdParamsSchema.safeParse({ 
        id: '123e4567-e89b-12d3-a456-426614174000' 
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const result = notebookIdParamsSchema.safeParse({ id: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });
  });
});
