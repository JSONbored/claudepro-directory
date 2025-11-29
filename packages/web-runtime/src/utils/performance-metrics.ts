/**
 * Performance Metrics Utility
 * 
 * Provides standardized performance tracking for data fetching operations.
 * Use this for non-cached data fetching, direct DB queries, and external API calls.
 */

import { isDevelopment } from '@heyclaude/shared-runtime/schemas/env';

import { logger } from '../logger.ts';
import { generateRequestId } from './request-id.ts';
import { normalizeError } from '../errors.ts';

export interface PerformanceMetricsOptions {
  operation: string;
  requestId?: string;
  /**
   * Optional child logger to use instead of base logger
   * If provided, requestId and operation from logger bindings will be used
   */
  logger?: typeof logger;
  logMeta?: Record<string, unknown>;
  /**
   * Log level for successful operations
   * - 'info': Log all operations (default for development)
   * - 'debug': Only log in debug mode
   * - 'none': Don't log successful operations (only errors)
   */
  logLevel?: 'info' | 'debug' | 'none';
  /**
   * Threshold in milliseconds - operations slower than this will be logged as warnings
   * Default: 1000ms (1 second)
   */
  slowThreshold?: number;
}

export interface PerformanceMetricsResult<T> {
  result: T;
  duration: number;
  requestId: string;
}

/**
 * Track performance metrics for a data fetching operation
 * 
 * @example
 * ```typescript
 * const { result, duration, requestId } = await trackPerformance(
 *   async () => {
 *     // Your data fetching operation
 *     return await someAsyncOperation();
 *   },
 *   {
 *     operation: 'getUserData',
 *     logMeta: { userId: '123' }
 *   }
 * );
 * ```
 */
export async function trackPerformance<T>(
  operation: () => Promise<T>,
  options: PerformanceMetricsOptions
): Promise<PerformanceMetricsResult<T>> {
  const {
    operation: operationName,
    requestId: providedRequestId,
    logger: providedLogger,
    logMeta = {},
    logLevel = 'info',
    slowThreshold = 1000,
  } = options;

  const startTime = performance.now();
  const requestId = providedRequestId ?? generateRequestId();
  
  // Use provided child logger if available, otherwise create one from base logger
  // This avoids passing requestId/operation in every log call
  const perfLogger = providedLogger ?? logger.child({
    requestId,
    operation: operationName,
  });

  try {
    const result = await operation();
    const duration = performance.now() - startTime;
    const roundedDuration = Math.round(duration);

    // Always log slow operations as warnings
    if (duration > slowThreshold) {
      perfLogger.warn(`Slow operation detected: ${operationName}`, {
        duration: roundedDuration,
        slowThreshold,
        ...logMeta,
      });
    } else if (logLevel === 'info') {
      // Log all operations at info level (useful for debugging)
      perfLogger.info(`Operation completed: ${operationName}`, {
        duration: roundedDuration,
        ...logMeta,
      });
    } else if (logLevel === 'debug' && isDevelopment) {
      // Only log in development for debug level
      perfLogger.info(`Operation completed: ${operationName}`, {
        duration: roundedDuration,
        ...logMeta,
      });
    }

    return { result, duration, requestId };
  } catch (error) {
    const duration = performance.now() - startTime;
    const roundedDuration = Math.round(duration);

    // Always log errors with duration
    const normalized = normalizeError(error, `Operation failed: ${operationName}`);
    perfLogger.error(`Operation failed: ${operationName}`, normalized, {
      duration: roundedDuration,
      ...logMeta,
    });

    throw error;
  }
}

/**
 * Track performance metrics for a synchronous operation
 */
export function trackPerformanceSync<T>(
  operation: () => T,
  options: PerformanceMetricsOptions
): PerformanceMetricsResult<T> {
  const {
    operation: operationName,
    requestId: providedRequestId,
    logger: providedLogger,
    logMeta = {},
    logLevel = 'info',
    slowThreshold = 1000,
  } = options;

  const startTime = performance.now();
  const requestId = providedRequestId ?? generateRequestId();
  
  // Use provided child logger if available, otherwise create one from base logger
  // This avoids passing requestId/operation in every log call
  const perfLogger = providedLogger ?? logger.child({
    requestId,
    operation: operationName,
  });

  try {
    const result = operation();
    const duration = performance.now() - startTime;
    const roundedDuration = Math.round(duration);

    // Always log slow operations as warnings
    if (duration > slowThreshold) {
      perfLogger.warn(`Slow operation detected: ${operationName}`, {
        duration: roundedDuration,
        slowThreshold,
        ...logMeta,
      });
    } else if (logLevel === 'info') {
      perfLogger.info(`Operation completed: ${operationName}`, {
        duration: roundedDuration,
        ...logMeta,
      });
    } else if (logLevel === 'debug' && isDevelopment) {
      perfLogger.info(`Operation completed: ${operationName}`, {
        duration: roundedDuration,
        ...logMeta,
      });
    }

    return { result, duration, requestId };
  } catch (error) {
    const duration = performance.now() - startTime;
    const roundedDuration = Math.round(duration);

    const normalized = normalizeError(error, `Operation failed: ${operationName}`);
    perfLogger.error(`Operation failed: ${operationName}`, normalized, {
      duration: roundedDuration,
      ...logMeta,
    });

    throw error;
  }
}
