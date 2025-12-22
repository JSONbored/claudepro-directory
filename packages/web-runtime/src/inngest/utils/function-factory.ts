/**
 * Inngest Function Factory
 *
 * Factory function to create Inngest functions with standardized patterns:
 * - Automatic logging context creation
 * - Duration tracking
 * - Error handling with normalizeError
 * - BetterStack monitoring integration (optional)
 * - Consistent function configuration patterns
 *
 * This factory reduces boilerplate and ensures consistency across all Inngest functions.
 *
 * @module web-runtime/inngest/utils/function-factory
 */

import { inngest } from '../client';
import { logger, createWebAppContextWithId } from '../../logging/server';
import { normalizeError } from '@heyclaude/shared-runtime';
import { sendCriticalFailureHeartbeat, sendCronSuccessHeartbeat } from './monitoring';
import { RETRY_CONFIGS } from '../config';

/**
 * Extended function configuration with standardized options
 */
export interface InngestFunctionConfig {
  /** Unique function ID (e.g., 'email-transactional') */
  id: string;
  /** Human-readable function name (e.g., 'Transactional Email') */
  name: string;
  /** Route path for logging context (e.g., '/inngest/email/transactional') */
  route: string;
  /** Number of retries (default: RETRY_CONFIGS.DEFAULT) */
  retries?: number;
  /** Idempotency key expression (CEL) */
  idempotency?: string;
  /** Concurrency limits */
  concurrency?: {
    limit: number;
    key?: string;
  };
  /** Timeout configuration */
  timeouts?: {
    finish?: string;
    step?: string;
  };
  /** Throttle configuration (limit events per period) */
  throttle?: {
    limit: number;
    period: string;
    key?: string;
  };
  /** Debounce configuration (wait for events to settle before executing) */
  debounce?: {
    period: string;
    timeout?: string;
    key?: string;
  };
  /** Singleton configuration (only one run at a time per key) */
  singleton?: {
    key: string;
  };
  /** Cancel-on event configuration (cancel function when event occurs) */
  cancelOn?: {
    event: string;
    timeout?: string;
    if?: string;
  };
  /** BetterStack heartbeat env var for critical failures (optional) */
  onFailureHeartbeat?: string;
  /** BetterStack heartbeat env var for cron success (optional) */
  cronSuccessHeartbeat?: string;
  /** Enable duration logging (default: true) */
  enableDurationLogging?: boolean;
  /** Enable start logging (default: true) */
  enableStartLogging?: boolean;
}

/**
 * Minimal Inngest event type with required properties for logging
 */
interface InngestEventBase {
  id: string;
  name: string;
  data: Record<string, unknown>;
  ts?: number;
}

/**
 * Enhanced handler context with logging utilities
 */
export interface InngestHandlerContext {
  /** Original Inngest event */
  event: Parameters<Parameters<typeof inngest.createFunction>[2]>[0]['event'];
  /** Original Inngest step tools */
  step: Parameters<Parameters<typeof inngest.createFunction>[2]>[0]['step'];
  /** Pre-configured logging context */
  logContext: ReturnType<typeof createWebAppContextWithId>;
  /** Function start time (ms since epoch) */
  startTime: number;
}

/**
 * Create an Inngest function with standardized patterns
 *
 * @param config - Function configuration
 * @param trigger - Event or cron trigger (any valid Inngest trigger)
 * @param handler - Function handler with enhanced context
 * @returns Configured Inngest function
 *
 * @example
 * ```ts
 * export const sendEmail = createInngestFunction(
 *   {
 *     id: 'email-transactional',
 *     name: 'Transactional Email',
 *     route: '/inngest/email/transactional',
 *     retries: RETRY_CONFIGS.EMAIL,
 *     idempotency: 'event.data.type + "-" + event.data.email',
 *     onFailureHeartbeat: 'BETTERSTACK_HEARTBEAT_CRITICAL_FAILURE',
 *   },
 *   { event: 'email/transactional' },
 *   async ({ event, step, logContext }) => {
 *     const result = await step.run('send', async () => {
 *       // Send email
 *     });
 *     return result;
 *   }
 * );
 *
 * // Function with throttle (limit events per period)
 * export const processWebhook = createInngestFunction(
 *   {
 *     id: 'webhook-processor',
 *     name: 'Webhook Processor',
 *     route: '/inngest/webhook/process',
 *     throttle: { limit: 1, period: '10s' },
 *   },
 *   { event: 'webhook/received' },
 *   async ({ event, step }) => {
 *     // Process webhook
 *   }
 * );
 *
 * // Function with debounce (wait for events to settle)
 * export const updateContent = createInngestFunction(
 *   {
 *     id: 'content-updater',
 *     name: 'Content Updater',
 *     route: '/inngest/content/update',
 *     debounce: { period: '30s', timeout: '5m' },
 *   },
 *   { event: 'content/changed' },
 *   async ({ event, step }) => {
 *     // Update content
 *   }
 * );
 *
 * // Function with singleton (only one run at a time)
 * export const sendDigest = createInngestFunction(
 *   {
 *     id: 'email-digest',
 *     name: 'Email Digest',
 *     route: '/inngest/email/digest',
 *     singleton: { key: 'event.data.type' },
 *   },
 *   { cron: '0 9 * * 1' },
 *   async ({ step }) => {
 *     // Send digest
 *   }
 * );
 *
 * // Function with cancelOn (cancel on event)
 * export const sendDripCampaign = createInngestFunction(
 *   {
 *     id: 'email-drip',
 *     name: 'Email Drip Campaign',
 *     route: '/inngest/email/drip',
 *     cancelOn: { event: 'email/unsubscribe', timeout: '30d' },
 *   },
 *   { event: 'email/drip-campaign' },
 *   async ({ event, step }) => {
 *     // Send drip emails (cancelled on unsubscribe)
 *   }
 * );
 * ```
 */
