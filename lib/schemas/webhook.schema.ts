/**
 * Webhook Payload Validation Schemas
 * Production-grade validation for webhook payloads
 * Ensures data integrity and prevents webhook injection attacks
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { nonNegativeInt, positiveInt } from '@/lib/schemas/primitives/base-numbers';
import {
  emailString,
  isoDatetimeString,
  nonEmptyString,
  shortString,
  urlString,
} from '@/lib/schemas/primitives/base-strings';

/**
 * Security constants for webhook validation
 */
const WEBHOOK_LIMITS = {
  MAX_PAYLOAD_SIZE: 1048576, // 1MB
  MAX_HEADER_LENGTH: 1000,
  MAX_EVENT_TYPE_LENGTH: 100,
  MAX_URL_LENGTH: 2048,
  MAX_SECRET_LENGTH: 256,
  MAX_RETRY_COUNT: 10,
  MAX_TIMEOUT_MS: 30000,
  MIN_TIMEOUT_MS: 1000,
  MAX_METADATA_KEYS: 50,
  MAX_METADATA_VALUE_LENGTH: 1000,
} as const;

/**
 * Webhook event types
 */
export const webhookEventTypeSchema = z.enum([
  // Content events
  'content.created',
  'content.updated',
  'content.deleted',
  'content.published',
  'content.unpublished',

  // User events
  'user.signup',
  'user.login',
  'user.logout',
  'user.deleted',
  'user.updated',

  // Analytics events
  'analytics.view',
  'analytics.copy',
  'analytics.click',
  'analytics.search',

  // Submission events
  'submission.created',
  'submission.approved',
  'submission.rejected',
  'submission.updated',

  // Cache events
  'cache.warmed',
  'cache.cleared',
  'cache.expired',

  // System events
  'system.deploy',
  'system.error',
  'system.alert',
  'system.health',

  // Custom events
  'custom.event',
]);

/**
 * Webhook signature header validation
 */
export const webhookSignatureHeaderSchema = z.object({
  'x-webhook-signature': nonEmptyString
    .max(WEBHOOK_LIMITS.MAX_HEADER_LENGTH, 'Signature too long')
    .regex(/^[a-zA-Z0-9+/=]+$/, 'Invalid signature format'),
  'x-webhook-timestamp': z.string().regex(/^\d{13}$/, 'Invalid timestamp format'),
  'x-webhook-id': z.string().uuid('Invalid webhook ID format'),
  'x-webhook-event': webhookEventTypeSchema,
  'content-type': z
    .string()
    .regex(/^application\/json(;.*)?$/, 'Content type must be application/json')
    .optional(),
});

/**
 * Base webhook payload
 */
export const baseWebhookPayloadSchema = z.object({
  id: z.string().uuid('Invalid webhook ID'),
  event: webhookEventTypeSchema,
  timestamp: isoDatetimeString,
  data: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number(), z.boolean()])),
    z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  ]), // Will be validated based on event type
  metadata: z
    .record(
      z.string().max(100, 'Metadata key too long'),
      z.union([z.string(), z.number(), z.boolean()]).refine((val) => {
        if (typeof val === 'string') {
          return val.length <= WEBHOOK_LIMITS.MAX_METADATA_VALUE_LENGTH;
        }
        return true;
      }, 'Metadata value too long')
    )
    .refine(
      (data) => Object.keys(data).length <= WEBHOOK_LIMITS.MAX_METADATA_KEYS,
      `Too many metadata keys (max ${WEBHOOK_LIMITS.MAX_METADATA_KEYS})`
    )
    .optional(),
});

/**
 * Content event data schemas
 */
export const contentEventDataSchema = z.object({
  id: z.string(),
  type: z.enum(['agent', 'mcp', 'rule', 'command', 'hook']),
  slug: nonEmptyString
    .max(200, 'String is too long')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Invalid slug format'),
  title: nonEmptyString.max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  category: z.string().max(50, 'Category is too long'),
  tags: z.array(z.string().max(50, 'Tag is too long')).max(20, 'Too many tags').optional(),
  author: shortString.optional(),
  version: z.string().max(20, 'Version is too long').optional(),
  url: urlString.max(WEBHOOK_LIMITS.MAX_URL_LENGTH).optional(),
});

