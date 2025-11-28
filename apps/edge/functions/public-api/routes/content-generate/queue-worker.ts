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
import {
  errorResponse,
  initRequestLogging,
  pgmqDelete,
  pgmqRead,
  successResponse,
  supabaseServiceRole,
  traceRequestComplete,
  traceStep,
} from '@heyclaude/edge-runtime';
import {
  createUtilityContext,
  errorToString,
  logError,
  logInfo,
  TIMEOUT_PRESETS,
  withTimeout,
} from '@heyclaude/shared-runtime';
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
 * Process a single package generation job from a queue message.
 *
 * Fetches the content row, locates the generator for the message's category,
 * validates that the content can be generated, executes generation (generate → upload → update DB),
 * and logs outcomes.
 *
 * @param message - The queue message containing `content_id`, `category`, `slug`, and metadata
 * @param logContext - Optional structured logging context used for enriched logs
 * @returns An object with `success` indicating overall outcome and `errors` containing human-readable error messages
 */
async function processPackageGeneration(
  message: PackageGenerationQueueMessage,
  logContext?: Record<string, unknown>
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
      // Use dbQuery serializer for consistent database query formatting
      if (logContext) {
        await logError('Failed to fetch content for package generation', {
          ...logContext,
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

    if (logContext) {
      logInfo('Package generated successfully', {
        ...logContext,
        content_id,
        category,
        slug,
      });
    }

    return { success: true, errors: [] };
  } catch (error) {
    const errorMsg = errorToString(error);
    errors.push(`Generation failed: ${errorMsg}`);
    if (logContext) {
      await logError(
        'Package generation error',
        {
          ...logContext,
          content_id,
          category,
          slug,
        },
        error
      );
    }
    return { success: false, errors };
  }
}

/**
 * Process a batch of package generation queue messages and return a summary response.
 *
 * Processes up to QUEUE_BATCH_SIZE messages from the package_generation queue, validates each message,
 * invokes package generation for valid messages, deletes messages that succeeded or are structurally invalid,
 * and leaves failed messages for automatic retry via the queue visibility timeout.
 *
 * @param _req - Incoming HTTP request (unused; present for route handler compatibility)
 * @param logContext - Optional logging context to attach to structured logs and traces
 * @returns A Response containing a summary object with `processed` (number) and `results` (per-message status, errors, and optional `will_retry`) or an error response on fatal failure
 */
export async function handlePackageGenerationQueue(
  _req: Request,
  logContext?: Record<string, unknown>
): Promise<Response> {
  // Create log context if not provided
  const finalLogContext = logContext || createUtilityContext('content-generate', 'package-generation-queue', {});
  
  // Initialize request logging with trace and bindings
  initRequestLogging(finalLogContext);
  traceStep('Starting package generation queue processing', finalLogContext);
  
  try {
    // Read messages with timeout protection
    traceStep('Reading package generation queue', finalLogContext);
    const messages = await withTimeout(
      pgmqRead(PACKAGE_GENERATION_QUEUE, {
        sleep_seconds: 0,
        n: QUEUE_BATCH_SIZE,
      }),
      TIMEOUT_PRESETS.rpc,
      'Package generation queue read timed out'
    );

    if (!messages || messages.length === 0) {
      traceRequestComplete(finalLogContext);
      return successResponse({ message: 'No messages in queue', processed: 0 }, 200);
    }

    logInfo(`Processing ${messages.length} package generation jobs`, finalLogContext);
    traceStep(`Processing ${messages.length} package generation jobs`, finalLogContext);

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

    /**
     * Checks whether a raw queue message contains required string fields and a valid content category.
     *
     * @param msg - Raw queue message to validate
     * @returns `true` if `msg` is an object with string `content_id`, `slug`, and `created_at`, and a `category` equal to an allowed content category; `false` otherwise.
     */
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
        await logError('Invalid queue message structure', {
          ...finalLogContext,
          msg_id: msg.msg_id.toString(),
        });

        // Delete invalid message to prevent infinite retries
        try {
          await pgmqDelete(PACKAGE_GENERATION_QUEUE, msg.msg_id);
        } catch (error) {
          await logError(
            'Failed to delete invalid message',
            {
              ...finalLogContext,
              msg_id: msg.msg_id.toString(),
            },
            error
          );
        }

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
        const result = await processPackageGeneration(message, finalLogContext);

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
        await logError(
          'Unexpected error processing package generation',
          {
            ...finalLogContext,
            msg_id: message.msg_id.toString(),
          },
          error
        );
        results.push({
          msg_id: message.msg_id.toString(),
          status: 'failed',
          errors: [errorMsg],
          will_retry: true,
        });
      }
    }

    logInfo('Package generation queue processing complete', {
      ...finalLogContext,
      processed: messages.length,
      successCount: results.filter((r) => r.status === 'success').length,
      failedCount: results.filter((r) => r.status === 'failed').length,
    });
    traceRequestComplete(finalLogContext);

    return successResponse(
      {
        message: `Processed ${messages.length} messages`,
        processed: messages.length,
        results,
      },
      200
    );
  } catch (error) {
    await logError('Fatal package generation queue error', finalLogContext, error);
    return await errorResponse(error, 'data-api:package-generation-queue-fatal', undefined, finalLogContext);
  }
}