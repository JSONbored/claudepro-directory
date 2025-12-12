/**
 * Supabase Content Changed Inngest Function
 *
 * Handles database webhook events for content changes.
 * Triggers GitHub Actions workflows when new skills or MCP packages need to be generated.
 *
 * Supported events:
 * - INSERT: New content added (skills or MCP)
 * - UPDATE: Content updated (may need package regeneration)
 *
 * Idempotency:
 * - Uses webhookId (database UUID) as idempotency key
 * - Each event is processed exactly once
 * - Retries are safe due to GitHub Actions idempotency
 *
 * @see https://supabase.com/docs/guides/database/webhooks
 */

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { normalizeError } from '@heyclaude/shared-runtime';

import { inngest } from '../../client';
import { logger, createWebAppContextWithId } from '../../../logging/server';
import { RETRY_CONFIGS } from '../../config/index';

// Type for content row from database
type ContentRow = DatabaseGenerated['public']['Tables']['content']['Row'];

/**
 * Result type for workflow triggers
 */
type WorkflowTriggerResult =
  | { success: true; skipped?: false }
  | { success: false; error: string }
  | { success: true; skipped: true; reason?: string };

/**
 * Trigger GitHub Actions workflow via repository_dispatch
 */
async function triggerGitHubWorkflow(
  eventType: 'skill-package-needed' | 'mcpb-package-needed' | 'readme-update-needed',
  contentId?: string,
  slug?: string
): Promise<WorkflowTriggerResult> {
  const githubToken = process.env['GITHUB_TOKEN'];
  const githubRepo = process.env['GITHUB_REPOSITORY'] || 'JSONbored/claudepro-directory';

  if (!githubToken) {
    throw new Error('GITHUB_TOKEN environment variable is not set');
  }

  const [owner, repo] = githubRepo.split('/');
  if (!owner || !repo) {
    throw new Error(`Invalid GITHUB_REPOSITORY format: ${githubRepo}`);
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/dispatches`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'HeyClaude-Inngest/1.0',
      },
      body: JSON.stringify({
        event_type: eventType,
        client_payload: {
          ...(contentId && { content_id: contentId }),
          ...(slug && { slug }),
          triggered_at: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API error: ${response.status} ${errorText}`);
    }

    return { success: true };
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to trigger GitHub Actions workflow');
    return {
      success: false,
      error: normalized.message,
    };
  }
}

/**
 * Supabase Content Changed Handler
 *
 * Processes content change events and triggers GitHub Actions workflows
 * for package generation when needed.
 */
