/// <reference path="@heyclaude/edge-runtime/deno-globals.d.ts" />

/**
 * Generate Embedding Edge Function
 */

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import {
  badRequestResponse,
  errorResponse,
  parseJsonBody,
  pgmqDelete,
  pgmqRead,
  pgmqSend,
  successResponse,
  supabaseServiceRole,
  unauthorizedResponse,
  webhookCorsHeaders,
} from '@heyclaude/edge-runtime';
import {
  buildSecurityHeaders,
  CIRCUIT_BREAKER_CONFIGS,
  createUtilityContext,
  errorToString,
  logError,
  logInfo,
  logWarn,
  TIMEOUT_PRESETS,
  verifySupabaseDatabaseWebhook,
  withCircuitBreaker,
  withDuration,
  withTimeout,
} from '@heyclaude/shared-runtime';

// Webhook payload structure from Supabase database webhooks
// Use generated type for the record (content table row)
type ContentRow = DatabaseGenerated['public']['Tables']['content']['Row'];
type ContentWebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: ContentRow;
  old_record?: ContentRow | null;
  schema: string;
};

/**
 * Build searchable text from content fields
 * Combines title, description, tags, and author for embedding generation
 * Uses generated ContentRow type directly
 */
function buildSearchableText(record: ContentRow): string {
  const parts: string[] = [];

  if (record.title) {
    parts.push(record.title);
  }

  if (record.description) {
    parts.push(record.description);
  }

  // Add tags as searchable text
  if (record.tags && record.tags.length > 0) {
    parts.push(record.tags.join(' '));
  }

  // Add author as searchable text
  if (record.author) {
    parts.push(record.author);
  }

  // Optionally include content body (if not too long)
  // Limit to first 1000 chars to avoid token limits
  if (record.content && record.content.length > 0) {
    const contentPreview = record.content.substring(0, 1000);
    parts.push(contentPreview);
  }

  return parts.join(' ').trim();
}

/**
 * Generate embedding for content text
 * Wrapped with circuit breaker and timeout for reliability
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const generateEmbeddingInternal = async () => {
    // Initialize Supabase AI session with gte-small model
    const model = new Supabase.ai.Session('gte-small');

    // Generate embedding with normalization
    const embeddingResult = await model.run(text, {
      mean_pool: true, // Use mean pooling for better quality
      normalize: true, // Normalize for inner product similarity
    });

    // Validate embedding is an array of numbers
    if (!Array.isArray(embeddingResult)) {
      throw new Error('Embedding generation returned non-array result');
    }
    return embeddingResult;
  };

  // Wrap with circuit breaker and timeout
  return await withTimeout(
    withCircuitBreaker(
      'generate-embedding:ai-model',
      generateEmbeddingInternal,
      CIRCUIT_BREAKER_CONFIGS.external
    ),
    TIMEOUT_PRESETS.external * 2, // AI model calls can take longer (10s)
    'Embedding generation timed out'
  );
}

/**
 * Store embedding in database
 * Wrapped with circuit breaker and timeout for reliability
 */
async function storeEmbedding(
  contentId: string,
  contentText: string,
  embedding: number[]
): Promise<void> {
  const storeEmbeddingInternal = async () => {
    type ContentEmbeddingsInsert =
      DatabaseGenerated['public']['Tables']['content_embeddings']['Insert'];
    const insertData: ContentEmbeddingsInsert = {
      content_id: contentId,
      content_text: contentText,
      embedding: JSON.stringify(embedding), // pgvector expects JSON string
      embedding_generated_at: new Date().toISOString(),
    };
    const { error } = await supabaseServiceRole.from('content_embeddings').upsert(insertData);

    if (error) {
      throw new Error(`Failed to store embedding: ${errorToString(error)}`);
    }
  };

  // Wrap with circuit breaker and timeout
  await withTimeout(
    withCircuitBreaker(
      'generate-embedding:database',
      storeEmbeddingInternal,
      CIRCUIT_BREAKER_CONFIGS.rpc
    ),
    TIMEOUT_PRESETS.rpc,
    'Database storage timed out'
  );
}

/**
 * Main webhook handler with analytics wrapper pattern
 */
