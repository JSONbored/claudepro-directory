/**
 * Pulse Route
 * Processes pulse queue in batches for hyper-optimized egress reduction
 * Batch size is configurable via Statsig dynamic config (queue.pulse.batch_size)
 * Default: 100 events per batch
 */

import { Resend } from 'npm:resend@4.0.0';
import { supabaseServiceRole } from '../../_shared/clients/supabase.ts';
import { RESEND_ENV } from '../../_shared/config/email-config.ts';
import { getCacheConfigNumber } from '../../_shared/config/statsig-cache.ts';
import type { Database as DatabaseGenerated, Json } from '../../_shared/database.types.ts';
import { callRpc } from '../../_shared/database-overrides.ts';
import { errorToString } from '../../_shared/utils/error-handling.ts';
import { errorResponse, successResponse } from '../../_shared/utils/http.ts';
import { updateContactEngagement } from '../../_shared/utils/integrations/resend.ts';
import { pgmqDelete, pgmqRead } from '../../_shared/utils/pgmq-client.ts';
import { TIMEOUT_PRESETS, withTimeout } from '../../_shared/utils/timeout.ts';

const PULSE_QUEUE_NAME = 'pulse';
const PULSE_BATCH_SIZE_DEFAULT = 100; // Fallback if Statsig config unavailable

interface PulseEvent {
  user_id?: string | null;
  content_type: string | null;
  content_slug: string | null;
  interaction_type: string;
  session_id?: string | null;
  metadata?: unknown | null;
}

interface PulseQueueMessage {
  msg_id: bigint;
  read_ct: number;
  vt: string;
  enqueued_at: string;
  message: PulseEvent;
}

/**
 * Process search events batch - inserts into search_queries table
 */
async function processSearchEventsBatch(messages: PulseQueueMessage[]): Promise<{
  inserted: number;
  failed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let inserted = 0;
  let failed = 0;

  try {
    // UUID validation regex (RFC 4122)
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUUID = (value: string | null | undefined): value is string => {
      return typeof value === 'string' && UUID_REGEX.test(value);
    };

    const searchQueries = messages.map((msg) => {
      const event = msg.message;
      const metadata = event.metadata as Record<string, unknown> | null;
      // Validate UUIDs (search_queries.user_id and session_id are uuid type)
      const userId = event.user_id && isValidUUID(event.user_id) ? event.user_id : null;
      const sessionId = event.session_id && isValidUUID(event.session_id) ? event.session_id : null;
      return {
        query: (metadata?.['query'] as string) || '',
        filters: metadata?.['filters'] ?? null,
        result_count: (metadata?.['result_count'] as number) ?? 0,
        user_id: userId,
        session_id: sessionId,
      };
    });

    // Batch insert into search_queries table
    // Use direct insert for batch operations (insertTable helper doesn't support arrays)
    const insertData: DatabaseGenerated['public']['Tables']['search_queries']['Insert'][] =
      searchQueries.map((q) => ({
        query: q.query,
        filters: (q.filters ?? null) as Json | null,
        result_count: q.result_count ?? null,
        user_id: q.user_id ?? null,
        session_id: q.session_id ?? null,
      }));
    const { error } = await (
      supabaseServiceRole.from('search_queries') as unknown as {
        insert: (
          values: DatabaseGenerated['public']['Tables']['search_queries']['Insert'][]
        ) => Promise<{ error: unknown }>;
      }
    ).insert(insertData);

    if (error) {
      throw error;
    }

    inserted = searchQueries.length;
    return { inserted, failed, errors };
  } catch (error) {
    const errorMsg = errorToString(error);
    errors.push(`Search events batch insert failed: ${errorMsg}`);
    console.error('[flux-station] Search events batch insert error', {
      error: errorMsg,
      message_count: messages.length,
    });
    failed = messages.length;
    return { inserted: 0, failed, errors };
  }
}

/**
 * Update Resend contact engagement for copy/view events
 * Non-blocking, fire-and-forget - failures don't affect batch processing
 */
