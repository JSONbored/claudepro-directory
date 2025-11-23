/**
 * Changelog Notify Route
 * Processes changelog_notify queue: Send Discord + insert notifications + invalidate cache
 */

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import {
  buildChangelogEmbed,
  type ChangelogSection,
  edgeEnv,
  errorResponse,
  fetchWithRetry,
  type GitHubCommit,
  getCacheConfigNumber,
  getCacheConfigStringArray,
  insertNotification,
  pgmqDelete,
  pgmqRead,
  revalidateChangelogPages,
  SITE_URL,
  sendDiscordWebhook,
  successResponse,
} from '@heyclaude/edge-runtime';
import {
  createNotificationRouterContext,
  errorToString,
  TIMEOUT_PRESETS,
  withTimeout,
} from '@heyclaude/shared-runtime';

const CHANGELOG_NOTIFICATIONS_QUEUE = 'changelog_notify';
const CHANGELOG_NOTIFICATIONS_BATCH_SIZE = 5;
const DISCORD_CHANGELOG_WEBHOOK_URL = edgeEnv.discord.changelog;
const REVALIDATE_SECRET = edgeEnv.revalidate.secret;

interface ChangelogReleaseJob {
  entryId: string;
  slug: string;
  title: string;
  tldr: string;
  sections: ChangelogSection[];
  commits: GitHubCommit[];
  releaseDate: string;
  metadata: unknown;
}

interface QueueMessage {
  msg_id: bigint;
  read_ct: number;
  vt: string;
  enqueued_at: string;
  message: ChangelogReleaseJob;
}

// Type guard to validate queue message structure
function isValidChangelogReleaseJob(value: unknown): value is ChangelogReleaseJob {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  // Helper to safely get property
  const getProperty = (obj: unknown, key: string): unknown => {
    if (typeof obj !== 'object' || obj === null) {
      return undefined;
    }
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    return desc?.value;
  };

  const getStringProperty = (obj: unknown, key: string): string | undefined => {
    const value = getProperty(obj, key);
    return typeof value === 'string' ? value : undefined;
  };

  const entryId = getStringProperty(value, 'entryId');
  const slug = getStringProperty(value, 'slug');
  const title = getStringProperty(value, 'title');
  const tldr = getStringProperty(value, 'tldr');
  const releaseDate = getStringProperty(value, 'releaseDate');

  if (!(entryId && slug && title && tldr && releaseDate)) {
    return false;
  }

  // Validate sections array
  const sectionsValue = getProperty(value, 'sections');
  if (!Array.isArray(sectionsValue)) {
    return false;
  }

  // Validate commits array
  const commitsValue = getProperty(value, 'commits');
  if (!Array.isArray(commitsValue)) {
    return false;
  }

  // metadata can be any value (unknown), so we just check it exists
  // No need to store it, just verify the property exists
  if (!('metadata' in value)) {
    return false;
  }

  return true;
}

