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
  discord: z.string().url().optional(),
  twitter: z.string().url().optional(),
  email: z.string().email(),
  hiEmail: z.string().email(),
  partnerEmail: z.string().email(),
  supportEmail: z.string().email(),
  securityEmail: z.string().email(),
});

export const SOCIAL_LINKS = socialLinksSchema.parse({
  github: 'https://github.com/shadowbook/claudepro-directory',
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
import { contentCategorySchema } from '@/lib/schemas/shared.schema';

// Create an object with all valid categories
export const CONTENT_CATEGORIES = {
  agents: 'agents',
  mcp: 'mcp',
  rules: 'rules',
  commands: 'commands',
  hooks: 'hooks',
  guides: 'guides',
  jobs: 'jobs',
} as const;

// Main content categories (for GitHub content/ directory)
export const MAIN_CONTENT_CATEGORIES = {
  agents: 'agents',
  mcp: 'mcp',
  rules: 'rules',
  commands: 'commands',
  hooks: 'hooks',
} as const;

// SEO guide categories (for GitHub seo/ directory)
export const SEO_CATEGORIES = {
  'use-cases': 'use-cases',
  tutorials: 'tutorials',
  collections: 'collections',
  categories: 'categories',
  workflows: 'workflows',
  comparisons: 'comparisons',
  troubleshooting: 'troubleshooting',
} as const;

// Static pages that appear in sitemap
export const STATIC_PAGES = {
  jobs: 'jobs',
  community: 'community',
  trending: 'trending',
  submit: 'submit',
  guides: 'guides',
} as const;

// Validate each category exists in the schema
Object.values(CONTENT_CATEGORIES).forEach((category) => {
  contentCategorySchema.parse(category);
});

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
  currentMonth: 'September',
  currentYear: 2025,
  currentDate: '2025-09-26',
  lastReviewed: '2025-09-26',
  claudeModels: {
    sonnet: 'Claude Sonnet 4',
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
  titleTemplate: '%s | Claude Pro Directory',
  defaultDescription:
    'Complete database of Claude AI configurations, agents, MCP servers, hooks, and rules for developers.',
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
 */
export const SECURITY_CONFIG = {
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  },
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
