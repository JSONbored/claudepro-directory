import { getOptionalEnv } from '@heyclaude/edge-runtime/config/env.ts';
import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { webhookCorsHeaders } from '@heyclaude/edge-runtime/utils/http.ts';
import { verifyVercelSignature } from '@heyclaude/edge-runtime/utils/integrations/vercel.ts';
import { verifySvixSignature } from '@heyclaude/shared-runtime';

export type WebhookProviderName = Extract<
  DatabaseGenerated['public']['Enums']['webhook_source'],
  'resend' | 'vercel' | 'polar'
>;

interface WebhookVerifierInput {
  rawBody: string;
  headers: Headers;
  secret: string;
}

interface MetadataExtraction {
  type: string | null;
  createdAt?: string | null;
  idempotencyKey?: string | null;
}

interface WebhookProviderConfig<Payload = Record<string, unknown>> {
  name: WebhookProviderName;
  headers: {
    required: string[];
    optional?: string[];
  };
  cors?: Record<string, string>;
  secretEnvKey: 'RESEND_WEBHOOK_SECRET' | 'VERCEL_WEBHOOK_SECRET' | 'POLAR_WEBHOOK_SECRET';
  verifier: (input: WebhookVerifierInput) => Promise<boolean>;
  payloadParser?: (raw: string) => Payload;
  extractMetadata: (payload: Payload, headers: Headers) => MetadataExtraction;
}

export interface WebhookContext<Payload = Record<string, unknown>> {
  provider: WebhookProviderName;
  payload: Payload;
  metadata: {
    type: string;
    createdAt: string;
    idempotencyKey: string | null;
  };
  cors: Record<string, string>;
}

export type WebhookRegistryError =
  | {
      kind: 'error';
      code: 'missing_headers';
      provider?: WebhookProviderName;
      details: string[];
      status: 400;
      message: string;
    }
  | {
      kind: 'error';
      code: 'secret_missing';
      provider: WebhookProviderName;
      status: 500;
      message: string;
    }
  | {
      kind: 'error';
      code: 'verification_failed';
      provider: WebhookProviderName;
      status: 401;
      message: string;
    }
  | {
      kind: 'error';
      code: 'invalid_payload';
      provider: WebhookProviderName;
      status: 400;
      message: string;
    }
  | {
      kind: 'error';
      code: 'missing_type';
      provider: WebhookProviderName;
      status: 400;
      message: string;
    }
  | {
      kind: 'error';
      code: 'unrecognized_provider';
      status: 401;
      message: string;
    };

export type WebhookResolutionResult<Payload = Record<string, unknown>> =
  | ({ kind: 'success' } & WebhookContext<Payload>)
  | WebhookRegistryError;

// Helper to safely extract string properties from unknown objects
function getStringProperty(obj: unknown, key: string): string | undefined {
  if (typeof obj !== 'object' || obj === null) {
    return undefined;
  }
  const desc = Object.getOwnPropertyDescriptor(obj, key);
  const value = desc?.value;
  return typeof value === 'string' ? value : undefined;
}