function respondWithAnalytics(handler: () => Promise<Response>): Promise<Response> {
  const startedAt = performance.now();
  const logContext = createUtilityContext('generate-embedding', 'webhook-handler');

  const logEvent = (status: number, outcome: 'success' | 'error', error?: unknown) => {
    const duration = Math.round(performance.now() - startedAt);
    const errorData = error ? { error: errorToString(error) } : {};
    const logData = {
      ...withDuration(logContext, startedAt),
      status,
      outcome,
      duration_ms: duration,
      ...errorData,
    };

    if (outcome === 'error') {
      logError('Embedding generation failed', logContext, error);
    } else {
      logInfo('Embedding generation completed', logData);
    }
  };

  return handler()
    .then((response) => {
      logEvent(response.status, response.ok ? 'success' : 'error');
      return response;
    })
    .catch((error) => {
      logEvent(500, 'error', error);
      return errorResponse(error, 'generate-embedding');
    });
}

const EMBEDDING_GENERATION_QUEUE = 'embedding_generation';
const EMBEDDING_GENERATION_DLQ = 'embedding_generation_dlq';
const QUEUE_BATCH_SIZE = 10; // Moderate batch size for AI operations
const MAX_EMBEDDING_ATTEMPTS = 5;

interface EmbeddingGenerationQueueMessage {
  msg_id: bigint;
  read_ct: number;
  vt: string;
  enqueued_at: string;
  message: {
    content_id: string;
    type: 'INSERT' | 'UPDATE';
    created_at: string;
  };
}

/**
 * Process a single embedding generation job (from queue)
 */
async function processEmbeddingGeneration(
  message: EmbeddingGenerationQueueMessage
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  const { content_id } = message.message;

  try {
    // Fetch content from database
    const { data: content, error: fetchError } = await supabaseServiceRole
      .from('content')
      .select('*')
      .eq('id', content_id)
      .single();

    if (fetchError || !content) {
      errors.push(`Failed to fetch content: ${fetchError?.message || 'Content not found'}`);
      return { success: false, errors };
    }

    // Content is guaranteed to be non-null after the check above
    // Type is already correctly inferred from the Supabase query
    type ContentRow = DatabaseGenerated['public']['Tables']['content']['Row'];
    // No type assertion needed - Supabase query already returns correct type
    const contentRow = content satisfies ContentRow;

    // Build searchable text - use contentRow directly (already typed as ContentRow)
    const searchableText = buildSearchableText(contentRow);

    if (!searchableText || searchableText.trim().length === 0) {
      // Skip empty content (not an error, just nothing to embed)
      console.log('[generate-embedding] Skipping embedding generation: empty searchable text', {
        content_id,
      });
      return { success: true, errors: [] }; // Mark as success (skipped)
    }

    // Generate embedding (with circuit breaker + timeout)
    const embedding = await generateEmbedding(searchableText);

    // Store embedding (with circuit breaker + timeout)
    await storeEmbedding(content_id, searchableText, embedding);

    console.log('[generate-embedding] Embedding generated and stored', {
      content_id,
      embedding_dim: embedding.length,
    });

    return { success: true, errors: [] };
  } catch (error) {
    const errorMsg = errorToString(error);
    errors.push(`Embedding generation failed: ${errorMsg}`);
    console.error('[generate-embedding] Embedding generation error', {
      content_id,
      error: errorMsg,
    });
    return { success: false, errors };
  }
}

/**
 * Queue worker handler
 * POST /process - Processes embedding_generation queue
 */
