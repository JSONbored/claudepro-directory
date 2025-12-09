/**
 * Analytics Pulse Inngest Function
 *
 * Cron job that processes pulse queue events in batches.
 * Handles user interactions, search events, and Resend engagement tracking.
 *
 * Runs every 5 minutes to process batched analytics events.
 */

import type { Database as DatabaseGenerated, Json } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { normalizeError } from '@heyclaude/shared-runtime';

import { inngest } from '../../client';
import { createSupabaseAdminClient } from '../../../supabase/admin';
import { pgmqRead, pgmqDelete, type PgmqMessage } from '../../../supabase/pgmq-client';
import { logger, createWebAppContextWithId } from '../../../logging/server';

const PULSE_BATCH_SIZE = 100;
const MAX_RETRY_ATTEMPTS = 5;

interface PulseEvent {
  user_id?: string | null;
  content_type: string | null;
  content_slug: string | null;
  interaction_type: string;
  session_id?: string | null;
  metadata?: Json | null;
}

type PulseQueueMessage = PgmqMessage<PulseEvent>;

// Type guards
function isValidContentCategory(
  value: unknown
): value is DatabaseGenerated['public']['Enums']['content_category'] {
  if (typeof value !== 'string') return false;
  const validValues = Constants.public.Enums.content_category;
  return validValues.includes(value as DatabaseGenerated['public']['Enums']['content_category']);
}

function isValidInteractionType(
  value: unknown
): value is DatabaseGenerated['public']['Enums']['interaction_type'] {
  if (typeof value !== 'string') return false;
  const validValues = Constants.public.Enums.interaction_type;
  return validValues.includes(value as DatabaseGenerated['public']['Enums']['interaction_type']);
}

function isValidPulseEvent(value: unknown): value is PulseEvent {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj['interaction_type'] === 'string';
}

/**
 * Process pulse queue in batches
 */