/**
 * User event data schemas
 */
export const userEventDataSchema = z.object({
  id: z.string().uuid(),
  email: emailString.max(255, 'Email is too long'),
  username: nonEmptyString.max(50, 'Username is too long').optional(),
  role: z.enum(['user', 'admin', 'moderator']).optional(),
  createdAt: isoDatetimeString,
  updatedAt: isoDatetimeString.optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

/**
 * Analytics event data schemas
 */
export const analyticsEventDataSchema = z.object({
  category: z.enum(['agents', 'mcp', 'rules', 'commands', 'hooks', 'guides']),
  slug: z.string(),
  action: z.enum(['view', 'copy', 'click', 'search']),
  value: z.number().optional(),
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  url: urlString.optional(),
  referrer: urlString.optional(),
  userAgent: z.string().max(500, 'User agent is too long').optional(),
});

/**
 * Submission event data schemas
 */
export const submissionEventDataSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['agent', 'mcp', 'rule', 'command', 'hook']),
  title: nonEmptyString.max(200, 'Title is too long'),
  description: z.string().max(5000, 'Description is too long'),
  submittedBy: emailString,
  submittedAt: isoDatetimeString,
  status: z.enum(['pending', 'approved', 'rejected', 'reviewing']),
  reviewNotes: z.string().max(1000, 'Review notes are too long').optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

/**
 * Cache event data schemas
 */
export const cacheEventDataSchema = z.object({
  operation: z.enum(['warm', 'clear', 'expire', 'invalidate']),
  categories: z.array(z.string()).optional(),
  keys: z.array(z.string()).optional(),
  duration: positiveInt.optional(),
  success: z.boolean(),
  itemsAffected: nonNegativeInt.optional(),
  error: z.string().optional(),
});

/**
 * System event data schemas
 */
export const systemEventDataSchema = z.object({
  type: z.enum(['deploy', 'error', 'alert', 'health']),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  message: z.string().max(1000, 'Message is too long'),
  details: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  environment: z.enum(['development', 'staging', 'production']).optional(),
  service: shortString.optional(),
  timestamp: isoDatetimeString,
});

/**
 * Custom event data schema (flexible)
 */
export const customEventDataSchema = z.record(
  z.string(),
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number(), z.boolean()])),
  ])
);

/**
 * Map event types to their data schemas
 */
const eventDataSchemas = {
  'content.created': contentEventDataSchema,
  'content.updated': contentEventDataSchema,
  'content.deleted': contentEventDataSchema.pick({ id: true, slug: true, type: true }),
  'content.published': contentEventDataSchema,
  'content.unpublished': contentEventDataSchema.pick({ id: true, slug: true, type: true }),

  'user.signup': userEventDataSchema,
  'user.login': userEventDataSchema.pick({ id: true, email: true }),
  'user.logout': userEventDataSchema.pick({ id: true }),
  'user.deleted': userEventDataSchema.pick({ id: true }),
  'user.updated': userEventDataSchema,

  'analytics.view': analyticsEventDataSchema,
  'analytics.copy': analyticsEventDataSchema,
  'analytics.click': analyticsEventDataSchema,
  'analytics.search': analyticsEventDataSchema,

  'submission.created': submissionEventDataSchema,
  'submission.approved': submissionEventDataSchema,
  'submission.rejected': submissionEventDataSchema,
  'submission.updated': submissionEventDataSchema,

  'cache.warmed': cacheEventDataSchema,
  'cache.cleared': cacheEventDataSchema,
  'cache.expired': cacheEventDataSchema,

  'system.deploy': systemEventDataSchema,
  'system.error': systemEventDataSchema,
  'system.alert': systemEventDataSchema,
  'system.health': systemEventDataSchema,

  'custom.event': customEventDataSchema,
} as const;

/**
 * Complete webhook payload validation
 */
