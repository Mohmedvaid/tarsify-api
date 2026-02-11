/**
 * Environment Configuration
 * Validates and exports all environment variables with proper typing
 * Uses Zod for runtime validation - fails fast on startup if config is invalid
 */
import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file in development
dotenv.config();

/**
 * Environment schema with validation rules
 * Add new env vars here - single source of truth
 */
const envSchema = z.object({
  // App
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(8080),
  HOST: z.string().default('0.0.0.0'),
  API_VERSION: z.string().default('v1'),

  // Database
  DATABASE_URL: z.string().url().optional(),

  // Firebase - Consumer Auth (tarsify-users)
  FIREBASE_USERS_PROJECT_ID: z.string().optional(),
  FIREBASE_USERS_PRIVATE_KEY: z.string().optional(),
  FIREBASE_USERS_CLIENT_EMAIL: z.string().email().optional(),

  // Firebase - Developer Auth (tarsify-devs)
  FIREBASE_DEVS_PROJECT_ID: z.string().optional(),
  FIREBASE_DEVS_PRIVATE_KEY: z.string().optional(),
  FIREBASE_DEVS_CLIENT_EMAIL: z.string().email().optional(),

  // Firebase Mock mode (for development without credentials)
  FIREBASE_MOCK: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  // GCP
  GCP_PROJECT_ID: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  GCS_NOTEBOOKS_BUCKET: z.string().min(1, 'GCS_NOTEBOOKS_BUCKET is required'),
  GCS_MODELS_BUCKET: z.string().optional(),
  GCS_OUTPUTS_BUCKET: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // RunPod
  RUNPOD_API_KEY: z.string().optional(),

  // Admin
  ADMIN_UIDS: z
    .string()
    .transform((val) => val.split(',').map((s) => s.trim()).filter(Boolean))
    .default(''),

  // Security
  CORS_ORIGINS: z
    .string()
    .transform((val) => val.split(',').map((s) => s.trim()))
    .default('http://localhost:3000,http://localhost:3001'),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),

  // Logging
  // LOG_LEVEL: optional override, otherwise determined by NODE_ENV
  // dev -> debug, prod -> error, test -> warn
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 * Throws descriptive error on validation failure
 */
function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n');

    throw new Error(`❌ Environment validation failed:\n${errors}`);
  }

  return result.data;
}

/**
 * Validated environment variables
 * Import this instead of process.env
 */
export const env = validateEnv();

/**
 * Check if running in specific environment
 */
export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
