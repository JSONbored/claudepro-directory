/**
 * Batch processing utility with concurrency control
 * Handles errors, retries, and progress tracking
 */

import { createUtilityContext, logError, logInfo, logWarn } from './logging.ts';

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

  logInfo('Starting batch processing', logContext);

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

        const logContext = createUtilityContext('batch-processor', 'item-error', {
          attempt,
          total_retries: retries,
          item_index: items.indexOf(item),
        });
        logWarn('Item processing failed, retrying', logContext);

        // Wait before retry (exponential backoff)
        if (attempt <= retries) {
          const delay = retryDelayMs * 2 ** (attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    const logContext = createUtilityContext('batch-processor', 'item-failed', {
      item_index: items.indexOf(item),
      total_retries: retries,
    });
    await logError('Item processing failed after all retries', logContext, lastError);
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

  logInfo('Batch processing completed', {
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
