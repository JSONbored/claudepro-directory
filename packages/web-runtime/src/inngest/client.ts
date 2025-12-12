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
import type { Database } from '@heyclaude/database-types';
import {
  getDeploymentEnv,
  getDeploymentPullRequestId,
  getDeploymentCommit,
} from '@heyclaude/shared-runtime/platform';

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
  'discord/direct': {
    data: {
      notificationType: string;
      payload: Record<string, unknown>;
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

  // Supabase database webhook events (content changes)
  'supabase/content-changed': {
    data: SupabaseContentChangedEventData;
  };

  // IndexNow events
  'indexnow/submit': {
    data: {
      urlList: string[];
      host: string;
      key: string;
      keyLocation: string;
    };
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
 * Supabase database webhook event data structure
 * @see https://supabase.com/docs/guides/database/webhooks
 */
export interface SupabaseContentChangedEventData {
  /** Unique webhook event ID from database (for idempotency) */
  webhookId: string;
  /** Svix ID for deduplication */
  svixId: string | null;
  /** Database event type: INSERT, UPDATE, DELETE */
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  /** Content category (all categories supported for README updates, package generation only for skills/mcp) */
  category: Database['public']['Enums']['content_category'];
  /** Content ID (UUID) */
  contentId: string;
  /** Content slug */
  slug?: string | undefined;
  /** New record data (partial ContentRow) */
  record: Partial<Database['public']['Tables']['content']['Row']>;
  /** Old record data (for UPDATE/DELETE) */
  oldRecord?: Partial<Database['public']['Tables']['content']['Row']> | undefined;
  /** Full webhook payload */
  payload: Record<string, unknown>;
}

/**
 * Inngest client instance for the HeyClaude application.
 *
 * Configuration:
 * - id: Unique identifier for this app in Inngest dashboard
 * - schemas: Type-safe event schemas
 * - env: Environment identifier for branch environments (preview branches)
 *
 * Environment variables (auto-injected by Vercel Marketplace integration):
 * - INNGEST_EVENT_KEY: For sending events
 * - INNGEST_SIGNING_KEY: For verifying webhook signatures
 *
 * Branch Environments:
 * - Production: Uses default environment (env: undefined)
 * - Preview: Uses branch-specific environment based on PR ID or commit SHA
 * - Development: Uses default environment (local dev with Inngest Dev Server)
 *
 * @see https://www.inngest.com/docs/platform/environments#branch-environments
 */

// Determine the Inngest environment for branch environments
function getInngestEnv(): string | undefined {
  // Only set env for preview deployments (not production or local dev)
  if (typeof process === 'undefined' || !process.env) {
    return undefined;
  }

  // Use platform-agnostic deployment environment detection
  const deploymentEnv = getDeploymentEnv();
  const prId = getDeploymentPullRequestId();
  const commitSha = getDeploymentCommit();

  // Preview environment: Use PR ID if available, otherwise use commit SHA
  // This creates isolated branch environments for each preview deployment
  if (deploymentEnv === 'preview') {
    if (prId) {
      // PR-based preview: Use PR ID for consistent environment across PR deployments
      return `preview-${prId}`;
    }
    if (commitSha) {
      // Commit-based preview: Use short commit SHA
      return `preview-${commitSha.slice(0, 7)}`;
    }
    // Fallback: Use generic preview identifier
    return 'preview';
  }

  // Production and development: Use default environment (undefined)
  // Production uses the default production environment
  // Local development uses Inngest Dev Server (via INNGEST_DEV env var)
  return undefined;
}

// Build client options conditionally to satisfy exactOptionalPropertyTypes
const inngestEnv = getInngestEnv();
const schemas = new EventSchemas().fromRecord<Events>();

// Create client with conditional env property
export const inngest = inngestEnv !== undefined
  ? new Inngest({
      id: 'heyclaude',
      schemas,
      env: inngestEnv,
    })
  : new Inngest({
      id: 'heyclaude',
      schemas,
    });

// Re-export for convenience
export type { Events as InngestEvents };
