/**
 * Centralized Configuration Constants
 *
 * This file centralizes all hardcoded values for better maintainability
 * and consistency across the codebase. All configurations use Zod validation
 * for type safety and runtime validation.
 */

import { z } from 'zod';

/**
 * Application Information
 */
const appConfigSchema = z.object({
  name: z.string().min(1).max(100),
  domain: z.string().regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
  url: z.string().url(),
  description: z.string().min(10).max(500),
  author: z.string().min(1).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  license: z.enum(['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause']),
});

export const APP_CONFIG = appConfigSchema.parse({
  name: 'Claude Pro Directory',
  domain: 'claudepro.directory',
  url: 'https://claudepro.directory',
  description: 'Complete database of Claude AI configurations',
  author: 'Claude Pro Directory',
  version: '1.0.0',
  license: 'MIT',
});

/**
 * Social & External Links Schema
 */
const socialLinksSchema = z.object({
  github: z.string().url(),
  authorProfile: z.string().url(),
  discord: z.string().url().optional(),
  twitter: z.string().url().optional(),
  email: z.string().email(),
  hiEmail: z.string().email(),
  partnerEmail: z.string().email(),
  supportEmail: z.string().email(),
  securityEmail: z.string().email(),
});

export const SOCIAL_LINKS = socialLinksSchema.parse({
  github: 'https://github.com/JSONbored/claudepro-directory',
  authorProfile: 'https://github.com/JSONbored',
  discord: 'https://discord.gg/Ax3Py4YDrq',
  twitter: 'https://x.com/JSONbored',
  email: 'contact@claudepro.directory',
  hiEmail: 'hi@claudepro.directory',
  partnerEmail: 'partner@claudepro.directory',
  supportEmail: 'support@claudepro.directory',
  securityEmail: 'security@claudepro.directory',
});

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
 * Content Categories - Database-First
 * Use category_configs table as single source of truth (category-config.ts)
 */

// CONSOLIDATION: Export unified main content categories for splitting logic
// **ARCHITECTURAL FIX**: Import from category-config where needed to avoid circular dependency
// MAIN_CONTENT_CATEGORIES moved to category-config.ts as VALID_CATEGORIES

// **ARCHITECTURAL FIX**: Removed unused SEO_CATEGORIES (guide subcategories, not top-level categories)

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

