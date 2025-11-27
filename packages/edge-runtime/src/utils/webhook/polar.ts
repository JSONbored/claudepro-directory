import { supabaseServiceRole } from '../../clients/supabase.ts';
import type { Database as DatabaseGenerated, Json } from '@heyclaude/database-types';
import { errorToString } from '@heyclaude/shared-runtime';
import type { WebhookIngestResult } from './ingest.ts';
import { finishWebhookEventRun, startWebhookEventRun } from './run-logger.ts';
import { logger } from '../logger.ts';

const POLAR_EVENT_RPC_MAP: Record<string, keyof DatabaseGenerated['public']['Functions']> = {
  'order.paid': 'handle_polar_order_paid',
  'order.refunded': 'handle_polar_order_refunded',
  'subscription.canceled': 'handle_polar_subscription_canceled',
  'subscription.renewal': 'handle_polar_subscription_renewal',
  'subscription.revoked': 'handle_polar_subscription_revoked',
};

type PolarPayload = Record<string, unknown> & {
  metadata?: Record<string, unknown> | null;
};

function getMetadataValue<T = unknown>(payload: PolarPayload, key: string): T | undefined {
  if (payload.metadata && typeof payload.metadata === 'object') {
    const value = payload.metadata[key];
    return value as T | undefined;
  }
  return undefined;
}

function validatePolarPayload(eventType: string, payload: PolarPayload): void {
  const jobId = getMetadataValue<string>(payload, 'job_id');

  if (
    ['order.paid', 'order.refunded', 'subscription.canceled', 'subscription.renewal', 'subscription.revoked'].includes(
      eventType
    ) &&
    (!jobId || typeof jobId !== 'string')
  ) {
    throw new Error(`Polar webhook payload missing metadata.job_id for event ${eventType}`);
  }
}

export async function processPolarWebhook(event: WebhookIngestResult): Promise<void> {
  if (!event.webhookId) {
    return;
  }

  const rpcName = POLAR_EVENT_RPC_MAP[event.type];
  if (!rpcName) {
    logger.warn('Unsupported event type', {
      type: event.type,
      webhookId: event.webhookId,
    });
    return;
  }

  const logContext = {
    webhook_id: event.webhookId,
    event_type: event.type,
  };

  const run = await startWebhookEventRun(event.webhookId);

  try {
    validatePolarPayload(event.type, event.payload as PolarPayload);

    const { error } = await supabaseServiceRole.rpc(rpcName, {
      webhook_id: event.webhookId,
      webhook_data: event.payload as Json,
    });

    if (error) {
      throw new Error(
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message: string }).message
          : String(error)
      );
    }

    logger.info('Processed event', logContext);
    if (run) {
      await finishWebhookEventRun(run.id, 'succeeded', {
        metadata: {
          rpc: rpcName,
          job_id: getMetadataValue<string>(event.payload as PolarPayload, 'job_id'),
        },
      });
    }
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(errorToString(error));
    logger.error('Failed to process event', {
      ...logContext,
      err: errorObj,
    });
    if (run) {
      await finishWebhookEventRun(run.id, 'failed', {
        errorMessage: errorToString(error),
        metadata: {
          rpc: rpcName,
          job_id: getMetadataValue<string>(event.payload as PolarPayload, 'job_id'),
        },
      });
    }
    throw error;
  }
}