export function validateWebhookPayload(
  payload: z.input<typeof baseWebhookPayloadSchema>,
  eventType?: string
):
  | { success: true; data: z.infer<typeof baseWebhookPayloadSchema> }
  | { success: false; error: string } {
  try {
    // First validate the base structure
    const basePayload = baseWebhookPayloadSchema.parse(payload);

    // Validate the data based on event type
    const eventSchema = eventDataSchemas[basePayload.event as keyof typeof eventDataSchemas];
    if (eventSchema) {
      // Validate the data but don't assign back due to type constraints
      eventSchema.parse(basePayload.data);
    }

    return { success: true, data: basePayload };
  } catch (error) {
    logger.error(
      'Webhook payload validation failed',
      error instanceof Error
        ? error
        : new Error(error instanceof z.ZodError ? error.issues.join(', ') : String(error)),
      {
        eventType: String(eventType || 'none'),
      }
    );
    return { success: false, error: 'Webhook payload validation failed' };
  }
}

/**
 * Webhook configuration schema
 */
export const webhookConfigSchema = z.object({
  url: urlString
    .max(WEBHOOK_LIMITS.MAX_URL_LENGTH, 'URL too long')
    .refine((url) => url.startsWith('https://'), 'Webhook URL must use HTTPS'),
  secret: nonEmptyString
    .min(32, 'Secret must be at least 32 characters')
    .max(WEBHOOK_LIMITS.MAX_SECRET_LENGTH, 'Secret too long')
    .regex(/^[a-zA-Z0-9+/=]+$/, 'Invalid secret format'),
  events: z
    .array(webhookEventTypeSchema)
    .min(1, 'At least one event type is required')
    .max(50, 'Too many event types'),
  active: z.boolean().default(true),
  retryConfig: z
    .object({
      maxRetries: nonNegativeInt.max(WEBHOOK_LIMITS.MAX_RETRY_COUNT).default(3),
      retryDelay: z
        .number()
        .int()
        .min(1000, 'Retry delay must be at least 1 second')
        .max(60000, 'Retry delay cannot exceed 60 seconds')
        .default(5000),
      backoffMultiplier: z
        .number()
        .min(1, 'Backoff multiplier must be at least 1')
        .max(5, 'Backoff multiplier cannot exceed 5')
        .default(2),
    })
    .optional(),
  timeout: z
    .number()
    .int()
    .min(WEBHOOK_LIMITS.MIN_TIMEOUT_MS)
    .max(WEBHOOK_LIMITS.MAX_TIMEOUT_MS)
    .default(10000),
  headers: z
    .record(z.string(), z.string().max(1000, 'Header value is too long'))
    .refine((headers) => Object.keys(headers).length <= 20, 'Too many custom headers')
    .optional(),
});

/**
 * Webhook response schema
 */
export const webhookResponseSchema = z.object({
  success: z.boolean(),
  statusCode: z
    .number()
    .int()
    .min(100, 'Status code must be at least 100')
    .max(599, 'Status code cannot exceed 599'),
  message: z.string().optional(),
  retryAfter: positiveInt.optional(),
  error: z.string().optional(),
});

/**
 * Webhook delivery attempt schema
 */
export const webhookDeliveryAttemptSchema = z.object({
  id: z.string().uuid(),
  webhookId: z.string().uuid(),
  eventId: z.string().uuid(),
  attemptNumber: positiveInt,
  timestamp: isoDatetimeString,
  statusCode: z
    .number()
    .int()
    .min(100, 'Status code must be at least 100')
    .max(599, 'Status code cannot exceed 599')
    .optional(),
  success: z.boolean(),
  responseTime: positiveInt.optional(),
  error: z.string().optional(),
  nextRetryAt: isoDatetimeString.optional(),
});

/**
 * Webhook registration schema
 */
