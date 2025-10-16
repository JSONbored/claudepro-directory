/**
 * Cache Configuration
 * Centralized cache TTL and HTTP cache-control headers
 *
 * Moved from src/lib/constants.ts for better organization
 * Used across API routes, server components, and caching layers
 *
 * @see src/lib/cache.server.ts - Unified cache infrastructure
 * @see src/app/api - API routes using CACHE_HEADERS
 */

/**
 * Cache Configuration
 * TTL values in seconds and milliseconds for different cache layers
 */
export const CACHE_CONFIG = {
  ttl: {
    content: 60 * 60, // 1 hour (in seconds for API responses)
    api: 60 * 5, // 5 minutes (in seconds for API responses)
    static: 60 * 60 * 24, // 24 hours (in seconds for static content)
  },
  durations: {
    shortTerm: 5 * 60 * 1000, // 5 minutes in milliseconds
    mediumTerm: 30 * 60 * 1000, // 30 minutes in milliseconds
    longTerm: 60 * 60 * 1000, // 1 hour in milliseconds
  },
  keys: {
    content: 'content:',
    api: 'api:',
    related: 'related:',
  },
} as const;

/**
 * Cache Headers
 * Standardized cache-control headers for different content types
 *
 * Usage:
 * ```typescript
 * return new Response(data, {
 *   headers: { 'Cache-Control': CACHE_HEADERS.MEDIUM }
 * });
 * ```
 */
export const CACHE_HEADERS = {
  /** 1 year for immutable assets (fonts, hashed JS/CSS) */
  LONG: 'public, max-age=31536000, immutable',

  /** 1 hour with stale-while-revalidate for content */
  MEDIUM: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',

  /** 1 minute with stale-while-revalidate for API responses */
  SHORT: 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',

  /** No cache-control for streaming/dynamic content */
  STREAMING: 'public, max-age=0, must-revalidate',

  /** Prevent all caching (auth, sensitive data) */
  NO_CACHE: 'no-cache, no-store, must-revalidate',
} as const;
