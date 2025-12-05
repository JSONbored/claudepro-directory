/**
 * Shared Email Configuration for Web Runtime
 *
 * CORE DIRECTIVES:
 * - Configuration-driven: All email settings centralized
 * - Scalable: Add new email types without code duplication
 * - Maintainable: Single source of truth for email templates
 * - Production-ready: Type-safe with validation
 *
 * @module packages/web-runtime/src/email/config/email-config
 */

import { APP_CONFIG } from '../../config/unified-config';
import { getEnvVar } from '@heyclaude/shared-runtime';

/**
 * Email template types
 * Extend this as new email types are added
 */
export type EmailTemplate =
  | 'welcome'
  | 'magic-link'
  | 'password-reset'
  | 'email-change'
  | 'job-posted'
  | 'collection-shared';

/**
 * Email configuration schema
 * Defines all email templates with their properties
 */
export const EMAIL_CONFIG = {
  welcome: {
    from: 'ClaudePro Directory <hello@mail.claudepro.directory>',
    subject: 'Welcome to Claude Pro Directory! 🎉',
    template: 'welcome',
    tags: [
      { name: 'type', value: 'auth' },
      { name: 'category', value: 'welcome' },
    ],
  },
  'magic-link': {
    from: 'ClaudePro Directory <auth@mail.claudepro.directory>',
    subject: 'Your Magic Link - Claude Pro Directory',
    template: 'magic-link',
    tags: [
      { name: 'type', value: 'auth' },
      { name: 'category', value: 'magic-link' },
    ],
  },
  'password-reset': {
    from: 'ClaudePro Directory <auth@mail.claudepro.directory>',
    subject: 'Reset Your Password - Claude Pro Directory',
    template: 'password-reset',
    tags: [
      { name: 'type', value: 'auth' },
      { name: 'category', value: 'password-reset' },
    ],
  },
  'email-change': {
    from: 'ClaudePro Directory <auth@mail.claudepro.directory>',
    subject: 'Confirm Email Change - Claude Pro Directory',
    template: 'email-change',
    tags: [
      { name: 'type', value: 'auth' },
      { name: 'category', value: 'email-change' },
    ],
  },
  'job-posted': {
    from: 'ClaudePro Directory <jobs@mail.claudepro.directory>',
    subject: 'Your Job Listing is Live!',
    template: 'job-posted',
    tags: [
      { name: 'type', value: 'transactional' },
      { name: 'category', value: 'job' },
    ],
  },
  'collection-shared': {
    from: 'ClaudePro Directory <community@mail.claudepro.directory>',
    subject: 'Someone shared a collection with you!',
    template: 'collection-shared',
    tags: [
      { name: 'type', value: 'transactional' },
      { name: 'category', value: 'collection' },
    ],
  },
} as const satisfies Record<
  EmailTemplate,
  {
    from: string;
    subject: string;
    template: string;
    tags: Array<{ name: string; value: string }>;
  }
>;

/**
 * Get email configuration by template type
 * Type-safe accessor with runtime validation
 */
export function getEmailConfig(template: EmailTemplate) {
  const config = EMAIL_CONFIG[template];

  if (!config) {
    throw new Error(`Unknown email template: ${template}`);
  }

  return config;
}

/**
 * Resend environment variables - lazy loaded to avoid errors during build
 * 
 * @remarks
 * Returns undefined for missing required keys so callers can fail explicitly.
 * Use validateEmailEnvironment() to check for required keys at startup.
 */
export function getResendEnv() {
  return {
    apiKey: getEnvVar('RESEND_API_KEY'),
    audienceId: getEnvVar('RESEND_AUDIENCE_ID'),
    webhookSecret: getEnvVar('RESEND_WEBHOOK_SECRET'),
  };
}

/**
 * Validate environment variables are present
 * Fails fast on startup if misconfigured
 */
export function validateEmailEnvironment(required: ('resend')[]) {
  const missing: string[] = [];

  if (required.includes('resend')) {
    const resendEnv = getResendEnv();
    if (!resendEnv.apiKey) missing.push('RESEND_API_KEY');
    if (!resendEnv.audienceId) missing.push('RESEND_AUDIENCE_ID');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Base URL for application links
 * Uses unified config
 */
export const APP_URL = APP_CONFIG.url;

/**
 * Email rate limits (Resend free tier)
 * Used for monitoring and alerting
 */
export const RATE_LIMITS = {
  perDay: 100, // Free tier: 100 emails/day
  perMonth: 3000, // Free tier: 3000 emails/month
  batchSize: 100, // Resend batch API limit
} as const;

/**
 * Standard email sender addresses
 * These match the Resend verified sender domains
 */
export const JOBS_FROM = 'Claude Pro Directory <jobs@mail.claudepro.directory>';
export const COMMUNITY_FROM = 'Claude Pro Directory <community@mail.claudepro.directory>';
export const HELLO_FROM = 'Claude Pro Directory <hello@mail.claudepro.directory>';
export const ONBOARDING_FROM = 'Claude Pro Directory <noreply@claudepro.directory>';
export const CONTACT_FROM = 'Claude Pro Directory <contact@mail.claudepro.directory>';
