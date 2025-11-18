/**
 * Changelog Process Route
 * Processes changelog_process queue: Vercel webhook → GitHub API → Create changelog entry
 */

import {
  buildChangelogMetadata,
  type ChangelogInsert,
  type ChangelogRow,
  deriveChangelogKeywords,
  filterConventionalCommits,
  generateMarkdownContent,
  generateTldr,
  groupCommitsByType,
  inferTitle,
  transformSectionsToChanges,
  type VercelWebhookPayload,
} from '../../../_shared/changelog/service.ts';
import { SITE_URL, supabaseServiceRole } from '../../../_shared/clients/supabase.ts';
import { getCacheConfigNumber } from '../../../_shared/config/statsig-cache.ts';
import type { Database as DatabaseGenerated } from '../../../_shared/database.types.ts';
import { insertTable } from '../../../_shared/database-overrides.ts';
import {
  CIRCUIT_BREAKER_CONFIGS,
  withCircuitBreaker,
} from '../../../_shared/utils/circuit-breaker.ts';
import type { GitHubCommit } from '../../../_shared/utils/discord/embeds.ts';
import { errorToString } from '../../../_shared/utils/error-handling.ts';
import { errorResponse, successResponse } from '../../../_shared/utils/http.ts';
import { fetchWithRetry } from '../../../_shared/utils/integrations/http-client.ts';
import { createNotificationRouterContext } from '../../../_shared/utils/logging.ts';
import { pgmqDelete, pgmqRead, pgmqSend } from '../../../_shared/utils/pgmq-client.ts';
import { TIMEOUT_PRESETS, withTimeout } from '../../../_shared/utils/timeout.ts';

const CHANGELOG_PROCESSING_QUEUE = 'changelog_process';
const CHANGELOG_PROCESSING_BATCH_SIZE = 5;

interface ChangelogWebhookProcessingJob {
  webhook_event_id: string;
  deployment_id?: string;
}

interface ChangelogWebhookQueueMessage {
  msg_id: bigint;
  read_ct: number;
  vt: string;
  enqueued_at: string;
  message: ChangelogWebhookProcessingJob;
}

