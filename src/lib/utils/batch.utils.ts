/**
 * Batch Processing Utilities
 *
 * Production-grade utilities for parallel async operations with:
 * - Type-safe batch processing with Promise.all/allSettled
 * - Configurable concurrency limits and batching
 * - Error handling and retry logic
 * - Performance monitoring and logging
 * - Memory-efficient chunking for large datasets
 *
 * @module lib/utils/batch.utils
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

/**
 * Settled result discriminated union
 */
export type SettledResult<T> =
  | { status: 'fulfilled'; value: T }
  | { status: 'rejected'; reason: Error };

// ============================================
// CORE BATCH PROCESSING
// ============================================

/**
 * Execute array of promises in parallel with all settling
 *
 * Wrapper around Promise.allSettled with type safety and result parsing.
 * Use when you need ALL operations to complete regardless of failures.
 *
 * @example
 * ```ts
 * const results = await batchAllSettled([
 *   fetchUser(1),
 *   fetchUser(2),
 *   fetchUser(3)
 * ]);
 *
 * console.log(results.successes); // Successfully fetched users
 * console.log(results.failures);  // Failed fetches with errors
 * ```
 *
 * @param promises - Array of promises to execute
 * @param operationName - Name for logging (optional)
 * @returns Batch result with successes and failures
 */
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

/**
 * Execute array of promises in parallel (fail-fast)
 *
 * Wrapper around Promise.all with error handling.
 * Use when you need ALL operations to succeed or none.
 *
 * @example
 * ```ts
 * // All must succeed or throws
 * const users = await batchAll([
 *   fetchUser(1),
 *   fetchUser(2),
 *   fetchUser(3)
 * ]);
 * ```
 *
 * @param promises - Array of promises to execute
 * @param operationName - Name for logging (optional)
 * @returns Array of resolved values
 * @throws If any promise rejects
 */
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

/**
 * Map array of items to promises and execute in parallel
 *
 * Common pattern: `await Promise.all(items.map(async item => process(item)))`
 * This utility adds type safety, error handling, and optional concurrency control.
 *
 * @example
 * ```ts
 * const users = await batchMap(
 *   [1, 2, 3, 4, 5],
 *   async (id) => fetchUser(id),
 *   { concurrency: 2, operationName: 'fetch_users' }
 * );
 * ```
 *
 * @param items - Array of items to process
 * @param mapper - Async function to apply to each item
 * @param options - Batch processing options
 * @returns Array of mapped results (all must succeed)
 * @throws If any operation fails and failFast is true
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

/**
 * Map array to promises with full error tracking (never throws)
 *
 * Similar to batchMap but uses allSettled internally.
 * Returns both successes and failures for inspection.
 *
 * @example
 * ```ts
 * const result = await batchMapSettled(
 *   [1, 2, 3, 4, 5],
 *   async (id) => fetchUser(id)
 * );
 *
 * console.log(`${result.successes.length} succeeded`);
 * console.log(`${result.failures.length} failed`);
 * ```
 *
 * @param items - Array of items to process
 * @param mapper - Async function to apply to each item
 * @param options - Batch processing options
 * @returns BatchResult with successes and failures
 */
export async function batchMapSettled<T, R>(
  items: readonly T[],
  mapper: (item: T, index: number) => Promise<R>,
  options: BatchOptions = {}
): Promise<BatchResult<R>> {
  const {
    concurrency = Number.POSITIVE_INFINITY,
    operationName = 'batch_map_settled',
    chunkSize = 50,
  } = options;

  if (items.length === 0) {
    return {
      successes: [],
      failures: [],
      duration: 0,
      successRate: 0,
    };
  }

  const startTime = Date.now();

  // No concurrency limit
  if (concurrency === Number.POSITIVE_INFINITY) {
    const promises = items.map((item, index) => mapper(item, index));
    return await batchAllSettled(promises, operationName);
  }

  // With concurrency limit
  const allSuccesses: R[] = [];
  const allFailures: Array<{ item: unknown; error: Error }> = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkPromises = chunk.map((item, localIndex) => mapper(item, i + localIndex));

    const chunkResult = await batchAllSettled(chunkPromises, `${operationName}_chunk_${i}`);

    allSuccesses.push(...chunkResult.successes);
    allFailures.push(...chunkResult.failures);
  }

  const duration = Date.now() - startTime;
  const successRate = items.length > 0 ? allSuccesses.length / items.length : 0;

  return {
    successes: allSuccesses,
    failures: allFailures,
    duration,
    successRate,
  };
}

// ============================================
// CHUNKED PROCESSING
// ============================================

/**
 * Process large arrays in memory-efficient chunks
 *
 * Useful for processing thousands of items without overwhelming memory/API limits.
 *
 * @example
 * ```ts
 * await batchProcessChunked(
 *   largeArray,
 *   async (chunk) => {
 *     await bulkInsert(chunk);
 *   },
 *   { chunkSize: 100, operationName: 'bulk_insert' }
 * );
 * ```
 *
 * @param items - Array of items to process
 * @param processor - Function to process each chunk
 * @param options - Batch processing options
 */
