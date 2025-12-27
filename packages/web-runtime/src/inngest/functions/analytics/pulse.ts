/**
 * Analytics Pulse Inngest Function
 *
 * Cron job that processes pulse queue events in batches.
 * Handles user interactions, search events, and Resend engagement tracking.
 *
 * Runs every hour to process batched analytics events.
 * Optimized: Increased from 30 minutes (analytics can be slightly delayed).
 */

import {
  Prisma,
  content_category as ContentCategory,
  interaction_type as InteractionType,
} from '@prisma/client';
import type { content_category, interaction_type } from '@prisma/client';
import type {
  SearchQueryInput,
  UserInteractionInput,
} from '@heyclaude/database-types/postgres-types';
type JsonValue = Prisma.JsonValue;
import { normalizeError } from '@heyclaude/shared-runtime';

import { createInngestFunction } from '../../utils/function-factory';
import { pgmqRead, pgmqDelete, type PgmqMessage } from '../../../supabase/pgmq-client';
import { logger } from '../../../logging/server';
import { getService } from '../../../data/service-factory';

const PULSE_BATCH_SIZE = 100;
const MAX_RETRY_ATTEMPTS = 5;

interface PulseEvent {
  user_id?: string | null;
  content_type: string | null;
  content_slug: string | null;
  interaction_type: string;
  session_id?: string | null;
  metadata?: JsonValue | null;
}

type PulseQueueMessage = PgmqMessage<PulseEvent>;

// Type guards
function isValidContentCategory(value: unknown): value is content_category {
  if (typeof value !== 'string') return false;

  const validValues = Object.values(ContentCategory) as readonly content_category[];
  return validValues.includes(value as content_category);
}

function isValidInteractionType(value: unknown): value is interaction_type {
  if (typeof value !== 'string') return false;
  const validValues = Object.values(InteractionType) as readonly interaction_type[];
  return validValues.includes(value as interaction_type);
}

function isValidPulseEvent(value: unknown): value is PulseEvent {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj['interaction_type'] === 'string';
}

/**
 * Process pulse queue in batches
 * Uses singleton pattern to prevent duplicate runs
 */
