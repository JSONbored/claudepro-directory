/**
 * Weekly Digest Email Inngest Function
 *
 * Sends weekly digest emails to all subscribers with:
 * - New content from the previous week
 * - Trending content
 *
 * Runs on a cron schedule (Mondays at 9am UTC)
 */

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { normalizeError } from '@heyclaude/shared-runtime';

import { inngest } from '../../client';
import { createSupabaseAdminClient } from '../../../supabase/admin';
import { getResendClient } from '../../../integrations/resend';
import { HELLO_FROM } from '../../../email/config/email-config';
import { logger, createWebAppContextWithId } from '../../../logging/server';

// Types for digest data
type WeeklyDigestData = DatabaseGenerated['public']['Functions']['get_weekly_digest']['Returns'];

/**
 * Weekly digest email function
 *
 * Cron schedule: Every Monday at 9:00 AM UTC
 * - Fetches digest content for the previous week
 * - Checks rate limiting to prevent duplicate sends
 * - Sends batch emails to all active subscribers
 */
export const sendWeeklyDigest = inngest.createFunction(
  {
    id: 'email-weekly-digest',
    name: 'Weekly Digest Email',
    retries: 1, // Limited retries for cron jobs
  },
  { cron: '0 9 * * 1' }, // Every Monday at 9:00 AM UTC
  async ({ step }) => {
    const startTime = Date.now();
    const logContext = createWebAppContextWithId('/inngest/email/digest', 'sendWeeklyDigest');

    logger.info(logContext, 'Weekly digest started');

    const supabase = createSupabaseAdminClient();

    // Step 1: Check rate limiting
    const rateLimitCheck = await step.run('check-rate-limit', async (): Promise<{
      rateLimited: boolean;
      hoursSinceLastRun?: number;
      nextAllowedAt?: string;
    }> => {
      const { data: lastRunData } = await supabase
        .from('app_settings')
        .select('setting_value, updated_at')
        .eq('setting_key', 'last_digest_email_timestamp')
        .single();

      if (lastRunData?.setting_value) {
        const lastRunTimestamp = new Date(lastRunData.setting_value as string);
        const hoursSinceLastRun = (Date.now() - lastRunTimestamp.getTime()) / (1000 * 60 * 60);

        if (hoursSinceLastRun < 24) {
          const nextAllowedAt = new Date(lastRunTimestamp.getTime() + 24 * 60 * 60 * 1000);
          return {
            rateLimited: true,
            hoursSinceLastRun,
            nextAllowedAt: nextAllowedAt.toISOString(),
          };
        }
      }

      return { rateLimited: false };
    });

    if (rateLimitCheck.rateLimited) {
      logger.info({ ...logContext,
        hoursSinceLastRun: rateLimitCheck.hoursSinceLastRun?.toFixed(1),
        nextAllowedAt: rateLimitCheck.nextAllowedAt, }, 'Digest rate limited');
      return {
        skipped: true,
        reason: 'rate_limited',
        hoursSinceLastRun: Math.round((rateLimitCheck.hoursSinceLastRun ?? 0) * 10) / 10,
        nextAllowedAt: rateLimitCheck.nextAllowedAt,
      };
    }

    // Step 2: Fetch digest content
    const digestData = await step.run('fetch-digest-content', async (): Promise<WeeklyDigestData | null> => {
      const previousWeekStart = getPreviousWeekStart();
      
      const { data: digest, error: digestError } = await supabase.rpc('get_weekly_digest', {
        p_week_start: previousWeekStart,
      });

      if (digestError) {
        logger.warn({ ...logContext,
          errorMessage: digestError.message, }, 'Failed to fetch weekly digest');
        return null;
      }

      return digest;
    });

    if (!digestData) {
      return { skipped: true, reason: 'invalid_data' };
    }

    const hasNewContent = Array.isArray(digestData.new_content) && digestData.new_content.length > 0;
    const hasTrendingContent = Array.isArray(digestData.trending_content) && digestData.trending_content.length > 0;

    if (!(hasNewContent || hasTrendingContent)) {
      logger.info(logContext, 'Digest skipped - no content');
      return { skipped: true, reason: 'no_content' };
    }

    // Step 3: Fetch subscribers
    const subscribers = await step.run('fetch-subscribers', async (): Promise<string[]> => {
      const { data, error } = await supabase.rpc('get_active_subscribers');

      if (error) {
        logger.warn({ ...logContext,
          errorMessage: error.message, }, 'Failed to fetch subscribers');
        return [];
      }

      return data || [];
    });

    if (subscribers.length === 0) {
      logger.info(logContext, 'Digest skipped - no subscribers');
      return { skipped: true, reason: 'no_subscribers' };
    }

    logger.info({ ...logContext,
      subscriberCount: subscribers.length, }, 'Sending digest to subscribers');

    // Step 4: Send batch digest emails
    const sendResults = await step.run('send-batch-emails', async (): Promise<{
      success: number;
      failed: number;
      successRate: string;
    }> => {
      return sendBatchDigest(subscribers, digestData, logContext);
    });

    // Step 5: Update last run timestamp
    await step.run('update-timestamp', async () => {
      const currentTimestamp = new Date().toISOString();
      
      const { error } = await supabase.from('app_settings').upsert({
        setting_key: 'last_digest_email_timestamp',
        setting_value: currentTimestamp,
        setting_type: 'string',
        environment: 'production',
        enabled: true,
        description: 'Timestamp of last successful weekly digest email send',
        category: 'config',
        version: 1,
      });

      if (error) {
        logger.warn({ ...logContext,
          errorMessage: error.message, }, 'Failed to update digest timestamp');
      }
    });

    const durationMs = Date.now() - startTime;
    logger.info({ ...logContext,
      durationMs,
      sent: sendResults.success,
      failed: sendResults.failed,
      successRate: sendResults.successRate, }, 'Weekly digest completed');

    return {
      sent: sendResults.success,
      failed: sendResults.failed,
      rate: sendResults.successRate,
    };
  }
);

