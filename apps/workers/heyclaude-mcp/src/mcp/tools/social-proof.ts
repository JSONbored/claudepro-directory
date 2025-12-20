/**
 * getSocialProofStats Tool Handler
 *
 * Get community statistics including top contributors, recent submissions,
 * success rate, and total user count. Provides social proof data for engagement.
 */

import type { GetSocialProofStatsInput } from '../../lib/types';
import { normalizeError } from '@heyclaude/cloudflare-runtime/utils/errors';
import type { ToolContext } from './categories';

/**
 * Fetches social proof statistics from the community.
 *
 * @param input - Tool input (empty object for getSocialProofStats)
 * @param context - Tool handler context
 * @returns Social proof stats including contributors, submissions, success rate, and total users
 * @throws If database queries fail
 */
export async function handleGetSocialProofStats(
  _input: GetSocialProofStatsInput,
  context: ToolContext
): Promise<{
  content: Array<{ type: 'text'; text: string }>;
  _meta: {
    stats: {
      contributors: {
        count: number;
        names: string[];
      };
      submissions: number;
      successRate: number | null;
      totalUsers: number;
    };
    timestamp: string;
  };
}> {
  const { prisma, logger } = context;
  const startTime = Date.now();

  try {
    // Calculate date ranges
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    // Execute all queries in parallel using Prisma
    const [recentResult, monthResult, contentResult] = await Promise.allSettled([
      prisma.content_submissions.findMany({
        where: {
          created_at: { gte: weekAgo },
        },
        select: {
          id: true,
          status: true,
          created_at: true,
          author: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
      prisma.content_submissions.findMany({
        where: {
          created_at: { gte: monthAgo },
        },
        select: {
          status: true,
        },
      }),
      prisma.content.count(),
    ]);

    // Extract results and handle errors
    interface SubmissionRow {
      author: string | null;
      created_at: Date;
      id: string;
      status: string;
    }
    interface StatusRow {
      status: string;
    }

    let recentSubmissions: SubmissionRow[] = [];
    if (recentResult.status === 'fulfilled') {
      recentSubmissions = recentResult.value as SubmissionRow[];
    } else {
      const normalized = normalizeError(recentResult.reason, 'Failed to fetch recent submissions');
      logger.warn({ error: normalized, tool: 'getSocialProofStats' }, 'Failed to fetch recent submissions (non-critical)');
    }

    let monthSubmissions: StatusRow[] = [];
    if (monthResult.status === 'fulfilled') {
      monthSubmissions = monthResult.value as StatusRow[];
    } else {
      const normalized = normalizeError(monthResult.reason, 'Failed to fetch month submissions');
      logger.warn({ error: normalized, tool: 'getSocialProofStats' }, 'Failed to fetch month submissions (non-critical)');
    }

    let contentCount: number = 0;
    if (contentResult.status === 'fulfilled') {
      contentCount = contentResult.value as number;
    } else {
      const normalized = normalizeError(contentResult.reason, 'Failed to fetch content count');
      logger.warn({ error: normalized, tool: 'getSocialProofStats' }, 'Failed to fetch content count (non-critical)');
    }

    // Calculate stats
    const submissionCount = recentSubmissions.length;
    const total = monthSubmissions.length;
    const approved = monthSubmissions.filter((s) => s.status === 'merged').length;
    const successRate = total > 0 ? Math.round((approved / total) * 100) : null;

    // Get top contributors this week (unique authors with most submissions)
    const contributorCounts = new Map<string, number>();
    if (recentSubmissions) {
      for (const sub of recentSubmissions) {
        if (sub.author) {
          contributorCounts.set(sub.author, (contributorCounts.get(sub.author) ?? 0) + 1);
        }
      }
    }

    const topContributors = [...contributorCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => {
        // Defensively extract username: handle both email and non-email formats
        const atIndex = name.indexOf('@');
        if (atIndex !== -1) {
          // Email format: extract username part before '@'
          return name.slice(0, Math.max(0, atIndex));
        }
        // Non-email format: return trimmed original name
        return name.trim();
      });

    const totalUsers = contentCount;
    const timestamp = new Date().toISOString();

    // Create text summary
    const textSummary =
      `**Community Statistics**\n\n` +
      `**Top Contributors (This Week):**\n${topContributors.length > 0 ? topContributors.map((name, i) => `${i + 1}. ${name}`).join('\n') : 'No contributors this week'}\n\n` +
      `**Recent Activity:**\n` +
      `- Submissions (past 7 days): ${submissionCount}\n` +
      `- Success Rate (past 30 days): ${successRate !== null ? `${successRate}%` : 'N/A'}\n` +
      `- Total Content Items: ${totalUsers !== null ? totalUsers : 'N/A'}\n\n` +
      `*Last updated: ${new Date(timestamp).toLocaleString()}*`;

    logger.info(
      {
        tool: 'getSocialProofStats',
        duration_ms: Date.now() - startTime,
        submissionCount,
        successRate,
        totalUsers,
        topContributorsCount: topContributors.length,
      },
      'getSocialProofStats completed successfully'
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: textSummary,
        },
      ],
      _meta: {
        stats: {
          contributors: {
            count: topContributors.length,
            names: topContributors,
          },
          submissions: submissionCount,
          successRate,
          totalUsers,
        },
        timestamp,
      },
    };
  } catch (error) {
    const normalized = normalizeError(error, 'getSocialProofStats tool failed');
    logger.error({ error: normalized, tool: 'getSocialProofStats' }, 'getSocialProofStats tool error');
    throw normalized;
  }
}
