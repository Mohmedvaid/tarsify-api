/**
 * Logger Configuration
 * Pino logger setup for structured logging
 * - dev: detailed logging with pretty output
 * - prod: error-only logging with JSON for GCP Cloud Logging
 */
import pino from 'pino';
import type { LoggerOptions } from 'pino';
import { isDev, isProd } from '@/config/env';

/**
 * Determine log level based on environment
 * - dev: use configured LOG_LEVEL (defaults to debug for detailed logs)
 * - prod: only log errors unless explicitly overridden
 * - test: warn level to reduce noise
 */
function getLogLevel(): string {
  // If LOG_LEVEL is explicitly set, respect it
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }

  // Default levels by environment
  if (isProd) return 'error';
  if (isDev) return 'debug';
  return 'warn'; // test
}

/**
 * Logger configuration options for Fastify
 */
export const loggerOptions: LoggerOptions = {
  level: getLogLevel(),
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {
        // Production: JSON logs for GCP Cloud Logging
        formatters: {
          level: (label: string) => ({ severity: label.toUpperCase() }),
        },
        messageKey: 'message',
        timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
      }),
};

/**
 * Create logger instance with appropriate config based on environment
 */
export const logger = pino(loggerOptions);

/**
 * Create child logger with additional context
 */
export function createLogger(context: Record<string, unknown>): pino.Logger {
  return logger.child(context);
}
