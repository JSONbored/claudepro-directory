/**
 * Cache Key Generator
 *
 * Centralized cache key generation for consistent caching across the codebase
 */

import type { ContentCategory } from '@/lib/schemas/shared.schema';

/**
 * Cache key prefixes for different data types
 */
const CACHE_PREFIXES = {
  CONTENT: 'content',
  RELATED: 'related',
  TRENDING: 'trending',
  SEARCH: 'search',
  API: 'api',
  USER: 'user',
  SESSION: 'session',
} as const;

/**
 * Cache key separator
 */
const SEPARATOR = ':';

/**
 * Generate a cache key from parts
 */
function generateKey(...parts: (string | number)[]): string {
  return parts.filter(Boolean).join(SEPARATOR);
}

/**
 * Centralized cache key generators
 */
export const cacheKeys = {
  /**
   * Content-related cache keys
   */
  content: {
    /**
     * Key for a specific content item
     * @example "content:agents:my-agent-slug"
     */
    item: (category: ContentCategory, slug: string) =>
      generateKey(CACHE_PREFIXES.CONTENT, category, slug),

    /**
     * Key for all content in a category
     * @example "content:agents:all"
     */
    category: (category: ContentCategory) => generateKey(CACHE_PREFIXES.CONTENT, category, 'all'),

    /**
     * Key for content list with filters
     * @example "content:agents:list:popular"
     */
    list: (category: ContentCategory, filter?: string) =>
      generateKey(CACHE_PREFIXES.CONTENT, category, 'list', filter || 'default'),
  },

  /**
   * Related content cache keys
   */
  related: {
    /**
     * Key for related content for a specific item
     * @example "related:agents:my-agent-slug"
     */
    item: (category: ContentCategory, slug: string) =>
      generateKey(CACHE_PREFIXES.RELATED, category, slug),

    /**
     * Key for related content index
     * @example "related:index"
     */
    index: () => generateKey(CACHE_PREFIXES.RELATED, 'index'),
  },

  /**
   * Trending content cache keys
   */
  trending: {
    /**
     * Key for trending content
     * @example "trending:all"
     */
    all: () => generateKey(CACHE_PREFIXES.TRENDING, 'all'),

    /**
     * Key for trending in a category
     * @example "trending:agents"
     */
    category: (category: ContentCategory) => generateKey(CACHE_PREFIXES.TRENDING, category),

    /**
     * Key for trending guides
     * @example "trending:guides"
     */
    guides: () => generateKey(CACHE_PREFIXES.TRENDING, 'guides'),
  },

  /**
   * Search cache keys
   */
  search: {
    /**
     * Key for search query results
     * @example "search:query:my-search-term"
     */
    query: (query: string) => generateKey(CACHE_PREFIXES.SEARCH, 'query', query.toLowerCase()),

    /**
     * Key for search index
     * @example "search:index"
     */
    index: () => generateKey(CACHE_PREFIXES.SEARCH, 'index'),
  },

  /**
   * API response cache keys
   */
  api: {
    /**
     * Key for API endpoint response
     * @example "api:agents.json"
     */
    endpoint: (endpoint: string) => generateKey(CACHE_PREFIXES.API, endpoint),

    /**
     * Key for all configurations
     * @example "api:all-configurations"
     */
    allConfigurations: () => generateKey(CACHE_PREFIXES.API, 'all-configurations'),
  },

  /**
   * User-specific cache keys
   */
  user: {
    /**
     * Key for user preferences
     * @example "user:preferences:user-123"
     */
    preferences: (userId: string) => generateKey(CACHE_PREFIXES.USER, 'preferences', userId),

    /**
     * Key for user favorites
     * @example "user:favorites:user-123"
     */
    favorites: (userId: string) => generateKey(CACHE_PREFIXES.USER, 'favorites', userId),
  },

  /**
   * Session cache keys
   */
  session: {
    /**
     * Key for session data
     * @example "session:session-abc123"
     */
    data: (sessionId: string) => generateKey(CACHE_PREFIXES.SESSION, sessionId),
  },
} as const;

/**
 * Type-safe cache key validator
 * Validates that a cache key follows the expected format
 */
export function isValidCacheKey(key: string): boolean {
  const validPrefixes = Object.values(CACHE_PREFIXES);
  const prefix = key.split(SEPARATOR)[0];
  return validPrefixes.includes(prefix as (typeof validPrefixes)[number]);
}

/**
 * Extract information from a cache key
 */
export function parseCacheKey(key: string): { prefix: string; parts: string[] } | null {
  if (!isValidCacheKey(key)) {
    return null;
  }

  const parts = key.split(SEPARATOR);
  const [prefix, ...rest] = parts;

  return {
    prefix: prefix || '',
    parts: rest,
  };
}
