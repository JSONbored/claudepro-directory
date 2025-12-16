/**
 * getSocialProofStats Tool Handler
 *
 * Get community statistics including top contributors, recent submissions,
 * success rate, and total user count. Provides social proof data for engagement.
 */

import { prisma } from '@heyclaude/data-layer/prisma/client.ts';
import { logError } from '@heyclaude/shared-runtime/logging.ts';

/**
 * Fetches social proof statistics from the community.
 *
 * @returns Social proof stats including contributors, submissions, success rate, and total users
 * @throws If database queries fail
 */
export async function handleGetSocialProofStats() {
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
      await logError('Failed to fetch recent submissions', {}, recentResult.reason);
    }

    let monthSubmissions: StatusRow[] = [];
    if (monthResult.status === 'fulfilled') {
      monthSubmissions = monthResult.value as StatusRow[];
    } else {
      await logError('Failed to fetch month submissions', {}, monthResult.reason);
    }

    let contentCount: number = 0;
    if (contentResult.status === 'fulfilled') {
      contentCount = contentResult.value as number;
    } else {
      await logError('Failed to fetch content count', {}, contentResult.reason);
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
      .toSorted((a, b) => b[1] - a[1])
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
    const textSummary = `**Community Statistics**\n\n` +
      `**Top Contributors (This Week):**\n${topContributors.length > 0 ? topContributors.map((name, i) => `${i + 1}. ${name}`).join('\n') : 'No contributors this week'}\n\n` +
      `**Recent Activity:**\n` +
      `- Submissions (past 7 days): ${submissionCount}\n` +
      `- Success Rate (past 30 days): ${successRate !== null ? `${successRate}%` : 'N/A'}\n` +
      `- Total Content Items: ${totalUsers !== null ? totalUsers : 'N/A'}\n\n` +
      `*Last updated: ${new Date(timestamp).toLocaleString()}*`;

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
    await logError('Social proof stats generation failed', {}, error);
    throw new Error(`Failed to generate social proof stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
