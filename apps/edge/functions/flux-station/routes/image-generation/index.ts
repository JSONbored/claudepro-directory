/**
 * Image Generation Queue Worker
 * Processes image_generation queue: Generate content cards, thumbnails, and optimize logos
 *
 * Flow:
 * 1. Read batch from image_generation queue
 * 2. For each message: Route to appropriate handler (card/thumbnail/logo)
 * 3. Call edge function API internally
 * 4. Delete message on success, leave in queue for retry on failure
 *
 * Route: POST /image-generation/process
 */

import { edgeEnv, initRequestLogging, pgmqDelete, pgmqRead, traceRequestComplete, traceStep } from '@heyclaude/edge-runtime';
import type { BaseLogContext } from '@heyclaude/shared-runtime';
import {
  createUtilityContext,
  errorToString,
  logError,
  logInfo,
  TIMEOUT_PRESETS,
  withTimeout,
} from '@heyclaude/shared-runtime';

const IMAGE_GENERATION_QUEUE = 'image_generation';
const QUEUE_BATCH_SIZE = 5; // Process 5 messages at a time
const MAX_RETRY_ATTEMPTS = 5; // Maximum number of retry attempts before giving up

/**
 * Image generation queue message format
 */
interface ImageGenerationMessage {
  type: 'card' | 'thumbnail' | 'logo';
  content_id?: string;
  company_id?: string;
  image_url?: string;
  image_data?: string; // base64 for thumbnails/logos
  params?: {
    // For cards
    title?: string;
    description?: string;
    category?: string;
    slug?: string;
    author?: string;
    tags?: string[];
    featured?: boolean;
    rating?: number | null;
    viewCount?: number;
  };
  priority: 'high' | 'normal' | 'low';
  created_at: string;
}

/**
 * Process a single image generation job
 */
