/**
 * Unified Queue Processor
 * Smart polling, sequential processing of all PGMQ queues
 *
 * Features:
 * - Smart polling: Only processes queues with messages (checks metrics first)
 * - Sequential processing: Processes queues one at a time to avoid DB overload
 * - Error isolation: One queue failure doesn't stop others
 * - Internal + external queues: Handles both flux-station handlers and external edge functions
 *
 * Called by pg_cron job every 2 minutes to process all queues automatically.
 */

import { edgeEnv } from '@heyclaude/edge-runtime/config/env.ts';
import { initRequestLogging, traceRequestComplete, traceStep } from '@heyclaude/edge-runtime/utils/logger-helpers.ts';
import { pgmqMetrics } from '@heyclaude/edge-runtime/utils/pgmq-client.ts';
import { createUtilityContext, logError, logInfo } from '@heyclaude/shared-runtime/logging.ts';
import { getProperty } from '@heyclaude/shared-runtime/object-utils.ts';
import { normalizeError } from '@heyclaude/shared-runtime/error-handling.ts';
import { TIMEOUT_PRESETS, withTimeout } from '@heyclaude/shared-runtime/timeout.ts';
import { handleChangelogNotify } from './changelog/notify.ts';
import { handleChangelogProcess } from './changelog/process.ts';
import { handleDiscordJobs } from './discord/jobs.ts';
import { handleDiscordSubmissions } from './discord/submissions.ts';
import { handleEmbeddingGenerationQueue } from './embedding/index.ts';
import { handleImageGenerationQueue } from './image-generation/index.ts';
import { handlePulse } from './pulse.ts';
import { handleRevalidation } from './revalidation.ts';

const {
  supabase: { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY },
} = edgeEnv;

/**
 * Queue configuration
 * Defines all queues, their handlers, and processing priority
 */
interface QueueConfig {
  name: string;
  handler: 'internal' | 'external';
  handlerFn?: (req: Request) => Promise<Response>;
  endpoint?: string; // For external handlers
  priority: number; // Lower = processed first
}

const QUEUE_REGISTRY: QueueConfig[] = [
  // Internal queues (flux-station handlers)
  { name: 'pulse', handler: 'internal', handlerFn: handlePulse, priority: 1 },
  {
    name: 'changelog_process',
    handler: 'internal',
    handlerFn: handleChangelogProcess,
    priority: 2,
  },
  { name: 'changelog_notify', handler: 'internal', handlerFn: handleChangelogNotify, priority: 3 },
  { name: 'discord_jobs', handler: 'internal', handlerFn: handleDiscordJobs, priority: 4 },
  {
    name: 'discord_submissions',
    handler: 'internal',
    handlerFn: handleDiscordSubmissions,
    priority: 5,
  },
  { name: 'revalidation', handler: 'internal', handlerFn: handleRevalidation, priority: 6 },
  {
    name: 'embedding_generation',
    handler: 'internal',
    handlerFn: handleEmbeddingGenerationQueue,
    priority: 7,
  },
  {
    name: 'image_generation',
    handler: 'internal',
    handlerFn: handleImageGenerationQueue,
    priority: 8,
  },

  // External queues (other edge functions)
  {
    name: 'package_generation',
    handler: 'external',
    endpoint: '/functions/v1/public-api/content/generate-package/process',
    priority: 9,
  },
];

/**
 * Queue processing result
 */
interface QueueProcessingResult {
  queue: string;
  success: boolean;
  queueLength: number;
  error?: string;
  processed?: number; // Number of messages processed (from response)
}

/**
 * Summary of queue processing run
 */
export interface QueueProcessingSummary {
  totalQueues: number;
  queuesWithMessages: number;
  queuesAttempted: number;
  queuesSucceeded: number;
  results: QueueProcessingResult[];
}

/**
 * Retrieve the current message count for a named queue.
 *
 * @param queueName - The identifier of the queue to inspect.
 * @returns The queue's `queue_length` (number of pending messages); returns `0` if the queue is empty or if metrics could not be retrieved.
 */
async function checkQueueMetrics(queueName: string): Promise<number> {
  try {
    const metrics = await pgmqMetrics(queueName);
    // If metrics is null (error case), treat as empty (safe fallback)
    // If metrics exists, return queue_length
    return metrics?.queue_length ?? 0;
  } catch (error) {
    // If metrics check fails, treat as empty (safe fallback)
    const logContext = createUtilityContext('flux-station', 'queue-processor-metrics', {
      queue_name: queueName,
    });
    await logError(`Failed to check metrics for queue '${queueName}'`, logContext, error);
    return 0;
  }
}

