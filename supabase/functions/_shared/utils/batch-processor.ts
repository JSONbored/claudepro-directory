/**
 * Batch processing utility with concurrency control
 * Handles errors, retries, and progress tracking
 */

import { errorToString } from './error-handling.ts';
import { createUtilityContext } from './logging.ts';

export interface BatchProcessOptions<T> {
  concurrency?: number;
  retries?: number;
  retryDelayMs?: number;
  onProgress?: (processed: number, total: number, failed: number) => void;
  onError?: (item: T, error: unknown, attempt: number) => void;
}

export interface BatchProcessResult<T> {
  success: T[];
  failed: Array<{ item: T; error: unknown }>;
  total: number;
  successCount: number;
  failedCount: number;
}

/**
 * Process items in batches with concurrency control
 * @param items - Items to process
 * @param processor - Function to process each item
 * @param options - Processing options
 * @returns Processing results
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: BatchProcessOptions<T> = {}
): Promise<BatchProcessResult<T>> {
  const { concurrency = 5, retries = 0, retryDelayMs = 1000, onProgress, onError } = options;

  const logContext = createUtilityContext('batch-processor', 'process', {
    total_items: items.length,
    concurrency,
    retries,
  });

  console.log('[batch-processor] Starting batch processing', logContext);

  const success: T[] = [];
  const failed: Array<{ item: T; error: unknown }> = [];
  let processed = 0;

  // Process items with concurrency limit
  const processItem = async (item: T): Promise<void> => {
    let lastError: unknown;
    let attempt = 0;

    // Retry logic
    while (attempt <= retries) {
      try {
        await processor(item);
        success.push(item);
        processed++;
        if (onProgress) {
          onProgress(processed, items.length, failed.length);
        }
        return;
      } catch (error) {
        lastError = error;
        attempt++;

        if (onError) {
          onError(item, error, attempt);
        }

        const itemLogContext = createUtilityContext('batch-processor', 'item-error', {
          attempt,
          total_retries: retries,
          item_index: items.indexOf(item),
        });
        console.warn('[batch-processor] Item processing failed, retrying', {
          ...itemLogContext,
          error: errorToString(error),
        });

        // Wait before retry (exponential backoff)
        if (attempt <= retries) {
          const delay = retryDelayMs * 2 ** (attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    const itemLogContext = createUtilityContext('batch-processor', 'item-failed', {
      item_index: items.indexOf(item),
      total_retries: retries,
    });
    console.error('[batch-processor] Item processing failed after all retries', {
      ...itemLogContext,
      error: errorToString(lastError),
    });
    failed.push({ item, error: lastError });
    processed++;
    if (onProgress) {
      onProgress(processed, items.length, failed.length);
    }
  };

  // Process in batches with concurrency limit
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    batches.push(items.slice(i, i + concurrency));
  }

  for (const batch of batches) {
    await Promise.all(batch.map(processItem));
  }

  const result = {
    success,
    failed,
    total: items.length,
    successCount: success.length,
    failedCount: failed.length,
  };

  console.log('[batch-processor] Batch processing completed', {
    ...logContext,
    success_count: result.successCount,
    failed_count: result.failedCount,
    success_rate: `${((result.successCount / result.total) * 100).toFixed(1)}%`,
  });

  return result;
}

/**
 * Process items sequentially (for operations that must not run in parallel)
 * @param items - Items to process
 * @param processor - Function to process each item
 * @param options - Processing options
 * @returns Processing results
 */
export async function batchProcessSequential<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: Omit<BatchProcessOptions<T>, 'concurrency'> = {}
): Promise<BatchProcessResult<T>> {
  return batchProcess(items, processor, { ...options, concurrency: 1 });
}
