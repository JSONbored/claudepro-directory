/**
 * Webhook Handlers
 *
 * Handles external webhook operations:
 * - POST /api/flux/webhook/external - Process external webhooks (Polar, Resend, Vercel)
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import type { Database as DatabaseGenerated, Json } from '@heyclaude/database-types';
import { normalizeError, verifySvixSignature } from '@heyclaude/shared-runtime';

import { createSupabaseAdminClient } from '../../supabase/admin';
import { logger, generateRequestId, createWebAppContextWithId } from '../../logging/server';
import { createErrorResponse } from '../../utils/error-handler';

// CORS headers - Webhooks are server-to-server and don't need browser CORS
// Restricting to empty origin (no CORS) is safer but may break some setups
// Use environment variable to override if needed
const WEBHOOK_CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env['WEBHOOK_ALLOWED_ORIGIN'] || '',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Webhook-Source, X-Signature',
};

// Max body size (256KB for webhooks)
const MAX_WEBHOOK_BODY_SIZE = 262144;

// Valid webhook sources from database enum
type WebhookSource = DatabaseGenerated['public']['Enums']['webhook_source'];
type WebhookEventType = DatabaseGenerated['public']['Enums']['webhook_event_type'];

interface WebhookIngestResult {
  source: WebhookSource;
  eventType: string;
  svixId: string | null;
  duplicate: boolean;
  payload: Record<string, unknown>;
}

/**
 * Verify Vercel webhook signature using HMAC
 */
