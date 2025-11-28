/**
 * Pulse Route
 * Processes pulse queue in batches for hyper-optimized egress reduction
 * Batch size is configurable via static config (queue.pulse.batch_size)
 * Default: 100 events per batch
 */

import { Resend } from 'npm:resend@6.5.2';
import type { Database as DatabaseGenerated, Json } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import {
  errorResponse,
  getCacheConfigNumber,
  initRequestLogging,
  pgmqDelete,
  pgmqRead,
  publicCorsHeaders,
  RESEND_ENV,
  successResponse,
  supabaseServiceRole,
  traceRequestComplete,
  traceStep,
  updateContactEngagement,
} from '@heyclaude/edge-runtime';
import {
  createUtilityContext,
  errorToString,
  logError,
  logInfo,
  logWarn,
  logger,
  TIMEOUT_PRESETS,
  withTimeout,
} from '@heyclaude/shared-runtime';

const PULSE_QUEUE_NAME = 'pulse';
const PULSE_BATCH_SIZE_DEFAULT = 100; // Fallback if config unavailable
const MAX_PULSE_RETRY_ATTEMPTS = 5; // Maximum number of retry attempts before giving up

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
 * Insert a batch of search-related pulse events into the search_queries table.
 *
 * Validates `user_id` and `session_id` as UUIDs, extracts `query`, optional `filters`,
 * and `result_count` from each event's metadata, and performs a single batch insert.
 * If filters are present they are included as JSON; on a failure the function records
 * an error message and reports all messages as failed.
 *
 * @param messages - Array of pulse queue messages containing search events
 * @returns An object with:
 *  - `inserted` — number of rows successfully inserted,
 *  - `failed` — number of messages considered failed,
 *  - `errors` — array of error messages (empty when there are no errors)
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
        // filters is already a valid JSON value from the message payload
        if (q.filters !== null && q.filters !== undefined) {
          insert.filters = q.filters as Json | null;
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
    const logContext = createUtilityContext('flux-station', 'pulse-search-events', {
      message_count: messages.length,
    });
    // Use dbQuery serializer for consistent database query formatting
    // Note: This is a direct table insert, not an RPC call, so no rpcName
    await logError('Search events batch insert error', logContext, error);
    failed = messages.length;
    return { inserted: 0, failed, errors };
  }
}

