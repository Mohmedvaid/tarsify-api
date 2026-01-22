/**
 * Prisma Database Client
 * Singleton instance with connection management
 * Handles graceful shutdown and connection pooling
 */
import { PrismaClient } from '@prisma/client';
import { env, isDev, isTest } from '@/config/env';
import { logger } from '@/lib/logger';

/**
 * Prisma log level type
 */
type PrismaLogLevel = 'query' | 'warn' | 'error';

/**
 * Prisma log levels based on environment
 */
const getLogLevels = (): PrismaLogLevel[] => {
  if (isTest) return [];
  if (isDev) return ['query', 'warn', 'error'];
  return ['warn', 'error'];
};

/**
 * Create Prisma client with logging
 */
function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: getLogLevels().map((level) => ({
      emit: 'event' as const,
      level,
    })),
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });

  // Log queries in development
  if (isDev) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client.$on as any)('query', (e: { query: string; duration: number }) => {
      logger.debug({ query: e.query, duration: `${e.duration}ms` }, 'Prisma query');
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client.$on as any)('warn', (e: { message: string }) => {
    logger.warn({ message: e.message }, 'Prisma warning');
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client.$on as any)('error', (e: { message: string }) => {
    logger.error({ message: e.message }, 'Prisma error');
  });

  return client;
}

/**
 * Singleton Prisma client
 */
class PrismaDatabase {
  private static instance: PrismaClient | null = null;
  private static isConnected = false;

  /**
   * Get the Prisma client instance
   * Creates a new instance if one doesn't exist
   */
  static getClient(): PrismaClient {
    if (!PrismaDatabase.instance) {
      PrismaDatabase.instance = createPrismaClient();
    }
    return PrismaDatabase.instance;
  }

  /**
   * Connect to the database
   * Call this at application startup
   */
  static async connect(): Promise<void> {
    if (PrismaDatabase.isConnected) {
      logger.debug('Database already connected');
      return;
    }

    const client = PrismaDatabase.getClient();

    try {
      await client.$connect();
      PrismaDatabase.isConnected = true;
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to connect to database');
      throw error;
    }
  }

  /**
   * Disconnect from the database
   * Call this during graceful shutdown
   */
  static async disconnect(): Promise<void> {
    if (!PrismaDatabase.instance) {
      return;
    }

    try {
      await PrismaDatabase.instance.$disconnect();
      PrismaDatabase.isConnected = false;
      PrismaDatabase.instance = null;
      logger.info('Database disconnected');
    } catch (error) {
      logger.error({ error }, 'Error disconnecting from database');
      throw error;
    }
  }

  /**
   * Check if database is connected
   */
  static isReady(): boolean {
    return PrismaDatabase.isConnected;
  }

  /**
   * Health check query
   */
  static async healthCheck(): Promise<boolean> {
    if (!PrismaDatabase.instance) {
      return false;
    }

    try {
      await PrismaDatabase.instance.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reset client (for testing)
   */
  static async reset(): Promise<void> {
    await PrismaDatabase.disconnect();
    PrismaDatabase.instance = null;
  }
}

/**
 * Export singleton client getter
 */
export const prisma = PrismaDatabase.getClient();

/**
 * Export database management functions
 */
export const db = {
  connect: PrismaDatabase.connect,
  disconnect: PrismaDatabase.disconnect,
  isReady: PrismaDatabase.isReady,
  healthCheck: PrismaDatabase.healthCheck,
  reset: PrismaDatabase.reset,
  getClient: PrismaDatabase.getClient,
};

/**
 * Default export for convenience
 */
export default prisma;
