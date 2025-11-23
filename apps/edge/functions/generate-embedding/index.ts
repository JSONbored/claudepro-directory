/// <reference path="@heyclaude/edge-runtime/deno-globals.d.ts" />

/**
 * Generate Embedding Edge Function
 *
 * Handles two modes:
 * 1. Queue Worker: POST /process - Processes embedding_generation queue (automatic)
 * 2. Direct Webhook: POST / - Direct embedding generation (manual/legacy)
 *
 * Automatic generation (queue-based):
 * - Database triggers enqueue jobs to 'embedding_generation' queue
 * - Queue worker processes batches: POST /process
 *
 * Manual generation (direct webhook):
 * - Legacy webhook endpoint for backward compatibility
 * - Direct embedding generation without queue
 *
 * Flow (queue worker):
 * 1. Read batch from embedding_generation queue
 * 2. For each message: Fetch content → Build text → Generate → Store
 * 3. Delete message on success, leave in queue for retry on failure
 *
 * Flow (direct webhook):
 * 1. Receive webhook payload (content row)
 * 2. Extract text fields (title, description, tags, author)
 * 3. Concatenate into searchable text
 * 4. Generate embedding using gte-small model (with circuit breaker + timeout)
 * 5. Store in content_embeddings table (with circuit breaker + timeout)
 * 6. Return success (webhook expects 200 response)
 */

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { supabaseServiceRole } from '@heyclaude/edge-runtime/clients/supabase.ts';
import {
  badRequestResponse,
  errorResponse,
  successResponse,
  webhookCorsHeaders,
} from '@heyclaude/edge-runtime/utils/http.ts';
import { parseJsonBody } from '@heyclaude/edge-runtime/utils/parse-json-body.ts';
import { pgmqDelete, pgmqRead } from '@heyclaude/edge-runtime/utils/pgmq-client.ts';
import {
  buildSecurityHeaders,
  CIRCUIT_BREAKER_CONFIGS,
  createUtilityContext,
  errorToString,
  logError,
  logInfo,
  TIMEOUT_PRESETS,
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
const QUEUE_BATCH_SIZE = 10; // Moderate batch size for AI operations

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
async function handleEmbeddingGenerationQueue(_req: Request): Promise<Response> {
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
          // Leave in queue for retry (pgmq visibility timeout will retry)
          results.push({
            msg_id: message.msg_id.toString(),
            status: 'failed',
            errors: result.errors,
            will_retry: true,
          });
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
          will_retry: true,
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

/**
 * Main handler - routes to queue worker or direct webhook
 */
Deno.serve((req: Request): Promise<Response> => {
  const url = new URL(req.url);

  // Route to queue worker if path is /process
  if (url.pathname === '/process' || url.pathname === '/process/') {
    return handleEmbeddingGenerationQueue(req);
  }

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

    // Parse webhook payload
    const parseResult = await parseJsonBody<ContentWebhookPayload>(req, {
      maxSize: 100 * 1024, // 100KB max payload
      cors: webhookCorsHeaders,
    });

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
});
