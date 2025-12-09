/**
 * Batch processing utility with concurrency control
 * Handles errors, retries, and progress tracking
 */

import { logger, normalizeError } from './logger/index.ts';

// =============================================================================
// BatchProcessor Class (Queue-style API)
// =============================================================================

export interface BatchProcessorOptions<T> {
  /** Number of items to accumulate before processing */
  batchSize: number;
  /** Interval in ms to flush incomplete batches */
  flushInterval: number;
  /** Function to process a batch of items */
  processor: (items: T[]) => Promise<void>;
}

/**
 * Queue-style batch processor that accumulates items and processes them
 * when either the batch size is reached or the flush interval expires.
 */
export class BatchProcessor<T> {
  private batch: T[] = [];
  private readonly batchSize: number;
  private readonly flushInterval: number;
  private readonly processor: (items: T[]) => Promise<void>;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private isShutdown = false;
  private isProcessing = false;
  private processingPromise: Promise<void> | null = null;

  constructor(options: BatchProcessorOptions<T>) {
    this.batchSize = options.batchSize;
    this.flushInterval = options.flushInterval;
    this.processor = options.processor;
    this.scheduleFlush();
  }

  /**
   * Add an item to the batch. Triggers processing if batch size is reached.
   */
  add(item: T): void {
    if (this.isShutdown) {
      return;
    }

    this.batch.push(item);

    if (this.batch.length >= this.batchSize) {
      void this.processBatch();
    }
  }

  /**
   * Flush pending items immediately.
   */
  async flush(): Promise<void> {
    // Wait for any ongoing processing to complete
    if (this.processingPromise) {
      await this.processingPromise;
    }

    if (this.batch.length > 0) {
      await this.processBatch();
    }
  }

  /**
   * Shutdown the processor, flushing any pending items.
   */
  async shutdown(): Promise<void> {
    this.isShutdown = true;
    this.cancelScheduledFlush();
    await this.flush();
  }

  private scheduleFlush(): void {
    // Use setTimeout instead of setInterval to avoid infinite loops with fake timers
    this.cancelScheduledFlush();
    if (!this.isShutdown) {
      this.flushTimer = setTimeout(() => {
        if (this.batch.length > 0 && !this.isProcessing) {
          void this.processBatch()
            .then(() => {
              // Re-schedule after processing
              this.scheduleFlush();
            })
            .catch(async (error) => {
              // Log error and continue the flush loop to prevent it from stopping
              const normalized = normalizeError(error, 'Batch flush loop failed');
              logger.error({ 
                err: normalized, 
                function: 'batch-processor', 
                operation: 'flush-loop',
                flush_interval_ms: this.flushInterval,
              }, 'Batch flush loop failed');
              // Re-schedule even after error to keep the loop running
              this.scheduleFlush();
            });
        } else {
          // Re-schedule even if nothing to process
          this.scheduleFlush();
        }
      }, this.flushInterval);
    }
  }

  private cancelScheduledFlush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private async processBatch(): Promise<void> {
    if (this.batch.length === 0 || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    const itemsToProcess = [...this.batch];
    this.batch = [];

    this.processingPromise = (async () => {
      try {
        await this.processor(itemsToProcess);
      } catch (error) {
        // Log error but don't throw - continue processing
        const normalized = normalizeError(error, 'Batch processing failed');
        logger.error({ 
          err: normalized, 
          function: 'batch-processor', 
          operation: 'process-batch',
          batch_size: itemsToProcess.length,
        }, 'Batch processing failed');
      } finally {
        this.isProcessing = false;
        this.processingPromise = null;
        
        // Check if more items accumulated during processing
        if (this.batch.length >= this.batchSize) {
          void this.processBatch();
        }
      }
    })();

    await this.processingPromise;
  }
}

// =============================================================================
// batchProcess Function (Array-style API)
// =============================================================================

export interface BatchProcessOptions<T> {
  concurrency?: number;
  onError?: (item: T, error: unknown, attempt: number) => void;
  onProgress?: (processed: number, total: number, failed: number) => void;
  retries?: number;
  retryDelayMs?: number;
}

export interface BatchProcessResult<T> {
  failed: Array<{ error: unknown; item: T }>;
  failedCount: number;
  success: T[];
  successCount: number;
  total: number;
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

  const logContext = {
    function: 'batch-processor',
    operation: 'process',
    total_items: items.length,
    concurrency,
    retries,
  };

  logger.info(logContext, 'Starting batch processing');

  const success: T[] = [];
  const failed: Array<{ error: unknown; item: T }> = [];
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

        logger.warn({
          ...logContext,
          operation: 'item-error',
          attempt,
          item_index: items.indexOf(item),
          total_retries: retries,
        }, 'Item processing failed, retrying');

        // Wait before retry (exponential backoff)
        if (attempt <= retries) {
          const delay = retryDelayMs * 2 ** (attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    const normalized = normalizeError(lastError, 'Item processing failed after all retries');
    logger.error({
      err: normalized,
      ...logContext,
      operation: 'item-failed',
      item_index: items.indexOf(item),
      total_retries: retries,
    }, 'Item processing failed after all retries');
    failed.push({ error: lastError, item });
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
    await Promise.all(batch.map((item) => processItem(item)));
  }

  const result = {
    success,
    failed,
    total: items.length,
    successCount: success.length,
    failedCount: failed.length,
  };

  logger.info({
    ...logContext,
    success_count: result.successCount,
    failed_count: result.failedCount,
    success_rate: `${((result.successCount / result.total) * 100).toFixed(1)}%`,
  }, 'Batch processing completed');

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