/**
 * Get the start date of the previous week (last Monday)
 */
function getPreviousWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - dayOfWeek - 6);
  lastMonday.setHours(0, 0, 0, 0);
  const dateStr = lastMonday.toISOString().split('T')[0];
  if (!dateStr) {
    throw new Error('Failed to format date string');
  }
  return dateStr;
}

/**
 * Send batch digest emails using Resend batch API
 */
async function sendBatchDigest(
  subscribers: string[],
  digestData: WeeklyDigestData,
  logContext: ReturnType<typeof createWebAppContextWithId>
): Promise<{
  success: number;
  failed: number;
  successRate: string;
}> {
  let success = 0;
  let failed = 0;

  const resend = getResendClient();

  // Build HTML for the digest
  const html = buildDigestHtml(digestData);

  // Use Resend batch API (up to 100 recipients per batch)
  const batchSize = 100;
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);

    try {
      const result = await resend.batch.send(
        batch.map((email) => ({
          from: HELLO_FROM,
          to: email,
          subject: `This Week in Claude: ${digestData.week_of}`,
          html,
          tags: [{ name: 'type', value: 'weekly_digest' }],
        }))
      );

      if (result.error) {
        failed += batch.length;
        logger.warn({ ...logContext,
          batchStart: i,
          batchSize: batch.length,
          errorMessage: result.error.message, }, 'Batch send failed');
      } else {
        success += batch.length;
      }
    } catch (error) {
      const normalized = normalizeError(error, 'Batch send failed');
      logger.warn({ ...logContext,
        batchStart: i,
        batchSize: batch.length,
        errorMessage: normalized.message, }, 'Batch send exception');
      failed += batch.length;
    }
  }

  const totalSent = success + failed;
  return {
    success,
    failed,
    successRate: totalSent > 0 ? `${((success / totalSent) * 100).toFixed(1)}%` : '0%',
  };
}

/**
 * Build digest HTML (simple inline HTML)
 * TODO: Migrate to React Email template
 */
function buildDigestHtml(digestData: WeeklyDigestData): string {
  const newContentHtml = (digestData.new_content || [])
    .map(
      (item) => `
      <div style="padding: 16px; background: #f8f9fa; border-radius: 8px; margin-bottom: 12px;">
        <a href="${item.url}" style="color: #ff6b35; font-weight: 600; font-size: 16px; text-decoration: none;">
          ${item.title}
        </a>
        <p style="color: #666; margin: 8px 0 0; font-size: 14px;">${item.description || ''}</p>
        <span style="font-size: 12px; color: #999;">${item.category}</span>
      </div>
    `
    )
    .join('');

  const trendingContentHtml = (digestData.trending_content || [])
    .map(
      (item) => `
      <div style="padding: 16px; background: #f8f9fa; border-radius: 8px; margin-bottom: 12px;">
        <a href="${item.url}" style="color: #ff6b35; font-weight: 600; font-size: 16px; text-decoration: none;">
          ${item.title}
        </a>
        <p style="color: #666; margin: 8px 0 0; font-size: 14px;">${item.description || ''}</p>
        <div style="font-size: 12px; color: #999; margin-top: 4px;">
          ${item.category} • ${(item.view_count || 0).toLocaleString()} views
        </div>
      </div>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="font-size: 24px; margin: 0 0 8px;">This Week in Claude</h1>
    <p style="color: #666; margin: 0 0 24px;">Week of ${digestData.week_of}</p>
    
    ${newContentHtml ? `
    <h2 style="font-size: 18px; margin: 24px 0 16px; color: #333;">✨ New This Week</h2>
    ${newContentHtml}
    ` : ''}
    
    ${trendingContentHtml ? `
    <h2 style="font-size: 18px; margin: 24px 0 16px; color: #333;">🔥 Trending</h2>
    ${trendingContentHtml}
    ` : ''}
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
    
    <p style="color: #666; font-size: 14px; margin: 0;">
      — The Claude Pro Directory Team
    </p>
    
    <p style="color: #999; font-size: 12px; margin: 16px 0 0;">
      <a href="https://claudepro.directory/unsubscribe" style="color: #999;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}