export async function handleEmbeddingGenerationQueue(_req: Request): Promise<Response> {
  try {
    // Read messages with timeout protection
    const messages = await withTimeout(
      pgmqRead(EMBEDDING_GENERATION_QUEUE, {
        sleep_seconds: 0,
        n: QUEUE_BATCH_SIZE,
      }),
      TIMEOUT_PRESETS.rpc,
      'Embedding generation queue read timed out'
    );

    if (!messages || messages.length === 0) {
      return successResponse({ message: 'No messages in queue', processed: 0 }, 200);
    }

    console.log(`[generate-embedding] Processing ${messages.length} embedding generation jobs`);

    const results: Array<{
      msg_id: string;
      status: 'success' | 'skipped' | 'failed';
      errors: string[];
      will_retry?: boolean;
    }> = [];

    for (const msg of messages) {
      // Validate message structure matches expected format
      const queueMessage = msg.message;

      // Type guard to validate message structure
      // Validates that message has required fields - uses satisfies pattern for type safety
      function isValidQueueMessage(
        msg: unknown
      ): msg is { content_id: string; type?: string; created_at?: string } {
        if (typeof msg !== 'object' || msg === null) {
          return false;
        }
        // Check for required content_id field
        // Use Object.getOwnPropertyDescriptor to avoid type assertions
        const contentIdDesc = Object.getOwnPropertyDescriptor(msg, 'content_id');
        if (!contentIdDesc || typeof contentIdDesc.value !== 'string') {
          return false;
        }
        return true;
      }

      if (!isValidQueueMessage(queueMessage)) {
        console.error('[generate-embedding] Invalid queue message format', {
          msg_id: msg.msg_id.toString(),
          message: queueMessage,
        });

        // Delete invalid message to prevent infinite retry loop
        try {
          await pgmqDelete(EMBEDDING_GENERATION_QUEUE, msg.msg_id);
          console.log('[generate-embedding] Deleted invalid message', {
            msg_id: msg.msg_id.toString(),
          });
        } catch (deleteError) {
          console.error('[generate-embedding] Failed to delete invalid message', {
            msg_id: msg.msg_id.toString(),
            error: errorToString(deleteError),
          });
        }

        results.push({
          msg_id: msg.msg_id.toString(),
          status: 'failed',
          errors: ['Invalid queue message format'],
          will_retry: false, // Don't retry malformed messages
        });
        continue;
      }

      const message: EmbeddingGenerationQueueMessage = {
        msg_id: msg.msg_id,
        read_ct: msg.read_ct,
        vt: msg.vt,
        enqueued_at: msg.enqueued_at,
        message: {
          content_id: queueMessage.content_id,
          type: queueMessage.type === 'UPDATE' ? 'UPDATE' : 'INSERT',
          created_at: queueMessage.created_at ?? new Date().toISOString(),
        },
      };

      console.log('[generate-embedding] Processing queue message', {
        msg_id: message.msg_id.toString(),
        content_id: message.message.content_id,
        attempt: Number(message.read_ct ?? 0) + 1,
      });

      try {
        const result = await processEmbeddingGeneration(message);

        if (result.success) {
          await pgmqDelete(EMBEDDING_GENERATION_QUEUE, message.msg_id);
          results.push({
            msg_id: message.msg_id.toString(),
            status: 'success',
            errors: result.errors,
          });
        } else {
          const hasExceededAttempts = Number(message.read_ct ?? 0) >= MAX_EMBEDDING_ATTEMPTS;

          if (hasExceededAttempts) {
            await pgmqSend(
              EMBEDDING_GENERATION_DLQ,
              {
                original_message: message,
                errors: result.errors,
                failed_at: new Date().toISOString(),
              },
              { sleepSeconds: 0 }
            );
            await pgmqDelete(EMBEDDING_GENERATION_QUEUE, message.msg_id);
            console.warn('[generate-embedding] Message moved to DLQ after max attempts', {
              msg_id: message.msg_id.toString(),
              content_id: message.message.content_id,
              attempts: message.read_ct,
            });
            results.push({
              msg_id: message.msg_id.toString(),
              status: 'failed',
              errors: [...result.errors, 'Moved to embedding_generation_dlq'],
              will_retry: false,
            });
          } else {
            // Leave in queue for retry
            results.push({
              msg_id: message.msg_id.toString(),
              status: 'failed',
              errors: result.errors,
              will_retry: true,
            });
          }
        }
      } catch (error) {
        const errorMsg = errorToString(error);
        console.error('[generate-embedding] Unexpected error processing embedding generation', {
          msg_id: message.msg_id.toString(),
          error: errorMsg,
        });
        results.push({
          msg_id: message.msg_id.toString(),
          status: 'failed',
          errors: [errorMsg],
          will_retry: Number(message.read_ct ?? 0) < MAX_EMBEDDING_ATTEMPTS,
        });
      }
    }

    return successResponse(
      {
        message: `Processed ${messages.length} messages`,
        processed: messages.length,
        results,
      },
      200
    );
  } catch (error) {
    console.error('[generate-embedding] Fatal embedding generation queue error', {
      error: errorToString(error),
    });
    return errorResponse(error, 'generate-embedding:queue-fatal');
  }
}

