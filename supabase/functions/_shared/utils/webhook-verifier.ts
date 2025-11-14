import type { Database } from '../database.types.ts';
import { verifyVercelSignature } from './vercel.ts';

export type WebhookSource = Database['public']['Enums']['webhook_source'];

const RESEND_WEBHOOK_SECRET = Deno.env.get('RESEND_WEBHOOK_SECRET');
const VERCEL_WEBHOOK_SECRET = Deno.env.get('VERCEL_WEBHOOK_SECRET');
const POLAR_WEBHOOK_SECRET = Deno.env.get('POLAR_WEBHOOK_SECRET');

export interface WebhookIdentification {
  source: WebhookSource;
  verified: boolean;
  error?: string;
}

export interface ExtractedWebhookFields {
  type: string | null;
  createdAt: string | null;
  idempotencyKey: string | null;
}

interface WebhookPayload {
  type?: string;
  event?: string;
  created_at?: string;
  createdAt?: string | number;
  timestamp?: string;
  id?: string;
  [key: string]: unknown;
}

export async function identifyAndVerifyWebhook(
  body: string,
  headers: Headers
): Promise<WebhookIdentification> {
  const svixId = headers.get('svix-id');
  const svixTimestamp = headers.get('svix-timestamp');
  const svixSignature = headers.get('svix-signature');

  if (svixId && svixTimestamp && svixSignature) {
    if (!RESEND_WEBHOOK_SECRET) {
      return {
        source: 'resend',
        verified: false,
        error: 'RESEND_WEBHOOK_SECRET not configured',
      };
    }

    const verified = await verifySvixSignature(
      body,
      svixId,
      svixTimestamp,
      svixSignature,
      RESEND_WEBHOOK_SECRET
    );

    return {
      source: 'resend',
      verified,
      error: verified ? undefined : 'Svix signature verification failed',
    };
  }

  const vercelSignature = headers.get('x-vercel-signature');
  if (vercelSignature) {
    if (!VERCEL_WEBHOOK_SECRET) {
      return {
        source: 'vercel',
        verified: false,
        error: 'VERCEL_WEBHOOK_SECRET not configured',
      };
    }

    const verified = await verifyVercelSignature(body, vercelSignature, VERCEL_WEBHOOK_SECRET);
    return {
      source: 'vercel',
      verified,
      error: verified ? undefined : 'Vercel signature verification failed',
    };
  }

  const polarId = headers.get('webhook-id');
  const polarTimestamp = headers.get('webhook-timestamp');
  const polarSignature = headers.get('webhook-signature');

  if (polarId && polarTimestamp && polarSignature) {
    if (!POLAR_WEBHOOK_SECRET) {
      return {
        source: 'polar',
        verified: false,
        error: 'POLAR_WEBHOOK_SECRET not configured',
      };
    }

    const verified = await verifySvixSignature(
      body,
      polarId,
      polarTimestamp,
      polarSignature,
      POLAR_WEBHOOK_SECRET
    );

    return {
      source: 'polar',
      verified,
      error: verified ? undefined : 'Polar signature verification failed',
    };
  }

  return {
    source: 'custom',
    verified: false,
    error: 'No recognized webhook signature headers',
  };
}

export function extractWebhookFields(
  source: WebhookSource,
  payload: WebhookPayload,
  headers: Headers
): ExtractedWebhookFields {
  switch (source) {
    case 'resend':
      return {
        type: payload.type || null,
        createdAt: payload.created_at || null,
        idempotencyKey: headers.get('svix-id'),
      };

    case 'vercel':
      return {
        type: payload.type || null,
        createdAt: payload.createdAt
          ? new Date(Number(payload.createdAt)).toISOString()
          : new Date().toISOString(),
        idempotencyKey: payload.id || headers.get('x-vercel-id') || null,
      };

    case 'polar':
      return {
        type: payload.type || null,
        createdAt: payload.timestamp || null,
        idempotencyKey: headers.get('webhook-id'),
      };

    default:
      return {
        type: payload.type || payload.event || null,
        createdAt: payload.created_at || payload.timestamp || null,
        idempotencyKey: payload.id || null,
      };
  }
}

async function verifySvixSignature(
  body: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  secret: string
): Promise<boolean> {
  try {
    const signatures = svixSignature.split(' ').map((sig) => sig.split(',')[1]);
    const signedContent = `${svixId}.${svixTimestamp}.${body}`;

    let secretBytes: Uint8Array;
    if (secret.startsWith('whsec_')) {
      const base64Secret = secret.substring(6);
      secretBytes = Uint8Array.from(atob(base64Secret), (c) => c.charCodeAt(0));
    } else {
      const encoder = new TextEncoder();
      secretBytes = encoder.encode(secret);
    }

    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const encoder = new TextEncoder();
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signedContent));
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));

    return signatures.some((sig) => sig === expectedSignature);
  } catch (error) {
    console.error('Svix signature verification error:', error);
    return false;
  }
}
