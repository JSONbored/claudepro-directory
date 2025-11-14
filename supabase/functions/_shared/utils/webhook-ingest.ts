import { supabaseServiceRole } from './supabase-service-role.ts';
import {
  extractWebhookFields,
  identifyAndVerifyWebhook,
  type WebhookSource,
} from './webhook-verifier.ts';

type WebhookPayload = Record<string, unknown>;

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
}

export async function ingestWebhookEvent(
  body: string,
  headers: Headers
): Promise<WebhookIngestResult> {
  const identification = await identifyAndVerifyWebhook(body, headers);

  if (!identification.verified) {
    throw new WebhookIngestError(
      identification.error || 'Signature verification failed',
      'unauthorized'
    );
  }

  const payload = JSON.parse(body) as WebhookPayload;
  const { type, createdAt, idempotencyKey } = extractWebhookFields(
    identification.source,
    payload,
    headers
  );

  if (!type) {
    throw new WebhookIngestError('Missing webhook type field', 'bad_request');
  }

  if (identification.source === 'polar') {
    if (!idempotencyKey) {
      throw new WebhookIngestError(
        'Missing webhook-id header (idempotency required)',
        'bad_request'
      );
    }

    if (!createdAt) {
      throw new WebhookIngestError('Missing webhook timestamp', 'bad_request');
    }
  }

  const { error } = await supabaseServiceRole.from('webhook_events').insert({
    source: identification.source,
    direction: 'inbound',
    type,
    data: payload,
    created_at: createdAt || new Date().toISOString(),
    svix_id: idempotencyKey,
    processed: false,
  });

  if (error) {
    if (error.code === '23505') {
      return { source: identification.source, duplicate: true };
    }
    throw error;
  }

  return { source: identification.source, duplicate: false };
}
