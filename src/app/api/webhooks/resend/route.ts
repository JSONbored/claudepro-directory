/**
 * Resend Webhook Endpoint
 * Handles webhook events from Resend (via Svix) for email deliverability and analytics
 *
 * Security Layers:
 * 1. Middleware (Arcjet) - Bot detection, WAF, rate limiting (60 req/min)
 * 2. Svix Signature Verification - Cryptographic proof of authenticity
 * 3. Idempotency Protection - Database UNIQUE constraint on svix_id prevents replay attacks
 * 4. Zod Validation - Schema validation
 *
 * Events Handled:
 * - email.bounced: Track and auto-remove bad emails
 * - email.complained: Instant removal for spam complaints
 * - email.opened: Analytics tracking (future)
 * - email.clicked: Analytics tracking (future)
 * - email.delivery_delayed: Monitoring
 */

import type { NextRequest } from 'next/server';
import { Webhook } from 'svix';
import { z } from 'zod';
import { apiResponse, handleApiError } from '@/src/lib/error-handler';
import { logger } from '@/src/lib/logger';
import { env } from '@/src/lib/schemas/env.schema';
import { publicWebhookEventsInsertSchema } from '@/src/lib/schemas/generated/db-schemas';
import { webhookService } from '@/src/lib/services/webhook.server';

// Create validation schema from database schema (for webhook payload structure)
// Database schema defines the structure, we validate incoming data against it
const resendWebhookEventSchema = z.object({
  type: publicWebhookEventsInsertSchema.shape.type,
  created_at: z.string().datetime(),
  data: z
    .object({
      created_at: z.string().datetime().optional(),
      email_id: z.string().uuid().optional(),
      from: z.string().email().optional(),
      to: z.union([z.string().email(), z.array(z.string().email())]).optional(),
      subject: z.string().optional(),
      // Flexible for different event types
    })
    .passthrough(), // Allow additional fields per event type
});

// Force Node.js runtime (required for Svix crypto operations)

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

  // Idempotency via PostgreSQL UNIQUE constraint on svix_id
  // Database automatically rejects duplicate svix_id inserts

  // Rate limiting handled by Arcjet in middleware
  // Arcjet provides comprehensive rate limiting for all requests

  // Process webhook event asynchronously (don't block response)
  // Resend expects fast 200 responses (<5 seconds)
  // Type is validated by Zod schema, safe to pass to service
  webhookService
    .processEvent(event as Parameters<typeof webhookService.processEvent>[0])
    .catch((err) => {
      logger.error(
        'Webhook event processing failed',
        err instanceof Error ? err : new Error(String(err)),
        {
          eventType: event.type,
          emailId: event.data.email_id ?? 'unknown',
          svixId,
        }
      );
    });

  // Return success immediately (no envelope for webhook acknowledgement)
  return apiResponse.okRaw(
    {
      received: true,
      eventType: event.type,
      timestamp: new Date().toISOString(),
    },
    { sMaxAge: 0, staleWhileRevalidate: 0 }
  );
}
