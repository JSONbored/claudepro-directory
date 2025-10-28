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

// ============================================
// CRON TASK EXECUTOR (dependency-resolving, ~150 LOC)
// ============================================

export interface CronTask {
  id: string;
  dependsOn?: string[];
  timeoutMs?: number;
  retry?: { attempts: number; backoffMs: number };
  run: () => Promise<unknown>;
}

export interface CronExecutorOptions {
  lockKey: string;
  lockTtlSec?: number; // default 300s
  deadlineMs?: number; // hard stop for the whole run
  maxConcurrency?: number; // reserved for future; v1 executes sequentially
  operationName?: string;
}

export interface CronTaskResult {
  id: string;
  status: 'success' | 'failed' | 'skipped';
  attempts: number;
  durationMs: number;
  error?: string;
}

export interface CronExecutorSummary {
  success: boolean;
  startedAt: string;
  finishedAt: string;
  totalDurationMs: number;
  results: CronTaskResult[];
}

/** Distributed lock - Not implemented (cron executor currently unused) */
async function acquireLock(lockKey: string, ttlSec: number): Promise<boolean> {
  return true; // No-op - would use PostgreSQL advisory locks if needed
}

/** Topologically sort tasks (Kahn's algorithm). Throws on cycles/unknown deps. */
function topoSort(tasks: CronTask[]): CronTask[] {
  const idToTask = new Map(tasks.map((t) => [t.id, t] as const));
  const indegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const t of tasks) {
    if (!t.id) throw new Error('Task id is required');
    const deps = t.dependsOn || [];
    for (const d of deps) {
      if (!idToTask.has(d)) throw new Error(`Unknown dependency: ${d} for task ${t.id}`);
      adj.set(d, [...(adj.get(d) || []), t.id]);
    }
  }

  for (const t of tasks) {
    indegree.set(t.id, 0);
  }
  for (const [_, list] of adj) {
    for (const v of list) indegree.set(v, (indegree.get(v) || 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, deg] of indegree) if (deg === 0) queue.push(id);

  const order: CronTask[] = [];
  while (queue.length > 0) {
    const id = queue.shift();
    if (!id) break; // Type guard - should never happen given while condition
    const task = idToTask.get(id);
    if (task) order.push(task);
    for (const v of adj.get(id) || []) {
      const nd = (indegree.get(v) || 0) - 1;
      indegree.set(v, nd);
      if (nd === 0) queue.push(v);
    }
  }

  if (order.length !== tasks.length) {
    throw new Error('Cyclic dependency detected in cron task graph');
  }
  return order;
}

/** Wrap a promise with timeout. */
function withTimeout<T>(promise: Promise<T>, timeoutMs?: number): Promise<T> {
  if (!timeoutMs || timeoutMs <= 0) return promise;
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Task timed out')), timeoutMs);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

/** Execute cron tasks with dependency resolution and locking. */
export async function executeCronTasks(
  tasks: CronTask[],
  options: CronExecutorOptions
): Promise<CronExecutorSummary> {
  const startedAt = new Date();
  const startMs = Date.now();
  const {
    lockKey,
    lockTtlSec = 300,
    deadlineMs = 15 * 60 * 1000,
    operationName = 'cron_executor',
  } = options;

  const results: CronTaskResult[] = [];

  // Acquire lock
  const locked = await acquireLock(lockKey, lockTtlSec);
  if (!locked) {
    logger.warn('Cron executor lock not acquired - skipping run', { lockKey, operationName });
    return {
      success: false,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      totalDurationMs: Date.now() - startMs,
      results: [],
    };
  }

  try {
    const order = topoSort(tasks);
    const done = new Set<string>();

    for (const task of order) {
      // Deadline check
      if (Date.now() - startMs > deadlineMs) {
        results.push({
          id: task.id,
          status: 'skipped',
          attempts: 0,
          durationMs: 0,
          error: 'Deadline exceeded',
        });
        logger.warn('Skipping remaining tasks due to deadline', { operationName, taskId: task.id });
        continue;
      }

      // Ensure dependencies completed successfully
      const deps = task.dependsOn || [];
      const unmet = deps.filter((d) => !done.has(d));
      if (unmet.length > 0) {
        results.push({
          id: task.id,
          status: 'skipped',
          attempts: 0,
          durationMs: 0,
          error: `Unmet deps: ${unmet.join(',')}`,
        });
        continue;
      }

      const tStart = Date.now();
      const attempts = Math.max(1, task.retry?.attempts ?? 1);
      const backoff = Math.max(0, task.retry?.backoffMs ?? 1000);
      let attempt = 0;
      let lastErr: Error | null = null;

      for (; attempt < attempts; attempt++) {
        try {
          logger.info('Cron task start', { operationName, taskId: task.id, attempt: attempt + 1 });
          await withTimeout(task.run(), task.timeoutMs);
          const duration = Date.now() - tStart;
          results.push({
            id: task.id,
            status: 'success',
            attempts: attempt + 1,
            durationMs: duration,
          });
          done.add(task.id);
          logger.info('Cron task success', {
            operationName,
            taskId: task.id,
            durationMs: duration,
          });
          break;
        } catch (e) {
          lastErr = e instanceof Error ? e : new Error(String(e));
          logger.warn('Cron task failure', {
            operationName,
            taskId: task.id,
            attempt: attempt + 1,
            error: lastErr.message,
          });
          if (attempt < attempts - 1) {
            await new Promise((r) => setTimeout(r, backoff * (attempt + 1))); // simple linear backoff
          }
        }
      }

      if (!done.has(task.id)) {
        const duration = Date.now() - tStart;
        results.push({
          id: task.id,
          status: 'failed',
          attempts,
          durationMs: duration,
          error: lastErr?.message || 'Unknown error',
        });
        // Do not throw; continue to allow other independent tasks to run
      }
    }
  } finally {
    // Let the lock expire naturally; explicit unlock not needed with EX TTL
  }

  const finishedAt = new Date();
  const totalDurationMs = Date.now() - startMs;
  const success = results.every((r) => r.status !== 'failed');

  logger.info('Cron executor finished', {
    operationName,
    success,
    totalDurationMs,
    tasks: results.length,
    failed: results.filter((r) => r.status === 'failed').length,
  });

  return {
    success,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    totalDurationMs,
    results,
  };
}
