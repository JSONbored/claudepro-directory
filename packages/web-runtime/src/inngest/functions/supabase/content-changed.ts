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
type ContentCategory = DatabaseGenerated['public']['Enums']['content_category'];

/**
 * Trigger GitHub Actions workflow via repository_dispatch
 */
async function triggerGitHubWorkflow(
  eventType: 'skill-package-needed' | 'mcpb-package-needed',
  contentId: string,
  slug?: string
): Promise<{ success: boolean; error?: string }> {
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
          content_id: contentId,
          slug: slug ?? null,
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

    logger.info('Processing Supabase content changed event', {
      ...logContext,
      eventType,
      category,
      contentId,
      slug: slug ?? null,
      webhookId,
    });

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

      // Only process skills and MCP categories
      // Type guard to ensure category is valid
      const validCategories: ContentCategory[] = ['skills', 'mcp'];
      if (!validCategories.includes(category as ContentCategory)) {
        return {
          valid: false,
          reason: `Unsupported category: ${category}`,
        };
      }

      return { valid: true };
    });

    if (!validation.valid) {
      logger.info('Supabase content event skipped', {
        ...logContext,
        eventType,
        category,
        contentId,
        reason: validation.reason,
      });

      return {
        success: true,
        eventType,
        category,
        contentId,
        action: 'skipped',
        reason: validation.reason || 'validation_failed',
      };
    }

    // Step 2: Check if package generation is needed
    const needsGeneration = await step.run('check-package-status', async () => {
      // Type-safe access to record fields
      const contentRecord = record as Partial<ContentRow>;
      
      if (category === 'skills') {
        const storageUrl = contentRecord.storage_url;
        return !storageUrl || storageUrl.trim() === '';
      }

      if (category === 'mcp') {
        const mcpbStorageUrl = contentRecord.mcpb_storage_url;
        return !mcpbStorageUrl || mcpbStorageUrl.trim() === '';
      }

      return false;
    });

    if (!needsGeneration) {
      logger.info('Package already exists, skipping workflow trigger', {
        ...logContext,
        category,
        contentId,
        slug: slug ?? null,
      });

      return {
        success: true,
        eventType,
        category,
        contentId,
        action: 'skipped',
        reason: 'package_already_exists',
      };
    }

    // Step 3: Trigger GitHub Actions workflow
    const workflowResult = await step.run('trigger-github-workflow', async () => {
      const workflowEventType = category === 'skills' 
        ? 'skill-package-needed' 
        : 'mcpb-package-needed';

      logger.info('Triggering GitHub Actions workflow', {
        ...logContext,
        workflowEventType,
        category,
        contentId,
        slug: slug ?? null,
      });

      return await triggerGitHubWorkflow(workflowEventType, contentId, slug);
    });

    if (!workflowResult.success) {
      logger.error('Failed to trigger GitHub Actions workflow', undefined, {
        ...logContext,
        category,
        contentId,
        error: workflowResult.error,
      });

      return {
        success: false,
        eventType,
        category,
        contentId,
        action: 'workflow_trigger_failed',
        error: workflowResult.error,
      };
    }

    const durationMs = Date.now() - startTime;
    logger.info('Supabase content changed event processed', {
      ...logContext,
      eventType,
      category,
      contentId,
      slug: slug ?? null,
      webhookId,
      durationMs,
      action: 'workflow_triggered',
    });

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
