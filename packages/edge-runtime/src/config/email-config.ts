import { edgeEnv } from '@heyclaude/edge-runtime/config/env.ts';

/**
 * Shared Email Configuration for Supabase Edge Functions
 *
 * CORE DIRECTIVES:
 * - Configuration-driven: All email settings centralized
 * - Scalable: Add new email types without code duplication
 * - Maintainable: Single source of truth for email templates
 * - Production-ready: Type-safe with validation
 *
 * @module packages/edge-runtime/src/config/email-config
 */

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
 * Supabase environment variables
 * Centralized access with fallback validation
 */
export const SUPABASE_ENV = {
  url: edgeEnv.supabase.url,
  anonKey: edgeEnv.supabase.anonKey,
  serviceRoleKey: edgeEnv.supabase.serviceRoleKey,
} as const;

/**
 * Resend environment variables
 */
export const RESEND_ENV = {
  apiKey: edgeEnv.resend.apiKey ?? '',
  audienceId: edgeEnv.resend.audienceId ?? '',
} as const;

/**
 * Auth Hook environment variables
 */
export const AUTH_HOOK_ENV = {
  secret: edgeEnv.sendEmailHook.secret ?? '',
} as const;

/**
 * Validate environment variables are present
 * Fails fast on Edge Function startup if misconfigured
 */
export function validateEnvironment(required: ('supabase' | 'resend' | 'auth-hook')[]) {
  const missing: string[] = [];

  if (required.includes('supabase')) {
    if (!SUPABASE_ENV.url) missing.push('SUPABASE_URL');
    if (!SUPABASE_ENV.serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  }

  if (required.includes('resend')) {
    if (!RESEND_ENV.apiKey) missing.push('RESEND_API_KEY');
    if (!RESEND_ENV.audienceId) missing.push('RESEND_AUDIENCE_ID');
  }

  if (required.includes('auth-hook')) {
    if (!AUTH_HOOK_ENV.secret) missing.push('SEND_EMAIL_HOOK_SECRET');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Base URL for application links
 * Uses environment variable with fallback
 */
export const APP_URL = edgeEnv.site.appUrl;

/**
 * Email rate limits (Resend free tier)
 * Used for monitoring and alerting
 */
export const RATE_LIMITS = {
  perDay: 100, // Free tier: 100 emails/day
  perMonth: 3000, // Free tier: 3000 emails/month
  batchSize: 100, // Resend batch API limit
} as const;
