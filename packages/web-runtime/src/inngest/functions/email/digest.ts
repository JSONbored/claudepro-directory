/**
 * Weekly Digest Email Inngest Function
 *
 * Sends weekly digest emails to all subscribers with:
 * - New content from the previous week
 * - Trending content
 *
 * Runs on a cron schedule (Mondays at 9am UTC)
 */

import type { GetWeeklyDigestReturns } from '@heyclaude/database-types/postgres-types';
import { normalizeError } from '@heyclaude/shared-runtime';

import { renderEmailTemplate } from '../../../email/base-template';
import { HELLO_FROM } from '../../../email/config/email-config';
import { WeeklyDigestEmail } from '../../../email/templates/weekly-digest';
import { getResendClient } from '../../../integrations/resend';
import { logger, createWebAppContextWithId } from '../../../logging/server';
import { getService } from '../../../data/service-factory';
import { createInngestFunction } from '../../utils/function-factory';

// Types for digest data
type WeeklyDigestData = GetWeeklyDigestReturns;

// Subscriber preferences type
type SubscriberPreferences = {
  email: string;
  categories_visited: string[];
  engagement_score: number;
  primary_interest: string | null;
};

// Engagement segment type
type EngagementSegment = 'high' | 'medium' | 'low';

/**
 * Weekly digest email function
 *
 * Cron schedule: Every Monday at 9:00 AM UTC
 * - Fetches digest content for the previous week
 * - Uses singleton pattern to prevent duplicate runs
 * - Sends batch emails to all active subscribers
 */