/**
 * Send Resend engagement events for user copy and view interactions.
 *
 * Looks up emails for users referenced in `messages`, filters to active newsletter subscribers,
 * and records a `copy_content` or `visit_page` engagement per subscribed user via Resend.
 *
 * The function returns early if Resend is not configured or no eligible events/users are found.
 * Per-event failures are silenced (fire-and-forget) and do not affect batch processing.
 *
 * @param messages - Array of pulse queue messages to inspect for copy/view interactions
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
 * Insert a batch of pulse events into the user_interactions store and aggregate results.
 *
 * Processes each message into the `user_interaction_input` composite type, calls the
 * `batch_insert_user_interactions` RPC once for the batch, and returns aggregated counts
 * and per-item error messages produced by the RPC.
 *
 * Side effects:
 * - May trigger a best-effort, non-blocking Resend engagement update for copy/view events when inserts succeed.
 *
 * @param messages - Array of queued pulse messages to convert and insert
 * @returns An object with:
 *   - `inserted`: number of interactions successfully inserted,
 *   - `failed`: number of interactions that failed insertion,
 *   - `errors`: array of human-readable error messages for failed items or batch failures
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
    /**
     * Determines whether a value is a valid member of the `content_category` enum.
     *
     * @param value - Value to check
     * @returns `true` if `value` is a valid `content_category` enum member, `false` otherwise.
     */
    function isValidContentCategory(
      value: unknown
    ): value is DatabaseGenerated['public']['Enums']['content_category'] {
      if (typeof value !== 'string') {
        return false;
      }
      const validValues = Constants.public.Enums.content_category;
      for (const validValue of validValues) {
        if (value === validValue) {
          return true;
        }
      }
      return false;
    }

    /**
     * Checks whether a value matches one of the allowed `interaction_type` enum values.
     *
     * @param value - The value to test for membership in the `interaction_type` enum
     * @returns `true` if `value` matches an allowed `interaction_type`, `false` otherwise.
     */
    function isValidInteractionType(
      value: unknown
    ): value is DatabaseGenerated['public']['Enums']['interaction_type'] {
      if (typeof value !== 'string') {
        return false;
      }
      const validValues = Constants.public.Enums.interaction_type;
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
      // Use dbQuery serializer for consistent database query formatting
      const logContext = createUtilityContext('flux-station', 'pulse-batch-insert', {
        message_count: messages.length,
        dbQuery: {
          rpcName: 'batch_insert_user_interactions',
          args: rpcArgs, // Will be redacted by Pino's redact config
        },
      });
      await logError('Pulse batch insert RPC error', logContext, batchError);
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
        const logContext = createUtilityContext('flux-station', 'pulse-resend-engagement');
        // Handle logError promise explicitly to avoid unhandled rejection
        logError('Resend engagement update failed', logContext, error).catch(() => {
          // Swallow errors from logging itself - best effort
        });
      });
    }

    return { inserted, failed, errors };
  } catch (error) {
    const errorMsg = errorToString(error);
    errors.push(`Batch insert failed: ${errorMsg}`);
    const logContext = createUtilityContext('flux-station', 'pulse-batch-insert', {
      message_count: messages.length,
      dbQuery: {
        rpcName: 'batch_insert_user_interactions',
      },
    });
    await logError('Pulse batch insert error', logContext, error);
    return { inserted: 0, failed: messages.length, errors };
  }
}

/**
 * Routes a batch of pulse queue messages to their respective processors and aggregates the processing outcome.
 *
 * @param messages - Array of queued pulse messages to process. Messages with `interaction_type === 'search'` are routed to the search queries pipeline; all other interaction types are routed to the user interactions pipeline.
 * @returns An object containing:
 *   - `success`: `true` if at least one row was inserted, `false` otherwise.
 *   - `inserted`: total number of successfully inserted records across all pipelines.
 *   - `failed`: total number of failed records across all pipelines.
 *   - `errors`: array of human-readable error messages encountered during processing.
 */
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

/**
 * Deletes the specified pulse queue messages from the pulse queue, performing deletions in parallel with a controlled concurrency.
 *
 * @param msgIds - Array of `msg_id` values (pgmq message IDs) to remove from the pulse queue
 */
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
          const logContext = createUtilityContext('flux-station', 'pulse-delete-message', {
            msg_id: msgId.toString(),
          });
          await logError('Failed to delete pulse message', logContext, error);
        }
      })
    );
  }
}

/**
 * Processes a batch of pulse queue messages, routes events to their destinations, and handles deletion and retry logic.
 *
 * This handler:
 * - Reads up to a configured number of messages from the pulse queue.
 * - Validates message structure and removes invalid (poison) messages.
 * - Routes "search" events to the search_queries insert path and other events to the user_interactions RPC batch.
 * - Triggers non-blocking Resend engagement updates for eligible events when configured.
 * - Deletes successfully processed messages and removes messages that exceed the maximum retry attempts; leaves other failed messages for retry.
 *
 * Side effects: reads from and deletes messages in the pulse queue, performs database inserts/RPCs, and may call the Resend API.
 *
 * @returns A Response containing a summary of processing results (processed, inserted, failed, and optional errors).
 */
