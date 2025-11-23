import { supabaseServiceRole } from '../../clients/supabase.ts';
import type { Database as DatabaseGenerated, Json } from '@heyclaude/database-types';
import { resolveWebhookRequest, type WebhookRegistryError } from './registry.ts';

export class WebhookIngestError extends Error {
  constructor(
    message: string,
    public status: 'bad_request' | 'unauthorized'
  ) {
    super(message);
    this.name = 'WebhookIngestError';
  }
}

export interface WebhookIngestResult {
  source: DatabaseGenerated['public']['Enums']['webhook_source'];
  type: DatabaseGenerated['public']['Enums']['webhook_event_type'];
  payload: Record<string, unknown>;
  metadata: {
    createdAt: string;
    idempotencyKey: string | null;
  };
  webhookId: string | null;
  duplicate: boolean;
  cors: Record<string, string>;
}

export async function ingestWebhookEvent(
  body: string,
  headers: Headers
): Promise<WebhookIngestResult> {
  const resolution = await resolveWebhookRequest(body, headers);

  if (resolution.kind === 'error') {
    return handleRegistryError(resolution);
  }

    const {
      provider,
    metadata: { type, createdAt, idempotencyKey },
      payload,
      cors,
    } = resolution;
  const webhookType = type as DatabaseGenerated['public']['Enums']['webhook_event_type'];

  const insertData: DatabaseGenerated['public']['Tables']['webhook_events']['Insert'] = {
    source: provider,
    direction: 'inbound' satisfies DatabaseGenerated['public']['Enums']['webhook_direction'],
    type: webhookType,
    data: payload as Json,
    created_at: createdAt || new Date().toISOString(),
    svix_id: idempotencyKey ?? null,
    processed: false,
  };

  const { data, error } = await supabaseServiceRole
    .from('webhook_events')
    .insert(insertData)
    .select('id')
    .single<{ id: string }>();

  if (error) {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      if (error.code === '23505') {
        return {
          source: provider,
          type: webhookType,
          payload,
          metadata: { createdAt: createdAt ?? new Date().toISOString(), idempotencyKey },
          webhookId: null,
          duplicate: true,
          cors,
        };
      }
      if (error.code === '22P02') {
        throw new WebhookIngestError('Unsupported webhook type', 'bad_request');
      }
    }
    throw error;
  }

  return {
    source: provider,
    type: webhookType,
    payload,
    metadata: { createdAt: createdAt ?? new Date().toISOString(), idempotencyKey },
    webhookId: data?.id ?? null,
    duplicate: false,
    cors,
  };
}

function handleRegistryError(error: WebhookRegistryError): never {
  if (error.status >= 500) {
    throw new Error(error.message);
  }

  if (error.status === 401) {
    throw new WebhookIngestError(error.message, 'unauthorized');
  }

  throw new WebhookIngestError(error.message, 'bad_request');
}
