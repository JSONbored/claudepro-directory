/**
 * Inngest Client Configuration
 *
 * This client is used to define and send events to Inngest.
 * All Inngest functions in the monorepo should use this client.
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
      source?: string;
      referrer?: string;
      copyType?: string;
      copyCategory?: string;
      copySlug?: string;
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
      userEmail: string;
      jobId: string;
      payload: Record<string, unknown>;
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
};

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
