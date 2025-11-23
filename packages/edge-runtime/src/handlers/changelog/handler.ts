import type { VercelWebhookPayload } from '../../changelog/service.ts';
import { supabaseServiceRole } from '../../clients/supabase.ts';
import {
  badRequestResponse,
  changelogCorsHeaders,
  errorResponse,
  successResponse,
} from '../../utils/http.ts';
import { createChangelogHandlerContext, withContext } from '@heyclaude/shared-runtime';
import { pgmqSend } from '../../utils/pgmq-client.ts';
import {
  ingestWebhookEvent,
  WebhookIngestError,
  type WebhookIngestResult,
} from '../../utils/webhook/ingest.ts';

export async function handleChangelogSyncRequest(req: Request): Promise<Response> {
  const logContext = createChangelogHandlerContext();

  try {
    const body = await req.text();

    // Parse payload early to extract deployment_id for logging
    let payload: VercelWebhookPayload;
    try {
      payload = JSON.parse(body) as VercelWebhookPayload;
    } catch (_parseError) {
      return badRequestResponse('Invalid JSON payload', changelogCorsHeaders);
    }

    // Update logContext with deployment info
    const updatedContext = withContext(logContext, {
      deployment_id: payload.payload?.deployment?.id,
      branch: payload.payload?.deployment?.meta?.branch,
    });

    // Ingest webhook event (validates signature, stores in webhook_events table)
    let ingestResult: WebhookIngestResult;
    try {
      ingestResult = await ingestWebhookEvent(body, req.headers);
    } catch (error) {
      if (error instanceof WebhookIngestError) {
        return errorResponse(error, 'changelog-sync:ingest', changelogCorsHeaders);
      }
      throw error;
    }

    // If duplicate webhook, return early (idempotent)
    if (ingestResult.duplicate) {
      console.log('[changelog-handler] Duplicate webhook detected, skipping', updatedContext);
      return successResponse(
        { skipped: true, reason: 'Duplicate webhook', duplicate: true },
        200,
        changelogCorsHeaders
      );
    }

    // Validate webhook type before processing
    if (payload.type !== 'deployment.succeeded') {
      return successResponse(
        { skipped: true, reason: `Unsupported webhook type: ${payload.type}` },
        200,
        changelogCorsHeaders
      );
    }

    let webhookEventId = ingestResult.webhookId;
    if (!webhookEventId) {
      const idempotencyKey = payload.id || req.headers.get('x-vercel-id');
      if (!idempotencyKey) {
        console.error('[changelog-handler] Missing idempotency key', updatedContext);
        return errorResponse(
          new Error('Missing idempotency key in webhook'),
          'changelog-sync:missing-idempotency-key',
          changelogCorsHeaders
        );
      }

      const { data: webhookEvent, error: webhookError } = await supabaseServiceRole
        .from('webhook_events')
        .select('id')
        .eq('svix_id', idempotencyKey)
        .eq('source', 'vercel')
        .order('created_at', { ascending: false })
        .limit(1)
        .single<{ id: string }>();

      if (webhookError || !webhookEvent) {
        console.error('[changelog-handler] Failed to retrieve webhook event ID', {
          ...updatedContext,
          idempotencyKey,
          error: webhookError instanceof Error ? webhookError.message : String(webhookError),
        });
        return errorResponse(
          new Error('Failed to retrieve webhook event ID'),
          'changelog-sync:webhook-query',
          changelogCorsHeaders
        );
      }

      webhookEventId = webhookEvent.id;
    }

    // Extract deployment_id for logging
    const deploymentId = payload.payload?.deployment?.id;

    // Enqueue minimal job to changelog_process queue
    const queueJob = {
      webhook_event_id: webhookEventId,
      deployment_id: deploymentId,
    };

    try {
      await pgmqSend('changelog_process', queueJob);
      console.log('[changelog-handler] Webhook processing job enqueued', {
        ...updatedContext,
        webhook_event_id: webhookEventId,
      });
    } catch (queueError) {
      const errorMsg = queueError instanceof Error ? queueError.message : String(queueError);
      console.error('[changelog-handler] Failed to enqueue webhook processing job', {
        ...updatedContext,
      webhook_event_id: webhookEventId,
        error: errorMsg,
      });
      return errorResponse(
        new Error(`Failed to enqueue processing job: ${errorMsg}`),
        'changelog-sync:enqueue',
        changelogCorsHeaders
      );
    }

    // Return success immediately (processing happens asynchronously in worker)
    return successResponse(
      {
        ingested: true,
        webhook_event_id: webhookEventId,
        queue_enqueued: true,
        message: 'Webhook received and queued for processing',
      },
      200,
      changelogCorsHeaders
    );
  } catch (error) {
    return errorResponse(error, 'changelog-sync:error', changelogCorsHeaders);
  }
}
