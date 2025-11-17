/**
 * Generate Embedding Edge Function
 * Database webhook handler for generating content embeddings
 *
 * Triggered by: Database webhook on content table INSERT/UPDATE
 * Purpose: Generate vector embeddings for semantic search
 *
 * Flow:
 * 1. Receive webhook payload (content row)
 * 2. Extract text fields (title, description, tags, author)
 * 3. Concatenate into searchable text
 * 4. Generate embedding using gte-small model (with circuit breaker + timeout)
 * 5. Store in content_embeddings table (with circuit breaker + timeout)
 * 6. Return success (webhook expects 200 response)
 */

import type { Database as DatabaseGenerated } from '../_shared/database.types.ts';
import { upsertTable } from '../_shared/database-overrides.ts';
import { CIRCUIT_BREAKER_CONFIGS, withCircuitBreaker } from '../_shared/utils/circuit-breaker.ts';
// Static imports to ensure circuit-breaker and timeout utilities are included in the bundle
// These are lazily imported in callRpc, but we need static imports for Supabase bundling
import '../_shared/utils/circuit-breaker.ts';
import '../_shared/utils/timeout.ts';
import {
  badRequestResponse,
  errorResponse,
  successResponse,
  webhookCorsHeaders,
} from '../_shared/utils/http.ts';
import { createUtilityContext, logError, logInfo, withDuration } from '../_shared/utils/logging.ts';
import { parseJsonBody } from '../_shared/utils/parse-json-body.ts';
import { buildSecurityHeaders } from '../_shared/utils/security-headers.ts';
import { TIMEOUT_PRESETS, withTimeout } from '../_shared/utils/timeout.ts';

// Webhook payload structure from Supabase database webhooks
interface ContentWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: {
    id: string;
    title: string | null;
    description: string;
    content: string | null;
    tags: string[];
    author: string;
    category: string;
    // ... other fields
  };
  old_record?: {
    id: string;
    // ... other fields
  } | null;
  schema: string;
}

/**
 * Build searchable text from content fields
 * Combines title, description, tags, and author for embedding generation
 */
function buildSearchableText(record: ContentWebhookPayload['record']): string {
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
    const embedding = await model.run(text, {
      mean_pool: true, // Use mean pooling for better quality
      normalize: true, // Normalize for inner product similarity
    });

    return embedding as number[];
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
    const result = upsertTable('content_embeddings', insertData);
    const { error } = await result;

    if (error) {
      throw new Error(
        `Failed to store embedding: ${error instanceof Error ? error.message : String(error)}`
      );
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
    const errorData = error
      ? { error: error instanceof Error ? error.message : String(error) }
      : {};
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

/**
 * Main webhook handler
 */
Deno.serve(async (req: Request): Promise<Response> => {
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
