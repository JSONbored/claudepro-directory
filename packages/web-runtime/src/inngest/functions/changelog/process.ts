/**
 * Changelog Process Inngest Function
 *
 * @deprecated This function is no longer used. It was replaced by the /api/changelog/sync endpoint
 * which is called directly by GitHub Actions. The old flow (Vercel webhook → queue → Inngest)
 * no longer works because Vercel free tier doesn't support webhooks.
 *
 * This file is kept for reference but the function is not registered in the Inngest functions list.
 *
 * Old flow: Vercel webhook → changelog_process queue → this function → database
 * New flow: GitHub Actions → /api/changelog/sync → database → changelog_notify queue → processChangelogNotifyQueue
 */

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { normalizeError, getEnvVar } from '@heyclaude/shared-runtime';

import { inngest } from '../../client';
import { createSupabaseAdminClient } from '../../../supabase/admin';
import { pgmqRead, pgmqDelete, pgmqSend, type PgmqMessage } from '../../../supabase/pgmq-client';
import { logger, createWebAppContextWithId } from '../../../logging/server';
import { generateOGImageUrl } from '../../../seo/og';

const CHANGELOG_QUEUE = 'changelog_process';
const BATCH_SIZE = 5;

interface ChangelogProcessJob {
  webhook_event_id: string;
  deployment_id?: string;
}

interface GitHubCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      date?: string;
    };
  };
}

interface ChangelogSection {
  type: string;
  commits: Array<{
    scope?: string;
    description: string;
    sha: string;
    author: string;
  }>;
}

// Conventional commit regex
const CONVENTIONAL_COMMIT_REGEX = /^(\w+)(?:\(([^)]+)\))?!?:\s*(.+)$/;

function parseConventionalCommit(message: string): { type: string; scope: string | undefined; description: string } | null {
  const firstLine = message.split('\n')[0] || '';
  const match = CONVENTIONAL_COMMIT_REGEX.exec(firstLine);
  if (!match) return null;
  return {
    type: match[1] || 'other',
    scope: match[2] as string | undefined,
    description: match[3] || '',
  };
}

function filterConventionalCommits(commits: GitHubCommit[]): GitHubCommit[] {
  return commits.filter((c) => CONVENTIONAL_COMMIT_REGEX.test(c.commit.message.split('\n')[0] || ''));
}

function groupCommitsByType(commits: GitHubCommit[]): ChangelogSection[] {
  const groups: Record<string, ChangelogSection> = {};

  for (const commit of commits) {
    const parsed = parseConventionalCommit(commit.commit.message);
    if (!parsed) continue;

    const { type, scope, description } = parsed;
    if (!groups[type]) {
      groups[type] = { type, commits: [] };
    }
    
    const commitEntry: { scope?: string; description: string; sha: string; author: string } = {
      description,
      sha: commit.sha.slice(0, 7),
      author: commit.commit.author.name,
    };
    if (scope !== undefined) {
      commitEntry.scope = scope;
    }
    groups[type].commits.push(commitEntry);
  }

  return Object.values(groups);
}

function generateMarkdownContent(sections: ChangelogSection[]): string {
  const typeLabels: Record<string, string> = {
    feat: '✨ Features',
    fix: '🐛 Bug Fixes',
    perf: '⚡ Performance',
    refactor: '♻️ Refactoring',
    docs: '📚 Documentation',
    style: '💄 Styling',
    test: '✅ Tests',
    chore: '🔧 Chores',
  };

  let content = '';
  for (const section of sections) {
    const label = typeLabels[section.type] || `📝 ${section.type}`;
    content += `## ${label}\n\n`;
    for (const commit of section.commits) {
      const scopePart = commit.scope ? `**${commit.scope}:** ` : '';
      content += `- ${scopePart}${commit.description} (\`${commit.sha}\`)\n`;
    }
    content += '\n';
  }
  return content.trim();
}

function inferTitle(commits: GitHubCommit[]): string {
  const hasFeatures = commits.some((c) => c.commit.message.startsWith('feat'));
  const hasFixes = commits.some((c) => c.commit.message.startsWith('fix'));

  if (hasFeatures && hasFixes) return 'New Features & Bug Fixes';
  if (hasFeatures) return 'New Features';
  if (hasFixes) return 'Bug Fixes';
  return 'Updates & Improvements';
}

function generateTldr(commits: GitHubCommit[]): string {
  const features = commits.filter((c) => c.commit.message.startsWith('feat')).length;
  const fixes = commits.filter((c) => c.commit.message.startsWith('fix')).length;

  const parts: string[] = [];
  if (features > 0) parts.push(`${features} new feature${features > 1 ? 's' : ''}`);
  if (fixes > 0) parts.push(`${fixes} bug fix${fixes > 1 ? 'es' : ''}`);
  if (parts.length === 0) parts.push(`${commits.length} update${commits.length > 1 ? 's' : ''}`);

  return `This release includes ${parts.join(' and ')}.`;
}