export const processPulseQueue = createInngestFunction(
  {
    id: 'analytics-pulse-processor',
    name: 'Analytics Pulse Processor',
    route: '/inngest/analytics/pulse',
    retries: 1,
    // Singleton pattern: Only one pulse processor can run at a time
    singleton: {
      key: 'analytics-pulse',
    },
  },
  { cron: '0 * * * *' }, // Every hour (optimized from 30 minutes)
  async ({ step, logContext }) => {
    // Step 1: Read messages from queue
    const messages = await step.run('read-queue', async (): Promise<PulseQueueMessage[]> => {
      try {
        const data = await pgmqRead<PulseEvent>('pulse', {
          vt: 120, // 2 minute visibility timeout to handle batch processing
          qty: PULSE_BATCH_SIZE,
        });

        if (!data || data.length === 0) {
          return [];
        }

        // Filter valid pulse events
        return data.filter((msg) => isValidPulseEvent(msg.message));
      } catch (error) {
        logger.warn(
          { ...logContext, errorMessage: normalizeError(error, 'Queue read failed').message },
          'Failed to read pulse queue'
        );
        return [];
      }
    });

    if (messages.length === 0) {
      logger.info(logContext, 'No messages in pulse queue');
      return { processed: 0, inserted: 0, failed: 0 };
    }

    logger.info({ ...logContext, messageCount: messages.length }, 'Processing pulse events');

    // Step 2: Separate events by type
    const { searchEvents, interactionEvents } = await step.run(
      'categorize-events',
      async (): Promise<{
        searchEvents: PulseQueueMessage[];
        interactionEvents: PulseQueueMessage[];
      }> => {
        const searchEvents: PulseQueueMessage[] = [];
        const interactionEvents: PulseQueueMessage[] = [];

        for (const msg of messages) {
          if (msg.message['interaction_type'] === 'search') {
            searchEvents.push(msg);
          } else {
            interactionEvents.push(msg);
          }
        }

        return { searchEvents, interactionEvents };
      }
    );

    let totalInserted = 0;
    let totalFailed = 0;
    const processedMsgIds: bigint[] = [];

    // Step 3: Process search events
    if (searchEvents.length > 0) {
      const searchResult = await step.run(
        'process-search-events',
        async (): Promise<{
          inserted: number;
          failed: number;
        }> => {
          try {
            const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const isValidUUID = (value: string | null | undefined): value is string =>
              typeof value === 'string' && UUID_REGEX.test(value);

            const searchQueries = searchEvents.map((msg: PulseQueueMessage) => {
              const event = msg.message;
              const metadata = event['metadata'] as Record<string, unknown> | null;

              return {
                query: typeof metadata?.['query'] === 'string' ? metadata['query'] : null,
                filters:
                  metadata?.['filters'] &&
                  typeof metadata['filters'] === 'object' &&
                  !Array.isArray(metadata['filters'])
                    ? (metadata['filters'] as Record<string, unknown>)
                    : null,
                result_count:
                  typeof metadata?.['result_count'] === 'number' ? metadata['result_count'] : null,
                user_id:
                  event['user_id'] && isValidUUID(event['user_id']) ? event['user_id'] : null,
                session_id:
                  event.session_id && isValidUUID(event.session_id) ? event.session_id : null,
              };
            });

            // Prepare search query inputs for batch RPC
            const searchQueryInputs: SearchQueryInput[] = searchQueries.map(
              (
                q: ReturnType<
                  (typeof searchEvents)[0] extends PulseQueueMessage
                    ? (typeof searchEvents)[0]
                    : never
                >['message']
              ) => ({
                query: q.query,
                filters: q.filters,
                result_count: q.result_count,
                user_id: q.user_id,
                session_id: q.session_id,
              })
            );

            const service = await getService('search');
            const result = await service.batchInsertSearchQueries({
              p_queries: searchQueryInputs,
            });

            // Mark these messages as processed
            for (const msg of searchEvents) {
              processedMsgIds.push(msg.msg_id);
            }

            // RPC returns { inserted: number, failed: number, total: number, errors: jsonb }
            const inserted = result?.inserted ?? 0;
            const failed = result?.failed ?? 0;

            return { inserted, failed };
          } catch (error) {
            const normalized = normalizeError(error, 'Search events batch insert failed');
            logger.warn(
              { ...logContext, errorMessage: normalized.message },
              'Search events batch insert failed'
            );
            return { inserted: 0, failed: searchEvents.length };
          }
        }
      );

      totalInserted += searchResult.inserted;
      totalFailed += searchResult.failed;
    }

    // Step 4: Process interaction events
    if (interactionEvents.length > 0) {
      const interactionResult = await step.run(
        'process-interaction-events',
        async (): Promise<{
          inserted: number;
          failed: number;
        }> => {
          try {
            const interactions: UserInteractionInput[] = [];
            const validMsgIds: bigint[] = [];
            const invalidMsgIds: bigint[] = [];

            for (const msg of interactionEvents) {
              const event = msg.message;

              if (!isValidInteractionType(event.interaction_type)) {
                // Log invalid interaction types and mark for cleanup
                logger.warn(
                  {
                    ...logContext,
                    msgId: String(msg.msg_id),
                    interactionType: String(event.interaction_type ?? 'undefined'),
                  },
                  'Invalid interaction type, marking for deletion'
                );
                invalidMsgIds.push(msg.msg_id);
                continue;
              }

              const interaction: UserInteractionInput = {
                user_id: event.user_id ?? null,
                content_type: isValidContentCategory(event.content_type)
                  ? (event.content_type as content_category)
                  : null,
                content_slug: event.content_slug ?? null,
                interaction_type: isValidInteractionType(event.interaction_type)
                  ? (event.interaction_type as interaction_type)
                  : null,
                session_id: event.session_id ?? null,
                metadata:
                  event.metadata &&
                  typeof event.metadata === 'object' &&
                  !Array.isArray(event.metadata)
                    ? (event.metadata as Record<string, unknown>)
                    : null,
              };

              interactions.push(interaction);
              validMsgIds.push(msg.msg_id);
            }

            // Delete invalid messages (they won't succeed on retry)
            for (const msgId of invalidMsgIds) {
              processedMsgIds.push(msgId);
            }

            if (interactions.length === 0) {
              // All interactions were invalid - mark all as processed (to delete)
              return { inserted: 0, failed: invalidMsgIds.length };
            }

            // Use AccountService for proper data layer architecture
            const accountService = await getService('account');
            const result = await accountService.batchInsertUserInteractions({
              p_interactions: interactions,
            });

            // Mark valid messages as processed (invalid ones already added)
            for (const msgId of validMsgIds) {
              processedMsgIds.push(msgId);
            }

            // RPC returns { inserted: number, failed: number, total: number, errors: jsonb }
            const inserted = result?.inserted ?? 0;
            const failed = result?.failed ?? 0;

            return { inserted, failed };
          } catch (error) {
            const normalized = normalizeError(error, 'Interaction events batch insert failed');
            logger.warn(
              { ...logContext, errorMessage: normalized.message },
              'Interaction events batch insert failed'
            );
            return { inserted: 0, failed: interactionEvents.length };
          }
        }
      );

      totalInserted += interactionResult.inserted;
      totalFailed += interactionResult.failed;
    }

    // Step 5: Delete processed messages
    // OPTIMIZATION: Parallel batch deletion for better performance
    if (processedMsgIds.length > 0) {
      await step.run('delete-processed-messages', async () => {
        // Process in parallel batches to avoid overwhelming database
        const BATCH_SIZE = 10;
        const batches: bigint[][] = [];

        // Create batches
        for (let i = 0; i < processedMsgIds.length; i += BATCH_SIZE) {
          batches.push(processedMsgIds.slice(i, i + BATCH_SIZE));
        }

        // Execute batches in parallel
        await Promise.allSettled(
          batches.map(async (batch) => {
            await Promise.allSettled(
              batch.map((msgId) =>
                pgmqDelete('pulse', msgId).catch((error) => {
                  const normalized = normalizeError(error, 'Failed to delete pulse message');
                  logger.warn(
                    { ...logContext, err: normalized, msgId: msgId.toString() },
                    'Failed to delete pulse message'
                  );
                })
              )
            );
          })
        );
      });
    }

    // Step 6: Handle failed messages that exceeded retry attempts
    const failedMessages = messages.filter((msg: PulseQueueMessage) => {
      const msgIdStr = String(msg.msg_id);
      const isProcessed = processedMsgIds.some((id) => String(id) === msgIdStr);
      return !isProcessed && msg.read_ct >= MAX_RETRY_ATTEMPTS;
    });

    if (failedMessages.length > 0) {
      await step.run('cleanup-failed-messages', async () => {
        // OPTIMIZATION: Parallel batch deletion for better performance
        const BATCH_SIZE = 10;
        const batches = [];

        // Create batches
        for (let i = 0; i < failedMessages.length; i += BATCH_SIZE) {
          batches.push(failedMessages.slice(i, i + BATCH_SIZE));
        }

        // Execute batches in parallel
        await Promise.allSettled(
          batches.map(async (batch: PulseQueueMessage[]) => {
            await Promise.allSettled(
              batch.map(async (msg: PulseQueueMessage) => {
                try {
                  await pgmqDelete('pulse', msg.msg_id);
                  logger.warn(
                    { ...logContext, msgId: String(msg.msg_id), readCount: msg.read_ct },
                    'Pulse event exceeded max retries, removed from queue'
                  );
                } catch {
                  // Silent fail
                }
              })
            );
          })
        );
      });
    }

    // Additional custom logging (duration logging is handled by factory)
    logger.info(
      {
        ...logContext,
        processed: messages.length,
        inserted: totalInserted,
        failed: totalFailed,
      },
      'Pulse queue processing completed'
    );

    return {
      processed: messages.length,
      inserted: totalInserted,
      failed: totalFailed,
    };
  }
);
