/**
 * Rate Limiting Configuration
 *
 * Centralized rate limiting configuration for all endpoints and actions.
 * All configurations use Zod validation for type safety and runtime validation.
 *
 * Architecture:
 * - Endpoint-based rate limits (API routes, middleware)
 * - Action-based rate limits (server actions)
 * - Environment-specific overrides
 * - Comprehensive validation with branded types
 *
 * Rate Limit Tiers:
 * - Restrictive: 5-30 requests per window (admin, submit, forms)
 * - Moderate: 50-100 requests per window (search, heavy API)
 * - Standard: 100-1000 requests per window (API, general)
 * - Generous: 1000-10000 requests per window (static, public pages)
 *
 * @see src/lib/rate-limiter.ts - Rate limiter implementation
 * @see src/middleware.ts - Middleware rate limiting
 * @see src/lib/actions/safe-action.ts - Server action rate limiting
 */

import { z } from 'zod';

// ============================================================================
// TYPE-SAFE SCHEMAS
// ============================================================================

/**
 * Rate limit configuration schema
 * Validates all rate limiting parameters
 */
const rateLimitConfigSchema = z.object({
  maxRequests: z.number().int().positive().max(100000).describe('Maximum requests per window'),
  windowMs: z
    .number()
    .int()
    .positive()
    .max(3600000 * 24) // Max 24 hours
    .describe('Time window in milliseconds'),
  description: z.string().min(1).max(200).describe('Human-readable description'),
});

export type RateLimitConfig = z.infer<typeof rateLimitConfigSchema>;

/**
 * Server action rate limit configuration schema
 * Simplified version using seconds instead of milliseconds
 */
const actionRateLimitConfigSchema = z.object({
  maxRequests: z.number().int().positive().max(10000).describe('Maximum requests per window'),
  windowSeconds: z
    .number()
    .int()
    .positive()
    .max(3600 * 24) // Max 24 hours
    .describe('Time window in seconds'),
  description: z.string().min(1).max(200).describe('Human-readable description'),
});

export type ActionRateLimitConfig = z.infer<typeof actionRateLimitConfigSchema>;

// ============================================================================
// ENDPOINT RATE LIMITS (API Routes & Middleware)
// ============================================================================

/**
 * Rate limit configurations for API endpoints
 * Used by middleware and API route handlers
 */
export const ENDPOINT_RATE_LIMITS = {
  /**
   * Admin endpoints - Extremely restrictive
   * Examples: cache warming, system operations
   */
  admin: rateLimitConfigSchema.parse({
    maxRequests: 50,
    windowMs: 3600000, // 1 hour
    description: 'Admin operations - 50 requests per hour',
  }),

  /**
   * Heavy API endpoints - Moderate restrictions
   * Examples: bulk data endpoints, large datasets, webhooks
   */
  heavyApi: rateLimitConfigSchema.parse({
    maxRequests: 100,
    windowMs: 900000, // 15 minutes
    description: 'Heavy API - 100 requests per 15 minutes',
  }),

  /**
   * Search endpoints - Search-specific limits
   * Protects computational resources for fuzzy search
   */
  search: rateLimitConfigSchema.parse({
    maxRequests: 100,
    windowMs: 300000, // 5 minutes
    description: 'Search API - 100 requests per 5 minutes',
  }),

  /**
   * Submit endpoints - Restrictive to prevent spam
   * Examples: form submissions, content creation
   */
  submit: rateLimitConfigSchema.parse({
    maxRequests: 30,
    windowMs: 3600000, // 1 hour
    description: 'Form submissions - 30 requests per hour',
  }),

  /**
   * Standard API endpoints - Generous limits
   * Examples: GET endpoints, public APIs
   */
  api: rateLimitConfigSchema.parse({
    maxRequests: 1000,
    windowMs: 3600000, // 1 hour
    description: 'Standard API - 1000 requests per hour',
  }),

  /**
   * General pages - Very generous
   * Examples: page views, navigation
   */
  general: rateLimitConfigSchema.parse({
    maxRequests: 10000,
    windowMs: 3600000, // 1 hour
    description: 'General pages - 10000 requests per hour',
  }),

  /**
   * LLMs.txt endpoints - Moderate AI training data access
   * Prevents scraping abuse while allowing legitimate access
   */
  llmstxt: rateLimitConfigSchema.parse({
    maxRequests: 100,
    windowMs: 3600000, // 1 hour
    description: 'AI training data - 100 requests per hour',
  }),

  /**
   * Webhook endpoints - Deliverability events
   * Examples: email bounces, complaints
   */
  webhookBounce: rateLimitConfigSchema.parse({
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    description: 'Webhook bounces - 100 events per minute',
  }),

  /**
   * Webhook endpoints - Analytics events
   * Examples: email opens, clicks
   */
  webhookAnalytics: rateLimitConfigSchema.parse({
    maxRequests: 500,
    windowMs: 60000, // 1 minute
    description: 'Webhook analytics - 500 events per minute',
  }),

  /**
   * Bulk operations - Balanced for legitimate bulk access
   * Examples: bulk imports, exports
   */
  bulk: rateLimitConfigSchema.parse({
    maxRequests: 50,
    windowMs: 1800000, // 30 minutes
    description: 'Bulk operations - 50 requests per 30 minutes',
  }),
} as const;