/**
 * Invoke an internal queue handler and produce a structured processing result.
 *
 * @param config - Queue configuration (must include `handlerFn` for internal queues); `config.name` is used in the result.
 * @param queueLength - Observed number of messages in the queue at the time of the check.
 * @returns A QueueProcessingResult containing the queue name, whether processing succeeded, the observed `queueLength`, and optional `processed` count and `error` message.
 */
async function processInternalQueue(
  config: QueueConfig,
  queueLength: number
): Promise<QueueProcessingResult> {
  try {
    if (!config.handlerFn) {
      throw new Error(`Internal queue '${config.name}' missing handlerFn`);
    }

    // Create a minimal request object for the handler
    const request = new Request('http://localhost', { method: 'POST' });
    const response = await withTimeout(
      config.handlerFn(request),
      TIMEOUT_PRESETS.external,
      `Internal queue '${config.name}' handler timed out`
    );

    // Try to extract processed count and error from response body
    let processed: number | undefined;
    let errorMessage: string | undefined;

    try {
      const body = await response.json();
      // Validate response structure
      if (typeof body === 'object' && body !== null) {
        const processedValue = getProperty(body, 'processed');
        if (typeof processedValue === 'number') {
          processed = processedValue;
        }

        // Extract error field if present
        const errorValue = getProperty(body, 'error');
        if (typeof errorValue === 'string') {
          errorMessage = errorValue;
        } else if (errorValue && typeof errorValue === 'object') {
          errorMessage = JSON.stringify(errorValue);
        }
      }
    } catch {
      // Response might not be JSON, that's okay
    }

    // Build error string if response is not OK
    if (!response.ok) {
      const baseError = `HTTP ${response.status} ${response.statusText}`;
      errorMessage = errorMessage ? `${baseError}: ${errorMessage}` : baseError;
    }

    return {
      queue: config.name,
      success: response.ok,
      queueLength,
      ...(processed !== undefined && { processed }),
      ...(errorMessage && { error: errorMessage }),
    };
  } catch (error) {
    return {
      queue: config.name,
      success: false,
      queueLength,
      error: normalizeError(error, 'Queue processing failed').message,
    };
  }
}

/**
 * Invokes the configured external edge-function for a queue and returns its processing result.
 *
 * Attempts to extract optional `processed` and `error` fields from the function's response
 * and includes the observed `queueLength` in the returned result. `config.endpoint` must be present.
 *
 * @param config - Queue configuration for the external queue; must include `endpoint`
 * @param queueLength - Number of messages observed in the queue when checked
 * @returns A `QueueProcessingResult` containing the queue name, `success` flag, the observed `queueLength`, and optionally `processed` (number of messages processed) or `error` (error message)
 */
async function processExternalQueue(
  config: QueueConfig,
  queueLength: number
): Promise<QueueProcessingResult> {
  try {
    if (!config.endpoint) {
      throw new Error(`External queue '${config.name}' missing endpoint`);
    }

    const url = `${SUPABASE_URL}${config.endpoint}`;
    // Add timeout protection to prevent hanging the entire queue processor
    const response = await withTimeout(
      fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      }),
      TIMEOUT_PRESETS.external,
      `External queue '${config.name}' request timed out`
    );

    // Try to extract processed count and error from response body
    let processed: number | undefined;
    let errorMessage: string | undefined;
    try {
      const body = await response.json();
      // Validate response structure
      if (typeof body === 'object' && body !== null) {
        const processedValue = getProperty(body, 'processed');
        if (typeof processedValue === 'number') {
          processed = processedValue;
        }

        const errorValue = getProperty(body, 'error');
        if (typeof errorValue === 'string') {
          errorMessage = errorValue;
        } else if (errorValue && typeof errorValue === 'object') {
          errorMessage = JSON.stringify(errorValue);
        }
      }
    } catch {
      // Response might not be JSON, that's okay
    }

    if (!response.ok) {
      const logContext = createUtilityContext('queue-processor', 'process-external-queue', {
        queue: config.name,
        queueLength,
        status: response.status,
      });
      const error = new Error(errorMessage || `HTTP ${response.status} ${response.statusText}`);
      await logError('External queue processing failed', logContext, error);
      
      return {
        queue: config.name,
        success: false,
        queueLength,
        error: errorMessage || `HTTP ${response.status} ${response.statusText}`,
      };
    }

    return {
      queue: config.name,
      success: true,
      queueLength,
      ...(processed !== undefined && { processed }),
    };
  } catch (error) {
    return {
      queue: config.name,
      success: false,
      queueLength,
      error: normalizeError(error, 'Queue processing failed').message,
    };
  }
}

