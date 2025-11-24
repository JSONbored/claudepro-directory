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

import { edgeEnv, pgmqMetrics } from '@heyclaude/edge-runtime';
import { errorToString } from '@heyclaude/shared-runtime';
import { handleChangelogNotify } from './changelog/notify.ts';
import { handleChangelogProcess } from './changelog/process.ts';
import { handleDiscordJobs } from './discord/jobs.ts';
import { handleDiscordSubmissions } from './discord/submissions.ts';
import { handleEmbeddingGenerationQueue } from './embedding/index.ts';
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

  // External queues (other edge functions)
  {
    name: 'package_generation',
    handler: 'external',
    endpoint: '/functions/v1/public-api/content/generate-package/process',
    priority: 8,
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
  queuesProcessed: number;
  results: QueueProcessingResult[];
}

/**
 * Check queue metrics to determine if queue has messages
 * Returns queue_length (0 if empty or error)
 */
async function checkQueueMetrics(queueName: string): Promise<number> {
  try {
    const metrics = await pgmqMetrics(queueName);
    // If metrics is null (error case), treat as empty (safe fallback)
    // If metrics exists, return queue_length
    return metrics?.queue_length ?? 0;
  } catch (error) {
    // If metrics check fails, treat as empty (safe fallback)
    console.warn(`[queue-processor] Failed to check metrics for queue '${queueName}'`, {
      error: errorToString(error),
    });
    return 0;
  }
}

/**
 * Process a single queue (internal handler)
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
    const response = await config.handlerFn(request);

    // Try to extract processed count from response body
    let processed: number | undefined;
    try {
      const body = await response.json();
      // Validate response structure
      if (typeof body === 'object' && body !== null) {
        const getProperty = (obj: unknown, key: string): unknown => {
          if (typeof obj !== 'object' || obj === null) {
            return undefined;
          }
          const desc = Object.getOwnPropertyDescriptor(obj, key);
          return desc?.value;
        };

        const processedValue = getProperty(body, 'processed');
        if (typeof processedValue === 'number') {
          processed = processedValue;
        }
      }
    } catch {
      // Response might not be JSON, that's okay
    }

    return {
      queue: config.name,
      success: response.ok,
      queueLength,
      ...(processed !== undefined && { processed }),
    };
  } catch (error) {
    return {
      queue: config.name,
      success: false,
      queueLength,
      error: errorToString(error),
    };
  }
}

/**
 * Process a single queue (external edge function)
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
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    // Try to extract processed count and error from response body
    let processed: number | undefined;
    let errorMessage: string | undefined;
    try {
      const body = await response.json();
      // Validate response structure
      if (typeof body === 'object' && body !== null) {
        const getProperty = (obj: unknown, key: string): unknown => {
          if (typeof obj !== 'object' || obj === null) {
            return undefined;
          }
          const desc = Object.getOwnPropertyDescriptor(obj, key);
          return desc?.value;
        };

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
      error: errorToString(error),
    };
  }
}

/**
 * Process all queues with smart polling
 * Only processes queues that have messages (queue_length > 0)
 * Processes queues sequentially to avoid database overload
 */
export async function processAllQueues(): Promise<QueueProcessingSummary> {
  const startTime = Date.now();

  // 1. Check metrics for all queues in parallel (fast, non-blocking)
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
    console.log('[queue-processor] No queues with messages, skipping processing', {
      totalQueues,
      duration_ms: durationMs,
    });
    return {
      totalQueues,
      queuesWithMessages: 0,
      queuesProcessed: 0,
      results: [],
    };
  }

  console.log(`[queue-processor] Processing ${queuesToProcess.length} queues with messages`, {
    queues: queuesToProcess.map(({ config, queueLength }) => ({
      name: config.name,
      length: queueLength,
      priority: config.priority,
    })),
  });

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
      if (result.success) {
        console.log(`[queue-processor] Queue '${config.name}' processed successfully`, {
          queueLength,
          processed: result.processed,
          duration_ms: queueDurationMs,
        });
      } else {
        console.error(`[queue-processor] Queue '${config.name}' processing failed`, {
          queueLength,
          error: result.error,
          duration_ms: queueDurationMs,
        });
      }
    } catch (error) {
      // Unexpected error - log and continue
      const errorMsg = errorToString(error);
      console.error(`[queue-processor] Unexpected error processing queue '${config.name}'`, {
        queueLength,
        error: errorMsg,
      });
      result = {
        queue: config.name,
        success: false,
        queueLength,
        error: errorMsg,
      };
    }

    results.push(result);
  }

  const durationMs = Date.now() - startTime;
  const queuesProcessed = results.filter((r) => r.success).length;
  const totalProcessed = results.reduce((sum, r) => sum + (r.processed ?? 0), 0);

  console.log('[queue-processor] Queue processing completed', {
    totalQueues,
    queuesWithMessages,
    queuesProcessed,
    totalMessagesProcessed: totalProcessed,
    duration_ms: durationMs,
    results: results.map((r) => ({
      queue: r.queue,
      success: r.success,
      queueLength: r.queueLength,
      processed: r.processed,
    })),
  });

  return {
    totalQueues,
    queuesWithMessages,
    queuesProcessed,
    results,
  };
}