export function createInngestFunction<TReturn = unknown>(
  config: InngestFunctionConfig,
  trigger: Parameters<typeof inngest.createFunction>[1],
  handler: (context: InngestHandlerContext) => Promise<TReturn>
) {
  const {
    id,
    name,
    route,
    retries = RETRY_CONFIGS.DEFAULT,
    idempotency,
    concurrency,
    timeouts,
    throttle,
    debounce,
    singleton,
    cancelOn,
    onFailureHeartbeat,
    cronSuccessHeartbeat,
    enableDurationLogging = true,
    enableStartLogging = true,
  } = config;

  // Build Inngest function configuration (using Record to avoid exactOptionalPropertyTypes issues)
  // Note: throttle, debounce, singleton, cancelOn are valid Inngest config options but TypeScript
  // types are complex, so we use Record and type assertion
  const functionConfig: Record<string, unknown> = {
    id,
    name,
    retries,
    ...(idempotency && { idempotency }),
    ...(concurrency && { concurrency }),
    ...(timeouts && { timeouts }),
    ...(throttle && { throttle }),
    ...(debounce && { debounce }),
    ...(singleton && { singleton }),
    ...(cancelOn && { cancelOn }),
  };

  // Add onFailure callback if heartbeat is configured
  if (onFailureHeartbeat) {
    functionConfig['onFailure'] = async ({ event, error }: { event: unknown; error: unknown }) => {
      // Extract event data for context
      const eventRecord = event as { data?: { type?: string; action?: string; eventType?: string } } | undefined;
      const eventData = eventRecord?.data;
      const context: { functionName?: string; eventType?: string; error?: string } = {
        functionName: name,
      };

      // Extract event type from various possible locations
      if (eventData?.type) {
        context.eventType = eventData.type;
      } else if (eventData?.action) {
        context.eventType = eventData.action;
      } else if (eventData?.eventType) {
        context.eventType = eventData.eventType;
      }

      // Extract error message
      if (error) {
        context.error = error instanceof Error ? error.message : String(error);
      }

      // Send heartbeat (feature-flagged)
      sendCriticalFailureHeartbeat(onFailureHeartbeat, context);

      // Log for observability
      logger.error(
        {
          functionName: name,
          errorMessage: error
            ? error instanceof Error
              ? error.message
              : String(error)
            : 'unknown',
        },
        `${name} failed after all retries`
      );
    };
  }

  // Create the Inngest function
  // Type assertion needed because Inngest's types are complex and we're passing config through
  return inngest.createFunction(
    functionConfig as Parameters<typeof inngest.createFunction>[0],
    trigger,
    async ({ event, step }) => {
      const startTime = Date.now();
      // Type assertion: Inngest events always have id and name properties
      const eventBase = event as unknown as InngestEventBase;
      // Use event.id for request ID to correlate logs with Inngest event
      const logContext = createWebAppContextWithId(route, eventBase.id);

      // Log function start (if enabled)
      if (enableStartLogging) {
        logger.info({ ...logContext, eventId: eventBase.id, eventName: eventBase.name }, `${name} started`);
      }

      try {
        // Call handler with enhanced context
        const result = await handler({
          event,
          step,
          logContext,
          startTime,
        });

        // Log completion with duration (if enabled)
        if (enableDurationLogging) {
          const durationMs = Date.now() - startTime;
          logger.info(
            {
              ...logContext,
              durationMs,
            },
            `${name} completed`
          );

          // Send cron success heartbeat if configured and trigger is cron
          if (cronSuccessHeartbeat && typeof trigger === 'object' && trigger !== null && 'cron' in trigger) {
            sendCronSuccessHeartbeat(cronSuccessHeartbeat, {
              functionName: name,
              result,
            });
          }
        }

        return result;
      } catch (error) {
        // Normalize and log error
        const normalized = normalizeError(error, `${name} failed`);
        logger.error(
          {
            ...logContext,
            eventId: eventBase.id,
            eventName: eventBase.name,
            err: normalized,
            durationMs: Date.now() - startTime,
          },
          `${name} failed`
        );

        // Re-throw to let Inngest handle retries
        throw normalized;
      }
    }
  );
}