/**
 * Orchestrates smart polling and sequential processing of registered queues that currently have messages.
 *
 * Checks metrics for all registered queues, filters to those with queue_length > 0, sorts them by priority,
 * and processes each queue one at a time (internal handlers invoked or external endpoints called). Individual
 * queue failures are isolated so a failure in one queue does not prevent processing of the remaining queues.
 *
 * @returns The aggregate processing summary as a `QueueProcessingSummary`, including totals and per-queue results.
 */
export async function processAllQueues(): Promise<QueueProcessingSummary> {
  const startTime = Date.now();
  const logContext = createUtilityContext('flux-station', 'queue-processor', {});
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Starting queue processor', logContext);

  // 1. Check metrics for all queues in parallel (fast, non-blocking)
  traceStep('Checking queue metrics', logContext);
  const queueStatuses = await Promise.all(
    QUEUE_REGISTRY.map(async (config) => ({
      config,
      queueLength: await checkQueueMetrics(config.name),
    }))
  );

  // 2. Filter to queues with messages and sort by priority
  const queuesToProcess = queueStatuses
    .filter(({ queueLength }) => queueLength > 0)
    .sort((a, b) => (a.config.priority || 999) - (b.config.priority || 999));

  const totalQueues = QUEUE_REGISTRY.length;
  const queuesWithMessages = queuesToProcess.length;

  // 3. If no queues have messages, return early
  if (queuesToProcess.length === 0) {
    const durationMs = Date.now() - startTime;
    const emptyLogContext = {
      ...logContext,
      total_queues: totalQueues,
      duration_ms: durationMs,
    };
    logInfo('No queues with messages, skipping processing', emptyLogContext);
    traceRequestComplete(emptyLogContext);
    return {
      totalQueues,
      queuesWithMessages: 0,
      queuesAttempted: 0,
      queuesSucceeded: 0,
      results: [],
    };
  }

  const batchLogContext = {
    ...logContext,
    queues_to_process: queuesToProcess.length,
    queues: queuesToProcess.map(({ config, queueLength }) => ({
      name: config.name,
      length: queueLength,
      priority: config.priority,
    })),
  };
  logInfo(`Processing ${queuesToProcess.length} queues with messages`, batchLogContext);
  traceStep(`Processing ${queuesToProcess.length} queues`, batchLogContext);

  // 4. Process queues sequentially (one at a time)
  const results: QueueProcessingResult[] = [];
  for (const { config, queueLength } of queuesToProcess) {
    const queueStartTime = Date.now();
    let result: QueueProcessingResult;

    try {
      if (config.handler === 'internal' && config.handlerFn) {
        result = await processInternalQueue(config, queueLength);
      } else if (config.handler === 'external' && config.endpoint) {
        result = await processExternalQueue(config, queueLength);
      } else {
        result = {
          queue: config.name,
          success: false,
          queueLength,
          error: `Invalid queue configuration: handler=${config.handler}, missing handlerFn or endpoint`,
        };
      }

      const queueDurationMs = Date.now() - queueStartTime;
      const queueLogContext = {
        ...batchLogContext,
        queue_name: config.name,
        queue_length: queueLength,
        duration_ms: queueDurationMs,
      };
      if (result.success) {
        logInfo(`Queue '${config.name}' processed successfully`, {
          ...queueLogContext,
          processed: result.processed,
        });
      } else {
        await logError(
          `Queue '${config.name}' processing failed`,
          queueLogContext,
          new Error(result.error)
        );
      }
    } catch (error) {
      // Unexpected error - log and continue
      const errorObj = normalizeError(error, `Unexpected error processing queue '${config.name}'`);
      const errorLogContext = {
        ...batchLogContext,
        queue_name: config.name,
        queue_length: queueLength,
      };
      await logError(`Unexpected error processing queue '${config.name}'`, errorLogContext, errorObj);
      result = {
        queue: config.name,
        success: false,
        queueLength,
        error: errorObj.message,
      };
    }

    results.push(result);
  }

  const durationMs = Date.now() - startTime;
  const queuesSucceeded = results.filter((r) => r.success).length;
  const queuesAttempted = queuesToProcess.length;
  const totalProcessed = results.reduce((sum, r) => sum + (r.processed ?? 0), 0);

  const summaryLogContext = createUtilityContext('flux-station', 'queue-processor-summary', {
    total_queues: totalQueues,
    queues_with_messages: queuesWithMessages,
    queues_attempted: queuesAttempted,
    queues_succeeded: queuesSucceeded,
    total_messages_processed: totalProcessed,
    duration_ms: durationMs,
    results: results.map((r) => ({
      queue: r.queue,
      success: r.success,
      queueLength: r.queueLength,
      processed: r.processed,
    })),
  });
  logInfo('Queue processing completed', summaryLogContext);
  traceRequestComplete(summaryLogContext);

  return {
    totalQueues,
    queuesWithMessages,
    queuesAttempted,
    queuesSucceeded,
    results,
  };
}