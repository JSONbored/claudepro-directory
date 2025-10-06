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
    logger.warn('Webhook request missing Svix headers', {
      hasSvixId: !!svixId,
      hasSvixTimestamp: !!svixTimestamp,
      hasSvixSignature: !!svixSignature,
    });
    return new Response('Bad Request: Missing signature headers', {
      status: 400,
    });
  }

  // Get raw body for signature verification
  const body = await request.text();

  // Verify webhook signature using Svix
  const webhookSecret = env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error('RESEND_WEBHOOK_SECRET not configured', new Error('Missing webhook secret'));
    return new Response('Internal Server Error', { status: 500 });
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
    logger.error(
      'Webhook signature verification failed',
      err instanceof Error ? err : new Error(String(err)),
      {
        svixId,
      }
    );
    return new Response('Unauthorized: Invalid signature', { status: 401 });
  }

  // Parse and validate webhook payload
  const validatedEvent = resendWebhookEventSchema.safeParse(payload);
  if (!validatedEvent.success) {
    logger.error('Invalid webhook payload schema', validatedEvent.error, {
      svixId,
    });
    return new Response('Bad Request: Invalid payload', { status: 400 });
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