export async function handlePulse(_req: Request): Promise<Response> {
  // Get batch size from static config (with fallback)
  const batchSize = getCacheConfigNumber('queue.pulse.batch_size', PULSE_BATCH_SIZE_DEFAULT);

  // Validate batch size (safety limits)
  const safeBatchSize = Math.max(1, Math.min(batchSize, 500)); // Between 1 and 500

  const logContext: Record<string, unknown> = {
    function: 'flux-station:pulse',
    action: 'pulse-processing',
    request_id: crypto.randomUUID(),
    started_at: new Date().toISOString(),
    queue: PULSE_QUEUE_NAME,
    batch_size: safeBatchSize,
    config_source: 'static', // Always static configs now
  };
  
  // Initialize request logging with trace and bindings (Phase 1 & 2)
  initRequestLogging(logContext);
  traceStep('Starting pulse processing', logContext);
  
  // Set bindings for this request - mixin will automatically inject these into all subsequent logs
  logger.setBindings({
    requestId: typeof logContext['request_id'] === 'string' ? logContext['request_id'] : undefined,
    operation: typeof logContext['action'] === 'string' ? logContext['action'] : 'pulse-processing',
    function: typeof logContext['function'] === 'string' ? logContext['function'] : 'unknown',
    queue: PULSE_QUEUE_NAME,
    batchSize: safeBatchSize,
  });

  try {
    // Read messages from queue (with timeout protection)
    traceStep('Reading pulse queue', logContext);
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
        await logError('Pulse queue read timeout', logContext, error);
        return await errorResponse(error, 'flux-station:pulse-timeout', publicCorsHeaders, logContext);
      }
      throw error;
    }

    if (!messages || messages.length === 0) {
      traceRequestComplete(logContext);
      return successResponse({ message: 'No messages in pulse queue', processed: 0 }, 200);
    }

    logInfo(`Processing ${messages.length} pulse events`, logContext);
    traceStep(`Processing ${messages.length} pulse events`, logContext);

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
        const logContext = createUtilityContext('flux-station', 'pulse-validate', {
          msg_id: msg.msg_id.toString(),
        });
        logWarn('Invalid pulse event structure', logContext);
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
        logInfo('Deleted invalid pulse events', {
          ...logContext,
          count: invalidMsgIds.length,
          msg_ids: invalidMsgIds.map((id) => id.toString()),
        });
      } catch (error) {
        await logError(
          'Failed to delete invalid pulse events',
          {
            ...logContext,
            count: invalidMsgIds.length,
          },
          error
        );
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
      // All failed - check if messages have exceeded max retry attempts
      const maxAttemptsReached = pulseMessages.some(
        (msg) => Number(msg.read_ct ?? 0) >= MAX_PULSE_RETRY_ATTEMPTS
      );

      if (maxAttemptsReached) {
        // Delete messages that exceeded max retry attempts to prevent infinite retry loop
        const exceededMsgIds = pulseMessages
          .filter((msg) => Number(msg.read_ct ?? 0) >= MAX_PULSE_RETRY_ATTEMPTS)
          .map((msg) => msg.msg_id);

        try {
          await deletePulseMessages(exceededMsgIds);
          await logError('Pulse events exceeded max retry attempts, removed from queue', {
            ...logContext,
            failed: result.failed,
            errors: result.errors,
            deleted_count: exceededMsgIds.length,
            max_attempts: MAX_PULSE_RETRY_ATTEMPTS,
          });
        } catch (deleteError) {
          await logError(
            'Failed to delete pulse events after max retries',
            {
              ...logContext,
              count: exceededMsgIds.length,
            },
            deleteError
          );
        }
      } else {
        // Leave in queue for retry via queue visibility timeout
        logWarn('All pulse events failed, will retry', {
          ...logContext,
          failed: result.failed,
          errors: result.errors,
        });
      }
    }

    logInfo('Pulse batch processed', {
      ...logContext,
      processed: messages.length,
      inserted: result.inserted,
      failed: result.failed,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
    traceRequestComplete(logContext);

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
    await logError('Fatal pulse queue processing error', logContext, error);
    return await errorResponse(error, 'flux-station:pulse-fatal', publicCorsHeaders, logContext);
  }
}