export const sendWeeklyDigest = createInngestFunction(
  {
    id: 'email-weekly-digest',
    name: 'Weekly Digest Email',
    route: '/inngest/email/digest',
    retries: 1, // Limited retries for cron jobs
    // Singleton pattern: Only one digest can run at a time (prevents duplicate sends)
    singleton: {
      key: 'weekly-digest',
    },
    cronSuccessHeartbeat: 'BETTERSTACK_HEARTBEAT_INNGEST_CRON',
  },
  { cron: '0 9 * * 1' }, // Every Monday at 9:00 AM UTC
  async ({ step, logContext }) => {
    // Step 1: Fetch digest content
    const digestData = await step.run(
      'fetch-digest-content',
      async (): Promise<WeeklyDigestData | null> => {
        const previousWeekStart = getPreviousWeekStart();

        try {
          const contentService = await getService('content');
          const digest = await contentService.getWeeklyDigest({
            p_week_start: previousWeekStart,
          });
          return digest;
        } catch (error) {
          const normalized = normalizeError(error, 'Failed to fetch weekly digest');
          logger.warn({ ...logContext, err: normalized }, 'Failed to fetch weekly digest');
          return null;
        }
      }
    );

    if (!digestData) {
      return { skipped: true, reason: 'invalid_data' };
    }

    const hasNewContent =
      Array.isArray(digestData.new_content) && digestData.new_content.length > 0;
    const hasTrendingContent =
      Array.isArray(digestData.trending_content) && digestData.trending_content.length > 0;

    if (!(hasNewContent || hasTrendingContent)) {
      logger.info(logContext, 'Digest skipped - no content');
      return { skipped: true, reason: 'no_content' };
    }

    // Step 2: Fetch subscribers with preferences
    const subscribers = await step.run(
      'fetch-subscribers',
      async (): Promise<SubscriberPreferences[]> => {
        const newsletterService = await getService('newsletter');

        try {
          const data = await (newsletterService as any).getActiveSubscribersWithPreferences();
          return data || [];
        } catch (error) {
          const normalized = normalizeError(error, 'Failed to fetch subscribers');
          logger.warn({ ...logContext, err: normalized }, 'Failed to fetch subscribers');
          return [];
        }
      }
    );

    if (subscribers.length === 0) {
      logger.info(logContext, 'Digest skipped - no subscribers');
      return { skipped: true, reason: 'no_subscribers' };
    }

    logger.info(
      { ...logContext, subscriberCount: subscribers.length },
      'Sending personalized digest to subscribers'
    );

    // Step 3: Send personalized batch digest emails
    const sendResults = await step.run(
      'send-batch-emails',
      async (): Promise<{
        success: number;
        failed: number;
        successRate: string;
      }> => {
        return sendPersonalizedBatchDigest(subscribers, digestData, logContext);
      }
    );

    // Additional custom logging (duration logging is handled by factory)
    logger.info(
      {
        ...logContext,
        sent: sendResults.success,
        failed: sendResults.failed,
        successRate: sendResults.successRate,
      },
      'Weekly digest completed'
    );

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
 * Get engagement segment from engagement score
 */
function getEngagementSegment(engagementScore: number): EngagementSegment {
  if (engagementScore >= 75) return 'high';
  if (engagementScore >= 40) return 'medium';
  return 'low';
}

/**
 * Personalize digest content based on subscriber preferences
 *
 * Filters and ranks content by:
 * 1. Primary interest (highest priority)
 * 2. Categories visited (secondary priority)
 * 3. All content (fallback)
 */
function personalizeDigestContent(
  digestData: WeeklyDigestData,
  preferences: SubscriberPreferences
): WeeklyDigestData {
  const { categories_visited, primary_interest } = preferences;

  // Build priority categories list
  const priorityCategories: Set<string> = new Set();
  if (primary_interest) {
    priorityCategories.add(primary_interest.toLowerCase());
  }
  categories_visited.forEach((cat) => priorityCategories.add(cat.toLowerCase()));

  // If no preferences, return all content
  if (priorityCategories.size === 0) {
    return digestData;
  }

  // Score function: higher score = more relevant
  const scoreContent = (category: string | null): number => {
    if (!category) return 0;
    const catLower = category.toLowerCase();
    if (primary_interest && catLower === primary_interest.toLowerCase()) return 3;
    if (priorityCategories.has(catLower)) return 2;
    return 1;
  };

  // Sort new content by relevance
  const personalizedNewContent = [...(digestData.new_content || [])].sort((a, b) => {
    const scoreA = scoreContent(a.category);
    const scoreB = scoreContent(b.category);
    return scoreB - scoreA; // Higher score first
  });

  // Sort trending content by relevance
  const personalizedTrendingContent = [...(digestData.trending_content || [])].sort((a, b) => {
    const scoreA = scoreContent(a.category);
    const scoreB = scoreContent(b.category);
    return scoreB - scoreA; // Higher score first
  });

  return {
    ...digestData,
    new_content: personalizedNewContent,
    trending_content: personalizedTrendingContent,
  };
}

/**
 * Send personalized batch digest emails using Resend batch API
 *
 * Segments subscribers by engagement level and personalizes content per subscriber
 * based on their category preferences.
 */
async function sendPersonalizedBatchDigest(
  subscribers: SubscriberPreferences[],
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

  // Group subscribers by engagement segment for better tracking
  const segments: Record<EngagementSegment, SubscriberPreferences[]> = {
    high: [],
    medium: [],
    low: [],
  };

  subscribers.forEach((sub) => {
    const segment = getEngagementSegment(sub.engagement_score);
    segments[segment].push(sub);
  });

  logger.info(
    {
      ...logContext,
      highEngagement: segments.high.length,
      mediumEngagement: segments.medium.length,
      lowEngagement: segments.low.length,
    },
    'Subscribers segmented by engagement'
  );

  // Use Resend batch API (up to 100 recipients per batch)
  const batchSize = 100;
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);

    try {
      // Generate personalized HTML for each subscriber in batch
      const batchEmails = await Promise.all(
        batch.map(async (subscriber) => {
          // Personalize content for this subscriber
          const personalizedData = personalizeDigestContent(digestData, subscriber);
          const html = await buildDigestHtml(personalizedData);

          return {
            from: HELLO_FROM,
            to: subscriber.email,
            subject: `This Week in Claude: ${digestData.week_of}`,
            html,
            tags: [
              { name: 'type', value: 'weekly_digest' },
              {
                name: 'engagement',
                value: getEngagementSegment(subscriber.engagement_score),
              },
            ],
          };
        })
      );

      const result = await resend.batch.send(batchEmails);

      if (result.error) {
        failed += batch.length;
        logger.warn(
          {
            ...logContext,
            batchStart: i,
            batchSize: batch.length,
            errorMessage: result.error.message,
          },
          'Batch send failed'
        );
      } else {
        success += batch.length;
      }
    } catch (error) {
      const normalized = normalizeError(error, 'Batch send failed');
      logger.warn(
        { ...logContext, batchStart: i, batchSize: batch.length, errorMessage: normalized.message },
        'Batch send exception'
      );
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
 * Build digest HTML using React Email template
 */
async function buildDigestHtml(digestData: WeeklyDigestData): Promise<string> {
  return renderEmailTemplate(WeeklyDigestEmail, {
    weekOf: digestData.week_of || 'Unknown Week',
    newContent: digestData.new_content || [],
    trendingContent: digestData.trending_content || [],
  });
}
