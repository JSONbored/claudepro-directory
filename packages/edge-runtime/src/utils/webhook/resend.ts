import { errorToString } from '@heyclaude/shared-runtime';
import type { WebhookIngestResult } from '@heyclaude/edge-runtime/utils/webhook/ingest.ts';
import { finishWebhookEventRun, startWebhookEventRun } from '@heyclaude/edge-runtime/utils/webhook/run-logger.ts';
import { logger } from '@heyclaude/edge-runtime/utils/logger.ts';

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

    logger.info('Processed event', {
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
    const errorObj = error instanceof Error ? error : new Error(errorMsg);
    logger.error('Failed to process event', {
      ...logContext,
      err: errorObj,
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
