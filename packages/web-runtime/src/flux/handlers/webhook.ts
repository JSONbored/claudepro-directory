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
  webhookId: string | null; // Database ID for webhook_events record
  duplicate: boolean;
  payload: Record<string, unknown>;
}

/**
 * Polar events that we forward to Inngest for durable processing
 * All payment-related events are processed via Inngest for reliability
 */
const POLAR_SUPPORTED_EVENTS = [
  // Order events (payment completion)
  'order.paid',
  'order.refunded',
  'order.created',
  // Subscription events
  'subscription.active',
  'subscription.canceled',
  'subscription.revoked',
  // Checkout events (informational)
  'checkout.created',
  'checkout.updated',
] as const;

type PolarEventType = (typeof POLAR_SUPPORTED_EVENTS)[number];

// Helper to extract metadata from Polar payload
function getPolarMetadataValue<T = unknown>(payload: Record<string, unknown>, key: string): T | undefined {
  // Polar wraps data in a 'data' object, and metadata is nested within
  const data = payload['data'];
  if (data && typeof data === 'object') {
    const dataObj = data as Record<string, unknown>;
    const metadata = dataObj['metadata'];
    if (metadata && typeof metadata === 'object') {
      const metaObj = metadata as Record<string, unknown>;
      return metaObj[key] as T | undefined;
    }
  }
  return undefined;
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
  let webhookId: string | null = null;
  
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
      webhookId = existing.id;
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
      
      const { data: insertedEvent, error: insertError } = await supabase
        .from('webhook_events')
        .insert(insertData)
        .select('id')
        .single();
        
      if (insertError) {
        throw new Error(`Failed to record webhook event: ${insertError.message}`);
      }
      
      webhookId = insertedEvent?.id ?? null;
    }
  }

  return {
    source,
    eventType: eventTypeRaw || 'unknown',
    svixId,
    webhookId,
    duplicate,
    payload,
  };
}

/**
 * Process Polar webhook events via Inngest
 * 
 * Forwards all Polar events to Inngest for durable, idempotent processing.
 * This provides:
 * - Automatic retries on failure
 * - Idempotency via webhookId
 * - Better observability in Inngest dashboard
 * - Decoupled from webhook response time
 * 
 * The Inngest function handles:
 * - order.paid → Activates job listing after payment
 * - order.refunded → Handles refund processing
 * - subscription.* → Handles subscription lifecycle
 * - checkout.* → Logged for analytics
 */
async function processPolarWebhook(
  result: WebhookIngestResult,
  logContext: Record<string, unknown>
): Promise<{ forwarded: boolean; eventName?: string; error?: string }> {
  const { eventType, payload, webhookId, svixId } = result;

  logger.info('Forwarding Polar webhook to Inngest', {
    ...logContext,
    eventType,
    webhookId,
  });

  // Validate webhookId (required for idempotency)
  if (!webhookId) {
    logger.warn('Polar webhook missing webhookId, cannot forward to Inngest', {
      ...logContext,
      eventType,
      svixId,
    });
    return { forwarded: false, error: 'Missing webhookId' };
  }

  // Check if this is a supported event type
  if (!POLAR_SUPPORTED_EVENTS.includes(eventType as PolarEventType)) {
    logger.info('Polar event type not in supported list', {
      ...logContext,
      eventType,
      supportedEvents: POLAR_SUPPORTED_EVENTS.join(', '),
    });
    // Still return success - event is recorded but not forwarded
    return { forwarded: false };
  }

  // Extract metadata for the Inngest event
  const jobId = getPolarMetadataValue<string>(payload, 'job_id');
  const userId = getPolarMetadataValue<string>(payload, 'user_id');

  try {
    // Dynamic import to avoid circular dependencies
    const { inngest } = await import('../../inngest/client');

    await inngest.send({
      name: 'polar/webhook',
      data: {
        eventType,
        webhookId,
        svixId,
        payload,
        jobId: jobId ?? undefined,
        userId: userId ?? undefined,
      },
    });

    logger.info('Polar webhook forwarded to Inngest', {
      ...logContext,
      eventType,
      webhookId,
      jobId: jobId ?? null,
      userId: userId ?? null,
    });

    return { forwarded: true, eventName: 'polar/webhook' };
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to forward Polar webhook to Inngest');
    logger.error('Polar webhook forwarding failed', normalized, {
      ...logContext,
      eventType,
      webhookId,
    });

    // Return error but don't fail the webhook
    // The event is recorded in webhook_events table for manual retry
    return { forwarded: false, error: normalized.message };
  }
}

