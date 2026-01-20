/**
 * Health Service
 * Business logic for health checks
 */
import { env } from '@/config/env';
import { APP } from '@/config/constants';

/**
 * Health check response structure
 */
export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  service: string;
  version: string;
  environment: string;
  uptime: number;
  checks?: {
    database?: CheckResult;
    firebase?: CheckResult;
    storage?: CheckResult;
  };
}

/**
 * Individual check result
 */
export interface CheckResult {
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  latency?: number;
}

/**
 * Service start time for uptime calculation
 */
const startTime = Date.now();

/**
 * Get basic health status (liveness probe)
 */
export function getBasicHealth(): HealthStatus {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: APP.NAME,
    version: APP.VERSION,
    environment: env.NODE_ENV,
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };
}

/**
 * Get detailed health status (readiness probe)
 * TODO: Add actual checks when services are connected
 */
export async function getDetailedHealth(): Promise<HealthStatus> {
  const checks: HealthStatus['checks'] = {};
  let overallStatus: HealthStatus['status'] = 'healthy';

  // Database check
  checks.database = await checkDatabase();
  if (checks.database.status === 'fail') {
    overallStatus = 'unhealthy';
  } else if (checks.database.status === 'warn') {
    overallStatus = overallStatus === 'healthy' ? 'degraded' : overallStatus;
  }

  // Firebase check (placeholder)
  checks.firebase = await checkFirebase();
  if (checks.firebase.status === 'fail') {
    overallStatus = 'unhealthy';
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    service: APP.NAME,
    version: APP.VERSION,
    environment: env.NODE_ENV,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks,
  };
}

/**
 * Check database connectivity
 * TODO: Implement actual database ping when Prisma is connected
 */
async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();

  try {
    // Placeholder - will be replaced with actual DB ping
    // await prisma.$queryRaw`SELECT 1`;
    
    // For now, check if DATABASE_URL is configured
    if (!env.DATABASE_URL) {
      return {
        status: 'warn',
        message: 'Database URL not configured',
        latency: Date.now() - start,
      };
    }

    return {
      status: 'pass',
      message: 'Database connection ready',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Database check failed',
      latency: Date.now() - start,
    };
  }
}

/**
 * Check Firebase connectivity
 * TODO: Implement actual Firebase check when connected
 */
async function checkFirebase(): Promise<CheckResult> {
  const start = Date.now();

  try {
    // Check if Firebase credentials are configured
    const hasConsumerFirebase = env.FIREBASE_USERS_PROJECT_ID;
    const hasDeveloperFirebase = env.FIREBASE_DEVS_PROJECT_ID;

    if (!hasConsumerFirebase && !hasDeveloperFirebase) {
      return {
        status: 'warn',
        message: 'Firebase not configured',
        latency: Date.now() - start,
      };
    }

    return {
      status: 'pass',
      message: 'Firebase configuration ready',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Firebase check failed',
      latency: Date.now() - start,
    };
  }
}
