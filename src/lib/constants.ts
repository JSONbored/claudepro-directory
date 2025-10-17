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
    skills: z.string().startsWith('/api/'),
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
    skills: '/api/skills.json',
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
 * Content Categories
 * **ARCHITECTURAL FIX**: Removed CONTENT_CATEGORIES and SEO_CATEGORIES constants (outdated)
 * Use UNIFIED_CATEGORY_REGISTRY from category-config.ts as single source of truth instead
 */

// CONSOLIDATION: Export unified main content categories for splitting logic
// **ARCHITECTURAL FIX**: Added guides, jobs, changelog to match UNIFIED_CATEGORY_REGISTRY
export const MAIN_CONTENT_CATEGORIES = [
  'hooks',
  'mcp',
  'commands',
  'rules',
  'agents',
  'statuslines',
  'collections',
  'skills',
  'guides',
  'jobs',
  'changelog',
] as const;

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
 * Search Configuration
 * Settings for search functionality
 */
export const SEARCH_CONFIG = {
  debounceMs: 150, // Debounce delay for search input
  threshold: 0.3, // Fuzzy search threshold (0-1, lower = more strict)
  maxResults: 50, // Maximum search results to display
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
