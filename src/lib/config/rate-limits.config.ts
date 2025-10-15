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

// ============================================================================
// REVALIDATION CONFIGURATION
// ============================================================================

/**
 * Next.js revalidation times for ISR (Incremental Static Regeneration)
 * Centralized configuration for cache invalidation strategy
 *
 * Strategy:
 * - Static content: Long cache (1-24 hours) - rarely changes
 * - Dynamic content: Medium cache (5-15 min) - changes frequently
 * - User content: Short cache (1-5 min) - user-specific, changes often
 * - Real-time: No cache (0 sec) - always fresh data
 *
 * Performance Impact:
 * - Longer revalidation = Less build/generation overhead
 * - Shorter revalidation = Fresher data, more resource usage
 * - Balance based on content type and update frequency
 */
export const REVALIDATION_TIMES = {
  /**
   * Static configurations - Rarely change
   * Examples: agents, mcp servers, rules, commands, hooks, statuslines, collections
   * Revalidate: 1 hour (3600 seconds)
   */
  STATIC_CONTENT: 3600,

  /**
   * Documentation and guides - Occasionally updated
   * Examples: guides, tutorials, documentation pages
   * Revalidate: 30 minutes (1800 seconds)
   */
  GUIDES: 1800,

  /**
   * Changelog - Updates on releases
   * Examples: changelog entries, release notes
   * Revalidate: 15 minutes (900 seconds)
   */
  CHANGELOG: 900,

  /**
   * Dynamic content - Frequently updated
   * Examples: trending pages, job listings, community pages
   * Revalidate: 5 minutes (300 seconds)
   */
  DYNAMIC_CONTENT: 300,

  /**
   * User-specific content - User-driven changes
   * Examples: profiles, bookmarks, libraries, personalized feeds
   * Revalidate: 1 minute (60 seconds)
   */
  USER_CONTENT: 60,

  /**
   * Analytics and stats - Real-time data
   * Examples: view counts, trending scores, live stats
   * Revalidate: No cache (0 seconds)
   */
  REAL_TIME: 0,

  /**
   * Homepage - Mixed content with high traffic
   * Balance between freshness and performance
   * Revalidate: 10 minutes (600 seconds)
   */
  HOMEPAGE: 600,

  /**
   * API responses - Cached API data
   * Examples: static API endpoints, configuration exports
   * Revalidate: 15 minutes (900 seconds)
   */
  API_STATIC: 900,

  /**
   * Sitemaps and feeds - SEO content
   * Examples: sitemap.xml, rss feeds, atom feeds
   * Revalidate: 6 hours (21600 seconds)
   */
  SEO_FEEDS: 21600,

  /**
   * LLMs.txt - AI training data
   * Examples: llms.txt files for AI consumption
   * Revalidate: 1 hour (3600 seconds)
   */
  LLMS_TXT: 3600,
} as const;

/**
 * Revalidation configuration schema for validation
 */
const revalidationConfigSchema = z.object({
  seconds: z.number().int().nonnegative().max(86400).describe('Revalidation time in seconds'),
  description: z.string().min(1).max(200).describe('Human-readable description'),
});

/**
 * Type-safe revalidation configuration
 */
export type RevalidationConfig = z.infer<typeof revalidationConfigSchema>;

/**
 * Get revalidation time for a specific content type
 * Provides type-safe access with validation
 */
export function getRevalidationTime(type: keyof typeof REVALIDATION_TIMES): number {
  return REVALIDATION_TIMES[type];
}

/**
 * Revalidation configuration with descriptions for documentation
 */
export const REVALIDATION_DESCRIPTIONS = {
  STATIC_CONTENT: 'Static configurations (agents, mcp, rules, commands, hooks)',
  GUIDES: 'Documentation and guides',
  CHANGELOG: 'Changelog and release notes',
  DYNAMIC_CONTENT: 'Dynamic content (trending, jobs, community)',
  USER_CONTENT: 'User-specific content (profiles, bookmarks, libraries)',
  REAL_TIME: 'Real-time analytics and stats',
  HOMEPAGE: 'Homepage with mixed content',
  API_STATIC: 'Static API endpoints',
  SEO_FEEDS: 'Sitemaps and RSS/Atom feeds',
  LLMS_TXT: 'AI training data (llms.txt files)',
} as const;
