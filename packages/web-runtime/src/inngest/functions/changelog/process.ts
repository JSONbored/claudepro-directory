/**
 * Changelog Process Inngest Function
 *
 * Processes changelog_process queue: Vercel webhook → GitHub API → Create changelog entry
 * Triggered by events when webhooks are received, and by cron as a fallback.
 */

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { normalizeError, getEnvVar } from '@heyclaude/shared-runtime';

import { inngest } from '../../client';
import { createSupabaseAdminClient } from '../../../supabase/admin';
import { pgmqRead, pgmqDelete, pgmqSend, type PgmqMessage } from '../../../supabase/pgmq-client';
import { logger, generateRequestId, createWebAppContextWithId } from '../../../logging/server';

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
    const requestId = generateRequestId();
    const logContext = createWebAppContextWithId(requestId, '/inngest/changelog/process', 'processChangelogQueue');

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

          // Insert changelog entry
          const changelogEntry: DatabaseGenerated['public']['Tables']['changelog']['Insert'] = {
            title,
            slug,
            tldr,
            description: tldr,
            content: markdownContent,
            raw_content: markdownContent,
            release_date: dateStr as string,
            published: true,
            featured: false,
            source: 'automation',
            commit_count: conventionalCommits.length,
            contributors: [...new Set(conventionalCommits.map((c) => c.commit.author.name))],
            git_commit_sha: headCommit,
            canonical_url: `${siteUrl}/changelog/${slug}`,
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