/**
 * Generate SEO-optimized title (53-60 chars) from changelog title and sections
 * Ensures title is within optimal SEO length range
 */
function generateOptimizedTitle(originalTitle: string, sections: ChangelogSection[]): string {
  // If title is already in optimal range (53-60 chars), use it
  if (originalTitle.length >= 53 && originalTitle.length <= 60) {
    return originalTitle;
  }

  // If title is too long, truncate intelligently
  if (originalTitle.length > 60) {
    // Try to truncate at word boundary
    const truncated = originalTitle.slice(0, 57);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 45) {
      return truncated.slice(0, lastSpace) + '...';
    }
    return truncated + '...';
  }

  // If title is too short, enhance with category info
  if (originalTitle.length < 53) {
    const categoryMap: Record<string, string> = {
      feat: 'Features',
      fix: 'Bug Fixes',
      perf: 'Performance',
      refactor: 'Refactoring',
    };

    // Find primary category
    const primaryCategory = sections[0]?.type;
    const categoryLabel = primaryCategory ? categoryMap[primaryCategory] : null;

    if (categoryLabel) {
      const enhanced = `${originalTitle} - ${categoryLabel}`;
      if (enhanced.length <= 60) {
        return enhanced;
      }
    }

    // Fallback: add "Update" suffix if still too short
    if (originalTitle.length < 45) {
      const withUpdate = `${originalTitle} Update`;
      if (withUpdate.length <= 60) {
        return withUpdate;
      }
    }
  }

  return originalTitle;
}

/**
 * Generate optimized SEO description (150-160 chars) from changelog sections
 * Format: "Added X features, Changed Y systems, Fixed Z bugs. Released [date]."
 */
function generateOptimizedDescription(sections: ChangelogSection[], releaseDate: string): string {
  // Map commit types to changelog categories
  const categoryMap: Record<string, string> = {
    feat: 'Added',
    fix: 'Fixed',
    perf: 'Changed',
    refactor: 'Changed',
    docs: 'Changed',
    style: 'Changed',
    test: 'Changed',
    chore: 'Changed',
  };

  // Count commits by category
  const categoryCounts: Record<string, number> = {};
  for (const section of sections) {
    const category = categoryMap[section.type] || 'Changed';
    categoryCounts[category] = (categoryCounts[category] || 0) + section.commits.length;
  }

  // Build description parts
  const parts: string[] = [];
  if (categoryCounts['Added']) {
    parts.push(`Added ${categoryCounts['Added']} feature${categoryCounts['Added'] > 1 ? 's' : ''}`);
  }
  if (categoryCounts['Changed']) {
    parts.push(`Changed ${categoryCounts['Changed']} system${categoryCounts['Changed'] > 1 ? 's' : ''}`);
  }
  if (categoryCounts['Fixed']) {
    parts.push(`Fixed ${categoryCounts['Fixed']} bug${categoryCounts['Fixed'] > 1 ? 's' : ''}`);
  }

  // Fallback if no categorized changes
  if (parts.length === 0) {
    const totalCommits = sections.reduce((sum, s) => sum + s.commits.length, 0);
    parts.push(`${totalCommits} update${totalCommits > 1 ? 's' : ''}`);
  }

  // Format date
  const date = new Date(releaseDate);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Build description (target: 150-160 chars)
  let description = `${parts.join(', ')}. Released ${formattedDate}.`;

  // Trim or pad to optimal length (150-160 chars)
  if (description.length > 160) {
    // Truncate intelligently
    description = description.slice(0, 157) + '...';
  } else if (description.length < 150) {
    // Add context if too short (but don't exceed 160)
    const remaining = Math.min(160 - description.length, 10);
    if (remaining > 5) {
      description = `Claude Pro Directory update: ${description}`;
      if (description.length > 160) {
        description = description.slice(0, 157) + '...';
      }
    }
  }

  return description;
}

/**
 * Extract SEO keywords from changelog sections and commits
 * Returns array of relevant keywords for SEO
 */
