/**
 * Centralized Configuration Constants
 *
 * This file centralizes all hardcoded values for better maintainability
 * and consistency across the codebase. All configurations use Zod validation
 * for type safety and runtime validation.
 */

import { z } from 'zod';

/**
 * Application Information Schema
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
 * Application Routes - Centralized route paths (SHA-3172)
 * Single source of truth for all internal routes
 *
 * Usage: Replace hardcoded strings like "/submit" with ROUTES.SUBMIT
 */
export const ROUTES = {
  // Core pages
  HOME: '/',
  SUBMIT: '/submit',
  PARTNER: '/partner',
  COMMUNITY: '/community',
  CHANGELOG: '/changelog',
  FEATURED: '/featured',
  TRENDING: '/trending',
  COMPARE: '/compare',
  BOARD: '/board',
  BOARD_NEW: '/board/new',

  // Content categories
  AGENTS: '/agents',
  MCP: '/mcp',
  RULES: '/rules',
  COMMANDS: '/commands',
  HOOKS: '/hooks',
  STATUSLINES: '/statuslines',
  GUIDES: '/guides',
  COLLECTIONS: '/collections',
  JOBS: '/jobs',

  // Tools
  CONFIG_RECOMMENDER: '/tools/config-recommender',

  // Account pages
  ACCOUNT_LIBRARY: '/account/library',
  ACCOUNT_LIBRARY_NEW: '/account/library/new',
  ACCOUNT_SUBMISSIONS: '/account/submissions',
  ACCOUNT_ACTIVITY: '/account/activity',
  ACCOUNT_SETTINGS: '/account/settings',
  ACCOUNT_JOBS: '/account/jobs',
  ACCOUNT_JOBS_NEW: '/account/jobs/new',
  ACCOUNT_COMPANIES: '/account/companies',

  // API/Docs
  API_DOCS: '/api-docs',
  LLMS_TXT: '/llms.txt',
  MANIFEST: '/manifest',

  // Auth
  LOGIN: '/login',
} as const;

/**
 * API Configuration Schema
 */
const apiConfigSchema = z.object({
  baseUrl: z.string().url(),
  endpoints: z.object({
    agents: z.string().startsWith('/api/'),
    mcp: z.string().startsWith('/api/'),
    rules: z.string().startsWith('/api/'),
    commands: z.string().startsWith('/api/'),
    hooks: z.string().startsWith('/api/'),
    allConfigurations: z.string().startsWith('/api/'),
  }),
});

export const API_CONFIG = apiConfigSchema.parse({
  baseUrl: 'https://claudepro.directory/api',
  endpoints: {
    agents: '/api/agents.json',
    mcp: '/api/mcp.json',
    rules: '/api/rules.json',
    commands: '/api/commands.json',
    hooks: '/api/hooks.json',
    allConfigurations: '/api/all-configurations.json',
  },
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
 * Content Categories Schema (leveraging existing schema)
 */
import { contentCategorySchema } from '@/src/lib/schemas/shared.schema';

// CONSOLIDATION: Use complete category list from centralized schema instead of partial list
// This eliminates the type mismatch between constants and actual categories used
export const CONTENT_CATEGORIES = {
  // Core content types (have dedicated directories in /content)
  agents: 'agents',
  mcp: 'mcp',
  rules: 'rules',
  commands: 'commands',
  hooks: 'hooks',
  statuslines: 'statuslines',
  // SEO content types (in /seo directory)
  guides: 'guides',
  tutorials: 'tutorials',
  comparisons: 'comparisons',
  workflows: 'workflows',
  'use-cases': 'use-cases',
  troubleshooting: 'troubleshooting',
  categories: 'categories',
  collections: 'collections',
  // Special types
  jobs: 'jobs',
} as const;

// Validate each category exists in the centralized schema
Object.values(CONTENT_CATEGORIES).forEach((category) => {
  contentCategorySchema.parse(category);
});

// CONSOLIDATION: Export unified main content categories for splitting logic
export const MAIN_CONTENT_CATEGORIES = [
  'hooks',
  'mcp',
  'commands',
  'rules',
  'agents',
  'statuslines',
  'collections',
] as const;

// CONSOLIDATION: Export SEO categories for better organization
export const SEO_CATEGORIES = [
  'tutorials',
  'comparisons',
  'workflows',
  'use-cases',
  'troubleshooting',
] as const;

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
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1280px',
  },
} as const;

