/**
 * Inngest Function Configuration
 *
 * Centralized configuration for all Inngest function settings.
 * These constants ensure consistent behavior across all functions
 * and make it easy to adjust limits globally.
 */

/**
 * Concurrency limits for external API integrations
 *
 * These limits protect against rate limiting from external services.
 * Adjust based on your API tier/plan limits.
 */
export const CONCURRENCY_LIMITS = {
  /**
   * Resend API - Email sending
   * Free tier: 100 emails/day, 3 emails/second
   * Pro tier: Higher limits
   * NOTE: Inngest free tier max concurrency is 5
   */
  RESEND_API: 5,

  /**
   * Discord API - Webhook rate limits
   * Global: 50 requests per second
   * Per webhook: 5 requests per 2 seconds
   * NOTE: Inngest free tier max concurrency is 5
   */
  DISCORD_WEBHOOKS: 5,

  /**
   * OpenAI/AI APIs - Rate limited
   * Varies by tier
   * NOTE: Inngest free tier max concurrency is 5
   */
  AI_APIS: 5,

  /**
   * Database operations - Connection pool limits
   * NOTE: Inngest free tier max concurrency is 5
   */
  DATABASE: 5,

  /**
   * GitHub API
   * 5000 requests per hour for authenticated requests
   * NOTE: Inngest free tier max concurrency is 5
   */
  GITHUB_API: 5,

  /**
   * Polar API
   * NOTE: Inngest free tier max concurrency is 5
   */
  POLAR_API: 5,
} as const;

/**
 * Throttle configurations
 *
 * Used to prevent webhook flooding and duplicate processing
 */
export const THROTTLE_CONFIGS = {
  /**
   * Webhook processing - Prevent duplicate webhooks
   */
  WEBHOOK_DEFAULT: {
    limit: 1,
    period: '10s' as const,
  },

  /**
   * Email engagement events - Batch similar events
   */
  EMAIL_ENGAGEMENT: {
    limit: 100,
    period: '1m' as const,
  },

  /**
   * Analytics events - High volume batching
   */
  ANALYTICS: {
    limit: 500,
    period: '1m' as const,
  },
} as const;

/**
 * Rate limit configurations
 *
 * Used to prevent abuse on public-facing triggers
 */
export const RATE_LIMITS = {
  /**
   * Contact form - Anti-spam
   * 5 submissions per hour per email
   */
  CONTACT_FORM: {
    limit: 5,
    period: '1h' as const,
  },

  /**
   * Newsletter subscribe - Anti-spam
   * 3 subscriptions per hour per IP/email
   */
  NEWSLETTER_SUBSCRIBE: {
    limit: 3,
    period: '1h' as const,
  },

  /**
   * Notification creation - Prevent flooding
   */
  NOTIFICATIONS: {
    limit: 10,
    period: '1m' as const,
  },
} as const;

/**
 * Debounce configurations
 *
 * Used to handle noisy events and batch updates
 */
export const DEBOUNCE_CONFIGS = {
  /**
   * Content updates - Wait for rapid changes to settle
   */
  CONTENT_UPDATE: {
    period: '30s' as const,
    timeout: '5m' as const,
  },

  /**
   * User activity - Batch rapid interactions
   */
  USER_ACTIVITY: {
    period: '10s' as const,
    timeout: '2m' as const,
  },
} as const;

/**
 * Retry configurations
 */
export const RETRY_CONFIGS = {
  /**
   * Default retry count for most functions
   */
  DEFAULT: 3,

  /**
   * Email sending - Higher retries for deliverability
   */
  EMAIL: 5,

  /**
   * Webhook processing - Quick failure for idempotency
   */
  WEBHOOK: 2,

  /**
   * External API calls - Moderate retries for network issues
   */
  externalApi: 3,

  /**
   * Critical operations - Maximum attempts
   */
  CRITICAL: 10,

  /**
   * Non-critical background tasks
   */
  BACKGROUND: 1,
} as const;

/**
 * Priority expressions (CEL)
 *
 * Higher values = higher priority (-600 to 600)
 */
export const PRIORITY_EXPRESSIONS = {
  /**
   * Paid customers get priority
   */
  PAID_PRIORITY: 'event.data.requiresPayment == true ? 100 : 0',

  /**
   * High priority events
   */
  HIGH: '100',

  /**
   * Normal priority
   */
  NORMAL: '0',

  /**
   * Low priority (background tasks)
   */
  LOW: '-100',
} as const;

/**
 * Timeout configurations
 */
export const TIMEOUTS = {
  /**
   * External API calls
   */
  EXTERNAL_API: 30000, // 30 seconds

  /**
   * Discord webhook
   */
  DISCORD: 10000, // 10 seconds

  /**
   * Email sending
   */
  EMAIL: 15000, // 15 seconds

  /**
   * Database operations
   */
  DATABASE: 10000, // 10 seconds
} as const;

/**
 * Cancel-on event configurations
 *
 * Used for long-running workflows that should stop on certain events
 */
export const CANCEL_ON_CONFIGS = {
  /**
   * Newsletter drip campaign - Cancel on unsubscribe
   */
  NEWSLETTER_DRIP: {
    event: 'email/unsubscribe',
    timeout: '30d' as const,
  },

  /**
   * Job drip campaign - Cancel on job deletion/expiry
   */
  JOB_DRIP: {
    event: 'job/deleted',
    timeout: '90d' as const,
  },
} as const;

/**
 * Account-level concurrency keys
 *
 * Used for shared concurrency limits across multiple functions
 */
export const ACCOUNT_CONCURRENCY_KEYS = {
  RESEND: '"resend"',
  DISCORD: '"discord"',
  OPENAI: '"openai"',
  GITHUB: '"github"',
  POLAR: '"polar"',
} as const;