export async function batchProcessChunked<T>(
  items: readonly T[],
  processor: (chunk: T[], chunkIndex: number) => Promise<void>,
  options: BatchOptions = {}
): Promise<void> {
  const {
    chunkSize = 50,
    operationName = 'batch_process_chunked',
    logProgress = false,
    failFast = true,
  } = options;

  if (items.length === 0) {
    return;
  }

  const totalChunks = Math.ceil(items.length / chunkSize);
  const startTime = Date.now();

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkIndex = Math.floor(i / chunkSize);

    try {
      await processor(chunk, chunkIndex);

      if (logProgress) {
        logger.info(`Chunk ${chunkIndex + 1}/${totalChunks} processed: ${operationName}`, {
          itemsProcessed: Math.min(i + chunkSize, items.length),
          totalItems: items.length,
        });
      }
    } catch (error) {
      logger.error(
        `Chunk ${chunkIndex + 1} failed: ${operationName}`,
        error instanceof Error ? error : new Error(String(error)),
        {
          chunkIndex,
          chunkSize: chunk.length,
        }
      );

      if (failFast) {
        throw error;
      }
    }
  }

  const duration = Date.now() - startTime;

  logger.debug(`Chunked processing completed: ${operationName}`, {
    totalItems: items.length,
    totalChunks,
    duration,
  });
}

// ============================================
// RETRY LOGIC
// ============================================

/**
 * Execute async operation with retry logic
 *
 * @example
 * ```ts
 * const user = await batchRetry(
 *   () => fetchUser(id),
 *   { retries: 3, retryDelay: 1000, operationName: 'fetch_user' }
 * );
 * ```
 *
 * @param operation - Async operation to execute
 * @param options - Batch options with retry config
 * @returns Result of operation
 * @throws If all retries fail
 */
export async function batchRetry<T>(
  operation: () => Promise<T>,
  options: BatchOptions = {}
): Promise<T> {
  const { retries = 0, retryDelay = 1000, operationName = 'batch_retry' } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < retries) {
        logger.warn(`Retry attempt ${attempt + 1}/${retries}: ${operationName}`, {
          error: lastError.message,
          nextRetryIn: retryDelay,
        });

        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  logger.error(`All retries exhausted: ${operationName}`, lastError || new Error('Unknown error'), {
    retries,
  });

  throw lastError || new Error('Operation failed with no error details');
}

/**
 * Map with retry logic for each item
 *
 * @example
 * ```ts
 * const users = await batchMapWithRetry(
 *   [1, 2, 3],
 *   async (id) => fetchUser(id),
 *   { retries: 2, retryDelay: 500 }
 * );
 * ```
 *
 * @param items - Array of items to process
 * @param mapper - Async mapper function
 * @param options - Batch options with retry config
 * @returns Array of mapped results
 */
export async function batchMapWithRetry<T, R>(
  items: readonly T[],
  mapper: (item: T, index: number) => Promise<R>,
  options: BatchOptions = {}
): Promise<R[]> {
  const { operationName = 'batch_map_retry', ...restOptions } = options;

  return batchMap(
    items,
    async (item, index) => {
      return batchRetry(() => mapper(item, index), {
        ...restOptions,
        operationName: `${operationName}_item_${index}`,
      });
    },
    options
  );
}

// ============================================
// SPECIALIZED HELPERS
// ============================================

/**
 * Load multiple content categories in parallel
 *
 * Common pattern in the codebase - loading agents, mcp, rules, etc.
 *
 * @example
 * ```ts
 * const { agents, mcp, rules } = await batchLoadContent({
 *   agents: lazyContentLoaders.agents(),
 *   mcp: lazyContentLoaders.mcp(),
 *   rules: lazyContentLoaders.rules(),
 * });
 * ```
 *
 * @param loaders - Object with category keys and promise values
 * @returns Object with same keys and resolved values
 */
export async function batchLoadContent<T extends Record<string, Promise<unknown>>>(
  loaders: T
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const keys = Object.keys(loaders) as Array<keyof T>;
  const promises = Object.values(loaders) as Promise<unknown>[];

  const results = await batchAll(promises, 'batch_load_content');

  const loadedContent = {} as { [K in keyof T]: Awaited<T[K]> };

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key !== undefined) {
      loadedContent[key] = results[i] as Awaited<T[typeof key]>;
    }
  }

  return loadedContent;
}

/**
 * Parallel fetch with type-safe tuple return
 *
 * Type-safe wrapper for common parallel fetch patterns.
 * Preserves exact tuple types using TypeScript mapped types.
 *
 * @example
 * ```ts
 * const [users, posts, comments] = await batchFetch([
 *   fetchUsers(),
 *   fetchPosts(),
 *   fetchComments(),
 * ] as const);
 * // Each variable has correct type!
 * ```
 *
 * @param promises - Tuple of promises to execute
 * @returns Tuple of resolved values (preserves types)
 */
export async function batchFetch<T extends readonly Promise<unknown>[] | []>(
  promises: T
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const results = await Promise.all(promises);
  return results as { [K in keyof T]: Awaited<T[K]> };
}

/**
 * Parallel fetch with settled results
 *
 * @example
 * ```ts
 * const [users, posts, comments] = await batchFetchSettled([
 *   fetchUsers(),
 *   fetchPosts(),
 *   fetchComments(),
 * ]);
 * // Each item is SettledResult<T>
 * ```
 *
 * @param promises - Array of promises to execute
 * @returns Array of settled results
 */
export async function batchFetchSettled<T extends readonly Promise<unknown>[]>(
  promises: T
): Promise<{ [K in keyof T]: SettledResult<Awaited<T[K]>> }> {
  const results = await Promise.allSettled(promises);

  return results.map((result) => {
    if (result.status === 'fulfilled') {
      return { status: 'fulfilled' as const, value: result.value };
    }
    return {
      status: 'rejected' as const,
      reason: result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
    };
  }) as { [K in keyof T]: SettledResult<Awaited<T[K]>> };
}

