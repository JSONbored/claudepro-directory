/**
 * Inngest Integration - Main Entry Point
 *
 * This module exports everything needed for Inngest integration:
 * - The Inngest client (for sending events)
 * - All Inngest functions (for the serve handler)
 * - The serve handler configuration
 *
 * @example
 * // In apps/web/src/app/api/inngest/route.ts:
 * export { GET, POST, PUT } from "@heyclaude/web-runtime/inngest";
 *
 * @example
 * // Sending events from anywhere:
 * import { inngest } from "@heyclaude/web-runtime/inngest";
 * await inngest.send({ name: "email/subscribe", data: { email: "..." } });
 */

import { serve } from 'inngest/next';

// Export the client for sending events
export { inngest, type InngestEvents } from './client';

// Email functions (Phase 2)
import { subscribeNewsletter } from './functions/email/subscribe';
import { sendWelcomeEmail } from './functions/email/welcome';
import { sendContactEmails } from './functions/email/contact';
import { sendWeeklyDigest } from './functions/email/digest';
import { processEmailSequence } from './functions/email/sequence';
import { sendTransactionalEmail } from './functions/email/transactional';
import { sendJobLifecycleEmail } from './functions/email/job-lifecycle';

// Analytics functions (Phase 3)
import { processPulseQueue } from './functions/analytics/pulse';

// Changelog functions (Phase 3)
import { processChangelogQueue } from './functions/changelog/process';
import { processChangelogNotifyQueue } from './functions/changelog/notify';

// Discord functions (Phase 3)
import { processDiscordJobsQueue } from './functions/discord/jobs';
import { processDiscordSubmissionsQueue } from './functions/discord/submissions';
import { processDiscordErrorsQueue } from './functions/discord/errors';

// Notification functions (Phase 3)
import { createNotification, broadcastNotification } from './functions/notifications/create';

/**
 * All Inngest functions that should be served.
 * Add new functions here as they are created.
 */
export const functions = [
  // Email functions (Phase 2) - COMPLETE
  subscribeNewsletter,
  sendWelcomeEmail,
  sendContactEmails,
  sendWeeklyDigest, // Cron: Mondays 9am UTC
  processEmailSequence, // Cron: Every 2 hours
  sendTransactionalEmail,
  sendJobLifecycleEmail,

  // Analytics functions (Phase 3) - COMPLETE
  processPulseQueue, // Cron: Every 5 minutes

  // Changelog functions (Phase 3) - COMPLETE
  processChangelogQueue, // Cron: Every 10 minutes
  processChangelogNotifyQueue, // Cron: Every 10 minutes

  // Discord functions (Phase 3) - COMPLETE
  processDiscordJobsQueue, // Cron: Every 5 minutes
  processDiscordSubmissionsQueue, // Cron: Every 5 minutes
  processDiscordErrorsQueue, // Cron: Every 5 minutes (webhook error alerts)

  // Notification functions (Phase 3) - COMPLETE
  createNotification, // Event: notification/create
  broadcastNotification, // Event: notification/broadcast
];

// Re-export individual functions for direct imports
// Email functions
export { subscribeNewsletter };
export { sendWelcomeEmail };
export { sendContactEmails };
export { sendWeeklyDigest };
export { processEmailSequence };
export { sendTransactionalEmail };
export { sendJobLifecycleEmail };

// Analytics functions
export { processPulseQueue };

// Changelog functions
export { processChangelogQueue };
export { processChangelogNotifyQueue };

// Discord functions
export { processDiscordJobsQueue };
export { processDiscordSubmissionsQueue };
export { processDiscordErrorsQueue };

// Notification functions
export { createNotification };
export { broadcastNotification };

// Import the client for serve handler
import { inngest } from './client';

/**
 * Inngest serve handler for Next.js App Router.
 *
 * This creates the GET, POST, PUT handlers needed for the /api/inngest route.
 * The route file in apps/web just re-exports these handlers.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