function extractKeywords(sections: ChangelogSection[], commits: GitHubCommit[]): string[] {
  const keywords = new Set<string>();

  // Add base keywords
  keywords.add('changelog');
  keywords.add('release notes');
  keywords.add('updates');

  // Add category keywords from sections
  const categoryMap: Record<string, string> = {
    feat: 'features',
    fix: 'bug fixes',
    perf: 'performance',
    refactor: 'refactoring',
    docs: 'documentation',
    style: 'styling',
    test: 'testing',
    chore: 'maintenance',
  };

  for (const section of sections) {
    const categoryKeyword = categoryMap[section.type];
    if (categoryKeyword) {
      keywords.add(categoryKeyword);
    }
  }

  // Extract keywords from commit descriptions (common terms)
  const commonTerms = new Set<string>();
  for (const commit of commits) {
    const parsed = parseConventionalCommit(commit.commit.message);
    if (parsed) {
      const words = parsed.description.toLowerCase().split(/\s+/);
      for (const word of words) {
        // Extract meaningful words (3+ chars, not common stop words)
        if (
          word.length >= 3 &&
          !['the', 'and', 'for', 'with', 'this', 'that', 'from', 'into'].includes(word)
        ) {
          // Clean word (remove punctuation)
          const cleanWord = word.replace(/[^\w]/g, '');
          if (cleanWord.length >= 3) {
            commonTerms.add(cleanWord);
          }
        }
      }
    }
  }

  // Add top 5 most common terms as keywords (limit to avoid spam)
  const sortedTerms = Array.from(commonTerms).slice(0, 5);
  for (const term of sortedTerms) {
    keywords.add(term);
  }

  // Limit total keywords to 10 (SEO best practice)
  return Array.from(keywords).slice(0, 10);
}

/**
 * Process changelog webhooks from queue
 */
