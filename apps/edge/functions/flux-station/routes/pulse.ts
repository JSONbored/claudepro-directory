/**
 * Pulse Route
 * Processes pulse queue in batches for hyper-optimized egress reduction
 * Batch size is configurable via Statsig dynamic config (queue.pulse.batch_size)
 * Default: 100 events per batch
 */

import { Resend } from 'npm:resend@6.5.2';
import type { Database as DatabaseGenerated, Json } from '@heyclaude/database-types';
import {
  errorResponse,
  getCacheConfigNumber,
  pgmqDelete,
  pgmqRead,
  RESEND_ENV,
  successResponse,
  supabaseServiceRole,
  updateContactEngagement,
} from '@heyclaude/edge-runtime';
import { errorToString, TIMEOUT_PRESETS, withTimeout } from '@heyclaude/shared-runtime';

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

    // Safely extract properties from metadata
    const getProperty = (obj: unknown, key: string): unknown => {
      if (typeof obj !== 'object' || obj === null) {
        return undefined;
      }
      const desc = Object.getOwnPropertyDescriptor(obj, key);
      return desc ? desc.value : undefined;
    };

    const getStringProperty = (obj: unknown, key: string): string | undefined => {
      const value = getProperty(obj, key);
      return typeof value === 'string' ? value : undefined;
    };

    const getNumberProperty = (obj: unknown, key: string): number | undefined => {
      const value = getProperty(obj, key);
      return typeof value === 'number' ? value : undefined;
    };

    const searchQueries = messages.map((msg) => {
      const event = msg.message;
      const metadata = event.metadata;
      const metadataObj =
        metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : undefined;
      // Validate UUIDs (search_queries.user_id and session_id are uuid type)
      const userId = event.user_id && isValidUUID(event.user_id) ? event.user_id : null;
      const sessionId = event.session_id && isValidUUID(event.session_id) ? event.session_id : null;

      const query = metadataObj ? (getStringProperty(metadataObj, 'query') ?? '') : '';
      const filtersRaw = metadataObj ? getProperty(metadataObj, 'filters') : null;
      const resultCount = metadataObj ? (getNumberProperty(metadataObj, 'result_count') ?? 0) : 0;

      return {
        query,
        filters: filtersRaw,
        result_count: resultCount,
        user_id: userId,
        session_id: sessionId,
      };
    });

    // Batch insert into search_queries table
    // Use direct insert for batch operations
    const insertData: DatabaseGenerated['public']['Tables']['search_queries']['Insert'][] =
      searchQueries.map((q) => {
        const insert: DatabaseGenerated['public']['Tables']['search_queries']['Insert'] = {
          query: q.query,
          result_count: q.result_count ?? null,
          user_id: q.user_id ?? null,
          session_id: q.session_id ?? null,
        };
        // Conditionally add filters if it's valid Json
        // filters is optional in Insert type, so we only add it if present
        if (q.filters !== null && q.filters !== undefined) {
          // Json type is recursive, so we use JSON.parse/stringify to ensure valid JSON
          // After JSON.parse, the result is guaranteed to be valid Json type
          try {
            const jsonString = JSON.stringify(q.filters);
            const parsed = JSON.parse(jsonString);
            // JSON.parse returns a value that is valid Json (any value that can be JSON-serialized)
            // We validate it's not undefined (JSON.parse never returns undefined)
            if (parsed !== undefined) {
              insert.filters = parsed satisfies Json | null;
            }
          } catch {
            // Invalid JSON, skip filters
          }
        }
        return insert;
      });
    const { error } = await supabaseServiceRole.from('search_queries').insert(insertData);

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

  // Query users table to get emails from user_ids
  const { data: users, error: usersError } = await supabaseServiceRole
    .from('users')
    .select('id, email')
    .in('id', userIds);

  if (usersError || !users || users.length === 0) {
    return; // No users found or query failed
  }

  // Get emails from users
  const emails = users.map((u) => u.email).filter((email): email is string => Boolean(email));

  if (emails.length === 0) {
    return; // No valid emails found
  }

  // Query newsletter subscriptions to find which emails are subscribed
  const { data: subscriptions, error: subscriptionsError } = await supabaseServiceRole
    .from('newsletter_subscriptions')
    .select('email')
    .in('email', emails)
    .eq('status', 'active');

  if (subscriptionsError || !subscriptions || subscriptions.length === 0) {
    return; // No active subscribers found
  }

  // Create email map: user_id -> email (only for users who are subscribed)
  const emailMap = new Map<string, string>();
  const subscribedEmails = new Set(subscriptions.map((s) => s.email));
  for (const user of users) {
    if (user.email && subscribedEmails.has(user.email)) {
      emailMap.set(user.id, user.email);
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
    // Validate content_category enum
    function isValidContentCategory(
      value: unknown
    ): value is DatabaseGenerated['public']['Enums']['content_category'] {
      if (typeof value !== 'string') {
        return false;
      }
      const validValues: DatabaseGenerated['public']['Enums']['content_category'][] = [
        'agents',
        'mcp',
        'rules',
        'commands',
        'hooks',
        'statuslines',
        'skills',
        'collections',
        'guides',
        'jobs',
        'changelog',
      ];
      for (const validValue of validValues) {
        if (value === validValue) {
          return true;
        }
      }
      return false;
    }

    // Validate interaction_type enum
    function isValidInteractionType(
      value: unknown
    ): value is DatabaseGenerated['public']['Enums']['interaction_type'] {
      if (typeof value !== 'string') {
        return false;
      }
      const validValues: DatabaseGenerated['public']['Enums']['interaction_type'][] = [
        'view',
        'copy',
        'bookmark',
        'click',
        'time_spent',
        'search',
        'filter',
        'screenshot',
        'share',
        'download',
        'pwa_installed',
        'pwa_launched',
        'newsletter_subscribe',
        'contact_interact',
        'contact_submit',
        'form_started',
        'form_step_completed',
        'form_field_focused',
        'form_template_selected',
        'form_abandoned',
        'form_submitted',
        'sponsored_impression',
        'sponsored_click',
      ];
      for (const validValue of validValues) {
        if (value === validValue) {
          return true;
        }
      }
      return false;
    }

    // Construct composite type array from messages
    // Convert PulseEvent to user_interaction_input composite type
    const interactions: DatabaseGenerated['public']['CompositeTypes']['user_interaction_input'][] =
      [];

    for (const msg of messages) {
      const event = msg.message;

      // Validate interaction_type (required)
      if (!isValidInteractionType(event.interaction_type)) {
        errors.push(`Invalid interaction_type: ${event.interaction_type}`);
        continue;
      }

      const interaction: DatabaseGenerated['public']['CompositeTypes']['user_interaction_input'] = {
        user_id: event.user_id ?? null,
        content_type: isValidContentCategory(event.content_type) ? event.content_type : null,
        content_slug: event.content_slug ?? null,
        interaction_type: event.interaction_type,
        session_id: event.session_id ?? null,
        metadata: null,
      };

      // Conditionally add metadata if it's valid Json
      // metadata is optional in composite type, so we only add it if present
      if (event.metadata !== null && event.metadata !== undefined) {
        // Json type is recursive, so we use JSON.parse/stringify to ensure valid JSON
        // After JSON.parse, the result is guaranteed to be valid Json type
        try {
          const jsonString = JSON.stringify(event.metadata);
          const parsed = JSON.parse(jsonString);
          // JSON.parse returns a value that is valid Json (any value that can be JSON-serialized)
          // We validate it's not undefined (JSON.parse never returns undefined)
          if (parsed !== undefined) {
            interaction.metadata = parsed satisfies Json | null;
          }
        } catch {
          // Invalid JSON, skip metadata
        }
      }

      interactions.push(interaction);
    }

    // Batch insert all events in single transaction
    const rpcArgs = {
      p_interactions: interactions,
    } satisfies DatabaseGenerated['public']['Functions']['batch_insert_user_interactions']['Args'];
    const { data: result, error: batchError } = await supabaseServiceRole.rpc(
      'batch_insert_user_interactions',
      rpcArgs
    );

    if (batchError) {
      throw batchError;
    }

    if (!result) {
      throw new Error('batch_insert_user_interactions returned null');
    }

    // Use generated type from @heyclaude/database-types - no manual parsing, use types directly
    const batchResult: DatabaseGenerated['public']['Functions']['batch_insert_user_interactions']['Returns'] =
      result;

    inserted = batchResult.inserted ?? 0;
    failed = batchResult.failed ?? 0;

    // errors is Json | null - Json can be an array, so check and iterate directly
    if (batchResult.errors && Array.isArray(batchResult.errors)) {
      for (const err of batchResult.errors) {
        if (
          err &&
          typeof err === 'object' &&
          !Array.isArray(err) &&
          'error' in err &&
          typeof err['error'] === 'string'
        ) {
          errors.push(`Interaction failed: ${err['error']}`);
        }
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

async function processPulseBatch(messages: PulseQueueMessage[]): Promise<{
  success: boolean;
  inserted: number;
  failed: number;
  errors: string[];
}> {
  // Separate events by type for routing to appropriate tables
  const searchEvents: PulseQueueMessage[] = [];
  const otherEvents: PulseQueueMessage[] = []; // All other events (including sponsored) go to user_interactions

  for (const msg of messages) {
    if (msg.message.interaction_type === 'search') {
      searchEvents.push(msg);
    } else {
      // All other events (including sponsored) go to user_interactions
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

  // Process all other events (including sponsored) into user_interactions
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
    let messages: PulseQueueMessage[] | null = null;
    try {
      const rawMessages = await withTimeout(
        pgmqRead(PULSE_QUEUE_NAME, {
          sleep_seconds: 0,
          n: safeBatchSize,
        }),
        TIMEOUT_PRESETS.rpc,
        'Pulse queue read timed out'
      );

      // Cast raw messages to PulseQueueMessage array
      // The pgmqRead returns messages with 'message' as Record<string, unknown>
      // We validate the structure later with isValidPulseEvent
      messages = rawMessages as unknown as PulseQueueMessage[];
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        console.error('[flux-station] Pulse queue read timeout', logContext);
        return errorResponse(error, 'flux-station:pulse-timeout');
      }
      throw error;
    }

    if (!messages || messages.length === 0) {
      return successResponse({ message: 'No messages in pulse queue', processed: 0 }, 200);
    }

    console.log(`[flux-station] Processing ${messages.length} pulse events`, logContext);

    // Safely validate queue message structure
    function isValidPulseEvent(value: unknown): value is PulseEvent {
      if (typeof value !== 'object' || value === null) {
        return false;
      }

      const getProperty = (obj: unknown, key: string): unknown => {
        if (typeof obj !== 'object' || obj === null) {
          return undefined;
        }
        const desc = Object.getOwnPropertyDescriptor(obj, key);
        return desc ? desc.value : undefined;
      };

      const interactionType = getProperty(value, 'interaction_type');
      if (typeof interactionType !== 'string') {
        return false;
      }

      // Validate required fields
      const contentType = getProperty(value, 'content_type');
      const contentSlug = getProperty(value, 'content_slug');
      const userId = getProperty(value, 'user_id');
      const sessionId = getProperty(value, 'session_id');

      return (
        (contentType === null || typeof contentType === 'string') &&
        (contentSlug === null || typeof contentSlug === 'string') &&
        (userId === null || userId === undefined || typeof userId === 'string') &&
        (sessionId === null || sessionId === undefined || typeof sessionId === 'string')
      );
    }

    const pulseMessages: PulseQueueMessage[] = [];
    const invalidMsgIds: bigint[] = [];

    for (const msg of messages || []) {
      if (!isValidPulseEvent(msg.message)) {
        console.warn('[flux-station] Invalid pulse event structure', {
          msg_id: msg.msg_id.toString(),
        });
        invalidMsgIds.push(msg.msg_id);
        continue;
      }

      pulseMessages.push({
        msg_id: msg.msg_id,
        read_ct: msg.read_ct,
        vt: msg.vt,
        enqueued_at: msg.enqueued_at,
        message: msg.message,
      });
    }

    // Delete invalid messages immediately to prevent poison queue loop
    if (invalidMsgIds.length > 0) {
      try {
        await deletePulseMessages(invalidMsgIds);
        console.log('[flux-station] Deleted invalid pulse events', {
          ...logContext,
          count: invalidMsgIds.length,
          msg_ids: invalidMsgIds.map((id) => id.toString()),
        });
      } catch (error) {
        console.error('[flux-station] Failed to delete invalid pulse events', {
          ...logContext,
          count: invalidMsgIds.length,
          error: errorToString(error),
        });
      }
    }

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