// Hardcoded fallbacks (used at build time and if database unavailable)
const DATE_CONFIG_FALLBACK = {
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
 * Get current date configuration from database
 * Falls back to hardcoded values if database unavailable
 */
export async function getDateConfig() {
  try {
    const { appSettings } = await import('@/src/lib/flags');
    const config = await appSettings();
    return {
      currentMonth: (config['date.current_month'] as string) ?? DATE_CONFIG_FALLBACK.currentMonth,
      currentYear: (config['date.current_year'] as number) ?? DATE_CONFIG_FALLBACK.currentYear,
      currentDate: (config['date.current_date'] as string) ?? DATE_CONFIG_FALLBACK.currentDate,
      lastReviewed: (config['date.last_reviewed'] as string) ?? DATE_CONFIG_FALLBACK.lastReviewed,
      claudeModels: DATE_CONFIG_FALLBACK.claudeModels,
    };
  } catch {
    return DATE_CONFIG_FALLBACK;
  }
}

/**
 * Get formatted date strings for SEO templates
 */
export async function getDateStrings() {
  const config = await getDateConfig();
  return {
    current: `${config.currentMonth} ${config.currentYear}`,
    seo: `${config.currentMonth.toLowerCase()} ${config.currentYear}`,
  };
}

// Export fallback for build-time usage (static generation)
export const DATE_CONFIG = DATE_CONFIG_FALLBACK;

/**
 * Analytics Configuration
 */
export const ANALYTICS_CONFIG = {
  umami: {
    websiteId: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
    scriptSrc: process.env.NEXT_PUBLIC_UMAMI_SCRIPT_SRC,
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
 * Search Configuration - Database-First
 * Loads from app_settings table with hardcoded fallbacks
 */
const SEARCH_CONFIG_FALLBACK = {
  debounceMs: 150,
  threshold: 0.3,
  maxResults: 50,
} as const;

/**
 * Get search configuration from Statsig Dynamic Configs
 * Falls back to hardcoded values if Statsig unavailable
 */
export async function getSearchConfig() {
  try {
    const { searchConfigs } = await import('@/src/lib/flags');
    const config = await searchConfigs();
    return {
      debounceMs: (config['search.debounce_ms'] as number) ?? SEARCH_CONFIG_FALLBACK.debounceMs,
      threshold: (config['search.threshold'] as number) ?? SEARCH_CONFIG_FALLBACK.threshold,
      maxResults: (config['search.max_results'] as number) ?? SEARCH_CONFIG_FALLBACK.maxResults,
    };
  } catch {
    return {
      debounceMs: SEARCH_CONFIG_FALLBACK.debounceMs,
      threshold: SEARCH_CONFIG_FALLBACK.threshold,
      maxResults: SEARCH_CONFIG_FALLBACK.maxResults,
    };
  }
}

// Export fallback for build-time usage (static generation)
export const SEARCH_CONFIG = SEARCH_CONFIG_FALLBACK;

/**
 * Common Acronyms for Text Transformation
 * Used for proper capitalization of technical terms
 */
export const ACRONYMS = [
  'API',
  'AWS',
  'CSS',
  'JSON',
  'SCSS',
  'HTML',
  'XML',
  'HTTP',
  'HTTPS',
  'URL',
  'URI',
  'SQL',
  'NoSQL',
  'REST',
  'GraphQL',
  'JWT',
  'SSH',
  'FTP',
  'SMTP',
  'DNS',
  'CDN',
  'SDK',
  'CLI',
  'IDE',
  'UI',
  'UX',
  'AI',
  'ML',
  'NPM',
  'CI',
  'CD',
  'CI/CD',
  'PDF',
  'CSV',
  'SVG',
  'PNG',
  'JPG',
  'JPEG',
  'GIF',
  'TCP',
  'UDP',
  'IP',
  'VPN',
  'SSL',
  'TLS',
  'OAuth',
  'SAML',
  'LDAP',
  'DB',
  'CRUD',
  'ORM',
  'MVC',
  'MVP',
  'MVVM',
  'SPA',
  'PWA',
  'SEO',
  'CMS',
  'CRM',
  'SaaS',
  'PaaS',
  'IaaS',
  'E2E',
  'QA',
  'TDD',
  'BDD',
  'CORS',
  'CSRF',
  'XSS',
  'MCP',
  'LLM',
  'GPT',
  'SRE',
  'DevOps',
] as const;

/**
 * External Services & CDN URLs
 * Centralized external service URLs for CSP, middleware, and integrations
 * Used in middleware.ts CSP headers, OAuth configs, and API integrations
 */
const externalServicesSchema = z.object({
  // Analytics & Monitoring
  umami: z.object({
    analytics: z.string().url(),
  }),
  vercel: z.object({
    scripts: z.string(),
    toolbar: z.string().url(),
  }),
  betterstack: z.object({
    status: z.string().url(),
  }),

  // OAuth Providers
  github: z.object({
    site: z.string().url(),
    userContent: z.string(),
    api: z.string().url(),
  }),
  google: z.object({
    accounts: z.string().url(),
  }),

  // Backend Services
  supabase: z.object({
    pattern: z.string(),
  }),

  // Main Domain
  app: z.object({
    main: z.string().url(),
    www: z.string().url(),
  }),
});

export const EXTERNAL_SERVICES = externalServicesSchema.parse({
  // Analytics & Monitoring
  umami: {
    analytics: 'https://umami.claudepro.directory',
  },
  vercel: {
    scripts: 'https://*.vercel-scripts.com',
    toolbar: 'https://vercel.live',
  },
  betterstack: {
    status: 'https://status.claudepro.directory',
  },

  // OAuth Providers
  github: {
    site: 'https://github.com',
    userContent: 'https://*.githubusercontent.com',
    api: 'https://api.github.com',
  },
  google: {
    accounts: 'https://accounts.google.com',
  },

  // Backend Services
  supabase: {
    pattern: 'https://*.supabase.co',
  },

  // Main Domain
  app: {
    main: 'https://claudepro.directory',
    www: 'https://www.claudepro.directory',
  },
});

/**
 * Get dynamic SEO description with live content count from database
 * Cached with Next.js fetch cache (24hr revalidation)
 */
export async function getContentDescription(): Promise<string> {
  const { createAnonClient } = await import('@/src/lib/supabase/server-anon');
  const supabase = createAnonClient();

  const { count } = await supabase.from('content').select('*', { count: 'exact', head: true });

  if (!count) {
    throw new Error('Failed to fetch content count for description');
  }

  return `Open-source directory of ${count}+ Claude AI configurations. Community-driven collection of MCP servers, automation hooks, custom commands, agents, and rules.`;
}

/**
 * Route Constants
 * Type-safe route constants for Next.js navigation
 */
export const ROUTES = {
  HOME: '/',
  COMMUNITY: '/community',
  COMPANIES: '/companies',
  LLMS_TXT: '/llms.txt',
  LOGIN: '/login',
  PARTNER: '/partner',
  SUBMIT: '/submit',
  AGENTS: '/agents',
  CHANGELOG: '/changelog',
  COLLECTIONS: '/collections',
  COMMANDS: '/commands',
  GUIDES: '/guides',
  HOOKS: '/hooks',
  JOBS: '/jobs',
  MCP: '/mcp',
  RULES: '/rules',
  SKILLS: '/skills',
  STATUSLINES: '/statuslines',
  ACCOUNT: '/account',
  ACCOUNT_ACTIVITY: '/account/activity',
  ACCOUNT_COMPANIES: '/account/companies',
  ACCOUNT_JOBS: '/account/jobs',
  ACCOUNT_JOBS_NEW: '/account/jobs/new',
  ACCOUNT_LIBRARY: '/account/library',
  ACCOUNT_LIBRARY_NEW: '/account/library/new',
  ACCOUNT_SETTINGS: '/account/settings',
  ACCOUNT_SPONSORSHIPS: '/account/sponsorships',
  ACCOUNT_SUBMISSIONS: '/account/submissions',
  TOOLS_CONFIG_RECOMMENDER: '/tools/config-recommender',
  AUTH_AUTH_CODE_ERROR: '/auth/auth-code-error',
} as const;

/**
 * Security Configuration
 * Used for trusted hostname validation, security headers, and allowed origins
 */
export const SECURITY_CONFIG = {
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  },
  // Trusted hostnames for validation
  trustedHostnames: {
    github: ['github.com', 'www.github.com'] as const,
    umami: ['umami.claudepro.directory'] as const,
    vercel: ['va.vercel-scripts.com'] as const,
  },
  // Allowed origins for postMessage
  allowedOrigins: [
    APP_CONFIG.url,
    'https://www.claudepro.directory',
    'https://dev.claudepro.directory',
  ] as const,
} as const;

/**
 * Time Constants
 * Common time conversions for consistency across the codebase
 */
export const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Service Delays Configuration
 * Standardized delays for API calls, retries, and service interactions
 */
export const SERVICE_DELAYS = {
  // API retry delays
  retry: {
    initial: 1000, // 1 second
    exponential: 2000, // Base for exponential backoff
    maximum: 10000, // 10 seconds max
  },
  // Email service delays
  email: {
    send: 1000, // 1 second between sends
    retry: 2000, // 2 seconds on failure
  },
  // External API delays
  api: {
    github: 1000, // 1 second (respect GitHub rate limits)
    resend: 1000, // 1 second between requests
    external: 500, // 500ms default for external APIs
  },
  // Database operation delays
  database: {
    query: 100, // 100ms between queries
    write: 200, // 200ms between writes
    transaction: 500, // 500ms for transaction retry
  },
} as const;

/**
 * Polling Intervals Configuration
 * Standardized intervals for periodic checks and updates
 * SYNC: Keep in sync with polling_configs in flags.ts (Statsig Dynamic Configs)
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
  // Analytics polling
  analytics: {
    views: 60000, // 1 minute
    stats: 300000, // 5 minutes
  },
} as const;

/**
 * Timeout Configuration
 * Standardized timeouts for various operations
 */
export const TIMEOUTS = {
  // API timeouts
  api: {
    default: 5000, // 5 seconds
    long: 10000, // 10 seconds
    short: 2000, // 2 seconds
  },
  // UI interaction timeouts
  ui: {
    debounce: 150, // Search debounce
    tooltip: 300, // Tooltip delay
    animation: 300, // Animation duration
    transition: 200, // Transition duration
  },
  // Test timeouts
  test: {
    default: 5000, // 5 seconds
    long: 10000, // 10 seconds
    network: 5000, // 5 seconds for network idle
  },
} as const;

/**
 * Animation Durations Configuration
 * Standardized animation durations for consistent UX
 * SYNC: Keep in sync with animation_configs in flags.ts (Statsig Dynamic Configs)
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

/**
 * Get polling intervals from Statsig Dynamic Configs
 * Falls back to hardcoded POLLING_INTERVALS if unavailable
 */
export async function getPollingIntervals() {
  try {
    const { pollingConfigs } = await import('@/src/lib/flags');
    const config = await pollingConfigs();
    return {
      realtime: (config['polling.realtime_ms'] as number) ?? POLLING_INTERVALS.realtime,
      badges: (config['polling.badges_ms'] as number) ?? POLLING_INTERVALS.badges,
      status: {
        health: (config['polling.status.health_ms'] as number) ?? POLLING_INTERVALS.status.health,
        api: (config['polling.status.api_ms'] as number) ?? POLLING_INTERVALS.status.api,
        database:
          (config['polling.status.database_ms'] as number) ?? POLLING_INTERVALS.status.database,
      },
      analytics: {
        views:
          (config['polling.analytics.views_ms'] as number) ?? POLLING_INTERVALS.analytics.views,
        stats:
          (config['polling.analytics.stats_ms'] as number) ?? POLLING_INTERVALS.analytics.stats,
      },
    };
  } catch {
    return POLLING_INTERVALS;
  }
}

/**
 * Get animation durations from Statsig Dynamic Configs
 * Falls back to hardcoded ANIMATION_DURATIONS if unavailable
 */
export async function getAnimationDurations() {
  try {
    const { animationConfigs } = await import('@/src/lib/flags');
    const config = await animationConfigs();
    return {
      ticker: {
        default:
          (config['animation.ticker.default_ms'] as number) ?? ANIMATION_DURATIONS.ticker.default,
        fast: (config['animation.ticker.fast_ms'] as number) ?? ANIMATION_DURATIONS.ticker.fast,
        slow: (config['animation.ticker.slow_ms'] as number) ?? ANIMATION_DURATIONS.ticker.slow,
      },
      stagger: {
        fast: (config['animation.stagger.fast_ms'] as number) ?? ANIMATION_DURATIONS.stagger.fast,
        medium:
          (config['animation.stagger.medium_ms'] as number) ?? ANIMATION_DURATIONS.stagger.medium,
        slow: (config['animation.stagger.slow_ms'] as number) ?? ANIMATION_DURATIONS.stagger.slow,
      },
      beam: {
        default:
          (config['animation.beam.default_ms'] as number) ?? ANIMATION_DURATIONS.beam.default,
      },
    };
  } catch {
    return ANIMATION_DURATIONS;
  }
}

/**
 * Get timeout configurations from Statsig Dynamic Configs
 * Falls back to hardcoded TIMEOUTS if unavailable
 */
export async function getTimeouts() {
  try {
    const { timeoutConfigs } = await import('@/src/lib/flags');
    const config = await timeoutConfigs();
    return {
      api: TIMEOUTS.api, // Keep API timeouts hardcoded (not in Statsig yet)
      ui: {
        debounce: (config['timeout.ui.debounce_ms'] as number) ?? TIMEOUTS.ui.debounce,
        tooltip: (config['timeout.ui.tooltip_ms'] as number) ?? TIMEOUTS.ui.tooltip,
        animation: (config['timeout.ui.animation_ms'] as number) ?? TIMEOUTS.ui.animation,
        transition: (config['timeout.ui.transition_ms'] as number) ?? TIMEOUTS.ui.transition,
      },
      test: TIMEOUTS.test, // Keep test timeouts hardcoded (not in Statsig yet)
    };
  } catch {
    return TIMEOUTS;
  }
}