export const webhookRegistrationSchema = z.object({
  id: z.string().uuid().optional(),
  name: shortString,
  description: z.string().max(500, 'Description is too long').optional(),
  config: webhookConfigSchema,
  createdAt: isoDatetimeString.optional(),
  updatedAt: isoDatetimeString.optional(),
  lastTriggeredAt: isoDatetimeString.optional(),
  totalDeliveries: nonNegativeInt.default(0),
  successfulDeliveries: nonNegativeInt.default(0),
  failedDeliveries: nonNegativeInt.default(0),
});

/**
 * Webhook signature verification with proper HMAC-SHA256 implementation
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp: string
): boolean {
  try {
    // Check timestamp to prevent replay attacks (5 minute window)
    const currentTime = Date.now();
    const webhookTime = Number.parseInt(timestamp, 10);
    if (Math.abs(currentTime - webhookTime) > 300000) {
      logger.error(
        'Webhook timestamp outside acceptable window',
        new Error('Timestamp validation failed'),
        {
          currentTime: String(currentTime),
          webhookTime: String(webhookTime),
          timeDifference: String(Math.abs(currentTime - webhookTime)),
        }
      );
      return false;
    }

    // Implement proper HMAC-SHA256 signature verification
    // This follows GitHub webhook signature verification standards
    try {
      const crypto = require('crypto');

      // Create the payload to sign: timestamp + payload
      const signedPayload = `${timestamp}.${payload}`;

      // Generate HMAC-SHA256 signature
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(signedPayload, 'utf8')
        .digest('hex');

      // GitHub-style signature comparison (with 'sha256=' prefix)
      const formattedExpectedSignature = `sha256=${expectedSignature}`;

      // Use timing-safe comparison to prevent timing attacks
      const providedSignature = signature.toLowerCase();
      const expectedSignatureLower = formattedExpectedSignature.toLowerCase();

      if (providedSignature.length !== expectedSignatureLower.length) {
        logger.warn('Webhook signature length mismatch', undefined, {
          providedLength: String(providedSignature.length),
          expectedLength: String(expectedSignatureLower.length),
        });
        return false;
      }

      // Timing-safe comparison
      let result = 0;
      for (let i = 0; i < providedSignature.length; i++) {
        result |= providedSignature.charCodeAt(i) ^ expectedSignatureLower.charCodeAt(i);
      }

      const isValid = result === 0;

      if (!isValid) {
        logger.warn('Webhook signature verification failed', undefined, {
          expectedPrefix: 'sha256=',
          providedPrefix: signature.substring(0, 7),
          payloadLength: String(payload.length),
          timestampProvided: timestamp,
        });
      }

      return isValid;
    } catch (cryptoError) {
      logger.error(
        'Webhook HMAC calculation failed',
        cryptoError instanceof Error ? cryptoError : new Error(String(cryptoError)),
        {
          payloadLength: String(payload.length),
          timestamp,
        }
      );
      return false;
    }
  } catch (error) {
    logger.error(
      'Webhook signature verification failed',
      error instanceof Error ? error : new Error(String(error)),
      {}
    );
    return false;
  }
}

/**
 * Type exports
 */
export type WebhookEventType = z.infer<typeof webhookEventTypeSchema>;
export type WebhookSignatureHeader = z.infer<typeof webhookSignatureHeaderSchema>;
export type BaseWebhookPayload = z.infer<typeof baseWebhookPayloadSchema>;
export type ContentEventData = z.infer<typeof contentEventDataSchema>;
export type UserEventData = z.infer<typeof userEventDataSchema>;
export type AnalyticsEventData = z.infer<typeof analyticsEventDataSchema>;
export type SubmissionEventData = z.infer<typeof submissionEventDataSchema>;
export type CacheEventData = z.infer<typeof cacheEventDataSchema>;
export type SystemEventData = z.infer<typeof systemEventDataSchema>;
export type CustomEventData = z.infer<typeof customEventDataSchema>;
export type WebhookConfig = z.infer<typeof webhookConfigSchema>;
export type WebhookResponse = z.infer<typeof webhookResponseSchema>;
export type WebhookDeliveryAttempt = z.infer<typeof webhookDeliveryAttemptSchema>;
export type WebhookRegistration = z.infer<typeof webhookRegistrationSchema>;
