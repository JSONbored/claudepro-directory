import { supabaseServiceRole } from '../../clients/supabase.ts';
import type { Database } from '../../database.types.ts';
import { resolveWebhookRequest, type WebhookRegistryError } from './registry.ts';

type WebhookPayload = Record<string, unknown>;
type WebhookSource = Database['public']['Enums']['webhook_source'];

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
  source: WebhookSource;
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

  const { error } = await supabaseServiceRole.from('webhook_events').insert({
    source: provider,
    direction: 'inbound',
    type,
    data: payload as WebhookPayload,
    created_at: createdAt || new Date().toISOString(),
    svix_id: idempotencyKey,
    processed: false,
  });

  if (error) {
    if (error.code === '23505') {
      return { source: provider, duplicate: true, cors };
    }
    throw error;
  }

  return { source: provider, duplicate: false, cors };
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
