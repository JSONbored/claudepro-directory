/**
 * Resend Webhook Endpoint
 * Handles webhook events from Resend (via Svix) for email deliverability and analytics
 *
 * Security Layers:
 * 1. Middleware (Arcjet) - Bot detection, WAF, general rate limiting
 * 2. Svix Signature Verification - Cryptographic proof of authenticity
 * 3. Redis Rate Limiting - Per-event-type rate limits
 * 4. Zod Validation - Schema validation
 *
 * Events Handled:
 * - email.bounced: Track and auto-remove bad emails
 * - email.complained: Instant removal for spam complaints
 * - email.opened: Analytics tracking (future)
 * - email.clicked: Analytics tracking (future)
 * - email.delivery_delayed: Monitoring
 */

import { type NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { handleApiError } from '@/src/lib/error-handler';
import { logger } from '@/src/lib/logger';
import { rateLimiters } from '@/src/lib/rate-limiter';
import { env } from '@/src/lib/schemas/env.schema';
import { resendWebhookEventSchema } from '@/src/lib/schemas/webhook.schema';
import { webhookService } from '@/src/lib/services/webhook.service';

// Force Node.js runtime (required for Svix crypto operations)
export const runtime = 'nodejs';

/**
 * POST /api/webhooks/resend
 * Receives and processes webhook events from Resend
 */
export async function POST(request: NextRequest) {
  // Extract webhook signature headers
  const svixId = request.headers.get('svix-id');
  const svixTimestamp = request.headers.get('svix-timestamp');
  const svixSignature = request.headers.get('svix-signature');

  // Verify required headers are present
  if (!(svixId && svixTimestamp && svixSignature)) {
    logger.warn('Webhook request missing Svix headers', undefined, {
      hasSvixId: !!svixId,
      hasSvixTimestamp: !!svixTimestamp,
      hasSvixSignature: !!svixSignature,
    });
    return handleApiError(new Error('Missing signature headers'), {
      route: '/api/webhooks/resend',
      method: 'POST',
      operation: 'webhook_signature_validation',
      customMessage: 'Bad Request: Missing signature headers',
    });
  }

  // Get raw body for signature verification
  const body = await request.text();

  // Verify webhook signature using Svix
  const webhookSecret = env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return handleApiError(new Error('RESEND_WEBHOOK_SECRET not configured'), {
      route: '/api/webhooks/resend',
      method: 'POST',
      operation: 'webhook_config_check',
      logLevel: 'error',
    });
  }

  const wh = new Webhook(webhookSecret);
  let payload: unknown;

  try {
    payload = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as unknown;
  } catch (err) {
    return handleApiError(err instanceof Error ? err : new Error(String(err)), {
      route: '/api/webhooks/resend',
      method: 'POST',
      operation: 'webhook_signature_verification',
      customMessage: 'Unauthorized: Invalid signature',
      logContext: { svixId },
      logLevel: 'error',
    });
  }

  // Parse and validate webhook payload
  const validatedEvent = resendWebhookEventSchema.safeParse(payload);
  if (!validatedEvent.success) {
    return handleApiError(validatedEvent.error, {
      route: '/api/webhooks/resend',
      method: 'POST',
      operation: 'webhook_payload_validation',
      customMessage: 'Bad Request: Invalid payload',
      logContext: { svixId },
      logLevel: 'error',
    });
  }

  const event = validatedEvent.data;

  // Apply rate limiting based on event type
  const isAnalyticsEvent = event.type === 'email.opened' || event.type === 'email.clicked';
  const limiter = isAnalyticsEvent ? rateLimiters.webhookAnalytics : rateLimiters.webhookBounce;

  const rateLimitCheck = await limiter.checkLimit(request);
  if (!rateLimitCheck.success) {
    logger.warn('Webhook rate limit exceeded', {
      eventType: event.type,
      limit: rateLimitCheck.limit,
      retryAfter: rateLimitCheck.retryAfter,
    });
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': String(rateLimitCheck.retryAfter),
      },
    });
  }

  // Process webhook event asynchronously (don't block response)
  // Resend expects fast 200 responses (<5 seconds)
  webhookService.processEvent(event).catch((err) => {
    logger.error(
      'Webhook event processing failed',
      err instanceof Error ? err : new Error(String(err)),
      {
        eventType: event.type,
        emailId: event.data.email_id,
        svixId,
      }
    );
  });

  // Return success immediately
  return NextResponse.json({
    received: true,
    eventType: event.type,
    timestamp: new Date().toISOString(),
  });
}
