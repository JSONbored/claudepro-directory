/**
 * Package Generation Queue Worker
 * Processes package_generation queue: Generate Skills ZIP and MCP .mcpb packages
 *
 * Flow:
 * 1. Read batch from package_generation queue
 * 2. For each message: Fetch content → Generate package → Upload to storage → Update DB
 * 3. Delete message on success, leave in queue for retry on failure
 *
 * Route: POST /content/generate-package/process
 */

import { supabaseServiceRole } from '../../../_shared/clients/supabase.ts';
import type { Database as DatabaseGenerated } from '../../../_shared/database.types.ts';

type ContentCategory = DatabaseGenerated['public']['Enums']['content_category'];

import { errorToString } from '../../../_shared/utils/error-handling.ts';
import { errorResponse, successResponse } from '../../../_shared/utils/http.ts';
import { pgmqDelete, pgmqRead } from '../../../_shared/utils/pgmq-client.ts';
import { TIMEOUT_PRESETS, withTimeout } from '../../../_shared/utils/timeout.ts';
import { getGenerator } from './registry.ts';
import type { ContentRow } from './types.ts';

const PACKAGE_GENERATION_QUEUE = 'package_generation';
const QUEUE_BATCH_SIZE = 5; // Smaller batch size for expensive operations

interface PackageGenerationQueueMessage {
  msg_id: bigint;
  read_ct: number;
  vt: string;
  enqueued_at: string;
  message: {
    content_id: string;
    category: ContentCategory;
    slug: string;
    created_at: string;
  };
}

/**
 * Process a single package generation job
 */
async function processPackageGeneration(
  message: PackageGenerationQueueMessage
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  const { content_id, category, slug } = message.message;

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

    // Type assertion: content is guaranteed to be non-null after the check above
    // Use explicit ContentRow type to avoid type narrowing issues
    const contentRow = content as ContentRow;

    // Get generator for category
    const generator = getGenerator(category);
    if (!generator) {
      errors.push(`Generator not found for category '${category}'`);
      return { success: false, errors };
    }

    // Validate content can be generated
    if (!generator.canGenerate(contentRow as ContentRow)) {
      errors.push(
        `Content '${content_id}' cannot be generated. Missing required fields or invalid category.`
      );
      return { success: false, errors };
    }

    // Generate package (this does: generate → upload → update DB)
    await generator.generate(contentRow as ContentRow);

    console.log('[data-api] Package generated successfully', {
      content_id,
      category,
      slug,
    });

    return { success: true, errors: [] };
  } catch (error) {
    const errorMsg = errorToString(error);
    errors.push(`Generation failed: ${errorMsg}`);
    console.error('[data-api] Package generation error', {
      content_id,
      category,
      slug,
      error: errorMsg,
    });
    return { success: false, errors };
  }
}

/**
 * Main queue worker handler
 * POST /content/generate-package/process
 */
export async function handlePackageGenerationQueue(_req: Request): Promise<Response> {
  try {
    // Read messages with timeout protection
    const messages = await withTimeout(
      pgmqRead(PACKAGE_GENERATION_QUEUE, {
        sleep_seconds: 0,
        n: QUEUE_BATCH_SIZE,
      }),
      TIMEOUT_PRESETS.rpc,
      'Package generation queue read timed out'
    );

    if (!messages || messages.length === 0) {
      return successResponse({ message: 'No messages in queue', processed: 0 }, 200);
    }

    console.log(`[data-api] Processing ${messages.length} package generation jobs`);

    const results: Array<{
      msg_id: string;
      status: 'success' | 'failed';
      errors: string[];
      will_retry?: boolean;
    }> = [];

    for (const msg of messages) {
      const message: PackageGenerationQueueMessage = {
        msg_id: msg.msg_id,
        read_ct: msg.read_ct,
        vt: msg.vt,
        enqueued_at: msg.enqueued_at,
        message: msg.message as PackageGenerationQueueMessage['message'],
      };

      try {
        const result = await processPackageGeneration(message);

        if (result.success) {
          await pgmqDelete(PACKAGE_GENERATION_QUEUE, message.msg_id);
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
        console.error('[data-api] Unexpected error processing package generation', {
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
    console.error('[data-api] Fatal package generation queue error', {
      error: errorToString(error),
    });
    return errorResponse(error, 'data-api:package-generation-queue-fatal');
  }
}
