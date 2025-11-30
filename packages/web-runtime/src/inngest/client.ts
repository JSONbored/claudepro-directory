/**
 * Inngest Client Configuration
 *
 * This client is used to define and send events to Inngest.
 * All Inngest functions in the monorepo should use this client.
 *
 * Features:
 * - Type-safe event schemas
 * - Environment-aware configuration (dev/staging/production)
 * - Middleware for logging, error tracking, and encryption
 *
 * @see https://www.inngest.com/docs/reference/client/create
 */

import { EventSchemas, Inngest } from 'inngest';

/**
 * Event type definitions for type-safe event sending.
 * Add new event types here as we migrate flux-station routes.
 */
type Events = {
  // Email events
  'email/subscribe': {
    data: {
      email: string;
      source?: string | undefined;
      referrer?: string | undefined;
      copyType?: string | undefined;
      copyCategory?: string | undefined;
      copySlug?: string | undefined;
      metadata?: Record<string, unknown> | undefined;
    };
  };
  'email/unsubscribe': {
    data: {
      email: string;
      reason?: string | undefined;
    };
  };
  'email/welcome': {
    data: {
      email: string;
      subscriptionId?: string;
      triggerSource: 'newsletter_subscription' | 'auth_signup';
    };
  };
  'email/transactional': {
    data: {
      type: string;
      email: string;
      emailData: Record<string, unknown>;
    };
  };
  'email/contact': {
    data: {
      submissionId: string;
      name: string;
      email: string;
      category: string;
      message: string;
    };
  };
  'email/job-lifecycle': {
    data: {
      action: string;
      jobId: string;
      jobTitle?: string | undefined;
      company?: string | undefined;
      employerEmail?: string | undefined;
      requiresPayment?: boolean | undefined;
      payload?: Record<string, unknown> | undefined;
    };
  };

  // Changelog events
  'changelog/process': {
    data: {
      source?: string;
    };
  };
  'changelog/notify': {
    data: {
      changelogId?: string;
    };
  };

  // Discord events
  'discord/jobs': {
    data: {
      jobId?: string;
      action?: string;
    };
  };
  'discord/submissions': {
    data: {
      submissionId?: string;
      action?: string;
    };
  };

  // Image generation events
  'image-generation/process': {
    data: {
      type: 'card' | 'thumbnail' | 'logo';
      contentId?: string;
      companyId?: string;
      imageData?: string;
      params?: Record<string, unknown>;
      priority?: 'high' | 'normal' | 'low';
    };
  };

  // Notification events
  'notification/create': {
    data: {
      title: string;
      message: string;
      type?: string;
      priority?: string;
      action_label?: string;
      action_href?: string;
      id?: string;
    };
  };
  'notification/broadcast': {
    data: {
      title: string;
      message: string;
      type?: string;
      priority?: string;
      action_label?: string;
      action_href?: string;
    };
  };

  // Test event (for verification)
  'test/hello': {
    data: {
      message: string;
    };
  };

  // Resend webhook events (forwarded from /api/flux/webhook/external)
  'resend/email.sent': {
    data: ResendEmailEventData;
  };
  'resend/email.delivered': {
    data: ResendEmailEventData;
  };
  'resend/email.delivery_delayed': {
    data: ResendEmailEventData;
  };
  'resend/email.bounced': {
    data: ResendEmailEventData;
  };
  'resend/email.complained': {
    data: ResendEmailEventData;
  };
  'resend/email.opened': {
    data: ResendEmailEventData;
  };
  'resend/email.clicked': {
    data: ResendEmailEventData & { click?: { link: string } };
  };

  // User lifecycle events (for drip campaigns)
  'app/user.signup': {
    data: {
      userId: string;
      email: string;
      name?: string;
      source?: string;
    };
  };
  'app/user.onboarding.completed': {
    data: {
      userId: string;
      email: string;
    };
  };

  // Job lifecycle events (for employer drip campaigns)
  'job/published': {
    data: {
      jobId: string;
      employerEmail: string;
      employerName?: string;
      jobTitle: string;
      jobSlug: string;
    };
  };
  'job/deleted': {
    data: {
      jobId: string;
      employerEmail?: string;
    };
  };
  'job/expired': {
    data: {
      jobId: string;
      employerEmail?: string;
    };
  };

  // Polar webhook events (payment processing)
  // Unified handler processes all Polar events with proper idempotency
  'polar/webhook': {
    data: PolarWebhookEventData;
  };
};

/**
 * Polar webhook event data structure
 * @see https://docs.polar.sh/integrate/webhooks/events
 */
export interface PolarWebhookEventData {
  /** The Polar event type (e.g., 'order.paid', 'subscription.active') */
  eventType: string;
  /** Unique webhook event ID from database (for idempotency) */
  webhookId: string;
  /** Svix ID for deduplication */
  svixId: string | null;
  /** Full Polar webhook payload */
  payload: Record<string, unknown>;
  /** Extracted job_id from metadata (if present) */
  jobId?: string | undefined;
  /** Extracted user_id from metadata (if present) */
  userId?: string | undefined;
}

/**
 * Resend email event data structure
 * @see https://resend.com/docs/webhooks
 */
export interface ResendEmailEventData {
  created_at: string;
  email_id: string;
  from: string;
  to: string[];
  subject: string;
  // Additional fields that may be present
  [key: string]: unknown;
}

/**
 * Inngest client instance for the HeyClaude application.
 *
 * Configuration:
 * - id: Unique identifier for this app in Inngest dashboard
 * - schemas: Type-safe event schemas
 *
 * Environment variables (auto-injected by Vercel Marketplace integration):
 * - INNGEST_EVENT_KEY: For sending events
 * - INNGEST_SIGNING_KEY: For verifying webhook signatures
 */
export const inngest = new Inngest({
  id: 'heyclaude',
  schemas: new EventSchemas().fromRecord<Events>(),
});

// Re-export for convenience
export type { Events as InngestEvents };
