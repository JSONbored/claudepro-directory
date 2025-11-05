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

/** Execute promises in parallel - all must complete (allSettled wrapper) */
export async function batchAllSettled<T>(
  promises: Promise<T>[],
  operationName = 'batch_operation'
): Promise<BatchResult<T>> {
  const startTime = Date.now();

  const results = await Promise.allSettled(promises);

  const successes: T[] = [];
  const failures: Array<{ item: unknown; error: Error }> = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      successes.push(result.value);
    } else {
      failures.push({
        item: null, // No original item context in Promise.allSettled
        error: result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
      });
    }
  }

  const duration = Date.now() - startTime;
  const successRate = promises.length > 0 ? successes.length / promises.length : 0;

  logger.debug(`Batch operation completed: ${operationName}`, {
    total: promises.length,
    successes: successes.length,
    failures: failures.length,
    duration,
    successRate: `${(successRate * 100).toFixed(1)}%`,
  });

  return {
    successes,
    failures,
    duration,
    successRate,
  };
}

/** Execute promises in parallel - fail-fast (Promise.all wrapper) */
export async function batchAll<T>(
  promises: Promise<T>[],
  operationName = 'batch_operation'
): Promise<T[]> {
  const startTime = Date.now();

  try {
    const results = await Promise.all(promises);

    const duration = Date.now() - startTime;

    logger.debug(`Batch operation succeeded: ${operationName}`, {
      count: results.length,
      duration,
    });

    return results;
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error(
      `Batch operation failed: ${operationName}`,
      error instanceof Error ? error : new Error(String(error)),
      {
        count: promises.length,
        duration,
      }
    );

    throw error;
  }
}

// ============================================
// MAPPED BATCH PROCESSING
// ============================================

/** Map array to promises with optional concurrency control */
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

  // No concurrency limit - use Promise.all
  if (concurrency === Number.POSITIVE_INFINITY) {
    const promises = items.map((item, index) => mapper(item, index));

    if (failFast) {
      const results = await batchAll(promises, operationName);
      return results;
    }

    const batchResult = await batchAllSettled(promises, operationName);

    if (batchResult.failures.length > 0) {
      logger.warn(`Batch map had ${batchResult.failures.length} failures`, {
        operationName,
        failures: batchResult.failures.length,
      });
    }

    return batchResult.successes;
  }

  // With concurrency limit - process in controlled batches
  const results: R[] = [];
  let processed = 0;

  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkPromises = chunk.map((item, localIndex) => mapper(item, i + localIndex));

    if (failFast) {
      const chunkResults = await batchAll(chunkPromises, `${operationName}_chunk_${i}`);
      results.push(...chunkResults);
    } else {
      const chunkBatchResult = await batchAllSettled(chunkPromises, `${operationName}_chunk_${i}`);
      results.push(...chunkBatchResult.successes);

      if (chunkBatchResult.failures.length > 0) {
        logger.warn(`Chunk ${i} had failures`, {
          operationName,
          failures: chunkBatchResult.failures.length,
        });
      }
    }

    processed += chunk.length;

    if (logProgress) {
      logger.info(`Batch map progress: ${operationName}`, {
        processed,
        total: items.length,
        percentage: `${((processed / items.length) * 100).toFixed(1)}%`,
      });
    }
  }

  const duration = Date.now() - startTime;

  logger.debug(`Batch map completed: ${operationName}`, {
    total: items.length,
    processed: results.length,
    duration,
  });

  return results;
}

// ============================================
// TYPE-SAFE PARALLEL FETCH
// ============================================

/** Parallel fetch with type-safe tuple return */
export async function batchFetch<T extends readonly Promise<unknown>[] | []>(
  promises: T
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const results = await Promise.all(promises);
  return results as { [K in keyof T]: Awaited<T[K]> };
}