// ============================================================================
// SERVER ACTION RATE LIMITS
// ============================================================================

/**
 * Rate limit configurations for server actions
 * Used by next-safe-action middleware
 */
export const SERVER_ACTION_RATE_LIMITS = {
  /**
   * Default rate limit for all server actions
   */
  default: actionRateLimitConfigSchema.parse({
    maxRequests: 100,
    windowSeconds: 60,
    description: 'Default action limit - 100 requests per minute',
  }),

  /**
   * Analytics actions - Very generous
   * Examples: view tracking, click tracking
   */
  analytics: actionRateLimitConfigSchema.parse({
    maxRequests: 1000,
    windowSeconds: 60,
    description: 'Analytics tracking - 1000 requests per minute',
  }),

  /**
   * Form submission actions - Restrictive
   * Examples: contact forms, feedback submissions
   */
  form: actionRateLimitConfigSchema.parse({
    maxRequests: 5,
    windowSeconds: 300, // 5 minutes
    description: 'Form submissions - 5 requests per 5 minutes',
  }),

  /**
   * Content actions - Moderate
   * Examples: bookmark, like, share
   */
  content: actionRateLimitConfigSchema.parse({
    maxRequests: 50,
    windowSeconds: 60,
    description: 'Content interactions - 50 requests per minute',
  }),

  /**
   * User actions - Moderate
   * Examples: profile updates, preferences
   */
  user: actionRateLimitConfigSchema.parse({
    maxRequests: 30,
    windowSeconds: 60,
    description: 'User actions - 30 requests per minute',
  }),

  /**
   * Admin actions - Very restrictive
   * Examples: system modifications, bulk operations
   */
  admin: actionRateLimitConfigSchema.parse({
    maxRequests: 10,
    windowSeconds: 60,
    description: 'Admin actions - 10 requests per minute',
  }),

  /**
   * Newsletter subscription - Very restrictive
   * Prevents spam while allowing legitimate subscriptions
   */
  newsletter: actionRateLimitConfigSchema.parse({
    maxRequests: 3,
    windowSeconds: 3600, // 1 hour
    description: 'Newsletter signups - 3 requests per hour',
  }),

  /**
   * Email capture - Restrictive
   * For general email collection forms
   */
  emailCapture: actionRateLimitConfigSchema.parse({
    maxRequests: 5,
    windowSeconds: 3600, // 1 hour
    description: 'Email capture - 5 requests per hour',
  }),
} as const;

// ============================================================================
// SPECIALIZED RATE LIMITS
// ============================================================================

/**
 * Rate limits for specific operations that don't fit standard categories
 */
