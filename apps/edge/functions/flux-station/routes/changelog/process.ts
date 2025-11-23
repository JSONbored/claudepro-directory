/**
 * Changelog Process Route
 * Processes changelog_process queue: Vercel webhook → GitHub API → Create changelog entry
 */

import type { Database as DatabaseGenerated, Json } from '@heyclaude/database-types';
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
} from '@heyclaude/edge-runtime/changelog/service.ts';
import { SITE_URL, supabaseServiceRole } from '@heyclaude/edge-runtime/clients/supabase.ts';
import { getCacheConfigNumber } from '@heyclaude/edge-runtime/config/statsig-cache.ts';
import type { GitHubCommit } from '@heyclaude/edge-runtime/utils/discord/embeds.ts';
import { errorResponse, successResponse } from '@heyclaude/edge-runtime/utils/http.ts';
import { fetchWithRetry } from '@heyclaude/edge-runtime/utils/integrations/http-client.ts';
import { pgmqDelete, pgmqRead, pgmqSend } from '@heyclaude/edge-runtime/utils/pgmq-client.ts';
import {
  finishWebhookEventRun,
  startWebhookEventRun,
} from '@heyclaude/edge-runtime/utils/webhook/run-logger.ts';
import {
  CIRCUIT_BREAKER_CONFIGS,
  createNotificationRouterContext,
  errorToString,
  TIMEOUT_PRESETS,
  withCircuitBreaker,
  withTimeout,
} from '@heyclaude/shared-runtime';

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

// Type guard to validate VercelWebhookPayload structure
function isValidVercelWebhookPayload(value: unknown): value is VercelWebhookPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const getProperty = (obj: unknown, key: string): unknown => {
    if (typeof obj !== 'object' || obj === null) {
      return undefined;
    }
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    return desc?.value;
  };

  const getStringProperty = (obj: unknown, key: string): string | undefined => {
    const value = getProperty(obj, key);
    return typeof value === 'string' ? value : undefined;
  };

  const type = getStringProperty(value, 'type');
  const id = getStringProperty(value, 'id');
  const createdAt = getProperty(value, 'createdAt');
  const payload = getProperty(value, 'payload');

  if (
    !(type && id) ||
    typeof createdAt !== 'number' ||
    typeof payload !== 'object' ||
    payload === null
  ) {
    return false;
  }

  // Validate payload.deployment structure
  const deployment = getProperty(payload, 'deployment');
  if (typeof deployment !== 'object' || deployment === null) {
    return false;
  }

  const deploymentId = getStringProperty(deployment, 'id');
  const deploymentUrl = getStringProperty(deployment, 'url');
  const meta = getProperty(deployment, 'meta');

  if (!(deploymentId && deploymentUrl) || typeof meta !== 'object' || meta === null) {
    return false;
  }

  const commitId = getStringProperty(meta, 'commitId');
  if (!commitId) {
    return false;
  }

  return true;
}

// Type guard to validate ChangelogWebhookProcessingJob structure
function isValidChangelogWebhookProcessingJob(
  value: unknown
): value is ChangelogWebhookProcessingJob {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const getProperty = (obj: unknown, key: string): unknown => {
    if (typeof obj !== 'object' || obj === null) {
      return undefined;
    }
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    return desc?.value;
  };

  const getStringProperty = (obj: unknown, key: string): string | undefined => {
    const value = getProperty(obj, key);
    return typeof value === 'string' ? value : undefined;
  };

  const webhookEventId = getStringProperty(value, 'webhook_event_id');
  if (!webhookEventId) {
    return false;
  }

  // deployment_id is optional, so we just check if it exists and is a string if present
  const deploymentId = getProperty(value, 'deployment_id');
  if (deploymentId !== undefined && typeof deploymentId !== 'string') {
    return false;
  }

  return true;
}