async function processChangelogRelease(message: QueueMessage): Promise<{
  success: boolean;
  errors: string[];
}> {
  const { msg_id, message: changelogEntry } = message;
  const errors: string[] = [];
  let discordSuccess = false;
  let notificationSuccess = false;
  let cacheInvalidationSuccess = false;
  let revalidationSuccess = false;

  // Create structured log context (reused in all logs)
  const logContext = createNotificationRouterContext('changelog-notify', {
    entryId: changelogEntry.entryId,
    slug: changelogEntry.slug,
    attempt: message.read_ct,
  });

  const startTime = Date.now();

  console.log('[flux-station] Processing changelog release job', logContext);

  // 1. Send Discord webhook (non-critical)
  if (DISCORD_CHANGELOG_WEBHOOK_URL) {
    try {
      const embed = buildChangelogEmbed({
        slug: changelogEntry.slug,
        title: changelogEntry.title,
        tldr: changelogEntry.tldr,
        sections: changelogEntry.sections,
        commits: changelogEntry.commits,
        date: changelogEntry.releaseDate,
      });

      await sendDiscordWebhook(
        DISCORD_CHANGELOG_WEBHOOK_URL,
        {
          content: '🚀 **New Release Deployed**',
          embeds: [embed],
        },
        'changelog_notification',
        {
          relatedId: changelogEntry.entryId,
          metadata: {
            changelog_id: changelogEntry.entryId,
            slug: changelogEntry.slug,
            msg_id: msg_id.toString(),
          },
          logContext,
        }
      );

      discordSuccess = true;
      console.log('[flux-station] Discord webhook sent', {
        ...logContext,
        success: discordSuccess,
      });
    } catch (error) {
      const errorMsg = errorToString(error);
      errors.push(`Discord: ${errorMsg}`);
      console.error('[flux-station] Discord webhook failed', {
        ...logContext,
        error: errorMsg,
      });
    }
  }

  // 2. Insert notification (idempotent, critical path)
  try {
    await insertNotification(
      {
        id: changelogEntry.entryId,
        title: changelogEntry.title,
        message: changelogEntry.tldr || 'We just shipped a fresh Claude Pro Directory release.',
        type: 'announcement' satisfies DatabaseGenerated['public']['Enums']['notification_type'],
        priority: 'high',
        action_label: 'Read release notes',
        // Database constraint requires action_href to start with '/' (relative path) or be NULL
        action_href: `/changelog/${changelogEntry.slug}`,
        // Note: metadata column doesn't exist in notifications table schema
        // Removed metadata field to prevent schema cache errors
      },
      logContext
    );

    notificationSuccess = true;
    console.log('[flux-station] Notification inserted', {
      ...logContext,
      success: notificationSuccess,
    });
  } catch (error) {
    const errorMsg = errorToString(error);
    errors.push(`Notification: ${errorMsg}`);
    console.error('[flux-station] Notification insert failed', {
      ...logContext,
      error: errorMsg,
    });
  }

  // 3. Invalidate cache tags (non-critical, after notification insert)
  if (notificationSuccess) {
    // Fetch tags from Statsig (with fallback to default)
    const cacheTags = getCacheConfigStringArray(
      'cache.invalidate.changelog',
      ['changelog'] // Fallback default
    );

    if (REVALIDATE_SECRET && cacheTags.length > 0) {
      const revalidateUrl = `${SITE_URL}/api/revalidate`;
      try {
        // Wrap cache invalidation with timeout and retry
        const { response } = await withTimeout(
          fetchWithRetry({
            url: revalidateUrl,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              secret: REVALIDATE_SECRET,
              category: 'changelog',
              slug: changelogEntry.slug,
              tags: cacheTags,
            }),
            retry: {
              attempts: 2,
              baseDelayMs: 500,
              retryOn: [500, 502, 503, 504],
              noRetryOn: [400, 401, 403, 404],
            },
            logContext,
          }),
          TIMEOUT_PRESETS.external,
          'Cache invalidation timed out'
        );

        if (response.ok) {
          cacheInvalidationSuccess = true;
          console.log('[flux-station] Cache tags invalidated', {
            ...logContext,
            success: cacheInvalidationSuccess,
            tags: cacheTags,
          });
        } else {
          const errorText = await response.text();
          console.warn('[flux-station] Cache invalidation failed', {
            ...logContext,
            status: response.status,
            error: errorText,
            tags: cacheTags,
          });
          errors.push(`Cache invalidation: ${response.status} ${errorText}`);
        }
      } catch (error) {
        const errorMsg = errorToString(error);
        console.warn('[flux-station] Cache invalidation error', {
          ...logContext,
          error: errorMsg,
          tags: cacheTags,
        });
        errors.push(`Cache invalidation: ${errorMsg}`);
        // Non-critical, don't fail the job
      }
    } else if (!REVALIDATE_SECRET) {
      console.warn('[flux-station] Cache invalidation skipped (no secret)', logContext);
    }
  }

  // 4. Revalidate Next.js pages (non-critical)
  try {
    await revalidateChangelogPages(changelogEntry.slug, {
      invalidateTags: true,
    });
    revalidationSuccess = true;
    console.log('[flux-station] Pages revalidated', {
      ...logContext,
      success: revalidationSuccess,
    });
  } catch (error) {
    const errorMsg = errorToString(error);
    errors.push(`Revalidation: ${errorMsg}`);
    console.warn('[flux-station] Revalidation failed', {
      ...logContext,
      error: errorMsg,
    });
  }

  // 5. Log completion (success/partial)
  if (notificationSuccess) {
    const durationMs = Date.now() - startTime;
    if (errors.length === 0) {
      console.log('[flux-station] Changelog release completed successfully', {
        ...logContext,
        duration_ms: durationMs,
        discordSuccess,
        notificationSuccess,
        cacheInvalidationSuccess,
        revalidationSuccess,
      });
    } else {
      console.warn('[flux-station] Changelog release completed with partial errors', {
        ...logContext,
        duration_ms: durationMs,
        errors,
        discordSuccess,
        notificationSuccess,
        cacheInvalidationSuccess,
        revalidationSuccess,
      });
    }
  }

  // Success if notification inserted (most critical)
  const success = notificationSuccess || errors.length === 0;
  const durationMs = Date.now() - startTime;

  console.log('[flux-station] Changelog release job completed', {
    ...logContext,
    success,
    errors: errors.length > 0 ? errors : undefined,
    discordSuccess,
    notificationSuccess,
    cacheInvalidationSuccess,
    revalidationSuccess,
    duration_ms: durationMs,
  });

  return { success, errors };
}