export const processChangelogQueue = inngest.createFunction(
  {
    id: 'changelog-process',
    name: 'Changelog Process',
    retries: 2,
  },
  { cron: '*/30 * * * *' }, // Every 30 minutes
  async ({ step }) => {
    const startTime = Date.now();
    const logContext = createWebAppContextWithId('/inngest/changelog/process', 'processChangelogQueue');

    logger.info('Changelog queue processing started', logContext);

    const supabase = createSupabaseAdminClient();

    // Step 1: Read messages from queue
    const messages = await step.run('read-queue', async (): Promise<PgmqMessage<ChangelogProcessJob>[]> => {
      try {
        const data = await pgmqRead<ChangelogProcessJob>(CHANGELOG_QUEUE, {
          vt: 300, // 5 minute visibility timeout
          qty: BATCH_SIZE,
        });

        if (!data || data.length === 0) {
          return [];
        }

        // Filter valid changelog process jobs
        return data.filter((msg) => 
          msg.message && typeof msg.message.webhook_event_id === 'string'
        );
      } catch (error) {
        logger.warn('Failed to read changelog queue', {
          ...logContext,
          errorMessage: normalizeError(error, 'Queue read failed').message,
        });
        return [];
      }
    });

    if (messages.length === 0) {
      logger.info('No messages in changelog queue', logContext);
      return { processed: 0, created: 0 };
    }

    let createdCount = 0;
    const processedMsgIds: bigint[] = [];

    // Process each message
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg) continue;

      const result = await step.run(`process-webhook-${i}`, async (): Promise<{
        success: boolean;
        changelogId?: string;
      }> => {
        try {
          // Fetch webhook event
          const { data: webhookEvent, error: webhookError } = await supabase
            .from('webhook_events')
            .select('*')
            .eq('id', msg.message.webhook_event_id)
            .single();

          if (webhookError || !webhookEvent) {
            throw new Error(`Webhook fetch failed: ${webhookError?.message}`);
          }

          // Validate payload
          const payload = webhookEvent.data as Record<string, unknown>;
          if (payload['type'] !== 'deployment.succeeded') {
            // Mark as processed and skip
            await supabase
              .from('webhook_events')
              .update({ processed: true, processed_at: new Date().toISOString() })
              .eq('id', msg.message.webhook_event_id);
            return { success: true };
          }

          // Extract commit info
          const deployment = (payload['payload'] as Record<string, unknown>)?.['deployment'] as Record<string, unknown>;
          const meta = deployment?.['meta'] as Record<string, unknown>;
          const baseCommit = meta?.['previousCommitId'] as string;
          const headCommit = meta?.['commitId'] as string;

          if (!baseCommit || !headCommit) {
            await supabase
              .from('webhook_events')
              .update({ processed: true, processed_at: new Date().toISOString() })
              .eq('id', msg.message.webhook_event_id);
            return { success: true };
          }

          // Fetch commits from GitHub
          const githubToken = getEnvVar('GITHUB_TOKEN');
          const repoOwner = getEnvVar('GITHUB_REPO_OWNER') || 'heyclaude';
          const repoName = getEnvVar('GITHUB_REPO_NAME') || 'claudepro-directory';

          if (!githubToken) {
            throw new Error('GitHub token not configured');
          }

          const githubUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/compare/${baseCommit}...${headCommit}`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
          
          const githubResponse = await fetch(githubUrl, {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: 'application/vnd.github.v3+json',
              'User-Agent': 'ClaudeProDirectory-ChangelogBot',
            },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!githubResponse.ok) {
            throw new Error(`GitHub API error: ${githubResponse.status}`);
          }

          const githubData = await githubResponse.json() as { commits?: GitHubCommit[] };
          const commits = githubData.commits || [];

          // Filter conventional commits
          const conventionalCommits = filterConventionalCommits(commits);

          if (conventionalCommits.length === 0) {
            await supabase
              .from('webhook_events')
              .update({ processed: true, processed_at: new Date().toISOString() })
              .eq('id', msg.message.webhook_event_id);
            return { success: true };
          }

          // Generate changelog content
          const sections = groupCommitsByType(conventionalCommits);
          const markdownContent = generateMarkdownContent(sections);
          const title = inferTitle(conventionalCommits);
          const tldr = generateTldr(conventionalCommits);
          const dateStr = new Date().toISOString().split('T')[0] ?? new Date().toISOString().slice(0, 10);
          const deploymentId = deployment?.['id'] as string || '';
          const slug = `${dateStr}-${deploymentId.slice(-6)}`;
          const siteUrl = getEnvVar('NEXT_PUBLIC_SITE_URL') || 'https://claudepro.directory';
          const changelogPath = `/changelog/${slug}`;
          const canonicalUrl = `${siteUrl}${changelogPath}`;

          // Generate SEO-optimized description (150-160 chars)
          const optimizedDescription = generateOptimizedDescription(sections, dateStr);

          // Generate SEO-optimized title (53-60 chars) - separate from display title
          // Title should be concise and keyword-rich for SEO
          const seoTitle = generateOptimizedTitle(title, sections);

          // Extract keywords from sections and commits
          const keywords = extractKeywords(sections, conventionalCommits);

          // Generate OG image URL (dynamic OG image endpoint)
          const ogImageUrl = generateOGImageUrl(changelogPath);

          // Insert changelog entry with SEO fields
          const changelogEntry: DatabaseGenerated['public']['Tables']['changelog']['Insert'] = {
            title,
            slug,
            tldr,
            description: optimizedDescription, // Use optimized description instead of tldr
            content: markdownContent,
            raw_content: markdownContent,
            release_date: dateStr as string,
            published: true,
            featured: false,
            source: 'automation',
            commit_count: conventionalCommits.length,
            contributors: [...new Set(conventionalCommits.map((c) => c.commit.author.name))],
            git_commit_sha: headCommit,
            canonical_url: canonicalUrl,
            // SEO fields
            seo_title: seoTitle, // SEO-optimized title (53-60 chars)
            seo_description: optimizedDescription, // SEO-optimized description (150-160 chars)
            keywords: keywords.length > 0 ? keywords : null,
            og_image: ogImageUrl,
            og_type: 'article', // Changelog entries are articles
            twitter_card: 'summary_large_image',
            robots_index: true,
            robots_follow: true,
          };

          const { data: changelogData, error: insertError } = await supabase
            .from('changelog')
            .insert(changelogEntry)
            .select('id')
            .single();

          if (insertError) {
            throw new Error(`Changelog insert failed: ${insertError.message}`);
          }

          // Enqueue notification job
          const notificationJob = {
            entryId: changelogData.id,
            slug,
            title,
            tldr,
            sections,
            commits: conventionalCommits,
            releaseDate: dateStr,
          };

          await pgmqSend('changelog_notify', notificationJob);

          // Mark webhook as processed
          await supabase
            .from('webhook_events')
            .update({
              processed: true,
              processed_at: new Date().toISOString(),
              related_id: changelogData.id,
            })
            .eq('id', msg.message.webhook_event_id);

          return { success: true, changelogId: changelogData.id };
        } catch (error) {
          const normalized = normalizeError(error, 'Changelog processing failed');
          logger.warn('Changelog processing failed', {
            ...logContext,
            webhookEventId: msg.message.webhook_event_id,
            errorMessage: normalized.message,
          });
          return { success: false };
        }
      });

      if (result.success) {
        processedMsgIds.push(msg.msg_id);
        if (result.changelogId) {
          createdCount++;
        }
      }
    }

    // Delete processed messages
    if (processedMsgIds.length > 0) {
      await step.run('delete-processed', async () => {
        for (const msgId of processedMsgIds) {
          await pgmqDelete(CHANGELOG_QUEUE, msgId);
        }
      });
    }

    const durationMs = Date.now() - startTime;
    logger.info('Changelog queue processing completed', {
      ...logContext,
      durationMs,
      processed: messages.length,
      created: createdCount,
    });

    return {
      processed: messages.length,
      created: createdCount,
    };
  }
);