async function processChangelogWebhook(message: ChangelogWebhookQueueMessage): Promise<{
  success: boolean;
  errors: string[];
}> {
  const { message: job } = message;
  const errors: string[] = [];

  const logContext = createNotificationRouterContext('changelog-process', {
    attempt: message.read_ct,
  });

  const startTime = Date.now();

  console.log('[flux-station] Processing changelog webhook', logContext);

  try {
    // 1. Fetch webhook event from webhook_events table
    const { data: webhookEvent, error: webhookError } = await supabaseServiceRole
      .from('webhook_events')
      .select('*')
      .eq('id', job.webhook_event_id)
      .single<DatabaseGenerated['public']['Tables']['webhook_events']['Row']>();

    if (webhookError || !webhookEvent) {
      const errorMsg = errorToString(webhookError);
      errors.push(`Webhook fetch: ${errorMsg}`);
      console.error('[flux-station] Failed to fetch webhook event', {
        ...logContext,
        error: errorMsg,
      });
      return { success: false, errors };
    }

    // 2. Parse VercelWebhookPayload from webhook.data
    let payload: VercelWebhookPayload;
    try {
      payload = webhookEvent.data as unknown as VercelWebhookPayload;
    } catch (parseError) {
      const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
      errors.push(`Payload parse: ${errorMsg}`);
      console.error('[flux-station] Failed to parse webhook payload', {
        ...logContext,
        error: errorMsg,
      });
      return { success: false, errors };
    }

    // 3. Validate webhook type
    if (payload.type !== 'deployment.succeeded') {
      console.log('[flux-station] Skipping non-deployment webhook', {
        ...logContext,
        type: payload.type,
      });
      // Mark as processed and skip
      await (
        supabaseServiceRole.from('webhook_events') as unknown as {
          update: (data: { processed: boolean; processed_at: string }) => {
            eq: (column: string, value: string) => Promise<{ error: unknown }>;
          };
        }
      )
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('id', job.webhook_event_id);
      return { success: true, errors: [] };
    }

    // 4. Extract commit metadata
    const baseCommit = payload.payload?.deployment?.meta?.previousCommitId;
    const headCommit = payload.payload?.deployment?.meta?.commitId;

    if (!(baseCommit && headCommit)) {
      errors.push('Missing commit metadata in deployment payload');
      console.error('[flux-station] Missing commit metadata', logContext);
      return { success: false, errors };
    }

    // 5. Fetch commits from GitHub (with timeout, retry, and circuit breaker)
    let commits: GitHubCommit[];
    try {
      // Wrap GitHub API call with circuit breaker, retry, and timeout
      commits = await withTimeout(
        withCircuitBreaker(
          'github-api',
          async () => {
            // Use fetchWithRetry for the actual GitHub API call
            const { edgeEnv } = await import('../../../_shared/config/env.ts');
            const repoOwner = edgeEnv.github.repoOwner;
            const repoName = edgeEnv.github.repoName;
            if (!(repoOwner && repoName)) {
              throw new Error('GitHub repository configuration missing');
            }
            const url = `https://api.github.com/repos/${repoOwner}/${repoName}/compare/${baseCommit}...${headCommit}`;

            const { response } = await fetchWithRetry({
              url,
              method: 'GET',
              headers: {
                Authorization: `Bearer ${edgeEnv.github.token}`,
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'ClaudeProDirectory-ChangelogBot',
              },
              retry: {
                attempts: 3,
                baseDelayMs: 1000,
                retryOn: [500, 502, 503, 504],
                noRetryOn: [400, 401, 403, 404],
              },
              logContext,
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`GitHub API error (${response.status}): ${errorText}`);
            }

            const data = (await response.json()) as { commits?: unknown[] };
            return (data.commits || []) as GitHubCommit[];
          },
          CIRCUIT_BREAKER_CONFIGS.external
        ),
        TIMEOUT_PRESETS.external,
        'GitHub API call timed out'
      );
    } catch (error) {
      const errorMsg = errorToString(error);
      errors.push(`GitHub fetch: ${errorMsg}`);
      console.error('[flux-station] Failed to fetch commits from GitHub', {
        ...logContext,
        error: errorMsg,
      });
      return { success: false, errors };
    }

    // 6. Filter conventional commits
    const conventionalCommits = filterConventionalCommits(commits);

    if (conventionalCommits.length === 0) {
      console.log('[flux-station] No conventional commits found', logContext);
      // Mark as processed and skip
      await (
        supabaseServiceRole.from('webhook_events') as unknown as {
          update: (data: { processed: boolean; processed_at: string }) => {
            eq: (column: string, value: string) => Promise<{ error: unknown }>;
          };
        }
      )
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('id', job.webhook_event_id);
      return { success: true, errors: [] };
    }

    // 7. Process commits
    const sections = groupCommitsByType(conventionalCommits);
    const markdownContent = generateMarkdownContent(sections);
    const title = inferTitle(conventionalCommits);
    const tldr = generateTldr(conventionalCommits);
    const changes = transformSectionsToChanges(sections);
    const releaseDate = new Date().toISOString().split('T')[0];
    const slug = `${releaseDate}-${payload.payload.deployment.id.slice(-6)}`;
    const branch = payload.payload.deployment.meta?.branch || 'main';
    const deploymentUrl = payload.payload.deployment.url;
    const contributors = [
      ...new Set(conventionalCommits.map((commit) => commit.commit.author.name)),
    ];
    const metadata = buildChangelogMetadata({
      sections,
      releaseDate,
      deploymentUrl,
      branch,
      commitSha: headCommit,
      commitCount: conventionalCommits.length,
      contributors,
    });
    const keywords = deriveChangelogKeywords(sections, branch);

    // 8. Build changelog entry
    const changelogEntry: ChangelogInsert = {
      title,
      slug,
      tldr,
      description: tldr || title,
      content: markdownContent,
      raw_content: markdownContent,
      changes,
      release_date: releaseDate,
      published: true,
      featured: false,
      source: 'automation',
      metadata,
      keywords,
      commit_count: conventionalCommits.length,
      contributors,
      git_commit_sha: headCommit,
      canonical_url: `${SITE_URL}/changelog/${slug}`,
    };

    // 9. Insert changelog entry
    const insertData =
      changelogEntry satisfies DatabaseGenerated['public']['Tables']['changelog']['Insert'];
    const result = insertTable('changelog', insertData);
    const { data: changelogData, error: insertError } = await result
      .select('*')
      .single<ChangelogRow>();

    if (insertError || !changelogData) {
      const errorMsg = errorToString(insertError);
      errors.push(`Changelog insert: ${errorMsg}`);
      console.error('[flux-station] Failed to insert changelog entry', {
        ...logContext,
        error: errorMsg,
      });
      return { success: false, errors };
    }

    // 10. Build notification job and enqueue to changelog_notify queue
    const notificationJob = {
      entryId: changelogData.id,
      slug: changelogData.slug,
      title: changelogData.title,
      tldr,
      sections,
      commits: conventionalCommits,
      releaseDate: changelogData.release_date ?? new Date().toISOString(),
      metadata,
    };

    try {
      await pgmqSend('changelog_notify', notificationJob);
      console.log('[flux-station] Changelog notification job enqueued', {
        ...logContext,
        changelog_id: changelogData.id,
        slug: changelogData.slug,
      });
    } catch (enqueueError) {
      const errorMsg = enqueueError instanceof Error ? enqueueError.message : String(enqueueError);
      errors.push(`Notification enqueue: ${errorMsg}`);
      console.error('[flux-station] Failed to enqueue changelog notifications', {
        ...logContext,
        error: errorMsg,
      });
      // Don't fail the job - changelog is inserted, notifications can be retried
    }

    // 11. Mark webhook as processed
    await (
      supabaseServiceRole.from('webhook_events') as unknown as {
        update: (data: { processed: boolean; processed_at: string; related_id: string }) => {
          eq: (column: string, value: string) => Promise<{ error: unknown }>;
        };
      }
    )
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        related_id: changelogData.id,
      })
      .eq('id', job.webhook_event_id);

    const durationMs = Date.now() - startTime;
    console.log('[flux-station] Changelog webhook processed successfully', {
      ...logContext,
      changelog_id: changelogData.id,
      slug: changelogData.slug,
      duration_ms: durationMs,
      errors: errors.length > 0 ? errors : undefined,
    });

    return { success: true, errors };
  } catch (error) {
    const errorMsg = errorToString(error);
    console.error('[flux-station] Unexpected error processing changelog webhook', {
      ...logContext,
      error: errorMsg,
    });
    return { success: false, errors: [errorMsg] };
  }
}

