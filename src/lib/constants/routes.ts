/**
 * Application Routes Configuration
 * Centralized route paths for type-safe navigation (SHA-3172)
 *
 * Single source of truth for all internal routes
 * Moved from src/lib/constants.ts for better organization
 *
 * Usage: Replace hardcoded strings like "/submit" with ROUTES.SUBMIT
 *
 * @example
 * ```typescript
 * import { ROUTES } from '@/src/lib/constants/routes';
 *
 * // Type-safe navigation
 * router.push(ROUTES.SUBMIT);
 *
 * // Type-safe links
 * <Link href={ROUTES.ACCOUNT_SETTINGS}>Settings</Link>
 * ```
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
  SKILLS: '/skills',
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