async function updateResendEngagement(messages: PulseQueueMessage[]): Promise<void> {
  if (!RESEND_ENV.apiKey) {
    return; // Resend not configured
  }

  const resend = new Resend(RESEND_ENV.apiKey);
  const engagementEvents: Array<{
    userId: string;
    activityType: 'copy_content' | 'visit_page';
  }> = [];

  // Filter for copy/view events with user_id
  for (const msg of messages) {
    const event = msg.message;
    if (event.user_id && (event.interaction_type === 'copy' || event.interaction_type === 'view')) {
      engagementEvents.push({
        userId: event.user_id,
        activityType: event.interaction_type === 'copy' ? 'copy_content' : 'visit_page',
      });
    }
  }

  if (engagementEvents.length === 0) {
    return;
  }

  // Get unique user IDs
  const userIds = [...new Set(engagementEvents.map((e) => e.userId))];

  // Batch query newsletter subscriptions to get emails
  const { data: subscriptions, error } = await supabaseServiceRole
    .from('newsletter_subscriptions')
    .select('email, user_id')
    .in('user_id', userIds);

  if (error || !subscriptions || subscriptions.length === 0) {
    return; // No subscribers found or query failed
  }

  // Create email map
  const emailMap = new Map<string, string>();
  for (const sub of subscriptions as Array<{
    user_id: string | null;
    email: string;
  }>) {
    if (sub.user_id && sub.email) {
      emailMap.set(sub.user_id, sub.email);
    }
  }

  // Update engagement for each event (fire-and-forget)
  for (const event of engagementEvents) {
    const email = emailMap.get(event.userId);
    if (email) {
      updateContactEngagement(resend, email, event.activityType).catch(() => {
        // Silent fail per event
      });
    }
  }
}

/**
 * Process user interactions batch - inserts into user_interactions table (table name unchanged, queue is now 'pulse')
 */
async function processUserInteractionsBatch(messages: PulseQueueMessage[]): Promise<{
  inserted: number;
  failed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let inserted = 0;
  let failed = 0;

  try {
    // Extract events from messages and convert to JSONB array format
    // Convert PulseEvent to Json-compatible format for RPC
    const events = messages.map((msg) => msg.message as unknown as Json);

    // Batch insert all events in single transaction
    const rpcArgs = {
      p_interactions: events,
    } satisfies DatabaseGenerated['public']['Functions']['batch_insert_user_interactions']['Args'];
    const { data: result, error: batchError } = await callRpc(
      'batch_insert_user_interactions',
      rpcArgs
    );

    if (batchError) {
      throw batchError;
    }

    // Parse result from RPC (returns jsonb with inserted, failed, total, errors)
    const batchResult = result as {
      inserted?: number;
      failed?: number;
      total?: number;
      errors?: Array<{ interaction: unknown; error: string }>;
    };

    inserted = batchResult.inserted ?? 0;
    failed = batchResult.failed ?? 0;

    if (batchResult.errors && Array.isArray(batchResult.errors)) {
      for (const err of batchResult.errors) {
        errors.push(`Interaction failed: ${err.error}`);
      }
    }

    // Update Resend contact engagement for copy/view events (non-blocking)
    if (inserted > 0 && RESEND_ENV.apiKey) {
      updateResendEngagement(messages).catch((error) => {
        // Silent fail - Resend updates are best-effort, don't block batch processing
        console.warn('[flux-station] Resend engagement update failed', {
          error: errorToString(error),
        });
      });
    }

    return { inserted, failed, errors };
  } catch (error) {
    const errorMsg = errorToString(error);
    errors.push(`Batch insert failed: ${errorMsg}`);
    console.error('[flux-station] Pulse batch insert error', {
      error: errorMsg,
      message_count: messages.length,
    });
    return { inserted: 0, failed: messages.length, errors };
  }
}

/**
 * Process sponsored events batch - inserts into sponsored_impressions and sponsored_clicks tables
 */