export async function handleChangelogProcess(_req: Request): Promise<Response> {
  try {
    const batchSize = getCacheConfigNumber(
      'queue.changelog_process.batch_size',
      CHANGELOG_PROCESSING_BATCH_SIZE
    );
    // Read messages with timeout protection
    const messages = await withTimeout(
      pgmqRead(CHANGELOG_PROCESSING_QUEUE, {
        sleep_seconds: 0,
        n: batchSize,
      }),
      TIMEOUT_PRESETS.rpc,
      'Changelog process queue read timed out'
    );

    if (!messages || messages.length === 0) {
      return successResponse({ message: 'No messages in queue', processed: 0 }, 200);
    }

    console.log(`[flux-station] Processing ${messages.length} changelog webhook jobs`);

    const results: Array<{
      msg_id: string;
      status: 'success' | 'failed';
      errors: string[];
      will_retry?: boolean;
    }> = [];

    for (const msg of messages) {
      const message: ChangelogWebhookQueueMessage = {
        msg_id: msg.msg_id,
        read_ct: msg.read_ct,
        vt: msg.vt,
        enqueued_at: msg.enqueued_at,
        message: msg.message as unknown as ChangelogWebhookProcessingJob,
      };

      try {
        const result = await processChangelogWebhook(message);

        if (result.success) {
          await pgmqDelete(CHANGELOG_PROCESSING_QUEUE, message.msg_id);
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
    return errorResponse(error, 'flux-station:changelog-process-fatal');
  }
}
