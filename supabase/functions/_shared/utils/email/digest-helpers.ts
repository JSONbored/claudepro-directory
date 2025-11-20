/**
 * Digest email helper functions
 * Extracted from email-handler for better organization
 */

import type { Resend } from 'npm:resend@4.0.0';
import { supabaseServiceRole } from '../../clients/supabase.ts';
import type { Database as DatabaseGenerated } from '../../database.types.ts';
import type { Tables } from '../../database-overrides.ts';
import { callRpc } from '../../database-overrides.ts';
import { createEmailHandlerContext, logError } from '../logging.ts';
import { TIMEOUT_PRESETS, withTimeout } from '../timeout.ts';
import { renderEmailTemplate } from './base-template.tsx';
import { HELLO_FROM } from './templates/manifest.ts';
import { WeeklyDigest } from './templates/weekly-digest.tsx';

/**
 * Get the start date of the previous week (last Monday)
 */
export function getPreviousWeekStart(): string {
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
 * Get all active newsletter subscribers
 */
export async function getAllSubscribers(): Promise<string[]> {
  const { data, error } = await callRpc(
    'get_active_subscribers',
    {} as DatabaseGenerated['public']['Functions']['get_active_subscribers']['Args']
  );

  if (error) {
    const logContext = createEmailHandlerContext('get-all-subscribers');
    logError('Failed to fetch subscribers', logContext, error);
    return [];
  }

  return data || [];
}

/**
 * Check if digest should be rate limited based on last run timestamp
 */
export async function checkDigestRateLimit(): Promise<{
  rateLimited: boolean;
  hoursSinceLastRun?: number;
  nextAllowedAt?: string;
}> {
  type AppSettingsRow = Pick<Tables<'app_settings'>, 'setting_value' | 'updated_at'>;
  const { data: lastRunData } = await (
    supabaseServiceRole.from('app_settings') as unknown as {
      select: (columns: string) => {
        eq: (
          column: string,
          value: string
        ) => {
          single: () => Promise<{
            data: AppSettingsRow | null;
            error: unknown;
          }>;
        };
      };
    }
  )
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
}

/**
 * Send batch digest emails using Resend batch API
 */
export async function sendBatchDigest(
  resend: Resend,
  subscribers: string[],
  digestData: DatabaseGenerated['public']['Functions']['get_weekly_digest']['Returns'],
  logContext: ReturnType<typeof createEmailHandlerContext>
): Promise<{
  success: number;
  failed: number;
  successRate: string;
}> {
  let success = 0;
  let failed = 0;

  // Render once for all subscribers (same content)
  // Use generated types directly - pass snake_case fields as-is
  const html = await renderEmailTemplate(WeeklyDigest, {
    email: subscribers[0] || '', // First email for template (not used in rendering)
    week_of: digestData.week_of || '',
    new_content: (digestData.new_content || []).map((item) => ({
      category: item.category || '',
      slug: item.slug || '',
      title: item.title || '',
      description: item.description || '',
      date_added: item.date_added || '',
      url: item.url || '',
    })),
    trending_content: (digestData.trending_content || []).map((item) => ({
      category: item.category || '',
      slug: item.slug || '',
      title: item.title || '',
      description: item.description || '',
      url: item.url || '',
      view_count: item.view_count || 0,
    })),
  });

  // Use Resend batch API (up to 100 recipients) instead of sequential sending
  const batchSize = 100;
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);

    try {
      const result = (await withTimeout(
        resend.batch.send(
          batch.map((email) => ({
            from: HELLO_FROM,
            to: email,
            subject: `This Week in Claude: ${digestData.week_of}`,
            html,
            tags: [{ name: 'type', value: 'weekly_digest' }],
          }))
        ),
        TIMEOUT_PRESETS.external * 2, // Longer timeout for batch operations
        'Resend batch digest send timed out'
      )) as { error?: unknown; data?: unknown } | unknown;

      if (result && typeof result === 'object' && 'error' in result && result.error) {
        failed += batch.length;
      } else {
        success += batch.length;
      }
    } catch (error) {
      logError(
        'Batch send failed',
        {
          ...logContext,
          batch_size: batch.length,
          batch_start_index: i,
        },
        error
      );
      failed += batch.length;
    }
  }

  return {
    success,
    failed,
    successRate: `${((success / (success + failed)) * 100).toFixed(1)}%`,
  };
}