async function processSponsoredEventsBatch(messages: PulseQueueMessage[]): Promise<{
  inserted: number;
  failed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let inserted = 0;
  let failed = 0;

  try {
    const impressions: Array<{
      sponsored_id: string;
      user_id: string | null;
      page_url?: string;
      position?: number;
    }> = [];
    const clicks: Array<{
      sponsored_id: string;
      user_id: string | null;
      target_url: string;
    }> = [];

    for (const msg of messages) {
      const event = msg.message;
      const metadata = event.metadata as Record<string, unknown> | null;

      if (metadata?.['event_type'] === 'impression') {
        impressions.push({
          sponsored_id: event.content_slug ?? '',
          user_id: event.user_id ?? null,
          ...(metadata?.['page_url'] !== undefined
            ? { page_url: metadata['page_url'] as string }
            : {}),
          ...(metadata?.['position'] !== undefined
            ? { position: metadata['position'] as number }
            : {}),
        });
      } else if (metadata?.['event_type'] === 'click') {
        clicks.push({
          sponsored_id: event.content_slug ?? '',
          user_id: event.user_id ?? null,
          target_url: metadata['target_url'] as string,
        });
      }
    }

    // Batch insert impressions
    if (impressions.length > 0) {
      const insertData: DatabaseGenerated['public']['Tables']['sponsored_impressions']['Insert'][] =
        impressions;
      const { error: impressionsError } = await (
        supabaseServiceRole.from('sponsored_impressions') as unknown as {
          insert: (
            values: DatabaseGenerated['public']['Tables']['sponsored_impressions']['Insert'][]
          ) => Promise<{ error: unknown }>;
        }
      ).insert(insertData);

      if (impressionsError) {
        const errorMessage =
          impressionsError instanceof Error ? impressionsError.message : String(impressionsError);
        errors.push(`Sponsored impressions insert failed: ${errorMessage}`);
        failed += impressions.length;
      } else {
        inserted += impressions.length;
      }
    }

    // Batch insert clicks
    if (clicks.length > 0) {
      const insertData: DatabaseGenerated['public']['Tables']['sponsored_clicks']['Insert'][] =
        clicks;
      const { error: clicksError } = await (
        supabaseServiceRole.from('sponsored_clicks') as unknown as {
          insert: (
            values: DatabaseGenerated['public']['Tables']['sponsored_clicks']['Insert'][]
          ) => Promise<{ error: unknown }>;
        }
      ).insert(insertData);

      if (clicksError) {
        const errorMessage =
          clicksError instanceof Error ? clicksError.message : String(clicksError);
        errors.push(`Sponsored clicks insert failed: ${errorMessage}`);
        failed += clicks.length;
      } else {
        inserted += clicks.length;
      }
    }

    return { inserted, failed, errors };
  } catch (error) {
    const errorMsg = errorToString(error);
    errors.push(`Sponsored events batch processing failed: ${errorMsg}`);
    console.error('[flux-station] Sponsored events batch processing error', {
      error: errorMsg,
      message_count: messages.length,
    });
    return { inserted: 0, failed: messages.length, errors };
  }
}

async function processPulseBatch(messages: PulseQueueMessage[]): Promise<{
  success: boolean;
  inserted: number;
  failed: number;
  errors: string[];
}> {
  // Separate events by type for routing to appropriate tables
  const searchEvents: PulseQueueMessage[] = [];
  const sponsoredEvents: PulseQueueMessage[] = [];
  const otherEvents: PulseQueueMessage[] = [];

  for (const msg of messages) {
    if (msg.message.interaction_type === 'search') {
      searchEvents.push(msg);
    } else if (msg.message.content_type === 'sponsored') {
      sponsoredEvents.push(msg);
    } else {
      otherEvents.push(msg);
    }
  }

  const allErrors: string[] = [];
  let totalInserted = 0;
  let totalFailed = 0;

  // Process search events separately (insert into search_queries)
  if (searchEvents.length > 0) {
    const searchResult = await processSearchEventsBatch(searchEvents);
    totalInserted += searchResult.inserted;
    totalFailed += searchResult.failed;
    allErrors.push(...searchResult.errors);
  }

  // Process sponsored events separately (insert into sponsored_impressions/sponsored_clicks)
  if (sponsoredEvents.length > 0) {
    const sponsoredResult = await processSponsoredEventsBatch(sponsoredEvents);
    totalInserted += sponsoredResult.inserted;
    totalFailed += sponsoredResult.failed;
    allErrors.push(...sponsoredResult.errors);
  }

  // Process other events (insert into user_interactions table - table name unchanged, queue is now 'pulse')
  if (otherEvents.length > 0) {
    const interactionsResult = await processUserInteractionsBatch(otherEvents);
    totalInserted += interactionsResult.inserted;
    totalFailed += interactionsResult.failed;
    allErrors.push(...interactionsResult.errors);
  }

  return {
    success: totalInserted > 0,
    inserted: totalInserted,
    failed: totalFailed,
    errors: allErrors,
  };
}