async function deleteQueueMessage(msgId: bigint): Promise<void> {
  try {
    await pgmqDelete(CHANGELOG_NOTIFICATIONS_QUEUE, msgId);
  } catch (error) {
    console.error('[flux-station] Failed to delete queue message', {
      msg_id: msgId.toString(),
      error: errorToString(error),
    });
    // Don't throw - message will remain in queue for retry
  }
}

export async function handleChangelogNotify(_req: Request): Promise<Response> {
  try {
    const batchSize = getCacheConfigNumber(
      'queue.changelog_notify.batch_size',
      CHANGELOG_NOTIFICATIONS_BATCH_SIZE
    );
    // Read messages from queue (with timeout protection)
    const messages = await withTimeout(
      pgmqRead(CHANGELOG_NOTIFICATIONS_QUEUE, {
        sleep_seconds: 0,
        n: batchSize,
      }),
      TIMEOUT_PRESETS.rpc,
      'Changelog notify queue read timed out'
    );
    const readError = messages === null ? new Error('Failed to read queue messages') : null;

    if (readError) {
      console.error('[flux-station] Queue read error', {
        error: readError.message,
      });
      return errorResponse(
        new Error(`Failed to read queue: ${readError.message}`),
        'flux-station:changelog-notify-read'
      );
    }

    if (!messages || messages.length === 0) {
      return successResponse({ message: 'No messages in queue', processed: 0 }, 200);
    }

    console.log(`[flux-station] Processing ${messages.length} changelog release jobs`);

    const results: Array<{
      msg_id: string;
      status: 'success' | 'failed';
      errors: string[];
      will_retry?: boolean;
    }> = [];

    // Process each message
    for (const msg of messages || []) {
      // Validate queue message structure
      if (!isValidChangelogReleaseJob(msg.message)) {
        console.error('[flux-station] Invalid changelog release job structure', {
          msg_id: msg.msg_id.toString(),
        });

        // Delete invalid message to prevent infinite retries
        try {
          await pgmqDelete(CHANGELOG_NOTIFICATIONS_QUEUE, msg.msg_id);
        } catch (error) {
          console.error('[flux-station] Failed to delete invalid message', {
            msg_id: msg.msg_id.toString(),
            error: errorToString(error),
          });
        }

        results.push({
          msg_id: msg.msg_id.toString(),
          status: 'failed',
          errors: ['Invalid message structure'],
          will_retry: false, // Don't retry invalid messages
        });
        continue;
      }

      const message: QueueMessage = {
        msg_id: msg.msg_id,
        read_ct: msg.read_ct,
        vt: msg.vt,
        enqueued_at: msg.enqueued_at,
        message: msg.message,
      };
      try {
        const result = await processChangelogRelease(message);

        if (result.success) {
          await deleteQueueMessage(message.msg_id);
          results.push({
            msg_id: message.msg_id.toString(),
            status: 'success',
            errors: result.errors,
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
      } catch (error) {
        const errorMsg = errorToString(error);
        console.error('[flux-station] Unexpected error processing message', {
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
    console.error('[flux-station] Fatal queue processing error', {
      error: errorToString(error),
    });
    return errorResponse(error, 'flux-station:changelog-notify-fatal');
  }
}
