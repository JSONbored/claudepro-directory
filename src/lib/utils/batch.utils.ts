/**
 * Batch Processing Utilities - Type-safe parallel operations with concurrency control
 */

import { logger } from '@/src/lib/logger';

// ============================================
// TYPES & INTERFACES
// ============================================

/**
 * Result of a batch operation
 */
export interface BatchResult<T> {
  /** Successfully processed items */
  successes: T[];
  /** Failed items with error details */
  failures: Array<{ item: unknown; error: Error }>;
  /** Total processing time in milliseconds */
  duration: number;
  /** Success rate (0-1) */
  successRate: number;
}

/**
 * Options for batch processing
 */
export interface BatchOptions {
  /** Maximum concurrent operations (default: Infinity) */
  concurrency?: number;
  /** Chunk size for processing (default: 50) */
  chunkSize?: number;
  /** Whether to stop on first error (default: false) */
  failFast?: boolean;
  /** Retry attempts for failed operations (default: 0) */
  retries?: number;
  /** Delay between retries in ms (default: 1000) */
  retryDelay?: number;
  /** Operation name for logging (default: 'batch_operation') */
  operationName?: string;
  /** Whether to log progress (default: false) */
  logProgress?: boolean;
}

// ============================================
// CORE BATCH PROCESSING
// ============================================

// ============================================
// MAPPED BATCH PROCESSING
// ============================================

/**
 * Map array to promises with optional concurrency control
 * Performance-optimized: Prevents memory spikes by processing in controlled chunks
 */
export async function batchMap<T, R>(
  items: readonly T[],
  mapper: (item: T, index: number) => Promise<R>,
  options: BatchOptions = {}
): Promise<R[]> {
  const {
    concurrency = Number.POSITIVE_INFINITY,
    operationName = 'batch_map',
    logProgress = false,
    failFast = true,
  } = options;

  if (items.length === 0) {
    return [];
  }

  const startTime = Date.now();

  // No concurrency limit - use Promise.all/allSettled directly
  if (concurrency === Number.POSITIVE_INFINITY) {
    const promises = items.map((item, index) => mapper(item, index));

    if (failFast) {
      // Fail-fast: Stop on first error
      const results = await Promise.all(promises);
      logger.debug(`Batch completed: ${operationName}`, {
        count: results.length,
        duration: Date.now() - startTime,
      });
      return results;
    }

    // Collect all results, log failures
    const results = await Promise.allSettled(promises);
    const successes: R[] = [];
    let failures = 0;

    for (const result of results) {
      if (result.status === 'fulfilled') {
        successes.push(result.value);
      } else {
        failures++;
      }
    }

    if (failures > 0) {
      logger.warn(`Batch had ${failures} failures`, { operationName, failures });
    }

    logger.debug(`Batch completed: ${operationName}`, {
      total: items.length,
      successes: successes.length,
      failures,
      duration: Date.now() - startTime,
    });

    return successes;
  }

  // With concurrency limit - process in controlled chunks (resource-optimized)
  const results: R[] = [];
  let processed = 0;

  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkPromises = chunk.map((item, localIndex) => mapper(item, i + localIndex));

    if (failFast) {
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    } else {
      const chunkResults = await Promise.allSettled(chunkPromises);
      let chunkFailures = 0;

      for (const result of chunkResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          chunkFailures++;
        }
      }

      if (chunkFailures > 0) {
        logger.warn(`Chunk ${i} had failures`, { operationName, failures: chunkFailures });
      }
    }

    processed += chunk.length;

    if (logProgress) {
      logger.info(`Batch progress: ${operationName}`, {
        processed,
        total: items.length,
        percentage: `${((processed / items.length) * 100).toFixed(1)}%`,
      });
    }
  }

  const duration = Date.now() - startTime;

  logger.debug(`Batch completed: ${operationName}`, {
    total: items.length,
    processed: results.length,
    duration,
  });

  return results;
}