async function deletePulseMessages(msgIds: bigint[]): Promise<void> {
  // Delete all processed messages in parallel batches for better performance
  // Use concurrency limit to avoid overwhelming the database
  const BATCH_DELETE_CONCURRENCY = 10;

  // Process in chunks to limit concurrent operations
  for (let i = 0; i < msgIds.length; i += BATCH_DELETE_CONCURRENCY) {
    const chunk = msgIds.slice(i, i + BATCH_DELETE_CONCURRENCY);
    await Promise.allSettled(
      chunk.map(async (msgId) => {
        try {
          await pgmqDelete(PULSE_QUEUE_NAME, msgId);
        } catch (error) {
          console.warn('[flux-station] Failed to delete pulse message', {
            msg_id: msgId.toString(),
            error: errorToString(error),
          });
        }
      })
    );
  }
}

export async function handlePulse(_req: Request): Promise<Response> {
  // Get batch size from Statsig dynamic config (with fallback)
  const batchSize = getCacheConfigNumber('queue.pulse.batch_size', PULSE_BATCH_SIZE_DEFAULT);

  // Validate batch size (safety limits)
  const safeBatchSize = Math.max(1, Math.min(batchSize, 500)); // Between 1 and 500

  const logContext = {
    queue: PULSE_QUEUE_NAME,
    batch_size: safeBatchSize,
    config_source: batchSize !== PULSE_BATCH_SIZE_DEFAULT ? 'statsig' : 'default',
  };

  try {
    // Read messages from queue (with timeout protection)
    const messages = await withTimeout(
      pgmqRead(PULSE_QUEUE_NAME, {
        sleep_seconds: 0,
        n: safeBatchSize,
      }),
      TIMEOUT_PRESETS.rpc,
      'Pulse queue read timed out'
    );
    const readError = messages === null ? new Error('Failed to read pulse queue messages') : null;

    if (readError) {
      console.error('[flux-station] Pulse queue read error', {
        ...logContext,
        error: readError.message,
      });
      return errorResponse(
        new Error(`Failed to read pulse queue: ${readError.message}`),
        'flux-station:pulse-read'
      );
    }

    if (!messages || messages.length === 0) {
      return successResponse({ message: 'No messages in pulse queue', processed: 0 }, 200);
    }

    console.log(`[flux-station] Processing ${messages.length} pulse events`, logContext);

    const pulseMessages: PulseQueueMessage[] = (messages || []).map((msg) => ({
      msg_id: msg.msg_id,
      read_ct: msg.read_ct,
      vt: msg.vt,
      enqueued_at: msg.enqueued_at,
      message: msg.message as unknown as PulseEvent,
    }));

    // Process batch
    const result = await processPulseBatch(pulseMessages);

    if (result.success && result.inserted > 0) {
      // Delete successfully processed messages
      // Note: We delete ALL messages in the batch (even if some failed in the RPC)
      // because the RPC handles partial failures internally and returns which ones succeeded
      // Failed ones within the batch are logged but the message is still consumed
      // If the entire batch fails, we don't delete (handled below)
      const msgIds = pulseMessages.map((msg) => msg.msg_id);
      await deletePulseMessages(msgIds);
    } else if (result.inserted === 0) {
      // All failed - don't delete, let them retry via queue visibility timeout
      console.warn('[flux-station] All pulse events failed, will retry', {
        ...logContext,
        failed: result.failed,
        errors: result.errors,
      });
    }

    console.log('[flux-station] Pulse batch processed', {
      ...logContext,
      processed: messages.length,
      inserted: result.inserted,
      failed: result.failed,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });

    return successResponse(
      {
        message: `Processed ${messages.length} pulse events`,
        processed: messages.length,
        inserted: result.inserted,
        failed: result.failed,
        errors: result.errors.length > 0 ? result.errors : undefined,
      },
      200
    );
  } catch (error) {
    console.error('[flux-station] Fatal pulse queue processing error', {
      ...logContext,
      error: errorToString(error),
    });
    return errorResponse(error, 'flux-station:pulse-fatal');
  }
}
