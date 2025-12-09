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

type ContentCategory = DatabaseGenerated['public']['Enums']['content_category'];

import { createSupabaseAdminClient } from '../../supabase/admin';
import { logger, createWebAppContextWithId } from '../../logging/server';
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
 * 
 * Vercel sends webhook signatures in the x-vercel-signature header.
 * The signature is an HMAC-SHA256 of the raw request body.
 * 
 * @see https://vercel.com/docs/observability/webhooks-overview/webhooks-api#securing-webhooks
 */
function verifyVercelSignature(body: string, headers: Headers): boolean {
  const secret = process.env['VERCEL_WEBHOOK_SECRET'];
  if (!secret) {
    logger.warn({ hasHeader: !!headers.get('x-vercel-signature'), }, 'VERCEL_WEBHOOK_SECRET not configured, skipping signature verification');
    return true; // Allow but log warning - set secret to enforce verification
  }

  const signature = headers.get('x-vercel-signature');
  if (!signature) {
    logger.warn({}, 'Vercel webhook missing x-vercel-signature header');
    return false;
  }

  try {
    // Vercel uses HMAC-SHA256 of the raw request body
    const expectedSignature = createHmac('sha256', secret)
      .update(body, 'utf8') // Ensure UTF-8 encoding
      .digest('hex');
    
    // Vercel signature might be in different formats:
    // 1. Plain hex string
    // 2. Prefixed with "sha256="
    // Try both formats
    const normalizedSignature = signature.startsWith('sha256=')
      ? signature.slice(7) // Remove "sha256=" prefix
      : signature;
    
    // Constant-time comparison to prevent timing attacks
    const sigBuffer = Buffer.from(normalizedSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (sigBuffer.length !== expectedBuffer.length) {
      logger.warn({ receivedLength: sigBuffer.length,
        expectedLength: expectedBuffer.length,
        hasPrefix: signature.startsWith('sha256='), }, 'Vercel webhook signature length mismatch');
      return false;
    }
    
    const isValid = timingSafeEqual(sigBuffer, expectedBuffer);
    
    if (!isValid) {
      logger.warn({ hasSecret: !!secret,
        signatureLength: normalizedSignature.length,
        expectedLength: expectedSignature.length,
        hasPrefix: signature.startsWith('sha256='), }, 'Vercel webhook signature verification failed');
    }
    
    return isValid;
  } catch (error) {
    logger.warn({ err: normalizeError(error, 'Signature verification exception'),
      signatureLength: signature.length, }, 'Vercel webhook signature verification error');
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
    logger.warn({ source }, `${secretEnvVar} not configured, skipping signature verification`);
    return true; // Allow but log warning - set secret to enforce verification
  }

  // Extract headers based on source (Polar uses webhook-*, Resend uses svix-*)
  const svixId = headers.get(source === 'polar' ? 'webhook-id' : 'svix-id');
  const svixTimestamp = headers.get(source === 'polar' ? 'webhook-timestamp' : 'svix-timestamp');
  const svixSignature = headers.get(source === 'polar' ? 'webhook-signature' : 'svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    logger.warn({ source }, 'Missing required webhook signature headers');
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
    logger.warn({ source, svixId }, 'Webhook signature verification failed');
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
      logger.warn({}, 'Polar webhook signature verification failed');
      return null;
    }
    return 'polar';
  }

  // Check for Resend signature (uses svix)
  if (headers.get('svix-id') && headers.get('svix-signature')) {
    if (!(await verifySvixWebhookSignature('resend', body, headers))) {
      logger.warn({}, 'Resend webhook signature verification failed');
      return null;
    }
    return 'resend';
  }

  // Check for Vercel webhook
  if (headers.get('x-vercel-signature')) {
    if (!verifyVercelSignature(body, headers)) {
      logger.warn({}, 'Vercel webhook signature verification failed');
      return null;
    }
    return 'vercel';
  }

  // Check for Supabase database webhook
  const supabaseSignature = headers.get('x-supabase-signature') || 
                           headers.get('x-webhook-signature') ||
                           headers.get('x-signature');
  const supabaseTimestamp = headers.get('x-webhook-timestamp') || 
                            headers.get('x-timestamp');
  
  if (supabaseSignature) {
    // Verify Supabase database webhook signature
    const webhookSecret = process.env['INTERNAL_API_SECRET'];
    if (!webhookSecret) {
      logger.warn({}, 'INTERNAL_API_SECRET not configured, cannot verify Supabase webhook');
      return null;
    }

    // Dynamic import to avoid circular dependencies
    const { verifySupabaseDatabaseWebhook } = await import('@heyclaude/shared-runtime');
    const isValid = await verifySupabaseDatabaseWebhook({
      rawBody: body,
      secret: webhookSecret,
      signature: supabaseSignature,
      timestamp: supabaseTimestamp || null,
    });

    if (!isValid) {
      logger.warn({}, 'Supabase database webhook signature verification failed');
      return null;
    }
    return 'supabase_db';
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

  // Map Supabase database webhook events
  if (source === 'supabase_db') {
    if (eventType === 'INSERT') {
      return 'content_announcement_create' as WebhookEventType;
    }
    if (eventType === 'UPDATE') {
      return 'content_announcement_update' as WebhookEventType;
    }
    // DELETE events don't need package generation
    return 'webhook_received' as WebhookEventType;
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
    case 'supabase_db':
      // Supabase database webhooks use record.id as unique identifier
      svixId = (payload['record'] as Record<string, unknown>)?.['id'] as string | null ||
               headers.get('x-request-id') || 
               null;
      // Type-safe event type extraction
      const dbEventType = payload['type'] as string | undefined;
      eventTypeRaw = dbEventType && ['INSERT', 'UPDATE', 'DELETE'].includes(dbEventType) 
        ? dbEventType 
        : undefined;
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

  logger.info({ ...logContext,
    eventType,
    webhookId, }, 'Forwarding Polar webhook to Inngest');

  // Validate webhookId (required for idempotency)
  if (!webhookId) {
    logger.warn({ ...logContext,
      eventType,
      svixId, }, 'Polar webhook missing webhookId, cannot forward to Inngest');
    return { forwarded: false, error: 'Missing webhookId' };
  }

  // Check if this is a supported event type
  if (!POLAR_SUPPORTED_EVENTS.includes(eventType as PolarEventType)) {
    logger.info({ ...logContext,
      eventType,
      supportedEvents: POLAR_SUPPORTED_EVENTS.join(', '), }, 'Polar event type not in supported list');
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

    logger.info({ ...logContext,
      eventType,
      webhookId,
      jobId: jobId ?? null,
      userId: userId ?? null, }, 'Polar webhook forwarded to Inngest');

    return { forwarded: true, eventName: 'polar/webhook' };
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to forward Polar webhook to Inngest');
    logger.error({ err: normalized, ...logContext,
      eventType,
      webhookId, }, 'Polar webhook forwarding failed');

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

  logger.info({ ...logContext,
    eventType, }, 'Processing Resend webhook');

  // Validate event type
  if (!RESEND_EVENT_TYPES.includes(eventType as ResendEventType)) {
    logger.info({ ...logContext,
      eventType,
      supportedTypes: RESEND_EVENT_TYPES.join(', '), }, 'Unhandled Resend event type');
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
    logger.warn({ ...logContext,
      eventType,
      hasEmailId: !!emailId, }, 'Resend webhook missing required email_id field');
    return { forwarded: false };
  }
  
  if (!from || typeof from !== 'string') {
    logger.warn({ ...logContext,
      eventType,
      emailId,
      hasFrom: !!from, }, 'Resend webhook missing required from field');
    return { forwarded: false };
  }
  
  if (!to || !Array.isArray(to) || to.length === 0) {
    logger.warn({ ...logContext,
      eventType,
      emailId,
      hasTo: !!to, }, 'Resend webhook missing required to field');
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

    logger.info({ ...logContext,
      eventType,
      eventName,
      emailId: eventData.email_id, }, 'Resend event forwarded to Inngest');

    return { forwarded: true, eventName };
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to forward Resend event to Inngest');
    logger.error({ err: normalized, ...logContext,
      eventType, }, 'Resend event forwarding failed');
    
    // Don't fail the webhook - log and continue
    // The event is already recorded in webhook_events table
    return { forwarded: false };
  }
}

/**
 * Process Supabase database webhook events
 * 
 * Forwards content change events to Inngest for durable processing.
 * This enables:
 * - Automatic package generation (skills, MCPB) when content is added/updated
 * - GitHub Actions workflow triggers
 * - Idempotent processing with automatic retries
 */
async function processSupabaseWebhook(
  result: WebhookIngestResult,
  logContext: Record<string, unknown>
): Promise<{ forwarded: boolean; eventName?: string; error?: string }> {
  const { eventType, payload, webhookId, svixId } = result;

  logger.info({ ...logContext,
    eventType,
    webhookId, }, 'Processing Supabase database webhook');

  // Validate webhookId (required for idempotency)
  if (!webhookId) {
    logger.warn({ ...logContext,
      eventType,
      svixId, }, 'Supabase webhook missing webhookId, cannot forward to Inngest');
    return { forwarded: false, error: 'Missing webhookId' };
  }

  // Validate payload structure (Supabase database webhook format)
  const record = payload['record'] as Record<string, unknown> | undefined;
  const oldRecord = payload['old_record'] as Record<string, unknown> | null | undefined;
  const table = payload['table'] as string | undefined;
  const schema = payload['schema'] as string | undefined;

  if (!record || !table || !schema) {
    logger.warn({ ...logContext,
      eventType,
      hasRecord: !!record,
      hasTable: !!table,
      hasSchema: !!schema, }, 'Supabase webhook missing required fields');
    return { forwarded: false, error: 'Invalid webhook payload structure' };
  }

  // Only process content table changes
  if (table !== 'content' || schema !== 'public') {
    logger.info({ ...logContext,
      eventType,
      table,
      schema, }, 'Supabase webhook for non-content table, skipping');
    return { forwarded: false };
  }

  // Extract content metadata
  const contentId = record['id'] as string | undefined;
  const category = record['category'] as string | undefined;
  const slug = record['slug'] as string | undefined;

  if (!contentId || !category) {
    logger.warn({ ...logContext,
      eventType,
      hasContentId: !!contentId,
      hasCategory: !!category, }, 'Supabase webhook missing content metadata');
    return { forwarded: false, error: 'Missing content metadata' };
  }

  // Forward ALL content changes to Inngest (not just skills/mcp)
  // Inngest function will decide what actions to take:
  // - Package generation for skills/mcp
  // - README update for all categories

  // Forward to Inngest for durable processing
  try {
    // Dynamic import to avoid circular dependencies
    const { inngest } = await import('../../inngest/client');

    // Type-safe event type casting
    const dbEventType = eventType as 'INSERT' | 'UPDATE' | 'DELETE';
    if (!['INSERT', 'UPDATE', 'DELETE'].includes(dbEventType)) {
      logger.warn({ ...logContext,
        eventType,
        webhookId, }, 'Invalid Supabase event type');
      return { forwarded: false, error: `Invalid event type: ${eventType}` };
    }

    // Forward all content categories to Inngest
    // Inngest function will handle package generation (skills/mcp) and README updates (all categories)
    await inngest.send({
      name: 'supabase/content-changed',
      data: {
        webhookId,
        svixId,
        eventType: dbEventType,
        category: category as ContentCategory,
        contentId,
        slug: slug ?? undefined,
        record,
        oldRecord: oldRecord ?? undefined,
        payload,
      },
    });

    logger.info({ ...logContext,
      eventType,
      webhookId,
      category,
      contentId,
      slug: slug ?? null, }, 'Supabase webhook forwarded to Inngest');

    return { forwarded: true, eventName: 'supabase/content-changed' };
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to forward Supabase webhook to Inngest');
    logger.error({ err: normalized, ...logContext,
      eventType,
      webhookId,
      category,
      contentId, }, 'Supabase webhook forwarding failed');
    
    // Don't fail the webhook - log and continue
    // The event is already recorded in webhook_events table
    return { forwarded: false, error: normalized.message };
  }
}

/**
 * POST /api/flux/webhook/external
 * Process external webhooks from Polar, Resend, Vercel, etc.
 */
export async function handleExternalWebhook(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const logContext = createWebAppContextWithId(
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
      logger.info({ ...logContext,
        source: result.source,
        svixId: result.svixId,
        duplicate: true, }, 'Webhook already processed');
    } else {
      logger.info({ ...logContext,
        source: result.source,
        eventType: result.eventType,
        svixId: result.svixId,
        webhookId: result.webhookId, }, 'Webhook ingested');

      // Process based on source - Polar, Resend, and Supabase forward to Inngest
      if (result.source === 'polar') {
        processingResult = await processPolarWebhook(result, logContext);
      } else if (result.source === 'resend') {
        processingResult = await processResendWebhook(result, logContext);
      } else if (result.source === 'supabase_db') {
        processingResult = await processSupabaseWebhook(result, logContext);
      }
    }

    const durationMs = Date.now() - startTime;
    logger.info({ ...logContext,
      durationMs,
      source: result.source,
      duplicate: result.duplicate,
      forwarded: processingResult.forwarded,
      eventName: processingResult.eventName, }, 'Webhook processing completed');

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
    logger.error({ err: normalized, ...logContext }, 'Webhook processing failed');

    return createErrorResponse(error, {
      route: '/api/flux/webhook/external',
      operation: 'POST',
      method: 'POST',
      logContext: {},
    });
  }
}