/**
 * Valid Resend event types that we forward to Inngest
 */
const RESEND_EVENT_TYPES = [
  'email.sent',
  'email.delivered',
  'email.delivery_delayed',
  'email.bounced',
  'email.complained',
  'email.opened',
  'email.clicked',
] as const;

type ResendEventType = typeof RESEND_EVENT_TYPES[number];

/**
 * Process Resend webhook events
 * 
 * Forwards all Resend events to Inngest for durable processing.
 * This enables:
 * - Automatic list hygiene (bounce/complaint handling)
 * - Engagement tracking (opens/clicks)
 * - Dynamic drip campaigns based on user behavior
 */
async function processResendWebhook(
  result: WebhookIngestResult,
  logContext: Record<string, unknown>
): Promise<{ forwarded: boolean; eventName?: string }> {
  const { eventType, payload } = result;

  logger.info('Processing Resend webhook', {
    ...logContext,
    eventType,
  });

  // Validate event type
  if (!RESEND_EVENT_TYPES.includes(eventType as ResendEventType)) {
    logger.info('Unhandled Resend event type', {
      ...logContext,
      eventType,
      supportedTypes: RESEND_EVENT_TYPES.join(', '),
    });
    return { forwarded: false };
  }

  // Extract email data from payload
  const emailData = payload['data'] as Record<string, unknown> | undefined;
  
  // Validate required fields before forwarding to Inngest
  const emailId = emailData?.['email_id'];
  const from = emailData?.['from'];
  const to = emailData?.['to'] as string[] | undefined;
  const subject = emailData?.['subject'];
  
  if (!emailId || typeof emailId !== 'string') {
    logger.warn('Resend webhook missing required email_id field', {
      ...logContext,
      eventType,
      hasEmailId: !!emailId,
    });
    return { forwarded: false };
  }
  
  if (!from || typeof from !== 'string') {
    logger.warn('Resend webhook missing required from field', {
      ...logContext,
      eventType,
      emailId,
      hasFrom: !!from,
    });
    return { forwarded: false };
  }
  
  if (!to || !Array.isArray(to) || to.length === 0) {
    logger.warn('Resend webhook missing required to field', {
      ...logContext,
      eventType,
      emailId,
      hasTo: !!to,
    });
    return { forwarded: false };
  }
  
  // Forward to Inngest for durable processing
  try {
    // Dynamic import to avoid circular dependencies
    const { inngest } = await import('../../inngest/client');
    
    const eventName = `resend/${eventType}` as `resend/${ResendEventType}`;
    
    // Build the event data from the validated payload
    const clickData = emailData?.['click'];
    const eventData: {
      created_at: string;
      email_id: string;
      from: string;
      to: string[];
      subject: string;
      click?: { link: string };
    } = {
      created_at: String(emailData?.['created_at'] ?? new Date().toISOString()),
      email_id: emailId,
      from: from,
      to: to,
      subject: String(subject ?? ''),
    };
    
    if (clickData && typeof clickData === 'object') {
      eventData.click = clickData as { link: string };
    }
    
    await inngest.send({
      name: eventName,
      data: eventData,
    });

    logger.info('Resend event forwarded to Inngest', {
      ...logContext,
      eventType,
      eventName,
      emailId: eventData.email_id,
    });

    return { forwarded: true, eventName };
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to forward Resend event to Inngest');
    logger.error('Resend event forwarding failed', normalized, {
      ...logContext,
      eventType,
    });
    
    // Don't fail the webhook - log and continue
    // The event is already recorded in webhook_events table
    return { forwarded: false };
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

    let processingResult: { forwarded?: boolean; eventName?: string; error?: string } = {};

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
        webhookId: result.webhookId,
      });

      // Process based on source - both Polar and Resend forward to Inngest
      if (result.source === 'polar') {
        processingResult = await processPolarWebhook(result, logContext);
      } else if (result.source === 'resend') {
        processingResult = await processResendWebhook(result, logContext);
      }
    }

    const durationMs = Date.now() - startTime;
    logger.info('Webhook processing completed', {
      ...logContext,
      durationMs,
      source: result.source,
      duplicate: result.duplicate,
      forwarded: processingResult.forwarded,
      eventName: processingResult.eventName,
    });

    return NextResponse.json(
      { 
        message: 'OK', 
        source: result.source, 
        duplicate: result.duplicate,
        webhookId: result.webhookId,
        forwarded: processingResult.forwarded,
        ...(processingResult.eventName && { eventName: processingResult.eventName }),
      },
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
