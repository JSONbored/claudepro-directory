import { supabaseServiceRole } from '../../clients/supabase.ts';
import type { Database as DatabaseGenerated, Json } from '../../database.types.ts';
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

  const insertData: DatabaseGenerated['public']['Tables']['webhook_events']['Insert'] = {
    source: provider,
    direction: 'inbound' satisfies DatabaseGenerated['public']['Enums']['webhook_direction'],
    type,
    data: payload as Json,
    created_at: createdAt || new Date().toISOString(),
    svix_id: idempotencyKey ?? null,
    processed: false,
  };
  // Use direct insert for immediate error feedback (we don't need returned data)
  // Type assertion needed due to Supabase client type inference limitation
  const { error } = await (
    supabaseServiceRole.from('webhook_events') as unknown as {
      insert: (
        values: DatabaseGenerated['public']['Tables']['webhook_events']['Insert']
      ) => Promise<{ error: unknown }>;
    }
  ).insert(insertData);

  if (error) {
    // Type guard for Supabase PostgrestError which has a 'code' property
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
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
