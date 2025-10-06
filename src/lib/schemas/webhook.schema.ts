/**
 * Resend Webhook Event Schemas
 * Validation for webhook payloads from Resend (via Svix)
 */

import { z } from "zod";

/**
 * Resend webhook event types
 */
export const webhookEventTypeSchema = z.enum([
  "email.sent",
  "email.delivered",
  "email.delivery_delayed",
  "email.complained",
  "email.bounced",
  "email.opened",
  "email.clicked",
]);

export type WebhookEventType = z.infer<typeof webhookEventTypeSchema>;

/**
 * Bounce types
 */
export const bounceTypeSchema = z.enum(["hard", "soft"]);

export type BounceType = z.infer<typeof bounceTypeSchema>;

/**
 * Base webhook event data
 */
const baseWebhookDataSchema = z.object({
  created_at: z.string().datetime(),
  email_id: z.string().uuid(),
  from: z.string().email(),
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().optional(),
});

/**
 * Bounce event data
 */
const bounceEventDataSchema = baseWebhookDataSchema.extend({
  bounce_type: bounceTypeSchema.optional(),
  error: z.string().optional(),
});

/**
 * Complaint event data
 */
const complaintEventDataSchema = baseWebhookDataSchema.extend({
  feedback_type: z.string().optional(),
});

/**
 * Click event data
 */
const clickEventDataSchema = baseWebhookDataSchema.extend({
  link: z.string().url(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
});

/**
 * Open event data
 */
const openEventDataSchema = baseWebhookDataSchema.extend({
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
});

/**
 * Delivery delayed event data
 */
const delayedEventDataSchema = baseWebhookDataSchema.extend({
  error: z.string().optional(),
  attempt: z.number().int().optional(),
});

/**
 * Generic webhook event schema
 */
export const resendWebhookEventSchema = z.object({
  type: webhookEventTypeSchema,
  created_at: z.string().datetime(),
  data: z.union([
    bounceEventDataSchema,
    complaintEventDataSchema,
    clickEventDataSchema,
    openEventDataSchema,
    delayedEventDataSchema,
    baseWebhookDataSchema,
  ]),
});

export type ResendWebhookEvent = z.infer<typeof resendWebhookEventSchema>;

/**
 * Bounce event (specific type)
 */
export const bounceEventSchema = z.object({
  type: z.literal("email.bounced"),
  created_at: z.string().datetime(),
  data: bounceEventDataSchema,
});

export type BounceEvent = z.infer<typeof bounceEventSchema>;

/**
 * Complaint event (specific type)
 */
export const complaintEventSchema = z.object({
  type: z.literal("email.complained"),
  created_at: z.string().datetime(),
  data: complaintEventDataSchema,
});

export type ComplaintEvent = z.infer<typeof complaintEventSchema>;

/**
 * Click event (specific type)
 */
export const clickEventSchema = z.object({
  type: z.literal("email.clicked"),
  created_at: z.string().datetime(),
  data: clickEventDataSchema,
});

export type ClickEvent = z.infer<typeof clickEventSchema>;

/**
 * Open event (specific type)
 */
export const openEventSchema = z.object({
  type: z.literal("email.opened"),
  created_at: z.string().datetime(),
  data: openEventDataSchema,
});

export type OpenEvent = z.infer<typeof openEventSchema>;