export const handleSupabaseContentChanged = inngest.createFunction(
  {
    id: 'supabase-content-changed-handler',
    name: 'Supabase Content Changed Handler',
    retries: RETRY_CONFIGS.WEBHOOK,
    // Idempotency: Use webhookId to prevent duplicate processing
    idempotency: 'event.data.webhookId',
  },
  { event: 'supabase/content-changed' },
  async ({ event, step }) => {
    const startTime = Date.now();
    const logContext = createWebAppContextWithId(
      '/inngest/supabase/content-changed',
      'handleSupabaseContentChanged'
    );

    const { webhookId, eventType, category, contentId, slug, record } = event.data;

    logger.info({ ...logContext,
      eventType,
      category,
      contentId,
      slug: slug ?? null,
      webhookId, }, 'Processing Supabase content changed event');

    // Step 1: Validate event type
    const validation = await step.run('validate-event', async (): Promise<{
      valid: boolean;
      reason?: string;
    }> => {
      // Only process INSERT and UPDATE events
      if (eventType === 'DELETE') {
        return {
          valid: false,
          reason: 'DELETE events do not require package generation',
        };
      }

      if (eventType !== 'INSERT' && eventType !== 'UPDATE') {
        return {
          valid: false,
          reason: `Unsupported event type: ${eventType}`,
        };
      }

      // Accept all content categories
      // Package generation only applies to skills/mcp, but README updates apply to all
      return { valid: true };
    });

    if (!validation.valid) {
      logger.info({ ...logContext,
        eventType,
        category,
        contentId,
        reason: validation.reason, }, 'Supabase content event skipped');

      return {
        success: true,
        eventType,
        category,
        contentId,
        action: 'skipped',
        reason: validation.reason || 'validation_failed',
      };
    }

    // Step 2: Check if package generation is needed (only for skills/mcp)
    const packageWorkflowResult = await step.run('trigger-package-workflow', async (): Promise<WorkflowTriggerResult> => {
      // Only trigger package generation for skills and mcp categories
      if (category !== 'skills' && category !== 'mcp') {
        return { success: true, skipped: true, reason: 'not_package_category' };
      }

      // Check if package generation is needed
      const contentRecord = record as Partial<ContentRow>;
      
      let needsGeneration = false;
      if (category === 'skills') {
        const storageUrl = contentRecord.storage_url;
        needsGeneration = !storageUrl || storageUrl.trim() === '';
      } else if (category === 'mcp') {
        const mcpbStorageUrl = contentRecord.mcpb_storage_url;
        needsGeneration = !mcpbStorageUrl || mcpbStorageUrl.trim() === '';
      }

      if (!needsGeneration) {
        logger.info({ ...logContext,
          category,
          contentId,
          slug: slug ?? null, }, 'Package already exists, skipping workflow trigger');
        return { success: true, skipped: true, reason: 'package_already_exists' };
      }

      const workflowEventType = category === 'skills' 
        ? 'skill-package-needed' 
        : 'mcpb-package-needed';

      logger.info({ ...logContext,
        workflowEventType,
        category,
        contentId,
        slug: slug ?? null, }, 'Triggering package generation workflow');

      return await triggerGitHubWorkflow(workflowEventType, contentId, slug);
    });

    if (!packageWorkflowResult.success && !('skipped' in packageWorkflowResult && packageWorkflowResult.skipped)) {
      const errorMessage = 'error' in packageWorkflowResult ? packageWorkflowResult.error : 'Unknown error';
      logger.error({ err: undefined, ...logContext,
        category,
        contentId,
        error: errorMessage, }, 'Failed to trigger package generation workflow');
      // Don't fail - continue to README update
    }

    // Step 4: Also trigger README update for any content changes (title, description, slug, category)
    // This ensures README stays in sync with database content
    const readmeTriggerResult = await step.run('trigger-readme-update', async (): Promise<WorkflowTriggerResult> => {
      // Check if content metadata changed (title, description, slug, category)
      const contentRecord = record as Partial<ContentRow>;
      const oldContentRecord = event.data.oldRecord as Partial<ContentRow> | undefined;

      const metadataChanged =
        !oldContentRecord ||
        contentRecord.title !== oldContentRecord.title ||
        contentRecord.description !== oldContentRecord.description ||
        contentRecord.slug !== oldContentRecord.slug ||
        contentRecord.category !== oldContentRecord.category;

      if (!metadataChanged && eventType === 'UPDATE') {
        logger.info({ ...logContext,
          category,
          contentId, }, 'Content metadata unchanged, skipping README update');
        return { success: true, skipped: true };
      }

      logger.info({ ...logContext,
        category,
        contentId,
        slug: slug ?? null, }, 'Triggering README update workflow');

      return await triggerGitHubWorkflow('readme-update-needed', contentId, slug);
    });

    if (!readmeTriggerResult.success && !('skipped' in readmeTriggerResult && readmeTriggerResult.skipped)) {
      const errorMessage = 'error' in readmeTriggerResult ? readmeTriggerResult.error : 'Unknown error';
      logger.warn(
        {
          ...logContext,
          category,
          contentId,
          error: errorMessage,
        },
        'Failed to trigger README update workflow (non-critical)'
      );
      // Don't fail - README update is non-critical
    }

    const durationMs = Date.now() - startTime;
    logger.info({ ...logContext,
      eventType,
      category,
      contentId,
      slug: slug ?? null,
      webhookId,
      durationMs,
      action: 'workflow_triggered', }, 'Supabase content changed event processed');

    return {
      success: true,
      eventType,
      category,
      contentId,
      slug: slug ?? null,
      webhookId,
      action: 'workflow_triggered',
      durationMs,
    };
  }
);