const PROVIDERS: WebhookProviderConfig[] = [
  {
    name: 'resend',
    headers: {
      required: ['svix-id', 'svix-timestamp', 'svix-signature'],
    },
    secretEnvKey: 'RESEND_WEBHOOK_SECRET',
    verifier: async ({ rawBody, headers, secret }) => {
      const svixId = headers.get('svix-id');
      const svixTimestamp = headers.get('svix-timestamp');
      const svixSignature = headers.get('svix-signature');
      if (!(svixId && svixTimestamp && svixSignature)) {
        return false;
      }
      return verifySvixSignature({
        rawBody,
        svixId,
        svixTimestamp,
        svixSignature,
        secret,
      });
    },
    extractMetadata: (payload: Record<string, unknown>, headers: Headers) => ({
      type: getStringProperty(payload, 'type') ?? null,
      createdAt: getStringProperty(payload, 'created_at') ?? null,
      idempotencyKey: headers.get('svix-id'),
    }),
  },
  {
    name: 'vercel',
    headers: {
      required: ['x-vercel-signature'],
      optional: ['x-vercel-id'],
    },
    secretEnvKey: 'VERCEL_WEBHOOK_SECRET',
    verifier: async ({ rawBody, headers, secret }) => {
      const signature = headers.get('x-vercel-signature');
      if (!signature) {
        return false;
      }
      return verifyVercelSignature(rawBody, signature, secret);
    },
    extractMetadata: (payload: Record<string, unknown>, headers: Headers) => {
      // Extract createdAt - can be number (timestamp) or string
      const createdAtValue = payload['createdAt'];
      const createdAt = createdAtValue
        ? typeof createdAtValue === 'number'
          ? new Date(createdAtValue).toISOString()
          : typeof createdAtValue === 'string'
            ? new Date(Number(createdAtValue)).toISOString()
            : new Date().toISOString()
        : new Date().toISOString();
      const idempotencyKey = getStringProperty(payload, 'id') ?? headers.get('x-vercel-id') ?? null;
      return {
        type: getStringProperty(payload, 'type') ?? null,
        createdAt,
        idempotencyKey,
      };
    },
  },
  {
    name: 'polar',
    headers: {
      required: ['webhook-id', 'webhook-timestamp', 'webhook-signature'],
    },
    secretEnvKey: 'POLAR_WEBHOOK_SECRET',
    verifier: async ({ rawBody, headers, secret }) => {
      const polarId = headers.get('webhook-id');
      const polarTimestamp = headers.get('webhook-timestamp');
      const polarSignature = headers.get('webhook-signature');
      if (!(polarId && polarTimestamp && polarSignature)) {
        return false;
      }
      return verifySvixSignature({
        rawBody,
        svixId: polarId,
        svixTimestamp: polarTimestamp,
        svixSignature: polarSignature,
        secret,
      });
    },
    extractMetadata: (payload: Record<string, unknown>, headers: Headers) => ({
      type: getStringProperty(payload, 'type') ?? null,
      createdAt: getStringProperty(payload, 'timestamp') ?? null,
      idempotencyKey: headers.get('webhook-id'),
    }),
  },
];

export async function resolveWebhookRequest(
  rawBody: string,
  headers: Headers
): Promise<WebhookResolutionResult> {
  const provider = detectProvider(headers);

  if (!provider) {
    return {
      kind: 'error',
      code: 'unrecognized_provider',
      status: 401,
      message: 'No recognized webhook signature headers',
    };
  }

  const secret = getOptionalEnv(provider.secretEnvKey);
  if (!secret) {
    return {
      kind: 'error',
      code: 'secret_missing',
      provider: provider.name,
      status: 500,
      message: `Missing required environment variable: ${provider.secretEnvKey}`,
    };
  }

  const verified = await provider.verifier({ rawBody, headers, secret });
  if (!verified) {
    return {
      kind: 'error',
      code: 'verification_failed',
      provider: provider.name,
      status: 401,
      message: 'Signature verification failed',
    };
  }

  let payload: Record<string, unknown>;
  try {
    const parser = provider.payloadParser ?? JSON.parse;
    payload = parser(rawBody);
  } catch {
    return {
      kind: 'error',
      code: 'invalid_payload',
      provider: provider.name,
      status: 400,
      message: 'Invalid JSON payload',
    };
  }

  const metadata = provider.extractMetadata(payload, headers);
  if (!metadata.type) {
    return {
      kind: 'error',
      code: 'missing_type',
      provider: provider.name,
      status: 400,
      message: 'Missing webhook type field',
    };
  }

  const createdAt = metadata.createdAt ?? new Date().toISOString();
  const cors = provider.cors ?? webhookCorsHeaders;

  return {
    kind: 'success',
    provider: provider.name,
    payload,
    metadata: {
      type: metadata.type,
      createdAt,
      idempotencyKey: metadata.idempotencyKey ?? null,
    },
    cors,
  };
}

function detectProvider(headers: Headers): WebhookProviderConfig | undefined {
  return PROVIDERS.find((provider) => {
    const missing = provider.headers.required.filter((header) => !headers.get(header));
    return missing.length === 0;
  });
}
