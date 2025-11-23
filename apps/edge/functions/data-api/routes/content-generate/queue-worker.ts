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

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { supabaseServiceRole } from '@heyclaude/edge-runtime/clients/supabase.ts';
import { errorResponse, successResponse } from '@heyclaude/edge-runtime/utils/http.ts';
import { pgmqDelete, pgmqRead } from '@heyclaude/edge-runtime/utils/pgmq-client.ts';
import { errorToString, TIMEOUT_PRESETS, withTimeout } from '@heyclaude/shared-runtime';
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
    category: DatabaseGenerated['public']['Enums']['content_category'];
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

    // Content is guaranteed to be non-null after the check above
    // Use satisfies to ensure type correctness without assertion
    const contentRow = content satisfies ContentRow;

    // Get generator for category
    const generator = getGenerator(category);
    if (!generator) {
      errors.push(`Generator not found for category '${category}'`);
      return { success: false, errors };
    }

    // Validate content can be generated
    if (!generator.canGenerate(contentRow)) {
      errors.push(
        `Content '${content_id}' cannot be generated. Missing required fields or invalid category.`
      );
      return { success: false, errors };
    }

    // Generate package (this does: generate → upload → update DB)
    await generator.generate(contentRow);

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

    // Safely extract properties from queue message
    const getStringProperty = (obj: unknown, key: string): string | undefined => {
      if (typeof obj !== 'object' || obj === null) {
        return undefined;
      }
      const desc = Object.getOwnPropertyDescriptor(obj, key);
      if (desc && typeof desc.value === 'string') {
        return desc.value;
      }
      return undefined;
    };

    function isValidQueueMessage(msg: unknown): msg is {
      content_id: string;
      category: DatabaseGenerated['public']['Enums']['content_category'];
      slug: string;
      created_at: string;
    } {
      if (typeof msg !== 'object' || msg === null) {
        return false;
      }
      const contentId = getStringProperty(msg, 'content_id');
      const slug = getStringProperty(msg, 'slug');
      const createdAt = getStringProperty(msg, 'created_at');
      const category = getStringProperty(msg, 'category');

      if (!(contentId && slug && createdAt && category)) {
        return false;
      }

      // Validate category enum - use enum values directly from @heyclaude/database-types Constants
      const validCategories = Constants.public.Enums.content_category;
      for (const validCategory of validCategories) {
        if (category === validCategory) {
          return true;
        }
      }
      return false;
    }

    for (const msg of messages) {
      // Validate message structure
      if (!isValidQueueMessage(msg.message)) {
        console.error('[data-api] Invalid queue message structure', {
          msg_id: msg.msg_id.toString(),
        });
        results.push({
          msg_id: msg.msg_id.toString(),
          status: 'failed',
          errors: ['Invalid message structure'],
          will_retry: false, // Don't retry invalid messages
        });
        continue;
      }

      const message: PackageGenerationQueueMessage = {
        msg_id: msg.msg_id,
        read_ct: msg.read_ct,
        vt: msg.vt,
        enqueued_at: msg.enqueued_at,
        message: msg.message,
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
