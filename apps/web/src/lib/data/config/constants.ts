/**
 * Centralized Configuration Constants
 *
 * This file centralizes all hardcoded values for better maintainability
 * and consistency across the codebase. All configurations use Zod validation
 * for type safety and runtime validation.
 */

import {
  APP_CONFIG as SHARED_APP_CONFIG,
  EXTERNAL_SERVICES as SHARED_EXTERNAL_SERVICES,
  ROUTES as SHARED_ROUTES,
  SECURITY_CONFIG as SHARED_SECURITY_CONFIG,
  SOCIAL_LINKS as SHARED_SOCIAL_LINKS,
  TIME_CONSTANTS as SHARED_TIME_CONSTANTS,
} from '@heyclaude/web-runtime';
import { z } from 'zod';

/**
 * Application Information
 */
export const APP_CONFIG = SHARED_APP_CONFIG;
export const SOCIAL_LINKS = SHARED_SOCIAL_LINKS;
export const ROUTES = SHARED_ROUTES;
export const EXTERNAL_SERVICES = SHARED_EXTERNAL_SERVICES;
export const TIME_CONSTANTS = SHARED_TIME_CONSTANTS;

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
    windows: '%APPDATA%\\Claude\\claude_desktop_config.json',
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
export const UI_CONFIG = {
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  animation: {
    duration: 300,
    easing: 'ease-in-out',
  },
} as const;

/**
 * Date & Version Configuration - Database-First
 * Loads from app_settings table with hardcoded fallbacks
 */
export const DATE_CONFIG = {
  currentMonth: 'October',
  currentYear: 2025,
  currentDate: '2025-10-01',
  lastReviewed: '2025-10-01',
  claudeModels: {
    sonnet: 'Claude Sonnet 4.5',
    opus: 'Claude Opus 4.1',
  },
} as const;

/**
 * Analytics Configuration
 */
export const ANALYTICS_CONFIG = {
  umami: {
    websiteId: process.env['NEXT_PUBLIC_UMAMI_WEBSITE_ID'],
    scriptSrc: process.env['NEXT_PUBLIC_UMAMI_SCRIPT_SRC'],
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
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
} as const;

/**
 * Security Configuration
 * Used for trusted hostname validation, security headers, and allowed origins
 */
export const SECURITY_CONFIG = SHARED_SECURITY_CONFIG;

/**
 * Polling Intervals Configuration
 */
export const POLLING_INTERVALS = {
  // Real-time updates
  realtime: 1000, // 1 second
  // Badge notifications
  badges: 30000, // 30 seconds
  // Status checks
  status: {
    health: 60000, // 1 minute
    api: 30000, // 30 seconds
    database: 120000, // 2 minutes
  },
} as const;

/**
 * Timeout Configuration - UI timeouts only
 */
export const TIMEOUTS = {
  // UI interaction timeouts (not migrated to Statsig - still used directly)
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
    default: 15000, // 15 seconds (from border-beam component)
  },
} as const;
