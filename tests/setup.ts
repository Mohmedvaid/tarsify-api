/**
 * Test Setup
 * Global test configuration and utilities
 */
import { beforeAll, afterAll, vi } from 'vitest';
import { config } from 'dotenv';

// Load .env file for database URL and other configs
config();

// Override specific env vars for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '8080';
process.env.HOST = '0.0.0.0';
process.env.LOG_LEVEL = 'error'; // Quiet logs in tests
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.RATE_LIMIT_MAX = '1000';
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.FIREBASE_MOCK = 'true'; // Always use mock Firebase in tests
process.env.GCS_NOTEBOOKS_BUCKET = 'test-notebooks-bucket'; // Mock bucket for tests

// Global test setup
beforeAll(() => {
  // Any global setup
});

// Global test teardown
afterAll(() => {
  // Any global cleanup
});

// Mock console methods to reduce noise in tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'info').mockImplementation(() => {});
vi.spyOn(console, 'debug').mockImplementation(() => {});