export const SPECIALIZED_RATE_LIMITS = {
  /**
   * GitHub API operations
   * Conservative to respect GitHub's rate limits
   */
  githubApi: actionRateLimitConfigSchema.parse({
    maxRequests: 60,
    windowSeconds: 3600, // 1 hour (GitHub's unauthenticated limit)
    description: 'GitHub API - 60 requests per hour',
  }),

  /**
   * External API calls
   * Conservative default for third-party APIs
   */
  externalApi: actionRateLimitConfigSchema.parse({
    maxRequests: 100,
    windowSeconds: 60,
    description: 'External APIs - 100 requests per minute',
  }),

  /**
   * Database write operations
   * Prevents overwhelming the database
   */
  databaseWrite: actionRateLimitConfigSchema.parse({
    maxRequests: 50,
    windowSeconds: 60,
    description: 'Database writes - 50 requests per minute',
  }),

  /**
   * Redis operations
   * Prevents overwhelming Redis
   */
  redisWrite: actionRateLimitConfigSchema.parse({
    maxRequests: 1000,
    windowSeconds: 60,
    description: 'Redis operations - 1000 requests per minute',
  }),

  /**
   * File uploads
   * Conservative to protect storage and bandwidth
   */
  fileUpload: actionRateLimitConfigSchema.parse({
    maxRequests: 10,
    windowSeconds: 3600, // 1 hour
    description: 'File uploads - 10 requests per hour',
  }),

  /**
   * Email sending
   * Conservative to respect email service limits
   */
  emailSend: actionRateLimitConfigSchema.parse({
    maxRequests: 5,
    windowSeconds: 3600, // 1 hour
    description: 'Email sending - 5 requests per hour',
  }),
} as const;

// ============================================================================
// ENVIRONMENT-SPECIFIC OVERRIDES
// ============================================================================

/**
 * Rate limit multipliers for different environments
 * Production has standard limits, development has relaxed limits
 */
export const ENVIRONMENT_MULTIPLIERS = {
  production: 1.0,
  staging: 2.0,
  development: 10.0,
  test: 100.0,
} as const;

/**
 * Get rate limit multiplier for current environment
 */
export function getEnvironmentMultiplier(): number {
  const env = process.env.NODE_ENV || 'production';
  return ENVIRONMENT_MULTIPLIERS[env as keyof typeof ENVIRONMENT_MULTIPLIERS] ?? 1.0;
}

/**
 * Apply environment multiplier to a rate limit config
 */
export function applyEnvironmentMultiplier(config: RateLimitConfig): RateLimitConfig {
  const multiplier = getEnvironmentMultiplier();
  return {
    ...config,
    maxRequests: Math.floor(config.maxRequests * multiplier),
  };
}

// ============================================================================
// VALIDATION & HELPERS
// ============================================================================

/**
 * Validate all rate limit configurations at module load time
 * Ensures all configurations are valid before runtime
 */
function validateAllConfigs(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate endpoint rate limits
  for (const [key, config] of Object.entries(ENDPOINT_RATE_LIMITS)) {
    try {
      rateLimitConfigSchema.parse(config);
    } catch (error) {
      errors.push(`Invalid endpoint rate limit config for ${key}: ${error}`);
    }
  }

  // Validate server action rate limits
  for (const [key, config] of Object.entries(SERVER_ACTION_RATE_LIMITS)) {
    try {
      actionRateLimitConfigSchema.parse(config);
    } catch (error) {
      errors.push(`Invalid action rate limit config for ${key}: ${error}`);
    }
  }

  // Validate specialized rate limits
  for (const [key, config] of Object.entries(SPECIALIZED_RATE_LIMITS)) {
    try {
      actionRateLimitConfigSchema.parse(config);
    } catch (error) {
      errors.push(`Invalid specialized rate limit config for ${key}: ${error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Validate all configurations at module load
const validation = validateAllConfigs();
if (!validation.valid) {
  throw new Error(`Rate limit configuration validation failed:\n${validation.errors.join('\n')}`);
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Type-safe rate limit configuration map
 * Maps logical keys to validated configurations
 */
export type RateLimitConfigs = typeof ENDPOINT_RATE_LIMITS;
export type ActionRateLimitConfigs = typeof SERVER_ACTION_RATE_LIMITS;
export type SpecializedRateLimitConfigs = typeof SPECIALIZED_RATE_LIMITS;

/**
 * Helper to get rate limit description for logging
 */
export function getRateLimitDescription(config: RateLimitConfig | ActionRateLimitConfig): string {
  return config.description;
}

/**
 * Helper to convert milliseconds to seconds
 */
export function msToSeconds(ms: number): number {
  return Math.floor(ms / 1000);
}

/**
 * Helper to convert seconds to milliseconds
 */
export function secondsToMs(seconds: number): number {
  return seconds * 1000;
}