// Type guard to validate GitHubCommit array
function isValidGitHubCommitArray(value: unknown): value is GitHubCommit[] {
  if (!Array.isArray(value)) {
    return false;
  }

  for (const item of value) {
    if (typeof item !== 'object' || item === null) {
      return false;
    }

    const getProperty = (obj: unknown, key: string): unknown => {
      if (typeof obj !== 'object' || obj === null) {
        return undefined;
      }
      const desc = Object.getOwnPropertyDescriptor(obj, key);
      return desc?.value;
    };

    const getStringProperty = (obj: unknown, key: string): string | undefined => {
      const value = getProperty(obj, key);
      return typeof value === 'string' ? value : undefined;
    };

    const sha = getStringProperty(item, 'sha');
    const commit = getProperty(item, 'commit');
    const htmlUrl = getStringProperty(item, 'html_url');

    if (!(sha && htmlUrl) || typeof commit !== 'object' || commit === null) {
      return false;
    }

    const author = getProperty(commit, 'author');
    const message = getStringProperty(commit, 'message');

    if (!message || typeof author !== 'object' || author === null) {
      return false;
    }

    const authorName = getStringProperty(author, 'name');
    if (!authorName) {
      return false;
    }
  }

  return true;
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
  const run =
    job.webhook_event_id !== undefined ? await startWebhookEventRun(job.webhook_event_id) : null;
  const baseMetadata: Record<string, unknown> = {
    queue: CHANGELOG_PROCESSING_QUEUE,
    deployment_id: job.deployment_id ?? null,
  };
  const exitWithResult = async (
    result: { success: boolean; errors: string[] },
    options?: { errorMessage?: string; metadata?: Record<string, unknown> }
  ) => {
    if (run) {
      const metadataPayload: Record<string, unknown> = {
        ...baseMetadata,
        ...(options?.metadata ?? {}),
      };
      const finishOptions = {
        metadata: metadataPayload as Json,
        ...(options?.errorMessage !== undefined ? { errorMessage: options.errorMessage } : {}),
      };
      await finishWebhookEventRun(run.id, result.success ? 'succeeded' : 'failed', finishOptions);
    }
    return result;
  };

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
      return exitWithResult({ success: false, errors }, { errorMessage: errorMsg });
    }

    // 2. Parse VercelWebhookPayload from webhook.data
    // webhookEvent.data is Json type, which could be any JSON-serializable value
    const webhookData = webhookEvent.data;
    if (!isValidVercelWebhookPayload(webhookData)) {
      const validationError = 'Invalid webhook payload structure';
      errors.push(validationError);
      console.error('[flux-station] Invalid webhook payload structure', {
        ...logContext,
      });
      return exitWithResult({ success: false, errors }, { errorMessage: validationError });
    }
    const payload = webhookData;

    // 3. Validate webhook type
    if (payload.type !== 'deployment.succeeded') {
      console.log('[flux-station] Skipping non-deployment webhook', {
        ...logContext,
        type: payload.type,
      });
      // Mark as processed and skip
      await supabaseServiceRole
        .from('webhook_events')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('id', job.webhook_event_id);
      return exitWithResult(
        { success: true, errors: [] },
        { metadata: { skipped: true, type: payload.type } }
      );
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
            const { edgeEnv } = await import('@heyclaude/edge-runtime/config/env.ts');
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
              ...(logContext !== undefined ? { logContext } : {}),
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`GitHub API error (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            // Validate response structure
            if (typeof data !== 'object' || data === null) {
              throw new Error('Invalid GitHub API response: expected object');
            }

            const getProperty = (obj: unknown, key: string): unknown => {
              if (typeof obj !== 'object' || obj === null) {
                return undefined;
              }
              const desc = Object.getOwnPropertyDescriptor(obj, key);
              return desc?.value;
            };

            const commitsValue = getProperty(data, 'commits');
            if (!commitsValue) {
              return [];
            }

            if (!isValidGitHubCommitArray(commitsValue)) {
              throw new Error('Invalid GitHub commits structure in API response');
            }

            return commitsValue;
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
      return exitWithResult({ success: false, errors }, { errorMessage: errorMsg });
    }

    // 6. Filter conventional commits
    const conventionalCommits = filterConventionalCommits(commits);

    if (conventionalCommits.length === 0) {
      console.log('[flux-station] No conventional commits found', logContext);
      // Mark as processed and skip
      await supabaseServiceRole
        .from('webhook_events')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('id', job.webhook_event_id);
      return exitWithResult(
        { success: true, errors: [] },
        { metadata: { skipped: true, reason: 'no_commits' } }
      );
    }

    // 7. Process commits
    const sections = groupCommitsByType(conventionalCommits);
    const markdownContent = generateMarkdownContent(sections);
    const title = inferTitle(conventionalCommits);
    const tldr = generateTldr(conventionalCommits);
    const changes = transformSectionsToChanges(sections);
    const dateStr = new Date().toISOString().split('T')[0];
    if (!dateStr) {
      throw new Error('Failed to format release date');
    }
    const releaseDate = dateStr;
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
      tldr: tldr ?? null,
      description: tldr || title,
      content: markdownContent,
      raw_content: markdownContent,
      changes: changes ?? null,
      release_date: releaseDate,
      published: true,
      featured: false,
      source: 'automation',
      metadata: metadata ?? null,
      keywords: keywords ?? null,
      commit_count: conventionalCommits.length,
      contributors: contributors ?? null,
      git_commit_sha: headCommit ?? null,
      canonical_url: `${SITE_URL}/changelog/${slug}`,
    } satisfies ChangelogInsert;

    // 9. Insert changelog entry
    const insertData: DatabaseGenerated['public']['Tables']['changelog']['Insert'] = changelogEntry;
    const { data: changelogData, error: insertError } = await supabaseServiceRole
      .from('changelog')
      .insert(insertData)
      .select('*')
      .single<ChangelogRow>();

    if (insertError || !changelogData) {
      const errorMsg = errorToString(insertError);
      errors.push(`Changelog insert: ${errorMsg}`);
      console.error('[flux-station] Failed to insert changelog entry', {
        ...logContext,
        error: errorMsg,
      });
      return exitWithResult({ success: false, errors }, { errorMessage: errorMsg });
    }

    // 10. Build notification job and enqueue to changelog_notify queue
    const notificationJob = {
      entryId: changelogData.id,
      slug: changelogData.slug,
      title: changelogData.title,
      tldr,
      sections,
      commits: conventionalCommits,
      releaseDate: changelogData.release_date || new Date().toISOString(),
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
    await supabaseServiceRole
      .from('webhook_events')
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

    return exitWithResult(
      { success: true, errors },
      {
        metadata: {
          changelog_id: changelogData.id,
          slug: changelogData.slug,
        },
      }
    );
  } catch (error) {
    const errorMsg = errorToString(error);
    console.error('[flux-station] Unexpected error processing changelog webhook', {
      ...logContext,
      error: errorMsg,
    });
    return exitWithResult({ success: false, errors: [errorMsg] }, { errorMessage: errorMsg });
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
      // Validate queue message structure
      if (!isValidChangelogWebhookProcessingJob(msg.message)) {
        console.error('[flux-station] Invalid changelog webhook processing job structure', {
          msg_id: msg.msg_id.toString(),
        });
        results.push({
          msg_id: msg.msg_id.toString(),
          status: 'failed',
          errors: ['Invalid message structure'],
          will_retry: false, // Don't retry invalid messages
        });
        continue;
      }

      const message: ChangelogWebhookQueueMessage = {
        msg_id: msg.msg_id,
        read_ct: msg.read_ct,
        vt: msg.vt,
        enqueued_at: msg.enqueued_at,
        message: msg.message,
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
