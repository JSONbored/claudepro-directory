/**
 * Centralized Configuration Constants
 *
 * This file centralizes all hardcoded values for better maintainability
 * and consistency across the codebase. All configurations use Zod validation
 * for type safety and runtime validation.
 */



import { env } from '@heyclaude/shared-runtime/schemas/env';
import { z } from 'zod';

import { GENERATED_CONFIG } from '../../config/app-config.ts';
import { SOCIAL_LINKS } from '../../config/social-links.ts';
import  { type SocialLinkKey } from '../../config/social-links.ts';

/**
 * Application Information
 */






/**
 * Claude Configuration Schema
 */
const claudeConfigSchema = z.object({
  desktop: z.object({
    macos: z.string().min(1),
    windows: z.string().min(1),
  }),
  code: z.object({
    command: z.string().min(1),
  }),
});

export const CLAUDE_CONFIG = claudeConfigSchema.parse({
  desktop: {
    macos: '~/Library/Application Support/Claude/claude_desktop_config.json',
    windows: String.raw`%APPDATA%\Claude\claude_desktop_config.json`,
  },
  code: {
    command: 'claude mcp add',
  },
});

/**
 * Content Directory Paths Schema
 * Centralized content paths for consistency and maintainability
 */
const contentPathsSchema = z.object({
  // JSON content types (existing structure)
  agents: z.string().startsWith('content/'),
  mcp: z.string().startsWith('content/'),
  rules: z.string().startsWith('content/'),
  commands: z.string().startsWith('content/'),
  hooks: z.string().startsWith('content/'),
  statuslines: z.string().startsWith('content/'),
  collections: z.string().startsWith('content/'),
  skills: z.string().startsWith('content/'),

  // MDX guide content types (new structure)
  guides: z.string().startsWith('content/'),
  tutorials: z.string().startsWith('content/guides/'),
  comparisons: z.string().startsWith('content/guides/'),
  workflows: z.string().startsWith('content/guides/'),
  'use-cases': z.string().startsWith('content/guides/'),
  troubleshooting: z.string().startsWith('content/guides/'),
  categories: z.string().startsWith('content/guides/'),
});

export const CONTENT_PATHS = contentPathsSchema.parse({
  // JSON content (existing structure)
  agents: 'content/agents',
  mcp: 'content/mcp',
  rules: 'content/rules',
  commands: 'content/commands',
  hooks: 'content/hooks',
  statuslines: 'content/statuslines',
  collections: 'content/collections',
  skills: 'content/skills',

  // MDX guide content (new structure)
  guides: 'content/guides',
  tutorials: 'content/guides/tutorials',
  comparisons: 'content/guides/comparisons',
  workflows: 'content/guides/workflows',
  'use-cases': 'content/guides/use-cases',
  troubleshooting: 'content/guides/troubleshooting',
  categories: 'content/guides/categories',
});

/**
 * Guide Category Mappings
 * Maps guide types to their filesystem paths for easy reference
 */
export const GUIDE_CATEGORIES = {
  tutorials: CONTENT_PATHS.tutorials,
  comparisons: CONTENT_PATHS.comparisons,
  workflows: CONTENT_PATHS.workflows,
  'use-cases': CONTENT_PATHS['use-cases'],
  troubleshooting: CONTENT_PATHS.troubleshooting,
  categories: CONTENT_PATHS.categories,
} as const;

/**
 * UI Constants
 * Note: Breakpoints are in ui-constants.ts for consistency
 */
export const UI_CONFIG = GENERATED_CONFIG.ui_config;

/**
 * Date & Version Configuration - Database-First
 * Loads from app_settings table with hardcoded fallbacks
 */
export const DATE_CONFIG = GENERATED_CONFIG.date_config;

/**
 * Analytics Configuration
 */
export const ANALYTICS_CONFIG = {
  umami: {
    websiteId: env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? undefined,
    scriptSrc: env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ?? undefined,
  },
} as const;

/**
 * Development Configuration
 */
export const DEV_CONFIG = {
  ports: {
    dev: 3000,
    preview: 3001,
    testing: 3002,
  },
  logLevel: env.NODE_ENV === 'development' ? ('debug' as const) : ('info' as const),
} as const;

/**
 * Security Configuration
 * Used for trusted hostname validation, security headers, and allowed origins
 */


/**
 * Polling Intervals Configuration
 */
export const POLLING_INTERVALS = {
  // Real-time updates
  realtime: 1000, // 1 second
  // Badge notifications
  badges: 30_000, // 30 seconds
  // Status checks
  status: {
    health: 60_000, // 1 minute
    api: 30_000, // 30 seconds
    database: 120_000, // 2 minutes
  },
} as const;

/**
 * Timeout Configuration - UI timeouts only
 */
export const TIMEOUTS = {
  // UI interaction timeouts (used directly, not via config accessors)
  ui: {
    debounce: 150, // Search debounce
    tooltip: 300, // Tooltip delay
    animation: 300, // Animation duration
    transition: 200, // Transition duration
  },
} as const;

/**
 * Animation Durations Configuration
 */
export const ANIMATION_DURATIONS = {
  // Number ticker animations
  ticker: {
    default: 1500, // 1.5 seconds
    fast: 1000, // 1 second
    slow: 2000, // 2 seconds
  },
  // Stagger delays for sequential animations
  stagger: {
    fast: 100, // 100ms between items
    medium: 200, // 200ms between items
    slow: 300, // 300ms between items
  },
  // Border beam animations
  beam: {
    default: 15_000, // 15 seconds (from border-beam component)
  },
} as const;

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

export {APP_CONFIG, EXTERNAL_SERVICES, ROUTES, SECURITY_CONFIG, TIME_CONSTANTS} from '@heyclaude/shared-runtime';
export {SOCIAL_LINKS} from '../../config/social-links.ts';

/**
 * Get a social link by key
 * This helper function allows other files to access social links without directly importing SOCIAL_LINKS
 */
export function getSocialLink(key: SocialLinkKey): string | undefined {
  return SOCIAL_LINKS[key];
}