export async function handleEmbeddingWebhook(req: Request): Promise<Response> {
  // Otherwise, handle as direct webhook (legacy)
  return respondWithAnalytics(async () => {
    const logContext = createUtilityContext('generate-embedding', 'webhook-handler');
    const startTime = performance.now();

    // Only accept POST requests
    if (req.method !== 'POST') {
      return badRequestResponse('Method not allowed', webhookCorsHeaders, {
        Allow: 'POST',
        ...buildSecurityHeaders(),
      });
    }

    // Read raw body for signature verification (before parsing)
    const rawBody = await req.text();

    // Verify webhook signature - INTERNAL_API_SECRET is required for security
    const webhookSecret = Deno.env.get('INTERNAL_API_SECRET');
    if (!webhookSecret) {
      logError(
        'INTERNAL_API_SECRET environment variable is not configured - rejecting request for security',
        logContext,
        new Error('Missing INTERNAL_API_SECRET')
      );
      return errorResponse(
        new Error('Server configuration error: INTERNAL_API_SECRET is not set'),
        'embedding-webhook:config_error',
        webhookCorsHeaders
      );
    }

    // Check for common signature header names
    const signature =
      req.headers.get('x-supabase-signature') ||
      req.headers.get('x-webhook-signature') ||
      req.headers.get('x-signature');
    const timestamp = req.headers.get('x-webhook-timestamp') || req.headers.get('x-timestamp');

    if (!signature) {
      const headerNames: string[] = [];
      req.headers.forEach((_, key) => {
        headerNames.push(key);
      });
      logWarn('Missing webhook signature header', {
        ...logContext,
        headers: headerNames,
      });
      return unauthorizedResponse('Missing webhook signature', webhookCorsHeaders);
    }

    // Validate timestamp if provided (prevent replay attacks)
    if (timestamp) {
      const timestampMs = Number.parseInt(timestamp, 10);
      if (Number.isNaN(timestampMs)) {
        return badRequestResponse('Invalid timestamp format', webhookCorsHeaders);
      }

      const now = Date.now();
      const timestampAge = now - timestampMs;
      const maxAge = 5 * 60 * 1000; // 5 minutes

      if (timestampAge > maxAge || timestampAge < -maxAge) {
        logWarn('Webhook timestamp too old or too far in future', {
          ...logContext,
          timestamp: timestampMs,
          now,
          age_ms: timestampAge,
        });
        return unauthorizedResponse(
          'Webhook timestamp out of acceptable range',
          webhookCorsHeaders
        );
      }
    }

    const isValid = await verifySupabaseDatabaseWebhook({
      rawBody,
      signature,
      timestamp: timestamp || null,
      secret: webhookSecret,
    });

    if (!isValid) {
      logWarn('Webhook signature verification failed', {
        ...logContext,
        has_timestamp: !!timestamp,
      });
      return unauthorizedResponse('Invalid webhook signature', webhookCorsHeaders);
    }

    logInfo('Webhook signature verified', {
      ...logContext,
      has_timestamp: !!timestamp,
    });

    // Parse webhook payload (create new request from raw body since we already read it)
    const parseResult = await parseJsonBody<ContentWebhookPayload>(
      new Request(req.url, {
        method: req.method,
        headers: req.headers,
        body: rawBody,
      }),
      {
        maxSize: 100 * 1024, // 100KB max payload
        cors: webhookCorsHeaders,
      }
    );

    if (!parseResult.success) {
      return parseResult.response;
    }

    const payload = parseResult.data;

    // Validate payload structure
    if (!payload.record?.id) {
      const securityHeaders = buildSecurityHeaders();
      return badRequestResponse(
        'Invalid webhook payload: missing record.id',
        webhookCorsHeaders,
        securityHeaders
      );
    }

    // Only process INSERT and UPDATE events
    if (payload.type === 'DELETE') {
      // Deletions are handled by CASCADE in database
      logInfo('Content deleted, embedding will be CASCADE deleted', {
        ...logContext,
        content_id: payload.old_record?.id,
      });
      const securityHeaders = buildSecurityHeaders();
      return successResponse({ skipped: true, reason: 'delete_event' }, 200, {
        ...webhookCorsHeaders,
        ...securityHeaders,
      });
    }

    const { record } = payload;
    const contentId = record.id;

    // Build searchable text
    const searchableText = buildSearchableText(record);

    if (!searchableText || searchableText.trim().length === 0) {
      logInfo('Skipping embedding generation: empty searchable text', {
        ...logContext,
        content_id: contentId,
      });
      const securityHeaders = buildSecurityHeaders();
      return successResponse({ skipped: true, reason: 'empty_text' }, 200, {
        ...webhookCorsHeaders,
        ...securityHeaders,
      });
    }

    // Generate embedding (with circuit breaker + timeout)
    logInfo('Generating embedding', {
      ...logContext,
      content_id: contentId,
      text_length: searchableText.length,
    });

    const embedding = await generateEmbedding(searchableText);

    // Store embedding (with circuit breaker + timeout)
    await storeEmbedding(contentId, searchableText, embedding);

    logInfo('Embedding generated and stored', {
      ...logContext,
      content_id: contentId,
      embedding_dim: embedding.length,
      duration_ms: Math.round(performance.now() - startTime),
    });

    const securityHeaders = buildSecurityHeaders();
    return successResponse(
      {
        success: true,
        content_id: contentId,
        embedding_dim: embedding.length,
      },
      200,
      { ...webhookCorsHeaders, ...securityHeaders }
    );
  });
}
