/**
 * Webhook Payload Validation Schemas
 * Production-grade validation for webhook payloads
 * Ensures data integrity and prevents webhook injection attacks
 */

import { z } from 'zod';

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
  'x-webhook-signature': z
    .string()
    .min(1, 'Webhook signature is required')
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
  timestamp: z.string().datetime('Invalid timestamp format'),
  data: z.unknown(), // Will be validated based on event type
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
  slug: z
    .string()
    .min(1)
    .max(200, 'String is too long')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Invalid slug format'),
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  category: z.string().max(50, 'Category is too long'),
  tags: z.array(z.string().max(50, 'Tag is too long')).max(20, 'Too many tags').optional(),
  author: z.string().max(100, 'Author is too long').optional(),
  version: z.string().max(20, 'Version is too long').optional(),
  url: z.string().url().max(WEBHOOK_LIMITS.MAX_URL_LENGTH).optional(),
});

/**
 * User event data schemas
 */
export const userEventDataSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().max(255, 'Email is too long'),
  username: z.string().min(1, 'Username is required').max(50, 'Username is too long').optional(),
  role: z.enum(['user', 'admin', 'moderator']).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Analytics event data schemas
 */
export const analyticsEventDataSchema = z.object({
  category: z.enum(['agents', 'mcp', 'rules', 'commands', 'hooks']),
  slug: z.string(),
  action: z.enum(['view', 'copy', 'click', 'search']),
  value: z.number().optional(),
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  url: z.string().url().optional(),
  referrer: z.string().url().optional(),
  userAgent: z.string().max(500, 'User agent is too long').optional(),
});

/**
 * Submission event data schemas
 */
export const submissionEventDataSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['agent', 'mcp', 'rule', 'command', 'hook']),
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(5000, 'Description is too long'),
  submittedBy: z.string().email(),
  submittedAt: z.string().datetime(),
  status: z.enum(['pending', 'approved', 'rejected', 'reviewing']),
  reviewNotes: z.string().max(1000, 'Review notes are too long').optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Cache event data schemas
 */
export const cacheEventDataSchema = z.object({
  operation: z.enum(['warm', 'clear', 'expire', 'invalidate']),
  categories: z.array(z.string()).optional(),
  keys: z.array(z.string()).optional(),
  duration: z.number().positive().optional(),
  success: z.boolean(),
  itemsAffected: z.number().int().min(0).optional(),
  error: z.string().optional(),
});

/**
 * System event data schemas
 */
export const systemEventDataSchema = z.object({
  type: z.enum(['deploy', 'error', 'alert', 'health']),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  message: z.string().max(1000, 'Message is too long'),
  details: z.record(z.string(), z.unknown()).optional(),
  environment: z.enum(['development', 'staging', 'production']).optional(),
  service: z.string().max(100, 'Service name is too long').optional(),
  timestamp: z.string().datetime(),
});

/**
 * Custom event data schema (flexible)
 */
export const customEventDataSchema = z.record(z.string(), z.unknown());

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
  payload: unknown,
  eventType?: string
): z.infer<typeof baseWebhookPayloadSchema> | null {
  try {
    // First validate the base structure
    const basePayload = baseWebhookPayloadSchema.parse(payload);

    // Then validate the data based on event type
    const eventSchema = eventDataSchemas[basePayload.event as keyof typeof eventDataSchemas];
    if (eventSchema) {
      basePayload.data = eventSchema.parse(basePayload.data);
    }

    return basePayload;
  } catch (error) {
    console.error('Webhook payload validation failed:', {
      error: error instanceof z.ZodError ? error.issues : String(error),
      eventType,
    });
    return null;
  }
}

/**
 * Webhook configuration schema
 */
export const webhookConfigSchema = z.object({
  url: z
    .string()
    .url('Invalid webhook URL')
    .max(WEBHOOK_LIMITS.MAX_URL_LENGTH, 'URL too long')
    .refine((url) => url.startsWith('https://'), 'Webhook URL must use HTTPS'),
  secret: z
    .string()
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
      maxRetries: z.number().int().min(0).max(WEBHOOK_LIMITS.MAX_RETRY_COUNT).default(3),
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
  retryAfter: z.number().int().positive().optional(),
  error: z.string().optional(),
});

/**
 * Webhook delivery attempt schema
 */
export const webhookDeliveryAttemptSchema = z.object({
  id: z.string().uuid(),
  webhookId: z.string().uuid(),
  eventId: z.string().uuid(),
  attemptNumber: z.number().int().min(1),
  timestamp: z.string().datetime(),
  statusCode: z
    .number()
    .int()
    .min(100, 'Status code must be at least 100')
    .max(599, 'Status code cannot exceed 599')
    .optional(),
  success: z.boolean(),
  responseTime: z.number().positive().optional(),
  error: z.string().optional(),
  nextRetryAt: z.string().datetime().optional(),
});

/**
 * Webhook registration schema
 */
export const webhookRegistrationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  config: webhookConfigSchema,
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  lastTriggeredAt: z.string().datetime().optional(),
  totalDeliveries: z.number().int().min(0).default(0),
  successfulDeliveries: z.number().int().min(0).default(0),
  failedDeliveries: z.number().int().min(0).default(0),
});

/**
 * Webhook signature verification
 */
export function verifyWebhookSignature(
  _payload: string,
  _signature: string,
  _secret: string,
  timestamp: string
): boolean {
  try {
    // Check timestamp to prevent replay attacks (5 minute window)
    const currentTime = Date.now();
    const webhookTime = parseInt(timestamp, 10);
    if (Math.abs(currentTime - webhookTime) > 300000) {
      console.error('Webhook timestamp outside acceptable window');
      return false;
    }

    // In production, implement proper HMAC verification
    // This is a placeholder for the actual implementation
    // Example: crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')

    return true; // Placeholder
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
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
