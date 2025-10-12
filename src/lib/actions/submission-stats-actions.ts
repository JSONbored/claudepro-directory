'use server';

/**
 * Submission Stats Actions
 * Server actions for submit page sidebar using next-safe-action
 *
 * Refactored to use Repository pattern for cleaner separation of concerns.
 * All database operations delegated to SubmissionRepository.
 *
 * PERFORMANCE:
 * - Repository-level caching (5-minute TTL)
 * - Parallel queries
 * - Minimal data transfer
 *
 * Security: Rate limited, analytics category
 */

import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { logger } from '@/src/lib/logger';
import { submissionRepository } from '@/src/lib/repositories/submission.repository';
import { nonNegativeInt } from '@/src/lib/schemas/primitives/base-numbers';
import {
  type RecentMerged,
  recentMergedSchema,
  submissionStatsSchema,
  type TopContributor,
  topContributorSchema,
} from '@/src/lib/schemas/submission-stats.schema';

/**
 * Get submission statistics
 * Cached via repository (5-minute TTL)
 */
export const getSubmissionStats = rateLimitedAction
  .metadata({
    actionName: 'getSubmissionStats',
    category: 'analytics',
  })
  .schema(z.object({})) // No input needed
  .outputSchema(submissionStatsSchema)
  .action(async () => {
    try {
      // Fetch via repository (includes caching and parallel queries)
      const result = await submissionRepository.getStats();

      if (!(result.success && result.data)) {
        throw new Error(result.error || 'Failed to fetch submission stats');
      }

      return result.data;
    } catch (error) {
      logger.error(
        'Failed to fetch submission stats',
        error instanceof Error ? error : new Error(String(error))
      );
      return { total: 0, pending: 0, mergedThisWeek: 0 };
    }
  });

/**
 * Get recently merged submissions
 * Shows social proof
 */
export const getRecentMerged = rateLimitedAction
  .metadata({
    actionName: 'getRecentMerged',
    category: 'analytics',
  })
  .schema(
    z.object({
      limit: nonNegativeInt.min(1).max(10).default(5),
    })
  )
  .outputSchema(z.array(recentMergedSchema))
  .action(async ({ parsedInput }: { parsedInput: { limit: number } }) => {
    try {
      // Fetch via repository (includes caching and user joins)
      const result = await submissionRepository.getRecentMerged(parsedInput.limit);

      if (!(result.success && result.data)) {
        throw new Error(result.error || 'Failed to fetch recent merged');
      }

      // Transform to match schema with content type validation
      const transformed: RecentMerged[] = result.data.map((item) => {
        const validContentType = [
          'agents',
          'mcp',
          'rules',
          'commands',
          'hooks',
          'statuslines',
        ].includes(item.content_type)
          ? (item.content_type as 'agents' | 'mcp' | 'rules' | 'commands' | 'hooks' | 'statuslines')
          : 'agents';

        return {
          id: item.id,
          content_name: item.content_name,
          content_type: validContentType,
          merged_at: item.merged_at,
          user: item.user,
        };
      });

      return transformed;
    } catch (error) {
      logger.error(
        'Failed to fetch recent merged',
        error instanceof Error ? error : new Error(String(error))
      );
      return [];
    }
  });

/**
 * Get top contributors
 * Gamification element
 */
export const getTopContributors = rateLimitedAction
  .metadata({
    actionName: 'getTopContributors',
    category: 'analytics',
  })
  .schema(
    z.object({
      limit: nonNegativeInt.min(1).max(10).default(5),
    })
  )
  .outputSchema(z.array(topContributorSchema))
  .action(async ({ parsedInput }: { parsedInput: { limit: number } }) => {
    try {
      // Fetch via repository (includes caching, grouping, and sorting)
      const result = await submissionRepository.getTopContributors(parsedInput.limit);

      if (!(result.success && result.data)) {
        throw new Error(result.error || 'Failed to fetch top contributors');
      }

      // Transform to match schema format
      const contributors: TopContributor[] = result.data.map((item) => ({
        rank: item.rank,
        name: item.name,
        slug: item.slug,
        mergedCount: item.mergedCount,
      }));

      return contributors;
    } catch (error) {
      logger.error(
        'Failed to fetch top contributors',
        error instanceof Error ? error : new Error(String(error))
      );
      return [];
    }
  });
