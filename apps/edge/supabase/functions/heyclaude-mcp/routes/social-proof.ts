/**
 * getSocialProofStats Tool Handler
 *
 * Get community statistics including top contributors, recent submissions,
 * success rate, and total user count. Provides social proof data for engagement.
 */

import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logError } from '@heyclaude/shared-runtime/logging.ts';

/**
 * Fetches social proof statistics from the community.
 *
 * @param supabase - Authenticated Supabase client (should use admin/service role for stats)
 * @returns Social proof stats including contributors, submissions, success rate, and total users
 * @throws If database queries fail
 */
export async function handleGetSocialProofStats(
  supabase: SupabaseClient<Database>
) {
  try {
    // Calculate date ranges
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    // Execute all queries in parallel
    const [recentResult, monthResult, contentResult] = await Promise.allSettled([
      supabase
        .from('content_submissions')
        .select('id, status, created_at, author')
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false }),
      supabase
        .from('content_submissions')
        .select('status')
        .gte('created_at', monthAgo.toISOString()),
      supabase.from('content').select('id', { count: 'exact', head: true }),
    ]);

    // Extract results and handle errors
    interface SubmissionRow {
      author: null | string;
      created_at: string;
      id: string;
      status: string;
    }
    interface StatusRow {
      status: string;
    }

    let recentSubmissions: null | SubmissionRow[] = null;
    let submissionsError: unknown = null;
    if (recentResult.status === 'fulfilled') {
      const response = recentResult.value as { data: null | SubmissionRow[]; error: unknown };
      recentSubmissions = response.data;
      submissionsError = response.error ?? null;
    } else {
      submissionsError = recentResult.reason;
    }

    if (submissionsError !== null && submissionsError !== undefined) {
      await logError('Failed to fetch recent submissions', {
        error: submissionsError,
      });
    }

    let monthSubmissions: null | StatusRow[] = null;
    let monthError: unknown = null;
    if (monthResult.status === 'fulfilled') {
      const response = monthResult.value as { data: null | StatusRow[]; error: unknown };
      monthSubmissions = response.data;
      monthError = response.error ?? null;
    } else {
      monthError = monthResult.reason;
    }

    if (monthError !== null && monthError !== undefined) {
      await logError('Failed to fetch month submissions', {
        error: monthError,
      });
    }

    let contentCount: null | number = null;
    let contentError: unknown = null;
    if (contentResult.status === 'fulfilled') {
      const response = contentResult.value as { count: null | number; error: unknown };
      contentCount = response.count;
      contentError = response.error ?? null;
    } else {
      contentError = contentResult.reason;
    }

    if (contentError !== null && contentError !== undefined) {
      await logError('Failed to fetch content count', {
        error: contentError,
      });
    }

    // Calculate stats
    const submissionCount = recentSubmissions?.length ?? 0;
    const total = monthSubmissions?.length ?? 0;
    const approved = monthSubmissions?.filter((s) => s.status === 'merged').length ?? 0;
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

    const totalUsers = contentCount ?? null;
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