export const processPulseQueue = inngest.createFunction(
  {
    id: 'analytics-pulse-processor',
    name: 'Analytics Pulse Processor',
    retries: 1,
  },
  { cron: '*/30 * * * *' }, // Every 30 minutes (batches queue events)
  async ({ step }) => {
    const startTime = Date.now();
    const logContext = createWebAppContextWithId('/inngest/analytics/pulse', 'processPulseQueue');

    logger.info(logContext, 'Pulse queue processing started');

    const supabase = createSupabaseAdminClient();

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
        logger.warn({ ...logContext,
          errorMessage: normalizeError(error, 'Queue read failed').message, }, 'Failed to read pulse queue');
        return [];
      }
    });

    if (messages.length === 0) {
      logger.info(logContext, 'No messages in pulse queue');
      return { processed: 0, inserted: 0, failed: 0 };
    }

    logger.info({ ...logContext,
      messageCount: messages.length, }, 'Processing pulse events');

    // Step 2: Separate events by type
    const { searchEvents, interactionEvents } = await step.run('categorize-events', async (): Promise<{
      searchEvents: PulseQueueMessage[];
      interactionEvents: PulseQueueMessage[];
    }> => {
      const searchEvents: PulseQueueMessage[] = [];
      const interactionEvents: PulseQueueMessage[] = [];

      for (const msg of messages) {
        if (msg.message.interaction_type === 'search') {
          searchEvents.push(msg);
        } else {
          interactionEvents.push(msg);
        }
      }

      return { searchEvents, interactionEvents };
    });

    let totalInserted = 0;
    let totalFailed = 0;
    const processedMsgIds: bigint[] = [];

    // Step 3: Process search events
    if (searchEvents.length > 0) {
      const searchResult = await step.run('process-search-events', async (): Promise<{
        inserted: number;
        failed: number;
      }> => {
        try {
          const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const isValidUUID = (value: string | null | undefined): value is string =>
            typeof value === 'string' && UUID_REGEX.test(value);

          const searchQueries = searchEvents.map((msg) => {
            const event = msg.message;
            const metadata = event.metadata as Record<string, unknown> | null;

            return {
              query: typeof metadata?.['query'] === 'string' ? metadata['query'] : '',
              filters: metadata?.['filters'] as Json || null,
              result_count: typeof metadata?.['result_count'] === 'number' ? metadata['result_count'] : 0,
              user_id: event.user_id && isValidUUID(event.user_id) ? event.user_id : null,
              session_id: event.session_id && isValidUUID(event.session_id) ? event.session_id : null,
            };
          });

          const insertData: DatabaseGenerated['public']['Tables']['search_queries']['Insert'][] =
            searchQueries.map((q) => ({
              query: q.query,
              result_count: q.result_count,
              user_id: q.user_id,
              session_id: q.session_id,
              ...(q.filters ? { filters: q.filters } : {}),
            }));

          const { error } = await supabase.from('search_queries').insert(insertData);

          if (error) {
            throw error;
          }

          // Mark these messages as processed
          for (const msg of searchEvents) {
            processedMsgIds.push(msg.msg_id);
          }

          return { inserted: searchQueries.length, failed: 0 };
        } catch (error) {
          const normalized = normalizeError(error, 'Search events batch insert failed');
          logger.warn({ ...logContext,
            errorMessage: normalized.message, }, 'Search events batch insert failed');
          return { inserted: 0, failed: searchEvents.length };
        }
      });

      totalInserted += searchResult.inserted;
      totalFailed += searchResult.failed;
    }

    // Step 4: Process interaction events
    if (interactionEvents.length > 0) {
      const interactionResult = await step.run('process-interaction-events', async (): Promise<{
        inserted: number;
        failed: number;
      }> => {
        try {
          const interactions: DatabaseGenerated['public']['CompositeTypes']['user_interaction_input'][] = [];
          const validMsgIds: bigint[] = [];
          const invalidMsgIds: bigint[] = [];

          for (const msg of interactionEvents) {
            const event = msg.message;

            if (!isValidInteractionType(event.interaction_type)) {
              // Log invalid interaction types and mark for cleanup
              logger.warn({ ...logContext,
                msgId: String(msg.msg_id),
                interactionType: String(event.interaction_type ?? 'undefined'), }, 'Invalid interaction type, marking for deletion');
              invalidMsgIds.push(msg.msg_id);
              continue;
            }

            const interaction: DatabaseGenerated['public']['CompositeTypes']['user_interaction_input'] = {
              user_id: event.user_id ?? null,
              content_type: isValidContentCategory(event.content_type) ? event.content_type : null,
              content_slug: event.content_slug ?? null,
              interaction_type: event.interaction_type,
              session_id: event.session_id ?? null,
              metadata: event.metadata ?? null,
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

          const { data: result, error } = await supabase.rpc('batch_insert_user_interactions', {
            p_interactions: interactions,
          });

          if (error) {
            throw error;
          }

          // Mark valid messages as processed (invalid ones already added)
          for (const msgId of validMsgIds) {
            processedMsgIds.push(msgId);
          }

          const inserted = result?.inserted ?? 0;
          const failed = result?.failed ?? 0;

          return { inserted, failed };
        } catch (error) {
          const normalized = normalizeError(error, 'Interaction events batch insert failed');
          logger.warn({ ...logContext,
            errorMessage: normalized.message, }, 'Interaction events batch insert failed');
          return { inserted: 0, failed: interactionEvents.length };
        }
      });

      totalInserted += interactionResult.inserted;
      totalFailed += interactionResult.failed;
    }

    // Step 5: Delete processed messages
    if (processedMsgIds.length > 0) {
      await step.run('delete-processed-messages', async () => {
        for (const msgId of processedMsgIds) {
          try {
            await pgmqDelete('pulse', msgId);
          } catch (error) {
            logger.warn({ ...logContext,
              msgId: msgId.toString(), }, 'Failed to delete pulse message');
          }
        }
      });
    }

    // Step 6: Handle failed messages that exceeded retry attempts
    const failedMessages = messages.filter(
      (msg) => {
        const msgIdStr = String(msg.msg_id);
        const isProcessed = processedMsgIds.some((id) => String(id) === msgIdStr);
        return !isProcessed && msg.read_ct >= MAX_RETRY_ATTEMPTS;
      }
    );

    if (failedMessages.length > 0) {
      await step.run('cleanup-failed-messages', async () => {
        for (const msg of failedMessages) {
          try {
            await pgmqDelete('pulse', msg.msg_id);
            logger.warn({ ...logContext,
              msgId: String(msg.msg_id),
              readCount: msg.read_ct, }, 'Pulse event exceeded max retries, removed from queue');
          } catch {
            // Silent fail
          }
        }
      });
    }

    const durationMs = Date.now() - startTime;
    logger.info({ ...logContext,
      durationMs,
      processed: messages.length,
      inserted: totalInserted,
      failed: totalFailed, }, 'Pulse queue processing completed');

    return {
      processed: messages.length,
      inserted: totalInserted,
      failed: totalFailed,
    };
  }
);
