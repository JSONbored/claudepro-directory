/**
 * Centralized Configuration Constants
 *
 * This file centralizes all hardcoded values for better maintainability
 * and consistency across the codebase. All configurations use Zod validation
 * for type safety and runtime validation.
 */

import { z } from 'zod';
import { getConfigValue } from '@/src/lib/config/app-settings';

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
  const [currentMonth, currentYear, currentDate, lastReviewed] = await Promise.all([
    getConfigValue<string>('date.current_month', DATE_CONFIG_FALLBACK.currentMonth),
    getConfigValue<number>('date.current_year', DATE_CONFIG_FALLBACK.currentYear),
    getConfigValue<string>('date.current_date', DATE_CONFIG_FALLBACK.currentDate),
    getConfigValue<string>('date.last_reviewed', DATE_CONFIG_FALLBACK.lastReviewed),
  ]);

  return {
    currentMonth,
    currentYear,
    currentDate,
    lastReviewed,
    claudeModels: DATE_CONFIG_FALLBACK.claudeModels, // Models don't change, keep hardcoded
  };
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
 * Get search configuration from database
 * Falls back to hardcoded values if database unavailable
 */
export async function getSearchConfig() {
  const [debounceMs, threshold, maxResults] = await Promise.all([
    getConfigValue<number>('search.debounce_ms', SEARCH_CONFIG_FALLBACK.debounceMs),
    getConfigValue<number>('search.threshold', SEARCH_CONFIG_FALLBACK.threshold),
    getConfigValue<number>('search.max_results', SEARCH_CONFIG_FALLBACK.maxResults),
  ]);

  return {
    debounceMs,
    threshold,
    maxResults,
  };
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
