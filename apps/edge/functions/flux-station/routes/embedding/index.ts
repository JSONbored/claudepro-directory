/**
 * Generate Embedding Edge Function
 */

/// <reference types="@heyclaude/edge-runtime/deno-globals.d.ts" />

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import {
  badRequestResponse,
  errorResponse,
  initRequestLogging,
  parseJsonBody,
  pgmqDelete,
  pgmqRead,
  pgmqSend,
  publicCorsHeaders,
  successResponse,
  supabaseServiceRole,
  traceRequestComplete,
  traceStep,
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
  logger,
  TIMEOUT_PRESETS,
  verifySupabaseDatabaseWebhook,
  withCircuitBreaker,
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
    // Supabase global is provided by Supabase Edge Runtime (declared in @heyclaude/edge-runtime/deno-globals.d.ts)
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
    if (embeddingResult.length === 0) {
      throw new Error('Embedding generation returned empty array');
    }
    if (!embeddingResult.every((val) => typeof val === 'number' && !Number.isNaN(val))) {
      throw new Error('Embedding generation returned non-numeric values');
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
    // Store embedding as JSON string for TEXT/JSONB column
    // Note: If this column is a pgvector type, it would require format '[1,2,3]' instead
    // The query_content_embeddings RPC function handles format conversion if needed
    const insertData: ContentEmbeddingsInsert = {
      content_id: contentId,
      content_text: contentText,
      embedding: JSON.stringify(embedding),
      embedding_generated_at: new Date().toISOString(),
    };
    const { error } = await supabaseServiceRole.from('content_embeddings').upsert(insertData);

    if (error) {
      // Use dbQuery serializer for consistent database query formatting
      const logContext = createUtilityContext('generate-embedding', 'store-embedding');
      await logError('Failed to store embedding', {
        ...logContext,
        dbQuery: {
          table: 'content_embeddings',
          operation: 'upsert',
          schema: 'public',
          args: {
            content_id: contentId,
            // Embedding data redacted by Pino's redact config
          },
        },
      }, error);
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
  const logContext = createUtilityContext('generate-embedding', 'webhook-handler');

  // Initialize request logging with trace and bindings (Phase 1 & 2)
  initRequestLogging(logContext);
  traceStep('Embedding webhook handler started', logContext);
  
  // Set bindings for this request - mixin will automatically inject these into all subsequent logs
  logger.setBindings({
    requestId: logContext.request_id,
    operation: logContext.action || 'embedding-webhook',
    function: logContext.function,
  });

  const logEvent = async (status: number, outcome: 'success' | 'error', error?: unknown) => {
    const errorData = error ? { error: errorToString(error) } : {};
    const logData = {
      ...logContext,
      status,
      outcome,
      ...errorData,
    };

    if (outcome === 'error') {
      await logError('Embedding generation failed', logContext, error);
    } else {
      logInfo('Embedding generation completed', logData);
    }
  };

  return handler()
    .then((response) => {
      logEvent(response.status, response.ok ? 'success' : 'error');
      return response;
    })
    .catch(async (error) => {
      await logEvent(500, 'error', error);
      return await errorResponse(error, 'generate-embedding', publicCorsHeaders, logContext);
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
 * Type guard to validate queue message structure
 * Validates that message has required fields - uses satisfies pattern for type safety
 */
function isValidQueueMessage(
  msg: unknown
): msg is { content_id: string; type?: string; created_at?: string } {
  if (typeof msg !== 'object' || msg === null) {
    return false;
  }
  // Check for required content_id field
  return 'content_id' in msg && typeof (msg as Record<string, unknown>)['content_id'] === 'string';
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
    // Fetch content from database (with circuit breaker + timeout)
    type ContentRow = DatabaseGenerated['public']['Tables']['content']['Row'];
    const fetchResult = await withTimeout(
      withCircuitBreaker(
        'generate-embedding:fetch-content',
        async () =>
          await supabaseServiceRole.from('content').select('*').eq('id', content_id).single(),
        CIRCUIT_BREAKER_CONFIGS.rpc
      ),
      TIMEOUT_PRESETS.rpc,
      'Content fetch timed out'
    );
    const { data: content, error: fetchError } = fetchResult as {
      data: ContentRow | null;
      error: { message?: string } | null;
    };

    if (fetchError || !content) {
      // Use dbQuery serializer for consistent database query formatting
      const errorLogContext = createUtilityContext('generate-embedding', 'fetch-content');
      if (fetchError) {
        await logError('Failed to fetch content for embedding generation', {
          ...errorLogContext,
          dbQuery: {
            table: 'content',
            operation: 'select',
            schema: 'public',
            args: {
              id: content_id,
            },
          },
        }, fetchError);
      }
      errors.push(`Failed to fetch content: ${fetchError?.message || 'Content not found'}`);
      return { success: false, errors };
    }

    // Content is guaranteed to be non-null after the check above
    // Type is already correctly inferred from the Supabase query
    const contentRow = content;

    // Build searchable text - use contentRow directly (already typed as ContentRow)
    const searchableText = buildSearchableText(contentRow);

    if (!searchableText || searchableText.trim().length === 0) {
      // Skip empty content (not an error, just nothing to embed)
      const logContext = createUtilityContext('generate-embedding', 'skip-empty');
      logInfo('Skipping embedding generation: empty searchable text', {
        ...logContext,
        content_id,
      });
      return { success: true, errors: [] }; // Mark as success (skipped)
    }

    // Generate embedding (with circuit breaker + timeout)
    const embedding = await generateEmbedding(searchableText);

    // Store embedding (with circuit breaker + timeout)
    await storeEmbedding(content_id, searchableText, embedding);

    const logContext = createUtilityContext('generate-embedding', 'store-success');
    logInfo('Embedding generated and stored', {
      ...logContext,
      content_id,
      embedding_dim: embedding.length,
    });

    return { success: true, errors: [] };
  } catch (error) {
    const errorMsg = errorToString(error);
    errors.push(`Embedding generation failed: ${errorMsg}`);
    const errorLogContext = createUtilityContext('generate-embedding', 'generation-error');
    await logError(
      'Embedding generation error',
      {
        ...errorLogContext,
        content_id,
      },
      error
    );
    return { success: false, errors };
  }
}

/**
 * Queue worker handler
 * POST /process - Processes embedding_generation queue
 */
export async function handleEmbeddingGenerationQueue(_req: Request): Promise<Response> {
  const logContext = createUtilityContext('generate-embedding', 'queue-processor', {});
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Starting embedding generation queue processing', logContext);
  
  try {
    // Read messages with timeout protection
    traceStep('Reading embedding generation queue', logContext);
    const messages = await withTimeout(
      pgmqRead(EMBEDDING_GENERATION_QUEUE, {
        sleep_seconds: 0,
        n: QUEUE_BATCH_SIZE,
      }),
      TIMEOUT_PRESETS.rpc,
      'Embedding generation queue read timed out'
    );

    if (!messages || messages.length === 0) {
      traceRequestComplete(logContext);
      return successResponse({ message: 'No messages in queue', processed: 0 }, 200);
    }

    logInfo(`Processing ${messages.length} embedding generation jobs`, {
      ...logContext,
      count: messages.length,
    });
    traceStep(`Processing ${messages.length} embedding generation jobs`, logContext);

    const results: Array<{
      msg_id: string;
      status: 'success' | 'skipped' | 'failed';
      errors: string[];
      will_retry?: boolean;
    }> = [];

    for (const msg of messages) {
      // Validate message structure matches expected format
      const queueMessage = msg.message;

      if (!isValidQueueMessage(queueMessage)) {
        const errorLogContext = createUtilityContext('generate-embedding', 'invalid-message');
        await logError(
          'Invalid queue message format',
          {
            ...errorLogContext,
            msg_id: msg.msg_id.toString(),
          },
          new Error(`Invalid message: ${JSON.stringify(queueMessage)}`)
        );

        // Delete invalid message to prevent infinite retry loop
        try {
          await pgmqDelete(EMBEDDING_GENERATION_QUEUE, msg.msg_id);
          logInfo('Deleted invalid message', {
            ...errorLogContext,
            msg_id: msg.msg_id.toString(),
          });
        } catch (deleteError) {
          await logError(
            'Failed to delete invalid message',
            {
              ...errorLogContext,
              msg_id: msg.msg_id.toString(),
            },
            deleteError
          );
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

      logInfo('Processing queue message', {
        ...logContext,
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
            logWarn('Message moved to DLQ after max attempts', {
              ...logContext,
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
        await logError(
          'Unexpected error processing embedding generation',
          {
            ...logContext,
            msg_id: message.msg_id.toString(),
          },
          error
        );
        results.push({
          msg_id: message.msg_id.toString(),
          status: 'failed',
          errors: [errorMsg],
          will_retry: Number(message.read_ct ?? 0) < MAX_EMBEDDING_ATTEMPTS,
        });
      }
    }

    traceRequestComplete(logContext);
    return successResponse(
      {
        message: `Processed ${messages.length} messages`,
        processed: messages.length,
        results,
      },
      200
    );
  } catch (error) {
    await logError('Fatal embedding generation queue error', logContext, error);
    return await errorResponse(error, 'generate-embedding:queue-fatal', publicCorsHeaders, logContext);
  }
}

export async function handleEmbeddingWebhook(req: Request): Promise<Response> {
  // Otherwise, handle as direct webhook (legacy)
  return respondWithAnalytics(async () => {
    const logContext = createUtilityContext('generate-embedding', 'webhook-handler');

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
      await logError(
        'INTERNAL_API_SECRET environment variable is not configured - rejecting request for security',
        logContext,
        new Error('Missing INTERNAL_API_SECRET')
      );
      return await errorResponse(
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

    // Validate webhook source (defense-in-depth: ensure webhook is from expected table)
    if (payload.schema !== 'public' || payload.table !== 'content') {
      logWarn('Unexpected webhook source', {
        ...logContext,
        schema: payload.schema,
        table: payload.table,
      });
      return badRequestResponse(
        'Unexpected webhook source',
        webhookCorsHeaders,
        buildSecurityHeaders()
      );
    }

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
