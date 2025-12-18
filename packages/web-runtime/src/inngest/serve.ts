/**
 * Inngest Serve Handler
 *
 * Creates the GET, POST, PUT handlers needed for the /api/inngest route.
 * This file contains the serve() implementation.
 *
 * @example
 * // In apps/web/src/app/api/inngest/route.ts:
 * export { GET, POST, PUT } from "@heyclaude/web-runtime/inngest/serve";
 */

import { serve } from 'inngest/next';
import { inngest } from './client';

// Email functions (Phase 2)
import { subscribeNewsletter } from './functions/email/subscribe';
import { sendWelcomeEmail } from './functions/email/welcome';
import { sendContactEmails } from './functions/email/contact';
import { sendWeeklyDigest } from './functions/email/digest';
import { processEmailSequence } from './functions/email/sequence';
import { sendTransactionalEmail } from './functions/email/transactional';
import { sendJobLifecycleEmail } from './functions/email/job-lifecycle';

// Resend webhook handler (consolidated - replaces list-hygiene + engagement)
import { handleResendWebhook } from './functions/resend/webhook';

// Dynamic drip campaigns
import {
  newsletterDripCampaign,
  jobPostingDripCampaign,
} from './functions/email/drip-campaigns';

// Analytics functions (Phase 3)
import { processPulseQueue } from './functions/analytics/pulse';

// Trending functions (Phase 3)
import { calculateTrendingMetrics } from './functions/trending/calculate-metrics';

// Changelog functions (Phase 3)
import { processChangelogNotifyQueue } from './functions/changelog/notify';

// Discord functions (Phase 3)
import { processDiscordJobsQueue } from './functions/discord/jobs';
import { processDiscordSubmissionsQueue } from './functions/discord/submissions';
import { processDiscordErrorsQueue } from './functions/discord/errors';
import { sendDiscordDirect } from './functions/discord/direct';

// Notification functions (Phase 3)
import { createNotification, broadcastNotification } from './functions/notifications/create';

// Polar webhook functions (Phase 5 - Payment processing)
import { handlePolarWebhook } from './functions/polar/webhook';

// Supabase database webhook functions
import { handleSupabaseContentChanged } from './functions/supabase/content-changed';

// IndexNow functions
import { submitIndexNow } from './functions/indexnow/submit';

/**
 * All Inngest functions that should be served.
 * Add new functions here as they are created.
 */
const functions = [
  // Email functions (Phase 2) - COMPLETE
  subscribeNewsletter,
  sendWelcomeEmail,
  sendContactEmails,
  sendWeeklyDigest, // Cron: Mondays 9am UTC
  processEmailSequence, // Cron: Every 6 hours
  sendTransactionalEmail,
  sendJobLifecycleEmail,

  // Resend webhook handler (Phase 4) - Consolidated
  // Handles: bounced, complained, delivery_delayed, sent, delivered, opened, clicked
  handleResendWebhook, // Events: resend/email.* (all 7 event types)

  // Dynamic drip campaigns (Phase 4)
  newsletterDripCampaign, // Event: email/welcome (triggers on signup)
  jobPostingDripCampaign, // Event: job/published

  // Analytics functions (Phase 3) - COMPLETE
  processPulseQueue, // Cron: Every hour (optimized from 30 minutes)

  // Trending functions (Phase 3) - COMPLETE
  calculateTrendingMetrics, // Cron: Every hour (optimized from 30 minutes - calculates time-windowed metrics and refreshes materialized view)

  // Changelog functions (Phase 3) - COMPLETE
  // processChangelogQueue removed - replaced by /api/changelog/sync endpoint
  processChangelogNotifyQueue, // Cron: Every 30 minutes (processes notifications from API endpoint)

  // Discord functions (Phase 3) - COMPLETE
  processDiscordJobsQueue, // Cron: Every 30 minutes
  processDiscordSubmissionsQueue, // Cron: Every 30 minutes
  processDiscordErrorsQueue, // Cron: Every 30 minutes (optimized from 15 minutes - webhook error alerts)
  sendDiscordDirect, // Event: discord/direct (sends direct Discord notifications)

  // Notification functions (Phase 3) - COMPLETE
  createNotification, // Event: notification/create
  broadcastNotification, // Event: notification/broadcast

  // Polar webhook functions (Phase 5) - Payment processing
  handlePolarWebhook, // Event: polar/webhook (unified handler with idempotency)

  // Supabase database webhook functions
  handleSupabaseContentChanged, // Event: supabase/content-changed (triggers GitHub Actions)

  // IndexNow functions
  submitIndexNow, // Event: indexnow/submit (submits URLs to IndexNow API)
];

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