function verifyVercelSignature(body: string, headers: Headers): boolean {
  const secret = process.env['VERCEL_WEBHOOK_SECRET'];
  if (!secret) {
    logger.warn('VERCEL_WEBHOOK_SECRET not configured, skipping signature verification');
    return true; // Allow but log warning - set secret to enforce verification
  }

  const signature = headers.get('x-vercel-signature');
  if (!signature) {
    return false;
  }

  try {
    const expectedSignature = createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    // Constant-time comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    return timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Verify Polar/Resend webhook signature using shared-runtime crypto utilities
 */
async function verifySvixWebhookSignature(source: 'polar' | 'resend', body: string, headers: Headers): Promise<boolean> {
  const secretEnvVar = source === 'polar' ? 'POLAR_WEBHOOK_SECRET' : 'RESEND_WEBHOOK_SECRET';
  const secret = process.env[secretEnvVar];
  
  if (!secret) {
    logger.warn(`${secretEnvVar} not configured, skipping signature verification`, { source });
    return true; // Allow but log warning - set secret to enforce verification
  }

  // Extract headers based on source (Polar uses webhook-*, Resend uses svix-*)
  const svixId = headers.get(source === 'polar' ? 'webhook-id' : 'svix-id');
  const svixTimestamp = headers.get(source === 'polar' ? 'webhook-timestamp' : 'svix-timestamp');
  const svixSignature = headers.get(source === 'polar' ? 'webhook-signature' : 'svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    logger.warn('Missing required webhook signature headers', { source });
    return false;
  }

  // Use shared-runtime's verifySvixSignature
  const isValid = await verifySvixSignature({
    rawBody: body,
    secret,
    svixId,
    svixTimestamp,
    svixSignature,
  });

  if (!isValid) {
    logger.warn('Webhook signature verification failed', { source, svixId });
  }

  return isValid;
}

/**
 * Detect webhook source from headers and verify signature
 */
async function detectAndVerifyWebhookSource(headers: Headers, body: string): Promise<WebhookSource | null> {
  // Check explicit header first
  const explicitSource = headers.get('X-Webhook-Source');
  if (explicitSource) {
    const normalized = explicitSource.toLowerCase();
    if (['polar', 'resend', 'vercel', 'discord', 'supabase_db', 'custom'].includes(normalized)) {
      return normalized as WebhookSource;
    }
  }

  // Check for Polar signature
  if (headers.get('webhook-id') && headers.get('webhook-signature')) {
    if (!(await verifySvixWebhookSignature('polar', body, headers))) {
      logger.warn('Polar webhook signature verification failed');
      return null;
    }
    return 'polar';
  }

  // Check for Resend signature (uses svix)
  if (headers.get('svix-id') && headers.get('svix-signature')) {
    if (!(await verifySvixWebhookSignature('resend', body, headers))) {
      logger.warn('Resend webhook signature verification failed');
      return null;
    }
    return 'resend';
  }

  // Check for Vercel webhook
  if (headers.get('x-vercel-signature')) {
    if (!verifyVercelSignature(body, headers)) {
      logger.warn('Vercel webhook signature verification failed');
      return null;
    }
    return 'vercel';
  }

  return null;
}

/**
 * Map external event type to database enum
 */
function mapEventType(source: WebhookSource, eventType: string | undefined): WebhookEventType {
  // Map known event types to our enum values
  if (source === 'vercel' && eventType === 'deployment') {
    return 'deployment.succeeded';
  }
  
  // TODO: Add more event type mappings as needed
  // Currently defaults to 'webhook_received' for unmapped types
  // This is more semantically accurate than 'content_announcement_create'
  return 'webhook_received' as WebhookEventType;
}

/**
 * Ingest and deduplicate webhook event
 */
async function ingestWebhookEvent(
  body: string,
  headers: Headers
): Promise<WebhookIngestResult> {
  const source = await detectAndVerifyWebhookSource(headers, body);
  
  if (!source) {
    throw new Error('Unknown or unverified webhook source');
  }
  
  let payload: Record<string, unknown>;

  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    throw new Error('Invalid JSON payload');
  }

  // Extract event ID for deduplication (svix_id)
  let svixId: string | null = null;
  let eventTypeRaw: string | undefined;

  switch (source) {
    case 'polar':
      svixId = headers.get('webhook-id');
      eventTypeRaw = payload['type'] as string | undefined;
      break;
    case 'resend':
      svixId = headers.get('svix-id');
      eventTypeRaw = payload['type'] as string | undefined;
      break;
    case 'vercel':
      svixId = payload['id'] as string | null;
      eventTypeRaw = payload['type'] as string | undefined;
      break;
    default:
      svixId = headers.get('x-request-id') || null;
      eventTypeRaw = payload['type'] as string | undefined;
  }

  // Check for duplicate using svix_id
  let duplicate = false;
  if (svixId) {
    const supabase = createSupabaseAdminClient();
    const { data: existing } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('svix_id', svixId)
      .eq('source', source)
      .maybeSingle();

    if (existing) {
      duplicate = true;
    } else {
      // Record the event with proper column names
      const webhookEventType = mapEventType(source, eventTypeRaw);
      const now = new Date().toISOString();
      
      const insertData: DatabaseGenerated['public']['Tables']['webhook_events']['Insert'] = {
        svix_id: svixId,
        source,
        type: webhookEventType,
        data: payload as Json,
        direction: 'inbound',
        received_at: now,
        created_at: now,
      };
      
      const { error: insertError } = await supabase.from('webhook_events').insert(insertData);
      if (insertError) {
        throw new Error(`Failed to record webhook event: ${insertError.message}`);
      }
    }
  }

  return {
    source,
    eventType: eventTypeRaw || 'unknown',
    svixId,
    duplicate,
    payload,
  };
}

/**
 * Process Polar webhook events
 */
async function processPolarWebhook(
  result: WebhookIngestResult,
  logContext: Record<string, unknown>
): Promise<void> {
  const { eventType, payload } = result;

  logger.info('Processing Polar webhook', {
    ...logContext,
    eventType,
  });

  // Handle specific event types
  switch (eventType) {
    case 'subscription.created':
    case 'subscription.updated':
    case 'subscription.canceled': {
      // Handle subscription events
      const data = payload['data'];
      let subscriptionId: string | undefined;
      if (data && typeof data === 'object') {
        const dataObj = data as Record<string, unknown>;
        const id = dataObj['id'];
        subscriptionId = typeof id === 'string' ? id : undefined;
      }
      logger.info('Polar subscription event', {
        ...logContext,
        eventType,
        subscriptionId,
      });
      break;
    }

    case 'checkout.completed':
      // Handle checkout completion
      logger.info('Polar checkout completed', {
        ...logContext,
        eventType,
      });
      break;

    default:
      logger.info('Unhandled Polar event type', {
        ...logContext,
        eventType,
      });
  }
}

/**
 * Process Resend webhook events
 */
async function processResendWebhook(
  result: WebhookIngestResult,
  logContext: Record<string, unknown>
): Promise<void> {
  const { eventType, payload } = result;

  logger.info('Processing Resend webhook', {
    ...logContext,
    eventType,
  });

  // Handle email events (bounces, complaints, etc.)
  switch (eventType) {
    case 'email.bounced':
    case 'email.complained': {
      // Handle email delivery issues - could update subscriber status
      // Note: email address auto-hashed by pino redaction config
      const emailData = payload['data'] as Record<string, unknown> | undefined;
      const emailTo = emailData?.['to'] as string[] | undefined;
      logger.warn('Email delivery issue', {
        ...logContext,
        eventType,
        email: emailTo?.[0], // Auto-hashed by pino
      });
      break;
    }

    case 'email.delivered':
    case 'email.opened':
    case 'email.clicked':
      // Engagement tracking
      logger.info('Email engagement event', {
        ...logContext,
        eventType,
      });
      break;

    default:
      logger.info('Unhandled Resend event type', {
        ...logContext,
        eventType,
      });
  }
}

/**
 * POST /api/flux/webhook/external
 * Process external webhooks from Polar, Resend, Vercel, etc.
 */
export async function handleExternalWebhook(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const logContext = createWebAppContextWithId(
    requestId,
    '/api/flux/webhook/external',
    'handleExternalWebhook'
  );

  // Validate body size
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_WEBHOOK_BODY_SIZE) {
    return NextResponse.json(
      { error: 'Request body too large' },
      { status: 400, headers: WEBHOOK_CORS_HEADERS }
    );
  }

  try {
    const body = await request.text();

    // Double-check size
    if (body.length > MAX_WEBHOOK_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 400, headers: WEBHOOK_CORS_HEADERS }
      );
    }

    const result = await ingestWebhookEvent(body, request.headers);

    if (result.duplicate) {
      logger.info('Webhook already processed', {
        ...logContext,
        source: result.source,
        svixId: result.svixId,
        duplicate: true,
      });
    } else {
      logger.info('Webhook ingested', {
        ...logContext,
        source: result.source,
        eventType: result.eventType,
        svixId: result.svixId,
      });

      // Process based on source
      if (result.source === 'polar') {
        await processPolarWebhook(result, logContext);
      } else if (result.source === 'resend') {
        await processResendWebhook(result, logContext);
      }
    }

    const durationMs = Date.now() - startTime;
    logger.info('Webhook processing completed', {
      ...logContext,
      durationMs,
      source: result.source,
      duplicate: result.duplicate,
    });

    return NextResponse.json(
      { message: 'OK', source: result.source, duplicate: result.duplicate },
      { status: 200, headers: WEBHOOK_CORS_HEADERS }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Webhook processing failed');
    logger.error('Webhook processing failed', normalized, logContext);

    return createErrorResponse(error, {
      route: '/api/flux/webhook/external',
      operation: 'POST',
      method: 'POST',
      logContext: { requestId },
    });
  }
}
