import { supabaseServiceRole } from '../../clients/supabase.ts';
import type { Database as DatabaseGenerated, Json } from '@heyclaude/database-types';
import { errorToString } from '@heyclaude/shared-runtime';

type WebhookEventRunRow = DatabaseGenerated['public']['Tables']['webhook_event_runs']['Row'];
type WebhookDeliveryStatus = DatabaseGenerated['public']['Enums']['webhook_delivery_status'];
type StartArgs = DatabaseGenerated['public']['Functions']['start_webhook_event_run']['Args'];
type FinishArgs = DatabaseGenerated['public']['Functions']['finish_webhook_event_run']['Args'];

interface FinishOptions {
  errorMessage?: string;
  metadata?: Json;
}

export async function startWebhookEventRun(eventId: string): Promise<WebhookEventRunRow | null> {
  const payload: StartArgs = { p_webhook_event_id: eventId };
  const { data, error } = await supabaseServiceRole.rpc('start_webhook_event_run', payload);

  if (error) {
    console.error('[webhook-run-logger] Failed to start webhook run', {
      webhook_id: eventId,
      error: errorToString(error),
    });
    return null;
  }

  return (data as WebhookEventRunRow | null | undefined) ?? null;
}

export async function finishWebhookEventRun(
  runId: string,
  status: WebhookDeliveryStatus,
  options?: FinishOptions
): Promise<void> {
  const payload: FinishArgs = {
    p_run_id: runId,
    p_status: status,
  };

  if (options?.errorMessage !== undefined) {
    payload.p_error = options.errorMessage;
  }
  if (options?.metadata !== undefined) {
    payload.p_metadata = options.metadata;
  }

  const { error } = await supabaseServiceRole.rpc('finish_webhook_event_run', payload);

  if (error) {
    console.error('[webhook-run-logger] Failed to finish webhook run', {
      run_id: runId,
      status,
      error: errorToString(error),
    });
  }
}
