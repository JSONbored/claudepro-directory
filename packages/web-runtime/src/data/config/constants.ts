/**
 * Centralized Configuration Constants
 *
 * This file centralizes all hardcoded values for better maintainability
 * and consistency across the codebase.
 */

import { SOCIAL_LINKS } from '../../config/social-links.ts';
import { type SocialLinkKey } from '../../config/social-links.ts';

/**
 * Query Limit Constants
 *
 * Default limits for database queries to prevent excessive data fetching.
 * These limits balance performance with functionality needs.
 *
 * For admin/export use cases, use MAX_* constants or pass explicit limits.
 */
export const QUERY_LIMITS = {
  // Content list queries
  content: {
    default: 50, // Default for category pages, search results, etc.
    max: 1000, // Maximum for admin/export scenarios
  },
  // Changelog queries
  changelog: {
    default: 50, // Default for changelog pages, recent entries, etc.
    max: 10_000, // Maximum for admin/export scenarios (e.g., getAllChangelogEntries)
  },
  // Pagination
  pagination: {
    default: 30, // Default when no explicit limit is provided
    max: 100, // Maximum to prevent excessive data fetching in a single request
  },
} as const;

/**
 * Static Generation Limits
 *
 * Limits for pre-rendering static pages at build time.
 * These values balance build performance with SEO coverage.
 */
export const STATIC_GENERATION_LIMITS = {
  /**
   * Maximum changelog entries to pre-render at build time
   * Most recent entries are pre-rendered; older entries are rendered on-demand with Cache Components
   */
  changelog: 20,
  /**
   * Maximum jobs to pre-render at build time
   * Most recent jobs are pre-rendered; older jobs are rendered on-demand with Cache Components
   */
  jobs: 10,
} as const;

export {
  APP_CONFIG,
  EXTERNAL_SERVICES,
  ROUTES,
  SECURITY_CONFIG,
  TIME_CONSTANTS,
} from '@heyclaude/shared-runtime';
export { SOCIAL_LINKS } from '../../config/social-links.ts';

/**
 * Get a social link by key
 * This helper function allows other files to access social links without directly importing SOCIAL_LINKS
 * @param key
 */
export function getSocialLink(key: SocialLinkKey): string | undefined {
  return SOCIAL_LINKS[key];
}
export { DATE_CONFIG } from '../../config/unified-config.ts';
