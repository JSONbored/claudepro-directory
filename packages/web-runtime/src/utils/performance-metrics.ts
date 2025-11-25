/**
 * Performance Metrics Utility
 * 
 * Provides standardized performance tracking for data fetching operations.
 * Use this for non-cached data fetching, direct DB queries, and external API calls.
 */

import { logger } from '../logger.ts';
import { generateRequestId } from './request-context.ts';
import type { LogContext } from '../logger.ts';

export interface PerformanceMetricsOptions {
  operation: string;
  requestId?: string;
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
    logMeta = {},
    logLevel = 'info',
    slowThreshold = 1000,
  } = options;

  const startTime = performance.now();
  const requestId = providedRequestId ?? generateRequestId();

  try {
    const result = await operation();
    const duration = performance.now() - startTime;
    const roundedDuration = Math.round(duration);

    // Always log slow operations as warnings
    if (duration > slowThreshold) {
      logger.warn(`Slow operation detected: ${operationName}`, {
        requestId,
        operation: operationName,
        duration: roundedDuration,
        slowThreshold,
        ...logMeta,
      } as LogContext);
    } else if (logLevel === 'info') {
      // Log all operations at info level (useful for debugging)
      logger.info(`Operation completed: ${operationName}`, {
        requestId,
        operation: operationName,
        duration: roundedDuration,
        ...logMeta,
      } as LogContext);
    } else if (logLevel === 'debug' && process.env.NODE_ENV === 'development') {
      // Only log in development for debug level
      logger.info(`Operation completed: ${operationName}`, {
        requestId,
        operation: operationName,
        duration: roundedDuration,
        ...logMeta,
      } as LogContext);
    }

    return { result, duration, requestId };
  } catch (error) {
    const duration = performance.now() - startTime;
    const roundedDuration = Math.round(duration);

    // Always log errors with duration
    logger.error(`Operation failed: ${operationName}`, error instanceof Error ? error : new Error(String(error)), {
      requestId,
      operation: operationName,
      duration: roundedDuration,
      ...logMeta,
    } as LogContext);

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
    logMeta = {},
    logLevel = 'info',
    slowThreshold = 1000,
  } = options;

  const startTime = performance.now();
  const requestId = providedRequestId ?? generateRequestId();

  try {
    const result = operation();
    const duration = performance.now() - startTime;
    const roundedDuration = Math.round(duration);

    // Always log slow operations as warnings
    if (duration > slowThreshold) {
      logger.warn(`Slow operation detected: ${operationName}`, {
        requestId,
        operation: operationName,
        duration: roundedDuration,
        slowThreshold,
        ...logMeta,
      } as LogContext);
    } else if (logLevel === 'info') {
      logger.info(`Operation completed: ${operationName}`, {
        requestId,
        operation: operationName,
        duration: roundedDuration,
        ...logMeta,
      } as LogContext);
    } else if (logLevel === 'debug' && process.env.NODE_ENV === 'development') {
      logger.info(`Operation completed: ${operationName}`, {
        requestId,
        operation: operationName,
        duration: roundedDuration,
        ...logMeta,
      } as LogContext);
    }

    return { result, duration, requestId };
  } catch (error) {
    const duration = performance.now() - startTime;
    const roundedDuration = Math.round(duration);

    logger.error(`Operation failed: ${operationName}`, error instanceof Error ? error : new Error(String(error)), {
      requestId,
      operation: operationName,
      duration: roundedDuration,
      ...logMeta,
    } as LogContext);

    throw error;
  }
}
