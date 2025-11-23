import { errorToString } from '@heyclaude/shared-runtime';
import type { WebhookIngestResult } from './ingest.ts';
import { finishWebhookEventRun, startWebhookEventRun } from './run-logger.ts';

type ResendEventPayload = {
  type?: string;
  data?: Record<string, unknown> | null;
  created_at?: string | number;
};

function extractStringField(payload: ResendEventPayload, key: string): string | null {
  if (payload.data && typeof payload.data === 'object') {
    const value = payload.data[key];
    return typeof value === 'string' ? value : null;
  }
  return null;
}

export async function processResendWebhook(event: WebhookIngestResult): Promise<void> {
  if (!event.webhookId) {
    return;
  }

  const run = await startWebhookEventRun(event.webhookId);
  const logContext = {
    webhook_id: event.webhookId,
    event_type: event.type,
  };

  try {
    if (typeof event.payload !== 'object' || event.payload === null) {
      throw new Error('Resend webhook payload missing body');
    }

    const payload = event.payload as ResendEventPayload;
    const emailId = extractStringField(payload, 'email_id');
    const messageId = extractStringField(payload, 'message_id');

    console.log('[resend-webhook] Processed event', {
      ...logContext,
      email_id: emailId,
      message_id: messageId,
    });

    if (run) {
      await finishWebhookEventRun(run.id, 'succeeded', {
        metadata: {
          provider: 'resend',
          email_id: emailId,
          message_id: messageId,
        },
      });
    }
  } catch (error) {
    const errorMsg = errorToString(error);
    console.error('[resend-webhook] Failed to process event', {
      ...logContext,
      error: errorMsg,
    });
    if (run) {
      await finishWebhookEventRun(run.id, 'failed', {
        errorMessage: errorMsg,
        metadata: {
          provider: 'resend',
        },
      });
    }
    throw error;
  }
}