/**
 * Date & Version Configuration Schema
 */
const dateConfigSchema = z.object({
  currentMonth: z
    .string()
    .regex(
      /^(January|February|March|April|May|June|July|August|September|October|November|December)$/
    ),
  currentYear: z.number().min(2024).max(2030),
  currentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lastReviewed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  claudeModels: z.object({
    sonnet: z.string(),
    opus: z.string(),
  }),
});

export const DATE_CONFIG = dateConfigSchema.parse({
  currentMonth: 'October',
  currentYear: 2025,
  currentDate: '2025-10-01',
  lastReviewed: '2025-10-01',
  claudeModels: {
    sonnet: 'Claude Sonnet 4.5',
    opus: 'Claude Opus 4.1',
  },
});

// Computed date strings for templates
export const CURRENT_DATE_STRING = `${DATE_CONFIG.currentMonth} ${DATE_CONFIG.currentYear}`;
export const SEO_DATE_STRING = `${DATE_CONFIG.currentMonth.toLowerCase()} ${DATE_CONFIG.currentYear}`;

/**
 * SEO Configuration Schema
 */
const seoConfigSchema = z.object({
  defaultTitle: z.string().min(1).max(60),
  titleTemplate: z.string().includes('%s'),
  defaultDescription: z.string().min(10).max(160),
  keywords: z.array(z.string().min(1)).min(1),
});

export const SEO_CONFIG = seoConfigSchema.parse({
  defaultTitle: 'Claude Pro Directory',
  titleTemplate: '%s - Claude Pro Directory',
  defaultDescription:
    'Open-source directory of 150+ Claude AI configurations. Community-driven collection of MCP servers, automation hooks, custom commands, agents, and rules.',
  keywords: [
    'claude ai',
    'claude pro',
    'mcp servers',
    'claude agents',
    'claude hooks',
    'claude rules',
    'claude commands',
    'ai development',
    'claude directory',
  ],
});

/**
 * Schema.org Structured Data
 */
export const SCHEMA_ORG = {
  organization: {
    '@type': 'Organization',
    name: APP_CONFIG.name,
    url: APP_CONFIG.url,
    description: APP_CONFIG.description,
  },
  website: {
    '@type': 'WebSite',
    name: APP_CONFIG.name,
    url: APP_CONFIG.url,
    description: SEO_CONFIG.defaultDescription,
  },
} as const;

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
 * Security Configuration
 * Inlined to avoid barrel file pattern
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
  allowedOrigins: ['https://claudepro.directory', 'https://www.claudepro.directory'] as const,
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
 * Cache Configuration
 */
export const CACHE_CONFIG = {
  ttl: {
    content: 60 * 60, // 1 hour
    api: 60 * 5, // 5 minutes
    static: 60 * 60 * 24, // 24 hours
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
 */
export const CACHE_HEADERS = {
  LONG: 'public, max-age=31536000, immutable', // 1 year for immutable assets
  MEDIUM: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400', // 1 hour
  SHORT: 'public, max-age=60, s-maxage=60, stale-while-revalidate=300', // 1 minute
  STREAMING: 'public, max-age=0, must-revalidate', // For streaming/dynamic content
  NO_CACHE: 'no-cache, no-store, must-revalidate', // No caching
} as const;

/**
 * Revalidate Times (in seconds)
 * ISR revalidation intervals for Next.js pages
 */
export const REVALIDATE_TIMES = {
  homepage: 3600, // 1 hour
  content: 14400, // 4 hours
  static: 86400, // 24 hours
  guides: 604800, // 1 week
  trending: 3600, // 1 hour
  api: 300, // 5 minutes
} as const;

/**
 * OpenGraph Image Configuration
 * Standard image dimensions for social media sharing
 */
export const OG_IMAGE_SIZE = {
  width: 1200,
  height: 630,
} as const;

/**
 * Search Configuration
 * Settings for search functionality
 */
export const SEARCH_CONFIG = {
  debounceMs: 150, // Debounce delay for search input
  threshold: 0.3, // Fuzzy search threshold (0-1, lower = more strict)
  maxResults: 50, // Maximum search results to display
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