async function processImageGeneration(
  message: ImageGenerationMessage,
  logContext: BaseLogContext
): Promise<{ success: boolean; error?: string }> {
  const { type, content_id, company_id, params } = message;

  try {
    const apiUrl = edgeEnv.supabase.url;
    const serviceRoleKey = edgeEnv.supabase.serviceRoleKey;

    if (!apiUrl || !serviceRoleKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    let endpoint: string;
    let requestBody: Record<string, unknown>;

    if (type === 'card') {
      endpoint = `${apiUrl}/functions/v1/public-api/transform/image/card`;
      requestBody = {
        params: {
          title: params?.title ?? '',
          description: params?.description ?? '',
          category: params?.category ?? '',
          tags: params?.tags ?? [],
          author: params?.author ?? '',
          featured: params?.featured ?? false,
          rating: params?.rating ?? null,
          viewCount: params?.viewCount ?? 0,
        },
        contentId: content_id,
        userId: 'system', // System-generated
        saveToStorage: true,
      };
    } else if (type === 'thumbnail') {
      endpoint = `${apiUrl}/functions/v1/public-api/transform/image/thumbnail`;
      requestBody = {
        imageData: message.image_data,
        userId: 'system',
        contentId: content_id,
        useSlug: false,
        saveToStorage: true,
      };
    } else if (type === 'logo') {
      endpoint = `${apiUrl}/functions/v1/public-api/transform/image/logo`;
      requestBody = {
        imageData: message.image_data,
        userId: 'system',
        companyId: company_id,
        saveToStorage: true,
      };
    } else {
      throw new Error(`Unknown image generation type: ${type}`);
    }

    logInfo(`Calling image generation API: ${type}`, {
      ...logContext,
      type,
      content_id,
      company_id,
      endpoint,
    });

    // Use external timeout (10s) with additional buffer for image processing
    // Image generation can take longer, so we use 30s (same as RPC timeout)
    const response = await withTimeout(
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify(requestBody),
      }),
      TIMEOUT_PRESETS.rpc, // 30 seconds - image processing can be slow
      `Image generation API call timed out (${type})`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Image generation failed (${response.status}): ${errorText}`);
    }

    // Parse JSON response, with fallback for non-JSON responses (e.g., HTML error pages)
    // Clone response before parsing so we can read the body as text if JSON parsing fails
    const responseClone = response.clone();
    let result: { success?: boolean; error?: string; publicUrl?: string };
    try {
      result = await response.json();
    } catch (parseError) {
      // If JSON parsing fails, read the raw body from the cloned response for better error reporting
      const rawBody = await responseClone.text().catch(() => 'Unable to read response body');
      throw new Error(
        `Image generation API returned non-JSON response (${response.status} ${response.statusText}): ${rawBody}`
      );
    }

    if (!result.success) {
      throw new Error(result.error || 'Image generation failed');
    }

    logInfo(`Image generation successful: ${type}`, {
      ...logContext,
      type,
      content_id,
      company_id,
      publicUrl: result.publicUrl,
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`Image generation error (${type})`, logContext, error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Main queue worker handler
 */
export async function handleImageGenerationQueue(_req: Request): Promise<Response> {
  const logContext = createUtilityContext('image-generation', 'queue-processor', {});
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Starting image generation queue processing', logContext);
  
  try {
    // Read messages with timeout protection
    traceStep('Reading image generation queue', logContext);
    const messages = await withTimeout(
      pgmqRead(IMAGE_GENERATION_QUEUE, {
        sleep_seconds: 0,
        n: QUEUE_BATCH_SIZE,
      }),
      TIMEOUT_PRESETS.rpc,
      'Image generation queue read timed out'
    );

    if (!messages || messages.length === 0) {
      traceRequestComplete(logContext);
      return new Response(
        JSON.stringify({ message: 'No messages in queue', processed: 0 }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    logInfo(`Processing ${messages.length} image generation jobs`, {
      ...logContext,
      count: messages.length,
    });
    traceStep(`Processing ${messages.length} image generation jobs`, logContext);

    const results: Array<{
      msg_id: string;
      status: 'success' | 'failed';
      error?: string;
    }> = [];

    for (const msg of messages) {
      const queueMessage = msg.message as unknown as ImageGenerationMessage;

      // Validate message structure
      if (!queueMessage.type || !['card', 'thumbnail', 'logo'].includes(queueMessage.type)) {
        const errorLogContext = createUtilityContext('image-generation', 'invalid-message');
        logError(
          'Invalid queue message format',
          {
            ...errorLogContext,
            msg_id: msg.msg_id.toString(),
          },
          new Error(`Invalid message type: ${JSON.stringify(queueMessage)}`)
        );

        // Delete invalid message to prevent infinite retry loop
        try {
          await pgmqDelete(IMAGE_GENERATION_QUEUE, msg.msg_id);
          logInfo('Deleted invalid message', {
            ...errorLogContext,
            msg_id: msg.msg_id.toString(),
          });
        } catch (deleteError) {
          logError(
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
          error: 'Invalid queue message format',
        });
        continue;
      }

      // Validate type-specific required fields
      if (queueMessage.type === 'card' && (!queueMessage.params?.title || !queueMessage.params.title.trim())) {
        const errorLogContext = createUtilityContext('image-generation', 'invalid-message');
        logError(
          'Card generation message missing required title',
          {
            ...errorLogContext,
            msg_id: msg.msg_id.toString(),
            content_id: queueMessage.content_id,
          },
          new Error('Card generation requires params.title')
        );

        // Delete invalid message (card generation cannot proceed without title)
        try {
          await pgmqDelete(IMAGE_GENERATION_QUEUE, msg.msg_id);
          logInfo('Deleted invalid card message (missing title)', {
            ...errorLogContext,
            msg_id: msg.msg_id.toString(),
          });
        } catch (deleteError) {
          logError(
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
          error: 'Card generation requires params.title',
        });
        continue;
      }

      // Validate thumbnail has image_data
      if (queueMessage.type === 'thumbnail' && !queueMessage.image_data) {
        const errorLogContext = createUtilityContext('image-generation', 'invalid-message');
        logError(
          'Thumbnail generation message missing required image_data',
          {
            ...errorLogContext,
            msg_id: msg.msg_id.toString(),
            content_id: queueMessage.content_id,
          },
          new Error('Thumbnail generation requires image_data')
        );

        // Delete invalid message (thumbnail generation cannot proceed without image_data)
        try {
          await pgmqDelete(IMAGE_GENERATION_QUEUE, msg.msg_id);
          logInfo('Deleted invalid thumbnail message (missing image_data)', {
            ...errorLogContext,
            msg_id: msg.msg_id.toString(),
          });
        } catch (deleteError) {
          logError(
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
          error: 'Thumbnail generation requires image_data',
        });
        continue;
      }

      // Validate logo has image_data and company_id
      if (queueMessage.type === 'logo' && (!queueMessage.image_data || !queueMessage.company_id)) {
        const errorLogContext = createUtilityContext('image-generation', 'invalid-message');
        logError(
          'Logo generation message missing required fields',
          {
            ...errorLogContext,
            msg_id: msg.msg_id.toString(),
            company_id: queueMessage.company_id,
            has_image_data: !!queueMessage.image_data,
          },
          new Error('Logo generation requires image_data and company_id')
        );

        // Delete invalid message (logo generation cannot proceed without image_data and company_id)
        try {
          await pgmqDelete(IMAGE_GENERATION_QUEUE, msg.msg_id);
          logInfo('Deleted invalid logo message (missing required fields)', {
            ...errorLogContext,
            msg_id: msg.msg_id.toString(),
          });
        } catch (deleteError) {
          logError(
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
          error: 'Logo generation requires image_data and company_id',
        });
        continue;
      }

      const message: ImageGenerationMessage = {
        type: queueMessage.type,
        ...(queueMessage.content_id ? { content_id: queueMessage.content_id } : {}),
        ...(queueMessage.company_id ? { company_id: queueMessage.company_id } : {}),
        ...(queueMessage.image_url ? { image_url: queueMessage.image_url } : {}),
        ...(queueMessage.image_data ? { image_data: queueMessage.image_data } : {}),
        ...(queueMessage.params ? { params: queueMessage.params } : {}),
        priority: queueMessage.priority ?? 'normal',
        created_at: queueMessage.created_at ?? new Date().toISOString(),
      };

      const attempts = Number(msg.read_ct ?? 0) + 1;
      logInfo('Processing image generation message', {
        ...logContext,
        msg_id: msg.msg_id.toString(),
        type: message.type,
        content_id: message.content_id,
        company_id: message.company_id,
        attempt: attempts,
      });

      try {
        const result = await processImageGeneration(message, logContext);

        if (result.success) {
          await pgmqDelete(IMAGE_GENERATION_QUEUE, msg.msg_id);
          results.push({
            msg_id: msg.msg_id.toString(),
            status: 'success',
          });
        } else {
          // Check if message has exceeded maximum retry attempts
          if (attempts >= MAX_RETRY_ATTEMPTS) {
            logError('Message exceeded max retry attempts, removing from queue', {
              ...logContext,
              msg_id: msg.msg_id.toString(),
              attempts,
              max_attempts: MAX_RETRY_ATTEMPTS,
              error: result.error,
            });
            // Delete message to prevent infinite retry loop
            // Optionally: could move to dead-letter queue for investigation
            try {
              await pgmqDelete(IMAGE_GENERATION_QUEUE, msg.msg_id);
              logInfo('Deleted message after exceeding max retry attempts', {
                ...logContext,
                msg_id: msg.msg_id.toString(),
                attempts,
              });
            } catch (deleteError) {
              logError(
                'Failed to delete message after max retries',
                {
                  ...logContext,
                  msg_id: msg.msg_id.toString(),
                },
                deleteError
              );
            }
            results.push({
              msg_id: msg.msg_id.toString(),
              status: 'failed',
              error: `Max retry attempts (${MAX_RETRY_ATTEMPTS}) exceeded: ${result.error || 'Unknown error'}`,
            });
          } else {
            // Leave in queue for retry (visibility timeout will handle retry)
            results.push({
              msg_id: msg.msg_id.toString(),
              status: 'failed',
              ...(result.error ? { error: result.error } : {}),
            });
          }
        }
      } catch (error) {
        logError('Unexpected error processing image generation', logContext, error);
        // Leave in queue for retry
        results.push({
          msg_id: msg.msg_id.toString(),
          status: 'failed',
          error: errorToString(error),
        });
      }
    }

    const successCount = results.filter((r) => r.status === 'success').length;
    const failedCount = results.filter((r) => r.status === 'failed').length;

    logInfo('Image generation queue processing complete', {
      ...logContext,
      total: messages.length,
      success: successCount,
      failed: failedCount,
    });
    traceRequestComplete(logContext);

    return new Response(
      JSON.stringify({
        processed: successCount,
        total: messages.length,
        success: successCount,
        failed: failedCount,
        results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // Log full error details server-side for troubleshooting
    logError('Image generation queue worker error', logContext, error);
    // Never expose internal error details to users - always use generic message
    return new Response(
      JSON.stringify({
        error: 'An unexpected error occurred',
        processed: 0,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
