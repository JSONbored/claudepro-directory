/**
 * Email Inngest Functions
 *
 * All email-related Inngest functions exported from here.
 *
 * @module packages/web-runtime/src/inngest/functions/email
 */

export { subscribeNewsletter } from './subscribe';
export { sendWelcomeEmail } from './welcome';
export { sendContactEmails } from './contact';
export { sendWeeklyDigest } from './digest';
export { processEmailSequence } from './sequence';
export { sendTransactionalEmail } from './transactional';
export { sendJobLifecycleEmail } from './job-lifecycle';
