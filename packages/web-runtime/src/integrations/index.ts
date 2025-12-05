/**
 * Integrations Module
 *
 * External service integrations for the web runtime.
 *
 * @module packages/web-runtime/src/integrations
 */

// HTTP Client with retry
export { fetchWithRetry, runWithRetry, type FetchWithRetryOptions, type FetchWithRetryResult, type RetryOptions } from './http-client';

// Resend email integration
export {
  // API
  ResendApiError,
  callResendApi,
  sendEmail,
  syncContactToResend,
  // Topics
  RESEND_TOPIC_IDS,
  inferInitialTopics,
  resolveNewsletterInterest,
  // Segments
  RESEND_SEGMENT_IDS,
  determineSegmentByEngagement,
  syncContactSegment,
  // Contact properties
  buildContactProperties,
  calculateInitialEngagementScore,
  // Engagement
  calculateEngagementChange,
  updateContactEngagement,
} from './resend';
