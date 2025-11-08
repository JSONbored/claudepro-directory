/**
 * Unified Webhook Router - Signature verification + database routing
 */

import type { Database } from '../_shared/database.types.ts';
import {
  badRequestResponse,
  errorResponse,
  methodNotAllowedResponse,
  publicCorsHeaders,
  successResponse,
  unauthorizedResponse,
} from '../_shared/utils/response.ts';
import { supabaseServiceRole } from '../_shared/utils/supabase-service-role.ts';
import { verifyVercelSignature } from '../_shared/utils/vercel.ts';

const RESEND_WEBHOOK_SECRET = Deno.env.get('RESEND_WEBHOOK_SECRET');
const VERCEL_WEBHOOK_SECRET = Deno.env.get('VERCEL_WEBHOOK_SECRET');

// CORS headers with webhook-specific allowed headers
const webhookCorsHeaders = {
  ...publicCorsHeaders,
  'Access-Control-Allow-Headers':
    'Content-Type, svix-id, svix-timestamp, svix-signature, x-vercel-signature',
};

type WebhookSource = Database['public']['Enums']['webhook_source'];

interface WebhookIdentification {
  source: WebhookSource;
  verified: boolean;
  error?: string;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: webhookCorsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return methodNotAllowedResponse('POST', webhookCorsHeaders);
  }

  try {
    // Get raw body and headers
    const body = await req.text();
    const headers = req.headers;

    // Identify webhook source and verify signature
    const identification = await identifyAndVerifyWebhook(body, headers);

    if (!identification.verified) {
      console.error('Webhook verification failed:', identification.error);
      return unauthorizedResponse(
        identification.error || 'Signature verification failed',
        webhookCorsHeaders
      );
    }

    // Parse webhook payload
    const payload = JSON.parse(body);

    // Extract common fields based on source
    const { type, createdAt, idempotencyKey } = extractWebhookFields(
      identification.source,
      payload,
      headers
    );

    if (!type) {
      return badRequestResponse('Missing webhook type field', webhookCorsHeaders);
    }

    // Insert into webhook_events table (trigger will handle routing)
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
      // Check for duplicate (UNIQUE constraint on svix_id = idempotency)
      if (error.code === '23505') {
        console.log(`Webhook already processed (idempotent): ${idempotencyKey}`);
        return successResponse({ message: 'OK', duplicate: true }, 200, webhookCorsHeaders);
      }

      console.error('Failed to insert webhook event:', error);
      return errorResponse(error, 'webhook-router:insert', webhookCorsHeaders);
    }

    console.log(
      `Webhook routed: source=${identification.source}, type=${type}, id=${idempotencyKey}`
    );
    return successResponse(
      { message: 'OK', source: identification.source },
      200,
      webhookCorsHeaders
    );
  } catch (error) {
    return errorResponse(error, 'webhook-router', webhookCorsHeaders);
  }
});

/**
 * Identify webhook source and verify signature
 * Returns source type and verification status
 */
async function identifyAndVerifyWebhook(
  body: string,
  headers: Headers
): Promise<WebhookIdentification> {
  // Check for Resend/Svix headers (Svix HMAC SHA-256)
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

  // Check for Vercel signature (HMAC SHA-1)
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

  // No recognized signature headers
  return {
    source: 'custom',
    verified: false,
    error: 'No recognized webhook signature headers',
  };
}

/**
 * Verify Svix webhook signature (used by Resend)
 * Svix standard: HMAC SHA-256 with rotation support
 */
async function verifySvixSignature(
  body: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  secret: string
): Promise<boolean> {
  try {
    // Svix signature format: "v1,signature1 v1,signature2"
    const signatures = svixSignature.split(' ').map((sig) => sig.split(',')[1]);

    // Construct signed content (Svix standard)
    const signedContent = `${svixId}.${svixTimestamp}.${body}`;

    // Decode secret if it starts with whsec_ (Svix/Resend format)
    let secretBytes: Uint8Array;
    if (secret.startsWith('whsec_')) {
      const base64Secret = secret.substring(6); // Remove 'whsec_' prefix
      secretBytes = Uint8Array.from(atob(base64Secret), (c) => c.charCodeAt(0));
    } else {
      const encoder = new TextEncoder();
      secretBytes = encoder.encode(secret);
    }

    // Import secret as key
    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Generate signature (base64-encoded, not hex)
    const encoder = new TextEncoder();
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signedContent));
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));

    // Compare with any of the provided signatures (Svix sends multiple for rotation)
    return signatures.some((sig) => sig === expectedSignature);
  } catch (error) {
    console.error('Svix signature verification error:', error);
    return false;
  }
}

/**
 * Extract common webhook fields based on source
 * Returns normalized type, created_at, and idempotency key
 */
interface WebhookPayload {
  type?: string;
  event?: string;
  created_at?: string;
  createdAt?: string | number;
  timestamp?: string;
  id?: string;
  [key: string]: unknown;
}

function extractWebhookFields(
  source: WebhookSource,
  payload: WebhookPayload,
  headers: Headers
): {
  type: string | null;
  createdAt: string | null;
  idempotencyKey: string | null;
} {
  switch (source) {
    case 'resend':
      // Resend webhook format
      return {
        type: payload.type || null,
        createdAt: payload.created_at || null,
        idempotencyKey: headers.get('svix-id'),
      };

    case 'vercel':
      // Vercel webhook format
      return {
        type: payload.type || null,
        createdAt: payload.createdAt || new Date().toISOString(),
        idempotencyKey: payload.id || headers.get('x-vercel-id') || null,
      };

    default:
      // Generic webhook format (custom and other sources)
      return {
        type: payload.type || payload.event || null,
        createdAt: payload.created_at || payload.timestamp || null,
        idempotencyKey: payload.id || null,
      };
  }
}
